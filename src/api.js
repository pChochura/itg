require('dotenv').config();
const f = require('node-fetch');
const sh = require('shelljs');

Object.prototype.fromPath = function (...path) {
  return path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), this);
};

const getAuthHeaders = () => {
  return {
    Authorization: `bearer ${process.env.TOKEN}`,
  };
};

const mutation = async (mutation) => {
  return query(mutation, true);
};

const query = async (query, isMutation) => {
  const res = await f(process.env.API_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: `{ "query": "${isMutation ? 'mutation' : ''} { ${query
      .replace(/\n| +/g, ' ')
      .replace(/"/g, '\\"')} }" }`,
  });
  return await res.json();
};

const queryRepo = async (repoQuery) => {
  const repoName = sh
    .exec('basename $(git remote get-url origin) .git')
    .trimEndline();
  const user = await methods.getUser();
  return query(
    `repository(name: "${repoName}", owner: "${user.login}") { ${repoQuery} }`,
  );
};

const methods = {
  getRepo: async () => {
    const repo = await queryRepo(`id name url`);
    return repo.fromPath('data', 'repository');
  },

  getUser: async () => {
    const user = await query(`viewer { id login }`);
    return user.fromPath('data', 'viewer');
  },

  getIssue: async (issueNumber, withLabels) => {
    let issue = await queryRepo(
      `issue(number: ${issueNumber}) { id number title ${
        withLabels ? 'labels(first: 10) { nodes { name id } }' : ''
      } }`,
    );
    issue = issue.fromPath('data', 'repository', 'issue');
    if (withLabels) {
      issue.labels = issue.labels.nodes.map((label) => ({
        name: label.name,
        id: label.id,
      }));
    }
    return issue;
  },

  getPullRequest: async (branch) => {
    const pr = await queryRepo(
      `pullRequests(headRefName: "${branch}", last: 1, states: OPEN) { nodes { number id url isDraft } }`,
    );
    return pr.fromPath('data', 'repository', 'pullRequests', 'nodes', '0');
  },

  getLabels: async () => {
    const labels = await queryRepo(`labels(first: 50) { nodes { name } }`);
    return labels
      .fromPath('data', 'repository', 'labels', 'nodes')
      .map((l) => l.name);
  },

  getLabel: async (name) => {
    const label = await queryRepo(`label(name: "${name}") { id name }`);
    return label.fromPath('data', 'repository', 'label');
  },

  createIssue: async (title, labels, assignee) => {
    const repo = await methods.getRepo();
    const labelsIds = [];
    await labels.split(',').asyncForEach(async (label) => {
      labelsIds.push((await methods.getLabel(label)).id);
    });
    const issue = await mutation(`createIssue(input: {
      repositoryId: "${repo.id}", title: "${title}"${
      assignee ? `, assigneeIds: "${assignee}"` : ''
    }, labelIds: "${labelsIds.join(',')}"
    }) { issue { id url number } }`);
    return issue.fromPath('data', 'createIssue', 'issue');
  },

  updateIssue: async (id, body, assignee) => {
    const issue = await mutation(`updateIssue(input: {
      id: "${id}"${body ? `, body: "${body}"` : ''}${
      assignee ? `, assigneeIds: "${assignee}"` : ''
    }
    }) { issue { id url number } }`);
    return issue.fromPath('data', 'updateIssue', 'issue');
  },

  createPullRequest: async (issue, options) => {
    const repo = await methods.getRepo();
    const pr = await mutation(`createPullRequest(input: {
      repositoryId: "${repo.id}", baseRefName: "${options.to}", headRefName: "${
      options.from
    }",
      title: "${issue.title}", draft: ${
      options.draft === true
    }, body: "Close #${issue.number}"
    }) { pullRequest { id number url } }`);
    return pr.fromPath('data', 'createPullRequest', 'pullRequest');
  },

  updatePullRequest: async (id, labels) => {
    const labelsIds = [];
    await labels.asyncForEach(async (label) => {
      labelsIds.push((await methods.getLabel(label.name)).id);
    });
    const pr = await mutation(`updatePullRequest(input: {
      pullRequestId: "${id}", labelIds: "${labelsIds.join(',')}"
    }) { pullRequest { id number url } }`);
    return pr.fromPath('data', 'updatePullRequest', 'pullRequest');
  },

  markPRAsReady: async (id) => {
    const pr = await mutation(`markPullRequestReadyForReview(input: {
      pullRequestId: "${id}"
    }) { pullRequest { id number url } }`);
    return pr.fromPath('data', 'markPullRequestReadyForReview', 'pullRequest');
  },
};

module.exports = methods;

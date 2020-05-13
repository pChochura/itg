require('dotenv').config();
const f = require('node-fetch');
const sh = require('shelljs');
const read = require('read');
const cache = require('./cache');

Object.prototype.fromPath = function (...path) {
  return path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), this);
};

const askForToken = async () => {
  return new Promise((resolve, _) => {
    read({ prompt: 'Username: ', silent: false }, (error, username) => {
      if (error) {
        sh.echo('You have to login into your Github account to continue');
        sh.exit(1);
      }

      read({ prompt: 'Password: ', silent: true }, (error, password) => {
        if (error) {
          sh.echo('Your password is never stored');
          sh.exit(1);
        }

        resolve({
          username,
          password,
        });
      });
    });
  });
};

const auth = async () => {
  const { username, password } = await askForToken();

  const res = await f(`${process.env.API_URL}/authorizations`, {
    method: 'POST',
    headers: {
      Authorization:
        'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
    body: JSON.stringify({
      scopes: ['repo', 'user'],
      note: 'Token for "itg"',
    }),
  });
  return res.json();
};

const getAuthHeaders = async () => {
  let token = process.env.TOKEN || (await cache.get('TOKEN'));

  // Ask for creating authorization token if it does not exist
  if (!token) {
    token = (await auth()).token;
    await cache.set('TOKEN', token);
  }

  return {
    Authorization: `bearer ${token}`,
  };
};

const mutation = async (mutation) => {
  return query(mutation, true);
};

const query = async (query, isMutation) => {
  const res = await f(`${process.env.API_URL}/graphql`, {
    method: 'POST',
    headers: await getAuthHeaders(),
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
    if (await cache.has('REPO')) {
      return await cache.get('REPO');
    }

    let repo = await queryRepo(`id name url`);
    repo = repo.fromPath('data', 'repository');

    return cache.set('REPO', repo);
  },

  getUser: async () => {
    if (await cache.has('USER')) {
      return await cache.get('USER');
    }

    let user = await query(`viewer { id login }`);
    user = user.fromPath('data', 'viewer');

    return cache.set('USER', user);
  },

  getIssue: async (issueNumber, withLabels) => {
    if (!withLabels && (await cache.has(`ISSUE_${issueNumber}`))) {
      return cache.get(`ISSUE_${issueNumber}`);
    }

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
    } else {
      await cache.set(`ISSUE_${issueNumber}`, issue);
    }

    return issue;
  },

  getPullRequest: async (branch) => {
    if (await cache.has(`PR_${branch}`)) {
      return cache.get(`PR_${branch}`);
    }

    let pr = await queryRepo(
      `pullRequests(headRefName: "${branch}", last: 1, states: OPEN) { nodes { number id url isDraft } }`,
    );
    pr = pr.fromPath('data', 'repository', 'pullRequests', 'nodes', '0');

    return cache.set(`PR_${branch}`, pr);
  },

  getLabels: async () => {
    if (await cache.has('LABELS')) {
      return await cache.get('LABELS');
    }

    let labels = await queryRepo(`labels(first: 50) { nodes { id name } }`);
    labels = labels.fromPath('data', 'repository', 'labels', 'nodes');

    return cache.set('LABELS', labels);
  },

  getLabel: async (name) => {
    if (await cache.has('LABELS')) {
      const labels = await cache.get('LABELS');
      const label = labels.find((label) => label.name === name);

      if (label) {
        return label;
      }
    }

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

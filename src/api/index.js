const graphql = require('./graphql');
const sh = require('../shell');
const cache = require('../cache');

const queryRepo = async (repoQuery) => {
	const repoUrl = sh.exec('git remote get-url origin').trimEndline();
	const repo = /.*github.com[:\/](.*)\/(.*).git/gi.exec(repoUrl);
	const repoOwner = repo[1];
	const repoName = repo[2];
	return graphql.query(
		`repository(name: "${repoName}", owner: "${repoOwner}") { ${repoQuery} }`,
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

		let user = await graphql.query(`viewer { id login }`);
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
			let downloadedLabel = await methods.getLabel(label);
			if (!downloadedLabel) {
				sh.echo("Please provide existing label via '--custom' option");
				sh.exit(1);
			}
			labelsIds.push(downloadedLabel.id);
		});
		const issue = await graphql.mutation(`createIssue(input: {
      repositoryId: "${repo.id}", title: "${title}"${
			assignee ? `, assigneeIds: "${assignee}"` : ''
		}, labelIds: "${labelsIds.join(',')}"
    }) { issue { id url number } }`);
		return issue.fromPath('data', 'createIssue', 'issue');
	},

	updateIssue: async (id, body, assignee) => {
		const issue = await graphql.mutation(`updateIssue(input: {
      id: "${id}"${body ? `, body: "${body}"` : ''}${
			assignee ? `, assigneeIds: "${assignee}"` : ''
		}, state: OPEN
    }) { issue { id url number } }`);
		return issue.fromPath('data', 'updateIssue', 'issue');
	},

	closeIssue: async (id, reason) => {
		await graphql.mutation(
			`closeIssue(input: { issueId: "${id}" }) { issue { id url number } }`,
		);

		return methods.commentIssue(id, reason);
	},

	commentIssue: async (id, comment) => {
		const issue = await graphql.mutation(
			`addComment(input: { subjectId: "${id}", body: "${comment}" }) { commentEdge { node { issue { id url number } } } }`,
		);
		return issue.fromPath('data', 'closeIssue', 'issue');
	},

	createPullRequest: async (issue, options) => {
		const repo = await methods.getRepo();
		const pr = await graphql.mutation(`createPullRequest(input: {
      repositoryId: "${repo.id}", baseRefName: "${options.to}", headRefName: "${
			options.from
		}",
      title: "${issue.title}", draft: ${
			options.draft === true
		}, body: "Close #${issue.number}"
    }) { pullRequest { id number url } }`);
		return pr.fromPath('data', 'createPullRequest', 'pullRequest');
	},

	updatePullRequest: async (id, labels, assignee) => {
		const labelsIds = [];
		await labels.asyncForEach(async (label) => {
			labelsIds.push((await methods.getLabel(label.name)).id);
		});
		const pr = await graphql.mutation(`updatePullRequest(input: {
	  pullRequestId: "${id}", labelIds: "${labelsIds.join(',')}",
	  assigneeIds: "${assignee}"
    }) { pullRequest { id number url } }`);
		return pr.fromPath('data', 'updatePullRequest', 'pullRequest');
	},

	markPRAsReady: async (id) => {
		const pr = await graphql.mutation(`markPullRequestReadyForReview(input: {
      pullRequestId: "${id}"
    }) { pullRequest { id number url } }`);
		return pr.fromPath('data', 'markPullRequestReadyForReview', 'pullRequest');
	},
};

module.exports = methods;

require('./extensions');
const api = require('./api/api');
const sh = require('./shell');
const utils = require('./utils');
const browser = require('open');

const showHelp = () => {
	sh.echo(
		`
		Creates a Pull Request from the current branch to the master branch.
		Use this script instead of creating PR through the browser
		because this way the PR will be marked with the correct label and appropriate issue will be linked.

		Usage:  itg pull-request|pr [-h] [-d] [-m] [-p] [-s] [--to <issue>]
		        itg pull-request|pr open [<issue>]
		        itg pull-request|pr ready [<issue>]
		Options:
		  -h, --help, -help, h, help, ?  displays this help message
		  -d, --draft                    marks newly created Pull Request as a draft
		  -m, --master                   switches you to the master branch after creating a Pull Request
		  -p, --push                     push changes before creating a Pull Request
		  -s, --show                     opens a website with PR after creating one
		  --to <issue number>            allows to choose a branch to be merged to by selecting an issue
		  open [<issue number>]          opens a webiste with PR associated with the current (or selected) issue
		  ready [<issue number>]         marks existing pull request associated with the current (or selected) issue as ready for review
		`.trimIndent(),
	);
	sh.exit(0);
};

const parseArgs = async (args) => {
	const options = {};
	for (let i = 0; i < args.length; i++) {
		if (['-h', '--help', '-help', 'h', 'help', '?'].indexOf(args[i]) !== -1) {
			showHelp();
		} else if (['-d', '--draft'].indexOf(args[i]) !== -1) {
			options.draft = true;
		} else if (['-m', '--master'].indexOf(args[i]) !== -1) {
			options.master = true;
		} else if (['-p', '--push'].indexOf(args[i]) !== -1) {
			options.push = true;
		} else if (['-s', '--show'].indexOf(args[i]) !== -1) {
			options.show = true;
		} else if (['--to'].indexOf(args[i]) !== -1) {
			options.to = args[i + 1];

			// Skip checking 'to' parameter
			i++;
		} else if (['open'].indexOf(args[i]) !== -1) {
			options.open = args[i + 1];

			// Skip checking 'open' parameter
			i++;
		} else if (['ready'].indexOf(args[i]) !== -1) {
			options.ready = args[i + 1];

			// Skip checking 'ready' parameter
			i++;
		}
	}

	return validateOptions(options);
};

const validateOptions = async (tempOptions) => {
	const options = {};

	// Validate 'open'
	if (tempOptions.hasOwnProperty('open')) {
		// User typed more options than just "open [<issue>]"
		if (Object.keys(tempOptions).length > 1) {
			sh.echo('You cannot use option "open" with other options');
			sh.exit(1);
		}

		options.open = await validateOpen(tempOptions.open);

		// Return now to avoid checking other options
		return options;
	}

	// Validate 'ready'
	if (tempOptions.hasOwnProperty('ready')) {
		// User typed more options than just "ready [<issue>]"
		if (Object.keys(tempOptions).length > 1) {
			sh.echo('You cannot use option "ready" with other options');
			sh.exit(1);
		}

		options.ready = await validateReady(tempOptions.ready);

		// Return now to avoid checking other options
		return options;
	}

	// Validate 'draft'
	if (tempOptions.draft) {
		options.draft = true;
	}

	// Validate 'master'
	if (tempOptions.master) {
		options.master = true;
	}

	// Validate 'push'
	if (tempOptions.push) {
		options.push = true;
	}

	// Validate 'show'
	if (tempOptions.show) {
		options.show = true;
	}

	// Validate 'to'
	if (tempOptions.hasOwnProperty('to')) {
		if (!tempOptions.to) {
			sh.echo('You have to pass an issue number to "--to" option');
			sh.exit(1);
		}

		options.to = await validateTo(tempOptions.to);
	}

	return options;
};

const validateTo = async (to) => {
	if (!utils.validateNumber(to)) {
		sh.echo('Parameter passed to "--to" have to be an issue number');
		sh.exit(1);
	}

	return utils.getBranchNameFromNumber(to);
};

const validateReady = async (ready) => {
	// If user didn't pass an issue number use current
	if (!ready) {
		return {
			number: utils.getCurrentIssueNumber(),
			branch: utils.getCurrentBranchName(),
		};
	}

	if (!utils.validateNumber(ready)) {
		sh.echo('Parameter passed to "ready" have to be an issue number');
		sh.exit(1);
	}

	return {
		number: ready,
		branch: await utils.getBranchNameFromNumber(ready),
	};
};

const validateOpen = async (open) => {
	// If user didn't pass an issue number use current
	if (!open) {
		return utils.getCurrentBranchName();
	}

	if (!utils.validateNumber(open)) {
		sh.echo('Parameter passed to "open" have to be an issue number');
		sh.exit(1);
	}

	return utils.getBranchNameFromNumber(open);
};

const runCommands = async (options) => {
	if (options.open) {
		await runOpen(options.open);
		sh.exit(0);
	}

	if (options.ready) {
		await runReady(options.ready);
		sh.exit(0);
	}

	const issueNumber = utils.getCurrentIssueNumber();
	const issue = await api.getIssue(issueNumber, true);

	sh.echo(
		`Creating Pull Request for issue #${issueNumber} "${
			issue.title
		}", labeled: "${issue.labels.map((label) => label.name).join(', ')}"`
			.replace(/\n/, ' ')
			.replace(/(  )+/g, ''),
	);

	if (options.draft) {
		sh.echo('Marking Pull Request as a draft');
	}

	if (options.push) {
		sh.echo('Pushing changes before creating Pull Request');
		sh.exec('git push');
	}

	if (options.to) {
		sh.echo(`Setting base branch to "${options.to}"`);
	} else {
		options.to = 'master';
	}

	options.from = utils.getCurrentBranchName();

	// Creating Pull Request
	let pullRequest = await api.createPullRequest(issue, options);
	if (!pullRequest) {
		sh.echo(
			`We ecountered some problems with creating PR for issue #${issueNumber} "${issue.title}"`,
		);
		sh.exit(1);
	}

	// Setting labels to the PR
	pullRequest = await api.updatePullRequest(pullRequest.id, issue.labels);
	if (!pullRequest) {
		sh.echo(
			`We ecountered some problems with setting labels for this Pull Request`,
		);
		sh.exit(1);
	}

	// Opening webiste if option '--show' was set
	if (options.show) {
		sh.echo('Opening a website with this PR');
		await browser(pullRequest.url);
	}

	// Switching to 'master' branch if option '--master' was set
	if (options.master) {
		sh.echo('Checking out "master" branch');
		sh.exec('git checkout master');

		sh.echo('Pulling changes from "origin master" branch');
		sh.exec('git pull origin master');
	}

	sh.exit(0);
};

const runReady = async (ready) => {
	sh.echo(
		`Marking a PR associated with branch "${ready.branch}" as ready for review`,
	);

	let pullRequest = await api.getPullRequest(ready.branch);

	if (!pullRequest) {
		sh.echo('We ecountered some problems with downloading a PR');
		sh.exit(1);
	}

	if (!pullRequest.isDraft) {
		sh.echo('It looks like the Pull Request is already ready for review');
		sh.exit(1);
	}

	pullRequest = await api.markPRAsReady(pullRequest.id);

	if (!pullRequest) {
		sh.echo(
			'We ecountered some problems with marking this PR as ready for review',
		);
		sh.exit(1);
	}

	sh.echo(
		`Pull Request associated with this branch is now ready for review (#${pullRequest.id})`,
	);
	sh.exit(0);
};

const runOpen = async (open) => {
	sh.echo(`Opening a website with PR associated with branch "${open}"`);

	const pullRequest = await api.getPullRequest(open);

	if (!pullRequest) {
		sh.echo(`There are no Pull Requests associated with this branch`);
		sh.exit(1);
	}

	await browser(pullRequest.url);
	sh.exit(0);
};

const pr = async (args) => {
	await runCommands(await parseArgs(args));
};

module.exports = pr;

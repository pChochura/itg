const utils = require('./utils');
const sh = require('shelljs');

sh.config.silent = true;

const showHelp = () => {
  sh.echo(
    `
    Creates a Pull Request from the current branch to the master branch.
    Use this script instead of creating PR through the browser
    because this way the PR will be marked with the correct label and appropriate issue will be linked.

    Usage:  ${process.env.LIB_NAME} pull-request|pr [-h] [-d] [-m] [-p] [--to <issue>]
          \t${process.env.LIB_NAME} pull-request|pr open [<issue>]
          \t${process.env.LIB_NAME} pull-request|pr ready [<issue>]
    Options:
    \t-h, --help, -help, h, help, ?   - displays this help message
    \t-d, --draft                     - marks newly created Pull Request as a draft
    \t-m, --master                    - switches you to the master branch after creating a Pull Request
    \t-p, --push                      - push changes before creating a Pull Request
    \t--to <issue number>             - allows to choose a branch to be merged to by selecting an issue
    \topen [<issue number>]           - opens a webiste with PR associated with the current (or selected) issue
    \tready [<issue number>]          - marks existing pull request associated with the current (or selected) issue as ready for review
    `.trimIndent(),
  );
  sh.exit(0);
};

const parseArgs = (args) => {
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

const validateOptions = (tempOptions) => {
  const options = {};

  // Validate 'open'
  if (tempOptions.hasOwnProperty('open')) {
    // User typed more options than just "open [<issue>]"
    if (Object.keys(tempOptions).length > 1) {
      sh.echo('You cannot use option "open" with other options');
      sh.exit(1);
    }

    options.open = validateOpen(tempOptions.open);

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

    options.ready = validateReady(tempOptions.ready);

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

  // Validate 'to'
  if (tempOptions.hasOwnProperty('to')) {
    if (!tempOptions.to) {
      sh.echo('You have to pass an issue number to "--to" option');
      sh.exit(1);
    }

    options.to = validateTo(tempOptions.to);
  }

  return options;
};

const validateTo = (to) => {
  if (!utils.validateNumber(to)) {
    sh.echo('Parameter passed to "--to" have to be an issue number');
    sh.exit(1);
  }

  return utils.getBranchNameFromNumber(to);
};

const validateReady = (ready) => {
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
    branch: utils.getBranchNameFromNumber(ready),
  };
};

const validateOpen = (open) => {
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

const runCommands = (options) => {
  if (options.open) {
    runOpen(options.open);
  }

  if (options.ready) {
    runReady(options.ready);
  }

  const issueNumber = utils.getCurrentIssueNumber();
  const issue = JSON.parse(
    sh
      .exec(
        `hub issue show -f '{"title":"%t","labels":"%L"}' ${issueNumber} | grep -F ""`,
      )
      .trimIndent(),
  );

  sh.echo(
    `Creating Pull Request for issue #${issueNumber} "${issue.title}", labeled: "${issue.labels}"`,
  );

  // If there's a more than one label, remove spaces around commas
  if (issue.labels.includes(',')) {
    issue.labels = issue.labels.replace(/, /g, ',');
  }

  if (options.draft) {
    sh.echo('Marking Pull Request as a draft');
    options.draft = '-d';
  } else {
    options.draft = '';
  }

  if (options.push) {
    sh.echo('Pushing changes before creating Pull Request');
    options.push = '-fp';
  } else {
    options.push = '';
  }

  if (options.to) {
    sh.echo(`Setting base branch to "${options.to}"`);
    options.to = `--base "${options.to}"`;
  } else {
    options.to = '';
  }

  // Creating Pull Request
  if (
    sh.exec(
      `hub pull-request -l "${issue.labels}" -m "${issue.title}" -m "Close #${issueNumber}" ${options.draft} ${options.push} ${options.to} | grep -F ""`,
    ).code !== 0
  ) {
    sh.echo(
      `We ecountered some problems with creating PR for issue #${issueNumber} "${issue.title}"`,
    );
    sh.exit(1);
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

const runReady = (ready) => {
  sh.echo(
    `Marking a PR associated with branch "${ready.branch}" as ready for review`,
  );

  const repo = utils.getRepo();
  const owner = utils.getUser();
  const prNumber = utils.getPrNumberFromBranch(ready.branch);

  let query = `query {
    repository(name: "${repo}", owner: "${owner}") {
      pullRequest(number: ${prNumber}) {
        id
        isDraft
      }
    }
  }`;

  // Downloading id of the pull request (different from the number shown on github)
  let output = JSON.parse(
    sh.exec(`hub api graphql -f query='${query}' | grep -F ""`).trimEndline(),
  );
  if (output.errors) {
    if (output.errors.find((error) => error.type === 'NOT_FOUND')) {
      sh.echo(
        'It looks like there are not Pull Request associated with this branch',
      );
    } else {
      sh.echo('Some generic errors. Take a look: ');
      output.errors.forEach((error) => {
        sh.echo(error.message);
      });
    }
    sh.exit(1);
  }

  if (!output.data.repository.pullRequest.isDraft) {
    sh.echo('It looks like the Pull Request is already ready for review');
    sh.exit(1);
  }

  const prId = output.data.repository.pullRequest.id;

  query = `mutation {
    markPullRequestReadyForReview(input: {pullRequestId: "${prId}"}) {
      clientMutationId
    }
  }`;

  // Sending query changing draft status to false
  output = JSON.parse(
    sh.exec(`hub api graphql -f query='${query}' | grep -F ""`).trimEndline(),
  );
  if (output.errors) {
    sh.echo('Some generic errors. Take a look: ');
    output.errors.forEach((error) => {
      sh.echo(error.message);
    });
    sh.exit(1);
  }

  sh.echo(
    `Pull Request associated with this branch is now ready for review (#${prNumber})`,
  );
  sh.exit(0);
};

const runOpen = (open) => {
  sh.echo(`Opening a website with PR associated with branch "${open}"`);

  const prLink = sh
    .exec(`hub pr show -u -h ${open} | grep -F ""`)
    .trimEndline();

  if (!prLink) {
    sh.echo(`There are no Pull Request associated with this branch`);
    sh.exit(1);
  }

  sh.exec(`xdg-open ${prLink}`);
  sh.exit(0);
};

const pr = (args) => {
  runCommands(parseArgs(args));
};

module.exports = pr;

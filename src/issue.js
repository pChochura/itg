require('dotenv').config();
const utils = require('./utils');
const sh = require('shelljs');

const showHelp = () => {
  sh.echo(
    `
    Creates an issue with the given name and assignes it to you.
    Use this script instead of creating issues through the browser
    because this way the issue will be marked with the correct label and appropriate branch will be created and linked.
    After creating issue you will be switched to the newly created branch.
    Keep in mind that this branch automatically will be pushed.

    Usage:  ${process.env.LIB_NAME} issue|i [-h] <name> [-b|-c <label>] [--from <issue|'master'>] [-d]
          \t${process.env.LIB_NAME} issue|i open <issue>
    Options:
    \t-h, --help, -help, h, help, ?   displays this help message
    \t-b, --bug                       sets 'bug' label to the newly created issue
    \t-c, --custom <label>            sets the given label to the newly created issue. Label have to exist.
    \t--from <issue number|'master'>  allows to choose a base branch by selecting base issue
    \t-d, --detached                  allows to create an issue without switching to the created branch
    \topen <issue number>             changes branch to the one associated with the given issue and assignes it to you
  `.trimIndent(),
  );
  sh.exit(0);
};

const parseArgs = (args) => {
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (['-h', '--help', '-help', 'h', 'help', '?'].indexOf(args[i]) !== -1) {
      showHelp();
    } else if (['-b', '--bug'].indexOf(args[i]) !== -1) {
      options.bug = true;
    } else if (['-c', '--custom'].indexOf(args[i]) !== -1) {
      options.custom = args[i + 1];

      // Skip checking 'custom' parameter
      i++;
    } else if (['--from'].indexOf(args[i]) !== -1) {
      options.from = args[i + 1];

      // Skip checking 'from' parameter
      i++;
    } else if (['-d', '--detached'].indexOf(args[i]) !== -1) {
      options.detached = true;
    } else if (['open'].indexOf(args[i]) !== -1) {
      options.open = args[i + 1];

      // Skip checking 'open' parameter
      i++;
    } else {
      // Add as not named option (such as issue title)
      options.title = args[i];
    }
  }

  return validateOptions(options);
};

const validateOptions = (tempOptions) => {
  const options = {};

  // Validate 'open'
  if (tempOptions.hasOwnProperty('open')) {
    if (!tempOptions.open) {
      sh.echo('You have to pass an issue number to "open" option');
      sh.exit(1);
    }

    // User typed more options than just "open <issue>"
    if (Object.keys(tempOptions).length > 1) {
      sh.echo('You cannot use option "open" with other options');
      sh.exit(1);
    }

    options.open = validateOpen(tempOptions.open);

    // Return now to avoid checking other options
    return options;
  }

  // Validate title
  if (!tempOptions.title) {
    sh.echo('You have to pass an issue title as a parameter');
    sh.exit(1);
  }

  options.title = tempOptions.title;

  // Validate 'custom' (ignore 'bug' if 'custom' is valid)
  if (tempOptions.hasOwnProperty('custom')) {
    if (!tempOptions.custom) {
      sh.echo('You have to pass a label to "--custom" option');
      sh.exit(1);
    }

    options.label = validateCustom(tempOptions.custom);
  } else if (tempOptions.bug) {
    options.label = 'bug';
  } else {
    options.label = 'feature';
  }

  // Validate 'from'
  if (tempOptions.hasOwnProperty('from')) {
    if (!tempOptions.from) {
      sh.echo(
        'You have to pass an issue number or "master" to "--from" option',
      );
      sh.exit(1);
    }

    options.from = validateFrom(tempOptions.from);
  } else {
    options.from = 'master';
  }

  // Validate 'detached'
  if (tempOptions.detached) {
    options.detached = true;
  }

  return options;
};

const validateCustom = (custom) => {
  if (!custom) {
    sh.echo('You have to pass a label');
    sh.exit(1);
  }

  if (['bug', 'feature'].indexOf(custom) !== -1) {
    sh.echo(
      `Warning!
      Passing "bug" or "feature" to the "custom" option slows down the process. 
      Try using "bug" option and keep in mind - "feature" label is the default.
    `.trimIndent(),
    );
  }

  // Download labels from Github repo
  const labels = sh
    .exec('hub issue labels | grep -F "\n"', { silent: true })
    .split('\n');

  if (labels.indexOf(custom) === -1) {
    sh.echo(
      `You have to provide a label from: [${labels.join(', ').slice(0, -2)}]`,
    );
    sh.exit(1);
  }
  return custom;
};

const validateFrom = (from) => {
  if (from === 'master') {
    return 'master';
  }

  if (!utils.validateNumber(from)) {
    sh.echo(
      'Parameter passed to "--from" have to be an issue number or "master"',
    );
    sh.exit(1);
  }

  return getBranchNameFromNumber(from);
};

const validateOpen = (open) => {
  if (!utils.validateNumber(open)) {
    sh.echo('Parameter passed to "open" have to be an issue number');
    sh.exit(1);
  }

  return {
    branch: getBranchNameFromNumber(open),
    number: open,
  };
};

const getBranchNameFromNumber = (issueNumber) => {
  const issueTitleCommand = sh.exec(
    `hub issue show -f %t ${issueNumber} | grep -F ""`,
    {
      silent: true,
    },
  );

  if (issueTitleCommand.code !== 0) {
    sh.echo(
      `Something went wrong with downloading issue (#${issueNumber}) title`,
    );
    sh.exit(1);
  }

  return getBranchName(issueTitleCommand.stdout, issueNumber);
};

const getBranchName = (issueTitle, issueNumber) => {
  return `${utils.slugify(issueTitle)}-i${issueNumber}`;
};

const runCommands = (options) => {
  if (options.open) {
    runOpen(options.open);
  }

  // Creating an issue
  sh.echo(
    `Creating issue with name: ${options.title}, labeled: ${options.label}`,
  );

  let assignee = '';
  if (!options.detached) {
    sh.echo('Assigning this issue to you');

    assignee = `-a ${utils.getUser()}`;
  }

  const issueLink = sh
    .exec(
      `hub issue create -l '${options.label}' -m '${options.title}' ${assignee} | grep -F ""`,
      { silent: true },
    )
    .stdout.trimEndline();

  if (!issueLink) {
    sh.echo('Something went wrong with creating issue');
    sh.exit(1);
  }

  const indexOfSlash = issueLink.lastIndexOf('/') + 1;
  const issueNumber = issueLink.substring(indexOfSlash);

  if (!utils.validateNumber(issueNumber)) {
    sh.echo('Something went wrong with creating issue');
    sh.exit(1);
  }

  // Creating a custom branch
  sh.echo('Checking out your new branch');
  const branchName = getBranchName(options.title, issueNumber);
  sh.exec(`git push origin origin/${options.from}:refs/heads/${branchName}`, {
    silent: true,
  });

  if (!options.detached) {
    sh.exec('git stash', { silent: true });
    sh.exec(`git checkout ${branchName}`, { silent: true });
    sh.exec('git stash pop', { silent: true });
  }

  // Adding description to the issue
  const branchLink = sh
    .exec('hub browse -u | grep -F ""')
    .replace(/[a-z0-9-]+$/, branchName);
  const description = `Associated branch: [${branchName}](${branchLink})`;
  sh.exec(
    `hub issue update "${issueNumber}" -m "${options.title}" -m "${description}"`,
  );

  sh.exit(0);
};

const runOpen = (open) => {
  sh.echo('Checking out branch associated with the selected issue');

  // Check if remote branch with this name exist
  if (
    sh.exec(`git ls-remote origin ${open.branch}`, { silent: true }).code !== 0
  ) {
    sh.echo(`Remote branch "${open.branch}" does not exist`);
    sh.exit(1);
  }

  // Checkout the branch
  sh.exec(`git checkout --track origin/${open.branch}`, { silent: true });

  sh.echo('Assigning this issue to you');
  sh.exec(`hub issue update ${open.number} -a ${utils.getUser()}`, {
    silent: true,
  });

  sh.exit(0);
};

const issue = (args) => {
  const options = parseArgs(args);
  runCommands(options);
  sh.echo(options);
};

module.exports = issue;

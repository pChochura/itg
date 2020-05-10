const sh = require('shelljs');

sh.config.silent = true;

const slugify = (input) => {
  return input
    .toLowerCase()
    .replace(/\n|\r|\r\n/g, '')
    .replace(/'/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-*|-*$/g, '');
};

const validateNumber = (number) => {
  return number.match(/^\d+$/);
};

const printError = (text) => {
  // Example
  // sh.echo('-e', '\033[31mYou have to pass an issue number to "open" option\033[0m');
};

const getUser = () => {
  const user = sh.exec('hub api user | grep -F ""');
  if (!user) {
    sh.echo('We ecountered some problem with getting your username');
    sh.exit(1);
  }

  return JSON.parse(user).login;
};

const getRepo = () => {
  const repo = sh.exec('basename $(git remote get-url origin) .git');

  if (!repo) {
    sh.echo('We ecountered some problem with getting your repo name');
    sh.exit(1);
  }

  return repo.trimEndline();
}

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

  return getBranchName(issueTitleCommand.trimEndline(), issueNumber);
};

const getBranchName = (issueTitle, issueNumber) => {
  return `${slugify(issueTitle)}-i${issueNumber}`;
};

const getCurrentBranchName = () => {
  return sh.exec('git rev-parse --abbrev-ref HEAD').trimEndline();
};

const getCurrentIssueNumber = () => {
  const branchName = getCurrentBranchName();
  const indexOfI = branchName.lastIndexOf('i');
  const number = branchName.substring(indexOfI + 1);
  if (indexOfI === -1 || !validateNumber(number)) {
    sh.echo(
      `There are no associated issues with current branch "${branchName}"`,
    );
    sh.exit(1);
  }

  return number;
};

const getPrNumberFromBranch = (branch) => {
  const prLink = sh.exec(`hub pr show -u -h ${branch} | grep -F ""`).trimEndline();

  if (!prLink) {
    sh.echo(`Something went wrong with downloading pull request for branch "${branch}"`);
    sh.exit(1);
  }

  return getNumberFromLink(prLink);
}

const getNumberFromLink = (link) => {
  const indexOfSlash = link.lastIndexOf('/') + 1;
  const number = link.substring(indexOfSlash);

  if (!number || !validateNumber(number)) {
    sh.echo(`Something went wrong with getting issue number from "${link}"`);
    sh.exit(1);
  }

  return number;
}

String.prototype.trimIndent = function () {
  return this.replace(/\n */g, '\n');
};

String.prototype.trimEndline = function () {
  return this.replace(/\n$/, '');
};

module.exports = {
  slugify,
  validateNumber,
  getUser,
  getRepo,
  getBranchName,
  getBranchNameFromNumber,
  getCurrentBranchName,
  getCurrentIssueNumber,
  getPrNumberFromBranch,
  getNumberFromLink,
};

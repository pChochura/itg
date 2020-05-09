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
      `There are not associated issue with current branch "${branchName}"`,
    );
    sh.exit(1);
  }

  return number;
};

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
  getBranchName,
  getBranchNameFromNumber,
  getCurrentBranchName,
  getCurrentIssueNumber,
};

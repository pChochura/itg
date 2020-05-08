const sh = require('shelljs');

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
  return JSON.parse(sh.exec('hub api user | grep -F ""', { silent: true }))
    .login;
};

String.prototype.trimIndent = function () {
  return this.replace(/\n */g, '\n');
};

String.prototype.trimEndline = function () {
  return this.replace(/\n/, '');
};

module.exports = {
  slugify,
  validateNumber,
  getUser,
};

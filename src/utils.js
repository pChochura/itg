const sh = require('./shell');
const api = require('./api/api');

String.prototype.trimIndent = function () {
	return this.replace(/\n(\t)*/g, '\n');
};

String.prototype.trimEndline = function () {
	return this.replace(/\n$/, '');
};

Array.prototype.asyncForEach = async function (callback) {
	for (let index = 0; index < this.length; index++) {
		await callback(this[index], index, this);
	}
};

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

const getBranchNameFromNumber = async (issueNumber) => {
	const issue = await api.getIssue(issueNumber);

	if (!issue) {
		sh.echo(`Something went wrong with getting issue title (#${issueNumber})`);
		sh.exit(1);
	}

	return getBranchName(issue.title, issueNumber);
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

const getNumberFromLink = (link) => {
	const indexOfSlash = link.lastIndexOf('/') + 1;
	const number = link.substring(indexOfSlash);

	if (!number || !validateNumber(number)) {
		sh.echo(`Something went wrong with getting issue number from "${link}"`);
		sh.exit(1);
	}

	return number;
};

const getBranchLink = async (branch) => {
	const repoLink = (await api.getRepo()).url;
	return `${repoLink}/tree/${branch}`;
};

module.exports = {
	slugify,
	validateNumber,
	getBranchName,
	getBranchNameFromNumber,
	getCurrentBranchName,
	getCurrentIssueNumber,
	getNumberFromLink,
	getBranchLink,
};

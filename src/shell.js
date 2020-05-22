require('./utils');
const child = require('child_process');

const exec = (query) => {
	try {
		const stdout = child.execSync(query, { stdio: 'pipe' }).toLocaleString();
		return {
			stdout: stdout.trimEndline(),
			code: 0,
			trimEndline: () => {
				return stdout.trimEndline();
			},
		};
	} catch (error) {
		return {
			stdout: null,
			code: error.status || 1,
			trimEndline: () => error.stderr.toLocaleString().trimEndline(),
		};
	}
};

const which = (command) => {
	return exec(`which ${command}`).code === 0;
};

const echo = (query) => {
	console.log(query);
};

const exit = (code) => {
	process.exit(code);
};

module.exports = {
	exec,
	which,
	echo,
	exit,
};

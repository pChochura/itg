require('./utils');
const child = require('child_process');

const exec = (query) => {
	try {
		return {
			stdout: child.execSync(query).toLocaleString().trimEndline(),
			code: 0,
		};
	} catch (error) {
		return {
			stdout: null,
			code: error.status || 1,
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

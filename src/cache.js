const gitRootDir = require('git-root-dir');
const sh = require('shelljs');
const fs = require('fs');
const cache = new Map();
let loaded = false;
let path = undefined;

const computePath = async () => {
	if (path) {
		return;
	}

	const git = await gitRootDir();

	if (!git) {
		sh.echo('You can only use this library in the git directory');
		sh.exit(1);
	}

	path = `${git}/.git/.itg.cache`;
};

const clearFile = async () => {
	await computePath();

	fs.writeFileSync(path, '');
};

const loadFile = async () => {
	await computePath();

	// Avoid loading file if it's already loaded
	if (loaded || !fs.existsSync(path)) {
		return;
	}

	loaded = true;

	// Load file contents and treat each line as a 'key:value' pair
	const content = fs.readFileSync(path).toLocaleString();
	content.split('\n').forEach((line) => {
		if (!line) {
			return;
		}

		const pair = line.split(':');
		if (pair[0] === '__UNTIL__') {
			if (Date.now() - pair[1] >= 0) {
				cache.clear();
				clearFile();
				return;
			}
		}
		cache.set(Buffer.from(pair[0], 'base64').toString('utf-8'), pair[1]);
	});
};

const saveFile = async () => {
	await computePath();

	const data = [];
	let until;

	// Save cache entries to an array as 'key:value' pair and then join them with a newline character
	cache.forEach((value, key) => {
		if (key === '__UNTIL__') {
			until = value;
		} else {
			data.push(`${Buffer.from(key).toString('base64')}:${value}`);
		}
	});

	if (!until) {
		const threeDays = 1000 * 60 * 60 * 24 * 3;
		until = Date.now() + threeDays;
	}

	data.push(`__UNTIL__:${until}`);

	fs.writeFileSync(path, data.join('\n'));
};

const get = async (key) => {
	await loadFile();

	const value = cache.get(key);

	if (!value) {
		return;
	}

	return JSON.parse(Buffer.from(value, 'base64').toString('utf-8'));
};

const set = async (key, value) => {
	cache.set(key, Buffer.from(JSON.stringify(value)).toString('base64'));

	await saveFile();

	return value;
};

const has = async (key) => {
	await loadFile();

	return cache.has(key);
};

module.exports = {
	get,
	set,
	has,
};

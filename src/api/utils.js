const fs = require('fs');
const os = require('os');
const f = require('node-fetch');
const read = require('read');

const API_URL = 'https://api.github.com';

const askForCredentials = async () => {
	return new Promise((resolve, _) => {
		sh.echo('Login into your Github account (your credentials are never stored)');
		read({ prompt: 'Username: ', silent: false }, (error, username) => {
			if (error) {
				sh.echo('You have to login into your Github account to continue');
				sh.exit(1);
			}

			read({ prompt: 'Password: ', silent: true }, (error, password) => {
				if (error) {
					sh.echo('Your password is never stored');
					sh.exit(1);
				}

				resolve({
					username,
					password,
				});
			});
		});
	});
};

const auth = async () => {
	const { username, password } = await askForCredentials();

	const res = await f(`${API_URL}/authorizations`, {
		method: 'POST',
		headers: {
			Authorization:
				'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
		},
		body: JSON.stringify({
			scopes: ['repo', 'user'],
			note: 'Token for "itg"',
		}),
	});
	return res.json();
};

const getToken = () => {
	const path = `${os.homedir()}/.itg/.secret`;

	if (fs.existsSync(path)) {
		return Buffer.from(
			fs.readFileSync(path).toLocaleString(),
			'base64',
		).toString();
	}
};

const setToken = async (token) => {
	const path = `${os.homedir()}/.itg/.secret`;

	fs.writeFileSync(path, Buffer.from(token).toString('base64'));
};

const getAuthHeaders = async () => {
	let token = getToken();

	// Ask for creating authorization token if it does not exist
	if (!token) {
		token = (await auth()).token;
		if (token) {
			setToken(token);
		}
	}

	return {
		Authorization: `bearer ${token}`,
	};
};

Object.prototype.fromPath = function (...path) {
	return path.reduce((xs, x) => (xs && xs[x] ? xs[x] : null), this);
};

module.exports = {
	API_URL,
	getAuthHeaders,
};

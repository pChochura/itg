const fs = require('fs');

const packageJson = require('./package.json');
fs.writeFileSync(
	'./info.json',
	JSON.stringify({ version: packageJson.version }),
);

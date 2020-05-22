const fs = require('fs');
const os = require('os');
const config = {};
let loaded = false;

const loadConfig = () => {
	if (loaded) {
		return;
	}

	const path = `${os.homedir()}/.itg/config.json`;

	if (fs.existsSync(path)) {
		Object.assign(config, JSON.parse(fs.readFileSync(path).toLocaleString()));
	}
};

const saveConfig = () => {
	const path = `${os.homedir()}/.itg`;

	if (!fs.existsSync(path)) {
		fs.mkdirSync(path);
	}

	fs.writeFileSync(`${path}/config.json`, JSON.stringify(config));
};

const isWarningDsiabled = () => {
	loadConfig();
	console.log(config);

	return config.warningDisabled;
};

const setWarningDisabled = (disabled = true) => {
	loadConfig();

	config.warningDisabled = disabled;

	saveConfig();
};

module.exports = {
	isWarningDsiabled,
	setWarningDisabled,
};

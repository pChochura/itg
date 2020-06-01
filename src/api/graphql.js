const utils = require('./utils');
const f = require('node-fetch');

const mutation = async (mutation) => {
	return query(mutation, true);
};

const query = async (query, isMutation) => {
	const body = `{ "query": "${isMutation ? 'mutation' : ''} { ${query
		.replace(/\n| +|\t+/g, ' ')
		.replace(/"/g, '\\"')} }" }`;
	console.log(body);
	const res = await f(`${utils.API_URL}/graphql`, {
		method: 'POST',
		headers: await utils.getAuthHeaders(),
		body,
	});
	return await res.json();
};

module.exports = {
	query,
	mutation,
};

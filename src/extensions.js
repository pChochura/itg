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
let utils = require('../src/utils');

test('slugify', () => {
	expect(utils.slugify('First test for slugify')).toBe(
		'first-test-for-slugify',
	);

	expect(utils.slugify('$0M€ weird chars!')).toBe('0m-weird-chars');

	expect(utils.slugify('Multiline\ntext')).toBe('multilinetext');

	expect(utils.slugify('Hyphens--to---much')).toBe('hyphens-to-much');

	expect(utils.slugify('--at   the   beginning')).toBe('at-the-beginning');

	expect(utils.slugify('at   the   end--')).toBe('at-the-end');

	expect(utils.slugify('--both SIDES--')).toBe('both-sides');
});

test('validateNumber', () => {
	expect(utils.validateNumber('132')).toBeDefined();

	expect(utils.validateNumber('012312')).toBeDefined();

	expect(utils.validateNumber('-453')).toBeNull();

	expect(utils.validateNumber(' 654')).toBeNull();

	expect(utils.validateNumber('67 ')).toBeNull();

	expect(utils.validateNumber(' 233 ')).toBeNull();

	expect(utils.validateNumber('number: 231')).toBeNull();
});

test('trimIndent', () => {
	expect(
		`
		Text
	`.trimIndent(),
	).toBe('\nText\n');

	expect(
		`
		Some multiline
		Text
		with
			indentation
					a lot
	`.trimIndent(),
	).toBe('\nSome multiline\nText\nwith\nindentation\na lot\n');
});

test('trimEndline', () => {
	expect('Endline\n'.trimEndline()).toBe('Endline');

	expect('Nothing interesting here\n\n\n'.trimEndline()).toBe(
		'Nothing interesting here\n\n',
	);

	expect('Nothing\n interesting here\n\n'.trimEndline()).toBe(
		'Nothing\n interesting here\n',
	);
});

#!/usr/bin/env node

const config = require('./src/config');
const issue = require('./src/issue');
const sh = require('./src/shell');
const pr = require('./src/pr');

if (!sh.which('git')) {
	sh.echo(
		'Nope. Install "git" first: "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git"',
	);
	sh.exit(1);
}

const run = async () => {
	const args = process.argv.slice(2);

	if (['--version', '-v'].indexOf(args[0]) !== -1) {
		sh.echo(require('./info.json').version);
		sh.exit(0);
	}

	if (['--disable-warning'].indexOf(args[0]) !== -1) {
		sh.echo(
			`
		Warnings now are disabled. To enable them again, just type:
		  itg --enable-warning
			
		Now you can create issues without 'issue|i' prefix.
		`.trimIndent(),
		);

		config.setWarningDisabled();

		sh.exit(0);
	}

	if (['--enable-warning'].indexOf(args[0]) !== -1) {
		sh.echo(
			`
		Warnings now are enabled. To disable them again, just type:
		  itg --disable-warning
		`.trimIndent(),
		);

		config.setWarningDisabled(false);

		sh.exit(0);
	}

	if (['-h', '-help', '--help', 'help', '?'].indexOf(args[0]) !== -1) {
		// User needs help!!
		sh.echo(
			`
			It's a simple script to help you manage Github Issues and Pull Requests.

			Usage:  itg [-h] [-v] [--disable-warning] [--enable-warning]
			        itg [issue|i] [OPTIONS]
			        itg pull-request|pr [OPTIONS]
			Options:
			  -h, --help, -help, h, help, ?  displays this help message
			  -v, --version                  shows current version of this script
			  --disable-warning              disable warning showing when creating an issue omitting
			                                   'issue|i' prefix and qoutes around the title
			  --enable-warning               enables warning showing when creating an issue omitting
			                                   'issue|i' prefix and qoutes around the title; default
			  issue, i                       manages Issues; can be omitted
			  pull-request, pr               manages Pull Requests

			Scripts with omitted 'issue|i' prefix will be interpreted as if it was there.
		`.trimIndent(),
		);
		sh.exit(0);
	}

	if (['issue', 'i'].indexOf(args[0]) !== -1) {
		await issue(args.slice(1));
		sh.exit(0);
	}

	if (['pull-request', 'pr'].indexOf(args[0]) !== -1) {
		await pr(args.slice(1));
		sh.exit(0);
	}

	if ((args[0] || '').indexOf('"') !== -1 || config.isWarningDsiabled()) {
		await issue(args);
		sh.exit(0);
	}

	// Propably user just don't know what to do
	sh.echo(
		`
	To create an issue without 'issue|i' prefix, just remember to put the title as a first parameter and surround it with quotes.
	If you want to disable this behavior, just type:
	  itg --disable-warning

	And then you will be able to create issues without this limitation.
	`.trimIndent(),
	);
	sh.exit(1);
};

run();

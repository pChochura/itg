#!/usr/bin/env node

require('./src/utils');
const issue = require('./src/issue');
const pr = require('./src/pr');
const sh = require('shelljs');

sh.config.silent = true;

if (!sh.which('git')) {
  sh.echo(
    'Nope. Install "git" first: "https://git-scm.com/book/en/v2/Getting-Started-Installing-Git"',
  );
  sh.exit(1);
}

if (!sh.which('hub')) {
  sh.echo('Nope. Install "hub" first: "https://github.com/github/hub"');
  sh.exit(1);
}

const args = process.argv.slice(2);

if (['issue', 'i'].indexOf(args[0]) !== -1) {
  issue(args.slice(1));
  sh.exit(0);
}

if (['pull-request', 'pr'].indexOf(args[0]) !== -1) {
  pr(args.slice(1));
  sh.exit(0);
}

// User must have typed something wrong
sh.echo(
  `
  We've got a problem...

  The correct usage of this command is:
    ${process.env.LIB_NAME} issue|i [OPTIONS]
    ${process.env.LIB_NAME} pull-request|pr [OPTIONS]
  
  If you want help with OPTIONS, just type 'help' instead of OPTIONS.
  Have fun!
`.trimIndent(),
);

const shell = require("shelljs");

if (!shell.which('git')) {
    shell.echo("Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'");
    shell.exit(1);
}

if (!shell.which('hub')) {
    shell.echo("Nope. Install 'hub' first: 'https://github.com/github/hub'");
    shell.exit(1);
}

const validateLabel = (label) => {
    const labelsOutput = shell.exec("hub issue labels");
    if (labelsOutput.code !== 0) {
        shell.echo(`We have a problem with getting labels from your repo.`);
        shell.exit(1);
    }

    shell.echo(labelsOutput.stdout);
}

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (['-h', '--help', '-help', 'h', 'help', '?'].indexOf(arg) !== -1) {
        // showHelp();
    } else if (['-b', '--bug'].indexOf(arg) !== -1) {
        bug = true;
    } else if (['-c', '--custom'].indexOf(arg) !== -1) {
        validateLabel(args[i + 1])
    }
}
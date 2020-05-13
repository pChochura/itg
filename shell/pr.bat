@echo off

setlocal EnableDelayedExpansion

:parse
    IF "%~1"=="-h" SET help=1
    IF "%~1"=="--help" SET help=1
    IF "%~1"=="-help" SET help=1
    IF "%~1"=="h" SET help=1
    IF "%~1"=="help" SET help=1
    IF "%~1"=="?" SET help=1
    IF "%help%" == "1" (
        SET help="Creates a pull request from the current branch to the master branch." & echo !help:"=!        
        SET help="Use this script instead of creating PR through the browser" & echo !help:"=!
        SET help="because this way the PR will be marked with the correct label and appropriate issue will be linked." & echo !help:"=!
        echo.
        SET help="Usage:    .\%~nx0 [-h -d -m --to <issue>]" & echo !help:"=!
        SET help="          .\%~nx0 open [<issue>]" & echo !help:"=!
        SET help="Options:" & echo !help:"=!
        SET help="  -h, --help, -help, h, help, ?   - displays this help message" & echo !help:"=!
        SET help="  -d, --draft                     - marks newly created pull request as a draft" & echo !help:"=!
        SET help="  -m, --master                    - switches you to the master branch after creating a pull request" & echo !help:"=!
        SET help="  --to <issue number>             - allows to choose a branch to be merged to by selecting an issue" & echo !help:"=!
        SET help="  open [<issue number>]           - opens a webiste with PR associated with the current (or selected) issue" & echo !help:"=!
        EXIT /B 0
    )

    IF "%~1"=="-d" SET draft=-d         & shift & goto :parse
    IF "%~1"=="--draft" SET draft=-d    & shift & goto :parse

    IF "%~1"=="-m" SET master=1         & shift & goto :parse
    IF "%~1"=="--master" SET master=1   & shift & goto :parse

    IF "%~1"=="--to" (
        IF "%~2"=="" (
            echo You have to pass an issue number
            EXIT /B 1
        )
        SET to=%2
        shift & shift & goto :parse
    )

    IF "%~1"=="open" (
        IF "%~2"=="" (
            SET open=current
        ) ELSE SET open=%2
        
        shift & goto :parse
    )

    shift

git --version > NUL || (echo Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git' && EXIT /B 1)

hub --version > NUL || (echo Nope. Install 'hub' first: 'https://github.com/github/hub' && EXIT /B 1)

FOR /F %%v IN ('git rev-parse --abbrev-ref HEAD') DO SET branchName=%%v

SET x=%branchName:i= && SET issueId=%

IF NOT "%open%"=="" (
    echo Opening a website with PR

    IF "%open%"=="current" SET "open="
    hub pr show !open!

    EXIT /B 0
)

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%t" "%issueId%"') DO SET issueName=%%v

FOR /F "tokens=*" %%v IN ('hub issue show -f "%%L" "%issueId%"') DO SET label=%%v

echo Creating pull request for issue #%issueId% with name "%issueName%", labeled: "%label%"

IF NOT "%draft%"=="" echo Marking pull request as a draft

IF NOT "%to%"=="" (
    FOR /F "tokens=1 delims=]" %%v IN ('hub issue show -f "%%b" "%to%"') DO SET to=%%v
    FOR /F "tokens=2 delims=[" %%v IN ("!to!") DO SET to=%%v
    echo Setting base branch to !to!
    SET to=--base !to!
)

hub pull-request -l "%label%" -m "%issueName%" -m "Close #%issueId%" %draft% %to% || (
    echo We encountered some problems
    EXIT /B 1
)

IF NOT "%master%"=="" git checkout master
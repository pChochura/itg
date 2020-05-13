@echo off

setlocal EnableDelayedExpansion

SET filename=%~nx0

FOR /F %%v IN ('git rev-parse --abbrev-ref HEAD') DO SET from=%%v
SET x=%from:i= && SET from=%

:parse
    IF "%~1"=="-h" SET help=1
    IF "%~1"=="--help" SET help=1
    IF "%~1"=="-help" SET help=1
    IF "%~1"=="h" SET help=1
    IF "%~1"=="help" SET help=1
    IF "%~1"=="?" SET help=1

    IF "%help%"=="1" (
        SET help="Creates an issue with the given name and assignes it to you." & echo !help:"=!
        SET help="Use this script instead of creating issues through the browser" & echo !help:"=!
        SET help="because this way the issue will be marked with the correct label and appropriate branch will be created and linked." & echo !help:"=!
        SET help="After creating issue you will be switched to the newly created branch." & echo !help:"=!
        SET help="Keep in mind that this branch automatically will be pushed." & echo !help:"=!
        echo.
        SET help="Usage:    .\%filename% [-h] <name> [-b|-c <label>] [--from <issue|'master'>] [-d]" & echo !help:"=!
        SET help="          .\%filename% open <issue>" & echo !help:"=!
        SET help="Options:" & echo !help:"=!
        SET help="  -h, --help, -help, h, help, ?   - displays this help message" & echo !help:"=!
        SET help="  -b, --bug                       - sets 'bug' label to the newly created issue" & echo !help:"=!
        SET help="  -c, --custom <label>            - sets the given label to the newly created issue. Label have to exist." & echo !help:"=!
        SET help="  --from <issue number|'master'>  - allows to choose a base branch by selecting base issue" & echo !help:"=!
        SET help="  -d, --detached                  - allows to create an issue without switching to the created branch" & echo !help:"=!
        SET help="  open <issue number>             - changes branch to the one associated with the given issue and assignes it to you" & echo !help:"=!
        EXIT /B 0
    )

    IF "%~1"=="-b" SET bug=1 & shift & goto :parse
    IF "%~1"=="--bug" SET bug=1 & shift & goto :parse

    IF "%~1"=="-c" SET custom=1
    IF "%~1"=="--custom" SET custom=1
    IF "!custom!"=="1" (
        IF "%~2"=="" (
            echo You have to pass a label
            EXIT /B 1
        )
        SET custom=%2
        shift & shift & goto :parse
    )

    IF "%~1"=="--from" (
        IF "%~2"=="" (
            echo You have to pass an issue number
            EXIT /B 1
        )
        SET from=%2
        shift & shift & goto :parse
    )

    IF "%~1"=="-d" SET detached=1 & shift & goto :parse
    IF "%~1"=="--detached" SET detached=1 & shift & goto :parse

    IF "%~1"=="open" (
        IF "%~2"=="" (
            echo You have to pass an issue number
            EXIT /B 1
        )
        SET open=%2
        shift & shift & goto :parse
    )

    IF "%~1"=="" (
        goto :main
    ) ELSE (
        SET title=%~1
    )
    shift & goto :parse

:main
    git --version > NUL || (echo Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git' && EXIT /B 1)

    hub --version > NUL || (echo Nope. Install 'hub' first: 'https://github.com/github/hub' && EXIT /B 1)

    IF NOT "%open%"=="" (
        echo Checking out branch associated with the selected issue
        FOR /F "tokens=1 delims=]" %%v IN ('hub issue show -f "%%b" "%open%"') DO SET branch=%%v
        FOR /F "tokens=2 delims=[" %%v IN ("!branch!") DO SET branch=%%v
        git stash
        git checkout --track origin/!branch!
        git stash pop

        echo Assigning this issue to you

        FOR /F "tokens=1 delims=," %%v IN ('hub api user') DO SET assignee=%%v
        FOR /F "tokens=2 delims=:" %%v IN ("!assignee!") DO SET assignee=%%v

        hub issue update %open% -a !assignee!
        EXIT /B 0
    )

    IF "%title%"=="" echo You have to pass an issue title as a parameter && EXIT /B 1

    IF NOT "%custom%"=="" (
        FOR /F "delims=" %%v IN ('hub issue labels') do (
            SET labels[%%v]=true
            SET labelList=!labelList!, %%v
        )
        IF defined labels[%custom%] (
            SET label=%custom%
        ) ELSE (
            echo You have to provide a label from: [!labelList:~2!]
            EXIT /B 1
        )
    ) ELSE (
        IF NOT "%bug%"=="" (
            SET label=bug
        ) ELSE (
            SET label=feature
        )
    )

    echo Creating issue with name: '%title%', labeled: %label%

    IF "%detached%"=="" (
        echo Assigning this issue to you

        FOR /F "tokens=1 delims=," %%v IN ('hub api user') DO SET assignee=%%v
        FOR /F "tokens=2 delims=:" %%v IN ("!assignee!") DO SET assignee=%%v

        SET assignee=-a !assignee:"=!
    )

    FOR /F %%v IN ('hub issue create -l "%label%" -m "%title%" %assignee%') DO SET issueLink=%%v

    SET x=%issueLink:/= && SET issueNumber=%

    SET output=%title%

    REM Convert all chars to lowercase
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\".toLower()"`) do SET output=%%v

    REM Remove all single quotes
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace \"'\""`) do SET output=%%v

    REM Convert all non-alpha-numeric to dashes (-)
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '[^a-zA-Z0-9-]+','-'"`) do SET output=%%v

    REM Replace multiple dash occurances with singles
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '-+','-'"`) do SET output=%%v

    REM Remove trailing dashes
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%output%\" -replace '^-+|-+$',''"`) do SET output=%%v

    SET branchName=%output%-i%issueNumber%

    IF NOT "%from%"=="" (
        IF "%from%"=="master" (
            SET startingBranch=master
        ) ELSE (
            FOR /F "tokens=1 delims=]" %%v IN ('hub issue show -f "%%b" "%open%"') DO SET branch=%%v
            FOR /F "tokens=2 delims=[" %%v IN ("!branch!") DO SET branch=%%v
        )
    )

    git push origin origin/master:refs/heads/%branchName% >NUL

    IF "%detached%"=="" (
        git stash
        git checkout --track origin/!branchName!
        git stash pop
    )

    FOR /F "tokens=*" %%v IN ('hub browse -u') DO SET link=%%v
    FOR /F "usebackq delims=" %%v IN (`powershell "\"%link%\" -replace '[a-z0-9-]+$','%branchName%'"`) do SET link=%%v
    SET description=Associated branch: [%branchName%](%link%)
    hub issue update "%issueNumber%" -m "%title%" -m "%description%"

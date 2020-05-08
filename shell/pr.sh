while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
  -h | --help | -help | h | help | ?)
    echo "Creates a pull request from the current branch to the master branch."
    echo "Use this script instead of creating PR through the browser"
    echo "because this way the PR will be marked with the correct label and appropriate issue will be linked."
    echo ""
    echo "Usage:  ./$(basename "$0") [-h] [-d] [-m] [--to <issue>]"
    echo "        ./$(basename "$0") open [<issue>]"
    echo "Options:"
    echo "  -h, --help, -help, h, help, ?   - displays this help message"
    echo "  -d, --draft                     - marks newly created pull request as a draft"
    echo "  -m, --master                    - switches you to the master branch after creating a pull request"
    echo "  --to <issue number>             - allows to choose a branch to be merged to by selecting an issue"
    echo "  open [<issue number>]           - opens a webiste with PR associated with the current (or selected) issue"
    exit 0
    ;;
  --to)
    to="$2"
    shift
    shift
    ;;
  -d | --draft)
    draft=-d
    shift
    ;;
  -m | --master)
    master=1
    shift
    ;;
  open)
    [[ -n $2 ]] && open=$2 || open="current"
    shift
    shift
    ;;
  *)
    shift
    ;;
  esac
done

git --version >/dev/null || {
  echo "Nope. Install 'git' first: 'https://git-scm.com/book/en/v2/Getting-Started-Installing-Git'"
  exit 1
}

hub --version >/dev/null || {
  echo "Nope. Install 'hub' first: 'https://github.com/github/hub'"
  exit 1
}

function slugify() {
  local output=$(echo "$1" | awk '{print tolower($0)}')
  output=$(echo "$output" | sed -r "s/'//g" | sed -r "s/[^a-zA-Z0-9-]+/-/g" | sed -r 's/-+/-/g' | sed -r 's/^-+|-+$//g')
  echo $output
}

issueId=$(git rev-parse --abbrev-ref HEAD | rev | cut -d 'i' -f1 | rev)

[[ -n $open ]] && {
  echo "Opening a website with PR"

  [[ "$open" == "current" ]] && open=''
  hub pr show $open

  exit 0
}

issueName=$(hub issue show -f "%t" $issueId)
label=$(hub issue show -f "%L" $issueId)

echo "Creating pull request for issue #$issueId with name '$issueName', labeled: $label"

[[ -n $draft ]] && echo "Marking pull request as a draft"

[[ -n $to ]] && {
  to=$(slugify "$(hub issue show -f %t $to)")-i$to
  echo "Setting base branch to $to"
  to=" --base $to"
}

hub pull-request -l $label -m "$issueName" -m "Close #$issueId" $draft $to 2>/dev/null || {
  echo "We encountered some problems"
  exit 1
}

[[ -n $master ]] && git checkout master
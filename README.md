# Issue-Tracker-for-Github
![Tests](https://github.com/Pawelek99/itg/workflows/Tests/badge.svg) [![npm version](https://badge.fury.io/js/itg.svg)](https://badge.fury.io/js/itg)

---

## Table of contents

* [But what for?](#but-what-for)
* [Description](#description)
  - [Creating a new issue](#creating-a-new-issue)
  - [Creating Pull Requests (PR)](#creating-pull-requests-pr)
* [Dla tych, którym łatwiej po polsku :D](#dla-tych-którym-łatwiej-po-polsku-d)
  - [Ale po co to?](#ale-po-co-to)
  - [Opis](#opis)
    * [Tworzenie nowego zadania (issue)](#tworzenie-nowego-zadania-issue)
    * [Tworzenie Pull Requestów (PR)](#tworzenie-pull-requestów-pr)

---

To install **itg** library just type in the console:

```bash
npm install -g itg
```

Keep in mind that this library will only be useful when installed **globally**.

#### But what for?

It's a collection of methods to help organize and navigate through more complex repositories. It's based on **git** and **hub**. **hub** provides us with methods to create issues or pull requests, but they are not standardized. And multiple styles of branch names, issues without labels or pull requests not closing corresponding issues are something you want to avoid while working with team.

---

## Description

### Creating a new issue

```bash
itg i|issue [-h|--help|h|help|?]
itg i|issue <name> [-b][--from <issue|'master'>][-d]
itg i|issue <name> [-c <label>][--from <issue|'master'>][-d]
itg i|issue open <issue>
```

> Command **i** is used as a synonym of **issue**. Both can be used interchangeably.

This script creates a new issue with the given **&lt;name>**, publishes it on the Github repo and creates a branch with correctly formatted name and finally pushes it.
Sample usages:

- ```bash
  itg i|issue "My first issue"
  ```
  It will create a branch named **my-first-issue-i1** (on the assumption that it is the first issue, otherwise the number **1** will be replaced with the correct one).
  Created issue will be labeled **feature** and assigned to you. Additionally the description of the issue will be populated as follows:
  > Associated branch: [my-first-issue-i1](http://link_to_website_with_branch)
- ```bash
  itg i|issue "My first issue" -b
  itg i|issue "My first issue" --bug
  ```
  It will create an issue as above except this time the label will be set to **bug**.
- ```bash
  itg i|issue "My first issue" -c question
  itg i|issue "My first issue" --custom "help wanted"
  ```
  It will create an issue as above except this time the label will be set to **question** or **help wanted** respectively. Keep in mind that the provided label has to exist in the labels list on Github repo.
- ```bash
  itg i|issue "My first issue" --from master
  itg i|issue "My first issue" --from 2
  ```
  Depending on what is provided as **--from** parameter, the branch will be created based on the **master** branch or the branch associated with the given issue (in this example we used the number **2** thus the branch associated with the issue with id **#2** will be used as a base).
- ```bash
  itg i|issue "My first issue" -d
  itg i|issue "My first issue" --detached
  ```
  This command creates an independent issue. It means that it won't be assigned to anyone and corresponding branch will be only created remotely.
- ```bash
  itg i|issue "My first issue" -c "help wanted" --from master
  itg i|issue --bug --from 31 "My first issue"
  itg i|issue --custom question "My first issue" --from 23
  itg i|issue -d "My first issue" -b
  itg i|issue "My first issue" --detached -c improvement
  ```
  All of the above commands are correct. Order of the options is irrelevant. For every option there is its longer form, for instance **-b** and **--bug**. But for the option **--from** there is no abbreviation.
- ```bash
  itg i|issue open 2
  ```
  This command will pull remote branch associated with the given issue and it will assign this issue it to you.
- ```bash
  itg i|issue ?
  itg i|issue h
  itg i|issue -h
  itg i|issue help
  itg i|issue -help
  itg i|issue --help
  ```
  All of the above examples will produce help message similar to this one.
  If the help option was provided (no matter on what position) the other options will be discarded and ignored.

### Creating Pull Requests (PR)

```bash
itg pr|pull-request [-h|--help|h|help|?]
itg pr|pull-request [-d][-m][-p][--to <issue>]
itg pr|pull-request open [<issue>]
itg pr|pull-request ready [<issue>]
```

> Command **pr** is used as a synonym of **pull-request**. Both can be used interchangeably.

This script creates a Pull Request on the Github repo based on the current branch associated with currently performed issue. Default base branch is set to **master**.
Sample usages:

- ```bash
  itg pr|pull-request
  ```
  It will create a PR with the same labels as the issue associated with the current branch. Additionally the description will be populated with as follows:

  > Close #1

  It will make sure that after closing the PR, the associated issue will be closed as well (as in the example issue issue with id **#1**).
- ```bash
  itg pr|pull-request -d
  itg pr|pull-request --draft
  ```
  It will create a PR as above. Additionally the Pull Request will be marked as a "draft", which indicates that merging will be disabled until the status change. This option is used to put changes under review if you are not sure about them. To change the status back to "open" you have to open a Github website.
- ```bash
  itg pr|pull-request -m
  itg pr|pull-request --master
  ```
  It will create a PR as above. Additionally after the process completed you will be switched to a **master** branch locally just to be able to start another independent issue.
- ```bash
  itg pr|pull-request --to 2
  ```
  It will create a PR as above except this time it will merge to a branch associated with the given issue (as in the example - the issue **#2**) instead of **master** branch.
- ```bash
  itg pr|pull-request -p
  itg pr|pull-request --push
  ```
  It will make sure that all local changes are pushed before creating a PR.
- ```bash
  itg pr|pull-request -d -m
  itg pr|pull-request --to 23 --master -d
  itg pr|pull-request --to 2 --draft
  ```
  All of the above commands are correct. Order of the options is irrelevant. For every option there is its longer form, for instance **-d** and **--draft**. But for the option **--to** there is no abbreviation.
- ```bash
  itg pr|pull-request open
  itg pr|pull-request open 2
  ```
  This command opens a browser on the page corresponding to PR associated with the provided issue (or current if parameter **&lt;issue>** is omitted).
- ```bash
  itg pr|pull-request ready
  itg pr|pull-request ready 2
  ```
  This command marks PR associated with the provided issue (or current if parameter **&lt;issue>** is omitted) as 'ready for review'.
- ```bash
  itg pr|pull-request ?
  itg pr|pull-request h
  itg pr|pull-request -h
  itg pr|pull-request help
  itg pr|pull-request -help
  itg pr|pull-request --help
  ```
  All of the above examples will produce help message similar to this one.
  If the help option was provided (no matter on what position) the other options will be discarded and ignored.

### Dla tych, którym łatwiej po polsku :D

<details><summary>Wersja polska</summary>

---

W celu zainstalowania **itg** należy użyć komendy w konsoli:

```bash
npm install -g itg
```

Pamiętaj o tym, że ta biblioteka będzie użyteczna jedynie zainstalowana globalnie.

#### Ale po co to?

Jest to zbiór metod pozwalających zorganizować bardziej złożone repozytoria i nawigować w nich. Bilbioteka bazuje na **git** oraz na **hub**. **hub** udostępnia metoda, dzięki którym można tworzyć zadania lub pull requesty, natomiast nie są one ustandaryzowane. A wiele różnych styli naz gałęzi, zadania bez etykiet czy pull requesty nie zamykające tyczących się ich zadań to jest coś, co najlepiej unikać w pracy w zespole.

---

## Opis

### Tworzenie nowego zadania (issue)

```bash
itg i|issue [-h|--help|h|help|?]
itg i|issue <name> [-b][--from <issue|'master'>][-d]
itg i|issue <name> [-c <label>][--from <issue|'master'>][-d]
itg i|issue open <issue>
```

> Komenda **i** jest używana jako synonim **issue**. Można używać ich zamiennie.

Skrypt utworzy nowe zadanie o podanej nazwie **&lt;name>**, udostępni je na stronie Github oraz utworzy lokalnie gałąź o sformatowanej nazwie i ją opublikuje.
Przykładowe użycia skryptu:

- ```bash
  itg i|issue "Moje pierwsze zadanie"
  ```
  Spowoduje on utworzenie gałęzi o nazwie **moje-pierwsze-zadanie-i1** (przy założeniu, że to będzie pierwsze zadanie na stronie Github. W innym wypadku liczba **1** zostanie zastąpiona numerem zadania).
  Zadanie to zostanie oznaczone etykietą **feature**, przypisane do Ciebie oraz w opisie tego zadania zostanie umieszczony tekst:
  > Associated branch: [moje-pierwsze-zadanie-i1](http://link_do_strony_z_gałęzią)
- ```bash
  itg i|issue "Moje pierwsze zadanie" -b
  itg i|issue "Moje pierwsze zadanie" --bug
  ```
  Zostanie wykonane to, co powyżej z wyjątkiem ustawienia etykiety. Po użyciu tej komendy, zostanie ona ustawiona na **bug**.
- ```bash
  itg i|issue "Moje pierwsze zadanie" -c question
  itg i|issue "Moje pierwsze zadanie" --custom "help wanted"
  ```
  Zostanie wykonane to, co powyżej z wyjątkiem ustawienia etykiety. Po użyciu tej komendy, zostanie ona ustawiona na **question** lub **help wanted**, w zależności od wprowadzonej nazwy. Należy pamiętać, że dostępne nazwy etykiet to te, które znajdują się w liście etykiet dla repozytorium na stronie Github.
- ```bash
  itg i|issue "Moje pierwsze zadanie" --from master
  itg i|issue "Moje pierwsze zadanie" --from 2
  ```
  W zależności od tego, co zostanie podane jako paramatr dla opcji **--from**, to gałąź zostanie stworzona bazując na gałęzi **master** (jeżeli taka zostanie podana) lub na gałęzi wskazanej przez zadanie z podanym numerem (w przykładzie został użyty numer **2**, to skrypt pobierze informacje na temat tego, jaką gałąź wskazuje to zadanie i użyje ją jako podstawową).
- ```bash
  itg i|issue "Moje pierwsze zadanie" -d
  itg i|issue "Moje pierwsze zadanie" --detached
  ```
  Użycie tej komendy spowoduje stworzenie zadania, które będzie niezależne. Gałąź do niego zostanie jedynie stworzona na Github i nie zostanie ono do nikogo przypisane.
- ```bash
  itg i|issue "Moje pierwsze zadanie" -c "help wanted" --from master
  itg i|issue --bug --from 31 "Moje pierwsze zadanie"
  itg i|issue --custom question "Moje pierwsze zadanie" --from 23
  itg i|issue -d "Moje pierwsze zadanie" -b
  itg i|issue "Moje pierwsze zadanie" --detached -c improvement
  ```
  Wszystkie powyższe użycia są poprawne. Kolejność argumentów nie ma znaczenia. Do każdego z argumentu istnieje jego dłuższa forma, np: **-b** i **--bug**. Natomiast dla argumentu **--from** nie istnieje żaden skrót.
- ```bash
  itg i|issue open 2
  ```
  Powyższa komenda spowoduje pobranie gałęzi związanej z podanym zadaniem oraz przypisanie tego zadania do Ciebie.
- ```bash
  itg i|issue ?
  itg i|issue h
  itg i|issue -h
  itg i|issue help
  itg i|issue -help
  itg i|issue --help
  ```
  Każde z powyższych użyć skryptu spowoduje wyświetlenie pomocy podobnej do tej.
  Jeżeli został podany parametr wyświetlający pomoc (niezależnie od pozycji na, której został wspiany), to wszystkie pozostałe argumenty są pomijane i ignorowane.

### Tworzenie Pull Requestów (PR)

```bash
itg pr|pull-request [-h|--help|h|help|?]
itg pr|pull-request [-d][-m][-p][--to <issue>]
itg pr|pull-request open [<issue>]
itg pr|pull-request readt [<issue>]
```

> Komenda 'pr' jest używana jako synonim 'pull-request'. Można używać ich zamiennie.

Skrypt utworzy Pull Request na stronie Github na podstawie gałęzi tworzonej w ramach obecnie wykonywanego zadania. Domyślną gałęzią, do której będzie łączona ta będzie **master**.
Przykładowe użycia skryptu:

- ```bash
  itg pr|pull-request
  ```
  Zostanie utworzony PR, który będzie miał taką samą etykietę, jak zadanie, które jest wskazywane przez lokalną gałąź, na której obecnie trwają prace. Dodatkowo w opisie PR będzie się znajdował tekst:

  > Close #1

  Spowoduje to, że po zamknięciu Pull Requestu, zostanie również zamknięte zadanie wskazane przez wyżej podany numer (w przykładzie numer **#1**).
- ```bash
  itg pr|pull-request -d
  itg pr|pull-request --draft
  ```
  Zostanie wykonane to, co powyżej. Dodatkowo PR zostanie ustawiona na "w trakcie prac", co będzie oznaczało, że nie będzie możliwości jej połączenia z wybraną gałęzią dopóki ten status się nie zmieni. Jednak używa się tej opcji, aby umożliwić zespołowi przegląd napisane kodu z założeniem, że znajdują się tam rzeczy, których nie jesteśmy pewni. Zmiana statusu odbywa się przez stronę Github.
- ```bash
  itg pr|pull-request -m
  itg pr|pull-request --master
  ```
  Zostanie utworzony PR, jak w przykładzie pierwszym. Dodatkowo po tym lokalnie zostanie zmieniona gałąź na **master** w celu rozpoczęcia kolejnego zadania niezależnie od obecnego.
- ```bash
  itg pr|pull-request --to 2
  ```
  Zostanie utworzony PR, który zamiast podstawową gałąź **master** ustawi gałąź wskazaną przez zadanie z podanym numerem (w przykładzie - **#2**).
- ```bash
  itg pr|pull-request -p
  itg pr|pull-request --push
  ```
  Przed utworzeniem Pull Requestu wszystkie lokalne zmiany zostaną wypchnięte.
- ```bash
  itg pr|pull-request -d -m
  itg pr|pull-request --to 23 --master -d
  itg pr|pull-request --to 2 --draft
  ```
  Wszystkie z powyższych użyć są poprawne. Nie ma znaczenia w jakiej kolejności parametry zostały podane. Do każdego z argumentu istnieje jego dłuższa forma, np: **-d** i **--draft**. Natomiast dla argumentu **--to** nie istnieje żaden skrót.
- ```bash
  itg pr|pull-request open
  itg pr|pull-request open 2
  ```
  Powyższa komenda spowoduje otworzenie przeglądarki na PR powiązanym z obecnie wykonywanym zadaniem (lub wybranym jeśli parametr **&lt;issue>** został pominięty).
- ```bash
  itg pr|pull-request ready
  itg pr|pull-request ready 2
  ```
  Powyższa komenda spowoduje oznaczenie PR powiązanego z obecnie wykonywanym zadaniem (lub wybranym jeśli parametr **&lt;issue>** został pominięty) jako 'ready for review'.
- ```bash
  itg pr|pull-request ?
  itg pr|pull-request h
  itg pr|pull-request -h
  itg pr|pull-request help
  itg pr|pull-request -help
  itg pr|pull-request --help
  ```
  Każde z powyższych użyć skryptu spowoduje wyświetlenie pomocy podobnej do tej.
  Jeżeli został podany parametr wyświetlający pomoc (niezależnie od pozycji na, której został wspiany), to wszystkie pozostałe argumenty są pomijane i ignorowane.
</details>

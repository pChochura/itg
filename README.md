# Issue-Tracker-for-Github

W celu zainstalowania biblioteki należy użyć komendy:

```bash
$ npm install -g itg
```

---

## Opis

### Tworzenie nowego zadania (issue)

```bash
$ itg i|issue [-h|--help|h|help|?]
$ itg i|issue <name> [-b][--from <issue|'master'>][-d]
$ itg i|issue <name> [-c <label>][--from <issue|'master'>][-d]
$ itg i|issue open <issue>
```

> Komenda 'i' jest używana jako synonim 'issue'. Można używać ich zamiennie.

Skrypt utworzy nowe zadanie o podanej nazwie **&lt;name>**, udostępni je na stronie Github oraz utworzy lokalnie gałąź o sformatowanej nazwie i ją opublikuje.
Przykładowe użycia skryptu:

- ```bash
  $ itg i|issue "Moje pierwsze zadanie"
  ```
  Spowoduje on utworzenie gałęzi o nazwie **moje-pierwsze-zadanie-i1** (przy założeniu, że to będzie pierwsze zadanie na stronie Github. W innym wypadku liczba **1** zostanie zastąpiona numerem zadania).
  Zadanie to zostanie oznaczone etykietą **feature**, przypisane do Ciebie oraz w opisie tego zadania zostanie umieszczony tekst:
  > Associated branch: [moje-pierwsze-zadanie-i1](http://link_do_strony_z_gałęzią)
- ```bash
  $ itg i|issue "Moje pierwsze zadanie" -b
  $ itg i|issue "Moje pierwsze zadanie" --bug
  ```
  Zostanie wykonane to, co powyżej z wyjątkiem ustawienia etykiety. Po użyciu tej komendy, zostanie ona ustawiona na **bug**.
- ```bash
  $ itg i|issue "Moje pierwsze zadanie" -c question
  $ itg i|issue "Moje pierwsze zadanie" --custom "help wanted"
  ```
  Zostanie wykonane to, co powyżej z wyjątkiem ustawienia etykiety. Po użyciu tej komendy, zostanie ona ustawiona na **question** lub **help wanted**, w zależności od wprowadzonej nazwy. Należy pamiętać, że dostępne nazwy etykiet to te, które znajdują się w liście etykiet dla repozytorium na stronie Github.
- ```bash
  $ itg i|issue "Moje pierwsze zadanie" --from master
  $ itg i|issue "Moje pierwsze zadanie" --from 2
  ```
  W zależności od tego, co zostanie podane jako paramatr dla opcji **--from**, to gałąź zostanie stworzona bazując na gałęzi **master** (jeżeli taka zostanie podana) lub na gałęzi wskazanej przez zadanie z podanym numerem (w przykładzie został użyty numer **2**, to skrypt pobierze informacje na temat tego, jaką gałąź wskazuje to zadanie i użyje ją jako podstawową).
- ```bash
  $ itg i|issue "Moje pierwsze zadanie" -d
  $ itg i|issue "Moje pierwsze zadanie" --detached
  ```
  Użycie tej komendy spowoduje stworzenie zadania, które będzie niezależne. Gałąź do niego zostanie jedynie stworzona na Github i nie zostanie ono do nikogo przypisane.
- ```bash
  $ itg i|issue "Moje pierwsze zadanie" -c "help wanted" --from master
  $ itg i|issue --bug --from 31 "Moje pierwsze zadanie"
  $ itg i|issue --custom question "Moje pierwsze zadanie" --from 23
  $ itg i|issue -d "Moje pierwsze zadanie" -b
  $ itg i|issue "Moje pierwsze zadanie" --detached -c improvement
  ```
  Wszystkie powyższe użycia są poprawne. Kolejność argumentów nie ma znaczenia. Do każdego z argumentu istnieje jego dłuższa forma, np: **-b** i **--bug**. Natomiast dla argumentu **--from** nie istnieje żaden skrót.
- ```bash
  $ itg i|issue open 2
  ```
  Powyższa komenda spowoduje pobranie gałęzi związanej z podanym zadaniem oraz przypisanie tego zadania do Ciebie.
- ```bash
  $ itg i|issue ?
  $ itg i|issue h
  $ itg i|issue -h
  $ itg i|issue help
  $ itg i|issue -help
  $ itg i|issue --help
  ```
  Każde z powyższych użyć skryptu spowoduje wyświetlenie pomocy podobnej do tej.
  Jeżeli został podany parametr wyświetlający pomoc (niezależnie od pozycji na, której został wspiany), to wszystkie pozostałe argumenty są pomijane i ignorowane.

### Tworzenie Pull Requestów (PR)

```bash
$ itg pr|pull-request [-h|--help|h|help|?]
$ itg pr|pull-request [-d][-m][--to <issue>]
$ itg pr|pull-request open [<issue>]
```

> Komenda 'pr' jest używana jako synonim 'pull-request'. Można używać ich zamiennie.

Skrypt utworzy Pull Request na stronie Github na podstawie gałęzi tworzonej w ramach obecnie wykonywanego zadania. Podstawową gałęzią, do której będzie łączona ta będzie **master**.
Przykładowe użycia skryptu:

- ```bash
  $ itg pr|pull-request.sh
  ```

  Zostanie utworzony PR, który będzie miał taką samą etykietę, jak zadanie, które jest wskazywane przez lokalną gałąź, na której obecnie trwają prace. Dodatkowo w opisie PR będzie się znajdował tekst:

  > Close #1

  Spowoduje to, że po zamknięciu Pull Requestu, zostanie również zamknięte zadanie wskazane przez wyżej podany numer (w przykładzie numer **1**).

- ```bash
  $ itg pr|pull-request -d
  $ itg pr|pull-request --draft
  ```
  Zostanie wykonane to, co powyżej. Dodatkowo PR zostanie ustawiona na "w trakcie prac", co będzie oznaczało, że nie będzie możliwości jej połączenia z wybraną gałęzią dopóki ten status się nie zmieni. Jednak używa się tej opcji, aby umożliwić zespołowi przegląd napisane kodu z założeniem, że znajdują się tam rzeczy, których nie jesteśmy pewni. Zmiana statusu odbywa się przez stronę Github.
- ```bash
  $ itg pr|pull-request -m
  $ itg pr|pull-request --master
  ```
  Zostanie utworzony PR, jak w przykładzie pierwszym. Dodatkowo po tym lokalnie zostanie zmieniona gałąź na **master** w celu rozpoczęcia kolejnego zadania niezależnie od obecnego.
- ```bash
  $ itg pr|pull-request --to 2
  ```
  Zostanie utworzony PR, który zamiast podstawową gałąź **master** ustawi gałąź wskazaną przez zadanie z podanym numerem (w przykładzie **2**).
- ```bash
  $ itg pr|pull-request -d -m
  $ itg pr|pull-request --to 23 --master -d
  $ itg pr|pull-request --to 2 --draft
  ```
  Wszystkie z powyższych użyć są poprawne. Nie ma znaczenia w jakiej kolejności parametry zostały podane. Do każdego z argumentu istnieje jego dłuższa forma, np: **-d** i **--draft**. Natomiast dla argumentu **--to** nie istnieje żaden skrót.
- ```bash
  $ itg pr|pull-request open
  $ itg pr|pull-request open 2
  ```
  Powyższa komenda spowoduje otworzenie przeglądarki na PR powiązanym z obecnie wykonywanym zadaniem (lub wybranym).
- ```bash
  $ itg pr|pull-request ?
  $ itg pr|pull-request h
  $ itg pr|pull-request -h
  $ itg pr|pull-request help
  $ itg pr|pull-request -help
  $ itg pr|pull-request --help
  ```
  Każde z powyższych użyć skryptu spowoduje wyświetlenie pomocy podobnej do tej.
  Jeżeli został podany parametr wyświetlający pomoc (niezależnie od pozycji na, której został wspiany), to wszystkie pozostałe argumenty są pomijane i ignorowane.

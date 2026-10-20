#!/bin/sh
# Local Postgres for development, data in .data/pg, port 5433.
set -e
export LC_ALL=C
PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
D=.data/pg
[ -d "$D" ] || initdb -D "$D" -U postgres --auth=trust --locale=C --encoding=UTF8 >/dev/null
pg_ctl -D "$D" -o "-p 5433 -k /tmp" -l .data/pg.log status >/dev/null 2>&1 || pg_ctl -D "$D" -o "-p 5433 -k /tmp" -l .data/pg.log start
psql -h localhost -p 5433 -U postgres -tc "select 1 from pg_database where datname='alphuette'" | grep -q 1 || createdb -h localhost -p 5433 -U postgres alphuette
echo "DATABASE_URL=postgres://postgres@localhost:5433/alphuette"

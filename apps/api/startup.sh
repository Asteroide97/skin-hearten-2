#!/usr/bin/env bash
set -euo pipefail

# Azure App Service persists application data under /home. One Gunicorn worker
# avoids concurrent SQLite writers while this temporary database is in use.
case "${DATABASE_URL:-}" in
  sqlite:////home/*)
    database_path="${DATABASE_URL#sqlite://}"
    mkdir -p "$(dirname "$database_path")"
    ;;
  *)
    echo "DATABASE_URL must be a SQLite database under /home for this deployment."
    exit 1
    ;;
esac

alembic upgrade head
python scripts/seed_admin.py

exec gunicorn app.main:app \
  -k uvicorn.workers.UvicornWorker \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers "${WEB_CONCURRENCY:-1}"

#!/bin/sh
set -e

# Signal handling must be set up before starting background processes
NEXT_PID=""
WORKER_PID=""

shutdown() {
  echo "Shutting down..."
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null || true
  [ -n "$WORKER_PID" ] && kill "$WORKER_PID" 2>/dev/null || true
  wait
  exit 0
}

trap shutdown SIGTERM SIGINT

if [ "$NODE_ENV" = "production" ] && [ -z "$AUTH_SECRET" ] && [ -z "$NEXTAUTH_SECRET" ]; then
  echo "ERROR: AUTH_SECRET or NEXTAUTH_SECRET must be set in production. Exiting." >&2
  exit 1
fi

echo "Running database migrations..."
if ! npx prisma migrate deploy; then
  echo "ERROR: Database migration failed. Exiting." >&2
  exit 1
fi

echo "Starting Next.js server..."
node server.js &
NEXT_PID=$!

if [ -n "$REDIS_URL" ]; then
  echo "Starting background worker..."
  node worker.js &
  WORKER_PID=$!
fi

wait

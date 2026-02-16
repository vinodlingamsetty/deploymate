#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Next.js server..."
node server.js &
NEXT_PID=$!

if [ -n "$REDIS_URL" ]; then
  echo "Starting background worker..."
  node worker.js &
  WORKER_PID=$!
fi

# Graceful shutdown
shutdown() {
  echo "Shutting down..."
  kill $NEXT_PID 2>/dev/null || true
  [ -n "$WORKER_PID" ] && kill $WORKER_PID 2>/dev/null || true
  wait
  exit 0
}

trap shutdown SIGTERM SIGINT

wait

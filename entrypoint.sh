#!/bin/sh
# Fix ownership of mounted data volume, then drop to non-root user
chown -R appuser:appgroup /app/data
exec su-exec appuser "$@"

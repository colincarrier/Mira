#!/bin/bash
# Kill any process using the specified port
PORT=$1

if [ -z "$PORT" ]; then
  echo "Usage: $0 <port>"
  exit 1
fi

# Find and kill processes using the port
if command -v lsof &> /dev/null; then
  lsof -ti:$PORT | xargs -r kill -9 2>/dev/null
elif command -v netstat &> /dev/null; then
  netstat -tulpn 2>/dev/null | grep :$PORT | awk '{print $7}' | cut -d'/' -f1 | xargs -r kill -9 2>/dev/null
fi

exit 0
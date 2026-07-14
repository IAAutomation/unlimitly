#!/bin/bash
# Keep vite dev server alive — restart if it dies
cd /home/z/my-project/workspace/unlimitly
while true; do
  echo "[$(date)] Starting vite..." >> /tmp/keepalive.log
  bun run dev >> /tmp/dev.log 2>&1
  EXIT=$?
  echo "[$(date)] vite exited with $EXIT — restarting in 3s" >> /tmp/keepalive.log
  sleep 3
done

#!/bin/bash
# Bulletproof keepalive — runs vite, restarts on crash
cd /home/z/my-project/workspace/unlimitly
while true; do
  echo "[$(date)] === Starting vite ===" >> /tmp/keepalive.log
  bun run dev >> /tmp/dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] vite exited with code $EXIT_CODE — restarting in 2s" >> /tmp/keepalive.log
  sleep 2
done

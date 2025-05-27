#!/bin/bash
cd /home/kavia/workspace/code-generation/tetramaster-19143-846d319f/tetramaster_game
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi


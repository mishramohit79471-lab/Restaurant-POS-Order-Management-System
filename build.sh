#!/bin/bash
set -e
cd server && NODE_ENV=development npm install && npx tsc

#!/usr/bin/env bash
# usage: check.sh <dir> ; runs npm ci (clean node_modules), ng build, marker checks
cd /d/tmp/ngx-yeti-21/$1
rm -rf node_modules dist .angular
s=$(date +%s); npm ci >ci.log 2>&1; echo "npm ci exit=$? time=$(( $(date +%s)-s ))s"
ls node_modules/yeti-css/dist 2>&1 | head -3
s=$(date +%s); npx ng build >build.log 2>&1; echo "ng build exit=$? time=$(( $(date +%s)-s ))s"
tail -4 build.log
echo "css marker (yeti.components + .alert):"; rg -c "yeti\.components" dist/base/browser/ --glob "*.css"
echo "js marker (yeti:select):"; rg -c "yeti:select" dist/base/browser/ --glob "*.js"

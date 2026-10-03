#!/usr/bin/env bash
# usage: mk.sh <dir> [dependency-spec]   -> copies base workspace, adds Yeti imports, optionally sets yeti-css dep
set -e
cd /d/tmp/ngx-yeti-21
rm -rf "$1"; mkdir "$1"
(cd base && tar cf - --exclude=node_modules --exclude=.angular --exclude=dist --exclude=package-lock.json .) | (cd "$1" && tar xf -)
cd "$1"
sed -i "s/\"name\": \"base\"/\"name\": \"$1\"/" package.json
printf "@import 'yeti-css/css/components/alert/alert.css';\n" > src/styles.css
sed -i "1i import 'yeti-css/js/tabs.js';" src/main.ts
if [ -n "$2" ]; then
  node -e 'const fs=require("fs");const p=JSON.parse(fs.readFileSync("package.json"));p.dependencies["yeti-css"]=process.argv[1];fs.writeFileSync("package.json",JSON.stringify(p,null,2)+"\n")' "$2"
fi

#!/usr/bin/env bash
# usage: move-pin.sh <sha>  -> replaces ws/vendor/yeti with a copy of the local Yeti clone at <sha>
# (clones from the clone, never builds in it), then reports affected projects and rebuilds.
set -e
ws=/d/tmp/ngx-yeti-22/ws
tmp=/d/tmp/ngx-yeti-22/pin-tmp
rm -rf "$tmp"
git clone -q --no-checkout d:/projects/github/foundation/yeti "$tmp"
git -C "$tmp" checkout -q "$1"
rm -rf "$tmp/.git"
rm -rf "$ws/vendor/yeti"
mv "$tmp" "$ws/vendor/yeti"
cd "$ws"
echo "changed files:"; git status --short | head
echo "affected (uncommitted vs HEAD):"; npx nx show projects --affected --base=HEAD
npx nx build demo --output-style=static 2>&1 | rg "nx run|Cache:" || true

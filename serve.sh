#!/bin/sh
cd "$(dirname "$0")"
echo "预览地址: http://127.0.0.1:4173/"
exec python3 -m http.server 4173

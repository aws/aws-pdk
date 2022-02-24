#!/bin/bash
if [ $SKIP_DOCS ]; then
  echo "Skipping doc generation due to presence of SKIP_DOCS."
  exit 0
fi

###
# Builds a documentation website.
##

rm -rf build
mkdir -p build
cp -R docs build

./scripts/generate-markdown.sh

cd build/docs

if [ ! -d .venv ]; then
  python3 -m venv --system-site-packages .venv
fi
source .venv/bin/activate

python3 -m pip install -r requirements-dev.txt --upgrade

python3 -m mkdocs build -d ../../dist/docs

cd ../..
rm -rf build

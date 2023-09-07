#!/bin/bash
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NO_COLOUR='\033[0m'

printf "`echo $YELLOW`Monthly downloads for AWS PDK\n-----------------------------------------------------------\n\n";

NPM_PKG='@aws/pdk'
PKG_DIR=`npx lerna list --scope $NPM_PKG -l | awk '{ print $3 }'`;
PYTHON_PKG=`cat $PKG_DIR/package.json | jq -r .jsii.targets.python.distName`;

NPM_COUNT=`curl -s https://api.npmjs.org/downloads/range/last-month/$NPM_PKG | jq '[.downloads[].downloads | tonumber] | add'`;
PYPI_COUNT=`curl -s https://pypistats.org/api/packages/$PYTHON_PKG/recent | jq '.data.last_month'`;

[[ "$PYTHON_PKG" == "null" ]] && PYPI_COUNT=0;

printf "$CYAN AWS PDK: $NO_COLOUR$NPM_COUNT (NPM), $PYPI_COUNT (PYPI)\n";
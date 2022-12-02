#!/bin/bash
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NO_COLOUR='\033[0m'

TOTAL_NPM_COUNT=0;
TOTAL_PYPI_COUNT=0;
printf "`echo $YELLOW`Monthly downloads by Package\n-----------------------------------------------------------\n\n";

for NPM_PKG in `npx lerna list`;
do
  PKG_DIR=`npx lerna list --scope $NPM_PKG -l | awk '{ print $3 }'`;
  PYTHON_PKG=`cat $PKG_DIR/package.json | jq -r .jsii.targets.python.distName`;

  NPM_COUNT=`curl -s https://api.npmjs.org/downloads/range/last-month/$NPM_PKG | jq '[.downloads[].downloads | tonumber] | add'`;
  PYPI_COUNT=`curl -s https://pypistats.org/api/packages/$PYTHON_PKG/recent | jq '.data.last_month'`;

  TOTAL_NPM_COUNT=$(($TOTAL_NPM_COUNT + $NPM_COUNT));
  TOTAL_PYPI_COUNT=$(($TOTAL_PYPI_COUNT + $PYPI_COUNT));

  printf "$CYAN$NPM_PKG: $NO_COLOUR$NPM_COUNT (NPM), $PYPI_COUNT (PYPI)\n";
done

printf "$GREEN\nTOTAL: $NO_COLOUR$TOTAL_NPM_COUNT (NPM), $TOTAL_PYPI_COUNT (PYPI) \n";
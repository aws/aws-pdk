#!/bin/bash
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
NO_COLOUR='\033[0m'

TOTAL_COUNT=0;
printf "`echo $YELLOW`Monthly downloads by Package\n-----------------------------------------------------------\n\n";

for PKG in `npx lerna list`;
do
  COUNT=`curl -s https://api.npmjs.org/downloads/range/last-month/$PKG | jq '[.downloads[].downloads | tonumber] | add'`;
  TOTAL_COUNT=$(($TOTAL_COUNT + $COUNT));
  printf "$CYAN$PKG: $NO_COLOUR$COUNT\n";
done

printf "$GREEN\nTOTAL: $NO_COLOUR$TOTAL_COUNT\n";
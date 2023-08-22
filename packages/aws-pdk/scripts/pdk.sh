#!/bin/bash
EXTRA_ARGS=''
if  [ $1 == 'new' ]; then
    EXTRA_ARGS='--from aws-pdk';
fi;

npx --yes projen@latest $@ $EXTRA_ARGS
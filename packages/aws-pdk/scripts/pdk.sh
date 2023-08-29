#!/bin/bash
set -e
SCRIPT_DIR="$( cd -- "$(dirname $([ -L "${BASH_SOURCE[0]:-$0}" ] && readlink -f "${BASH_SOURCE[0]:-$0}" || echo "${BASH_SOURCE[0]:-$0}"))" >/dev/null 2>&1 ; pwd -P )";
$SCRIPT_DIR/exec-command.js $@
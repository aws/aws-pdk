#!/bin/bash

set -e

##
# log messages
log() {
  echo "$@"
}

# Determine which package manager we're using
# Use pnpm if available, otherwise fall back to npm (it's present if you have node)

# NOTES: removed `yarn` option: yarn v2+ has no backwards compatibility and will
# fail to run some of the commands because peer dependencies not found;
# yarn v1 has no significant performance difference from npm/npx
pkg_manager=pnpm
if ! $pkg_manager -v &> /dev/null; then
  pkg_manager=npm
fi

log "package manager :: $pkg_manager"

##
# installs the passed packages with the package manager in use
install_packages() {
  log "installing packages :: $@"

  if [ "$pkg_manager" == "pnpm" ]; then
    $pkg_manager install --reporter=default "$@"
  else
    $pkg_manager install "$@"
  fi
}

##
# runs the passed command with the package manager's proper syntax
run_command() {
  cmd="$@"

  if [ "$pkg_manager" == "pnpm" ]; then
    runner="pnpm exec"
  else
    runner="npx"
  fi

  log "running command $runner $cmd"

  $runner $cmd
}

#!/bin/bash

set -e

# Determine which package manager we're using
# Preference: pnpm > yarn > npm
# Use if available, otherwise fall back to npm so as not to require it as a system-wide dependency
pkg_manager=pnpm
pkg_install_cmd=install
if ! $pkg_manager -v &> /dev/null; then
  pkg_manager=yarn
  pkg_install_cmd=add
  if ! $pkg_manager -v &> /dev/null; then
    pkg_manager=npm
    pkg_install_cmd=install
  fi
fi

# yarn classic vs v2+ have different behavior
# check if it's the classic or later
if [ "$pkg_manager" == "yarn" ]; then
  yarn_version=$(yarn --version)
  yarn_major_version=${yarn_version:0:1}
fi

##
# workaround yarn v2+ needs yarn.lock present for the "add" command
__prepare_tmpdir() {
  if [ "$pkg_manager" == "yarn" ]; then
    if [ "$yarn_major_version" != "1" ]; then
      touch yarn.lock
    fi
  fi
}

##
# installs the passed packages with the package manager in use
install_packages() {
  __prepare_tmpdir
  # yarn2's --silent switch doesn't work, hence >/dev/null
  $pkg_manager $pkg_install_cmd --silent "$@" >/dev/null 2>&1
}

##
# runs the passed command with the package manager's proper syntax
run_command() {
  cmd="$@"

  if [ "$pkg_manager" == "yarn" ]; then
    if [ "$yarn_major_version" == "1" ]; then
      runner="yarn run"
    else
      runner="yarn dlx"
    fi
  elif [ "$pkg_manager" == "pnpm" ]; then
    runner="pnpx"
  else
    runner="npx"
  fi

  $runner $cmd >/dev/null 2>&1
}

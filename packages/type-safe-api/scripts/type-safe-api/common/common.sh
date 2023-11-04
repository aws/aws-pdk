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
# Installs all packages required by all scripts
install_packages() {
  _install_packages \
    typescript@5.0.4 \
    @types/node@20.1.5 \
    ts-node@10.9.1 \
    ts-command-line-args@2.4.2 \
    @redocly/cli@1.0.0-beta.126 \
    reregexp@1.6.1 \
    @faker-js/faker@8.1.0 \
    @openapitools/openapi-generator-cli@2.6.0 \
    lodash@4.17.21 \
    @types/lodash@4.14.197 \
    @apidevtools/swagger-parser@10.1.0 \
    openapi-types@12.1.0 \
    projen@0.73.8
}

##
# installs the passed packages with the package manager in use
_install_packages() {
  log "installing packages :: $@"
  _install_packages_working_dir=`pwd`
  _install_packages_pdk_dir="$HOME/.pdk/$AWS_PDK_VERSION/type-safe-api/$pkg_manager"

  _install_packages_committed_file="$_install_packages_pdk_dir/.committed"

  # Check if we should install the dependencies again
  _install_packages_should_install="true"
  if [ -f $_install_packages_committed_file ]; then
    _install_packages_should_install="false"
  fi

  mkdir -p $_install_packages_pdk_dir
  cd $_install_packages_pdk_dir

  # Install if any packages are missing
  if [ "$_install_packages_should_install" == "true" ]; then
    npm init --yes
    if [ "$pkg_manager" == "pnpm" ]; then
      $pkg_manager install --reporter=default "$@"
    else
      $pkg_manager install "$@"
    fi
  fi

  # Mark that we have installed the dependencies
  touch $_install_packages_committed_file

  # Link all the files/dirs into our target install directory
  ln -s $_install_packages_pdk_dir/* $_install_packages_working_dir/

  cd $_install_packages_working_dir
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

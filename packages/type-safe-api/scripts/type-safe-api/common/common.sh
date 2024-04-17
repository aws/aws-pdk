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
    @asyncapi/cli@1.7.3 \
    @asyncapi/html-template@2.3.2 \
    @asyncapi/markdown-template@1.5.0 \
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
# runs an install command to install the given packages
run_install_command() {
  cmd="$@"

  if [ "$pkg_manager" == "pnpm" ]; then
    runner="$pkg_manager install --reporter=default"
  else
    runner="$pkg_manager install"
  fi

  log "running command $runner $cmd"

  $runner $cmd
}

##
# installs the passed packages with the package manager in use
_install_packages() {
  log "installing packages :: $@"
  _script_dir="$( cd -- "$(dirname $([ -L "${BASH_SOURCE[0]:-$0}" ] && readlink -f "${BASH_SOURCE[0]:-$0}" || echo "${BASH_SOURCE[0]:-$0}"))" >/dev/null 2>&1 ; pwd -P )";
  _install_packages_working_dir=`pwd`
  _install_packages_pdk_base_dir="$HOME/.pdk/$AWS_PDK_VERSION/type-safe-api/$pkg_manager"

  # Use the process id as an identifier for where to install dependencies to avoid race conditions
  _install_dir_identifier=$$

  _install_packages_committed_file="$_install_packages_pdk_base_dir/.committed"

  # Check if we should install the dependencies again
  _install_packages_should_install="true"
  if [ -f $_install_packages_committed_file ]; then
    _install_packages_should_install="false"

    # The .committed file contains the identifier of the directory already installed to
    _install_dir_identifier=$(cat $_install_packages_committed_file)

    log "packages already installed to :: $_install_packages_pdk_base_dir/$_install_dir_identifier"
  fi

  _install_packages_pdk_dir="$_install_packages_pdk_base_dir/$_install_dir_identifier"

  mkdir -p $_install_packages_pdk_dir
  cd $_install_packages_pdk_dir

  # Install if any packages are missing
  if [ "$_install_packages_should_install" == "true" ]; then
    npm init --yes
    cp $_script_dir/.pnpmfile $_install_packages_pdk_dir/.pnpmfile.cjs
    run_install_command "$@"
  fi

  # Mark that we have installed the dependencies (if there's a race and we installed multiple times,
  # the last wins, but whenever there's a .committed file it'll always point to a valid installation)
  echo $_install_dir_identifier > $_install_packages_committed_file

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

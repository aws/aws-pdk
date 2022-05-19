#!/bin/bash

rm -rf samples
rsync -a ../../samples . --include="*/" --include="**/src/**" --include="**/test/**" --include="**/infra/**" --include="**/tests/**" --exclude="*" --prune-empty-dirs
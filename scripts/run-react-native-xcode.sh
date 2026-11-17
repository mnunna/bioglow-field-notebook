#!/usr/bin/env bash

set -euo pipefail

react_native_xcode_script="${PROJECT_ROOT}/node_modules/react-native/scripts/react-native-xcode.sh"
export HERMES_CLI_PATH="${PROJECT_ROOT}/scripts/hermesc-xcode.sh"

if [[ ! -f "$react_native_xcode_script" ]]; then
  echo "error: React Native's iOS bundling script was not found at $react_native_xcode_script" >&2
  exit 1
fi

# React Native intentionally resets Metro's cache for an embedded bundle. Its
# first-run notice begins with `warning:`, which makes Xcode count normal cache
# work as an issue. Relabel only that exact notice on either output stream; all
# real warnings and errors pass through unchanged.
bash "$react_native_xcode_script" \
  > >(sed 's/^warning: Bundler cache is empty, rebuilding/note: Bundler cache is empty, rebuilding/') \
  2> >(sed 's/^warning: Bundler cache is empty, rebuilding/note: Bundler cache is empty, rebuilding/' >&2)

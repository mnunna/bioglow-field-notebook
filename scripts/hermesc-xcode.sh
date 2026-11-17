#!/usr/bin/env bash

set -euo pipefail

hermes_compiler="${PODS_ROOT}/hermes-engine/destroot/bin/hermesc"

if [[ ! -x "$hermes_compiler" ]]; then
  echo "error: Hermes compiler not found at $hermes_compiler" >&2
  exit 1
fi

# React Native supplies these globals at runtime. Hermes otherwise reports each
# reference as an Xcode issue even though the generated bundle is valid.
exec "$hermes_compiler" \
  -Wno-undefined-variable \
  -Wno-direct-eval \
  "$@"

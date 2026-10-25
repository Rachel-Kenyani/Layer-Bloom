#!/bin/sh
# Renders assets/logo.svg to the PNG icons (macOS only).
set -e
cd "$(dirname "$0")/.."
swift tools/render-icons.swift assets/logo.svg assets/icon-128.png 128 assets/icon-32.png 32

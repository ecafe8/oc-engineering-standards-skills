#!/usr/bin/env bash
# 检查 Apple 平台开发工具链。只读,不安装任何东西。
set -u

status=0

check() {
  local name="$1"; shift
  if command -v "$1" >/dev/null 2>&1; then
    printf '[ok]      %-14s %s\n' "$name" "$("$@" 2>/dev/null | head -n 1)"
  else
    printf '[missing] %-14s\n' "$name"
    status=1
  fi
}

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "[warn] 非 macOS 环境:无法构建或运行 Apple 平台测试,只能静态评审。"
  exit 1
fi

check "xcodebuild" xcodebuild -version
check "swift" swift --version
check "swift-format" swift format --version
check "swiftlint" swiftlint version
check "xcbeautify" xcbeautify --version

echo "developer dir: $(xcode-select -p 2>/dev/null || echo unknown)"

if command -v xcrun >/dev/null 2>&1; then
  echo "available simulator runtimes:"
  xcrun simctl list runtimes available 2>/dev/null | sed -n '2,20p'
fi

exit "$status"

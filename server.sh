#!/usr/bin/env bash
# bash server.sh APP_BASE ARCHIVE HEALTH_URL REVISION
set -Eeuo pipefail

app_base=${1:?Absolute application base directory required}
archive=${2:?Release archive required}
health_url=${3:?HTTPS health URL required}
revision=${4:?Revision required}

[[ "$app_base" == /* && "$app_base" != / ]]
[[ "$revision" =~ ^[a-f0-9]{40}$ ]]
for binary in tar curl flock; do command -v "$binary" >/dev/null; done
test -f "$archive"

mkdir -p "$app_base/releases"
app_base=$(cd "$app_base" && pwd -P)
exec 9>"$app_base/deploy.lock"
flock -n 9 || { echo 'Another frontend deployment is running.' >&2; exit 1; }

release="$app_base/releases/$revision"
previous=''
if [[ -L "$app_base/current" ]]; then
  previous=$(readlink -f "$app_base/current")
fi

rm -rf "$release"
mkdir -p "$release"
umask 022
tar -xzf "$archive" -C "$release"
test -f "$release/index.html"
find "$release" -type d -exec chmod 755 {} +
find "$release" -type f -exec chmod 644 {} +

ln -sfn "$release" "$app_base/current.next"
mv -Tf "$app_base/current.next" "$app_base/current"

if ! curl --fail --silent --show-error --connect-timeout 10 --max-time 30 \
  --retry 3 --retry-delay 5 "$health_url" >/dev/null; then
  if [[ -n "$previous" && -d "$previous" ]]; then
    ln -sfn "$previous" "$app_base/current.next"
    mv -Tf "$app_base/current.next" "$app_base/current"
  fi
  echo 'Frontend health check failed; previous release restored.' >&2
  exit 1
fi

printf '%s\n' "$revision" > "$app_base/current-revision"
echo "Frontend deployment verified: $revision"

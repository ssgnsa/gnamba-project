#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
PUBLIC_KEY_INPUT="${1:-}"
RELEASE_USER="egs-release"
RELEASE_GROUP="egs-publisher"
RELEASE_HOME="/var/lib/egs-release"
INCOMING="/var/lib/egs-publisher/incoming"
PUBLISHER="/usr/local/sbin/egs-publisher"
TRUSTED_CI_KEY="/etc/egs-publisher/ci-ed25519.pub"
SUDOERS_FILE="/etc/sudoers.d/egs-publisher-release"

fail() {
  printf 'provision-release-account: %s\n' "$*" >&2
  exit 1
}

[[ "$EUID" -eq 0 ]] || fail "run as root on the production server"
[[ $# -eq 1 && -f "$PUBLIC_KEY_INPUT" && ! -L "$PUBLIC_KEY_INPUT" ]] || \
  fail "usage: sudo $0 /path/to/egs-release.pub"

for command in getent groupadd useradd usermod install ssh-keygen openssl sha256sum \
  visudo id tr grep cat tail wc awk mktemp chmod chown cmp; do
  command -v "$command" >/dev/null 2>&1 || fail "required command missing: $command"
done

if ! ssh-keygen -lf "$PUBLIC_KEY_INPUT" >/dev/null 2>&1; then
  fail "deployment public key is invalid"
fi

new_ci_key="$SCRIPT_DIR/ci-ed25519.pub"
[[ -f "$new_ci_key" && ! -L "$new_ci_key" ]] || fail "CI signing public key missing"
openssl pkey -pubin -in "$new_ci_key" -noout >/dev/null 2>&1 || \
  fail "CI signing public key is invalid"
[[ ! -L "$TRUSTED_CI_KEY" ]] || fail "refusing symlink at $TRUSTED_CI_KEY"
if [[ -e "$TRUSTED_CI_KEY" ]]; then
  old_fingerprint="$(openssl pkey -pubin -in "$TRUSTED_CI_KEY" -outform DER | sha256sum | awk '{print $1}')"
  new_fingerprint="$(openssl pkey -pubin -in "$new_ci_key" -outform DER | sha256sum | awk '{print $1}')"
  [[ "$old_fingerprint" == "$new_fingerprint" ]] || \
    fail "refusing to replace a different trusted CI signing key"
fi

[[ ! -L "$INCOMING" ]] || fail "refusing symlink at $INCOMING"
[[ ! -L /var/lib/egs-publisher ]] || fail "refusing symlink at /var/lib/egs-publisher"
[[ ! -L /etc/egs-publisher ]] || fail "refusing symlink at /etc/egs-publisher"
[[ ! -L "$PUBLISHER" ]] || fail "refusing symlink at $PUBLISHER"
[[ ! -L "$SUDOERS_FILE" ]] || fail "refusing symlink at $SUDOERS_FILE"
sudoers_tmp="$(mktemp /etc/sudoers.d/.egs-publisher-release.XXXXXX)"
publisher_tmp=""
sudoers_created=false
cleanup() { rm -f -- "$sudoers_tmp" "${publisher_tmp:-}"; }
trap cleanup EXIT
printf '%s\n' \
  "$RELEASE_USER ALL=(root) NOPASSWD: NOSETENV: $PUBLISHER publish-pending" \
  > "$sudoers_tmp"
chmod 0440 "$sudoers_tmp"
visudo -c -f "$sudoers_tmp" >/dev/null || fail "invalid release sudoers rule"
visudo -c >/dev/null || fail "existing sudoers configuration is invalid"
if [[ -e "$SUDOERS_FILE" ]] && ! cmp -s "$sudoers_tmp" "$SUDOERS_FILE"; then
  fail "$SUDOERS_FILE already exists with different contents"
fi

if ! getent group "$RELEASE_GROUP" >/dev/null; then
  groupadd --system "$RELEASE_GROUP"
fi

if getent passwd "$RELEASE_USER" >/dev/null; then
  [[ "$(id -nG "$RELEASE_USER")" == "$RELEASE_GROUP" ]] || \
    fail "$RELEASE_USER already exists with unexpected group membership"
else
  useradd --system --gid "$RELEASE_GROUP" --create-home \
    --home-dir "$RELEASE_HOME" --shell /bin/bash "$RELEASE_USER"
fi

account_record="$(getent passwd "$RELEASE_USER")"
IFS=: read -r _ _ _ _ _ account_home account_shell <<< "$account_record"
[[ "$account_home" == "$RELEASE_HOME" ]] || fail "$RELEASE_USER home must be $RELEASE_HOME"
[[ ! -L "$RELEASE_HOME" ]] || fail "refusing symlink at $RELEASE_HOME"
[[ "$account_shell" != */nologin && "$account_shell" != */false ]] || \
  fail "$RELEASE_USER needs a shell for the restricted publisher command"
if id -nG "$RELEASE_USER" | tr ' ' '\n' | grep -Fxq docker; then
  fail "$RELEASE_USER must not belong to the docker group"
fi

usermod -a -G "$RELEASE_GROUP" "$RELEASE_USER"
getent passwd soma >/dev/null || fail "administrator account soma is missing"
usermod -a -G "$RELEASE_GROUP" soma
[[ "$(id -nG "$RELEASE_USER")" == "$RELEASE_GROUP" ]] || \
  fail "$RELEASE_USER must have only the $RELEASE_GROUP group"

ssh_dir="$RELEASE_HOME/.ssh"
authorized_keys="$ssh_dir/authorized_keys"
[[ ! -L "$ssh_dir" ]] || fail "refusing symlink at $ssh_dir"
install -d -o "$RELEASE_USER" -g "$RELEASE_GROUP" -m 0700 "$ssh_dir"
[[ ! -L "$authorized_keys" ]] || fail "refusing symlink at $authorized_keys"
if [[ ! -e "$authorized_keys" ]]; then
  install -o "$RELEASE_USER" -g "$RELEASE_GROUP" -m 0600 /dev/null "$authorized_keys"
fi
key_line="$(cat -- "$PUBLIC_KEY_INPUT")"
[[ "$key_line" != *$'\n'* && -n "$key_line" ]] || fail "provide exactly one SSH public key line"
[[ "$key_line" =~ ^ssh-ed25519[[:space:]] ]] || fail "expected an Ed25519 SSH public key"
key_line="restrict $key_line"
if ! grep -Fqx -- "$key_line" "$authorized_keys"; then
  if [[ -s "$authorized_keys" ]] && [[ -n "$(tail -c 1 "$authorized_keys")" ]]; then
    printf '\n' >> "$authorized_keys"
  fi
  printf '%s\n' "$key_line" >> "$authorized_keys"
fi
chown "$RELEASE_USER:$RELEASE_GROUP" "$authorized_keys"
chmod 0600 "$authorized_keys"

install -d -o root -g "$RELEASE_GROUP" -m 2770 "$INCOMING"
chown root:"$RELEASE_GROUP" "$INCOMING"
chmod 2770 "$INCOMING"

install -d -o root -g root -m 0755 /etc/egs-publisher
install -o root -g root -m 0644 "$new_ci_key" "$TRUSTED_CI_KEY"
publisher_tmp="$(mktemp /usr/local/sbin/.egs-publisher.XXXXXX)"
install -o root -g root -m 0750 "$SCRIPT_DIR/egs-publisher" "$publisher_tmp"
mv -f -- "$publisher_tmp" "$PUBLISHER"

if [[ -e "$SUDOERS_FILE" ]]; then
  :
else
  install -o root -g root -m 0440 "$sudoers_tmp" "$SUDOERS_FILE"
  sudoers_created=true
fi
if ! visudo -c >/dev/null; then
  if [[ "$sudoers_created" == true ]]; then
    rm -f -- "$SUDOERS_FILE"
  fi
  fail "full sudoers validation failed; removed the new release rule"
fi

printf 'Provisioned %s (groups: %s); no CI private key was installed.\n' \
  "$RELEASE_USER" "$(id -nG "$RELEASE_USER")"
printf 'Inbox: %s\nPublisher: %s\nSudoers: %s\n' \
  "$INCOMING" "$PUBLISHER" "$SUDOERS_FILE"

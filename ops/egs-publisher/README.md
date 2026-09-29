# EGS atomic frontend publisher

This directory contains the source for the narrowly scoped privileged publisher. It is not installed by this repository, and this documentation does not authorize a production publish.

## Trust prerequisites

The publisher accepts only an uncompressed PAX tar plus a detached Ed25519 attestation and signature. The attestation binds the archive SHA-256, `VERSION.json` SHA-256, commit, artifact hash, successful `release:check`, `validate:frontend`, frontend test, and production dependency audit gates, and CI run identifier.

Create the Ed25519 key pair in the trusted CI/security environment, not on the production server and not in Git:

```sh
umask 077
openssl genpkey -algorithm Ed25519 -out ci-ed25519-private.pem
openssl pkey -in ci-ed25519-private.pem -pubout -out ci-ed25519.pub
```

Store the private key only in the CI secret store. Keep `ci-ed25519.pub` as the public trust anchor and install it root-owned at `/etc/egs-publisher/ci-ed25519.pub`. Do not copy the private key to `gnamba-server` or commit it.

The manual signing workflow runs lint, typecheck, frontend tests, production dependency audit, `release:check`, and `validate:frontend` in clean CI workspaces, creates and signs the package with `scripts/package-frontend-release.py`, and uploads the signed request as a CI artifact. It does not transfer the request to the server or call the publisher. The existing Docker deployment job is not this static-release pipeline.

## Package generation

The package script uses the fixed repository `dist/` directory and refuses symlinks, special files, `llms.txt`, `SHA256SUMS`, invalid production metadata, a dirty workspace, or an index hash mismatch. It runs the release check, frontend validation, frontend tests, and production dependency audit before creating output.

Provide the private key through `EGS_RELEASE_SIGNING_KEY_FILE`; set `EGS_RELEASE_OUTPUT` to a new empty directory for each run. Output consists of:

```text
<request-id>.tar
<request-id>.json
<request-id>.sig
```

The detached attestation and signature stay in staging and are not part of the published release.

## Server installation

After the CI public key exists and has been reviewed, an administrator installs the source and public key:

```sh
sudo install -o root -g root -m 0750 \
  ops/egs-publisher/egs-publisher /usr/local/sbin/egs-publisher
sudo install -o root -g root -m 0644 \
  ops/egs-publisher/ci-ed25519.pub /etc/egs-publisher/ci-ed25519.pub
sudo visudo -c
```

The incoming directory contains one request at a time. A publish request uses matching `<32 lowercase hex>.tar`, `.json`, and `.sig` files. A rollback request is a `<32 lowercase hex>.rollback` file containing one retained release ID and a newline. The wrapper removes the consumed request files after success or failure. The caller must stage files atomically (write `.part`, then rename to the final request name).

Only these sudoers commands are expected:

```sudoers
soma ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/egs-publisher publish-pending, /usr/local/sbin/egs-publisher rollback-pending
```

## Operational boundaries

- Publisher work and unpacking occur in root-only staging. The release is renamed into `releases/` only after validation.
- Before publication, the publisher proves that the current release is the release resolved by host `current` and container `current`, that `egs-web` has the exact read-only `/var/www/egs` bind mount and loopback-only port mapping, and that host Nginx proxies the named site to `127.0.0.1:8080`.
- The publisher compares SHA-256 for `index.html`, `VERSION.json`, and every entry JS/CSS asset at the release, inside `egs-web`, and in bytes fetched through the host Nginx origin. A mismatch blocks the switch.
- `current` is switched with an atomic symlink replacement. The same SHA-256 proof then runs, followed by the `egs-web` Docker health check, API v1 health, and an unauthenticated `/api/v1/auth/me` check that must return 401. If any check fails, the publisher restores the prior `current`, verifies the prior release and application checks again, and reports failure. No Nginx reload is needed.
- A manual rollback is reported successful only after the target release passes the same delivery and application proofs. If either proof fails, the former `current` is restored and verified.
- New releases are root-owned and not writable by `soma`.
- Retention keeps the active release and five prior publisher-managed releases. Historical directories outside the publisher naming format are not automatically deleted.
- `llms.txt` and `SHA256SUMS` are rejected from new archives and are not generated, copied, or deleted by this publisher.
- A retention error after a successful, verified switch is reported as a warning; it does not revert `current`.

## Current state

The sudoers entry and server directories may be provisioned separately, but this source and CI trust key still require administrator installation. Do not call the publisher until the CI signing pipeline and root-owned public key are configured.

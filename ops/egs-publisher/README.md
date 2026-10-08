# EGS atomic frontend publisher

This directory contains the source for the narrowly scoped privileged publisher. It is not installed by this repository, and this documentation does not authorize a production publish.

## Trust prerequisites

The publisher accepts only an uncompressed PAX tar plus a detached Ed25519 attestation and signature. The attestation binds the archive SHA-256, `VERSION.json` SHA-256, commit, artifact hash, successful `release:check` and `validate:frontend` gates, and CI run identifier.

Create the Ed25519 key pair in the trusted CI/security environment, not on the production server and not in Git:

```sh
umask 077
openssl genpkey -algorithm Ed25519 -out ci-ed25519-private.pem
openssl pkey -in ci-ed25519-private.pem -pubout -out ci-ed25519.pub
```

Store the private key only in the CI secret store. Keep `ci-ed25519.pub` as the public trust anchor and install it root-owned at `/etc/egs-publisher/ci-ed25519.pub`. Do not copy the private key to `gnamba-server` or commit it.

## EGS Controlled Deployment

The `Build and Deploy` workflow performs build, lint, typecheck, frontend tests, frontend artifact validation, backend tests, disposable PostgreSQL migration validation, and container/Compose validation on CI events. Production publication is separate: it is available only through `workflow_dispatch` on `main` or `master`, and `publish_frontend` defaults to `false`. The protected GitHub `production` environment must approve the job before its secrets become available.

Before exposing any production signing/SSH secret, the publish job checks out `github.sha`, verifies the origin, branch/ref, clean worktree, gates, Gate 5, and downloaded `dist/` manifest in `ops/deploy/controller.sh --dry-run`. The signing key is exposed only to the package-signing step after this preflight; the signed archive is revalidated against the checked-out SHA and the trusted public key before any SSH credentials are made available. The last controller authorization step also validates the presence and format of the SSH settings. Only then does CI transfer a signed request over pinned SSH host keys and call `/usr/local/sbin/egs-publisher publish-pending` as `egs-release`. It never copies files directly into `current`.

### Gates

| Gate | Condition | Action if FAIL | Action if PASS |
| --- | --- | --- | --- |
| D1 Source | Manual dispatch, approved branch, expected immutable SHA, matching repository/origin, clean checkout | HOLD before secrets | Continue preflight |
| D2 Frontend | `npm ci`, lint, typecheck, tests, build, artifact validation and controller tests | Stop workflow | Upload validated `dist/` artifact |
| D3 Backend | Backend tests and Alembic history/check against a disposable `egs_test` PostgreSQL service, with the existing `uuid-ossp` prerequisite enabled | Stop workflow; no production DB is touched | Continue |
| D4 Containers | Docker image builds and canonical Compose configuration validation | Stop workflow | Continue |
| D5 Signature | `VERSION.json`, archive/attestation hashes, expected SHA/ref and Ed25519 signature match | HOLD before SSH | Permit publish authorization |
| D6 Gate 5 | `EGS_GATE5_STATUS` is exactly `PASS` | HOLD; missing/empty/unknown values are failure | Continue to protected-environment review |
| Production | `publish_frontend=true`, environment approval, validated dedicated SSH secrets | HOLD; no publication | Invoke only the signed atomic publisher |
| Smoke | Public frontend/version/asset and existing `/api/v1/health` checks pass | Deployment job fails; investigate and use the operator rollback procedure if safe | Record SHA, release request and attested artifact hash |

Production is **HOLD by default**. Leave `EGS_GATE5_STATUS` unset or set to `HOLD` until backup verification, PostgreSQL restore proof, SHA-256 integrity, off-server encrypted copy, recovery test, and rollback readiness have all been reviewed. Do not set it to `PASS` to bypass missing evidence. A dry-run performs no publication, symlink change, migration, or release deletion:

```sh
bash ops/deploy/controller.sh \
  --environment production \
  --ref <40-character-git-sha> \
  --artifact-dir dist \
  --dry-run
python3 ops/deploy/test_controller.py
```

Staging rollout, backend deployment, and production Alembic migrations remain disabled because no reviewed operational target/procedure is defined. `alembic upgrade head` and `alembic check` in CI operate only on a disposable PostgreSQL service.

## Production environment configuration

Configure these values only in the GitHub `production` environment. The publishing job fails before connecting when any required value is absent:

- `EGS_PUBLISH_HOST`: production SSH host.
- `EGS_PUBLISH_PORT`: SSH port; defaults to `2222` when omitted.
- `EGS_PUBLISH_USER`: must be `egs-release`, a dedicated account outside the `docker` group.
- `EGS_PUBLISH_SSH_PRIVATE_KEY`: SSH private key for `egs-release`; never reuse `soma`'s key.
- `EGS_PUBLISH_KNOWN_HOSTS`: administrator-verified OpenSSH `known_hosts` entry for the exact host and port. The workflow enforces `StrictHostKeyChecking`; it does not call `ssh-keyscan`.

Provision `egs-release` as a system account with no membership in `docker`, a dedicated SSH key, and only the publisher's `publish-pending` sudo command. The inbox must be owned by `root:egs-publisher` with mode `2770`; the publisher validates that exact owner, group, and mode. Keep the Ed25519 release signing key separate from the SSH key. Do not enable the workflow input until the account, key, inbox, sudoers rule, publisher, root-owned CI signing public key, and environment values have all been verified.

## Package generation

The package script uses the fixed repository `dist/` directory and refuses symlinks, special files, `llms.txt`, `SHA256SUMS`, invalid production metadata, a dirty workspace, or an index hash mismatch. It runs the two validation commands before creating output.

Provide the private key through `EGS_RELEASE_SIGNING_KEY_FILE`; set `EGS_RELEASE_OUTPUT` to a new empty directory for each run. Output consists of:

```text
<request-id>.tar
<request-id>.json
<request-id>.sig
```

The detached attestation and signature stay in staging and are not part of the published release.

## Server installation

Generate a dedicated SSH key pair for CI in a trusted admin environment. Store only the private key in the GitHub `production` environment. Transfer its public `.pub` file to the server through the approved administrator channel, then run this script from the reviewed release checkout:

```sh
sudo bash ops/egs-publisher/provision-release-account.sh /path/to/egs-release.pub
```

The script installs the publisher and signing public key, creates the system group and `egs-release` account when absent, preserves existing authorized keys while adding the new key, configures the inbox as `root:egs-publisher` mode `2770`, and adds a separate sudoers rule for `publish-pending`. It refuses an account with any group beyond `egs-publisher`, refuses to replace a different signing trust key, and validates sudoers. It adds `soma` to the inbox group so the existing administrator upload path remains available; rollback stays reserved for `soma`.

After provisioning, verify `id egs-release` lists only `egs-publisher`, verify the inbox owner/group/mode, and confirm key-only SSH and the narrow sudo command before adding the GitHub environment values. The script must run against a reviewed, clean commit; it has not been run on production from this workspace.

The incoming directory contains one request at a time. A publish request uses matching `<32 lowercase hex>.tar`, `.json`, and `.sig` files. A rollback request is a `<32 lowercase hex>.rollback` file containing one retained release ID and a newline. The wrapper removes the consumed request files after success or failure. The caller must stage files atomically (write `.part`, then rename to the final request name).

Only these sudoers commands are expected:

```sudoers
soma ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/egs-publisher publish-pending, /usr/local/sbin/egs-publisher rollback-pending
egs-release ALL=(root) NOPASSWD: NOSETENV: /usr/local/sbin/egs-publisher publish-pending
```

## Operational boundaries

- Publisher work and unpacking occur in root-only staging. The release is renamed into `releases/` only after validation.
- `current` is switched with an atomic symlink replacement. No Nginx reload is needed.
- The publisher lock at `/var/lib/egs-publisher/work/publisher.lock` serializes publish and rollback operations; the controller does not add a competing lock.
- New releases are root-owned and not writable by `soma` or `egs-release`.
- Retention keeps the active release and five prior publisher-managed releases. Historical directories outside the publisher naming format are not automatically deleted.
- `llms.txt` and `SHA256SUMS` are rejected from new archives and are not generated, copied, or deleted by this publisher.
- A retention error after a successful switch is reported as a warning; it does not revert `current`.
- Frontend rollback is not a database rollback. Retained frontend releases can be restored only through the publisher's approved operator rollback path; `egs-release` is not granted `rollback-pending`. A smoke-test failure stops the workflow and requires operator assessment; CI does not guess whether an application rollback is safe.

## Current state

The server has the publisher binary and matching root-owned signing public key. It does not yet have the `egs-release` account/group or the required `root:egs-publisher` mode-2770 inbox; its current inbox is `soma:soma` mode 0700. The publisher source and workflow changes in this worktree are not installed or pushed. Do not enable a production publish until an administrator provisions the dedicated account and validates the updated publisher, then configures the GitHub production environment.

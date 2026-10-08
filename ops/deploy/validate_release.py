#!/usr/bin/env python3
"""Validate the built frontend and, when required, its signed release request."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import stat
import subprocess
import sys
import tarfile
from pathlib import Path

HEX256 = re.compile(r"^[a-f0-9]{64}$")
HEX40 = re.compile(r"^[a-f0-9]{40}$")
REQUEST_ID = re.compile(r"^[a-f0-9]{32}$")


def fail(message: str) -> None:
    raise ValueError(message)


def hash_dist(dist: Path) -> str:
    digest = hashlib.sha256()
    paths = sorted(path for path in dist.rglob("*") if path.is_file() and path.name != "VERSION.json")
    for path in paths:
        relative = path.relative_to(dist).as_posix()
        digest.update(relative.encode())
        digest.update(b"\0file\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def verify(dist: Path, release_dir: Path, expected_sha: str, expected_ref: str, require_signature: bool) -> None:
    if dist.is_symlink() or not dist.is_dir():
        fail("dist must be a real directory")
    for path in dist.rglob("*"):
        info = path.lstat()
        if not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
            fail(f"dist contains a symlink or special file: {path.relative_to(dist)}")
    index = dist / "index.html"
    assets = dist / "assets"
    version_file = dist / "VERSION.json"
    if not index.is_file() or not assets.is_dir() or not any(item.is_file() for item in assets.rglob("*")):
        fail("dist must contain index.html and non-empty assets/")
    version_bytes = version_file.read_bytes()
    version = json.loads(version_bytes)
    if not isinstance(version, dict):
        fail("VERSION.json must be a JSON object")
    if version.get("application") != "EGS ERP" or version.get("environment") != "production":
        fail("VERSION.json is not a production EGS build")
    if version.get("git_commit") != expected_sha or version.get("git_ref") != expected_ref:
        fail("VERSION.json commit or ref does not match the workflow checkout")
    expected_branch = expected_ref.removeprefix("refs/heads/")
    if version.get("branch") != expected_branch:
        fail("VERSION.json branch does not match the workflow ref")
    if version.get("workspace_dirty") is not False:
        fail("VERSION.json reports a dirty build workspace")
    for key in ("workspace_hash", "artifact_hash", "build_hash"):
        if not isinstance(version.get(key), str) or not HEX256.fullmatch(version[key]):
            fail(f"VERSION.json {key} is missing or invalid")
    if hashlib.sha256(index.read_bytes()).hexdigest() != version["build_hash"]:
        fail("VERSION.json build_hash does not match index.html")
    if hash_dist(dist) != version["artifact_hash"]:
        fail("VERSION.json artifact_hash does not match dist/")

    files = [path for path in release_dir.iterdir()] if release_dir.exists() else []
    if not require_signature and not files:
        return
    if release_dir.is_symlink() or not release_dir.is_dir():
        fail("signed release directory is missing or invalid")
    archives = [path for path in files if path.suffix == ".tar"]
    manifests = [path for path in files if path.suffix == ".json"]
    signatures = [path for path in files if path.suffix == ".sig"]
    if len(files) != 3 or len(archives) != 1 or len(manifests) != 1 or len(signatures) != 1:
        fail("signed release must contain exactly one matching .tar, .json, and .sig")
    request_id = archives[0].stem
    if not REQUEST_ID.fullmatch(request_id) or manifests[0].stem != request_id or signatures[0].stem != request_id:
        fail("signed release filenames do not identify one valid request")

    attestation_bytes = manifests[0].read_bytes()
    attestation = json.loads(attestation_bytes)
    if not isinstance(attestation, dict):
        fail("attestation must be a JSON object")
    archive_hash = hashlib.sha256(archives[0].read_bytes()).hexdigest()
    if attestation.get("schema") != 1 or attestation.get("type") != "egs-frontend-release":
        fail("unsupported attestation schema")
    if attestation.get("archive_sha256") != archive_hash:
        fail("attestation archive hash mismatch")
    if attestation.get("version_json_sha256") != hashlib.sha256(version_bytes).hexdigest():
        fail("attestation VERSION.json hash mismatch")
    if attestation.get("git_commit") != expected_sha or attestation.get("artifact_hash") != version["artifact_hash"]:
        fail("attestation release identity mismatch")
    if attestation.get("branch") != expected_branch or attestation.get("git_ref") != expected_ref:
        fail("attestation branch or ref does not match the workflow ref")
    if attestation.get("release_check") is not True or attestation.get("frontend_validation") is not True:
        fail("attestation does not record the required frontend gates")
    if not str(attestation.get("workflow_run", "")).strip():
        fail("attestation workflow run is missing")

    public_key = Path(__file__).resolve().parents[1] / "egs-publisher" / "ci-ed25519.pub"
    if not public_key.is_file() or public_key.is_symlink():
        fail("trusted CI public key is missing")
    result = subprocess.run(
        ["/usr/bin/openssl", "pkeyutl", "-verify", "-pubin", "-inkey", str(public_key),
         "-rawin", "-in", str(manifests[0]), "-sigfile", str(signatures[0])],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    if result.returncode:
        fail("CI release signature verification failed")
    try:
        with tarfile.open(archives[0], "r:") as archive:
            member = archive.extractfile("VERSION.json")
            if member is None or member.read() != version_bytes:
                fail("signed archive VERSION.json does not match dist/")
    except (OSError, KeyError, tarfile.TarError) as exc:
        fail(f"signed archive cannot be read: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dist", type=Path, required=True)
    parser.add_argument("--release-dir", type=Path, required=True)
    parser.add_argument("--expected-sha", required=True)
    parser.add_argument("--expected-ref", required=True)
    parser.add_argument("--require-signature", action="store_true")
    args = parser.parse_args()
    try:
        if not HEX40.fullmatch(args.expected_sha):
            fail("expected SHA must be a full 40-character Git commit")
        verify(args.dist, args.release_dir, args.expected_sha, args.expected_ref, args.require_signature)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"[egs-release-validator] HOLD: {exc}", file=sys.stderr)
        return 1
    print("[egs-release-validator] PASS: frontend metadata and artifact identity verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

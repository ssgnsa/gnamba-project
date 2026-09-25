#!/usr/bin/env python3
"""Build a signed, frontend-only artifact for the EGS OPS publisher."""

from __future__ import annotations

import hashlib
import json
import os
import re
import secrets
import stat
import subprocess
import sys
import tarfile
from pathlib import Path, PurePosixPath


ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
MAX_ARCHIVE = 100 * 1024 * 1024
MAX_FILE = 64 * 1024 * 1024
MAX_EXPANDED = 256 * 1024 * 1024
MAX_MEMBERS = 5000
HEX256 = re.compile(r"^[a-f0-9]{64}$")
GIT_COMMIT = re.compile(r"^[a-f0-9]{40,64}$")


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def run_gate(command: list[str]) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def safe_files() -> tuple[list[Path], int]:
    if not DIST.is_dir() or DIST.is_symlink():
        raise RuntimeError("dist/ must be a real directory")
    files: list[Path] = []
    expanded = 0
    for path in sorted(DIST.rglob("*")):
        relative = path.relative_to(DIST).as_posix()
        info = path.lstat()
        if path.is_symlink() or not (stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode)):
            raise RuntimeError(f"unsupported artifact entry: {relative}")
        if path.name in ("llms.txt", "SHA256SUMS"):
            raise RuntimeError(f"excluded file found in dist/: {relative}")
        pure = PurePosixPath(relative)
        if pure.is_absolute() or any(part in ("", ".", "..") for part in pure.parts):
            raise RuntimeError(f"unsafe artifact path: {relative}")
        if len(pure.parts) > 16 or len(relative.encode("utf-8")) > 240:
            raise RuntimeError(f"artifact path exceeds limits: {relative}")
        if stat.S_ISREG(info.st_mode):
            if info.st_size > MAX_FILE:
                raise RuntimeError(f"artifact file exceeds limit: {relative}")
            expanded += info.st_size
            files.append(path)
        if expanded > MAX_EXPANDED or len(files) > MAX_MEMBERS:
            raise RuntimeError("frontend artifact exceeds publisher limits")
    if len(files) == 0 or not (DIST / "index.html").is_file() or not (DIST / "VERSION.json").is_file():
        raise RuntimeError("dist/ must contain index.html, VERSION.json and frontend files")
    if not any(path.relative_to(DIST).parts[0] == "assets" for path in files if len(path.relative_to(DIST).parts) > 1):
        raise RuntimeError("dist/assets/ must contain frontend assets")
    return files, expanded


def main() -> int:
    try:
        key_file = os.environ.get("EGS_RELEASE_SIGNING_KEY_FILE")
        if not key_file:
            raise RuntimeError("EGS_RELEASE_SIGNING_KEY_FILE must point to the CI Ed25519 private key")
        key_path = Path(key_file)
        key_info = key_path.lstat()
        if not stat.S_ISREG(key_info.st_mode) or key_info.st_mode & 0o077:
            raise RuntimeError("CI signing key must be a regular file with mode 0600 or stricter")

        run_gate(["npm", "run", "release:check"])
        run_gate(["npm", "run", "validate:frontend"])
        files, _ = safe_files()
        version_bytes = (DIST / "VERSION.json").read_bytes()
        version = json.loads(version_bytes)
        if not isinstance(version, dict):
            raise RuntimeError("VERSION.json must contain an object")
        commit = version.get("git_commit")
        artifact_hash = version.get("artifact_hash")
        build_hash = version.get("build_hash")
        if version.get("application") != "EGS ERP" or version.get("environment") != "production":
            raise RuntimeError("VERSION.json is not an EGS production build")
        if version.get("workspace_dirty") is not False:
            raise RuntimeError("signed frontend releases require a clean CI workspace")
        if not isinstance(commit, str) or not GIT_COMMIT.fullmatch(commit):
            raise RuntimeError("VERSION.json git_commit is invalid")
        head = subprocess.run(
            ["git", "rev-parse", "--verify", "HEAD"], cwd=ROOT,
            check=True, capture_output=True, text=True,
        ).stdout.strip()
        if commit != head:
            raise RuntimeError("VERSION.json git_commit does not match the CI checkout")
        if not isinstance(artifact_hash, str) or not HEX256.fullmatch(artifact_hash):
            raise RuntimeError("VERSION.json artifact_hash is invalid")
        if not isinstance(build_hash, str) or not HEX256.fullmatch(build_hash):
            raise RuntimeError("VERSION.json build_hash is invalid")
        if sha256_file(DIST / "index.html") != build_hash:
            raise RuntimeError("VERSION.json build_hash does not match index.html")

        request_id = secrets.token_hex(16)
        output = Path(os.environ.get("EGS_RELEASE_OUTPUT", "/tmp/egs-frontend-release"))
        output.mkdir(mode=0o700, parents=True, exist_ok=False)
        archive_path = output / f"{request_id}.tar"
        attestation_path = output / f"{request_id}.json"
        signature_path = output / f"{request_id}.sig"

        with tarfile.open(archive_path, mode="w:", format=tarfile.PAX_FORMAT) as archive:
            for path in sorted(DIST.rglob("*"), key=lambda entry: entry.relative_to(DIST).as_posix()):
                relative = path.relative_to(DIST).as_posix()
                info = path.lstat()
                tar_info = tarfile.TarInfo(relative + ("/" if stat.S_ISDIR(info.st_mode) else ""))
                tar_info.uid = tar_info.gid = 0
                tar_info.uname, tar_info.gname = "root", "root"
                tar_info.mtime = 0
                tar_info.mode = 0o755 if stat.S_ISDIR(info.st_mode) else 0o644
                if stat.S_ISDIR(info.st_mode):
                    tar_info.type = tarfile.DIRTYPE
                    archive.addfile(tar_info)
                else:
                    tar_info.type = tarfile.REGTYPE
                    tar_info.size = info.st_size
                    with path.open("rb") as stream:
                        archive.addfile(tar_info, stream)
        if archive_path.stat().st_size > MAX_ARCHIVE:
            raise RuntimeError("frontend archive exceeds 100 MiB")

        attestation = {
            "schema": 1,
            "type": "egs-frontend-release",
            "archive_sha256": sha256_file(archive_path),
            "version_json_sha256": hashlib.sha256(version_bytes).hexdigest(),
            "git_commit": commit,
            "artifact_hash": artifact_hash,
            "release_check": True,
            "frontend_validation": True,
            "workflow_run": os.environ.get("GITHUB_RUN_ID") or os.environ.get("CI_PIPELINE_ID") or "local-ci-run",
        }
        payload = (json.dumps(attestation, sort_keys=True, separators=(",", ":")) + "\n").encode()
        attestation_path.write_bytes(payload)
        signature_path.write_bytes(b"")
        subprocess.run(
            ["/usr/bin/openssl", "pkeyutl", "-sign", "-inkey", str(key_path), "-rawin",
             "-in", str(attestation_path), "-out", str(signature_path)],
            stdin=subprocess.DEVNULL,
            check=True,
        )
        print(f"request_id={request_id}")
        print(f"archive={archive_path}")
        print(f"attestation={attestation_path}")
        print(f"signature={signature_path}")
        print(f"archive_sha256={attestation['archive_sha256']}")
        print(f"file_count={len(files)}")
        return 0
    except Exception as exc:
        print(f"package-frontend-release: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Focused fail-closed tests for the EGS deployment controller."""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ControllerTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="egs-controller-test-")
        self.root = Path(self.temp.name) / "repository"
        (self.root / "ops/deploy").mkdir(parents=True)
        (self.root / "ops/egs-publisher").mkdir(parents=True)
        (self.root / "dist/assets").mkdir(parents=True)
        shutil.copy(ROOT / "ops/deploy/controller.sh", self.root / "ops/deploy/controller.sh")
        shutil.copy(ROOT / "ops/deploy/validate_release.py", self.root / "ops/deploy/validate_release.py")
        (self.root / ".gitignore").write_text("dist/\ntest-signing-key.pem\n")
        (self.root / "ops/deploy/controller.sh").chmod(0o755)
        self.private_key = self.root / "test-signing-key.pem"
        self.public_key = self.root / "ops/egs-publisher/ci-ed25519.pub"
        subprocess.run(
            ["openssl", "genpkey", "-algorithm", "Ed25519", "-out", str(self.private_key)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        subprocess.run(
            ["openssl", "pkey", "-in", str(self.private_key), "-pubout", "-out", str(self.public_key)],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        self.git("init", "-q")
        self.git("config", "user.name", "EGS Controller Test")
        self.git("config", "user.email", "egs-controller-test@example.invalid")
        self.git("remote", "add", "origin", "https://github.com/ssgnsa/gnamba-project.git")
        self.git("add", ".gitignore", "ops")
        self.git("commit", "-qm", "Create controller fixture")
        self.sha = self.git("rev-parse", "HEAD")
        self.ref = "refs/heads/main"
        self.release_dir = Path(self.temp.name) / "signed-release"
        self.make_dist()
        self.env = {
            "GITHUB_ACTIONS": "true",
            "GITHUB_EVENT_NAME": "workflow_dispatch",
            "GITHUB_REPOSITORY": "ssgnsa/gnamba-project",
            "GITHUB_REF": self.ref,
            "GITHUB_RUN_ID": "1001",
            "EGS_PUBLISH_FRONTEND": "true",
            "EGS_GATE_BUILD": "success",
            "EGS_GATE_TYPECHECK": "success",
            "EGS_GATE_LINT": "success",
            "EGS_GATE_FRONTEND_TESTS": "success",
            "EGS_GATE_FRONTEND_ARTIFACT": "success",
            "EGS_GATE_BACKEND": "success",
            "EGS_GATE_CONTAINERS": "success",
            "EGS_GATE5_STATUS": "PASS",
            "EGS_RELEASE_DIR": str(self.release_dir),
        }

    def tearDown(self) -> None:
        self.temp.cleanup()

    def git(self, *args: str) -> str:
        return subprocess.run(
            ["git", "-C", str(getattr(self, "root", Path.cwd())), *args],
            check=True, capture_output=True, text=True,
        ).stdout.strip()

    def make_dist(self) -> None:
        index = b'<html><script src="/assets/app.js"></script></html>\n'
        asset = b"test-frontend-asset\n"
        (self.root / "dist/index.html").write_bytes(index)
        (self.root / "dist/assets/app.js").write_bytes(asset)
        digest = hashlib.sha256()
        for relative, content in (("assets/app.js", asset), ("index.html", index)):
            digest.update(relative.encode())
            digest.update(b"\0file\0")
            digest.update(content)
            digest.update(b"\0")
        self.artifact_hash = digest.hexdigest()
        self.version = {
            "application": "EGS ERP",
            "git_commit": self.sha,
            "branch": "main",
            "git_ref": self.ref,
            "build_date": "2026-10-05T00:00:00Z",
            "build_hash": hashlib.sha256(index).hexdigest(),
            "environment": "production",
            "workspace_dirty": False,
            "workspace_hash": "a" * 64,
            "artifact_hash": self.artifact_hash,
        }
        self.write_version()

    def write_version(self) -> None:
        (self.root / "dist/VERSION.json").write_text(json.dumps(self.version, sort_keys=True) + "\n")

    def base_command(self, mode: str = "--dry-run", ref: str | None = None) -> list[str]:
        return [
            "bash", str(self.root / "ops/deploy/controller.sh"),
            "--environment", "production",
            "--ref", ref or self.sha,
            "--artifact-dir", str(self.root / "dist"),
            mode,
        ]

    def run_controller(self, *, mode: str = "--dry-run", ref: str | None = None, updates: dict[str, str | None] | None = None):
        env = os.environ.copy()
        env.update(self.env)
        if mode == "--authorize-publish":
            env.update({
                "EGS_PUBLISH_HOST": "gnambaservices.ci",
                "EGS_PUBLISH_PORT": "2222",
                "EGS_PUBLISH_USER": "egs-release",
                "EGS_PUBLISH_SSH_PRIVATE_KEY": "placeholder-not-printed",
                "EGS_PUBLISH_KNOWN_HOSTS": "gnambaservices.ci ssh-ed25519 AAAA",
            })
        for key, value in (updates or {}).items():
            if value is None:
                env.pop(key, None)
            else:
                env[key] = value
        return subprocess.run(
            self.base_command(mode=mode, ref=ref),
            cwd=self.root,
            env=env,
            capture_output=True,
            text=True,
        )

    def make_signed_release(self) -> None:
        self.release_dir.mkdir()
        archive_path = self.release_dir / ("a" * 32 + ".tar")
        with tarfile.open(archive_path, "w:", format=tarfile.PAX_FORMAT) as archive:
            for relative in ("VERSION.json", "index.html", "assets/app.js"):
                archive.add(self.root / "dist" / relative, arcname=relative)
        version_bytes = (self.root / "dist/VERSION.json").read_bytes()
        attestation = {
            "schema": 1,
            "type": "egs-frontend-release",
            "archive_sha256": hashlib.sha256(archive_path.read_bytes()).hexdigest(),
            "version_json_sha256": hashlib.sha256(version_bytes).hexdigest(),
            "git_commit": self.sha,
            "branch": "main",
            "git_ref": self.ref,
            "artifact_hash": self.artifact_hash,
            "release_check": True,
            "frontend_validation": True,
            "workflow_run": "1001",
        }
        manifest = self.release_dir / ("a" * 32 + ".json")
        manifest.write_text(json.dumps(attestation, sort_keys=True, separators=(",", ":")) + "\n")
        subprocess.run(
            ["openssl", "pkeyutl", "-sign", "-inkey", str(self.private_key), "-rawin",
             "-in", str(manifest), "-out", str(self.release_dir / ("a" * 32 + ".sig"))],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )

    def test_dry_run_passes_without_changing_production_paths(self) -> None:
        result = self.run_controller()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PASS", result.stdout)
        self.assertFalse((self.root / "current").exists())

    def test_gate5_missing_or_not_exact_pass_holds(self) -> None:
        for value in (None, "", "FAIL", "pass", "true", "1", "yes", "ok"):
            with self.subTest(value=value):
                result = self.run_controller(updates={"EGS_GATE5_STATUS": value})
                self.assertNotEqual(result.returncode, 0)

    def test_publish_frontend_flag_and_required_gate_results_must_be_success(self) -> None:
        for updates in (
            {"EGS_PUBLISH_FRONTEND": "false"},
            {"EGS_GATE_BUILD": "skipped"},
            {"EGS_GATE_BACKEND": "skipped"},
            {"EGS_GATE_CONTAINERS": "failure"},
        ):
            with self.subTest(updates=updates):
                result = self.run_controller(updates=updates)
                self.assertNotEqual(result.returncode, 0)

    def test_sha_mismatch_holds(self) -> None:
        result = self.run_controller(ref="0" * 40)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("SHA", result.stderr)

    def test_non_manual_event_holds(self) -> None:
        result = self.run_controller(updates={"GITHUB_EVENT_NAME": "push"})
        self.assertNotEqual(result.returncode, 0)

    def test_environment_and_branch_bypasses_hold(self) -> None:
        result = subprocess.run(
            ["bash", str(self.root / "ops/deploy/controller.sh"),
             "--environment", "staging", "--ref", self.sha,
             "--artifact-dir", str(self.root / "dist"), "--dry-run"],
            env={**os.environ, **self.env}, capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        result = self.run_controller(updates={"GITHUB_REF": "refs/heads/feature"})
        self.assertNotEqual(result.returncode, 0)

    def test_artifact_missing_or_metadata_mismatch_holds(self) -> None:
        result = self.run_controller(updates={"EGS_GATE_FRONTEND_ARTIFACT": "failure"})
        self.assertNotEqual(result.returncode, 0)
        (self.root / "dist/assets/app.js").unlink()
        result = self.run_controller()
        self.assertNotEqual(result.returncode, 0)
        (self.root / "dist/assets/app.js").write_bytes(b"test-frontend-asset\n")
        self.version["git_commit"] = "0" * 40
        self.write_version()
        result = self.run_controller()
        self.assertNotEqual(result.returncode, 0)

    def test_dirty_checkout_holds(self) -> None:
        (self.root / "tracked-fixture").write_text("before\n")
        self.git("add", "tracked-fixture")
        self.git("commit", "-qm", "Add dirty-checkout fixture")
        self.sha = self.git("rev-parse", "HEAD")
        self.version["git_commit"] = self.sha
        self.write_version()
        (self.root / "tracked-fixture").write_text("after\n")
        result = self.run_controller()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("uncommitted", result.stderr)

    def test_bad_signature_holds_before_secret_authorization(self) -> None:
        self.make_signed_release()
        signature = self.release_dir / ("a" * 32 + ".sig")
        signature.write_bytes(b"invalid signature")
        result = self.run_controller()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("signature", result.stderr.lower())

    def test_authorization_requires_valid_signed_artifact_and_ssh_secrets(self) -> None:
        self.make_signed_release()
        result = self.run_controller(mode="--authorize-publish")
        self.assertEqual(result.returncode, 0, result.stderr)
        result = self.run_controller(
            mode="--authorize-publish",
            updates={"EGS_PUBLISH_SSH_PRIVATE_KEY": None},
        )
        self.assertNotEqual(result.returncode, 0)

    def test_signature_required_for_publication_authorization(self) -> None:
        result = self.run_controller(mode="--authorize-publish")
        self.assertNotEqual(result.returncode, 0)

    def test_controller_script_is_tracked_as_executable(self) -> None:
        """A fresh checkout must be able to run ./ops/deploy/controller.sh directly."""
        try:
            listing = subprocess.run(
                ["git", "-C", str(ROOT), "ls-files", "--stage", "ops/deploy/controller.sh"],
                check=True, capture_output=True, text=True,
            ).stdout.strip()
        except (OSError, subprocess.CalledProcessError) as exc:  # pragma: no cover
            self.skipTest(f"git index cannot be read: {exc}")
        self.assertTrue(listing.startswith("100755 "), f"index mode must be 100755, got: {listing}")
        self.assertTrue(os.access(ROOT / "ops/deploy/controller.sh", os.X_OK))
        # The committed script must be launchable without an explicit interpreter.
        direct = subprocess.run(
            [str(self.root / "ops/deploy/controller.sh"), "--help"],
            capture_output=True, text=True,
        )
        self.assertEqual(direct.returncode, 0, direct.stderr)
        self.assertIn("Usage", direct.stderr)


if __name__ == "__main__":
    unittest.main(verbosity=2)

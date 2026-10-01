import hashlib
import importlib.util
import importlib.machinery
import io
import json
import tarfile
import tempfile
import unittest
from pathlib import Path


PUBLISHER_PATH = Path(__file__).resolve().parents[1] / "egs-publisher"
LOADER = importlib.machinery.SourceFileLoader("egs_publisher", str(PUBLISHER_PATH))
SPEC = importlib.util.spec_from_loader("egs_publisher", LOADER)
publisher = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(publisher)


class PublisherValidationTests(unittest.TestCase):
    def make_archive(self, root: Path, *, extra=None) -> Path:
        archive_path = root / "artifact.tar"
        files = {
            "index.html": b'<html><script src="/assets/app.js"></script><link href="/assets/app.css"></link></html>',
            "VERSION.json": b"{}",
            "assets/app.js": b"console.log('ok')",
            "assets/app.css": b"body{}",
        }
        if extra:
            files.update(extra)
        with tarfile.open(archive_path, "w:", format=tarfile.PAX_FORMAT) as archive:
            for name, content in files.items():
                info = tarfile.TarInfo(name)
                info.size = len(content)
                archive.addfile(info, io.BytesIO(content))
        return archive_path

    def test_accepts_plain_frontend_archive(self):
        with tempfile.TemporaryDirectory() as temp:
            archive = self.make_archive(Path(temp))
            records, expanded = publisher.inspect_archive(str(archive))

        self.assertEqual(expanded, sum(item.size for item, _ in records if item.isreg()))
        self.assertIn("assets/app.js", {name for _, name in records})

    def test_rejects_parent_traversal_and_excluded_files(self):
        for name in ("../escape", "llms.txt", "assets/SHA256SUMS"):
            with self.subTest(name=name), self.assertRaises(publisher.PublishError):
                publisher.safe_member_name(name)

    def test_rejects_symlink_members(self):
        with tempfile.TemporaryDirectory() as temp:
            archive_path = Path(temp) / "linked.tar"
            with tarfile.open(archive_path, "w:") as archive:
                for name, body in (("index.html", b"index"), ("VERSION.json", b"{}"), ("assets/app.js", b"js")):
                    info = tarfile.TarInfo(name)
                    info.size = len(body)
                    archive.addfile(info, io.BytesIO(body))
                link = tarfile.TarInfo("assets/link.js")
                link.type = tarfile.SYMTYPE
                link.linkname = "app.js"
                archive.addfile(link)

            with self.assertRaisesRegex(publisher.PublishError, "link or special file"):
                publisher.inspect_archive(str(archive_path))

    def test_attestation_requires_ci_gates_and_matching_archive_hash(self):
        valid = {
            "schema": 1,
            "type": "egs-frontend-release",
            "archive_sha256": "a" * 64,
            "release_check": True,
            "frontend_validation": True,
            "workflow_run": "workflow-1",
            "version_json_sha256": "b" * 64,
            "git_commit": "c" * 40,
            "artifact_hash": "d" * 64,
        }
        publisher.validate_attestation(valid, "a" * 64)

        for changed in (
            {**valid, "archive_sha256": "0" * 64},
            {**valid, "release_check": False},
            {**valid, "frontend_validation": False},
            {**valid, "workflow_run": " "},
        ):
            with self.subTest(changed=changed), self.assertRaises(publisher.PublishError):
                publisher.validate_attestation(changed, "a" * 64)

    def test_release_tree_binds_index_and_version_hashes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            index = b'<html><script src="/assets/app.js"></script><link href="/assets/app.css"></link></html>'
            (root / "index.html").write_bytes(index)
            (root / "assets").mkdir()
            (root / "assets/app.js").write_bytes(b"js")
            (root / "assets/app.css").write_bytes(b"css")
            version = {
                "application": "EGS ERP",
                "environment": "production",
                "git_commit": "c" * 40,
                "build_hash": hashlib.sha256(index).hexdigest(),
                "artifact_hash": "d" * 64,
                "workspace_dirty": False,
            }
            version_bytes = json.dumps(version).encode()
            (root / "VERSION.json").write_bytes(version_bytes)
            attestation = {
                "git_commit": version["git_commit"],
                "artifact_hash": version["artifact_hash"],
                "version_json_sha256": hashlib.sha256(version_bytes).hexdigest(),
            }

            self.assertEqual(publisher.validate_release_tree(str(root), attestation), version)
            attestation["version_json_sha256"] = "0" * 64
            with self.assertRaisesRegex(publisher.PublishError, "VERSION.json hash"):
                publisher.validate_release_tree(str(root), attestation)


if __name__ == "__main__":
    unittest.main()

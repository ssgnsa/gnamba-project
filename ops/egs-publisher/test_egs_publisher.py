import importlib.machinery
import importlib.util
from pathlib import Path
import unittest


PUBLISHER_PATH = Path(__file__).with_name("egs-publisher")
LOADER = importlib.machinery.SourceFileLoader("egs_publisher_under_test", str(PUBLISHER_PATH))
SPEC = importlib.util.spec_from_loader(LOADER.name, LOADER)
PUBLISHER = importlib.util.module_from_spec(SPEC)
LOADER.exec_module(PUBLISHER)


class ValidateAttestationTests(unittest.TestCase):
    def setUp(self):
        self.attestation = {
            "schema": 1,
            "type": "egs-frontend-release",
            "archive_sha256": "a" * 64,
            "version_json_sha256": "b" * 64,
            "git_commit": "c" * 40,
            "artifact_hash": "d" * 64,
            "release_check": True,
            "frontend_validation": True,
            "frontend_tests": True,
            "production_dependency_audit": True,
            "workflow_run": "12345",
        }

    def test_accepts_complete_release_gates(self):
        PUBLISHER.validate_attestation(self.attestation, "a" * 64)

    def test_rejects_missing_or_failed_gates(self):
        required_gates = (
            "release_check",
            "frontend_validation",
            "frontend_tests",
            "production_dependency_audit",
        )
        for gate in required_gates:
            with self.subTest(gate=gate):
                attestation = dict(self.attestation)
                del attestation[gate]
                with self.assertRaises(PUBLISHER.PublishError):
                    PUBLISHER.validate_attestation(attestation, "a" * 64)

                attestation[gate] = False
                with self.assertRaises(PUBLISHER.PublishError):
                    PUBLISHER.validate_attestation(attestation, "a" * 64)

    def test_rejects_archive_hash_mismatch(self):
        with self.assertRaises(PUBLISHER.PublishError):
            PUBLISHER.validate_attestation(self.attestation, "e" * 64)


class DeliveryProofParsingTests(unittest.TestCase):
    def test_sha256_output_must_match_exact_witness_set(self):
        witnesses = ["VERSION.json", "assets/app.js", "index.html"]
        output = "\n".join(f"{'a' * 64}  /var/www/egs/current/{path}" for path in witnesses)
        self.assertEqual(
            PUBLISHER.parse_sha256sum_output(output, witnesses),
            {path: "a" * 64 for path in witnesses},
        )
        with self.assertRaises(PUBLISHER.PublishError):
            PUBLISHER.parse_sha256sum_output(output.splitlines()[1], witnesses)

    def test_extracts_nested_nginx_server_blocks(self):
        config = '''
http {
  server {
    server_name unrelated.example;
    location / { root /srv/unrelated; }
  }
  server {
    server_name gnambaservices.ci;
    location / { proxy_pass http://127.0.0.1:8080; }
  }
}
'''
        blocks = PUBLISHER.nginx_server_blocks(config)
        self.assertEqual(len(blocks), 2)
        self.assertIn("unrelated.example", blocks[0])
        self.assertIn("proxy_pass http://127.0.0.1:8080;", blocks[1])


if __name__ == "__main__":
    unittest.main()

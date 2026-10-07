import unittest
import os
import subprocess
import tempfile
from pathlib import Path
from urllib.parse import quote
from unittest.mock import patch

from deploy_new_host import (
    DeploymentError,
    _check_host,
    _check_clean_release,
    _compose,
    _check_local_docker_context,
    validate_environment,
)


APP_PASSWORD = "a" * 32
VALUES = {
    "EGS_EXPECTED_HOSTNAME": "egs-new-host",
    "EGS_API_ENV_FILE": "/tmp/egs-new-host-api.env",
    "POSTGRES_PASSWORD": "p" * 40,
    "EGS_DB_APP_PASSWORD": APP_PASSWORD,
    "DATABASE_URL": (
        "postgresql://egs_app:"
        + quote(APP_PASSWORD, safe="")
        + "@egs-postgres:5432/egs_local"
    ),
    "LOCAL_AUTH_SECRET": "s" * 40,
    "INITIAL_ADMIN_PASSWORD": "correct-horse-battery",
    "FB_ADMIN_PASSWORD": "f" * 40,
    "PUBLIC_APP_URL": "https://egs.example.test",
    "VITE_API_URL": "https://api.egs.example.test/api/v1",
    "VITE_LOCAL_API_URL": "https://api.egs.example.test",
    "CORS_ORIGINS": "https://egs.example.test,https://api.egs.example.test",
}


class NewHostEnvironmentTests(unittest.TestCase):
    def test_accepts_isolated_database_and_https_origins(self):
        validate_environment(VALUES)

    def test_rejects_database_outside_new_compose_network(self):
        values = {**VALUES, "DATABASE_URL": "postgresql://egs_app:password@db.example.test/egs_local"}
        with self.assertRaisesRegex(DeploymentError, "egs-postgres"):
            validate_environment(values)

    def test_rejects_mismatched_database_password(self):
        values = {
            **VALUES,
            "DATABASE_URL": "postgresql://egs_app:wrong@egs-postgres:5432/egs_local",
        }
        with self.assertRaisesRegex(DeploymentError, "correspondre"):
            validate_environment(values)

    def test_rejects_missing_cors_origin(self):
        values = {**VALUES, "CORS_ORIGINS": "https://egs.example.test"}
        with self.assertRaisesRegex(DeploymentError, "CORS_ORIGINS"):
            validate_environment(values)

    def test_rejects_weak_initial_admin_password(self):
        values = {**VALUES, "INITIAL_ADMIN_PASSWORD": "short"}
        with self.assertRaisesRegex(DeploymentError, "INITIAL_ADMIN_PASSWORD"):
            validate_environment(values)

    def test_rejects_missing_required_secret(self):
        values = {key: value for key, value in VALUES.items() if key != "FB_ADMIN_PASSWORD"}
        with self.assertRaisesRegex(DeploymentError, "FB_ADMIN_PASSWORD"):
            validate_environment(values)

    def test_rejects_infrastructure_secrets_in_api_environment(self):
        with self.assertRaisesRegex(DeploymentError, "secrets d'infrastructure"):
            validate_environment(VALUES, {"POSTGRES_PASSWORD": "must-not-be-forwarded"})

    def test_rejects_loopback_public_origins(self):
        values = {**VALUES, "PUBLIC_APP_URL": "https://127.0.0.1"}
        with self.assertRaisesRegex(DeploymentError, "loopback"):
            validate_environment(values)

    def test_rejects_identical_published_ports(self):
        values = {**VALUES, "API_PORT": "18080"}
        with self.assertRaisesRegex(DeploymentError, "différents"):
            validate_environment(values)

    def test_rejects_equivalent_published_ports_with_leading_zero(self):
        values = {**VALUES, "API_PORT": "018080"}
        with self.assertRaisesRegex(DeploymentError, "différents"):
            validate_environment(values)

    def test_rejects_out_of_range_published_port(self):
        values = {**VALUES, "API_PORT": "70000"}
        with self.assertRaisesRegex(DeploymentError, "API_PORT"):
            validate_environment(values)

    def test_rejects_unknown_deployment_configuration(self):
        values = {**VALUES, "UNRECOGNIZED_TARGET": "production"}
        with self.assertRaisesRegex(DeploymentError, "Configuration inconnue"):
            validate_environment(values)

    def test_rejects_unknown_api_configuration(self):
        with self.assertRaisesRegex(DeploymentError, "runtime API inconnue"):
            validate_environment(VALUES, {"UNRECOGNIZED_TARGET": "production"})

    def test_host_must_be_root_allowlisted(self):
        with patch("deploy_new_host.socket.gethostname", return_value="egs-new-host"):
            with patch("deploy_new_host._read_host_allowlist", return_value=set()):
                with self.assertRaisesRegex(DeploymentError, "allowlist"):
                    _check_host(VALUES, "egs-new-host")

    def test_allowlist_requires_root_and_restrictive_permissions(self):
        from types import SimpleNamespace

        with patch(
            "deploy_new_host.HOST_ALLOWLIST_FILE",
            Path("/tmp/egs-host-allowlist-test"),
        ):
            with patch(
                "deploy_new_host.Path.lstat",
                return_value=SimpleNamespace(st_mode=0o100644, st_uid=0),
            ):
                with self.assertRaisesRegex(DeploymentError, "mode 0600 ou 0640"):
                    __import__("deploy_new_host")._read_host_allowlist()

    def test_confirmed_allowlisted_host_is_accepted(self):
        with patch("deploy_new_host.socket.gethostname", return_value="egs-new-host"):
            with patch(
                "deploy_new_host._read_host_allowlist",
                return_value={"egs-new-host"},
            ):
                _check_host(VALUES, "egs-new-host")

    def test_production_hostname_is_never_allowlisted(self):
        with patch("deploy_new_host.socket.gethostname", return_value="gnamba-server"):
            with self.assertRaisesRegex(DeploymentError, "production"):
                _check_host(
                    {**VALUES, "EGS_EXPECTED_HOSTNAME": "gnamba-server"},
                    "gnamba-server",
                )

    def test_compose_does_not_inherit_overrideable_interpolation_or_docker_targets(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / "new-host.env"
            with patch.dict(
                os.environ,
                {
                    "DATABASE_URL": "postgresql://egs_app@gnamba-server/egs_local",
                    "API_PORT": "5432",
                    "DOCKER_HOST": "ssh://gnamba-server",
                    "DOCKER_CONTEXT": "production",
                    "COMPOSE_ENV_FILES": "/tmp/production.env",
                },
                clear=False,
            ):
                with patch("deploy_new_host._run") as run:
                    run.return_value = subprocess.CompletedProcess(
                        args=[], returncode=0, stdout="", stderr=""
                    )
                    _compose(env_file, "a" * 40, ["config", "--quiet"])

        docker_env = run.call_args.kwargs["env"]
        self.assertNotIn("DATABASE_URL", docker_env)
        self.assertNotIn("API_PORT", docker_env)
        self.assertNotIn("DOCKER_HOST", docker_env)
        self.assertNotIn("DOCKER_CONTEXT", docker_env)
        self.assertNotIn("COMPOSE_ENV_FILES", docker_env)
        self.assertEqual(docker_env["EGS_RELEASE_SHA"], "a" * 40)

    def test_rejects_remote_docker_context(self):
        with patch(
            "deploy_new_host._run",
            return_value=subprocess.CompletedProcess(
                args=[], returncode=0, stdout="ssh://gnamba-server", stderr=""
            ),
        ):
            with self.assertRaisesRegex(DeploymentError, "var/run/docker.sock"):
                _check_local_docker_context()

    def test_rejects_local_socket_with_production_daemon_identity(self):
        responses = iter(
            [
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout="unix:///var/run/docker.sock", stderr=""
                ),
                subprocess.CompletedProcess(
                    args=[], returncode=0, stdout='{"Name":"gnamba-server"}', stderr=""
                ),
            ]
        )
        with patch("deploy_new_host.socket.gethostname", return_value="egs-new-host"):
            with patch("deploy_new_host._run", side_effect=lambda *_args, **_kwargs: next(responses)):
                with self.assertRaisesRegex(DeploymentError, "daemon Docker"):
                    _check_local_docker_context()

    def test_rejects_approved_sha_different_from_checkout(self):
        def fake_run(command, **_kwargs):
            if command[1:3] == ["rev-parse", "--verify"]:
                output = "a" * 40
            elif command[1:3] == ["status", "--porcelain"]:
                output = ""
            elif command[1:3] == ["remote", "get-url"]:
                output = "https://github.com/ssgnsa/gnamba-project.git"
            elif command[1:3] == ["branch", "--show-current"]:
                output = "main"
            else:
                raise AssertionError(command)
            return subprocess.CompletedProcess(command, 0, stdout=output, stderr="")

        with patch("deploy_new_host._run", side_effect=fake_run):
            with self.assertRaisesRegex(DeploymentError, "SHA approuvé"):
                _check_clean_release("b" * 40)


if __name__ == "__main__":
    unittest.main()

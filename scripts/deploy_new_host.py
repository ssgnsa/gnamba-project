#!/usr/bin/env python3
"""Fail-closed provisioning of the isolated Docker stack on a new host."""

from __future__ import annotations

import argparse
import ipaddress
import json
import os
import re
import socket
import stat
import subprocess
import sys
import time
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
COMPOSE_FILE = ROOT / "docker-compose.new-host.yml"
COMPOSE_PROJECT = "egs-new-host"
HOST_ALLOWLIST_FILE = Path("/etc/egs/new-host-hostnames")
PRODUCTION_HOSTNAMES = {"gnamba-server"}
REQUIRED_VALUES = (
    "EGS_EXPECTED_HOSTNAME",
    "EGS_API_ENV_FILE",
    "POSTGRES_PASSWORD",
    "EGS_DB_APP_PASSWORD",
    "DATABASE_URL",
    "LOCAL_AUTH_SECRET",
    "INITIAL_ADMIN_PASSWORD",
    "FB_ADMIN_PASSWORD",
    "PUBLIC_APP_URL",
    "VITE_API_URL",
    "VITE_LOCAL_API_URL",
    "CORS_ORIGINS",
)
OPTIONAL_VALUES = {
    "APP_NAME",
    "AUTH_LOGIN_RATE_LIMIT",
    "AUTH_RESET_RATE_LIMIT",
    "AUTH_RATE_LIMIT_WINDOW_SECONDS",
    "PASSWORD_RESET_TTL_SECONDS",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "API_PORT",
    "WEB_PORT",
}
SECRET_VALUES = (
    "POSTGRES_PASSWORD",
    "EGS_DB_APP_PASSWORD",
    "LOCAL_AUTH_SECRET",
    "FB_ADMIN_PASSWORD",
)
ALLOWED_API_VALUES = {
    "WHATSAPP_PROVIDER",
    "CALLMEBOT_API_KEY",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_WHATSAPP_FROM",
    "MESSAGEBIRD_API_KEY",
    "WHATSAPP_BUSINESS_TOKEN",
    "WHATSAPP_BUSINESS_NUMBER",
}
COMPOSE_INTERPOLATION_KEYS = {
    "POSTGRES_PASSWORD",
    "EGS_DB_APP_PASSWORD",
    "EGS_API_ENV_FILE",
    "APP_NAME",
    "DATABASE_URL",
    "LOCAL_AUTH_SECRET",
    "INITIAL_ADMIN_PASSWORD",
    "AUTH_LOGIN_RATE_LIMIT",
    "AUTH_RESET_RATE_LIMIT",
    "AUTH_RATE_LIMIT_WINDOW_SECONDS",
    "PASSWORD_RESET_TTL_SECONDS",
    "PUBLIC_APP_URL",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "CORS_ORIGINS",
    "API_PORT",
    "VITE_API_URL",
    "VITE_LOCAL_API_URL",
    "WEB_PORT",
    "FB_ADMIN_PASSWORD",
    "EGS_RELEASE_SHA",
}
HOST_DAEMON_OVERRIDE_ENV = {
    "DOCKER_HOST",
    "DOCKER_CONTEXT",
    "DOCKER_TLS_VERIFY",
    "DOCKER_CERT_PATH",
    "COMPOSE_ENV_FILES",
    "COMPOSE_FILE",
    "COMPOSE_PROJECT_NAME",
    "COMPOSE_PROFILES",
}
FORBIDDEN_API_VALUES = {
    "DATABASE_URL",
    "EGS_DB_APP_PASSWORD",
    "EGS_EXPECTED_HOSTNAME",
    "EGS_API_ENV_FILE",
    "FB_ADMIN_PASSWORD",
    "INITIAL_ADMIN_PASSWORD",
    "LOCAL_AUTH_SECRET",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "POSTGRES_USER",
}


class DeploymentError(RuntimeError):
    pass


def parse_env_file(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError as exc:
        raise DeploymentError(f"Impossible de lire le fichier d'environnement: {path}") from exc

    for line_number, line in enumerate(lines, start=1):
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if "=" not in line:
            raise DeploymentError(f"Format invalide dans {path.name}, ligne {line_number}")
        key, value = line.split("=", 1)
        key = key.strip()
        if not re.fullmatch(r"[A-Z][A-Z0-9_]*", key) or key in values:
            raise DeploymentError(f"Clé invalide ou dupliquée dans {path.name}, ligne {line_number}")
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        values[key] = value
    return values


def _origin(value: str, name: str) -> str:
    try:
        parsed = urlsplit(value)
    except ValueError as exc:
        raise DeploymentError(f"{name} n'est pas une URL valide") from exc
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise DeploymentError(f"{name} doit être une URL HTTPS sans identifiants")
    try:
        parsed.port
        address = ipaddress.ip_address(parsed.hostname)
    except ValueError as exc:
        if "port" in str(exc).lower():
            raise DeploymentError(f"{name} contient un port invalide") from exc
        address = None
    if parsed.hostname.lower() == "localhost" or (
        address is not None and address.is_loopback
    ):
        raise DeploymentError(f"{name} ne peut pas pointer vers une adresse loopback")
    if parsed.query or parsed.fragment:
        raise DeploymentError(f"{name} ne peut pas contenir de query ni de fragment")
    return f"https://{parsed.netloc}"


def validate_environment(
    values: dict[str, str], api_values: dict[str, str] | None = None
) -> None:
    unknown = sorted(set(values) - set(REQUIRED_VALUES) - OPTIONAL_VALUES)
    if unknown:
        raise DeploymentError("Configuration inconnue: " + ", ".join(unknown))

    missing = [name for name in REQUIRED_VALUES if not values.get(name, "").strip()]
    if missing:
        raise DeploymentError("Variables requises absentes ou vides: " + ", ".join(missing))

    for name in SECRET_VALUES:
        value = values[name]
        if len(value) < 32:
            raise DeploymentError(f"{name} doit contenir au moins 32 caractères")
    if not re.fullmatch(r"[A-Za-z0-9_-]{32,128}", values["EGS_DB_APP_PASSWORD"]):
        raise DeploymentError("EGS_DB_APP_PASSWORD doit être une valeur aléatoire URL-safe")
    if not 12 <= len(values["INITIAL_ADMIN_PASSWORD"].encode("utf-8")) <= 72:
        raise DeploymentError("INITIAL_ADMIN_PASSWORD doit faire de 12 à 72 octets")

    try:
        database = urlsplit(values["DATABASE_URL"])
        database_port = database.port
    except ValueError as exc:
        raise DeploymentError("DATABASE_URL n'est pas une URL PostgreSQL valide") from exc
    if (
        database.scheme not in {"postgresql", "postgresql+psycopg2"}
        or database.hostname != "egs-postgres"
        or database_port != 5432
        or database.path != "/egs_local"
        or unquote(database.username or "") != "egs_app"
        or unquote(database.password or "") != values["EGS_DB_APP_PASSWORD"]
        or database.query
        or database.fragment
    ):
        raise DeploymentError(
            "DATABASE_URL doit cibler exclusivement egs_app@egs-postgres:5432/egs_local "
            "et correspondre à EGS_DB_APP_PASSWORD"
        )

    origins = {
        _origin(values[name], name)
        for name in ("PUBLIC_APP_URL", "VITE_API_URL", "VITE_LOCAL_API_URL")
    }
    cors_origins = {item.strip().rstrip("/") for item in values["CORS_ORIGINS"].split(",")}
    if "*" in cors_origins or not origins.issubset(cors_origins):
        raise DeploymentError("CORS_ORIGINS doit autoriser les trois origines HTTPS configurées")

    hostname = values["EGS_EXPECTED_HOSTNAME"]
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9.-]{0,252}", hostname):
        raise DeploymentError("EGS_EXPECTED_HOSTNAME n'est pas un nom d'hôte valide")
    if api_values is not None:
        leaked = sorted(
            name
            for name in api_values
            if name in FORBIDDEN_API_VALUES
            or name.startswith(("POSTGRES_", "EGS_"))
            or name == "PGPASSWORD"
        )
        if leaked:
            raise DeploymentError(
                "Le fichier runtime API contient des secrets d'infrastructure interdits: "
                + ", ".join(leaked)
            )
        unknown_api = sorted(set(api_values) - ALLOWED_API_VALUES)
        if unknown_api:
            raise DeploymentError(
                "Configuration runtime API inconnue: " + ", ".join(unknown_api)
            )
    for name in ("API_PORT", "WEB_PORT"):
        if name in values and values[name]:
            if not values[name].isdigit() or not 1 <= int(values[name]) <= 65535:
                raise DeploymentError(f"{name} doit être compris entre 1 et 65535")
    if int(values.get("API_PORT") or "18000") == int(values.get("WEB_PORT") or "18080"):
        raise DeploymentError("API_PORT et WEB_PORT doivent être différents")


def _run(
    command: list[str],
    *,
    cwd: Path = ROOT,
    env: dict[str, str] | None = None,
    capture: bool = False,
    stdout: object | None = None,
    stdin: object | None = None,
) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        command,
        cwd=cwd,
        env=env,
        check=True,
        text=stdout is None,
        stdout=subprocess.PIPE if capture else stdout,
        stderr=subprocess.PIPE if capture else None,
        stdin=stdin,
    )


def _compose(
    env_file: Path, release_sha: str, command: list[str], *, capture: bool = False,
) -> subprocess.CompletedProcess[str]:
    env = os.environ.copy()
    for name in COMPOSE_INTERPOLATION_KEYS | HOST_DAEMON_OVERRIDE_ENV:
        env.pop(name, None)
    env["EGS_ENV_FILE"] = str(env_file.resolve())
    env["EGS_RELEASE_SHA"] = release_sha
    return _run(
        [
            "docker",
            "--context",
            "default",
            "compose",
            "--project-directory",
            str(ROOT),
            "--project-name",
            COMPOSE_PROJECT,
            "--env-file",
            str(env_file.resolve()),
            "-f",
            str(COMPOSE_FILE),
            *command,
        ],
        env=env,
        capture=capture,
    )


def _check_clean_release(approved_sha: str | None) -> str:
    sha = _run(["git", "rev-parse", "--verify", "HEAD"], capture=True).stdout.strip()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise DeploymentError("Impossible de résoudre un commit Git complet")
    status = _run(
        ["git", "status", "--porcelain", "--untracked-files=all"], capture=True
    ).stdout
    if status:
        raise DeploymentError("Worktree non propre: déploiement refusé, créer une release CI propre")
    origin = _run(["git", "remote", "get-url", "origin"], capture=True).stdout.strip()
    if origin not in {
        "https://github.com/ssgnsa/gnamba-project.git",
        "https://github.com/ssgnsa/gnamba-project",
        "git@github.com:ssgnsa/gnamba-project.git",
        "ssh://git@github.com/ssgnsa/gnamba-project.git",
    }:
        raise DeploymentError("Le dépôt Git distant ne correspond pas au dépôt EGS attendu")
    if approved_sha is not None and approved_sha != sha:
        raise DeploymentError("Le SHA approuvé ne correspond pas au commit courant")
    branch = _run(["git", "branch", "--show-current"], capture=True).stdout.strip()
    if branch not in {"main", "master"}:
        raise DeploymentError("Le nouvel hôte n'accepte que des releases main ou master")
    return sha


def _check_host(values: dict[str, str], confirmed_hostname: str | None) -> None:
    expected = values["EGS_EXPECTED_HOSTNAME"]
    actual = socket.gethostname().split(".", 1)[0].lower()
    expected_short = expected.split(".", 1)[0].lower()
    if actual in PRODUCTION_HOSTNAMES or expected_short in PRODUCTION_HOSTNAMES:
        raise DeploymentError("L'hôte de production est interdit pour le déploiement nouvel hôte")
    allowed_hostnames = _read_host_allowlist()
    if actual not in allowed_hostnames:
        raise DeploymentError(
            f"Hôte absent de l'allowlist root-owned: {actual}; aucune action effectuée"
        )
    if actual != expected_short:
        raise DeploymentError(
            f"Hôte inattendu: attendu {expected}, détecté {actual}; aucune action effectuée"
        )
    if confirmed_hostname != expected:
        raise DeploymentError(
            "Confirmer explicitement l'hôte avec --confirm-host égal à EGS_EXPECTED_HOSTNAME"
        )


def _read_host_allowlist() -> set[str]:
    path = HOST_ALLOWLIST_FILE
    try:
        info = path.lstat()
    except OSError as exc:
        raise DeploymentError(
            f"Allowlist d'hôtes absente ou illisible: {HOST_ALLOWLIST_FILE}"
        ) from exc
    if (
        not stat.S_ISREG(info.st_mode)
        or info.st_uid != 0
        or stat.S_IMODE(info.st_mode) not in {0o600, 0o640}
    ):
        raise DeploymentError(
            "L'allowlist d'hôtes doit être un fichier régulier root-owned en mode 0600 ou 0640"
        )
    try:
        entries = {
            line.strip().lower()
            for line in path.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        }
    except OSError as exc:
        raise DeploymentError("Impossible de lire l'allowlist d'hôtes") from exc
    if not entries or any(
        not re.fullmatch(r"[a-z0-9][a-z0-9.-]{0,252}", host) for host in entries
    ):
        raise DeploymentError("Allowlist d'hôtes vide ou contenant un nom invalide")
    if entries & PRODUCTION_HOSTNAMES:
        raise DeploymentError("L'allowlist contient un hôte de production interdit")
    return entries


def _local_docker_environment() -> dict[str, str]:
    env = os.environ.copy()
    for name in HOST_DAEMON_OVERRIDE_ENV:
        env.pop(name, None)
    return env


def _check_local_docker_context() -> None:
    env = _local_docker_environment()
    endpoint = _run(
        [
            "docker",
            "--context",
            "default",
            "context",
            "inspect",
            "default",
            "--format",
            "{{.Endpoints.docker.Host}}",
        ],
        env=env,
        capture=True,
    ).stdout.strip()
    if endpoint not in {"unix:///var/run/docker.sock", "unix:///run/docker.sock"}:
        raise DeploymentError(
            "Le contexte Docker default doit utiliser /var/run/docker.sock ou /run/docker.sock"
        )
    info = _run(
        ["docker", "--context", "default", "info", "--format", "{{json .}}"],
        env=env,
        capture=True,
    ).stdout.strip()
    try:
        daemon = json.loads(info)
    except json.JSONDecodeError as exc:
        raise DeploymentError("Identité du daemon Docker illisible") from exc
    daemon_name = str(daemon.get("Name", "")).split(".", 1)[0].lower()
    local_hostname = socket.gethostname().split(".", 1)[0].lower()
    if daemon_name != local_hostname or daemon_name in PRODUCTION_HOSTNAMES:
        raise DeploymentError(
            "Le nom annoncé par le daemon Docker ne correspond pas au nouvel hôte local"
        )


def _check_secret_file(path: Path) -> None:
    mode = stat.S_IMODE(path.stat().st_mode)
    if mode & 0o077:
        raise DeploymentError(f"{path.name} doit être protégé en mode 0600")


def _check_ports_free(values: dict[str, str]) -> None:
    for name, default in (("API_PORT", "18000"), ("WEB_PORT", "18080")):
        port = int(values.get(name) or default)
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as listener:
            listener.settimeout(0.25)
            if listener.connect_ex(("127.0.0.1", port)) == 0:
                raise DeploymentError(
                    f"Port localhost déjà utilisé ({name}={port}); aucun service démarré"
                )


def _preflight(env_file: Path, *, check_host: bool, confirmed_hostname: str | None) -> dict[str, str]:
    if not env_file.is_file() or env_file.is_symlink():
        raise DeploymentError(f"Fichier d'environnement absent ou lien symbolique: {env_file}")
    values = parse_env_file(env_file)
    api_env_file = Path(values.get("EGS_API_ENV_FILE", ""))
    if not api_env_file.is_absolute():
        api_env_file = ROOT / api_env_file
    if not api_env_file.is_file() or api_env_file.is_symlink():
        raise DeploymentError(
            f"Fichier runtime API absent ou lien symbolique: {api_env_file}"
        )
    api_values = parse_env_file(api_env_file)
    if check_host:
        _check_secret_file(api_env_file)
    validate_environment(values, api_values)
    if check_host:
        _check_secret_file(env_file)
        _check_host(values, confirmed_hostname)
        _check_ports_free(values)
    for name in ("docker", "npm", "node", "git", "python3", "curl"):
        if not shutil_which(name):
            raise DeploymentError(f"Commande requise absente: {name}")
    docker_env = _local_docker_environment()
    _run(["docker", "--context", "default", "compose", "version"], env=docker_env, capture=True)
    _check_local_docker_context()
    _compose(env_file, "0" * 40, ["config", "--quiet"], capture=True)
    return values


def shutil_which(command: str) -> str | None:
    from shutil import which

    return which(command)


def _write_dump(env_file: Path, release_sha: str) -> Path:
    backup_dir = ROOT / "backups" / "new-host"
    if backup_dir.is_symlink():
        raise DeploymentError(f"Répertoire de backup interdit comme lien symbolique: {backup_dir}")
    backup_dir.mkdir(mode=0o700, parents=True, exist_ok=True)
    os.chmod(backup_dir, 0o700)
    prefix = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
    backup_path = backup_dir / f"initial-{prefix}-{release_sha}.dump"
    partial_path = backup_path.with_suffix(".dump.part")
    descriptor = os.open(partial_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as backup:
            _compose(
                env_file,
                release_sha,
                [
                    "exec",
                    "-T",
                    "egs-postgres",
                    "pg_dump",
                    "-Fc",
                    "-U",
                    "postgres",
                    "-d",
                    "egs_local",
                ],
                stdout=backup,
            )
            backup.flush()
            os.fsync(backup.fileno())
        partial_path.replace(backup_path)
    except Exception:
        partial_path.unlink(missing_ok=True)
        raise
    return backup_path


def _verify_dump_restore(env_file: Path, release_sha: str, dump_path: Path) -> None:
    restore_db = f"egs_restore_check_{release_sha[:12]}"
    exists = _compose(
        env_file,
        release_sha,
        [
            "exec",
            "-T",
            "egs-postgres",
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-Atqc",
            "SELECT 1 FROM pg_database WHERE datname = '%s'" % restore_db,
        ],
        capture=True,
    ).stdout.strip()
    if exists:
        raise DeploymentError(f"Base de vérification déjà présente: {restore_db}")

    created = False
    try:
        _compose(
            env_file, release_sha,
            ["exec", "-T", "egs-postgres", "createdb", "-U", "postgres", restore_db],
        )
        created = True
        with dump_path.open("rb") as dump:
            _compose(
                env_file,
                release_sha,
                [
                    "exec",
                    "-T",
                    "egs-postgres",
                    "pg_restore",
                    "--exit-on-error",
                    "-U",
                    "postgres",
                    "-d",
                    restore_db,
                ],
                stdin=dump,
            )
    finally:
        if created:
            _compose(
                env_file, release_sha,
                ["exec", "-T", "egs-postgres", "dropdb", "-U", "postgres", restore_db],
            )


def _assert_database_empty(env_file: Path, release_sha: str) -> None:
    result = _compose(
        env_file,
        release_sha,
        [
            "exec",
            "-T",
            "egs-postgres",
            "psql",
            "-U",
            "postgres",
            "-d",
            "egs_local",
            "-Atqc",
            "SELECT count(*) FROM pg_catalog.pg_tables "
            "WHERE schemaname NOT IN ('pg_catalog', 'information_schema')",
        ],
        capture=True,
    ).stdout.strip()
    if result != "0":
        raise DeploymentError(
            "Base non vierge: aucune migration n'a été lancée. "
            "Les volumes sont conservés; utiliser la procédure de mise à niveau approuvée."
        )

    role = _compose(
        env_file,
        release_sha,
        [
            "exec",
            "-T",
            "egs-postgres",
            "psql",
            "-U",
            "postgres",
            "-d",
            "postgres",
            "-Atqc",
            "SELECT rolsuper FROM pg_catalog.pg_roles WHERE rolname = 'egs_app'",
        ],
        capture=True,
    ).stdout.strip()
    if role != "f":
        raise DeploymentError(
            "Le rôle applicatif egs_app est absent ou superutilisateur; aucune migration lancée"
        )


def _run_quality_gates(values: dict[str, str], env_file: Path, release_sha: str) -> None:
    npm_env = os.environ.copy()
    npm_env.update(
        {
            "VITE_API_MODE": "local",
            "VITE_API_URL": values["VITE_API_URL"],
            "VITE_LOCAL_API_URL": values["VITE_LOCAL_API_URL"],
            "VITE_SELFHOSTED_MODE": "true",
            "EGS_WRITE_ROOT_VERSION": "false",
        }
    )
    for command in (
        ["npm", "ci"],
        ["npm", "run", "lint"],
        ["npm", "run", "typecheck"],
        ["npm", "run", "test:run"],
        ["npm", "run", "build"],
        ["npm", "run", "release:check"],
        ["npm", "run", "validate:frontend", "--", "--strict"],
    ):
        _run(command, env=npm_env)
    _compose(env_file, release_sha, ["build", "egs-api", "egs-web"])
    _compose(env_file, release_sha, ["pull", "egs-postgres", "egs-redis", "filebrowser"])


def _deploy(env_file: Path, release_sha: str) -> None:
    running = _compose(
        env_file,
        release_sha,
        ["ps", "--services", "--status", "running"],
        capture=True,
    ).stdout.splitlines()
    unexpected = sorted(set(running) - {"egs-postgres", "egs-redis"})
    if unexpected:
        raise DeploymentError(
            "Services applicatifs déjà actifs dans ce projet: "
            + ", ".join(unexpected)
            + "; aucune migration lancée"
        )
    _compose(
        env_file,
        release_sha,
        ["up", "-d", "--wait", "--wait-timeout", "120", "egs-postgres", "egs-redis"],
    )
    _assert_database_empty(env_file, release_sha)
    backup = _write_dump(env_file, release_sha)
    _verify_dump_restore(env_file, release_sha, backup)
    _compose(
        env_file,
        release_sha,
        [
            "run",
            "--rm",
            "--no-deps",
            "-e",
            "EGS_BACKUP_VERIFIED=1",
            "-e",
            "EGS_MIGRATION_APPROVED=1",
            "-e",
            "EGS_REQUIRE_EMPTY_DATABASE=1",
            "-e",
            "EGS_DEPLOYMENT_TARGET=new-host",
            "egs-api",
            "python",
            "-m",
            "app.core.migration_runner",
        ],
    )
    _compose(
        env_file,
        release_sha,
        ["up", "-d", "--wait", "--wait-timeout", "180", "egs-api", "egs-web", "filebrowser"],
    )

    values = parse_env_file(env_file)
    port = values.get("WEB_PORT", "18080")
    response = _run(
        [
            "curl",
            "--fail",
            "--silent",
            "--show-error",
            "--max-time",
            "10",
            f"http://127.0.0.1:{port}/VERSION.json",
        ],
        capture=True,
    ).stdout
    try:
        version = json.loads(response)
    except json.JSONDecodeError as exc:
        raise DeploymentError("Le manifeste VERSION.json local est invalide") from exc
    if version.get("git_commit") != release_sha:
        raise DeploymentError("Le frontend servi ne correspond pas au commit approuvé")
    _compose(
        env_file,
        release_sha,
        ["exec", "-T", "egs-api", "python", "-c",
         "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/ready')"],
    )


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "action",
        choices=("validate", "preflight", "deploy-initial"),
        help="validate ne lance rien; deploy-initial crée la pile et migre une base vierge",
    )
    parser.add_argument("--env-file", type=Path, default=ROOT / ".env.new-host")
    parser.add_argument("--confirm-host")
    parser.add_argument("--approved-sha")
    parser.add_argument("--approve-migrations", action="store_true")
    return parser


def main() -> int:
    args = _parser().parse_args()
    env_file = args.env_file if args.env_file.is_absolute() else ROOT / args.env_file
    check_host = args.action != "validate"
    values = _preflight(
        env_file,
        check_host=check_host,
        confirmed_hostname=args.confirm_host,
    )
    print("[OK] Configuration Docker validée (les secrets ne sont pas affichés)")
    if args.action != "deploy-initial":
        if args.action == "preflight":
            _check_clean_release(None)
        print("[OK] Préflight terminé sans modifier les services ni les volumes")
        return 0

    if not args.approve_migrations:
        raise DeploymentError("--approve-migrations est requis pour l'initialisation")
    if not args.approved_sha:
        raise DeploymentError("--approved-sha est requis pour la release validée en CI")
    release_sha = _check_clean_release(args.approved_sha)
    _run_quality_gates(values, env_file, release_sha)
    _deploy(env_file, release_sha)
    print(f"[OK] Pile du nouvel hôte saine pour le commit {release_sha}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DeploymentError, OSError, subprocess.CalledProcessError) as exc:
        if isinstance(exc, subprocess.CalledProcessError):
            print(
                f"[ERROR] Commande échouée (code {exc.returncode}); "
                "aucun volume n'a été supprimé. Consulter les journaux des conteneurs.",
                file=sys.stderr,
            )
        else:
            print(f"[ERROR] {exc}", file=sys.stderr)
        raise SystemExit(1) from exc

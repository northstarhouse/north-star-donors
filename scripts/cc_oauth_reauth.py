from __future__ import annotations

import base64
import json
import os
import secrets
import ssl
import sys
import time
import urllib.parse
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from socket import timeout as SocketTimeout

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
import datetime as dt


ENV_PATH = Path(os.environ.get("NSH_ENV_PATH", "C:/Users/ender/.claude/.env"))
WORK_DIR = Path(os.environ.get("CC_OAUTH_WORK_DIR", "C:/Users/ender/.claude/projects/north-star-donors-gh/.cc-oauth"))
REDIRECT_URI = "https://localhost:8443"
AUTH_URL = "https://authz.constantcontact.com/oauth2/default/v1/authorize"
TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token"
API_BASE = "https://api.cc.email/v3"
SCOPES = ["contact_data", "campaign_data", "account_read", "account_update", "offline_access"]
USER_AGENT = "Mozilla/5.0 NorthStarLocalOAuth/1.0"


def parse_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        values[key.strip()] = value
    return values


def update_env(path: Path, updates: dict[str, str]) -> Path:
    backup = path.with_suffix(path.suffix + f".bak-{int(time.time())}")
    backup.write_text(path.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")
    seen: set[str] = set()
    lines: list[str] = []
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            lines.append(line)
            continue
        key = stripped.split("=", 1)[0].strip()
        if key in updates:
            lines.append(f"{key}={updates[key]}")
            seen.add(key)
        else:
            lines.append(line)
    for key, value in updates.items():
        if key not in seen:
            lines.append(f"{key}={value}")
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return backup


def ensure_cert() -> tuple[Path, Path]:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    cert_path = WORK_DIR / "localhost.pem"
    key_path = WORK_DIR / "localhost-key.pem"
    if cert_path.exists() and key_path.exists():
        return cert_path, key_path

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name(
        [
            x509.NameAttribute(NameOID.COUNTRY_NAME, "US"),
            x509.NameAttribute(NameOID.ORGANIZATION_NAME, "North Star Local OAuth"),
            x509.NameAttribute(NameOID.COMMON_NAME, "localhost"),
        ]
    )
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(dt.datetime.utcnow() - dt.timedelta(minutes=1))
        .not_valid_after(dt.datetime.utcnow() + dt.timedelta(days=30))
        .add_extension(x509.SubjectAlternativeName([x509.DNSName("localhost")]), critical=False)
        .sign(key, hashes.SHA256())
    )
    key_path.write_bytes(
        key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    cert_path.write_bytes(cert.public_bytes(serialization.Encoding.PEM))
    return cert_path, key_path


def exchange_code(env: dict[str, str], code: str) -> dict:
    query = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URI,
        }
    )
    auth = base64.b64encode(f"{env['CC_CLIENT_ID']}:{env['CC_CLIENT_SECRET']}".encode("utf-8")).decode("ascii")
    request = urllib.request.Request(
        TOKEN_URL + "?" + query,
        data=b"",
        headers={
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"token exchange HTTP {error.code}: {body[:500]}") from error


def api_get(token: str, path: str) -> dict:
    request = urllib.request.Request(
        API_BASE + path,
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json", "User-Agent": USER_AGENT},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    env = parse_env(ENV_PATH)
    missing = [key for key in ["CC_CLIENT_ID", "CC_CLIENT_SECRET"] if not env.get(key)]
    if missing:
        print(json.dumps({"ok": False, "error": f"missing keys: {', '.join(missing)}"}))
        return 2

    state = secrets.token_urlsafe(24)
    auth_params = {
        "client_id": env["CC_CLIENT_ID"],
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "state": state,
    }
    url = AUTH_URL + "?" + urllib.parse.urlencode(auth_params)
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    (WORK_DIR / "auth-url.txt").write_text(url, encoding="utf-8")
    (WORK_DIR / "status.json").write_text(json.dumps({"ok": False, "waiting": True, "auth_url_file": str(WORK_DIR / "auth-url.txt")}), encoding="utf-8")
    print(json.dumps({"ok": True, "auth_url_file": str(WORK_DIR / "auth-url.txt"), "redirect_uri": REDIRECT_URI}))
    sys.stdout.flush()
    complete = False

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args) -> None:  # noqa: A002
            return

        def do_GET(self) -> None:  # noqa: N802
            parsed = urllib.parse.urlparse(self.path)
            params = urllib.parse.parse_qs(parsed.query)
            if params.get("state", [""])[0] != state:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"State mismatch. Close this tab.")
                return
            if "error" in params:
                detail = {"ok": False, "error": params.get("error"), "description": params.get("error_description")}
                (WORK_DIR / "status.json").write_text(json.dumps(detail, indent=2), encoding="utf-8")
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Constant Contact authorization failed. Close this tab.")
                return
            code = params.get("code", [""])[0]
            try:
                tokens = exchange_code(env, code)
                issued = str(int(time.time()))
                backup = update_env(
                    ENV_PATH,
                    {
                        "CC_ACCESS_TOKEN": tokens["access_token"],
                        "CC_REFRESH_TOKEN": tokens["refresh_token"],
                        "CC_TOKEN_ISSUED_AT": issued,
                    },
                )
                summary = api_get(tokens["access_token"], "/account/summary")
                detail = {
                    "ok": True,
                    "env_path": str(ENV_PATH),
                    "backup": str(backup),
                    "issued_at": issued,
                    "account_name": summary.get("organization_name") or summary.get("company_name"),
                    "encoded_account_id": summary.get("encoded_account_id"),
                }
                (WORK_DIR / "status.json").write_text(json.dumps(detail, indent=2), encoding="utf-8")
                self.send_response(200)
                self.end_headers()
                self.wfile.write(b"Constant Contact tokens updated. You can close this tab.")
                nonlocal complete
                complete = True
            except Exception as error:  # noqa: BLE001
                detail = {"ok": False, "error": str(error)}
                (WORK_DIR / "status.json").write_text(json.dumps(detail, indent=2), encoding="utf-8")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Token exchange failed. Check status.json.")
                complete = True

    cert_path, key_path = ensure_cert()
    server = HTTPServer(("localhost", 8443), Handler)
    server.timeout = 2
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(cert_path, key_path)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    deadline = time.time() + 600
    while not complete and time.time() < deadline:
        try:
            server.handle_request()
        except SocketTimeout:
            continue
    if not complete:
        (WORK_DIR / "status.json").write_text(json.dumps({"ok": False, "timeout": True}, indent=2), encoding="utf-8")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

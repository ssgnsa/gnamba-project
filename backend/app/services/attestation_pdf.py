from io import BytesIO
from pathlib import Path
import base64
import qrcode
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

def _qr_base64(payload: str) -> str:
    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("ascii")

def render_attestation_pdf(attestation, lot, ilot, lotissement, village, temoins, verify_url) -> bytes:
    env = Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=select_autoescape(["html"]),
    )
    template = env.get_template("attestation_villageoise.html")
    html = template.render(
        attestation=attestation,
        lot=lot,
        ilot=ilot,
        lotissement=lotissement,
        village=village,
        temoins=temoins,
        qr_data_uri=_qr_base64(verify_url),
        verify_url=verify_url,
    )
    return HTML(string=html).write_pdf()

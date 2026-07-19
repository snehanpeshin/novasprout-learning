import base64
import json
import os
import re
import shutil
import subprocess
import tempfile
import uuid
from pathlib import Path

import boto3


MAX_TEX_BYTES = 220_000
MAX_ASSETS = 10
MAX_ASSET_BYTES = 4_000_000
FILENAME_RE = re.compile(r"^[A-Za-z0-9._-]{1,100}$")


def response(status_code, payload):
    return {
        "statusCode": status_code,
        "headers": {
            "content-type": "application/json",
            "access-control-allow-origin": os.environ.get("ALLOWED_ORIGIN", "https://www.novasproutlearning.com"),
            "access-control-allow-headers": "authorization,content-type",
            "access-control-allow-methods": "POST,OPTIONS",
        },
        "body": json.dumps(payload),
    }


def parse_event(event):
    method = event.get("requestContext", {}).get("http", {}).get("method")
    if method == "OPTIONS":
        return "options", {}
    if method == "GET":
        return "health", {}

    headers = {str(k).lower(): v for k, v in (event.get("headers") or {}).items()}
    expected_token = os.environ.get("LATEX_COMPILE_SERVICE_TOKEN", "").strip()
    provided_token = str(headers.get("authorization", "")).replace("Bearer ", "", 1).strip()

    if expected_token and provided_token != expected_token:
        raise PermissionError("Unauthorized compiler request.")

    raw_body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw_body = base64.b64decode(raw_body).decode("utf-8")

    return "post", json.loads(raw_body)


def write_assets(work_dir, assets):
    written = []
    for index, asset in enumerate((assets or [])[:MAX_ASSETS]):
        filename = str(asset.get("filename", "")).strip()
        data_url = str(asset.get("dataUrl", ""))
        if not filename or not data_url.startswith("data:image/png;base64,"):
            continue
        if not FILENAME_RE.match(filename):
            raise ValueError(f"Invalid asset filename at index {index + 1}.")

        raw = base64.b64decode(data_url.replace("data:image/png;base64,", "", 1), validate=True)
        if len(raw) > MAX_ASSET_BYTES:
            raise ValueError(f"Asset {filename} is too large.")

        target = Path(work_dir) / filename
        target.write_bytes(raw)
        written.append({"filename": filename, "placement": asset.get("placement", "")})
    return written


def run_command(command, work_dir, timeout):
    completed = subprocess.run(
        command,
        cwd=work_dir,
        check=False,
        capture_output=True,
        text=True,
        timeout=timeout,
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stdout + "\n" + completed.stderr)[-2500:])
    return completed


def page_count(work_dir):
    try:
        completed = run_command(["pdfinfo", "lesson.pdf"], work_dir, 10)
        match = re.search(r"^Pages:\s+(\d+)", completed.stdout, re.MULTILINE)
        return int(match.group(1)) if match else 0
    except Exception:
        pdf_bytes = (Path(work_dir) / "lesson.pdf").read_bytes()
        return len(re.findall(rb"/Type\s*/Page\b", pdf_bytes))


def pdf_response(pdf_bytes, metadata):
    bucket = os.environ.get("PDF_OUTPUT_BUCKET", "").strip()
    if bucket:
        key_prefix = os.environ.get("PDF_OUTPUT_PREFIX", "compiled-lessons").strip().strip("/")
        key = f"{key_prefix}/{uuid.uuid4()}.pdf"
        s3 = boto3.client("s3")
        s3.put_object(
            Bucket=bucket,
            Key=key,
            Body=pdf_bytes,
            ContentType="application/pdf",
            ServerSideEncryption="AES256",
        )
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=int(os.environ.get("PDF_URL_EXPIRES_SECONDS", "3600")),
        )
        return {**metadata, "pdfUrl": url}

    return {
        **metadata,
        "pdfDataUrl": "data:application/pdf;base64," + base64.b64encode(pdf_bytes).decode("ascii"),
    }


def compile_latex(body):
    tex = str(body.get("tex", ""))
    expected_page_count = int(body.get("expectedPageCount") or 0)
    if not tex.strip():
        raise ValueError("Missing LaTeX source.")
    if len(tex.encode("utf-8")) > MAX_TEX_BYTES:
        raise ValueError("LaTeX source is too large.")

    work_dir = tempfile.mkdtemp(prefix="novasprout-latex-")
    try:
      (Path(work_dir) / "lesson.tex").write_text(tex, encoding="utf-8")
      written_assets = write_assets(work_dir, body.get("assets") or [])

      compiler = os.environ.get("LATEX_COMPILER", "pdflatex")
      if compiler == "tectonic":
          run_command(["tectonic", "--keep-logs", "--keep-intermediates", "lesson.tex"], work_dir, 35)
      else:
          run_command(["pdflatex", "-interaction=nonstopmode", "lesson.tex"], work_dir, 35)
          run_command(["pdflatex", "-interaction=nonstopmode", "lesson.tex"], work_dir, 35)

      pdf_path = Path(work_dir) / "lesson.pdf"
      pdf_bytes = pdf_path.read_bytes()
      pages = page_count(work_dir)
      warnings = []
      if expected_page_count and pages != expected_page_count:
          warnings.append(f"Expected {expected_page_count} pages but compiled PDF has {pages}.")
      if len(pdf_bytes) < 1000:
          warnings.append("Compiled PDF is unexpectedly small.")

      return pdf_response(pdf_bytes, {
          "assetManifest": written_assets,
          "compilerName": compiler,
          "pageCount": pages,
          "pdfSize": len(pdf_bytes),
          "warnings": warnings,
      })
    finally:
      shutil.rmtree(work_dir, ignore_errors=True)


def handler(event, context):
    try:
        method, body = parse_event(event)
        if method == "options":
            return response(200, {"ok": True})
        if method == "health":
            return response(200, {"ok": True, "service": "novasprout-latex-compiler"})
        return response(200, compile_latex(body))
    except PermissionError as error:
        return response(401, {"error": str(error)})
    except Exception as error:
        return response(422, {"error": str(error)})

# NovaSprout LaTeX Compiler Service

This is the production compiler target for NovaSprout lesson decks. Amplify should call this service through `LATEX_COMPILE_SERVICE_URL`; Amplify itself does not need TeX installed.

## What It Does

- Accepts generated Beamer `.tex`.
- Accepts indexed PNG assets with deterministic filenames.
- Compiles with `pdflatex` by default.
- Runs a second compile pass for stable Beamer output.
- Checks PDF page count with `pdfinfo`.
- Returns the compiled PDF as a data URL.
- Deletes temporary files after each request.

## Environment Variables

Set these on the Lambda function:

```env
LATEX_COMPILE_SERVICE_TOKEN=use-a-long-random-shared-secret
ALLOWED_ORIGIN=https://www.novasproutlearning.com
LATEX_COMPILER=pdflatex
PDF_OUTPUT_BUCKET=your-private-compiled-pdf-bucket
PDF_OUTPUT_PREFIX=compiled-lessons
PDF_URL_EXPIRES_SECONDS=3600
```

Set these on Amplify:

```env
LATEX_COMPILE_SERVICE_URL=https://YOUR_LAMBDA_FUNCTION_URL/
LATEX_COMPILE_SERVICE_TOKEN=the-same-long-random-shared-secret
```

## Deploy Outline

Run these from `infra/latex-compiler` after creating an ECR repo and Lambda container function in AWS.

```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker build -t novasprout-latex-compiler .
docker tag novasprout-latex-compiler:latest ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novasprout-latex-compiler:latest
docker push ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novasprout-latex-compiler:latest
aws lambda update-function-code --function-name novasprout-latex-compiler --image-uri ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/novasprout-latex-compiler:latest
```

Recommended Lambda settings:

- Memory: 1024 MB or 2048 MB
- Timeout: 300 seconds
- Ephemeral storage: 1024 MB
- Function URL auth: `NONE`, protected by `LATEX_COMPILE_SERVICE_TOKEN`

## S3 Output Bucket

Create a private S3 bucket for compiled PDFs, for example:

```bash
aws s3 mb s3://novasprout-compiled-lessons-ACCOUNT_ID --region us-east-1
aws s3api put-public-access-block \
  --bucket novasprout-compiled-lessons-ACCOUNT_ID \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Give the Lambda execution role permission to write/read objects:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject"],
      "Resource": "arn:aws:s3:::novasprout-compiled-lessons-ACCOUNT_ID/*"
    }
  ]
}
```

When `PDF_OUTPUT_BUCKET` is set, the Lambda returns a short signed `pdfUrl` instead of embedding the whole PDF in JSON. This avoids Lambda/Amplify response-size failures.

The Dockerfile intentionally uses `python:3.12-slim` plus `awslambdaric` instead of the Amazon Linux Lambda base image. That avoids region/version-specific `dnf` TeX package names and is more reliable for `pdflatex`, Beamer, TikZ, and `textpos`. It also installs `cm-super` so Beamer/Text Companion fonts such as `tcss1095` are available without runtime font generation.

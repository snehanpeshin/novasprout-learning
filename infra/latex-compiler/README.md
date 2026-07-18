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
- Timeout: 60 seconds
- Ephemeral storage: 1024 MB
- Function URL auth: `NONE`, protected by `LATEX_COMPILE_SERVICE_TOKEN`

If the Docker build fails because an Amazon Linux TeX package name differs, use `dnf search texlive` inside the Lambda base image and replace the package list with the matching TeX Live package set.

FROM python:3.12-slim

# Use Debian TeX packages because the Amazon Linux Lambda base image can have
# region/version-specific TeX package names. This image is larger, but it is
# much more predictable for Beamer + TikZ + textpos compilation.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      build-essential \
      cm-super \
      poppler-utils \
      texlive-fonts-recommended \
      texlive-latex-base \
      texlive-latex-extra \
      texlive-latex-recommended \
      texlive-pictures \
    && pip install --no-cache-dir awslambdaric boto3 \
    && apt-get purge -y build-essential \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/task
COPY handler.py /var/task/handler.py

ENTRYPOINT ["/usr/local/bin/python", "-m", "awslambdaric"]
CMD ["handler.handler"]

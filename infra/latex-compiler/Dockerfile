FROM public.ecr.aws/lambda/python:3.12

# TeX Live plus Poppler's pdfinfo for page-count quality checks.
# If your AWS region/base image cannot resolve these packages, use the
# larger texlive scheme available in that region's Amazon Linux repos.
RUN dnf install -y \
    poppler-utils \
    texlive-beamer \
    texlive-collection-fontsrecommended \
    texlive-collection-latex \
    texlive-collection-latexrecommended \
    texlive-graphicx \
    texlive-pgf \
    texlive-textpos \
    && dnf clean all

COPY handler.py ${LAMBDA_TASK_ROOT}/handler.py

CMD ["handler.handler"]

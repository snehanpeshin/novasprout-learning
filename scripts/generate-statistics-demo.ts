import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "output", "pdf");
const renderDir = path.join(root, "tmp", "pdfs", "sampling-distributions-pages");
mkdirSync(outputDir, { recursive: true });
mkdirSync(renderDir, { recursive: true });

const tex = String.raw`\documentclass[aspectratio=169]{beamer}
\usepackage{amsmath,tikz,xcolor}
\usetikzlibrary{arrows.meta,positioning}
\definecolor{Navy}{HTML}{123047}\definecolor{Sky}{HTML}{4A90E2}
\definecolor{Green}{HTML}{18A67A}\definecolor{Yellow}{HTML}{F4C95D}
\definecolor{Coral}{HTML}{EF6F61}\definecolor{Paper}{HTML}{F8FAF7}
\setbeamercolor{background canvas}{bg=Paper}\setbeamercolor{frametitle}{fg=white,bg=Navy}
\setbeamercolor{block title}{fg=white,bg=Sky}\setbeamercolor{block body}{bg=Sky!7}
\setbeamertemplate{navigation symbols}{}\setbeamerfont{frametitle}{size=\Large,series=\bfseries}
\setbeamertemplate{footline}{\hfill\small NovaSprout Learning\quad\insertframenumber\hspace{.4cm}\vspace{.18cm}}
\newcommand{\concept}[1]{\begin{block}{Key idea}\normalsize #1\end{block}}
\begin{document}
\begin{frame}{Why Do Sample Means Differ?}
\concept{Random samples contain different observations, so their means usually differ. This expected variation is called sampling variability.}
\begin{center}\begin{tikzpicture}[x=.85cm]
\foreach \y/\c in {2/Sky,1/Green,0/Coral}{\draw[->,gray] (-3.5,\y)--(3.5,\y);}
\foreach \x in {-2.8,-2.1,-1.2,-.1,.8}{\fill[Sky] (\x,2) circle (3pt);}
\foreach \x in {-1.9,-.7,.2,1.2,2.5}{\fill[Green] (\x,1) circle (3pt);}
\foreach \x in {-2.4,-.8,.6,1.7,2.9}{\fill[Coral] (\x,0) circle (3pt);}
\node at (0,-.65) {same population, visibly different random samples};
\end{tikzpicture}\end{center}
\end{frame}

\begin{frame}{Population, Sample, And Statistic}
\begin{columns}[T]\begin{column}{.42\textwidth}
\concept{A population has fixed parameters $\mu$ and $\sigma$. Each random sample produces a statistic such as $\bar{x}$.}
\begin{itemize}\item Parameter: describes the population.\item Statistic: computed from a sample.\end{itemize}
\end{column}\begin{column}{.54\textwidth}
\begin{center}\begin{tikzpicture}[x=.65cm,y=2cm]
\draw[->] (-4,0)--(4.3,0);\draw[very thick,Sky,domain=-4:4,samples=60] plot(\x,{exp(-\x*\x/3)});
\draw[dashed,Coral,thick](0,0)--(0,1.08)node[above]{$\mu$};
\draw[<->,Green,thick](0,.2)--(1.22,.2)node[midway,above]{$\sigma$};
\end{tikzpicture}\end{center}
\end{column}\end{columns}
\end{frame}

\begin{frame}{Build The Sampling Distribution}
\concept{Take many samples of the same size and plot one $\bar{x}$ from each sample. The resulting dot plot is a distribution of statistics.}
\begin{center}\begin{tikzpicture}[x=1.1cm,y=.55cm]
\draw[->,thick](-3,0)--(3.2,0)node[right]{$\bar{x}$};
\foreach \x/\y in {-2.5/1,-2/1,-1.5/1,-1.5/2,-1/1,-1/2,-.5/1,-.5/2,-.5/3,0/1,0/2,0/3,0/4,.5/1,.5/2,.5/3,1/1,1/2,1.5/1,1.5/2,2/1,2.5/1}{\fill[Sky](\x,\y)circle(3pt);}
\draw[dashed,Coral,thick](0,0)--(0,4.7)node[above]{center near $\mu$};
\node[below]at(0,-.45){one dot = one repeated sample mean};
\end{tikzpicture}\end{center}
\end{frame}

\begin{frame}{Sample Size Changes Precision}
\begin{columns}[T]\begin{column}{.38\textwidth}
\concept{Larger samples produce narrower sampling distributions. Quadrupling $n$ halves the standard error.}
\[\operatorname{SE}(\bar{x})=\frac{\sigma}{\sqrt{n}}\]
\end{column}\begin{column}{.58\textwidth}
\begin{tikzpicture}[x=.72cm,y=1cm]
\draw[->,gray](-4,0)--(4.4,0);
\draw[very thick,Coral,domain=-4:4,samples=60]plot(\x,{.75*exp(-\x*\x/6)});
\draw[very thick,Sky,domain=-4:4,samples=60]plot(\x,{1.35*exp(-\x*\x/2)});
\draw[very thick,Green,domain=-4:4,samples=60]plot(\x,{2.05*exp(-\x*\x/.65)});
\node[Coral]at(3.3,.65){$n=5$};\node[Sky]at(2,1.25){$n=30$};\node[Green]at(.75,2){$n=100$};
\end{tikzpicture}
\end{column}\end{columns}
\end{frame}

\begin{frame}{Measure Distance With z}
\begin{columns}[T]\begin{column}{.42\textwidth}
\concept{A z-score is a signed distance measured in standard errors. It is not itself a probability.}
\[z=\frac{\bar{x}-\mu}{\sigma/\sqrt{n}}\]
\end{column}\begin{column}{.54\textwidth}
\begin{tikzpicture}[x=.72cm,y=2cm]
\draw[->](-4,0)--(4.3,0)node[right]{$z$};
\fill[Yellow!65,domain=2:4,samples=35](2,0)--plot(\x,{exp(-\x*\x/2)})--(4,0)--cycle;
\draw[very thick,Sky,domain=-4:4,samples=70]plot(\x,{exp(-\x*\x/2)});
\draw[dashed,Coral,thick](2,0)--(2,.22)node[above]{$z=2$};
\node at(2.9,.5){tail area};
\end{tikzpicture}
\end{column}\end{columns}
\end{frame}

\begin{frame}{One Complete Worked Example}
\begin{columns}[T]\begin{column}{.52\textwidth}
\begin{block}{Given}$\bar{x}=82,\ \mu=78,\ \sigma=10,\ n=25$\end{block}
\begin{align*}
\operatorname{SE}(\bar{x})&=\frac{10}{\sqrt{25}}=2\\
z&=\frac{82-78}{2}=2\\
95\%\text{ CI}&=82\pm1.96(2)\\
&=(78.08,85.92)
\end{align*}
\end{column}\begin{column}{.44\textwidth}
\concept{Interpretation: the sample mean is two standard errors above 78. Check interval membership numerically: $78<78.08$, so 78 is outside.}
\end{column}\end{columns}
\end{frame}

\begin{frame}{Check The Interval Endpoints}
\concept{An estimate belongs to an interval only when it lies between the calculated endpoints.}
\begin{center}\begin{tikzpicture}[x=1.2cm]
\draw[->,thick](-.5,0)--(7,0);\draw[Green,line width=6pt](1,0)--(6,0);
\foreach \x/\lab in {0/78,1/78.08,3.5/82,6/85.92}{\draw[thick](\x,-.12)--(\x,.12);\node[below]at(\x,-.15){\lab};}
\node[Coral,above]at(0,.18){outside};\node[Green,above]at(3.5,.18){estimate};
\node[draw,rounded corners,fill=Yellow!25]at(3.5,1.15){$82\pm1.96(2)=(78.08,85.92)$};
\end{tikzpicture}\end{center}
\end{frame}

\begin{frame}{Choose z Or t}
\begin{columns}[T]\begin{column}{.47\textwidth}
\begin{block}{Known population $\sigma$}
\[\operatorname{SE}(\bar{x})=\frac{\sigma}{\sqrt n}\]
Use a z-procedure when its assumptions are satisfied.
\end{block}
\end{column}\begin{column}{.47\textwidth}
\begin{block}{Unknown population $\sigma$}
\[\widehat{\operatorname{SE}}(\bar{x})=\frac{s}{\sqrt n}\]
Normally use a t-procedure with $n-1$ degrees of freedom.
\end{block}
\end{column}\end{columns}
\end{frame}

\begin{frame}{Practice Without Answer Leakage}
\begin{block}{Try it}Known $\sigma=12$ and $n=36$. Find and interpret $\operatorname{SE}(\bar{x})$.\end{block}
\begin{block}{Conceptual hint}Standard error describes variation among repeated sample means, not spread among individual observations.\end{block}
\begin{block}{Procedural hint}Substitute into $\sigma/\sqrt n$. Check that the result has the original measurement units.\end{block}
\vfill\centering Answer remains hidden until review.
\end{frame}

\begin{frame}{Retrieval Check}
\begin{enumerate}\item What does one dot in a sampling distribution represent?
\item Why does increasing $n$ narrow the distribution?
\item How is a z-score different from a tail probability?
\item Why is 78 outside $(78.08,85.92)$?
\end{enumerate}
\vfill\concept{Explain the relationship: repeated samples $\rightarrow$ sample means $\rightarrow$ standard error $\rightarrow$ z or t inference.}
\end{frame}
\end{document}`;

const texPath = path.join(outputDir, "sampling-distributions-demo.tex");
const pdfPath = path.join(outputDir, "sampling-distributions-demo.pdf");
writeFileSync(texPath, tex, "utf8");
const pdflatex = process.env.LATEX_COMPILER_PATH || "/Library/TeX/texbin/pdflatex";
for (let pass = 0; pass < 2; pass += 1) {
  execFileSync(pdflatex, ["-interaction=nonstopmode", "-halt-on-error", path.basename(texPath)], { cwd: outputDir, stdio: "inherit" });
}
execFileSync("pdftoppm", ["-png", "-r", "110", pdfPath, path.join(renderDir, "page")], { stdio: "inherit" });
execFileSync("pdfinfo", [pdfPath], { stdio: "inherit" });

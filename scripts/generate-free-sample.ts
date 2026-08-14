import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outputDir = path.join(root, "output", "pdf");
const webDir = path.join(root, "public", "samples");
const iosDir = path.join(root, "ios", "NovaSprout");
mkdirSync(outputDir, { recursive: true });
mkdirSync(webDir, { recursive: true });

const tex = String.raw`\documentclass[aspectratio=169]{beamer}
\usepackage{amsmath,tikz,xcolor}
\usetikzlibrary{arrows.meta,positioning}
\definecolor{Navy}{HTML}{123047}
\definecolor{Sky}{HTML}{2E86DE}
\definecolor{Green}{HTML}{16846F}
\definecolor{Yellow}{HTML}{F4C95D}
\definecolor{Coral}{HTML}{EF6F61}
\definecolor{Paper}{HTML}{F8FAF7}
\definecolor{Mist}{HTML}{EAF3FB}
\setbeamercolor{background canvas}{bg=Paper}
\setbeamercolor{frametitle}{fg=white,bg=Navy}
\setbeamercolor{normal text}{fg=Navy}
\setbeamercolor{block title}{fg=white,bg=Sky}
\setbeamercolor{block body}{bg=Sky!7}
\setbeamertemplate{navigation symbols}{}
\setbeamerfont{frametitle}{size=\Large,series=\bfseries}
\setbeamertemplate{footline}{\hspace{.45cm}\small NovaSprout Learning\hfill Real AI Tutor lesson preview\quad\insertframenumber\hspace{.4cm}\vspace{.16cm}}
\newcommand{\idea}[1]{\begin{block}{Key idea}\normalsize #1\end{block}}
\newcommand{\pill}[3]{\node[draw=#1,fill=#1!9,rounded corners=5pt,minimum width=2.45cm,minimum height=.85cm,align=center] at (#2) {#3};}
\begin{document}

\begin{frame}{Ratios: Compare, Scale, And Solve}
\begin{columns}[T]
\begin{column}{.48\textwidth}
\vspace{.35cm}
{\Large\bfseries Grades 6-8 visual lesson}\par\medskip
\idea{A ratio compares two quantities in a chosen order. Equivalent ratios keep the same multiplicative relationship.}
\vspace{.2cm}
\textbf{Today:} read ratios, find unit rates, solve proportions, and check answers.
\end{column}
\begin{column}{.47\textwidth}
\begin{center}
\begin{tikzpicture}[x=.72cm,y=.72cm]
\foreach \x in {0,1}{\fill[Sky] (\x,2.1) circle (.28);}
\foreach \x in {0,1,2}{\fill[Coral] (\x,1.05) circle (.28);}
\draw[-{Stealth[length=3mm]},very thick,Green] (-.2,.2)--(3.5,.2);
\node[above,align=center] at (1.65,.2) {scale both quantities\ by the same factor};
\node[font=\Large\bfseries] at (4,1.55) {$2:3$};
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Warm-Up: Read The Comparison}
\begin{columns}[T]
\begin{column}{.47\textwidth}
\idea{The order matters. The ratio of blue counters to coral counters is $2:3$.}
\begin{enumerate}
\item Count the blue counters.
\item Count the coral counters.
\item Say the comparison aloud.
\end{enumerate}
\end{column}
\begin{column}{.48\textwidth}
\begin{center}
\begin{tikzpicture}[x=1.1cm,y=1.1cm]
\foreach \x in {0,1}{\fill[Sky] (\x,1.7) circle (.33);}
\foreach \x in {0,1,2}{\fill[Coral] (\x,.65) circle (.33);}
\node[right] at (2.55,1.7) {2 blue};
\node[right] at (2.55,.65) {3 coral};
\node[draw=Navy,rounded corners=5pt,fill=Yellow!25,font=\Large\bfseries] at (1,-.35) {$2:3$};
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{One Ratio, Three Ways}
\idea{These forms describe the same ordered comparison.}
\begin{center}
\begin{tikzpicture}[x=1cm,y=1cm]
\pill{Sky}{-4,0}{$2:3$}
\pill{Green}{0,0}{$\dfrac{2}{3}$}
\pill{Coral}{4,0}{2 to 3}
\draw[-{Stealth[length=3mm]},thick,Navy] (-2.7,0)--(-1.3,0);
\draw[-{Stealth[length=3mm]},thick,Navy] (1.3,0)--(2.7,0);
\node[align=center] at (0,-1.35) {Always name the quantities:\ blue to coral, cups to batches, miles to hours.};
\end{tikzpicture}
\end{center}
\end{frame}

\begin{frame}{Equivalent Ratios Keep One Scale Factor}
\begin{columns}[T]
\begin{column}{.39\textwidth}
\idea{Multiply both parts by the same number. Here the scale factor is $2$.}
\[
2:3 \quad\xrightarrow{\times 2}\quad 4:6
\]
\end{column}
\begin{column}{.56\textwidth}
\begin{center}
\renewcommand{\arraystretch}{1.5}
\begin{tabular}{c|c|c}
\textbf{Blue} & \textbf{Coral} & \textbf{Ratio}\\\hline
2 & 3 & $2:3$\\
4 & 6 & $4:6$\\
6 & 9 & $6:9$
\end{tabular}
\end{center}
\begin{block}{Fast check}
Each row simplifies back to $2:3$.
\end{block}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{See The Pattern On A Double Number Line}
\idea{Matching points show the same multiplicative relationship.}
\begin{center}
\begin{tikzpicture}[x=1.15cm,y=1cm]
\draw[-{Stealth[length=3mm]},thick] (0,1.2)--(9.2,1.2);
\draw[-{Stealth[length=3mm]},thick] (0,-.3)--(9.2,-.3);
\foreach \x/\a/\b in {0/0/0,2/2/3,4/4/6,6/6/9,8/8/12}{
  \draw[thick] (\x,1)--(\x,1.4) node[above] {\a};
  \draw[thick] (\x,-.5)--(\x,-.1) node[below] {\b};
  \draw[dashed,Sky] (\x,.95)--(\x,-.05);
}
\node[left,font=\bfseries] at (0,1.2) {A};
\node[left,font=\bfseries] at (0,-.3) {B};
\node[draw=Green,fill=Green!8,rounded corners=5pt] at (4,.45) {$A:B=2:3$};
\end{tikzpicture}
\end{center}
\end{frame}

\begin{frame}{Unit Rate Means Per One}
\begin{columns}[T]
\begin{column}{.46\textwidth}
\idea{A car travels 180 miles in 3 hours. Divide both quantities by $3$.}
\[
\frac{180\text{ miles}}{3\text{ hours}}
=60\text{ miles per hour}
\]
\end{column}
\begin{column}{.48\textwidth}
\begin{center}
\begin{tikzpicture}[node distance=.45cm]
\node[draw=Sky,fill=Sky!8,rounded corners=5pt,minimum width=4.6cm,minimum height=1cm] (a) {180 miles in 3 hours};
\node[below=of a,font=\bfseries,Green] (d) {$\div 3$ on both quantities};
\node[below=of d,draw=Green,fill=Green!9,rounded corners=5pt,minimum width=4.6cm,minimum height=1cm] (b) {60 miles in 1 hour};
\draw[-{Stealth[length=3mm]},thick,Navy] (a)--(d);
\draw[-{Stealth[length=3mm]},thick,Navy] (d)--(b);
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Set Up A Proportion}
\begin{columns}[T]
\begin{column}{.43\textwidth}
\idea{Keep matching quantities in matching positions.}
\begin{enumerate}
\item Write the known ratio.
\item Put the unknown in the matching place.
\item Use a scale factor or cross-products.
\end{enumerate}
\end{column}
\begin{column}{.51\textwidth}
\begin{center}
\begin{tikzpicture}[node distance=.42cm]
\node[draw=Sky,fill=Sky!8,rounded corners=5pt,minimum width=5cm,minimum height=.8cm] (a) {$\dfrac{2\text{ cups}}{3\text{ batches}}=\dfrac{x\text{ cups}}{12\text{ batches}}$};
\node[below=of a,font=\bfseries,Green] (b) {$\times 4$};
\node[below=of b,draw=Green,fill=Green!9,rounded corners=5pt,minimum width=5cm,minimum height=.8cm] (c) {$x=2\times4=8\text{ cups}$};
\draw[-{Stealth[length=3mm]},thick,Navy] (a)--(b);
\draw[-{Stealth[length=3mm]},thick,Navy] (b)--(c);
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Worked Example: Scale A Recipe}
\begin{columns}[T]
\begin{column}{.47\textwidth}
\begin{block}{Given}
2 cups of flour make 3 batches.
\end{block}
\begin{block}{Find}
How many cups make 12 batches?
\end{block}
\begin{block}{Model}
$\dfrac{2}{3}=\dfrac{x}{12}$
\end{block}
\end{column}
\begin{column}{.47\textwidth}
\begin{block}{Apply}
$3\times4=12$, so $2\times4=8$.
\end{block}
\begin{block}{Result}
$x=8$ cups of flour.
\end{block}
\begin{block}{Check}
$\dfrac{8}{12}=\dfrac{2}{3}$ after dividing by $4$.
\end{block}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{A Proportional Graph Starts At The Origin}
\begin{columns}[T]
\begin{column}{.38\textwidth}
\idea{For $y=2x$, every point has the same unit rate, $y/x=2$.}
\begin{itemize}
\item Straight line
\item Passes through $(0,0)$
\item Constant slope
\end{itemize}
\end{column}
\begin{column}{.57\textwidth}
\begin{center}
\begin{tikzpicture}[x=.62cm,y=.42cm]
\draw[-{Stealth[length=3mm]}] (0,0)--(7,0) node[right] {$x$};
\draw[-{Stealth[length=3mm]}] (0,0)--(0,11) node[above] {$y$};
\foreach \x in {1,...,6}{\draw (\x,.1)--(\x,-.1) node[below] {\x};}
\foreach \y in {2,4,6,8,10}{\draw (.1,\y)--(-.1,\y) node[left] {\y};}
\draw[very thick,Sky] (0,0)--(5,10);
\foreach \x/\y in {0/0,1/2,2/4,3/6,4/8,5/10}{\fill[Coral] (\x,\y) circle (3pt);}
\node[draw=Green,fill=Green!8,rounded corners=4pt] at (5.7,7.8) {$y=2x$};
\end{tikzpicture}
\end{center}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Common Mistake: Changing Only One Part}
\begin{columns}[T]
\begin{column}{.47\textwidth}
\begin{block}{Incorrect}
$2:3\rightarrow4:3$ changes only the first quantity.
\end{block}
\[
\frac{2}{3}\ne\frac{4}{3}
\]
\end{column}
\begin{column}{.47\textwidth}
\begin{block}{Accurate}
$2:3\rightarrow4:6$ multiplies both quantities by $2$.
\end{block}
\[
\frac{2}{3}=\frac{4}{6}
\]
\end{column}
\end{columns}
\vfill
\begin{center}\textbf{One scale factor must act on both quantities.}\end{center}
\end{frame}

\begin{frame}{Your Turn}
\begin{columns}[T]
\begin{column}{.48\textwidth}
\begin{block}{1. Unit rate}
A cyclist travels 42 miles in 3 hours. Find miles per hour.
\end{block}
\begin{block}{2. Missing value}
$\dfrac{4}{7}=\dfrac{x}{21}$
\end{block}
\end{column}
\begin{column}{.46\textwidth}
\begin{block}{3. Proportional or not?}
Does $y=3x+1$ describe a proportional relationship? Explain.
\end{block}
\begin{block}{Hints}
Divide to get per one. Look for a scale factor. Check whether the graph passes through the origin.
\end{block}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Check Your Reasoning}
\begin{columns}[T]
\begin{column}{.48\textwidth}
\begin{block}{1. Unit rate}
$42\div3=14$ miles per hour.
\end{block}
\begin{block}{2. Missing value}
$7\times3=21$, so $4\times3=12$ and $x=12$.
\end{block}
\end{column}
\begin{column}{.46\textwidth}
\begin{block}{3. Proportional or not?}
No. The $+1$ means the graph does not pass through $(0,0)$.
\end{block}
\idea{A strong answer names the relationship and checks it using numbers, a table, an equation, or a graph.}
\end{column}
\end{columns}
\end{frame}

\begin{frame}{Quick Review}
\begin{center}
\begin{tikzpicture}[node distance=.55cm]
\node[draw=Sky,fill=Sky!8,rounded corners=5pt,minimum width=3.2cm,minimum height=.9cm] (a) {Compare in order};
\node[right=of a,draw=Green,fill=Green!8,rounded corners=5pt,minimum width=3.2cm,minimum height=.9cm] (b) {Scale both parts};
\node[right=of b,draw=Coral,fill=Coral!8,rounded corners=5pt,minimum width=3.2cm,minimum height=.9cm] (c) {Check the result};
\draw[-{Stealth[length=3mm]},thick,Navy] (a)--(b);
\draw[-{Stealth[length=3mm]},thick,Navy] (b)--(c);
\end{tikzpicture}
\end{center}
\vspace{.35cm}
\begin{block}{Remember}
Equivalent ratios have one constant multiplier. A unit rate compares to one. A proportional graph is a straight line through the origin.
\end{block}
\vfill
\begin{center}{\Large\bfseries Ready for the scored quiz?}\end{center}
\end{frame}

\end{document}`;

const texPath = path.join(outputDir, "novasprout-ratios-sample.tex");
const pdfPath = path.join(outputDir, "novasprout-ratios-sample.pdf");
writeFileSync(texPath, tex, "utf8");

const pdflatex = process.env.LATEX_COMPILER_PATH || "/Library/TeX/texbin/pdflatex";
for (let pass = 0; pass < 2; pass += 1) {
  execFileSync(
    pdflatex,
    ["-interaction=nonstopmode", "-halt-on-error", path.basename(texPath)],
    { cwd: outputDir, stdio: "inherit" }
  );
}

copyFileSync(pdfPath, path.join(webDir, "novasprout-ratios-sample.pdf"));
copyFileSync(pdfPath, path.join(iosDir, "NovaSprout-Ratios-Sample.pdf"));
console.log(`Created ${pdfPath}`);

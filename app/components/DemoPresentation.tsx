"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize2, Play, RotateCcw, Square, Volume2 } from "lucide-react";
import { findPresentationDemo, presentationDemos, type DemoId } from "../lib/presentationDemos";
import PresentationDiagram from "./PresentationDiagram";
type Phase = "explain" | "practice" | "transfer";
export default function DemoPresentation() {
  const [demoId, setDemoId] = useState<DemoId>("math");
  const [scene, setScene] = useState(0);
  const [phase, setPhase] = useState<Phase>("explain");
  const [choice, setChoice] = useState<number | null>(null);
  const [hint, setHint] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasVoice, setHasVoice] = useState(false);
  const [note, setNote] = useState("");
  const stage = useRef<HTMLDivElement>(null);
  const narrationRun = useRef(0);
  const demo = findPresentationDemo(demoId);
  const question = phase === "transfer" ? demo.transfer : demo.practice;
  const correct = choice === question.answerIndex;
  function stop() { narrationRun.current++; window.speechSynthesis?.cancel(); setPlaying(false); }
  function reset() { stop(); setScene(0); setPhase("explain"); setChoice(null); setHint(false); setNote(""); }
  useEffect(() => {
    setHasVoice(Boolean(window.speechSynthesis) && typeof window.SpeechSynthesisUtterance === "function");
    setDemoId(findPresentationDemo(new URLSearchParams(window.location.search).get("demo")).id);
    const hide = () => { if (document.hidden) stop(); };
    document.addEventListener("visibilitychange", hide);
    return () => { narrationRun.current++; window.speechSynthesis?.cancel(); document.removeEventListener("visibilitychange", hide); };
  }, []);
  function chooseDemo(id: DemoId) {
    reset(); setDemoId(id);
    const url = new URL(window.location.href); url.searchParams.set("demo", id); window.history.replaceState({}, "", url);
  }
  function advance() {
    stop();
    if (scene < demo.scenes.length-1) setScene(value => value+1);
    else { setPhase("practice"); setChoice(null); setHint(false); }
  }
  function narrate() {
    if (playing) { stop(); return; }
    if (!hasVoice) return;
    window.speechSynthesis.cancel();
    const run = ++narrationRun.current;
    setPlaying(true); setNote("");
    function speak(index: number) {
      if (run !== narrationRun.current) return;
      setScene(index);
      const utterance = new SpeechSynthesisUtterance(demo.scenes[index].narration);
      utterance.lang = "en-US"; utterance.rate = 0.92;
      utterance.onend = () => {
        if (run !== narrationRun.current) return;
        if (index+1 < demo.scenes.length) speak(index+1);
        else { setPlaying(false); setPhase("practice"); setChoice(null); setHint(false); }
      };
      utterance.onerror = () => { if (run === narrationRun.current) { setPlaying(false); setNote("Narration could not play. Use Next to present the captions at your own pace."); } };
      window.speechSynthesis.speak(utterance);
    }
    speak(scene);
  }
  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (stage.current?.requestFullscreen) await stage.current.requestFullscreen();
      else setNote("Use your browser's fullscreen option to enlarge this presentation.");
    } catch { setNote("Fullscreen is unavailable here. The presentation still works on this page."); }
  }
  const progress = phase === "explain" ? 0 : phase === "transfer" ? 3 : hint ? 2 : 1;
  return <main className="presentation-page">
    <header className="presentation-header"><a className="ns-brand" href="/"><img src="/novasprout-logo.png" alt="" width="44" height="44"/><span>NovaSprout <em>Learning</em></span></a><a href="/ai-lesson-generator" className="ns-text-link">Create a personalized lesson <ArrowRight aria-hidden="true" size={18}/></a></header>
    <div className="presentation-intro"><p className="eyebrow">Presentation mode</p><h1>See the idea. Try the next step.</h1><p>Three prepared demonstrations. No sign-in or live generation required.</p></div>
    <div ref={stage} className="presentation-workspace" aria-label="Tutor presentation">
      <div className="presentation-toolbar">
        <div className="presentation-demo-tabs" aria-label="Choose a demonstration">{presentationDemos.map(item => <button type="button" key={item.id} aria-pressed={demoId===item.id} onClick={() => chooseDemo(item.id)}>{item.subject}</button>)}</div>
        <div className="presentation-tools"><button type="button" onClick={reset} aria-label="Restart demonstration"><RotateCcw aria-hidden="true" size={18}/> Restart</button><button type="button" onClick={fullScreen}><Maximize2 aria-hidden="true" size={18}/> Full screen</button></div>
      </div>
      <div className="presentation-heading"><p className="eyebrow">{demo.subject} · {demo.level}</p><h2>{demo.title}</h2><ol className="presentation-steps" aria-label="Learning sequence">{["Explain", "Try", "Hint", "Check"].map((label,index)=><li key={label} aria-current={progress===index?"step":undefined}><span>{index+1}</span>{label}</li>)}</ol></div>
      <div className="presentation-content">
        <div className="presentation-visual"><PresentationDiagram demo={demo.id} scene={phase==="explain"?scene:2}/><span className="presentation-diagram-note">Labeled teaching diagram · prepared example</span><div className="presentation-visual-key" aria-label="Diagram key">{(demo.id === "science" ? ["Evaporation: liquid to gas", "Condensation: gas to liquid", "Precipitation: water falls"] : demo.id === "coding" ? ["Repeats: 3", "Action: move 1 square right", "Total after 3 repeats: 3 squares"] : ["Each bar is the same-sized whole", "Top bar: two equal halves", "Bottom bar: four equal quarters"]).map(label => <p key={label}>{label}</p>)}</div></div>
        <section className="presentation-copy" aria-live="polite">
          {phase==="explain" ? <>
            <p className="eyebrow">Explanation {scene+1} of {demo.scenes.length}</p><h3>{demo.scenes[scene].title}</h3><p className="presentation-narration">{demo.scenes[scene].narration}</p>
            <div className="presentation-actions"><button type="button" className="button secondary" disabled={scene===0} onClick={()=>{stop();setScene(value=>Math.max(0,value-1));}}><ArrowLeft aria-hidden="true" size={18}/> Back</button><button type="button" className="button primary" onClick={advance}>{scene===demo.scenes.length-1?"Your turn":"Next"}<ArrowRight aria-hidden="true" size={18}/></button></div>
            <button type="button" className="presentation-voice" disabled={!hasVoice} onClick={narrate}>{playing?<Square aria-hidden="true" size={18}/>:<Play aria-hidden="true" size={18}/>} {playing?"Stop narration":"Play explanation"}</button>
            <p className="presentation-small"><Volume2 aria-hidden="true" size={15}/>{hasVoice?"Optional browser narration. The same words remain visible.":"Narration is unavailable in this browser. Use Next to present at your own pace."}</p>
          </> : <>
            <p className="eyebrow">{phase==="transfer"?"A fresh check":"Your turn"}</p><h3>{question.question}</h3>
            <div className="presentation-answers" role="group" aria-label={phase==="transfer"?"Fresh check answers":"Practice answers"}>{question.options.map((option,index)=><button type="button" key={option} className={choice===index?(correct?"is-correct":"is-review"):""} aria-pressed={choice===index} onClick={()=>setChoice(index)}>{option}</button>)}</div>
            {choice!==null&&<p className={correct?"presentation-feedback is-correct":"presentation-feedback"} role="status">{correct?question.explanation:"Not quite yet. Look at what is changing, then try again or ask for a hint."}</p>}
            {!correct&&<button type="button" className="presentation-hint-button" onClick={()=>setHint(value=>!value)} aria-expanded={hint}>{hint?"Hide hint":"Give me a hint"}</button>}
            {hint&&!correct&&<p className="presentation-hint" role="status">{question.hint}</p>}
            {correct&&phase==="practice"&&<button type="button" className="button primary" onClick={()=>{setPhase("transfer");setChoice(null);setHint(false);}}>Try a fresh check <ArrowRight aria-hidden="true" size={18}/></button>}
            {correct&&phase==="transfer"&&<div className="presentation-complete"><strong>Keep the idea going.</strong><p>You worked through a prepared example and a fresh question. Try another subject or create a lesson on your own topic.</p><a className="button primary" href={"/ai-lesson-generator?starter="+demo.id+"#generator"}>Use this topic in my lesson <ArrowRight aria-hidden="true" size={18}/></a></div>}
            <button type="button" className="presentation-revisit" onClick={()=>{stop();setPhase("explain");setScene(0);}}>Revisit the explanation</button>
          </>}
        </section>
      </div>
      {note&&<p className="presentation-status" role="status">{note}</p>}
      <footer className="presentation-footer"><span>Prepared demo · personalized AI lessons are generated separately.</span><span>Understanding takes practice, feedback, and later review.</span></footer>
    </div>
    <p className="presentation-afterword">Ready for your own topic? <a href="/ai-lesson-generator">Open the AI tutor</a>. Personalized generation requires eligible access.</p>
  </main>;
}

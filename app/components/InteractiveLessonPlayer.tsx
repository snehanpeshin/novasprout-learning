"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import {buildLearningMoments,narrationFor,type InteractiveLesson} from "../lib/interactiveLesson";
export default function InteractiveLessonPlayer({lesson,accessToken,lessonTicket,onAskTutor}:{lesson:InteractiveLesson;accessToken:string;lessonTicket:string;onAskTutor?:(question:string)=>void}) {
  const moments=useMemo(()=>buildLearningMoments(lesson),[lesson]);
  const [index,setIndex]=useState(0), [beat,setBeat]=useState(0), [watching,setWatching]=useState(false), [playing,setPlaying]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState("");
  const [attempts,setAttempts]=useState<Record<string,string>>({}), [revealed,setRevealed]=useState<Record<string,boolean>>({}), [choices,setChoices]=useState<Record<string,number>>({}), [hints,setHints]=useState<Record<string,boolean>>({});
  const audio=useRef<HTMLAudioElement|null>(null), cache=useRef(new Map<string,string>()), pending=useRef<AbortController|null>(null), generation=useRef(0);
  const current=moments[index];
  function stop(){generation.current++;pending.current?.abort();audio.current?.pause(); if(typeof window!=="undefined"&&"speechSynthesis" in window) window.speechSynthesis.cancel();setPlaying(false);setBusy(false);setWatching(false);}
  useEffect(()=>()=>{generation.current++;pending.current?.abort();audio.current?.pause();window.speechSynthesis?.cancel();cache.current.forEach(url=>URL.revokeObjectURL(url));},[]);
  useEffect(()=>{
    if(!watching || !current || current.prompt || beat>=current.beats.length-1){setWatching(false);return;}
    const delay=Math.max(4000,(current.beats[beat]?.split(/\s+/).length || 10)*450);
    const timer=window.setTimeout(()=>setBeat(b=>b+1),delay);
    return ()=>window.clearTimeout(timer);
  },[watching,beat,current]);
  async function listen(){
    if(!current || busy)return; if(playing){stop();return;} setWatching(false);const version=++generation.current;setError("");
    if(!lessonTicket){
      if(!("speechSynthesis" in window)){setError("Voice is unavailable in this browser. Follow the captions below.");return;}
      const voice=new SpeechSynthesisUtterance(narrationFor(current,beat));voice.rate=0.9;voice.onend=()=>{if(version===generation.current)setPlaying(false);};voice.onerror=()=>{if(version===generation.current){setPlaying(false);setError("Voice stopped. You can still read and reveal each step.");}};setPlaying(true);window.speechSynthesis.speak(voice);return;
    }
    setBusy(true);
    try {
      const clipId=`${current.id}:${beat}`;let url=cache.current.get(clipId);
      if(!url){const controller=new AbortController();pending.current=controller;const response=await fetch("/api/ai-narration",{method:"POST",headers:{"Content-Type":"application/json","x-ai-access-token":accessToken,"x-ai-lesson-ticket":lessonTicket},body:JSON.stringify({momentId:current.id,beatIndex:beat}),signal:controller.signal});if(!response.ok){const data=await response.json();throw new Error(data.error || "Narration is unavailable.");}url=URL.createObjectURL(await response.blob());if(version!==generation.current){URL.revokeObjectURL(url);return;}cache.current.set(clipId,url);}
      if(version!==generation.current)return;
      const player=new Audio(url);audio.current=player;player.onended=()=>setPlaying(false);player.onerror=()=>{setPlaying(false);setError("Audio could not play. Use the captions and try replaying.");};await player.play();if(version===generation.current)setPlaying(true);
    }catch(e){if(version===generation.current)setError(e instanceof Error?e.message:"Narration unavailable.");}finally{if(version===generation.current)setBusy(false);}
  }
  function move(next:number){stop();setIndex(next);setBeat(0);setError("");}
  if(!current)return null;
  const attempted=(attempts[current.id] || "").trim().length>0;
  const checked=revealed[current.id];
  const needsAttempt=Boolean(current.prompt);
  const complete=needsAttempt ? (current.options?checked:attempted) : beat>=current.beats.length-1;
  const quiz=moments.filter(m=>m.options), answered=quiz.filter(m=>revealed[m.id]), correct=answered.filter(m=>choices[m.id]===m.answerIndex).length;
  return <section className="interactive-tutor" aria-label="Interactive lesson studio">
    <header><p className="eyebrow">Listen · Explore · Try</p><h3>Your interactive lesson</h3><p>Short explanations, step reveals, and a turn for you to think. Take your time.</p></header>
    <div className="studio-progress"><progress value={index+1} max={moments.length} aria-label="Lesson position"/><span>Moment {index+1} of {moments.length}</span></div>
    <div className="studio-controls"><button type="button" className="button secondary" onClick={listen} disabled={busy}>{busy?"Preparing voice…":playing?"Stop voice":"Listen / replay"}</button><span>{lessonTicket?"AI-generated OpenAI voice":"Sample: your device’s synthetic voice"} · captions below</span></div>
    {current.beats.length>1&&<button type="button" className="button secondary studio-watch" onClick={()=>{if(watching){setWatching(false);}else{stop();if(beat>=current.beats.length-1)setBeat(0);setWatching(true);}}}>{watching?"Pause walkthrough":"Watch step-by-step"}</button>}
    {error&&<p role="status">{error}</p>}
    <article className="studio-scene" key={current.id}><p className="mini-label">{current.kind === "model" ? "I do: follow the reasoning" : current.kind === "practice" ? "You do: give it a try" : current.kind === "check" ? "Retrieval check" : "Explore the idea"}</p><h4>{current.title}</h4>
      {current.beats.slice(0,beat+1).map((text,i)=><div className="studio-beat" key={i}><span aria-hidden="true">{i+1}</span><p>{text}</p></div>)}
      {beat<current.beats.length-1&&<button type="button" className="button primary" onClick={()=>{stop();setBeat(b=>b+1);}}>Reveal next step</button>}
      {current.prompt&&<p className="studio-question">{current.prompt}</p>}
      {current.options?<fieldset className="studio-options"><legend>Choose an answer, then check it</legend>{current.options.map((option,i)=><label key={i}><input type="radio" name={current.id} checked={choices[current.id]===i} disabled={checked} onChange={()=>setChoices(s=>({...s,[current.id]:i}))}/>{option}</label>)}<button type="button" className="button primary" disabled={checked||choices[current.id]===undefined} onClick={()=>setRevealed(s=>({...s,[current.id]:true}))}>Check my answer</button></fieldset>:current.prompt&&<label className="studio-attempt">Your idea or working<textarea value={attempts[current.id]||""} maxLength={1200} placeholder="Write what you think, or try the first step…" onChange={e=>setAttempts(s=>({...s,[current.id]:e.target.value}))}/></label>}
      {onAskTutor && current.prompt && !current.options && <button type="button" className="button secondary" disabled={!attempted} onClick={()=>onAskTutor(`Activity: ${current.prompt?.slice(0,450)}\nMy attempt: ${(attempts[current.id]||"").slice(0,600)}\nHelp me reason through my attempt with a hint.`)}>Ask tutor about my attempt</button>}
      {current.hint&&<><button type="button" className="button secondary" onClick={()=>setHints(s=>({...s,[current.id]:!s[current.id]}))}>{hints[current.id]?"Hide hint":"Give me a hint"}</button>{hints[current.id]&&<p className="studio-feedback">{current.hint}</p>}</>}
      {current.answer&&<button type="button" className="button secondary" disabled={!attempted} onClick={()=>setRevealed(s=>({...s,[current.id]:!s[current.id]}))}>{checked?"Hide explanation":"Compare with the explanation"}</button>}
      {checked&&<div className="studio-feedback" role="status">{current.options?<><strong>{choices[current.id]===current.answerIndex?"You’ve got it!":"Let’s work through it."}</strong><p>Correct answer: {current.options[current.answerIndex!]}</p><p>{current.explanation}</p>{choices[current.id]!==current.answerIndex&&<button type="button" className="button secondary" onClick={()=>{setRevealed(s=>({...s,[current.id]:false}));setChoices(s=>{const next={...s};delete next[current.id];return next;});}}>Try again</button>}</>:<p>{current.answer}</p>}</div>}
    </article>
    {current.kind === "explain" && lesson.conceptModel?.relationships?.length ? <details className="studio-connections"><summary>Explore how the ideas connect</summary>{lesson.conceptModel.relationships.map((link,i)=>{const from=lesson.conceptModel?.nodes.find(n=>n.id===link.from),to=lesson.conceptModel?.nodes.find(n=>n.id===link.to);return from&&to?<details key={i}><summary>{from.label} → {link.relationship} → {to.label}</summary><p>{link.explanation}</p><p><strong>{from.label}:</strong> {from.definition}</p><p><strong>{to.label}:</strong> {to.definition}</p></details>:null;})}</details>:null}
    <nav className="studio-navigation" aria-label="Learning moments"><button type="button" className="button secondary" disabled={index===0} onClick={()=>move(index-1)}>Back</button><button type="button" className="button primary" disabled={index===moments.length-1||!complete} onClick={()=>move(index+1)}>Continue</button></nav>
    {!complete&&<p className="studio-help">{needsAttempt?"Give an answer to unlock the next moment. There’s no timer." : "Reveal the remaining steps to continue."}</p>}
    {index===moments.length-1&&complete&&<p className="studio-feedback">Lesson explored! Quiz: {correct} correct out of {answered.length} answered. Revisit any tricky moments, or ask your lesson tutor for a hint. This check helps you choose what to practice next.</p>}
  </section>;
}

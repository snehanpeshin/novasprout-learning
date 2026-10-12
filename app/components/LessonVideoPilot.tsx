"use client";
import {useState} from "react";
export default function LessonVideoPilot(){
 const [choice,setChoice]=useState<number|null>(null),[finished,setFinished]=useState(false);
 return <section className="lesson-video-pilot" aria-labelledby="video-pilot-title">
 <div><p className="eyebrow">Try a video lesson</p><h2 id="video-pilot-title">Watch the idea come to life.</h2><p>This short fraction preview combines illustrated animation with AI-generated narration. Watch, pause, replay, then try a question.</p><p className="video-pilot-label">Illustrated animation preview · 34 seconds · suitable for learning halves and quarters</p></div>
 <video controls playsInline preload="metadata" poster="/samples/novasprout-fractions-video-poster.png" onEnded={()=>setFinished(true)} aria-label="Pizza fractions: halves and quarters">
 <source src="/samples/novasprout-fractions-video.mp4" type="video/mp4"/>
 <track kind="captions" src="/samples/novasprout-fractions-video.vtt" srcLang="en" label="English captions"/>
 Your browser cannot play this video. <a href="/samples/novasprout-fractions-video.mp4">Download the fraction preview</a>.
 </video>
 <div className="video-pilot-question"><h3>{finished?"Now your turn":"A question to think about"}</h3><p>How many equal quarters make one whole pizza?</p><div className="video-pilot-answers">{[2,4,8].map(value=><button key={value} type="button" className="button secondary" aria-pressed={choice===value} onClick={()=>setChoice(value)}>{value} quarters</button>)}</div>{choice!==null&&<p className="video-pilot-feedback" role="status">{choice===4?"Yes! Four equal quarters cover the whole pizza. 4/4 = 1. Can you explain why two quarters make one half?":"Try counting all the equal pieces in the whole pizza. Replay the last part if you need a hint, then try again."}</p>}</div>
 <details className="video-pilot-transcript"><summary>Read the video transcript</summary><ol><li>Here is one whole pizza. Let us split it into equal shares.</li><li>Two equal pieces make the whole pizza. One of those two pieces is one half.</li><li>Now split the same whole into four equal pieces. One of those four pieces is one quarter.</li><li>Select two quarters. Together they cover the same amount as one half. Two fourths equals one half.</li><li>Your turn. How many quarters make one whole pizza? Pause and explain how you know.</li></ol></details>
 </section>;
}

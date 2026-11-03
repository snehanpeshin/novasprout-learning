"use client";
import {useRef,useState,type ReactNode} from "react";
import PersonalizedVideoTutor,{type VideoFiles} from "./PersonalizedVideoTutor";
import InteractiveLessonPlayer from "./InteractiveLessonPlayer";
import AiCoach from "./AiCoach";
import type {InteractiveLesson} from "../lib/interactiveLesson";
export default function LessonExperience({lesson,accessToken,lessonTicket,resources}:{lesson:InteractiveLesson;accessToken:string;lessonTicket:string;resources:ReactNode}){
 const paid=Boolean(lessonTicket),[question,setQuestion]=useState(""),[version,setVersion]=useState(0),[practice,setPractice]=useState(!paid),[asking,setAsking]=useState(false),[files,setFiles]=useState<VideoFiles>({video:null,captions:""});const coach=useRef<HTMLDetailsElement>(null);
 function ask(text:string){setQuestion(text);setVersion(n=>n+1);setAsking(true);requestAnimationFrame(()=>{if(coach.current){coach.current.open=true;coach.current.scrollIntoView({behavior:"smooth",block:"center"});}});}
 return <section className="lesson-experience lesson-player-first" aria-label="Your learning space">
 {paid&&<PersonalizedVideoTutor accessToken={accessToken} lessonTicket={lessonTicket} active={true} onAskTutor={ask} onSaveReady={setFiles}/>}
 <details className="lesson-extra" open={practice} onToggle={e=>setPractice(e.currentTarget.open)}><summary>{paid?"Practice what you learned":"Explore the sample practice"}</summary><InteractiveLessonPlayer lesson={lesson} accessToken={accessToken} lessonTicket={lessonTicket} active={practice} onAskTutor={paid?ask:undefined}/></details>
 {paid&&<details ref={coach} className="lesson-extra" open={asking} onToggle={e=>setAsking(e.currentTarget.open)}><summary>Ask for a hint</summary><AiCoach accessToken={accessToken} lessonTicket={lessonTicket} suggestedQuestion={question} suggestedQuestionVersion={version}/></details>}
 <details className="lesson-extra"><summary>Save or read your lesson</summary>{files.video&&<a className="button secondary" href={files.video.url} download={"novasprout-video-lesson."+files.video.extension}>Save my video</a>}{files.captions&&<a className="button secondary" href={files.captions} download="novasprout-captions.vtt">Save captions</a>}{resources}</details>
 </section>;
}

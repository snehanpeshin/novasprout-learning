"use client";
import {useId,useRef,useState,type ReactNode} from "react";
import {Play,PenLine,MessageCircle,Download} from "lucide-react";
import PersonalizedVideoTutor,{type VideoFiles} from "./PersonalizedVideoTutor";
import InteractiveLessonPlayer from "./InteractiveLessonPlayer";
import AiCoach from "./AiCoach";
import type {InteractiveLesson} from "../lib/interactiveLesson";
type View="watch"|"try"|"ask"|"save";
export default function LessonExperience({lesson,accessToken,lessonTicket,resources}:{lesson:InteractiveLesson;accessToken:string;lessonTicket:string;resources:ReactNode}){
 const id=useId(),paid=Boolean(lessonTicket),[view,setView]=useState<View>(paid?"watch":"try"),[question,setQuestion]=useState(""),[questionVersion,setQuestionVersion]=useState(0),tabs=useRef<Array<HTMLButtonElement|null>>([]),[files,setFiles]=useState<VideoFiles>({video:null,captions:""});
 const choices=[...(paid?[{id:"watch" as View,label:"Watch",hint:"See and hear",Icon:Play}]:[]),{id:"try" as View,label:"Try",hint:"Learn by doing",Icon:PenLine},...(paid?[{id:"ask" as View,label:"Ask",hint:"Get a little help",Icon:MessageCircle}]:[]),{id:"save" as View,label:"Save",hint:"Keep your lesson",Icon:Download}];
 function ask(text:string){setQuestion(text);setQuestionVersion(n=>n+1);setView("ask");}
 return <section className="lesson-experience" aria-label="Your learning space"><div className="lesson-experience-heading"><p className="eyebrow">One step at a time</p><h3>How would you like to learn?</h3><p>Watch the idea, give it a try, or ask for help. Your place stays saved while this lesson is open.</p></div>
 <div className="lesson-experience-tabs" role="tablist" aria-label="Ways to learn">{choices.map(({id:key,label,hint,Icon},i)=><button key={key} ref={node=>{tabs.current[i]=node;}} type="button" role="tab" id={`${id}-${key}-tab`} aria-controls={`${id}-${key}-panel`} aria-selected={view===key} tabIndex={view===key?0:-1} onClick={()=>setView(key)} onKeyDown={event=>{let next=i;if(event.key==="ArrowRight")next=(i+1)%choices.length;else if(event.key==="ArrowLeft")next=(i+choices.length-1)%choices.length;else if(event.key==="Home")next=0;else if(event.key==="End")next=choices.length-1;else return;event.preventDefault();setView(choices[next].id);tabs.current[next]?.focus();}}><Icon size={22} aria-hidden="true"/><span><strong>{label}</strong><small>{hint}</small></span></button>)}</div>
 {paid&&<div role="tabpanel" id={`${id}-watch-panel`} aria-labelledby={`${id}-watch-tab`} hidden={view!=="watch"}><PersonalizedVideoTutor accessToken={accessToken} lessonTicket={lessonTicket} active={view==="watch"} onAskTutor={ask} onSaveReady={setFiles}/></div>}
 <div role="tabpanel" id={`${id}-try-panel`} aria-labelledby={`${id}-try-tab`} hidden={view!=="try"}><InteractiveLessonPlayer lesson={lesson} accessToken={accessToken} lessonTicket={lessonTicket} active={view==="try"} onAskTutor={paid?ask:undefined}/></div>
 {paid&&<div role="tabpanel" id={`${id}-ask-panel`} aria-labelledby={`${id}-ask-tab`} hidden={view!=="ask"}><AiCoach accessToken={accessToken} lessonTicket={lessonTicket} suggestedQuestion={question} suggestedQuestionVersion={questionVersion}/></div>}
 <div role="tabpanel" id={`${id}-save-panel`} aria-labelledby={`${id}-save-tab`} hidden={view!=="save"}>{paid&&<div className="lesson-save-video"><h3>Keep your video</h3>{files.video?<a className="button primary" href={files.video.url} download={`novasprout-video-lesson.${files.video.extension}`}>Save my video</a>:<><p>Watch your video all the way through to make a copy you can keep.</p><button type="button" className="button secondary" onClick={()=>setView("watch")}>Go to my video</button></>}{files.captions&&<a className="button secondary" href={files.captions} download="novasprout-video-captions.vtt">Save the words</a>}</div>}{resources}</div>
 </section>;
}

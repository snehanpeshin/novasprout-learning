"use client";
import {useCallback,useEffect,useState} from "react";
import InteractiveLessonPlayer from "./InteractiveLessonPlayer";
import {emptyProgress,type SavedLesson,type LessonProgress} from "../lib/lessonLibrary";
import {useStudentSession,libraryHeaders} from "./useStudentSession";
import {useLessonProgressSync} from "./useLessonProgressSync";
export default function SavedLessonReader({lessonId}:{lessonId:string}){
  const {session,loading:authLoading,refresh}=useStudentSession();
  const [record,setRecord]=useState<SavedLesson|null>(null),[progress,setProgress]=useState<LessonProgress>(emptyProgress),[loading,setLoading]=useState(false),[error,setError]=useState("");
  const [owner,setOwner]=useState("");
  const load=useCallback(async()=>{
    if(!session.accountId)return;setRecord(null);setLoading(true);setError("");
    try{const response=await fetch("/api/student-library/"+lessonId,{headers:libraryHeaders(session.accountId),cache:"no-store"}),data=await response.json();if(!response.ok)throw new Error(data.error||"This lesson could not be loaded.");setRecord(data.lesson);setProgress(data.lesson.progress);setOwner(session.accountId);}
    catch(failure){setError(failure instanceof Error?failure.message:"This lesson could not be loaded.");}
    finally{setLoading(false);}
  },[lessonId,session.accountId]);
  useEffect(()=>{if(session.active&&(!record||owner!==session.accountId))void load();},[session.active,session.accountId,load,record,owner]);
  const sync=useLessonProgressSync({lessonId:record?.lessonId||null,accountId:owner,initialVersion:record?.version||1,initialProgress:record?.progress||emptyProgress(),progress});
  if(!record&&(authLoading||loading))return <section className="student-library"><p role="status">Opening your saved lesson...</p></section>;
  if(!record)return <section className="student-library"><a href="/library">Back to My learning</a><h1>Continue learning</h1>{error?<p className="form-error" role="alert">{error}</p>:<p>Sign in to open your private saved lesson.</p>}{session.active?<button className="button primary" type="button" onClick={()=>void load()}>Retry</button>:<a className="button primary" href="/api/student-auth/login?returnTo=%2Flibrary">Sign in to My learning</a>}</section>;
  const visible=session.active&&session.accountId===owner&&!authLoading;
  return <section className="student-library saved-lesson-reader">
    <a className="library-back" href="/library">Back to My learning</a>
    {!visible&&<article className="library-welcome" aria-label="Saved lesson locked"><h1>Sign in to reopen your lesson.</h1><p>Your session needs to be checked before your private lesson is shown. Any unsaved work stays in this tab.</p><a className="button primary" href="/api/student-auth/login?returnTo=%2Flibrary" target="_blank" rel="noopener noreferrer">Sign in in another tab</a><button className="button secondary" type="button" onClick={()=>void refresh()}>Check sign-in again</button></article>}
    <div hidden={!visible}>
    <div className="library-heading"><div><p className="eyebrow">{record.subject} · {record.grade}</p><h1>{record.title}</h1><p>{record.topic}</p></div><a className="button secondary" href="/ai-lesson-generator#generator">Create another lesson</a></div>
    <div className="library-save-status" aria-live="polite"><strong>{sync.status||"Your saved place is ready."}</strong>{sync.savedAt&&<span>Last saved {new Date(sync.savedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}</span>}</div>
    {sync.error&&<div className="library-save-error" role="alert"><p>{sync.error}</p>{sync.conflict?<button className="button secondary" type="button" onClick={()=>window.location.reload()}>Reload latest progress</button>:<button className="button secondary" type="button" onClick={()=>void sync.retry()}>Retry saving</button>}<a href="/api/student-auth/login?returnTo=%2Flibrary" target="_blank" rel="noopener noreferrer">Sign in in another tab</a><button className="text-button" type="button" onClick={()=>{void refresh();void sync.retry();}}>Check sign-in and retry</button></div>}
    <InteractiveLessonPlayer key={record.lessonId+":"+record.version} lesson={record.lesson} accessToken="" lessonTicket="" active={visible} initialProgress={record.progress} onProgressChange={setProgress}/>
    <details className="library-full-lesson"><summary>Read the saved lesson</summary><h2>{record.lesson.title}</h2>{record.lesson.conceptExplanation&&<p>{record.lesson.conceptExplanation}</p>}{record.lesson.guidedExample&&<><h3>Worked example</h3><p>{record.lesson.guidedExample}</p></>}{record.lesson.fullLessonSegments?.map((part,index)=><article key={index}><h3>{part.title}</h3><p>{part.activity}</p></article>)}</details>
    <p className="library-small">Your written lesson and practice are saved. This player uses your device's synthetic voice and does not generate new AI content. New AI lessons and live tutor follow-ups require their own eligible access.</p>
    </div>
  </section>;
}

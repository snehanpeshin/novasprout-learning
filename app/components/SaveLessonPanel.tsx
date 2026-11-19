"use client";
import {useEffect,useState,useRef} from "react";
import type {InteractiveLesson} from "../lib/interactiveLesson";
import {emptyProgress,type LessonContext,type LessonProgress} from "../lib/lessonLibrary";
import {useStudentSession,libraryHeaders} from "./useStudentSession";
import {useLessonProgressSync} from "./useLessonProgressSync";
export default function SaveLessonPanel({lesson,context,progress}:{lesson:InteractiveLesson;context:LessonContext;progress:LessonProgress}){
  const {session,loading,error:sessionError,refresh}=useStudentSession();
  const [saved,setSaved]=useState<{id:string;version:number;initial:LessonProgress;existing:boolean;owner:string}|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const previousOwner=useRef("");
  useEffect(()=>{if(session.accountId&&previousOwner.current&&session.accountId!==previousOwner.current){setSaved(null);setError("");}if(session.accountId)previousOwner.current=session.accountId;},[session.accountId]);
  const sync=useLessonProgressSync({lessonId:saved&&!saved.existing?saved.id:null,accountId:saved?.owner||session.accountId||"",initialVersion:saved?.version||1,initialProgress:saved?.initial||emptyProgress(),progress});
  async function save(){
    if(!session.accountId)return;setBusy(true);setError("");
    try{
      const response=await fetch("/api/student-library",{method:"POST",headers:libraryHeaders(session.accountId),body:JSON.stringify({lesson,context,progress})}),data=await response.json();
      if(!response.ok)throw new Error(data.error||"This lesson could not be saved.");
      setSaved({id:data.lessonId,version:data.version,initial:progress,existing:Boolean(data.alreadySaved),owner:session.accountId});
    }catch(failure){setError(failure instanceof Error?failure.message:"This lesson could not be saved.");}
    finally{setBusy(false);}
  }
  return <aside className="save-lesson-panel" aria-label="Save your learning">
    <div><p className="eyebrow">Keep your place</p><h3>Come back to this lesson.</h3><p>Save the written lesson, practice, and quiz progress to your private account. Your library follows you across devices. Download videos and PDFs separately if you want to keep those files.</p></div>
    {loading?<p role="status">Checking student sign-in...</p>:session.active?<div>
      <p className="library-account-label">Signed in as {session.email}</p>
      {saved?<><p role="status">{saved.existing?"This lesson is already in your library. Open its saved copy to continue from the latest progress.":sync.status||"Lesson saved to My learning."}</p><a className="button secondary" href={"/library/"+saved.id}>Open saved lesson</a></>:<button type="button" className="button primary" disabled={busy} onClick={save}>{busy?"Saving lesson...":"Save to My learning"}</button>}
      {sync.savedAt&&<p className="library-small">Last saved {new Date(sync.savedAt).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}.</p>}
      {sync.error&&<div role="alert"><p>{sync.error}</p>{sync.conflict?<a href={"/library/"+saved?.id}>Open the latest saved progress</a>:<button type="button" className="text-button" onClick={()=>void sync.retry()}>Retry saving progress</button>}</div>}
    </div>:<div>
      <a className="button primary" href="/api/student-auth/login?returnTo=%2Flibrary" target="_blank" rel="noopener noreferrer">Sign in to save this lesson</a>
      <p className="library-small">Sign-in opens in another tab so your current lesson stays here. Return to this tab after signing in.</p>
      <button className="text-button" type="button" onClick={()=>void refresh()}>I have signed in — check again</button>
    </div>}
    {!session.configured&&<p role="status">Student sign-in is temporarily unavailable. Keep this page open and try again later.</p>}
    {(error||sessionError)&&<p className="form-error" role="alert">{error||sessionError}</p>}
  </aside>;
}

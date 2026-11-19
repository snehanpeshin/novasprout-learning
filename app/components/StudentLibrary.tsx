"use client";
import {useCallback,useEffect,useState} from "react";
import type {LessonSummary} from "../lib/lessonLibrary";
import {useStudentSession,libraryHeaders,signOutStudent} from "./useStudentSession";
export default function StudentLibrary(){
  const {session,loading,error:authError,refresh}=useStudentSession();
  const [lessons,setLessons]=useState<LessonSummary[]>([]),[cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(""),[confirmDelete,setConfirmDelete]=useState("");
  useEffect(()=>{const auth=new URLSearchParams(window.location.search).get("auth");if(auth==="failed")setError("Sign-in was not completed. Please try again.");if(auth==="unavailable")setError("Student sign-in is temporarily unavailable. Please try again later.");},[]);
  const load=useCallback(async(next?:string)=>{
    if(!session.accountId)return;setBusy(true);setError("");
    try{const response=await fetch("/api/student-library"+(next?"?cursor="+encodeURIComponent(next):""),{headers:libraryHeaders(session.accountId),cache:"no-store"}),data=await response.json();if(!response.ok)throw new Error(data.error||"Your lessons could not be loaded.");setLessons(items=>next?[...items,...data.lessons.filter((item:LessonSummary)=>!items.some(saved=>saved.lessonId===item.lessonId))]:data.lessons);setCursor(data.cursor);}
    catch(failure){setError(failure instanceof Error?failure.message:"Your lessons could not be loaded.");}
    finally{setBusy(false);}
  },[session.accountId]);
  useEffect(()=>{setLessons([]);setCursor(null);if(session.active)void load();},[session.active,load]);
  async function remove(id:string){
    if(!session.accountId)return;setBusy(true);setError("");
    try{const response=await fetch("/api/student-library/"+id,{method:"DELETE",headers:libraryHeaders(session.accountId)}),data=await response.json();if(!response.ok)throw new Error(data.error||"The lesson could not be removed.");setLessons(items=>items.filter(item=>item.lessonId!==id));setConfirmDelete("");}
    catch(failure){setError(failure instanceof Error?failure.message:"The lesson could not be removed.");}
    finally{setBusy(false);}
  }
  async function logout(){try{await signOutStudent();}catch(failure){setError(failure instanceof Error?failure.message:"Sign out failed.");}}
  return <section className="student-library">
    <div className="library-heading"><div><p className="eyebrow">My learning</p><h1>A place to pick up where you left off.</h1><p>Your saved lessons, written practice, and quiz progress stay together across devices.</p></div>{session.active&&<div className="library-account"><span>{session.email}</span><button className="button secondary" type="button" onClick={logout}>Sign out</button></div>}</div>
    {loading?<p role="status">Checking student sign-in...</p>:!session.active?<article className="library-welcome">
      <p className="eyebrow">Your private learning space</p><h2>Save today. Continue tomorrow.</h2>
      <ul><li>Keep the written lessons you want to revisit.</li><li>Resume at the same learning step with your attempts intact.</li><li>See first-try quiz answers and corrections separately.</li></ul>
      <a className="button primary" href="/api/student-auth/login?returnTo=%2Flibrary">Sign in or create an account</a><a className="button secondary" href="/ai-lesson-generator?sample=1#generator">Explore the free sample</a>
      <p className="library-small">For learners under 18, a parent or guardian should manage this account. Sign-in uses a verified email, password, and authenticator app. A learning account does not purchase lessons or unlock new AI generation.</p>
      {!session.configured&&<p role="status">Student sign-in is temporarily unavailable. Please try again later.</p>}
    </article>:<>
      <div className="library-toolbar"><a className="button primary" href="/ai-lesson-generator#generator">Create a new lesson</a><button className="button secondary" type="button" disabled={busy} onClick={()=>void load()}>Refresh library</button></div>
      {!busy&&!error&&lessons.length===0&&<article className="library-welcome"><h2>Your next lesson starts here.</h2><p>Open a lesson, choose “Save to My learning,” and it will appear here. You can save the free sample too.</p><a className="button primary" href="/ai-lesson-generator?sample=1#generator">Open a lesson to save</a></article>}
      <div className="library-grid">{lessons.map(item=><article className="library-card" key={item.lessonId}><div className="library-card-top"><span>{item.subject} · {item.grade}</span><strong>{item.percent===100?"Practice reviewed":item.completedParts?"In progress":"Ready to begin"}</strong></div><h2><a href={"/library/"+item.lessonId}>{item.title}</a></h2><p>{item.topic}</p><progress value={item.completedParts} max={item.totalParts||1} aria-label={item.title+" parts reviewed"}/><p>{item.completedParts} of {item.totalParts} learning parts reviewed · {item.percent}%</p><p className="library-small">{item.firstTry} of {item.totalChecks} quiz checks correct on first try · {item.corrected} corrected after feedback.</p><p className="library-small">Last saved {new Date(item.updatedAt).toLocaleDateString()}.</p><a className="button primary" href={"/library/"+item.lessonId}>{item.percent===100?"Revisit lesson":"Continue learning"}</a>{confirmDelete===item.lessonId?<div className="library-delete-confirm"><p>Remove this lesson and its saved progress?</p><button className="text-button" disabled={busy} type="button" onClick={()=>void remove(item.lessonId)}>Yes, remove lesson</button><button className="text-button" type="button" onClick={()=>setConfirmDelete("")}>Keep lesson</button></div>:<button className="text-button library-remove" type="button" onClick={()=>setConfirmDelete(item.lessonId)}>Remove lesson</button>}</article>)}</div>
      {cursor&&<button className="button secondary" disabled={busy} type="button" onClick={()=>void load(cursor)}>Load more lessons</button>}
      {busy&&<p role="status">Loading your library...</p>}
      <p className="library-small">Progress records practice and review, not proven mastery. Written lessons remain available after live tutor access expires; download videos and PDFs separately to keep those files.</p>
    </>}
    {(error||authError)&&<div className="form-error" role="alert"><p>{error||authError}</p><button className="text-button" type="button" onClick={()=>{void refresh();if(session.active)void load();}}>Try again</button></div>}
  </section>;
}

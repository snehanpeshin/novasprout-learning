"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import type {LessonProgress} from "../lib/lessonLibrary";
import {libraryHeaders} from "./useStudentSession";
export function useLessonProgressSync({lessonId,accountId,initialVersion,initialProgress,progress}:{lessonId:string|null;accountId:string;initialVersion:number;initialProgress:LessonProgress;progress:LessonProgress}){
  const [status,setStatus]=useState(""),[error,setError]=useState(""),[conflict,setConflict]=useState(false),[savedAt,setSavedAt]=useState("");
  const scope=useRef(0);
  const baseline=useRef(""),latest=useRef(progress),version=useRef(initialVersion),busy=useRef(false),stopped=useRef(false),alive=useRef(true),timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{scope.current++;busy.current=false;baseline.current=JSON.stringify(initialProgress);version.current=initialVersion;stopped.current=false;setConflict(false);setError("");setStatus("");},[lessonId,accountId,initialVersion]);
  latest.current=progress;
  const flush=useCallback(async()=>{
    if(!lessonId||!accountId||busy.current||stopped.current)return;
    const run=scope.current;busy.current=true;
    try{
      while(run===scope.current&&JSON.stringify(latest.current)!==baseline.current&&!stopped.current){
        const snapshot=latest.current,serialized=JSON.stringify(snapshot),body=JSON.stringify({version:version.current,progress:snapshot});
        if(alive.current){setStatus("Saving progress...");setError("");}
        const send=()=>fetch("/api/student-library/"+lessonId,{method:"PATCH",headers:libraryHeaders(accountId),body,keepalive:new TextEncoder().encode(body).length<60000});
        let response=await send();if(run!==scope.current)return;
        if(response.status===401){
          const refreshed=await fetch("/api/student-auth/session",{cache:"no-store"}).then(r=>r.json());
          if(run!==scope.current)return;
          if(refreshed.active&&refreshed.accountId===accountId)response=await send();
        }
        const data=await response.json();if(run!==scope.current)return;
        if(!response.ok){if(response.status===409){stopped.current=true;if(alive.current)setConflict(true);}throw new Error(data.error||"Your progress could not be saved. Keep this page open and retry.");}
        version.current=data.version;baseline.current=serialized;
        if(alive.current){setSavedAt(data.updatedAt);setStatus("Progress saved");}
      }
    }catch(failure){if(alive.current){setError(failure instanceof Error?failure.message:"Your progress could not be saved.");setStatus("Changes not saved");}}
    finally{if(run===scope.current)busy.current=false;}
  },[lessonId,accountId]);
  useEffect(()=>{
    if(!lessonId||!accountId||JSON.stringify(progress)===baseline.current)return;
    setStatus("Changes ready to save");
    if(timer.current)clearTimeout(timer.current);
    timer.current=setTimeout(()=>{void flush();},900);
    return()=>{if(timer.current)clearTimeout(timer.current);};
  },[progress,lessonId,accountId,flush]);
  useEffect(()=>{
    alive.current=true;
    const visibility=()=>{if(document.hidden)void flush();};
    const leave=(event:BeforeUnloadEvent)=>{if(lessonId&&JSON.stringify(latest.current)!==baseline.current){event.preventDefault();event.returnValue="";}};
    document.addEventListener("visibilitychange",visibility);window.addEventListener("beforeunload",leave);
    return()=>{alive.current=false;if(timer.current)clearTimeout(timer.current);document.removeEventListener("visibilitychange",visibility);window.removeEventListener("beforeunload",leave);};
  },[lessonId,flush]);
  return {status,error,conflict,savedAt,retry:flush};
}

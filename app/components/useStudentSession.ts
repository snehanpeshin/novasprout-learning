"use client";
import {useCallback,useEffect,useRef,useState} from "react";
export type StudentAccount={configured:boolean;active:boolean;accountId?:string;email?:string;message?:string};
const sessionChannel="novasprout-student-session";
export function useStudentSession(){
  const [session,setSession]=useState<StudentAccount>({configured:true,active:false}),[loading,setLoading]=useState(true),[error,setError]=useState("");
  const generation=useRef(0);
  const refresh=useCallback(async()=>{
    const run=++generation.current;
    try{const response=await fetch("/api/student-auth/session",{cache:"no-store"}),data=await response.json();if(!response.ok)throw new Error("Sign-in status could not be checked.");if(run===generation.current){setSession(data);setError("");return data as StudentAccount;}return null;}
    catch(failure){if(run===generation.current)setError(failure instanceof Error?failure.message:"Sign-in status could not be checked.");return null;}
    finally{if(run===generation.current)setLoading(false);}
  },[]);
  useEffect(()=>{
    void refresh();
    const lock=()=>{generation.current++;setSession(current=>({configured:current.configured,active:false}));setLoading(false);};
    const focus=()=>{setLoading(true);setSession(current=>({configured:current.configured,active:false}));void refresh();};
    const show=(event:PageTransitionEvent)=>{if(event.persisted)focus();};
    const channel=typeof BroadcastChannel!=="undefined"?new BroadcastChannel(sessionChannel):null;
    if(channel)channel.onmessage=event=>{if(event.data?.type==="signed-out")lock();};
    window.addEventListener("focus",focus);window.addEventListener("pageshow",show);window.addEventListener("novasprout-student-signed-out",lock);
    const timer=window.setInterval(()=>void refresh(),8*60*1000);
    return()=>{generation.current++;channel?.close();window.removeEventListener("focus",focus);window.removeEventListener("pageshow",show);window.removeEventListener("novasprout-student-signed-out",lock);window.clearInterval(timer);};
  },[refresh]);
  return {session,loading,error,refresh};
}
export function libraryHeaders(accountId:string){return {"Content-Type":"application/json","x-novasprout-library":"1","x-student-account":accountId};}
export async function signOutStudent(){
  const response=await fetch("/api/student-auth/logout",{method:"POST",headers:{"x-novasprout-library":"1"}}),data=await response.json();
  if(!response.ok||!data.url)throw new Error("Could not sign out. Please try again.");
  if(typeof BroadcastChannel!=="undefined"){const channel=new BroadcastChannel(sessionChannel);channel.postMessage({type:"signed-out"});channel.close();}
  window.dispatchEvent(new Event("novasprout-student-signed-out"));window.location.assign(data.url);
}

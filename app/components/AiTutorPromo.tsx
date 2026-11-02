"use client";
import {useEffect,useRef,useState} from "react";
import {usePathname} from "next/navigation";
import {ArrowRight,Sparkles,X} from "lucide-react";
export default function AiTutorPromo(){
 const path=usePathname(),[open,setOpen]=useState(false),launcher=useRef<HTMLButtonElement>(null);
 useEffect(()=>{try{setOpen(path==="/"&&sessionStorage.getItem("novasprout_promo_dismissed")!=="1");}catch{setOpen(path==="/");}},[path]);
 function close(restoreFocus=false){setOpen(false);try{sessionStorage.setItem("novasprout_promo_dismissed","1");}catch{}if(restoreFocus)launcher.current?.focus();}
 return <><button ref={launcher} className="ns-ai-promo-launcher" type="button" aria-expanded={open} aria-controls="ai-tutor-promo" onClick={()=>open?close():setOpen(true)}><Sparkles size={19} aria-hidden="true"/>Try AI Tutor</button>{open&&<aside id="ai-tutor-promo" className="ns-ai-promo-panel" aria-labelledby="ai-promo-title" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close(true);}}}><button type="button" className="ns-ai-promo-close" aria-label="Close AI tutor promo" onClick={()=>close(true)}><X size={20}/></button><p className="ns-eyebrow">Try the AI tutor</p><h2 id="ai-promo-title">Bring a topic. Try a lesson.</h2><p>Explore personalized AI learning with our demo access code.</p><div className="ns-ai-promo-code"><span>Demo code</span><code>NovaSprout2026</code></div><a className="ns-button ns-button-primary" href="/ai-lesson-generator?promo=NovaSprout2026#generator" onClick={()=>close()}>Try with this promo <ArrowRight size={18}/></a><a className="ns-text-link" href="/ai-lesson-generator?sample=1#generator" onClick={()=>close()}>Or explore the free sample</a><p className="ns-small-note">The code is applied automatically. No purchase is made by opening the demo.</p></aside>}</>;
}

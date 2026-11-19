"use client";
import Script from "next/script";
import {usePathname} from "next/navigation";
export default function MarketingScripts(){
  const path=usePathname();
  if(path.startsWith("/library")||path==="/admin"||path==="/ai-lesson-generator"||path==="/curriculum-demo")return null;
  return <><Script src="https://www.googletagmanager.com/gtag/js?id=AW-18335791503" strategy="afterInteractive"/><Script crossOrigin="anonymous" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6605747981994820" strategy="afterInteractive"/></>;
}

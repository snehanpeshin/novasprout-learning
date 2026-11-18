import { useId } from "react";
import type { DemoId } from "../lib/presentationDemos";
export default function PresentationDiagram({ demo, scene }: { demo: DemoId; scene: number }) {
  const titleId = useId();
  const active = Math.min(scene, 2);
  return <svg viewBox="0 0 640 390" role="img" aria-labelledby={titleId} className="presentation-diagram">
    <title id={titleId}>{demo === "math" ? "Equal-sized whole bars showing one half and two quarters" : demo === "science" ? "Water cycle: evaporation, condensation, precipitation, and collection" : "A robot moves one square per repeat, for three repeats"}</title>
    {demo === "math" ? <>
      <text x="40" y="45" className="diagram-heading">Keep the whole the same size</text>
      <text x="40" y="96">One whole → two equal parts</text>
      {[0, 1].map(i => <rect key={i} x={40+i*280} y="115" width="280" height="65" fill={active>=1&&i===0?"#1976d2":"#eef4fa"} stroke="#173e53" strokeWidth="2"/>)}
      <text x="180" y="157" textAnchor="middle" fill={active>=1?"white":"#173e53"}>1/2</text>
      <text x="460" y="157" textAnchor="middle">1/2</text>
      <text x="40" y="230">One whole → four equal parts</text>
      {[0,1,2,3].map(i => <g key={i}><rect x={40+i*140} y="250" width="140" height="65" fill={active>=2&&i<2?"#246e59":"#eef4fa"} stroke="#173e53" strokeWidth="2"/><text x={110+i*140} y="292" textAnchor="middle" fill={active>=2&&i<2?"white":"#173e53"}>1/4</text></g>)}
      <text x="320" y="365" textAnchor="middle">{active>=2?"Same selected amount: 1/2 = 2/4":active===1?"Selected: one half":"Each bar represents one whole"}</text>
    </> : demo === "science" ? <>
      <defs><marker id={titleId+"arrow"} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#216d8d"/></marker></defs>
      <circle cx="85" cy="72" r="34" fill="#f8cd57" stroke="#805e18" strokeWidth="2"/><text x="85" y="130" textAnchor="middle">Sunlight</text>
      <path d="M30 305 Q90 280 150 305 T270 305 T390 305 T510 305 T620 305 V365 H30Z" fill="#bee1f7" stroke="#216d8d" strokeWidth="2"/>
      <text x="320" y="350" textAnchor="middle">Collection: liquid water</text>
      <path d="M220 70 C205 35 260 18 280 50 C310 15 355 32 355 60 C405 35 440 75 408 103 H225 C190 103 185 78 220 70Z" fill={active===1?"#d4ebdf":"#edf3fa"} stroke="#216d8d" strokeWidth="2"/>
      <text x="355" y="148" textAnchor="middle">Cloud: tiny droplets / ice</text>
      <path d="M190 275 Q175 180 235 115" fill="none" stroke={active===0?"#b97813":"#216d8d"} strokeWidth={active===0?6:3} strokeDasharray="9 7" markerEnd={"url(#"+titleId+"arrow)"}/>
      <text x="45" y="205">Evaporation</text><text x="45" y="232" fontSize="17">liquid → gas</text>
      <text x="320" y="185" textAnchor="middle" fill={active===1?"#246e59":"#173e53"}>Condensation</text><text x="320" y="213" textAnchor="middle" fontSize="17">gas → liquid</text>
      <path d="M445 115 Q620 180 590 270" fill="none" stroke={active===2?"#1976d2":"#216d8d"} strokeWidth={active===2?6:3} markerEnd={"url(#"+titleId+"arrow)"}/>
      <text x="430" y="224">Precipitation</text><text x="440" y="251" fontSize="17">rain falls</text>
      <text x="320" y="387" textAnchor="middle" fontSize="16">Dashed arrow shows movement of invisible water vapor.</text>
    </> : <>
      <text x="40" y="45" className="diagram-heading">A repeat loop · pseudocode</text>
      <rect x="40" y="68" width="560" height="114" rx="16" fill="#152b3b"/>
      <text x="65" y="110" fill="#f8d773" fontFamily="monospace">repeat 3 times:</text>
      <text x="92" y="150" fill="white" fontFamily="monospace">move 1 square right</text>
      {[0,1,2,3].map(i=><g key={i}><rect x={70+i*125} y="225" width="125" height="65" fill={i>0&&active>0?"#d8ece5":"#eef4fa"} stroke="#173e53" strokeWidth="2"/><text x={132+i*125} y="326" textAnchor="middle" fontSize="18">{i===0?"Start":"Move "+i}</text></g>)}
      <g transform={"translate("+(active===0?105:active===1?230:480)+",238)"}><rect width="44" height="34" rx="8" fill="#1976d2"/><circle cx="13" cy="14" r="4" fill="white"/><circle cx="31" cy="14" r="4" fill="white"/><path d="M12 34V42M32 34V42" stroke="#173e53" strokeWidth="4"/></g>
      <text x="320" y="375" textAnchor="middle">{active===2?"3 repeats × 1 square = 3 squares":"One move adds one square to the right."}</text>
    </>}
  </svg>;
}

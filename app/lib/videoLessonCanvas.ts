import type {VideoScene} from "./videoLesson";
export function wrappedCanvasText(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines=4){
 const words=text.split(/\s+/),lines:string[]=[];let line="";
 for(const word of words){if(ctx.measureText(word).width>width){if(line){lines.push(line);line="";}let chunk="";for(const ch of word){if(chunk&&ctx.measureText(chunk+ch).width>width){lines.push(chunk);chunk=ch;}else chunk+=ch;}line=chunk;}else if(line&&ctx.measureText(line+" "+word).width>width){lines.push(line);line=word;}else line+=(line?" ":"")+word;}
 if(line)lines.push(line);lines.slice(0,maxLines).forEach((s,i)=>ctx.fillText(s,x,y+i*lineHeight));
}
export function drawVideoScene(canvas:HTMLCanvasElement,scene:VideoScene,index:number,count:number,progress:number,reducedMotion=false){
 const c=canvas.getContext("2d");if(!c)return;c.setTransform(2,0,0,2,0,0);c.fillStyle="#f3faf6";c.fillRect(0,0,640,520);
 const box=(x:number,y:number,w:number,h:number,fill:string)=>{c.fillStyle=fill;c.beginPath();c.roundRect(x,y,w,h,14);c.fill();};
 c.fillStyle="#257655";c.font="bold 15px Arial";c.fillText(`NovaSprout | Scene ${index+1} of ${count}`,30,28);
 c.font="bold 27px Arial";c.fillStyle="#173e35";wrappedCanvasText(c,scene.title,30,66,580,31,2);
 const v=scene.visual,colors=["#317d61","#286db4","#9b5936","#7754a5","#a37018"],motion=reducedMotion?1:Math.min(1,progress*6+0.1);
 const fractionBar=(total:number,selected:number,y:number)=>{const left=60,width=520,height=58;c.fillStyle="#ffe3a1";c.fillRect(left,y,width,height);for(let part=0;part<selected;part++){c.fillStyle="#4a9976";c.fillRect(left+part*width/total,y,width/total,height);}c.strokeStyle="#365e4e";c.lineWidth=2;c.strokeRect(left,y,width,height);for(let part=1;part<total;part++){c.beginPath();c.moveTo(left+part*width/total,y);c.lineTo(left+part*width/total,y+height*motion);c.stroke();}};
 if(v.kind==="fraction"){
  if(v.representation==="bar"){c.fillStyle="#246b54";c.font="bold 39px Arial";c.fillText(`${v.selected}/${v.total}`,60,183);fractionBar(v.total,v.selected,220);c.fillStyle="#173e35";c.font="22px Arial";wrappedCanvasText(c,`${v.selected} of ${v.total} equal parts of one whole`,60,325,520,27,2);if(v.labels[0])wrappedCanvasText(c,v.labels[0],60,385,520,24,1);}
  else{const cx=195,cy=255,r=103;c.beginPath();c.arc(cx,cy,r+7,0,Math.PI*2);c.fillStyle="#bc8c55";c.fill();
   for(let i=0;i<v.total;i++){const a=-Math.PI/2+i*2*Math.PI/v.total;c.beginPath();c.moveTo(cx,cy);c.arc(cx,cy,r,a,a+2*Math.PI/v.total);c.closePath();c.fillStyle=i<v.selected?"#4a9976":"#ffe3a1";c.fill();c.strokeStyle="#fffef4";c.lineWidth=3;c.stroke();}
   c.fillStyle="#246b54";c.font="bold 48px Arial";c.fillText(`${v.selected}/${v.total}`,370,235);c.font="20px Arial";wrappedCanvasText(c,`${v.selected} of ${v.total} equal parts`,340,280,265,25,3);if(v.labels[0])wrappedCanvasText(c,v.labels[0],340,344,260,20,4);}
 }else if(v.kind==="comparison"&&v.representation==="bar"){
  v.labels.forEach((label,i)=>{const match=label.match(/\b(\d{1,2})\/(\d{1,2})\b/)!;const y=175+i*115;c.fillStyle="#173e35";c.font="20px Arial";wrappedCanvasText(c,label,60,y-18,520,22,1);fractionBar(Number(match[2]),Number(match[1]),y);});
 }else if(v.kind==="number_line"){
  const left=55,right=585,y=280,map=(n:number)=>left+(n-v.min)/(v.max-v.min)*(right-left);c.strokeStyle="#315f50";c.lineWidth=3;c.beginPath();c.moveTo(left,y);c.lineTo(right,y);c.stroke();c.font="17px Arial";c.fillStyle="#173e35";
  for(let i=0;i<=4;i++){const x=left+(right-left)*i/4;c.beginPath();c.moveTo(x,y-9);c.lineTo(x,y+9);c.stroke();if(i===0||i===4){const value=String(i===0?v.min:v.max);c.fillText(value,Math.max(25,Math.min(x-c.measureText(value).width/2,615-c.measureText(value).width)),y+33);}}
  v.values.forEach((n,i)=>{const x=map(n);c.beginPath();c.arc(x,y,8+(reducedMotion?0:2*Math.sin(progress*8)),0,Math.PI*2);c.fillStyle=colors[i];c.fill();const ly=195+i*27;c.font="bold 18px Arial";wrappedCanvasText(c,v.labels[i],Math.max(32,Math.min(x-50,465)),ly,140,21,2);c.strokeStyle=colors[i];c.beginPath();c.moveTo(x,y-13);c.lineTo(x,ly+8);c.stroke();});
 }else if(v.kind==="bar_chart"){
  const max=Math.max(...v.values),w=530/v.labels.length;v.values.forEach((n,i)=>{const height=n/max*160*motion,x=55+i*w;box(x,330-height,w-18,height,colors[i]);c.fillStyle="#173e35";c.font="bold 19px Arial";c.fillText(String(n),x,315-height);c.font="14px Arial";wrappedCanvasText(c,v.labels[i],x,353,w-12,17,4);});c.fillStyle="#526d61";c.font="15px Arial";c.fillText("0",30,337);
 }else if(v.kind==="equation"){
  v.labels.forEach((label,i)=>{box(35,145+i*49,570,43,i===Math.min(v.labels.length-1,Math.floor(progress*v.labels.length))?"#d4ebdf":"#fff");c.fillStyle="#28654f";c.font="bold 20px Arial";c.fillText(String(i+1),48,172+i*49);c.fillStyle="#173e35";c.font="19px Arial";wrappedCanvasText(c,label,82,164+i*49,505,19,2);});
 }else{
  const cols=2,rows=Math.ceil(v.labels.length/cols),height=Math.min(110,250/rows);v.labels.forEach((label,i)=>{const x=35+(i%cols)*295,y=145+Math.floor(i/cols)*(height+8),active=Math.min(v.labels.length-1,Math.floor(progress*v.labels.length));box(x,y,275,height,i===active?"#d4ebdf":"#fff");c.fillStyle=colors[i%colors.length];c.font="bold 16px Arial";c.fillText(v.kind==="sequence"?`Step ${i+1}`:v.kind==="comparison"?`Compare ${i+1}`:`Idea ${i+1}`,x+14,y+25);c.fillStyle="#173e35";c.font=rows===3?"15px Arial":"18px Arial";wrappedCanvasText(c,label,x+14,y+45,248,rows===3?17:20,rows===3?3:4);});
 }
 box(25,430,590,66,"#173e35");c.fillStyle="#fff";c.font="bold 16px Arial";wrappedCanvasText(c,scene.caption,42,451,554,18,3);
}

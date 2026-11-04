import {useEffect,useRef} from 'react';

export default function OnboardingAtmosphere({image}:{image:HTMLImageElement}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current!,ctx=canvas.getContext('2d')!,media=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0,last=0,time=0,w=1,h=1,scale=1,ox=0,oy=0,dead=false;
  let seed=402;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const petals=Array.from({length:22},()=>({x:rand(),y:rand(),size:5+rand()*10,phase:rand()*6.28,speed:.018+rand()*.02}));
  function request(){if(!dead&&!frame&&!document.hidden&&!media.matches)frame=requestAnimationFrame(draw);}
  function resize(){const box=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,1.5);w=canvas.width=Math.round(box.width*dpr);h=canvas.height=Math.round(box.height*dpr);scale=Math.max(w/image.naturalWidth,h/image.naturalHeight);ox=(w-image.naturalWidth*scale)*(box.width<=650?.58:.5);oy=(h-image.naturalHeight*scale)*.5;request();}
  function draw(now:number){frame=0;if(dead||document.hidden)return;ctx.clearRect(0,0,w,h);if(media.matches)return;const dt=last?Math.min(.04,(now-last)/1000):0;last=now;time+=dt;
   const iw=image.naturalWidth,ih=image.naturalHeight;
   // The only moving texture is the open lake at the right; architecture stays fixed.
   ctx.save();ctx.translate(ox,oy);ctx.scale(scale,scale);ctx.beginPath();ctx.moveTo(iw*.755,ih*.735);ctx.lineTo(iw,ih*.735);ctx.lineTo(iw,ih);ctx.lineTo(iw*.70,ih);ctx.closePath();ctx.clip();
   for(let y=Math.floor(ih*.735);y<ih;y+=3){const depth=(y/ih-.735)/.265,dx=Math.sin(y*.12+time*.9)*(1+depth*2);const slice=Math.min(3,ih-y);ctx.drawImage(image,0,y,iw,slice,dx,y,iw,slice);}ctx.restore();
   const unit=w/1280;
   for(const p of petals){p.x+=dt*(.012+Math.sin(time*.6+p.phase)*.007);p.y+=dt*p.speed;if(p.y>1.05||p.x>1.05){p.y=-.04;p.x=rand();}ctx.save();ctx.translate(p.x*w,p.y*h);ctx.rotate(time*.45+p.phase);ctx.scale(.5+.5*Math.abs(Math.sin(time*.6+p.phase)),1);ctx.globalAlpha=.65;ctx.fillStyle='#f99dc8';ctx.beginPath();const s=p.size*unit;ctx.moveTo(-s,0);ctx.quadraticCurveTo(-s*.2,-s,s,0);ctx.quadraticCurveTo(s*.2,s*.8,-s,0);ctx.fill();ctx.strokeStyle='#ffc9e2';ctx.lineWidth=Math.max(.6,unit);ctx.beginPath();ctx.moveTo(-s*.7,0);ctx.lineTo(s*.6,0);ctx.stroke();ctx.restore();}request();
  }
  function pause(){cancelAnimationFrame(frame);frame=0;last=0;document.documentElement.toggleAttribute('data-page-hidden',document.hidden);if(media.matches)ctx.clearRect(0,0,w,h);request();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);resize();document.addEventListener('visibilitychange',pause);media.addEventListener('change',pause);
  return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',pause);media.removeEventListener('change',pause);document.documentElement.removeAttribute('data-page-hidden');};
 },[image]);
 return <canvas className="onboarding-atmosphere" ref={ref} aria-hidden="true"/>;
}

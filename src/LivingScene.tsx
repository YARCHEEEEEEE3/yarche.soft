import {useEffect,useRef} from 'react';
import {createRenderer} from './ambient/renderer';

export default function LivingScene({image}:{image:HTMLImageElement}){
  const gpu=useRef<HTMLCanvasElement>(null),fallback=useRef<HTMLCanvasElement>(null),root=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const glCanvas=gpu.current!,cpu=fallback.current!,ctx=cpu.getContext('2d')!,container=root.current!;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    let renderer=createRenderer(glCanvas,image),frame=0,last=0,time=0,dead=false,slow=0,quality=1;
    function mode(){glCanvas.style.visibility=renderer?'visible':'hidden';cpu.style.visibility=renderer?'hidden':'visible';container.dataset.renderer=renderer?'webgl':'canvas2d';}
    function request(){if(!frame&&!dead&&!document.hidden)frame=requestAnimationFrame(render);}
    function resize(){const box=container.getBoundingClientRect(),w=Math.min(2560,Math.round(box.width*Math.min(devicePixelRatio,2)*quality)),h=Math.round(w*941/1672);
      glCanvas.width=cpu.width=w;glCanvas.height=cpu.height=h;last=0;request();}
    function render(now:number){
      frame=0;if(dead||document.hidden)return;
      const elapsed=last?(now-last)/1000:0,dt=Math.min(.05,elapsed);last=now;if(!media.matches)time+=dt;
      if(elapsed>.027)slow++;else slow=Math.max(0,slow-1);
      if(slow>90&&quality===1){quality=.75;resize();}
      if(renderer)renderer.draw(time,media.matches);
      else{
        const w=cpu.width,h=cpu.height;ctx.clearRect(0,0,w,h);
        if(!media.matches){
          // Fallback distorts only water, preserving the anchored scene above it.
          ctx.save();ctx.beginPath();ctx.moveTo(w*.30,h*.79);ctx.lineTo(w,h*.79);ctx.lineTo(w,h);ctx.lineTo(w*.53,h);ctx.closePath();ctx.clip();
          for(let y=Math.floor(h*.79);y<h;y+=3){const q=(y/h-.79)/.21,dx=(Math.sin(y*.16+time)+Math.sin(y*.28-time*.7)*.4)*(1+q*2);
            ctx.drawImage(image,0,y/h*image.naturalHeight,image.naturalWidth,3/h*image.naturalHeight,dx,y,w,3);}
          ctx.restore();
        }
      }
      if(!media.matches)request();else last=0;
    }
    function pause(){cancelAnimationFrame(frame);frame=0;last=0;request();}
    function lost(e:Event){e.preventDefault();renderer=null;mode();request();}
    function restored(){renderer?.destroy();renderer=createRenderer(glCanvas,image);mode();request();}
    mode();const observer=new ResizeObserver(resize);observer.observe(container);resize();
    glCanvas.addEventListener('webglcontextlost',lost);glCanvas.addEventListener('webglcontextrestored',restored);
    document.addEventListener('visibilitychange',pause);media.addEventListener('change',pause);
    return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();renderer?.destroy();glCanvas.removeEventListener('webglcontextlost',lost);glCanvas.removeEventListener('webglcontextrestored',restored);document.removeEventListener('visibilitychange',pause);media.removeEventListener('change',pause);};
  },[image]);
  return <div className="living-scene" ref={root} aria-hidden="true"><canvas ref={gpu}/><canvas ref={fallback}/></div>;
}

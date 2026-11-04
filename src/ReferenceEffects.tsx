import {useEffect,useRef} from 'react';

function random(seed=93){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
type Ripple={x:number;y:number;age:number};

/** All loose petals are animated; the cleaned artwork contains only attached blossoms. */
export default function ReferenceEffects(){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{
    const canvas=ref.current!,ctx=canvas.getContext('2d')!,media=matchMedia('(prefers-reduced-motion: reduce)'),rand=random();
    const petals=Array.from({length:34},()=>({x:rand(),y:rand()*.95,depth:rand(),phase:rand()*Math.PI*2,angle:rand()*Math.PI*2,landing:.82+rand()*.17,float:0}));
    const ripples:Ripple[]=[];
    let frame=0,last=0,time=0,width=1,height=1,dead=false;
    const request=()=>{if(!frame&&!dead&&!document.hidden&&!media.matches)frame=requestAnimationFrame(render);};
    function resize(){const box=canvas.getBoundingClientRect();width=Math.max(1,Math.min(2560,Math.round(box.width*Math.min(devicePixelRatio,2))));height=Math.max(1,Math.round(width*box.height/Math.max(1,box.width)));canvas.width=width;canvas.height=height;last=0;request();}
    function render(now:number){
      frame=0;if(dead||document.hidden)return;if(media.matches){ctx.clearRect(0,0,width,height);return;}
      const dt=last?Math.min(.05,(now-last)/1000):0;last=now;time+=dt;ctx.clearRect(0,0,width,height);
      const scale=Math.max(width/1672,.65),arrival=Math.min(1,time/.8),wind=.012+Math.sin(time*.24)*.008;
      // Expanding elliptical ripples appear where a petal reaches the lake.
      for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.age+=dt;if(r.age>3){ripples.splice(i,1);continue;}
        ctx.save();ctx.strokeStyle='rgba(246,198,219,'+(.23*(1-r.age/3))+')';ctx.lineWidth=scale;
        for(let ring=0;ring<2;ring++){const radius=(5+r.age*19+ring*10)*scale;ctx.beginPath();ctx.ellipse(r.x*width,r.y*height,radius,radius*.2,0,0,Math.PI*2);ctx.stroke();}ctx.restore();
      }
      for(const p of petals){
        if(p.float>0){p.float+=dt;p.x+=dt*.009;p.y+=Math.sin(time*.8+p.phase)*dt*.0015;}
        else{p.x+=dt*(wind*(.8+p.depth)+Math.sin(time*.9+p.phase)*.013);p.y+=dt*(.024+p.depth*.032);p.angle+=dt*(.45+p.depth*.55);
          if(p.y>=p.landing&&p.x>.51&&p.x<.98){p.float=.001;ripples.push({x:p.x,y:p.y,age:0});}}
        if(p.y>1.04||p.x>1.04||p.float>3){p.x=rand()*.9;p.y=-.04;p.float=0;p.landing=.82+rand()*.17;}
        if(p.x<-.05)p.x=1.02;
        const size=(8+p.depth*19)*scale;
        ctx.save();ctx.globalAlpha=(.48+p.depth*.42)*arrival*(p.float?Math.max(0,1-p.float/3):1);ctx.translate(p.x*width,p.y*height);ctx.rotate(p.float?Math.sin(time*.6+p.phase)*.12:p.angle);ctx.scale(.4+Math.abs(Math.cos(time*.9+p.phase))*.6,p.float?.3:1);
        ctx.fillStyle='#ed5796';ctx.beginPath();ctx.moveTo(-size*.5,0);ctx.lineTo(-size*.12,-size*.3);ctx.lineTo(size*.3,-size*.28);ctx.lineTo(size*.5,-size*.08);ctx.lineTo(size*.25,size*.27);ctx.lineTo(-size*.18,size*.3);ctx.closePath();ctx.fill();
        ctx.fillStyle='#ffabc9';ctx.beginPath();ctx.moveTo(-size*.35,-size*.01);ctx.lineTo(size*.27,-size*.21);ctx.lineTo(size*.12,size*.06);ctx.lineTo(-size*.2,size*.19);ctx.closePath();ctx.fill();ctx.fillStyle='#ffd6e5';ctx.fillRect(-size*.1,-size*.13,size*.22,size*.1);ctx.restore();
      }
      request();
    }
    function pause(){cancelAnimationFrame(frame);frame=0;last=0;if(media.matches)ctx.clearRect(0,0,width,height);request();}
    const observer=new ResizeObserver(resize);observer.observe(canvas);resize();
    document.addEventListener('visibilitychange',pause);media.addEventListener('change',pause);
    return()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',pause);media.removeEventListener('change',pause);};
  },[]);
  return <canvas className="reference-effects" ref={ref} aria-hidden="true"/>;
}

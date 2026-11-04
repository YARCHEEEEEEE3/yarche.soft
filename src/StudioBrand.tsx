export function Blossom({className=''}:{className?:string}){
  return <svg className={className} viewBox="0 0 160 85" fill="none" aria-hidden="true"><path d="M8 80C51 59 77 60 137 8M53 59 39 30M91 43 128 48" stroke="#5e294b" strokeWidth="3"/>{[[42,32,1],[72,57,.8],[111,28,1.15],[134,12,.8],[130,47,.7]].map(([x,y,s],i)=><g key={i} transform={'translate('+x+' '+y+') scale('+s+')'}>{[0,72,144,216,288].map(a=><ellipse key={a} cy="-7" rx="5.5" ry="8.5" fill={i%2?'#ffabd0':'#f288b6'} transform={'rotate('+a+')'}/>)}<circle r="3" fill="#ffdfb6"/><circle r="1.2" fill="#c24d83"/></g>)}</svg>;
}
export default function StudioBrand({className=''}:{className?:string}){
  return <div className={'studio-brand '+className}><img className="sakyra-logo-image" src="/scene/sakyra-logo.png" alt="SAKYRA" draggable={false}/></div>;
}

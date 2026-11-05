export default function VideoVisual({kind='scenes',index=0,className=''}:{kind?:'scenes'|'characters'|'styles';index?:number;className?:string}){
 return <span className={'video-visual '+kind+' '+className} aria-hidden="true"><i style={{backgroundPosition:`${(index%3)*50}% ${index<3?0:100}%`}}/></span>;
}

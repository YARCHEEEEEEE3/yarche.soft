#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uTime;
uniform float uMotion;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;
  vec4 original=texture2D(uImage,uv);
  float t=uTime;
  // Exclude the entire logo and its decorative branches from deformation.
  float branding=smoothstep(.22,.25,uv.x)*(1.-smoothstep(.75,.78,uv.x))*
    smoothstep(.24,.27,uv.y)*(1.-smoothstep(.45,.47,uv.y));
  // Anchored cherry tree: only canopy and branch tips bend a few screen pixels.
  float canopy=(1.-smoothstep(.48,.57,uv.x))*(1.-smoothstep(.18,.28,uv.y));
  float leftBranches=(1.-smoothstep(.13,.23,uv.x))*(1.-smoothstep(.46,.61,uv.y));
  float pink=smoothstep(.46,.72,original.r)*smoothstep(.025,.17,original.r-original.g);
  float rightBlossoms=smoothstep(.80,.86,uv.x)*smoothstep(.43,.5,uv.y)*(1.-smoothstep(.65,.73,uv.y))*pink;
  float tree=max(max(canopy,leftBranches),rightBlossoms)*(1.-branding);
  vec2 displaced=uv;
  displaced.x+=(sin(t*.65+uv.y*8.)*2.2+sin(t*.31+uv.x*9.)*.8)*tree*uMotion/uResolution.x;
  displaced.y+=sin(t*.53+uv.x*8.)*.8*tree*uMotion/uResolution.y;
  // Very slow cloud drift within sky, smoothly returning to zero at patch edges.
  float cloud=smoothstep(.73,.82,uv.x)*(1.-smoothstep(.28,.35,uv.y))*smoothstep(.10,.16,uv.y);
  displaced.x+=sin(t*.12)*3.0*cloud*uMotion/uResolution.x;
  // Water-only mask: the bridge, embankments and near rocks are never translated.
  float depth=smoothstep(.785,1.,uv.y);
  float leftBank=.25+.25*smoothstep(.78,1.,uv.y);
  float water=smoothstep(.778,.798,uv.y)*smoothstep(leftBank,leftBank+.035,uv.x);
  float wave=sin(uv.y*180.+t*1.05)+.45*sin(uv.y*310.-t*.71+uv.x*8.);
  displaced.x+=wave*(.45+depth*2.8)*water*uMotion/uResolution.x;
  displaced.y+=sin(uv.x*38.+t*.72)*(.15+depth*.65)*water*uMotion/uResolution.y;
  vec4 color=texture2D(uImage,clamp(displaced,vec2(.001),vec2(.999)));
  // Restrained silver ripples; no vertical sun beam or hot white patch.
  float ripple=sin(uv.y*460.+uv.x*45.-t*.9)*sin(uv.x*76.+t*.44);
  color.rgb+=vec3(.009,.011,.015)*ripple*water*uMotion;
  // Warm windows breathe gently without moving walls or turning their cores gray.
  float warm=smoothstep(.08,.24,original.g-original.b)*smoothstep(.55,.85,original.r);
  float town=smoothstep(.65,.72,uv.x)*smoothstep(.4,.46,uv.y)*(1.-smoothstep(.78,.82,uv.y));
  float lantern=smoothstep(.13,.145,uv.x)*(1.-smoothstep(.20,.22,uv.x))*smoothstep(.63,.65,uv.y)*(1.-smoothstep(.74,.77,uv.y));
  color.rgb+=vec3(.024,.017,.007)*sin(t*1.2+uv.x*9.)*warm*max(town,lantern)*uMotion;
  gl_FragColor=vec4(clamp(color.rgb,0.,1.),1.);
}

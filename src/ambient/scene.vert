attribute vec2 aPosition;
varying vec2 vUv;
void main(){
  vUv=vec2(aPosition.x*.5+.5,.5-aPosition.y*.5);
  gl_Position=vec4(aPosition,0.,1.);
}

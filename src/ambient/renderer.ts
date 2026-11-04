import vertex from './scene.vert?raw';
import fragment from './scene.frag?raw';

export function createRenderer(canvas:HTMLCanvasElement,image:HTMLImageElement){
  const gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
  if(!gl)return null;
  const makeShader=(kind:number,source:string)=>{
    const shader=gl.createShader(kind)!;gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw new Error('Scene shader compilation failed');}
    return shader;
  };
  let vs:WebGLShader|null=null,fs:WebGLShader|null=null,program:WebGLProgram|null=null;
  let buffer:WebGLBuffer|null=null,texture:WebGLTexture|null=null;
  const destroy=()=>{if(buffer)gl.deleteBuffer(buffer);if(texture)gl.deleteTexture(texture);if(program)gl.deleteProgram(program);if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);};
  try{
    vs=makeShader(gl.VERTEX_SHADER,vertex);fs=makeShader(gl.FRAGMENT_SHADER,fragment);
    program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Scene shader linking failed');
    gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
    texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
    gl.uniform1i(gl.getUniformLocation(program,'uImage'),0);
    gl.uniform2f(gl.getUniformLocation(program,'uImageSize'),image.naturalWidth,image.naturalHeight);
    gl.uniform1f(gl.getUniformLocation(program,'uPortrait'),image.naturalHeight>image.naturalWidth?1:0);
    const clock=gl.getUniformLocation(program,'uTime'),resolution=gl.getUniformLocation(program,'uResolution'),motion=gl.getUniformLocation(program,'uMotion');
    return {
      draw(time:number,reduced:boolean){if(gl.isContextLost())return;gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(clock,time);gl.uniform2f(resolution,canvas.width,canvas.height);gl.uniform1f(motion,reduced?0:1);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);},
      destroy,
    };
  }catch{destroy();return null;}
}

import {auth} from './auth';

export class ApiError extends Error {constructor(public code:string){super(code);}}
const base=(import.meta.env.VITE_API_BASE_URL||'').replace(/\/$/,'');
export async function apiRequest(path:string,options:RequestInit={}){
 const target=new URL(base||location.origin,location.origin);
 const loopback=['localhost','127.0.0.1'];
 if(target.protocol!=='https:'&&!(target.protocol==='http:'&&loopback.includes(target.hostname)&&loopback.includes(location.hostname)))throw new ApiError('HTTPS_REQUIRED');
 // The server independently verifies the session token.
 const session=auth?await auth.auth.getSession():null;
 const token=session?.data.session?.access_token;
 let response:Response;
 try{
  response=await fetch(`${base}/api/${path}`,{...options,cache:'no-store',credentials:'omit',redirect:'error',headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})}});
 }catch(error){if(options.signal?.aborted)throw error;throw new ApiError('SERVER_UNAVAILABLE');}
 if(!response.ok){
  let code='SERVER_UNAVAILABLE';
  try{const body=await response.json();if(typeof body.code==='string')code=body.code;}catch{/* A static host can return an HTML 404. */}
  throw new ApiError(code);
 }
 return response;
}
export async function apiJson<T>(path:string,options:RequestInit={}):Promise<T>{
 const response=await apiRequest(path,options);
 if(!response.headers.get('content-type')?.includes('application/json'))throw new ApiError('SERVER_UNAVAILABLE');
 return response.json();
}

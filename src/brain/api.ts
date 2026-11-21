import {ApiError,apiJson} from '../apiClient';

export type PlanEntry={name:string;description:string};
export type Shot={description:string;durationSeconds:number};
export type Plan={characters:PlanEntry[];locations:PlanEntry[];shots:Shot[]};
export type ProjectPlan={plan:Plan;source:string;confirmed:boolean};
export type Language='uk'|'en';

export const brainApi={
 status:(signal:AbortSignal)=>apiJson<{configured:boolean}>('openai/key',{signal}),
 saveKey:(key:string,signal:AbortSignal)=>apiJson<{configured:boolean}>('openai/key',{method:'PUT',body:JSON.stringify({key}),signal}),
 removeKey:(signal:AbortSignal)=>apiJson<{configured:boolean}>('openai/key',{method:'DELETE',signal}),
 analyze:(script:string,language:Language,signal:AbortSignal)=>apiJson<Plan>('openai/plan',{method:'POST',body:JSON.stringify({script,language}),signal}),
};

const errors:Record<string,[string,string]>={
 SIGN_IN_REQUIRED:['Увійди через Google, щоб використовувати OpenAI.','Sign in with Google to use OpenAI.'],
 OPENAI_INVALID_KEY:['Введи API-ключ OpenAI, що починається з sk-.','Enter an OpenAI API key starting with sk-.'],
 OPENAI_KEY_REQUIRED:['Додай API-ключ OpenAI в налаштуваннях.','Add your OpenAI API key in Settings.'],
 OPENAI_KEY_REJECTED:['OpenAI відхилив запит. Перевір ключ і його дозволи.','OpenAI rejected the request. Check your key and its permissions.'],
 OPENAI_LIMIT:['Перевір квоту OpenAI або повтори запит пізніше.','Check your OpenAI quota or retry later.'],
 OPENAI_INVALID_PLAN:['OpenAI повернув неповний або некоректний план. Повтори запит або скороти сценарій.','OpenAI returned an incomplete or invalid plan. Retry or shorten the script.'],
 OPENAI_TIMEOUT:['OpenAI не встиг відповісти. Повтори запит або скороти сценарій.','OpenAI timed out. Retry or shorten the script.'],
 SERVER_NOT_CONFIGURED:['На сервері ще потрібно налаштувати сховище OpenAI.','The OpenAI key vault still needs to be configured on the server.'],
 SERVER_UNAVAILABLE:['API-сервер недоступний.','The API server is unavailable.'],
 HTTPS_REQUIRED:['Для підключення до API-сервера потрібен HTTPS.','Connecting to the API server requires HTTPS.'],
 REQUEST_IN_PROGRESS:['Дочекайся завершення попереднього запиту.','Wait for the previous request to finish.'],
 RATE_LIMIT:['Забагато запитів. Зачекай хвилину.','Too many requests. Wait a minute.'],
};

export function brainError(error:unknown,language:Language){
 const code=error instanceof ApiError?error.code:'';
 return (errors[code]??['Не вдалося виконати запит. Спробуй ще раз.','The request failed. Please try again.'])[language==='uk'?0:1];
}

import "whatwg-fetch";
import { isLocalDevelopment } from '@/app/lib/auth';

const SERVER_PROTOCOL = process.env.NEXT_PUBLIC_ADH_SERVER_PROTOCOL || "http";
const SERVER_PORT = process.env.NEXT_PUBLIC_ADH_SERVER_PORT || "8000";
const VERSION = process.env.NEXT_PUBLIC_ADH_SERVER_VERSION || "v0";

function getURL(): string {
  const currentHost = globalThis.location?.host;
  
  // 环境适配：本地用http，线上用https
  let protocol;
  let serverAddress;
  
  if (isLocalDevelopment(currentHost)) {
    protocol = "http";
    // 本地开发：后端固定运行在localhost:8000
    serverAddress = process.env.NEXT_PUBLIC_ADH_SERVER_IP || `localhost:${SERVER_PORT}`;
    console.log(`[API] 🔧 本地开发环境，使用HTTP协议`);
    console.log(`[API] 🔧 后端地址: ${serverAddress}`);
  } else {
    protocol = "https";
    // 生产环境：使用当前hostname（通过nginx代理）
    serverAddress = process.env.NEXT_PUBLIC_ADH_SERVER_IP || globalThis.location?.hostname;
    console.log(`[API] 🌐 生产环境，使用HTTPS协议`);
    console.log(`[API] 🌐 后端地址: ${serverAddress}`);
  }
  
  const URL = protocol + "://" + serverAddress;
  console.log(`[API] 📡 最终API基础地址: ${URL}`);
  return URL;
}

// export async function common_heatbeat_api() {
//     const URL = getURL();
//     let response = await fetch(URL + `/adh/common/${VERSION}/heartbeat`, {
//         method: "GET"
//     });
//     return response.json();
// }

export function get_heatbeat_wss() {
  const URL = getURL();
  const currentHost = globalThis.location?.host;

  // 环境适配WebSocket：本地用ws，线上用wss
  let wsURL;
  if (isLocalDevelopment(currentHost)) {
    wsURL = URL.replace(/^https?:/, "ws:");
    console.log(`[WebSocket] 🔧 本地开发环境，使用WS协议: ${wsURL}`);
  } else {
    wsURL = URL.replace(/^https?:/, "wss:");
    console.log(`[WebSocket] 🌐 生产环境，使用WSS协议: ${wsURL}`);
  }
  
  const fullWsUrl = `${wsURL}/adh/common/${VERSION}/heartbeat`;
  console.log(`[WebSocket] 📡 最终连接地址: ${fullWsUrl}`);
  
  return fullWsUrl;
}

export async function asr_infer_api(
  data: string,
  engine: string = "default",
  format: string = "wav",
  sampleRate: Number = 16000,
  sampleWidth: Number = 2,
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/adh/asr/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      format: format,
      sampleRate: sampleRate,
      sampleWidth: sampleWidth,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function tts_infer_api(
  data: string,
  engine: string = "default",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/adh/tts/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agents_list_api() {
  const URL = getURL();
  let response = await fetch(URL + `/adh/agent/${VERSION}/list`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function agent_default_api() {
  const URL = getURL();
  let response = await fetch(URL + `/adh/agent/${VERSION}/default`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  return await response.json();
}

export async function agent_settings_api(engine: string) {
  const URL = getURL();
  let response = await fetch(URL + `/adh/agent/${VERSION}/settings`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agent_conversationid_api(
  engine: string = "default",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  let response = await fetch(URL + `/adh/agent/${VERSION}/conversation_id`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      settings: settings,
      streaming: true,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.json();
}

export async function agent_infer_streaming_api(
  data: string,
  engine: string = "default",
  conversationId: string = "",
  settings: { [key: string]: string } = {}
) {
  const URL = getURL();
  // 将conversationId填充到settings中
  settings["conversation_id"] = conversationId;
  let response = await fetch(URL + `/adh/agent/${VERSION}/infer`, {
    method: "POST",
    body: JSON.stringify({
      engine: engine,
      data: data,
      // 默认使用streaming模式
      streaming: true,
      settings: settings,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  return response.body.getReader();
}

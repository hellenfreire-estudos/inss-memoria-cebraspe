import { sendNotification } from 'web-push-neo';

const cors = {
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'content-type',
  'Access-Control-Allow-Methods':'GET,POST,OPTIONS'
};
const json = (data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...cors,'content-type':'application/json'}});

async function send(sub, env, payload) {
  try {
    await sendNotification(sub, JSON.stringify(payload), {vapidDetails:{subject:env.VAPID_SUBJECT,publicKey:env.VAPID_PUBLIC_KEY,privateKey:env.VAPID_PRIVATE_KEY}, TTL:3600, urgency:'high'});
    return true;
  } catch(e) {
    if (String(e).includes('404') || String(e).includes('410')) return false;
    throw e;
  }
}

export default {
  async fetch(request, env) {
    if(request.method==='OPTIONS') return new Response('',{status:204,headers:cors});
    const url=new URL(request.url);
    if(request.method==='GET' && url.pathname==='/') return json({ok:true,service:'INSS Memória NASA Push'});
    if(request.method==='POST' && url.pathname==='/subscribe') {
      const body=await request.json();
      if(!body.subscription?.endpoint) return json({error:'subscription inválida'},400);
      await env.NASA_KV.put('subscription',JSON.stringify({subscription:body.subscription,timezone:body.timezone||'America/Sao_Paulo'}));
      return json({ok:true});
    }
    if(request.method==='POST' && url.pathname==='/schedule') {
      const body=await request.json();
      const id=crypto.randomUUID();
      await env.NASA_KV.put('schedule:'+id,JSON.stringify({...body,id,createdAt:Date.now()}));
      return json({ok:true,id});
    }
    if(request.method==='POST' && url.pathname==='/test') {
      const raw=await env.NASA_KV.get('subscription');
      if(!raw) return json({error:'nenhuma assinatura'},404);
      const obj=JSON.parse(raw);
      const ok=await send(obj.subscription,env,{title:'🚀 INSS Memória NASA',body:'Push de teste recebido. Seu NASA está conectado!',url:'./',tag:'nasa-test'});
      return json({ok});
    }
    return json({error:'not found'},404);
  },
  async scheduled(_event,env) {
    const raw=await env.NASA_KV.get('subscription');
    if(!raw) return;
    const obj=JSON.parse(raw);
    const now=Date.now();
    const list=await env.NASA_KV.list({prefix:'schedule:'});
    for(const key of list.keys){
      const item=JSON.parse(await env.NASA_KV.get(key.name));
      let due=false;
      if(item.dueAt && now>=item.dueAt) due=true;
      if(item.time){
        const parts=new Intl.DateTimeFormat('en-US',{timeZone:item.timezone||obj.timezone||'America/Sao_Paulo',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date());
        const hh=parts.find(x=>x.type==='hour')?.value, mm=parts.find(x=>x.type==='minute')?.value;
        const today=new Intl.DateTimeFormat('en-CA',{timeZone:item.timezone||obj.timezone||'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
        const stamp=`${today}T${item.time}`;
        const lastKey=`sent:${item.id}:${today}`;
        if(`${hh}:${mm}`===item.time && !(await env.NASA_KV.get(lastKey))) {due=true; await env.NASA_KV.put(lastKey,'1',{expirationTtl:172800});}
      }
      if(due){
        const ok=await send(obj.subscription,env,{title:item.title||'INSS Memória NASA',body:item.body||'Hora de relembrar!',url:item.url||'./',tag:item.tag||'nasa'});
        if(ok || item.dueAt) await env.NASA_KV.delete(key.name);
      }
    }
  }
};

/* INSS Memória NASA — Web Push client
   Sem OneSignal. O servidor é apenas o entregador das notificações.
*/
const NASA_PUSH_API = localStorage.getItem('NASA_PUSH_API') || '';
const NASA_VAPID_PUBLIC_KEY = localStorage.getItem('NASA_VAPID_PUBLIC_KEY') || '';

function base64UrlToUint8Array(base64UrlData) {
  const padding = '='.repeat((4 - base64UrlData.length % 4) % 4);
  const base64 = (base64UrlData + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}

async function nasaPushSubscribe() {
  const out = document.getElementById('notificationStatus');
  if (!NASA_PUSH_API || !NASA_VAPID_PUBLIC_KEY) {
    out.textContent = '⚙️ O Push ainda precisa da URL do servidor e da chave pública VAPID. Isso é configuração única.';
    return false;
  }
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    out.textContent = '⚠️ Este ambiente não oferece Web Push. No iPhone, abra o NASA pelo ícone instalado na Tela de Início.';
    return false;
  }
  if (!window.matchMedia('(display-mode: standalone)').matches && !navigator.standalone) {
    out.textContent = '📱 Primeiro adicione o NASA à Tela de Início e abra pelo ícone. Depois toque novamente em Ativar notificações.';
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      out.textContent = '⚠️ A permissão de notificações não foi concedida.';
      return false;
    }
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(NASA_VAPID_PUBLIC_KEY)
      });
    }
    const r = await fetch(NASA_PUSH_API.replace(/\/$/, '') + '/subscribe', {
      method: 'POST', headers: {'content-type':'application/json'},
      body: JSON.stringify({subscription: sub.toJSON(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone})
    });
    if (!r.ok) throw new Error(await r.text());
    out.textContent = '✅ NASA Push ativado neste iPhone. Você receberá horários, Você Sabia? e revisões.';
    localStorage.setItem('NASA_PUSH_ENABLED','1');
    return true;
  } catch (e) {
    console.error(e);
    out.textContent = '❌ Não foi possível ativar o Push. Confira a configuração do servidor.';
    return false;
  }
}

async function nasaPushSchedule(item) {
  if (!NASA_PUSH_API || !localStorage.getItem('NASA_PUSH_ENABLED')) return false;
  try {
    const r = await fetch(NASA_PUSH_API.replace(/\/$/, '') + '/schedule', {
      method:'POST', headers:{'content-type':'application/json'},
      body: JSON.stringify(item)
    });
    return r.ok;
  } catch (_) { return false; }
}

async function nasaPushTest() {
  const out = document.getElementById('notificationStatus');
  if (!NASA_PUSH_API || !localStorage.getItem('NASA_PUSH_ENABLED')) {
    out.textContent = '⚙️ Ative o Push primeiro.'; return;
  }
  const r = await fetch(NASA_PUSH_API.replace(/\/$/,'') + '/test', {method:'POST'});
  out.textContent = r.ok ? '🚀 Teste enviado. Bloqueie a tela e aguarde a notificação.' : '❌ O teste não foi aceito pelo servidor.';
}

function nasaScheduleErrorReview(q) {
  const wrong = (st.history[q.id] || {}).wrong || 1;
  const minutes = Math.min(1440, 10 * Math.pow(2, Math.min(wrong - 1, 7)));
  nasaPushSchedule({
    kind:'review',
    title:'🧠 INSS Memória NASA',
    body:`Hora de reforçar: ${q.disciplina}. Uma questão que você errou está pedindo revisão.`,
    url:'./?tab=mission',
    dueAt:Date.now()+minutes*60000,
    tag:`review-${q.id}`
  });
}

function nasaScheduleFixedTimes() {
  const slots=['s1','s2','s3','s4'];
  const messages=[
    ['🚀 NASA MEMÓRIA','Hora da missão rápida.'],
    ['🧠 NASA RELEMBRE','Uma revisão-relâmpago para consolidar memória.'],
    ['🌆 NASA MEMÓRIA','Hora de reforçar os pontos fracos.'],
    ['🌙 MISSÃO NASA','Sua missão principal de 30 minutos está pronta.']
  ];
  slots.forEach((id,i)=>{
    const value=document.getElementById(id)?.value;
    if(!value) return;
    nasaPushSchedule({kind:'daily',title:messages[i][0],body:messages[i][1],time:value,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,tag:`slot-${id}`});
  });
}

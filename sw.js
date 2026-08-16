const CACHE='nasa-inss-v2';
const ASSETS=['./','./index.html','./manifest.json','./questions.json','./nasa-icon.png','./push-client.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
self.addEventListener('push',event=>{
  let data={title:'🚀 INSS Memória NASA',body:'Hora de relembrar!',url:'./'};
  try{ if(event.data) data={...data,...event.data.json()}; }catch(_){ try{data.body=event.data.text()}catch(__){} }
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.tag||'nasa',data:{url:data.url||'./'},badge:'nasa-icon.png',icon:'nasa-icon.png'}));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const url=event.notification.data?.url||'./';
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){ if('focus' in c){c.focus(); if('navigate' in c)c.navigate(url); return;}}
    if(clients.openWindow)return clients.openWindow(url);
  }));
});

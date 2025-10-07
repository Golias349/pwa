const CACHE='gd-pwa-v20251005200543';
self.addEventListener('install', e=>self.skipWaiting());
self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
    const clients=await self.clients.matchAll({type:'window'});
    for(const c of clients) c.postMessage({type:'UPDATED'});
  })());
});
self.addEventListener('fetch', e=>{
  e.respondWith((async()=>{
    try{ return await fetch(e.request); }
    catch{ const c=await caches.open(CACHE); const r=await c.match(e.request); return r||Response.error(); }
  })());
});
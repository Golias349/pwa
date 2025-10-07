// SW — v6.3 (cache por pasta + update imediato)
const VERSION = 'v6.3.1';
const CACHE = `grao-digital-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './estilo.css',
  './app.js',
  './manifest.json',
  './icone.png',
  './icone-192.png',
  './icone-512.png',
  './politica.html',
  './termos.html'
];
self.addEventListener('install', (e)=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil((async()=>{
    const keys = await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', (e)=>{
  if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', (e)=>{
  const req=e.request;
  if(req.method!=='GET') return;
  if(req.headers.get('accept')?.includes('text/html')){
    e.respondWith((async()=>{
      try{
        const net = await fetch(req);
        const cache = await caches.open(CACHE); cache.put(req, net.clone());
        return net;
      }catch{
        return (await caches.match(req)) || caches.match('./index.html');
      }
    })());
  }else{
    e.respondWith((async()=>{
      const cached = await caches.match(req);
      if(cached) return cached;
      const net = await fetch(req);
      const cache = await caches.open(CACHE); cache.put(req, net.clone());
      return net;
    })());
  }
});

// NEXORA PWA: avoid caching authenticated pages and user data.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  // Always use network; Supabase authentication and feeds must not be stale.
});
self.addEventListener("push", event => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = {title:"NEXORA",body:event.data.text()}; }
  const title = String(payload.title || "NEXORA");
  const options = {body:String(payload.body || "Yeni bildirişin var."),icon:"/nexora.png",badge:"/nexora.png",tag:String(payload.tag || "nexora-notification"),data:{url:typeof payload.url==="string" && payload.url.startsWith("/") && !payload.url.startsWith("//") ? payload.url : "/"}};
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const path=event.notification.data?.url || "/";
  event.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(clients=>{
    const existing=clients.find(client=>new URL(client.url).origin===self.location.origin);
    if(existing){return existing.navigate(path).then(()=>existing.focus()).catch(()=>self.clients.openWindow(path));}
    return self.clients.openWindow(path);
  }));
});

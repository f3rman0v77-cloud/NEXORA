// NEXORA Web Push: opt-in registration, never expose private VAPID key.
(() => {
  const VAPID_PUBLIC_KEY = "BLCvEwM4T6fjU6uHdTMJFcL8IZukZ_W49Qq1QjoZBymJpuwGNOVuRtWdGPLPhtHT7ywiRxwjlzL8QFoQH456diA";
  const toUint8Array = value => {
    const base64 = (value + "=".repeat((4 - value.length % 4) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  };
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    document.referrer.startsWith("android-app://");
  async function enablePush(button) {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = "Aktivləşdirilir...";
    try {
      if (!standalone()) throw new Error("Bildirişləri NEXORA tətbiqindən aktivləşdir.");
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window))
        throw new Error("Bu cihazda Web Push dəstəklənmir.");
      const sb = window.nexoraSupabase;
      if (!sb) throw new Error("Hesabına daxil ol.");
      const {data:{user},error:userError} = await sb.auth.getUser();
      if (userError || !user) throw new Error("Əvvəlcə hesabına daxil ol.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Telefonun bildiriş icazəsini aktiv et.");
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (subscription && subscription.options?.applicationServerKey) {
        const oldKey = new Uint8Array(subscription.options.applicationServerKey);
        const newKey = toUint8Array(VAPID_PUBLIC_KEY);
        if (oldKey.length !== newKey.length || oldKey.some((v,i) => v !== newKey[i])) {
          await subscription.unsubscribe();
          subscription = null;
        }
      }
      if (!subscription) subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: toUint8Array(VAPID_PUBLIC_KEY)
      });
      const json = subscription.toJSON();
      const {error} = await sb.from("nexora_push_subscriptions").upsert({
        endpoint: json.endpoint, user_id: user.id,
        p256dh: json.keys.p256dh, auth: json.keys.auth,
        updated_at: new Date().toISOString()
      }, {onConflict:"endpoint"});
      if (error) throw error;
      button.textContent = "Bildirişlər aktivdir ✓";
      button.dataset.enabled = "true";
    } catch (error) {
      console.error("NEXORA push:",error);
      button.textContent = error.message || "Bildiriş aktivləşdirilmədi";
      setTimeout(() => { button.textContent = original; button.disabled = false; }, 5000);
      return;
    }
    button.disabled = false;
  }
  function install() {
    const button = document.querySelector("#nxEnablePush");
    if (!button) return;
    button.addEventListener("click", () => enablePush(button));

    if ("Notification" in window && "serviceWorker" in navigator && "PushManager" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(s => {
        if(s) { button.textContent = "Bildirişləri yenilə"; }
      }).catch(()=>{});
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",install);
  else install();
})();

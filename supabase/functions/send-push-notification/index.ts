import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
const publicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const privateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
const subject = Deno.env.get("VAPID_SUBJECT")!;
const supabase = createClient(supabaseUrl, serviceKey);
webpush.setVapidDetails(subject, publicKey, privateKey);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!webhookSecret || req.headers.get("x-push-secret") !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    const payload = await req.json();
    if (payload.type !== "INSERT" || payload.schema !== "public" || payload.table !== "nexora_notifications") {
      return Response.json({ skipped: true });
    }
    const notification = payload.record;
    const recipientId = notification?.recipient_id;
    if (!recipientId) return Response.json({ error: "Missing recipient" }, { status: 400 });
    const { data: subscriptions, error } = await supabase
      .from("nexora_push_subscriptions").select("endpoint,p256dh,auth").eq("user_id", recipientId);
    if (error) throw error;

    const kind = String(notification.kind || "");
    const rawMessage = String(notification.message || "").trim();
    const titles: Record<string, string> = {
      follow: "Yeni izləyici", follow_request: "İzləmə istəyi",
      like: "Yeni bəyənmə", story_like: "Hekayə bəyənildi",
      comment: "Yeni şərh", story_comment: "Hekayəyə şərh",
      reply: "Şərhə cavab", message: "Yeni şəxsi mesaj",
      group_message: "Yeni qrup mesajı",
    };
    let title = titles[kind] || "NEXORA";
    let body = rawMessage || "Yeni bildirişin var.";
    if (kind === "message") {
      const username = rawMessage.match(/^@([^\s]+)\s+sənə mesaj göndərdi\.?$/i)?.[1];
      if (username) title = `@${username} sənə mesaj göndərdi`;
      body = "Söhbəti açmaq üçün bildirişə toxun.";
    } else if (kind === "group_message") {
      const groupName = rawMessage.match(/^(.+?):\s+@[^\s]+\s+yeni mesaj göndərdi\.?$/i)?.[1];
      if (groupName) title = `${groupName} qrupundan mesaj`;
      body = rawMessage || "Qrupda yeni mesaj var.";
    }

    const message = JSON.stringify({
      title, body: body.slice(0, 180),
      url: `/#push-notification=${notification.id}`,
      tag: `nexora-${notification.id}`,
    });
    const results = await Promise.allSettled((subscriptions || []).map(async sub => {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth },
        }, message, { TTL: 3600 });
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("nexora_push_subscriptions")
            .delete().eq("endpoint", sub.endpoint).eq("user_id", recipientId);
        }
        throw err;
      }
    }));
    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;
    console.log("NEXORA PUSH RESULT", { kind, attempted: results.length, sent, failed });
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const reason = result.reason as { statusCode?: number; message?: string };
        console.error("NEXORA PUSH FAILED", { index, statusCode: reason?.statusCode, message: reason?.message });
      }
    });
    return Response.json({ success: failed === 0, attempted: results.length, sent, failed });
  } catch (error) {
    console.error("Push error:", error);
    return Response.json({ error: "Push delivery failed" }, { status: 500 });
  }
});

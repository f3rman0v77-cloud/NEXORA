// Supabase Edge Function: deploy with JWT verification disabled; authenticate via a secret webhook header.
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (mailto:contact@example.com), NEXORA_PUSH_WEBHOOK_SECRET.
import webpush from "npm:web-push@3.6.7";
const allowedKinds = new Set(["follow","follow_request","like","story_like","comment","story_comment","reply","poll_vote","poll_comment","poll_result"]);
const titles: Record<string,string> = {
 follow:"Yeni izləyici",follow_request:"İzləmə istəyi",like:"Yeni bəyənmə",
 story_like:"Hekayən bəyənildi",comment:"Yeni şərh",story_comment:"Hekayənə şərh",
 reply:"Şərhinə cavab",poll_vote:"Anketə səs verildi",poll_comment:"Anketə şərh",
 poll_result:"Anket nəticəsi"
};
Deno.serve(async request => {
 if (request.method !== "POST") return new Response("Method not allowed",{status:405});
 const secret=Deno.env.get("NEXORA_PUSH_WEBHOOK_SECRET");
 if(!secret || request.headers.get("x-nexora-webhook-secret")!==secret) return new Response("Unauthorized",{status:401});
 const url=Deno.env.get("SUPABASE_URL"),key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 const pub=Deno.env.get("VAPID_PUBLIC_KEY"),priv=Deno.env.get("VAPID_PRIVATE_KEY");
 const subject=Deno.env.get("VAPID_SUBJECT");
 if(!url||!key||!pub||!priv||!subject)return new Response("Missing server configuration",{status:503});
 let event: {type?:string;record?:Record<string,unknown>};
 try{event=await request.json()}catch{return new Response("Invalid JSON",{status:400})}
 const record=event.record;
 if(event.type!=="INSERT"||!record||!allowedKinds.has(String(record.kind))||typeof record.recipient_id!=="string")return new Response("Ignored",{status:200});
 const userId=record.recipient_id;
 if(!/^[0-9a-f-]{36}$/i.test(userId))return new Response("Invalid recipient",{status:400});
 const headers={apikey:key,Authorization:`Bearer ${key}`};
 const subscriptions=await fetch(`${url}/rest/v1/nexora_push_subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=endpoint,p256dh,auth`,{headers});
 if(!subscriptions.ok)return new Response("Subscription query failed",{status:502});
 const rows=await subscriptions.json() as Array<{endpoint:string;p256dh:string;auth:string}>;
 webpush.setVapidDetails(subject,pub,priv);
 const notificationId=String(record.id||"");
 const payload=JSON.stringify({title:titles[String(record.kind)]||"NEXORA",body:String(record.message||"Yeni bildirişin var.").slice(0,180),tag:`nexora-${notificationId}`,url:notificationId?`/?notification=${encodeURIComponent(notificationId)}`:"/"});
 let delivered=0,failed=0;
 await Promise.all(rows.map(async row=>{
   try{await webpush.sendNotification({endpoint:row.endpoint,keys:{p256dh:row.p256dh,auth:row.auth}},payload,{TTL:86400});delivered++}
   catch(error){
     const status=(error as {statusCode?:number}).statusCode;
     if(status===404||status===410)await fetch(`${url}/rest/v1/nexora_push_subscriptions?endpoint=eq.${encodeURIComponent(row.endpoint)}`,{method:"DELETE",headers}).catch(()=>{});
     failed++;console.error("Push delivery failed",status||"unknown");
   }
 }));
 return Response.json({delivered,failed});
});

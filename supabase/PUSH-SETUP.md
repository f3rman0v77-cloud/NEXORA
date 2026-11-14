# NEXORA Android background notifications

The existing TWA APK can receive Web Push only when its Chrome push subscription is saved in `nexora_push_subscriptions`. This server function delivers **all** supported kinds from `nexora_notifications`, not just follows and post likes.

## One-time Supabase configuration (required; GitHub/Vercel deploy alone does not activate it)

1. Run `supabase/push-subscriptions.sql` in Supabase SQL Editor (if not already applied).
2. In Supabase **Edge Functions**, deploy `supabase/functions/nexora-push/index.ts` as `nexora-push`. Turn **Verify JWT** OFF for this function: the endpoint instead validates the private `x-nexora-webhook-secret` header. Never remove this check.
3. Set Edge Function secrets `VAPID_PUBLIC_KEY` (must match the existing key in `push-client.js`), `VAPID_PRIVATE_KEY` (the matching private key), `VAPID_SUBJECT` (a mailto: address), and `NEXORA_PUSH_WEBHOOK_SECRET` (long random string). Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in Edge Functions. **Do not commit any private key or webhook secret.** If the matching private VAPID key is lost, generate a fresh pair and update `push-client.js`; users must then renew their subscription.
4. Supabase **Database Webhooks → Create webhook**: name `nexora-push`; table `public.nexora_notifications`; event **INSERT** only; type **Supabase Edge Functions**, function `nexora-push`; HTTP header `x-nexora-webhook-secret` = exactly the secret from step 3. Do not make the endpoint publicly callable without that secret.
5. In the installed Android TWA app, sign in and tap **Bildirişləri aktivləşdir** (or **Bildirişləri yenilə**), grant permission. Verify a row exists for that user in `nexora_push_subscriptions`.
6. Test from a **second account**: follow, like post, like story, comment on post, comment on story, reply to a comment. Close the app before testing and inspect Edge Function logs if some fail. Existing rows won't trigger a new INSERT webhook.

**Important:** App-internal notification rows do not by themselves prove push delivery. The function must be deployed and the webhook and VAPID secrets configured. If a push subscription doesn't exist, no background push can be sent to that device.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Username login function environment is incomplete.");
    return json({ error: "Giriş xidməti hazır deyil." }, 500);
  }

  let payload: { username?: unknown; password?: unknown };
  try { payload = await request.json(); } catch { return json({ error: "Yanlış sorğu." }, 400); }
  const username = typeof payload.username === "string" ? payload.username.trim().toLowerCase() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  if (!/^[a-z0-9_.]{3,24}$/.test(username) || !password || password.length > 128) {
    return json({ error: "İstifadəçi adı və ya şifrə yanlışdır." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Email is resolved server-side and never returned to the browser.
  const { data: profile, error: profileError } = await admin
    .from("nexora_profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (profileError || !profile?.id) return json({ error: "İstifadəçi adı və ya şifrə yanlışdır." }, 401);

  const { data: userResult, error: userError } = await admin.auth.admin.getUserById(profile.id);
  const user = userResult?.user;
  if (userError || !user?.email || !user.email_confirmed_at) {
    return json({ error: "İstifadəçi adı və ya şifrə yanlışdır." }, 401);
  }

  const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (authError || !authData.session || !authData.user?.email_confirmed_at) {
    return json({ error: "İstifadəçi adı və ya şifrə yanlışdır." }, 401);
  }
  return json({ session: authData.session });
});

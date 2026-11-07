(async () => {
    const SUPABASE_URL = "https://maedexpfgtkoubzlxllq.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KBUqU_8_cutG2k70Lxqu2A_od_vs2Js";
    // Preserve the deployed page path (important for GitHub Pages project sites),
    // but do not carry application query/hash state through the OAuth round trip.
    const redirectUrl = new URL(window.location.href);
    redirectUrl.search = "";
    redirectUrl.hash = "";
    const REDIRECT_URL = redirectUrl.href;

    // Ensure the SDK is available even if index.html only includes this file.
    if (!window.supabase?.createClient) {
        try {
            await new Promise((resolve, reject) => {
                const sdk = document.createElement("script");
                sdk.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
                sdk.onload = resolve;
                sdk.onerror = () => reject(new Error("Supabase SDK yüklənmədi."));
                document.head.append(sdk);
            });
        } catch (error) {
            console.error(error);
            document.addEventListener("DOMContentLoaded", () => {
                const message = document.getElementById("authMessage");
                if (message) message.textContent = "Giriş xidməti yüklənmədi. İnternet bağlantısını yoxlayıb yenidən cəhd et.";
            });
            return;
        }
    }
    if (!window.supabase?.createClient) {
        console.error("Supabase SDK yükləndi, amma createClient mövcud deyil.");
        return;
    }

    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.nexoraSupabase = supabase;

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("authForm");
        const tabs = [...document.querySelectorAll(".auth-tab")];
        const authMessage = document.getElementById("authMessage");
        const usernameInput = document.getElementById("authUsername");
        if (!form || !authMessage || !usernameInput) return;
        let pendingVerificationEmail = "";

const verificationPanel = document.createElement("section");
verificationPanel.hidden = true;
verificationPanel.innerHTML = `
    <h3>E-poçtunu təsdiqlə</h3>
    <p>E-poçtuna göndərilən 6 rəqəmli kodu daxil et.</p>
    <input
        id="nexoraOtpCode"
        type="text"
        inputmode="numeric"
        maxlength="6"
        placeholder="123456"
        autocomplete="one-time-code"
    >
    <button type="button" id="nexoraVerifyButton">
        Kodu təsdiqlə
    </button>
    <p id="nexoraOtpMessage"></p>
`;

form.insertAdjacentElement("afterend", verificationPanel);

const otpInput = verificationPanel.querySelector("#nexoraOtpCode");
const verifyButton = verificationPanel.querySelector("#nexoraVerifyButton");
const otpMessage = verificationPanel.querySelector("#nexoraOtpMessage");

verifyButton.addEventListener("click", async () => {
    const token = otpInput.value.trim();

    if (!/^\d{6}$/.test(token)) {
        otpMessage.textContent = "6 rəqəmli kodu düzgün daxil et.";
        return;
    }

    verifyButton.disabled = true;
    otpMessage.textContent = "Kod yoxlanılır...";

    try {
        const { data, error } = await supabase.auth.verifyOtp({
            email: pendingVerificationEmail,
            token: token,
            type: "signup"
        });

        if (error) throw error;

        if (!data.user) {
            throw new Error("İstifadəçi məlumatı tapılmadı.");
        }

        activateUser(data.user);

    } catch (error) {
        otpMessage.textContent =
            error.message || "Kod təsdiqlənmədi.";
    } finally {
        verifyButton.disabled = false;
    }
});

        // Add an email field beside the existing local-demo account form.
        const emailLabel = document.createElement("label");
        emailLabel.htmlFor = "authEmail";
        emailLabel.append(document.createTextNode("E-poçt"));
        const emailInput = document.createElement("input");
        emailInput.id = "authEmail";
        emailInput.type = "email";
        emailInput.autocomplete = "email";
        emailInput.placeholder = "name@example.com";
        emailInput.required = false;
        emailLabel.append(emailInput);
        const passwordLabel = document.getElementById("authPassword")?.closest("label");
        if (passwordLabel) form.insertBefore(emailLabel, passwordLabel);

        // Reuse the existing controls in index.html; do not create duplicate IDs.
        const divider = form.querySelector(".auth-divider") || document.createElement("div");
        if (!divider.isConnected) {
            divider.className = "auth-divider";
            divider.setAttribute("aria-hidden", "true");
            divider.textContent = "və ya";
            document.getElementById("authSubmit")?.insertAdjacentElement("afterend", divider);
        }
        let googleButton = document.getElementById("googleAuthButton");
        if (!googleButton) {
            googleButton = document.createElement("button");
            googleButton.type = "button";
            googleButton.id = "googleAuthButton";
            googleButton.className = "outline-button auth-google-button";
            googleButton.textContent = "Continue with Google";
            divider.insertAdjacentElement("afterend", googleButton);
        }
        googleButton.type = "button";

        const getMode = () => document.querySelector(".auth-tab.active")?.dataset.authMode || "login";
        const syncEmailRequirement = () => { emailInput.required = getMode() === "register"; };
        tabs.forEach(tab => tab.addEventListener("click", syncEmailRequirement, true));
        syncEmailRequirement();

        const readAccounts = () => {
            try { return JSON.parse(localStorage.getItem("nexoraAccounts") || "[]"); }
            catch { return []; }
        };
        const usernameFor = (user, accounts) => {
            const metadataName = user.user_metadata?.username;
            if (metadataName && /^[a-z0-9_.]{3,24}$/i.test(metadataName)) return metadataName.toLowerCase();
            const emailPart = (user.email || "nexora_user").split("@")[0].toLowerCase().replace(/[^a-z0-9_.]/g, "_").replace(/^[._]+|[._]+$/g, "");
            const base = (emailPart || "nexora_user").slice(0, 17);
            const suffix = String(user.id || "user").replace(/-/g, "").slice(0, 6).toLowerCase();
            let candidate = `${base}_${suffix}`.slice(0, 24);
            let counter = 1;
            while (accounts.some(account => account.username === candidate && account.supabaseUserId !== user.id)) {
                candidate = `${base.slice(0, 14)}_${suffix}${counter++}`.slice(0, 24);
            }
            return candidate;
        };
        const activateUser = user => {
            const accounts = readAccounts();
            const existing = accounts.find(account => account.supabaseUserId === user.id)
                || accounts.find(account => account.email?.toLowerCase() === user.email?.toLowerCase());
            const account = {
                ...(existing || {}),
                name: user.user_metadata?.full_name || user.user_metadata?.name || existing?.name || user.email?.split("@")[0] || "NEXORA istifadəçisi",
                username: existing?.username || usernameFor(user, accounts),
                email: user.email || existing?.email || "",
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || existing?.avatar || "",
                bio: existing?.bio || "",
                supabaseUserId: user.id
            };
            const nextAccounts = [...accounts.filter(item => item.supabaseUserId !== user.id && item.email?.toLowerCase() !== user.email?.toLowerCase()), account];
            localStorage.setItem("nexoraAccounts", JSON.stringify(nextAccounts));
            localStorage.setItem("nexoraActiveAccount", JSON.stringify(account));
            localStorage.setItem("nexoraSupabaseUserId", user.id);
            window.location.replace(`${window.location.pathname}${window.location.search}${window.location.hash}`);
        };

        googleButton.addEventListener("click", async () => {
            authMessage.textContent = "Google ilə giriş edilir…";
            googleButton.disabled = true;
            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: REDIRECT_URL }
                });
                if (error) throw error;
            } catch (error) {
                console.error("Google OAuth xətası:", error);
                authMessage.textContent = `Google ilə giriş alınmadı: ${error?.message || "Naməlum xəta"}`;
                googleButton.disabled = false;
            }
        });

        // Capture the existing form once; leave legacy local demo login available when no email is entered.
        form.addEventListener("submit", async event => {
            const email = emailInput.value.trim().toLowerCase();
            const mode = getMode();
            if (mode === "login" && !email) return;

            event.preventDefault();
            event.stopImmediatePropagation();
            authMessage.textContent = "";
            const username = usernameInput.value.trim().replace(/^@/, "").toLowerCase();
            const password = document.getElementById("authPassword")?.value || "";
            if (!email) {
                authMessage.textContent = "Qeydiyyat üçün e-poçt ünvanını daxil et.";
                return;
            }
            if (mode === "register" && !/^[a-z0-9_.]{3,24}$/.test(username)) {
                authMessage.textContent = "İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.";
                return;
            }

            const submit = document.getElementById("authSubmit");
            submit.disabled = true;
            try {
                if (mode === "register") {
                    const fullName = document.getElementById("authName")?.value.trim() || "";
                    if (fullName.length < 2) throw new Error("Zəhmət olmasa adını daxil et.");
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: REDIRECT_URL,
                            data: { full_name: fullName, username }
                        }
                    });
                    if (error) throw error;
                    if (data.session && data.user) activateUser(data.user);
                    else authMessage.textContent = "Qeydiyyat tamamlandı. Davam etmək üçün e-poçtuna göndərilən təsdiq linkinə keç.";
                } else {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                    if (!data.user) throw new Error("İstifadəçi məlumatı alınmadı.");
                    activateUser(data.user);
                }
            } catch (error) {
                authMessage.textContent = error?.message || "Giriş zamanı xəta baş verdi.";
            } finally {
                submit.disabled = false;
            }
        }, true);

        // Restore the Supabase session after the OAuth provider redirects back.
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                authMessage.textContent = `Sessiyanı yoxlamaq alınmadı: ${error.message}`;
                return;
            }
            const user = data.session?.user;
            if (!user || localStorage.getItem("nexoraSupabaseUserId") === user.id) return;
            activateUser(user);
        }).catch(error => {
            console.error("Supabase sessiyasını yoxlamaq alınmadı:", error);
            authMessage.textContent = "Giriş sessiyasını yoxlamaq mümkün olmadı. Səhifəni yeniləyib yenidən cəhd et.";
        });

        // Supabase users sign out of the server session as well as the existing local app session.
        document.getElementById("logoutButton")?.addEventListener("click", async event => {
            if (!localStorage.getItem("nexoraSupabaseUserId")) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            await supabase.auth.signOut();
            localStorage.removeItem("nexoraSupabaseUserId");
            localStorage.removeItem("nexoraActiveAccount");
            window.location.reload();
        }, true);

        const style = document.createElement("style");
        style.textContent = `
            .auth-divider{display:flex;align-items:center;gap:12px;margin:4px 0;color:var(--muted,#7b8196);font-size:12px}
            .auth-divider::before,.auth-divider::after{content:"";height:1px;flex:1;background:var(--line,#e7e9f2)}
            .auth-google-button{width:100%;min-height:44px;display:flex;align-items:center;justify-content:center;gap:10px;font:inherit;font-weight:650;cursor:pointer}
            .auth-google-button::before{content:"G";font:bold 18px Arial,sans-serif;color:#4285f4}
            .auth-google-button:disabled{opacity:.65;cursor:wait}
        `;
        document.head.append(style);
    });
})();

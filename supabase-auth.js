(async () => {
    const SUPABASE_URL = "https://maedexpfgtkoubzlxllq.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KBUqU_8_cutG2k70Lxqu2A_od_vs2Js";
    // Keep the deployed page path for GitHub Pages and Google OAuth redirects.
    const redirectUrl = new URL(window.location.href);
    redirectUrl.search = "";
    redirectUrl.hash = "";
    const REDIRECT_URL = redirectUrl.href;

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

    // This is the single client used throughout the existing application.
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    window.nexoraSupabase = supabase;

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("authForm");
        const authMessage = document.getElementById("authMessage");
        const usernameInput = document.getElementById("authUsername");
        const passwordInput = document.getElementById("authPassword");
        const submitButton = document.getElementById("authSubmit");
        const card = document.querySelector(".auth-card");
        const tabs = [...document.querySelectorAll(".auth-tab")];
        if (!form || !authMessage || !usernameInput || !passwordInput || !submitButton || !card) return;

        const emailLabel = document.createElement("label");
        emailLabel.htmlFor = "authEmail";
        emailLabel.append(document.createTextNode("E-poçt"));
        const emailInput = document.createElement("input");
        emailInput.id = "authEmail";
        emailInput.type = "email";
        emailInput.autocomplete = "email";
        emailInput.placeholder = "name@example.com";
        emailInput.maxLength = 254;
        emailLabel.append(emailInput);
        const passwordLabel = passwordInput.closest("label");
        if (passwordLabel) form.insertBefore(emailLabel, passwordLabel);

        const confirmLabel = document.createElement("label");
        confirmLabel.className = "register-only auth-confirm-label";
        confirmLabel.htmlFor = "authPasswordConfirm";
        confirmLabel.append(document.createTextNode("Şifrəni təkrarla"));
        const confirmInput = document.createElement("input");
        confirmInput.id = "authPasswordConfirm";
        confirmInput.type = "password";
        confirmInput.autocomplete = "new-password";
        confirmInput.minLength = 8;
        confirmInput.placeholder = "Şifrəni yenidən daxil et";
        confirmLabel.append(confirmInput);
        if (passwordLabel) passwordLabel.insertAdjacentElement("afterend", confirmLabel);

        const divider = form.querySelector(".auth-divider") || document.createElement("div");
        if (!divider.isConnected) {
            divider.className = "auth-divider";
            divider.setAttribute("aria-hidden", "true");
            divider.textContent = "və ya";
            submitButton.insertAdjacentElement("afterend", divider);
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
        const setMessage = (message, kind = "error") => {
            authMessage.textContent = message;
            authMessage.dataset.kind = kind;
        };
        const setBusy = (button, busy, label) => {
            if (busy) {
                button.dataset.originalText ||= button.textContent;
                button.textContent = label;
            } else if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
                delete button.dataset.originalText;
            }
            button.disabled = busy;
            button.setAttribute("aria-busy", String(busy));
        };
        const syncFields = () => {
            const registering = getMode() === "register";
            emailInput.required = true;
            usernameInput.required = registering;
            passwordInput.minLength = registering ? 8 : 1;
            confirmInput.required = registering;
            confirmLabel.hidden = !registering;
            const authName = document.getElementById("authName");
            if (authName) authName.required = registering;
            passwordInput.autocomplete = registering ? "new-password" : "current-password";
            authMessage.textContent = "";
            delete authMessage.dataset.kind;
        };
        tabs.forEach(tab => tab.addEventListener("click", syncFields, true));
        syncFields();

        const readAccounts = () => {
            try {
                const accounts = JSON.parse(localStorage.getItem("nexoraAccounts") || "[]");
                return Array.isArray(accounts) ? accounts : [];
            } catch { return []; }
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
        const activateUser = (user, { redirect = true } = {}) => {
            const accounts = readAccounts();
            const existing = accounts.find(account => account.supabaseUserId === user.id)
                || accounts.find(account => account.email?.toLowerCase() === user.email?.toLowerCase());
            const account = {
                ...(existing || {}),
                name: user.user_metadata?.full_name || user.user_metadata?.name || existing?.name || user.email?.split("@")[0] || "NEXORA istifadəçisi",
                username: user.user_metadata?.username || existing?.username || usernameFor(user, accounts),
                email: user.email || existing?.email || "",
                avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture || existing?.avatar || "",
                bio: existing?.bio || "",
                supabaseUserId: user.id
            };
            delete account.password;
            const nextAccounts = [...accounts.filter(item => item.supabaseUserId !== user.id && item.email?.toLowerCase() !== user.email?.toLowerCase()), account];
            localStorage.setItem("nexoraAccounts", JSON.stringify(nextAccounts.map(({ password: _password, ...item }) => item)));
            localStorage.setItem("nexoraActiveAccount", JSON.stringify(account));
            localStorage.setItem("nexoraSupabaseUserId", user.id);
            sessionStorage.removeItem("nexoraPendingSignup");
            if (redirect) {
                const home = new URL(window.location.href);
                home.search = "";
                home.hash = "#feed";
                window.location.replace(home.href);
            }
        };

        const authHeading = card.querySelector(".auth-heading");
        const authTabs = card.querySelector(".auth-tabs");
        const disclaimer = card.querySelector(".auth-disclaimer");
        const verification = document.createElement("section");
        verification.className = "auth-verification";
        verification.hidden = true;
        verification.setAttribute("aria-labelledby", "otpTitle");
        verification.innerHTML = `
            <div class="auth-heading"><p class="eyebrow">NEXORA</p><h1 id="otpTitle">E-poçtini təsdiqlə</h1>
            <p id="otpDescription">Təsdiq kodunu e-poçtuna göndərdik:</p><strong class="otp-email" id="otpEmail"></strong></div>
            <form id="otpForm" class="auth-form" novalidate>
                <label for="otpCode">6 rəqəmli kod</label>
                <input id="otpCode" name="otp" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" minlength="6" required aria-describedby="otpMessage">
                <button class="primary-button auth-submit" id="otpVerifyButton" type="submit">Kodu təsdiqlə</button>
                <button class="outline-button auth-resend" id="otpResendButton" type="button" disabled>Yeni kod göndər <span id="otpCountdown"></span></button>
                <button class="auth-back-button" id="otpBackButton" type="button">Girişə qayıt</button>
                <p class="auth-message" id="otpMessage" role="status" aria-live="polite"></p>
            </form>`;
        card.append(verification);
        const otpForm = verification.querySelector("#otpForm");
        const otpInput = verification.querySelector("#otpCode");
        const otpMessage = verification.querySelector("#otpMessage");
        const otpEmail = verification.querySelector("#otpEmail");
        const resendButton = verification.querySelector("#otpResendButton");
        const countdown = verification.querySelector("#otpCountdown");
        const otpVerifyButton = verification.querySelector("#otpVerifyButton");
        let countdownTimer;

        const showVerification = (email, username) => {
            sessionStorage.setItem("nexoraPendingSignup", JSON.stringify({ email, username }));
            form.hidden = true;
            if (authHeading) authHeading.hidden = true;
            if (authTabs) authTabs.hidden = true;
            if (disclaimer) disclaimer.hidden = true;
            verification.hidden = false;
            otpEmail.textContent = email;
            otpInput.value = "";
            otpMessage.textContent = "";
            startCountdown();
            otpInput.focus();
        };
        const showAuth = () => {
            clearInterval(countdownTimer);
            verification.hidden = true;
            form.hidden = false;
            if (authHeading) authHeading.hidden = false;
            if (authTabs) authTabs.hidden = false;
            if (disclaimer) disclaimer.hidden = false;
            sessionStorage.removeItem("nexoraPendingSignup");
            document.querySelector('.auth-tab[data-auth-mode="login"]')?.click();
            setMessage("");
        };
        function startCountdown() {
            clearInterval(countdownTimer);
            const until = Number(sessionStorage.getItem("nexoraOtpResendAt")) || (Date.now() + 60_000);
            sessionStorage.setItem("nexoraOtpResendAt", String(until));
            const render = () => {
                const seconds = Math.max(0, Math.ceil((until - Date.now()) / 1000));
                resendButton.disabled = seconds > 0;
                countdown.textContent = seconds > 0 ? `(${seconds}s)` : "";
                if (!seconds) clearInterval(countdownTimer);
            };
            render();
            countdownTimer = setInterval(render, 1000);
        }

        // Preserve the existing Google OAuth provider, redirect URL and button behavior.
        googleButton.addEventListener("click", async () => {
            setMessage("Google ilə giriş edilir…", "info");
            setBusy(googleButton, true, "Google ilə giriş edilir…");
            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: REDIRECT_URL }
                });
                if (error) throw error;
            } catch (error) {
                console.error("Google OAuth xətası:", error);
                setMessage(`Google ilə giriş alınmadı: ${error?.message || "Naməlum xəta"}`);
                setBusy(googleButton, false);
            }
        });

        // Capture the form before the legacy demo handler in script.js. No password is persisted.
        form.addEventListener("submit", async event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            const email = emailInput.value.trim().toLowerCase();
            const mode = getMode();
            const password = passwordInput.value;
            const username = usernameInput.value.trim().replace(/^@/, "").toLowerCase();
            setMessage("");
            if (!email || !emailInput.validity.valid) return setMessage("Düzgün e-poçt ünvanı daxil et.");
            if (mode === "register") {
                if (!/^[a-z0-9_.]{3,24}$/.test(username)) return setMessage("İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.");
                if (password.length < 8) return setMessage("Şifrə ən azı 8 simvol olmalıdır.");
                if (password !== confirmInput.value) return setMessage("Şifrələr eyni deyil.");
                const name = document.getElementById("authName")?.value.trim() || "";
                if (name.length < 2) return setMessage("Zəhmət olmasa adını daxil et.");
                setBusy(submitButton, true, "Hesab yaradılır…");
                try {
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: { data: { username, full_name: name } }
                    });
                    if (error) throw error;
                    if (!data.user) throw new Error("Qeydiyyat məlumatı alınmadı. Yenidən cəhd et.");
                    // Signup must not establish an application session before OTP verification.
                    if (data.session) await supabase.auth.signOut();
                    sessionStorage.setItem("nexoraOtpResendAt", String(Date.now() + 60_000));
                    showVerification(email, username);
                    otpMessage.textContent = "Təsdiq kodunu e-poçtuna göndərdik.";
                    otpMessage.dataset.kind = "success";
                } catch (error) {
                    setMessage(error?.message || "Qeydiyyat zamanı xəta baş verdi.");
                } finally {
                    setBusy(submitButton, false);
                }
                return;
            }

            if (!password) return setMessage("Şifrənı daxil et.");
            setBusy(submitButton, true, "Daxil olunur…");
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                if (!data.user) throw new Error("İstifadəçi məlumatı alınmadı.");
                if (!data.user.email_confirmed_at && !data.user.confirmed_at) {
                    await supabase.auth.signOut();
                    return setMessage("E-poçt təsdiqlənməyib. Qeydiyyat zamanı göndərilən 6 rəqəmli kodu daxil et.");
                }
                activateUser(data.user);
            } catch (error) {
                setMessage(error?.message || "Giriş zamanı xəta baş verdi.");
            } finally {
                setBusy(submitButton, false);
            }
        }, true);

        otpInput.addEventListener("input", () => {
            otpInput.value = otpInput.value.replace(/\D/g, "").slice(0, 6);
            otpMessage.textContent = "";
        });
        otpForm.addEventListener("submit", async event => {
            event.preventDefault();
            const token = otpInput.value.trim();
            if (!/^\d{6}$/.test(token)) {
                otpMessage.textContent = "6 rəqəmli təsdiq kodunu daxil et.";
                otpMessage.dataset.kind = "error";
                otpInput.focus();
                return;
            }
            let pending;
            try { pending = JSON.parse(sessionStorage.getItem("nexoraPendingSignup") || "null"); } catch {}
            if (!pending?.email) return showAuth();
            setBusy(otpVerifyButton, true, "Təsdiqlənir…");
            otpMessage.textContent = "";
            try {
                const { data, error } = await supabase.auth.verifyOtp({
                    email: pending.email,
                    token,
                    type: "signup"
                });
                if (error) throw error;
                if (!data.user || (!data.user.email_confirmed_at && !data.user.confirmed_at)) {
                    throw new Error("E-poçt təsdiqlənmədi. Kodu yoxla və yenidən cəhd et.");
                }
                otpMessage.textContent = "E-poçt təsdiqləndi. NEXORA açılır…";
                otpMessage.dataset.kind = "success";
                activateUser(data.user);
            } catch (error) {
                const message = error?.message || "Kod təsdiqlənmədi. Yenidən cəhd et.";
                otpMessage.textContent = /expired|invalid|token|otp/i.test(message)
                    ? "Kod yanlışdır və ya vaxtı bitib. Ən son göndərilən kodu yoxla və ya yenisini istə."
                    : message;
                otpMessage.dataset.kind = "error";
                otpInput.select();
            } finally {
                setBusy(otpVerifyButton, false);
            }
        });
        resendButton.addEventListener("click", async () => {
            let pending;
            try { pending = JSON.parse(sessionStorage.getItem("nexoraPendingSignup") || "null"); } catch {}
            if (!pending?.email || resendButton.disabled) return;
            resendButton.disabled = true;
            otpMessage.textContent = "Yeni kod göndərilir…";
            otpMessage.dataset.kind = "info";
            try {
                const { error } = await supabase.auth.resend({ type: "signup", email: pending.email });
                if (error) throw error;
                sessionStorage.setItem("nexoraOtpResendAt", String(Date.now() + 60_000));
                otpMessage.textContent = "Yeni təsdiq kodu göndərildi.";
                otpMessage.dataset.kind = "success";
                startCountdown();
            } catch (error) {
                otpMessage.textContent = error?.message || "Yeni kod göndərilmədi. Bir az sonra yenidən cəhd et.";
                otpMessage.dataset.kind = "error";
                startCountdown();
            }
        });
        verification.querySelector("#otpBackButton").addEventListener("click", showAuth);

        // Restore pending OTP UI without storing the password.
        try {
            const pending = JSON.parse(sessionStorage.getItem("nexoraPendingSignup") || "null");
            if (pending?.email) showVerification(pending.email, pending.username);
        } catch { sessionStorage.removeItem("nexoraPendingSignup"); }

        // Restore OAuth/email sessions; discard legacy local-only demo sessions.
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                setMessage(`Sessiyanı yoxlamaq alınmadı: ${error.message}`);
                return;
            }
            const user = data.session?.user;
            if (user) {
                const activeId = localStorage.getItem("nexoraSupabaseUserId");
                if (activeId !== user.id) activateUser(user);
                return;
            }
            // Remove legacy plaintext passwords and don't trust local demo login state.
            const accounts = readAccounts().map(({ password: _password, ...account }) => account);
            localStorage.setItem("nexoraAccounts", JSON.stringify(accounts));
            const active = (() => { try { return JSON.parse(localStorage.getItem("nexoraActiveAccount") || "null"); } catch { return null; } })();
            if (active) {
                localStorage.removeItem("nexoraActiveAccount");
                localStorage.removeItem("nexoraSupabaseUserId");
                if (!sessionStorage.getItem("nexoraAuthReloaded")) {
                    sessionStorage.setItem("nexoraAuthReloaded", "true");
                    window.location.reload();
                }
            } else sessionStorage.removeItem("nexoraAuthReloaded");
        }).catch(error => {
            console.error("Supabase sessiyasını yoxlamaq alınmadı:", error);
            setMessage("Giriş sessiyasını yoxlamaq mümkün olmadı. Səhifəni yeniləyib yenidən cəhd et.");
        });

        // Supabase password changes are handled by Supabase, never by local password storage.
        const passwordForm = document.getElementById("passwordForm");
        passwordForm?.addEventListener("submit", async event => {
            const active = (() => { try { return JSON.parse(localStorage.getItem("nexoraActiveAccount") || "null"); } catch { return null; } })();
            if (!active?.supabaseUserId) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            const message = document.getElementById("passwordMessage");
            const current = document.getElementById("currentPassword").value;
            const next = document.getElementById("newPassword").value;
            const confirm = document.getElementById("confirmPassword").value;
            if (next.length < 8) { message.textContent = "Yeni şifrə ən azı 8 simvol olmalıdır."; return; }
            if (next !== confirm) { message.textContent = "Yeni şifrələr eyni deyil."; return; }
            if (next === current) { message.textContent = "Yeni şifrə köhnə şifrədən fərqli olmalıdır."; return; }
            const button = passwordForm.querySelector('button[type="submit"]');
            if (button) setBusy(button, true, "Yenilənir…");
            message.textContent = "";
            try {
                const { error: verifyError } = await supabase.auth.signInWithPassword({ email: active.email, password: current });
                if (verifyError) throw new Error("Hazırkı şifrə yanlışdır.");
                const { error } = await supabase.auth.updateUser({ password: next });
                if (error) throw error;
                message.textContent = "Şifrən uğurla dəyişdirildi.";
                message.dataset.kind = "success";
                passwordForm.reset();
            } catch (error) {
                message.textContent = error?.message || "Şifrəni yeniləmək mümkün olmadı.";
                message.dataset.kind = "error";
            } finally {
                if (button) setBusy(button, false);
            }
        }, true);

        // Sign out the Supabase session as well as local app state. The Google setup is unchanged.
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
            .auth-google-button:disabled,.auth-submit:disabled,.auth-resend:disabled{opacity:.65;cursor:wait}
            .auth-confirm-label[hidden],.auth-verification[hidden]{display:none}
            .auth-verification{display:flex;flex-direction:column;gap:16px}
            .auth-verification .auth-heading{text-align:center}
            .auth-verification .auth-heading h1{margin-bottom:8px}
            .auth-verification .auth-heading p{line-height:1.55}
            .otp-email{display:block;overflow-wrap:anywhere;color:var(--ink);margin-top:8px}
            #otpCode{width:100%;min-height:56px;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--bg);color:var(--ink);font:700 26px/1.2 inherit;letter-spacing:.42em;text-align:center}
            #otpCode:focus{outline:2px solid var(--green);outline-offset:1px}
            .auth-resend{width:100%;min-height:44px;font:inherit;cursor:pointer}
            .auth-back-button{border:0;background:transparent;color:var(--green-dark);font:inherit;cursor:pointer;padding:8px}
            .auth-message[data-kind="success"]{color:var(--green-dark)}
            .auth-message[data-kind="info"]{color:var(--muted)}
            @media(max-width:420px){#otpCode{min-height:52px;font-size:23px;letter-spacing:.34em}.auth-verification{gap:12px}}
        `;
        document.head.append(style);
    });
})();

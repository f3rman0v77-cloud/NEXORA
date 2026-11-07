(async () => {
    const SUPABASE_URL = "https://maedexpfgtkoubzlxllq.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KBUqU_8_cutG2k70Lxqu2A_od_vs2Js";

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
                if (message) message.textContent = "Giriş xidməti yüklənmədi.";
            });
            return;
        }
    }

    const supabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    window.nexoraSupabase = supabase;

    document.addEventListener("DOMContentLoaded", () => {
        const form = document.getElementById("authForm");
        const authGate = document.getElementById("authGate");
        const authMessage = document.getElementById("authMessage");
        const usernameInput = document.getElementById("authUsername");
        const passwordInput = document.getElementById("authPassword");
        const submitButton = document.getElementById("authSubmit");
        const tabs = [...document.querySelectorAll(".auth-tab")];

        if (!form || !authGate || !authMessage || !usernameInput) return;

        let pendingVerificationEmail = "";

        // E-poçt sahəsi
        const emailLabel = document.createElement("label");
        emailLabel.htmlFor = "authEmail";
        emailLabel.id = "nexoraEmailLabel";
        emailLabel.textContent = "E-poçt";

        const emailInput = document.createElement("input");
        emailInput.id = "authEmail";
        emailInput.type = "email";
        emailInput.autocomplete = "email";
        emailInput.placeholder = "name@example.com";
        emailInput.required = false;

        emailLabel.append(emailInput);

        const passwordLabel = passwordInput.closest("label");
        if (passwordLabel) {
            form.insertBefore(emailLabel, passwordLabel);
        }

        // OTP üçün ayrıca tam ekran səhifə
        const verificationPage = document.createElement("section");
        verificationPage.id = "nexoraVerificationPage";
        verificationPage.hidden = true;

        verificationPage.innerHTML = `
            <div class="nexora-verification-card">
                <div class="nexora-verification-logo">N</div>
                <h2>E-poçtunu təsdiqlə</h2>
                <p>
                    E-poçt ünvanına göndərilən 6 rəqəmli
                    təsdiq kodunu daxil et.
                </p>

                <form id="nexoraOtpForm">
                    <input
                        id="nexoraOtpCode"
                        type="text"
                        inputmode="numeric"
                        maxlength="6"
                        autocomplete="one-time-code"
                        placeholder="123456"
                        required
                    >

                    <button type="submit" id="nexoraVerifyButton">
                        Kodu təsdiqlə
                    </button>
                </form>

                <button type="button" id="nexoraResendButton">
                    Kodu yenidən göndər
                </button>

                <p id="nexoraOtpMessage" role="status"></p>
            </div>
        `;

        document.body.append(verificationPage);

        const otpForm = verificationPage.querySelector("#nexoraOtpForm");
        const otpInput = verificationPage.querySelector("#nexoraOtpCode");
        const otpMessage = verificationPage.querySelector("#nexoraOtpMessage");
        const verifyButton = verificationPage.querySelector("#nexoraVerifyButton");
        const resendButton = verificationPage.querySelector("#nexoraResendButton");

        const otpStyle = document.createElement("style");

        otpStyle.textContent = `
            #nexoraVerificationPage {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                background: #17142e;
                color: #fff;
                font-family: inherit;
            }

            #nexoraVerificationPage[hidden] {
                display: none !important;
            }

            .nexora-verification-card {
                width: 100%;
                max-width: 410px;
                padding: 32px 24px;
                border: 1px solid rgba(255,255,255,.12);
                border-radius: 22px;
                background: #211d40;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,.25);
            }

            .nexora-verification-logo {
                width: 54px;
                height: 54px;
                margin: 0 auto 20px;
                display: grid;
                place-items: center;
                border-radius: 16px;
                background: #7559ef;
                font-size: 27px;
                font-weight: 800;
            }

            .nexora-verification-card h2 {
                margin: 0 0 12px;
                font-size: 24px;
            }

            .nexora-verification-card p {
                color: #c2bfd6;
                line-height: 1.6;
            }

            #nexoraOtpCode {
                width: 100%;
                box-sizing: border-box;
                margin: 18px 0 12px;
                padding: 15px;
                border: 1px solid #514a76;
                border-radius: 12px;
                outline: none;
                background: #17142e;
                color: white;
                font-size: 23px;
                text-align: center;
                letter-spacing: 8px;
            }

            #nexoraVerifyButton,
            #nexoraResendButton {
                width: 100%;
                min-height: 46px;
                margin-top: 8px;
                border: 0;
                border-radius: 12px;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }

            #nexoraVerifyButton {
                background: #7559ef;
                color: white;
            }

            #nexoraResendButton {
                background: transparent;
                color: #c7baff;
            }

            #nexoraVerifyButton:disabled,
            #nexoraResendButton:disabled {
                opacity: .6;
                cursor: wait;
            }

            #nexoraOtpMessage {
                min-height: 22px;
                overflow-wrap: anywhere;
            }
        `;

        document.head.append(otpStyle);

        // Google düyməsi
        const divider = form.querySelector(".auth-divider");
        let googleButton = document.getElementById("googleAuthButton");

        if (!googleButton) {
            googleButton = document.createElement("button");
            googleButton.id = "googleAuthButton";
            googleButton.type = "button";
            googleButton.className = "outline-button auth-google-button";
            googleButton.textContent = "Continue with Google";

            if (divider) {
                divider.insertAdjacentElement("afterend", googleButton);
            }
        }

        const extraStyle = document.createElement("style");
        extraStyle.textContent = `
            .auth-divider {
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 12px 0;
                color: var(--muted, #7b8196);
                font-size: 12px;
            }

            .auth-divider::before,
            .auth-divider::after {
                content: "";
                height: 1px;
                flex: 1;
                background: var(--line, #e7e9f2);
            }

            .auth-google-button {
                width: 100%;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font: inherit;
                font-weight: 650;
                cursor: pointer;
            }

            .auth-google-button::before {
                content: "G";
                font: bold 18px Arial;
                color: #4285f4;
            }

            #authEmail {
    display: block;
}
        `;

        document.head.append(extraStyle);

        const getMode = () =>
            document.querySelector(".auth-tab.active")?.dataset.authMode || "login";

        function syncEmailRequirement() {
            const registerMode = getMode() === "register";
            emailLabel.style.display = registerMode ? "block" : "none";
            emailInput.required = registerMode;
        }

        tabs.forEach(tab => {
            tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        requestAnimationFrame(syncEmailRequirement);
    }, true);
});

syncEmailRequirement();

        const readAccounts = () => {
            try {
                return JSON.parse(localStorage.getItem("nexoraAccounts") || "[]");
            } catch {
                return [];
            }
        };

        function usernameFor(user, accounts) {
            const metadataName = user.user_metadata?.username;

            if (metadataName && /^[a-z0-9_.]{3,24}$/i.test(metadataName)) {
                return metadataName.toLowerCase();
            }

            const emailPart = (user.email || "nexora_user")
                .split("@")[0]
                .toLowerCase()
                .replace(/[^a-z0-9_.]/g, "_")
                .replace(/^[._]+|[._]+$/g, "");

            const base = (emailPart || "nexora_user").slice(0, 17);
            const suffix = String(user.id || "user")
                .replace(/-/g, "")
                .slice(0, 6)
                .toLowerCase();

            let candidate = `${base}_${suffix}`.slice(0, 24);
            let counter = 1;

            while (accounts.some(account =>
                account.username === candidate &&
                account.supabaseUserId !== user.id
            )) {
                candidate = `${base.slice(0, 14)}_${suffix}${counter++}`.slice(0, 24);
            }

            return candidate;
        }

        function activateUser(user) {
            const accounts = readAccounts();

            const existing = accounts.find(
                account => account.supabaseUserId === user.id
            ) || accounts.find(
                account => account.email?.toLowerCase() === user.email?.toLowerCase()
            );

            const account = {
                ...(existing || {}),
                name:
                    user.user_metadata?.full_name ||
                    user.user_metadata?.name ||
                    existing?.name ||
                    user.email?.split("@")[0] ||
                    "NEXORA istifadəçisi",

                username:
    user.user_metadata?.username ||
    usernameFor(user, accounts),
                email: user.email || existing?.email || "",
                avatar:
                    user.user_metadata?.avatar_url ||
                    user.user_metadata?.picture ||
                    existing?.avatar ||
                    "",
                bio: existing?.bio || "",
                supabaseUserId: user.id
            };

            const nextAccounts = [
                ...accounts.filter(item =>
                    item.supabaseUserId !== user.id &&
                    item.email?.toLowerCase() !== user.email?.toLowerCase()
                ),
                account
            ];

            localStorage.setItem("nexoraAccounts", JSON.stringify(nextAccounts));
            localStorage.setItem("nexoraActiveAccount", JSON.stringify(account));
            localStorage.setItem("nexoraSupabaseUserId", user.id);

            window.location.replace(
                `${window.location.pathname}${window.location.search}${window.location.hash}`
            );
        }

        // Google ilə giriş
        googleButton.addEventListener("click", async () => {
            authMessage.textContent = "Google ilə giriş edilir...";
            googleButton.disabled = true;

            try {
                const { error } = await supabase.auth.signInWithOAuth({
                    provider: "google",
                    options: { redirectTo: REDIRECT_URL }
                });

                if (error) throw error;
            } catch (error) {
                authMessage.textContent =
                    error.message || "Google ilə giriş alınmadı.";
                googleButton.disabled = false;
            }
        });

        // OTP təsdiqi
        otpForm.addEventListener("submit", async event => {
            event.preventDefault();

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
                    token,
                    type: "signup"
                });

                if (error) throw error;
                if (!data.user) throw new Error("İstifadəçi tapılmadı.");

                activateUser(data.user);
            } catch (error) {
                otpMessage.textContent =
                    error.message || "Kod təsdiqlənmədi.";
            } finally {
                verifyButton.disabled = false;
            }
        });

        // OTP kodunu yenidən göndər
        resendButton.addEventListener("click", async () => {
            if (!pendingVerificationEmail) return;

            resendButton.disabled = true;
            otpMessage.textContent = "Yeni kod göndərilir...";

            try {
                const { error } = await supabase.auth.resend({
                    type: "signup",
                    email: pendingVerificationEmail
                });

                if (error) throw error;

                otpMessage.textContent = "Yeni təsdiq kodu göndərildi.";
            } catch (error) {
                otpMessage.textContent =
                    error.message || "Kod göndərilmədi.";
            } finally {
                resendButton.disabled = false;
            }
        });

        // Qeydiyyat və istifadəçi adı ilə giriş
        form.addEventListener("submit", async event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            authMessage.textContent = "";

            const mode = getMode();
            const username = usernameInput.value
                .trim()
                .replace(/^@/, "")
                .toLowerCase();

            const password = passwordInput.value;
            const email = emailInput.value.trim().toLowerCase();

            if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
                authMessage.textContent =
                    "İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.";
                return;
            }

            if (password.length < 4) {
                authMessage.textContent = "Şifrə ən azı 4 simvol olmalıdır.";
                return;
            }

            submitButton.disabled = true;

            try {
                if (mode === "register") {
                    const fullName =
                        document.getElementById("authName")?.value.trim() || "";

                    if (fullName.length < 2) {
                        throw new Error("Zəhmət olmasa adını daxil et.");
                    }

                    if (!email) {
                        throw new Error("E-poçt ünvanını daxil et.");
                    }

                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            emailRedirectTo: REDIRECT_URL,
                            data: {
                                full_name: fullName,
                                username
                            }
                        }
                    });

                    if (error) throw error;

                    if (data.session && data.user) {
                        activateUser(data.user);
                    } else {
                        pendingVerificationEmail = email;
                        authGate.hidden = true;
                        verificationPage.hidden = false;
                        otpMessage.textContent = "Təsdiq kodu e-poçtuna göndərildi.";
                        otpInput.focus();
                    }

                } else {
                    const { data, error } = await supabase.functions.invoke(
                        "sign-in-username",
                        {
                            body: { username, password }
                        }
                    );

                    if (error) {
                        throw new Error(
                            data?.error || error.message || "Giriş alınmadı."
                        );
                    }

                    if (data?.error || !data?.session) {
                        throw new Error(
                            data?.error || "İstifadəçi adı və ya şifrə yanlışdır."
                        );
                    }

                    const { data: sessionData, error: sessionError } =
                        await supabase.auth.setSession(data.session);

                    if (sessionError) throw sessionError;

                    if (!sessionData.user) {
                        throw new Error("İstifadəçi məlumatı alınmadı.");
                    }

                    activateUser(sessionData.user);
                }

            } catch (error) {
                authMessage.textContent =
                    error.message || "Əməliyyat zamanı xəta baş verdi.";
            } finally {
                submitButton.disabled = false;
            }
        }, true);

        // Google girişindən sonra sessiyanı bərpa et
        supabase.auth.getSession().then(({ data, error }) => {
            if (error) {
                authMessage.textContent =
                    `Sessiyanı yoxlamaq alınmadı: ${error.message}`;
                return;
            }

            const user = data.session?.user;

            if (
                user &&
                localStorage.getItem("nexoraSupabaseUserId") !== user.id
            ) {
                activateUser(user);
            }
        }).catch(error => {
            console.error(error);
            authMessage.textContent = "Sessiyanı yoxlamaq mümkün olmadı.";
        });

        // Çıxış
        document.getElementById("logoutButton")?.addEventListener(
            "click",
            async event => {
                if (!localStorage.getItem("nexoraSupabaseUserId")) return;

                event.preventDefault();
                event.stopImmediatePropagation();

                try {
                    await supabase.auth.signOut();
                } finally {
                    localStorage.removeItem("nexoraSupabaseUserId");
                    localStorage.removeItem("nexoraActiveAccount");
                    window.location.reload();
                }
            },
            true
        );
    });
})();

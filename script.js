document.addEventListener("DOMContentLoaded", () => {
    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const toast = $("#toast");
    let toastTimer;
    const showToast = message => {
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
    };

    const authGate = $("#authGate");
    const authForm = $("#authForm");
    const authMessage = $("#authMessage");
    let authMode = "login";
    let activeAccount = null;
    let selectedChat = null;
    let postMediaData = "";
    let chatMediaData = "";
    let profileImageData = "";
    try { activeAccount = JSON.parse(localStorage.getItem("nexoraActiveAccount")); } catch {}

    const readStored = (key, fallback) => {
        try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
    };
    const initials = name => (name || "?").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("az");
    const getAccounts = () => readStored("nexoraAccounts", []);
    const accountFor = username => getAccounts().find(account => account.username === username);
    function setAvatar(element, account) {
        if (!element) return;
        element.textContent = account?.avatar ? "" : initials(account?.name);
        element.style.backgroundImage = account?.avatar ? `url("${account.avatar}")` : "";
        element.style.backgroundSize = account?.avatar ? "cover" : "";
        element.style.backgroundPosition = account?.avatar ? "center" : "";
        element.setAttribute("aria-label", account?.name || "Profil şəkli");
    }
    const followingKey = username => `nexoraFollowing:${username}`;
    const getFollowing = username => readStored(followingKey(username), []);
    function renderHomeUserSearch() {
        const results = $("#homeUserResults");
        const query = ($("#homeUserSearch")?.value || "").trim().toLocaleLowerCase("az");
        results.replaceChildren();
        results.hidden = !query;
        if (!query || !activeAccount) return;
        const accounts = readStored("nexoraAccounts", []).filter(account => account.username !== activeAccount.username
            && `${account.name} ${account.username}`.toLocaleLowerCase("az").includes(query));
        if (!accounts.length) {
            results.innerHTML = '<div class="empty-state">Uyğun istifadəçi tapılmadı.</div>';
            return;
        }
        const following = getFollowing(activeAccount.username);
        accounts.forEach(account => {
            const row = document.createElement("div");
            row.className = "follow-user";
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            setAvatar(avatar, account);
            const details = document.createElement("span");
            details.className = "follow-user-details";
            const name = document.createElement("strong");
            name.textContent = account.name;
            const handle = document.createElement("small");
            handle.textContent = `@${account.username}`;
            details.append(name, handle);
            const button = document.createElement("button");
            button.type = "button";
            button.className = `outline-button follow-toggle${following.includes(account.username) ? " following" : ""}`;
            button.dataset.username = account.username;
            button.textContent = following.includes(account.username) ? "İzləyirsən" : "İzlə";
            row.append(avatar, details, button);
            results.append(row);
        });
    }
    function renderFollowUsers() {
        if (!activeAccount) return;
        const accounts = readStored("nexoraAccounts", []);
        const following = getFollowing(activeAccount.username);
        const followers = accounts.filter(account => getFollowing(account.username).includes(activeAccount.username));
        $("#followerCount").textContent = String(followers.length);
        $("#followingCount").textContent = String(following.length);
        renderHomeUserSearch();
        const list = $("#followUsers");
        const query = ($("#followSearch")?.value || "").trim().toLocaleLowerCase("az");
        const others = accounts.filter(account => account.username !== activeAccount.username
            && `${account.name} ${account.username}`.toLocaleLowerCase("az").includes(query));
        list.replaceChildren();
        if (!others.length) {
            list.innerHTML = `<div class="empty-state">${accounts.length > 1 ? "Uyğun istifadəçi tapılmadı." : "İzləmək üçün başqa hesab yoxdur."}</div>`;
            return;
        }
        others.forEach(account => {
            const row = document.createElement("div");
            row.className = "follow-user";
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            setAvatar(avatar, account);
            const details = document.createElement("span");
            details.className = "follow-user-details";
            const name = document.createElement("strong");
            name.textContent = account.name;
            const handle = document.createElement("small");
            handle.textContent = `@${account.username}`;
            details.append(name, handle);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "outline-button follow-toggle";
            button.dataset.username = account.username;
            button.textContent = following.includes(account.username) ? "İzləyirsən" : "İzlə";
            button.classList.toggle("following", following.includes(account.username));
            row.append(avatar, details, button);
            list.append(row);
        });
    }
    document.addEventListener("click", event => {
        const button = event.target.closest(".follow-toggle");
        if (!button || !activeAccount) return;
        const following = getFollowing(activeAccount.username);
        const username = button.dataset.username;
        const next = following.includes(username) ? following.filter(item => item !== username) : [...following, username];
        localStorage.setItem(followingKey(activeAccount.username), JSON.stringify(next));
        renderFollowUsers();
        renderFixtures([...fixturesById.values()]);
    });
    $("#homeUserSearch").addEventListener("input", renderHomeUserSearch);
    const mediaElement = (data, className = "post-media") => {
        if (!data) return null;
        const element = document.createElement(data.startsWith("data:video/") ? "video" : "img");
        element.className = className;
        element.src = data;
        if (element.tagName === "VIDEO") { element.controls = true; element.playsInline = true; }
        else element.alt = "Paylaşılan foto";
        return element;
    };

    function setAuthMode(mode) {
        authMode = mode;
        authGate.classList.toggle("register-mode", mode === "register");
        $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === mode));
        $("#authTitle").textContent = mode === "register" ? "Hesabını yarat" : "Xoş gəlmisən";
        $("#authSubtitle").textContent = mode === "register" ? "NEXORA icmasına qoşulmaq üçün qeydiyyatdan keç." : "Hesabına daxil ol və söhbətə qoşul.";
        $("#authSubmit").textContent = mode === "register" ? "Qeydiyyatdan keç" : "Daxil ol";
        $("#authName").required = mode === "register";
        $("#authPassword").autocomplete = mode === "register" ? "new-password" : "current-password";
        const emailLabel = document.getElementById("nexoraEmailLabel");
        if (emailLabel) {
            emailLabel.style.display = mode === "register" ? "block" : "none";
            emailLabel.querySelector("input").required = mode === "register";
        }
        authMessage.textContent = "";
    }

    function applyAccount(account) {
        activeAccount = account;
        localStorage.setItem("nexoraActiveAccount", JSON.stringify(account));
        authGate.hidden = true;
        const handle = `@${account.username}`;
        $("#sidebarName").textContent = account.name;
        $("#sidebarHandle").textContent = handle;
        setAvatar($("#sidebarAvatar"), account);
        setAvatar($("#headerAvatar"), account);
        setAvatar($("#profileAvatar"), account);
        setAvatar($("#composerAvatar"), account);
        $("#profileName").textContent = account.name;
        $("#profileBio").textContent = `${handle} · ${account.bio || "İdman həvəskarı ⚽"}`;
        renderPosts();
        renderContacts();
        renderFollowUsers();
        renderPredictions();
        renderNotifications();
        refreshPastPredictionResults();
        $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === "login"));
    }

    window.nexoraApplyAccount = applyAccount;
    $$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));

    $("#logoutButton").addEventListener("click", () => {
        const active = JSON.parse(localStorage.getItem("nexoraActiveAccount") || "null");
        if (!active) {
            authGate.hidden = false;
            setAuthMode("login");
            authForm.reset();
            return;
        }
        const question = $("#logoutConfirm");
        if (question) {
            question.hidden = false;
            const title = $("#logoutConfirmTitle");
            if (title) title.textContent = "Çıxış";
            const message = $("#logoutConfirmMessage");
            if (message) message.textContent = "Çıxış etmək istədiyinizə əminsiniz?";
            const confirmBtn = $("#logoutConfirmConfirm");
            if (confirmBtn) confirmBtn.textContent = "Çıxış";
            const cancelBtn = $("#logoutConfirmCancel");
            if (cancelBtn) cancelBtn.textContent = "Ləğv et";
        }
    });

    const confirmLogout = $("#logoutConfirmConfirm");
    const cancelLogout = $("#logoutConfirmCancel");
    if (confirmLogout) {
        confirmLogout.addEventListener("click", async () => {
            const question = $("#logoutConfirm");
            if (question) question.hidden = true;
            localStorage.removeItem("nexoraActiveAccount");
            localStorage.removeItem("nexoraSupabaseUserId");
            activeAccount = null;
            selectedChat = null;
            authGate.hidden = false;
            setAuthMode("login");
            authForm.reset();
            $("#authMessage").textContent = "";
            const settingsPanel = $("#settingsPanel");
            if (settingsPanel && settingsPanel.open) settingsPanel.close();
            document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === "feed"));
            if (window.nexoraSupabase?.auth) {
                try { await window.nexoraSupabase.auth.signOut(); } catch (err) {}
            }
        });
    }
    if (cancelLogout) {
        cancelLogout.addEventListener("click", () => {
            const question = $("#logoutConfirm");
            if (question) question.hidden = true;
        });
    }

    if (authGate) authGate.hidden = false;
    const pages = $$(".page");
    function showPage(id) {
        const page = document.getElementById(id);
        if (!page) return;
        pages.forEach(item => item.classList.toggle("active", item === page));
        $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.page === id));
        if (id === "profile") { renderMyPosts(); renderFollowUsers(); }
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    $$('[data-page]').forEach(link => link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
        history.replaceState(null, "", `#${link.dataset.page}`);
    }));
    const postsList = $("#postsList");
    const myPosts = $("#myPosts");

    if (activeAccount?.username) applyAccount(activeAccount);
    if (authGate && !activeAccount) authGate.hidden = false;
    window.addEventListener("storage", event => {
        if (event.key === "nexoraActiveAccount" && !localStorage.getItem("nexoraActiveAccount")) {
            authGate.hidden = false;
            setAuthMode("login");
            authForm.reset();
        }
    });
});

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

    function resetToAuthScreen() {
        authGate.hidden = false;
        setAuthMode("login");
        authForm.reset();
        $("#authMessage").textContent = "";
        $("#authPassword").value = "";
        $("#authUsername").value = "";
        const settingsPanel = $("#settingsPanel");
        if (settingsPanel && settingsPanel.open) settingsPanel.close();
        document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === "feed"));
        // Giriş ekranına keçərkən çıxış düyməsini süni klikləmə.
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
        $("#profileBio").textContent = `${handle}${account.bio?.trim() ? " · " + account.bio.trim() : ""}`;
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

    // Çıxış və təsdiq pəncərəsi yalnız script.js-də idarə edilir.

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

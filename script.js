
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

    // DARK MODE
const themeToggle = $("#themeToggle");
const root = document.documentElement;

function applyTheme(dark) {
    root.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("nexoraTheme", dark ? "dark" : "light");

    if (themeToggle) {
        themeToggle.setAttribute("aria-pressed", String(dark));
        themeToggle.setAttribute(
            "aria-label",
            dark ? "Açıq rejim" : "Tünd rejim"
        );
    }
}

const savedTheme = localStorage.getItem("nexoraTheme");
applyTheme(savedTheme ? savedTheme === "dark" :
    window.matchMedia("(prefers-color-scheme: dark)").matches
);

themeToggle?.addEventListener("click", () => {
    applyTheme(root.dataset.theme !== "dark");
});


    const authGate = $("#authGate");
    const authForm = $("#authForm");
    const authMessage = $("#authMessage");
    let authMode = "login";
    let activeAccount = null;
    let selectedChat = null;
    let postMediaData = "";
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
        const followerValue = $("#followerCount strong");
        const followingValue = $("#followingCount strong");
        if (followerValue) followerValue.textContent = String(followers.length);
        if (followingValue) followingValue.textContent = String(following.length);
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
    };
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
        const isVideo = data.startsWith("data:video/") || /\.(mp4|webm|mov|ogg|m4v)(\?|$)/i.test(data);
        const element = document.createElement(isVideo ? "video" : "img");
        element.className = className;
        element.src = data;
        if (element.tagName === "VIDEO") { element.controls = false; element.playsInline = true; element.addEventListener("click", () => element.paused ? element.play().catch(() => {}) : element.pause()); }
        else element.alt = "Paylaşılan foto";
        return element;
    };

   function setAuthMode(mode) {
    authMode = mode;

    authGate.classList.toggle("register-mode", mode === "register");

    $$(".auth-tab").forEach(tab =>
        tab.classList.toggle("active", tab.dataset.authMode === mode)
    );

    $("#authTitle").textContent =
        mode === "register" ? "Hesabını yarat" : "Xoş gəlmisən";

    $("#authSubtitle").textContent =
        mode === "register"
            ? "NEXORA icmasına qoşulmaq üçün qeydiyyatdan keç."
            : "Hesabına daxil ol və söhbətə qoşul.";

    $("#authSubmit").textContent =
        mode === "register" ? "Qeydiyyatdan keç" : "Daxil ol";

    $("#authName").required = mode === "register";

    $("#authPassword").autocomplete =
        mode === "register" ? "new-password" : "current-password";

    const emailLabel = document.getElementById("nexoraEmailLabel");

    if (emailLabel) {
        emailLabel.style.display =
            mode === "register" ? "block" : "none";

        emailLabel.querySelector("input").required =
            mode === "register";
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
        refreshPosts();
        renderContacts();
        renderFollowUsers();
        renderPredictions();
        renderNotifications();
        loadRemoteNotifications();
        renderStories();
        refreshPastPredictionResults();
        $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === "login"));
    }
    
    window.nexoraApplyAccount =
        applyAccount;

    $$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
   
    $("#logoutButton").addEventListener("click", () => {
        const modal = $("#logoutConfirm");
        if (modal) modal.hidden = false;
    });
    $("#logoutConfirm [data-logout-cancel]")?.addEventListener("click", () => {
        $("#logoutConfirm").hidden = true;
    });
    $("#logoutConfirm [data-logout-confirm]")?.addEventListener("click", async () => {
        $("#logoutConfirm").hidden = true;
        try { await window.nexoraSupabase?.auth?.signOut(); } catch (error) { console.error(error); }
        localStorage.removeItem("nexoraActiveAccount");
        localStorage.removeItem("nexoraSupabaseUserId");
        activeAccount = null;
        selectedChat = null;
        resetChat();
        authGate.hidden = false;
        setAuthMode("login");
        authForm.reset();
        history.replaceState(null, "", "#login");
    });
    const pages = $$(".page");
    let nxNotificationReturn = null;
    function showPage(id) {
        const page = document.getElementById(id);
        if (!page) return;
        if (id !== "notifications" && nxNotificationReturn) {
            nxNotificationReturn = null;
            if (typeof nxProfilePanel !== "undefined") nxProfilePanel.hidden = true;
        }
        pages.forEach(item => item.classList.toggle("active", item === page));
        $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.page === id));
        if (id === "profile") { renderMyPosts(); renderFollowUsers(); }
        if (id === "users") renderAllUsers();
        if (id === "notifications") { loadRemoteNotifications(true); const ns = getNotifications().map(item => ({...item, read:true})); localStorage.setItem(`nexoraNotifications:${activeAccount?.username}`, JSON.stringify(ns)); renderNotifications(); }
        if (id === "messages") queueMicrotask(() => renderContacts());
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    $$('[data-page]').forEach(link => link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
        history.replaceState(null, "", `#${link.dataset.page}`);
    }));
    const postsList = $("#postsList");
    const myPosts = $("#myPosts");
    function buildPost(postData) {
        const post = document.createElement("article");
        post.className = "post-card";
        post.dataset.likes = String(postData.likes || 0);
        post.dataset.order = String(postData.created || 0);
        post.dataset.postId = postData.id || "";
        const head = document.createElement("div");
        head.className = "post-head";
        const avatar = document.createElement("div");
        avatar.className = "avatar";
        const postAuthor = accountFor(postData.username);
        setAvatar(avatar, postAuthor || { name: postData.name, avatar: postData.avatar });
        const author = document.createElement("div");
        author.className = "post-author";
        const name = document.createElement("strong");
        name.textContent = postAuthor?.name || postData.name;
        const handle = document.createElement("small");
        handle.textContent = `@${postData.username} · ${new Date(postData.created).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" })}`;
        author.append(name, handle);
        head.append(avatar, author);
        post.append(head);
        if (postData.text) {
            const copy = document.createElement("p");
            copy.className = "post-copy";
            copy.textContent = postData.text;
            post.append(copy);
        }
        const media = mediaElement(postData.media);
        if (media) { media.addEventListener("contextmenu", event => event.preventDefault()); media.draggable = false; post.append(media); }
        const actions = document.createElement("div");
        actions.className = "post-actions";
        actions.innerHTML = '<button class="like-button" type="button"><span class="heart-glyph">♡</span><span class="like-count"></span></button><button class="comment-toggle" type="button">Şərhlər</button><button class="share-button" type="button">↗ Paylaş</button>  '.trim();
        const likeButton = $(".like-button", actions);
        $(".like-count", likeButton).textContent = String(postData.likes || 0);
        if (postData.likedBy?.includes(activeAccount?.username)) likeButton.classList.add("liked");
        post.append(actions);
        const comments = document.createElement("div");
        comments.className = "comments";
        comments.innerHTML = '<div class="comments-list"></div><form class="comment-form"><input type="text" placeholder="Şərh əlavə et..." maxlength="200"><button type="submit">Paylaş</button></form>';
        const savedComments = Array.isArray(postData.comments) ? postData.comments : [];
        savedComments.forEach(comment => {
            const item = document.createElement("div");
            item.className = `comment-item${comment.parentId ? " comment-reply" : ""}`;
            item.dataset.commentId = comment.id || "";
            const line = document.createElement("p");
            const authorName = document.createElement("strong");
            authorName.textContent = `${comment.name || comment.username || "İstifadəçi"}: `;
            line.append(authorName, document.createTextNode(comment.text || ""));
            const controls = document.createElement("div"); controls.className="comment-controls";
            const reply = document.createElement("button"); reply.type="button"; reply.className="comment-reply-button"; reply.textContent="Cavabla";
            const like = document.createElement("button"); like.type="button"; like.className="comment-like-button"; like.textContent="♡";
            controls.append(reply,like); item.append(line,controls); $(".comments-list", comments).append(item);
        });
        post.append(comments);
        return post;
    }
    // ---- Paylaşımlar (Supabase) — hamı görür ----
    let postsCache = [];
    function getPosts() { return postsCache; }
    async function loadPosts() {
        const sb = window.nexoraSupabase;
        if (!sb || !activeAccount) return;
        const { data: rows, error } = await sb.from("nexora_posts")
            .select("id, user_id, body, media_url, media_type, created_at")
            .order("created_at", { ascending: false })
            .limit(100);
        if (error) throw error;
        const posts = rows || [];
        const ids = posts.map(post => post.id);
        let likes = [], comments = [];
        if (ids.length) {
            const [likeRes, commentRes] = await Promise.all([
                sb.from("nexora_post_likes").select("post_id, user_id").in("post_id", ids),
                sb.from("nexora_post_comments").select("id, post_id, user_id, body, parent_comment_id, created_at").in("post_id", ids).order("created_at", { ascending: true })
            ]);
            if (likeRes.error) throw likeRes.error;
            if (commentRes.error) throw commentRes.error;
            likes = likeRes.data || [];
            comments = commentRes.data || [];
        }
        const userIds = [...new Set([...posts.map(post => post.user_id), ...comments.map(comment => comment.user_id), ...likes.map(like => like.user_id)])];
        const profiles = new Map();
        if (userIds.length) {
            const { data: profileRows, error: profileError } = await sb.from("nexora_profiles")
                .select("id, username, name, avatar_url, is_private").in("id", userIds);
            if (profileError) throw profileError;
            (profileRows || []).forEach(profile => profiles.set(profile.id, profile));
        }
        const {data:myFollowRows, error:myFollowError} = await sb.from("nexora_follows").select("following_id").eq("follower_id", (await sb.auth.getUser()).data.user?.id || "");
        if (myFollowError) throw myFollowError;
        const visiblePrivateIds = new Set([...(myFollowRows||[]).map(row=>row.following_id), (await sb.auth.getUser()).data.user?.id]);
        postsCache = posts.filter(post => { const author = profiles.get(post.user_id) || {}; return !author.is_private || visiblePrivateIds.has(post.user_id); }).map(post => {
            const author = profiles.get(post.user_id) || {};
            const postLikes = likes.filter(like => like.post_id === post.id);
            return {
                id: post.id,
                userId: post.user_id,
                name: author.name || author.username || "İstifadəçi",
                username: author.username || "",
                avatar: author.avatar_url && author.avatar_url.startsWith("https://") ? author.avatar_url : "",
                text: post.body || "",
                media: post.media_url || "",
                likes: postLikes.length,
                likedBy: postLikes.map(like => profiles.get(like.user_id)?.username).filter(Boolean),
                comments: comments.filter(comment => comment.post_id === post.id).map(comment => {
                    const commenter = profiles.get(comment.user_id) || {};
                    return { id:comment.id, parentId:comment.parent_comment_id, username: commenter.username || "", name: commenter.name || commenter.username || "İstifadəçi", text: comment.body, created: new Date(comment.created_at).getTime() };
                }),
                created: new Date(post.created_at).getTime()
            };
        });
    }
    async function refreshPosts() {
        try { await loadPosts(); }
        catch (error) { console.error("Posts load:", error); showToast("Paylaşımları yükləmək mümkün olmadı."); }
        renderPosts();
    }
    setInterval(() => {
        if (!activeAccount || document.hidden) return;
        if (document.activeElement?.closest?.("#postsList")) return;
        if ($$("#postsList .comment-form input").some(input => input.value)) return;
        loadPosts().then(renderPosts).catch(error => console.error("Posts poll:", error));
    }, 45000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && activeAccount) refreshPosts(); });
    function renderPosts() {
        if (!activeAccount) return;
        const allPosts = getPosts();
        const posts = allPosts.filter(post => post.username !== activeAccount.username).sort((a, b) => b.created - a.created);
        postsList.replaceChildren(...posts.map(buildPost));
        if (!posts.length) postsList.innerHTML = '<div class="empty-state">Başqa istifadəçilər paylaşım etdikcə onlar burada görünəcək.</div>';
        if ($("#postCount")) $("#postCount").textContent = String(allPosts.filter(post => post.username === activeAccount.username).length);
        renderMyPosts();
    }
    function renderMyPosts() {
        if (!activeAccount || !myPosts) return;
        const posts = getPosts().filter(post => post.username === activeAccount.username).sort((a, b) => b.created - a.created);
        myPosts.replaceChildren(...posts.map(buildPost));
        if (!posts.length) myPosts.innerHTML = '<div class="empty-state">Hələ paylaşım etməmisən.</div>';
    }
    if (["feed", "games", "predictions", "messages", "profile", "users", "notifications"].includes(location.hash.slice(1))) showPage(location.hash.slice(1));

    const fixtureDate = $("#fixtureDate");
    const fixtureDateHeading = $("#fixtureDateHeading");
    const localDateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let fixtureRequestId = 0;
    let fixturesById = new Map();
    const predictionLabels = { home: "1 · Ev sahibi qələbəsi", draw: "X · Heç-heçə", away: "2 · Qonaq qələbəsi" };
    const getPredictions = () => activeAccount ? readStored(`nexoraBets:${activeAccount.username}`, []) : [];
    const getNotifications = () => activeAccount ? readStored(`nexoraNotifications:${activeAccount.username}`, []) : [];
    async function handleFollowRequestNotification(item, accept) {
        try {
            const sb = window.nexoraSupabase;
            const { data: { user } } = await sb.auth.getUser();
            if (!user || !item.actorId) throw new Error("İstifadəçi tapılmadı.");
            const { data: request, error: requestError } = await sb.from("nexora_follow_requests")
                .select("id, requester_id, target_id")
                .eq("requester_id", item.actorId).eq("target_id", user.id).maybeSingle();
            if (requestError) throw requestError;
            if (!request) {
                showToast("Bu izləmə istəyi artıq mövcud deyil.");
            } else if (accept) {
                const { error } = await sb.rpc("nexora_accept_follow_request", { p_request_id: request.id });
                if (error) throw error;
                await sb.from("nexora_follow_requests").delete().eq("id", request.id);
                await sb.from("nexora_notifications").insert({ recipient_id: request.requester_id, actor_id: user.id, kind: "follow", message: `@${activeAccount.username} izləmə istəyini qəbul etdi.` });
                showToast("İzləmə istəyi qəbul edildi.");
            } else {
                const { error } = await sb.from("nexora_follow_requests").delete().eq("id", request.id);
                if (error) throw error;
                showToast("İzləmə istəyi ləğv edildi.");
            }
            if (item.id) await sb.from("nexora_notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id);
            const stored = getNotifications().map(n => n.id === item.id ? {...n, read:true, requestHandled:true} : n);
            localStorage.setItem(`nexoraNotifications:${activeAccount.username}`, JSON.stringify(stored));
            renderNotifications();
            refreshFollowRequests();
        } catch (error) {
            console.error("Follow request action:", error);
            showToast(error.message || "Əməliyyat zamanı xəta baş verdi.");
        }
    }
    function renderNotifications() {
        const list = $("#notificationList");
        const fullList = $("#fullNotificationList");
        if (!list) return;
        const notifications = getNotifications().sort((a, b) => b.created - a.created);
        const unread = notifications.filter(item => !item.read).length;
        const badge = $("#notificationBadge");
        badge.hidden = unread === 0;
        badge.textContent = unread > 9 ? "9+" : String(unread);
        list.replaceChildren();
        if (fullList) fullList.replaceChildren();
        if (!notifications.length) {
            list.innerHTML = '<p class="empty-state">Hələ bildiriş yoxdur.</p>';
            if (fullList) fullList.innerHTML = '<p class="empty-state">Hələ bildiriş yoxdur.</p>';
            return;
        }
        const makeCard = item => {
            const card = document.createElement("article");
            card.className = `notification-item${item.read ? "" : " unread"}`;
            const title = document.createElement("strong");
            title.textContent = item.title;
            const text = document.createElement("p");
            text.textContent = item.message;
            const time = document.createElement("small");
            time.textContent = new Date(item.created).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" });
            card.append(title, text, time);
            if (item.kind === "follow_request" && item.actorId && !item.requestHandled) {
                const actions = document.createElement("div");
                actions.className = "notification-actions";
                const accept = document.createElement("button");
                accept.type = "button"; accept.className = "primary-button"; accept.textContent = "Qəbul et";
                const reject = document.createElement("button");
                reject.type = "button"; reject.className = "outline-button"; reject.textContent = "Ləğv et";
                accept.addEventListener("click", () => handleFollowRequestNotification(item, true));
                reject.addEventListener("click", () => handleFollowRequestNotification(item, false));
                actions.append(accept, reject); card.append(actions);
            }
            return card;
        };
        notifications.forEach(item => {
            list.append(makeCard(item));
            if (fullList) fullList.append(makeCard(item));
        });
    }
    async function loadRemoteNotifications(markRead = false) {
        try {
            const sb = window.nexoraSupabase; const {data:{user}} = await sb.auth.getUser(); if (!user) return;
            const {data, error} = await sb.from("nexora_notifications").select("id, actor_id, message, kind, created_at, read_at").eq("recipient_id", user.id).order("created_at", {ascending:false}).limit(100);
            if (error) throw error;
            if (markRead) await sb.from("nexora_notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",user.id).is("read_at",null);
            const local = getNotifications().map(item => markRead ? {...item, read:true} : item);
            (data || []).forEach(row => {
                const remoteItem = {id:row.id,title:({follow:"Yeni izləyici",follow_request:"İzləmə istəyi",like:"Yeni bəyənmə",story_like:"Hekayə bəyənildi",comment:"Yeni şərh",story_comment:"Hekayəyə şərh",reply:"Şərhə cavab"})[row.kind] || "Bildiriş",message:row.message,actorId:row.actor_id,kind:row.kind,created:new Date(row.created_at).getTime(),read:markRead || Boolean(row.read_at)};
                const existingIndex = local.findIndex(item => item.id === row.id);
                if (existingIndex >= 0) local[existingIndex] = {...local[existingIndex], ...remoteItem, requestHandled:local[existingIndex].requestHandled};
                else local.push(remoteItem);
            });
            localStorage.setItem(`nexoraNotifications:${activeAccount.username}`, JSON.stringify(local.slice(-150)));
            renderNotifications();
        } catch (error) { console.warn("Notifications load:", error); }
    }
    function addPredictionNotification(prediction) {
        const notifications = getNotifications();
        const id = `${prediction.fixtureId}:${prediction.created}`;
        if (notifications.some(item => item.id === id)) return;
        const won = prediction.status === "won";
        notifications.push({
            id,
            title: won ? "Proqnoz uğurlu oldu" : "Proqnoz uğursuz oldu",
            message: `${prediction.home} – ${prediction.away} · Nəticə ${prediction.score} · Seçimin: ${predictionLabels[prediction.pick] || `${prediction.marketName}: ${prediction.marketValue}`}`,
            created: Date.now(),
            read: false
        });
        localStorage.setItem(`nexoraNotifications:${activeAccount.username}`, JSON.stringify(notifications));
        renderNotifications();
    }
    function addSocialNotification(username, title, message, id) {
        if (!activeAccount || !username || username === activeAccount.username) return;
        const notifications = readStored(`nexoraNotifications:${username}`, []);
        if (notifications.some(item => item.id === id)) return;
        notifications.push({ id, title, message, created: Date.now(), read: false });
        localStorage.setItem(`nexoraNotifications:${username}`, JSON.stringify(notifications.slice(-150)));
        (async () => { try { const sb = window.nexoraSupabase; const {data:{user}} = await sb.auth.getUser(); if (!user) return; const {data:recipient} = await sb.from("nexora_profiles").select("id").eq("username", username).maybeSingle(); if (recipient?.id) await sb.from("nexora_notifications").insert({recipient_id:recipient.id, actor_id:user.id, kind:(title.includes("bəyənmə")?"like":title.includes("cavab")?"reply":"comment"), entity_id:id, message}); } catch (error) { console.warn("Notification sync:", error); } })();
        if (username === activeAccount.username) renderNotifications();
    }
    let predictionFilter = "all";
    function renderPredictions() {
        const container = $("#myPredictions");
        if (!container) return;
        const predictions = getPredictions().sort((a, b) => b.created - a.created);
        const visible = predictionFilter === "all" ? predictions : predictions.filter(item => (item.status || "pending") === predictionFilter);
        if (!visible.length) {
            container.innerHTML = `<div class="empty-state">${predictions.length ? "Bu bölmədə proqnoz yoxdur." : "Hələ proqnoz etməmisən. Oyun mərkəzindən pulsuz seçim et."}</div>`;
            return;
        }
        const list = document.createElement("div");
        list.className = "prediction-list";
        visible.forEach(prediction => {
            const item = document.createElement("article");
            item.className = "prediction-item";
            const details = document.createElement("div");
            const teams = document.createElement("strong");
            teams.textContent = `${prediction.home} – ${prediction.away}`;
            const pick = document.createElement("small");
            const selection = prediction.marketName
                ? `${prediction.marketName}: ${prediction.marketValue}${prediction.odd ? ` · Əmsal ${prediction.odd}` : ""}`
                : (predictionLabels[prediction.pick] || "Nəticə seçimi");
            pick.textContent = `${prediction.league} · ${selection}`;
            details.append(teams, pick);
            const result = document.createElement("span");
            result.className = `prediction-status ${prediction.status || "pending"}`;
            result.textContent = prediction.status === "won" ? `Uğurlu · ${prediction.score}`
                : prediction.status === "lost" ? `Uğursuz · ${prediction.score}` : "Gözlənilən";
            item.append(details, result);
            list.append(item);
        });
        container.replaceChildren(list);
    }
    $$(".prediction-tab").forEach(button => button.addEventListener("click", () => {
        predictionFilter = button.dataset.predictionFilter;
        $$(".prediction-tab").forEach(tab => tab.classList.toggle("active", tab === button));
        renderPredictions();
    }));
    function predictionGroup(league) {
        const name = league.name || "";
        const country = league.country || "";
        const normalized = `${name} ${country}`.toLocaleLowerCase("en");
        if (/uefa|fifa|world cup|european championship|euro championship/.test(normalized)) return 0;
        const topFive = [
            ["england", /premier league/], ["spain", /la liga/], ["germany", /bundesliga/],
            ["italy", /serie a/], ["france", /ligue 1/]
        ];
        const topIndex = topFive.findIndex(([nation, pattern]) => country.toLocaleLowerCase("en").includes(nation) && pattern.test(name.toLocaleLowerCase("en")));
        if (topIndex !== -1) return topIndex + 1;
        if (/azerbaijan|azərbaycan/.test(`${country} ${name}`.toLocaleLowerCase("en"))) return 6;
        return 7;
    }
    function resolvePrediction(prediction, home, away, events = []) {
        const market = `${prediction.marketName || ""} ${prediction.marketValue || ""}`.toLocaleLowerCase("en");
        if (/1st half|first half|half time|home team|away team|team total/.test(market)) return null;
        if (!prediction.marketName) {
            const result = home > away ? "home" : home < away ? "away" : "draw";
            return result === prediction.pick;
        }
        if (/both teams.*(score|to score)|both teams score/.test(market)) {
            const yes = home > 0 && away > 0;
            return /\bno\b/.test(prediction.marketValue.toLocaleLowerCase("en")) ? !yes : yes;
        }
        if (/over\/under|total goals|goals over|goals under/.test(market)) {
            const match = prediction.marketValue.match(/(over|under)\s*(\d+(?:\.\d+)?)/i);
            if (!match) return null;
            const line = Number(match[2]);
            return match[1].toLowerCase() === "over" ? home + away > line : home + away < line;
        }
        if (/match winner|1x2|full time result|winner/.test(market)) {
            const value = prediction.marketValue.toLocaleLowerCase("en");
            const result = home > away ? "home" : home < away ? "away" : "draw";
            const selected = /^(home|1)$/.test(value) ? "home" : /^(away|2)$/.test(value) ? "away" : /^(draw|x)$/.test(value) ? "draw" : null;
            return selected ? selected === result : null;
        }
        if (/scorer|to score|score a goal/.test(market)) {
            const value = prediction.marketValue.toLocaleLowerCase("en");
            const scorers = events.filter(item => /goal/i.test(item.type || "") && item.player?.name).map(item => item.player.name.toLocaleLowerCase("en"));
            if (!events.length && home + away > 0) return null;
            if (/no goalscorer|no goal scorer/.test(value)) return scorers.length === 0 && home + away === 0;
            const selectedName = prediction.marketValue.split(/\s*\(|\s*[-–]\s*/)[0].trim().toLocaleLowerCase("en");
            return scorers.length ? scorers.some(name => name === selectedName || name.includes(selectedName) || selectedName.includes(name)) : false;
        }
        return null;
    }
    async function settlePredictions(fixtures) {
        if (!activeAccount) return;
        const predictions = getPredictions();
        let changed = false;
        for (const match of fixtures) {
            const status = match.fixture.status.short;
            if (!["FT", "AET", "PEN"].includes(status) || match.goals.home == null || match.goals.away == null) continue;
            const pending = predictions.filter(item => String(item.fixtureId) === String(match.fixture.id) && (item.status || "pending") === "pending");
            const events = [];
            pending.forEach(prediction => {
                const outcome = resolvePrediction(prediction, match.goals.home, match.goals.away, events);
                if (outcome === null) return;
                prediction.status = outcome ? "won" : "lost";
                prediction.score = `${match.goals.home}–${match.goals.away}`;
                addPredictionNotification(prediction);
                changed = true;
            });
        }
        if (changed) {
            localStorage.setItem(`nexoraBets:${activeAccount.username}`, JSON.stringify(predictions));
            renderPredictions();
        }
    }
    function updateFixtureDate(value) {
        const selected = new Date(`${value}T12:00:00`);
        if (Number.isNaN(selected.getTime())) return;
        fixtureDate.value = localDateValue(selected);
        fixtureDateHeading.textContent = selected.toLocaleDateString("az-AZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
        $$(".fixture-day").forEach(button => {
            if (button.dataset.day === "live") {
                button.classList.remove("active");
                return;
            }
            const offset = button.dataset.day === "tomorrow" ? 1 : 0;
            const target = new Date();
            target.setDate(target.getDate() + offset);
            button.classList.toggle("active", localDateValue(target) === fixtureDate.value);
        });
        filterFixtures();
    }
    function filterFixtures() {
        const query = ($("#fixtureSearch")?.value || "").trim().toLocaleLowerCase("az");
        const league = $("#leagueFilter")?.value || "";
        $$(".game-card", $("#gamesList")).forEach(card => {
            const searchable = (card.dataset.search || card.textContent).toLocaleLowerCase("az");
            card.classList.toggle("is-hidden", (query && !searchable.includes(query)) || (league && card.dataset.league !== league));
        });
    }
    function loadFixtureExtras(match, target) {
        target.textContent = "Heyət və əmsal məlumatı açıq mənbədə təqdim edilmir.";
    }
    function renderFixtures(fixtures, liveOnly = false) {
        const gamesList = $("#gamesList");
        const leagueFilter = $("#leagueFilter");
        const selectedLeague = leagueFilter.value;
        gamesList.replaceChildren();
        fixturesById = new Map(fixtures.map(match => [String(match.fixture.id), match]));
        settlePredictions(fixtures);
        const leagues = [...new Map(fixtures.map(match => [String(match.league.id), match.league])).values()]
            .sort((a, b) => predictionGroup(a) - predictionGroup(b) || a.name.localeCompare(b.name, "az"));
        leagueFilter.replaceChildren(new Option("Bütün liqalar", ""));
        leagues.forEach(league => leagueFilter.add(new Option(`${league.name}${league.country ? ` · ${league.country}` : ""}`, String(league.id))));
        if (leagues.some(league => String(league.id) === selectedLeague)) leagueFilter.value = selectedLeague;

        if (!fixtures.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = liveOnly ? "Hazırda canlı oyun yoxdur." : "Bu tarix üçün oyun tapılmadı.";
            gamesList.replaceChildren(empty);
            return;
        }
        fixtures.forEach(match => {
            const card = document.createElement("article");
            card.className = "game-card";
            card.dataset.fixtureId = String(match.fixture.id);
            card.dataset.league = String(match.league.id);
            card.dataset.search = `${match.league.name} ${match.league.country || ""} ${match.teams.home.name} ${match.teams.away.name}`;

            const meta = document.createElement("div");
            meta.className = "game-meta";
            const leagueLogo = document.createElement("img");
            leagueLogo.className = "fixture-league-logo";
            leagueLogo.alt = "";
            leagueLogo.loading = "lazy";
            if (match.league.logo) leagueLogo.src = match.league.logo;
            leagueLogo.addEventListener("error", () => leagueLogo.remove());
            const league = document.createElement("strong");
            league.textContent = `${match.league.name}${match.league.country ? ` · ${match.league.country}` : ""}`;
            const time = document.createElement("time");
            time.textContent = new Date(match.fixture.date).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
            const status = document.createElement("span");
            status.className = match.fixture.status.elapsed != null ? "live-label" : "upcoming-label";
            status.textContent = match.fixture.status.elapsed != null
                ? `CANLI · ${match.fixture.status.elapsed}′`
                : (match.fixture.status.short === "FT" ? "BAŞA ÇATIB" : match.fixture.status.long);
            meta.append(...(match.league.logo ? [leagueLogo] : []), league, time, status);

            const score = document.createElement("div");
            score.className = "game-score api-game-score";
            const makeTeam = team => {
                const wrapper = document.createElement("div");
                if (team.logo) {
                    const logo = document.createElement("img");
                    logo.className = "fixture-team-logo";
                    logo.alt = "";
                    logo.loading = "lazy";
                    logo.src = team.logo;
                    logo.addEventListener("error", () => logo.remove());
                    wrapper.append(logo);
                }
                const name = document.createElement("strong");
                name.textContent = team.name;
                wrapper.append(name);
                return wrapper;
            };
            const scoreText = document.createElement("strong");
            scoreText.className = "score";
            scoreText.textContent = match.goals.home == null && match.goals.away == null
                ? time.textContent
                : `${match.goals.home ?? 0} - ${match.goals.away ?? 0}`;
            score.append(makeTeam(match.teams.home), scoreText, makeTeam(match.teams.away));

            const details = document.createElement("div");
            details.className = "fixture-details is-hidden";
            const detailRows = [
                ["Turnir", match.league.round || "Məlumat yoxdur"],
                ["Məkan", match.fixture.venue?.name || "Məlumat yoxdur"],
                ["Şəhər", match.fixture.venue?.city || "Məlumat yoxdur"],
                ["Hakim", match.fixture.referee || "Məlumat yoxdur"],
                ["Matç statusu", match.fixture.status.long || "Məlumat yoxdur"]
            ];
            detailRows.forEach(([label, value]) => {
                const row = document.createElement("p");
                const strong = document.createElement("strong");
                strong.textContent = `${label}: `;
                row.append(strong, document.createTextNode(value));
                details.append(row);
            });
            const extras = document.createElement("div");
            extras.className = "fixture-extras";
            details.append(extras);
            const toggle = document.createElement("button");
            toggle.type = "button";
            toggle.className = "outline-button fixture-detail-toggle";
            toggle.textContent = "Oyun detalları";
            toggle.addEventListener("click", () => {
                const open = details.classList.toggle("is-hidden");
                toggle.textContent = open ? "Oyun detalları" : "Detalları bağla";
                if (!open && !extras.dataset.loaded) {
                    extras.dataset.loaded = "true";
                    loadFixtureExtras(match, extras);
                }
            });
            const controls = document.createElement("div");
            controls.className = "prediction-controls";
            controls.dataset.fixtureId = String(match.fixture.id);
            const saved = getPredictions().find(item => String(item.fixtureId) === String(match.fixture.id) && !item.marketName);
            const finished = ["FT", "AET", "PEN"].includes(match.fixture.status.short);
            const started = finished || match.fixture.status.elapsed != null;
            if (saved) {
                const note = document.createElement("p");
                note.className = "prediction-saved";
                note.textContent = `Sənin pulsuz seçimin: ${predictionLabels[saved.pick]}`;
                controls.append(note);
            } else if (started) {
                const note = document.createElement("p");
                note.className = "prediction-saved";
                note.textContent = finished ? "Oyun başa çatıb — artıq proqnoz qəbul edilmir." : "Oyun başlayıb — artıq proqnoz qəbul edilmir.";
                controls.append(note);
            }
            Object.entries(predictionLabels).forEach(([pick, label]) => {
                const option = document.createElement("div");
                option.className = "prediction-option";
                const choice = document.createElement("button");
                choice.type = "button";
                choice.className = `prediction-choice${saved?.pick === pick ? " selected" : ""}`;
                choice.dataset.pick = pick;
                choice.textContent = label;
                choice.disabled = Boolean(saved) || started;
                option.append(choice);
                const avatars = document.createElement("div");
                avatars.className = "prediction-followers";
                const followingAccounts = readStored("nexoraAccounts", []).filter(account => getFollowing(activeAccount?.username || "").includes(account.username));
                followingAccounts.forEach(account => {
                    const picks = readStored(`nexoraBets:${account.username}`, []);
                    if (!picks.some(item => String(item.fixtureId) === String(match.fixture.id) && !item.marketName && item.pick === pick)) return;
                    const avatar = document.createElement("span");
                    avatar.className = "avatar prediction-follower-avatar";
                    setAvatar(avatar, account);
                    avatar.title = `${account.name} · ${predictionLabels[pick]}`;
                    avatar.setAttribute("aria-label", avatar.title);
                    avatars.append(avatar);
                });
                option.append(avatars);
                controls.append(option);
            });
            if (!saved && !started) {
                const submit = document.createElement("button");
                submit.type = "button";
                submit.className = "prediction-submit";
                submit.textContent = "Pulsuz proqnoz et";
                controls.append(submit);
            }
            card.append(meta, score, toggle, details, controls);
            gamesList.append(card);
        });
        filterFixtures();
    }
    $("#gamesList").addEventListener("click", event => {
        const marketOption = event.target.closest(".market-option");
        if (marketOption) {
            $$(".market-option", marketOption.closest(".market-group")).forEach(option => option.classList.toggle("selected", option === marketOption));
            return;
        }
        const marketSave = event.target.closest(".market-save");
        if (marketSave) {
            if (!activeAccount) return showToast("Pulsuz proqnoz etmək üçün hesabına daxil ol.");
            const group = marketSave.closest(".market-group");
            const selected = $(".market-option.selected", group);
            if (!selected) return showToast("Əvvəlcə bu bazarda seçim et.");
            const card = marketSave.closest(".game-card");
            const fixtureId = card.dataset.fixtureId;
            const match = fixturesById.get(fixtureId);
            if (!match) return showToast("Oyun məlumatı yenilənmədi. Tarixi yenilə.");
            if (match.fixture.status.elapsed != null || ["FT", "AET", "PEN"].includes(match.fixture.status.short)) return showToast("Oyun başlayıb və ya bitib — proqnoz bağlanıb.");
            const predictions = getPredictions();
            const marketName = group.dataset.marketName;
            const marketValue = selected.dataset.value;
            if (predictions.some(item => String(item.fixtureId) === fixtureId && item.marketName === marketName && item.marketValue === marketValue)) return showToast("Bu seçim artıq qeydə alınıb.");
            predictions.push({
                fixtureId,
                fixtureDate: fixtureDate.value,
                leagueId: match.league.id,
                home: match.teams.home.name,
                away: match.teams.away.name,
                league: match.league.name,
                marketName,
                marketValue,
                odd: selected.dataset.odd,
                status: "pending",
                score: "",
                created: Date.now()
            });
            try { localStorage.setItem(`nexoraBets:${activeAccount.username}`, JSON.stringify(predictions)); }
            catch { return showToast("Proqnozu yadda saxlamaq mümkün olmadı."); }
            renderPredictions();
            showToast("Pulsuz proqnoz qeydə alındı.");
            return;
        }
        const choice = event.target.closest(".prediction-choice");
        if (choice) {
            $$(".prediction-choice", choice.closest(".prediction-controls")).forEach(button => button.classList.toggle("selected", button === choice));
            return;
        }
        const submit = event.target.closest(".prediction-submit");
        if (!submit) return;
        if (!activeAccount) return showToast("Pulsuz proqnoz etmək üçün hesabına daxil ol.");
        const controls = submit.closest(".prediction-controls");
        const selected = $(".prediction-choice.selected", controls);
        if (!selected) return showToast("Əvvəlcə nəticə seç.");
        const fixtureId = controls.dataset.fixtureId;
        const match = fixturesById.get(fixtureId);
        if (!match) return showToast("Oyun məlumatı yenilənmədi. Yenidən cəhd et.");
        if (match.fixture.status.elapsed != null || ["FT", "AET", "PEN"].includes(match.fixture.status.short)) return showToast("Oyun başlayıb və ya başa çatıb — proqnoz qəbul edilmir.");
        const predictions = getPredictions();
        if (predictions.some(item => String(item.fixtureId) === fixtureId && !item.marketName)) return showToast("Bu oyun üçün nəticə proqnozunu artıq etmisən.");
        predictions.push({
            fixtureId,
            fixtureDate: fixtureDate.value,
            leagueId: match.league.id,
            home: match.teams.home.name,
            away: match.teams.away.name,
            league: match.league.name,
            pick: selected.dataset.pick,
            status: "pending",
            score: "",
            created: Date.now()
        });
        try { localStorage.setItem(`nexoraBets:${activeAccount.username}`, JSON.stringify(predictions)); }
        catch { return showToast("Proqnozu yadda saxlamaq mümkün olmadı."); }
        renderFixtures([...fixturesById.values()]);
        renderPredictions();
        showToast("Pulsuz proqnoz qeydə alındı.");
    });
    const publicSoccerLeagues = [
        ["eng.1", "İngiltərə Premyer Liqası"], ["esp.1", "İspaniya La Liqası"],
        ["ger.1", "Almaniya Bundesliqası"], ["ita.1", "İtaliya Serie A"],
        ["fra.1", "Fransa Ligue 1"], ["tur.1", "Türkiyə Super Liqası"],
        ["ned.1", "Niderland Eredivisie"], ["por.1", "Portuqaliya Primeira Liqası"],
        ["uefa.champions", "UEFA Çempionlar Liqası"], ["uefa.europa", "UEFA Avropa Liqası"]
    ];
    function adaptEspnEvent(event, leagueId, leagueName) {
        const competition = event.competitions?.[0];
        const competitors = competition?.competitors || [];
        const home = competitors.find(team => team.homeAway === "home");
        const away = competitors.find(team => team.homeAway === "away");
        if (!home || !away) return null;
        const state = event.status?.type?.state || "pre";
        const inProgress = state === "in";
        const completed = state === "post" || event.status?.type?.completed;
        const statusText = event.status?.type?.detail || event.status?.type?.shortDetail || "Başlamayı gözləyir";
        return {
            fixture: {
                id: `${leagueId}-${event.id}`,
                date: event.date,
                referee: "",
                venue: { name: competition.venue?.fullName || "", city: competition.venue?.address?.city || "" },
                status: {
                    elapsed: inProgress ? (Number.parseInt(event.status?.displayClock, 10) || Number(event.status?.period) || 1) : null,
                    short: completed ? "FT" : inProgress ? "LIVE" : "NS",
                    long: statusText
                }
            },
            league: { id: leagueId, name: competition.league?.name || leagueName, country: "", round: "" },
            teams: {
                home: { id: home.team.id, name: home.team.displayName || home.team.name, logo: home.team.logo || "" },
                away: { id: away.team.id, name: away.team.displayName || away.team.name, logo: away.team.logo || "" }
            },
            goals: { home: home.score === "" ? null : Number(home.score), away: away.score === "" ? null : Number(away.score) }
        };
    }
    async function loadFixtures(date, liveOnly = false) {
        const requestId = ++fixtureRequestId;
        const gamesList = $("#gamesList");
        gamesList.innerHTML = '<div class="empty-state">Oyunlar yüklənir…</div>';
        try {
            const dateCode = date.replaceAll("-", "");
            const results = await Promise.allSettled(publicSoccerLeagues.map(async ([leagueId, leagueName]) => {
                const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/soccer/${leagueId}/scoreboard`);
                url.searchParams.set("dates", dateCode);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                return (data.events || []).map(event => adaptEspnEvent(event, leagueId, leagueName)).filter(Boolean);
            }));
            if (requestId !== fixtureRequestId) return;
            const successful = results.filter(result => result.status === "fulfilled");
            if (!successful.length) {
                gamesList.innerHTML = '<div class="empty-state">Oyun məlumatını yükləmək alınmadı. İnternet bağlantısını yoxlayıb yenilə.</div>';
                return;
            }
            let fixtures = successful.flatMap(result => result.value);
            if (liveOnly) fixtures = fixtures.filter(match => match.fixture.status.elapsed !== null);
            fixtures.sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));
            renderFixtures(fixtures, liveOnly);
        } catch (error) {
            if (requestId !== fixtureRequestId) return;
            console.error("Oyun məlumatını yükləmək mümkün olmadı:", error);
            gamesList.innerHTML = '<div class="empty-state">Oyun məlumatına qoşulmaq mümkün olmadı. İnternet bağlantısını yoxlayın.</div>';
        }
    }
    async function refreshPastPredictionResults() {
        if (!activeAccount) return;
        const username = activeAccount.username;
        const today = localDateValue(new Date());
        const groups = new Map();
        getPredictions().filter(item => (item.status || "pending") === "pending" && item.fixtureDate < today && item.leagueId)
            .forEach(item => groups.set(`${item.fixtureDate}|${item.leagueId}`, item));
        const results = await Promise.allSettled([...groups.values()].map(async prediction => {
            const url = new URL(`https://site.api.espn.com/apis/site/v2/sports/soccer/${prediction.leagueId}/scoreboard`);
            url.searchParams.set("dates", prediction.fixtureDate.replaceAll("-", ""));
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return (data.events || []).map(event => adaptEspnEvent(event, prediction.leagueId, prediction.league)).filter(Boolean);
        }));
        if (activeAccount?.username !== username) return;
        const fixtures = results.filter(result => result.status === "fulfilled").flatMap(result => result.value);
        if (fixtures.length) settlePredictions(fixtures);
    }
    if (fixtureDate) {
        updateFixtureDate(localDateValue(new Date()));
        loadFixtures(fixtureDate.value);
        refreshPastPredictionResults();
        $$(".fixture-day").forEach(button => button.addEventListener("click", () => {
            if (button.dataset.day === "live") {
                $$(".fixture-day").forEach(day => day.classList.toggle("active", day === button));
                fixtureDateHeading.textContent = "Canlı oyunlar";
                loadFixtures(fixtureDate.value, true);
                return;
            }
            const date = new Date();
            if (button.dataset.day === "tomorrow") date.setDate(date.getDate() + 1);
            updateFixtureDate(localDateValue(date));
            loadFixtures(fixtureDate.value);
        }));
        fixtureDate.addEventListener("change", () => {
            updateFixtureDate(fixtureDate.value);
            loadFixtures(fixtureDate.value);
        });
        $("#fixtureSearch").addEventListener("input", filterFixtures);
        $("#leagueFilter").addEventListener("change", filterFixtures);
        $("#refreshFixtures").addEventListener("click", () => loadFixtures(
            fixtureDate.value,
            $(".fixture-day[data-day='live']").classList.contains("active")
        ));
        setInterval(() => {
            loadFixtures(fixtureDate.value, $(".fixture-day[data-day='live']").classList.contains("active"));
            refreshPastPredictionResults();
        }, 60000);
    }

    function loadFile(file, done) {
        if (!file) { done(""); return; }
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) { showToast("Yalnız foto və video əlavə etmək olar."); return; }
        if (file.size > 2 * 1024 * 1024) { showToast("Demo üçün fayl 2 MB-dan kiçik olmalıdır."); return; }
        const reader = new FileReader();
        reader.onload = () => done(String(reader.result));
        reader.onerror = () => showToast("Faylı oxumaq mümkün olmadı.");
        reader.readAsDataURL(file);
    }
    $("#postMedia").addEventListener("change", event => { const pickedFile = event.target.files[0]; loadFile(pickedFile, data => {
        postMediaData = data;
        postMediaFile = pickedFile || null;
        const preview = $("#postMediaPreview");
        preview.replaceChildren();
        const media = mediaElement(data, "post-media");
        if (media) preview.append(media);
    }); });
    let postMediaFile = null;
    let postSending = false;
    $("#postForm").addEventListener("submit", async event => {
        event.preventDefault();
        if (postSending) return;
        const text = $("#postText").value.trim();
        if (!text && !postMediaData) return showToast("Mətn və ya foto/video əlavə et.");
        const sb = window.nexoraSupabase;
        postSending = true;
        try {
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error("Paylaşım üçün hesaba daxil ol.");
            let mediaUrl = null, mediaType = null;
            if (postMediaFile) {
                mediaType = postMediaFile.type.startsWith("video/") ? "video" : "image";
                const ext = ((postMediaFile.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || (mediaType === "video" ? "mp4" : "jpg");
                const fileId = window.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const path = `${user.id}/${fileId}.${ext}`;
                const upload = await sb.storage.from("post-media").upload(path, postMediaFile, { contentType: postMediaFile.type, cacheControl: "3600" });
                if (upload.error) throw upload.error;
                mediaUrl = sb.storage.from("post-media").getPublicUrl(path).data.publicUrl;
            }
            const { error } = await sb.from("nexora_posts").insert({ user_id: user.id, body: text, media_url: mediaUrl, media_type: mediaUrl ? mediaType : null });
            if (error) throw error;
            $("#postText").value = "";
            $("#postMedia").value = "";
            $("#postMediaPreview").replaceChildren();
            postMediaData = "";
            postMediaFile = null;
            await refreshPosts();
            showToast("Paylaşım dərc olundu.");
        } catch (error) {
            console.error("Post error:", error);
            showToast(error.message || "Paylaşım dərc olunmadı.");
        } finally {
            postSending = false;
        }
    });

    // ================= MESAJLAŞMA (Supabase) =================
    const chatState = {
        me: null, people: new Map(), peopleAt: 0, convos: [],
        active: null, thread: [], channel: null, poll: null,
        file: null, previewUrl: "", sending: false
    };
    const chatEl = {
        layout: $("#chatLayout"),
        contacts: $("#chatContacts"),
        picker: $("#chatPicker"),
        pickerList: $("#chatPickerList"),
        pickerSearch: $("#chatPickerSearch"),
        messages: $("#chatMessages"),
        title: $("#chatTitleInfo"),
        form: $("#chatForm"),
        input: $("#chatInput"),
        send: $("#chatSend"),
        preview: $("#chatMediaPreview")
    };
    const chatClient = () => window.nexoraSupabase;
    const chatEmptyHint = "Mesaj yazmaq üçün sol yuxarıdakı ＋ düyməsinə bas və istifadəçi seç.";
    const chatName = person => person?.name || person?.username || "İstifadəçi";
    const chatPerson = id => chatState.people.get(id) || { id, username: "istifadeci", name: "İstifadəçi" };
    const chatIsViewing = otherId => chatState.active?.id === otherId
        && $("#messages")?.classList.contains("active") && !document.hidden;

    function chatAvatar(person) {
        const el = document.createElement("span");
        el.className = "avatar";
        const label = initials(chatName(person));
        if (person?.avatar_url && person.avatar_url.startsWith("https://")) {
            const img = document.createElement("img");
            img.alt = "";
            img.src = person.avatar_url;
            img.onerror = () => { img.remove(); el.textContent = label; };
            el.append(img);
        } else {
            el.textContent = label;
        }
        return el;
    }
    function chatTime(iso) {
        const date = new Date(iso);
        const now = new Date();
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
        }
        if ((now - date) / 864e5 < 7) return date.toLocaleDateString("az-AZ", { weekday: "short" });
        return date.toLocaleDateString("az-AZ", { day: "2-digit", month: "2-digit" });
    }
    function chatPreviewText(message) {
        const own = message.sender_id === chatState.me ? "Sən: " : "";
        const body = message.body || (message.media_type === "video" ? "🎬 Video" : "📷 Foto");
        return own + body;
    }

    function showChatEmpty() {
        if (chatEl.title) chatEl.title.textContent = "Söhbət seçilməyib";
        if (chatEl.messages) chatEl.messages.innerHTML = `<div class="empty-state">${chatEmptyHint}</div>`;
    }
    function resetChat() {
        try { chatState.channel?.unsubscribe(); } catch {}
        clearInterval(chatState.poll);
        Object.assign(chatState, {
            me: null, people: new Map(), peopleAt: 0, convos: [], active: null,
            thread: [], channel: null, poll: null
        });
        selectedChat = null;
        clearChatMedia();
        showChatEmpty();
        chatEl.layout?.classList.remove("in-chat");
        if (chatEl.picker) chatEl.picker.hidden = true;
        if (chatEl.contacts) chatEl.contacts.replaceChildren();
        updateChatBadge();
    }

    async function chatGetMe() {
        const sb = chatClient();
        if (!sb) return null;
        const { data } = await sb.auth.getSession();
        const id = data?.session?.user?.id || null;
        if (id !== chatState.me) {
            if (chatState.me) resetChat();
            chatState.me = id;
        }
        if (id) chatStart(id);
        return id;
    }
    async function chatLoadPeople(force) {
        if (!force && chatState.people.size && Date.now() - chatState.peopleAt < 60000) return;
        const { data, error } = await chatClient()
            .from("nexora_profiles").select("id, username, name, avatar_url");
        if (error) throw error;
        chatState.people = new Map((data || []).map(person => [person.id, person]));
        chatState.peopleAt = Date.now();
    }

    // ---- Söhbətlər siyahısı (＋ düyməsinin altında) ----
    async function chatLoadConversations() {
        const me = await chatGetMe();
        if (!me) { chatState.convos = []; return; }
        await chatLoadPeople();
        const { data, error } = await chatClient().from("nexora_messages")
            .select("id, sender_id, receiver_id, body, media_type, created_at, read_at")
            .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
            .order("created_at", { ascending: false })
            .limit(500);
        if (error) throw error;
        const byUser = new Map();
        (data || []).forEach(message => {
            const otherId = message.sender_id === me ? message.receiver_id : message.sender_id;
            let convo = byUser.get(otherId);
            if (!convo) { convo = { otherId, last: message, unread: 0 }; byUser.set(otherId, convo); }
            if (message.receiver_id === me && !message.read_at) convo.unread++;
        });
        chatState.convos = [...byUser.values()];
        updateChatBadge();
    }
    function updateChatBadge() {
        const link = $('.nav-link[data-page="messages"]');
        if (!link) return;
        let badge = $("em", link);
        const total = chatState.convos.reduce((sum, convo) => sum + convo.unread, 0);
        if (!total) { badge?.remove(); return; }
        if (!badge) { badge = document.createElement("em"); link.append(badge); }
        badge.textContent = total > 99 ? "99+" : String(total);
    }
    function drawContacts() {
        const box = chatEl.contacts;
        if (!box) return;
        box.replaceChildren();
        if (!chatState.convos.length) {
            box.innerHTML = '<div class="empty-state chat-empty">Hələ söhbət yoxdur.<br>Başlamaq üçün yuxarıdakı ＋ düyməsinə bas.</div>';
            return;
        }
        chatState.convos.forEach(convo => {
            const person = chatPerson(convo.otherId);
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-person" + (chatState.active?.id === convo.otherId ? " selected" : "");
            const details = document.createElement("span");
            details.className = "chat-person-details";
            const name = document.createElement("strong");
            name.textContent = chatName(person);
            const preview = document.createElement("small");
            preview.textContent = chatPreviewText(convo.last);
            details.append(name, preview);
            const meta = document.createElement("span");
            meta.className = "chat-person-meta";
            const time = document.createElement("time");
            time.textContent = chatTime(convo.last.created_at);
            meta.append(time);
            if (convo.unread) {
                const badge = document.createElement("b");
                badge.textContent = convo.unread > 99 ? "99+" : String(convo.unread);
                meta.append(badge);
            }
            button.append(chatAvatar(person), details, meta);
            button.addEventListener("click", () => openChat(person));
            box.append(button);
        });
    }
    async function renderContacts() {
        if (!activeAccount || !chatEl.contacts) return;
        try {
            await chatLoadConversations();
            drawContacts();
        } catch (error) {
            console.error("Chat list error:", error);
            chatEl.contacts.innerHTML = '<div class="empty-state chat-empty">Söhbətlər yüklənmədi. Supabase mesaj cədvəlinin (supabase-messages-migration.sql) yaradıldığını yoxla.</div>';
        }
    }
    function chatTouchConvo(message, countUnread) {
        const me = chatState.me;
        const otherId = message.sender_id === me ? message.receiver_id : message.sender_id;
        let convo = chatState.convos.find(item => item.otherId === otherId);
        if (!convo) { convo = { otherId, last: message, unread: 0 }; chatState.convos.unshift(convo); }
        if (new Date(message.created_at) >= new Date(convo.last.created_at)) convo.last = message;
        if (countUnread && message.receiver_id === me) convo.unread++;
        chatState.convos.sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at));
        if (!chatState.people.has(otherId)) chatLoadPeople(true).then(drawContacts).catch(() => {});
        updateChatBadge();
        drawContacts();
    }

    // ---- Söhbət pəncərəsi ----
    async function chatLoadThread(otherId) {
        const me = chatState.me;
        const { data, error } = await chatClient().from("nexora_messages")
            .select("id, sender_id, receiver_id, body, media_url, media_type, created_at, read_at")
            .or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`)
            .order("created_at", { ascending: false })
            .limit(200);
        if (error) throw error;
        return (data || []).reverse();
    }
    function renderChat(forceScroll) {
        const box = chatEl.messages;
        if (!chatState.active) return showChatEmpty();
        const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
        box.replaceChildren();
        if (!chatState.thread.length) {
            box.innerHTML = '<div class="empty-state">Söhbət boşdur. İlk mesajı sən göndər.</div>';
            return;
        }
        chatState.thread.forEach(item => {
            const message = document.createElement("p");
            message.className = `message ${item.sender_id === chatState.me ? "sent" : "received"}`;
            if (item.body) message.append(document.createTextNode(item.body));
            if (item.media_url && item.media_url.startsWith("https://")) {
                const isVideo = item.media_type === "video";
                const media = document.createElement(isVideo ? "video" : "img");
                media.className = "message-media";
                media.src = item.media_url;
                if (isVideo) media.controls = true;
                else {
                    media.alt = "";
                    media.loading = "lazy";
                    media.addEventListener("click", () => window.open(item.media_url, "_blank", "noopener"));
                }
                message.append(media);
            }
            const time = document.createElement("small");
            time.textContent = new Date(item.created_at).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
            message.append(time);
            box.append(message);
        });
        if (forceScroll || nearBottom) box.scrollTop = box.scrollHeight;
    }
    function chatAddToThread(row) {
        const active = chatState.active;
        if (!active || ![row.sender_id, row.receiver_id].includes(active.id)) return;
        if (chatState.thread.some(item => item.id === row.id)) return;
        chatState.thread.push(row);
        renderChat(true);
    }
    async function chatMarkRead(otherId) {
        const me = chatState.me;
        if (!me) return;
        const convo = chatState.convos.find(item => item.otherId === otherId);
        if (convo?.unread) { convo.unread = 0; updateChatBadge(); drawContacts(); }
        try {
            await chatClient().from("nexora_messages")
                .update({ read_at: new Date().toISOString() })
                .eq("receiver_id", me).eq("sender_id", otherId).is("read_at", null);
        } catch (error) { console.error(error); }
    }
    async function openChat(person) {
        const me = await chatGetMe();
        if (!me) return showToast("Hesaba yenidən daxil ol.");
        chatState.active = person;
        selectedChat = person;
        chatState.thread = [];
        const details = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = chatName(person);
        const handle = document.createElement("small");
        handle.textContent = "@" + (person.username || "");
        details.append(name, handle);
        chatEl.title.replaceChildren(chatAvatar(person), details);
        chatEl.title.dataset.username = person.username || "";
        chatEl.layout.classList.add("in-chat");
        chatEl.messages.innerHTML = '<div class="empty-state">Yüklənir...</div>';
        drawContacts();
        try {
            const thread = await chatLoadThread(person.id);
            if (chatState.active?.id !== person.id) return;
            chatState.thread = thread;
        } catch (error) {
            console.error("Thread error:", error);
            showToast("Mesajlar yüklənmədi.");
        }
        renderChat(true);
        chatMarkRead(person.id);
        chatEl.input.focus();
    }

    // ---- ＋ : bütün istifadəçilər ----
    function drawPicker() {
        const query = chatEl.pickerSearch.value.trim().toLocaleLowerCase("az");
        const people = [...chatState.people.values()]
            .filter(person => person.id !== chatState.me)
            .filter(person => `${person.name || ""} ${person.username || ""}`.toLocaleLowerCase("az").includes(query))
            .sort((a, b) => chatName(a).localeCompare(chatName(b), "az"));
        chatEl.pickerList.replaceChildren();
        if (!people.length) {
            chatEl.pickerList.innerHTML = '<div class="empty-state chat-empty">İstifadəçi tapılmadı.</div>';
            return;
        }
        people.forEach(person => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "chat-person";
            const details = document.createElement("span");
            details.className = "chat-person-details";
            const name = document.createElement("strong");
            name.textContent = chatName(person);
            const handle = document.createElement("small");
            handle.textContent = "@" + (person.username || "");
            details.append(name, handle);
            button.append(chatAvatar(person), details);
            button.addEventListener("click", () => { closePicker(); openChat(person); });
            chatEl.pickerList.append(button);
        });
    }
    async function openPicker() {
        chatEl.picker.hidden = false;
        chatEl.pickerSearch.value = "";
        chatEl.pickerList.innerHTML = '<div class="empty-state chat-empty">Yüklənir...</div>';
        try {
            await chatGetMe();
            await chatLoadPeople(true);
            drawPicker();
        } catch (error) {
            console.error("Picker error:", error);
            chatEl.pickerList.innerHTML = '<div class="empty-state chat-empty">İstifadəçilər yüklənmədi.</div>';
        }
        chatEl.pickerSearch.focus();
    }
    function closePicker() { chatEl.picker.hidden = true; }
    $("#newChatButton").addEventListener("click", openPicker);
    $("#chatPickerClose").addEventListener("click", closePicker);
    chatEl.pickerSearch.addEventListener("input", drawPicker);
    $("#chatBack").addEventListener("click", () => chatEl.layout.classList.remove("in-chat"));
    chatEl.title.addEventListener("click", event => {
        if (chatEl.title.dataset.username && !event.target.closest(".chat-back")) nxOpenProfile(chatEl.title.dataset.username);
    });

    // ---- Göndərmə ----
    function clearChatMedia() {
        if (chatState.previewUrl) URL.revokeObjectURL(chatState.previewUrl);
        chatState.file = null;
        chatState.previewUrl = "";
        if (chatEl.preview) chatEl.preview.replaceChildren();
        const input = $("#chatMedia");
        if (input) input.value = "";
    }
    $("#chatMedia").addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
            event.target.value = "";
            return showToast("Yalnız foto və video əlavə etmək olar.");
        }
        if (file.size > 20 * 1024 * 1024) {
            event.target.value = "";
            return showToast("Fayl 20 MB-dan kiçik olmalıdır.");
        }
        clearChatMedia();
        chatState.file = file;
        chatState.previewUrl = URL.createObjectURL(file);
        const chip = document.createElement("div");
        chip.className = "chat-media-chip";
        const thumb = document.createElement(file.type.startsWith("video/") ? "video" : "img");
        thumb.src = chatState.previewUrl;
        if (file.type.startsWith("video/")) thumb.muted = true;
        const label = document.createElement("span");
        label.textContent = file.name;
        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Əlavəni sil");
        remove.addEventListener("click", clearChatMedia);
        chip.append(thumb, label, remove);
        chatEl.preview.append(chip);
    });
    async function chatSend({ text = "", file = null, mediaUrl = null, mediaType = null }) {
        const me = await chatGetMe();
        const target = chatState.active;
        if (!me || !target) throw new Error("Əvvəlcə söhbət seç.");
        const sb = chatClient();
        if (file) {
            mediaType = file.type.startsWith("video/") ? "video" : "image";
            const ext = ((file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5)) || (mediaType === "video" ? "mp4" : "jpg");
            const id = window.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            const path = `${me}/${id}.${ext}`;
            const upload = await sb.storage.from("chat-media").upload(path, file, { contentType: file.type, cacheControl: "3600" });
            if (upload.error) throw upload.error;
            mediaUrl = sb.storage.from("chat-media").getPublicUrl(path).data.publicUrl;
        }
        const { data, error } = await sb.from("nexora_messages")
            .insert({ sender_id: me, receiver_id: target.id, body: text, media_url: mediaUrl, media_type: mediaUrl ? mediaType : null })
            .select("id, sender_id, receiver_id, body, media_url, media_type, created_at, read_at")
            .single();
        if (error) throw error;
        return data;
    }
    chatEl.form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!chatState.active) return showToast("Əvvəlcə ＋ düyməsi ilə istifadəçi seç.");
        const text = chatEl.input.value.trim();
        const file = chatState.file;
        if ((!text && !file) || chatState.sending) return;
        chatState.sending = true;
        chatEl.send.disabled = true;
        try {
            const row = await chatSend({ text, file });
            chatEl.input.value = "";
            clearChatMedia();
            chatAddToThread(row);
            chatTouchConvo(row, false);   // söhbət dərhal ＋ düyməsinin altında görünür
        } catch (error) {
            console.error("Send error:", error);
            showToast(error.message || "Mesaj göndərilmədi.");
        } finally {
            chatState.sending = false;
            chatEl.send.disabled = false;
            chatEl.input.focus();
        }
    });

    // ---- Real vaxt + ehtiyat yoxlama ----
    function chatIncoming(message) {
        if (!message || message.receiver_id !== chatState.me) return;
        const viewing = chatIsViewing(message.sender_id);
        chatAddToThread(message);
        chatTouchConvo(message, !viewing);
        if (viewing) chatMarkRead(message.sender_id);
        else showToast(`Yeni mesaj: ${chatName(chatPerson(message.sender_id))}`);
    }
    function chatStart(me) {
        const sb = chatClient();
        if (!chatState.channel) {
            try {
                chatState.channel = sb.channel(`nexora-messages-${me}`)
                    .on("postgres_changes",
                        { event: "INSERT", schema: "public", table: "nexora_messages", filter: `receiver_id=eq.${me}` },
                        payload => chatIncoming(payload.new))
                    .subscribe();
            } catch (error) { console.error("Realtime:", error); }
        }
        if (!chatState.poll) chatState.poll = setInterval(chatPoll, 8000);
    }
    async function chatPoll() {
        if (!activeAccount || document.hidden || !chatState.me) return;
        try {
            await chatLoadConversations();
            drawContacts();
            const active = chatState.active;
            if (active && chatIsViewing(active.id)) {
                const fresh = await chatLoadThread(active.id);
                if (chatState.active?.id !== active.id) return;
                const changed = fresh.length !== chatState.thread.length
                    || fresh[fresh.length - 1]?.id !== chatState.thread[chatState.thread.length - 1]?.id;
                if (changed) { chatState.thread = fresh; renderChat(false); }
                if (chatState.convos.find(item => item.otherId === active.id)?.unread) chatMarkRead(active.id);
            }
        } catch (error) { console.error("Chat poll:", error); }
    }
    document.addEventListener("visibilitychange", () => { if (!document.hidden && chatState.me) chatPoll(); });

    document.addEventListener("click", event => {
        const like = event.target.closest(".like-button");
        if (like) {
            const card = like.closest(".post-card");
            const postId = card.dataset.postId;
            const post = getPosts().find(item => item.id && item.id === postId);
            const count = $(".like-count", like);
            const apply = liked => {
                like.classList.toggle("liked", liked);
                const next = Math.max(0, Number(count.textContent) + (liked ? 1 : -1));
                count.textContent = String(next);
                card.dataset.likes = String(next);
                if (post) {
                    post.likedBy ||= [];
                    post.likedBy = liked
                        ? [...new Set([...post.likedBy, activeAccount.username])]
                        : post.likedBy.filter(username => username !== activeAccount.username);
                    post.likes = next;
                }
            };
            const liked = !like.classList.contains("liked");
            apply(liked);
            (async () => {
                const sb = window.nexoraSupabase;
                const { data: { user } } = await sb.auth.getUser();
                if (!user) throw new Error("Hesaba daxil ol.");
                const result = liked
                    ? await sb.from("nexora_post_likes").insert({ post_id: postId, user_id: user.id })
                    : await sb.from("nexora_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
                if (result.error && result.error.code !== "23505") throw result.error;
                if (liked && post?.userId) { const { data: owner } = await sb.from("nexora_profiles").select("username").eq("id", post.userId).maybeSingle(); if (owner?.username) addSocialNotification(owner.username, "Yeni bəyənmə", `@${activeAccount.username} paylaşımını bəyəndi.`, `post-like:${postId}:${user.id}`); }
            })().catch(error => {
                console.error("Like error:", error);
                apply(!liked);
                showToast("Bəyənmək mümkün olmadı.");
            });
            return;
        }
        const toggle = event.target.closest(".comment-toggle");
        if (toggle) {
            const comments = $(".comments", toggle.closest(".post-card"));
            comments.classList.toggle("open");
            if (comments.classList.contains("open")) $("input", comments).focus();
            return;
        }
        const replyButton = event.target.closest(".comment-reply-button");
        if (replyButton) {
            const comment = replyButton.closest(".comment-item"); const form = replyButton.closest(".comments").querySelector(".comment-form");
            form.dataset.parentCommentId = comment.dataset.commentId || "";
            const input = form.querySelector("input"); input.placeholder = "Şərhə cavab yaz..."; input.focus(); return;
        }
        const commentLike = event.target.closest(".comment-like-button");
        if (commentLike) {
            const commentId = commentLike.closest(".comment-item")?.dataset.commentId; if (!commentId) return;
            const liked = commentLike.classList.toggle("liked"); commentLike.textContent = liked ? "♥" : "♡";
            (async()=>{ const sb=window.nexoraSupabase; const {data:{user}}=await sb.auth.getUser(); if(liked){const {error}=await sb.from("nexora_comment_likes").insert({comment_id:commentId,user_id:user.id});if(error&&error.code!=="23505")throw error; const {data:comment}=await sb.from("nexora_post_comments").select("user_id").eq("id",commentId).maybeSingle(); if(comment?.user_id && comment.user_id!==user.id) await sb.from("nexora_notifications").insert({recipient_id:comment.user_id,actor_id:user.id,kind:"like",entity_id:commentId,message:`@${activeAccount.username} şərhini bəyəndi.`});}else{const {error}=await sb.from("nexora_comment_likes").delete().eq("comment_id",commentId).eq("user_id",user.id);if(error)throw error;} })().catch(error=>{console.error(error);commentLike.classList.toggle("liked",!liked);commentLike.textContent=liked?"♡":"♥";}); return;
        }
        const share = event.target.closest(".share-button");
        if (share) {
            const card = share.closest(".post-card");
            const text = $(".post-copy", card)?.textContent || "Foto/video";
            const media = $(".post-media", card)?.src || "";
            if (!chatState.active) { showPage("messages"); showToast("Paylaşmaq üçün əvvəl ＋ düyməsi ilə istifadəçi seç."); return; }
            const mediaEl = $(".post-media", card);
            const httpsMedia = media.startsWith("https://") ? media : null;
            chatSend({ text: `Paylaşım: ${text}`, mediaUrl: httpsMedia, mediaType: mediaEl?.tagName === "VIDEO" ? "video" : "image" })
                .then(row => {
                    chatAddToThread(row);
                    chatTouchConvo(row, false);
                    showPage("messages");
                    showToast("Paylaşım söhbətə göndərildi.");
                })
                .catch(error => { console.error(error); showToast(error.message || "Paylaşım göndərilmədi."); });
        }
    });
    document.addEventListener("submit", event => {
        if (!event.target.matches(".comment-form")) return;
        event.preventDefault();
        const input = $("input", event.target);
        const value = input.value.trim();
        if (!value) return;
        const parentCommentId = event.target.dataset.parentCommentId || null;
        const card = event.target.closest(".post-card");
        const postId = card?.dataset.postId;
        const post = getPosts().find(entry => entry.id && entry.id === postId);
        const item = document.createElement("p");
        item.className = `comment-item${parentCommentId ? " comment-reply" : ""}`;
        const name = document.createElement("strong");
        name.textContent = `${activeAccount.name}: `;
        const line = document.createElement("p"); line.append(name, document.createTextNode(value)); item.append(line);
        $(".comments-list", event.target.parentElement).append(item);
        input.value = ""; event.target.dataset.parentCommentId = ""; input.placeholder = "Şərh əlavə et...";
        (async () => {
            const sb = window.nexoraSupabase;
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error("Hesaba daxil ol.");
            const { error } = await sb.from("nexora_post_comments").insert({ post_id: postId, user_id: user.id, body: value, parent_comment_id: parentCommentId });
            if (error) throw error;
            if (post?.userId) { const { data: owner } = await sb.from("nexora_profiles").select("username").eq("id", post.userId).maybeSingle(); if (owner?.username) addSocialNotification(owner.username, parentCommentId ? "Şərhə cavab" : "Yeni şərh", parentCommentId ? `@${activeAccount.username} paylaşımda cavab yazdı: ${value}` : `@${activeAccount.username} paylaşımına şərh yazdı: ${value}`, `post-comment:${postId}:${user.id}:${Date.now()}`); }
            if (parentCommentId) { const {data:parent} = await sb.from("nexora_post_comments").select("user_id").eq("id",parentCommentId).maybeSingle(); if(parent?.user_id && parent.user_id !== user.id) { const {data:parentProfile} = await sb.from("nexora_profiles").select("username").eq("id",parent.user_id).maybeSingle(); if(parentProfile?.username) addSocialNotification(parentProfile.username,"Şərhinə cavab",`@${activeAccount.username} şərhinə cavab yazdı: ${value}`,`comment-reply:${parentCommentId}:${user.id}:${Date.now()}`); } }
            if (post) {
                post.comments ||= [];
                post.comments.push({ username: activeAccount.username, name: activeAccount.name, text: value, parentId: parentCommentId, created: Date.now() });
            }
        })().catch(error => {
            console.error("Comment error:", error);
            item.remove();
            showToast("Şərh göndərilmədi.");
        });
    });

    const settingsPanel = $("#settingsPanel");
    const profileEditForm = $("#profileEditForm");
    const profileEditPreview = $("#profileEditPreview");
    const SUPPORT_EMAIL = "support@nexora.az";
    const LANGUAGES = { az: "Azərbaycan dili", en: "English", ru: "Русский", tr: "Türkçe" };
    const getLanguage = () => localStorage.getItem("nexoraLanguage") || "az";
    function applyLanguage(code) {
        $("#languageSummary").textContent = LANGUAGES[code] || LANGUAGES.az;
        window.nexoraI18n?.setLanguage(code);
    }
    applyLanguage(getLanguage());

    const viewSetup = {
        info() {
            setAvatar($("#infoAvatar"), activeAccount);
            $("#infoName").textContent = activeAccount.name || "-";
            $("#infoUsername").textContent = `@${activeAccount.username}`;
            $("#infoBio").textContent = activeAccount.bio || "İdman həvəskarı";
            $("#infoPosts").textContent = $("#postCount").textContent;
            $("#infoFollowers").textContent = $("#followerCount").textContent;
            $("#infoFollowing").textContent = $("#followingCount").textContent;
        },
        edit() {
            $("#editUsername").value = activeAccount.username;
            $("#editBio").value = activeAccount.bio || "";
            profileImageData = activeAccount.avatar || "";
            setAvatar(profileEditPreview, activeAccount);
            $("#editAvatar").value = "";
        },
        password() {
            $("#passwordForm").reset();
            $("#passwordMessage").textContent = "";
        },
        language() {
            const current = $(`#languageForm input[value="${getLanguage()}"]`);
            if (current) current.checked = true;
        },
        contact() {
            $("#contactForm").reset();
        },
        privacy() {
            const toggle = $("#privateAccountToggle");
            if (toggle) toggle.checked = Boolean(activeAccount?.isPrivate || readStored(`nexoraPrivacy:${activeAccount?.username}`, false));
            refreshFollowRequests();
        }
    };
    function openSettingsView(name) {
        $$(".settings-view", settingsPanel).forEach(view => { view.hidden = view.dataset.view !== name; });
        const view = $(`.settings-view[data-view="${name}"]`, settingsPanel);
        $("#settingsTitle").textContent = view.dataset.title || "Ayarlar";
        $("#settingsBack").hidden = name === "menu";
        settingsPanel.classList.toggle("is-detail", name !== "menu");
        viewSetup[name]?.();
        settingsPanel.scrollTop = 0;
        $(".settings-shell", settingsPanel).scrollTop = 0;
    }
    $("#openSettings").addEventListener("click", () => {
        if (!activeAccount) return;
        openSettingsView("menu");
        settingsPanel.showModal();
    });
    $("#settingsClose").addEventListener("click", () => settingsPanel.close());
    async function refreshFollowRequests() {
        const list = $("#followRequestList"); if (!list) return;
        try {
            const sb = window.nexoraSupabase; const {data:{user}} = await sb.auth.getUser(); if (!user) return;
            const {data:requests,error} = await sb.from("nexora_follow_requests").select("id, requester_id, created_at").eq("target_id",user.id).order("created_at",{ascending:false});
            if (error) throw error;
            list.replaceChildren();
            if (!requests?.length) { list.innerHTML = '<p class="empty-state">İzləmə istəyi yoxdur.</p>'; return; }
            const {data:profiles} = await sb.from("nexora_profiles").select("id,username,name").in("id",requests.map(r=>r.requester_id));
            const map = new Map((profiles||[]).map(p=>[p.id,p]));
            requests.forEach(request => { const profile=map.get(request.requester_id)||{}; const row=document.createElement("div"); row.className="follow-user"; const label=document.createElement("strong"); label.textContent=profile.name||profile.username||"İstifadəçi"; const accept=document.createElement("button"); accept.className="primary-button"; accept.textContent="Qəbul et"; const reject=document.createElement("button"); reject.className="outline-button"; reject.textContent="Sil"; accept.onclick=async()=>{ const {error}=await sb.rpc("nexora_accept_follow_request",{p_request_id:request.id}); if(error){console.error(error);showToast("İstək qəbul edilmədi.");return;} await sb.from("nexora_notifications").insert({recipient_id:request.requester_id,actor_id:user.id,kind:"follow",message:`@${activeAccount.username} izləmə istəyini qəbul etdi.`}); refreshFollowRequests(); showToast("İzləmə istəyi qəbul edildi."); }; reject.onclick=async()=>{await sb.from("nexora_follow_requests").delete().eq("id",request.id);refreshFollowRequests();}; row.append(label,accept,reject);list.append(row); });
        } catch(error) { console.warn("Follow requests:",error); }
    }
    const privateToggle = $("#privateAccountToggle");
    if (privateToggle) {
        privateToggle.checked = Boolean(activeAccount?.isPrivate || readStored(`nexoraPrivacy:${activeAccount?.username}`, false));
        privateToggle.addEventListener("change", async () => {
            if (!activeAccount) return;
            const enabled = privateToggle.checked;
            localStorage.setItem(`nexoraPrivacy:${activeAccount.username}`, JSON.stringify(enabled));
            const accounts = getAccounts().map(account => account.username === activeAccount.username ? {...account, isPrivate: enabled} : account);
            localStorage.setItem("nexoraAccounts", JSON.stringify(accounts));
            activeAccount = {...activeAccount, isPrivate: enabled};
            localStorage.setItem("nexoraActiveAccount", JSON.stringify(activeAccount));
            try {
                const sb = window.nexoraSupabase; const { data: { user } } = await sb.auth.getUser();
                if (user) { const { error } = await sb.from("nexora_profiles").update({is_private: enabled}).eq("id", user.id); if (error) throw error; }
                $("#privacyMessage").textContent = enabled ? "Gizli hesab aktivdir." : "Hesab artıq açıqdır.";
            } catch (error) { console.error(error); showToast("Gizlilik ayarı serverdə yadda saxlanmadı. SQL yenilənməsini tətbiq et."); }
        });
    }
    $("#settingsBack").addEventListener("click", () => openSettingsView("menu"));
    $$("[data-open-view]", settingsPanel).forEach(button => button.addEventListener("click", () => openSettingsView(button.dataset.openView)));
    $$("[data-back]", settingsPanel).forEach(button => button.addEventListener("click", () => openSettingsView("menu")));

    $("#passwordForm").addEventListener("submit", event => {
        event.preventDefault();
        if (!activeAccount) return;
        const message = $("#passwordMessage");
        const current = $("#currentPassword").value;
        const next = $("#newPassword").value;
        const confirm = $("#confirmPassword").value;
        const accounts = getAccounts();
        const stored = accounts.find(account => account.username === activeAccount.username);
        if (!stored || stored.password !== current) { message.textContent = "Hazırkı şifrə yanlışdır."; return; }
        if (next.length < 4) { message.textContent = "Yeni şifrə ən azı 4 simvol olmalıdır."; return; }
        if (next !== confirm) { message.textContent = "Yeni şifrələr eyni deyil."; return; }
        if (next === current) { message.textContent = "Yeni şifrə köhnə şifrədən fərqli olmalıdır."; return; }
        const updated = { ...activeAccount, password: next };
        localStorage.setItem("nexoraAccounts", JSON.stringify(accounts.map(account => account.username === activeAccount.username ? { ...account, password: next } : account)));
        applyAccount(updated);
        showToast("Şifrən uğurla dəyişdirildi.");
        openSettingsView("menu");
    });

    $("#languageForm").addEventListener("submit", event => {
        event.preventDefault();
        const selected = $("#languageForm input[name=language]:checked")?.value || "az";
        localStorage.setItem("nexoraLanguage", selected);
        applyLanguage(selected);
        showToast(`Dil seçildi: ${LANGUAGES[selected]}`);
        openSettingsView("menu");
    });

    $("#contactForm").addEventListener("submit", event => {
        event.preventDefault();
        const subject = $("#contactSubject").value.trim();
        const body = `${$("#contactMessage").value.trim()}\n\n— @${activeAccount?.username || ""}`;
        window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showToast("E-poçt tətbiqi açılır...");
    });
    $("#editAvatar").addEventListener("change", event => {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { showToast("Profil şəkli üçün foto faylı seç."); event.target.value = ""; return; }
        if (file.size > 1024 * 1024) { showToast("Profil şəkli 1 MB-dan kiçik olmalıdır."); event.target.value = ""; return; }
        const reader = new FileReader();
        reader.onload = () => {
            profileImageData = String(reader.result);
            setAvatar(profileEditPreview, { name: activeAccount.name, avatar: profileImageData });
        };
        reader.onerror = () => showToast("Şəkli oxumaq mümkün olmadı.");
        reader.readAsDataURL(file);
    });
    function migrateUsername(oldUsername, newUsername) {
        if (oldUsername === newUsername) return;
        const accounts = getAccounts();
        const ownFollowing = readStored(followingKey(oldUsername), []);
        localStorage.setItem(followingKey(newUsername), JSON.stringify(ownFollowing));
        localStorage.removeItem(followingKey(oldUsername));
        accounts.forEach(account => {
            if (account.username === oldUsername) return;
            const key = followingKey(account.username);
            const following = readStored(key, []);
            if (following.includes(oldUsername)) {
                localStorage.setItem(key, JSON.stringify(following.map(name => name === oldUsername ? newUsername : name)));
            }
        });
        ["nexoraBets", "nexoraNotifications"].forEach(prefix => {
            const oldKey = `${prefix}:${oldUsername}`;
            const newKey = `${prefix}:${newUsername}`;
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue !== null) {
                localStorage.setItem(newKey, oldValue);
                localStorage.removeItem(oldKey);
            }
        });
        const chatKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index))
            .filter(key => key?.startsWith("nexoraChat:"));
        chatKeys.forEach(key => {
            const participants = key.slice("nexoraChat:".length).split("::");
            if (!participants.includes(oldUsername)) return;
            const nextKey = `nexoraChat:${participants.map(name => name === oldUsername ? newUsername : name).sort().join("::")}`;
            if (nextKey === key) return;
            const existing = readStored(nextKey, []);
            const migrated = readStored(key, []);
            localStorage.setItem(nextKey, JSON.stringify([...existing, ...migrated].sort((a, b) => a.created - b.created)));
            localStorage.removeItem(key);
        });
    }
    profileEditForm.addEventListener("submit", event => {
        event.preventDefault();
        if (!activeAccount) return;
        const oldUsername = activeAccount.username;
        const username = $("#editUsername").value.trim().replace(/^@/, "").toLocaleLowerCase("az");
        const bio = $("#editBio").value.trim();
        const accounts = getAccounts();
        if (!/^[a-z0-9_.]{3,24}$/.test(username)) return showToast("İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.");
        if (accounts.some(account => account.username === username && account.username !== oldUsername)) return showToast("Bu istifadəçi adı artıq istifadə olunur.");
        const updated = { ...activeAccount, username, bio, avatar: profileImageData };
        try {
            if (username !== oldUsername) migrateUsername(oldUsername, username);
            localStorage.setItem("nexoraAccounts", JSON.stringify(accounts.map(account => account.username === oldUsername ? updated : account)));
            applyAccount(updated);
        } catch {
            return showToast("Dəyişiklikləri yadda saxlamaq mümkün olmadı.");
        }
        profileEditForm.reset();
        openSettingsView("menu");
        showToast("Profil məlumatların yeniləndi.");
    });
// STORY VIEWER
let storyViewer = null;
let storyObjectUrl = null;
let storyTimer = null;
let storyRemaining = 10000;
let storyStartedAt = 0;
let storyPaused = false;
let storyHeld = false;
let storyQueue = [];
let storyGroups = [];
let storyIndex = -1;
let storyOnEnd = null;
let storyNavigating = false;

function closeStoryViewer() {
    clearTimeout(storyTimer);

    if (storyViewer) {
        const video = storyViewer.querySelector("video");
        video?.pause();
        storyViewer.remove();
        storyViewer = null;
    }

    if (storyObjectUrl) {
        URL.revokeObjectURL(storyObjectUrl);
        storyObjectUrl = null;
    }

    storyPaused = false;
    storyHeld = false;
    storyOnEnd = null;
}

function openStoryViewer(file) {
    closeStoryViewer();

    storyObjectUrl = URL.createObjectURL(file);
    storyRemaining = 10000;

    const isVideo = file.type.startsWith("video/");

    storyViewer = document.createElement("div");
    storyViewer.className = "nexora-story-viewer";

    storyViewer.innerHTML = `
        <div class="nexora-story-progress">
            <div class="nexora-story-progress-fill"></div>
        </div>
        <button class="nexora-story-close" type="button">×</button>
        <div class="nexora-story-content"></div>
    `;

    document.body.appendChild(storyViewer);

    const content = storyViewer.querySelector(".nexora-story-content");

    if (isVideo) {
        const video = document.createElement("video");
        video.src = storyObjectUrl;
        video.autoplay = true;
        video.playsInline = true;
        video.controls = false;
        content.appendChild(video);

        video.addEventListener("ended", closeStoryViewer);
        video.addEventListener("error", () => {
            showToast("Video açıla bilmədi.");
            closeStoryViewer();
        });
    } else {
        const img = document.createElement("img");
        img.src = storyObjectUrl;
        img.alt = "Hekayə";
        content.appendChild(img);

        startStoryTimer();
    }

    storyViewer.querySelector(".nexora-story-close")
        .addEventListener("click", closeStoryViewer);

    const progress = storyViewer.querySelector(
        ".nexora-story-progress-fill"
    );

    if (!isVideo) {
        progress.style.transition = "width 10s linear";
        requestAnimationFrame(() => {
            progress.style.width = "100%";
        });
    }

    storyViewer.addEventListener("pointerdown", event => {
        if (event.target.closest("button")) return;

        storyHeld = false;
        storyPaused = true;

        clearTimeout(storyTimer);

        if (!isVideo) {
            storyRemaining -= Date.now() - storyStartedAt;
        }

        const video = storyViewer.querySelector("video");
        video?.pause();
    });

    storyViewer.addEventListener("pointerup", event => {
        if (event.target.closest("button")) return;

        if (!storyPaused) return;

        storyPaused = false;

        const video = storyViewer.querySelector("video");

        if (video) {
            video.play();
        } else {
            startStoryTimer();
        }
    });

    storyViewer.addEventListener("pointercancel", () => {
        if (!storyPaused) return;

        storyPaused = false;
        const video = storyViewer.querySelector("video");

        if (video) {
            video.play();
        } else {
            startStoryTimer();
        }
    });
}

function startStoryTimer() {
    clearTimeout(storyTimer);

    storyStartedAt = Date.now();

    storyTimer = setTimeout(() => {
        (storyOnEnd || closeStoryViewer)();
    }, Math.max(0, storyRemaining));
}

    // RENDER STORIES
async function renderStories() {
    const supabaseClient = window.nexoraSupabase;
    if (!supabaseClient) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;

    const { data: stories, error } = await supabaseClient
        .from("nexora_stories")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Stories error:", error);
        return;
    }
    // Hekayəni yalnız sahibi və onu izləyənlər görür
    const { data: followedRows, error: followError } = await supabaseClient
        .from("nexora_follows").select("following_id").eq("follower_id", user.id);
    if (followError) { console.error("Story follow filter:", followError); return; }
    const visibleIds = new Set([user.id, ...(followedRows || []).map(row => row.following_id)]);
    const visibleStories = (stories || []).filter(story => visibleIds.has(story.user_id));

    // Hər istifadəçinin hekayələri bir yerdə (Instagram kimi): bir dairə, içində bir neçə hekayə
    const byUser = new Map();
    [...visibleStories].reverse().forEach(story => {   // köhnədən yeniyə
        if (!byUser.has(story.user_id)) byUser.set(story.user_id, []);
        byUser.get(story.user_id).push(story);
    });
    const groups = [...byUser.entries()]
        .map(([userId, list]) => ({ userId, list, latest: new Date(list[list.length - 1].created_at).getTime() }))
        .sort((a, b) => (a.userId === user.id ? -1 : b.userId === user.id ? 1 : b.latest - a.latest));

    const profileMap = new Map();
    if (groups.length) {
        const { data: profileRows } = await supabaseClient.from("nexora_profiles")
            .select("id, username, name, avatar_url").in("id", groups.map(group => group.userId));
        (profileRows || []).forEach(profile => profileMap.set(profile.id, profile));
    }

    const nextQueue = [];
    const nextGroups = groups.map(group => {
        const profile = profileMap.get(group.userId) || {};
        const info = {
            userId: group.userId,
            start: nextQueue.length,
            count: group.list.length,
            name: profile.name || profile.username || "İstifadəçi",
            username: profile.username || "",
            avatar: profile.avatar_url && profile.avatar_url.startsWith("https://") ? profile.avatar_url : ""
        };
        nextQueue.push(...group.list);
        return info;
    });
    storyQueue = nextQueue;
    storyGroups = nextGroups;

    const strip = document.querySelector(".story-strip");
    if (!strip) return;

    strip.querySelectorAll(".published-story").forEach(item => item.remove());

    nextGroups.forEach(group => {
        const button = document.createElement("button");
        button.className = "story published-story";
        button.type = "button";

        const ring = document.createElement("span");
        ring.className = "story-ring";
        if (group.avatar) {
            const avatarImg = document.createElement("img");
            avatarImg.src = group.avatar;
            avatarImg.alt = group.name;
            avatarImg.style.cssText = "width:100%;height:100%;border-radius:50%;object-fit:cover";
            ring.append(avatarImg);
        } else {
            const initialsBadge = document.createElement("b");
            initialsBadge.textContent = initials(group.name);
            ring.append(initialsBadge);
        }
        const label = document.createElement("small");
        label.textContent = group.userId === user.id ? "Sənin hekayən" : (group.username || group.name);
        label.style.cssText = "max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
        button.append(ring, label);

        strip.appendChild(button);
        button.addEventListener("click", () => openStoryAt(group.start));
    });
}

// Növbədə verilən sıradakı hekayəni aç
async function openStoryAt(index) {
    const sb = window.nexoraSupabase;
    const story = storyQueue[index];
    if (!sb || !story) { closeStoryViewer(); return; }
    if (storyNavigating) return;
    storyNavigating = true;
    try {
        const { data, error } = await sb.storage.from("stories").createSignedUrl(story.media_path, 300);
        if (error || !data?.signedUrl) {
            showToast("Hekayə açıla bilmədi.");
            closeStoryViewer();
            return;
        }
        storyIndex = index;
        openPublishedStoryViewer(story, data.signedUrl);
    } finally {
        storyNavigating = false;
    }
}

// delta = +1 sonrakı, -1 əvvəlki; yoxdursa ana səhifəyə qayıt
function storyGo(delta) {
    const next = storyIndex + delta;
    if (next < 0 || next >= storyQueue.length) {
        closeStoryViewer();
        showPage("feed");
        history.replaceState(null, "", "#feed");
        return;
    }
    openStoryAt(next);
}

    // OPEN PUBLISHED STORY
function openPublishedStoryViewer(story, mediaUrl) {
    closeStoryViewer();

    const isVideo = story.media_type === "video";

    storyViewer = document.createElement("div");
    storyViewer.className = "nexora-story-viewer";

    storyViewer.innerHTML = `
        <div class="nexora-story-progress">
            <div class="nexora-story-progress-fill"></div>
        </div>
        <button class="nexora-story-close" type="button">×</button>
        <div class="nexora-story-content"></div>
    `;

    document.body.appendChild(storyViewer);

    const content = storyViewer.querySelector(".nexora-story-content");
    // Instagram kimi: hər hekayə üçün ayrıca vaxt xətti + müəllifin adı
    const group = storyGroups.find(item => storyIndex >= item.start && storyIndex < item.start + item.count);
    const segmentCount = group ? group.count : 1;
    const currentSegment = group ? storyIndex - group.start : 0;
    const progressBar = storyViewer.querySelector(".nexora-story-progress");
    progressBar.style.cssText += ";display:flex;gap:4px;background:transparent;overflow:visible";
    progressBar.replaceChildren();
    const segmentFills = [];
    for (let i = 0; i < segmentCount; i++) {
        const segment = document.createElement("div");
        segment.style.cssText = "flex:1;height:3px;background:rgba(255,255,255,.35);border-radius:10px;overflow:hidden";
        const fill = document.createElement("div");
        fill.className = "nexora-story-progress-fill";
        fill.style.width = i < currentSegment ? "100%" : "0";
        segment.append(fill);
        progressBar.append(segment);
        segmentFills.push(fill);
    }
    const progress = segmentFills[currentSegment];
    if (group) {
        const who = document.createElement("div");
        who.className = "nexora-story-author";
        who.style.cssText = "position:absolute;top:max(26px,calc(env(safe-area-inset-top) + 14px));left:14px;z-index:3;display:flex;align-items:center;gap:8px;color:#fff;font:600 13px/1 inherit;pointer-events:none;text-shadow:0 1px 3px #0009";
        const whoAvatar = document.createElement("span");
        whoAvatar.style.cssText = "width:30px;height:30px;border-radius:50%;background:#8b5cf6;display:grid;place-items:center;overflow:hidden;font-size:11px;font-weight:800";
        if (group.avatar) {
            const whoImg = document.createElement("img");
            whoImg.src = group.avatar;
            whoImg.alt = "";
            whoImg.style.cssText = "width:100%;height:100%;object-fit:cover";
            whoAvatar.append(whoImg);
        } else whoAvatar.textContent = initials(group.name);
        const whoName = document.createElement("span");
        whoName.textContent = group.username ? `@${group.username}` : group.name;
        who.append(whoAvatar, whoName);
        storyViewer.append(who);
    }

    const storyActions = document.createElement("div");
    storyActions.className = "story-interactions";
    storyActions.innerHTML = '<button type="button" class="story-like">♡ <span>0</span></button><form class="story-comment-form"><input maxlength="240" placeholder="Hekayəyə şərh yaz..."><button type="submit">Göndər</button></form><button type="button" class="story-share">↗ Paylaş</button><div class="story-comments"></div>';
    storyViewer.append(storyActions);
    const storyLike = storyActions.querySelector(".story-like");
    const storyLikeCount = storyLike.querySelector("span");
    const storyComments = storyActions.querySelector(".story-comments");
    const sbStory = window.nexoraSupabase;
    async function refreshStoryInteractions() {
        if (!sbStory || !story.id) return;
        const [{ count, error: likeError }, { data: ownLike, error: ownError }, { data: comments, error: commentsError }] = await Promise.all([
            sbStory.from("nexora_story_likes").select("id", { count: "exact", head: true }).eq("story_id", story.id),
            sbStory.from("nexora_story_likes").select("id").eq("story_id", story.id).eq("user_id", (await sbStory.auth.getUser()).data.user?.id || "").maybeSingle(),
            sbStory.from("nexora_story_comments").select("id, body, user_id, created_at").eq("story_id", story.id).order("created_at", { ascending: true })
        ]);
        if (likeError || ownError || commentsError) { console.error(likeError || ownError || commentsError); return; }
        storyLikeCount.textContent = String(count || 0);
        storyLike.classList.toggle("liked", Boolean(ownLike));
        if (storyLike.firstChild?.nodeType === Node.TEXT_NODE) storyLike.firstChild.nodeValue = ownLike ? "♥ " : "♡ ";
        storyComments.replaceChildren();
        (comments || []).forEach(comment => {
            const line = document.createElement("p");
            line.textContent = comment.body;
            storyComments.append(line);
        });
    }
    storyLike.addEventListener("click", async () => {
        try {
            const { data: { user } } = await sbStory.auth.getUser();
            if (!user) throw new Error("Giriş etməlisən.");
            const { data: existing, error } = await sbStory.from("nexora_story_likes").select("id").eq("story_id", story.id).eq("user_id", user.id).maybeSingle();
            if (error) throw error;
            if (existing) {
                const result = await sbStory.from("nexora_story_likes").delete().eq("id", existing.id);
                if (result.error) throw result.error;
            } else {
                const result = await sbStory.from("nexora_story_likes").insert({ story_id: story.id, user_id: user.id });
                if (result.error) throw result.error;
            }
            if (!existing) { const {data:owner} = await sbStory.from("nexora_profiles").select("id").eq("id",story.user_id).maybeSingle(); if (owner?.id && owner.id !== user.id) await sbStory.from("nexora_notifications").insert({recipient_id:owner.id,actor_id:user.id,kind:"story_like",entity_id:story.id,message:`@${activeAccount.username} hekayəni bəyəndi.`}); }
            await refreshStoryInteractions();
        } catch (error) { console.error(error); showToast("Hekayəni bəyənmək mümkün olmadı."); }
    });
    storyActions.querySelector(".story-comment-form").addEventListener("submit", async event => {
        event.preventDefault();
        const input = event.currentTarget.querySelector("input");
        const body = input.value.trim();
        if (!body) return;
        try {
            const { data: { user } } = await sbStory.auth.getUser();
            if (!user) throw new Error("Giriş etməlisən.");
            const { error } = await sbStory.from("nexora_story_comments").insert({ story_id: story.id, user_id: user.id, body });
            if (error) throw error;
            if (story.user_id !== user.id) await sbStory.from("nexora_notifications").insert({recipient_id:story.user_id,actor_id:user.id,kind:"story_comment",entity_id:story.id,message:`@${activeAccount.username} hekayənə şərh yazdı: ${body}`});
            input.value = "";
            await refreshStoryInteractions();
        } catch (error) { console.error(error); showToast("Şərh göndərilmədi. Cədvəlləri yoxla."); }
    });
    storyActions.querySelector(".story-share").addEventListener("click", async () => {
        try {
            if (navigator.share) await navigator.share({ title: "NEXORA hekayəsi", url: mediaUrl });
            else if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(mediaUrl); showToast("Hekayə linki kopyalandı."); }
            else showToast("Bu brauzerdə paylaşma dəstəklənmir.");
        } catch (error) { if (error.name !== "AbortError") showToast("Hekayəni paylaşmaq mümkün olmadı."); }
    });
    refreshStoryInteractions();

    const video = isVideo ? document.createElement("video") : null;
    const mediaEl = video || document.createElement("img");
    mediaEl.style.pointerEvents = "none";
    mediaEl.draggable = false;
    content.appendChild(mediaEl);
    storyViewer.style.userSelect = "none";
    storyViewer.style.webkitUserSelect = "none";
    storyViewer.style.webkitTouchCallout = "none";
    storyViewer.addEventListener("contextmenu", event => event.preventDefault());

    storyOnEnd = () => storyGo(1);
    storyRemaining = 10000;
    storyPaused = false;

    const startProgress = ms => {
        progress.style.transition = "none";
        progress.style.width = "0%";
        progress.getBoundingClientRect();
        progress.style.transition = `width ${ms / 1000}s linear`;
        progress.style.width = "100%";
    };
    const freezeProgress = () => {
        const track = progress.parentElement.getBoundingClientRect().width || 1;
        const current = progress.getBoundingClientRect().width;
        progress.style.transition = "none";
        progress.style.width = `${(current / track) * 100}%`;
    };
    const resumeProgress = ms => {
        progress.getBoundingClientRect();
        progress.style.transition = `width ${Math.max(ms, 0) / 1000}s linear`;
        progress.style.width = "100%";
    };

    if (video) {
        video.src = mediaUrl;
        video.autoplay = true;
        video.playsInline = true;
        video.addEventListener("ended", () => storyGo(1));
        video.addEventListener("error", () => {
            showToast("Video açıla bilmədi.");
            storyGo(1);
        });
        video.addEventListener("loadedmetadata", () => {
            storyRemaining = video.duration * 1000;
            startProgress(storyRemaining);
        });
    } else {
        mediaEl.src = mediaUrl;
        mediaEl.alt = "Hekayə";
        startProgress(10000);
        startStoryTimer();
    }

    // Basıb saxla = dayan, burax = davam; qısa toxunuş: sağ = sonrakı, sol = əvvəlki
    let pressedAt = 0;
    let pressing = false;
    const viewerEl = storyViewer;
    viewerEl.addEventListener("pointerdown", event => {
        if (event.target.closest("button, input, textarea, form, .story-interactions")) return;
        pressing = true;
        pressedAt = Date.now();
        if (storyPaused) return;
        storyPaused = true;
        if (video) video.pause();
        else {
            clearTimeout(storyTimer);
            storyRemaining -= Date.now() - storyStartedAt;
        }
        freezeProgress();
    });
    const releasePress = event => {
        if (!pressing) return;
        pressing = false;
        const isTap = event.type === "pointerup" && Date.now() - pressedAt < 250;
        if (isTap) {
            const rect = viewerEl.getBoundingClientRect();
            storyGo(event.clientX < rect.left + rect.width / 2 ? -1 : 1);
            return;
        }
        if (!storyPaused) return;
        storyPaused = false;
        if (video) {
            video.play();
            resumeProgress((video.duration - video.currentTime) * 1000);
        } else {
            resumeProgress(storyRemaining);
            startStoryTimer();
        }
    };
    viewerEl.addEventListener("pointerup", releasePress);
    viewerEl.addEventListener("pointercancel", releasePress);

    storyViewer.querySelector(".nexora-story-close")
        .addEventListener("click", closeStoryViewer);
}

// STORY COMPOSER
function openStoryComposer(file) {
    showToast("hekayə hazırlama açıldı!");
    const previewUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");

    const composer = document.createElement("div");
    composer.className = "story-composer";

    composer.innerHTML = `
        <div class="story-composer-top">
            <button class="story-cancel" type="button">×</button>
            <span>Hekayə hazırla</span>
        </div>

        <div class="story-composer-preview"></div>

        <div class="story-composer-bottom">
            <button class="story-cancel-text" type="button">Ləğv et</button>
            <button class="story-share" type="button">Paylaş</button>
        </div>
    `;

    document.body.appendChild(composer);

    const preview = composer.querySelector(".story-composer-preview");

    if (isVideo) {
        const video = document.createElement("video");
        video.src = previewUrl;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        preview.appendChild(video);
    } else {
        const img = document.createElement("img");
        img.src = previewUrl;
        img.alt = "Hekayə önizləməsi";
        preview.appendChild(img);
    }

    function closeComposer() {
        URL.revokeObjectURL(previewUrl);
        composer.remove();
    }

    composer.querySelectorAll(".story-cancel, .story-cancel-text")
        .forEach(button => {
            button.addEventListener("click", closeComposer);
        });

    composer.querySelector(".story-share")
        .addEventListener("click", async () => {
            const button = composer.querySelector(".story-share");

            button.disabled = true;
            button.textContent = "Paylaşılır...";

            try {
                await uploadAndPublishStory(file);
                closeComposer();
            } catch (error) {
                console.error(error);
                showToast("Hekayə paylaşılmadı. Yenidən yoxla.");
                button.disabled = false;
                button.textContent = "Paylaş";
            }
        });
}
    
// STORY FILE SELECT
const storyButton = $("#storyButton");
const storyFileInput = $("#storyFileInput");

storyButton?.addEventListener("click", () => {
    storyFileInput?.click();
});

storyFileInput?.addEventListener("change", () => {
    const file = storyFileInput.files?.[0];

    if (!file) return;

    if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
    ) {
        showToast("Yalnız şəkil və video seçə bilərsən.");
        storyFileInput.value = "";
        return;
    }

   openStoryComposer(file);
    storyFileInput.value = "";
});

async function uploadAndPublishStory(file) {
    const supabaseClient = window.nexoraSupabase;

    if (!supabaseClient) {
        showToast("Supabase bağlantısı tapılmadı.");
        return;
    }

    try {
        const { data: { user }, error: authError } =
            await supabaseClient.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Hesabına daxil olmalısan.");

        const extension = file.name.split(".").pop().toLowerCase();
        const mediaType = file.type.startsWith("video/") ? "video" : "image";
        const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;

        const { error: uploadError } = await supabaseClient
            .storage
            .from("stories")
            .upload(filePath, file, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) throw uploadError;

        const { error: insertError } = await supabaseClient
            .from("nexora_stories")
            .insert({
                user_id: user.id,
                media_path: filePath,
                media_type: mediaType,
                caption: "",
                expires_at: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString()
            });

        if (insertError) {
            await supabaseClient.storage
                .from("stories")
                .remove([filePath]);

            throw insertError;
        }

        showToast("Hekayə uğurla paylaşıldı!");
        if (typeof renderStories ===
           "function") {
            renderStories();
        }
        openStoryViewer(file);

    } catch (error) {
        console.error("Story error:", error);
        showToast(error.message || "Hekayə paylaşılmadı.");
    }
}
    $("#notificationButton").addEventListener("click", () => {
        $("#notificationPanel").hidden = true;
        $("#notificationButton").setAttribute("aria-expanded", "false");
        const profileOpen = !nxProfilePanel.hidden;
        const currentPage = pages.find(page => page.classList.contains("active"));
        nxNotificationReturn = {
            profileOpen,
            pageId: currentPage?.id || "feed"
        };
        // Bildirişlər ayrıca səhifədir: açıq profil DOM-da saxlanır, amma ekranda gizlədilir.
        if (profileOpen) nxProfilePanel.hidden = true;
        showPage("notifications");
        history.pushState({ nxNotifications: true }, "", "#notifications");
    });

    function nxCloseNotifications(fromPopstate = false) {
        const destination = nxNotificationReturn;
        if (!destination) return;
        nxNotificationReturn = null;
        if (destination.profileOpen) {
            pages.forEach(page => {
                page.classList.remove("active");
                page.hidden = true;
            });
            nxPreviousPages.forEach(item => {
                item.page.hidden = item.hidden;
                item.page.classList.toggle("active", item.active);
            });
            nxProfilePanel.hidden = false;
            $$(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.page === "profile"));
        } else {
            showPage(destination.pageId);
        }
        if (!fromPopstate) {
            const hash = destination.profileOpen ? "#profile" : `#${destination.pageId}`;
            history.replaceState(null, "", hash);
        }
    }
    $("#notificationsBack")?.addEventListener("click", () => {
        if (history.state?.nxNotifications) history.back();
        else nxCloseNotifications();
    });
    document.addEventListener("click", event => {
        const panel = $("#notificationPanel");
        if (!panel.hidden && !event.target.closest(".notification-wrap")) {
            panel.hidden = true;
            $("#notificationButton").setAttribute("aria-expanded", "false");
        }
    });
    $("#siteSearch").addEventListener("input", event => {
        const query = event.target.value.trim().toLocaleLowerCase("az");
        showPage("feed");
        $$("#postsList .post-card").forEach(post => post.classList.toggle("is-hidden", query !== "" && !post.textContent.toLocaleLowerCase("az").includes(query)));
    });
    $("#feedSort").addEventListener("change", event => {
        const cards = $$(".post-card", postsList).sort((a, b) => event.target.value === "popular"
            ? Number(b.dataset.likes || 0) - Number(a.dataset.likes || 0)
            : Number(b.dataset.order || 0) - Number(a.dataset.order || 0));
        cards.forEach(card => postsList.append(card));
    });
    // Restore the saved session only after page state and render functions are initialized.
    if (activeAccount?.username) applyAccount(activeAccount);

    window.addEventListener("storage", event => {
        if (!activeAccount) return;
        if (event.key === "nexoraPosts") renderPosts();
        if (event.key === "nexoraAccounts") { renderFollowUsers(); }
        if (event.key?.startsWith("nexoraFollowing:")) {
            renderFollowUsers();
            if (fixturesById.size) renderFixtures([...fixturesById.values()]);
        }
        if (event.key?.startsWith("nexoraBets:") && fixturesById.size) renderFixtures([...fixturesById.values()]);
        if (event.key === `nexoraNotifications:${activeAccount.username}`) renderNotifications();
    });

    // NEXORA - SEPARATE USER PROFILE
const nxProfileStyle = document.createElement("style");
nxProfileStyle.textContent = `
#nxPublicProfile { padding:24px; width:100%; }
#nxPublicProfile .nx-profile-top {
 display:flex; align-items:center; gap:16px; flex-wrap:wrap;
}
#nxPublicProfile .nx-profile-avatar {
 width:90px; height:90px; border-radius:50%; object-fit:cover;
}
#nxPublicProfile .nx-profile-stats {
 display:flex; gap:24px; margin:22px 0; flex-wrap:wrap;
}
#nxPublicProfile .nx-profile-stats button {
 border:0; background:transparent; cursor:pointer; color:inherit;
}
#nxPublicProfile .nx-profile-stats strong,
#nxPublicProfile .nx-profile-stats small { display:block; }
#nxPublicProfile .nx-profile-action {
 padding:10px 22px; border:0; border-radius:10px; cursor:pointer;
}
#nxPublicProfile .nx-profile-list {
 display:flex; flex-direction:column; gap:10px; margin-top:15px;
}
#nxPublicProfile .nx-profile-person {
 display:flex; align-items:center; gap:12px; padding:10px;
 border-radius:12px; cursor:pointer;
}
#nxPublicProfile .nx-profile-person img {
 width:42px; height:42px; border-radius:50%; object-fit:cover;
}
#nxPublicProfile .nx-profile-posts { margin-top:22px; }
#nxPublicProfile .nx-profile-back { margin-bottom:20px; }
#nxPublicProfile .nx-profile-bio { opacity:.75; margin-top:8px; }
`;
document.head.append(nxProfileStyle);

const nxProfileMain = document.querySelector("main");
const nxProfilePanel = document.createElement("section");
nxProfilePanel.id = "nxPublicProfile";
nxProfilePanel.hidden = true;
nxProfileMain.append(nxProfilePanel);

let nxPreviousPages = [];

async function nxOpenProfile(username) {
    const sb = window.nexoraSupabase;
    if (!sb || !username) return;

    try {
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return;
        try { await loadPosts(); } catch (error) { console.error("Posts load:", error); }

        let profile = null;
let profileError = null;

if (username === activeAccount?.username) {
    const result = await sb
        .from("nexora_profiles")
        .select("id, username, name, bio, avatar_url, is_private")
        .eq("id", user.id)
        .single();

    profile = result.data;
    profileError = result.error;
} else {
    const result = await sb
        .from("nexora_profiles")
        .select("id, username, name, bio, avatar_url, is_private")
        .eq("username", username)
        .single();

    profile = result.data;
    profileError = result.error;
}

if (profileError) throw profileError;

        const { data: followers, error: followersError } = await sb
            .from("nexora_follows")
            .select("follower_id")
            .eq("following_id", profile.id);

        if (followersError) throw followersError;

        const { data: following, error: followingError } = await sb
            .from("nexora_follows")
            .select("following_id")
            .eq("follower_id", profile.id);

        if (followingError) throw followingError;

        const { data: existingFollow, error: followError } = await sb
            .from("nexora_follows")
            .select("id")
            .eq("follower_id", user.id)
            .eq("following_id", profile.id)
            .maybeSingle();

        if (followError) throw followError;
        const {data:profileCountsRows, error:countsError} = await sb.rpc("nexora_profile_counts", {target_user:profile.id});
        if (countsError) throw countsError;
        const profileCounts = profileCountsRows?.[0] || {post_count:0,follower_count:followers.length,following_count:following.length};

        // Profil artıq açıqdırsa (məs. ikiqat toxunuş) əvvəlki səhifə yaddaşını pozma
        if (nxProfilePanel.hidden || !nxPreviousPages.length) {
            nxPreviousPages = pages.map(page => ({
                page,
                hidden: page.hidden,
                active: page.classList.contains("active")
            }));
            history.pushState({ nxProfile: true }, "", location.href);
        }

        pages.forEach(page => {
            page.classList.remove("active");
            page.hidden = true;
        });

        nxProfilePanel.hidden = false;
        nxProfilePanel.replaceChildren();

        const back = document.createElement("button");
        back.className = "outline-button nx-profile-back";
        back.textContent = "← Geri";
        back.onclick = () => (history.state?.nxProfile ? history.back() : nxCloseProfile());
        nxProfilePanel.append(back);

        const top = document.createElement("div");
        top.className = "nx-profile-top";

       const avatar = document.createElement("div");
avatar.className = "nx-profile-avatar";
avatar.style.display = "flex";
avatar.style.alignItems = "center";
avatar.style.justifyContent = "center";
avatar.style.overflow = "hidden";
avatar.style.background = "#8b5cf6";
avatar.style.color = "white";
avatar.style.fontWeight = "bold";
avatar.style.fontSize = "30px";

if (profile.avatar_url && profile.avatar_url.startsWith("https://")) {
    const avatarImage = document.createElement("img");
    avatarImage.src = profile.avatar_url;
    avatarImage.alt = "Profil şəkli";
    avatarImage.style.width = "100%";
    avatarImage.style.height = "100%";
    avatarImage.style.objectFit = "cover";

    avatarImage.onerror = () => {
        avatarImage.remove();
        avatar.textContent = (profile.name || profile.username || "N").trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
    };

    avatar.append(avatarImage);
} else {
    avatar.textContent = (profile.name || profile.username || "N").trim().split(/\s+/).slice(0,2).map(part => part[0]).join("").toUpperCase();
}

        const info = document.createElement("div");
        const name = document.createElement("h2");
        name.textContent = profile.name || profile.username;

        const handle = document.createElement("p");
        handle.textContent = "@" + profile.username;

        const bio = document.createElement("p");
        bio.className = "nx-profile-bio";
        bio.textContent = profile.bio || "Bio əlavə edilməyib.";

        info.append(name, handle, bio);
        top.append(avatar, info);
        nxProfilePanel.append(top);

        const stats = document.createElement("div");
        stats.className = "nx-profile-stats";

        const makeStat = (count, label, action) => {
            const button = document.createElement("button");
            const strong = document.createElement("strong");
            strong.textContent = count;
            const small = document.createElement("small");
            small.textContent = label;
            button.append(strong, small);
            button.onclick = action;
            return button;
        };

        stats.append(
            makeStat(
                String(profileCounts.post_count ?? getPosts().filter(p => p.username === profile.username).length),
                "Paylaşım",
                () => {}
            ),
            makeStat(String(profileCounts.follower_count ?? followers.length), "İzləyici",
                () => { if (!profile.is_private || profile.id === user.id || existingFollow) nxShowRelations(profile, "followers"); }),
            makeStat(String(profileCounts.following_count ?? following.length), "İzlədikləri",
                () => { if (!profile.is_private || profile.id === user.id || existingFollow) nxShowRelations(profile, "following"); })
        );

        const followerNumber = stats.children[1]?.querySelector("strong");
        if (followerNumber) followerNumber.dataset.followerOf = profile.id;
        nxProfilePanel.append(stats);

        if (profile.id !== user.id) {
            const followButton = document.createElement("button");
            followButton.type = "button";
            followButton.className = "follow-toggle nx-profile-action" + (existingFollow ? " following" : "");
            followButton.dataset.id = profile.id;
            followButton.dataset.username = profile.username;
            followButton.textContent = existingFollow ? "İzləyirsən" : "İzlə";
            followButton.setAttribute("aria-pressed", String(Boolean(existingFollow)));
            nxProfilePanel.append(followButton);
        }

        const canSeePrivate = !profile.is_private || profile.id === user.id || Boolean(existingFollow);
        if (!canSeePrivate) {
            const locked = document.createElement("div");
            locked.className = "private-profile-notice";
            locked.innerHTML = '<strong>🔒 Bu hesab gizlidir</strong><p>Paylaşımları, izləyiciləri və izlədiklərini görmək üçün izləmə istəyi göndər.</p>';
            nxProfilePanel.append(locked);
            return;
        }
        const heading = document.createElement("h3");
        heading.textContent = "Paylaşımlar";
        heading.style.marginTop = "25px";
        nxProfilePanel.append(heading);

        const postList = document.createElement("div");
        postList.className = "nx-profile-posts";

        const userPosts = getPosts()
            .filter(post => post.username === profile.username)
            .sort((a, b) => b.created - a.created);

        if (!userPosts.length) {
            postList.textContent = "Hələ paylaşım yoxdur.";
        } else {
            userPosts.forEach(post => postList.append(buildPost(post)));
        }

        nxProfilePanel.append(postList);

    } catch (error) {
        console.error("Profile error:", error);
        showToast("Profil açıla bilmədi.");
    }
}

function nxCloseProfile() {
    nxProfilePanel.hidden = true;

    nxPreviousPages.forEach(item => {
        item.page.hidden = item.hidden;
        item.page.classList.toggle("active", item.active);
    });
    // Heç bir səhifə aktiv qalmayıbsa ana səhifəyə qayıt
    if (!pages.some(page => page.classList.contains("active"))) showPage("feed");
    // İstifadəçilər səhifəsi boş qalıbsa yenilə (səhifəni yeniləmədən görünsün)
    if (document.getElementById("users")?.classList.contains("active") && !document.querySelector("#allUsers .follow-user")) renderAllUsers();
}
window.addEventListener("popstate", () => {
    if (nxNotificationReturn && document.getElementById("notifications")?.classList.contains("active")) {
        nxCloseNotifications(true);
        return;
    }
    if (nxProfilePanel.hidden) return;
    document.getElementById("nxRelationPage")?.remove();
    nxCloseProfile();
});

// Open profiles by clicking post author
document.addEventListener("click", event => {
    const head = event.target.closest(".post-head");
    if (!head) return;

    const handle = head.querySelector(".post-author small");
    const match = handle?.textContent.match(/^@([^\s·]+)/);

    if (match) {
        nxOpenProfile(match[1]);
    }
   });

    // NEXORA PROFILE NAVIGATION FIX

// Profil açıq olarkən aşağı menyudan başqa bölməyə keç
document.addEventListener("click", event => {
    const nav = event.target.closest("[data-page]");

    if (!nav || nxProfilePanel.hidden) return;

    const relationPage = document.getElementById("nxRelationPage");
    if (relationPage) relationPage.remove();

    nxCloseProfile();
}, true);


// İzləyicilər və izlədikləri üçün ayrıca tam ekran səhifəsi
async function nxShowRelations(profile, initialTab) {
    const sb = window.nexoraSupabase;
    if (!sb) return;

    document.getElementById("nxRelationPage")?.remove();

    const page = document.createElement("section");
    page.id = "nxRelationPage";
    page.className = "nx-relation-page";

    const shell = document.createElement("div");
    shell.className = "nx-relation-shell";

    const head = document.createElement("div");
    head.className = "nx-relation-head";
    const back = document.createElement("button");
    back.type = "button";
    back.className = "outline-button";
    back.textContent = "← Geri";
    const titleBox = document.createElement("div");
    const title = document.createElement("h2");
    title.textContent = profile.name || profile.username;
    const sub = document.createElement("small");
    sub.textContent = "@" + profile.username;
    titleBox.append(title, sub);
    head.append(back, titleBox);

    const tabs = document.createElement("div");
    tabs.className = "nx-relation-tabs";
    const makeTab = (key, label) => {
        const tab = document.createElement("button");
        tab.type = "button";
        tab.className = "nx-relation-tab";
        tab.dataset.tab = key;
        const count = document.createElement("strong");
        count.textContent = "0";
        const text = document.createElement("span");
        text.textContent = label;
        tab.append(count, text);
        return tab;
    };
    const followersTab = makeTab("followers", "İzləyicilər");
    const followingTab = makeTab("following", "İzlədikləri");
    tabs.append(followersTab, followingTab);

    const list = document.createElement("div");
    list.className = "nx-relation-list";
    list.innerHTML = '<div class="empty-state">Yüklənir...</div>';

    shell.append(head, tabs, list);
    page.append(shell);
    document.body.append(page);

    const closePage = () => {
        page.remove();
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("nx-follow-changed", onFollowChanged);
    };
    const onKey = event => { if (event.key === "Escape") closePage(); };
    back.addEventListener("click", closePage);
    document.addEventListener("keydown", onKey);

    let me = null;
    let followerIds = [];
    let followingIds = [];
    let myFollowing = new Set();
    const byId = new Map();
    let currentTab = initialTab === "following" ? "following" : "followers";

    function updateCounts() {
        followersTab.querySelector("strong").textContent = String(followerIds.length);
        followingTab.querySelector("strong").textContent = String(followingIds.length);
    }

    function draw(tab) {
        currentTab = tab;
        followersTab.classList.toggle("active", tab === "followers");
        followingTab.classList.toggle("active", tab === "following");
        const ids = tab === "followers" ? followerIds : followingIds;
        list.replaceChildren();

        const people = ids
            .map(id => byId.get(id))
            .filter(Boolean)
            .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username, "az"));

        if (!people.length) {
            const empty = document.createElement("div");
            empty.className = "empty-state";
            empty.textContent = tab === "followers" ? "Hələ izləyici yoxdur." : "Hələ heç kimi izləmir.";
            list.append(empty);
            return;
        }

        const openPerson = person => async () => {
            // Profil artıq açıqdırsa, "Geri" əvvəlki səhifəyə qayıtsın
            const keep = !nxProfilePanel.hidden;
            const previous = nxPreviousPages;
            closePage();
            await nxOpenProfile(person.username);
            if (keep) nxPreviousPages = previous;
        };

        people.forEach(person => {
            list.append(nxMakeFollowRow(person, [...myFollowing], me, openPerson(person)));
        });
    }

    // İzləmə dəyişəndə siyahını yenidən yükləmədən say və düymələr yenilənir
    function onFollowChanged(event) {
        const { targetId, following, meId } = event.detail;
        if (following) myFollowing.add(targetId); else myFollowing.delete(targetId);
        if (profile.id === meId) {
            followingIds = following
                ? [...new Set([...followingIds, targetId])]
                : followingIds.filter(id => id !== targetId);
            updateCounts();
        } else if (profile.id === targetId) {
            followerIds = following
                ? [...new Set([...followerIds, meId])]
                : followerIds.filter(id => id !== meId);
            updateCounts();
        }
    }
    document.addEventListener("nx-follow-changed", onFollowChanged);

    try {
        const { data: sessionData } = await sb.auth.getSession();
        me = sessionData?.session?.user?.id || null;

        const [followersRes, followingRes, mineRes] = await Promise.all([
            sb.from("nexora_follows").select("follower_id").eq("following_id", profile.id),
            sb.from("nexora_follows").select("following_id").eq("follower_id", profile.id),
            me ? sb.from("nexora_follows").select("following_id").eq("follower_id", me) : Promise.resolve({ data: [] })
        ]);
        if (followersRes.error) throw followersRes.error;
        if (followingRes.error) throw followingRes.error;
        if (mineRes.error) throw mineRes.error;

        followerIds = [...new Set((followersRes.data || []).map(row => row.follower_id))];
        followingIds = [...new Set((followingRes.data || []).map(row => row.following_id))];
        myFollowing = new Set((mineRes.data || []).map(row => row.following_id));

        const allIds = [...new Set([...followerIds, ...followingIds])];
        if (allIds.length) {
            const { data: people, error } = await sb
                .from("nexora_profiles")
                .select("id, username, name, avatar_url")
                .in("id", allIds);
            if (error) throw error;
            (people || []).forEach(person => byId.set(person.id, person));
        }
        // Siyahıda görünməyən (profili olmayan) id-ləri say xaricində saxlama
        followerIds = followerIds.filter(id => byId.has(id));
        followingIds = followingIds.filter(id => byId.has(id));

        updateCounts();
        followersTab.addEventListener("click", () => draw("followers"));
        followingTab.addEventListener("click", () => draw("following"));
        draw(currentTab);
    } catch (error) {
        console.error("Relations error:", error);
        list.innerHTML = '<div class="empty-state">Siyahı yüklənmədi.</div>';
    }
}

    // NEXORA - SUPABASE FOLLOW SYSTEM

async function nxGetFollowData() {
    const sb = window.nexoraSupabase;

    if (!sb) {
        throw new Error("Supabase bağlantısı tapılmadı.");
    }

    const { data: sessionData, error: sessionError } =
        await sb.auth.getSession();

    if (sessionError) throw sessionError;

    let user = sessionData.session?.user;

    if (!user) {
        const { data, error } = await sb.auth.getUser();

        if (error) throw error;
        user = data.user;
    }

    if (!user) {
        throw new Error("Hesaba yenidən daxil olmalısan.");
    }

    const { data: profiles, error: profileError } = await sb
        .from("nexora_profiles")
        .select("id, username, name, bio, avatar_url, is_private");

    if (profileError) throw profileError;

    const { data: follows, error: followsError } = await sb
        .from("nexora_follows")
        .select("follower_id, following_id");

    if (followsError) throw followsError;

    return {
        user,
        profiles: profiles || [],
        follows: follows || []
    };
}


function nxMakeFollowRow(person, followingIds, selfId, onOpen) {
    const row = document.createElement("div");
    row.className = "follow-user";

    const label = (person.name || person.username || "N").trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toLocaleUpperCase("az");

    // Sol tərəf: loqo (profil şəkli)
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    if (person.avatar_url?.startsWith("https://")) {
        const img = document.createElement("img");
        img.src = person.avatar_url;
        img.alt = "";
        img.onerror = () => { img.remove(); avatar.textContent = label; };
        avatar.append(img);
    } else {
        avatar.textContent = label;
    }

    // Ortada: ad və istifadəçi adı
    const details = document.createElement("span");
    details.className = "follow-user-details";
    const name = document.createElement("strong");
    name.textContent = person.name || person.username;
    const handle = document.createElement("small");
    handle.textContent = "@" + person.username;
    details.append(name, handle);

    const openPersonProfile = onOpen || (() => nxOpenProfile(person.username));
    details.addEventListener("click", openPersonProfile);
    avatar.addEventListener("click", openPersonProfile);

    row.append(avatar, details);

    // Sağda: İzlə / İzləyirsən
    if (person.id !== selfId) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "follow-toggle";
        button.dataset.username = person.username;
        button.dataset.id = person.id;
        const isFollowing = followingIds.includes(person.id);
        button.textContent = isFollowing ? "İzləyirsən" : "İzlə";
        button.classList.toggle("following", isFollowing);
        button.setAttribute("aria-pressed", String(isFollowing));
        row.append(button);
    }
    return row;
}


// İstifadəçilər siyahısı və statistika
async function renderFollowUsers() {
    if (!activeAccount) return;

    const list = $("#followUsers");

    try {
        const { user, profiles, follows } = await nxGetFollowData();

        const followingIds = follows
            .filter(item => item.follower_id === user.id)
            .map(item => item.following_id);

        const followerCount = follows.filter(
            item => item.following_id === user.id
        ).length;

        const followingCount = followingIds.length;

        const followerNumber = $("#followerCount strong");
        const followingNumber = $("#followingCount strong");

        if (followerNumber) {
            followerNumber.textContent = String(followerCount);
        }

        if (followingNumber) {
            followingNumber.textContent = String(followingCount);
        }

        const query = ($("#followSearch")?.value || "")
            .trim().toLocaleLowerCase("az");

        const others = profiles.filter(person =>
            person.id !== user.id &&
            `${person.name || ""} ${person.username}`
                .toLocaleLowerCase("az").includes(query)
        );

        if (list) {
            list.replaceChildren();
            if (!others.length) {
                list.textContent = "Başqa istifadəçi tapılmadı.";
            } else {
                others.forEach(person => list.append(nxMakeFollowRow(person, followingIds)));
            }
        }

        renderHomeUserSearch();

    } catch (error) {
        console.error("Follow list error:", error);
        showToast("Xəta: " + (error.message
    || error));
    }
}


// Bütün qeydiyyatdan keçmiş profillər üçün ayrıca səhifə
async function renderAllUsers() {
    const list = $("#allUsers");
    if (!list || !activeAccount) return;
    list.innerHTML = '<div class="empty-state">İstifadəçilər yüklənir...</div>';
    try {
        const { user, profiles, follows } = await nxGetFollowData();
        const followingIds = follows.filter(row => row.follower_id === user.id).map(row => row.following_id);
        const query = ($("#allUsersSearch")?.value || "").trim().toLocaleLowerCase("az");
        const people = profiles.filter(person => person.id !== user.id && `${person.name || ""} ${person.username || ""}`.toLocaleLowerCase("az").includes(query));
        list.replaceChildren();
        if (!people.length) {
            list.innerHTML = '<div class="empty-state">Axtarışa uyğun istifadəçi tapılmadı.</div>';
            return;
        }
        people.sort((a,b) => (a.name || a.username).localeCompare(b.name || b.username, "az"));
        people.forEach(person => {
            const row = nxMakeFollowRow(person, followingIds);
            row.querySelector(".avatar")?.addEventListener("click", () => nxOpenProfile(person.username));
            row.querySelector(".follow-user-details")?.addEventListener("click", () => nxOpenProfile(person.username));
            list.append(row);
        });
    } catch (error) {
        console.error("All users error:", error);
        list.innerHTML = '<div class="empty-state">İstifadəçiləri yükləmək mümkün olmadı. Supabase icazələrini yoxla.</div>';
    }
}

$("#allUsersSearch")?.addEventListener("input", renderAllUsers);

// Ana səhifədə istifadəçi axtarışı
async function renderHomeUserSearch() {
    const results = $("#homeUserResults");
    if (!results || !activeAccount) return;

    const query = ($("#homeUserSearch")?.value || "")
        .trim().toLocaleLowerCase("az");

    results.replaceChildren();
    results.hidden = !query;

    if (!query) return;

    try {
        const { user, profiles, follows } = await nxGetFollowData();

        const followingIds = follows
            .filter(item => item.follower_id === user.id)
            .map(item => item.following_id);

        const matches = profiles.filter(person =>
            person.id !== user.id &&
            `${person.name || ""} ${person.username}`
                .toLocaleLowerCase("az").includes(query)
        );

        if (!matches.length) {
            results.textContent = "Uyğun istifadəçi tapılmadı.";
            return;
        }

        matches.forEach(person => {
            results.append(nxMakeFollowRow(person, followingIds));
        });

    } catch (error) {
        console.error(error);
        results.textContent = "Axtarış yüklənmədi.";
    }
}


// ===== Ani izləmə (səhifə yenilənmir) =====
// Düymə dərhal dəyişir, Supabase isə arxa planda yenilənir. Xəta olsa, əvvəlki vəziyyətə qayıdır.
const nxFollowBusy = new Set();
function buttonlessUpdateFollow(targetId, username) {
    document.querySelectorAll(`.follow-toggle[data-id="${targetId}"], .follow-toggle[data-username="${username}"]`).forEach(button => { button.textContent="İstək göndərildi"; button.classList.add("requested"); button.disabled=true; });
    showToast("Gizli hesaba izləmə istəyi göndərildi.");
}

function nxApplyFollowUI(target, isFollowing, delta) {
    document.querySelectorAll(".follow-toggle").forEach(btn => {
        if (btn.dataset.id !== target.id && btn.dataset.username !== target.username) return;
        btn.textContent = isFollowing ? "İzləyirsən" : "İzlə";
        btn.classList.toggle("following", isFollowing);
        btn.setAttribute("aria-pressed", String(isFollowing));
    });
    // Mənim "İzlədiklərim" sayı
    [$("#followingCount strong"), $("#infoFollowing")].forEach(el => {
        if (el) el.textContent = String(Math.max(0, (Number(el.textContent) || 0) + delta));
    });
    // Açıq olan profilin "İzləyici" sayı
    document.querySelectorAll(`[data-follower-of="${target.id}"]`).forEach(el => {
        el.textContent = String(Math.max(0, (Number(el.textContent) || 0) + delta));
    });
}

async function nxSetFollow(target, wantFollow) {
    const sb = window.nexoraSupabase;
    if (!sb || nxFollowBusy.has(target.id)) return;
    nxFollowBusy.add(target.id);

    const delta = wantFollow ? 1 : -1;

    let meId = null;
    let optimisticApplied = false;
    try {
        const { data: sessionData } = await sb.auth.getSession();
        meId = sessionData?.session?.user?.id || null;
        if (!meId) throw new Error("Hesaba daxil ol.");
        if (meId === target.id) throw new Error("Özünü izləyə bilməzsən.");

        if (wantFollow) {
            const {data:targetProfile,error:targetError} = await sb.from("nexora_profiles").select("is_private,username").eq("id",target.id).maybeSingle();
            if (targetError) throw targetError;
            if (targetProfile?.is_private) {
                const {error:requestError} = await sb.from("nexora_follow_requests").insert({requester_id:meId,target_id:target.id});
                if (requestError && requestError.code !== "23505") throw requestError;
                await sb.from("nexora_notifications").insert({recipient_id:target.id,actor_id:meId,kind:"follow_request",message:`@${activeAccount.username} səni izləmək istəyir.`});
                buttonlessUpdateFollow(target.id, targetProfile.username);
                return;
            }
        }
        nxApplyFollowUI(target, wantFollow, delta);
        optimisticApplied = true;

        if (wantFollow) {
            const { data: existing, error: checkError } = await sb
                .from("nexora_follows").select("id")
                .eq("follower_id", meId).eq("following_id", target.id).limit(1);
            if (checkError) throw checkError;
            if (!existing?.length) {
                const { error } = await sb.from("nexora_follows")
                    .insert({ follower_id: meId, following_id: target.id });
                if (error && error.code !== "23505") throw error;
                await sb.from("nexora_notifications").insert({recipient_id:target.id,actor_id:meId,kind:"follow",message:`@${activeAccount.username} səni izləməyə başladı.`});
            }
        } else {
            const { error } = await sb.from("nexora_follows").delete()
                .eq("follower_id", meId).eq("following_id", target.id);
            if (error) throw error;
        }

        document.dispatchEvent(new CustomEvent("nx-follow-changed", {
            detail: { targetId: target.id, following: wantFollow, meId }
        }));

        // Arxa planda: hekayə zolağı və oyun kartlarındakı izlənənlər
        renderStories?.();
        if (typeof renderFixtures === "function" && fixturesById?.size) {
            renderFixtures([...fixturesById.values()]);
        }
    } catch (error) {
        console.error("Follow action error:", error);
        if (optimisticApplied) nxApplyFollowUI(target, !wantFollow, -delta);   // geri qaytar
        showToast(error.message || "Əməliyyat alınmadı.");
    } finally {
        nxFollowBusy.delete(target.id);
    }
}

document.addEventListener("click", async event => {
    const button = event.target.closest(".follow-toggle");
    if (!button || !activeAccount) return;

    event.preventDefault();
    event.stopImmediatePropagation();

    let { id, username } = button.dataset;
    if (!id && username) {
        const { data } = await window.nexoraSupabase
            .from("nexora_profiles").select("id").eq("username", username).maybeSingle();
        id = data?.id;
    }
    if (!id) return;

    nxSetFollow({ id, username }, !button.classList.contains("following"));
}, true);

// Axtarış yazıldıqca siyahını yenilə
$("#followSearch")?.addEventListener("input", renderFollowUsers);

    window.nexoraOpenProfile = nxOpenProfile;
    window.nexoraShowRelations = nxShowRelations;
    window.nexoraRenderFollowUsers = renderFollowUsers;
    window.nexoraRenderAllUsers = renderAllUsers;
    $("#followerCount")?.addEventListener("click", () => openOwnRelations("followers"));
    $("#followingCount")?.addEventListener("click", () => openOwnRelations("following"));
    async function openOwnRelations(tab) {
        const sb = window.nexoraSupabase;
        const { data: { user } } = await sb.auth.getUser();
        if (!user) return showToast("Hesaba daxil olmalısan.");
        const { data: profile, error } = await sb.from("nexora_profiles").select("id, username, name, bio, avatar_url, is_private").eq("id", user.id).single();
        if (error) return showToast("Profil məlumatı yüklənmədi.");
        nxShowRelations(profile, tab);
    }
});




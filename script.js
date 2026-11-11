
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
    let profileImageFile = null;
    let nxRealtimeChannel = null;
    let nxRealtimeUserId = null;
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
    function renderFollowUsers() {
        if (!activeAccount) return;
        const accounts = readStored("nexoraAccounts", []);
        const following = getFollowing(activeAccount.username);
        const followers = accounts.filter(account => getFollowing(account.username).includes(activeAccount.username));
        const followerValue = $("#followerCount strong");
        const followingValue = $("#followingCount strong");
        if (followerValue) followerValue.textContent = String(followers.length);
        if (followingValue) followingValue.textContent = String(following.length);
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

    function nxStartRealtime(userId) {
        const sb = window.nexoraSupabase;
        if (!sb || !userId || nxRealtimeUserId === userId) return;
        if (nxRealtimeChannel) { try { sb.removeChannel(nxRealtimeChannel); } catch {} }
        nxRealtimeUserId = userId;
        nxRealtimeChannel = sb.channel(`nexora-live-${userId}`)
            .on("postgres_changes", { event: "INSERT", schema: "public", table: "nexora_notifications", filter: `recipient_id=eq.${userId}` }, payload => {
                const row = payload.new || {};
                const title = ({ follow: "Yeni izləyici", follow_request: "İzləmə istəyi", like: "Yeni bəyənmə", story_like: "Hekayə bəyənildi", comment: "Yeni şərh", story_comment: "Hekayəyə şərh", reply: "Şərhə cavab" })[row.kind] || "Bildiriş";
                const key = `nexoraNotifications:${activeAccount?.username}`;
                const items = readStored(key, []);
                if (!items.some(item => String(item.id) === String(row.id))) {
                    items.push({ id: row.id, title, message: row.message || "", actorId: row.actor_id, kind: row.kind, entityId: row.entity_id || "", created: new Date(row.created_at || Date.now()).getTime(), read: false });
                    localStorage.setItem(key, JSON.stringify(items.slice(-150)));
                    renderNotifications();
                    showToast(title);
                }
            })
            .on("postgres_changes", { event: "UPDATE", schema: "public", table: "nexora_profiles" }, payload => {
                const changed = payload.new || {};
                if (changed.id === userId && activeAccount) {
                    const updated = { ...activeAccount, avatar: changed.avatar_url || activeAccount.avatar, name: changed.name || activeAccount.name, bio: changed.bio ?? activeAccount.bio };
                    activeAccount = updated;
                    localStorage.setItem("nexoraActiveAccount", JSON.stringify(updated));
                    localStorage.setItem("nexoraAccounts", JSON.stringify(getAccounts().map(item => item.supabaseUserId === userId ? updated : item)));
                    setAvatar($("#sidebarAvatar"), updated); setAvatar($("#headerAvatar"), updated); setAvatar($("#profileAvatar"), updated); setAvatar($("#composerAvatar"), updated);
                }
                refreshPosts().catch(error => console.warn("Live profile refresh:", error));
                if (typeof renderStories === "function") renderStories();
            })
            .subscribe(status => { if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") console.warn("NEXORA realtime status:", status); });
    }

    async function ensureSupabaseProfile(account) {
        const sb = window.nexoraSupabase;
        const userId = account?.supabaseUserId || localStorage.getItem("nexoraSupabaseUserId");
        if (!sb || !userId) return;
        const safeUsername = String(account.username || `user_${userId.slice(0, 8)}`)
            .toLowerCase().replace(/[^a-z0-9_.]/g, "_").slice(0, 24);
        const profileRow = {
            id: userId,
            username: safeUsername,
            name: account.name || safeUsername,
            bio: account.bio || "",
            avatar_url: account.avatar || null
        };
        // Google OAuth users may have an auth.users row but no matching social profile.
        // Insert only when missing so existing profile settings/privacy are preserved.
        const { error } = await sb.from("nexora_profiles").upsert(profileRow, {
            onConflict: "id",
            ignoreDuplicates: true
        });
        if (error) throw error;
    }

    function applyAccount(account) {
        activeAccount = account;
        localStorage.setItem("nexoraActiveAccount", JSON.stringify(account));
        const realtimeUserId = account.supabaseUserId || localStorage.getItem("nexoraSupabaseUserId");
        if (realtimeUserId) nxStartRealtime(realtimeUserId);
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
        ensureSupabaseProfile(account)
            .then(() => refreshPosts())
            .catch(error => {
                console.error("Supabase profile sync:", error);
                showToast("Profil məlumatlarını sinxronlaşdırmaq mümkün olmadı.");
            });
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
    // Yeni paylaşım ayrıca səhifədə yaradılır; ana lentdə composer yoxdur.
    $("#openCreatePost")?.addEventListener("click", () => {
        showPage("createPostPage");
        history.replaceState(null, "", "#create");
        $("#postText")?.focus();
    });
    $("#cancelCreatePost")?.addEventListener("click", () => {
        showPage("feed");
        history.replaceState(null, "", "#feed");
    });
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
        if (postData.userId && !postData.isOwn) {
            const follow = document.createElement("button");
            follow.type = "button";
            follow.className = `post-follow-button follow-toggle${postData.isFollowing ? " following" : ""}${postData.followPending ? " pending" : ""}`;
            follow.dataset.id = postData.userId;
            follow.dataset.username = postData.username || "";
            follow.textContent = postData.isFollowing ? "İzləyirsən" : postData.followPending ? "İstək göndərildi" : "İzlə";
            follow.disabled = Boolean(postData.followPending);
            head.append(follow);
        }
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
        actions.innerHTML = '<button class="like-button" type="button"><span class="heart-glyph">♡</span><span class="like-count"></span></button><button class="comment-toggle" type="button">Şərhlər</button><button class="share-button" type="button">↗ Paylaş</button>';
        if (postData.isOwn) {
            const moreWrap = document.createElement("div");
            moreWrap.className = "post-more-wrap";
            moreWrap.innerHTML = '<button class="post-more-button" type="button" aria-label="Paylaşım seçimləri" aria-haspopup="menu" aria-expanded="false">⋯</button><div class="post-more-menu" role="menu" hidden><button class="post-delete-button" type="button" role="menuitem">Sil</button></div>';
            actions.append(moreWrap);
        }
        const likeButton = $(".like-button", actions);
        $(".like-count", likeButton).textContent = String(postData.likes || 0);
        if (postData.isLikedByMe || postData.likedBy?.includes(activeAccount?.username)) likeButton.classList.add("liked");
        post.append(actions);
        const comments = document.createElement("div");
        comments.className = "comments";
        comments.innerHTML = '<button type="button" class="comments-backdrop" aria-label="Şərhləri bağla"></button><section class="comments-sheet" role="dialog" aria-modal="true" aria-label="Paylaşım şərhləri"><div class="comments-sheet-handle"></div><header class="comments-sheet-header"><strong>Şərhlər</strong><button type="button" class="comments-sheet-close" aria-label="Bağla">×</button></header><div class="comments-list"></div><form class="comment-form"><input type="text" placeholder="Şərh əlavə et..." maxlength="200"><button type="submit">Paylaş</button></form></section>';
        const savedComments = Array.isArray(postData.comments) ? postData.comments : [];
        savedComments.forEach(comment => $(".comments-list", comments).append(makeCommentItem(comment)));
        post.append(comments);
        return post;
    }
    // Şərhin bəyənmə düyməsi: ürək + say (yenilənəndən sonra da bazadan gəlir)
    function nxSetCommentLikeUI(button, liked, count) {
        button.classList.toggle("liked", liked);
        button.setAttribute("aria-pressed", String(liked));
        button.dataset.count = String(count);
        button.replaceChildren();
        const heart = document.createElement("span"); heart.className = "comment-like-heart"; heart.textContent = liked ? "♥" : "♡";
        const num = document.createElement("span"); num.className = "comment-like-count"; num.textContent = String(count);
        button.append(heart, num);
    }
    function makeCommentItem(comment) {
        const item = document.createElement("div");
        item.className = `comment-item${comment.parentId ? " comment-reply" : ""}`;
        item.dataset.commentId = comment.id || "";
        const line = document.createElement("p");
        const authorName = document.createElement("strong");
        authorName.textContent = `${comment.name || comment.username || "İstifadəçi"}: `;
        const commentText = document.createElement("span");
        commentText.textContent = comment.text || "";
        line.append(authorName, commentText);
        const controls = document.createElement("div"); controls.className = "comment-controls";
        const reply = document.createElement("button"); reply.type = "button"; reply.className = "comment-reply-button"; reply.textContent = "Cavabla";
        const like = document.createElement("button"); like.type = "button"; like.className = "comment-like-button";
        like.setAttribute("aria-label", "Şərhi bəyən");
        nxSetCommentLikeUI(like, Boolean(comment.likedByMe), Number(comment.likes) || 0);
        controls.append(reply, like); item.append(line, controls);
        return item;
    }
    // Bildirişdən gələn şərhi tapıb ekrana gətirir və vurğulayır
    function nxFocusComment(root, commentId) {
        if (!root || !commentId) return false;
        const el = [...root.querySelectorAll("[data-comment-id]")].find(node => node.dataset.commentId === String(commentId));
        if (!el) return false;
        el.scrollIntoView({ block: "center", behavior: "smooth" });
        el.classList.remove("nx-comment-focus");
        void el.offsetWidth;
        el.classList.add("nx-comment-focus");
        setTimeout(() => el.classList.remove("nx-comment-focus"), 4800);
        return true;
    }
    // ---- Paylaşımlar (Supabase) — hamı görür ----
    let postsCache = [];
    const nxExtraPostIds = new Set();   // bildirişdən açılan paylaşımlar keşdə qalsın
    function getPosts() { return postsCache; }
    const nxUuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); }));
    async function loadPosts() {
        const sb = window.nexoraSupabase;
        if (!sb || !activeAccount) return;
        const { data: rows, error } = await sb.from("nexora_posts")
            .select("id, user_id, body, media_url, media_type, created_at")
            .order("created_at", { ascending: false })
            .limit(100);
        if (error) throw error;
        let posts = rows || [];
        // Bildirişdən açılan köhnə paylaşım son 100-ə düşməyibsə, ayrıca gətirilir
        const missingExtra = [...nxExtraPostIds].filter(id => !posts.some(post => String(post.id) === String(id)));
        if (missingExtra.length) {
            const { data: extraRows, error: extraError } = await sb.from("nexora_posts")
                .select("id, user_id, body, media_url, media_type, created_at").in("id", missingExtra);
            if (!extraError) posts = posts.concat(extraRows || []);
        }
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
        // Şərh bəyənmələri (səhifə yenilənəndən sonra da qalsın). URL uzun olmasın deyə hissə-hissə sorğulanır.
        const commentLikeMap = new Map();
        if (comments.length) {
            const commentIds = comments.map(comment => comment.id);
            const chunks = [];
            for (let i = 0; i < commentIds.length; i += 60) chunks.push(commentIds.slice(i, i + 60));
            const likeResults = await Promise.all(chunks.map(chunk => sb.from("nexora_comment_likes").select("comment_id, user_id").in("comment_id", chunk)));
            likeResults.forEach(result => {
                if (result.error) { console.warn("Comment likes load:", result.error); return; }
                (result.data || []).forEach(row => {
                    if (!commentLikeMap.has(row.comment_id)) commentLikeMap.set(row.comment_id, []);
                    commentLikeMap.get(row.comment_id).push(row.user_id);
                });
            });
        }
        const userIds = [...new Set([...posts.map(post => post.user_id), ...comments.map(comment => comment.user_id), ...likes.map(like => like.user_id)])];
        const profiles = new Map();
        if (userIds.length) {
            const { data: profileRows, error: profileError } = await sb.from("nexora_profiles")
                .select("id, username, name, avatar_url, is_private").in("id", userIds);
            if (profileError) throw profileError;
            (profileRows || []).forEach(profile => profiles.set(profile.id, profile));
        }
        const { data: authData } = await sb.auth.getUser();
        const currentUserId = authData.user?.id || "";
        const {data:myFollowRows, error:myFollowError} = await sb.from("nexora_follows").select("following_id").eq("follower_id", currentUserId);
        if (myFollowError) throw myFollowError;
        const followedIds = new Set((myFollowRows || []).map(row => row.following_id));
        let pendingIds = new Set();
        if (currentUserId && userIds.length) {
            const { data: pendingRows, error: pendingError } = await sb.from("nexora_follow_requests").select("target_id").eq("requester_id", currentUserId).in("target_id", [...new Set(posts.map(post => post.user_id))]);
            if (pendingError && pendingError.code !== "42P01") throw pendingError;
            pendingIds = new Set((pendingRows || []).map(row => row.target_id));
        }
        const visiblePrivateIds = new Set([...followedIds, currentUserId]);
        postsCache = posts.filter(post => { const author = profiles.get(post.user_id) || {}; return !author.is_private || visiblePrivateIds.has(post.user_id); }).map(post => {
            const author = profiles.get(post.user_id) || {};
            const postLikes = likes.filter(like => like.post_id === post.id);
            return {
                id: post.id,
                userId: post.user_id,
                isOwn: post.user_id === currentUserId,
                isFollowing: followedIds.has(post.user_id),
                followPending: pendingIds.has(post.user_id),
                name: author.name || author.username || "İstifadəçi",
                username: author.username || "",
                avatar: author.avatar_url && author.avatar_url.startsWith("https://") ? author.avatar_url : "",
                text: post.body || "",
                media: post.media_url || "",
                likes: postLikes.length,
                likedBy: postLikes.map(like => profiles.get(like.user_id)?.username).filter(Boolean),
                isLikedByMe: postLikes.some(like => like.user_id === currentUserId),
                comments: comments.filter(comment => comment.post_id === post.id).map(comment => {
                    const commenter = profiles.get(comment.user_id) || {};
                    const likedUsers = commentLikeMap.get(comment.id) || [];
                    return { id:comment.id, parentId:comment.parent_comment_id, userId: comment.user_id, username: commenter.username || "", name: commenter.name || commenter.username || "İstifadəçi", text: comment.body, created: new Date(comment.created_at).getTime(), likes: likedUsers.length, likedByMe: Boolean(currentUserId) && likedUsers.includes(currentUserId) };
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
        if (activeAccount && !document.hidden) loadRemoteNotifications(false, true);
    }, 7000);
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
        const currentId = activeAccount.supabaseUserId || localStorage.getItem("nexoraSupabaseUserId");
        const posts = allPosts.filter(post => post.userId !== currentId).sort((a, b) => b.created - a.created);
        postsList.replaceChildren(...posts.map(buildPost));
        if (!posts.length) postsList.innerHTML = '<div class="empty-state">Başqa istifadəçilər paylaşım etdikcə onlar burada görünəcək.</div>';
        if ($("#postCount")) $("#postCount").textContent = String(allPosts.filter(post => post.userId === currentId).length);
        renderMyPosts();
    }
    function renderMyPosts() {
        if (!activeAccount || !myPosts) return;
        const currentId = activeAccount.supabaseUserId || localStorage.getItem("nexoraSupabaseUserId");
        const posts = getPosts().filter(post => post.userId === currentId).sort((a, b) => b.created - a.created);
        myPosts.replaceChildren(...posts.map(buildPost));
        if (!posts.length) myPosts.innerHTML = '<div class="empty-state">Hələ paylaşım etməmisən.</div>';
    }
    if (["feed", "games", "predictions", "messages", "profile", "users", "notifications"].includes(location.hash.slice(1))) showPage(location.hash.slice(1));

    const fixtureDate = $("#fixtureDate");
    const fixtureDateHeading = $("#fixtureDateHeading");
    const localDateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let fixtureRequestId = 0;
    let fixtureLoadInProgress = false;
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
    // ---- Bildirişə klik → uyğun səhifə ----
    const NX_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const NX_ID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
    function nxNotificationHasTarget(item) {
        return ["follow", "follow_request", "like", "comment", "reply", "story_like", "story_comment", "prediction"].includes(item.kind)
            || Boolean(item.entityId) || /^Proqnoz/.test(item.title || "");
    }
    async function nxResolveNotificationTarget(item) {
        const sb = window.nexoraSupabase;
        const kind = item.kind || "";
        if (kind === "prediction" || (!kind && /^Proqnoz/.test(item.title || ""))) return { type: "page", page: "predictions" };
        if ((kind === "follow" || kind === "follow_request") && item.actorId) return { type: "profile", actorId: item.actorId };
        const raw = String(item.entityId || (NX_UUID_RE.test(String(item.id)) ? "" : item.id) || "");
        const parts = {};
        raw.split("|").forEach(part => { const i = part.indexOf(":"); if (i > 0) parts[part.slice(0, i)] = part.slice(i + 1); });
        if (parts.story && NX_UUID_RE.test(parts.story)) {
            return { type: "story", storyId: parts.story, commentId: parts.comment || null, openComments: kind !== "story_like" };
        }
        if (parts.post && NX_UUID_RE.test(parts.post)) {
            return { type: "post", postId: parts.post, commentId: parts.comment || null, openComments: kind !== "like" || Boolean(parts.comment), actorId: item.actorId, kind };
        }
        // Köhnə formatda yazılmış bildirişlər (entity_id strukturlu deyil)
        let m = raw.match(new RegExp(`^post-(?:like|comment):(${NX_ID})`, "i"));
        if (m) return { type: "post", postId: m[1], commentId: null, openComments: kind !== "like", actorId: item.actorId, kind };
        m = raw.match(new RegExp(`^comment-reply:(${NX_ID})`, "i"));
        if (m && sb) {
            const { data } = await sb.from("nexora_post_comments").select("post_id").eq("id", m[1]).maybeSingle();
            if (data?.post_id) return { type: "post", postId: data.post_id, commentId: null, openComments: true, actorId: item.actorId, parentId: m[1], kind };
        }
        if (NX_UUID_RE.test(raw)) {
            if (kind === "story_like" || kind === "story_comment" || kind === "reply") return { type: "story", storyId: raw, commentId: null, openComments: kind !== "story_like" };
            if (kind === "like" && sb) {   // köhnə "şərhini bəyəndi" bildirişi: entity_id = şərhin ID-si
                const { data } = await sb.from("nexora_post_comments").select("post_id").eq("id", raw).maybeSingle();
                if (data?.post_id) return { type: "post", postId: data.post_id, commentId: raw, openComments: true, actorId: item.actorId, kind };
            }
        }
        return null;
    }
    let nxNotificationNavBusy = false;
    async function nxOpenNotificationTarget(item) {
        if (nxNotificationNavBusy) return;
        nxNotificationNavBusy = true;
        try {
            const target = await nxResolveNotificationTarget(item);
            if (!target) { showToast("Bu bildiriş üçün açılacaq səhifə tapılmadı."); return; }
            if (target.type === "page") {
                nxNotificationReturn = null;
                showPage(target.page);
                history.replaceState(null, "", `#${target.page}`);
            } else if (target.type === "profile") {
                const username = await nxUsernameById(target.actorId);
                if (!username) { showToast("İstifadəçi tapılmadı."); return; }
                await nxOpenProfile(username);
            } else if (target.type === "story") {
                await nxOpenStoryById(target.storyId, target.commentId, target.openComments);
            } else if (target.type === "post") {
                await nxOpenPostView(target);
            }
        } catch (error) {
            console.error("Notification open:", error);
            showToast("Bildirişi açmaq mümkün olmadı.");
        } finally {
            nxNotificationNavBusy = false;
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
            if (nxNotificationHasTarget(item)) {
                card.classList.add("is-clickable");
                card.tabIndex = 0;
                card.setAttribute("role", "link");
                card.addEventListener("click", event => {
                    if (event.target.closest(".notification-actions")) return;   // Qəbul et / Ləğv et düymələri öz işini görür
                    nxOpenNotificationTarget(item);
                });
                card.addEventListener("keydown", event => {
                    if ((event.key === "Enter" || event.key === " ") && event.target === card) { event.preventDefault(); nxOpenNotificationTarget(item); }
                });
            }
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
    async function loadRemoteNotifications(markRead = false, notifyNew = false) {
        try {
            const sb = window.nexoraSupabase; const {data:{user}} = await sb.auth.getUser(); if (!user) return;
            const {data, error} = await sb.from("nexora_notifications").select("id, actor_id, message, kind, entity_id, created_at, read_at").eq("recipient_id", user.id).order("created_at", {ascending:false}).limit(100);
            if (error) throw error;
            if (markRead) await sb.from("nexora_notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",user.id).is("read_at",null);
            const local = getNotifications().map(item => markRead ? {...item, read:true} : item);
            (data || []).forEach(row => {
                const remoteItem = {id:row.id,title:({follow:"Yeni izləyici",follow_request:"İzləmə istəyi",like:"Yeni bəyənmə",story_like:"Hekayə bəyənildi",comment:"Yeni şərh",story_comment:"Hekayəyə şərh",reply:"Şərhə cavab"})[row.kind] || "Bildiriş",message:row.message,actorId:row.actor_id,kind:row.kind,entityId:row.entity_id||"",created:new Date(row.created_at).getTime(),read:markRead || Boolean(row.read_at)};
                const existingIndex = local.findIndex(item => item.id === row.id);
                if (existingIndex >= 0) local[existingIndex] = {...local[existingIndex], ...remoteItem, requestHandled:local[existingIndex].requestHandled};
                else { local.push(remoteItem); if (notifyNew && !row.read_at) showToast(remoteItem.title); }
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
            kind: "prediction",
            title: won ? "Proqnoz uğurlu oldu" : "Proqnoz uğursuz oldu",
            message: `${prediction.home} – ${prediction.away} · Nəticə ${prediction.score} · Seçimin: ${predictionLabels[prediction.pick] || `${prediction.marketName}: ${prediction.marketValue}`}`,
            created: Date.now(),
            read: false
        });
        localStorage.setItem(`nexoraNotifications:${activeAccount.username}`, JSON.stringify(notifications));
        renderNotifications();
    }
    // Bildirişi alana yazır. `entity` hədəfi göstərir: "post:<id>", "post:<id>|comment:<id>", "story:<id>|comment:<id>"
    const nxUsernameCache = new Map();
    async function nxUsernameById(userId) {
        if (!userId) return "";
        if (nxUsernameCache.has(userId)) return nxUsernameCache.get(userId);
        const sb = window.nexoraSupabase;
        const { data } = await sb.from("nexora_profiles").select("username").eq("id", userId).maybeSingle();
        const username = data?.username || "";
        if (username) nxUsernameCache.set(userId, username);
        return username;
    }
    function addSocialNotification(username, title, message, id, entity) {
        if (!activeAccount || !username || username === activeAccount.username) return;
        const rowId = nxUuid();   // eyni ID həm bazada, həm yerli nüsxədə → təkrar bildiriş olmur
        const kind = title.includes("bəyənmə") ? "like" : title.includes("cavab") ? "reply" : "comment";
        const notifications = readStored(`nexoraNotifications:${username}`, []);
        if (notifications.some(item => item.id === id || item.id === rowId)) return;
        notifications.push({ id: rowId, title, message, kind, entityId: entity || id, created: Date.now(), read: false });
        localStorage.setItem(`nexoraNotifications:${username}`, JSON.stringify(notifications.slice(-150)));
        (async () => {
            try {
                const sb = window.nexoraSupabase; const { data: { user } } = await sb.auth.getUser(); if (!user) return;
                const { data: recipient } = await sb.from("nexora_profiles").select("id").eq("username", username).maybeSingle();
                if (recipient?.id) {
                    const { error } = await sb.from("nexora_notifications").insert({ id: rowId, recipient_id: recipient.id, actor_id: user.id, kind, entity_id: entity || id, message });
                    if (error) throw error;
                }
            } catch (error) { console.warn("Notification sync:", error); }
        })();
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
    // ESPN-in ingiliscə dövr mətnini (məs. "5:42 - 3rd Quarter", "2nd Set") azərbaycancaya çevirir.
    function periodTextAz(text) {
        return String(text || "")
            .replace(/(\d)(?:st|nd|rd|th)\s+Quarter/i, "$1-ci rüb")
            .replace(/(\d)(?:st|nd|rd|th)\s+Set/i, "$1-ci set")
            .replace(/End of\s+/i, "Sonu: ")
            .replace(/Halftime/i, "Fasilə")
            .replace(/Overtime|\bOT\b/i, "Əlavə vaxt")
            .replace(/Final/i, "Bitib");
    }
    window.nxPeriodTextAz = periodTextAz;
    function loadFixtureExtras(match, target) {
        target.textContent = "Heyət və əmsal məlumatı açıq mənbədə təqdim edilmir.";
    }
    function renderFixtures(fixtures, liveOnly = false) {
        const gamesList = $("#gamesList");
        const leagueFilter = $("#leagueFilter");
        const selectedLeague = leagueFilter.value;
        gamesList.replaceChildren();
        fixturesById = new Map(fixtures.map(match => [String(match.fixture.id), match]));
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
            { const dt = new Date(match.fixture.date); const hm = dt.toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
                time.textContent = (fixtureDate && localDateValue(dt) !== fixtureDate.value) ? `${dt.toLocaleDateString("az-AZ", { day: "numeric", month: "short" })} · ${hm}` : hm; }
            const status = document.createElement("span");
            const liveCodes = ["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"];
            const isLiveMatch = liveCodes.includes(match.fixture.status.short);
            status.className = isLiveMatch ? "live-label" : "upcoming-label";
            status.textContent = isLiveMatch
                ? `${match.fixture.status.short === "HT" ? "FASİLƏ" : "CANLI"}${match.fixture.status.elapsed != null ? ` · ${match.fixture.status.elapsed}′` : (match.fixture.status.text ? ` · ${periodTextAz(match.fixture.status.text)}` : "")}`
                : (["FT", "AET", "PEN"].includes(match.fixture.status.short) ? "BAŞA ÇATIB" : match.fixture.status.long);
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
            // Basketbol: rüb-rüb hesab; voleybol: set-set hesab.
            const fixtureSport = sportOfLeagueId(match.league.id);
            let periodLine = null;
            if (fixtureSport !== "football" && match.sets && match.sets.home.length && match.sets.home.length === match.sets.away.length) {
                periodLine = document.createElement("div");
                periodLine.className = "game-setline";
                periodLine.textContent = `${SPORTS[fixtureSport].period}: ${match.sets.home.map((v, i) => `${v}-${match.sets.away[i]}`).join(" · ")}`;
            }

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
            toggle.textContent = "Oyun detalları və mərc →";
            toggle.addEventListener("click", () => { if (window.nxOpenMatch) window.nxOpenMatch(match); });
            card.append(meta, score, ...(periodLine ? [periodLine] : []), toggle);
            gamesList.append(card);
        });
        filterFixtures();
    }
    // SportScore: liqalar kataloqu axtarışla qurulur; oyunlar yalnız seçilmiş turnir üçün alınır;
    // oyunlar və cədvəl yalnız istifadəçinin seçdiyi liqa üçün sorğulanır.
    const FOOTBALL_API = "/api/football";
    const SPORTS = {
        football: { label: "Futbol", icon: "⚽", eyebrow: "DÜNYA FUTBOLU", dirTitle: "ESPN-də mövcud futbol turnirləri", search: "Ölkə, liqa və ya turnir axtar…", period: "" },
        volleyball: { label: "Voleybol", icon: "🏐", eyebrow: "DÜNYA VOLEYBOLU", dirTitle: "ESPN-də mövcud voleybol turnirləri", search: "Ölkə, liqa və ya turnir axtar…", period: "Setlər" },
        basketball: { label: "Basketbol", icon: "🏀", eyebrow: "DÜNYA BASKETBOLU", dirTitle: "ESPN-də mövcud basketbol turnirləri", search: "Ölkə, liqa və ya turnir axtar…", period: "Rüblər" }
    };
    // Liqa id-sindən idman növü: "basketball/nba" → basketball; "eng.1" → football.
    const sportOfLeagueId = id => { const head = String(id || "").split("/")[0]; return String(id || "").includes("/") && SPORTS[head] ? head : "football"; };
    window.nxSports = SPORTS; window.nxSportOf = sportOfLeagueId;
    let activeSport = "football";
    const footballLeaguesPromises = {};
    const fixtureResponseCache = new Map();
    const FIXTURE_CACHE_TTL = 45_000;
    function footballDirect(params) {
        return new Promise((resolve, reject) => {
            if (!window.nxFootballHandler) return reject(new Error("football-direct.js yüklənməyib."));
            const res = { code: 200, setHeader() {}, status(c) { this.code = c; return this; },
                json(body) { if (this.code >= 400 || (body && body.error)) reject(new Error((body && body.error) || "Xəta " + this.code)); else resolve(body); } };
            Promise.resolve(window.nxFootballHandler({ method: "GET", query: Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }, res)).catch(reject);
        });
    }
    // Voleybol və basketbol (id-si "basketball/nba" formatında) birbaşa ESPN-dən oxunur; yalnız futbol köhnə /api/football yolunu da sınayır.
    const isOtherSportParams = params => String(params.leagueId || "").includes("/") || (params.sport && params.sport !== "football");
    async function footballRequest(params = {}) {
        if (isOtherSportParams(params)) return footballDirect(params);
        try {
            const url = new URL(FOOTBALL_API, window.location.origin);
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
            });
            const response = await fetch(url.toString(), { headers: { "Accept": "application/json" }, cache: "no-store" });
            const data = await response.json().catch(() => null);
            if (!response.ok || !data || typeof data !== "object" || Array.isArray(data) || data.error) throw new Error("backend");
            return data;
        } catch (backendError) {
            // Backend (/api/football) işləmirsə, məlumat birbaşa brauzerdən alınır.
            return footballDirect(params);
        }
    }
    window.nxFootballRequest = footballRequest;
    async function getLeagues(sport = "football", force = false) {
        if (force) footballLeaguesPromises[sport] = null;
        if (!footballLeaguesPromises[sport]) {
            const cacheKey = sport === "football" ? "nxLeagues5" : `nxLeagues5-${sport}`;
            footballLeaguesPromises[sport] = (async () => {
                try { const c = JSON.parse(localStorage.getItem(cacheKey) || "null"); if (c && Date.now() - c.t < 6 * 3600 * 1000 && c.d.leagues?.length) return c.d; } catch (e) {}
                const d = await footballRequest({ action: "leagues", sport });
                try { localStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), d })); } catch (e) {}
                return d;
            })().then(data => (data.leagues || []).map(item => ({
                id: item.id, name: item.name, country: item.country || "Beynəlxalq", logo: item.logo || "",
                season: Number(item.season) || new Date().getFullYear(), type: item.type || "League",
                countryCode: item.countryCode || "", sport
            }))).catch(error => { footballLeaguesPromises[sport] = null; throw error; });
        }
        return footballLeaguesPromises[sport];
    }
    async function fetchLeagueFixtures(leagueId, dateCode, force = false, liveOnly = false) {
        const cacheKey = `${liveOnly ? "live" : dateCode}|${leagueId}|${selectedLeagueSeason}`;
        const cached = fixtureResponseCache.get(cacheKey);
        if (!force && cached && Date.now() - cached.time < FIXTURE_CACHE_TTL) return cached.matches;
        const params = { action: "fixtures", leagueId, tz: new Date().getTimezoneOffset(), season: selectedLeagueSeason, leagueName: selectedLeagueName, country: selectedLeagueCountry };
        if (liveOnly) params.live = "all";
        else params.date = `${dateCode.slice(0,4)}-${dateCode.slice(4,6)}-${dateCode.slice(6,8)}`;
        const data = await footballRequest(params);
        const matches = data.matches || [];
        fixtureResponseCache.set(cacheKey, { time: Date.now(), matches });
        return matches;
    }
    async function loadFixtures(date, liveOnly = false, force = false) {
        renderLeagueDirectory();
    }
    async function refreshPastPredictionResults() {
        // Köhnə lokal proqnozların API provayderi dəyişdiyi üçün avtomatik hesablanması dayandırılıb.
    }
    let selectedLeagueId = null;
    let selectedLeagueName = "";
    let selectedLeagueCountry = "";
    let selectedLeagueSeason = new Date().getFullYear();
    let selectedLiveOnly = false;
    let cachedLeagueCatalog = [];
    function renderLeagueTiles(filter = "") {
        const grid = $("#leagueGrid");
        if (!grid) return;
        const query = filter.trim().toLocaleLowerCase("az");
        const visible = cachedLeagueCatalog.filter(league =>
            !query || `${league.name} ${league.country} ${league.type}`.toLocaleLowerCase("az").includes(query)
        );
        grid.replaceChildren();
        visible.forEach(league => {
            const button = document.createElement("button");
            button.type = "button"; button.className = "league-tile";
            button.innerHTML = '<span class="league-tile-mark"><img alt="" loading="lazy"></span><span><strong></strong><small></small></span><span class="league-tile-arrow">›</span>';
            const mark = button.querySelector("img");
            const sportIcon = (SPORTS[league.sport] || SPORTS.football).icon;
            if (league.logo) { mark.src = league.logo; mark.onerror = () => { mark.replaceWith(document.createTextNode(sportIcon)); }; } else mark.replaceWith(document.createTextNode(sportIcon));
            button.querySelector("strong").textContent = league.name;
            button.querySelector("small").textContent = `${league.country} · ${league.type === "Cup" ? "Kubok" : "Liqa"}`;
            if (/azərbaycan/i.test(league.country)) button.classList.add("is-az");
            button.addEventListener("click", () => openLeague(league.id, league.name, league.country, league.season));
            grid.append(button);
        });
        if (!visible.length) grid.innerHTML = '<div class="empty-state">Axtarışa uyğun turnir tapılmadı.</div>';
        const count = $("#leagueCatalogCount");
        if (count) count.textContent = `${visible.length} turnir göstərilir`;
    }
    async function renderLeagueDirectory(force = false) {
        const grid = $("#leagueGrid");
        if (!grid) return;
        grid.innerHTML = '<div class="empty-state">Bütün liqalar və turnirlər yüklənir…</div>';
        try {
            const sportAtStart = activeSport;
            const leagues = await getLeagues(sportAtStart, force);
            if (sportAtStart !== activeSport) return;   // istifadəçi arada başqa idman növünə keçib
            cachedLeagueCatalog = leagues;
            // Azərbaycan turnirləri siyahının əvvəlində göstərilir (futbol). Voleybol və basketbolda
            // sıra əsas turnirlər (məs. NBA) birinci olmaqla serverdəki sıra ilə qalır.
            if (activeSport === "football") cachedLeagueCatalog.sort((a, b) => {
                const azA = /azerbaijan|azərbaycan/i.test(`${a.country} ${a.name}`) ? 0 : 1;
                const azB = /azerbaijan|azərbaycan/i.test(`${b.country} ${b.name}`) ? 0 : 1;
                return azA - azB || a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
            });
            renderLeagueTiles($("#leagueCatalogSearch")?.value || "");
        } catch (error) {
            console.error("Liqa kataloqu yüklənmədi:", error);
            grid.replaceChildren();
            const message = document.createElement("p");
            message.className = "empty-state";
            message.textContent = String(error?.message || "Liqaları yükləmək mümkün olmadı.");
            const retry = document.createElement("button");
            retry.type = "button"; retry.className = "outline-button"; retry.textContent = "Yenidən yoxla";
            retry.addEventListener("click", () => renderLeagueDirectory(true));
            grid.append(message, retry);
        }
    }
    async function loadSelectedLeague(date, liveOnly = false, force = false) {
        if (!selectedLeagueId) return;
        const requestId = ++fixtureRequestId;
        fixtureLoadInProgress = true;
        const gamesList = $("#gamesList");
        const heading = $("#fixtureDateHeading");
        heading.textContent = liveOnly ? "Canlı oyunlar yoxlanılır…" : "Oyunlar yüklənir…";
        gamesList.innerHTML = '<div class="empty-state">Seçilmiş turnirin oyunları yüklənir…</div>';
        try {
            const matches = await fetchLeagueFixtures(selectedLeagueId, date.replaceAll("-", ""), force, liveOnly);
            if (requestId !== fixtureRequestId) return;
            const visible = matches.filter(match => !liveOnly || ["1H","2H","HT","ET","BT","P","LIVE","INT"].includes(match.fixture.status.short))
                .sort((a,b) => new Date(a.fixture.date) - new Date(b.fixture.date));
            renderFixtures(visible, liveOnly);
            heading.textContent = `${visible.length} oyun · ${selectedLeagueName}`;
            if (!visible.length && !liveOnly) {
                const near = await footballRequest({ action: "fixtures", leagueId: selectedLeagueId, near: 1, date: date, tz: new Date().getTimezoneOffset() });
                if (requestId !== fixtureRequestId) return;
                const nearList = (near.matches || []).sort((a,b) => new Date(a.fixture.date) - new Date(b.fixture.date));
                if (nearList.length) { renderFixtures(nearList, false); heading.textContent = `Bu gün oyun yoxdur · ən yaxın ${nearList.length} oyun`; return; }
            }
            if (!visible.length) gamesList.innerHTML = `<div class="empty-state">${liveOnly ? "Bu turnirdə hazırda canlı oyun yoxdur." : "Bu tarix üçün oyun tapılmadı."}</div>`;
        } catch (error) {
            console.error("Futbol oyunları yüklənmədi:", error);
            if (requestId === fixtureRequestId) gamesList.innerHTML = `<div class="empty-state">${error.message || "Oyunları yükləmək mümkün olmadı. Yenidən yoxla."}</div>`;
        } finally { if (requestId === fixtureRequestId) fixtureLoadInProgress = false; }
    }
    async function loadLeagueStandings(leagueId, country, leagueName) {
        const target = $("#leagueStandings");
        target.innerHTML = '<div class="empty-state">Turnir cədvəli yüklənir…</div>';
        try {
            const data = await footballRequest({ action: "standings", leagueId, season: selectedLeagueSeason, leagueName, country });
            const groups = (data.groups && data.groups.length) ? data.groups : (data.standings && data.standings.length ? [{ name: "", rows: data.standings }] : []);
            if (!groups.length) throw new Error("Bu turnir üçün turnir cədvəli təqdim edilmir (kuboklarda qrup cədvəli olmaya bilər).");
            const wrap = document.createElement("div");
            wrap.className = "standings-wrap";
            groups.forEach(group => {
                if (group.name) { const h = document.createElement("h4"); h.className = "standings-group"; h.textContent = group.name; wrap.append(h); }
                const scroller = document.createElement("div"); scroller.className = "standings-scroll";
                const table = document.createElement("table");
                table.className = "standings-table";
                const standSport = sportOfLeagueId(leagueId);
                table.innerHTML = standSport === "football"
                    ? "<thead><tr><th>#</th><th>Komanda</th><th>O</th><th>Q</th><th>H</th><th>M</th><th>QF</th><th>AV</th><th>Xal</th></tr></thead>"
                    : `<thead><tr><th>#</th><th>Komanda</th><th>O</th><th>Q</th><th>M</th><th>Q%</th>${standSport === "basketball" ? "<th>±</th>" : ""}</tr></thead>`;
                const body = document.createElement("tbody");
                const total = group.rows.length;
                group.rows.forEach((entry, index) => {
                    const tr = document.createElement("tr");
                    if (standSport === "football") { if (index < 3) tr.className = "zone-top"; else if (index >= total - 3 && total > 8) tr.className = "zone-bottom"; }
                    const rankTd = document.createElement("td"); rankTd.className = "st-rank"; rankTd.textContent = entry.rank ?? index + 1; tr.append(rankTd);
                    const teamTd = document.createElement("td"); teamTd.className = "st-team";
                    if (entry.logo) { const img = document.createElement("img"); img.src = entry.logo; img.alt = ""; img.loading = "lazy"; img.onerror = () => img.remove(); teamTd.append(img); }
                    const nm = document.createElement("span"); nm.textContent = entry.team || "Komanda"; teamTd.append(nm); tr.append(teamTd);
                    const cells = standSport === "football"
                        ? [entry.played, entry.win, entry.draw, entry.lose, entry.goals, entry.goal_difference, entry.points]
                        : [entry.played, entry.win, entry.lose, entry.pct == null ? null : `${Math.round(entry.pct * 100)}%`, ...(standSport === "basketball" ? [entry.diff == null ? null : (entry.diff > 0 ? `+${entry.diff}` : String(entry.diff))] : [])];
                    const ptsIndex = standSport === "football" ? 6 : 3;
                    cells.forEach((v, i) => {
                        const td = document.createElement("td"); td.textContent = v ?? "—"; if (i === ptsIndex) td.className = "st-pts"; tr.append(td);
                    });
                    body.append(tr);
                });
                table.append(body); scroller.append(table); wrap.append(scroller);
            });
            if (data.season) { const note = document.createElement("p"); note.className = "prediction-note"; note.textContent = `Mövsüm ${data.season}`; wrap.append(note); }
            target.replaceChildren(wrap);
        } catch (error) {
            console.warn("Turnir cədvəli əlçatan deyil:", error);
            // ESPN bəzi turnirlər (kuboklar, voleybol və s.) üçün cədvəl vermir: bu halda anlaşıqlı mesaj göstərilir.
            const standingsMsg = /HTTP 4\d\d/.test(String(error?.message || "")) || !error?.message ? "Bu turnir üçün turnir cədvəli mövcud deyil." : error.message;
            target.innerHTML = `<div class="empty-state">${standingsMsg}</div>`;
        }
    }
    function openLeague(id, name, country = "", season = new Date().getFullYear()) {
        selectedLeagueId = id; selectedLeagueName = name; selectedLeagueCountry = country; selectedLeagueSeason = Number(season) || new Date().getFullYear(); selectedLiveOnly = false;
        $("#leagueDirectory").hidden = true; $("#leagueDetail").hidden = false;
        $("#selectedLeagueTitle").textContent = name;
        const today = localDateValue(new Date());
        updateFixtureDate(today);
        $$(".fixture-day").forEach(button => button.classList.toggle("active", button.dataset.day === "today"));
        loadSelectedLeague(today);
        loadLeagueStandings(id, country, name);
    }
    function setSport(sport) {
        if (!SPORTS[sport]) return;
        const changed = sport !== activeSport;
        activeSport = sport;
        $$(".sport-tab").forEach(button => {
            const on = button.dataset.sport === sport;
            button.classList.toggle("active", on);
            button.setAttribute("aria-selected", String(on));
        });
        const cfg = SPORTS[sport];
        const eyebrow = $("#sportEyebrow"); if (eyebrow) eyebrow.textContent = cfg.eyebrow;
        const dirHeading = $("#leagueDirHeading"); if (dirHeading) dirHeading.textContent = cfg.dirTitle;
        const searchBox = $("#leagueCatalogSearch"); if (searchBox) { searchBox.placeholder = cfg.search; if (changed) searchBox.value = ""; }
        if (changed) {
            ++fixtureRequestId; selectedLeagueId = null; selectedLiveOnly = false;
            $("#leagueDetail").hidden = true; $("#leagueDirectory").hidden = false;
            cachedLeagueCatalog = [];
            renderLeagueDirectory();
        }
    }
    $$(".sport-tab").forEach(button => button.addEventListener("click", () => setSport(button.dataset.sport)));
    $("#backToLeagues")?.addEventListener("click", () => {
        ++fixtureRequestId; selectedLeagueId = null;
        $("#leagueDetail").hidden = true; $("#leagueDirectory").hidden = false;
    });
    if (fixtureDate) {
        renderLeagueDirectory();
        $$(".fixture-day").forEach(button => button.addEventListener("click", () => {
            if (!selectedLeagueId) return;
            const date = new Date();
            if (button.dataset.day === "tomorrow") date.setDate(date.getDate() + 1);
            if (button.dataset.day === "live") {
                selectedLiveOnly = true;
                $$(".fixture-day").forEach(day => day.classList.toggle("active", day === button));
                loadSelectedLeague(fixtureDate.value, true);
                return;
            }
            selectedLiveOnly = false;
            $$(".fixture-day").forEach(day => day.classList.toggle("active", day === button));
            updateFixtureDate(localDateValue(date));
            loadSelectedLeague(fixtureDate.value);
        }));
        fixtureDate.addEventListener("change", () => {
            updateFixtureDate(fixtureDate.value);
            selectedLiveOnly = false;
            loadSelectedLeague(fixtureDate.value);
        });
        $("#fixtureSearch")?.addEventListener("input", filterFixtures);
        $("#leagueFilter")?.addEventListener("change", filterFixtures);
        $("#refreshFixtures")?.addEventListener("click", () => selectedLeagueId && loadSelectedLeague(fixtureDate.value, selectedLiveOnly, true));
        $("#leagueCatalogSearch")?.addEventListener("input", event => renderLeagueTiles(event.target.value));
        setInterval(() => {
            if (selectedLeagueId && $("#games")?.classList.contains("active") && !fixtureLoadInProgress)
                loadSelectedLeague(fixtureDate.value, selectedLiveOnly);
        }, 30000);
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
            showPage("feed");
            history.replaceState(null, "", "#feed");
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

    let pendingDeletePostId = null;
    const deletePostDialog = document.getElementById("deletePostConfirm");
    const deletePostCancel = deletePostDialog?.querySelector("[data-delete-cancel]");
    const deletePostConfirm = deletePostDialog?.querySelector("[data-delete-confirm]");
    deletePostCancel?.addEventListener("click", () => { pendingDeletePostId = null; deletePostDialog.close(); });
    deletePostDialog?.addEventListener("click", event => {
        if (event.target === deletePostDialog) { pendingDeletePostId = null; deletePostDialog.close(); }
    });
    deletePostDialog?.addEventListener("cancel", () => { pendingDeletePostId = null; });
    deletePostConfirm?.addEventListener("click", async () => {
        if (!pendingDeletePostId) return;
        const postId = pendingDeletePostId;
        deletePostConfirm.disabled = true;
        deletePostConfirm.textContent = "Silinir...";
        try {
            const sb = window.nexoraSupabase;
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error("Hesaba yenidən daxil ol.");
            const post = getPosts().find(item => String(item.id) === String(postId));
            if (!post || !post.isOwn || post.userId !== user.id) throw new Error("Bu paylaşımı silmək icazən yoxdur.");
            const { error } = await sb.from("nexora_posts").delete().eq("id", postId).eq("user_id", user.id);
            if (error) throw error;
            postsCache = postsCache.filter(item => String(item.id) !== String(postId));
            $$(`.post-card[data-post-id="${CSS.escape(String(postId))}"]`).forEach(card => card.remove());
            renderPosts();
            deletePostDialog.close();
            pendingDeletePostId = null;
            showToast("Paylaşım silindi.");
            if (post?.media) {
                try {
                    const marker = "/storage/v1/object/public/post-media/";
                    const at = post.media.indexOf(marker);
                    if (at >= 0) {
                        const objectPath = decodeURIComponent(post.media.slice(at + marker.length).split(/[?#]/)[0]);
                        const { error: storageError } = await sb.storage.from("post-media").remove([objectPath]);
                        if (storageError) console.warn("Post media cleanup:", storageError);
                    }
                } catch (cleanupError) { console.warn("Post media cleanup:", cleanupError); }
            }
        } catch (error) {
            console.error("Post delete:", error);
            showToast(error.message || "Paylaşımı silmək mümkün olmadı.");
        } finally {
            deletePostConfirm.disabled = false;
            deletePostConfirm.textContent = "Bəli, sil";
        }
    });

    document.addEventListener("click", async event => {
        const moreButton = event.target.closest(".post-more-button");
        if (moreButton) {
            const wrap = moreButton.closest(".post-more-wrap");
            const menu = wrap.querySelector(".post-more-menu");
            const willOpen = menu.hidden;
            $$(".post-more-menu").forEach(item => { item.hidden = true; item.closest(".post-more-wrap")?.querySelector(".post-more-button")?.setAttribute("aria-expanded", "false"); });
            menu.hidden = !willOpen;
            moreButton.setAttribute("aria-expanded", String(willOpen));
            return;
        }
        const deleteButton = event.target.closest(".post-delete-button");
        if (deleteButton) {
            const card = deleteButton.closest(".post-card");
            const postId = card?.dataset.postId;
            const post = getPosts().find(item => String(item.id) === String(postId));
            if (!post?.isOwn) return showToast("Yalnız öz paylaşımını silə bilərsən.");
            pendingDeletePostId = postId;
            deleteButton.closest(".post-more-menu").hidden = true;
            deleteButton.closest(".post-more-wrap")?.querySelector(".post-more-button")?.setAttribute("aria-expanded", "false");
            deletePostDialog?.showModal();
            return;
        }
        if (!event.target.closest(".post-more-wrap")) {
            $$(".post-more-menu").forEach(item => { item.hidden = true; item.closest(".post-more-wrap")?.querySelector(".post-more-button")?.setAttribute("aria-expanded", "false"); });
        }
        const like = event.target.closest(".like-button");
        if (like) {
            const card = like.closest(".post-card");
            const postId = card?.dataset.postId;
            const post = getPosts().find(item => String(item.id) === String(postId));
            if (!postId || like.disabled) return;
            const sb = window.nexoraSupabase;
            const wasLiked = like.classList.contains("liked");
            const count = $(".like-count", like);
            const previousCount = Number(count.textContent) || 0;
            const liked = !wasLiked;
            like.disabled = true;
            like.classList.add("is-saving");
            like.classList.toggle("liked", liked);
            count.textContent = String(Math.max(0, previousCount + (liked ? 1 : -1)));
            card.dataset.likes = count.textContent;
            if (post) {
                post.likes = Math.max(0, previousCount + (liked ? 1 : -1));
                post.likedBy ||= [];
                post.likedBy = liked
                    ? [...new Set([...post.likedBy, activeAccount.username])]
                    : post.likedBy.filter(username => username !== activeAccount.username);
                post.isLikedByMe = liked;
            }
            try {
                const { data: { user }, error: authError } = await sb.auth.getUser();
                if (authError) throw authError;
                if (!user) throw new Error("Hesaba daxil ol.");
                if (liked) {
                    const result = await sb.from("nexora_post_likes")
                        .upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
                    if (result.error) throw result.error;
                } else {
                    const result = await sb.from("nexora_post_likes")
                        .delete().eq("post_id", postId).eq("user_id", user.id);
                    if (result.error) throw result.error;
                }
                await loadPosts();
                renderPosts();
                const updatedPost = getPosts().find(item => String(item.id) === String(postId));
                if (liked && updatedPost?.userId) {
                    const { data: owner } = await sb.from("nexora_profiles").select("username").eq("id", updatedPost.userId).maybeSingle();
                    if (owner?.username) addSocialNotification(owner.username, "Yeni bəyənmə", `@${activeAccount.username} paylaşımını bəyəndi.`, `post-like:${postId}:${user.id}`, `post:${postId}`);
                }
            } catch (error) {
                console.error("Like error:", error);
                like.classList.toggle("liked", wasLiked);
                count.textContent = String(previousCount);
                card.dataset.likes = String(previousCount);
                if (post) {
                    post.likes = previousCount;
                    post.likedBy = (post.likedBy || []).filter(username => username !== activeAccount.username);
                    if (wasLiked) post.likedBy.push(activeAccount.username);
                    post.isLikedByMe = wasLiked;
                }
                showToast(error.message || "Bəyənməni yadda saxlamaq mümkün olmadı.");
            } finally {
                like.disabled = false;
                like.classList.remove("is-saving");
            }
            return;
        }
        const toggle = event.target.closest(".comment-toggle");
        if (toggle) {
            const comments = $(".comments", toggle.closest(".post-card"));
            const willOpen = !comments.classList.contains("open");
            $$(".post-card .comments.open").forEach(panel => panel.classList.remove("open"));
            comments.classList.toggle("open", willOpen);
            document.body.classList.toggle("comments-sheet-open", willOpen);
            if (willOpen) setTimeout(() => $(".comment-form input", comments)?.focus(), 180);
            return;
        }
        if (event.target.closest(".comments-sheet-close, .comments-backdrop")) {
            const panel = event.target.closest(".comments");
            panel?.classList.remove("open");
            document.body.classList.remove("comments-sheet-open");
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
            const commentId = commentLike.closest(".comment-item")?.dataset.commentId;
            if (!commentId || commentLike.disabled) return;
            const postId = commentLike.closest(".post-card")?.dataset.postId;
            const wasLiked = commentLike.classList.contains("liked");
            const previousCount = Number(commentLike.dataset.count) || 0;
            const liked = !wasLiked;
            const nextCount = Math.max(0, previousCount + (liked ? 1 : -1));
            // Keşi də yenilə: səhifə yenidən çəkiləndə (profilə keçid, poll) bəyənmə itməsin
            const patchCache = (isLiked, count) => {
                const cached = getPosts().find(item => String(item.id) === String(postId))?.comments?.find(item => String(item.id) === String(commentId));
                if (cached) { cached.likedByMe = isLiked; cached.likes = count; }
            };
            nxSetCommentLikeUI(commentLike, liked, nextCount);
            patchCache(liked, nextCount);
            commentLike.disabled = true;
            (async () => {
                const sb = window.nexoraSupabase;
                const { data: { user } } = await sb.auth.getUser();
                if (!user) throw new Error("Hesaba daxil ol.");
                if (liked) {
                    const { error } = await sb.from("nexora_comment_likes").insert({ comment_id: commentId, user_id: user.id });
                    if (error && error.code !== "23505") throw error;
                    if (!error) {
                        const { data: comment } = await sb.from("nexora_post_comments").select("user_id").eq("id", commentId).maybeSingle();
                        if (comment?.user_id && comment.user_id !== user.id) {
                            await sb.from("nexora_notifications").insert({ id: nxUuid(), recipient_id: comment.user_id, actor_id: user.id, kind: "like", entity_id: `post:${postId}|comment:${commentId}`, message: `@${activeAccount.username} şərhini bəyəndi.` });
                        }
                    }
                } else {
                    const { error } = await sb.from("nexora_comment_likes").delete().eq("comment_id", commentId).eq("user_id", user.id);
                    if (error) throw error;
                }
            })().catch(error => {
                console.error("Comment like error:", error);
                nxSetCommentLikeUI(commentLike, wasLiked, previousCount);
                patchCache(wasLiked, previousCount);
                showToast("Şərh bəyənməsi yadda saxlanmadı.");
            }).finally(() => { commentLike.disabled = false; });
            return;
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
    document.addEventListener("keydown", event => {
        if (event.key !== "Escape") return;
        const openComments = $(".post-card .comments.open");
        if (openComments) {
            openComments.classList.remove("open");
            document.body.classList.remove("comments-sheet-open");
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
        const post = getPosts().find(entry => entry.id && String(entry.id) === String(postId));
        // ID əvvəlcədən yaradılır ki, bildiriş dəqiq həmin şərhə yönləndirsin və şərh dərhal bəyənilə/cavablana bilsin
        const commentId = nxUuid();
        const newComment = { id: commentId, parentId: parentCommentId, userId: activeAccount.supabaseUserId || "", username: activeAccount.username, name: activeAccount.name, text: value, created: Date.now(), likes: 0, likedByMe: false };
        const item = makeCommentItem(newComment);
        const commentsList = $(".comments-list", event.target.parentElement);
        commentsList.append(item);
        commentsList.scrollTop = commentsList.scrollHeight;
        input.value = ""; event.target.dataset.parentCommentId = ""; input.placeholder = "Şərh əlavə et...";
        (async () => {
            const sb = window.nexoraSupabase;
            const { data: { user } } = await sb.auth.getUser();
            if (!user) throw new Error("Hesaba daxil ol.");
            const { error } = await sb.from("nexora_post_comments").insert({ id: commentId, post_id: postId, user_id: user.id, body: value, parent_comment_id: parentCommentId });
            if (error) throw error;
            newComment.userId = user.id;
            if (post) { post.comments ||= []; post.comments.push(newComment); }
            const entity = `post:${postId}|comment:${commentId}`;
            let parentAuthorId = null;
            if (parentCommentId) {
                const { data: parent } = await sb.from("nexora_post_comments").select("user_id").eq("id", parentCommentId).maybeSingle();
                parentAuthorId = parent?.user_id || null;
            }
            // Paylaşım sahibinə bildiriş (şərh sahibi eyni adamdırsa, ona aşağıda ayrıca "Şərhinə cavab" gedəcək)
            if (post?.userId && post.userId !== parentAuthorId) {
                const ownerName = await nxUsernameById(post.userId);
                if (ownerName) addSocialNotification(ownerName, parentCommentId ? "Şərhə cavab" : "Yeni şərh", parentCommentId ? `@${activeAccount.username} paylaşımda cavab yazdı: ${value}` : `@${activeAccount.username} paylaşımına şərh yazdı: ${value}`, `post-comment:${postId}:${user.id}:${commentId}`, entity);
            }
            if (parentAuthorId && parentAuthorId !== user.id) {
                const parentName = await nxUsernameById(parentAuthorId);
                if (parentName) addSocialNotification(parentName, "Şərhinə cavab", `@${activeAccount.username} şərhinə cavab yazdı: ${value}`, `comment-reply:${parentCommentId}:${user.id}:${commentId}`, entity);
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
    const SUPPORT_EMAIL = "nexorateam330@gmail.com";
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
            $("#infoBio").textContent = activeAccount.bio || "";
            $("#infoPosts").textContent = $("#postCount").textContent;
            $("#infoFollowers").textContent = $("#followerCount").textContent;
            $("#infoFollowing").textContent = $("#followingCount").textContent;
        },
        edit() {
            $("#editUsername").value = activeAccount.username;
            $("#editBio").value = activeAccount.bio || "";
            profileImageData = activeAccount.avatar || "";
            profileImageFile = null;
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
        profileImageFile = file;
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
    profileEditForm.addEventListener("submit", async event => {
        event.preventDefault();
        if (!activeAccount) return;
        const oldUsername = activeAccount.username;
        const username = $("#editUsername").value.trim().replace(/^@/, "").toLocaleLowerCase("az");
        const bio = $("#editBio").value.trim();
        const accounts = getAccounts();
        if (!/^[a-z0-9_.]{3,24}$/.test(username)) return showToast("İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.");
        if (accounts.some(account => account.username === username && account.username !== oldUsername)) return showToast("Bu istifadəçi adı artıq istifadə olunur.");
        let updated = { ...activeAccount, username, bio, avatar: profileImageData || activeAccount.avatar || "" };
        try {
            const sb = window.nexoraSupabase;
            const { data: sessionData } = await sb?.auth?.getSession?.() || { data: { session: null } };
            const user = sessionData?.session?.user;
            if (profileImageFile && user) {
                const extension = (profileImageFile.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
                const path = `${user.id}/${Date.now()}.${extension}`;
                const { error: uploadError } = await sb.storage.from("avatars").upload(path, profileImageFile, { upsert: true, contentType: profileImageFile.type, cacheControl: "3600" });
                if (uploadError) throw uploadError;
                const { data: publicUrlData } = sb.storage.from("avatars").getPublicUrl(path);
                updated.avatar = publicUrlData.publicUrl;
                const { error: profileError } = await sb.from("nexora_profiles").update({ username, bio, avatar_url: updated.avatar }).eq("id", user.id);
                if (profileError) throw profileError;
            } else if (user) {
                const { error: profileError } = await sb.from("nexora_profiles").update({ username, bio }).eq("id", user.id);
                if (profileError) throw profileError;
            }
            if (username !== oldUsername) migrateUsername(oldUsername, username);
            localStorage.setItem("nexoraAccounts", JSON.stringify(accounts.map(account => account.username === oldUsername ? updated : account)));
            profileImageData = updated.avatar;
            profileImageFile = null;
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
        await openPublishedStoryViewer(story, data.signedUrl);
    } finally {
        storyNavigating = false;
    }
}

// delta = +1 sonrakı, -1 əvvəlki; yoxdursa ana səhifəyə qayıt
function storyGo(delta) {
    if (storyIndex < 0) { closeStoryViewer(); return; }   // bildirişdən açılan tək hekayə
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
async function openPublishedStoryViewer(story, mediaUrl) {
    closeStoryViewer();
    const isVideo = story.media_type === "video";
    const sbStory = window.nexoraSupabase;
    storyViewer = document.createElement("div");
    storyViewer.className = "nexora-story-viewer";
    storyViewer.innerHTML = `
        <div class="nexora-story-progress"><div class="nexora-story-progress-fill"></div></div>
        <button class="nexora-story-close" type="button" aria-label="Bağla">×</button>
        <div class="nexora-story-content"></div>
    `;
    document.body.appendChild(storyViewer);
    const content = storyViewer.querySelector(".nexora-story-content");
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
        segment.append(fill); progressBar.append(segment); segmentFills.push(fill);
    }
    const progress = segmentFills[currentSegment];
    if (group) {
        const who = document.createElement("div"); who.className = "nexora-story-author";
        who.style.cssText = "position:absolute;top:max(26px,calc(env(safe-area-inset-top) + 14px));left:14px;z-index:3;display:flex;align-items:center;gap:8px;color:#fff;font:600 13px/1 inherit;pointer-events:none;text-shadow:0 1px 3px #0009";
        const whoAvatar = document.createElement("span"); whoAvatar.style.cssText = "width:30px;height:30px;border-radius:50%;background:#8b5cf6;display:grid;place-items:center;overflow:hidden;font-size:11px;font-weight:800";
        if (group.avatar) { const img=document.createElement("img"); img.src=group.avatar; img.alt=""; img.style.cssText="width:100%;height:100%;object-fit:cover"; whoAvatar.append(img); }
        else whoAvatar.textContent=initials(group.name);
        const whoName=document.createElement("span"); whoName.textContent=group.username?`@${group.username}`:group.name;
        who.append(whoAvatar,whoName); storyViewer.append(who);
    }
    const storyActions=document.createElement("div"); storyActions.className="story-interactions";
    storyActions.innerHTML=`
      <button type="button" class="story-like">♡ <span>0</span></button>
      <button type="button" class="story-open-comments">Şərhlər <span>0</span></button>
      <button type="button" class="story-share">↗ Paylaş</button>
      <button type="button" class="story-delete" hidden>⋯</button>
      <section class="story-comments-sheet" aria-label="Hekayə şərhləri" hidden>
        <div class="story-sheet-handle"></div>
        <header><strong>Şərhlər</strong><button type="button" class="story-sheet-close" aria-label="Bağla">×</button></header>
        <div class="story-comments-list"></div>
        <form class="story-comment-form"><input maxlength="240" placeholder="Hekayəyə şərh yaz..." autocomplete="off"><button type="submit">Göndər</button></form>
      </section>`;
    storyViewer.append(storyActions);
    const likeButton=storyActions.querySelector('.story-like');
    const likeCount=likeButton.querySelector('span');
    const commentsButton=storyActions.querySelector('.story-open-comments');
    const sheet=storyActions.querySelector('.story-comments-sheet');
    const commentsList=storyActions.querySelector('.story-comments-list');
    const commentForm=storyActions.querySelector('.story-comment-form');
    let currentUser=null, commentsCache=[];
    if (sbStory) { const {data}=await sbStory.auth.getUser(); currentUser=data?.user||null; }
    const storyEntity=commentId=>`story:${story.id}${commentId?`|comment:${commentId}`:''}`;
    const notifyStoryUser=async(recipientId,kind,message,commentId)=>{
      if(currentUser && recipientId && recipientId!==currentUser.id)
        await sbStory.from('nexora_notifications').insert({id:nxUuid(),recipient_id:recipientId,actor_id:currentUser.id,kind,entity_id:storyEntity(commentId),message});
    };
    const notifyStoryOwner=(kind,message,commentId)=>notifyStoryUser(story.user_id,kind,message,commentId);
    async function loadStoryComments(){
      if(!sbStory||!story.id)return;
      const [{data:rows,error},{count}] = await Promise.all([
        sbStory.from('nexora_story_comments').select('id,body,user_id,parent_comment_id,created_at').eq('story_id',story.id).order('created_at',{ascending:true}),
        sbStory.from('nexora_story_comments').select('id',{count:'exact',head:true}).eq('story_id',story.id)
      ]);
      if(error){console.error(error);return;}
      commentsCache=rows||[];
      const ids=[...new Set(commentsCache.map(x=>x.user_id))];
      const {data:profiles}=ids.length?await sbStory.from('nexora_profiles').select('id,username,name,avatar_url').in('id',ids):{data:[]};
      const profileMap=new Map((profiles||[]).map(x=>[x.id,x]));
      commentsList.replaceChildren();
      const roots=commentsCache.filter(x=>!x.parent_comment_id);
      for(const comment of roots){
        const profile=profileMap.get(comment.user_id)||{};
        const row=document.createElement('article'); row.className='story-comment-item'; row.dataset.commentId=comment.id;
        const who=document.createElement('strong'); who.textContent=profile.username?`@${profile.username}`:(profile.name||'İstifadəçi');
        const body=document.createElement('span'); body.textContent=comment.body;
        const actions=document.createElement('div'); actions.className='story-comment-actions';
        const like=document.createElement('button'); like.type='button'; like.textContent='♡ Bəyən';
        const reply=document.createElement('button'); reply.type='button'; reply.textContent='Cavab ver';
        actions.append(like,reply); row.append(who,body,actions); commentsList.append(row);
        const {count:likes}=await sbStory.from('nexora_story_comment_likes').select('id',{count:'exact',head:true}).eq('comment_id',comment.id);
        const {data:ownLike}=currentUser?await sbStory.from('nexora_story_comment_likes').select('id').eq('comment_id',comment.id).eq('user_id',currentUser.id).maybeSingle():{data:null};
        like.textContent=`${ownLike?'♥':'♡'} ${likes||0} · Bəyən`;
        like.classList.toggle('liked',!!ownLike);
        like.addEventListener('click',async()=>{
          if(!currentUser)return showToast('Bəyənmək üçün giriş et.');
          const {data:existing}=await sbStory.from('nexora_story_comment_likes').select('id').eq('comment_id',comment.id).eq('user_id',currentUser.id).maybeSingle();
          const result=existing?await sbStory.from('nexora_story_comment_likes').delete().eq('id',existing.id):await sbStory.from('nexora_story_comment_likes').insert({comment_id:comment.id,user_id:currentUser.id});
          if(result.error){console.error(result.error);showToast('Bəyənmə alınmadı.');return;} loadStoryComments();
        });
        reply.addEventListener('click',()=>{const input=commentForm.querySelector('input');input.value=`@${profile.username||profile.name||'istifadəçi'} `;input.dataset.parentCommentId=comment.id;input.focus();});
        commentsCache.filter(x=>x.parent_comment_id===comment.id).forEach(child=>{
          const childProfile=profileMap.get(child.user_id)||{};const replyLine=document.createElement('div');replyLine.className='story-comment-reply';replyLine.dataset.commentId=child.id;
          const replyWho=document.createElement('strong');replyWho.textContent=childProfile.username?`@${childProfile.username}`:(childProfile.name||'İstifadəçi');
          const replyBody=document.createElement('span');replyBody.textContent=child.body;replyLine.append(replyWho,replyBody);row.append(replyLine);
        });
      }
      commentsButton.querySelector('span').textContent=String(count||0);
    }
    async function refreshStoryLikes(){
      if(!sbStory||!story.id)return;
      const [{count},{data:ownLike}]=await Promise.all([
        sbStory.from('nexora_story_likes').select('id',{count:'exact',head:true}).eq('story_id',story.id),
        currentUser?sbStory.from('nexora_story_likes').select('id').eq('story_id',story.id).eq('user_id',currentUser.id).maybeSingle():Promise.resolve({data:null})
      ]);
      likeCount.textContent=String(count||0);likeButton.classList.toggle('liked',!!ownLike);likeButton.firstChild.nodeValue=ownLike?'♥ ':'♡ ';
    }
    likeButton.addEventListener('click',async()=>{
      if(!currentUser)return showToast('Bəyənmək üçün giriş et.');
      const {data:existing,error}=await sbStory.from('nexora_story_likes').select('id').eq('story_id',story.id).eq('user_id',currentUser.id).maybeSingle();
      if(error)return showToast('Bəyənmə alınmadı.');
      const result=existing?await sbStory.from('nexora_story_likes').delete().eq('id',existing.id):await sbStory.from('nexora_story_likes').insert({story_id:story.id,user_id:currentUser.id});
      if(result.error){console.error(result.error);return showToast('Bəyənmə alınmadı.');}
      if(!existing)await notifyStoryOwner('story_like',`@${activeAccount?.username||'istifadəçi'} hekayəni bəyəndi.`);
      refreshStoryLikes();
    });
    function pauseStoryForSheet(){
      if(storyPaused)return;storyPaused=true;
      if(isVideo)mediaEl.pause();else{clearTimeout(storyTimer);storyRemaining=Math.max(0,storyRemaining-(Date.now()-storyStartedAt));}
      const track=progress.parentElement.getBoundingClientRect().width||1;
      progress.style.transition='none';progress.style.width=`${(progress.getBoundingClientRect().width/track)*100}%`;
    }
    function resumeStoryFromSheet(){
      if(!storyPaused)return;storyPaused=false;
      const remaining=isVideo?Math.max(0,(mediaEl.duration-mediaEl.currentTime)*1000):storyRemaining;
      progress.getBoundingClientRect();progress.style.transition=`width ${remaining/1000}s linear`;progress.style.width='100%';
      if(isVideo)mediaEl.play();else startStoryTimer();
    }
    commentsButton.addEventListener('click',()=>{sheet.hidden=false;pauseStoryForSheet();loadStoryComments();});
    storyActions.querySelector('.story-sheet-close').addEventListener('click',()=>{sheet.hidden=true;resumeStoryFromSheet();});
    commentForm.addEventListener('submit',async event=>{
      event.preventDefault();const input=commentForm.querySelector('input');const body=input.value.trim();if(!body||!currentUser)return;
      const parent=input.dataset.parentCommentId||null;
      const newCommentId=nxUuid();
      const {error}=await sbStory.from('nexora_story_comments').insert({id:newCommentId,story_id:story.id,user_id:currentUser.id,body,parent_comment_id:parent});
      if(error){console.error(error);showToast('Şərh göndərilmədi.');return;}
      const parentAuthorId=parent?commentsCache.find(x=>x.id===parent)?.user_id:null;
      try{
        if(parentAuthorId!==story.user_id) await notifyStoryOwner(parent?'reply':'story_comment', parent?`@${activeAccount?.username||'istifadəçi'} hekayə şərhinə cavab verdi.`:`@${activeAccount?.username||'istifadəçi'} hekayənə şərh yazdı.`, newCommentId);
        if(parentAuthorId) await notifyStoryUser(parentAuthorId,'reply',`@${activeAccount?.username||'istifadəçi'} şərhinə cavab verdi.`,newCommentId);
      }catch(notifyError){console.warn('Story notification:',notifyError);}
      input.value='';delete input.dataset.parentCommentId;await loadStoryComments();
    });
    storyActions.querySelector('.story-share').addEventListener('click',async()=>{
      try{if(navigator.share)await navigator.share({title:'NEXORA hekayəsi',url:mediaUrl});else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(mediaUrl);showToast('Hekayə linki kopyalandı.');}}
      catch(error){if(error.name!=='AbortError')showToast('Hekayəni paylaşmaq mümkün olmadı.');}
    });
    const deleteButton=storyActions.querySelector('.story-delete');
    if(currentUser?.id===story.user_id){
      deleteButton.hidden=false;deleteButton.textContent='⋯';
      deleteButton.addEventListener('click',async()=>{
        const confirmed=window.confirm('Hekayəni silmək istədiyinizə əminsiniz?');if(!confirmed)return;
        try{
          const {error:deleteError}=await sbStory.from('nexora_stories').delete().eq('id',story.id).eq('user_id',currentUser.id);
          if(deleteError)throw deleteError;
          if(story.media_path){const {error:storageError}=await sbStory.storage.from('stories').remove([story.media_path]);if(storageError)console.warn('Story media cleanup:',storageError);}
          storyQueue=storyQueue.filter(item=>item.id!==story.id);closeStoryViewer();await renderStories();showToast('Hekayə silindi.');
        }catch(error){console.error(error);showToast('Hekayəni silmək mümkün olmadı.');}
      });
    }
    await Promise.all([refreshStoryLikes(),loadStoryComments()]);
    const mediaEl=isVideo?document.createElement('video'):document.createElement('img');
    mediaEl.style.pointerEvents='none';mediaEl.draggable=false;content.appendChild(mediaEl);
    storyViewer.style.userSelect='none';storyViewer.style.webkitUserSelect='none';storyViewer.style.webkitTouchCallout='none';
    storyViewer.addEventListener('contextmenu',event=>event.preventDefault());
    storyOnEnd=()=>storyGo(1);storyRemaining=10000;storyPaused=false;
    const startProgress=ms=>{progress.style.transition='none';progress.style.width='0%';progress.getBoundingClientRect();progress.style.transition=`width ${ms/1000}s linear`;progress.style.width='100%';};
    if(isVideo){mediaEl.src=mediaUrl;mediaEl.autoplay=true;mediaEl.playsInline=true;mediaEl.addEventListener('ended',()=>storyGo(1));mediaEl.addEventListener('error',()=>{showToast('Video açıla bilmədi.');storyGo(1);});mediaEl.addEventListener('loadedmetadata',()=>{storyRemaining=mediaEl.duration*1000;if(!storyPaused)startProgress(storyRemaining);});}
    else{mediaEl.src=mediaUrl;mediaEl.alt='Hekayə';startProgress(10000);startStoryTimer();}
    let pressedAt=0,pressing=false;const viewerEl=storyViewer;
    viewerEl.addEventListener('pointerdown',event=>{
      if(event.target.closest('button,input,textarea,form,.story-interactions'))return;
      pressing=true;pressedAt=Date.now();if(storyPaused)return;storyPaused=true;
      if(isVideo)mediaEl.pause();else{clearTimeout(storyTimer);storyRemaining-=Date.now()-storyStartedAt;}
      const track=progress.parentElement.getBoundingClientRect().width||1;progress.style.transition='none';progress.style.width=`${(progress.getBoundingClientRect().width/track)*100}%`;
    });
    const releasePress=event=>{
      if(!pressing)return;pressing=false;const tap=event.type==='pointerup'&&Date.now()-pressedAt<250;
      if(tap){const rect=viewerEl.getBoundingClientRect();storyGo(event.clientX<rect.left+rect.width/2?-1:1);return;}
      if(!storyPaused||!sheet.hidden)return;storyPaused=false;
      const remaining=isVideo?Math.max(0,(mediaEl.duration-mediaEl.currentTime)*1000):storyRemaining;
      progress.getBoundingClientRect();progress.style.transition=`width ${remaining/1000}s linear`;progress.style.width='100%';
      if(isVideo)mediaEl.play();else startStoryTimer();
    };
    viewerEl.addEventListener('pointerup',releasePress);viewerEl.addEventListener('pointercancel',releasePress);
    storyViewer.querySelector('.nexora-story-close').addEventListener('click',closeStoryViewer);
    // Bildirişdən gəlibsə: şərh panelini aç, həmin şərhə sürüşdür və vurğula
    const focus=nxStoryFocus; nxStoryFocus=null;
    if(focus?.openComments){
      sheet.hidden=false;pauseStoryForSheet();
      if(focus.commentId){setTimeout(()=>{if(!nxFocusComment(commentsList,focus.commentId))showToast('Şərh tapılmadı, silinmiş ola bilər.');},200);}
    }
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
            .filter(post => post.userId === profile.id)
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
// ---- Bildirişdən açılan tək paylaşım səhifəsi ----
const nxPostViewPage = document.getElementById("postView");
const nxPostViewBody = document.getElementById("postViewBody");
let nxPostViewPrev = null;

async function nxOpenPostView({ postId, commentId = null, openComments = false, actorId = null, parentId = null }) {
    if (!nxPostViewPage || !nxPostViewBody || !postId) return;
    nxExtraPostIds.add(postId);
    try { await loadPosts(); } catch (error) { console.error("Posts load:", error); }
    const post = getPosts().find(item => String(item.id) === String(postId));
    if (!post) {
        nxExtraPostIds.delete(postId);
        showToast("Bu paylaşım silinib və ya sənə açıq deyil.");
        return;
    }
    // Köhnə bildirişlərdə şərhin ID-si yoxdur: həmin istifadəçinin ən son şərhini tap
    let targetCommentId = commentId;
    if (!targetCommentId && actorId && openComments) {
        const candidates = (post.comments || []).filter(item => item.userId === actorId && (!parentId || item.parentId === parentId));
        targetCommentId = candidates.sort((a, b) => b.created - a.created)[0]?.id || null;
    }
    if (!nxPostViewPrev) {
        nxPostViewPrev = pages.map(page => ({ page, hidden: page.hidden, active: page.classList.contains("active") }));
        history.pushState({ nxPostView: true }, "", "#post");
    }
    pages.forEach(page => { page.classList.remove("active"); page.hidden = true; });
    nxPostViewPage.hidden = false;
    nxPostViewPage.classList.add("active");
    const card = buildPost(post);
    nxPostViewBody.replaceChildren(card);
    window.scrollTo({ top: 0 });
    if (openComments || targetCommentId) {
        const comments = $(".comments", card);
        comments?.classList.add("open");
        document.body.classList.add("comments-sheet-open");
        if (targetCommentId) {
            setTimeout(() => { if (!nxFocusComment(comments, targetCommentId)) showToast("Şərh tapılmadı, silinmiş ola bilər."); }, 220);
        }
    }
}

function nxClosePostView() {
    if (!nxPostViewPrev) return;
    document.body.classList.remove("comments-sheet-open");
    nxPostViewBody?.replaceChildren();
    nxExtraPostIds.clear();
    nxPostViewPrev.forEach(item => {
        item.page.hidden = item.hidden;
        item.page.classList.toggle("active", item.active);
    });
    nxPostViewPage?.classList.remove("active");
    nxPostViewPrev = null;
}
document.getElementById("postViewBack")?.addEventListener("click", () => {
    if (history.state?.nxPostView) history.back();
    else nxClosePostView();
});

// ---- Bildirişdən açılan hekayə ----
let nxStoryFocus = null;
async function nxOpenStoryById(storyId, commentId = null, openComments = false) {
    const sb = window.nexoraSupabase;
    if (!sb || !storyId) return;
    nxStoryFocus = (openComments || commentId) ? { commentId, openComments: true } : null;
    let index = storyQueue.findIndex(item => String(item.id) === String(storyId));
    if (index < 0) { await renderStories().catch(() => {}); index = storyQueue.findIndex(item => String(item.id) === String(storyId)); }
    if (index >= 0) { await openStoryAt(index); return; }
    // İzləmədiyin adamın hekayəsi (məs. şərhinə cavab): növbəni pozmadan tək hekayə kimi aç
    const { data: story, error } = await sb.from("nexora_stories").select("*").eq("id", storyId).maybeSingle();
    if (error || !story || (story.expires_at && new Date(story.expires_at) <= new Date())) {
        nxStoryFocus = null;
        showToast("Bu hekayənin vaxtı bitib və ya silinib.");
        return;
    }
    const { data: signed, error: signedError } = await sb.storage.from("stories").createSignedUrl(story.media_path, 300);
    if (signedError || !signed?.signedUrl) { nxStoryFocus = null; showToast("Hekayə açıla bilmədi."); return; }
    storyIndex = -1;
    await openPublishedStoryViewer(story, signed.signedUrl);
}

window.addEventListener("popstate", () => {
    if (nxPostViewPrev) { nxClosePostView(); return; }
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





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

    $$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.authMode)));
    authForm.addEventListener("submit", event => {
        event.preventDefault();
        const username = $("#authUsername").value.trim().replace(/^@/, "").toLocaleLowerCase("az");
        const password = $("#authPassword").value;
        const accounts = readStored("nexoraAccounts", []);
        if (!/^[a-z0-9_.]{3,24}$/.test(username)) {
            authMessage.textContent = "İstifadəçi adı 3–24 simvol olmalı, yalnız hərf, rəqəm, nöqtə və _ istifadə etməlidir.";
            return;
        }
        if (authMode === "register") {
            const name = $("#authName").value.trim();
            if (name.length < 2) { authMessage.textContent = "Zəhmət olmasa adını daxil et."; return; }
            if (password.length < 4) { authMessage.textContent = "Şifrə ən azı 4 simvol olmalıdır."; return; }
            if (accounts.some(item => item.username === username)) { authMessage.textContent = "Bu istifadəçi adı artıq qeydiyyatdan keçib."; return; }
            const account = { name, username, password };
            accounts.push(account);
            localStorage.setItem("nexoraAccounts", JSON.stringify(accounts));
            applyAccount(account);
            authForm.reset();
            showToast("NEXORA hesabın yaradıldı!");
            return;
        }
        const account = accounts.find(item => item.username === username && item.password === password);
        if (!account) { authMessage.textContent = "İstifadəçi adı və ya şifrə yanlışdır."; return; }
        applyAccount(account);
        authForm.reset();
    });

    $("#logoutButton").addEventListener("click", () => {
        localStorage.removeItem("nexoraActiveAccount");
        activeAccount = null;
        selectedChat = null;
        authGate.hidden = false;
        setAuthMode("login");
        authForm.reset();
    });
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
        setAvatar(avatar, postAuthor || { name: postData.name });
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
        if (media) post.append(media);
        const actions = document.createElement("div");
        actions.className = "post-actions";
        actions.innerHTML = '<button class="like-button">♡ <span></span></button><button class="comment-toggle">▱ Şərh yaz</button><button class="share-button">↗ Mesajla paylaş</button>';
        const likeButton = $(".like-button", actions);
        $("span", likeButton).textContent = String(postData.likes || 0);
        if (postData.likedBy?.includes(activeAccount?.username)) likeButton.classList.add("liked");
        post.append(actions);
        const comments = document.createElement("div");
        comments.className = "comments";
        comments.innerHTML = '<div class="comments-list"></div><form class="comment-form"><input type="text" placeholder="Şərh yaz..." maxlength="200"><button type="submit">Göndər</button></form>';
        post.append(comments);
        return post;
    }
    function getPosts() { return readStored("nexoraPosts", []); }
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
    if (["feed", "games", "predictions", "messages", "profile"].includes(location.hash.slice(1))) showPage(location.hash.slice(1));

    const fixtureDate = $("#fixtureDate");
    const fixtureDateHeading = $("#fixtureDateHeading");
    const localDateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let fixtureRequestId = 0;
    let fixturesById = new Map();
    const predictionLabels = { home: "1 · Ev sahibi qələbəsi", draw: "X · Heç-heçə", away: "2 · Qonaq qələbəsi" };
    const getPredictions = () => activeAccount ? readStored(`nexoraBets:${activeAccount.username}`, []) : [];
    const getNotifications = () => activeAccount ? readStored(`nexoraNotifications:${activeAccount.username}`, []) : [];
    function renderNotifications() {
        const list = $("#notificationList");
        if (!list) return;
        const notifications = getNotifications().sort((a, b) => b.created - a.created);
        const unread = notifications.filter(item => !item.read).length;
        const badge = $("#notificationBadge");
        badge.hidden = unread === 0;
        badge.textContent = unread > 9 ? "9+" : String(unread);
        list.replaceChildren();
        if (!notifications.length) {
            list.innerHTML = '<p class="empty-state">Hələ bildiriş yoxdur.</p>';
            return;
        }
        notifications.forEach(item => {
            const card = document.createElement("article");
            card.className = `notification-item${item.read ? "" : " unread"}`;
            const title = document.createElement("strong");
            title.textContent = item.title;
            const text = document.createElement("p");
            text.textContent = item.message;
            const time = document.createElement("small");
            time.textContent = new Date(item.created).toLocaleString("az-AZ", { dateStyle: "short", timeStyle: "short" });
            card.append(title, text, time);
            list.append(card);
        });
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
    $("#postMedia").addEventListener("change", event => loadFile(event.target.files[0], data => {
        postMediaData = data;
        const preview = $("#postMediaPreview");
        preview.replaceChildren();
        const media = mediaElement(data, "post-media");
        if (media) preview.append(media);
    }));
    $("#postForm").addEventListener("submit", event => {
        event.preventDefault();
        const text = $("#postText").value.trim();
        if (!text && !postMediaData) return showToast("Mətn və ya foto/video əlavə et.");
        const posts = getPosts();
        posts.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: activeAccount.name, username: activeAccount.username, text, media: postMediaData, likes: 0, created: Date.now() });
        try { localStorage.setItem("nexoraPosts", JSON.stringify(posts)); }
        catch { return showToast("Brauzer yaddaşı doludur. Daha kiçik fayl seç."); }
        $("#postText").value = "";
        $("#postMedia").value = "";
        $("#postMediaPreview").replaceChildren();
        postMediaData = "";
        renderPosts();
        showToast("Paylaşım dərc olundu.");
    });

    function renderContacts() {
        if (!activeAccount) return;
        const accounts = readStored("nexoraAccounts", []).filter(account => account.username !== activeAccount.username);
        const contactBox = $("#chatContacts");
        const query = ($("#chatSearch")?.value || "").trim().toLocaleLowerCase("az");
        const filtered = accounts.filter(account => `${account.name} ${account.username}`.toLocaleLowerCase("az").includes(query));
        contactBox.replaceChildren();
        if (!filtered.length) {
            contactBox.innerHTML = `<div class="empty-state">${accounts.length ? "Uyğun istifadəçi tapılmadı." : "Hələ başqa hesab yoxdur. Eyni brauzerdə başqa hesab qeydiyyatdan keçdikdən sonra burada görünəcək."}</div>`;
            return;
        }
        filtered.forEach(account => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `chat-person${selectedChat === account.username ? " selected" : ""}`;
            const avatar = document.createElement("span");
            avatar.className = "avatar";
            setAvatar(avatar, account);
            const details = document.createElement("span");
            const name = document.createElement("strong");
            name.textContent = account.name;
            const handle = document.createElement("small");
            handle.textContent = `@${account.username}`;
            details.append(name, handle);
            button.append(avatar, details);
            button.addEventListener("click", () => openChat(account));
            contactBox.append(button);
        });
    }
    function threadKey(userA, userB) { return [userA, userB].sort().join("::"); }
    function renderChat() {
        const messagesBox = $("#chatMessages");
        if (!selectedChat) {
            messagesBox.innerHTML = '<div class="empty-state">Mesaj göndərmək üçün başqa qeydiyyatdan keçmiş hesab seç.</div>';
            return;
        }
        const thread = readStored(`nexoraChat:${threadKey(activeAccount.username, selectedChat.username)}`, []);
        messagesBox.replaceChildren();
        if (!thread.length) messagesBox.innerHTML = '<div class="empty-state">Söhbət boşdur. İlk mesajı sən göndər.</div>';
        thread.forEach(item => {
            const message = document.createElement("p");
            message.className = `message ${item.from === activeAccount.username ? "sent" : "received"}`;
            if (item.text) message.append(document.createTextNode(item.text));
            const media = mediaElement(item.media, "message-media");
            if (media) message.append(media);
            const time = document.createElement("small");
            time.textContent = new Date(item.created).toLocaleTimeString("az-AZ", { hour: "2-digit", minute: "2-digit" });
            message.append(time);
            messagesBox.append(message);
        });
        messagesBox.scrollTop = messagesBox.scrollHeight;
    }
    function openChat(account) {
        selectedChat = account;
        const title = $(".chat-title");
        const avatar = document.createElement("span");
        avatar.className = "avatar";
        setAvatar(avatar, account);
        const details = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = account.name;
        const status = document.createElement("small");
        status.textContent = `@${account.username}`;
        details.append(name, status);
        title.replaceChildren(avatar, details);
        renderContacts();
        renderChat();
    }
    $("#chatSearch").addEventListener("input", renderContacts);
    $("#chatMedia").addEventListener("change", event => loadFile(event.target.files[0], data => { chatMediaData = data; }));
    $("#chatForm").addEventListener("submit", event => {
        event.preventDefault();
        if (!selectedChat) return showToast("Əvvəlcə mesaj göndərmək üçün hesab seç.");
        const input = $("#chatInput");
        const text = input.value.trim();
        if (!text && !chatMediaData) return;
        const key = `nexoraChat:${threadKey(activeAccount.username, selectedChat.username)}`;
        const thread = readStored(key, []);
        thread.push({ from: activeAccount.username, text, media: chatMediaData, created: Date.now() });
        try { localStorage.setItem(key, JSON.stringify(thread)); }
        catch { return showToast("Brauzer yaddaşı doludur. Daha kiçik fayl seç."); }
        input.value = "";
        $("#chatMedia").value = "";
        chatMediaData = "";
        renderChat();
    });

    document.addEventListener("click", event => {
        const like = event.target.closest(".like-button");
        if (like) {
            const card = like.closest(".post-card");
            const posts = getPosts();
            const post = posts.find(item => item.id && item.id === card.dataset.postId);
            const count = $("span", like);
            const liked = like.classList.toggle("liked");
            let next = Math.max(0, Number(count.textContent) + (liked ? 1 : -1));
            if (post) {
                post.likedBy ||= [];
                post.likedBy = liked
                    ? [...new Set([...post.likedBy, activeAccount.username])]
                    : post.likedBy.filter(username => username !== activeAccount.username);
                post.likes = next;
                localStorage.setItem("nexoraPosts", JSON.stringify(posts));
                next = post.likes;
            }
            count.textContent = String(next);
            card.dataset.likes = String(next);
            return;
        }
        const toggle = event.target.closest(".comment-toggle");
        if (toggle) {
            const comments = $(".comments", toggle.closest(".post-card"));
            comments.classList.toggle("open");
            if (comments.classList.contains("open")) $("input", comments).focus();
            return;
        }
        const share = event.target.closest(".share-button");
        if (share) {
            const card = share.closest(".post-card");
            const text = $(".post-copy", card)?.textContent || "Foto/video";
            const media = $(".post-media", card)?.src || "";
            if (!selectedChat) { showPage("messages"); showToast("Mesajla paylaşmaq üçün əvvəl Mesajlar bölməsində hesab seç."); return; }
            const key = `nexoraChat:${threadKey(activeAccount.username, selectedChat.username)}`;
            const thread = readStored(key, []);
            thread.push({ from: activeAccount.username, text: `Paylaşım: ${text}`, media, created: Date.now() });
            try { localStorage.setItem(key, JSON.stringify(thread)); }
            catch { showToast("Bu media brauzer yaddaşına sığmadı."); return; }
            showPage("messages");
            renderChat();
            showToast("Paylaşım söhbətə göndərildi.");
        }
    });
    document.addEventListener("submit", event => {
        if (!event.target.matches(".comment-form")) return;
        event.preventDefault();
        const input = $("input", event.target);
        const value = input.value.trim();
        if (!value) return;
        const item = document.createElement("p");
        item.className = "comment-item";
        const name = document.createElement("strong");
        name.textContent = `${activeAccount.name}:`;
        item.append(name, document.createTextNode(value));
        $(".comments-list", event.target.parentElement).append(item);
        input.value = "";
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
        const posts = getPosts().map(post => ({
            ...post,
            ...(post.username === oldUsername ? { username: newUsername, name: activeAccount.name } : {}),
            ...(post.likedBy?.includes(oldUsername) ? { likedBy: post.likedBy.map(name => name === oldUsername ? newUsername : name) } : {})
        }));
        localStorage.setItem("nexoraPosts", JSON.stringify(posts));
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
    $("#storyButton").addEventListener("click", () => showToast("Hekayə/video paylaşmaq üçün paylaşım sahəsinə foto və ya video əlavə et."));
    $("#notificationButton").addEventListener("click", () => {
        const panel = $("#notificationPanel");
        const opening = panel.hidden;
        panel.hidden = !opening;
        $("#notificationButton").setAttribute("aria-expanded", String(opening));
        if (opening && activeAccount) {
            const notifications = getNotifications().map(item => ({ ...item, read: true }));
            localStorage.setItem(`nexoraNotifications:${activeAccount.username}`, JSON.stringify(notifications));
            renderNotifications();
        }
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
        if (event.key === "nexoraAccounts") { renderContacts(); renderFollowUsers(); }
        if (event.key?.startsWith("nexoraFollowing:")) {
            renderFollowUsers();
            if (fixturesById.size) renderFixtures([...fixturesById.values()]);
        }
        if (event.key?.startsWith("nexoraBets:") && fixturesById.size) renderFixtures([...fixturesById.values()]);
        if (event.key === `nexoraNotifications:${activeAccount.username}`) renderNotifications();
        if (event.key?.startsWith("nexoraChat:") && selectedChat && event.key.endsWith(threadKey(activeAccount.username, selectedChat.username))) renderChat();
    });
});

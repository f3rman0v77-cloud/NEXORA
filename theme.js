(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let manuallySelected = false;

    function applyTheme(dark) {
        root.dataset.theme = dark ? 'dark' : 'light';
        const button = document.getElementById('themeToggle');
        if (button) {
            button.setAttribute('aria-pressed', String(dark));
            button.title = dark ? 'Açıq rejimə keç' : 'Tünd rejimə keç';
        }
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141522' : '#f2f4fb');
    }

    applyTheme(systemTheme.matches);
    systemTheme.addEventListener('change', event => {
        if (!manuallySelected) applyTheme(event.matches);
    });
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(root.dataset.theme === 'dark');

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                manuallySelected = true;
                applyTheme(root.dataset.theme !== 'dark');
            });
        }

        // Stories are a browser-local demo feature and are visible only to the author and their followers.
        const storyButton = document.getElementById('storyButton');
        const storyStrip = document.querySelector('.story-strip');
        if (storyButton && storyStrip) {
            const storyCopy = {
                az: { yours: 'Hekayən', add: 'Hekayə əlavə et', expired: 'Hekayənin vaxtı bitib.', error: 'Hekayəni yadda saxlamaq mümkün olmadı.', size: 'Foto və ya video 2 MB-dan kiçik olmalıdır.', type: 'Yalnız foto və video əlavə etmək olar.', none: 'Hələ aktiv hekayə yoxdur.' },
                en: { yours: 'Your story', add: 'Add story', expired: 'This story has expired.', error: 'Could not save your story.', size: 'Photo or video must be under 2 MB.', type: 'Only photos and videos are supported.', none: 'No active stories yet.' },
                ru: { yours: 'Ваша история', add: 'Добавить историю', expired: 'Срок этой истории истёк.', error: 'Не удалось сохранить историю.', size: 'Фото или видео должны быть меньше 2 МБ.', type: 'Можно добавлять только фото и видео.', none: 'Пока нет активных историй.' },
                tr: { yours: 'Hikayen', add: 'Hikaye ekle', expired: 'Bu hikayenin süresi doldu.', error: 'Hikaye kaydedilemedi.', size: 'Fotoğraf veya video 2 MB altında olmalı.', type: 'Yalnızca fotoğraf ve video eklenebilir.', none: 'Henüz aktif hikaye yok.' }
            };
            const words = () => storyCopy[localStorage.getItem('nexoraLanguage') || 'az'] || storyCopy.az;
            const storedStories = () => {
                try {
                    const stories = JSON.parse(localStorage.getItem('nexoraStories') || '[]');
                    const active = stories.filter(story => story && story.created > Date.now() - 24 * 60 * 60 * 1000);
                    if (active.length !== stories.length) localStorage.setItem('nexoraStories', JSON.stringify(active));
                    return active;
                } catch { return []; }
            };
            const activeUser = () => {
                try { return JSON.parse(localStorage.getItem('nexoraActiveAccount') || 'null'); }
                catch { return null; }
            };
            const followingUsers = username => {
                try { return JSON.parse(localStorage.getItem(`nexoraFollowing:${username}`) || '[]'); }
                catch { return []; }
            };
            const accounts = () => {
                try { return JSON.parse(localStorage.getItem('nexoraAccounts') || '[]'); }
                catch { return []; }
            };
            const avatarStyle = (node, account) => {
                node.textContent = account?.avatar ? '' : (account?.name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('az');
                if (account?.avatar) node.style.backgroundImage = `url("${account.avatar}")`;
            };
            const avatarFor = username => accounts().find(account => account.username === username) || { username, name: username };

            const storyViewer = document.createElement('dialog');
            storyViewer.className = 'story-viewer';
            storyViewer.setAttribute('aria-label', 'Stories');
            storyViewer.innerHTML = '<div class="story-viewer-frame"><div class="story-viewer-header"><div class="story-viewer-author"><span class="avatar"></span><strong></strong></div><button class="story-viewer-close" type="button" aria-label="Close">×</button></div><div class="story-viewer-content"></div><button class="story-viewer-prev" type="button" aria-label="Previous story">‹</button><button class="story-viewer-next" type="button" aria-label="Next story">›</button></div>';
            document.body.append(storyViewer);
            let viewerStories = [];
            let viewerIndex = 0;
            const showStory = () => {
                const item = viewerStories[viewerIndex];
                if (!item) { storyViewer.close(); return; }
                const user = avatarFor(item.username);
                const header = storyViewer.querySelector('.story-viewer-author');
                avatarStyle(header.querySelector('.avatar'), user);
                header.querySelector('strong').textContent = user.name || `@${item.username}`;
                const content = storyViewer.querySelector('.story-viewer-content');
                content.replaceChildren();
                const media = document.createElement(item.mediaType === 'video' ? 'video' : 'img');
                media.src = item.media;
                if (media.tagName === 'VIDEO') { media.controls = true; media.autoplay = true; media.muted = true; media.playsInline = true; }
                else media.alt = `${user.name || item.username} story`;
                content.append(media);
            };
            const openStories = stories => {
                if (!stories.length) return;
                viewerStories = stories;
                viewerIndex = 0;
                showStory();
                storyViewer.showModal();
            };
            storyViewer.querySelector('.story-viewer-close').addEventListener('click', () => storyViewer.close());
            storyViewer.querySelector('.story-viewer-prev').addEventListener('click', () => { viewerIndex = (viewerIndex - 1 + viewerStories.length) % viewerStories.length; showStory(); });
            storyViewer.querySelector('.story-viewer-next').addEventListener('click', () => { viewerIndex = (viewerIndex + 1) % viewerStories.length; showStory(); });
            storyViewer.addEventListener('click', event => { if (event.target === storyViewer) storyViewer.close(); });

            const renderStories = () => {
                const user = activeUser();
                const ownStoryButton = storyButton;
                storyStrip.replaceChildren(ownStoryButton);
                if (!user?.username) return;
                const allStories = storedStories();
                const following = followingUsers(user.username);
                const visibleAccounts = accounts().filter(account => following.includes(account.username));
                const byUser = new Map();
                allStories.forEach(story => {
                    if (story.username === user.username || following.includes(story.username)) {
                        if (!byUser.has(story.username)) byUser.set(story.username, []);
                        byUser.get(story.username).push(story);
                    }
                });
                const ownStories = byUser.get(user.username) || [];
                const label = words();
                ownStoryButton.classList.toggle('has-story', ownStories.length > 0);
                ownStoryButton.setAttribute('aria-label', ownStories.length ? `${label.yours} — ${ownStories.length}` : label.add);
                const ownText = ownStoryButton.querySelector('small');
                if (ownText) ownText.textContent = ownStories.length ? label.yours : label.add;
                ownStoryButton.onclick = event => {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    if (ownStories.length) openStories(ownStories);
                    else uploadStory();
                };
                visibleAccounts.forEach(account => {
                    const stories = byUser.get(account.username);
                    if (!stories?.length) return;
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'story followed-story';
                    button.setAttribute('aria-label', `${account.name} — ${stories.length}`);
                    const ring = document.createElement('span');
                    ring.className = 'story-ring';
                    const avatar = document.createElement('span');
                    avatar.className = 'story-avatar';
                    avatarStyle(avatar, account);
                    ring.append(avatar);
                    const name = document.createElement('small');
                    name.textContent = account.name || `@${account.username}`;
                    button.append(ring, name);
                    button.addEventListener('click', () => openStories(stories));
                    storyStrip.append(button);
                });
            };
            const uploadStory = () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*,video/*';
                input.hidden = true;
                input.addEventListener('change', () => {
                    const file = input.files?.[0];
                    input.remove();
                    if (!file) return;
                    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { alert(words().type); return; }
                    if (file.size > 2 * 1024 * 1024) { alert(words().size); return; }
                    const user = activeUser();
                    if (!user?.username) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                        const stories = storedStories();
                        stories.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, username: user.username, media: String(reader.result), mediaType: file.type.startsWith('video/') ? 'video' : 'image', created: Date.now() });
                        try { localStorage.setItem('nexoraStories', JSON.stringify(stories)); renderStories(); }
                        catch { alert(words().error); }
                    };
                    reader.onerror = () => alert(words().error);
                    reader.readAsDataURL(file);
                }, { once: true });
                document.body.append(input);
                input.click();
            };
            storyButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                const user = activeUser();
                if (!user?.username) return;
                const ownStories = storedStories().filter(story => story.username === user.username);
                if (ownStories.length) openStories(ownStories);
                else uploadStory();
            }, true);
            renderStories();
            window.addEventListener('storage', event => {
                if (event.key === 'nexoraStories' || event.key === 'nexoraAccounts' || event.key?.startsWith('nexoraFollowing:') || event.key === 'nexoraActiveAccount') renderStories();
            });
            window.addEventListener('focus', renderStories);

            const storyStyle = document.createElement('style');
            storyStyle.textContent = `
                .story-strip { display:flex; gap:14px; align-items:flex-start; overflow-x:auto; padding:14px; }
                .story-strip > .story { flex:0 0 68px; }
                .story-ring { display:grid; width:58px; height:58px; padding:3px; place-items:center; border-radius:50%; background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff); }
                .story-ring.add-ring { border:2px dashed #8b82ad; background:transparent; color:#6655e8; font-size:26px; }
                .story-avatar { display:grid; width:100%; height:100%; place-items:center; border:2px solid #fff; border-radius:50%; background-color:#6655e8; background-position:center; background-size:cover; color:#fff; font-size:17px; font-weight:800; }
                .story-strip .story small { display:block; max-width:76px; margin-top:6px; overflow:hidden; color:var(--ink,#17212f); font-size:11px; text-align:center; text-overflow:ellipsis; white-space:nowrap; }
                .story-strip .story { display:flex; flex-direction:column; align-items:center; border:0; background:transparent; cursor:pointer; }
                .story-strip .story-ring.add-ring { box-sizing:border-box; }
                .story-strip .story.has-story .add-ring { border:0; background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff); color:#fff; }
                .story-viewer { width:min(430px,calc(100% - 24px)); height:min(780px,calc(100% - 24px)); padding:0; overflow:hidden; border:0; border-radius:20px; background:#101018; color:#fff; }
                .story-viewer::backdrop { background:rgba(8,8,16,.78); backdrop-filter:blur(5px); }
                .story-viewer-frame { position:relative; display:flex; width:100%; height:100%; flex-direction:column; }
                .story-viewer-header { position:absolute; z-index:2; top:0; right:0; left:0; display:flex; align-items:center; justify-content:space-between; padding:18px; background:linear-gradient(#0008,transparent); }
                .story-viewer-author { display:flex; align-items:center; gap:10px; }
                .story-viewer-author .avatar { display:grid; width:36px; height:36px; place-items:center; border:2px solid #fff; border-radius:50%; background-color:#6655e8; background-position:center; background-size:cover; color:#fff; font-weight:800; }
                .story-viewer-close { width:38px; height:38px; border:0; border-radius:50%; background:#0006; color:#fff; font-size:28px; cursor:pointer; }
                .story-viewer-content { display:grid; width:100%; height:100%; place-items:center; }
                .story-viewer-content img,.story-viewer-content video { width:100%; height:100%; object-fit:contain; }
                .story-viewer-prev,.story-viewer-next { position:absolute; top:50%; width:42px; height:54px; transform:translateY(-50%); border:0; border-radius:12px; background:#0005; color:#fff; font-size:36px; cursor:pointer; }
                .story-viewer-prev { left:10px; } .story-viewer-next { right:10px; }
                [data-theme="dark"] .story-strip .story small { color:#f5f6fb; }
            `;
            document.head.append(storyStyle);
        }

        const logoutButton = document.getElementById('logoutButton');
        const settingsMenu = document.querySelector('.settings-view[data-view="menu"]');
        if (logoutButton && settingsMenu) {
            logoutButton.classList.add('settings-logout-button');
            logoutButton.remove();
            settingsMenu.appendChild(logoutButton);

            const copy = {
                az: { title: 'Hesabdan çıxmaq istədiyinizə əminsiniz?', message: 'Çıxış etdikdən sonra yenidən daxil olmalı olacaqsınız.', cancel: 'Ləğv et', confirm: 'Bəli, çıxış et' },
                en: { title: 'Are you sure you want to log out?', message: 'You will need to sign in again after logging out.', cancel: 'Cancel', confirm: 'Yes, log out' },
                ru: { title: 'Вы уверены, что хотите выйти из аккаунта?', message: 'После выхода вам нужно будет войти снова.', cancel: 'Отмена', confirm: 'Да, выйти' },
                tr: { title: 'Çıkış yapmak istediğinizden emin misiniz?', message: 'Çıkış yaptıktan sonra yeniden giriş yapmanız gerekecek.', cancel: 'Vazgeç', confirm: 'Evet, çıkış yap' }
            };
            const confirmation = document.createElement('dialog');
            confirmation.className = 'logout-confirmation';
            confirmation.setAttribute('aria-labelledby', 'logoutConfirmationTitle');
            confirmation.setAttribute('aria-describedby', 'logoutConfirmationText');
            confirmation.innerHTML = '<div class="logout-confirmation-content"><span class="logout-confirmation-icon" aria-hidden="true">↪</span><h2 id="logoutConfirmationTitle"></h2><p id="logoutConfirmationText"></p><div class="logout-confirmation-actions"><button class="logout-cancel" type="button"></button><button class="logout-confirm" type="button"></button></div></div>';
            document.body.append(confirmation);
            const updateConfirmationLanguage = () => {
                const languageCopy = copy[localStorage.getItem('nexoraLanguage') || 'az'] || copy.az;
                confirmation.querySelector('#logoutConfirmationTitle').textContent = languageCopy.title;
                confirmation.querySelector('#logoutConfirmationText').textContent = languageCopy.message;
                confirmation.querySelector('.logout-cancel').textContent = languageCopy.cancel;
                confirmation.querySelector('.logout-confirm').textContent = languageCopy.confirm;
            };
            let confirmedLogout = false;
            logoutButton.addEventListener('click', event => {
                if (confirmedLogout) { confirmedLogout = false; return; }
                event.preventDefault();
                event.stopImmediatePropagation();
                updateConfirmationLanguage();
                confirmation.showModal();
            });
            confirmation.querySelector('.logout-cancel').addEventListener('click', () => confirmation.close());
            confirmation.querySelector('.logout-confirm').addEventListener('click', () => { confirmation.close(); confirmedLogout = true; logoutButton.click(); });
            confirmation.addEventListener('click', event => { if (event.target === confirmation) confirmation.close(); });
        }

        const settingsStyle = document.createElement('style');
        settingsStyle.textContent = `
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button { display:block; width:100%; min-height:48px; margin-top:16px; padding:13px 18px; border:1px solid #fca5a5; border-radius:14px; background:#fff1f2; color:#dc2626; font:inherit; font-size:14px; font-weight:800; letter-spacing:.01em; text-align:left; cursor:pointer; }
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button:hover { border-color:#ef4444; background:#fee2e2; color:#b91c1c; }
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button:focus-visible { outline:2px solid #dc2626; outline-offset:3px; }
            .logout-confirmation { width:min(420px,calc(100% - 32px)); padding:0; overflow:hidden; border:1px solid #e9edf2; border-radius:20px; background:#fff; color:#17212f; box-shadow:0 24px 80px rgba(18,24,40,.24); font-family:inherit; }
            .logout-confirmation::backdrop { background:rgba(15,23,42,.55); backdrop-filter:blur(3px); }
            .logout-confirmation-content { padding:28px; text-align:center; }
            .logout-confirmation-icon { display:grid; width:52px; height:52px; margin:0 auto 16px; place-items:center; border-radius:16px; background:#fff1f2; color:#dc2626; font-size:26px; font-weight:800; }
            .logout-confirmation h2 { margin:0; font-size:20px; line-height:1.35; }
            .logout-confirmation p { margin:10px 0 24px; color:#7d8998; font-size:14px; line-height:1.6; }
            .logout-confirmation-actions { display:flex; gap:10px; }
            .logout-confirmation-actions button { flex:1; min-height:46px; padding:10px 14px; border:1px solid #e9edf2; border-radius:12px; background:#fff; color:#17212f; font:inherit; font-weight:700; cursor:pointer; }
            .logout-confirmation-actions .logout-confirm { border-color:#dc2626; background:#dc2626; color:#fff; }
            .logout-confirmation-actions button:focus-visible { outline:2px solid #201a50; outline-offset:3px; }
            [data-theme="dark"] .settings-view[data-view="menu"] > .logout-button.settings-logout-button { border-color:#7f1d1d; background:#3a1a1d; color:#fda4af; }
            [data-theme="dark"] .settings-view[data-view="menu"] > .logout-button.settings-logout-button:hover { border-color:#a64c5b; background:#4a2b34; color:#fecdd3; }
            [data-theme="dark"] .logout-confirmation { border-color:#35364a; background:#1b1c2b; color:#f5f6fb; }
            [data-theme="dark"] .logout-confirmation p { color:#a8adbf; }
            [data-theme="dark"] .logout-confirmation-actions button { border-color:#3d3f53; background:#242538; color:#f5f6fb; }
            [data-theme="dark"] .logout-confirmation-actions .logout-confirm { border-color:#dc2626; background:#dc2626; color:#fff; }
            @media (max-width:420px) { .logout-confirmation-content { padding:24px 20px; } .logout-confirmation-actions { flex-direction:column-reverse; } }
        `;
        document.head.append(settingsStyle);
    });
})();

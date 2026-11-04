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
        document.getElementById('themeToggle')?.addEventListener('click', () => {
            manuallySelected = true;
            applyTheme(root.dataset.theme !== 'dark');
        });

        const read = (key, fallback = []) => {
            try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
            catch { return fallback; }
        };
        const accounts = () => read('nexoraAccounts', []);
        const posts = () => read('nexoraPosts', []);
        const currentAccount = () => read('nexoraActiveAccount', null);
        const followingKey = username => `nexoraFollowing:${username}`;
        const following = username => read(followingKey(username), []);
        const labels = () => {
            const code = localStorage.getItem('nexoraLanguage') || 'az';
            const translations = {
                az: { posts:'Paylaşımlar', followers:'İzləyicilər', following:'İzlədikləri', follow:'İzlə', unfollow:'İzləməni dayandır', message:'Mesaj yaz', close:'Bağla', empty:'Hələ paylaşım yoxdur.', none:'Bu siyahı boşdur.', profile:'Profil', edit:'Profili redaktə et', account:'Hesab' },
                en: { posts:'Posts', followers:'Followers', following:'Following', follow:'Follow', unfollow:'Unfollow', message:'Message', close:'Close', empty:'No posts yet.', none:'This list is empty.', profile:'Profile', edit:'Edit profile', account:'Account' },
                ru: { posts:'Публикации', followers:'Подписчики', following:'Подписки', follow:'Подписаться', unfollow:'Отписаться', message:'Сообщение', close:'Закрыть', empty:'Публикаций пока нет.', none:'Список пуст.', profile:'Профиль', edit:'Редактировать профиль', account:'Аккаунт' },
                tr: { posts:'Gönderiler', followers:'Takipçiler', following:'Takip ettikleri', follow:'Takip et', unfollow:'Takibi bırak', message:'Mesaj gönder', close:'Kapat', empty:'Henüz gönderi yok.', none:'Bu liste boş.', profile:'Profil', edit:'Profili düzenle', account:'Hesap' }
            };
            return translations[code] || translations.az;
        };
        const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('az');
        const setAvatar = (element, account) => {
            element.textContent = account?.avatar ? '' : initials(account?.name || account?.username);
            element.style.backgroundImage = account?.avatar ? `url("${account.avatar}")` : '';
            element.style.backgroundSize = 'cover';
            element.style.backgroundPosition = 'center';
        };
        const make = (tag, className, text) => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (text !== undefined) element.textContent = text;
            return element;
        };

        // Full-screen public profiles. Followers are derived by reverse lookup; following is the profile's own list.
        const profileDialog = document.createElement('dialog');
        profileDialog.className = 'nexora-profile-dialog';
        profileDialog.setAttribute('aria-label', labels().profile);
        profileDialog.innerHTML = '<div class="nexora-profile-shell"><header class="nexora-profile-toolbar"><button class="nexora-profile-back" type="button" aria-label="Back">‹</button><strong class="nexora-profile-toolbar-title"></strong><button class="nexora-profile-close" type="button" aria-label="Close">×</button></header><main class="nexora-profile-content"></main></div>';
        document.body.append(profileDialog);
        let viewedUsername = null;
        let viewedTab = 'posts';
        let previousBodyOverflow = '';

        function openProfile(username, tab = 'posts') {
            if (!currentAccount()) return;
            if (!accounts().some(account => account.username === username)) return;
            viewedUsername = username;
            viewedTab = tab;
            renderProfile();
            if (!profileDialog.open) {
                previousBodyOverflow = document.body.style.overflow;
                profileDialog.showModal();
                document.body.style.overflow = 'hidden';
            }
        }

        function renderProfile() {
            const w = labels();
            const account = accounts().find(item => item.username === viewedUsername);
            if (!account) { profileDialog.close(); return; }
            const viewer = currentAccount();
            const allAccounts = accounts();
            const follows = following(account.username).filter(name => allAccounts.some(item => item.username === name));
            const followers = allAccounts.filter(item => following(item.username).includes(account.username));
            const userPosts = posts().filter(post => post.username === account.username).sort((a, b) => (b.created || 0) - (a.created || 0));
            const mineFollowing = following(viewer.username);
            const content = profileDialog.querySelector('.nexora-profile-content');
            profileDialog.querySelector('.nexora-profile-toolbar-title').textContent = `@${account.username}`;
            content.replaceChildren();

            const top = make('section', 'nexora-profile-top');
            const avatar = make('div', 'avatar nexora-profile-avatar');
            setAvatar(avatar, account);
            const details = make('div', 'nexora-profile-identity');
            details.append(make('h1', '', account.name || account.username), make('p', '', `@${account.username}`));
            const actions = make('div', 'nexora-profile-actions');
            if (viewer.username !== account.username) {
                const followButton = make('button', `outline-button nexora-profile-follow${mineFollowing.includes(account.username) ? ' following' : ''}`, mineFollowing.includes(account.username) ? w.unfollow : w.follow);
                followButton.type = 'button';
                followButton.addEventListener('click', () => {
                    const latest = following(viewer.username);
                    const next = latest.includes(account.username) ? latest.filter(name => name !== account.username) : [...latest, account.username];
                    localStorage.setItem(followingKey(viewer.username), JSON.stringify(next));
                    renderFollowUsers();
                    renderProfile();
                    if (document.getElementById('followerCount')) document.getElementById('followerCount').textContent = String(accounts().filter(person => following(person.username).includes(viewer.username)).length);
                    if (document.getElementById('followingCount')) document.getElementById('followingCount').textContent = String(following(viewer.username).length);
                });
                actions.append(followButton);
                const messageButton = make('button', 'primary-button nexora-profile-message', w.message);
                messageButton.type = 'button';
                messageButton.addEventListener('click', () => {
                    profileDialog.close();
                    document.body.style.overflow = previousBodyOverflow;
                    const messagesLink = document.querySelector('[data-page="messages"]');
                    messagesLink?.click();
                    requestAnimationFrame(() => {
                        const contact = [...document.querySelectorAll('#chatContacts .chat-person')].find(item => item.querySelector('small')?.textContent.trim() === `@${account.username}`);
                        contact?.click();
                    });
                });
                actions.append(messageButton);
            } else {
                const settingsButton = make('button', 'outline-button nexora-profile-settings', w.edit);
                settingsButton.type = 'button';
                settingsButton.addEventListener('click', () => {
                    profileDialog.close();
                    document.body.style.overflow = previousBodyOverflow;
                    document.querySelector('[data-page="profile"]')?.click();
                    requestAnimationFrame(() => document.getElementById('openSettings')?.click());
                });
                actions.append(settingsButton);
            }
            top.append(avatar, details, actions);
            content.append(top);
            if (account.bio) content.append(make('p', 'nexora-profile-bio', account.bio));

            const stats = make('div', 'nexora-profile-stats');
            const addStat = (key, value, label) => {
                const button = make('button', `nexora-profile-stat${viewedTab === key ? ' active' : ''}`);
                button.type = 'button';
                button.append(make('strong', '', String(value)), make('span', '', label));
                button.addEventListener('click', () => { viewedTab = key; renderProfile(); });
                stats.append(button);
            };
            addStat('posts', userPosts.length, w.posts);
            addStat('followers', followers.length, w.followers);
            addStat('following', follows.length, w.following);
            content.append(stats);

            const sectionTitle = make('h2', 'nexora-profile-section-title', viewedTab === 'followers' ? w.followers : viewedTab === 'following' ? w.following : w.posts);
            content.append(sectionTitle);
            if (viewedTab === 'followers' || viewedTab === 'following') {
                const people = viewedTab === 'followers' ? followers : follows;
                const list = make('div', 'nexora-profile-list');
                if (!people.length) list.append(make('p', 'empty-state', w.none));
                people.forEach(person => {
                    const row = make('div', 'nexora-profile-person');
                    const personAvatar = make('span', 'avatar');
                    setAvatar(personAvatar, person);
                    const info = make('button', 'nexora-profile-person-info');
                    info.type = 'button';
                    info.append(make('strong', '', person.name || person.username), make('small', '', `@${person.username}`));
                    info.addEventListener('click', () => openProfile(person.username));
                    row.append(personAvatar, info);
                    if (person.username !== viewer.username) {
                        const isFollowing = mineFollowing.includes(person.username);
                        const control = make('button', `outline-button nexora-profile-person-follow${isFollowing ? ' following' : ''}`, isFollowing ? w.unfollow : w.follow);
                        control.type = 'button';
                        control.addEventListener('click', () => {
                            const updated = following(viewer.username);
                            localStorage.setItem(followingKey(viewer.username), JSON.stringify(updated.includes(person.username) ? updated.filter(name => name !== person.username) : [...updated, person.username]));
                            renderProfile();
                            renderFollowUsers();
                        });
                        row.append(control);
                    }
                    list.append(row);
                });
                content.append(list);
            } else {
                const grid = make('div', 'nexora-profile-posts');
                if (!userPosts.length) grid.append(make('p', 'empty-state', w.empty));
                userPosts.forEach(post => {
                    const card = make('article', 'nexora-profile-post');
                    if (post.text) card.append(make('p', '', post.text));
                    if (post.media) {
                        const media = document.createElement(post.media.startsWith('data:video/') ? 'video' : 'img');
                        media.className = 'nexora-profile-post-media';
                        media.src = post.media;
                        if (media.tagName === 'VIDEO') { media.controls = true; media.playsInline = true; }
                        else media.alt = 'Paylaşım';
                        card.append(media);
                    }
                    grid.append(card);
                });
                content.append(grid);
            }
        }

        function closeProfile() {
            if (profileDialog.open) profileDialog.close();
            document.body.style.overflow = previousBodyOverflow;
        }
        profileDialog.querySelector('.nexora-profile-close').addEventListener('click', closeProfile);
        profileDialog.querySelector('.nexora-profile-back').addEventListener('click', closeProfile);
        profileDialog.addEventListener('click', event => { if (event.target === profileDialog) closeProfile(); });
        profileDialog.addEventListener('close', () => { document.body.style.overflow = previousBodyOverflow; });

        // Keep the existing registered-user chat flow and only improve its layout.
        const chatStyle = document.createElement('style');
        chatStyle.textContent = `
            .chat-layout{display:grid!important;grid-template-columns:minmax(230px,300px) minmax(0,1fr)!important;align-items:stretch;min-height:600px;overflow:hidden}
            .chat-list{min-width:0;max-height:70vh;overflow-y:auto;border-right:1px solid var(--line,#e7e9f2)}
            .chat-window{display:flex;flex-direction:column;min-width:0;min-height:600px;overflow:hidden}
            .chat-title{display:flex;align-items:center;gap:10px;min-height:66px;padding:12px 16px;border-bottom:1px solid var(--line,#e7e9f2);cursor:pointer}
            .chat-messages{flex:1;min-height:300px;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:9px}
            .chat-form{display:flex;align-items:center;gap:8px;min-width:0;padding:12px;border-top:1px solid var(--line,#e7e9f2)}
            .chat-form input[type="text"]{flex:1;min-width:0;width:100%}
            .chat-person{display:flex;align-items:center;gap:10px;width:100%;min-width:0;text-align:left}
            .chat-person>span:last-child{min-width:0;overflow:hidden}
            .chat-person strong,.chat-person small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
            .chat-person .avatar{flex:0 0 38px}
            .message{max-width:min(78%,440px);padding:10px 13px;border-radius:15px;overflow-wrap:anywhere;white-space:pre-wrap}
            .message.sent{align-self:flex-end}.message.received{align-self:flex-start}
            .message small{display:block;margin-top:4px;font-size:10px;opacity:.72}
            @media(max-width:720px){.chat-layout{grid-template-columns:minmax(0,1fr)!important;min-height:0}.chat-list{max-height:230px;border-right:0;border-bottom:1px solid var(--line,#e7e9f2)}.chat-window{min-height:calc(100dvh - 350px)}}
        `;
        document.head.append(chatStyle);

        const publicProfileStyle = document.createElement('style');
        publicProfileStyle.textContent = `
            .nexora-profile-dialog{position:fixed;inset:0;width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;border-radius:0;overflow:auto;background:var(--surface,#fff);color:var(--ink,#17212f)}
            .nexora-profile-dialog::backdrop{background:rgba(15,23,42,.58)}
            .nexora-profile-shell{width:min(980px,100%);min-height:100%;margin:0 auto;padding:16px clamp(16px,4vw,48px) 48px}
            .nexora-profile-toolbar{position:sticky;z-index:3;top:0;display:grid;grid-template-columns:44px 1fr 44px;align-items:center;gap:12px;min-height:58px;background:var(--surface,#fff);border-bottom:1px solid var(--line,#e7e9f2)}
            .nexora-profile-toolbar button{width:42px;height:42px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:28px;cursor:pointer}
            .nexora-profile-toolbar-title{text-align:center}.nexora-profile-content{padding:24px 0}
            .nexora-profile-top{display:flex;align-items:center;gap:18px;min-height:104px}.nexora-profile-avatar{flex:0 0 88px;width:88px;height:88px;font-size:24px}
            .nexora-profile-identity{min-width:0;flex:1}.nexora-profile-identity h1{margin:0 0 5px;font-size:clamp(24px,4vw,34px);overflow-wrap:anywhere}.nexora-profile-identity p{margin:0;color:var(--muted,#7b8196)}
            .nexora-profile-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.nexora-profile-bio{margin:14px 0 20px;white-space:pre-wrap;overflow-wrap:anywhere}
            .nexora-profile-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-block:1px solid var(--line,#e7e9f2);margin:14px 0 22px}
            .nexora-profile-stat{display:grid;gap:4px;padding:14px 6px;border:0;border-bottom:2px solid transparent;background:transparent;color:inherit;cursor:pointer}
            .nexora-profile-stat strong{font-size:22px}.nexora-profile-stat span{font-size:13px;color:var(--muted,#7b8196)}.nexora-profile-stat.active{border-bottom-color:var(--green,#6655e8)}
            .nexora-profile-section-title{margin:0 0 12px;font-size:18px}.nexora-profile-list{display:grid;gap:9px}.nexora-profile-person{display:flex;align-items:center;gap:12px;padding:10px 12px;border:1px solid var(--line,#e7e9f2);border-radius:14px}
            .nexora-profile-person>.avatar{flex:0 0 44px;width:44px;height:44px}.nexora-profile-person-info{display:grid;min-width:0;flex:1;gap:3px;padding:0;border:0;background:transparent;color:inherit;text-align:left;cursor:pointer}.nexora-profile-person-info strong,.nexora-profile-person-info small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.nexora-profile-person-info small{color:var(--muted,#7b8196)}
            .nexora-profile-person-follow{flex:0 0 auto}.nexora-profile-posts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.nexora-profile-post{min-width:0;min-height:130px;overflow:hidden;border:1px solid var(--line,#e7e9f2);border-radius:14px;background:rgba(102,85,232,.04)}.nexora-profile-post p{margin:0;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere}.nexora-profile-post-media{display:block;width:100%;max-height:420px;object-fit:cover}
            [data-theme="dark"] .nexora-profile-dialog{background:var(--surface,#1b1c2b);color:var(--ink,#f5f6fb)}[data-theme="dark"] .nexora-profile-toolbar{background:var(--surface,#1b1c2b)}
            @media(max-width:720px){.nexora-profile-shell{padding:8px 16px 30px}.nexora-profile-top{gap:12px;flex-wrap:wrap}.nexora-profile-avatar{flex-basis:68px;width:68px;height:68px}.nexora-profile-actions{width:100%;justify-content:stretch}.nexora-profile-actions button{flex:1}.nexora-profile-posts{grid-template-columns:repeat(2,minmax(0,1fr))}}
        `;
        document.head.append(publicProfileStyle);

        // Let existing account rows, post authors and the header avatar open the full-screen profile.
        document.addEventListener('click', event => {
            const profileButton = event.target.closest('[data-page="profile"], #profileAvatar, #sidebarAvatar, #headerAvatar');
            if (profileButton) {
                event.preventDefault();
                event.stopImmediatePropagation();
                if (currentAccount()?.username) openProfile(currentAccount().username);
                return;
            }
            const row = event.target.closest('.follow-user');
            if (row && !event.target.closest('.follow-toggle')) {
                const username = row.querySelector('.follow-toggle')?.dataset.username;
                if (username) { event.preventDefault(); event.stopImmediatePropagation(); openProfile(username); }
                return;
            }
            const postHead = event.target.closest('.post-head');
            if (postHead) {
                const handle = postHead.querySelector('.post-author small')?.textContent.match(/@([a-z0-9_.]+)/i)?.[1];
                if (handle) { event.preventDefault(); event.stopImmediatePropagation(); openProfile(handle); }
            }
        }, true);

        // Profile stats on the existing profile page open the corresponding distinct lists.
        document.getElementById('followerCount')?.parentElement?.addEventListener('click', () => currentAccount()?.username && openProfile(currentAccount().username, 'followers'));
        document.getElementById('followingCount')?.parentElement?.addEventListener('click', () => currentAccount()?.username && openProfile(currentAccount().username, 'following'));

        // Existing chat uses registered accounts and per-pair localStorage threads; prevent input/form collisions on narrow layouts.
        const logoutButton = document.getElementById('logoutButton');
        const logoutConfirm = document.getElementById('logoutConfirm');
        let logoutApproved = false;
        if (logoutButton && logoutConfirm) {
            const cancel = logoutConfirm.querySelector('[data-logout-cancel]');
            const confirm = logoutConfirm.querySelector('[data-logout-confirm]');
            logoutButton.addEventListener('click', event => {
                if (logoutApproved) { logoutApproved = false; return; }
                event.preventDefault();
                event.stopImmediatePropagation();
                logoutConfirm.hidden = false;
            }, true);
            cancel?.addEventListener('click', () => { logoutConfirm.hidden = true; });
            confirm?.addEventListener('click', () => {
                logoutConfirm.hidden = true;
                logoutApproved = true;
                logoutButton.click();
                document.getElementById('settingsPanel')?.close();
                history.replaceState(null, '', '#feed');
            });
            logoutConfirm.addEventListener('click', event => { if (event.target === logoutConfirm) logoutConfirm.hidden = true; });
        }

        window.addEventListener('storage', event => {
            if (event.key === 'nexoraAccounts' || event.key === 'nexoraPosts' || event.key?.startsWith('nexoraFollowing:')) {
                if (profileDialog.open && viewedUsername) renderProfile();
            }
        });
    });
})();

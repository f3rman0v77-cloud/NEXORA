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
        themeToggle?.addEventListener('click', () => {
            manuallySelected = true;
            applyTheme(root.dataset.theme !== 'dark');
        });

        const copy = {
            az: {
                yours: 'Hekayən', add: 'Hekayə əlavə et', expired: 'Hekayənin vaxtı bitib.', error: 'Hekayəni yadda saxlamaq mümkün olmadı.', size: 'Foto və ya video 2 MB-dan kiçik olmalıdır.', type: 'Yalnız foto və video əlavə etmək olar.',
                like: 'Bəyən', unlike: 'Bəyənməni geri götür', share: 'Kiməsə göndər', comment: 'Şərh yaz...', send: 'Göndər', noComments: 'Hələ şərh yoxdur.', sharePrompt: 'Göndərmək istədiyiniz istifadəçi adını yazın:', sent: 'Hekayə mesajla göndərildi.', noNext: 'Növbəti hekayə yoxdur.', close: 'Bağla', previous: 'Əvvəlki hekayə', next: 'Növbəti hekayə',
                confirmTitle: 'Hesabdan çıxmaq istədiyinizə əminsiniz?', confirmText: 'Çıxış etdikdən sonra yenidən daxil olmalı olacaqsınız.', cancel: 'Ləğv et', confirm: 'Bəli, çıxış et'
            },
            en: {
                yours: 'Your story', add: 'Add story', expired: 'This story has expired.', error: 'Could not save your story.', size: 'Photo or video must be under 2 MB.', type: 'Only photos and videos are supported.',
                like: 'Like', unlike: 'Unlike', share: 'Send to someone', comment: 'Write a comment...', send: 'Send', noComments: 'No comments yet.', sharePrompt: 'Enter the username to send this story to:', sent: 'Story sent in a message.', noNext: 'No more stories.', close: 'Close', previous: 'Previous story', next: 'Next story',
                confirmTitle: 'Are you sure you want to log out?', confirmText: 'You will need to sign in again after logging out.', cancel: 'Cancel', confirm: 'Yes, log out'
            },
            ru: {
                yours: 'Ваша история', add: 'Добавить историю', expired: 'Срок этой истории истёк.', error: 'Не удалось сохранить историю.', size: 'Фото или видео должны быть меньше 2 МБ.', type: 'Можно добавлять только фото и видео.',
                like: 'Нравится', unlike: 'Убрать отметку «Нравится»', share: 'Отправить кому-нибудь', comment: 'Напишите комментарий...', send: 'Отправить', noComments: 'Комментариев пока нет.', sharePrompt: 'Введите имя пользователя, которому хотите отправить историю:', sent: 'История отправлена в сообщении.', noNext: 'Больше нет историй.', close: 'Закрыть', previous: 'Предыдущая история', next: 'Следующая история',
                confirmTitle: 'Вы уверены, что хотите выйти из аккаунта?', confirmText: 'После выхода вам нужно будет войти снова.', cancel: 'Отмена', confirm: 'Да, выйти'
            },
            tr: {
                yours: 'Hikayen', add: 'Hikaye ekle', expired: 'Bu hikayenin süresi doldu.', error: 'Hikaye kaydedilemedi.', size: 'Fotoğraf veya video 2 MB altında olmalı.', type: 'Yalnızca fotoğraf ve video eklenebilir.',
                like: 'Beğen', unlike: 'Beğeniyi geri al', share: 'Birine gönder', comment: 'Yorum yaz...', send: 'Gönder', noComments: 'Henüz yorum yok.', sharePrompt: 'Hikayeyi göndermek istediğiniz kullanıcı adını yazın:', sent: 'Hikaye mesajla gönderildi.', noNext: 'Başka hikaye yok.', close: 'Kapat', previous: 'Önceki hikaye', next: 'Sonraki hikaye',
                confirmTitle: 'Çıkış yapmak istediğinizden emin misiniz?', confirmText: 'Çıkış yaptıktan sonra yeniden giriş yapmanız gerekecek.', cancel: 'Vazgeç', confirm: 'Evet, çıkış yap'
            }
        };
        const words = () => copy[localStorage.getItem('nexoraLanguage') || 'az'] || copy.az;
        const read = (key, fallback = []) => {
            try { return JSON.parse(localStorage.getItem(key)) || fallback; }
            catch { return fallback; }
        };
        const activeUser = () => read('nexoraActiveAccount', null);
        const allAccounts = () => read('nexoraAccounts', []);
        const storiesNow = () => {
            const stories = read('nexoraStories', []);
            const valid = stories.filter(item => item && item.created > Date.now() - 24 * 60 * 60 * 1000);
            if (valid.length !== stories.length) localStorage.setItem('nexoraStories', JSON.stringify(valid));
            return valid;
        };
        const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('az');
        const setAvatar = (node, account) => {
            node.textContent = account?.avatar ? '' : initials(account?.name);
            node.style.backgroundImage = account?.avatar ? `url("${account.avatar}")` : '';
        };
        const accountFor = username => allAccounts().find(item => item.username === username) || { username, name: username };

        const storyButton = document.getElementById('storyButton');
        const storyStrip = document.querySelector('.story-strip');
        if (storyButton && storyStrip) {
            const viewer = document.createElement('dialog');
            viewer.className = 'story-viewer';
            viewer.setAttribute('aria-label', 'Story viewer');
            viewer.innerHTML = `
                <div class="story-viewer-frame">
                    <div class="story-progress"><span></span></div>
                    <header class="story-viewer-header"><div class="story-viewer-author"><span class="avatar"></span><strong></strong></div><button class="story-viewer-close" type="button"></button></header>
                    <div class="story-viewer-content"></div>
                    <button class="story-viewer-prev" type="button"></button><button class="story-viewer-next" type="button"></button>
                    <div class="story-viewer-actions">
                        <button class="story-like" type="button"></button><button class="story-share" type="button"></button>
                        <form class="story-comment-form"><input maxlength="200" required><button type="submit"></button></form>
                    </div>
                    <div class="story-comments" aria-live="polite"></div>
                </div>`;
            document.body.append(viewer);
            let viewerStories = [];
            let viewerIndex = 0;
            let progressTimer;

            const finishStories = () => {
                clearTimeout(progressTimer);
                if (viewer.open) viewer.close();
                document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === 'feed'));
                document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === 'feed'));
                history.replaceState(null, '', '#feed');
                window.scrollTo({ top: 0, behavior: 'instant' });
            };
            const advance = () => {
                if (viewerIndex + 1 < viewerStories.length) {
                    viewerIndex += 1;
                    renderViewerStory();
                } else finishStories();
            };
            const renderViewerStory = () => {
                clearTimeout(progressTimer);
                const story = viewerStories[viewerIndex];
                if (!story) return finishStories();
                const user = accountFor(story.username);
                const author = viewer.querySelector('.story-viewer-author');
                setAvatar(author.querySelector('.avatar'), user);
                author.querySelector('strong').textContent = user.name || `@${story.username}`;
                const mediaBox = viewer.querySelector('.story-viewer-content');
                mediaBox.replaceChildren();
                const media = document.createElement(story.mediaType === 'video' ? 'video' : 'img');
                media.src = story.media;
                if (media.tagName === 'VIDEO') { media.controls = true; media.autoplay = true; media.muted = true; media.playsInline = true; }
                else media.alt = `${user.name || story.username} story`;
                mediaBox.append(media);

                const labels = words();
                const likeButton = viewer.querySelector('.story-like');
                story.likes ||= [];
                const liked = story.likes.includes(activeUser()?.username);
                likeButton.textContent = `${liked ? '♥' : '♡'} ${story.likes.length}`;
                likeButton.setAttribute('aria-label', liked ? labels.unlike : labels.like);
                likeButton.classList.toggle('liked', liked);
                viewer.querySelector('.story-share').textContent = `↗ ${labels.share}`;
                viewer.querySelector('.story-viewer-close').textContent = '×';
                viewer.querySelector('.story-viewer-close').setAttribute('aria-label', labels.close);
                viewer.querySelector('.story-viewer-prev').textContent = '‹';
                viewer.querySelector('.story-viewer-prev').setAttribute('aria-label', labels.previous);
                viewer.querySelector('.story-viewer-next').textContent = '›';
                viewer.querySelector('.story-viewer-next').setAttribute('aria-label', labels.next);
                const input = viewer.querySelector('.story-comment-form input');
                input.placeholder = labels.comment;
                viewer.querySelector('.story-comment-form button').textContent = labels.send;
                const commentsBox = viewer.querySelector('.story-comments');
                commentsBox.replaceChildren();
                const comments = story.comments || [];
                if (!comments.length) commentsBox.textContent = labels.noComments;
                comments.slice(-3).forEach(comment => {
                    const line = document.createElement('p');
                    const name = document.createElement('strong');
                    name.textContent = `${accountFor(comment.username).name}: `;
                    line.append(name, document.createTextNode(comment.text));
                    commentsBox.append(line);
                });
                const progress = viewer.querySelector('.story-progress span');
                progress.style.animation = 'none';
                void progress.offsetWidth;
                progress.style.animation = 'story-progress 8s linear forwards';
                progressTimer = setTimeout(advance, 8000);
            };
            const openStories = (stories, startIndex = 0) => {
                if (!stories.length) return;
                viewerStories = stories;
                viewerIndex = startIndex;
                renderViewerStory();
                viewer.showModal();
            };
            const visibleStories = () => {
                const user = activeUser();
                if (!user?.username) return [];
                const following = read(`nexoraFollowing:${user.username}`, []);
                const stories = storiesNow();
                const orderedUsers = [user.username, ...allAccounts().filter(account => following.includes(account.username)).map(account => account.username)];
                return orderedUsers.flatMap(username => stories.filter(story => story.username === username).sort((a, b) => a.created - b.created));
            };
            const renderStories = () => {
                const user = activeUser();
                storyStrip.replaceChildren(storyButton);
                if (!user?.username) return;
                const all = storiesNow();
                const following = read(`nexoraFollowing:${user.username}`, []);
                const mine = all.filter(item => item.username === user.username).sort((a, b) => a.created - b.created);
                storyButton.classList.toggle('has-story', mine.length > 0);
                storyButton.setAttribute('aria-label', mine.length ? `${words().yours} — ${mine.length}` : words().add);
                const ownLabel = storyButton.querySelector('small');
                if (ownLabel) ownLabel.textContent = mine.length ? words().yours : words().add;
                allAccounts().filter(account => following.includes(account.username)).forEach(account => {
                    const theirStories = all.filter(item => item.username === account.username).sort((a, b) => a.created - b.created);
                    if (!theirStories.length) return;
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.className = 'story followed-story';
                    button.setAttribute('aria-label', `${account.name} — ${theirStories.length}`);
                    const ring = document.createElement('span');
                    ring.className = 'story-ring';
                    const avatar = document.createElement('span');
                    avatar.className = 'story-avatar';
                    setAvatar(avatar, account);
                    ring.append(avatar);
                    const name = document.createElement('small');
                    name.textContent = account.name || `@${account.username}`;
                    button.append(ring, name);
                    button.addEventListener('click', () => {
                        const sequence = visibleStories();
                        const first = sequence.findIndex(item => item.id === theirStories[0].id);
                        openStories(sequence, Math.max(first, 0));
                    });
                    storyStrip.append(button);
                });
            };
            const uploadStory = () => {
                const user = activeUser();
                if (!user?.username) return;
                const picker = document.createElement('input');
                picker.type = 'file';
                picker.accept = 'image/*,video/*';
                picker.hidden = true;
                picker.addEventListener('change', () => {
                    const file = picker.files?.[0];
                    picker.remove();
                    if (!file) return;
                    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { alert(words().type); return; }
                    if (file.size > 2 * 1024 * 1024) { alert(words().size); return; }
                    const reader = new FileReader();
                    reader.onload = () => {
                        const stories = storiesNow();
                        stories.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, username: user.username, media: String(reader.result), mediaType: file.type.startsWith('video/') ? 'video' : 'image', created: Date.now(), likes: [], comments: [] });
                        try { localStorage.setItem('nexoraStories', JSON.stringify(stories)); renderStories(); }
                        catch { alert(words().error); }
                    };
                    reader.onerror = () => alert(words().error);
                    reader.readAsDataURL(file);
                }, { once: true });
                document.body.append(picker);
                picker.click();
            };

            storyButton.addEventListener('click', event => {
                event.preventDefault();
                event.stopImmediatePropagation();
                const user = activeUser();
                if (!user?.username) return;
                const own = storiesNow().filter(story => story.username === user.username).sort((a, b) => a.created - b.created);
                if (own.length) {
                    const sequence = visibleStories();
                    const first = sequence.findIndex(item => item.id === own[0].id);
                    openStories(sequence, Math.max(first, 0));
                } else uploadStory();
            }, true);

            viewer.querySelector('.story-viewer-close').addEventListener('click', finishStories);
            viewer.querySelector('.story-viewer-next').addEventListener('click', advance);
            viewer.querySelector('.story-viewer-prev').addEventListener('click', () => {
                if (viewerIndex > 0) { viewerIndex -= 1; renderViewerStory(); }
                else finishStories();
            });
            viewer.querySelector('.story-viewer-content').addEventListener('click', event => {
                if (event.target.closest('video')) return;
                advance();
            });
            viewer.querySelector('.story-like').addEventListener('click', () => {
                const user = activeUser();
                const story = viewerStories[viewerIndex];
                if (!user?.username || !story) return;
                const stories = storiesNow();
                const stored = stories.find(item => item.id === story.id);
                if (!stored) return;
                stored.likes ||= [];
                stored.likes = stored.likes.includes(user.username) ? stored.likes.filter(name => name !== user.username) : [...stored.likes, user.username];
                localStorage.setItem('nexoraStories', JSON.stringify(stories));
                story.likes = stored.likes;
                renderViewerStory();
            });
            viewer.querySelector('.story-comment-form').addEventListener('submit', event => {
                event.preventDefault();
                const user = activeUser();
                const story = viewerStories[viewerIndex];
                const input = viewer.querySelector('.story-comment-form input');
                const text = input.value.trim();
                if (!user?.username || !story || !text) return;
                const stories = storiesNow();
                const stored = stories.find(item => item.id === story.id);
                if (!stored) return;
                stored.comments ||= [];
                stored.comments.push({ username: user.username, text, created: Date.now() });
                localStorage.setItem('nexoraStories', JSON.stringify(stories));
                story.comments = stored.comments;
                input.value = '';
                renderViewerStory();
            });
            viewer.querySelector('.story-share').addEventListener('click', () => {
                const user = activeUser();
                const story = viewerStories[viewerIndex];
                if (!user?.username || !story) return;
                const targetName = (window.prompt(words().sharePrompt) || '').trim().replace(/^@/, '').toLocaleLowerCase('az');
                if (!targetName) return;
                const target = allAccounts().find(account => account.username === targetName && account.username !== user.username);
                if (!target) { alert(words().noNext); return; }
                const key = `nexoraChat:${[user.username, target.username].sort().join('::')}`;
                const thread = read(key, []);
                thread.push({ from: user.username, text: `Story: @${story.username}`, media: story.media, created: Date.now() });
                try {
                    localStorage.setItem(key, JSON.stringify(thread));
                    alert(words().sent);
                } catch { alert(words().error); }
            });
            viewer.addEventListener('click', event => { if (event.target === viewer) finishStories(); });
            viewer.addEventListener('close', () => clearTimeout(progressTimer));
            renderStories();
            window.addEventListener('storage', event => {
                if (event.key === 'nexoraStories' || event.key === 'nexoraAccounts' || event.key?.startsWith('nexoraFollowing:') || event.key === 'nexoraActiveAccount') renderStories();
            });
            window.addEventListener('focus', renderStories);

            const storyStyle = document.createElement('style');
            storyStyle.textContent = `
                .story-strip{display:flex;gap:14px;align-items:flex-start;overflow-x:auto;padding:14px}
                .story-strip>.story{display:flex;flex:0 0 68px;flex-direction:column;align-items:center;border:0;background:transparent;cursor:pointer}
                .story-ring{display:grid;width:58px;height:58px;padding:3px;place-items:center;border-radius:50%;background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff)}
                .story-ring.add-ring{box-sizing:border-box;border:2px dashed #8b82ad;background:transparent;color:#6655e8;font-size:26px}
                .story-avatar{display:grid;width:100%;height:100%;place-items:center;border:2px solid #fff;border-radius:50%;background-color:#6655e8;background-position:center;background-size:cover;color:#fff;font-size:17px;font-weight:800}
                .story-strip .story small{display:block;max-width:76px;margin-top:6px;overflow:hidden;color:var(--ink,#17212f);font-size:11px;text-align:center;text-overflow:ellipsis;white-space:nowrap}
                .story-strip .story.has-story .add-ring{border:0;background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff);color:#fff}
                .story-viewer{width:min(430px,calc(100% - 24px));height:min(780px,calc(100% - 24px));max-height:calc(100% - 24px);padding:0;overflow:hidden;border:0;border-radius:20px;background:#101018;color:#fff}
                .story-viewer::backdrop{background:rgba(8,8,16,.78);backdrop-filter:blur(5px)}
                .story-viewer-frame{position:relative;display:flex;width:100%;height:100%;flex-direction:column}
                .story-progress{position:absolute;z-index:3;top:8px;right:12px;left:12px;height:3px;overflow:hidden;border-radius:4px;background:#ffffff55}
                .story-progress span{display:block;width:100%;height:100%;transform-origin:left;background:#fff}
                @keyframes story-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}
                .story-viewer-header{position:absolute;z-index:2;top:12px;right:0;left:0;display:flex;align-items:center;justify-content:space-between;padding:18px;background:linear-gradient(#0008,transparent)}
                .story-viewer-author{display:flex;align-items:center;gap:10px}
                .story-viewer-author .avatar{display:grid;width:36px;height:36px;place-items:center;border:2px solid #fff;border-radius:50%;background-color:#6655e8;background-position:center;background-size:cover;color:#fff;font-weight:800}
                .story-viewer-close{width:38px;height:38px;border:0;border-radius:50%;background:#0006;color:#fff;font-size:28px;cursor:pointer}
                .story-viewer-content{display:grid;width:100%;height:100%;place-items:center}
                .story-viewer-content img,.story-viewer-content video{width:100%;height:100%;object-fit:contain}
                .story-viewer-prev,.story-viewer-next{position:absolute;z-index:2;top:46%;width:42px;height:54px;transform:translateY(-50%);border:0;border-radius:12px;background:#0005;color:#fff;font-size:36px;cursor:pointer}
                .story-viewer-prev{left:8px}.story-viewer-next{right:8px}
                .story-viewer-actions{position:absolute;right:14px;bottom:14px;left:14px;display:flex;align-items:center;gap:8px}
                .story-viewer-actions button{min-height:42px;border:1px solid #ffffff80;border-radius:24px;background:#1119;color:#fff;font:inherit;padding:8px 12px;cursor:pointer}
                .story-viewer-actions .story-like.liked{color:#ff557a}
                .story-comment-form{display:flex;flex:1;gap:6px;min-width:0}
                .story-comment-form input{width:100%;min-width:0;border:1px solid #ffffff80;border-radius:24px;background:#1119;color:white;padding:10px 12px;font:inherit}
                .story-comments{position:absolute;right:16px;bottom:66px;left:16px;max-height:90px;overflow:auto;color:white;font-size:12px;text-shadow:0 1px 5px #000}
                .story-comments p{margin:4px 0}
                [data-theme="dark"] .story-strip .story small{color:#f5f6fb}
                @media(max-width:420px){.story-viewer{width:100%;height:100%;max-height:100%;border-radius:0}.story-viewer-actions{gap:5px}.story-viewer-actions button{padding:7px 9px}}
            `;
            document.head.append(storyStyle);
        }

        const logoutButton = document.getElementById('logoutButton');
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsMenu = document.querySelector('.settings-view[data-view="menu"]');
        if (logoutButton && settingsMenu) {
            logoutButton.classList.add('settings-logout-button');
            logoutButton.remove();
            settingsMenu.appendChild(logoutButton);
            const confirmation = document.createElement('dialog');
            confirmation.className = 'logout-confirmation';
            confirmation.setAttribute('aria-labelledby', 'logoutConfirmationTitle');
            confirmation.setAttribute('aria-describedby', 'logoutConfirmationText');
            confirmation.innerHTML = '<div class="logout-confirmation-content"><span class="logout-confirmation-icon" aria-hidden="true">↪</span><h2 id="logoutConfirmationTitle"></h2><p id="logoutConfirmationText"></p><div class="logout-confirmation-actions"><button class="logout-cancel" type="button"></button><button class="logout-confirm" type="button"></button></div></div>';
            document.body.append(confirmation);
            const updateConfirmationLanguage = () => {
                const labels = words();
                confirmation.querySelector('#logoutConfirmationTitle').textContent = labels.confirmTitle;
                confirmation.querySelector('#logoutConfirmationText').textContent = labels.confirmText;
                confirmation.querySelector('.logout-cancel').textContent = labels.cancel;
                confirmation.querySelector('.logout-confirm').textContent = labels.confirm;
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
            confirmation.querySelector('.logout-confirm').addEventListener('click', () => {
                confirmation.close();
                confirmedLogout = true;
                logoutButton.click();
                settingsPanel?.close();
                document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === 'feed'));
                document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === 'feed'));
                history.replaceState(null, '', '#feed');
                window.scrollTo({ top: 0, behavior: 'instant' });
            });
            confirmation.addEventListener('click', event => { if (event.target === confirmation) confirmation.close(); });
        }

        const style = document.createElement('style');
        style.textContent = `
            .settings-view[data-view="menu"]>.logout-button.settings-logout-button{display:block;width:100%;min-height:48px;margin-top:16px;padding:13px 18px;border:1px solid #fca5a5;border-radius:14px;background:#fff1f2;color:#dc2626;font:inherit;font-size:14px;font-weight:800;text-align:left;cursor:pointer}
            .settings-view[data-view="menu"]>.logout-button.settings-logout-button:hover{border-color:#ef4444;background:#fee2e2;color:#b91c1c}
            .settings-view[data-view="menu"]>.logout-button.settings-logout-button:focus-visible{outline:2px solid #dc2626;outline-offset:3px}
            .logout-confirmation{width:min(420px,calc(100% - 32px));padding:0;overflow:hidden;border:1px solid #e9edf2;border-radius:20px;background:#fff;color:#17212f;box-shadow:0 24px 80px #1218283d;font-family:inherit}
            .logout-confirmation::backdrop{background:#0f172a8c;backdrop-filter:blur(3px)}
            .logout-confirmation-content{padding:28px;text-align:center}.logout-confirmation-icon{display:grid;width:52px;height:52px;margin:0 auto 16px;place-items:center;border-radius:16px;background:#fff1f2;color:#dc2626;font-size:26px;font-weight:800}
            .logout-confirmation h2{margin:0;font-size:20px;line-height:1.35}.logout-confirmation p{margin:10px 0 24px;color:#7d8998;font-size:14px;line-height:1.6}
            .logout-confirmation-actions{display:flex;gap:10px}.logout-confirmation-actions button{flex:1;min-height:46px;padding:10px 14px;border:1px solid #e9edf2;border-radius:12px;background:#fff;color:#17212f;font:inherit;font-weight:700;cursor:pointer}
            .logout-confirmation-actions .logout-confirm{border-color:#dc2626;background:#dc2626;color:#fff}.logout-confirmation-actions button:focus-visible{outline:2px solid #201a50;outline-offset:3px}
            [data-theme="dark"] .settings-view[data-view="menu"]>.logout-button.settings-logout-button{border-color:#7f1d1d;background:#3a1a1d;color:#fda4af}
            [data-theme="dark"] .logout-confirmation{border-color:#35364a;background:#1b1c2b;color:#f5f6fb}[data-theme="dark"] .logout-confirmation p{color:#a8adbf}
            [data-theme="dark"] .logout-confirmation-actions button{border-color:#3d3f53;background:#242538;color:#f5f6fb}[data-theme="dark"] .logout-confirmation-actions .logout-confirm{border-color:#dc2626;background:#dc2626;color:#fff}
            @media(max-width:420px){.logout-confirmation-content{padding:24px 20px}.logout-confirmation-actions{flex-direction:column-reverse}}
        `;
        document.head.append(style);
    });
})();

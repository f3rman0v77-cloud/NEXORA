(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let manuallySelected = false;
    const translations = {
        az: { yours:'Hekayən', add:'Hekayə əlavə et', type:'Yalnız foto və video əlavə etmək olar.', size:'Foto və ya video 2 MB-dan kiçik olmalıdır.', error:'Əməliyyatı tamamlamaq mümkün olmadı.', like:'Bəyən', unlike:'Bəyənməni geri götür', share:'Kiməsə göndər', comment:'Şərh yaz...', send:'Göndər', noComments:'Hələ şərh yoxdur.', sharePrompt:'Göndərmək istədiyiniz istifadəçi adını yazın:', sent:'Hekayə mesajla göndərildi.', close:'Bağla', previous:'Əvvəlki hekayə', next:'Növbəti hekayə', title:'Hesabdan çıxmaq istədiyinizə əminsiniz?', logoutText:'Çıxış etdikdən sonra yenidən daxil olmalı olacaqsınız.', cancel:'Ləğv et', confirm:'Bəli, çıxış et', minPassword:'Şifrə ən azı 8 simvol olmalıdır.', followers:'İzləyicilər', following:'İzlədikləri', posts:'Paylaşımlar', follow:'İzlə', unfollow:'İzləməni dayandır', noUsers:'Hələ istifadəçi yoxdur.', privateDemo:'Demo: profillər bu brauzerdəki hesablar üçün görünür.' },
        en: { yours:'Your story', add:'Add story', type:'Only photos and videos are supported.', size:'Photo or video must be under 2 MB.', error:'Could not complete the action.', like:'Like', unlike:'Unlike', share:'Send to someone', comment:'Write a comment...', send:'Send', noComments:'No comments yet.', sharePrompt:'Enter the username to send this story to:', sent:'Story sent in a message.', close:'Close', previous:'Previous story', next:'Next story', title:'Are you sure you want to log out?', logoutText:'You will need to sign in again after logging out.', cancel:'Cancel', confirm:'Yes, log out', minPassword:'Password must be at least 8 characters.', followers:'Followers', following:'Following', posts:'Posts', follow:'Follow', unfollow:'Unfollow', noUsers:'No users yet.', privateDemo:'Demo: profiles are shown for accounts in this browser.' },
        ru: { yours:'Ваша история', add:'Добавить историю', type:'Можно добавлять только фото и видео.', size:'Фото или видео должны быть меньше 2 МБ.', error:'Не удалось выполнить действие.', like:'Нравится', unlike:'Убрать отметку «Нравится»', share:'Отправить кому-нибудь', comment:'Напишите комментарий...', send:'Отправить', noComments:'Комментариев пока нет.', sharePrompt:'Введите имя пользователя, которому хотите отправить историю:', sent:'История отправлена в сообщении.', close:'Закрыть', previous:'Предыдущая история', next:'Следующая история', title:'Вы уверены, что хотите выйти из аккаунта?', logoutText:'После выхода вам нужно будет войти снова.', cancel:'Отмена', confirm:'Да, выйти', minPassword:'Пароль должен содержать не менее 8 символов.', followers:'Подписчики', following:'Подписки', posts:'Публикации', follow:'Подписаться', unfollow:'Отписаться', noUsers:'Пользователей пока нет.', privateDemo:'Демо: здесь показаны аккаунты из этого браузера.' },
        tr: { yours:'Hikayen', add:'Hikaye ekle', type:'Yalnızca fotoğraf ve video eklenebilir.', size:'Fotoğraf veya video 2 MB altında olmalı.', error:'İşlem tamamlanamadı.', like:'Beğen', unlike:'Beğeniyi geri al', share:'Birine gönder', comment:'Yorum yaz...', send:'Gönder', noComments:'Henüz yorum yok.', sharePrompt:'Hikayeyi göndermek istediğiniz kullanıcı adını yazın:', sent:'Hikaye mesajla gönderildi.', close:'Kapat', previous:'Önceki hikaye', next:'Sonraki hikaye', title:'Çıkış yapmak istediğinizden emin misiniz?', logoutText:'Çıkış yaptıktan sonra yeniden giriş yapmanız gerekecek.', cancel:'Vazgeç', confirm:'Evet, çıkış yap', minPassword:'Şifre en az 8 karakter olmalıdır.', followers:'Takipçiler', following:'Takip ettikleri', posts:'Gönderiler', follow:'Takip et', unfollow:'Takibi bırak', noUsers:'Henüz kullanıcı yok.', privateDemo:'Demo: profiller bu tarayıcıdaki hesaplar için gösterilir.' }
    };
    const words = () => translations[localStorage.getItem('nexoraLanguage') || 'az'] || translations.az;
    const read = (key, fallback = []) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
    const me = () => read('nexoraActiveAccount', null);
    const accounts = () => read('nexoraAccounts', []);
    const following = username => read(`nexoraFollowing:${username}`, []);
    const stories = () => {
        const all = read('nexoraStories', []);
        const valid = all.filter(item => item && item.created > Date.now() - 86400000);
        if (all.length !== valid.length) localStorage.setItem('nexoraStories', JSON.stringify(valid));
        return valid;
    };
    const initials = name => (name || '?').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('az');
    const setAvatar = (node, account) => {
        node.textContent = account?.avatar ? '' : initials(account?.name);
        node.style.backgroundImage = account?.avatar ? `url("${account.avatar}")` : '';
        node.style.backgroundPosition = 'center';
        node.style.backgroundSize = 'cover';
    };
    const safeText = (tag, text, className) => { const el = document.createElement(tag); el.textContent = text; if (className) el.className = className; return el; };

    function applyTheme(dark) {
        root.dataset.theme = dark ? 'dark' : 'light';
        const button = document.getElementById('themeToggle');
        if (button) { button.setAttribute('aria-pressed', String(dark)); button.title = dark ? 'Açıq rejimə keç' : 'Tünd rejimə keç'; }
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#141522' : '#f2f4fb');
    }
    applyTheme(systemTheme.matches);
    systemTheme.addEventListener('change', event => { if (!manuallySelected) applyTheme(event.matches); });

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(root.dataset.theme === 'dark');
        document.getElementById('themeToggle')?.addEventListener('click', () => { manuallySelected = true; applyTheme(root.dataset.theme !== 'dark'); });

        // New registrations and password changes require 8 characters; legacy accounts can still sign in.
        const passwordInput = document.getElementById('authPassword');
        if (passwordInput) { passwordInput.minLength = 8; passwordInput.placeholder = 'Ən azı 8 simvol'; }
        ['newPassword', 'confirmPassword'].forEach(id => { const input = document.getElementById(id); if (input) { input.minLength = 8; input.placeholder = 'Ən azı 8 simvol'; } });
        const authForm = document.getElementById('authForm');
        authForm?.addEventListener('submit', event => {
            const registering = document.querySelector('.auth-tab.active')?.dataset.authMode === 'register';
            if (registering && passwordInput.value.length < 8) {
                event.preventDefault(); event.stopImmediatePropagation();
                document.getElementById('authMessage').textContent = words().minPassword;
            }
        }, true);
        document.getElementById('passwordForm')?.addEventListener('submit', event => {
            const next = document.getElementById('newPassword');
            if (next.value.length < 8) {
                event.preventDefault(); event.stopImmediatePropagation();
                document.getElementById('passwordMessage').textContent = words().minPassword;
            }
        }, true);

        const profileDialog = document.createElement('dialog');
        profileDialog.className = 'public-profile-dialog';
        profileDialog.innerHTML = '<div class="public-profile-shell"><button class="public-profile-close" type="button" aria-label="Close">×</button><div class="public-profile-body"></div></div>';
        document.body.append(profileDialog);
        const profileBody = profileDialog.querySelector('.public-profile-body');
        const renderPublicProfile = (username, section = 'profile') => {
            const account = accounts().find(item => item.username === username);
            const viewer = me();
            if (!account || !viewer) return;
            const allAccounts = accounts();
            const followers = allAccounts.filter(item => following(item.username).includes(username));
            const follows = following(username).map(name => allAccounts.find(item => item.username === name)).filter(Boolean);
            const posts = read('nexoraPosts', []).filter(post => post.username === username).sort((a, b) => b.created - a.created);
            const ownFollowing = following(viewer.username);
            profileBody.replaceChildren();
            const header = document.createElement('header'); header.className = 'public-profile-header';
            const avatar = document.createElement('span'); avatar.className = 'avatar public-profile-avatar'; setAvatar(avatar, account);
            const identity = document.createElement('div'); identity.append(safeText('h2', account.name || username), safeText('p', `@${username}`));
            header.append(avatar, identity);
            if (username !== viewer.username) {
                const followButton = safeText('button', ownFollowing.includes(username) ? words().unfollow : words().follow, 'outline-button public-follow-button');
                followButton.type = 'button';
                followButton.addEventListener('click', () => {
                    const latest = following(viewer.username);
                    const next = latest.includes(username) ? latest.filter(name => name !== username) : [...latest, username];
                    localStorage.setItem(`nexoraFollowing:${viewer.username}`, JSON.stringify(next));
                    renderPublicProfile(username, section);
                    window.dispatchEvent(new StorageEvent('storage', { key: `nexoraFollowing:${viewer.username}` }));
                });
                header.append(followButton);
            }
            profileBody.append(header);
            if (account.bio) profileBody.append(safeText('p', account.bio, 'public-profile-bio'));
            const stats = document.createElement('div'); stats.className = 'public-profile-stats';
            const statButton = (label, count, target) => {
                const button = safeText('button', '', 'public-profile-stat');
                button.append(safeText('strong', String(count)), safeText('span', label));
                button.addEventListener('click', () => renderPublicProfile(username, target));
                return button;
            };
            stats.append(statButton(words().posts, posts.length, 'posts'), statButton(words().followers, followers.length, 'followers'), statButton(words().following, follows.length, 'following'));
            profileBody.append(stats, safeText('p', words().privateDemo, 'public-profile-note'));
            if (section === 'followers' || section === 'following') {
                profileBody.append(safeText('h3', section === 'followers' ? words().followers : words().following));
                const list = section === 'followers' ? followers : follows;
                if (!list.length) profileBody.append(safeText('p', words().noUsers, 'empty-state'));
                list.forEach(user => {
                    const row = document.createElement('button'); row.type = 'button'; row.className = 'public-profile-user';
                    const userAvatar = document.createElement('span'); userAvatar.className = 'avatar'; setAvatar(userAvatar, user);
                    row.append(userAvatar, safeText('span', `${user.name || user.username} · @${user.username}`));
                    row.addEventListener('click', () => renderPublicProfile(user.username));
                    profileBody.append(row);
                });
                const back = safeText('button', '←', 'outline-button public-profile-back'); back.type = 'button'; back.addEventListener('click', () => renderPublicProfile(username)); profileBody.append(back);
            } else {
                profileBody.append(safeText('h3', words().posts));
                if (!posts.length) profileBody.append(safeText('p', 'Hələ paylaşım yoxdur.', 'empty-state'));
                posts.forEach(post => {
                    const card = document.createElement('article'); card.className = 'public-profile-post';
                    if (post.text) card.append(safeText('p', post.text));
                    if (post.media) {
                        const media = document.createElement(post.media.startsWith('data:video/') ? 'video' : 'img');
                        media.src = post.media; media.className = 'public-profile-media';
                        if (media.tagName === 'VIDEO') { media.controls = true; media.playsInline = true; } else media.alt = 'Post media';
                        card.append(media);
                    }
                    profileBody.append(card);
                });
            }
        };
        const openPublicProfile = username => {
            if (!me() || !accounts().some(item => item.username === username)) return;
            renderPublicProfile(username);
            profileDialog.showModal();
        };
        profileDialog.querySelector('.public-profile-close').addEventListener('click', () => profileDialog.close());
        profileDialog.addEventListener('click', event => { if (event.target === profileDialog) profileDialog.close(); });
        document.addEventListener('click', event => {
            if (event.target.closest('.follow-toggle')) return;
            if (event.target.closest('#followerCount')) { const user = me(); if (user) openPublicProfile(user.username), renderPublicProfile(user.username, 'followers'), profileDialog.showModal(); return; }
            if (event.target.closest('#followingCount')) { const user = me(); if (user) renderPublicProfile(user.username, 'following'), profileDialog.showModal(); return; }
            const row = event.target.closest('.follow-user');
            if (row && !event.target.closest('button')) { const username = row.querySelector('.follow-toggle')?.dataset.username; if (username) openPublicProfile(username); return; }
            const author = event.target.closest('.post-author, .post-head .avatar');
            if (author) { const handle = author.closest('.post-head')?.querySelector('.post-author small')?.textContent.match(/@([a-z0-9_.]+)/i)?.[1]; if (handle) openPublicProfile(handle); }
        });
        window.addEventListener('storage', event => { if (event.key === 'nexoraAccounts' || event.key?.startsWith('nexoraFollowing:') || event.key === 'nexoraPosts') { if (profileDialog.open) { const username = profileBody.querySelector('.public-profile-header p')?.textContent.replace(/^@/, ''); if (username) renderPublicProfile(username); } } });

        const storyButton = document.getElementById('storyButton');
        const storyStrip = document.querySelector('.story-strip');
        if (storyButton && storyStrip) {
            const viewer = document.createElement('dialog'); viewer.className = 'story-viewer';
            viewer.innerHTML = '<div class="story-viewer-frame"><div class="story-progress"><span></span></div><header class="story-viewer-header"><div class="story-viewer-author"><span class="avatar"></span><strong></strong></div><button class="story-viewer-close" type="button"></button></header><div class="story-viewer-content"></div><button class="story-viewer-prev" type="button"></button><button class="story-viewer-next" type="button"></button><div class="story-viewer-actions"><button class="story-like" type="button"></button><button class="story-share" type="button"></button><form class="story-comment-form"><input maxlength="200" required><button type="submit"></button></form></div><div class="story-comments"></div></div>';
            document.body.append(viewer);
            let list = [], index = 0, timer;
            const finish = () => { clearTimeout(timer); if (viewer.open) viewer.close(); document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === 'feed')); document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === 'feed')); history.replaceState(null, '', '#feed'); window.scrollTo({ top: 0, behavior: 'instant' }); };
            const render = () => {
                clearTimeout(timer); const story = list[index]; if (!story) return finish();
                const account = accounts().find(item => item.username === story.username) || { name: story.username };
                const author = viewer.querySelector('.story-viewer-author'); setAvatar(author.querySelector('.avatar'), account); author.querySelector('strong').textContent = account.name;
                const mediaBox = viewer.querySelector('.story-viewer-content'); mediaBox.replaceChildren(); const media = document.createElement(story.mediaType === 'video' ? 'video' : 'img'); media.src = story.media;
                if (media.tagName === 'VIDEO') { media.controls = true; media.autoplay = true; media.muted = true; media.playsInline = true; } else media.alt = 'Story'; mediaBox.append(media);
                const w = words(); story.likes ||= []; const liked = story.likes.includes(me()?.username); const like = viewer.querySelector('.story-like'); like.textContent = `${liked ? '♥' : '♡'} ${story.likes.length}`; like.setAttribute('aria-label', liked ? w.unlike : w.like); like.classList.toggle('liked', liked);
                viewer.querySelector('.story-share').textContent = `↗ ${w.share}`; const close = viewer.querySelector('.story-viewer-close'); close.textContent = '×'; close.setAttribute('aria-label', w.close);
                const prev = viewer.querySelector('.story-viewer-prev'); prev.textContent = '‹'; prev.setAttribute('aria-label', w.previous); const next = viewer.querySelector('.story-viewer-next'); next.textContent = '›'; next.setAttribute('aria-label', w.next);
                const input = viewer.querySelector('.story-comment-form input'); input.placeholder = w.comment; viewer.querySelector('.story-comment-form button').textContent = w.send;
                const comments = viewer.querySelector('.story-comments'); comments.replaceChildren(); (story.comments || []).slice(-3).forEach(item => comments.append(safeText('p', `${accounts().find(a => a.username === item.username)?.name || item.username}: ${item.text}`)));
                const bar = viewer.querySelector('.story-progress span'); bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = 'story-progress 8s linear forwards'; timer = setTimeout(advance, 8000);
            };
            function advance() { if (index + 1 < list.length) { index++; render(); } else finish(); }
            const mineAndFollowing = () => { const user = me(); if (!user) return []; const follow = following(user.username); return [user.username, ...accounts().filter(a => follow.includes(a.username)).map(a => a.username)].flatMap(name => stories().filter(s => s.username === name).sort((a,b) => a.created-b.created)); };
            const openStories = (items, at = 0) => { if (!items.length) return; list = items; index = at; render(); viewer.showModal(); };
            const upload = () => { if (!me()) return; const picker = document.createElement('input'); picker.type = 'file'; picker.accept = 'image/*,video/*'; picker.hidden = true; picker.onchange = () => { const file = picker.files?.[0]; picker.remove(); if (!file) return; if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return alert(words().type); if (file.size > 2*1024*1024) return alert(words().size); const reader = new FileReader(); reader.onload = () => { const all = stories(); all.push({ id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`, username:me().username, media:String(reader.result), mediaType:file.type.startsWith('video/')?'video':'image', created:Date.now(), likes:[], comments:[] }); try { localStorage.setItem('nexoraStories', JSON.stringify(all)); renderStories(); } catch { alert(words().error); } }; reader.onerror = () => alert(words().error); reader.readAsDataURL(file); }; document.body.append(picker); picker.click(); };
            const renderStories = () => { storyStrip.replaceChildren(storyButton); const user = me(); if (!user) return; const all = stories(), own = all.filter(s => s.username === user.username), follow = following(user.username); storyButton.querySelector('small').textContent = own.length ? words().yours : words().add; storyButton.classList.toggle('has-story', !!own.length); storyButton.onclick = event => { event.preventDefault(); event.stopImmediatePropagation(); if (own.length) { const allVisible = mineAndFollowing(); openStories(allVisible, Math.max(0, allVisible.findIndex(s => s.id === own[0].id))); } else upload(); }; accounts().filter(a => follow.includes(a.username)).forEach(account => { const userStories = all.filter(s => s.username === account.username); if (!userStories.length) return; const button = document.createElement('button'); button.type = 'button'; button.className = 'story followed-story'; const ring = document.createElement('span'); ring.className = 'story-ring'; const avatar = document.createElement('span'); avatar.className = 'story-avatar'; setAvatar(avatar, account); ring.append(avatar); button.append(ring, safeText('small', account.name)); button.onclick = () => { const sequence = mineAndFollowing(); openStories(sequence, Math.max(0, sequence.findIndex(s => s.id === userStories[0].id))); }; storyStrip.append(button); }); };
            storyButton.addEventListener('click', event => { event.preventDefault(); event.stopImmediatePropagation(); if (!me()) return; const own = stories().filter(s => s.username === me().username); if (own.length) { const sequence = mineAndFollowing(); openStories(sequence, Math.max(0, sequence.findIndex(s => s.id === own[0].id))); } else upload(); }, true);
            viewer.querySelector('.story-viewer-close').onclick = finish; viewer.querySelector('.story-viewer-next').onclick = advance; viewer.querySelector('.story-viewer-prev').onclick = () => { if (index) { index--; render(); } else finish(); };
            viewer.querySelector('.story-viewer-content').onclick = event => { if (!event.target.closest('video')) advance(); };
            viewer.querySelector('.story-like').onclick = () => { const user = me(), story = list[index], all = stories(), stored = all.find(s => s.id === story?.id); if (!user || !stored) return; stored.likes ||= []; stored.likes = stored.likes.includes(user.username) ? stored.likes.filter(u => u !== user.username) : [...stored.likes, user.username]; localStorage.setItem('nexoraStories', JSON.stringify(all)); story.likes = stored.likes; render(); };
            viewer.querySelector('.story-comment-form').onsubmit = event => { event.preventDefault(); const text = viewer.querySelector('input').value.trim(), user = me(), story = list[index], all = stories(), stored = all.find(s => s.id === story?.id); if (!text || !user || !stored) return; stored.comments ||= []; stored.comments.push({ username:user.username, text, created:Date.now() }); localStorage.setItem('nexoraStories', JSON.stringify(all)); story.comments = stored.comments; event.target.reset(); render(); };
            viewer.querySelector('.story-share').onclick = () => { const user = me(), story = list[index]; if (!user || !story) return; const name = (prompt(words().sharePrompt) || '').trim().replace(/^@/,'').toLocaleLowerCase('az'); if (!name) return; const target = accounts().find(a => a.username === name && a.username !== user.username); if (!target) return alert(words().error); const key = `nexoraChat:${[user.username,target.username].sort().join('::')}`; const thread = read(key,[]); thread.push({ from:user.username, text:`Story: @${story.username}`, media:story.media, created:Date.now() }); try { localStorage.setItem(key,JSON.stringify(thread)); alert(words().sent); } catch { alert(words().error); } };
            viewer.onclick = event => { if (event.target === viewer) finish(); }; viewer.onclose = () => clearTimeout(timer); renderStories(); window.addEventListener('storage', event => { if (event.key === 'nexoraStories' || event.key === 'nexoraAccounts' || event.key?.startsWith('nexoraFollowing:')) renderStories(); });
        }

        const logoutButton = document.getElementById('logoutButton');
        const settingsPanel = document.getElementById('settingsPanel');
        const settingsMenu = document.querySelector('.settings-view[data-view="menu"]');
        if (logoutButton && settingsMenu) {
            logoutButton.classList.add('settings-logout-button'); logoutButton.remove(); settingsMenu.append(logoutButton);
            const dialog = document.createElement('dialog'); dialog.className = 'logout-confirmation'; dialog.innerHTML = '<div class="logout-confirmation-content"><span class="logout-confirmation-icon" aria-hidden="true">↪</span><h2></h2><p></p><div class="logout-confirmation-actions"><button class="logout-cancel" type="button"></button><button class="logout-confirm" type="button"></button></div></div>'; document.body.append(dialog);
            const update = () => { const w = words(); dialog.querySelector('h2').textContent = w.title; dialog.querySelector('p').textContent = w.logoutText; dialog.querySelector('.logout-cancel').textContent = w.cancel; dialog.querySelector('.logout-confirm').textContent = w.confirm; };
            let confirmed = false;
            logoutButton.addEventListener('click', event => { if (confirmed) { confirmed = false; return; } event.preventDefault(); event.stopImmediatePropagation(); update(); dialog.showModal(); });
            dialog.querySelector('.logout-cancel').onclick = () => dialog.close();
            dialog.querySelector('.logout-confirm').onclick = () => { dialog.close(); confirmed = true; logoutButton.click(); settingsPanel?.close(); document.querySelectorAll('.page').forEach(page => page.classList.toggle('active', page.id === 'feed')); document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.page === 'feed')); history.replaceState(null, '', '#feed'); window.scrollTo({ top:0, behavior:'instant' }); };
            dialog.onclick = event => { if (event.target === dialog) dialog.close(); };
        }

        const css = document.createElement('style');
        css.textContent = `
            .settings-view[data-view="menu"]>.logout-button.settings-logout-button{display:block;width:100%;min-height:48px;margin-top:16px;padding:13px 18px;border:1px solid #fca5a5;border-radius:14px;background:#fff1f2;color:#dc2626;font:inherit;font-weight:800;text-align:left;cursor:pointer}
            .logout-confirmation,.public-profile-dialog{width:min(440px,calc(100% - 28px));max-height:88vh;padding:0;overflow:auto;border:1px solid #e9edf2;border-radius:20px;background:#fff;color:#17212f;font:inherit;box-shadow:0 24px 80px #1218283d}
            .logout-confirmation::backdrop,.public-profile-dialog::backdrop{background:#0f172a99;backdrop-filter:blur(3px)}.logout-confirmation-content{padding:28px;text-align:center}.logout-confirmation h2{margin:0}.logout-confirmation p{color:#7d8998}.logout-confirmation-actions{display:flex;gap:10px}.logout-confirmation-actions button{flex:1;min-height:44px;border:1px solid #e9edf2;border-radius:12px;background:#fff;color:#17212f;font:inherit;cursor:pointer}.logout-confirmation-actions .logout-confirm{background:#dc2626;border-color:#dc2626;color:white}
            .public-profile-shell{position:relative;padding:24px}.public-profile-close{position:absolute;top:10px;right:12px;border:0;background:transparent;font-size:28px;cursor:pointer}.public-profile-header{display:flex;align-items:center;gap:14px;padding-right:24px}.public-profile-header h2{margin:0 0 4px}.public-profile-header p{margin:0;color:#7d8998}.public-profile-avatar{width:64px;height:64px;flex:none}.public-follow-button{margin-left:auto}.public-profile-bio{margin:16px 0}.public-profile-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:18px 0;border-block:1px solid #e9edf2}.public-profile-stat{display:grid;gap:3px;padding:12px 4px;border:0;background:transparent;color:inherit;cursor:pointer}.public-profile-stat strong{font-size:18px}.public-profile-stat span{font-size:12px;color:#7d8998}.public-profile-note{font-size:12px;color:#7d8998}.public-profile-dialog h3{margin:18px 0 10px}.public-profile-user{display:flex;width:100%;align-items:center;gap:10px;padding:9px;border:0;border-bottom:1px solid #eee;background:transparent;text-align:left;cursor:pointer}.public-profile-user .avatar{width:38px;height:38px;flex:none}.public-profile-back{margin-top:12px}.public-profile-post{padding:10px 0;border-bottom:1px solid #eee;overflow-wrap:anywhere}.public-profile-media{display:block;max-width:100%;max-height:340px;margin-top:8px;object-fit:contain}.follow-user,.post-author,.post-head .avatar{cursor:pointer}
            .story-strip{display:flex;gap:14px;align-items:flex-start;overflow-x:auto;padding:14px}.story-strip>.story{display:flex;flex:0 0 68px;flex-direction:column;align-items:center;border:0;background:transparent;cursor:pointer}.story-ring{display:grid;width:58px;height:58px;padding:3px;place-items:center;border-radius:50%;background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff)}.story-ring.add-ring{border:2px dashed #8b82ad;background:transparent;color:#6655e8;font-size:26px}.story-avatar{display:grid;width:100%;height:100%;place-items:center;border:2px solid #fff;border-radius:50%;background-color:#6655e8;background-position:center;background-size:cover;color:white;font-weight:800}.story-strip .story small{display:block;max-width:76px;margin-top:6px;overflow:hidden;color:var(--ink,#17212f);font-size:11px;text-align:center;text-overflow:ellipsis;white-space:nowrap}.story-strip .story.has-story .add-ring{border:0;background:linear-gradient(45deg,#ffb800,#ff315d,#9146ff);color:white}
            .story-viewer{width:min(430px,calc(100% - 24px));height:min(780px,calc(100% - 24px));max-height:calc(100% - 24px);padding:0;overflow:hidden;border:0;border-radius:20px;background:#101018;color:white}.story-viewer::backdrop{background:#080810c7;backdrop-filter:blur(5px)}.story-viewer-frame{position:relative;display:flex;width:100%;height:100%;flex-direction:column}.story-progress{position:absolute;z-index:3;top:8px;right:12px;left:12px;height:3px;background:#ffffff55}.story-progress span{display:block;width:100%;height:100%;transform-origin:left;background:white}@keyframes story-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}.story-viewer-header{position:absolute;z-index:2;top:10px;right:0;left:0;display:flex;align-items:center;justify-content:space-between;padding:18px;background:linear-gradient(#0008,transparent)}.story-viewer-author{display:flex;align-items:center;gap:10px}.story-viewer-author .avatar{width:36px;height:36px;display:grid;place-items:center;border:2px solid white;border-radius:50%;background-color:#6655e8;background-position:center;background-size:cover}.story-viewer-close{width:38px;height:38px;border:0;border-radius:50%;background:#0006;color:white;font-size:28px;cursor:pointer}.story-viewer-content{display:grid;width:100%;height:100%;place-items:center}.story-viewer-content img,.story-viewer-content video{width:100%;height:100%;object-fit:contain}.story-viewer-prev,.story-viewer-next{position:absolute;z-index:2;top:46%;width:42px;height:54px;transform:translateY(-50%);border:0;border-radius:12px;background:#0005;color:white;font-size:36px;cursor:pointer}.story-viewer-prev{left:8px}.story-viewer-next{right:8px}.story-viewer-actions{position:absolute;right:14px;bottom:14px;left:14px;display:flex;align-items:center;gap:7px}.story-viewer-actions button{min-height:42px;border:1px solid #ffffff80;border-radius:24px;background:#1119;color:white;font:inherit;padding:8px 10px;cursor:pointer}.story-comment-form{display:flex;flex:1;gap:5px;min-width:0}.story-comment-form input{width:100%;min-width:0;border:1px solid #ffffff80;border-radius:24px;background:#1119;color:white;padding:10px;font:inherit}.story-comments{position:absolute;right:16px;bottom:66px;left:16px;max-height:90px;overflow:auto;color:white;font-size:12px;text-shadow:0 1px 5px #000}.story-comments p{margin:4px 0}
            [data-theme="dark"] .public-profile-dialog,[data-theme="dark"] .logout-confirmation{border-color:#35364a;background:#1b1c2b;color:#f5f6fb}[data-theme="dark"] .public-profile-stat{color:#f5f6fb}[data-theme="dark"] .public-profile-user{color:#f5f6fb;border-color:#35364a}[data-theme="dark"] .public-profile-post{border-color:#35364a}[data-theme="dark"] .story-strip .story small{color:#f5f6fb}
            @media(max-width:420px){.story-viewer{width:100%;height:100%;max-height:100%;border-radius:0}.public-profile-shell{padding:20px}.story-viewer-actions{gap:4px}.story-viewer-actions button{padding:7px 8px}}
        `;
        document.head.append(css);
    });
})();

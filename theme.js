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

        const logoutButton = document.getElementById('logoutButton');
        const settingsMenu = document.querySelector('.settings-view[data-view="menu"]');
        if (logoutButton && settingsMenu) {
            logoutButton.classList.add('settings-logout-button');
            logoutButton.remove();
            settingsMenu.appendChild(logoutButton);

            const confirmation = document.createElement('dialog');
            confirmation.className = 'logout-confirmation';
            confirmation.setAttribute('aria-labelledby', 'logoutConfirmationTitle');
            confirmation.setAttribute('aria-describedby', 'logoutConfirmationText');
            confirmation.innerHTML = `
                <div class="logout-confirmation-content">
                    <span class="logout-confirmation-icon" aria-hidden="true">↪</span>
                    <h2 id="logoutConfirmationTitle">Hesabdan çıxmaq istədiyinizə əminsiniz?</h2>
                    <p id="logoutConfirmationText">Çıxış etdikdən sonra yenidən daxil olmalı olacaqsınız.</p>
                    <div class="logout-confirmation-actions">
                        <button class="logout-cancel" type="button">Ləğv et</button>
                        <button class="logout-confirm" type="button">Bəli, çıxış et</button>
                    </div>
                </div>`;
            document.body.append(confirmation);

            let confirmedLogout = false;
            logoutButton.addEventListener('click', event => {
                if (confirmedLogout) {
                    confirmedLogout = false;
                    return;
                }
                event.preventDefault();
                event.stopImmediatePropagation();
                confirmation.showModal();
            });
            confirmation.querySelector('.logout-cancel').addEventListener('click', () => confirmation.close());
            confirmation.querySelector('.logout-confirm').addEventListener('click', () => {
                confirmation.close();
                confirmedLogout = true;
                logoutButton.click();
            });
            confirmation.addEventListener('click', event => {
                if (event.target === confirmation) confirmation.close();
            });
        }

        const settingsStyle = document.createElement('style');
        settingsStyle.textContent = `
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button {
                display: block;
                width: 100%;
                min-height: 48px;
                margin-top: 16px;
                padding: 13px 18px;
                border: 1px solid #fca5a5;
                border-radius: 14px;
                background: #fff1f2;
                color: #dc2626;
                font: inherit;
                font-size: 14px;
                font-weight: 800;
                letter-spacing: .01em;
                text-align: left;
                cursor: pointer;
            }
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button:hover {
                border-color: #ef4444;
                background: #fee2e2;
                color: #b91c1c;
            }
            .settings-view[data-view="menu"] > .logout-button.settings-logout-button:focus-visible {
                outline: 2px solid #dc2626;
                outline-offset: 3px;
            }
            .logout-confirmation {
                width: min(420px, calc(100% - 32px));
                padding: 0;
                overflow: hidden;
                border: 1px solid #e9edf2;
                border-radius: 20px;
                background: #fff;
                color: #17212f;
                box-shadow: 0 24px 80px rgba(18, 24, 40, .24);
                font-family: inherit;
            }
            .logout-confirmation::backdrop { background: rgba(15, 23, 42, .55); backdrop-filter: blur(3px); }
            .logout-confirmation-content { padding: 28px; text-align: center; }
            .logout-confirmation-icon {
                display: grid;
                width: 52px;
                height: 52px;
                margin: 0 auto 16px;
                place-items: center;
                border-radius: 16px;
                background: #fff1f2;
                color: #dc2626;
                font-size: 26px;
                font-weight: 800;
            }
            .logout-confirmation h2 { margin: 0; font-size: 20px; line-height: 1.35; }
            .logout-confirmation p { margin: 10px 0 24px; color: #7d8998; font-size: 14px; line-height: 1.6; }
            .logout-confirmation-actions { display: flex; gap: 10px; }
            .logout-confirmation-actions button {
                flex: 1;
                min-height: 46px;
                padding: 10px 14px;
                border: 1px solid #e9edf2;
                border-radius: 12px;
                background: #fff;
                color: #17212f;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .logout-confirmation-actions .logout-confirm { border-color: #dc2626; background: #dc2626; color: #fff; }
            .logout-confirmation-actions button:focus-visible { outline: 2px solid #201a50; outline-offset: 3px; }
            [data-theme="dark"] .settings-view[data-view="menu"] > .logout-button.settings-logout-button {
                border-color: #7f1d1d;
                background: #3a1a1d;
                color: #fda4af;
            }
            [data-theme="dark"] .settings-view[data-view="menu"] > .logout-button.settings-logout-button:hover {
                border-color: #a64c5b;
                background: #4a2b34;
                color: #fecdd3;
            }
            [data-theme="dark"] .logout-confirmation { border-color: #35364a; background: #1b1c2b; color: #f5f6fb; }
            [data-theme="dark"] .logout-confirmation p { color: #a8adbf; }
            [data-theme="dark"] .logout-confirmation-actions button { border-color: #3d3f53; background: #242538; color: #f5f6fb; }
            [data-theme="dark"] .logout-confirmation-actions .logout-confirm { border-color: #dc2626; background: #dc2626; color: #fff; }
            @media (max-width: 420px) {
                .logout-confirmation-content { padding: 24px 20px; }
                .logout-confirmation-actions { flex-direction: column-reverse; }
            }
        `;
        document.head.append(settingsStyle);
    });
})();

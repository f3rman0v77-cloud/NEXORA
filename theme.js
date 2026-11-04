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

        const logoutButton = document.getElementById('logoutButton');
        const settingsMenu = document.querySelector('.settings-view[data-view="menu"]');
        if (logoutButton && settingsMenu) {
            logoutButton.classList.add('settings-logout-button');
            logoutButton.remove();
            settingsMenu.appendChild(logoutButton);
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
        `;
        document.head.append(settingsStyle);
    });
})();

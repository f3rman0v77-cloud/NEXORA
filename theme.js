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
        document.getElementById('themeToggle').addEventListener('click', () => {
            manuallySelected = true;
            applyTheme(root.dataset.theme !== 'dark');
        });
    });
})();

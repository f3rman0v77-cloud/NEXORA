document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("nxFeedSort");
  const trigger = document.getElementById("nxFeedSortTrigger");
  const menu = document.getElementById("nxFeedSortMenu");
  const native = document.getElementById("feedSort");
  const label = document.getElementById("nxFeedSortLabel");
  if (!root || !trigger || !menu || !native || !label) return;
  const close = () => { menu.hidden = true; trigger.setAttribute("aria-expanded", "false"); };
  trigger.addEventListener("click", () => {
    const open = menu.hidden;
    menu.hidden = !open;
    trigger.setAttribute("aria-expanded", String(open));
  });
  menu.querySelectorAll("[data-sort-value]").forEach(button => {
    button.addEventListener("click", () => {
      native.value = button.dataset.sortValue;
      native.dispatchEvent(new Event("change", { bubbles: true }));
      label.textContent = button.dataset.sortValue === "popular" ? "Ən populyar" : "Ən yenilər";
      menu.querySelectorAll("[data-sort-value]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
      close();
    });
  });
  document.addEventListener("click", event => { if (!root.contains(event.target)) close(); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
});

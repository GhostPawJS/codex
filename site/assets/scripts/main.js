// Progressive enhancement: without this script every step is shown in order.
(() => {
  document.documentElement.classList.add("js");
  const tabs = [...document.querySelectorAll('.drill [role="tab"]')];
  const panels = [...document.querySelectorAll(".step")];
  const next = document.getElementById("next-step");

  function select(n, focus, push) {
    const tab = tabs[n] || tabs[0];
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => {
      const on = p.id === tab.getAttribute("aria-controls");
      p.hidden = !on;
      p.classList.toggle("open", on);
    });
    if (next) {
      const last = tabs.indexOf(tab) === tabs.length - 1;
      next.textContent = last ? "Start again" : "Next move";
    }
    if (focus) tab.focus();
    if (push) {
      const url = new URL(location.href);
      url.searchParams.set("step", String(tabs.indexOf(tab) + 1));
      history.replaceState(null, "", url);
    }
  }

  if (tabs.length) {
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i, false, true));
      t.addEventListener("keydown", (e) => {
        let j = null;
        if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
        if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") j = 0;
        if (e.key === "End") j = tabs.length - 1;
        if (j !== null) { e.preventDefault(); select(j, true, true); }
      });
    });
    if (next) {
      next.hidden = false;
      next.addEventListener("click", () => {
        const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
        select((cur + 1) % tabs.length, false, true);
      });
    }
    const wanted = Number(new URLSearchParams(location.search).get("step"));
    select(wanted >= 1 && wanted <= tabs.length ? wanted - 1 : 0, false, false);
  }

  document.querySelectorAll(".copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const input = document.getElementById(b.dataset.copy);
      if (!input) return;
      try { await navigator.clipboard.writeText(input.value); } catch { input.select(); document.execCommand("copy"); }
      const label = b.textContent;
      b.textContent = "Copied";
      setTimeout(() => { b.textContent = label; }, 2000);
    });
  });
})();

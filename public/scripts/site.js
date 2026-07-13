document.querySelectorAll("[data-plan-card]").forEach((card) => {
  const tabs = card.querySelectorAll("[data-plan-tab]");
  const views = card.querySelectorAll("[data-plan-view]");
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-plan-tab");
      tabs.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === tab)),
      );
      views.forEach((view) =>
        view.toggleAttribute(
          "hidden",
          view.getAttribute("data-plan-view") !== target,
        ),
      );
    }),
  );
});

const siteHeader = document.querySelector("[data-site-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const siteNav = document.querySelector("[data-site-nav]");
const navScrim = document.querySelector("[data-nav-scrim]");

if (
  siteHeader instanceof HTMLElement &&
  menuToggle instanceof HTMLButtonElement &&
  siteNav instanceof HTMLElement
) {
  const setMenu = (open, returnFocus = false) => {
    siteHeader.toggleAttribute("data-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open
        ? (menuToggle.dataset.labelClose ?? "Close menu")
        : (menuToggle.dataset.labelOpen ?? "Open menu"),
    );
    document.body.classList.toggle("nav-open", open);
    if (open) siteNav.querySelector("a")?.focus();
    else if (returnFocus) menuToggle.focus();
  };

  const updateHeader = () =>
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 24);

  menuToggle.addEventListener("click", () => {
    setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  navScrim?.addEventListener("click", () => setMenu(false, true));
  siteNav
    .querySelectorAll("a")
    .forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (event) => {
    const menuIsOpen = menuToggle.getAttribute("aria-expanded") === "true";
    if (event.key === "Escape" && menuIsOpen) setMenu(false, true);
    if (event.key === "Tab" && menuIsOpen) {
      const focusable = [...siteHeader.querySelectorAll("a, button")].filter(
        (item) =>
          item instanceof HTMLElement &&
          item.offsetParent !== null &&
          !item.hasAttribute("disabled"),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  });
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  const sectionLinks = [...document.querySelectorAll("[data-section-link]")];
  const sections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href") ?? ""))
    .filter((section) => section instanceof HTMLElement);
  if ("IntersectionObserver" in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        sectionLinks.forEach((link) => {
          if (link.getAttribute("href") === `#${visible.target.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-20% 0px -65%", threshold: [0.05, 0.25, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
  }
}

const banner = document.querySelector("[data-cookie-banner]");
if (banner && !localStorage.getItem("nfd-consent"))
  banner.removeAttribute("hidden");
banner?.querySelectorAll("[data-consent]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.getAttribute("data-consent") ?? "necessary";
    localStorage.setItem("nfd-consent", value);
    window.dispatchEvent(new CustomEvent("nfd:consent", { detail: value }));
    banner.setAttribute("hidden", "");
  });
});

document.querySelectorAll("[data-lead-form]").forEach((formElement) => {
  if (!(formElement instanceof HTMLFormElement)) return;
  const key = formElement.querySelector("[data-idempotency]");
  if (key instanceof HTMLInputElement) key.value = crypto.randomUUID();
  const startedAt = Date.now();
  const params = new URLSearchParams(window.location.search);

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = formElement.querySelector("[data-form-status]");
    const button = formElement.querySelector("[data-submit]");
    if (
      !(status instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement) ||
      !formElement.reportValidity()
    )
      return;
    const fileInput = formElement.querySelector('input[type="file"]');
    if (
      fileInput instanceof HTMLInputElement &&
      fileInput.files?.[0] &&
      fileInput.files[0].size > 15 * 1024 * 1024
    ) {
      status.dataset.state = "error";
      status.textContent = status.dataset.error ?? "File is too large.";
      return;
    }
    button.disabled = true;
    button.textContent = button.dataset.sending ?? "Sending…";
    status.textContent = "";
    const body = new FormData(formElement);
    body.set("elapsedMs", String(Date.now() - startedAt));
    for (const name of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
    ]) {
      if (params.get(name)) body.set(name, params.get(name) ?? "");
    }
    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        body,
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message ?? "request_failed");
      status.dataset.state = "success";
      const strong = document.createElement("strong");
      strong.textContent = status.dataset.successTitle ?? "";
      status.replaceChildren(
        strong,
        document.createElement("br"),
        document.createTextNode(status.dataset.successText ?? ""),
      );
      formElement.reset();
      window.dispatchEvent(
        new CustomEvent("nfd:lead-submitted", {
          detail: { leadId: result.leadId },
        }),
      );
    } catch {
      status.dataset.state = "error";
      status.textContent = status.dataset.error ?? "Could not send.";
    } finally {
      button.disabled = false;
      button.textContent = button.dataset.label ?? "Send";
    }
  });
});

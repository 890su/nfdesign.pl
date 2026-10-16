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
  const mobileMenu = window.matchMedia("(max-width: 900px)");
  const setMenu = (open, returnFocus = false) => {
    open = mobileMenu.matches && open;
    const hidingFocusedNav =
      !open && mobileMenu.matches && siteNav.contains(document.activeElement);
    // Move focus before making its previous container inert/hidden to AT.
    if ((returnFocus || hidingFocusedNav) && mobileMenu.matches)
      menuToggle.focus();
    siteHeader.toggleAttribute("data-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open
        ? (menuToggle.dataset.labelClose ?? "Close menu")
        : (menuToggle.dataset.labelOpen ?? "Open menu"),
    );
    document.body.classList.toggle("nav-open", open);
    siteNav.inert = mobileMenu.matches && !open;
    if (mobileMenu.matches && !open)
      siteNav.setAttribute("aria-hidden", "true");
    else siteNav.removeAttribute("aria-hidden");
    if (open) siteNav.querySelector("a")?.focus();
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
  mobileMenu.addEventListener("change", () => {
    const focusDesktopNav =
      !mobileMenu.matches && document.activeElement === menuToggle;
    setMenu(false);
    if (focusDesktopNav) siteNav.querySelector("a")?.focus();
  });
  setMenu(false);
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
const setCookieBanner = (open) => {
  banner?.toggleAttribute("hidden", !open);
  document.body.toggleAttribute("data-cookie-open", Boolean(banner && open));
};
let savedConsent = null;
try {
  savedConsent = localStorage.getItem("nfd-consent");
} catch {
  // Storage may be unavailable; the choice must still work for this page.
}
setCookieBanner(!savedConsent);
banner?.querySelectorAll("[data-consent]").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.getAttribute("data-consent") ?? "necessary";
    try {
      localStorage.setItem("nfd-consent", value);
    } catch {
      // Do not block dismissing the banner when storage is disabled.
    }
    window.dispatchEvent(new CustomEvent("nfd:consent", { detail: value }));
    setCookieBanner(false);
  });
});

document.querySelectorAll("[data-lead-form]").forEach((formElement) => {
  if (!(formElement instanceof HTMLFormElement)) return;
  const key = formElement.querySelector("[data-idempotency]");
  if (key instanceof HTMLInputElement) key.value = crypto.randomUUID();
  let startedAt = Date.now();
  const params = new URLSearchParams(window.location.search);
  const copy = JSON.parse(formElement.dataset.formCopy ?? "{}");
  const summary = formElement.querySelector("[data-error-summary]");
  const fields = [
    ...formElement.querySelectorAll("input, select, textarea"),
  ].filter((field) =>
    formElement.querySelector(`[data-field-error="${field.name}"]`),
  );
  const errors = new Map();
  const touched = new Set();
  let submitted = false;
  let sending = false;
  const focusField = (field) => {
    const details = field.closest("details");
    if (details) details.open = true;
    field.focus();
  };
  const renderSummary = () => {
    if (!(summary instanceof HTMLElement)) return;
    summary.replaceChildren();
    summary.hidden = errors.size === 0;
    if (!errors.size) return;
    const title = document.createElement("p");
    title.textContent = copy.summary;
    const list = document.createElement("ul");
    errors.forEach((message, field) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `#${field.id}`;
      const label = field.labels?.[0]?.textContent?.trim() ?? "";
      link.textContent = `${label}: ${message}`;
      link.addEventListener("click", (event) => {
        event.preventDefault();
        focusField(field);
      });
      item.append(link);
      list.append(item);
    });
    summary.append(title, list);
  };
  const setFieldError = (field, message) => {
    const error = formElement.querySelector(
      `[data-field-error="${field.name}"]`,
    );
    if (message) errors.set(field, message);
    else errors.delete(field);
    field.toggleAttribute("aria-invalid", Boolean(message));
    if (message) field.setAttribute("aria-invalid", "true");
    if (error) {
      error.textContent = message;
      error.hidden = !message;
    }
  };
  const validateField = (field) => {
    let message = "";
    const value = field.value.trim();
    if (field.name === "plan") {
      const file = field.files?.[0];
      if (file && file.size > 15 * 1024 * 1024) message = copy.fileSize;
      else if (
        file &&
        !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
          file.type,
        )
      )
        message = copy.fileType;
    } else if (field.name === "consent" && !field.checked)
      message = copy.consent;
    else if (field.required && !value) message = copy.missing;
    else if (
      (field.name === "name" || field.name === "contact") &&
      (value.length < field.minLength || value.length > field.maxLength)
    )
      message = copy[field.name];
    else if (field.name === "message" && value.length > field.maxLength)
      message = copy.message;
    else if (!field.validity.valid)
      message = field.name === "area" ? copy.area : copy.invalid;
    setFieldError(field, message);
  };
  fields.forEach((field) => {
    field.addEventListener("blur", () => {
      touched.add(field);
      validateField(field);
      renderSummary();
    });
    const onEdit = () => {
      if (submitted || touched.has(field)) {
        validateField(field);
        renderSummary();
      }
    };
    field.addEventListener("input", onEdit);
    field.addEventListener("change", () => {
      touched.add(field);
      onEdit();
    });
  });
  const resetCaptcha = () => {
    const widget = formElement.querySelector(".cf-turnstile");
    if (!widget || typeof window.turnstile?.reset !== "function") return;
    try {
      window.turnstile.reset(`#${widget.id}`);
    } catch {
      // An unavailable/unrendered CAPTCHA must not mask the request outcome.
    }
  };
  // Only these known backend codes receive specific, locally authored copy.
  const safeApiMessages = new Map([
    ["verification_failed", copy.verification],
    ["missing_fields", copy.summary],
    ["consent_required", copy.consent],
    ["invalid_area", copy.area],
    ["invalid_file", copy.file],
    ["invalid_file_signature", copy.file],
    ["already_submitted", copy.duplicate],
    ["upload_failed", copy.upload],
  ]);
  const apiErrorFields = new Map([
    ["consent_required", "consent"],
    ["invalid_area", "area"],
    ["invalid_file", "plan"],
    ["invalid_file_signature", "plan"],
  ]);

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    const status = formElement.querySelector("[data-form-status]");
    const button = formElement.querySelector("[data-submit]");
    if (
      !(status instanceof HTMLElement) ||
      !(button instanceof HTMLButtonElement)
    )
      return;
    submitted = true;
    fields.forEach(validateField);
    renderSummary();
    status.textContent = "";
    delete status.dataset.state;
    if (errors.size) {
      focusField(errors.keys().next().value);
      return;
    }
    sending = true;
    formElement.setAttribute("aria-busy", "true");
    const buttonContent = [...button.childNodes];
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
      if (!response.ok) {
        const code = typeof result?.message === "string" ? result.message : "";
        const fieldName = apiErrorFields.get(code);
        if (fieldName) {
          const field = fields.find((item) => item.name === fieldName);
          setFieldError(field, safeApiMessages.get(code));
          renderSummary();
          focusField(field);
        }
        status.dataset.state = "error";
        status.textContent = safeApiMessages.get(code) ?? status.dataset.error;
        return;
      }
      status.dataset.state = "success";
      const strong = document.createElement("strong");
      strong.textContent = status.dataset.successTitle ?? "";
      status.replaceChildren(
        strong,
        document.createElement("br"),
        document.createTextNode(status.dataset.successText ?? ""),
      );
      formElement.reset();
      // reset() restores default HTML values, including locale/segment and selects.
      if (key instanceof HTMLInputElement) key.value = crypto.randomUUID();
      startedAt = Date.now();
      submitted = false;
      touched.clear();
      fields.forEach((field) => setFieldError(field, ""));
      renderSummary();
      formElement.querySelectorAll("details").forEach((details) => {
        details.open = false;
      });
      window.dispatchEvent(
        new CustomEvent("nfd:lead-submitted", {
          detail: { leadId: result.leadId },
        }),
      );
    } catch {
      status.dataset.state = "error";
      status.textContent = status.dataset.error ?? "Could not send.";
    } finally {
      // A request can consume a single-use token even if a later step fails.
      resetCaptcha();
      sending = false;
      formElement.removeAttribute("aria-busy");
      button.disabled = false;
      button.replaceChildren(...buttonContent);
    }
  });
});

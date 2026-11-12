(() => {
  "use strict";

  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  const mobileQuery = window.matchMedia("(max-width: 700px)");

  function closeMenu(restoreFocus = false) {
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.querySelector(".menu-label").textContent = "Menu";
    navigation.classList.remove("is-open");
    if (restoreFocus) menuButton.focus();
  }

  menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.querySelector(".menu-label").textContent = willOpen ? "Close" : "Menu";
    navigation.classList.toggle("is-open", willOpen);
  });
  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu(true);
    }
  });
  document.addEventListener("click", (event) => {
    if (mobileQuery.matches && !header.contains(event.target)) closeMenu();
  });
  mobileQuery.addEventListener("change", () => closeMenu());
  menuButton.hidden = false;
  root.classList.add("js");

  // Filters enhance the complete, readable HTML project list.
  const filters = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll(".project-card")];
  const workCount = document.getElementById("work-count");
  filters.forEach((button) => {
    button.addEventListener("click", () => {
      const category = button.dataset.filter;
      filters.forEach((filter) => filter.setAttribute("aria-pressed", String(filter === button)));
      let count = 0;
      cards.forEach((card) => {
        card.hidden = category !== "all" && card.dataset.category !== category;
        if (!card.hidden) count += 1;
      });
      workCount.textContent = `${count} selected project${count === 1 ? "" : "s"}`;
    });
  });
  document.querySelector(".project-filters").hidden = false;

  // Project notes remain native <details> when JavaScript or dialog support is absent.
  const dialog = document.getElementById("project-dialog");
  const dialogContent = dialog.querySelector(".dialog-content");
  const projectLinks = [...document.querySelectorAll("[data-project]")];
  const supportsDialog = typeof dialog.showModal === "function";
  let dialogOpener = null;

  function openProject(project, opener) {
    const notes = document.getElementById(`notes-${project}`);
    if (!notes) return;
    const content = notes.querySelector(".notes-body").cloneNode(true);
    content.querySelector("h3").id = "dialog-title";
    dialogContent.replaceChildren(content);
    dialogOpener = opener;
    dialog.showModal();
    document.body.classList.add("modal-open");
    dialog.scrollTop = 0;
    dialog.querySelector(".dialog-close").focus({ preventScroll: true });
  }

  projectLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      // Preserve the browser's modified-click and new-tab behaviour.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (supportsDialog) {
        event.preventDefault();
        openProject(link.dataset.project, link);
      } else {
        document.getElementById(`notes-${link.dataset.project}`).open = true;
      }
    });
  });

  if (supportsDialog) {
    document.querySelector(".project-notes").hidden = true;
    dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
    dialog.querySelector(".dialog-done").addEventListener("click", () => dialog.close());
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) {
        dialog.close();
      }
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("modal-open");
      if (location.hash.startsWith("#notes-")) {
        history.replaceState(null, "", `${location.pathname}${location.search}#work`);
      }
      if (dialogOpener?.isConnected && !dialogOpener.closest("[hidden]")) {
        dialogOpener.focus({ preventScroll: true });
      }
    });

    function openLinkedProject() {
      const link = projectLinks.find((item) => item.getAttribute("href") === location.hash);
      if (link && !dialog.open) openProject(link.dataset.project, link);
    }
    window.addEventListener("hashchange", openLinkedProject);
    openLinkedProject();
  }

  // Keep section navigation useful during a long-page visit.
  if ("IntersectionObserver" in window) {
    const navLinks = [...document.querySelectorAll("[data-nav]")];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          if (link.hash === `#${entry.target.id}`) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach((section) => observer.observe(section));
  }

  const copyButton = document.querySelector("[data-copy-email]");
  const copyStatus = document.getElementById("copy-status");
  const email = "ssyhd1@nottingham.edu.cn";
  let statusTimeout;

  function copyWithSelection() {
    const input = document.createElement("textarea");
    input.value = email;
    input.setAttribute("readonly", "");
    input.setAttribute("aria-label", "Email address to copy");
    input.style.cssText = "position:fixed;left:0;top:0;opacity:0;pointer-events:none";
    document.body.append(input);
    input.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } finally { input.remove(); copyButton.focus({ preventScroll: true }); }
    if (!copied) throw new Error("Copy unavailable");
  }

  copyButton.addEventListener("click", async () => {
    window.clearTimeout(statusTimeout);
    try {
      try {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(email);
      } catch {
        copyWithSelection();
      }
      copyStatus.textContent = "Email copied. Say hello when you’re ready.";
    } catch {
      copyStatus.textContent = "Copy unavailable here. Select the address above or use Say hello.";
    }
    statusTimeout = window.setTimeout(() => { copyStatus.textContent = ""; }, 7000);
  });
  copyButton.hidden = false;
  document.getElementById("year").textContent = String(new Date().getFullYear());
})();

/* This code was generated with help from Github Copilot: add inline project preview modal (01/12/2026) */
console.log("main.js loaded successfully!");

(function () {
  // Modal elements
  const previewModal = document.getElementById("project-preview");
  const previewBackdrop = previewModal
    ? previewModal.querySelector(".preview-backdrop")
    : null;
  const previewDialog = previewModal
    ? previewModal.querySelector(".preview-dialog")
    : null;
  const previewIframe = previewModal
    ? previewModal.querySelector(".preview-iframe")
    : null;
  const previewClose = previewModal
    ? previewModal.querySelector(".preview-close")
    : null;
  const previewOpenNew = previewModal
    ? previewModal.querySelector(".preview-open-new")
    : null;
  let lastFocus = null;

  function openPreview(url, title) {
    if (!previewModal || !previewIframe) {
      // fallback: open in new tab
      window.open(url, "_blank", "noopener");
      return;
    }
    lastFocus = document.activeElement;
    previewIframe.src = url;
    previewOpenNew.href = url;
    previewModal.hidden = false;
    previewModal.setAttribute("aria-hidden", "false");
    previewClose.focus();

    // check if embedding is blocked (X-Frame-Options)
    previewIframe.onload = () => {
      let blocked = false;
      try {
        // Accessing contentDocument on cross-origin will throw
        void previewIframe.contentDocument &&
          previewIframe.contentDocument.title;
      } catch (e) {
        blocked = true;
      }
      if (blocked) {
        previewModal.classList.add("preview-blocked");
      } else {
        previewModal.classList.remove("preview-blocked");
      }
    };
  }

  function closePreview() {
    if (!previewModal || !previewIframe) return;
    previewIframe.src = "";
    previewModal.hidden = true;
    previewModal.setAttribute("aria-hidden", "true");
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  // Event wiring
  if (previewBackdrop) previewBackdrop.addEventListener("click", closePreview);
  if (previewClose) previewClose.addEventListener("click", closePreview);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePreview();
  });

  // Delegate clicks on preview buttons inside carousel track
  document.addEventListener("click", (e) => {
    const btn = e.target.closest && e.target.closest(".preview-btn");
    if (!btn) return;
    e.preventDefault();
    const slide = btn.closest && btn.closest(".slide");
    if (!slide) return;
    const link = slide.querySelector("a.repo-link");
    if (!link) return;
    openPreview(link.href, link.textContent || link.href);
  });

  // If static slides exist without buttons, add them automatically
  document.addEventListener("DOMContentLoaded", () => {
    const slides = document.querySelectorAll(".carousel-track .slide");
    slides.forEach((s) => {
      if (!s.querySelector(".preview-btn")) {
        const link = s.querySelector("a.repo-link");
        if (link) {
          const btn = document.createElement("button");
          btn.className = "preview-btn";
          btn.setAttribute("aria-label", "Preview project");
          btn.textContent = "Preview";
          s.appendChild(btn);
        }
      }
    });

    // --- Pin hero until Learn More is pressed (generated with help from Github Copilot - 01/12/2026)
    const hero = document.querySelector(".hero");
    const learn = document.getElementById("hero-learn-more");
    if (hero && learn) {
      // Freeze hero and prevent scrolling
      hero.classList.add("hero--pinned");
      document.body.classList.add("no-scroll");

      function continueToContent(e) {
        e && e.preventDefault();
        // Unfreeze hero and restore scrolling
        hero.classList.remove("hero--pinned");
        document.body.classList.remove("no-scroll");
        // Smoothly scroll to target
        const target = document.getElementById("about-me");
        if (target) target.scrollIntoView({ behavior: "smooth" });
      }

      learn.addEventListener("click", continueToContent);
      // keyboard accessibility: Enter and Space
      learn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          continueToContent();
        }
      });
    }
  });
})();

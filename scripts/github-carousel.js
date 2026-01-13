/* This code was generated with help from Github Copilot
   in response to the prompt "Create a slideshow that displays GitHub projects (name + webpage) for user westonsoun-dam-crypto" - 12/18/2025 */

(function () {
  const GITHUB_USER = "westonsoun-dam-crypto";
  const MAX_REPOS = 6;
  const AUTOPLAY_INTERVAL = 5000; // ms

  const section = document.getElementById("github-projects");
  if (!section) return;

  // CSV list read from `data-repos` on the section (optional). Example:
  // data-repos="IACS-CS/web-design-portfolio-westonsoun-dam-crypto, other/repo"
  const repoList = section.dataset.repos
    ? section.dataset.repos
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;

  const track = section.querySelector(".carousel-track");
  const prevBtn = section.querySelector(".carousel-btn.prev");
  const nextBtn = section.querySelector(".carousel-btn.next");
  const indicatorsWrap = section.querySelector(".carousel-indicators");

  let slideContainer;
  let slides = [];
  let indicators = [];
  let current = 0;
  let autoplayTimer = null;

  function showMessage(msg, isError = false) {
    // show the message in the slide area; mark errors visually
    track.innerHTML = `<div class="slide${
      isError ? " error" : ""
    }">${msg}</div>`;
    setStatus(msg, isError);
    if (isError) console.error("GitHub carousel:", msg);
    else console.log("GitHub carousel:", msg);
  }

  // small, visible status area under the carousel for debugging users
  function setStatus(text, isError = false) {
    try {
      let el = section.querySelector("#github-status");
      if (!el) {
        el = document.createElement("div");
        el.id = "github-status";
        el.style.marginTop = "0.6rem";
        el.style.fontSize = "0.95rem";
        el.style.color = isError ? "#8b1e1e" : "#333";
        section.appendChild(el);
      }
      el.textContent = text;
      el.style.color = isError ? "#8b1e1e" : "#333";
    } catch (e) {
      console.log("setStatus error", e);
    }
  }

  // helper: fetch with timeout so we don't hang forever
  async function fetchWithTimeout(url, opts = {}, timeout = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      console.error("fetchWithTimeout error for", url, err);
      throw err;
    }
  }

  async function fetchRepos(user) {
    console.log("fetchRepos: repoList=", repoList);
    setStatus("Fetching repos...");
    // If a specific list of repos is provided via data-repos, fetch those
    if (repoList && repoList.length) {
      const results = [];
      for (const item of repoList.slice(0, MAX_REPOS)) {
        try {
          let owner, repo;
          if (item.includes("/")) {
            [owner, repo] = item.split("/").map((s) => s.trim());
          } else {
            owner = user;
            repo = item;
          }
          const url = `https://api.github.com/repos/${encodeURIComponent(
            owner
          )}/${encodeURIComponent(repo)}`;
          setStatus(`Fetching ${owner}/${repo}...`);
          try {
            const res = await fetchWithTimeout(url, {}, 8000);
            if (res && res.ok) {
              const data = await res.json();
              if (!data.fork && !data.archived) results.push(data);
            } else {
              console.warn(
                "Repo not found or inaccessible:",
                item,
                res && res.status
              );
            }
          } catch (err) {
            console.error("Failed to fetch repo", item, err);
          }
        } catch (err) {
          console.error("Failed to parse repo item", item, err);
        }
      }
      setStatus("Finished fetching specified repos.");
      return results;
    }

    // Fallback: fetch public repos for the given user (as before)
    const url = `https://api.github.com/users/${encodeURIComponent(
      user
    )}/repos?per_page=100&sort=updated`;
    try {
      setStatus(`Fetching repos for ${user}...`);
      const res = await fetchWithTimeout(url, {}, 8000);
      if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
      }
      const data = await res.json();
      setStatus("Finished fetching user repos.");
      return data.filter((r) => !r.fork && !r.archived).slice(0, MAX_REPOS);
    } catch (err) {
      console.error("Failed to fetch repos", err);
      setStatus(
        "Fetching repos failed: " + (err && err.message ? err.message : err),
        true
      );
      return null;
    }
  }

  function buildSlides(repos) {
    slideContainer = document.createElement("div");
    slideContainer.className = "slide-container";

    const seenUrls = new Set();

    repos.forEach((repo, i) => {
      const s = document.createElement("article");
      s.className = "slide";
      s.setAttribute("role", "group");
      s.setAttribute("aria-roledescription", "slide");
      s.setAttribute(
        "aria-label",
        `${repo.name} — ${i + 1} of ${repos.length}`
      );

      // main link: prefer homepage if provided, otherwise repo URL
      const url =
        repo.homepage && repo.homepage.trim() ? repo.homepage : repo.html_url;
      seenUrls.add(url);

      const name = document.createElement("a");
      name.className = "repo-link";
      name.href = url;
      name.target = "_blank";
      name.rel = "noopener";
      name.textContent = repo.name;

      const desc = document.createElement("p");
      desc.className = "description";
      desc.textContent = repo.description || "";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent =
        `${repo.stargazers_count || 0} ⭐` +
        (repo.language ? ` • ${repo.language}` : "");

      s.appendChild(name);
      s.appendChild(desc);
      s.appendChild(meta);

      slideContainer.appendChild(s);
    });

    // Append any static fallback slides that are present in the DOM and not duplicated.
    // Move the CYOA project to the front (priority) so it appears first.
    const staticSlides = Array.from(track.querySelectorAll(".slide.static"));
    const prioritySlug = "choose-your-own-adventure-westonsoun-dam-crypto";

    // Insert priority static slides at the beginning (if not duplicated)
    staticSlides
      .filter((ss) => {
        const link = ss.querySelector("a.repo-link");
        const href = link ? link.href : "";
        return href.includes(prioritySlug) && !seenUrls.has(href);
      })
      .forEach((ss) => {
        slideContainer.insertBefore(
          ss.cloneNode(true),
          slideContainer.firstChild
        );
      });

    // Then append other static slides (avoid duplicates)
    staticSlides
      .filter((ss) => {
        const link = ss.querySelector("a.repo-link");
        const href = link ? link.href : "";
        return !href.includes(prioritySlug) && !seenUrls.has(href);
      })
      .forEach((ss) => {
        slideContainer.appendChild(ss.cloneNode(true));
      });

    track.innerHTML = "";
    track.appendChild(slideContainer);
    slides = Array.from(slideContainer.children);
    console.log("buildSlides: total slides =", slides.length);
  }

  function buildIndicators(count) {
    indicatorsWrap.innerHTML = "";
    indicators = [];
    for (let i = 0; i < count; i++) {
      const b = document.createElement("button");
      b.setAttribute("aria-label", `Show slide ${i + 1}`);
      b.dataset.index = i;
      b.addEventListener("click", () => goTo(i));
      indicatorsWrap.appendChild(b);
      indicators.push(b);
    }
  }

  function layoutSlides() {
    if (!slides.length) return;
    const trackWidth = track.clientWidth;
    // read the gap from computed style (in px) so we can include it in width math
    const gap = parseFloat(getComputedStyle(slideContainer).gap) || 0;
    slides.forEach((s) => {
      // ensure each slide exactly fills the visible track width (box-sizing:border-box)
      s.style.minWidth = `${trackWidth}px`;
      s.style.flex = `0 0 ${trackWidth}px`;
    });
    // ensure container width fits slides + gaps between them
    slideContainer.style.width = `${
      trackWidth * slides.length + gap * (slides.length - 1)
    }px`;
    // update position to current
    updatePosition();
  }

  function updatePosition() {
    const gap = parseFloat(getComputedStyle(slideContainer).gap) || 0;
    const offset = (track.clientWidth + gap) * current;
    slideContainer.style.transform = `translateX(-${offset}px)`;
    indicators.forEach((b, i) => b.classList.toggle("active", i === current));
    // add an active class to the visible slide for subtle scale/opacity transitions
    slides.forEach((s, i) => s.classList.toggle("active", i === current));
  }

  function prev() {
    current = (current - 1 + slides.length) % slides.length;
    updatePosition();
  }
  function next() {
    current = (current + 1) % slides.length;
    updatePosition();
  }
  function goTo(i) {
    current = i % slides.length;
    updatePosition();
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(next, AUTOPLAY_INTERVAL);
  }
  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  }

  // initialize everything
  async function init() {
    // If static-only mode is set on the section, use existing static slides and skip network fetches
    const staticOnly =
      section.dataset.staticOnly === "true" ||
      section.dataset.staticOnly === "1";

    if (staticOnly) {
      // don't overwrite the track content; use the status area instead so we don't erase static slides
      setStatus("Static-only mode: showing local slides.");
      // Hide retry button if present
      const retryBtn = section.querySelector("#github-retry");
      if (retryBtn) retryBtn.hidden = true;

      // Build slides only from static slides already in the DOM
      const staticSlides = Array.from(track.querySelectorAll(".slide.static"));
      if (!staticSlides.length) {
        showMessage("No static slides found. Nothing to show.", true);
        return;
      }

      slideContainer = document.createElement("div");
      slideContainer.className = "slide-container";
      staticSlides.forEach((ss) => {
        slideContainer.appendChild(ss.cloneNode(true));
      });

      track.innerHTML = "";
      track.appendChild(slideContainer);
      slides = Array.from(slideContainer.children);

      buildIndicators(slides.length);
      layoutSlides();

      // wire controls
      prevBtn.addEventListener("click", prev);
      nextBtn.addEventListener("click", next);

      // pause on hover
      const carousel = section.querySelector(".carousel");
      carousel.addEventListener("mouseenter", stopAutoplay);
      carousel.addEventListener("mouseleave", startAutoplay);

      // keyboard nav when focused inside carousel
      carousel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      });

      // start autoplay
      startAutoplay();

      // make first indicator active
      updatePosition();

      setStatus("Static-only carousel ready.");
      return;
    }

    showMessage("Loading projects…");
    try {
      // hide retry button on each attempt
      const retryBtn = section.querySelector("#github-retry");
      if (retryBtn) retryBtn.hidden = true;

      const repos = await fetchRepos(GITHUB_USER);
      console.log("init: fetched repos count =", repos && repos.length);
      if (!repos) {
        // show a non-destructive error notice but keep any static fallback slides
        const existingError = track.querySelector(".slide.error");
        if (existingError) existingError.remove();
        const notice = document.createElement("div");
        notice.className = "slide error";
        notice.textContent =
          "Could not load GitHub projects (network or API). Showing static fallback slides below. Click Retry to try again.";
        track.insertBefore(notice, track.firstChild);
        if (retryBtn) {
          retryBtn.hidden = false;
          retryBtn.onclick = () => {
            retryBtn.hidden = true;
            notice.remove();
            init();
          };
        }
        return;
      }

      // wire controls
      prevBtn.addEventListener("click", prev);
      nextBtn.addEventListener("click", next);

      // pause on hover
      const carousel = section.querySelector(".carousel");
      carousel.addEventListener("mouseenter", stopAutoplay);
      carousel.addEventListener("mouseleave", startAutoplay);

      // keyboard nav when focused inside carousel
      carousel.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") prev();
        if (e.key === "ArrowRight") next();
      });

      // responsive layout
      window.addEventListener("resize", () => {
        // small debounce
        clearTimeout(window._githubCarouselLayoutTimer);
        window._githubCarouselLayoutTimer = setTimeout(layoutSlides, 120);
      });

      // start autoplay
      startAutoplay();

      // make first indicator active
      updatePosition();
    } catch (err) {
      console.error("Error initializing GitHub carousel", err);
      showMessage("Could not load GitHub projects. Check console for details.");
    }
  }

  // run init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

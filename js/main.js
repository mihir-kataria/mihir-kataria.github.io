// shared code for the home page, the sample pages and the 404 page
(function () {
  "use strict";

  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motion = doc.classList.contains("motion") && !reduce;
  var hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  window.__mk = true; // lets the script in the head know this file loaded

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var nav = $("#nav");

  // switches between light and dark mode and remembers the choice
  var toggles = $$(".theme-toggle");
  function applyTheme(t) {
    doc.setAttribute("data-theme", t);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t === "light" ? "#f5f2eb" : "#0b0d0e");
    toggles.forEach(function (b) {
      b.setAttribute("aria-label", t === "light" ? "Switch to dark theme" : "Switch to light theme");
    });
    document.dispatchEvent(new CustomEvent("themechange"));
  }
  applyTheme(doc.getAttribute("data-theme") === "light" ? "light" : "dark");
  toggles.forEach(function (b) {
    b.addEventListener("click", function () {
      var next = doc.getAttribute("data-theme") === "light" ? "dark" : "light";
      applyTheme(next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

  // smooth scrolling with the Lenis library (if it loaded)
  var lenis = null;
  if (!reduce && typeof window.Lenis === "function") {
    try {
      lenis = new window.Lenis({ duration: 1.1, smoothWheel: true, autoRaf: !hasGsap, anchors: false });
      if (hasGsap) {
        lenis.on("scroll", window.ScrollTrigger.update);
        window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
        window.gsap.ticker.lagSmoothing(0);
      }
    } catch (e) { lenis = null; }
  }

  // scrolls to a section, stopping just under the nav bar
  function scrollToTarget(target) {
    if (lenis) {
      if (lenis.isScrolling !== "smooth" && Math.abs(lenis.animatedScroll - window.scrollY) > 1) {
        lenis.scrollTo(window.scrollY, { immediate: true });
      }
      lenis.scrollTo(target);
    }
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  // makes links like #about scroll smoothly to their section
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var target = id === "" ? 0 : document.getElementById(id);
    if (id === "main" && a.classList.contains("skip-link")) return;
    if (target === null) return;
    e.preventDefault();
    closeMenu(false);
    scrollToTarget(target);
    if (target !== 0) {
      history.replaceState(null, "", "#" + id);
      if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });

  // adds a line under the nav after scrolling and fills the progress bar
  var progress = $(".progress");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || doc.scrollTop;
      if (nav) nav.classList.toggle("is-scrolled", y > 40);
      if (progress) {
        var max = doc.scrollHeight - window.innerHeight;
        progress.style.setProperty("--p", max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      }
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  // highlights the nav link for the section you are looking at
  var navLinks = $$(".nav__links a[href^='#']");
  if (navLinks.length && "IntersectionObserver" in window) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var sections = Object.keys(map).map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var visible = {};
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
      var current = null;
      sections.forEach(function (s) { if (visible[s.id] && !current) current = s.id; });
      navLinks.forEach(function (a) {
        if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  // makes the menu open and close on phones
  var menu = $("#menu");
  var menuBtn = $(".menu-btn");
  var lastFocus = null;
  function menuFocusables() {
    return [menuBtn].concat($$("a, button", menu));
  }
  function openMenu() {
    if (!menu) return;
    lastFocus = document.activeElement;
    menu.hidden = false;
    menu.getBoundingClientRect();
    menu.classList.add("is-open");
    menuBtn.setAttribute("aria-expanded", "true");
    $(".menu-btn__text", menuBtn).textContent = "Close";
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    var first = $("a", menu);
    if (first) first.focus();
  }
  function closeMenu(restore) {
    if (!menu || menu.hidden) return;
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
    $(".menu-btn__text", menuBtn).textContent = "Menu";
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    setTimeout(function () { if (!menu.classList.contains("is-open")) menu.hidden = true; }, reduce ? 0 : 450);
    if (restore !== false && lastFocus) lastFocus.focus();
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener("click", function () {
      menuBtn.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu();
    });
    // escape closes the menu and tab stays inside it
    document.addEventListener("keydown", function (e) {
      if (menu.hidden) return;
      if (e.key === "Escape") { e.preventDefault(); closeMenu(); return; }
      if (e.key === "Tab") {
        var f = menuFocusables();
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 900) closeMenu(false); });
  }

  // copy buttons on the code cards
  var live = $("#live");
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var card = btn.closest(".code-card");
      var pre = $("[data-copy-target]", card) || $("pre", card);
      if (!pre) return;
      var text = pre.innerText.replace(/\n$/, "");
      var done = function () {
        var label = $("span", btn);
        btn.classList.add("is-copied");
        if (label) label.textContent = "Copied";
        if (live) live.textContent = "Copied to clipboard";
        clearTimeout(btn._t);
        btn._t = setTimeout(function () {
          btn.classList.remove("is-copied");
          if (label) label.textContent = "Copy";
          if (live) live.textContent = "";
        }, 1500);
      };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text) && done(); });
      } else if (fallbackCopy(text)) done();
    });
  });

  // older way to copy text when the clipboard api is not available
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", "");
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  // opens certificates in a popup, with arrow keys to go to the next one
  var lb = $("#lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = $(".lightbox__img", lb);
    var lbText = $(".lightbox__text", lb);
    var lbCount = $(".lightbox__count", lb);
    var lbPrev = $(".lightbox__prev", lb);
    var lbNext = $(".lightbox__next", lb);
    var lbOpen = $(".lightbox__open", lb);
    var lbItems = [], lbIndex = 0, lbTrigger = null;

    // shows certificate number i in the popup
    var lbShow = function (i) {
      lbIndex = (i + lbItems.length) % lbItems.length;
      var it = lbItems[lbIndex];
      lbImg.src = it.href;
      lbImg.alt = it.alt;
      lbText.textContent = it.caption;
      lbCount.textContent = lbItems.length > 1 ? (lbIndex + 1) + " / " + lbItems.length : "";
      lbOpen.href = it.href;
      lbPrev.hidden = lbNext.hidden = lbItems.length < 2;
      if (lbItems.length > 1) { new Image().src = lbItems[(lbIndex + 1) % lbItems.length].href; }
    };

    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-lightbox]");
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button > 0) return;
      e.preventDefault();
      var group = a.getAttribute("data-lightbox");
      lbItems = $$('a[data-lightbox="' + group + '"]:not([aria-hidden="true"])').map(function (el) {
        return {
          href: el.getAttribute("href"),
          caption: el.getAttribute("data-caption") || "",
          alt: el.getAttribute("data-alt") || el.getAttribute("data-caption") || ""
        };
      });
      if (!lbItems.length) return;
      var start = 0;
      lbItems.forEach(function (it, i) { if (it.href === a.getAttribute("href")) start = i; });
      lbTrigger = a;
      lbShow(start);
      lb.showModal();
      if (lenis) lenis.stop();
    });

    lbPrev.addEventListener("click", function () { lbShow(lbIndex - 1); });
    lbNext.addEventListener("click", function () { lbShow(lbIndex + 1); });
    $(".lightbox__close", lb).addEventListener("click", function () { lb.close(); });
    lb.addEventListener("click", function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener("keydown", function (e) {
      if (lbItems.length < 2) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); lbShow(lbIndex - 1); }
      if (e.key === "ArrowRight") { e.preventDefault(); lbShow(lbIndex + 1); }
    });
    lb.addEventListener("close", function () {
      if (lenis) lenis.start();
      if (lbTrigger && lbTrigger.getAttribute("aria-hidden") !== "true") lbTrigger.focus({ preventScroll: true });
      else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      lbImg.removeAttribute("src");
    });
  }

  // splits the name in the hero into letters so they can rise in one by one
  var hero = $(".hero");
  var heroName = $(".hero__name");
  if (heroName && motion) {
    heroName.setAttribute("aria-label", heroName.textContent.replace(/\s+/g, " ").trim());
    var n = 0;
    $$(".ln > *", heroName).forEach(function (el) {
      var txt = el.textContent;
      el.textContent = "";
      el.setAttribute("aria-hidden", "true");
      txt.split("").forEach(function (ch) {
        var s = document.createElement("span");
        s.className = "ch";
        s.textContent = ch;
        s.style.setProperty("--d", (0.18 + n * 0.035).toFixed(3) + "s");
        el.appendChild(s);
        n++;
      });
    });
  }

  // fades in the hero items one after another when the page loads
  if (hero) {
    $$("[data-hero]", hero).forEach(function (el, i) {
      el.style.setProperty("--d", (0.08 + i * 0.08).toFixed(2) + "s");
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { hero.classList.add("is-in"); });
    });
  }

  // fades in cards, rows and headings when you scroll to them
  $$("[data-stagger]").forEach(function (group) {
    $$(".reveal", group).forEach(function (el, i) {
      el.style.setProperty("--d", (i % 6) * 0.06 + "s");
    });
  });
  var revealEls = $$(".reveal, .h-sec, .masthead__title").filter(function (el) { return !el.closest(".hero"); });
  function reveal(el) { el.classList.add("is-in"); }
  if (!motion) {
    revealEls.forEach(reveal);
  } else if (hasGsap) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.batch(revealEls, {
      start: "top 90%",
      once: true,
      onEnter: function (batch) { batch.forEach(reveal); }
    });
  } else if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -4% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
    // backup for very fast scrolling: shows anything you already scrolled past
    var sweep = 0;
    window.addEventListener("scroll", function () {
      clearTimeout(sweep);
      sweep = setTimeout(function () {
        revealEls.forEach(function (el) {
          if (!el.classList.contains("is-in") && el.getBoundingClientRect().top < window.innerHeight) reveal(el);
        });
      }, 120);
    }, { passive: true });
  } else {
    revealEls.forEach(reveal);
  }

  // moves the big README word a little slower than the page
  var ghost = $(".hero__ghost-inner");
  if (ghost && motion && hasGsap && hero) {
    window.gsap.to(ghost, {
      yPercent: 38, ease: "none",
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true }
    });
  }

  // counts the numbers up when you scroll to them
  var counters = $$("[data-count]");
  function countUp(el) {
    var end = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1400, start = null;
    el.setAttribute("aria-label", end + suffix);
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    el.textContent = "0" + suffix;
    requestAnimationFrame(step);
  }
  if (motion && counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          cio.unobserve(el);
          setTimeout(function () { countUp(el); }, 600);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // soft glow in the hero that follows the mouse (desktop only)
  if (hero && !reduce && window.matchMedia && matchMedia("(pointer: fine) and (min-width: 901px)").matches) {
    var raf = 0, mx = 0, my = 0;
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      mx = e.clientX - r.left; my = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(function () {
        hero.style.setProperty("--mx", mx + "px");
        hero.style.setProperty("--my", my + "px");
        hero.classList.add("is-lit");
        raf = 0;
      });
    });
    hero.addEventListener("pointerleave", function () { hero.classList.remove("is-lit"); });
  }

  // if the page opens with a #section in the address, scroll to it
  if (location.hash && location.hash.length > 1) {
    var t = document.getElementById(location.hash.slice(1));
    if (t) setTimeout(function () { scrollToTarget(t); }, 60);
  }
})();

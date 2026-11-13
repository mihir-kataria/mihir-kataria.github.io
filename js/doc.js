// extra code for the sample pages only
(function () {
  "use strict";

  // highlights the table of contents link for the part you are reading
  var links = Array.prototype.slice.call(document.querySelectorAll(".toc a[href^='#']"));
  if (links.length) {
    var heads = links.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
    var update = function () {
      var current = heads[0].id;
      var line = window.innerHeight * 0.3;
      heads.forEach(function (h) { if (h.getBoundingClientRect().top < line) current = h.id; });
      links.forEach(function (a) {
        if (a.getAttribute("href") === "#" + current) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
  }

  // turns the diagram code into real diagrams with Mermaid (the code stays if Mermaid fails to load)
  if (document.body.getAttribute("data-mermaid") !== "true") return;
  var figs = Array.prototype.slice.call(document.querySelectorAll(".mermaid-fig"));
  var sources = figs.map(function (f) { return f.querySelector("pre code").textContent; });
  var mermaid = null;
  var renderId = 0;

  // reads a color from the site's css
  function css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // diagram colors that match the current theme
  function themeVars() {
    var light = document.documentElement.getAttribute("data-theme") === "light";
    return {
      darkMode: !light,
      background: css("--ink-2"),
      fontFamily: '"IBM Plex Sans", system-ui, sans-serif',
      fontSize: "14px",
      primaryColor: css("--ink"),
      primaryTextColor: css("--paper"),
      primaryBorderColor: css("--accent"),
      secondaryColor: css("--ink-3"),
      tertiaryColor: css("--ink-2"),
      lineColor: css("--mist"),
      textColor: css("--paper"),
      mainBkg: css("--ink"),
      nodeBorder: css("--accent"),
      clusterBkg: css("--ink-2"),
      edgeLabelBackground: css("--ink-2"),
      actorBkg: css("--ink"),
      actorBorder: css("--accent"),
      actorTextColor: css("--paper"),
      actorLineColor: css("--line-2"),
      signalColor: css("--mist"),
      signalTextColor: css("--paper"),
      labelBoxBkgColor: css("--ink-3"),
      labelBoxBorderColor: css("--line-2"),
      labelTextColor: css("--paper"),
      loopTextColor: css("--accent"),
      noteBkgColor: css("--accent-soft"),
      noteBorderColor: css("--accent"),
      noteTextColor: css("--paper"),
      activationBkgColor: css("--ink-3"),
      activationBorderColor: css("--accent"),
      sequenceNumberColor: css("--ink")
    };
  }

  // draws every diagram on the page
  function renderAll() {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "strict",
      theme: "base",
      themeVariables: themeVars(),
      flowchart: { curve: "basis", padding: 14, htmlLabels: true },
      sequence: { useMaxWidth: false, mirrorActors: false, actorMargin: 40, messageMargin: 32, boxMargin: 8 }
    });
    figs.forEach(function (fig, i) {
      var target = fig.querySelector(".diagram");
      var id = "mmd-" + i + "-" + (++renderId);
      mermaid.render(id, sources[i]).then(function (out) {
        target.innerHTML = out.svg;
        fig.classList.add("is-rendered");
      }).catch(function () {
        fig.classList.remove("is-rendered");
      });
    });
  }

  // loads Mermaid, draws the diagrams, and redraws them when the theme changes
  import("https://cdn.jsdelivr.net/npm/mermaid@12.3.0/dist/mermaid.esm.min.mjs")
    .then(function (mod) {
      mermaid = mod.default;
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(renderAll);
      else renderAll();
      document.addEventListener("themechange", renderAll);
    })
    .catch(function () {});
})();

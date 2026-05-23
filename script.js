(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- cursor glow ---------- */
  var glow = document.querySelector(".cursor_glow");
  if (glow && window.matchMedia("(pointer: fine)").matches) {
    var gx = 0, gy = 0, cx = 0, cy = 0, glowOn = false;
    window.addEventListener("mousemove", function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!glowOn) { glow.style.opacity = "1"; glowOn = true; }
    });
    (function loop() {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = "translate(" + cx + "px," + cy + "px)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- scroll progress + header ---------- */
  var bar = document.querySelector(".scroll_bar");
  var header = document.querySelector(".site_header");
  function onScroll() {
    var h = document.documentElement;
    var scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    if (bar) bar.style.width = (scrolled * 100) + "%";
    if (header) header.classList.toggle("scrolled", h.scrollTop > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          revObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = ((i % 4) * 0.06) + "s";
      revObs.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- animated counters ---------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + target + suffix;
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { animateCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else {
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute("data-prefix") || "") + el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- hero rotator ---------- */
  var words = [
    "scattered data", "missed sales calls", "invisible search presence",
    "a boring Shopify store", "guesswork marketing", "no real community"
  ];
  var rotWrap = document.querySelector(".rotator");
  if (rotWrap && !reduceMotion) {
    var ri = 0;
    setInterval(function () {
      var cur = rotWrap.querySelector(".rotator_word");
      cur.classList.add("out");
      setTimeout(function () {
        ri = (ri + 1) % words.length;
        var span = document.createElement("span");
        span.className = "rotator_word";
        span.textContent = words[ri];
        rotWrap.innerHTML = "";
        rotWrap.appendChild(span);
      }, 340);
    }, 2600);
  }

  /* ---------- flip cards + tally ---------- */
  var flips = document.querySelectorAll(".flip");
  var tallyNum = document.getElementById("tallyNum");
  var tallyFill = document.getElementById("tallyFill");
  var tallyMsg = document.getElementById("tallyMsg");
  var picked = 0;
  var msgs = {
    0: "Tap the cards below 👇",
    low: "A few cracks. We seal them fast.",
    mid: "This is the norm, and exactly our zone.",
    high: "You're not alone. We close every one of these."
  };
  function updateTally() {
    if (tallyNum) tallyNum.textContent = picked;
    if (tallyFill) tallyFill.style.width = (picked / 8 * 100) + "%";
    if (tallyMsg) {
      if (picked === 0) tallyMsg.textContent = msgs[0];
      else if (picked <= 2) tallyMsg.textContent = msgs.low;
      else if (picked <= 5) tallyMsg.textContent = msgs.mid;
      else tallyMsg.textContent = msgs.high;
      tallyMsg.style.color = picked === 0 ? "" : "#d9a9f4";
    }
  }
  flips.forEach(function (card) {
    var front = card.querySelector(".flip_front");
    // flip on card click
    card.addEventListener("click", function () {
      card.classList.toggle("flipped");
    });
    // mark "that's me" via the icon area (front), without flipping
    if (front) {
      front.addEventListener("click", function (e) {
        // shift/long handled by separate pick button? keep simple: dblclick to pick
      });
    }
    // double click toggles "picked"
    card.addEventListener("dblclick", function (e) {
      e.preventDefault();
      card.classList.toggle("picked");
      picked += card.classList.contains("picked") ? 1 : -1;
      updateTally();
    });
  });

  // Provide an explicit pick affordance: a small tap on the tag toggles pick
  document.querySelectorAll(".flip_front .diag_tag").forEach(function (tag) {
    tag.style.cursor = "pointer";
    tag.title = "Mark this as yours";
    tag.addEventListener("click", function (e) {
      e.stopPropagation();
      var card = tag.closest(".flip");
      card.classList.toggle("picked");
      picked += card.classList.contains("picked") ? 1 : -1;
      updateTally();
    });
  });

  /* ---------- chat sequence helper ---------- */
  function runSequence(container, steps, opts) {
    opts = opts || {};
    var i = 0;
    function next() {
      if (i >= steps.length) {
        if (opts.loop) {
          setTimeout(function () {
            container.innerHTML = "";
            i = 0;
            next();
          }, opts.loopDelay || 3500);
        }
        return;
      }
      var step = steps[i++];
      if (step.typing) {
        var t = document.createElement("div");
        t.className = "typing";
        t.innerHTML = "<i></i><i></i><i></i>";
        container.appendChild(t);
        container.scrollTop = container.scrollHeight;
        setTimeout(function () {
          container.removeChild(t);
          next();
        }, step.typing);
      } else {
        var el = document.createElement("div");
        el.className = step.cls;
        el.innerHTML = step.html;
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
        setTimeout(next, step.delay || 900);
      }
    }
    next();
  }

  /* ---------- WhatsApp demo ---------- */
  var waBody = document.getElementById("waBody");
  var waSteps = [
    { cls: "bubble_msg me", html: "stock left on the lavender candle?", delay: 700 },
    { typing: 900 },
    { cls: "bubble_msg them", html: "<b>142 units</b> in stock 🕯️<br>Selling about 18 a day, roughly 8 days of cover left.", delay: 1300 },
    { cls: "bubble_msg me", html: "today's sales + ad spend?", delay: 700 },
    { typing: 900 },
    { cls: "bubble_msg them", html: "Sales: <b>₹1,84,200</b> (62 orders)<br>Ad spend: <b>₹38,400</b> · ROAS <b>4.8x</b> ✅", delay: 1400 },
    { cls: "bubble_msg me", html: "refund order #4471", delay: 700 },
    { typing: 800 },
    { cls: "bubble_msg them", html: "Done ✅ ₹1,299 refunded to Priya · courier pickup booked.", delay: 1600 }
  ];

  /* ---------- AI agent demo ---------- */
  var agentBody = document.getElementById("agentBody");
  var agentSteps = [
    { cls: "line cust", html: "Hi, is the serum okay for oily skin?", delay: 800 },
    { typing: 1000 },
    { cls: "line ai", html: "Absolutely! Our Niacinamide serum is oil free and great for oily, acne prone skin. Want me to suggest a simple morning routine?<small>AI Agent · 0.6s</small>", delay: 1600 },
    { cls: "line cust", html: "Yes please, and any offer?", delay: 800 },
    { typing: 1000 },
    { cls: "line ai", html: "Pair it with the gentle cleanser and you get 15% off the duo. Shall I place the order to your usual address?<small>AI Agent · upsell</small>", delay: 1700 },
    { cls: "line cust", html: "Go ahead 🙌", delay: 800 },
    { typing: 800 },
    { cls: "line ai", html: "Order confirmed 🎉 You'll get tracking on WhatsApp. Anything else?<small>Sale closed · 0 humans involved</small>", delay: 1800 }
  ];

  function startDemo(container, steps) {
    if (!container) return;
    if (reduceMotion) {
      steps.forEach(function (s) {
        if (s.typing) return;
        var el = document.createElement("div");
        el.className = s.cls;
        el.innerHTML = s.html;
        container.appendChild(el);
      });
      return;
    }
    runSequence(container, steps, { loop: true, loopDelay: 4000 });
  }

  if ("IntersectionObserver" in window) {
    var demoObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (en.target === waBody) startDemo(waBody, waSteps);
          if (en.target === agentBody) startDemo(agentBody, agentSteps);
          demoObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.4 });
    if (waBody) demoObs.observe(waBody);
    if (agentBody) demoObs.observe(agentBody);
  } else {
    startDemo(waBody, waSteps);
    startDemo(agentBody, agentSteps);
  }

  /* ---------- data query widget ---------- */
  var dataSets = [
    {
      q: "Best seller in Chennai yesterday?",
      kpi: "Sweet Karam Coffee · Filter Decoction",
      sub: "Top product · Chennai · yesterday",
      bars: [
        ["Filter Decoction", 100, "₹71,400"],
        ["Sukku Coffee", 68, "₹48,500"],
        ["Millet Mix", 41, "₹29,200"],
        ["Snack Box", 27, "₹19,300"]
      ]
    },
    {
      q: "Which ad set has the best ROAS?",
      kpi: "Meta · Lookalike 1% · Skincare",
      sub: "Top performing ad set · last 7 days",
      bars: [
        ["LAL 1% Skincare", 100, "6.4x"],
        ["Retargeting 30d", 82, "5.1x"],
        ["Broad Interest", 54, "3.3x"],
        ["Google PMax", 47, "2.9x"]
      ]
    },
    {
      q: "What's my repeat customer rate?",
      kpi: "38% of revenue from repeat buyers",
      sub: "Rolling 90 day cohort",
      bars: [
        ["Repeat buyers", 38, "38%"],
        ["First time", 62, "62%"],
        ["Subscribed", 21, "21%"],
        ["Reactivated", 12, "12%"]
      ]
    }
  ];
  var dataQ = document.getElementById("dataQ");
  var dataA = document.getElementById("dataA");
  var qpills = document.querySelectorAll(".qpill");

  function renderData(idx) {
    var d = dataSets[idx];
    if (!dataQ || !dataA) return;
    dataQ.textContent = d.q;
    dataA.innerHTML =
      '<div class="data_kpi"><b>' + d.kpi + "</b><small>" + d.sub + "</small></div>" +
      '<div class="data_bars"></div>';
    var wrap = dataA.querySelector(".data_bars");
    d.bars.forEach(function (b) {
      var row = document.createElement("div");
      row.className = "dbar";
      row.innerHTML =
        "<span>" + b[0] + "</span>" +
        '<span class="dbar_track"><span class="dbar_fill"></span></span>' +
        '<span class="dbar_val">' + b[2] + "</span>";
      wrap.appendChild(row);
    });
    requestAnimationFrame(function () {
      var fills = wrap.querySelectorAll(".dbar_fill");
      fills.forEach(function (f, i) {
        setTimeout(function () { f.style.width = d.bars[i][1] + "%"; }, 80 * i + 60);
      });
    });
  }
  qpills.forEach(function (p) {
    p.addEventListener("click", function () {
      qpills.forEach(function (x) { x.classList.remove("active"); });
      p.classList.add("active");
      renderData(parseInt(p.getAttribute("data-q"), 10));
    });
  });
  // initial render when scrolled into view
  if (dataA) {
    if ("IntersectionObserver" in window) {
      var dObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { renderData(0); dObs.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      dObs.observe(dataA);
    } else {
      renderData(0);
    }
  }

  /* ---------- them/us toggle ---------- */
  var tgs = document.querySelectorAll(".tg");
  var tgHead = document.querySelector(".toggle_head");
  var panels = document.querySelectorAll(".toggle_panel");
  tgs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var side = btn.getAttribute("data-side");
      tgs.forEach(function (b) { b.classList.toggle("active", b === btn); });
      if (tgHead) tgHead.classList.toggle("us", side === "us");
      panels.forEach(function (pn) {
        pn.classList.toggle("active", pn.getAttribute("data-panel") === side);
      });
    });
  });

  /* ---------- 3D tilt ---------- */
  if (window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    document.querySelectorAll(".tilt").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(800px) rotateY(" + (px * 8) + "deg) rotateX(" + (-py * 8) + "deg) translateY(-4px)";
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }
})();

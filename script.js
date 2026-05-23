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
  function fmtNum(n, decimals) {
    var s = decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
    var parts = s.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
  function animateCount(el) {
    var raw = el.getAttribute("data-count") || "0";
    var target = parseFloat(raw) || 0;
    var decimals = raw.indexOf(".") > -1 ? raw.split(".")[1].length : 0;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1300, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = prefix + fmtNum(target * eased, decimals) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = prefix + fmtNum(target, decimals) + suffix;
    }
    requestAnimationFrame(step);
    // safety net: if rAF is throttled (e.g. background tab), still show the final value
    setTimeout(function () {
      el.textContent = prefix + fmtNum(target, decimals) + suffix;
    }, dur + 500);
  }
  var counters = document.querySelectorAll("[data-count]");
  function triggerCount(el) {
    if (el.dataset.cdone) return;
    el.dataset.cdone = "1";
    animateCount(el);
  }
  if ("IntersectionObserver" in window && !reduceMotion) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { triggerCount(en.target); cObs.unobserve(en.target); }
      });
    }, { threshold: 0.25 });
    counters.forEach(function (el) {
      cObs.observe(el);
      var r = el.getBoundingClientRect();
      if (r.top < (window.innerHeight || 0) && r.bottom > 0) triggerCount(el);
    });
  } else {
    counters.forEach(function (el) {
      el.textContent = (el.getAttribute("data-prefix") || "") + el.getAttribute("data-count") + (el.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- hero rotator ---------- */
  var words = [
    "scattered data", "missed sales calls", "invisible presence",
    "a generic store", "guesswork marketing", "no real community"
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
        span.textContent = words[ri] + "?";
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
  var revealed = 0;
  var msgs = {
    0: "Tap a card to reveal how we fix it 👇",
    low: "Keep going, there's a fix for each one.",
    mid: "See the pattern? A fix for every gap.",
    full: "That's all 8. We close every one of these gaps."
  };
  function updateTally() {
    if (tallyNum) tallyNum.textContent = revealed;
    if (tallyFill) tallyFill.style.width = (revealed / 8 * 100) + "%";
    if (tallyMsg) {
      if (revealed === 0) tallyMsg.textContent = msgs[0];
      else if (revealed <= 3) tallyMsg.textContent = msgs.low;
      else if (revealed < 8) tallyMsg.textContent = msgs.mid;
      else tallyMsg.textContent = msgs.full;
      tallyMsg.style.color = revealed === 0 ? "" : "#d9a9f4";
    }
  }
  flips.forEach(function (card) {
    card.addEventListener("click", function () {
      var wasFlipped = card.classList.contains("flipped");
      card.classList.remove("hint");
      card.classList.toggle("flipped");
      if (!wasFlipped && !card.dataset.counted) {
        card.dataset.counted = "1";
        revealed += 1;
        updateTally();
      }
    });
  });

  // one-time flip hint: gently wiggle the first card when it enters view
  var firstFlip = flips[0];
  if (firstFlip && "IntersectionObserver" in window && !reduceMotion) {
    var hintObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          firstFlip.classList.add("hint");
          setTimeout(function () { firstFlip.classList.remove("hint"); }, 3000);
          hintObs.unobserve(en.target);
        }
      });
    }, { threshold: 0.6 });
    hintObs.observe(firstFlip);
  }

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
      kpi: "True Diamond · Solitaire Ring",
      sub: "Top product · Chennai · yesterday",
      bars: [
        ["Solitaire Ring", 100, "₹2,40,000"],
        ["Diamond Studs", 71, "₹1,70,000"],
        ["Tennis Bracelet", 48, "₹1,15,000"],
        ["Eternity Band", 33, "₹78,000"]
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
  var toggleHint = document.getElementById("toggleHint");
  tgs.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var side = btn.getAttribute("data-side");
      tgs.forEach(function (b) { b.classList.toggle("active", b === btn); });
      if (tgHead) tgHead.classList.toggle("us", side === "us");
      panels.forEach(function (pn) {
        pn.classList.toggle("active", pn.getAttribute("data-panel") === side);
      });
      document.querySelectorAll(".tg.pulse").forEach(function (b) { b.classList.remove("pulse"); });
      if (toggleHint) toggleHint.classList.add("done");
    });
  });

  /* ---------- edge accordion ---------- */
  var edgeAcc = document.getElementById("edgeAcc");
  if (edgeAcc) {
    var accItems = [].slice.call(edgeAcc.querySelectorAll(".acc_item"));
    accItems.forEach(function (item) {
      var q = item.querySelector(".acc_q");
      if (!q) return;
      q.addEventListener("click", function () {
        var isOpen = item.classList.contains("open");
        accItems.forEach(function (it) {
          it.classList.remove("open");
          var b = it.querySelector(".acc_q");
          if (b) b.setAttribute("aria-expanded", "false");
        });
        if (!isOpen) {
          item.classList.add("open");
          q.setAttribute("aria-expanded", "true");
        }
      });
    });
  }

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

  /* ---------- contact form ---------- */
  var leadForm = document.getElementById("leadForm");
  if (leadForm) {
    var status = document.getElementById("formStatus");
    var submitBtn = document.getElementById("leadSubmit");
    var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    function setStatus(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = "form_status" + (kind ? " " + kind : "");
    }
    leadForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(leadForm);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      if (!name || !email || !phone) {
        setStatus("Please fill in your name, email and phone number.", "err");
        return;
      }
      if (!EMAIL_RE.test(email)) {
        setStatus("Please enter a valid email address.", "err");
        return;
      }
      data.append("_subject", "New enquiry from Strategy Fox website");
      data.append("_captcha", "false");
      data.append("_template", "table");
      if (submitBtn) { submitBtn.disabled = true; }
      setStatus("Sending…", "");
      fetch("https://formsubmit.co/ajax/dev.foxbusinessconsulting@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res && (res.success === "true" || res.success === true)) {
            leadForm.reset();
            setStatus("Thanks! We've got your message and will be in touch shortly.", "ok");
          } else {
            setStatus("Something went wrong. Please email pradeep@strategyfox.in.", "err");
          }
        })
        .catch(function () {
          setStatus("Something went wrong. Please email pradeep@strategyfox.in.", "err");
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; }
        });
    });
  }
})();

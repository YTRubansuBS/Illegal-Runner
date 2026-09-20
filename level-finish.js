/* Illegal Runner — FINISH FLAG
   Standalone: does NOT depend on Supabase, runtime globals or custom events.
*/
(() => {
  "use strict";

  let lastWidth = 0;
  let deadUntil = 0;

  function setup() {
    const game = document.getElementById("game");
    const bar = document.getElementById("progressBar");
    if (!game || !bar) return;

    let flag = document.getElementById("irRealFinishFlag");
    if (!flag) {
      flag = document.createElement("div");
      flag.id = "irRealFinishFlag";
      flag.innerHTML =
        '<div class="ir-pole"></div>' +
        '<div class="ir-banner">🏁</div>' +
        '<div class="ir-base"></div>';
      game.appendChild(flag);
    }

    if (!document.getElementById("irRealFinishFlagStyle")) {
      const style = document.createElement("style");
      style.id = "irRealFinishFlagStyle";
      style.textContent = `
        #irRealFinishFlag {
          position:absolute !important;
          width:64px !important;
          height:140px !important;
          left:88% !important;
          bottom:18% !important;
          z-index:2147483647 !important;
          pointer-events:none !important;
          display:none !important;
          visibility:visible !important;
          opacity:1 !important;
          transform:translateX(-50%) !important;
        }
        #irRealFinishFlag .ir-pole {
          position:absolute;
          left:29px;
          bottom:0;
          width:6px;
          height:122px;
          background:#fff;
          border-radius:5px;
          box-shadow:0 0 12px #00e5ff;
        }
        #irRealFinishFlag .ir-banner {
          position:absolute;
          left:34px;
          top:5px;
          width:55px;
          height:38px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:27px;
          background:#00e5ff;
          border-radius:2px 9px 9px 2px;
          box-shadow:0 0 18px #00e5ff;
          animation:irFlagWave .45s ease-in-out infinite alternate;
        }
        #irRealFinishFlag .ir-base {
          position:absolute;
          left:14px;
          bottom:0;
          width:36px;
          height:10px;
          border-radius:50%;
          background:#00e5ff;
          box-shadow:0 0 18px #00e5ff;
        }
        @keyframes irFlagWave {
          from { transform:skewY(-3deg); }
          to { transform:skewY(4deg); }
        }
      `;
      document.head.appendChild(style);
    }

    function hide() {
      flag.style.setProperty("display", "none", "important");
    }

    function show() {
      flag.style.setProperty("display", "block", "important");
    }

    function progress() {
      const w = parseFloat(getComputedStyle(bar).width);
      const total = parseFloat(getComputedStyle(bar.parentElement).width);
      if (Number.isFinite(w) && Number.isFinite(total) && total > 0) {
        return Math.max(0, Math.min(1, w / total));
      }
      const inline = parseFloat(bar.style.width);
      return Number.isFinite(inline) ? inline / 100 : 0;
    }

    function update() {
      const overlay = document.getElementById("over");
      const title = String(document.getElementById("overTitle")?.textContent || "");
      const gameVisible = getComputedStyle(game).display !== "none";
      const overlayVisible = overlay && getComputedStyle(overlay).display !== "none";
      const p = progress();

      // Death or result screen: remove flag immediately.
      if (!gameVisible || overlayVisible || /TU ES MORT|TERMINÉ|CHAMPION/i.test(title)) {
        hide();
        if (/TU ES MORT/i.test(title)) deadUntil = Date.now() + 1000;
        return;
      }

      // A fresh run resets the death lock.
      if (p < 0.05) {
        deadUntil = 0;
        lastWidth = p;
        hide();
        return;
      }

      if (Date.now() < deadUntil) {
        hide();
        return;
      }

      // IMPORTANT: show the flag from 90% onward.
      // This is intentionally independent of level number/account/local mode.
      if (p >= 0.90 && p < 1.01) {
        const t = Math.max(0, Math.min(1, (p - 0.90) / 0.10));
        const start = Math.max(170, game.clientWidth * 0.88);
        const player = Math.max(90, game.clientWidth * 0.20);
        const target = player + 65;
        flag.style.setProperty("left", (start + (target - start) * t) + "px", "important");
        flag.style.setProperty("bottom", Math.max(95, game.clientHeight * 0.17) + "px", "important");
        show();
      } else {
        hide();
      }

      lastWidth = p;
    }

    // Run continuously so it cannot be blocked by the game engine.
    update();
    setInterval(update, 50);

    // Also react instantly to progress-bar changes.
    new MutationObserver(update).observe(bar, {
      attributes: true,
      attributeFilter: ["style", "class"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup, { once:true });
  } else {
    setup();
  }
})();

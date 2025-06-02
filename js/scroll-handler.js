/**
 * Ultra-Smooth Horizontal Navigation for Bonobo Bar & More
 * High-performance implementation with optimal scrolling
 */

(function () {
  "use strict";

  // Performance settings
  const SCROLL_MOMENTUM = 0.92;
  const SCROLL_THRESHOLD = 0.5;
  const DEBOUNCE_DELAY = 10;
  const SMOOTH_SCROLL_DURATION = 300;

  // Cache DOM elements
  let container = null;
  let navigation = null;
  let activeTab = null;
  let isInitialized = false;

  // Scroll state
  let velocity = 0;
  let amplitude = 0;
  let frame = 0;
  let timestamp = 0;
  let ticker = null;
  let pressed = false;
  let startX = 0;
  let scrollLeft = 0;

  // Touch/Mouse tracking
  let positions = [];
  let times = [];

  /**
   * Initialize with requestAnimationFrame optimization
   */
  function init() {
    if (isInitialized) return;

    requestAnimationFrame(() => {
      container = document.querySelector(".category-tabs-container");
      navigation = document.querySelector(".category-navigation");

      if (!container || !navigation) {
        setTimeout(init, 100);
        return;
      }

      isInitialized = true;
      setupSmoothScroll();
      setupEventListeners();
      updateIndicators();
      centerActiveTab(false);

      // Show hint for mobile users
      if (isMobile() && !localStorage.getItem("nav_hint_shown")) {
        showSwipeHint();
      }
    });
  }

  /**
   * Set up smooth momentum scrolling
   */
  function setupSmoothScroll() {
    // Disable native scroll behavior for custom implementation
    container.style.scrollBehavior = "auto";
    container.style.webkitOverflowScrolling = "auto";
  }

  /**
   * Track movement for velocity calculation
   */
  function track(x) {
    const now = Date.now();
    const elapsed = now - timestamp;
    timestamp = now;

    const delta = x - frame;
    frame = x;

    const v = (1000 * delta) / (1 + elapsed);
    velocity = 0.8 * v + 0.2 * velocity;

    positions.push(x);
    times.push(now);

    // Keep only last 100ms of data
    while (times.length > 0 && times[0] <= now - 100) {
      times.shift();
      positions.shift();
    }
  }

  /**
   * Auto-scroll with momentum
   */
  function autoScroll() {
    if (amplitude) {
      const elapsed = Date.now() - timestamp;
      const delta = -amplitude * Math.exp(-elapsed / 325);

      if (delta > 0.5 || delta < -0.5) {
        scroll(scrollLeft + delta);
        requestAnimationFrame(autoScroll);
      } else {
        scroll(scrollLeft + delta);
        updateIndicators();
      }
    }
  }

  /**
   * Smooth scroll to position
   */
  function scroll(x) {
    const max = container.scrollWidth - container.clientWidth;
    scrollLeft = Math.max(0, Math.min(x, max));
    container.scrollLeft = scrollLeft;
  }

  /**
   * Calculate velocity from tracked positions
   */
  function getVelocity() {
    if (positions.length < 2) return 0;

    const now = Date.now();
    let i = positions.length - 1;

    while (i > 0 && times[i] > now - 100) {
      i--;
    }

    if (i < 0) i = 0;

    const distance = positions[positions.length - 1] - positions[i];
    const time = Math.max(1, times[times.length - 1] - times[i]);

    return (1000 * distance) / time;
  }

  /**
   * Handle press start (mouse/touch)
   */
  function handlePressStart(clientX) {
    pressed = true;
    startX = clientX;
    velocity = 0;
    amplitude = 0;
    frame = scrollLeft = container.scrollLeft;
    timestamp = Date.now();

    clearInterval(ticker);
    ticker = setInterval(track.bind(null, scrollLeft), 10);

    positions = [scrollLeft];
    times = [timestamp];

    // Add active state
    container.style.cursor = "grabbing";
  }

  /**
   * Handle press move (mouse/touch)
   */
  function handlePressMove(clientX) {
    if (!pressed) return;

    const delta = startX - clientX;
    if (Math.abs(delta) > 2) {
      scroll(scrollLeft + delta);
      startX = clientX;
      track(container.scrollLeft);
    }
  }

  /**
   * Handle press end (mouse/touch)
   */
  function handlePressEnd() {
    if (!pressed) return;

    pressed = false;
    clearInterval(ticker);
    container.style.cursor = "grab";

    // Calculate final velocity
    velocity = getVelocity();

    if (Math.abs(velocity) > 10) {
      amplitude = 0.8 * velocity;
      scrollLeft = container.scrollLeft;
      timestamp = Date.now();
      requestAnimationFrame(autoScroll);
    } else {
      updateIndicators();
    }
  }

  /**
   * Set up all event listeners
   */
  function setupEventListeners() {
    // Mouse events for desktop
    container.addEventListener("mousedown", (e) => {
      if (e.button === 0) {
        e.preventDefault();
        handlePressStart(e.clientX);
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (pressed) {
        e.preventDefault();
        handlePressMove(e.clientX);
      }
    });

    window.addEventListener("mouseup", () => {
      handlePressEnd();
    });

    // Touch events for mobile
    container.addEventListener(
      "touchstart",
      (e) => {
        handlePressStart(e.touches[0].clientX);
      },
      { passive: true }
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        handlePressMove(e.touches[0].clientX);
      },
      { passive: true }
    );

    container.addEventListener("touchend", handlePressEnd, { passive: true });
    container.addEventListener("touchcancel", handlePressEnd, {
      passive: true,
    });

    // Wheel event for smooth horizontal scrolling
    container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaY || e.deltaX;

        // Smooth out the wheel delta
        const smoothDelta = Math.sign(delta) * Math.min(Math.abs(delta), 50);

        scroll(container.scrollLeft + smoothDelta);
        updateIndicators();
      },
      { passive: false }
    );

    // Optimize resize handling
    let resizeTimer;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          updateIndicators();
          centerActiveTab(true);
        }, 100);
      },
      { passive: true }
    );

    // Tab activation listener
    navigation.addEventListener("tabActivated", () => {
      centerActiveTab(true);
    });

    // Add hover effect
    container.style.cursor = "grab";
  }

  /**
   * Update scroll indicators efficiently
   */
  const updateIndicators = (() => {
    let rafId = null;

    return () => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;

        const scrollLeft = container.scrollLeft;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        const isScrollable = scrollWidth > clientWidth;

        if (!isScrollable) {
          container.classList.remove("show-start-fade", "show-end-fade");
          return;
        }

        container.classList.toggle("show-start-fade", scrollLeft > 5);
        container.classList.toggle(
          "show-end-fade",
          scrollLeft < scrollWidth - clientWidth - 5
        );
      });
    };
  })();

  /**
   * Smoothly center the active tab
   */
  function centerActiveTab(animate = true) {
    activeTab = container.querySelector(".category-tab.active");
    if (!activeTab) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const tabCenter = activeTab.offsetLeft + tabRect.width / 2;
    const containerCenter = containerRect.width / 2;
    const targetScroll = tabCenter - containerCenter;

    if (animate) {
      smoothScrollTo(targetScroll, SMOOTH_SCROLL_DURATION);
    } else {
      scroll(targetScroll);
      updateIndicators();
    }
  }

  /**
   * Smooth scroll to target with easing
   */
  function smoothScrollTo(target, duration) {
    const start = container.scrollLeft;
    const distance = target - start;
    const startTime = performance.now();

    function ease(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = ease(progress);

      scroll(start + distance * easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        updateIndicators();
      }
    }

    requestAnimationFrame(animate);
  }

  /**
   * Show swipe hint for first-time users
   */
  function showSwipeHint() {
    const hint = document.createElement("div");
    hint.className = "nav-swipe-hint";
    hint.innerHTML = `
      <div class="nav-swipe-hint-content">
        <i class="fas fa-hand-point-up"></i>
        <span>Swipe to see more categories</span>
      </div>
    `;

    // Add CSS
    const style = document.createElement("style");
    style.textContent = `
      .nav-swipe-hint {
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        margin-top: 8px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        white-space: nowrap;
        z-index: 1000;
        opacity: 0;
        animation: hintFadeIn 0.3s ease-out 0.5s forwards,
                   hintFadeOut 0.3s ease-out 3s forwards;
      }
      
      .nav-swipe-hint-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .nav-swipe-hint i {
        animation: hintBounce 1s ease-in-out infinite;
      }
      
      @keyframes hintFadeIn {
        to { opacity: 1; }
      }
      
      @keyframes hintFadeOut {
        to { opacity: 0; }
      }
      
      @keyframes hintBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
    `;

    document.head.appendChild(style);
    navigation.appendChild(hint);

    setTimeout(() => {
      hint.remove();
      style.remove();
      localStorage.setItem("nav_hint_shown", "true");
    }, 3500);
  }

  /**
   * Check if device is mobile
   */
  function isMobile() {
    return window.innerWidth <= 768 || "ontouchstart" in window;
  }

  // Public API
  window.menuScrolling = {
    centerActiveTab: () => centerActiveTab(true),
    updateIndicators: updateIndicators,
    init: init,
  };

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

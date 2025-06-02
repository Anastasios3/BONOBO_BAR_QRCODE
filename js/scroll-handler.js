/**
 * Ultra-Smooth Mobile Navigation Scrolling
 * Optimized for touch devices with perfect physics
 */

(function () {
  "use strict";

  // Enhanced physics constants for mobile
  const DECELERATION = 0.95; // Higher = longer momentum
  const MIN_VELOCITY = 0.2; // Minimum velocity before stopping
  const VELOCITY_MULTIPLIER = 2.5; // Amplify swipe velocity
  const SNAP_DURATION = 250; // Duration for snap animations
  const EDGE_RESISTANCE = 0.15; // Rubber band effect at edges
  const TOUCH_SLOP = 3; // Minimum movement to start scrolling

  // Performance settings
  const FPS = 60;
  const FRAME_TIME = 1000 / FPS;
  const MAX_VELOCITY = 4000; // Cap maximum velocity

  // DOM elements
  let container = null;
  let navigation = null;
  let tabs = [];
  let activeTab = null;
  let isInitialized = false;

  // State management
  let state = {
    isScrolling: false,
    isTouching: false,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    currentX: 0,
    lastX: 0,
    velocity: 0,
    amplitude: 0,
    timestamp: 0,
    frame: null,
    ticker: null,
    positions: [],
    times: [],
    lastScrollLeft: 0,
    targetScroll: null,
    snapTimeout: null,
  };

  // Initialize the scroll handler
  function init() {
    if (isInitialized) return;

    requestAnimationFrame(() => {
      container = document.querySelector(".category-tabs-container");
      navigation = document.querySelector(".category-navigation");

      if (!container || !navigation) {
        setTimeout(init, 100);
        return;
      }

      tabs = Array.from(container.querySelectorAll(".category-tab"));
      isInitialized = true;

      setupTouchHandlers();
      setupMouseHandlers();
      setupWheelHandler();
      setupResizeHandler();
      setupTabActivation();

      updateScrollState();
      ensureActiveTabVisible(false);

      // Show hint for first-time mobile users
      if (isTouchDevice() && !sessionStorage.getItem("swipe_hint_shown")) {
        showMobileHint();
      }
    });
  }

  // Setup touch event handlers for mobile
  function setupTouchHandlers() {
    let touchStartTime = 0;

    container.addEventListener(
      "touchstart",
      (e) => {
        if (state.ticker) {
          cancelAnimationFrame(state.ticker);
          state.ticker = null;
        }

        const touch = e.touches[0];
        touchStartTime = Date.now();

        state.isTouching = true;
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.startScrollLeft = container.scrollLeft;
        state.currentX = state.startX;
        state.lastX = state.startX;
        state.velocity = 0;
        state.amplitude = 0;
        state.timestamp = touchStartTime;
        state.lastScrollLeft = container.scrollLeft;

        // Reset tracking arrays
        state.positions = [container.scrollLeft];
        state.times = [touchStartTime];

        // Add scrolling class
        container.classList.add("scrolling");
      },
      { passive: true }
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        if (!state.isTouching) return;

        const touch = e.touches[0];
        const deltaX = state.startX - touch.clientX;
        const deltaY = Math.abs(state.startY - touch.clientY);

        // Check if horizontal scroll intent
        if (!state.isScrolling && Math.abs(deltaX) > TOUCH_SLOP) {
          // Prevent vertical scrolling if horizontal intent detected
          if (Math.abs(deltaX) > deltaY) {
            state.isScrolling = true;
          } else {
            state.isTouching = false;
            return;
          }
        }

        if (state.isScrolling) {
          e.preventDefault(); // Prevent vertical scroll

          const now = Date.now();
          const targetScroll = state.startScrollLeft + deltaX;

          // Apply edge resistance
          const maxScroll = container.scrollWidth - container.clientWidth;
          let finalScroll = targetScroll;

          if (targetScroll < 0) {
            finalScroll = targetScroll * EDGE_RESISTANCE;
          } else if (targetScroll > maxScroll) {
            const overflow = targetScroll - maxScroll;
            finalScroll = maxScroll + overflow * EDGE_RESISTANCE;
          }

          container.scrollLeft = finalScroll;

          // Track velocity
          state.currentX = touch.clientX;
          state.positions.push(finalScroll);
          state.times.push(now);

          // Keep only last 100ms of tracking data
          while (state.times.length > 0 && state.times[0] <= now - 100) {
            state.times.shift();
            state.positions.shift();
          }

          updateScrollState();
        }
      },
      { passive: false }
    );

    container.addEventListener(
      "touchend",
      (e) => {
        if (!state.isTouching) return;

        state.isTouching = false;
        state.isScrolling = false;
        container.classList.remove("scrolling");

        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - touchStartTime;

        // Calculate velocity from tracking data
        if (state.positions.length > 1) {
          const recentPositions = state.positions.slice(-5); // Last 5 positions
          const recentTimes = state.times.slice(-5);

          if (recentPositions.length > 1) {
            const distance =
              recentPositions[recentPositions.length - 1] - recentPositions[0];
            const time = recentTimes[recentTimes.length - 1] - recentTimes[0];

            if (time > 0) {
              state.velocity = (distance / time) * 1000 * VELOCITY_MULTIPLIER;

              // Cap velocity
              state.velocity = Math.max(
                -MAX_VELOCITY,
                Math.min(MAX_VELOCITY, state.velocity)
              );

              // Apply momentum scrolling if velocity is significant
              if (Math.abs(state.velocity) > MIN_VELOCITY * 100) {
                startMomentum();
              } else {
                // Snap to nearest comfortable position
                snapToNearestComfortablePosition();
              }
            }
          }
        } else {
          snapToNearestComfortablePosition();
        }
      },
      { passive: true }
    );

    container.addEventListener(
      "touchcancel",
      () => {
        state.isTouching = false;
        state.isScrolling = false;
        container.classList.remove("scrolling");
        snapToNearestComfortablePosition();
      },
      { passive: true }
    );
  }

  // Setup mouse handlers for desktop testing
  function setupMouseHandlers() {
    let isMouseDown = false;

    container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;

      isMouseDown = true;
      e.preventDefault();

      if (state.ticker) {
        cancelAnimationFrame(state.ticker);
        state.ticker = null;
      }

      state.isTouching = true;
      state.startX = e.clientX;
      state.startScrollLeft = container.scrollLeft;
      state.velocity = 0;
      state.amplitude = 0;
      state.timestamp = Date.now();

      container.style.cursor = "grabbing";
      container.classList.add("scrolling");
    });

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown || !state.isTouching) return;

      e.preventDefault();
      const deltaX = state.startX - e.clientX;
      container.scrollLeft = state.startScrollLeft + deltaX;

      updateScrollState();
    });

    window.addEventListener("mouseup", () => {
      if (!isMouseDown) return;

      isMouseDown = false;
      state.isTouching = false;
      container.style.cursor = "grab";
      container.classList.remove("scrolling");

      snapToNearestComfortablePosition();
    });
  }

  // Setup wheel handler for smooth horizontal scrolling
  function setupWheelHandler() {
    container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();

        // Convert vertical wheel to horizontal scroll
        const delta = e.deltaY || e.deltaX;
        const scrollAmount = delta * 0.5; // Reduce sensitivity

        container.scrollLeft += scrollAmount;
        updateScrollState();

        // Clear any existing snap timeout
        if (state.snapTimeout) {
          clearTimeout(state.snapTimeout);
        }

        // Snap after wheel stops
        state.snapTimeout = setTimeout(() => {
          snapToNearestComfortablePosition();
        }, 150);
      },
      { passive: false }
    );
  }

  // Momentum scrolling with improved physics
  function startMomentum() {
    state.amplitude = state.velocity;
    state.timestamp = Date.now();
    state.targetScroll = Math.round(
      container.scrollLeft + state.amplitude * 0.3
    );

    // Clamp to bounds
    const maxScroll = container.scrollWidth - container.clientWidth;
    state.targetScroll = Math.max(0, Math.min(state.targetScroll, maxScroll));

    if (state.ticker) {
      cancelAnimationFrame(state.ticker);
    }

    state.ticker = requestAnimationFrame(momentumStep);
  }

  // Single frame of momentum animation
  function momentumStep() {
    const now = Date.now();
    const elapsed = now - state.timestamp;
    const delta = -state.amplitude * Math.exp(-elapsed / 325);

    if (
      Math.abs(delta) > MIN_VELOCITY &&
      Math.abs(state.targetScroll - container.scrollLeft) > MIN_VELOCITY
    ) {
      container.scrollLeft = state.targetScroll + delta;
      updateScrollState();
      state.ticker = requestAnimationFrame(momentumStep);
    } else {
      container.scrollLeft = state.targetScroll;
      updateScrollState();
      snapToNearestComfortablePosition();
    }
  }

  // Snap to nearest comfortable position
  function snapToNearestComfortablePosition() {
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    // Don't snap if content fits in viewport
    if (scrollWidth <= containerWidth) return;

    // Find the best position to snap to
    let targetScroll = scrollLeft;

    // Check if we're near the edges
    if (scrollLeft < 50) {
      targetScroll = 0;
    } else if (scrollLeft > scrollWidth - containerWidth - 50) {
      targetScroll = scrollWidth - containerWidth;
    } else {
      // Find nearest tab edge for comfortable viewing
      let nearestDistance = Infinity;

      tabs.forEach((tab) => {
        const tabLeft = tab.offsetLeft;
        const tabRight = tabLeft + tab.offsetWidth;
        const tabCenter = tabLeft + tab.offsetWidth / 2;

        // Check various snap points
        const snapPoints = [
          tabLeft - 20, // Before tab with padding
          tabCenter - containerWidth / 2, // Center tab
          tabRight - containerWidth + 20, // After tab with padding
        ];

        snapPoints.forEach((point) => {
          const distance = Math.abs(point - scrollLeft);
          if (
            distance < nearestDistance &&
            point >= 0 &&
            point <= scrollWidth - containerWidth
          ) {
            nearestDistance = distance;
            targetScroll = point;
          }
        });
      });
    }

    // Only snap if we're not already there
    if (Math.abs(targetScroll - scrollLeft) > 1) {
      smoothScrollTo(targetScroll, SNAP_DURATION);
    }
  }

  // Smooth scroll to target position
  function smoothScrollTo(target, duration = SNAP_DURATION) {
    const start = container.scrollLeft;
    const distance = target - start;

    if (Math.abs(distance) < 1) return;

    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Smooth easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      container.scrollLeft = start + distance * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        updateScrollState();
      }
    }

    if (state.ticker) {
      cancelAnimationFrame(state.ticker);
    }

    requestAnimationFrame(animate);
  }

  // Ensure active tab is visible
  function ensureActiveTabVisible(animate = true) {
    activeTab = container.querySelector(".category-tab.active");
    if (!activeTab) return;

    const containerWidth = container.clientWidth;
    const scrollLeft = container.scrollLeft;
    const tabLeft = activeTab.offsetLeft;
    const tabWidth = activeTab.offsetWidth;
    const tabRight = tabLeft + tabWidth;

    let targetScroll = null;

    // Check if tab is fully visible
    if (tabLeft < scrollLeft + 20) {
      // Tab is too far left
      targetScroll = Math.max(0, tabLeft - 20);
    } else if (tabRight > scrollLeft + containerWidth - 20) {
      // Tab is too far right
      targetScroll = Math.min(
        container.scrollWidth - containerWidth,
        tabRight - containerWidth + 20
      );
    }

    // If we need to scroll, do it
    if (targetScroll !== null) {
      if (animate) {
        smoothScrollTo(targetScroll, SNAP_DURATION);
      } else {
        container.scrollLeft = targetScroll;
        updateScrollState();
      }
    }
  }

  // Update scroll indicators
  function updateScrollState() {
    requestAnimationFrame(() => {
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      const isScrollable = scrollWidth > clientWidth;

      if (!isScrollable) {
        container.classList.remove("show-start-fade", "show-end-fade");
        return;
      }

      // Show/hide edge fades with small buffer
      container.classList.toggle("show-start-fade", scrollLeft > 2);
      container.classList.toggle(
        "show-end-fade",
        scrollLeft < scrollWidth - clientWidth - 2
      );
    });
  }

  // Setup resize handler
  function setupResizeHandler() {
    let resizeTimer;

    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateScrollState();
        ensureActiveTabVisible(false);
      }, 100);
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, {
      passive: true,
    });
  }

  // Setup tab activation listener
  function setupTabActivation() {
    // Listen for custom event
    navigation.addEventListener("tabActivated", () => {
      ensureActiveTabVisible(true);
    });

    // Also observe class changes on tabs
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "class" &&
          mutation.target.classList.contains("active")
        ) {
          ensureActiveTabVisible(true);
        }
      });
    });

    tabs.forEach((tab) => {
      observer.observe(tab, { attributes: true, attributeFilter: ["class"] });
    });
  }

  // Show swipe hint for mobile users
  function showMobileHint() {
    const hint = document.createElement("div");
    hint.className = "swipe-hint-container";
    hint.innerHTML = `
      <div class="swipe-hint visible">
        <div class="swipe-hint-content">
          <i class="fas fa-hand-pointer swipe-hint-icon"></i>
          <span class="swipe-hint-text">Swipe to see more</span>
        </div>
      </div>
    `;

    document.body.appendChild(hint);

    setTimeout(() => {
      hint.querySelector(".swipe-hint").classList.remove("visible");
      setTimeout(() => {
        hint.remove();
        sessionStorage.setItem("swipe_hint_shown", "true");
      }, 300);
    }, 2500);
  }

  // Check if device supports touch
  function isTouchDevice() {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768
    );
  }

  // Public API
  window.menuScrolling = {
    centerActiveTab: () => ensureActiveTabVisible(true),
    updateIndicators: updateScrollState,
    scrollToTab: (index) => {
      if (tabs[index]) {
        const tab = tabs[index];
        const targetScroll = tab.offsetLeft - 20;
        smoothScrollTo(targetScroll);
      }
    },
    init: init,
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

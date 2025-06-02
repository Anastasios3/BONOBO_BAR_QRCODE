/**
 * Ultra-Smooth Mobile Navigation Scrolling with Fixed Tap Detection
 * Optimized for immediate button response
 */

(function () {
  "use strict";

  // Physics constants
  const DECELERATION = 0.95;
  const MIN_VELOCITY = 0.2;
  const VELOCITY_MULTIPLIER = 2.5;
  const SNAP_DURATION = 250;
  const EDGE_RESISTANCE = 0.15;

  // Touch detection thresholds
  const TAP_THRESHOLD = 10; // Maximum movement for a tap (increased from 3)
  const TAP_TIME_THRESHOLD = 200; // Maximum time for a tap in ms
  const SCROLL_THRESHOLD = 5; // Minimum movement to start scrolling

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
    isPotentialTap: true,
    touchStartTime: 0,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    currentX: 0,
    currentY: 0,
    velocity: 0,
    amplitude: 0,
    timestamp: 0,
    frame: null,
    ticker: null,
    positions: [],
    times: [],
    targetElement: null,
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
      setupClickHandlers();

      updateScrollState();
      ensureActiveTabVisible(false);

      // Show hint for first-time mobile users
      if (isTouchDevice() && !sessionStorage.getItem("swipe_hint_shown")) {
        showMobileHint();
      }
    });
  }

  // Setup click handlers for immediate response
  function setupClickHandlers() {
    // Add click listeners to all tabs
    tabs.forEach((tab) => {
      // Remove any existing listeners
      tab.removeEventListener("click", handleTabClick);
      // Add new listener with capture phase for priority
      tab.addEventListener("click", handleTabClick, { capture: true });

      // Also add touch feedback
      tab.addEventListener(
        "touchstart",
        function () {
          this.classList.add("tapped");
        },
        { passive: true }
      );

      tab.addEventListener(
        "touchend",
        function () {
          setTimeout(() => {
            this.classList.remove("tapped");
          }, 200);
        },
        { passive: true }
      );
    });
  }

  // Handle tab click
  function handleTabClick(e) {
    const tab = e.currentTarget;
    const category = tab.dataset.category;

    // Only process if not scrolling
    if (!state.isScrolling && category) {
      // Trigger the category selection immediately
      if (window.EventController && window.EventController.selectCategory) {
        window.EventController.selectCategory(category);
      }

      // Visual feedback
      tab.classList.add("tapped");
      setTimeout(() => {
        tab.classList.remove("tapped");
      }, 200);
    }
  }

  // Setup touch event handlers with better tap detection
  function setupTouchHandlers() {
    let touchMoved = false;
    let scrollStarted = false;

    container.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        state.touchStartTime = Date.now();
        touchMoved = false;
        scrollStarted = false;

        state.isTouching = true;
        state.isPotentialTap = true;
        state.startX = touch.clientX;
        state.startY = touch.clientY;
        state.currentX = state.startX;
        state.currentY = state.startY;
        state.startScrollLeft = container.scrollLeft;
        state.velocity = 0;
        state.amplitude = 0;
        state.timestamp = state.touchStartTime;

        // Store the target element
        state.targetElement = document.elementFromPoint(
          touch.clientX,
          touch.clientY
        );

        // Reset tracking
        state.positions = [container.scrollLeft];
        state.times = [state.touchStartTime];

        // Cancel any ongoing momentum
        if (state.ticker) {
          cancelAnimationFrame(state.ticker);
          state.ticker = null;
        }
      },
      { passive: true }
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        if (!state.isTouching) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - state.startX);
        const deltaY = Math.abs(touch.clientY - state.startY);
        const totalDelta = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        touchMoved = true;
        state.currentX = touch.clientX;
        state.currentY = touch.clientY;

        // Check if this is still a potential tap
        if (totalDelta > TAP_THRESHOLD) {
          state.isPotentialTap = false;
        }

        // Start scrolling if movement exceeds threshold and is horizontal
        if (!scrollStarted && deltaX > SCROLL_THRESHOLD && deltaX > deltaY) {
          scrollStarted = true;
          state.isScrolling = true;
          container.classList.add("scrolling");

          // Prevent default only when actually scrolling
          if (e.cancelable) {
            e.preventDefault();
          }
        }

        if (state.isScrolling) {
          const scrollDelta = state.startX - touch.clientX;
          const targetScroll = state.startScrollLeft + scrollDelta;

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

          // Track for momentum
          const now = Date.now();
          state.positions.push(finalScroll);
          state.times.push(now);

          // Keep only recent tracking data
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

        const touchDuration = Date.now() - state.touchStartTime;
        const wasScrolling = state.isScrolling;

        state.isTouching = false;
        state.isScrolling = false;
        container.classList.remove("scrolling");

        // Check if this was a tap
        if (
          state.isPotentialTap &&
          touchDuration < TAP_TIME_THRESHOLD &&
          !touchMoved
        ) {
          // This was a tap - let the click event handle it
          return;
        }

        // If we were scrolling, handle momentum
        if (wasScrolling && state.positions.length > 1) {
          const recentPositions = state.positions.slice(-5);
          const recentTimes = state.times.slice(-5);

          if (recentPositions.length > 1) {
            const distance =
              recentPositions[recentPositions.length - 1] - recentPositions[0];
            const time = recentTimes[recentTimes.length - 1] - recentTimes[0];

            if (time > 0) {
              state.velocity = (distance / time) * 1000 * VELOCITY_MULTIPLIER;

              // Apply momentum if significant
              if (Math.abs(state.velocity) > MIN_VELOCITY * 100) {
                startMomentum();
              } else {
                snapToNearestComfortablePosition();
              }
            }
          }
        } else if (wasScrolling) {
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
        state.isPotentialTap = false;
        container.classList.remove("scrolling");
      },
      { passive: true }
    );
  }

  // Setup mouse handlers for desktop
  function setupMouseHandlers() {
    let isMouseDown = false;
    let hasMoved = false;

    container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;

      // Check if clicking on a tab
      const tab = e.target.closest(".category-tab");
      if (tab) {
        // Let the click event handle it
        return;
      }

      isMouseDown = true;
      hasMoved = false;
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
    });

    window.addEventListener("mousemove", (e) => {
      if (!isMouseDown || !state.isTouching) return;

      e.preventDefault();
      hasMoved = true;

      const deltaX = state.startX - e.clientX;
      if (Math.abs(deltaX) > 2) {
        container.scrollLeft = state.startScrollLeft + deltaX;
        updateScrollState();
      }
    });

    window.addEventListener("mouseup", (e) => {
      if (!isMouseDown) return;

      isMouseDown = false;
      state.isTouching = false;
      container.style.cursor = "grab";

      if (hasMoved) {
        snapToNearestComfortablePosition();
      }
    });
  }

  // Setup wheel handler
  function setupWheelHandler() {
    container.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();

        const delta = e.deltaY || e.deltaX;
        const scrollAmount = delta * 0.5;

        container.scrollLeft += scrollAmount;
        updateScrollState();

        // Debounced snap
        if (state.snapTimeout) {
          clearTimeout(state.snapTimeout);
        }

        state.snapTimeout = setTimeout(() => {
          snapToNearestComfortablePosition();
        }, 150);
      },
      { passive: false }
    );
  }

  // Momentum scrolling
  function startMomentum() {
    state.amplitude = state.velocity;
    state.timestamp = Date.now();
    state.targetScroll = Math.round(
      container.scrollLeft + state.amplitude * 0.3
    );

    const maxScroll = container.scrollWidth - container.clientWidth;
    state.targetScroll = Math.max(0, Math.min(state.targetScroll, maxScroll));

    if (state.ticker) {
      cancelAnimationFrame(state.ticker);
    }

    state.ticker = requestAnimationFrame(momentumStep);
  }

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

  // Snap to comfortable position
  function snapToNearestComfortablePosition() {
    const scrollLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;

    if (scrollWidth <= containerWidth) return;

    let targetScroll = scrollLeft;

    if (scrollLeft < 50) {
      targetScroll = 0;
    } else if (scrollLeft > scrollWidth - containerWidth - 50) {
      targetScroll = scrollWidth - containerWidth;
    } else {
      let nearestDistance = Infinity;

      tabs.forEach((tab) => {
        const tabLeft = tab.offsetLeft;
        const tabRight = tabLeft + tab.offsetWidth;
        const tabCenter = tabLeft + tab.offsetWidth / 2;

        const snapPoints = [
          tabLeft - 20,
          tabCenter - containerWidth / 2,
          tabRight - containerWidth + 20,
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

    if (Math.abs(targetScroll - scrollLeft) > 1) {
      smoothScrollTo(targetScroll, SNAP_DURATION);
    }
  }

  // Smooth scroll animation
  function smoothScrollTo(target, duration = SNAP_DURATION) {
    const start = container.scrollLeft;
    const distance = target - start;

    if (Math.abs(distance) < 1) return;

    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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

    if (tabLeft < scrollLeft + 20) {
      targetScroll = Math.max(0, tabLeft - 20);
    } else if (tabRight > scrollLeft + containerWidth - 20) {
      targetScroll = Math.min(
        container.scrollWidth - containerWidth,
        tabRight - containerWidth + 20
      );
    }

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
        // Re-cache tabs in case they changed
        tabs = Array.from(container.querySelectorAll(".category-tab"));
        setupClickHandlers();
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
    navigation.addEventListener("tabActivated", () => {
      ensureActiveTabVisible(true);
    });

    // Observe class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const tab = mutation.target;
          if (tab.classList.contains("active")) {
            ensureActiveTabVisible(true);
          }
          // Re-setup click handlers if tabs change
          if (tab.classList.contains("category-tab")) {
            setupClickHandlers();
          }
        }
      });
    });

    tabs.forEach((tab) => {
      observer.observe(tab, { attributes: true, attributeFilter: ["class"] });
    });
  }

  // Show swipe hint
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

  // Check if touch device
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
    refreshTabs: () => {
      tabs = Array.from(container.querySelectorAll(".category-tab"));
      setupClickHandlers();
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

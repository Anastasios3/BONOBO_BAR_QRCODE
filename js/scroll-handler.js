/**
 * Enhanced Horizontal Scrolling for Bonobo Bar & More
 *
 * This script provides smooth, physics-based horizontal scrolling
 * for the category navigation with support for all devices and input methods.
 */

document.addEventListener("DOMContentLoaded", function () {
  // Initialize scroll functionality when DOM is ready
  initCategoryScroll();
});

/**
 * Initialize category scroll functionality
 */
function initCategoryScroll() {
  const categoryNavigation = document.querySelector(".category-navigation");
  if (!categoryNavigation) return;

  // Create scroll indicators
  createScrollIndicators(categoryNavigation);

  // Set up scroll event handlers
  setupScrollEventHandlers(categoryNavigation);

  // Set up touch-based scrolling with momentum
  setupTouchScrolling(categoryNavigation);

  // Set up keyboard navigation
  setupKeyboardNavigation(categoryNavigation);

  // Set up mouse wheel scrolling
  setupWheelScrolling(categoryNavigation);

  // Initial check for scroll indicators
  updateScrollIndicators(categoryNavigation);

  // Add intersection observer to better handle active tabs
  setupTabVisibilityObserver(categoryNavigation);

  // Enable active tab centering on resize
  window.addEventListener(
    "resize",
    debounce(() => {
      const activeTab = categoryNavigation.querySelector(
        ".category-tab.active"
      );
      if (activeTab) {
        centerTabInView(categoryNavigation, activeTab, 300);
      }
      updateScrollIndicators(categoryNavigation);
    }, 150)
  );
}

/**
 * Create scroll indicators for horizontal navigation
 * @param {HTMLElement} navigation - The navigation container
 */
function createScrollIndicators(navigation) {
  // Remove any existing indicators first
  const existingIndicators = navigation.querySelectorAll(".scroll-indicator");
  existingIndicators.forEach((indicator) => indicator.remove());

  // Create left indicator
  const leftIndicator = document.createElement("div");
  leftIndicator.className = "scroll-indicator scroll-indicator-left";
  leftIndicator.setAttribute("aria-label", "Scroll categories left");
  leftIndicator.setAttribute("role", "button");
  navigation.appendChild(leftIndicator);

  // Create right indicator
  const rightIndicator = document.createElement("div");
  rightIndicator.className = "scroll-indicator scroll-indicator-right";
  rightIndicator.setAttribute("aria-label", "Scroll categories right");
  rightIndicator.setAttribute("role", "button");
  navigation.appendChild(rightIndicator);

  // Add click events to indicators
  leftIndicator.addEventListener("click", () => {
    scrollByAmount(navigation, -navigation.clientWidth / 2);
  });

  rightIndicator.addEventListener("click", () => {
    scrollByAmount(navigation, navigation.clientWidth / 2);
  });
}

/**
 * Set up scroll event handlers
 * @param {HTMLElement} navigation - The navigation container
 */
function setupScrollEventHandlers(navigation) {
  // Update indicators when scrolling
  navigation.addEventListener(
    "scroll",
    debounce(() => {
      updateScrollIndicators(navigation);
    }, 100)
  );

  // Handle category tab selection
  const tabs = navigation.querySelectorAll(".category-tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Center the tab in view when clicked
      centerTabInView(navigation, tab, 400);
    });
  });
}

/**
 * Set up touch-based scrolling with momentum
 * @param {HTMLElement} navigation - The navigation container
 */
function setupTouchScrolling(navigation) {
  // Variables to track touch movement
  let isScrolling = false;
  let startX, startScrollLeft;
  let currentX, currentScrollLeft;
  let velocityX = 0;
  let lastTouchTime = 0;
  let animationFrameId = null;

  // Touch start handler
  navigation.addEventListener(
    "touchstart",
    (e) => {
      // Cancel any ongoing momentum scrolling
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }

      isScrolling = true;
      startX = e.touches[0].clientX;
      startScrollLeft = navigation.scrollLeft;
      currentX = startX;
      currentScrollLeft = startScrollLeft;
      velocityX = 0;
      lastTouchTime = Date.now();

      // Use auto scroll behavior during dragging for responsiveness
      navigation.style.scrollBehavior = "auto";
    },
    { passive: true }
  );

  // Touch move handler
  navigation.addEventListener(
    "touchmove",
    (e) => {
      if (!isScrolling) return;

      const now = Date.now();
      const timeElapsed = now - lastTouchTime;
      const newX = e.touches[0].clientX;
      const deltaX = newX - currentX;

      // Calculate velocity (pixels per millisecond)
      if (timeElapsed > 0) {
        velocityX = deltaX / timeElapsed;
      }

      currentX = newX;
      navigation.scrollLeft = currentScrollLeft - deltaX;
      currentScrollLeft = navigation.scrollLeft;
      lastTouchTime = now;

      // Update scroll indicators while dragging
      updateScrollIndicators(navigation);
    },
    { passive: true }
  );

  // Touch end handler
  navigation.addEventListener("touchend", () => {
    if (!isScrolling) return;
    isScrolling = false;

    // Apply momentum scrolling if significant velocity
    if (Math.abs(velocityX) > 0.1) {
      applyMomentumScrolling(navigation, velocityX);
    } else {
      // If movement was slow, snap to nearest category
      snapToNearestTab(navigation);
    }

    // Restore smooth scrolling for subsequent operations
    navigation.style.scrollBehavior = "smooth";
  });

  // Touch cancel handler
  navigation.addEventListener("touchcancel", () => {
    isScrolling = false;
    navigation.style.scrollBehavior = "smooth";

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });

  /**
   * Apply momentum scrolling based on final velocity
   * @param {HTMLElement} element - Element to scroll
   * @param {number} velocity - Velocity in pixels per millisecond
   */
  function applyMomentumScrolling(element, velocity) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    // Constants for physics-based momentum
    const deceleration = 0.0015; // Deceleration rate
    let amplitude = velocity * 300; // Initial amplitude based on velocity
    const startTime = Date.now();
    const startPosition = element.scrollLeft;

    // Animation function for momentum scrolling
    function momentumStep() {
      const elapsed = Date.now() - startTime;

      // Calculate new position with deceleration
      const delta = -amplitude * Math.exp(-elapsed / 325);
      const position = Math.round(startPosition + amplitude + delta);

      // Apply scrolling
      element.scrollLeft = position;

      // Continue animation if still moving
      if (Math.abs(delta) > 0.5) {
        animationFrameId = requestAnimationFrame(momentumStep);
      } else {
        // Snap to nearest category after momentum ends
        setTimeout(() => {
          snapToNearestTab(element);
        }, 50);
      }

      // Update scroll indicators during momentum
      updateScrollIndicators(element);
    }

    // Start momentum animation
    animationFrameId = requestAnimationFrame(momentumStep);
  }
}

/**
 * Set up keyboard navigation for categories
 * @param {HTMLElement} navigation - The navigation container
 */
function setupKeyboardNavigation(navigation) {
  // Set appropriate ARIA roles
  navigation.setAttribute("role", "tablist");

  const tabs = navigation.querySelectorAll(".category-tab");
  tabs.forEach((tab) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("tabindex", "0");

    // Handle keyboard navigation
    tab.addEventListener("keydown", (e) => {
      let newTab = null;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          newTab = getNextTab(tab);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newTab = getPreviousTab(tab);
          break;
        case "Home":
          e.preventDefault();
          newTab = getFirstTab();
          break;
        case "End":
          e.preventDefault();
          newTab = getLastTab();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          tab.click();
          break;
        default:
          return;
      }

      if (newTab) {
        newTab.focus();
        centerTabInView(navigation, newTab, 400);
      }
    });
  });

  /**
   * Get the next tab in sequence
   * @param {HTMLElement} currentTab - Current tab element
   * @returns {HTMLElement} Next tab element or null
   */
  function getNextTab(currentTab) {
    const tabs = Array.from(navigation.querySelectorAll(".category-tab"));
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex < tabs.length - 1) {
      return tabs[currentIndex + 1];
    }

    return null;
  }

  /**
   * Get the previous tab in sequence
   * @param {HTMLElement} currentTab - Current tab element
   * @returns {HTMLElement} Previous tab element or null
   */
  function getPreviousTab(currentTab) {
    const tabs = Array.from(navigation.querySelectorAll(".category-tab"));
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex > 0) {
      return tabs[currentIndex - 1];
    }

    return null;
  }

  /**
   * Get the first tab in sequence
   * @returns {HTMLElement} First tab element
   */
  function getFirstTab() {
    const tabs = navigation.querySelectorAll(".category-tab");
    return tabs[0] || null;
  }

  /**
   * Get the last tab in sequence
   * @returns {HTMLElement} Last tab element
   */
  function getLastTab() {
    const tabs = navigation.querySelectorAll(".category-tab");
    return tabs[tabs.length - 1] || null;
  }
}

/**
 * Set up mouse wheel scrolling for horizontal navigation
 * @param {HTMLElement} navigation - The navigation container
 */
function setupWheelScrolling(navigation) {
  navigation.addEventListener(
    "wheel",
    (e) => {
      // Prevent vertical scrolling of the page
      if (
        Math.abs(e.deltaX) < Math.abs(e.deltaY) &&
        navigation.scrollWidth > navigation.clientWidth
      ) {
        e.preventDefault();

        // Normalize delta for consistent scrolling across browsers
        const normalizedDelta = e.deltaY * 1.5;

        // Apply scrolling
        navigation.scrollLeft += normalizedDelta;

        // Update indicators after scrolling
        updateScrollIndicators(navigation);
      }
    },
    { passive: false }
  );
}

/**
 * Scroll the navigation by a specific amount
 * @param {HTMLElement} navigation - The navigation container
 * @param {number} amount - Amount to scroll in pixels
 */
function scrollByAmount(navigation, amount) {
  if (!navigation) return;

  // Apply smooth animation
  navigation.style.scrollBehavior = "smooth";
  navigation.scrollBy({ left: amount, behavior: "smooth" });

  // Update indicators after scrolling
  setTimeout(() => {
    updateScrollIndicators(navigation);
  }, 400);
}

/**
 * Center a tab in the navigation view
 * @param {HTMLElement} navigation - The navigation container
 * @param {HTMLElement} tab - The tab to center
 * @param {number} duration - Animation duration in milliseconds
 */
function centerTabInView(navigation, tab, duration = 300) {
  if (!navigation || !tab) return;

  // Calculate the position to center the tab
  const tabRect = tab.getBoundingClientRect();
  const navRect = navigation.getBoundingClientRect();

  const tabCenter = tab.offsetLeft + tabRect.width / 2;
  const navCenter = navRect.width / 2;

  // Target scroll position to center the tab
  const targetScroll = tabCenter - navCenter;

  // Apply smooth scrolling
  navigation.style.scrollBehavior = "smooth";
  navigation.scrollTo({
    left: targetScroll,
    behavior: "smooth",
  });

  // Update indicators after scrolling
  setTimeout(() => {
    updateScrollIndicators(navigation);
  }, duration);
}

/**
 * Snap to the nearest tab after scrolling stops
 * @param {HTMLElement} navigation - The navigation container
 */
function snapToNearestTab(navigation) {
  if (!navigation) return;

  const tabs = Array.from(navigation.querySelectorAll(".category-tab"));
  if (tabs.length === 0) return;

  // Calculate the center point of the viewport
  const viewportCenter = navigation.scrollLeft + navigation.clientWidth / 2;

  // Find the closest tab to the center of the viewport
  let closestTab = tabs[0];
  let closestDistance = Infinity;

  tabs.forEach((tab) => {
    const tabCenter = tab.offsetLeft + tab.offsetWidth / 2;
    const distance = Math.abs(tabCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestTab = tab;
    }
  });

  // Center the closest tab in view
  if (closestTab) {
    centerTabInView(navigation, closestTab, 300);
  }
}

/**
 * Update scroll indicators based on scroll position
 * @param {HTMLElement} navigation - The navigation container
 */
function updateScrollIndicators(navigation) {
  if (!navigation) return;

  const leftIndicator = navigation.querySelector(".scroll-indicator-left");
  const rightIndicator = navigation.querySelector(".scroll-indicator-right");

  // Get scroll position and width
  const scrollLeft = navigation.scrollLeft;
  const scrollWidth = navigation.scrollWidth;
  const clientWidth = navigation.clientWidth;

  // Check if content is scrollable
  const isScrollable = scrollWidth > clientWidth;

  // Left indicator visibility (show when scrolled)
  if (leftIndicator) {
    const showLeft = isScrollable && scrollLeft > 20;
    leftIndicator.classList.toggle("visible", showLeft);
  }

  // Right indicator visibility (show when more content is available)
  if (rightIndicator) {
    const maxScroll = scrollWidth - clientWidth;
    const showRight = isScrollable && scrollLeft < maxScroll - 20;
    rightIndicator.classList.toggle("visible", showRight);
  }
}

/**
 * Set up tab visibility observer using IntersectionObserver
 * @param {HTMLElement} navigation - The navigation container
 */
function setupTabVisibilityObserver(navigation) {
  if (!("IntersectionObserver" in window)) return;

  const options = {
    root: navigation,
    rootMargin: "0px",
    threshold: 0.8, // 80% visibility threshold
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      } else {
        entry.target.classList.remove("in-view");
      }
    });
  }, options);

  // Observe all tabs
  const tabs = navigation.querySelectorAll(".category-tab");
  tabs.forEach((tab) => {
    observer.observe(tab);
  });
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

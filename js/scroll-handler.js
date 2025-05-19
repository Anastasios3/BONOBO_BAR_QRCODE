/**
 * Reliable Horizontal Scrolling for Bonobo Bar & More
 *
 * A straightforward implementation that ensures smooth horizontal scrolling
 * with minimal complexity and maximum reliability.
 */

document.addEventListener("DOMContentLoaded", function () {
  initializeScrolling();
});

/**
 * Initialize the scrolling functionality
 */
function initializeScrolling() {
  const categoryNavigation = document.querySelector(".category-navigation");
  if (!categoryNavigation) return;

  // Set up edge indicators
  setupEdgeIndicators(categoryNavigation);

  // Show first-time guidance if needed
  const isFirstVisit = !localStorage.getItem("category_scrolled");
  if (isFirstVisit) {
    showScrollGuidance();
  }

  // Center active tab on page load
  centerActiveTab(categoryNavigation);

  // Setup event listeners
  setupEventListeners(categoryNavigation);
}

/**
 * Set up edge indicators to show when more content is available
 * @param {HTMLElement} container - The scrollable container
 */
function setupEdgeIndicators(container) {
  // Initial check
  updateEdgeIndicators(container);

  // Add scroll event listener to update indicators
  container.addEventListener("scroll", function () {
    updateEdgeIndicators(container);
  });

  // Add resize listener to update indicators when window size changes
  window.addEventListener("resize", function () {
    updateEdgeIndicators(container);
  });
}

/**
 * Update edge fade indicators based on scroll position
 * @param {HTMLElement} container - The scrollable container
 */
function updateEdgeIndicators(container) {
  // Get scroll metrics
  const scrollLeft = container.scrollLeft;
  const scrollWidth = container.scrollWidth;
  const clientWidth = container.clientWidth;
  const maxScroll = scrollWidth - clientWidth;

  // Check if container is scrollable
  const isScrollable = scrollWidth > clientWidth;

  if (!isScrollable) {
    container.classList.remove("show-start-fade", "show-end-fade");
    return;
  }

  // Show start fade when scrolled
  container.classList.toggle("show-start-fade", scrollLeft > 10);

  // Show end fade when more content is available
  container.classList.toggle("show-end-fade", scrollLeft < maxScroll - 10);
}

/**
 * Show first-time scrolling guidance
 * FIXED: Now displayed in a fixed position overlay for better visibility
 */
function showScrollGuidance() {
  // First check if there's already a hint container
  let hintContainer = document.querySelector(".swipe-hint-container");

  if (!hintContainer) {
    // Create a new container for the hint that's fixed to the viewport
    hintContainer = document.createElement("div");
    hintContainer.className = "swipe-hint-container";
    document.body.appendChild(hintContainer);

    // Create the hint element within the container
    const hint = document.createElement("div");
    hint.className = "swipe-hint";

    const content = document.createElement("div");
    content.className = "swipe-hint-content";

    const icon = document.createElement("div");
    icon.className = "swipe-hint-icon";
    icon.innerHTML =
      '<i class="fas fa-chevron-left"></i><i class="fas fa-chevron-right"></i>';

    const text = document.createElement("div");
    text.className = "swipe-hint-text";
    text.textContent = "Swipe to browse categories";

    content.appendChild(icon);
    content.appendChild(text);
    hint.appendChild(content);
    hintContainer.appendChild(hint);

    // Show with slight delay
    setTimeout(() => {
      hint.classList.add("visible");

      // Remove after animation
      setTimeout(() => {
        hint.classList.remove("visible");

        // Remove from DOM
        setTimeout(() => {
          hintContainer.remove();
        }, 1000);

        // Mark as visited
        localStorage.setItem("category_scrolled", "true");
      }, 3000);
    }, 800);
  }
}

/**
 * Set up necessary event listeners
 * @param {HTMLElement} container - The scrollable container
 */
function setupEventListeners(container) {
  // Listen for tabActivated events
  container.addEventListener("tabActivated", function () {
    centerActiveTab(container);
  });

  // Add wheel event handler for better horizontal scrolling with mouse wheel
  container.addEventListener(
    "wheel",
    function (e) {
      // If shift key is not pressed and scrolling vertically
      if (!e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    },
    { passive: false }
  );

  // Listen for keyboard navigation
  container.addEventListener("keydown", function (e) {
    const tabs = Array.from(container.querySelectorAll(".category-tab"));
    if (tabs.length === 0) return;

    // Find the active tab index
    const activeIndex = tabs.findIndex((tab) =>
      tab.classList.contains("active")
    );
    if (activeIndex === -1) return;

    let newIndex = activeIndex;

    // Handle arrow keys
    if (e.key === "ArrowRight" || e.key === "Right") {
      e.preventDefault();
      newIndex = Math.min(activeIndex + 1, tabs.length - 1);
    } else if (e.key === "ArrowLeft" || e.key === "Left") {
      e.preventDefault();
      newIndex = Math.max(activeIndex - 1, 0);
    }

    // If index changed, trigger the tab
    if (newIndex !== activeIndex) {
      tabs[newIndex].click();
    }
  });
}

/**
 * Center the active tab in the container
 * @param {HTMLElement} container - The scrollable container
 */
function centerActiveTab(container) {
  const activeTab = container.querySelector(".category-tab.active");
  if (!activeTab) return;

  // Calculate the position to center the tab
  const tabRect = activeTab.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  const tabCenter = activeTab.offsetLeft + tabRect.width / 2;
  const containerCenter = containerRect.width / 2;

  // Smooth scroll to center the tab
  container.scrollTo({
    left: tabCenter - containerCenter,
    behavior: "smooth",
  });

  // Update edge indicators after scrolling
  setTimeout(() => {
    updateEdgeIndicators(container);
  }, 300);
}

/**
 * Utility function to snap to the nearest tab
 * @param {HTMLElement} container - The scrollable container
 */
function snapToNearestTab(container) {
  const tabs = Array.from(container.querySelectorAll(".category-tab"));
  if (tabs.length === 0) return;

  // Calculate viewport center
  const viewportCenter = container.scrollLeft + container.clientWidth / 2;

  // Find the closest tab to the viewport center
  let closestTab = null;
  let closestDistance = Infinity;

  tabs.forEach((tab) => {
    const tabRect = tab.getBoundingClientRect();
    const tabCenter = tab.offsetLeft + tabRect.width / 2;
    const distance = Math.abs(tabCenter - viewportCenter);

    if (distance < closestDistance) {
      closestDistance = distance;
      closestTab = tab;
    }
  });

  // If we found a close tab, snap to it
  if (closestTab) {
    const tabRect = closestTab.getBoundingClientRect();
    const tabCenter = closestTab.offsetLeft + tabRect.width / 2;
    const containerCenter = container.clientWidth / 2;

    container.scrollTo({
      left: tabCenter - containerCenter,
      behavior: "smooth",
    });
  }
}

/**
 * External API for other components to use
 */
window.menuScrolling = {
  centerActiveTab: function () {
    const container = document.querySelector(".category-navigation");
    if (container) {
      centerActiveTab(container);
    }
  },

  updateIndicators: function () {
    const container = document.querySelector(".category-navigation");
    if (container) {
      updateEdgeIndicators(container);
    }
  },
};

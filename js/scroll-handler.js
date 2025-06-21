/**
 * Simplified Navigation Scrolling
 * Basic scroll handling with tab centering
 */

(function () {
  "use strict";

  let container = null;
  let isInitialized = false;

  // Initialize the scroll handler
  function init() {
    if (isInitialized) return;

    container = document.querySelector(".category-tabs-container");
    if (!container) {
      setTimeout(init, 100);
      return;
    }

    isInitialized = true;

    // Add basic event listeners
    setupEventListeners();

    // Center active tab on load
    setTimeout(centerActiveTab, 100);
  }

  // Setup event listeners
  function setupEventListeners() {
    // Listen for tab activation
    const navigation = document.querySelector(".category-navigation");
    if (navigation) {
      navigation.addEventListener("tabActivated", centerActiveTab);
    }

    // Watch for active class changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.target.classList.contains("category-tab") &&
          mutation.target.classList.contains("active")
        ) {
          centerActiveTab();
        }
      });
    });

    // Observe all tabs
    const tabs = container.querySelectorAll(".category-tab");
    tabs.forEach((tab) => {
      observer.observe(tab, {
        attributes: true,
        attributeFilter: ["class"],
      });
    });
  }

  // Center the active tab
  function centerActiveTab() {
    const activeTab = container.querySelector(".category-tab.active");
    if (!activeTab) return;

    const containerWidth = container.clientWidth;
    const tabLeft = activeTab.offsetLeft;
    const tabWidth = activeTab.offsetWidth;
    const tabCenter = tabLeft + tabWidth / 2;
    const scrollTarget = tabCenter - containerWidth / 2;

    // Smooth scroll to center
    container.scrollTo({
      left: scrollTarget,
      behavior: "smooth",
    });
  }

  // Public API
  window.menuScrolling = {
    centerActiveTab: centerActiveTab,
    updateIndicators: () => {}, // No-op for compatibility
    scrollToTab: (index) => {
      const tabs = container.querySelectorAll(".category-tab");
      if (tabs[index]) {
        tabs[index].scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    },
    refreshTabs: () => {},
    init: init,
  };

  // Initialize when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

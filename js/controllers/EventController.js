/**
 * Event Controller - Enhanced with improved mobile interactions and Modal Support
 * Manages all event handling for the application
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { ModalController } from "./ModalController.js";
import { debounce } from "../utils/helpers.js";

export const EventController = {
  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    this.setupModalController();
    this.setupThemeToggle();
    this.setupLanguageToggle();
    this.setupCategorySelection();
    this.setupFilterToggle();
    this.setupFilterSelection();
    this.setupGlobalEvents();
    this.setupScrollNavigation();
    this.setupBackToTop();
  },

  /**
   * Initialize modal controller
   */
  setupModalController() {
    // Initialize the modal system
    ModalController.init();
  },

  /**
   * Set up theme toggle functionality
   */
  setupThemeToggle() {
    const themeToggle = UIController.elements.themeToggle;

    if (themeToggle) {
      themeToggle.addEventListener("click", () => {
        const newTheme = AppState.theme === "dark" ? "light" : "dark";
        AppState.setTheme(newTheme);

        // Provide haptic feedback on mobile devices if supported
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(50);
        }
      });

      // Add keyboard support
      themeToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          themeToggle.click();
        }
      });
    }
  },

  /**
   * Set up language selection with modal sync
   */
  setupLanguageToggle() {
    const languageOptions = UIController.elements.languageOptions;

    if (languageOptions) {
      languageOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const lang = option.dataset.lang;

          if (lang && lang !== AppState.language) {
            AppState.setLanguage(lang);
            UIController.updateUITexts();

            // Refresh current view if needed
            if (AppState.currentCategory) {
              this.refreshCurrentView();
            }

            // Notify modal of language change
            ModalController.onAppLanguageChange();

            // Provide haptic feedback on mobile devices if supported
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        });

        // Add keyboard support
        option.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            option.click();
          }
        });
      });
    }
  },

  /**
   * Set up category selection events with improved touch handling
   */
  setupCategorySelection() {
    const menuCategories = UIController.elements.menuCategories;

    if (menuCategories) {
      // Desktop click handling
      menuCategories.addEventListener("click", (e) => {
        const categoryTab = e.target.closest(".category-tab");

        if (categoryTab) {
          const category = categoryTab.dataset.category;

          if (category && category !== AppState.currentCategory) {
            this.selectCategory(category);

            // Provide haptic feedback on mobile devices if supported
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(50);
            }
          }
        }
      });

      // Mobile swipe gesture support for category navigation
      this.setupCategorySwipeNavigation();

      // Add keyboard navigation support
      menuCategories.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          e.preventDefault();

          const tabs = Array.from(document.querySelectorAll(".category-tab"));
          const activeTabIndex = tabs.findIndex((tab) =>
            tab.classList.contains("active")
          );

          if (activeTabIndex === -1) return;

          let nextIndex;
          if (e.key === "ArrowRight") {
            nextIndex = (activeTabIndex + 1) % tabs.length;
          } else {
            nextIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
          }

          const nextCategory = tabs[nextIndex].dataset.category;
          this.selectCategory(nextCategory);
        }
      });
    }
  },

  /**
   * Set up swipe navigation between categories
   */
  setupCategorySwipeNavigation() {
    const menuContainer = document.querySelector(".menu-container");
    if (!menuContainer) return;

    // Variables to track touch events
    let touchStartX = 0;
    let touchEndX = 0;
    const minSwipeDistance = 80; // Minimum swipe distance to trigger navigation

    // Add touch event listeners
    menuContainer.addEventListener(
      "touchstart",
      (e) => {
        // Don't handle swipes if modal is open
        if (ModalController.isModalOpen()) return;

        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );

    menuContainer.addEventListener(
      "touchend",
      (e) => {
        // Don't handle swipes if modal is open
        if (ModalController.isModalOpen()) return;

        touchEndX = e.changedTouches[0].screenX;
        this.handleCategorySwipe(touchStartX, touchEndX, minSwipeDistance);
      },
      { passive: true }
    );
  },

  /**
   * Handle category swipe gesture
   * @param {number} startX - Touch start X position
   * @param {number} endX - Touch end X position
   * @param {number} minDistance - Minimum swipe distance
   */
  handleCategorySwipe(startX, endX, minDistance) {
    const swipeDistance = endX - startX;

    // Only process substantial swipes
    if (Math.abs(swipeDistance) < minDistance) return;

    // Get all available categories
    const availableCategories = AppState.getAvailableCategories();
    const currentIndex = availableCategories.indexOf(AppState.currentCategory);

    if (currentIndex === -1) return;

    let nextCategory;

    // Swipe right to go to previous category
    if (swipeDistance > 0 && currentIndex > 0) {
      nextCategory = availableCategories[currentIndex - 1];
    }
    // Swipe left to go to next category
    else if (
      swipeDistance < 0 &&
      currentIndex < availableCategories.length - 1
    ) {
      nextCategory = availableCategories[currentIndex + 1];
    }

    if (nextCategory) {
      this.selectCategory(nextCategory);

      // Provide haptic feedback if supported
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(70);
      }
    }
  },

  /**
   * Set up filter toggle functionality
   */
  setupFilterToggle() {
    const filterToggle = UIController.elements.filterToggle;

    if (filterToggle) {
      filterToggle.addEventListener("click", () => {
        UIController.toggleFilterPanel();

        // Provide haptic feedback on mobile devices if supported
        if (window.navigator && window.navigator.vibrate) {
          window.navigator.vibrate(30);
        }
      });

      // Add keyboard support
      filterToggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          filterToggle.click();
        }
      });
    }
  },

  /**
   * Set up filter selection events
   */
  setupFilterSelection() {
    const subcategoryFilters = UIController.elements.subcategoryFilters;

    if (subcategoryFilters) {
      subcategoryFilters.addEventListener("click", (e) => {
        const filterChip = e.target.closest(".filter-chip");

        if (filterChip) {
          const filter = filterChip.dataset.filter;
          const newFilter = filter === "all" ? null : filter;

          if (newFilter !== AppState.currentFilter) {
            this.selectFilter(newFilter);

            // Provide haptic feedback on mobile devices if supported
            if (window.navigator && window.navigator.vibrate) {
              window.navigator.vibrate(30);
            }
          }
        }
      });

      // Add keyboard support for filter chips
      subcategoryFilters.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          const filterChip = e.target.closest(".filter-chip");
          if (filterChip) {
            e.preventDefault();
            filterChip.click();
          }
        }
      });
    }
  },

  /**
   * Set up back to top button
   */
  setupBackToTop() {
    const backToTopBtn = document.querySelector(".back-to-top");

    if (!backToTopBtn) {
      // Create back to top button if it doesn't exist
      this.createBackToTopButton();
      return;
    }

    // Show/hide button based on scroll position
    window.addEventListener(
      "scroll",
      debounce(() => {
        const scrollPosition =
          window.scrollY || document.documentElement.scrollTop;

        if (scrollPosition > 300) {
          backToTopBtn.classList.add("visible");
        } else {
          backToTopBtn.classList.remove("visible");
        }
      }, 100)
    );

    // Scroll to top when clicked
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      // Provide haptic feedback on mobile devices if supported
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(30);
      }
    });
  },

  /**
   * Create back to top button if it doesn't exist
   */
  createBackToTopButton() {
    const backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.setAttribute("aria-label", "Scroll to top");
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';

    document.body.appendChild(backToTopBtn);

    // Call setup once created
    this.setupBackToTop();
  },

  /**
   * Set up horizontal scrolling navigation controls
   */
  setupScrollNavigation() {
    const categoryNavigation = UIController.elements.categoryNavigation;

    if (!categoryNavigation) return;

    // Add keyboard navigation for the category tabs
    categoryNavigation.setAttribute("role", "tablist");
    categoryNavigation.setAttribute("aria-label", "Menu Categories");

    // Add wheel event listener for horizontal scrolling with mouse wheel
    categoryNavigation.addEventListener(
      "wheel",
      (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          categoryNavigation.scrollLeft += e.deltaY;
          this.updateScrollIndicators();
        }
      },
      { passive: false }
    );

    // Update scroll indicators while scrolling
    categoryNavigation.addEventListener(
      "scroll",
      debounce(() => {
        this.updateScrollIndicators();
      }, 50)
    );
  },

  /**
   * Set up global document events with modal awareness
   */
  setupGlobalEvents() {
    // Close filter panel when clicking outside
    document.addEventListener("click", (e) => {
      // Don't handle if modal is open
      if (ModalController.isModalOpen()) return;

      const filterPanel = UIController.elements.filterPanel;
      const filterToggle = UIController.elements.filterToggle;

      if (
        filterPanel &&
        filterPanel.classList.contains("active") &&
        filterToggle &&
        !filterToggle.contains(e.target) &&
        !filterPanel.contains(e.target)
      ) {
        UIController.toggleFilterPanel(false);
      }
    });

    // Handle keyboard events with modal awareness
    document.addEventListener("keydown", (e) => {
      // Don't handle app keyboard events if modal is open
      if (ModalController.isModalOpen()) {
        return; // Let modal handle its own keyboard events
      }

      // Close filter panel on Escape key
      if (e.key === "Escape") {
        UIController.toggleFilterPanel(false);
      }

      // Focus trap for filter panel
      this.handleFocusTrap(e);
    });

    // Handle scroll events for navigation
    const categoryNavigation = UIController.elements.categoryNavigation;
    if (categoryNavigation) {
      categoryNavigation.addEventListener(
        "scroll",
        debounce(() => {
          this.updateScrollIndicators();
        }, 100)
      );
    }

    // Handle responsive adjustments
    window.addEventListener(
      "resize",
      debounce(() => {
        this.handleResponsiveLayout();
      }, 200)
    );

    // Handle orientation change on mobile
    window.addEventListener(
      "orientationchange",
      debounce(() => {
        this.handleOrientationChange();
      }, 200)
    );

    // Handle network status for offline mode
    window.addEventListener("online", () => {
      this.handleNetworkChange(true);
    });

    window.addEventListener("offline", () => {
      this.handleNetworkChange(false);
    });

    // Initial check for network status
    if (navigator.onLine === false) {
      this.handleNetworkChange(false);
    }
  },

  /**
   * Handle focus trap for modal elements
   * @param {Event} e - Keyboard event
   */
  handleFocusTrap(e) {
    if (e.key !== "Tab") return;

    const filterPanel = UIController.elements.filterPanel;

    if (filterPanel && filterPanel.classList.contains("active")) {
      const focusableElements = filterPanel.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Trap focus within the panel
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  },

  /**
   * Handle orientation change on mobile devices
   */
  handleOrientationChange() {
    // Wait for the orientation change to complete
    setTimeout(() => {
      // Update scroll indicators
      this.updateScrollIndicators();

      // Scroll active category into view
      this.scrollActiveCategoryIntoView();

      // Refresh current view if needed
      if (AppState.currentCategory) {
        UIController.displayMenuItems(
          AppState.getFilteredItems(
            AppState.currentCategory,
            AppState.currentFilter
          ),
          AppState.currentCategory
        );
      }
    }, 300);
  },

  /**
   * Handle network status change
   * @param {boolean} isOnline - Whether the device is online
   */
  handleNetworkChange(isOnline) {
    const appContainer = document.querySelector(".app-container");

    if (!appContainer) return;

    if (!isOnline) {
      // Create offline notification if it doesn't exist
      if (!document.querySelector(".offline-notification")) {
        const notification = document.createElement("div");
        notification.className = "offline-notification";
        notification.textContent =
          "You are currently offline. Some features may be limited.";

        appContainer.insertBefore(notification, appContainer.firstChild);

        // Animate in
        setTimeout(() => {
          notification.classList.add("active");
        }, 10);
      }
    } else {
      // Remove offline notification if it exists
      const notification = document.querySelector(".offline-notification");

      if (notification) {
        notification.classList.remove("active");

        // Remove from DOM after animation
        setTimeout(() => {
          notification.remove();
        }, 300);
      }
    }
  },

  /**
   * Select a category and display its items
   * @param {string} category - Category ID
   */
  selectCategory(category) {
    AppState.currentCategory = category;
    AppState.currentFilter = null;

    // Update UI
    UIController.updateActiveCategory(category);
    UIController.generateFilterOptions(category);
    UIController.toggleFilterPanel(false);

    // Display items
    const items = AppState.getFilteredItems(category);
    UIController.displayMenuItems(items, category);

    // Scroll to top if needed
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Scroll active category into view
    setTimeout(() => {
      this.scrollActiveCategoryIntoView();
    }, 100);

    // Update page title for better accessibility
    document.title = `${AppState.getText(
      "categories",
      category
    )} - Bonobo Bar & More`;
  },

  /**
   * Select a filter and update displayed items
   * @param {string|null} filter - Filter ID
   */
  selectFilter(filter) {
    if (!AppState.currentCategory) {
      return;
    }

    AppState.currentFilter = filter;

    // Update UI
    UIController.updateActiveFilter(filter);

    // Get and display filtered items
    const items = AppState.getFilteredItems(AppState.currentCategory, filter);
    UIController.displayMenuItems(items, AppState.currentCategory);

    // Update page title for better accessibility
    const categoryText = AppState.getText(
      "categories",
      AppState.currentCategory
    );
    const filterText = filter
      ? AppState.getText("subcategories", AppState.currentCategory, filter)
      : null;

    document.title = filterText
      ? `${filterText} - ${categoryText} - Bonobo Bar & More`
      : `${categoryText} - Bonobo Bar & More`;
  },

  /**
   * Refresh the current view (after language change)
   */
  refreshCurrentView() {
    const category = AppState.currentCategory;
    const filter = AppState.currentFilter;

    if (!category) {
      return;
    }

    // Regenerate category navigation
    UIController.generateCategoryTabs();
    UIController.generateCategoryList();

    // Update active category
    UIController.updateActiveCategory(category);

    // Update filter options
    UIController.generateFilterOptions(category, filter);

    // Display items
    const items = AppState.getFilteredItems(category, filter);
    UIController.displayMenuItems(items, category);

    // Scroll active category into view after refresh
    setTimeout(() => {
      this.scrollActiveCategoryIntoView();
    }, 100);

    // Update page title
    const categoryText = AppState.getText("categories", category);
    const filterText = filter
      ? AppState.getText("subcategories", category, filter)
      : null;

    document.title = filterText
      ? `${filterText} - ${categoryText} - Bonobo Bar & More`
      : `${categoryText} - Bonobo Bar & More`;
  },

  /**
   * Handle responsive layout adjustments
   */
  handleResponsiveLayout() {
    // Update scroll indicators when window resizes
    this.updateScrollIndicators();

    // Scroll active tab into view if needed
    this.scrollActiveCategoryIntoView();

    // Check if we need to switch between mobile and desktop view
    const isMobileWidth = window.innerWidth <= 575;
    const appContainer = document.querySelector(".app-container");

    if (appContainer) {
      appContainer.classList.toggle("mobile-view", isMobileWidth);
    }
  },

  /**
   * Update scroll indicators
   */
  updateScrollIndicators() {
    UIController.updateScrollIndicators();
  },

  /**
   * Scroll active category tab into view if it's not visible
   */
  scrollActiveCategoryIntoView() {
    const activeTab = document.querySelector(".category-tab.active");
    const nav = UIController.elements.categoryNavigation;

    if (activeTab && nav) {
      // Use the global scroll API to center the active tab
      setTimeout(() => {
        if (
          window.menuScrolling &&
          window.menuScrolling.snapToNearestCategory
        ) {
          window.menuScrolling.snapToNearestCategory();
        }
      }, 50);
    }
  },
};

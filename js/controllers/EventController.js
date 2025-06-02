/**
 * Event Controller - Optimized for Performance
 * Handles all application events with minimal overhead
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { ModalController } from "./ModalController.js";
import { debounce } from "../utils/helpers.js";

export const EventController = {
  // Time check management
  timeCheckInterval: null,
  lastTimeRestriction: null,

  // Navigation state
  navigationSwipeEnabled: false,
  currentTouchTarget: null,

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
    this.setupBackToTop();
    this.setupTimeBasedRefresh();
    this.setupNavigationSwipe();
  },

  /**
   * Setup swipe ONLY on navigation bar
   */
  setupNavigationSwipe() {
    const navContainer = document.querySelector(".category-tabs-container");
    if (!navContainer) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let startTime = 0;
    let isSwiping = false;

    // Touch start - only on navigation
    navContainer.addEventListener(
      "touchstart",
      (e) => {
        if (ModalController.isModalOpen()) return;

        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        startTime = Date.now();
        isSwiping = true;
      },
      { passive: true }
    );

    // Touch move - track if still swiping on nav
    navContainer.addEventListener(
      "touchmove",
      (e) => {
        if (!isSwiping) return;

        const deltaY = Math.abs(e.touches[0].clientY - touchStartY);

        // Cancel if too much vertical movement
        if (deltaY > 30) {
          isSwiping = false;
        }
      },
      { passive: true }
    );

    // Touch end - handle category switch
    navContainer.addEventListener(
      "touchend",
      (e) => {
        if (!isSwiping || ModalController.isModalOpen()) {
          isSwiping = false;
          return;
        }

        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX;
        const deltaTime = Date.now() - startTime;

        // Quick swipe detection
        if (Math.abs(deltaX) > 80 && deltaTime < 300) {
          const categories = AppState.getAvailableCategories();
          const currentIndex = categories.indexOf(AppState.currentCategory);

          if (deltaX > 0 && currentIndex > 0) {
            // Swipe right - previous
            this.selectCategory(categories[currentIndex - 1]);
            this.hapticFeedback(20);
          } else if (deltaX < 0 && currentIndex < categories.length - 1) {
            // Swipe left - next
            this.selectCategory(categories[currentIndex + 1]);
            this.hapticFeedback(20);
          }
        }

        isSwiping = false;
      },
      { passive: true }
    );

    // Cancel on touch leave
    navContainer.addEventListener(
      "touchcancel",
      () => {
        isSwiping = false;
      },
      { passive: true }
    );
  },

  /**
   * Initialize modal controller
   */
  setupModalController() {
    ModalController.init();
  },

  /**
   * Setup theme toggle
   */
  setupThemeToggle() {
    const themeToggle = UIController.elements.themeToggle;
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const newTheme = AppState.theme === "dark" ? "light" : "dark";
      AppState.setTheme(newTheme);
      this.hapticFeedback(30);
    });
  },

  /**
   * Setup language toggle
   */
  setupLanguageToggle() {
    const languageOptions = UIController.elements.languageOptions;
    if (!languageOptions) return;

    languageOptions.forEach((option) => {
      option.addEventListener("click", () => {
        const lang = option.dataset.lang;
        if (lang && lang !== AppState.language) {
          AppState.setLanguage(lang);
          UIController.updateUITexts();

          if (AppState.currentCategory) {
            this.refreshCurrentView();
          }

          ModalController.onAppLanguageChange();
          this.hapticFeedback(30);
        }
      });
    });
  },

  /**
   * Setup category selection with improved tap detection
   */
  setupCategorySelection() {
    const menuCategories = UIController.elements.menuCategories;
    if (!menuCategories) return;

    // Use event delegation with capture phase for immediate response
    menuCategories.addEventListener(
      "click",
      (e) => {
        // Find the closest category tab
        const categoryTab = e.target.closest(".category-tab");
        if (!categoryTab) return;

        // Get category
        const category = categoryTab.dataset.category;
        if (!category || category === AppState.currentCategory) return;

        // Immediate visual feedback
        categoryTab.classList.add("tapped");

        // Select category immediately
        this.selectCategory(category);

        // Haptic feedback
        this.hapticFeedback(20);

        // Remove visual feedback after animation
        setTimeout(() => {
          categoryTab.classList.remove("tapped");
        }, 200);
      },
      { capture: true }
    ); // Use capture phase for priority

    // Touch-specific handling for immediate feedback
    menuCategories.addEventListener(
      "touchstart",
      (e) => {
        const categoryTab = e.target.closest(".category-tab");
        if (categoryTab) {
          categoryTab.classList.add("tapped");
        }
      },
      { passive: true }
    );

    menuCategories.addEventListener(
      "touchend",
      (e) => {
        const categoryTab = e.target.closest(".category-tab");
        if (categoryTab) {
          setTimeout(() => {
            categoryTab.classList.remove("tapped");
          }, 200);
        }
      },
      { passive: true }
    );

    // Keyboard navigation (unchanged)
    menuCategories.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;

      e.preventDefault();
      const tabs = Array.from(document.querySelectorAll(".category-tab"));
      const activeIndex = tabs.findIndex((tab) =>
        tab.classList.contains("active")
      );

      if (activeIndex === -1) return;

      let newIndex = activeIndex;

      switch (e.key) {
        case "ArrowRight":
          newIndex = (activeIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
          newIndex = (activeIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          newIndex = 0;
          break;
        case "End":
          newIndex = tabs.length - 1;
          break;
      }

      if (newIndex !== activeIndex) {
        this.selectCategory(tabs[newIndex].dataset.category);
      }
    });
  },

  /**
   * Select category with smooth transition and immediate response
   */
  selectCategory(category) {
    // Prevent duplicate calls
    if (AppState.currentCategory === category) return;

    // Update state immediately
    AppState.currentCategory = category;
    AppState.currentFilter = null;

    // Update UI immediately
    requestAnimationFrame(() => {
      UIController.updateActiveCategory(category);
      UIController.generateFilterOptions(category);
      UIController.toggleFilterPanel(false);

      const items = AppState.getFilteredItems(category);
      UIController.displayMenuItems(items, category);
    });

    // Smooth scroll to top after a brief delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);

    // Center active tab after UI update
    setTimeout(() => {
      if (window.menuScrolling) {
        window.menuScrolling.centerActiveTab();
      }
    }, 100);

    // Update page title
    document.title = `${AppState.getText(
      "categories",
      category
    )} - Bonobo Bar & More`;
  },

  /**
   * Setup filter toggle
   */
  setupFilterToggle() {
    const filterToggle = UIController.elements.filterToggle;
    if (!filterToggle) return;

    filterToggle.addEventListener("click", () => {
      UIController.toggleFilterPanel();
      this.hapticFeedback(20);
    });
  },

  /**
   * Setup filter selection
   */
  setupFilterSelection() {
    const subcategoryFilters = UIController.elements.subcategoryFilters;
    if (!subcategoryFilters) return;

    subcategoryFilters.addEventListener("click", (e) => {
      const filterChip = e.target.closest(".filter-chip");
      if (filterChip) {
        const filter = filterChip.dataset.filter;
        const newFilter = filter === "all" ? null : filter;

        if (newFilter !== AppState.currentFilter) {
          this.selectFilter(newFilter);
          this.hapticFeedback(20);
        }
      }
    });
  },

  /**
   * Setup back to top button
   */
  setupBackToTop() {
    const backToTopBtn =
      document.querySelector(".back-to-top") || this.createBackToTopButton();

    // Throttled scroll listener
    let scrollTimeout;
    window.addEventListener(
      "scroll",
      () => {
        if (scrollTimeout) return;

        scrollTimeout = setTimeout(() => {
          scrollTimeout = null;
          const scrolled = window.scrollY > 300;
          backToTopBtn.classList.toggle("visible", scrolled);
        }, 100);
      },
      { passive: true }
    );

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      this.hapticFeedback(20);
    });
  },

  /**
   * Create back to top button
   */
  createBackToTopButton() {
    const btn = document.createElement("button");
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Scroll to top");
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(btn);
    return btn;
  },

  /**
   * Setup global events
   */
  setupGlobalEvents() {
    // Click outside to close filter
    document.addEventListener("click", (e) => {
      if (ModalController.isModalOpen()) return;

      const filterPanel = UIController.elements.filterPanel;
      const filterToggle = UIController.elements.filterToggle;

      if (
        filterPanel?.classList.contains("active") &&
        !filterToggle?.contains(e.target) &&
        !filterPanel.contains(e.target)
      ) {
        UIController.toggleFilterPanel(false);
      }
    });

    // Escape key handling
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !ModalController.isModalOpen()) {
        UIController.toggleFilterPanel(false);
      }
    });

    // Optimized resize handler
    const handleResize = debounce(() => {
      UIController.updateScrollIndicators();
    }, 150);

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("orientationchange", handleResize, {
      passive: true,
    });
  },

  /**
   * Setup time-based refresh
   */
  setupTimeBasedRefresh() {
    this.lastTimeRestriction = AppState.getCurrentFoodTimeRestriction();

    // Check every minute
    this.timeCheckInterval = setInterval(() => {
      this.checkTimeBasedUpdates();
    }, 60000);
  },

  /**
   * Check for time-based updates
   */
  checkTimeBasedUpdates() {
    const currentRestriction = AppState.getCurrentFoodTimeRestriction();

    if (
      this.lastTimeRestriction &&
      currentRestriction &&
      (this.lastTimeRestriction.START !== currentRestriction.START ||
        this.lastTimeRestriction.END !== currentRestriction.END)
    ) {
      this.lastTimeRestriction = currentRestriction;

      if (AppState.currentCategory === "food") {
        this.refreshCurrentView();
        UIController.generateFilterOptions(
          AppState.currentCategory,
          AppState.currentFilter
        );
      }
    }
  },

  /**
   * Select category with smooth transition
   */
  selectCategory(category) {
    AppState.currentCategory = category;
    AppState.currentFilter = null;

    UIController.updateActiveCategory(category);
    UIController.generateFilterOptions(category);
    UIController.toggleFilterPanel(false);

    const items = AppState.getFilteredItems(category);
    UIController.displayMenuItems(items, category);

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Center active tab
    setTimeout(() => {
      if (window.menuScrolling) {
        window.menuScrolling.centerActiveTab();
      }
    }, 50);

    // Update page title
    document.title = `${AppState.getText(
      "categories",
      category
    )} - Bonobo Bar & More`;
  },

  /**
   * Select filter
   */
  selectFilter(filter) {
    if (!AppState.currentCategory) return;

    AppState.currentFilter = filter;
    UIController.updateActiveFilter(filter);

    const items = AppState.getFilteredItems(AppState.currentCategory, filter);
    UIController.displayMenuItems(items, AppState.currentCategory);
  },

  /**
   * Refresh current view
   */
  refreshCurrentView() {
    const category = AppState.currentCategory;
    const filter = AppState.currentFilter;

    if (!category) return;

    requestAnimationFrame(() => {
      UIController.generateCategoryTabs();
      UIController.updateActiveCategory(category);
      UIController.generateFilterOptions(category, filter);

      const items = AppState.getFilteredItems(category, filter);
      UIController.displayMenuItems(items, category);
    });
  },

  /**
   * Simple haptic feedback
   */
  hapticFeedback(duration = 30) {
    if (navigator.vibrate) {
      navigator.vibrate(duration);
    }
  },

  /**
   * Cleanup on app destroy
   */
  cleanup() {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval);
    }
  },
};

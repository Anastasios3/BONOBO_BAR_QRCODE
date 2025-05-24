/**
 * Event Controller - Complete Rewrite for Top-Tier UX
 * Enhanced with global swipe detection, smooth transitions, and excellent mobile experience
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { ModalController } from "./ModalController.js";
import { debounce } from "../utils/helpers.js";

export const EventController = {
  // Enhanced swipe system
  swipeState: {
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    threshold: 50, // Minimum distance for swipe
    velocityThreshold: 0.3, // Minimum velocity for swipe
    maxVerticalDeviation: 80, // Max vertical movement to still count as horizontal swipe
    preventScroll: false,
    direction: null, // 'left' or 'right'
  },

  // Time check management
  timeCheckInterval: null,
  lastTimeRestriction: null,

  // Visual feedback elements
  visualFeedback: {
    leftIndicator: null,
    rightIndicator: null,
    container: null,
  },

  // Performance optimization
  rafId: null,
  isUpdating: false,

  /**
   * Initialize all event listeners with enhanced swipe support
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
    this.setupTimeBasedRefresh();
    this.setupEnhancedSwipeSystem();
    this.createVisualFeedback();
  },

  /**
   * Create visual feedback elements for swipe gestures
   */
  createVisualFeedback() {
    // Create swipe feedback container
    const container = document.createElement("div");
    container.className = "swipe-feedback-container";
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 999;
      overflow: hidden;
    `;

    // Left swipe indicator
    const leftIndicator = document.createElement("div");
    leftIndicator.className = "swipe-indicator left";
    leftIndicator.innerHTML = '<i class="fas fa-chevron-right"></i>';
    leftIndicator.style.cssText = `
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%) translateX(-100px);
      width: 60px;
      height: 60px;
      background: var(--accent-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;

    // Right swipe indicator
    const rightIndicator = document.createElement("div");
    rightIndicator.className = "swipe-indicator right";
    rightIndicator.innerHTML = '<i class="fas fa-chevron-left"></i>';
    rightIndicator.style.cssText = `
      position: absolute;
      right: 20px;
      top: 50%;
      transform: translateY(-50%) translateX(100px);
      width: 60px;
      height: 60px;
      background: var(--accent-color);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    `;

    container.appendChild(leftIndicator);
    container.appendChild(rightIndicator);
    document.body.appendChild(container);

    this.visualFeedback = {
      leftIndicator,
      rightIndicator,
      container,
    };
  },

  /**
   * Setup enhanced global swipe system
   */
  setupEnhancedSwipeSystem() {
    const appContainer = document.querySelector(".app-container");
    if (!appContainer) return;

    // Passive touch start for better performance
    appContainer.addEventListener(
      "touchstart",
      (e) => {
        this.handleTouchStart(e);
      },
      { passive: false }
    );

    // Active touch move for swipe detection
    appContainer.addEventListener(
      "touchmove",
      (e) => {
        this.handleTouchMove(e);
      },
      { passive: false }
    );

    // Touch end for swipe completion
    appContainer.addEventListener(
      "touchend",
      (e) => {
        this.handleTouchEnd(e);
      },
      { passive: true }
    );

    // Touch cancel for cleanup
    appContainer.addEventListener(
      "touchcancel",
      (e) => {
        this.handleTouchCancel(e);
      },
      { passive: true }
    );

    // Mouse events for desktop testing
    if (window.PointerEvent) {
      this.setupPointerEvents(appContainer);
    }
  },

  /**
   * Setup pointer events for desktop testing
   */
  setupPointerEvents(container) {
    container.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse") {
        this.handleTouchStart(e);
      }
    });

    container.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse" && this.swipeState.isActive) {
        this.handleTouchMove(e);
      }
    });

    container.addEventListener("pointerup", (e) => {
      if (e.pointerType === "mouse") {
        this.handleTouchEnd(e);
      }
    });
  },

  /**
   * Handle touch/pointer start
   */
  handleTouchStart(e) {
    // Don't handle if modal is open
    if (ModalController.isModalOpen()) return;

    // Don't handle if touching a scrollable element
    if (this.isScrollableElement(e.target)) return;

    // Don't handle if touching interactive elements
    if (this.isInteractiveElement(e.target)) return;

    const touch = e.touches ? e.touches[0] : e;

    this.swipeState = {
      ...this.swipeState,
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      direction: null,
      preventScroll: false,
    };

    // Add subtle visual feedback
    document.body.style.userSelect = "none";
  },

  /**
   * Handle touch/pointer move with real-time feedback
   */
  handleTouchMove(e) {
    if (!this.swipeState.isActive) return;

    const touch = e.touches ? e.touches[0] : e;
    this.swipeState.currentX = touch.clientX;
    this.swipeState.currentY = touch.clientY;

    const deltaX = this.swipeState.currentX - this.swipeState.startX;
    const deltaY = this.swipeState.currentY - this.swipeState.startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if this is a horizontal swipe
    if (absDeltaX > 10 && absDeltaX > absDeltaY * 1.5) {
      // This is a horizontal swipe, prevent vertical scrolling
      e.preventDefault();
      this.swipeState.preventScroll = true;
      this.swipeState.direction = deltaX > 0 ? "right" : "left";

      // Update visual feedback in real-time
      this.updateSwipeVisualFeedback(deltaX, absDeltaX);
    } else if (absDeltaY > absDeltaX * 1.5) {
      // This is clearly a vertical scroll, abort swipe
      this.resetSwipeState();
      return;
    }

    // Prevent scroll if we've determined this is a swipe
    if (this.swipeState.preventScroll) {
      e.preventDefault();
    }
  },

  /**
   * Update visual feedback during swipe
   */
  updateSwipeVisualFeedback(deltaX, progress) {
    const { leftIndicator, rightIndicator } = this.visualFeedback;
    if (!leftIndicator || !rightIndicator) return;

    const maxProgress = this.swipeState.threshold * 2;
    const normalizedProgress = Math.min(progress / maxProgress, 1);
    const opacity = normalizedProgress * 0.8;

    if (deltaX > 0) {
      // Swiping right (previous category)
      leftIndicator.style.opacity = opacity;
      leftIndicator.style.transform = `translateY(-50%) translateX(${
        -100 + normalizedProgress * 50
      }px) scale(${0.8 + normalizedProgress * 0.4})`;
      rightIndicator.style.opacity = "0";
      rightIndicator.style.transform =
        "translateY(-50%) translateX(100px) scale(0.8)";
    } else {
      // Swiping left (next category)
      rightIndicator.style.opacity = opacity;
      rightIndicator.style.transform = `translateY(-50%) translateX(${
        100 - normalizedProgress * 50
      }px) scale(${0.8 + normalizedProgress * 0.4})`;
      leftIndicator.style.opacity = "0";
      leftIndicator.style.transform =
        "translateY(-50%) translateX(-100px) scale(0.8)";
    }
  },

  /**
   * Handle touch/pointer end with smooth category transition
   */
  handleTouchEnd(e) {
    if (!this.swipeState.isActive) return;

    const deltaX = this.swipeState.currentX - this.swipeState.startX;
    const deltaY = this.swipeState.currentY - this.swipeState.startY;
    const distance = Math.abs(deltaX);
    const duration = Date.now() - this.swipeState.startTime;
    const velocity = distance / duration; // pixels per millisecond

    // Check if this qualifies as a swipe
    const isValidSwipe =
      distance >= this.swipeState.threshold &&
      velocity >= this.swipeState.velocityThreshold &&
      Math.abs(deltaY) <= this.swipeState.maxVerticalDeviation;

    if (isValidSwipe && this.swipeState.direction) {
      this.executeSwipeNavigation(this.swipeState.direction, velocity);
    }

    this.resetSwipeState();
  },

  /**
   * Handle touch cancel
   */
  handleTouchCancel(e) {
    this.resetSwipeState();
  },

  /**
   * Execute category navigation based on swipe
   */
  executeSwipeNavigation(direction, velocity) {
    const availableCategories = AppState.getAvailableCategories();
    const currentIndex = availableCategories.indexOf(AppState.currentCategory);

    if (currentIndex === -1) return;

    let nextCategory = null;

    if (direction === "right" && currentIndex > 0) {
      // Swipe right = previous category
      nextCategory = availableCategories[currentIndex - 1];
    } else if (
      direction === "left" &&
      currentIndex < availableCategories.length - 1
    ) {
      // Swipe left = next category
      nextCategory = availableCategories[currentIndex + 1];
    }

    if (nextCategory) {
      // Enhanced haptic feedback based on velocity
      this.provideHapticFeedback(velocity);

      // Smooth visual transition
      this.animateSwipeTransition(direction, () => {
        this.selectCategory(nextCategory);
      });
    } else {
      // Provide feedback for edge cases (no more categories)
      this.showEdgeFeedback(direction);
    }
  },

  /**
   * Animate swipe transition
   */
  animateSwipeTransition(direction, callback) {
    const menuContainer = document.querySelector(".menu-container");
    if (!menuContainer) {
      callback();
      return;
    }

    // Quick slide animation
    const translateX = direction === "left" ? "-20px" : "20px";

    menuContainer.style.transition =
      "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)";
    menuContainer.style.transform = `translateX(${translateX})`;

    setTimeout(() => {
      callback();

      // Reset position
      menuContainer.style.transform = "translateX(0)";
      setTimeout(() => {
        menuContainer.style.transition = "";
      }, 150);
    }, 75);
  },

  /**
   * Show feedback when user swipes at edge (no more categories)
   */
  showEdgeFeedback(direction) {
    const indicator =
      direction === "left"
        ? this.visualFeedback.rightIndicator
        : this.visualFeedback.leftIndicator;

    if (!indicator) return;

    // Change color to indicate edge
    indicator.style.background = "var(--warning)";
    indicator.style.opacity = "0.6";
    indicator.style.transform = indicator.style.transform.replace(
      /scale\([^)]*\)/,
      "scale(0.9)"
    );

    // Gentle shake animation
    indicator.style.animation = "shake 0.4s cubic-bezier(0.4, 0, 0.2, 1)";

    setTimeout(() => {
      indicator.style.opacity = "0";
      indicator.style.background = "var(--accent-color)";
      indicator.style.animation = "";
    }, 400);

    // Gentle haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30]);
    }
  },

  /**
   * Enhanced haptic feedback based on swipe velocity
   */
  provideHapticFeedback(velocity) {
    if (!navigator.vibrate) return;

    // Scale haptic feedback with velocity
    const intensity = Math.min(Math.max(velocity * 100, 40), 80);
    navigator.vibrate(intensity);
  },

  /**
   * Reset swipe state and visual feedback
   */
  resetSwipeState() {
    this.swipeState.isActive = false;
    this.swipeState.preventScroll = false;
    document.body.style.userSelect = "";

    // Reset visual feedback
    const { leftIndicator, rightIndicator } = this.visualFeedback;
    if (leftIndicator && rightIndicator) {
      leftIndicator.style.opacity = "0";
      leftIndicator.style.transform =
        "translateY(-50%) translateX(-100px) scale(0.8)";
      rightIndicator.style.opacity = "0";
      rightIndicator.style.transform =
        "translateY(-50%) translateX(100px) scale(0.8)";
    }
  },

  /**
   * Check if element is scrollable and should not trigger swipes
   */
  isScrollableElement(element) {
    const scrollableSelectors = [
      ".category-tabs-container",
      ".filter-panel",
      ".modal-container",
      ".modal-body",
      "textarea",
      'input[type="text"]',
    ];

    return scrollableSelectors.some((selector) => element.closest(selector));
  },

  /**
   * Check if element is interactive and should not trigger swipes
   */
  isInteractiveElement(element) {
    const interactiveSelectors = [
      "button",
      "a",
      "input",
      "select",
      "textarea",
      ".filter-chip",
      ".category-tab",
      ".menu-item",
      ".modal-close",
    ];

    return interactiveSelectors.some(
      (selector) => element.matches(selector) || element.closest(selector)
    );
  },

  /**
   * Setup time-based refresh with optimizations
   */
  setupTimeBasedRefresh() {
    this.lastTimeRestriction = AppState.getCurrentFoodTimeRestriction();

    // Check every minute
    this.timeCheckInterval = setInterval(() => {
      this.checkTimeBasedUpdates();
    }, 60000);

    // Check on visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        // Small delay to allow time adjustments
        setTimeout(() => this.checkTimeBasedUpdates(), 1000);
      }
    });
  },

  /**
   * Optimized time-based updates check
   */
  checkTimeBasedUpdates() {
    const currentTimeRestriction = AppState.getCurrentFoodTimeRestriction();

    if (
      this.lastTimeRestriction &&
      currentTimeRestriction &&
      (this.lastTimeRestriction.START !== currentTimeRestriction.START ||
        this.lastTimeRestriction.END !== currentTimeRestriction.END)
    ) {
      this.lastTimeRestriction = currentTimeRestriction;

      // Only refresh if viewing food category
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
   * Initialize modal controller
   */
  setupModalController() {
    ModalController.init();
  },

  /**
   * Enhanced theme toggle with smooth transitions
   */
  setupThemeToggle() {
    const themeToggle = UIController.elements.themeToggle;
    if (!themeToggle) return;

    themeToggle.addEventListener("click", () => {
      const newTheme = AppState.theme === "dark" ? "light" : "dark";

      // Add transition class for smooth theme switching
      document.body.style.transition = "all 0.3s ease";

      AppState.setTheme(newTheme);
      this.provideHapticFeedback(0.5);

      // Remove transition after animation
      setTimeout(() => {
        document.body.style.transition = "";
      }, 300);
    });

    this.addKeyboardSupport(themeToggle);
  },

  /**
   * Enhanced language toggle with smooth transitions
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
          this.provideHapticFeedback(0.5);
        }
      });

      this.addKeyboardSupport(option);
    });
  },

  /**
   * Enhanced category selection with smooth animations
   */
  setupCategorySelection() {
    const menuCategories = UIController.elements.menuCategories;
    if (!menuCategories) return;

    menuCategories.addEventListener("click", (e) => {
      const categoryTab = e.target.closest(".category-tab");

      if (categoryTab) {
        const category = categoryTab.dataset.category;

        if (category && category !== AppState.currentCategory) {
          this.selectCategory(category);
          this.provideHapticFeedback(0.5);
        }
      }
    });

    // Enhanced keyboard navigation
    this.setupCategoryKeyboardNavigation(menuCategories);
  },

  /**
   * Enhanced keyboard navigation for categories
   */
  setupCategoryKeyboardNavigation(menuCategories) {
    menuCategories.addEventListener("keydown", (e) => {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)) return;

      e.preventDefault();

      const tabs = Array.from(document.querySelectorAll(".category-tab"));
      const activeTabIndex = tabs.findIndex((tab) =>
        tab.classList.contains("active")
      );

      if (activeTabIndex === -1) return;

      let nextIndex = activeTabIndex;

      switch (e.key) {
        case "ArrowRight":
          nextIndex = (activeTabIndex + 1) % tabs.length;
          break;
        case "ArrowLeft":
          nextIndex = (activeTabIndex - 1 + tabs.length) % tabs.length;
          break;
        case "Home":
          nextIndex = 0;
          break;
        case "End":
          nextIndex = tabs.length - 1;
          break;
      }

      const nextCategory = tabs[nextIndex].dataset.category;
      this.selectCategory(nextCategory);
    });
  },

  /**
   * Enhanced filter toggle with animations
   */
  setupFilterToggle() {
    const filterToggle = UIController.elements.filterToggle;
    if (!filterToggle) return;

    filterToggle.addEventListener("click", () => {
      UIController.toggleFilterPanel();
      this.provideHapticFeedback(0.3);
    });

    this.addKeyboardSupport(filterToggle);
  },

  /**
   * Enhanced filter selection
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
          this.provideHapticFeedback(0.3);
        }
      }
    });

    // Keyboard support for filter chips
    subcategoryFilters.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        const filterChip = e.target.closest(".filter-chip");
        if (filterChip) {
          e.preventDefault();
          filterChip.click();
        }
      }
    });
  },

  /**
   * Enhanced back to top with smooth scrolling
   */
  setupBackToTop() {
    let backToTopBtn = document.querySelector(".back-to-top");

    if (!backToTopBtn) {
      backToTopBtn = this.createBackToTopButton();
    }

    // Optimized scroll listener
    window.addEventListener(
      "scroll",
      debounce(() => {
        const scrollPosition =
          window.scrollY || document.documentElement.scrollTop;
        backToTopBtn.classList.toggle("visible", scrollPosition > 300);
      }, 100)
    );

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
      this.provideHapticFeedback(0.3);
    });
  },

  /**
   * Create back to top button
   */
  createBackToTopButton() {
    const backToTopBtn = document.createElement("button");
    backToTopBtn.className = "back-to-top";
    backToTopBtn.setAttribute("aria-label", "Scroll to top");
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    document.body.appendChild(backToTopBtn);
    return backToTopBtn;
  },

  /**
   * Enhanced scroll navigation
   */
  setupScrollNavigation() {
    const categoryNavigation = UIController.elements.categoryNavigation;
    if (!categoryNavigation) return;

    categoryNavigation.setAttribute("role", "tablist");
    categoryNavigation.setAttribute("aria-label", "Menu Categories");

    // Enhanced wheel scrolling
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

    // Optimized scroll listener
    categoryNavigation.addEventListener(
      "scroll",
      debounce(() => this.updateScrollIndicators(), 50)
    );
  },

  /**
   * Enhanced global events setup
   */
  setupGlobalEvents() {
    // Optimized click outside handler
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

    // Enhanced keyboard events
    document.addEventListener("keydown", (e) => {
      if (ModalController.isModalOpen()) return;

      if (e.key === "Escape") {
        UIController.toggleFilterPanel(false);
      }
    });

    // Optimized resize handler
    window.addEventListener(
      "resize",
      debounce(() => this.handleResponsiveLayout(), 200)
    );

    // Enhanced orientation change
    window.addEventListener(
      "orientationchange",
      debounce(() => this.handleOrientationChange(), 200)
    );

    // Network status handling
    window.addEventListener("online", () => this.handleNetworkChange(true));
    window.addEventListener("offline", () => this.handleNetworkChange(false));

    // Cleanup on unload
    window.addEventListener("beforeunload", () => this.cleanup());

    // Initial network check
    if (!navigator.onLine) {
      this.handleNetworkChange(false);
    }
  },

  /**
   * Add keyboard support to an element
   */
  addKeyboardSupport(element) {
    element.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        element.click();
      }
    });
  },

  /**
   * Enhanced category selection with smooth transitions
   */
  selectCategory(category) {
    AppState.currentCategory = category;
    AppState.currentFilter = null;

    // Update UI with animations
    UIController.updateActiveCategory(category);
    UIController.generateFilterOptions(category);
    UIController.toggleFilterPanel(false);

    // Get and display items
    const items = AppState.getFilteredItems(category);
    UIController.displayMenuItems(items, category);

    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Update navigation
    setTimeout(() => this.scrollActiveCategoryIntoView(), 100);

    // Update page title
    document.title = `${AppState.getText(
      "categories",
      category
    )} - Bonobo Bar & More`;
  },

  /**
   * Enhanced filter selection
   */
  selectFilter(filter) {
    if (!AppState.currentCategory) return;

    AppState.currentFilter = filter;
    UIController.updateActiveFilter(filter);

    const items = AppState.getFilteredItems(AppState.currentCategory, filter);
    UIController.displayMenuItems(items, AppState.currentCategory);

    // Update page title
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
   * Refresh current view with optimizations
   */
  refreshCurrentView() {
    const category = AppState.currentCategory;
    const filter = AppState.currentFilter;

    if (!category) return;

    // Batch UI updates for better performance
    this.batchUIUpdates(() => {
      UIController.generateCategoryTabs();
      UIController.generateCategoryList();
      UIController.updateActiveCategory(category);
      UIController.generateFilterOptions(category, filter);

      const items = AppState.getFilteredItems(category, filter);
      UIController.displayMenuItems(items, category);
    });

    setTimeout(() => this.scrollActiveCategoryIntoView(), 100);
    this.updatePageTitle(category, filter);
  },

  /**
   * Batch UI updates for better performance
   */
  batchUIUpdates(callback) {
    if (this.isUpdating) return;

    this.isUpdating = true;

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      callback();
      this.isUpdating = false;
    });
  },

  /**
   * Update page title
   */
  updatePageTitle(category, filter) {
    const categoryText = AppState.getText("categories", category);
    const filterText = filter
      ? AppState.getText("subcategories", category, filter)
      : null;

    document.title = filterText
      ? `${filterText} - ${categoryText} - Bonobo Bar & More`
      : `${categoryText} - Bonobo Bar & More`;
  },

  /**
   * Handle responsive layout changes
   */
  handleResponsiveLayout() {
    this.updateScrollIndicators();
    this.scrollActiveCategoryIntoView();

    const isMobileWidth = window.innerWidth <= 575;
    const appContainer = document.querySelector(".app-container");

    if (appContainer) {
      appContainer.classList.toggle("mobile-view", isMobileWidth);
    }
  },

  /**
   * Enhanced orientation change handling
   */
  handleOrientationChange() {
    setTimeout(() => {
      this.updateScrollIndicators();
      this.scrollActiveCategoryIntoView();

      if (AppState.currentCategory) {
        this.checkTimeBasedUpdates();
        const items = AppState.getFilteredItems(
          AppState.currentCategory,
          AppState.currentFilter
        );
        UIController.displayMenuItems(items, AppState.currentCategory);
      }
    }, 300);
  },

  /**
   * Handle network status changes
   */
  handleNetworkChange(isOnline) {
    const appContainer = document.querySelector(".app-container");
    if (!appContainer) return;

    if (!isOnline) {
      let notification = document.querySelector(".offline-notification");

      if (!notification) {
        notification = document.createElement("div");
        notification.className = "offline-notification";
        notification.textContent =
          "You are currently offline. Some features may be limited.";
        appContainer.insertBefore(notification, appContainer.firstChild);
      }

      setTimeout(() => notification.classList.add("active"), 10);
    } else {
      const notification = document.querySelector(".offline-notification");
      if (notification) {
        notification.classList.remove("active");
        setTimeout(() => notification.remove(), 300);
      }
    }
  },

  /**
   * Update scroll indicators
   */
  updateScrollIndicators() {
    UIController.updateScrollIndicators();
  },

  /**
   * Scroll active category into view
   */
  scrollActiveCategoryIntoView() {
    const activeTab = document.querySelector(".category-tab.active");

    if (activeTab && window.menuScrolling?.centerActiveTab) {
      window.menuScrolling.centerActiveTab();
    }
  },

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.timeCheckInterval) {
      clearInterval(this.timeCheckInterval);
      this.timeCheckInterval = null;
    }

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Remove visual feedback elements
    if (this.visualFeedback.container) {
      this.visualFeedback.container.remove();
    }
  },
};

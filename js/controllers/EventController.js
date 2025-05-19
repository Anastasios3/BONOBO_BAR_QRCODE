/**
 * Event Controller
 * Manages all event handling
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { debounce } from "../utils/helpers.js";

export const EventController = {
  /**
   * Initialize all event listeners
   */
  initializeEventListeners() {
    this.setupThemeToggle();
    this.setupLanguageToggle();
    this.setupCategorySelection();
    this.setupFilterToggle();
    this.setupFilterSelection();
    this.setupGlobalEvents();
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
      });
    }
  },

  /**
   * Set up language selection
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
          }
        });
      });
    }
  },

  /**
   * Set up category selection events
   */
  setupCategorySelection() {
    const menuCategories = UIController.elements.menuCategories;

    if (menuCategories) {
      menuCategories.addEventListener("click", (e) => {
        const categoryTab = e.target.closest(".category-tab");

        if (categoryTab) {
          const category = categoryTab.dataset.category;

          if (category && category !== AppState.currentCategory) {
            this.selectCategory(category);
          }
        }
      });
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
          }
        }
      });
    }
  },

  /**
   * Set up global document events
   */
  setupGlobalEvents() {
    // Close filter panel when clicking outside
    document.addEventListener("click", (e) => {
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

    // Handle keyboard events
    document.addEventListener("keydown", (e) => {
      // Close filter panel on Escape key
      if (e.key === "Escape") {
        UIController.toggleFilterPanel(false);
      }
    });

    // Handle responsive adjustments
    window.addEventListener(
      "resize",
      debounce(() => {
        this.handleResponsiveLayout();
      }, 250)
    );
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
  },

  /**
   * Handle responsive layout adjustments
   */
  handleResponsiveLayout() {
    // Add any responsive behavior here
  },
};

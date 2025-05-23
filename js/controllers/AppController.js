/**
 * Application Controller
 * Coordinates the overall application flow with Modal Support
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { DataController } from "./DataController.js";
import { EventController } from "./EventController.js";
import { ModalController } from "./ModalController.js";

export const AppController = {
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize UI elements
      UIController.initializeDOM();

      // Apply theme from state
      UIController.applyTheme();

      // Determine optimal category order
      AppState.determineCategoryOrder();

      // Show loading state
      UIController.showLoading();

      // Load menu data
      await DataController.loadAllData();

      // Initialize UI with current language
      UIController.updateUITexts();

      // Generate category navigation
      UIController.generateCategoryTabs();
      UIController.generateCategoryList();

      // Set up event listeners (this will also initialize the modal)
      EventController.initializeEventListeners();

      // Select first category
      this.selectInitialCategory();

      // Add loaded class to body for animations
      document.body.classList.add("app-loaded");

      // Log successful initialization
      console.log("Bonobo Bar & More application initialized successfully");
    } catch (error) {
      console.error("Application initialization failed:", error);
      UIController.showError(
        AppState.getText("errorTitle"),
        AppState.getText("errorMessage")
      );
    }
  },

  /**
   * Select the initial category to display
   */
  selectInitialCategory() {
    // Try to use the time-based order first
    for (const category of AppState.categoriesOrder) {
      if (
        AppState.menuData[category] &&
        AppState.menuData[category].length > 0
      ) {
        EventController.selectCategory(category);
        return;
      }
    }

    // Fall back to any available category
    const availableCategories = AppState.getAvailableCategories();

    if (availableCategories.length > 0) {
      EventController.selectCategory(availableCategories[0]);
    } else {
      // No categories available - show error
      UIController.showError(
        "No Menu Data Available",
        "We couldn't load any menu categories. Please check your internet connection and try refreshing the page."
      );
    }
  },

  /**
   * Handle application errors gracefully
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   */
  handleError(error, context = "Unknown") {
    console.error(`Application error in ${context}:`, error);

    // Close modal if open during error
    if (ModalController.isModalOpen()) {
      ModalController.forceClose();
    }

    // Show user-friendly error message
    UIController.showError(
      "Something went wrong",
      "We encountered an issue. Please try refreshing the page."
    );

    // Optional: Send error to logging service
    this.logError(error, context);
  },

  /**
   * Log errors for debugging (could be extended to send to external service)
   * @param {Error} error - The error that occurred
   * @param {string} context - Context where the error occurred
   */
  logError(error, context) {
    // Basic error logging
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      appState: {
        language: AppState.language,
        theme: AppState.theme,
        currentCategory: AppState.currentCategory,
        currentFilter: AppState.currentFilter,
      },
    };

    // Log to console for development
    console.error("Detailed error info:", errorInfo);

    // TODO: In production, send to error logging service
    // Example: sendToLogService(errorInfo);
  },

  /**
   * Get application status information
   * @returns {Object} Current application status
   */
  getStatus() {
    return {
      initialized: document.body.classList.contains("app-loaded"),
      categoriesLoaded: AppState.getAvailableCategories().length > 0,
      currentCategory: AppState.currentCategory,
      currentFilter: AppState.currentFilter,
      language: AppState.language,
      theme: AppState.theme,
      modalOpen: ModalController.isModalOpen(),
      menuDataCounts: Object.fromEntries(
        Object.entries(AppState.menuData).map(([key, items]) => [
          key,
          items ? items.length : 0,
        ])
      ),
    };
  },

  /**
   * Refresh the entire application
   */
  async refresh() {
    try {
      // Show loading state
      UIController.showLoading();

      // Close modal if open
      if (ModalController.isModalOpen()) {
        ModalController.forceClose();
      }

      // Clear current state
      AppState.currentCategory = null;
      AppState.currentFilter = null;
      AppState.menuData = {};

      // Reload data
      await DataController.loadAllData();

      // Regenerate UI
      UIController.generateCategoryTabs();
      UIController.generateCategoryList();
      UIController.updateUITexts();

      // Select initial category
      this.selectInitialCategory();

      console.log("Application refreshed successfully");
    } catch (error) {
      this.handleError(error, "Application Refresh");
    }
  },

  /**
   * Handle app visibility changes (page focus/blur)
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // App is hidden - could pause animations, etc.
      console.log("App hidden");
    } else {
      // App is visible again - could refresh data if needed
      console.log("App visible");

      // Check if we need to refresh data (e.g., after being hidden for a long time)
      const categories = AppState.getAvailableCategories();
      if (categories.length === 0) {
        console.log("No categories available, attempting refresh...");
        this.refresh();
      }
    }
  },

  /**
   * Public API for external use
   */
  getAPI() {
    return {
      // State access
      getState: () => AppState,
      getStatus: () => this.getStatus(),

      // Category management
      selectCategory: (category) => EventController.selectCategory(category),
      selectFilter: (filter) => EventController.selectFilter(filter),
      getAvailableCategories: () => AppState.getAvailableCategories(),

      // Modal control
      openModal: (item, category) => ModalController.open(item, category),
      closeModal: () => ModalController.forceClose(),
      isModalOpen: () => ModalController.isModalOpen(),

      // App control
      refresh: () => this.refresh(),
      setTheme: (theme) => AppState.setTheme(theme),
      setLanguage: (lang) => {
        AppState.setLanguage(lang);
        UIController.updateUITexts();
        EventController.refreshCurrentView();
        ModalController.onAppLanguageChange();
      },

      // Error handling
      handleError: (error, context) => this.handleError(error, context),
    };
  },
};

// Set up visibility change handler
document.addEventListener("visibilitychange", () => {
  AppController.handleVisibilityChange();
});

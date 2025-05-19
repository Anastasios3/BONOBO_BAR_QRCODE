/**
 * Application Controller
 * Coordinates the overall application flow
 */

import { AppState } from "../models/AppState.js";
import { UIController } from "./UIController.js";
import { DataController } from "./DataController.js";
import { EventController } from "./EventController.js";

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

      // Set up event listeners
      EventController.initializeEventListeners();

      // Select first category
      this.selectInitialCategory();

      // Add loaded class to body for animations
      document.body.classList.add("app-loaded");
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
    }
  },
};

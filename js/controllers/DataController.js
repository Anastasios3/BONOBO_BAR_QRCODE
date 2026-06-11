/**
 * Data Controller
 * Handles all data fetching and processing
 */

import { AppState } from "../models/AppState.js";
import { CONFIG } from "../config.js";

export const DataController = {
  /**
   * Load data for all categories
   * @returns {Promise} Result of data loading
   */
  async loadAllData() {
    try {
      const categories = CONFIG.CATEGORIES;
      const promises = categories.map((category) =>
        this.loadCategoryData(category)
      );

      // Wait for all data loading attempts
      await Promise.allSettled(promises);

      // Check if we have at least some data
      const loadedCategories = AppState.getAvailableCategories();

      if (loadedCategories.length === 0) {
        throw new Error("Failed to load any menu data");
      }

      return loadedCategories;
    } catch (error) {
      console.error("Error loading menu data:", error);
      throw error;
    }
  },

  /**
   * Load data for a specific category
   * @param {string} category - Category ID
   * @returns {Promise} Result of data loading
   */
  async loadCategoryData(category) {
    try {
      const response = await fetch(
        `data/${category}.json?v=${CONFIG.APP_VERSION}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load ${category} data (HTTP ${response.status})`
        );
      }

      const data = await response.json();

      if (data && data.items && Array.isArray(data.items)) {
        // Process items before storing
        const processedItems = this.processItems(data.items);
        AppState.menuData[category] = processedItems;
        return processedItems.length;
      } else {
        console.warn(
          `Warning: ${category}.json doesn't contain valid 'items' array`
        );
        AppState.menuData[category] = [];
        return 0;
      }
    } catch (error) {
      console.error(`Error loading ${category} data:`, error);
      AppState.menuData[category] = [];
      return 0;
    }
  },

  /**
   * Process and normalize menu items
   * @param {Array} items - Raw menu items
   * @returns {Array} Processed items
   */
  processItems(items) {
    return items.map((item) => ({
      ...item,
      available: item.available !== false, // Default to available if not specified
    }));
  },
};

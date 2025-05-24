/**
 * Application State
 * Centralized state management for the application
 */

import { CONFIG } from "../config.js";
import { TRANSLATIONS } from "../data/translations.js";

class AppStateClass {
  constructor() {
    // Core state values
    this.language = localStorage.getItem(CONFIG.STORAGE_KEYS.LANGUAGE) || "en";
    this.theme =
      localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    this.currentCategory = null;
    this.currentFilter = null;
    this.menuData = {};
    this.isLoading = true;

    // Category order based on time of day
    this.categoriesOrder = [];

    // Subcategory definitions
    this.subcategories = CONFIG.SUBCATEGORIES;

    // Translation data
    this.translations = TRANSLATIONS;
  }

  /**
   * Get text translation
   * @param {string} key - Translation key
   * @param {string} category - Optional category for nested translations
   * @param {string} subcategory - Optional subcategory for deeply nested translations
   * @returns {string} Translated text
   */
  getText(key, category = null, subcategory = null) {
    const langData = this.translations[this.language];

    if (!langData) {
      return "";
    }

    if (category && subcategory) {
      return langData[key]?.[category]?.[subcategory] || "";
    }

    if (category) {
      return langData[key]?.[category] || "";
    }

    return langData[key] || "";
  }

  /**
   * Set language and save to localStorage
   * @param {string} lang - Language code ('en' or 'el')
   */
  setLanguage(lang) {
    if (lang && (lang === "en" || lang === "el")) {
      this.language = lang;
      localStorage.setItem(CONFIG.STORAGE_KEYS.LANGUAGE, lang);
    }
  }

  /**
   * Set theme and save to localStorage
   * @param {string} theme - Theme name ('light' or 'dark')
   */
  setTheme(theme) {
    if (theme && (theme === "light" || theme === "dark")) {
      this.theme = theme;
      localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);
      document.body.classList.toggle("dark-theme", theme === "dark");
    }
  }

  /**
   * Determine optimal category order based on time of day
   */
  determineCategoryOrder() {
    const hour = new Date().getHours();
    const timePeriods = CONFIG.TIME_PERIODS;

    if (hour >= timePeriods.MORNING.START && hour < timePeriods.MORNING.END) {
      this.categoriesOrder = timePeriods.MORNING.ORDER;
    } else if (
      hour >= timePeriods.LUNCH.START &&
      hour < timePeriods.LUNCH.END
    ) {
      this.categoriesOrder = timePeriods.LUNCH.ORDER;
    } else if (
      hour >= timePeriods.AFTERNOON.START &&
      hour < timePeriods.AFTERNOON.END
    ) {
      this.categoriesOrder = timePeriods.AFTERNOON.ORDER;
    } else {
      this.categoriesOrder = timePeriods.NIGHT.ORDER;
    }
  }

  /**
   * Get current food time restriction based on current time
   * @returns {Object|null} Current food restriction configuration
   */
  getCurrentFoodTimeRestriction() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeDecimal = hour + minute / 60;

    const restrictions = CONFIG.FOOD_TIME_RESTRICTIONS;

    // Check for FULL_MENU period (03:00 to 17:00)
    if (
      timeDecimal >= restrictions.FULL_MENU.START &&
      timeDecimal <= restrictions.FULL_MENU.END
    ) {
      return restrictions.FULL_MENU;
    }

    // Check for EVENING_MENU period (17:01 to 21:00)
    if (
      timeDecimal > restrictions.EVENING_MENU.START &&
      timeDecimal <= restrictions.EVENING_MENU.END
    ) {
      return restrictions.EVENING_MENU;
    }

    // Check for NIGHT_MENU period (21:01 to 02:59)
    // This spans midnight, so we need to handle the wraparound
    if (
      timeDecimal > restrictions.NIGHT_MENU.START ||
      timeDecimal <= restrictions.NIGHT_MENU.END
    ) {
      return restrictions.NIGHT_MENU;
    }

    // Default fallback (shouldn't happen with the current time ranges, but just in case)
    return restrictions.FULL_MENU;
  }

  /**
   * Get time-aware subcategories for a category
   * @param {string} category - Category ID
   * @returns {Array} Array of allowed subcategories for current time
   */
  getTimeAwareSubcategories(category) {
    if (category !== "food") {
      // For non-food categories, return the normal subcategories
      return this.subcategories[category] || [];
    }

    // For food category, apply time-based restrictions
    const restriction = this.getCurrentFoodTimeRestriction();
    return restriction ? restriction.ORDER : this.subcategories[category] || [];
  }

  /**
   * Check if a subcategory is allowed at the current time
   * @param {string} category - Category ID
   * @param {string} subcategory - Subcategory ID
   * @returns {boolean} Whether the subcategory is allowed
   */
  isSubcategoryAllowed(category, subcategory) {
    if (category !== "food") {
      return true; // No restrictions for non-food categories
    }

    const restriction = this.getCurrentFoodTimeRestriction();
    if (!restriction) {
      return true; // No restriction found, allow all
    }

    return restriction.ALLOWED_SUBCATEGORIES.includes(subcategory);
  }

  /**
   * Get all available categories that have data
   * @returns {Array} Array of category IDs
   */
  getAvailableCategories() {
    return Object.keys(this.menuData).filter(
      (category) =>
        this.menuData[category] && this.menuData[category].length > 0
    );
  }

  /**
   * Get filtered menu items for a category with time-based restrictions
   * @param {string} category - Category ID
   * @param {string|null} filter - Optional subcategory filter
   * @returns {Array} Filtered menu items
   */
  getFilteredItems(category, filter = null) {
    if (!this.menuData[category]) {
      return [];
    }

    let items = [...this.menuData[category]];

    // Apply time-based filtering for food category
    if (category === "food") {
      items = items.filter((item) => {
        // Check if the item's subcategory is allowed at current time
        return this.isSubcategoryAllowed(category, item.subcategory);
      });
    }

    // Filter by subcategory if specified
    if (filter) {
      items = items.filter((item) => item.subcategory === filter);
    }

    // Only show available items
    items = items.filter((item) => item.available !== false);

    return items;
  }

  /**
   * Get available subcategories for a category that have items and are time-allowed
   * @param {string} category - Category ID
   * @returns {Array} Array of available subcategory IDs
   */
  getAvailableSubcategories(category) {
    if (!this.menuData[category]) {
      return [];
    }

    const timeAwareSubcategories = this.getTimeAwareSubcategories(category);

    // Filter to only include subcategories that have items and are time-allowed
    return timeAwareSubcategories.filter((subcategory) => {
      // Check if there are items in this subcategory
      const hasItems = this.menuData[category].some(
        (item) =>
          item.subcategory === subcategory &&
          item.available !== false &&
          this.isSubcategoryAllowed(category, item.subcategory)
      );

      return hasItems;
    });
  }
}

export const AppState = new AppStateClass();

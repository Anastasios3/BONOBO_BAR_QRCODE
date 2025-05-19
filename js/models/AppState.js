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
   * Get filtered menu items for a category
   * @param {string} category - Category ID
   * @param {string|null} filter - Optional subcategory filter
   * @returns {Array} Filtered menu items
   */
  getFilteredItems(category, filter = null) {
    if (!this.menuData[category]) {
      return [];
    }

    let items = [...this.menuData[category]];

    // Filter by subcategory if specified
    if (filter) {
      items = items.filter((item) => item.subcategory === filter);
    }

    // Only show available items
    items = items.filter((item) => item.available !== false);

    return items;
  }
}

export const AppState = new AppStateClass();

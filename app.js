/**
 * Bonobo Bar & More Digital Menu
 * JavaScript implementation for menu display and interaction
 *
 * This file handles all dynamic content loading, user interactions,
 * and state management for the Bonobo Bar digital menu.
 */

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  /**
   * Application State
   * Centralized state management for the application
   */
  const AppState = {
    // Core state values
    language: localStorage.getItem("bonobo-language") || "en",
    theme:
      localStorage.getItem("bonobo-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"),
    currentCategory: null,
    currentFilter: null,
    menuData: {},
    isLoading: true,

    // Category order based on time of day
    categoriesOrder: [],

    // Subcategory definitions
    subcategories: {
      coffee: ["coffee", "tea", "chocolate", "soft"],
      food: ["snacks", "main", "desserts"],
      spirits: ["whisky", "vodka", "rum", "tequila", "others", "liqueur"],
      beer: ["draft", "bottles", "craft"],
      wine: ["white", "rose", "red", "sparkling"],
      cocktails: ["classic", "signature", "mocktails"],
    },

    // Translation data
    translations: {
      en: {
        allItems: "All Items",
        filterBy: "Filter By",
        emptyTitle: "Select a category",
        emptyMessage: "Choose a category to view our offerings",
        loadingMessage: "Loading items...",
        errorTitle: "Something went wrong",
        errorMessage: "We couldn't load the menu data. Please try again.",
        glassLabel: "Glass",
        bottleLabel: "Bottle",
        priceLabel: "Price",
        subcategories: {
          coffee: {
            coffee: "Coffee",
            tea: "Tea",
            chocolate: "Chocolate",
            soft: "Soft Drinks",
          },
          food: {
            snacks: "Snacks",
            main: "Main Dishes",
            desserts: "Desserts",
          },
          spirits: {
            whisky: "Whisky",
            vodka: "Vodka",
            rum: "Rum",
            tequila: "Tequila",
            others: "Others",
            liqueur: "Liqueur",
          },
          beer: {
            draft: "Draft",
            bottles: "Bottles",
            craft: "Craft",
          },
          wine: {
            white: "White",
            rose: "Rosé",
            red: "Red",
            sparkling: "Sparkling",
          },
          cocktails: {
            classic: "Classic",
            signature: "Signature",
            mocktails: "Mocktails",
          },
        },
        categories: {
          coffee: "Coffee & More",
          food: "Food & Snacks",
          spirits: "Spirit List",
          beer: "Beer List",
          wine: "Wine List",
          cocktails: "Cocktail List",
        },
      },
      el: {
        allItems: "Όλα τα Είδη",
        filterBy: "Φίλτρο",
        emptyTitle: "Επιλέξτε κατηγορία",
        emptyMessage: "Επιλέξτε μια κατηγορία για να δείτε τα προϊόντα μας",
        loadingMessage: "Φόρτωση προϊόντων...",
        errorTitle: "Κάτι πήγε στραβά",
        errorMessage:
          "Δεν ήταν δυνατή η φόρτωση των δεδομένων του μενού. Παρακαλώ δοκιμάστε ξανά.",
        glassLabel: "Ποτήρι",
        bottleLabel: "Φιάλη",
        priceLabel: "Τιμή",
        subcategories: {
          coffee: {
            coffee: "Καφές",
            tea: "Τσάι",
            chocolate: "Σοκολάτα",
            soft: "Αναψυκτικά",
          },
          food: {
            snacks: "Σνακ",
            main: "Κύρια Πιάτα",
            desserts: "Επιδόρπια",
          },
          spirits: {
            whisky: "Ουίσκι",
            vodka: "Βότκα",
            rum: "Ρούμι",
            tequila: "Τεκίλα",
            others: "Άλλα",
            liqueur: "Λικέρ",
          },
          beer: {
            draft: "Βαρελίσια",
            bottles: "Φιάλες",
            craft: "Χειροποίητες",
          },
          wine: {
            white: "Λευκό",
            rose: "Ροζέ",
            red: "Κόκκινο",
            sparkling: "Αφρώδες",
          },
          cocktails: {
            classic: "Κλασικά",
            signature: "Signature",
            mocktails: "Mocktails",
          },
        },
        categories: {
          coffee: "Καφές & Περισσότερα",
          food: "Φαγητό & Σνακ",
          spirits: "Λίστα Ποτών",
          beer: "Λίστα Μπύρας",
          wine: "Λίστα Κρασιών",
          cocktails: "Λίστα Κοκτέιλ",
        },
      },
    },

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
    },

    /**
     * Set language and save to localStorage
     * @param {string} lang - Language code ('en' or 'el')
     */
    setLanguage(lang) {
      if (lang && (lang === "en" || lang === "el")) {
        this.language = lang;
        localStorage.setItem("bonobo-language", lang);
      }
    },

    /**
     * Set theme and save to localStorage
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    setTheme(theme) {
      if (theme && (theme === "light" || theme === "dark")) {
        this.theme = theme;
        localStorage.setItem("bonobo-theme", theme);
        document.body.classList.toggle("dark-theme", theme === "dark");
      }
    },

    /**
     * Determine optimal category order based on time of day
     */
    determineCategoryOrder() {
      const hour = new Date().getHours();

      if (hour >= 6 && hour < 11) {
        // Morning (6am - 11am): Coffee, Food, Wine, Beer, Cocktails, Spirits
        this.categoriesOrder = [
          "coffee",
          "food",
          "wine",
          "beer",
          "cocktails",
          "spirits",
        ];
      } else if (hour >= 11 && hour < 16) {
        // Lunch (11am - 4pm): Food, Coffee, Wine, Beer, Spirits, Cocktails
        this.categoriesOrder = [
          "food",
          "coffee",
          "wine",
          "beer",
          "spirits",
          "cocktails",
        ];
      } else if (hour >= 16 && hour < 20) {
        // Afternoon (4pm - 8pm): Cocktails, Coffee, Food, Beer, Wine, Spirits
        this.categoriesOrder = [
          "cocktails",
          "coffee",
          "food",
          "beer",
          "wine",
          "spirits",
        ];
      } else {
        // Night (8pm - 6am): Spirits, Cocktails, Beer, Wine, Food, Coffee
        this.categoriesOrder = [
          "spirits",
          "cocktails",
          "beer",
          "wine",
          "food",
          "coffee",
        ];
      }
    },

    /**
     * Get all available categories that have data
     * @returns {Array} Array of category IDs
     */
    getAvailableCategories() {
      return Object.keys(this.menuData).filter(
        (category) =>
          this.menuData[category] && this.menuData[category].length > 0
      );
    },

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
    },
  };

  /**
   * UI Controller
   * Manages all DOM interactions and UI updates
   */
  const UIController = {
    // DOM elements cache
    elements: {},

    /**
     * Initialize and cache DOM elements
     */
    initializeDOM() {
      this.elements = {
        // Header elements
        themeToggle: document.getElementById("theme-toggle"),
        languageOptions: document.querySelectorAll(".lang-option"),

        // Navigation elements
        menuCategories: document.getElementById("menu-categories"),
        categoryList: document.getElementById("category-list"),

        // Content elements
        currentCategory: document.getElementById("current-category"),
        menuItemsGrid: document.getElementById("menu-items"), // FIXED: Changed from 'menu-items-grid' to 'menu-items'
        emptyState: document.getElementById("empty-state"),
        emptyTitle: document.getElementById("empty-title"),
        emptyMessage: document.getElementById("empty-message"),

        // Filter elements
        filterToggle: document.getElementById("filter-toggle"),
        filterPanel: document.getElementById("filter-panel"),
        subcategoryFilters: document.getElementById("subcategory-filters"),

        // Footer elements
        hoursContent: document.getElementById("hours-content"),
        locationText: document.getElementById("location-text"),
      };
    },

    /**
     * Apply theme from state
     */
    applyTheme() {
      document.body.classList.toggle("dark-theme", AppState.theme === "dark");
    },

    /**
     * Update UI text elements based on current language
     */
    updateUITexts() {
      // Update language option active states
      if (this.elements.languageOptions) {
        this.elements.languageOptions.forEach((option) => {
          option.classList.toggle(
            "active",
            option.dataset.lang === AppState.language
          );
        });
      }

      // Update empty state texts
      if (this.elements.emptyTitle && this.elements.emptyMessage) {
        this.elements.emptyTitle.textContent = AppState.getText("emptyTitle");
        this.elements.emptyMessage.textContent =
          AppState.getText("emptyMessage");
      }

      // Update footer texts
      if (this.elements.hoursContent) {
        this.elements.hoursContent.textContent =
          AppState.getText("hoursContent");
      }

      if (this.elements.locationText) {
        this.elements.locationText.textContent = AppState.getText("location");
      }

      // Update filter button text
      if (this.elements.filterToggle) {
        const filterText = this.elements.filterToggle.querySelector("span");
        if (filterText) {
          filterText.textContent = AppState.getText("filterBy");
        }
      }
    },

    /**
     * Generate category navigation tabs
     */
    generateCategoryTabs() {
      if (!this.elements.menuCategories) {
        return;
      }

      this.elements.menuCategories.innerHTML = "";

      // Create a tab for each category with data
      AppState.categoriesOrder.forEach((category) => {
        // Skip categories with no data
        if (
          !AppState.menuData[category] ||
          AppState.menuData[category].length === 0
        ) {
          return;
        }

        const tab = document.createElement("button");
        tab.className = "category-tab";
        tab.dataset.category = category;
        tab.textContent = AppState.getText("categories", category);
        tab.setAttribute(
          "aria-label",
          AppState.getText("categories", category)
        );

        this.elements.menuCategories.appendChild(tab);
      });
    },

    /**
     * Generate sidebar category list (for potential future use)
     */
    generateCategoryList() {
      if (!this.elements.categoryList) {
        return;
      }

      this.elements.categoryList.innerHTML = "";

      // Create a list item for each category with data
      AppState.categoriesOrder.forEach((category) => {
        if (
          !AppState.menuData[category] ||
          AppState.menuData[category].length === 0
        ) {
          return;
        }

        const listItem = document.createElement("li");

        const button = document.createElement("button");
        button.className = "category-list-item";
        button.dataset.category = category;
        button.textContent = AppState.getText("categories", category);

        listItem.appendChild(button);
        this.elements.categoryList.appendChild(listItem);
      });
    },

    /**
     * Update active category in navigation
     * @param {string} category - Active category ID
     */
    updateActiveCategory(category) {
      // Update tab navigation
      const categoryTabs = document.querySelectorAll(".category-tab");
      categoryTabs.forEach((tab) => {
        tab.classList.toggle("active", tab.dataset.category === category);
      });

      // Update sidebar navigation if present
      const categoryListItems = document.querySelectorAll(
        ".category-list-item"
      );
      categoryListItems.forEach((item) => {
        item.classList.toggle("active", item.dataset.category === category);
      });

      // Update category title
      if (this.elements.currentCategory) {
        this.elements.currentCategory.textContent = AppState.getText(
          "categories",
          category
        );
      }
    },

    /**
     * Generate filter options for a category
     * @param {string} category - Category ID
     * @param {string|null} activeFilter - Currently active filter
     */
    generateFilterOptions(category, activeFilter = null) {
      if (!this.elements.subcategoryFilters) {
        return;
      }

      const subcategories = AppState.subcategories[category];

      // Clear existing filters
      this.elements.subcategoryFilters.innerHTML = "";

      // If no subcategories for this category, hide the filter panel
      if (!subcategories || subcategories.length === 0) {
        if (this.elements.filterPanel) {
          this.elements.filterPanel.classList.remove("active");
        }

        if (this.elements.filterToggle) {
          this.elements.filterToggle.style.display = "none";
        }

        return;
      }

      // Show filter toggle
      if (this.elements.filterToggle) {
        this.elements.filterToggle.style.display = "flex";
      }

      // Create "All Items" filter
      const allFilter = document.createElement("button");
      allFilter.className = `filter-chip ${
        activeFilter === null ? "active" : ""
      }`;
      allFilter.textContent = AppState.getText("allItems");
      allFilter.dataset.filter = "all";

      this.elements.subcategoryFilters.appendChild(allFilter);

      // Create filter for each subcategory
      subcategories.forEach((subcategory) => {
        // Skip if we don't have items in this subcategory
        const hasItems = AppState.menuData[category].some(
          (item) => item.subcategory === subcategory && item.available !== false
        );

        if (!hasItems) {
          return;
        }

        const filter = document.createElement("button");
        filter.className = `filter-chip ${
          activeFilter === subcategory ? "active" : ""
        }`;
        filter.textContent = AppState.getText(
          "subcategories",
          category,
          subcategory
        );
        filter.dataset.filter = subcategory;

        this.elements.subcategoryFilters.appendChild(filter);
      });
    },

    /**
     * Toggle filter panel visibility
     * @param {boolean} show - Whether to show or hide the panel
     */
    toggleFilterPanel(show = null) {
      if (!this.elements.filterPanel || !this.elements.filterToggle) {
        return;
      }

      if (show === null) {
        // Toggle if no specific state provided
        this.elements.filterPanel.classList.toggle("active");
      } else {
        // Set to specific state
        this.elements.filterPanel.classList.toggle("active", show);
      }

      // Update toggle button state
      const isActive = this.elements.filterPanel.classList.contains("active");
      this.elements.filterToggle.classList.toggle("active", isActive);
      this.elements.filterToggle.setAttribute("aria-expanded", isActive);
    },

    /**
     * Update active filter selection
     * @param {string|null} filter - Active filter ID
     */
    updateActiveFilter(filter) {
      const filterChips = document.querySelectorAll(".filter-chip");

      filterChips.forEach((chip) => {
        const isActive =
          (chip.dataset.filter === "all" && filter === null) ||
          chip.dataset.filter === filter;

        chip.classList.toggle("active", isActive);
      });
    },

    /**
     * Display menu items in the grid
     * @param {Array} items - Menu items to display
     * @param {string} category - Current category ID
     */
    displayMenuItems(items, category) {
      if (!this.elements.menuItemsGrid) {
        return;
      }

      // Clear existing items with a fade-out effect
      this.elements.menuItemsGrid.style.opacity = "0";

      setTimeout(() => {
        this.elements.menuItemsGrid.innerHTML = "";

        // Handle empty results
        if (!items || items.length === 0) {
          if (this.elements.emptyState) {
            this.elements.emptyState.classList.add("active");
          }

          this.elements.menuItemsGrid.style.opacity = "1";
          return;
        }

        // Hide empty state
        if (this.elements.emptyState) {
          this.elements.emptyState.classList.remove("active");
        }

        // Create items with staggered animation
        items.forEach((item, index) => {
          const menuItem = this.createMenuItem(item, category, index);
          this.elements.menuItemsGrid.appendChild(menuItem);
        });

        // Fade in the new items
        this.elements.menuItemsGrid.style.opacity = "1";
      }, 200);
    },

    /**
     * Create a menu item element
     * @param {Object} item - Menu item data
     * @param {string} category - Item's category
     * @param {number} index - Item index for staggered animation
     * @returns {HTMLElement} Menu item element
     */
    createMenuItem(item, category, index) {
      const menuItem = document.createElement("div");
      menuItem.className = "menu-item";
      menuItem.style.animationDelay = `${index * 50}ms`;

      const itemDetails = document.createElement("div");
      itemDetails.className = "menu-details";

      const lang = AppState.language;

      // Item name
      const name = document.createElement("h3");
      name.className = "menu-item-name";
      name.textContent = item.name[lang] || item.name.en || "";

      // Item description
      const description = document.createElement("p");
      description.className = "menu-item-description";
      description.textContent = item.description
        ? item.description[lang] || item.description.en || ""
        : "";

      itemDetails.appendChild(name);
      itemDetails.appendChild(description);

      // Pricing section
      const pricing = document.createElement("div");
      pricing.className = "menu-pricing";

      // Dual pricing for wine and spirits
      if (category === "wine" || category === "spirits") {
        const dualPricing = document.createElement("div");
        dualPricing.className = "price-dual";

        // Glass price
        const glassPrice = document.createElement("div");
        glassPrice.className = "price-glass";

        const glassLabel = document.createElement("span");
        glassLabel.className = "price-label";
        glassLabel.textContent = AppState.getText("glassLabel");

        const glassAmount = document.createElement("span");
        glassAmount.className = "price-amount";
        glassAmount.textContent = this.formatPrice(
          item.priceGlass || item.price
        );

        glassPrice.appendChild(glassLabel);
        glassPrice.appendChild(glassAmount);

        // Bottle price
        const bottlePrice = document.createElement("div");
        bottlePrice.className = "price-bottle";

        const bottleLabel = document.createElement("span");
        bottleLabel.className = "price-label";
        bottleLabel.textContent = AppState.getText("bottleLabel");

        const bottleAmount = document.createElement("span");
        bottleAmount.className = "price-amount";
        bottleAmount.textContent = this.formatPrice(
          item.priceBottle || (item.price ? item.price * 5 : null)
        );

        bottlePrice.appendChild(bottleLabel);
        bottlePrice.appendChild(bottleAmount);

        dualPricing.appendChild(glassPrice);
        dualPricing.appendChild(bottlePrice);
        pricing.appendChild(dualPricing);
      } else {
        // Single price display
        const singlePrice = document.createElement("div");
        singlePrice.className = "price-single";

        const priceAmount = document.createElement("span");
        priceAmount.className = "price-amount";
        priceAmount.textContent = this.formatPrice(item.price);

        singlePrice.appendChild(priceAmount);
        pricing.appendChild(singlePrice);
      }

      // Assemble menu item
      menuItem.appendChild(itemDetails);
      menuItem.appendChild(pricing);

      return menuItem;
    },

    /**
     * Format price with currency symbol
     * @param {number} price - Price value
     * @returns {string} Formatted price string
     */
    formatPrice(price) {
      if (price === undefined || price === null) {
        return "";
      }

      return `${price.toFixed(2)}€`;
    },

    /**
     * Show loading state
     */
    showLoading() {
      if (this.elements.menuItemsGrid) {
        this.elements.menuItemsGrid.innerHTML = "";
        this.elements.menuItemsGrid.style.opacity = "0.5";
      }

      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add("active");
      }

      if (this.elements.emptyTitle && this.elements.emptyMessage) {
        this.elements.emptyTitle.textContent = "Loading...";
        this.elements.emptyMessage.textContent =
          AppState.getText("loadingMessage");
      }
    },

    /**
     * Show error state
     * @param {string} title - Error title
     * @param {string} message - Error message
     */
    showError(title, message) {
      if (this.elements.emptyState) {
        this.elements.emptyState.classList.add("active");
      }

      if (this.elements.emptyTitle && this.elements.emptyMessage) {
        this.elements.emptyTitle.textContent =
          title || AppState.getText("errorTitle");
        this.elements.emptyMessage.textContent =
          message || AppState.getText("errorMessage");
      }

      if (this.elements.menuItemsGrid) {
        this.elements.menuItemsGrid.innerHTML = "";
        this.elements.menuItemsGrid.style.opacity = "1";
      }
    },
  };

  /**
   * Data Controller
   * Handles all data fetching and processing
   */
  const DataController = {
    /**
     * Load data for all categories
     * @returns {Promise} Result of data loading
     */
    async loadAllData() {
      try {
        const categories = [
          "coffee",
          "food",
          "spirits",
          "beer",
          "wine",
          "cocktails",
        ];
        const promises = categories.map((category) =>
          this.loadCategoryData(category)
        );

        // Wait for all data loading attempts
        const results = await Promise.allSettled(promises);

        // Log loading results
        console.log(
          "Menu data loading results:",
          results
            .map((result, i) => `${categories[i]}: ${result.status}`)
            .join(", ")
        );

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
        const response = await fetch(`data/${category}.json`);

        if (!response.ok) {
          throw new Error(
            `Failed to load ${category} data (HTTP ${response.status})`
          );
        }

        const data = await response.json();

        if (data && data.items && Array.isArray(data.items)) {
          // Process items before storing
          const processedItems = this.processItems(data.items, category);
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
     * @param {string} category - Item category
     * @returns {Array} Processed items
     */
    processItems(items, category) {
      return items.map((item) => {
        // Ensure required fields exist
        const processedItem = {
          ...item,
          available: item.available !== false, // Default to available if not specified
        };

        // Handle dual pricing for wine and spirits
        if (category === "spirits" || category === "wine") {
          if (processedItem.priceBottle === undefined && processedItem.price) {
            processedItem.priceGlass = processedItem.price;
            processedItem.priceBottle = processedItem.price * 5; // Default bottle price
          }
        }

        return processedItem;
      });
    },
  };

  /**
   * Event Controller
   * Manages all event handling
   */
  const EventController = {
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

  /**
   * Application Controller
   * Coordinates the overall application flow
   */
  const AppController = {
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

  /**
   * Utility function: Debounce
   * @param {Function} func - Function to debounce
   * @param {number} wait - Milliseconds to wait
   * @returns {Function} Debounced function
   */
  function debounce(func, wait) {
    let timeout;

    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize the application
  AppController.init();
});

/**
 * UI Controller
 * Manages all DOM interactions and UI updates
 */

import { AppState } from "../models/AppState.js";

export const UIController = {
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
      menuItemsGrid: document.getElementById("menu-items"),
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
      this.elements.emptyMessage.textContent = AppState.getText("emptyMessage");
    }

    // Update footer texts
    if (this.elements.hoursContent) {
      this.elements.hoursContent.textContent = AppState.getText("hoursContent");
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
      tab.setAttribute("aria-label", AppState.getText("categories", category));

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
    const categoryListItems = document.querySelectorAll(".category-list-item");
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
  /**
   * Updated displayMenuItems function for UIController.js
   * Now groups items by subcategory and displays subcategory headers
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

      // Group items by subcategory
      const groupedItems = this.groupItemsBySubcategory(items, category);
      let itemIndex = 0;

      // Create items by subcategory with headers
      for (const subcategory in groupedItems) {
        // Add subcategory header
        const subcategoryHeader = this.createSubcategoryHeader(
          subcategory,
          category
        );
        this.elements.menuItemsGrid.appendChild(subcategoryHeader);

        // Add items for this subcategory
        groupedItems[subcategory].forEach((item) => {
          const menuItem = this.createMenuItem(item, category, itemIndex);
          this.elements.menuItemsGrid.appendChild(menuItem);
          itemIndex++;
        });
      }

      // Fade in the new items
      this.elements.menuItemsGrid.style.opacity = "1";
    }, 200);
  },

  /**
   * Group menu items by subcategory
   * @param {Array} items - Menu items to group
   * @param {string} category - Current category ID
   * @returns {Object} Items grouped by subcategory
   */
  groupItemsBySubcategory(items, category) {
    const grouped = {};

    // First sort items by subcategory
    const sortedItems = [...items].sort((a, b) => {
      if (a.subcategory === b.subcategory) {
        // Secondary sort by name if same subcategory
        return a.name.en.localeCompare(b.name.en);
      }
      return a.subcategory.localeCompare(b.subcategory);
    });

    // Group items
    sortedItems.forEach((item) => {
      const subcategory = item.subcategory;
      if (!grouped[subcategory]) {
        grouped[subcategory] = [];
      }
      grouped[subcategory].push(item);
    });

    return grouped;
  },

  /**
   * Create a subcategory header element
   * @param {string} subcategory - Subcategory ID
   * @param {string} category - Parent category ID
   * @returns {HTMLElement} Subcategory header element
   */
  createSubcategoryHeader(subcategory, category) {
    const header = document.createElement("div");
    header.className = "subcategory-header";

    const title = document.createElement("h2");
    title.className = "subcategory-title";

    // Add icon based on subcategory
    let iconClass = "fa-glass-whiskey";

    // Set appropriate icon for each subcategory type
    if (category === "wine") {
      switch (subcategory) {
        case "red":
          iconClass = "fa-wine-bottle";
          break;
        case "white":
          iconClass = "fa-wine-glass-alt";
          break;
        case "rose":
          iconClass = "fa-wine-glass";
          break;
        case "sparkling":
          iconClass = "fa-champagne-glasses";
          break;
        default:
          iconClass = "fa-wine-glass";
      }
    } else if (category === "spirits") {
      switch (subcategory) {
        case "whisky":
          iconClass = "fa-whiskey-glass";
          break;
        case "vodka":
          iconClass = "fa-glass-whiskey";
          break;
        case "rum":
          iconClass = "fa-glass-whiskey";
          break;
        case "tequila":
          iconClass = "fa-cocktail";
          break;
        default:
          iconClass = "fa-glass-whiskey";
      }
    } else if (category === "beer") {
      iconClass = "fa-beer-mug-empty";
    } else if (category === "coffee") {
      switch (subcategory) {
        case "coffee":
          iconClass = "fa-mug-hot";
          break;
        case "tea":
          iconClass = "fa-mug-saucer";
          break;
        case "chocolate":
          iconClass = "fa-mug-hot";
          break;
        case "soft":
          iconClass = "fa-glass";
          break;
        default:
          iconClass = "fa-mug-hot";
      }
    } else if (category === "food") {
      switch (subcategory) {
        case "snacks":
          iconClass = "fa-burger";
          break;
        case "main":
          iconClass = "fa-utensils";
          break;
        case "desserts":
          iconClass = "fa-ice-cream";
          break;
        default:
          iconClass = "fa-utensils";
      }
    } else if (category === "cocktails") {
      switch (subcategory) {
        case "classic":
          iconClass = "fa-martini-glass-citrus";
          break;
        case "signature":
          iconClass = "fa-cocktail";
          break;
        case "mocktails":
          iconClass = "fa-glass-water";
          break;
        default:
          iconClass = "fa-martini-glass";
      }
    }

    // Create icon element
    const icon = document.createElement("i");
    icon.className = `fas ${iconClass}`;

    // Append icon and subcategory name
    title.appendChild(icon);
    title.appendChild(
      document.createTextNode(
        AppState.getText("subcategories", category, subcategory) || subcategory
      )
    );

    header.appendChild(title);
    return header;
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
      glassAmount.textContent = this.formatPrice(item.priceGlass || item.price);

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

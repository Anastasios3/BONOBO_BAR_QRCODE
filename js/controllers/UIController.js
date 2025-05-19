/**
 * UI Controller - Optimized for Premium Scrolling Integration
 * Manages all DOM interactions and UI updates with enhanced performance
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
      categoryNavigation: document.querySelector(".category-navigation"),
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

    // Setup CSS variable for theming
    this.setupThemeColors();
  },

  /**
   * Setup theme color CSS variables for animations
   */
  setupThemeColors() {
    // Extract accent color and convert to RGB for use in animations
    const computedStyle = getComputedStyle(document.documentElement);
    const accentColor = computedStyle.getPropertyValue("--accent-color").trim();

    // Only process if we have a valid color
    if (accentColor) {
      let r, g, b;

      // Handle hex colors
      if (accentColor.startsWith("#")) {
        // Parse hex value
        const hex = accentColor.substring(1);

        // Handle shorthand hex (#RGB) or full hex (#RRGGBB)
        const expandedHex =
          hex.length === 3
            ? hex
                .split("")
                .map((h) => h + h)
                .join("")
            : hex;

        r = parseInt(expandedHex.substr(0, 2), 16);
        g = parseInt(expandedHex.substr(2, 2), 16);
        b = parseInt(expandedHex.substr(4, 2), 16);
      }
      // Handle rgb/rgba colors
      else if (accentColor.startsWith("rgb")) {
        const matches = accentColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (matches) {
          [, r, g, b] = matches.map(Number);
        }
      }

      // Set RGB variables if we successfully parsed the color
      if (r !== undefined && g !== undefined && b !== undefined) {
        document.documentElement.style.setProperty(
          "--accent-rgb",
          `${r}, ${g}, ${b}`
        );
      }
    }
  },

  /**
   * Apply theme from state
   */
  applyTheme() {
    document.body.classList.toggle("dark-theme", AppState.theme === "dark");

    // Update theme colors after theme change
    setTimeout(() => {
      this.setupThemeColors();
    }, 100);
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
   * Generate category navigation tabs with optimized rendering
   */
  generateCategoryTabs() {
    if (!this.elements.menuCategories) {
      return;
    }

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Clear existing tabs
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
      tab.setAttribute("aria-selected", "false");
      tab.setAttribute("role", "tab");
      tab.setAttribute("tabindex", "0");

      // Add to fragment instead of directly to DOM
      fragment.appendChild(tab);
    });

    // Append all tabs at once
    this.elements.menuCategories.appendChild(fragment);

    // Reset scroll position to ensure proper rendering
    if (this.elements.categoryNavigation) {
      this.elements.categoryNavigation.scrollLeft = 0;
    }

    // Ensure scroll controls are synced with new content
    this.triggerScrollUpdate();
  },

  /**
   * Generate sidebar category list (for potential future use)
   */
  generateCategoryList() {
    if (!this.elements.categoryList) {
      return;
    }

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Clear existing list
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
      button.setAttribute("aria-selected", "false");
      button.setAttribute("role", "tab");

      listItem.appendChild(button);
      fragment.appendChild(listItem);
    });

    // Append all items at once
    this.elements.categoryList.appendChild(fragment);
  },

  /**
   * Update active category in navigation
   * @param {string} category - Active category ID
   */
  updateActiveCategory(category) {
    // Update tab navigation
    const categoryTabs = document.querySelectorAll(".category-tab");
    categoryTabs.forEach((tab) => {
      const isActive = tab.dataset.category === category;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update sidebar navigation if present
    const categoryListItems = document.querySelectorAll(".category-list-item");
    categoryListItems.forEach((item) => {
      const isActive = item.dataset.category === category;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update category title
    if (this.elements.currentCategory) {
      this.elements.currentCategory.textContent = AppState.getText(
        "categories",
        category
      );
    }

    // Trigger tabActivated event for ScrollManager
    if (this.elements.categoryNavigation) {
      const event = new CustomEvent("tabActivated", {
        detail: { category },
        bubbles: true,
      });
      this.elements.categoryNavigation.dispatchEvent(event);
    }
  },

  /**
   * Trigger a scroll update to refresh controls and position
   */
  triggerScrollUpdate() {
    if (
      this.elements.categoryNavigation &&
      this.elements.categoryNavigation._scrollManager
    ) {
      // If ScrollManager is available, use it directly
      this.elements.categoryNavigation._scrollManager.checkScrollability();
      this.elements.categoryNavigation._scrollManager.centerActiveTab();
    } else {
      // Otherwise dispatch a scroll event to trigger updates
      setTimeout(() => {
        this.elements.categoryNavigation.dispatchEvent(new Event("scroll"));
      }, 100);
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

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

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
    allFilter.setAttribute(
      "aria-pressed",
      activeFilter === null ? "true" : "false"
    );
    allFilter.setAttribute("role", "button");
    allFilter.setAttribute("tabindex", "0");

    fragment.appendChild(allFilter);

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
      filter.setAttribute(
        "aria-pressed",
        activeFilter === subcategory ? "true" : "false"
      );
      filter.setAttribute("role", "button");
      filter.setAttribute("tabindex", "0");

      fragment.appendChild(filter);
    });

    // Append all filters at once
    this.elements.subcategoryFilters.appendChild(fragment);
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

    // If showing the panel, provide haptic feedback on mobile
    if (isActive && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
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
      chip.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  },

  /**
   * Display menu items in the grid with optimized rendering
   * @param {Array} items - Menu items to display
   * @param {string} category - Current category ID
   */
  displayMenuItems(items, category) {
    if (!this.elements.menuItemsGrid) {
      return;
    }

    // Use requestAnimationFrame for smooth transitions
    requestAnimationFrame(() => {
      // Fade out current items
      this.elements.menuItemsGrid.style.opacity = "0";

      // Use a shorter timeout for better perceived performance
      setTimeout(() => {
        // Create document fragment for better performance
        const fragment = document.createDocumentFragment();

        // Clear existing items
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
          fragment.appendChild(subcategoryHeader);

          // Add items for this subcategory
          groupedItems[subcategory].forEach((item) => {
            const menuItem = this.createMenuItem(item, category, itemIndex);
            fragment.appendChild(menuItem);
            itemIndex++;
          });
        }

        // Append all items at once for better performance
        this.elements.menuItemsGrid.appendChild(fragment);

        // Use requestAnimationFrame for smoother fade-in
        requestAnimationFrame(() => {
          this.elements.menuItemsGrid.style.opacity = "1";
        });
      }, 150); // Shorter timeout for better perceived performance
    });
  },

  /**
   * Group menu items by subcategory with optimized sorting
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
   * Create a menu item element with enhanced structure for mobile
   * @param {Object} item - Menu item data
   * @param {string} category - Item's category
   * @param {number} index - Item index for staggered animation
   * @returns {HTMLElement} Menu item element
   */
  createMenuItem(item, category, index) {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";
    menuItem.style.animationDelay = `${index * 30}ms`; // Faster animation delay

    // Add appropriate ARIA attributes
    menuItem.setAttribute("role", "listitem");

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

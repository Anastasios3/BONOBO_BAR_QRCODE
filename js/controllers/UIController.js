/**
 * UI Controller - Updated for new pricing structure, category ordering and time-based food filtering
 * Manages all DOM interactions and UI updates
 */

import { AppState } from "../models/AppState.js";
import { ModalController } from "./ModalController.js";

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

    // Reset scroll position
    if (this.elements.categoryNavigation) {
      this.elements.categoryNavigation.scrollLeft = 0;
    }

    // Update scroll state
    this.updateScrollState();
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

    // Notify scroll handler to center the active tab
    this.notifyTabActivated();
  },

  /**
   * Notify scroll handler that a tab has been activated
   */
  notifyTabActivated() {
    if (this.elements.categoryNavigation) {
      // Create and dispatch a custom event
      const event = new CustomEvent("tabActivated");
      this.elements.categoryNavigation.dispatchEvent(event);

      // Also use the global API if available
      if (window.menuScrolling && window.menuScrolling.centerActiveTab) {
        window.menuScrolling.centerActiveTab();
      }
    }
  },

  /**
   * Update scroll state and indicators
   */
  updateScrollState() {
    // Use global API if available
    if (window.menuScrolling && window.menuScrolling.updateIndicators) {
      window.menuScrolling.updateIndicators();
    }
  },

  /**
   * Update scroll indicators (for external use)
   */
  updateScrollIndicators() {
    this.updateScrollState();
  },

  /**
   * Generate filter options for a category with time-based restrictions
   * @param {string} category - Category ID
   * @param {string|null} activeFilter - Currently active filter
   */
  generateFilterOptions(category, activeFilter = null) {
    if (!this.elements.subcategoryFilters) {
      return;
    }

    // Get time-aware available subcategories
    const availableSubcategories = AppState.getAvailableSubcategories(category);

    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();

    // Clear existing filters
    this.elements.subcategoryFilters.innerHTML = "";

    // If no subcategories for this category, hide the filter panel
    if (!availableSubcategories || availableSubcategories.length === 0) {
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

    // Create filter for each available subcategory (in time-aware order)
    availableSubcategories.forEach((subcategory) => {
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
   * Display menu items in the grid with new pricing structure and time-based ordering
   * @param {Array} items - Menu items to display
   * @param {string} category - Current category ID
   */
  displayMenuItems(items, category) {
    if (!this.elements.menuItemsGrid) {
      return;
    }

    // Simple fade transition
    this.elements.menuItemsGrid.style.opacity = "0";

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

      // Group items by subcategory in the correct order
      const groupedItems = this.groupItemsBySubcategory(items, category);
      let itemIndex = 0;

      // Get the correct time-aware order for this category
      const subcategoryOrder = AppState.getTimeAwareSubcategories(category);

      // Create items by subcategory with headers in the correct time-aware order
      subcategoryOrder.forEach((subcategory) => {
        if (groupedItems[subcategory] && groupedItems[subcategory].length > 0) {
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
      });

      // Add food disclaimer for food category
      if (category === "food") {
        const disclaimer = this.createFoodDisclaimer();
        fragment.appendChild(disclaimer);
      }

      // Append all items at once for better performance
      this.elements.menuItemsGrid.appendChild(fragment);

      // Fade in the new items
      setTimeout(() => {
        this.elements.menuItemsGrid.style.opacity = "1";
      }, 30);
    }, 150);
  },
  /**
   * Create food disclaimer element
   * @returns {HTMLElement} Food disclaimer element
   */
  createFoodDisclaimer() {
    const disclaimer = document.createElement("div");
    disclaimer.className = "food-disclaimer";

    disclaimer.innerHTML = `
    <i class="fas fa-info-circle"></i>
    ${AppState.getText("foodDisclaimer")}
  `;

    return disclaimer;
  },
  /**
   * Group menu items by subcategory preserving time-aware order
   * @param {Array} items - Menu items to group
   * @param {string} category - Current category ID
   * @returns {Object} Items grouped by subcategory
   */
  groupItemsBySubcategory(items, category) {
    const grouped = {};

    // Group items by subcategory while preserving order
    items.forEach((item) => {
      const subcategory = item.subcategory;
      if (!grouped[subcategory]) {
        grouped[subcategory] = [];
      }
      grouped[subcategory].push(item);
    });

    // DO NOT sort items - preserve JSON file order
    // Items will maintain their original order from the JSON file

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
    title.textContent =
      AppState.getText("subcategories", category, subcategory) || subcategory;

    header.appendChild(title);
    return header;
  },

  /**
   * Create a menu item element with new pricing structure
   * @param {Object} item - Menu item data
   * @param {string} category - Item's category
   * @param {number} index - Item index for staggered animation
   * @returns {HTMLElement} Menu item element
   */
  createMenuItem(item, category, index) {
    const menuItem = document.createElement("div");
    menuItem.className = "menu-item";
    menuItem.style.animationDelay = `${index * 30}ms`;

    // Add appropriate ARIA attributes
    menuItem.setAttribute("role", "listitem");

    // Make menu item clickable for modal
    menuItem.style.cursor = "pointer";
    menuItem.setAttribute("tabindex", "0");
    menuItem.setAttribute(
      "aria-label",
      `View details for ${item.name.en || item.name}`
    );

    // Add click event listener for modal
    menuItem.addEventListener("click", () => {
      ModalController.open(item, category);
    });

    // Add keyboard support
    menuItem.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        ModalController.open(item, category);
      }
    });

    // Add hover effect for desktop
    menuItem.addEventListener("mouseenter", () => {
      if (window.innerWidth > 768) {
        menuItem.style.transform = "translateY(-2px)";
        menuItem.style.transition = "transform 0.2s ease";
      }
    });

    menuItem.addEventListener("mouseleave", () => {
      if (window.innerWidth > 768) {
        menuItem.style.transform = "";
      }
    });

    const itemDetails = document.createElement("div");
    itemDetails.className = "menu-details";

    const lang = AppState.language;

    // Item name
    const name = document.createElement("h3");
    name.className = "menu-item-name";
    name.textContent = item.name[lang] || item.name.en || "";

    // Item description (truncated)
    const description = document.createElement("p");
    description.className = "menu-item-description";
    const fullDescription = item.description
      ? item.description[lang] || item.description.en || ""
      : "";

    // Truncate description for grid view
    const truncatedDescription =
      fullDescription.length > 120
        ? fullDescription.substring(0, 120) + "..."
        : fullDescription;

    description.textContent = truncatedDescription;

    // Add "Read more" indicator if description is truncated
    if (fullDescription.length > 120) {
      const readMore = document.createElement("span");
      readMore.className = "read-more-indicator";
      readMore.textContent = " (tap for more)";
      readMore.style.color = "var(--accent-color)";
      readMore.style.fontWeight = "var(--font-weight-medium)";
      readMore.style.fontSize = "var(--font-size-xs)";
      readMore.style.fontStyle = "italic";
      description.appendChild(readMore);
    }

    itemDetails.appendChild(name);
    itemDetails.appendChild(description);

    // Pricing section
    const pricing = document.createElement("div");
    pricing.className = "menu-pricing";

    // Handle different pricing structures based on category and item
    this.createPricingDisplay(item, category, pricing);

    // Assemble menu item
    menuItem.appendChild(itemDetails);
    menuItem.appendChild(pricing);

    return menuItem;
  },

  /**
   * Create pricing display based on category and item type
   * @param {Object} item - Menu item data
   * @param {string} category - Item's category
   * @param {HTMLElement} pricing - Pricing container element
   */
  createPricingDisplay(item, category, pricing) {
    // Wine category - bottle only (some have glass option)
    if (category === "wine") {
      if (item.priceGlass && item.priceBottle) {
        // Dual pricing for wine
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
        glassAmount.textContent = this.formatPrice(item.priceGlass);

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
        bottleAmount.textContent = this.formatPrice(item.priceBottle);

        bottlePrice.appendChild(bottleLabel);
        bottlePrice.appendChild(bottleAmount);

        dualPricing.appendChild(glassPrice);
        dualPricing.appendChild(bottlePrice);
        pricing.appendChild(dualPricing);
      } else {
        // Single price (bottle only) - SHOW BOTTLE LABEL
        const singlePrice = document.createElement("div");
        singlePrice.className = "price-dual"; // Use dual styling for consistent layout

        const bottlePrice = document.createElement("div");
        bottlePrice.className = "price-bottle";

        const bottleLabel = document.createElement("span");
        bottleLabel.className = "price-label";
        bottleLabel.textContent = AppState.getText("bottleLabel");

        const bottleAmount = document.createElement("span");
        bottleAmount.className = "price-amount";
        bottleAmount.textContent = this.formatPrice(
          item.priceBottle || item.price
        );

        bottlePrice.appendChild(bottleLabel);
        bottlePrice.appendChild(bottleAmount);

        singlePrice.appendChild(bottlePrice);
        pricing.appendChild(singlePrice);
      }
    }
    // Coffee category - single/double shot options
    else if (category === "coffee") {
      if (item.priceSingle && item.priceDouble) {
        // Dual pricing for coffee (single/double shot)
        const dualPricing = document.createElement("div");
        dualPricing.className = "price-dual";

        // Single shot price
        const singlePrice = document.createElement("div");
        singlePrice.className = "price-glass";

        const singleLabel = document.createElement("span");
        singleLabel.className = "price-label";
        singleLabel.textContent = AppState.getText("singleShotLabel");

        const singleAmount = document.createElement("span");
        singleAmount.className = "price-amount";
        singleAmount.textContent = this.formatPrice(item.priceSingle);

        singlePrice.appendChild(singleLabel);
        singlePrice.appendChild(singleAmount);

        // Double shot price
        const doublePrice = document.createElement("div");
        doublePrice.className = "price-bottle";

        const doubleLabel = document.createElement("span");
        doubleLabel.className = "price-label";
        doubleLabel.textContent = AppState.getText("doubleShotLabel");

        const doubleAmount = document.createElement("span");
        doubleAmount.className = "price-amount";
        doubleAmount.textContent = this.formatPrice(item.priceDouble);

        doublePrice.appendChild(doubleLabel);
        doublePrice.appendChild(doubleAmount);

        dualPricing.appendChild(singlePrice);
        dualPricing.appendChild(doublePrice);
        pricing.appendChild(dualPricing);
      } else {
        // Single price for coffee - NO LABEL
        const singlePrice = document.createElement("div");
        singlePrice.className = "price-single";

        const priceAmount = document.createElement("span");
        priceAmount.className = "price-amount";
        priceAmount.textContent = this.formatPrice(item.price);

        singlePrice.appendChild(priceAmount);
        pricing.appendChild(singlePrice);
      }
    }
    // All other categories - single price only, NO LABEL
    else {
      const singlePrice = document.createElement("div");
      singlePrice.className = "price-single";

      const priceAmount = document.createElement("span");
      priceAmount.className = "price-amount";
      priceAmount.textContent = this.formatPrice(item.price);

      singlePrice.appendChild(priceAmount);
      pricing.appendChild(singlePrice);
    }
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

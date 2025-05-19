/**
 * UI Controller - Enhanced for mobile with improved scrolling
 * Manages all DOM interactions and UI updates
 */

import { AppState } from "../models/AppState.js";

export const UIController = {
  // DOM elements cache
  elements: {},

  // Touch scroll handling
  touchScrollState: {
    isScrolling: false,
    startX: 0,
    scrollLeft: 0,
  },

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
      scrollIndicatorLeft: null, // Will be created dynamically
      scrollIndicatorRight: null, // Will be created dynamically

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

    // Create scroll indicators
    this.createScrollIndicators();

    // Set up touch scroll handling for category navigation
    this.setupTouchScrolling();
  },

  /**
   * Create scroll indicators for horizontal navigation
   */
  createScrollIndicators() {
    // Only create if navigation exists
    if (!this.elements.categoryNavigation) {
      return;
    }

    // Create left indicator
    const leftIndicator = document.createElement("div");
    leftIndicator.className = "scroll-indicator scroll-indicator-left";
    leftIndicator.setAttribute("aria-hidden", "true");
    this.elements.categoryNavigation.appendChild(leftIndicator);
    this.elements.scrollIndicatorLeft = leftIndicator;

    // Create right indicator
    const rightIndicator = document.createElement("div");
    rightIndicator.className = "scroll-indicator scroll-indicator-right";
    rightIndicator.setAttribute("aria-hidden", "true");
    this.elements.categoryNavigation.appendChild(rightIndicator);
    this.elements.scrollIndicatorRight = rightIndicator;

    // Make indicators clickable for easier scrolling
    this.setupScrollIndicatorControls();

    // Initial check for indicators
    this.updateScrollIndicators();
  },

  /**
   * Set up click handlers for scroll indicators
   */
  setupScrollIndicatorControls() {
    if (!this.elements.categoryNavigation) {
      return;
    }

    // Add event listeners to scroll indicators
    if (this.elements.scrollIndicatorLeft) {
      this.elements.scrollIndicatorLeft.style.pointerEvents = "auto";
      this.elements.scrollIndicatorLeft.addEventListener("click", () => {
        this.scrollCategoriesBy(-200); // Scroll left
      });
    }

    if (this.elements.scrollIndicatorRight) {
      this.elements.scrollIndicatorRight.style.pointerEvents = "auto";
      this.elements.scrollIndicatorRight.addEventListener("click", () => {
        this.scrollCategoriesBy(200); // Scroll right
      });
    }
  },

  /**
   * Setup touch-based scrolling for category navigation
   */
  setupTouchScrolling() {
    const nav = this.elements.categoryNavigation;
    if (!nav) return;

    // Touch start event
    nav.addEventListener(
      "touchstart",
      (e) => {
        this.touchScrollState.isScrolling = true;
        this.touchScrollState.startX = e.touches[0].pageX - nav.offsetLeft;
        this.touchScrollState.scrollLeft = nav.scrollLeft;

        // Prevent default to avoid page scrolling
        if (nav.scrollWidth > nav.clientWidth) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Touch move event
    nav.addEventListener(
      "touchmove",
      (e) => {
        if (!this.touchScrollState.isScrolling) return;

        const x = e.touches[0].pageX - nav.offsetLeft;
        const distance = x - this.touchScrollState.startX;
        nav.scrollLeft = this.touchScrollState.scrollLeft - distance;

        // Update scroll indicators
        this.updateScrollIndicators();

        // Prevent default to avoid page scrolling
        if (nav.scrollWidth > nav.clientWidth) {
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // Touch end event
    nav.addEventListener("touchend", () => {
      this.touchScrollState.isScrolling = false;
      this.snapToNearestCategory();
    });

    // Touch cancel event
    nav.addEventListener("touchcancel", () => {
      this.touchScrollState.isScrolling = false;
    });
  },

  /**
   * Scroll categories horizontally by a given amount
   * @param {number} amount - Amount to scroll (negative for left, positive for right)
   */
  scrollCategoriesBy(amount) {
    const nav = this.elements.categoryNavigation;
    if (!nav) return;

    // Smooth scroll by the given amount
    nav.scrollBy({
      left: amount,
      behavior: "smooth",
    });

    // Update indicators after scrolling
    setTimeout(() => {
      this.updateScrollIndicators();
    }, 300);
  },

  /**
   * Snap to the nearest category tab after scrolling
   */
  snapToNearestCategory() {
    const nav = this.elements.categoryNavigation;
    if (!nav) return;

    // Find the visible tabs
    const tabs = Array.from(document.querySelectorAll(".category-tab"));
    if (tabs.length === 0) return;

    // Calculate center point of the scroll container
    const containerCenter = nav.scrollLeft + nav.clientWidth / 2;

    // Find the closest tab to the center
    let closestTab = null;
    let minDistance = Infinity;

    tabs.forEach((tab) => {
      const tabCenter = tab.offsetLeft + tab.offsetWidth / 2;
      const distance = Math.abs(containerCenter - tabCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestTab = tab;
      }
    });

    if (closestTab) {
      // Calculate the position to center this tab
      const targetScroll =
        closestTab.offsetLeft - (nav.clientWidth - closestTab.offsetWidth) / 2;

      // Smooth scroll to center the tab
      nav.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }
  },

  /**
   * Update scroll indicators based on scroll position
   */
  updateScrollIndicators() {
    const nav = this.elements.categoryNavigation;

    if (!nav) {
      return;
    }

    // Check if scrollable (content wider than container)
    const isScrollable = nav.scrollWidth > nav.clientWidth;

    // Left indicator visible if scrolled right
    if (this.elements.scrollIndicatorLeft) {
      this.elements.scrollIndicatorLeft.classList.toggle(
        "active",
        isScrollable && nav.scrollLeft > 10 // Add a small threshold
      );
    }

    // Right indicator visible if can scroll more to the right
    if (this.elements.scrollIndicatorRight) {
      const canScrollMore =
        nav.scrollLeft < nav.scrollWidth - nav.clientWidth - 10; // Add a small threshold
      this.elements.scrollIndicatorRight.classList.toggle(
        "active",
        isScrollable && canScrollMore
      );
    }
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

      // Add to fragment instead of directly to DOM
      fragment.appendChild(tab);
    });

    // Append all tabs at once
    this.elements.menuCategories.appendChild(fragment);

    // Check if scroll indicators should be displayed
    setTimeout(() => {
      this.updateScrollIndicators();
    }, 100);
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

      listItem.appendChild(button);
      fragment.appendChild(listItem);
    });

    // Append all items at once
    this.elements.categoryList.appendChild(fragment);
  },

  /**
   * Update active category in navigation with enhanced scrolling
   * @param {string} category - Active category ID
   */
  updateActiveCategory(category) {
    // Update tab navigation
    const categoryTabs = document.querySelectorAll(".category-tab");
    let activeTab = null;

    categoryTabs.forEach((tab) => {
      const isActive = tab.dataset.category === category;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");

      if (isActive) {
        activeTab = tab;
      }
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

    // Scroll active tab into view with centering
    if (activeTab && this.elements.categoryNavigation) {
      const nav = this.elements.categoryNavigation;

      // Calculate the scroll position to center the active tab
      const tabRect = activeTab.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();

      const targetScroll =
        activeTab.offsetLeft - (nav.clientWidth - activeTab.offsetWidth) / 2;

      // Smooth scroll to center the active tab
      nav.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });

      // Update scroll indicators after scrolling
      setTimeout(() => {
        this.updateScrollIndicators();
      }, 300);
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

    // Clear existing items with a fade-out effect
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

      // Append all items at once
      this.elements.menuItemsGrid.appendChild(fragment);

      // Fade in the new items
      this.elements.menuItemsGrid.style.opacity = "1";
    }, 200);
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

/**
 * Modal Controller - Updated for new pricing structure
 * Handles product detail modals with focus on description and updated pricing
 */

import { AppState } from "../models/AppState.js";

export const ModalController = {
  // Modal state
  isOpen: false,
  currentItem: null,
  currentCategory: null,

  // DOM elements cache
  elements: {
    overlay: null,
    container: null,
    title: null,
    description: null,
    priceSection: null,
    priceContainer: null,
    closeButton: null,
  },

  /**
   * Initialize the modal system
   */
  init() {
    this.createModalHTML();
    this.cacheElements();
    this.setupEventListeners();
  },

  /**
   * Create modal HTML structure
   */
  createModalHTML() {
    // Check if modal already exists
    if (document.getElementById("product-modal")) {
      return;
    }

    const modalHTML = `
      <div id="product-modal" class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-container" role="document">
          <div class="modal-header">
            <button class="modal-close" aria-label="Close modal" type="button">
              <i class="fas fa-times"></i>
            </button>
            <h2 id="modal-title" class="modal-title"></h2>
          </div>
          
          <div class="modal-body">
            <div id="modal-description" class="modal-description"></div>
          </div>
          
          <div id="modal-price-section" class="modal-price-section">
            <div id="modal-price-container" class="modal-price-container">
              <!-- Price content will be dynamically inserted -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert modal into body
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  },

  /**
   * Cache DOM elements for better performance
   */
  cacheElements() {
    this.elements = {
      overlay: document.getElementById("product-modal"),
      container: null,
      title: document.getElementById("modal-title"),
      description: document.getElementById("modal-description"),
      priceSection: document.getElementById("modal-price-section"),
      priceContainer: document.getElementById("modal-price-container"),
      closeButton: null,
    };

    if (this.elements.overlay) {
      this.elements.container =
        this.elements.overlay.querySelector(".modal-container");
      this.elements.closeButton =
        this.elements.overlay.querySelector(".modal-close");
    }
  },

  /**
   * Set up event listeners for modal interactions
   */
  setupEventListeners() {
    if (!this.elements.overlay) return;

    // Close button
    if (this.elements.closeButton) {
      this.elements.closeButton.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.close();
      });
    }

    // Click outside to close
    this.elements.overlay.addEventListener("click", (e) => {
      if (e.target === this.elements.overlay) {
        this.close();
      }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (e) => {
      if (this.isOpen && e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    });

    // Touch gestures for mobile
    this.setupTouchGestures();
  },

  /**
   * Set up touch gestures for mobile interactions
   */
  setupTouchGestures() {
    if (!this.elements.container) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    this.elements.container.addEventListener(
      "touchstart",
      (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
        this.elements.container.style.transition = "none";
      },
      { passive: true }
    );

    this.elements.container.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;

        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        // Only allow downward swipe
        if (deltaY > 0) {
          this.elements.container.style.transform = `translateY(${deltaY}px)`;
        }
      },
      { passive: true }
    );

    this.elements.container.addEventListener(
      "touchend",
      () => {
        if (!isDragging) return;

        isDragging = false;
        this.elements.container.style.transition = "";

        const deltaY = currentY - startY;

        // If swiped down more than 100px, close modal
        if (deltaY > 100) {
          this.close();
        } else {
          // Reset position
          this.elements.container.style.transform = "";
        }
      },
      { passive: true }
    );
  },

  /**
   * Open modal with product details
   * @param {Object} item - Product item data
   * @param {string} category - Product category
   */
  open(item, category) {
    if (!item || !this.elements.overlay) return;

    this.currentItem = item;
    this.currentCategory = category;

    // Prevent body scroll without changing position
    document.body.style.overflow = "hidden";

    // Populate modal content
    this.populateContent();

    // Show modal
    this.elements.overlay.classList.add("active");
    this.isOpen = true;

    // Focus management
    setTimeout(() => {
      if (this.elements.closeButton) {
        this.elements.closeButton.focus();
      }
    }, 300);

    // Haptic feedback
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(50);
    }
  },

  /**
   * Close modal and restore previous state
   */
  close() {
    if (!this.isOpen || !this.elements.overlay) return;

    // Hide modal
    this.elements.overlay.classList.remove("active");
    this.isOpen = false;

    // Restore body scroll without changing position
    document.body.style.overflow = "";

    // Clear current item
    this.currentItem = null;
    this.currentCategory = null;

    // Haptic feedback
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(30);
    }
  },

  /**
   * Populate modal with current item content
   */
  populateContent() {
    if (!this.currentItem || !this.currentCategory) return;

    const item = this.currentItem;
    const category = this.currentCategory;
    const lang = AppState.language;

    // Update title
    if (this.elements.title) {
      this.elements.title.textContent = item.name[lang] || item.name.en || "";
    }

    // Update description
    if (this.elements.description) {
      const description = item.description
        ? item.description[lang] || item.description.en || ""
        : "No description available.";
      this.elements.description.textContent = description;
    }

    // Update pricing
    this.updatePricing();
  },

  /**
   * Update pricing section based on item type and category
   */
  updatePricing() {
    if (!this.elements.priceContainer || !this.currentItem) return;

    const item = this.currentItem;
    const category = this.currentCategory;

    // Clear existing content
    this.elements.priceContainer.innerHTML = "";

    // Handle different pricing structures
    if (category === "wine") {
      // Wine pricing - check for glass and bottle options
      if (item.priceGlass && item.priceBottle) {
        // Dual pricing for wine
        const dualPricing = document.createElement("div");
        dualPricing.className = "modal-price-dual";

        // Glass price
        const glassPrice = document.createElement("div");
        glassPrice.className = "price-option";
        glassPrice.innerHTML = `
          <div class="price-option-label">${AppState.getText(
            "glassLabel"
          )}</div>
          <div class="price-option-amount">${this.formatPrice(
            item.priceGlass
          )}</div>
        `;

        // Bottle price
        const bottlePrice = document.createElement("div");
        bottlePrice.className = "price-option";
        bottlePrice.innerHTML = `
          <div class="price-option-label">${AppState.getText(
            "bottleLabel"
          )}</div>
          <div class="price-option-amount">${this.formatPrice(
            item.priceBottle
          )}</div>
        `;

        dualPricing.appendChild(glassPrice);
        dualPricing.appendChild(bottlePrice);
        this.elements.priceContainer.appendChild(dualPricing);
      } else {
        // Single pricing (bottle only) - SHOW BOTTLE LABEL for wine in compact layout
        const singlePricing = document.createElement("div");
        singlePricing.className = "modal-price-single-labeled";
        singlePricing.style.textAlign = "center";

        singlePricing.innerHTML = `
          <div class="price-option-label" style="font-size: var(--font-size-xs); opacity: 0.9; margin-bottom: var(--space-xs); text-transform: uppercase; letter-spacing: 0.5px;">${AppState.getText(
            "bottleLabel"
          )}</div>
          <div class="price-option-amount" style="font-size: var(--font-size-xl); font-weight: var(--font-weight-bold);">${this.formatPrice(
            item.priceBottle || item.price
          )}</div>
        `;

        this.elements.priceContainer.appendChild(singlePricing);
      }
    } else if (category === "coffee") {
      // Coffee pricing - check for single and double shot options
      if (item.priceSingle && item.priceDouble) {
        // Dual pricing for coffee
        const dualPricing = document.createElement("div");
        dualPricing.className = "modal-price-dual";

        // Single shot price
        const singlePrice = document.createElement("div");
        singlePrice.className = "price-option";
        singlePrice.innerHTML = `
          <div class="price-option-label">${AppState.getText(
            "singleShotLabel"
          )}</div>
          <div class="price-option-amount">${this.formatPrice(
            item.priceSingle
          )}</div>
        `;

        // Double shot price
        const doublePrice = document.createElement("div");
        doublePrice.className = "price-option";
        doublePrice.innerHTML = `
          <div class="price-option-label">${AppState.getText(
            "doubleShotLabel"
          )}</div>
          <div class="price-option-amount">${this.formatPrice(
            item.priceDouble
          )}</div>
        `;

        dualPricing.appendChild(singlePrice);
        dualPricing.appendChild(doublePrice);
        this.elements.priceContainer.appendChild(dualPricing);
      } else {
        // Single pricing for coffee - NO LABEL
        const singlePrice = document.createElement("div");
        singlePrice.className = "modal-price-single";
        singlePrice.textContent = this.formatPrice(item.price);
        this.elements.priceContainer.appendChild(singlePrice);
      }
    } else {
      // All other categories - single pricing only, NO LABEL
      const singlePrice = document.createElement("div");
      singlePrice.className = "modal-price-single";
      singlePrice.textContent = this.formatPrice(item.price);
      this.elements.priceContainer.appendChild(singlePrice);
    }
  },

  /**
   * Format price with currency symbol
   * @param {number} price - Price value
   * @returns {string} Formatted price string
   */
  formatPrice(price) {
    if (price === undefined || price === null) {
      return "N/A";
    }
    return `${price.toFixed(2)}€`;
  },

  /**
   * Public API methods
   */

  /**
   * Check if modal is currently open
   * @returns {boolean} Whether modal is open
   */
  isModalOpen() {
    return this.isOpen;
  },

  /**
   * Get current modal item
   * @returns {Object|null} Current item or null
   */
  getCurrentItem() {
    return this.currentItem;
  },

  /**
   * Force close modal (for external use)
   */
  forceClose() {
    this.close();
  },

  /**
   * Update modal when app language changes
   */
  onAppLanguageChange() {
    // If modal is open, refresh content with new language
    if (this.isOpen && this.currentItem && this.currentCategory) {
      this.populateContent();
    }
  },
};

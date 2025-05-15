/**
 * Bonobo Bar & More Digital Menu
 * Complete redesign with subcategories, improved UI/UX, and enhanced functionality
 */

// ======== STATE MANAGEMENT ========
const AppState = {
  language: "en",
  currentCategory: null,
  currentSubcategory: null,
  menuData: {},
  categoriesOrder: [],
  subcategories: {
    coffee: ["coffee", "tea", "chocolate", "soft"],
    food: ["snacks", "main", "desserts"],
    spirits: ["whisky", "vodka", "rum", "tequila", "brandy", "liqueur"],
    beer: ["draft", "bottles", "craft"],
    wine: ["white", "rose", "red", "sparkling"],
    cocktails: ["classic", "signature", "mocktails"],
  },
  translations: {
    en: {
      welcome: "Welcome to Bonobo Bar & More",
      subheading: "Experience the extraordinary in Rethymno",
      emptyMessage: "Select a category to view items",
      hours: "Hours",
      hoursContent: "Monday - Sunday: 8:00 - 02:00",
      location: "Rethymno, Crete, Greece",
      subcategoryAll: "All Items",
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
          brandy: "Brandy",
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
      welcome: "Καλωσήρθατε στο Bonobo Bar & More",
      subheading: "Ζήστε την εξαιρετική εμπειρία στο Ρέθυμνο",
      emptyMessage: "Επιλέξτε κατηγορία για να δείτε τα προϊόντα",
      hours: "Ωράριο Λειτουργίας",
      hoursContent: "Δευτέρα - Κυριακή: 8:00 - 02:00",
      location: "Ρέθυμνο, Κρήτη, Ελλάδα",
      subcategoryAll: "Όλα τα Είδη",
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
          brandy: "Μπράντι",
          liqueur: "Λικέρ",
        },
        beer: {
          draft: "Βαρελίσια",
          bottles: "Μπουκάλια",
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
};

// ======== DOM ELEMENTS ========
const DOM = {
  themeToggle: document.getElementById("theme-toggle"),
  languageToggle: document.getElementById("language-toggle"),
  langOptions: document.querySelectorAll(".lang-option"),
  welcomeHeading: document.getElementById("welcome-heading"),
  welcomeSubheading: document.getElementById("welcome-subheading"),
  menuCategories: document.getElementById("menu-categories"),
  scrollIndicator: document.getElementById("scroll-indicator"),
  currentCategoryTitle: document.getElementById("current-category-title"),
  subcategoryTabs: document.getElementById("subcategory-tabs"),
  menuItems: document.getElementById("menu-items"),
  menuEmpty: document.getElementById("menu-empty"),
  emptyMessage: document.getElementById("empty-message"),
  hoursHeading: document.getElementById("hours-heading"),
  hoursContent: document.getElementById("hours-content"),
  locationText: document.getElementById("location-text"),
  logoLightMode: document.getElementById("logo-light-mode"),
  logoDarkMode: document.getElementById("logo-dark-mode"),
};

// ======== INITIALIZATION ========
async function initializeApp() {
  try {
    // Setup event listeners
    setupEventListeners();

    // Set theme based on user preference
    initializeTheme();

    // Check for hero image and set background
    await setHeroBackground();

    // Determine time-based category order
    determineTimeBasedOrder();

    // Load all menu data
    await loadAllMenuData();

    // Initialize UI with current language
    updateUITexts();

    // Generate category buttons
    generateCategoryButtons();

    // Initialize scroll indicator for mobile
    initScrollIndicator();

    // Lazy load categories
    lazyLoadCategories();

    // Apply animations once everything is loaded
    document.body.classList.add("app-loaded");
  } catch (error) {
    console.error("Error initializing app:", error);
  }
}

// ======== EVENT LISTENERS ========
function setupEventListeners() {
  // Theme toggle
  DOM.themeToggle.addEventListener("click", toggleTheme);

  // Language toggle
  DOM.langOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const lang = option.dataset.lang;
      if (lang !== AppState.language) {
        changeLanguage(lang);
      }
    });
  });

  // Handle window resize
  window.addEventListener(
    "resize",
    debounce(() => {
      adjustUIForScreenSize();
      if (window.innerWidth >= 768) {
        DOM.scrollIndicator.style.display = "none";
      } else {
        initScrollIndicator();
      }
    }, 250)
  );
}

// ======== THEME HANDLING ========
function initializeTheme() {
  // Check for saved theme preference
  const savedTheme = localStorage.getItem("bonobo-theme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  } else if (savedTheme === "light") {
    document.body.classList.remove("dark-theme");
  } else {
    // If no saved preference, check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      document.body.classList.add("dark-theme");
    }
  }

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (e) => {
      if (!localStorage.getItem("bonobo-theme")) {
        if (e.matches) {
          document.body.classList.add("dark-theme");
        } else {
          document.body.classList.remove("dark-theme");
        }
      }
    });
}

function toggleTheme() {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("bonobo-theme", isDarkTheme ? "dark" : "light");
}

// ======== LANGUAGE HANDLING ========
function changeLanguage(lang) {
  AppState.language = lang;

  // Update active language in UI
  DOM.langOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.lang === lang);
  });

  // Update all UI texts
  updateUITexts();

  // Re-render current category if one is selected
  if (AppState.currentCategory) {
    renderMenuItems(AppState.currentCategory, AppState.currentSubcategory);
  }

  // Save language preference
  localStorage.setItem("bonobo-language", lang);
}

function updateUITexts() {
  const texts = AppState.translations[AppState.language];

  // Update welcome section
  DOM.welcomeHeading.textContent = texts.welcome;
  DOM.welcomeSubheading.textContent = texts.subheading;

  // Update empty message
  DOM.emptyMessage.textContent = texts.emptyMessage;

  // Update footer texts
  DOM.hoursHeading.textContent = texts.hours;
  DOM.hoursContent.textContent = texts.hoursContent;
  DOM.locationText.textContent = texts.location;

  // Update category buttons (if they exist)
  const categoryButtons = document.querySelectorAll(".category-btn");
  categoryButtons.forEach((button) => {
    const category = button.dataset.category;
    button.textContent = texts.categories[category];
  });

  // Update current category title (if one is selected)
  if (AppState.currentCategory) {
    DOM.currentCategoryTitle.innerHTML = `<h2>${
      texts.categories[AppState.currentCategory]
    }</h2>`;

    // Update subcategory tabs
    updateSubcategoryTabs(AppState.currentCategory);
  } else {
    DOM.currentCategoryTitle.innerHTML = "";
  }
}

// ======== TIME-BASED CATEGORY ORDERING ========
function determineTimeBasedOrder() {
  const hour = new Date().getHours();

  // Define different orders based on time of day
  if (hour >= 6 && hour < 11) {
    // Morning (6am - 11am): Coffee, Food, Wine, Beer, Cocktails, Spirits
    AppState.categoriesOrder = [
      "coffee",
      "food",
      "wine",
      "beer",
      "cocktails",
      "spirits",
    ];
  } else if (hour >= 11 && hour < 16) {
    // Lunch (11am - 4pm): Food, Coffee, Wine, Beer, Spirits, Cocktails
    AppState.categoriesOrder = [
      "food",
      "coffee",
      "wine",
      "beer",
      "spirits",
      "cocktails",
    ];
  } else if (hour >= 16 && hour < 20) {
    // Afternoon (4pm - 8pm): Cocktails, Coffee, Food, Beer, Wine, Spirits
    AppState.categoriesOrder = [
      "cocktails",
      "coffee",
      "food",
      "beer",
      "wine",
      "spirits",
    ];
  } else {
    // Night (8pm - 6am): Spirits, Cocktails, Beer, Wine, Food, Coffee
    AppState.categoriesOrder = [
      "spirits",
      "cocktails",
      "beer",
      "wine",
      "food",
      "coffee",
    ];
  }
}

// ======== DATA LOADING - IMPROVED ========
async function loadAllMenuData() {
  try {
    const categories = [
      "coffee",
      "food",
      "spirits",
      "beer",
      "wine",
      "cocktails",
    ];
    const promises = categories.map((category) => loadCategoryData(category));

    // Use Promise.allSettled to handle failures gracefully
    const results = await Promise.allSettled(promises);

    // Log the load status
    const loadStatus = results
      .map((result, index) => {
        const category = categories[index];
        return `${category}: ${
          result.status === "fulfilled" ? "loaded" : "failed"
        }`;
      })
      .join(", ");

    console.log("Menu data loading complete:", loadStatus);

    // Log available items for debugging
    console.log(
      "Menu data loaded:",
      Object.entries(AppState.menuData)
        .map(([key, value]) => `${key}: ${value ? value.length : 0} items`)
        .join(", ")
    );
  } catch (error) {
    console.error("Error loading menu data:", error);
  }
}

async function loadCategoryData(category) {
  try {
    const response = await fetch(`data/${category}.json`);
    if (!response.ok) {
      throw new Error(
        `Failed to load ${category} data (HTTP ${response.status})`
      );
    }
    const data = await response.json();
    if (data && data.items && Array.isArray(data.items)) {
      AppState.menuData[category] = data.items;
      return data.items.length;
    } else {
      console.warn(
        `Warning: ${category}.json doesn't contain an 'items' array`
      );
      AppState.menuData[category] = [];
      return 0;
    }
  } catch (error) {
    console.error(`Error loading ${category} data:`, error);
    AppState.menuData[category] = [];
    return 0;
  }
}

// Function to check if hero image exists and set background accordingly
async function setHeroBackground() {
  try {
    // Try to fetch the hero.jpg file
    const response = await fetch("assets/hero.jpg", { method: "HEAD" });

    if (response.ok) {
      // If the file exists, use it as background
      document.querySelector(".compact-banner").style.backgroundImage =
        "url('assets/hero.jpg')";
      document.querySelector(".compact-banner").style.backgroundSize = "cover";
      document.querySelector(".compact-banner").style.backgroundPosition =
        "center";

      // Add overlay for better text readability
      const overlay = document.createElement("div");
      overlay.className = "banner-overlay";
      document.querySelector(".compact-banner").appendChild(overlay);

      // Ensure the text is visible over the image
      document.querySelector(".banner-content").style.position = "relative";
      document.querySelector(".banner-content").style.zIndex = "5";
      document.querySelector(".compact-banner").style.color = "white";
    }
  } catch (error) {
    console.log("Hero image not found, using default background");
    // Default background is already set in CSS, no need to do anything
  }
}

// ======== UI RENDERING ========
function generateCategoryButtons() {
  DOM.menuCategories.innerHTML = "";

  AppState.categoriesOrder.forEach((category) => {
    const button = document.createElement("button");
    button.className = "category-btn";
    button.dataset.category = category;
    button.textContent =
      AppState.translations[AppState.language].categories[category];

    button.addEventListener("click", () => {
      showCategory(category);
    });

    DOM.menuCategories.appendChild(button);
  });
}

function showCategory(category) {
  // Update active button
  const buttons = document.querySelectorAll(".category-btn");
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.category === category);
  });

  // Update state
  AppState.currentCategory = category;
  AppState.currentSubcategory = null; // Reset subcategory

  // Update category title
  DOM.currentCategoryTitle.innerHTML = `<h2>${
    AppState.translations[AppState.language].categories[category]
  }</h2>`;

  // Generate subcategory tabs
  updateSubcategoryTabs(category);

  // Render items for this category
  renderMenuItems(category, null);

  // Update scroll indicator position
  updateScrollIndicatorPosition(category);

  // Hide empty message
  DOM.menuEmpty.style.display = "none";
}

function updateSubcategoryTabs(category) {
  DOM.subcategoryTabs.innerHTML = "";

  if (!AppState.subcategories[category]) {
    DOM.subcategoryTabs.style.display = "none";
    return;
  }

  DOM.subcategoryTabs.style.display = "flex";

  // Add "All" tab
  const allTab = document.createElement("button");
  allTab.className = `subcategory-tab ${
    AppState.currentSubcategory === null ? "active" : ""
  }`;
  allTab.textContent = AppState.translations[AppState.language].subcategoryAll;
  allTab.addEventListener("click", () => {
    selectSubcategory(null);
  });
  DOM.subcategoryTabs.appendChild(allTab);

  // Add subcategory tabs
  AppState.subcategories[category].forEach((subcategory) => {
    const tab = document.createElement("button");
    tab.className = `subcategory-tab ${
      AppState.currentSubcategory === subcategory ? "active" : ""
    }`;
    tab.dataset.subcategory = subcategory;
    tab.textContent =
      AppState.translations[AppState.language].subcategories[category][
        subcategory
      ];

    tab.addEventListener("click", () => {
      selectSubcategory(subcategory);
    });

    DOM.subcategoryTabs.appendChild(tab);
  });
}

function selectSubcategory(subcategory) {
  AppState.currentSubcategory = subcategory;

  // Update active subcategory tab
  const tabs = document.querySelectorAll(".subcategory-tab");
  tabs.forEach((tab) => {
    if (!tab.dataset.subcategory) {
      // This is the "All" tab
      tab.classList.toggle("active", subcategory === null);
    } else {
      tab.classList.toggle("active", tab.dataset.subcategory === subcategory);
    }
  });

  // Render items for the selected subcategory
  renderMenuItems(AppState.currentCategory, subcategory);
}

function renderMenuItems(category, subcategory) {
  const items = AppState.menuData[category] || [];
  const lang = AppState.language;

  // Clear previous items with a fade-out effect
  DOM.menuItems.style.opacity = "0";

  setTimeout(() => {
    DOM.menuItems.innerHTML = "";

    if (items.length === 0) {
      DOM.menuEmpty.style.display = "flex";
      DOM.menuItems.style.opacity = "1";
      return;
    }

    // Filter by subcategory if specified
    let filteredItems = items;
    if (subcategory) {
      filteredItems = items.filter((item) => item.subcategory === subcategory);
    }

    // Sort items by availability
    const sortedItems = [...filteredItems].sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });

    if (sortedItems.length === 0) {
      DOM.menuEmpty.style.display = "flex";
      DOM.menuItems.style.opacity = "1";
      return;
    }

    DOM.menuEmpty.style.display = "none";

    // Group by subcategory for better organization (when showing all)
    if (!subcategory && AppState.subcategories[category]) {
      // Get all subcategories present in the data
      const presentSubcategories = [
        ...new Set(sortedItems.map((item) => item.subcategory)),
      ];

      // Sort subcategories according to our predefined order
      const orderedSubcategories = AppState.subcategories[category].filter(
        (sub) => presentSubcategories.includes(sub)
      );

      // Render items grouped by subcategory
      orderedSubcategories.forEach((subcategory) => {
        const subcategoryItems = sortedItems.filter(
          (item) => item.subcategory === subcategory
        );

        if (subcategoryItems.length > 0) {
          // Add subcategory heading
          const headingText =
            AppState.translations[lang].subcategories[category][subcategory];
          const heading = document.createElement("div");
          heading.className = "subcategory-heading";
          heading.textContent = headingText;
          heading.style.gridColumn = "1 / -1"; // Span all columns
          DOM.menuItems.appendChild(heading);

          // Add items for this subcategory
          createMenuItems(subcategoryItems, lang);
        }
      });
    } else {
      // Simple rendering without subcategory grouping
      createMenuItems(sortedItems, lang);
    }

    // Fade in the new items
    DOM.menuItems.style.opacity = "1";

    // Update layout
    adjustUIForScreenSize();

    // Setup intersection observer for animations
    setupIntersectionObserver();
  }, 200); // Short delay for the fade-out effect
}

function createMenuItems(items, lang) {
  items.forEach((item) => {
    if (!item.available) return;

    const itemElement = document.createElement("div");
    itemElement.className = "menu-item animate-on-scroll";

    const name = item.name[lang] || item.name.en || "";
    const description = item.description
      ? item.description[lang] || item.description.en || ""
      : "";

    itemElement.innerHTML = `
      <div class="menu-item-content">
        <div class="menu-item-name">${name}</div>
        <div class="menu-item-description">${description}</div>
      </div>
      <div class="menu-item-price">${
        item.price ? item.price.toFixed(2) + "€" : ""
      }</div>
    `;

    DOM.menuItems.appendChild(itemElement);
  });
}

// ======== SCROLL INDICATOR FOR MOBILE ========
function initScrollIndicator() {
  if (!DOM.scrollIndicator || window.innerWidth >= 768) {
    if (DOM.scrollIndicator) DOM.scrollIndicator.style.display = "none";
    return;
  }

  DOM.scrollIndicator.style.display = "flex";
  const categories = AppState.categoriesOrder;

  // Create dots
  DOM.scrollIndicator.innerHTML = "";
  for (let i = 0; i < categories.length; i++) {
    const dot = document.createElement("div");
    dot.className = i === 0 ? "scroll-dot active" : "scroll-dot";
    DOM.scrollIndicator.appendChild(dot);
  }

  // Add scroll listener to update active dot
  DOM.menuCategories.addEventListener("scroll", updateScrollIndicator);
}

function updateScrollIndicator() {
  if (window.innerWidth >= 768) return;

  const scrollPos = DOM.menuCategories.scrollLeft;
  const totalWidth =
    DOM.menuCategories.scrollWidth - DOM.menuCategories.clientWidth;

  // Avoid division by zero
  if (totalWidth === 0) return;

  const scrollPercent = scrollPos / totalWidth;
  const categories = AppState.categoriesOrder;
  const activeDotIndex = Math.round(scrollPercent * (categories.length - 1));

  // Update active dot
  const dots = DOM.scrollIndicator.querySelectorAll(".scroll-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === activeDotIndex);
  });
}

function updateScrollIndicatorPosition(category) {
  if (window.innerWidth >= 768) return;

  // Find the index of the category
  const index = AppState.categoriesOrder.indexOf(category);
  if (index === -1) return;

  // Update active dot
  const dots = DOM.scrollIndicator.querySelectorAll(".scroll-dot");
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });

  // Scroll the category into view
  const buttons = DOM.menuCategories.querySelectorAll(".category-btn");
  if (buttons[index]) {
    buttons[index].scrollIntoView({ behavior: "smooth", inline: "center" });
  }
}

// ======== PERFORMANCE OPTIMIZATIONS ========
function lazyLoadCategories() {
  // Only load the first (active) category initially
  if (AppState.categoriesOrder.length > 0) {
    const firstCategory = AppState.categoriesOrder[0];
    showCategory(firstCategory);

    // Preload next category data after a short delay
    setTimeout(() => {
      const secondCategory = AppState.categoriesOrder[1];
      if (secondCategory && AppState.menuData[secondCategory]) {
        // Just access the data to ensure it's loaded, but don't render
        const items = AppState.menuData[secondCategory];
        console.log(`Preloaded ${items.length} items for ${secondCategory}`);
      }
    }, 1000);
  }
}

function setupIntersectionObserver() {
  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  // Observe menu items for animation
  document.querySelectorAll(".animate-on-scroll").forEach((item) => {
    observer.observe(item);
  });
}

// ======== RESPONSIVE ADJUSTMENTS ========
function adjustUIForScreenSize() {
  const isMobile = window.innerWidth < 576;
  const isTablet = window.innerWidth >= 576 && window.innerWidth < 992;

  // Adjust menu items layout
  if (isMobile) {
    DOM.menuItems.style.gridTemplateColumns = "1fr";
  } else if (isTablet) {
    DOM.menuItems.style.gridTemplateColumns = "repeat(2, 1fr)";
  } else {
    DOM.menuItems.style.gridTemplateColumns = "repeat(3, 1fr)";
  }
}

// ======== UTILITY FUNCTIONS ========
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

// ======== INITIALIZE THE APP ========
document.addEventListener("DOMContentLoaded", initializeApp);

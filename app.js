/**
 * Bonobo Bar & More Digital Menu
 * Advanced implementation with time-based category ordering,
 * smooth transitions, and optimized performance
 */

// ======== STATE MANAGEMENT ========
const AppState = {
  language: "en",
  currentCategory: null,
  menuData: {},
  categoriesOrder: [],
  translations: {
    en: {
      welcome: "Welcome to Bonobo Bar & More",
      subheading: "Experience the extraordinary in Rethymno",
      emptyMessage: "Select a category to view items",
      hours: "Hours",
      hoursContent: "Monday - Sunday: 8:00 - 02:00",
      location: "Rethymno, Crete, Greece",
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
  currentCategoryTitle: document.getElementById("current-category-title"),
  menuItems: document.getElementById("menu-items"),
  menuEmpty: document.getElementById("menu-empty"),
  emptyMessage: document.getElementById("empty-message"),
  hoursHeading: document.getElementById("hours-heading"),
  hoursContent: document.getElementById("hours-content"),
  locationText: document.getElementById("location-text"),
};

// ======== INITIALIZATION ========
async function initializeApp() {
  try {
    // Setup event listeners
    setupEventListeners();

    // Set theme based on user preference
    initializeTheme();

    // Determine time-based category order
    determineTimeBasedOrder();

    // Load all menu data
    await loadAllMenuData();

    // Initialize UI with current language
    updateUITexts();

    // Generate category buttons
    generateCategoryButtons();

    // Show default category (first in the time-based order)
    if (AppState.categoriesOrder.length > 0) {
      showCategory(AppState.categoriesOrder[0]);
    }

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
    renderMenuItems(AppState.currentCategory);
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

// ======== DATA LOADING ========
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
    await Promise.all(promises);
  } catch (error) {
    console.error("Error loading menu data:", error);
    // Provide fallback data if loading fails
    provideFallbackData();
  }
}

async function loadCategoryData(category) {
  try {
    const response = await fetch(`data/${category}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load ${category} data`);
    }
    const data = await response.json();
    AppState.menuData[category] = data.items || [];
  } catch (error) {
    console.error(`Error loading ${category} data:`, error);
    // Set empty array for failed category
    AppState.menuData[category] = [];
  }
}

function provideFallbackData() {
  // Coffee data from provided example
  AppState.menuData.coffee = [
    {
      id: "esp001",
      name: {
        en: "Espresso",
        el: "Εσπρέσσο",
      },
      description: {
        en: "Short black coffee",
        el: "Δυνατός μαύρος καφές",
      },
      price: 2.5,
      categories: ["hot", "signature"],
      available: true,
    },
    {
      id: "latte001",
      name: {
        en: "Latte",
        el: "Λάτε",
      },
      description: {
        en: "Espresso with steamed milk",
        el: "Εσπρέσσο με ατμισμένο γάλα",
      },
      price: 3.5,
      categories: ["hot", "signature"],
      available: true,
    },
    {
      id: "cappuccino001",
      name: {
        en: "Cappuccino",
        el: "Καπουτσίνο",
      },
      description: {
        en: "Espresso with steamed milk and foam",
        el: "Εσπρέσσο με ατμισμένο γάλα και αφρό",
      },
      price: 3.5,
      categories: ["hot", "signature"],
      available: true,
    },
    {
      id: "americano001",
      name: {
        en: "Americano",
        el: "Αμερικάνος",
      },
      description: {
        en: "Espresso with hot water",
        el: "Εσπρέσσο με ζεστό νερό",
      },
      price: 2.5,
      categories: ["hot", "signature"],
      available: true,
    },
  ];

  // Sample data for other categories
  const sampleData = {
    food: [
      {
        id: "food001",
        name: { en: "Greek Salad", el: "Ελληνική Σαλάτα" },
        description: {
          en: "Fresh tomatoes, cucumber, onion, olives and feta cheese",
          el: "Φρέσκες ντομάτες, αγγούρι, κρεμμύδι, ελιές και φέτα",
        },
        price: 7.5,
        categories: ["salads", "traditional"],
        available: true,
      },
      {
        id: "food002",
        name: { en: "Club Sandwich", el: "Κλαμπ Σάντουιτς" },
        description: {
          en: "Triple-decker sandwich with chicken, bacon, egg, tomato and lettuce",
          el: "Τριπλό σάντουιτς με κοτόπουλο, μπέικον, αυγό, ντομάτα και μαρούλι",
        },
        price: 8.5,
        categories: ["sandwiches", "signature"],
        available: true,
      },
    ],
    spirits: [
      {
        id: "spirit001",
        name: { en: "Premium Vodka", el: "Βότκα Premium" },
        description: {
          en: "Smooth premium vodka, served with ice",
          el: "Απαλή βότκα premium, σερβίρεται με πάγο",
        },
        price: 8.0,
        categories: ["vodka", "premium"],
        available: true,
      },
      {
        id: "spirit002",
        name: { en: "Single Malt Whisky", el: "Ουίσκι Single Malt" },
        description: {
          en: "12 year aged single malt whisky",
          el: "Ουίσκι single malt 12 ετών",
        },
        price: 10.0,
        categories: ["whisky", "premium"],
        available: true,
      },
    ],
    beer: [
      {
        id: "beer001",
        name: { en: "Local Craft Beer", el: "Τοπική Μπύρα" },
        description: {
          en: "Refreshing local craft beer",
          el: "Δροσιστική τοπική μπύρα",
        },
        price: 5.0,
        categories: ["craft", "local"],
        available: true,
      },
      {
        id: "beer002",
        name: { en: "Premium Lager", el: "Premium Lager" },
        description: {
          en: "Imported premium lager beer",
          el: "Εισαγόμενη premium lager μπύρα",
        },
        price: 6.0,
        categories: ["lager", "imported"],
        available: true,
      },
    ],
    wine: [
      {
        id: "wine001",
        name: { en: "Cretan White Wine", el: "Κρητικό Λευκό Κρασί" },
        description: {
          en: "Crisp and dry white wine from Crete",
          el: "Τραγανό και ξηρό λευκό κρασί από την Κρήτη",
        },
        price: 6.0,
        categories: ["white", "local"],
        available: true,
      },
      {
        id: "wine002",
        name: { en: "Red Wine", el: "Κόκκινο Κρασί" },
        description: {
          en: "Medium-bodied red wine with notes of berries",
          el: "Κόκκινο κρασί μέτριου σώματος με νότες από μούρα",
        },
        price: 6.5,
        categories: ["red", "signature"],
        available: true,
      },
    ],
    cocktails: [
      {
        id: "cocktail001",
        name: { en: "Bonobo Special", el: "Bonobo Special" },
        description: {
          en: "Our signature cocktail with rum, exotic fruits and spices",
          el: "Το σήμα κατατεθέν μας με ρούμι, εξωτικά φρούτα και μπαχαρικά",
        },
        price: 9.0,
        categories: ["signature", "rum"],
        available: true,
      },
      {
        id: "cocktail002",
        name: { en: "Mediterranean Sunset", el: "Μεσογειακό Ηλιοβασίλεμα" },
        description: {
          en: "Vodka, orange liqueur, cranberry and passion fruit",
          el: "Βότκα, λικέρ πορτοκάλι, κράνμπερι και φρούτα του πάθους",
        },
        price: 10.0,
        categories: ["signature", "vodka"],
        available: true,
      },
    ],
  };

  // Merge sample data into app state
  Object.keys(sampleData).forEach((category) => {
    if (
      !AppState.menuData[category] ||
      AppState.menuData[category].length === 0
    ) {
      AppState.menuData[category] = sampleData[category];
    }
  });
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

  // Update category title
  DOM.currentCategoryTitle.innerHTML = `<h2>${
    AppState.translations[AppState.language].categories[category]
  }</h2>`;

  // Render items for this category
  renderMenuItems(category);

  // Hide empty message
  DOM.menuEmpty.style.display = "none";
}

function renderMenuItems(category) {
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

    // Sort items by availability
    const sortedItems = [...items].sort((a, b) => {
      if (a.available === b.available) return 0;
      return a.available ? -1 : 1;
    });

    // Create elements for each item
    sortedItems.forEach((item, index) => {
      if (!item.available) return;

      const itemElement = document.createElement("div");
      itemElement.className = "menu-item";
      itemElement.style.animationDelay = `${index * 0.05}s`;

      const name = item.name[lang] || item.name.en;
      const description = item.description[lang] || item.description.en;

      itemElement.innerHTML = `
              <div class="menu-item-content">
                  <div class="menu-item-name">${name}</div>
                  <div class="menu-item-description">${description}</div>
              </div>
              <div class="menu-item-price">${item.price.toFixed(2)}€</div>
          `;

      DOM.menuItems.appendChild(itemElement);
    });

    // Fade in the new items
    DOM.menuItems.style.opacity = "1";

    // Update layout
    adjustUIForScreenSize();
  }, 200); // Short delay for the fade-out effect
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

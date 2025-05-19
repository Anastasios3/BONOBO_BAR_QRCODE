/**
 * Application configuration
 */

export const CONFIG = {
  STORAGE_KEYS: {
    LANGUAGE: "bonobo-language",
    THEME: "bonobo-theme",
  },
  LANGUAGES: ["en", "el"],
  THEMES: ["light", "dark"],
  SUBCATEGORIES: {
    coffee: ["coffee", "tea", "chocolate", "soft"],
    food: ["snacks", "main", "desserts"],
    spirits: ["whisky", "vodka", "rum", "tequila", "others", "liqueur"],
    beer: ["draft", "bottles", "craft"],
    wine: ["white", "rose", "red", "sparkling"],
    cocktails: ["classic", "signature", "mocktails"],
  },
  CATEGORIES: ["coffee", "food", "spirits", "beer", "wine", "cocktails"],
  TIME_PERIODS: {
    MORNING: {
      START: 6,
      END: 11,
      ORDER: ["coffee", "food", "wine", "beer", "cocktails", "spirits"],
    },
    LUNCH: {
      START: 11,
      END: 16,
      ORDER: ["food", "coffee", "wine", "beer", "spirits", "cocktails"],
    },
    AFTERNOON: {
      START: 16,
      END: 20,
      ORDER: ["cocktails", "coffee", "food", "beer", "wine", "spirits"],
    },
    NIGHT: {
      START: 20,
      END: 6,
      ORDER: ["spirits", "cocktails", "beer", "wine", "food", "coffee"],
    },
  },
};

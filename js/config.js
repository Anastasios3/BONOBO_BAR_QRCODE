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
      END: 12,
      ORDER: ["coffee", "food", "wine", "beer", "cocktails", "spirits"],
    },
    LUNCH: {
      START: 12,
      END: 17,
      ORDER: ["food", "coffee", "wine", "beer", "spirits", "cocktails"],
    },
    AFTERNOON: {
      START: 17,
      END: 21,
      ORDER: ["cocktails", "coffee", "food", "beer", "wine", "spirits"],
    },
    NIGHT: {
      START: 21,
      END: 6,
      ORDER: ["cocktails", "spirits", "beer", "wine", "food", "coffee"],
    },
  },
};

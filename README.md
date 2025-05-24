# Bonobo Bar & More - Digital QR Menu System

A sophisticated, responsive digital menu application designed for Bonobo Bar & More in Rethymno, Crete. This contactless menu system provides an exceptional user experience across all devices, featuring intelligent time-based content management, multilingual support, and advanced navigation capabilities.

## 🌟 Overview

This digital menu represents a complete reimagining of restaurant menu presentation, moving beyond static QR code menus to deliver a dynamic, intelligent, and highly interactive experience. Built with modern web technologies and user-centric design principles, it adapts to customer needs throughout the day while maintaining premium aesthetics and performance.

## 🚀 Key Features & Innovations

### 🕒 **Intelligent Time-Based Menu Management**

One of the most innovative aspects of this system is its intelligent time-based content filtering:

- **Dynamic Food Availability**: Different food categories become available/unavailable based on the current time
  - **03:00 - 17:00**: Full menu including breakfast items
  - **17:01 - 21:00**: All items except breakfast
  - **21:01 - 02:59**: Limited night menu prioritizing finger food and quick items
- **Automatic Category Reordering**: Menu categories reorder themselves based on time of day to prioritize relevant items
- **Real-time Updates**: Menu automatically refreshes when time periods change

### 🌐 **Comprehensive Multilingual Support**

- **Seamless Language Switching**: English ⇄ Greek with instant UI updates
- **Preserved State**: Language preference persists across sessions
- **Complete Translation Coverage**: All UI elements, categories, and system messages
- **Cultural Localization**: Proper formatting and cultural considerations for Greek users

### 📱 **Advanced Touch & Swipe Navigation**

Revolutionary gesture-based navigation system:

- **Global Swipe Detection**: Swipe anywhere on the screen to navigate between categories
- **Visual Feedback System**: Real-time indicators show swipe direction and progress
- **Smart Conflict Resolution**: Distinguishes between swipes and scrolls intelligently
- **Haptic Feedback**: Tactile responses on supported devices
- **Edge Case Handling**: Smooth animations when reaching first/last categories

### 🎨 **Premium UI/UX Design**

- **Dual Theme System**: Elegant light and dark modes with smooth transitions
- **Responsive Grid Layout**: Optimized layouts for all screen sizes
- **Micro-animations**: Subtle animations enhance user engagement
- **Accessibility First**: WCAG-compliant design with keyboard navigation
- **Performance Optimized**: Lazy loading and efficient rendering

### 💰 **Flexible Pricing Architecture**

Sophisticated pricing system handling multiple price structures:

- **Single Pricing**: Standard items with one price
- **Dual Pricing**: Wine (glass/bottle), Coffee (single/double shot)
- **Dynamic Labels**: Context-aware price labeling
- **Currency Formatting**: Proper Euro formatting with localization

### 🔧 **Technical Excellence**

#### **Modular Architecture**

```
js/
├── controllers/          # Business logic controllers
│   ├── AppController.js     # Main application orchestration
│   ├── UIController.js      # DOM manipulation and rendering
│   ├── DataController.js    # Data fetching and processing
│   ├── EventController.js   # Event handling and interactions
│   └── ModalController.js   # Modal system management
├── models/
│   └── AppState.js          # Centralized state management
├── data/
│   └── translations.js      # Multilingual content
├── utils/
│   └── helpers.js           # Utility functions
├── config.js               # Application configuration
└── main.js                 # Application entry point
```

#### **State Management**

- **Centralized State**: Single source of truth for application state
- **Reactive Updates**: State changes automatically trigger UI updates
- **Persistent Storage**: User preferences saved in localStorage
- **Time-Aware Logic**: State adapts to current time and business hours

#### **Data Architecture**

```
data/
├── beer.json      # Beer listings with categories
├── cocktails.json # Signature and classic cocktails
├── coffee.json    # Coffee, tea, and beverages
├── food.json      # Complete food menu with time restrictions
├── spirits.json   # Extensive spirits collection
└── wine.json      # Wine selection with dual pricing
```

## 🏗️ **What Makes This Different**

### **1. Business Intelligence Integration**

Unlike traditional static menus, this system understands the business:

- **Time-Sensitive Operations**: Automatically adjusts to kitchen hours and service periods
- **Category Prioritization**: Suggests relevant items based on time (coffee in morning, cocktails at night)
- **Operational Efficiency**: Reduces staff workload by preventing orders for unavailable items

### **2. Advanced User Experience**

- **Gesture-First Design**: Natural touch interactions feel intuitive
- **Progressive Disclosure**: Information revealed progressively to avoid overwhelm
- **Contextual Assistance**: Smart hints and guidance for first-time users
- **Performance Optimization**: Sub-second load times and smooth interactions

### **3. Technical Sophistication**

- **Modern ES6+ JavaScript**: Clean, maintainable code with latest standards
- **Component-Based Architecture**: Reusable, testable components
- **Event-Driven Design**: Loose coupling between components
- **Error Handling**: Comprehensive error management and user feedback

### **4. Accessibility & Inclusion**

- **Universal Design**: Works for users with diverse abilities
- **Keyboard Navigation**: Full functionality without touch/mouse
- **Screen Reader Support**: Semantic HTML and ARIA labels
- **High Contrast Support**: Readable in all lighting conditions

## 📱 **Device Compatibility**

### **Mobile Devices**

- **iOS Safari**: Optimized for iPhone/iPad with touch gestures
- **Android Chrome**: Native-like experience with PWA capabilities
- **Responsive Design**: Adapts to all screen sizes from 320px to 1440px+

### **Desktop/Tablet**

- **Mouse Navigation**: Click-based navigation with hover effects
- **Keyboard Support**: Full keyboard accessibility
- **Scroll Integration**: Smooth horizontal scrolling for categories

## 🎯 **User Journey Optimization**

### **First-Time Visitors**

1. **Immediate Loading**: Fast initial render with loading states
2. **Intuitive Onboarding**: Subtle hints for navigation discovery
3. **Language Detection**: Smart language suggestions based on device locale
4. **Category Guidance**: Time-appropriate category recommendations

### **Returning Customers**

1. **Preference Retention**: Remembered language and theme choices
2. **Familiar Interface**: Consistent experience across visits
3. **Quick Access**: Optimized navigation for frequent users

## 🔧 **Installation & Setup**

### **Prerequisites**

- Modern web server (Apache, Nginx, or development server)
- No database required - fully client-side application
- HTTPS recommended for PWA features

## ⚙️ **Configuration**

### **Time-Based Restrictions**

Modify `js/config.js` to adjust time periods:

```javascript
FOOD_TIME_RESTRICTIONS: {
  FULL_MENU: { START: 3, END: 17 },      // 03:00 - 17:00
  EVENING_MENU: { START: 17.01, END: 21 }, // 17:01 - 21:00
  NIGHT_MENU: { START: 21.01, END: 3 }     // 21:01 - 02:59
}
```

### **Category Ordering**

Adjust category priority by time period:

```javascript
TIME_PERIODS: {
  MORNING: { ORDER: ["coffee", "food", "wine", "beer", "cocktails", "spirits"] },
  AFTERNOON: { ORDER: ["cocktails", "coffee", "food", "beer", "wine", "spirits"] }
}
```

### **Menu Data Updates**

Update menu items by editing JSON files in the `data/` directory:

- Each file represents a category
- Items include multilingual names and descriptions
- Pricing supports single or dual pricing structures
- Availability can be toggled per item

## 🎨 **Customization**

### **Themes & Styling**

- **CSS Variables**: Comprehensive design system with CSS custom properties
- **Component-Based Styles**: Modular CSS architecture
- **Theme System**: Easy color scheme modifications
- **Responsive Breakpoints**: Customizable device targeting

### **Adding New Languages**

1. Extend `TRANSLATIONS` object in `js/data/translations.js`
2. Add language option to `CONFIG.LANGUAGES`
3. Update menu data JSON files with new language keys

### **Custom Categories**

1. Add category to `CONFIG.CATEGORIES`
2. Define subcategories in `CONFIG.SUBCATEGORIES`
3. Create corresponding JSON data file
4. Add translations for new category

## 📊 **Performance Features**

### **Optimization Strategies**

- **Lazy Loading**: Content loaded on-demand
- **Efficient Rendering**: DOM updates batched for performance
- **Memory Management**: Proper cleanup and garbage collection
- **Network Optimization**: Minimal HTTP requests with efficient caching

### **Mobile Performance**

- **Touch Optimization**: Responsive touch targets and gestures
- **Battery Efficiency**: Optimized animations and event handling
- **Smooth Scrolling**: Hardware-accelerated smooth scrolling
- **Network Resilience**: Graceful offline handling

## 🔒 **Security & Privacy**

### **Data Protection**

- **No Server Dependencies**: All data processing client-side
- **Local Storage Only**: User preferences stored locally
- **No Tracking**: Privacy-focused design with no analytics
- **HTTPS Ready**: Secure transmission support

### **Content Security**

- **Input Validation**: Robust data validation throughout
- **XSS Prevention**: Secure DOM manipulation practices
- **Error Boundaries**: Comprehensive error handling

## 🛠️ **Development Guidelines**

### **Code Standards**

- **ES6+ Modern JavaScript**: Latest language features
- **Modular Design**: Clear separation of concerns
- **Documentation**: Comprehensive inline documentation
- **Error Handling**: Graceful degradation and user feedback

### **Testing Strategy**

- **Cross-Browser Testing**: Verified across major browsers
- **Device Testing**: Real device testing on various screen sizes
- **Performance Testing**: Load time and interaction response optimization
- **Accessibility Testing**: WCAG 2.1 compliance verification

## 📈 **Future Enhancements**

### **Planned Features**

- **PWA Capabilities**: Offline functionality and app-like experience
- **Voice Navigation**: Voice commands for accessibility
- **Order Integration**: Potential POS system integration
- **Analytics Dashboard**: Usage insights for business optimization

### **Technical Roadmap**

- **Service Worker**: Enhanced caching and offline support
- **Web Components**: Further modularization
- **Performance Monitoring**: Real-time performance analytics
- **A/B Testing Framework**: User experience optimization

## 🤝 **Contributing**

### **Development Setup**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Follow existing code patterns and documentation standards
4. Test across multiple devices and browsers
5. Submit pull request with detailed description

### **Reporting Issues**

- Use GitHub Issues for bug reports
- Include device/browser information
- Provide steps to reproduce
- Include screenshots if applicable

## 📞 **Support & Contact**

**Bonobo Bar & More**

- **Location**: 47 El. Venizelou Street, Old Town, Rethymno 74100, Crete, Greece

**Technical Development**

- **Developer**: Anastasios Tatarakis
- **Website**: [antatarakis.com](https://antatarakis.com/#contact)

## 📄 **License**

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details. This ensures the code remains open source while protecting the intellectual property and allowing for community contributions.

---

**Made with ❤️ in Rethymno, Crete** - Combining traditional Greek hospitality with cutting-edge technology to create exceptional dining experiences.

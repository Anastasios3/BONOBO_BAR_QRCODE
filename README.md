# Bonobo Bar & More - Digital Menu System

## Technical Overview

This repository contains a progressive web application that serves as a digital menu system for a hospitality establishment. The system implements automated content management, dynamic interface generation, and time-based menu filtering through a modular JavaScript architecture.

## Core Architecture

The application uses a controller-based MVC pattern with centralized state management. Five primary controllers coordinate all system operations through the AppController orchestrator.

**AppController** manages application lifecycle, coordinates inter-controller communication, handles error recovery, and provides external API access. It implements automatic initialization sequences that load data, configure UI elements, and establish event listeners in a predetermined order.

**DataController** handles asynchronous data loading from JSON files, processes menu items into normalized structures, and implements automatic retry mechanisms for failed requests. The controller transforms raw JSON data into standardized objects with consistent pricing structures across different menu categories.

**UIController** manages DOM manipulation through performance-optimized rendering. It uses document fragments for batch updates, implements debounced resize handlers, and generates interface elements dynamically based on application state. The controller maintains cached DOM element references to minimize expensive DOM queries.

**EventController** implements comprehensive event management including touch gesture recognition, keyboard navigation, and scroll handling. It processes swipe gestures with velocity calculations, manages category navigation through multiple input methods, and handles responsive layout adjustments automatically.

**ModalController** provides modal dialog functionality with automatic content population, accessibility compliance, and mobile-optimized interactions including swipe-to-dismiss gestures.

## Time-Based Automation Systems

### Automated Menu Filtering

The system implements time-sensitive content filtering that automatically adjusts available menu items based on current time. The automation operates through three distinct periods defined in the configuration:

**Full Menu Period (03:00-17:00)** enables all food subcategories without restrictions. The system maintains the complete menu structure during standard service hours.

**Evening Menu Period (17:01-21:00)** automatically filters out breakfast items while preserving all other categories. The transition occurs without user intervention or page reloads.

**Night Menu Period (21:01-02:59)** applies both filtering and reordering logic. The system removes breakfast items and automatically reorders remaining subcategories to prioritize sharing plates and finger foods at the top of the menu structure.

The time-based logic runs continuously through interval-based checking and visibility change event listeners. When time boundaries are crossed, the system automatically regenerates filter options and refreshes displayed content while preserving user navigation state.

### Dynamic Category Ordering

The application implements time-aware category prioritization that reorders main menu categories based on current time periods. Morning hours prioritize coffee and food categories, while evening and night periods move cocktails and spirits to prominent positions. This reordering affects both navigation tabs and initial category selection.

## Automated UI Generation

### Category Navigation System

The system automatically generates horizontal scrolling navigation tabs based on available menu data. It implements scroll indicators, automatic centering of active tabs, and navigation buttons that appear only when content exceeds viewport width. The navigation system includes first-time user guidance with overlay hints and maintains scroll position across category changes.

### Filter Generation

Filter options generate automatically for each category based on available subcategories in the current time period. The system examines loaded menu data, identifies which subcategories contain available items, and creates filter chips dynamically. For the food category, this process includes time-based filtering to exclude unavailable subcategories.

### Menu Item Rendering

Menu items render through an automated system that processes different pricing structures based on category type. Wine items automatically display glass/bottle pricing when both are available, coffee items show single/double shot options, and other categories display single pricing. The system handles description truncation, pricing formatting, and accessibility attributes automatically.

## State Management Automation

### Persistent State Handling

The AppState class automatically manages language preferences, theme selection, and navigation state through localStorage integration. State changes trigger automatic UI updates across all interface components. The system preserves user preferences across browser sessions and automatically applies saved settings on application initialization.

### Reactive UI Updates

State changes automatically propagate through the UI system. Language changes trigger immediate text updates across all interface elements, category selection updates navigation highlighting and content display, and filter changes refresh item listings while maintaining scroll position.

## Performance Optimizations

### Automated Resource Management

The system implements several performance automation patterns. DOM queries are cached at initialization to avoid repeated expensive lookups. UI updates use document fragments for batch DOM modifications. Event listeners use debouncing for scroll and resize events to prevent excessive callback execution.

### Gesture Recognition System

The EventController implements sophisticated touch gesture recognition that differentiates between navigation swipes and content scrolling. The system calculates swipe velocity, distance, and direction to determine intended actions. Vertical scrolling is preserved while horizontal swipes trigger category navigation. Visual feedback appears during gesture recognition to provide immediate user response.

## Internationalization Automation

### Dynamic Text Management

The translation system automatically updates all interface text when language settings change. Text retrieval uses a hierarchical key system that supports nested translations for categories and subcategories. Missing translations fall back to English automatically, and the system handles both simple string replacement and complex pluralization scenarios.

### Content Adaptation

Menu item names and descriptions automatically display in the selected language when multilingual data is available. The system maintains separate content for English and Greek, falling back to English when Greek translations are unavailable.

## Error Handling and Recovery

### Automated Error Management

The application implements comprehensive error handling that automatically logs detailed error information including stack traces, application state, and user environment data. Network failures trigger automatic retry attempts for data loading, and the system gracefully degrades functionality when resources are unavailable.

### State Recovery

When errors occur, the system automatically attempts to restore previous working state. Modal dialogs close automatically during error conditions, and the application can refresh its data and UI state without requiring page reloads.

This technical architecture provides a robust foundation for automated menu management with minimal manual intervention required for day-to-day operations.

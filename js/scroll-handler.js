/**
 * Premium Scrolling System for Bonobo Bar & More
 *
 * A professional-grade scrolling implementation featuring:
 * - Advanced physics-based scrolling with natural inertia
 * - High-performance touch handling and momentum scrolling
 * - Premium visual effects and responsive controls
 * - Intelligent scroll detection and adaptive behavior
 * - First-class accessibility support
 */

// Main initialization
document.addEventListener("DOMContentLoaded", () => {
  initPremiumScrolling();
});

/**
 * Initialize the premium scrolling experience
 */
function initPremiumScrolling() {
  const categoryNavigation = document.querySelector(".category-navigation");
  if (!categoryNavigation) return;

  // Create an instance of the ScrollManager
  const scrollManager = new ScrollManager(categoryNavigation);

  // Initialize the scroll manager
  scrollManager.initialize();

  // Store the scroll manager on the navigation element for potential external access
  categoryNavigation._scrollManager = scrollManager;

  // Log initialization success
  console.log("Premium scrolling system initialized");
}

/**
 * ScrollManager - Core class that manages all scrolling functionality
 */
class ScrollManager {
  /**
   * @param {HTMLElement} container - The scrollable container element
   */
  constructor(container) {
    // Core elements
    this.container = container;
    this.content = container.querySelector(".category-tabs");

    // Component references to be initialized
    this.touchHandler = null;
    this.controlsManager = null;
    this.snapManager = null;

    // State variables
    this.isScrollable = false;
    this.isFirstVisit = !localStorage.getItem("category_scroll_visited");
    this.lastScrollPosition = 0;
    this.scrollDirection = "none";
    this.isScrolling = false;
    this.scrollTimeout = null;

    // Bind methods to this instance
    this.handleScroll = this.handleScroll.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.checkScrollability = this.checkScrollability.bind(this);
    this.centerActiveTab = this.centerActiveTab.bind(this);
  }

  /**
   * Initialize the scroll manager and all its components
   */
  initialize() {
    // Create and initialize sub-components
    this.touchHandler = new TouchHandler(this);
    this.controlsManager = new ControlsManager(this);
    this.snapManager = new SnapManager(this);
    this.keyboardManager = new KeyboardManager(this);
    this.wheelHandler = new WheelHandler(this);

    // Initialize all components
    this.touchHandler.initialize();
    this.controlsManager.initialize();
    this.snapManager.initialize();
    this.keyboardManager.initialize();
    this.wheelHandler.initialize();

    // Set up event listeners
    this.setupEventListeners();

    // Perform initial checks and updates
    this.checkScrollability();
    this.centerActiveTab();

    // Show first-time user guidance if needed
    if (this.isFirstVisit) {
      this.showFirstTimeGuidance();
    }
  }

  /**
   * Set up event listeners for the scroll manager
   */
  setupEventListeners() {
    // Scroll event
    this.container.addEventListener("scroll", this.handleScroll, {
      passive: true,
    });

    // Resize event
    window.addEventListener("resize", debounce(this.handleResize, 150));

    // Mutation observer to detect content changes
    this.setupMutationObserver();

    // Custom events
    this.container.addEventListener("tabActivated", this.centerActiveTab);
  }

  /**
   * Set up mutation observer to detect content changes
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      // Check if these mutations are relevant (e.g., tabs added or removed)
      const shouldUpdate = mutations.some((mutation) => {
        return (
          mutation.type === "childList" ||
          (mutation.type === "attributes" &&
            mutation.attributeName === "class" &&
            mutation.target.classList.contains("category-tab"))
        );
      });

      if (shouldUpdate) {
        this.checkScrollability();
        this.centerActiveTab();
      }
    });

    // Observe the tabs container
    if (this.content) {
      observer.observe(this.content, {
        childList: true,
        attributes: true,
        subtree: true,
      });
    }
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    // Update scroll position tracking
    const currentPosition = this.container.scrollLeft;

    // Determine scroll direction
    if (currentPosition > this.lastScrollPosition) {
      this.scrollDirection = "right";
    } else if (currentPosition < this.lastScrollPosition) {
      this.scrollDirection = "left";
    }

    this.lastScrollPosition = currentPosition;

    // Handle active scrolling state
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.container.classList.add("is-scrolling");
    }

    // Clear existing timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Set timeout to detect when scrolling stops
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.container.classList.remove("is-scrolling");
      this.scrollDirection = "none";

      // Snap to nearest tab when scrolling stops naturally
      if (!this.touchHandler.isActive && !this.wheelHandler.isActive) {
        this.snapManager.snapToNearestTab();
      }
    }, 150);

    // Update controls visibility
    this.controlsManager.updateControlsVisibility();
  }

  /**
   * Handle window resize events
   */
  handleResize() {
    this.checkScrollability();
    this.centerActiveTab();
    this.controlsManager.updateControlsVisibility();
  }

  /**
   * Check if the container is scrollable and update state
   */
  checkScrollability() {
    const wasScrollable = this.isScrollable;

    // A container is scrollable if its scroll width is greater than its client width
    this.isScrollable =
      this.container.scrollWidth > this.container.clientWidth + 10; // Add a small buffer

    // Update container class
    this.container.classList.toggle("scrollable", this.isScrollable);

    // If scrollability changed, update UI
    if (wasScrollable !== this.isScrollable) {
      this.controlsManager.updateControlsVisibility();

      // If it became scrollable and this is first visit, show scroll hint
      if (this.isScrollable && this.isFirstVisit) {
        this.container.classList.add("show-hint");

        setTimeout(() => {
          this.container.classList.remove("show-hint");
        }, 3000);
      }
    }

    return this.isScrollable;
  }

  /**
   * Center the active tab in the container
   */
  centerActiveTab() {
    const activeTab = this.container.querySelector(".category-tab.active");
    if (!activeTab) return;

    // Calculate the position to center the tab
    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    const tabCenter = activeTab.offsetLeft + tabRect.width / 2;
    const containerCenter = containerRect.width / 2;

    // Calculate target scroll position to center the tab
    const targetScrollLeft = tabCenter - containerCenter;

    // Smooth scroll to center the tab
    this.scrollToPosition(targetScrollLeft);
  }

  /**
   * Scroll to a specific position with smooth animation
   * @param {number} position - Target scroll position
   * @param {number} duration - Animation duration in ms (default: 300)
   */
  scrollToPosition(position, duration = 300) {
    // Make sure we're working with a number
    position = Math.max(
      0,
      Math.min(
        position,
        this.container.scrollWidth - this.container.clientWidth
      )
    );

    // Store starting position and time
    const startPosition = this.container.scrollLeft;
    const startTime = performance.now();

    // Don't animate if the positions are very close
    if (Math.abs(startPosition - position) < 5) {
      this.container.scrollLeft = position;
      return;
    }

    // Set smooth scrolling behavior
    this.container.style.scrollBehavior = "smooth";

    // Scroll with animation
    const animateScroll = (currentTime) => {
      const elapsedTime = currentTime - startTime;

      if (elapsedTime >= duration) {
        // Animation complete
        this.container.scrollLeft = position;

        // Update controls after scrolling is complete
        this.controlsManager.updateControlsVisibility();
        return;
      }

      // Calculate position with easing
      const progress = elapsedTime / duration;
      const easeProgress = easeOutCubic(progress);
      const currentPosition =
        startPosition + (position - startPosition) * easeProgress;

      // Apply scroll position
      this.container.scrollLeft = currentPosition;

      // Continue animation
      requestAnimationFrame(animateScroll);
    };

    // Start animation
    requestAnimationFrame(animateScroll);
  }

  /**
   * Scroll by a relative amount with animation
   * @param {number} amount - Amount to scroll by (positive or negative)
   */
  scrollByAmount(amount) {
    const targetPosition = this.container.scrollLeft + amount;
    this.scrollToPosition(targetPosition);
  }

  /**
   * Show first-time user guidance
   */
  showFirstTimeGuidance() {
    // Create scroll notification if it doesn't exist
    if (!this.container.querySelector(".scroll-notification")) {
      const notification = document.createElement("div");
      notification.className = "scroll-notification";

      const content = document.createElement("div");
      content.className = "notification-content";

      const icon = document.createElement("div");
      icon.className = "notification-icon";
      icon.innerHTML = '<i class="fas fa-exchange-alt"></i>';

      const text = document.createElement("div");
      text.className = "notification-text";
      text.textContent = "Swipe to browse categories";

      content.appendChild(icon);
      content.appendChild(text);
      notification.appendChild(content);

      this.container.appendChild(notification);

      // Show notification after a short delay
      setTimeout(() => {
        notification.classList.add("visible");

        // Remove notification after animation
        setTimeout(() => {
          notification.classList.remove("visible");

          // Remove after fade out
          setTimeout(() => {
            notification.remove();
          }, 1000);

          // Mark as visited
          localStorage.setItem("category_scroll_visited", "true");
          this.isFirstVisit = false;
        }, 4000);
      }, 1000);
    }
  }
}

/**
 * TouchHandler - Manages touch-based scrolling with physics
 */
class TouchHandler {
  /**
   * @param {ScrollManager} scrollManager - Reference to the scroll manager
   */
  constructor(scrollManager) {
    this.scrollManager = scrollManager;
    this.container = scrollManager.container;

    // Touch state
    this.isActive = false;
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.currentY = 0;
    this.startScrollLeft = 0;
    this.startTime = 0;
    this.velocityTracker = [];
    this.lastMoveTime = 0;
    this.hasScrolledHorizontally = false;
    this.animationFrame = null;

    // Bind methods
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  /**
   * Initialize the touch handler
   */
  initialize() {
    // Add touch event listeners
    this.container.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.container.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this.container.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    this.container.addEventListener("touchcancel", this.handleTouchCancel, {
      passive: true,
    });
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    // Cancel any ongoing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Get touch coordinates
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.currentX = this.startX;
    this.currentY = this.startY;

    // Record start time and position
    this.startTime = performance.now();
    this.startScrollLeft = this.container.scrollLeft;

    // Reset state
    this.isActive = true;
    this.velocityTracker = [];
    this.hasScrolledHorizontally = false;

    // Use auto scroll behavior for better responsiveness during touch
    this.container.style.scrollBehavior = "auto";
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.isActive) return;

    // Get current touch position
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;

    // Calculate deltas
    const deltaX = currentX - this.currentX;
    const deltaY = currentY - this.currentY;

    // Store current position for next move
    this.currentX = currentX;
    this.currentY = this.currentY;

    // Track horizontal movement
    const absX = Math.abs(currentX - this.startX);
    const absY = Math.abs(currentY - this.startY);

    // If we haven't determined direction yet
    if (!this.hasScrolledHorizontally && (absX > 5 || absY > 5)) {
      // If more horizontal movement or container is scrollable
      if (absX > absY || this.scrollManager.isScrollable) {
        this.hasScrolledHorizontally = true;
      }
    }

    // If we're scrolling horizontally, prevent default to avoid page scrolling
    if (this.hasScrolledHorizontally) {
      e.preventDefault();

      // Apply scrolling
      this.container.scrollLeft -= deltaX;

      // Track velocity for momentum scrolling
      const now = performance.now();
      const elapsed = now - this.lastMoveTime;

      if (elapsed > 0 && Math.abs(deltaX) > 0) {
        // Calculate and track velocity (pixels per ms)
        const velocity = -deltaX / elapsed;
        this.velocityTracker.push({
          velocity,
          time: now,
        });

        // Keep only recent velocity measurements (last 5)
        if (this.velocityTracker.length > 5) {
          this.velocityTracker.shift();
        }
      }

      this.lastMoveTime = now;
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    if (!this.isActive) return;

    // Reset state
    this.isActive = false;

    // Restore smooth scrolling
    this.container.style.scrollBehavior = "smooth";

    // If we were scrolling horizontally
    if (this.hasScrolledHorizontally) {
      e.preventDefault();

      // Calculate final velocity (weighted average of recent velocities)
      const finalVelocity = this.calculateFinalVelocity();

      // Apply momentum if velocity is significant
      if (Math.abs(finalVelocity) > 0.1) {
        this.applyMomentumScrolling(finalVelocity);
      } else {
        // Otherwise just snap to the nearest tab
        this.scrollManager.snapManager.snapToNearestTab();
      }
    }
  }

  /**
   * Handle touch cancel event
   */
  handleTouchCancel() {
    if (!this.isActive) return;

    // Reset state
    this.isActive = false;

    // Restore smooth scrolling
    this.container.style.scrollBehavior = "smooth";

    // Cancel any ongoing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Just snap to the nearest tab
    this.scrollManager.snapManager.snapToNearestTab();
  }

  /**
   * Calculate the final velocity based on recent movement
   * @returns {number} Weighted average velocity in pixels per ms
   */
  calculateFinalVelocity() {
    if (this.velocityTracker.length === 0) return 0;

    // Get current time
    const now = performance.now();

    // Calculate weighted sum - more recent and larger movements have higher weights
    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < this.velocityTracker.length; i++) {
      const entry = this.velocityTracker[i];

      // More recent entries get higher weight
      const age = now - entry.time;
      const timeWeight = Math.max(0, 1 - age / 100); // Higher weight for recent entries

      // Larger movements also get higher weight
      const magnitudeWeight = Math.min(1, Math.abs(entry.velocity) * 5);

      // Combined weight
      const weight = timeWeight * magnitudeWeight;

      weightedSum += entry.velocity * weight;
      totalWeight += weight;
    }

    // Avoid division by zero
    if (totalWeight === 0) return 0;

    return weightedSum / totalWeight;
  }

  /**
   * Apply momentum scrolling with physics
   * @param {number} velocity - Initial velocity in pixels per ms
   */
  applyMomentumScrolling(velocity) {
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Limit initial velocity for predictable behavior
    const maxVelocity = 2.5;
    const initialVelocity = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, velocity)
    );

    // Calculate momentum parameters
    const deceleration = 0.002; // pixels/ms²
    const direction = Math.sign(initialVelocity);

    // Calculate stopping distance based on physics: d = v²/2a
    const distance =
      Math.abs((initialVelocity * initialVelocity) / (2 * deceleration)) *
      direction;

    // Set up animation
    const startPosition = this.container.scrollLeft;
    const targetPosition = startPosition - distance;
    const startTime = performance.now();

    // Animation duration based on time to stop: t = v/a
    const duration = Math.abs(initialVelocity / deceleration);

    // Animation function for momentum
    const animateMomentum = (timestamp) => {
      const elapsed = timestamp - startTime;

      // Check if animation is complete
      if (elapsed >= duration) {
        // Ensure we're exactly at target for perfect stopping
        this.container.scrollLeft = targetPosition;

        // After momentum, snap to nearest category
        this.scrollManager.snapManager.snapToNearestTab();
        this.animationFrame = null;
        return;
      }

      // Physics-based position calculation:
      // p = p₀ + v₀t - ½at²
      const timeRatio = elapsed / duration;
      const easing = customMomentumEasing(timeRatio);
      const newPosition =
        startPosition + (targetPosition - startPosition) * easing;

      // Apply position
      this.container.scrollLeft = newPosition;

      // Continue animation
      this.animationFrame = requestAnimationFrame(animateMomentum);
    };

    // Start animation
    this.animationFrame = requestAnimationFrame(animateMomentum);
  }
}

/**
 * ControlsManager - Manages scroll controls and their interactions
 */
class ControlsManager {
  /**
   * @param {ScrollManager} scrollManager - Reference to the scroll manager
   */
  constructor(scrollManager) {
    this.scrollManager = scrollManager;
    this.container = scrollManager.container;

    // Control elements
    this.leftControl = null;
    this.rightControl = null;

    // State
    this.controlsCreated = false;

    // Bind methods
    this.createControls = this.createControls.bind(this);
    this.updateControlsVisibility = this.updateControlsVisibility.bind(this);
    this.handleLeftControlClick = this.handleLeftControlClick.bind(this);
    this.handleRightControlClick = this.handleRightControlClick.bind(this);
  }

  /**
   * Initialize controls
   */
  initialize() {
    this.createControls();
    this.updateControlsVisibility();

    // Add window resize listener to update controls
    window.addEventListener(
      "resize",
      debounce(() => {
        this.updateControlsVisibility();
      }, 200)
    );
  }

  /**
   * Create scroll controls
   */
  createControls() {
    // Remove any existing controls
    const existingControls = this.container.querySelectorAll(".scroll-control");
    existingControls.forEach((control) => control.remove());

    // Create left control
    this.leftControl = document.createElement("div");
    this.leftControl.className = "scroll-control scroll-control-left";
    this.leftControl.setAttribute("aria-label", "Scroll categories left");
    this.leftControl.setAttribute("role", "button");
    this.leftControl.setAttribute("tabindex", "0");

    const leftButton = document.createElement("div");
    leftButton.className = "scroll-btn";
    leftButton.innerHTML = '<i class="fas fa-chevron-left"></i>';

    this.leftControl.appendChild(leftButton);

    // Create right control
    this.rightControl = document.createElement("div");
    this.rightControl.className = "scroll-control scroll-control-right";
    this.rightControl.setAttribute("aria-label", "Scroll categories right");
    this.rightControl.setAttribute("role", "button");
    this.rightControl.setAttribute("tabindex", "0");

    const rightButton = document.createElement("div");
    rightButton.className = "scroll-btn";
    rightButton.innerHTML = '<i class="fas fa-chevron-right"></i>';

    this.rightControl.appendChild(rightButton);

    // Add controls to container
    this.container.appendChild(this.leftControl);
    this.container.appendChild(this.rightControl);

    // Add event listeners
    this.setupControlEvents(this.leftControl, this.handleLeftControlClick);
    this.setupControlEvents(this.rightControl, this.handleRightControlClick);

    // Create scroll hint element
    this.createScrollHint();

    // Mark controls as created
    this.controlsCreated = true;
  }

  /**
   * Create scroll hint indicator
   */
  createScrollHint() {
    const scrollHint = document.createElement("div");
    scrollHint.className = "scroll-hint";
    this.container.appendChild(scrollHint);
  }

  /**
   * Set up events for a scroll control
   * @param {HTMLElement} control - The control element
   * @param {Function} clickHandler - Click event handler
   */
  setupControlEvents(control, clickHandler) {
    // Click/touch event
    control.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      clickHandler(e);
    });

    // Handle ripple effect
    const button = control.querySelector(".scroll-btn");
    button.addEventListener("mousedown", this.createRippleEffect);
    button.addEventListener("touchstart", this.createRippleEffect, {
      passive: true,
    });

    // Keyboard support
    control.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        clickHandler(e);
      }
    });
  }

  /**
   * Create ripple effect for touch feedback
   * @param {Event} e - Mouse or touch event
   */
  createRippleEffect(e) {
    const button = this;
    const ripple = document.createElement("span");
    ripple.className = "scroll-ripple";

    // Add ripple to button
    button.appendChild(ripple);

    // Position the ripple
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = `${size}px`;

    // Position ripple from center if no specific coordinates
    ripple.style.left = `${(rect.width - size) / 2}px`;
    ripple.style.top = `${(rect.height - size) / 2}px`;

    // Add animation class
    ripple.classList.add("ripple-animation");

    // Remove after animation completes
    setTimeout(() => {
      ripple.remove();
    }, 600);

    // Provide haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  }

  /**
   * Handle left control click
   * @param {Event} e - Click event
   */
  handleLeftControlClick(e) {
    // Calculate scroll amount (proportional to container width)
    const scrollAmount = Math.min(this.container.clientWidth * 0.8, 300);
    this.scrollManager.scrollByAmount(-scrollAmount);
  }

  /**
   * Handle right control click
   * @param {Event} e - Click event
   */
  handleRightControlClick(e) {
    // Calculate scroll amount (proportional to container width)
    const scrollAmount = Math.min(this.container.clientWidth * 0.8, 300);
    this.scrollManager.scrollByAmount(scrollAmount);
  }

  /**
   * Update scroll controls visibility based on scroll position
   */
  updateControlsVisibility() {
    if (!this.controlsCreated) return;

    // Get current scroll metrics
    const scrollLeft = this.container.scrollLeft;
    const scrollWidth = this.container.scrollWidth;
    const clientWidth = this.container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Don't show controls if not scrollable
    if (!this.scrollManager.checkScrollability()) {
      this.leftControl.classList.remove("active");
      this.rightControl.classList.remove("active");
      return;
    }

    // Left control - active when scrolled right
    const showLeft = scrollLeft > 5;
    this.leftControl.classList.toggle("active", showLeft);

    // Right control - active when not at the end
    const showRight = scrollLeft < maxScroll - 5;
    this.rightControl.classList.toggle("active", showRight);
  }
}

/**
 * SnapManager - Manages tab snapping behavior
 */
class SnapManager {
  /**
   * @param {ScrollManager} scrollManager - Reference to the scroll manager
   */
  constructor(scrollManager) {
    this.scrollManager = scrollManager;
    this.container = scrollManager.container;

    // Bind methods
    this.snapToNearestTab = this.snapToNearestTab.bind(this);
  }

  /**
   * Initialize snap manager
   */
  initialize() {
    // No additional initialization needed
  }

  /**
   * Snap to the nearest tab after scrolling stops
   */
  snapToNearestTab() {
    const tabs = Array.from(this.container.querySelectorAll(".category-tab"));
    if (tabs.length === 0) return;

    // Get scroll metrics
    const viewportCenter =
      this.container.scrollLeft + this.container.clientWidth / 2;

    // Find the closest tab to the viewport center
    let closestTab = null;
    let closestDistance = Infinity;

    tabs.forEach((tab) => {
      const tabRect = tab.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      // Calculate tab center relative to container
      const tabCenter = tab.offsetLeft + tabRect.width / 2;

      // Calculate distance to viewport center
      const distance = Math.abs(tabCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTab = tab;
      }
    });

    // If we found a close tab, snap to it
    if (closestTab) {
      this.scrollManager.centerActiveTab();
    }
  }
}

/**
 * KeyboardManager - Manages keyboard navigation
 */
class KeyboardManager {
  /**
   * @param {ScrollManager} scrollManager - Reference to the scroll manager
   */
  constructor(scrollManager) {
    this.scrollManager = scrollManager;
    this.container = scrollManager.container;

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initialize keyboard manager
   */
  initialize() {
    // Set appropriate ARIA attributes
    this.container.setAttribute("role", "tablist");
    this.container.setAttribute("aria-label", "Menu Categories");

    // Set tab attributes
    const tabs = this.container.querySelectorAll(".category-tab");
    tabs.forEach((tab) => {
      tab.setAttribute("role", "tab");
      if (!tab.hasAttribute("tabindex")) {
        tab.setAttribute("tabindex", "0");
      }

      // Add keyboard navigation
      tab.addEventListener("keydown", this.handleKeyDown);
    });
  }

  /**
   * Handle key down events for keyboard navigation
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyDown(e) {
    // Only handle if it's a category tab
    if (!e.target.classList.contains("category-tab")) return;

    const tab = e.target;
    let nextTab = null;

    switch (e.key) {
      case "ArrowRight":
      case "Right":
        e.preventDefault();
        nextTab = this.getNextTab(tab);
        break;

      case "ArrowLeft":
      case "Left":
        e.preventDefault();
        nextTab = this.getPreviousTab(tab);
        break;

      case "Home":
        e.preventDefault();
        nextTab = this.getFirstTab();
        break;

      case "End":
        e.preventDefault();
        nextTab = this.getLastTab();
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        tab.click();
        break;

      default:
        return;
    }

    // Focus and scroll to next tab if found
    if (nextTab) {
      nextTab.focus();

      // Center the tab
      const tabRect = nextTab.getBoundingClientRect();
      const containerRect = this.container.getBoundingClientRect();

      const tabCenter = nextTab.offsetLeft + tabRect.width / 2;
      const containerCenter = containerRect.width / 2;

      this.scrollManager.scrollToPosition(tabCenter - containerCenter);
    }
  }

  /**
   * Get the next tab in sequence
   * @param {HTMLElement} currentTab - Current tab
   * @returns {HTMLElement|null} Next tab or null
   */
  getNextTab(currentTab) {
    const tabs = Array.from(this.container.querySelectorAll(".category-tab"));
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex < tabs.length - 1) {
      return tabs[currentIndex + 1];
    }

    return null;
  }

  /**
   * Get the previous tab in sequence
   * @param {HTMLElement} currentTab - Current tab
   * @returns {HTMLElement|null} Previous tab or null
   */
  getPreviousTab(currentTab) {
    const tabs = Array.from(this.container.querySelectorAll(".category-tab"));
    const currentIndex = tabs.indexOf(currentTab);

    if (currentIndex > 0) {
      return tabs[currentIndex - 1];
    }

    return null;
  }

  /**
   * Get the first tab
   * @returns {HTMLElement|null} First tab or null
   */
  getFirstTab() {
    const tabs = this.container.querySelectorAll(".category-tab");
    return tabs.length > 0 ? tabs[0] : null;
  }

  /**
   * Get the last tab
   * @returns {HTMLElement|null} Last tab or null
   */
  getLastTab() {
    const tabs = this.container.querySelectorAll(".category-tab");
    return tabs.length > 0 ? tabs[tabs.length - 1] : null;
  }
}

/**
 * WheelHandler - Manages mouse wheel scrolling
 */
class WheelHandler {
  /**
   * @param {ScrollManager} scrollManager - Reference to the scroll manager
   */
  constructor(scrollManager) {
    this.scrollManager = scrollManager;
    this.container = scrollManager.container;

    // State
    this.isActive = false;
    this.wheelTimeout = null;
    this.wheelDistance = 0;

    // Bind methods
    this.handleWheel = this.handleWheel.bind(this);
  }

  /**
   * Initialize wheel handler
   */
  initialize() {
    // Add wheel event listener
    this.container.addEventListener("wheel", this.handleWheel, {
      passive: false,
    });
  }

  /**
   * Handle wheel events
   * @param {WheelEvent} e - Wheel event
   */
  handleWheel(e) {
    // Only handle wheel events if the container is scrollable
    if (!this.scrollManager.isScrollable) return;

    // Get the primary delta direction
    const primaryDelta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    // Use automatic scrolling during wheel events for better responsiveness
    this.container.style.scrollBehavior = "auto";

    // Apply scroll with scaling for better control
    const scaledDelta = primaryDelta * 1.2;
    this.container.scrollLeft += scaledDelta;

    // Track wheel activity
    this.isActive = true;
    this.wheelDistance += Math.abs(scaledDelta);

    // Clear existing timeout
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }

    // Set timeout to handle wheel end
    this.wheelTimeout = setTimeout(() => {
      // Restore smooth scrolling
      this.container.style.scrollBehavior = "smooth";

      // If significant scrolling happened, snap to nearest tab
      if (this.wheelDistance > 50) {
        this.scrollManager.snapManager.snapToNearestTab();
      }

      // Reset wheel activity
      this.isActive = false;
      this.wheelDistance = 0;
    }, 150);

    // Update controls visibility
    this.scrollManager.controlsManager.updateControlsVisibility();

    // Prevent page scrolling
    e.preventDefault();
  }
}

/**
 * Custom momentum easing function for natural inertia
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value
 */
function customMomentumEasing(t) {
  // Cubic bezier approximation: cubic-bezier(0.33, 0.1, 0.17, 1)
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function for smooth animations
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Improved debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @param {boolean} immediate - Whether to execute immediately
 * @returns {Function} Debounced function
 */
function debounce(func, wait, immediate) {
  let timeout;

  return function () {
    const context = this;
    const args = arguments;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

/**
 * Ultimate Scrolling Experience for Bonobo Bar & More
 *
 * A state-of-the-art scrolling implementation featuring:
 * - Butter-smooth spring physics for natural movement
 * - Gesture-based controls with no visible buttons
 * - Intelligent scrolling behavior that adapts to user interaction
 * - Remarkable performance optimizations for 60+ FPS
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeUltimateScrolling();
});

/**
 * Initialize the ultimate scrolling experience
 */
function initializeUltimateScrolling() {
  const categoryNavigation = document.querySelector(".category-navigation");
  if (!categoryNavigation) return;

  // Create scroll manager instance
  const scrollManager = new UltraScrollManager(categoryNavigation);

  // Initialize the system
  scrollManager.initialize();

  // Store reference for external access
  categoryNavigation._scrollManager = scrollManager;

  console.log("Ultimate scrolling experience initialized");
}

/**
 * UltraScrollManager - Core class that handles all scrolling interactions
 * with sophisticated physics-based animations
 */
class UltraScrollManager {
  /**
   * @param {HTMLElement} container - Scrollable container
   */
  constructor(container) {
    // Core elements
    this.container = container;
    this.content = container.querySelector(".category-tabs");

    // Physics configuration
    this.physics = {
      friction: 0.92, // Higher value = less friction
      springStrength: 0.08, // Higher value = stronger snap
      velocityThreshold: 0.5,
      minimumDistance: 10,
    };

    // State tracking
    this.state = {
      isScrollable: false,
      isScrolling: false,
      isDragging: false,
      scrollTimeout: null,
      scrollWidth: 0,
      clientWidth: 0,
      scrollRatio: 0,
      isFirstVisit: !localStorage.getItem("category_scroll_seen"),
    };

    // Touch tracking
    this.touch = {
      startX: 0,
      startY: 0,
      startScrollLeft: 0,
      lastX: 0,
      velocityTracker: [],
      velocity: 0,
      timestamp: 0,
    };

    // Animation frame reference
    this.animationFrame = null;

    // Indicator elements
    this.indicators = {
      positionTrack: null,
      positionThumb: null,
    };

    // Bind methods to this instance
    this.handleScroll = this.handleScroll.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.checkScrollability = this.checkScrollability.bind(this);
    this.centerActiveTab = this.centerActiveTab.bind(this);
    this.snapToNearestTab = this.snapToNearestTab.bind(this);
    this.updatePositionIndicator = this.updatePositionIndicator.bind(this);
    this.updateEdgeIndicators = this.updateEdgeIndicators.bind(this);
  }

  /**
   * Initialize the scroll manager and all components
   */
  initialize() {
    // Create the subtle position indicator
    this.createPositionIndicator();

    // Set up all event listeners
    this.setupEventListeners();

    // Perform initial checks
    this.checkScrollability();
    this.centerActiveTab();
    this.updatePositionIndicator();
    this.updateEdgeIndicators();

    // Show first-time visit guidance
    if (this.state.isFirstVisit && this.state.isScrollable) {
      this.showSwipeHint();
    }
  }

  /**
   * Create subtle position indicator that shows scroll position
   */
  createPositionIndicator() {
    // Create container
    const indicator = document.createElement("div");
    indicator.className = "scroll-position-indicator";

    // Create track
    const track = document.createElement("div");
    track.className = "scroll-position-track";

    // Create thumb
    const thumb = document.createElement("div");
    thumb.className = "scroll-position-thumb";

    // Assemble and add to container
    track.appendChild(thumb);
    indicator.appendChild(track);
    this.container.appendChild(indicator);

    // Store references
    this.indicators.positionTrack = track;
    this.indicators.positionThumb = thumb;
  }

  /**
   * Set up all event listeners
   */
  setupEventListeners() {
    // Scroll event
    this.container.addEventListener("scroll", this.handleScroll, {
      passive: true,
    });

    // Touch events
    this.container.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.container.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this.container.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    this.container.addEventListener("touchcancel", this.handleTouchEnd, {
      passive: false,
    });

    // Wheel event
    this.container.addEventListener("wheel", this.handleWheel, {
      passive: false,
    });

    // Mouse events for desktop drag scrolling
    this.container.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // Only primary button

      // Prevent text selection
      e.preventDefault();

      this.state.isDragging = true;
      this.touch.startX = e.clientX;
      this.touch.startY = e.clientY;
      this.touch.startScrollLeft = this.container.scrollLeft;
      this.touch.lastX = e.clientX;
      this.touch.timestamp = Date.now();
      this.touch.velocityTracker = [];

      // Set grabbing cursor
      this.container.style.cursor = "grabbing";

      // Add document-level event listeners
      document.addEventListener("mousemove", this.handleMouseMove);
      document.addEventListener("mouseup", this.handleMouseUp);
    });

    // Defined here for proper this binding
    this.handleMouseMove = (e) => {
      if (!this.state.isDragging) return;

      // Calculate how far the mouse has moved
      const dx = e.clientX - this.touch.lastX;

      // Update scroll position
      this.container.scrollLeft = this.container.scrollLeft - dx;

      // Update last position
      this.touch.lastX = e.clientX;

      // Track velocity
      const now = Date.now();
      const elapsed = now - this.touch.timestamp;

      if (elapsed > 0) {
        // Calculate velocity (pixels per ms)
        const velocity = -dx / elapsed;

        this.touch.velocityTracker.push({
          velocity,
          time: now,
        });

        // Keep only the last 5 velocity samples
        if (this.touch.velocityTracker.length > 5) {
          this.touch.velocityTracker.shift();
        }
      }

      this.touch.timestamp = now;
    };

    this.handleMouseUp = (e) => {
      if (!this.state.isDragging) return;

      this.state.isDragging = false;

      // Restore cursor
      this.container.style.cursor = "grab";

      // Remove document-level event listeners
      document.removeEventListener("mousemove", this.handleMouseMove);
      document.removeEventListener("mouseup", this.handleMouseUp);

      // Calculate final velocity
      const finalVelocity = this.calculateFinalVelocity();

      // Apply momentum scrolling if velocity is significant
      if (Math.abs(finalVelocity) > 0.1) {
        this.applyMomentumScrolling(finalVelocity);
      } else {
        // Otherwise snap to nearest tab
        this.snapToNearestTab();
      }
    };

    // Resize event with debounce
    window.addEventListener(
      "resize",
      debounce(() => {
        this.handleResize();
      }, 150)
    );

    // Listen for tab activation
    this.container.addEventListener("tabActivated", this.centerActiveTab);

    // Set up mutation observer to watch for content changes
    this.setupMutationObserver();
  }

  /**
   * Set up mutation observer to detect changes to the tabs
   */
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
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
        this.updatePositionIndicator();
        this.updateEdgeIndicators();
        this.centerActiveTab();
      }
    });

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
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Track scrolling state
    if (!this.state.isScrolling) {
      this.state.isScrolling = true;
      this.container.classList.add("is-scrolling");
    }

    // Clear existing timeout
    if (this.state.scrollTimeout) {
      clearTimeout(this.state.scrollTimeout);
    }

    // Set timeout to detect when scrolling stops
    this.state.scrollTimeout = setTimeout(() => {
      this.state.isScrolling = false;
      this.container.classList.remove("is-scrolling");

      // Snap to nearest tab when scrolling stops naturally
      if (!this.state.isDragging) {
        this.snapToNearestTab();
      }
    }, 150);

    // Update indicators
    this.updatePositionIndicator();
    this.updateEdgeIndicators();
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    // Cancel any running animations
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    // Store the initial touch position
    this.touch.startX = e.touches[0].clientX;
    this.touch.startY = e.touches[0].clientY;
    this.touch.lastX = this.touch.startX;
    this.touch.startScrollLeft = this.container.scrollLeft;
    this.touch.timestamp = Date.now();
    this.touch.velocityTracker = [];

    // Use auto scrolling during touch for better responsiveness
    this.container.style.scrollBehavior = "auto";
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    // Calculate deltas
    const deltaX = currentX - this.touch.lastX;
    const deltaY = currentY - this.touch.startY;

    // Determine if this is primarily a horizontal scroll
    // Only on the first significant movement
    if (!this.state.isDragging) {
      // Check if movement is significant enough to determine direction
      const absX = Math.abs(currentX - this.touch.startX);
      const absY = Math.abs(deltaY);

      // If we've moved enough to determine direction
      if (absX > 5 || absY > 5) {
        // If more horizontal movement or the container is scrollable
        if (absX > absY || this.state.isScrollable) {
          this.state.isDragging = true;
          e.preventDefault(); // Prevent page scrolling
        } else {
          // This is primarily a vertical scroll, don't interfere
          return;
        }
      }
    } else {
      // We've already determined this is a horizontal scroll
      e.preventDefault();
    }

    if (this.state.isDragging) {
      // Apply scrolling
      this.container.scrollLeft = this.container.scrollLeft - deltaX;

      // Track velocity for momentum scrolling
      const now = Date.now();
      const elapsed = now - this.touch.timestamp;

      if (elapsed > 0 && Math.abs(deltaX) > 0) {
        // Calculate and track velocity (pixels per ms)
        const velocity = -deltaX / elapsed;
        this.touch.velocityTracker.push({
          velocity,
          time: now,
        });

        // Keep only recent velocity measurements (last 5)
        if (this.touch.velocityTracker.length > 5) {
          this.touch.velocityTracker.shift();
        }
      }

      this.touch.lastX = currentX;
      this.touch.timestamp = now;
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    // Restore smooth scrolling
    this.container.style.scrollBehavior = "smooth";

    // If we were dragging
    if (this.state.isDragging) {
      // Reset state
      this.state.isDragging = false;

      // Calculate final velocity
      const finalVelocity = this.calculateFinalVelocity();

      // Apply momentum if velocity is significant
      if (Math.abs(finalVelocity) > 0.1) {
        this.applyMomentumScrolling(finalVelocity);
      } else {
        // Otherwise snap to nearest tab
        this.snapToNearestTab();
      }

      // Prevent default to avoid any unwanted touches
      e.preventDefault();
    }
  }

  /**
   * Handle wheel events with improved physics
   * @param {WheelEvent} e - Wheel event
   */
  handleWheel(e) {
    // Only handle wheel events if the container is scrollable
    if (!this.state.isScrollable) return;

    // Determine the primary scroll direction
    const primaryDelta =
      Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

    // Use automatic scrolling during wheel events for better responsiveness
    this.container.style.scrollBehavior = "auto";

    // Apply scroll with refined easing for more natural feel
    // Use a non-linear scaling to make small wheel movements more precise
    const scaledDelta =
      Math.sign(primaryDelta) * Math.pow(Math.abs(primaryDelta), 0.8) * 1.2;
    this.container.scrollLeft += scaledDelta;

    // Update indicators
    this.updatePositionIndicator();
    this.updateEdgeIndicators();

    // Prevent page scrolling
    e.preventDefault();

    // Cancel any existing animation and timeouts
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.state.scrollTimeout) {
      clearTimeout(this.state.scrollTimeout);
    }

    // Set up a debounced snap after wheel scrolling stops
    this.state.scrollTimeout = setTimeout(() => {
      // Restore smooth scrolling
      this.container.style.scrollBehavior = "smooth";
      this.snapToNearestTab();
    }, 150);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    this.checkScrollability();
    this.updatePositionIndicator();
    this.updateEdgeIndicators();
    this.centerActiveTab();
  }

  /**
   * Calculate the final velocity based on recent touch movements
   * @returns {number} Weighted average velocity in pixels per ms
   */
  calculateFinalVelocity() {
    if (this.touch.velocityTracker.length === 0) return 0;

    // Calculate weighted sum based on recency and magnitude
    const now = Date.now();
    let totalWeight = 0;
    let weightedSum = 0;

    for (let i = 0; i < this.touch.velocityTracker.length; i++) {
      const entry = this.touch.velocityTracker[i];

      // More recent samples get higher weight
      const age = now - entry.time;
      const timeWeight = Math.max(0, 1 - age / 100);

      // Larger movements get slightly higher weight (but not too much)
      const magnitudeWeight = Math.min(1, Math.abs(entry.velocity) * 2 + 0.5);

      // Calculate combined weight
      const weight = timeWeight * magnitudeWeight;

      weightedSum += entry.velocity * weight;
      totalWeight += weight;
    }

    // Avoid division by zero
    if (totalWeight === 0) return 0;

    return weightedSum / totalWeight;
  }

  /**
   * Apply momentum scrolling with spring physics
   * @param {number} initialVelocity - Initial velocity in pixels per ms
   */
  applyMomentumScrolling(initialVelocity) {
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Clamp initial velocity to reasonable range
    const maxVelocity = 3;
    const velocity = Math.max(
      -maxVelocity,
      Math.min(maxVelocity, initialVelocity)
    );

    // Setup spring physics
    let currentVelocity = velocity * 20; // Scale for better UX (px/frame)
    let targetPosition = null; // Will be determined once we slow down

    // Animation state
    const startScrollLeft = this.container.scrollLeft;
    let lastTimestamp = performance.now();

    // Phase tracking
    let inDecelerationPhase = true; // Initial phase: deceleration
    let inSnapPhase = false; // Secondary phase: snapping

    // Run animation with requestAnimationFrame for smooth performance
    const animateMomentum = (timestamp) => {
      // Calculate elapsed time
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // First phase: deceleration
      if (inDecelerationPhase) {
        // Apply friction to gradually reduce velocity
        currentVelocity *= this.physics.friction;

        // Move based on current velocity
        this.container.scrollLeft += currentVelocity * (elapsed / 16); // Normalize to 60fps

        // Check if we're slow enough to determine snap target
        if (Math.abs(currentVelocity) < this.physics.velocityThreshold) {
          // Find the nearest tab to snap to
          const tabs = Array.from(
            this.container.querySelectorAll(".category-tab")
          );
          if (tabs.length === 0) {
            // No tabs to snap to, just stop
            return;
          }

          // Calculate viewport center
          const viewportCenter =
            this.container.scrollLeft + this.container.clientWidth / 2;

          // Find the closest tab to the viewport center
          let closestTab = null;
          let closestDistance = Infinity;

          tabs.forEach((tab) => {
            const tabRect = tab.getBoundingClientRect();
            const tabCenter = tab.offsetLeft + tabRect.width / 2;
            const distance = Math.abs(tabCenter - viewportCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestTab = tab;
            }
          });

          if (closestTab) {
            // Calculate target position to center the tab
            const tabRect = closestTab.getBoundingClientRect();
            const tabCenter = closestTab.offsetLeft + tabRect.width / 2;
            const containerCenter = this.container.clientWidth / 2;
            targetPosition = tabCenter - containerCenter;

            // Switch to snap phase
            inDecelerationPhase = false;
            inSnapPhase = true;
          } else {
            // No tab found, just stop
            return;
          }
        }
      }

      // Second phase: spring-based snapping
      if (inSnapPhase && targetPosition !== null) {
        // Get current position
        const currentPosition = this.container.scrollLeft;

        // Distance to target
        const distanceToTarget = targetPosition - currentPosition;

        // If distance is very small, just set to target and finish
        if (Math.abs(distanceToTarget) < 0.5) {
          this.container.scrollLeft = targetPosition;

          // End animation
          this.updatePositionIndicator();
          this.updateEdgeIndicators();
          return;
        }

        // Apply spring force
        currentVelocity += distanceToTarget * this.physics.springStrength;

        // Apply slight damping to avoid oscillation
        currentVelocity *= 0.9;

        // Update position
        this.container.scrollLeft += currentVelocity;
      }

      // Update indicators
      this.updatePositionIndicator();
      this.updateEdgeIndicators();

      // Continue animation
      this.animationFrame = requestAnimationFrame(animateMomentum);
    };

    // Start the animation
    this.animationFrame = requestAnimationFrame(animateMomentum);
  }

  /**
   * Update the scroll position indicator
   */
  updatePositionIndicator() {
    if (!this.indicators.positionThumb) return;

    // Get scroll metrics
    const scrollLeft = this.container.scrollLeft;
    const scrollWidth = this.container.scrollWidth;
    const clientWidth = this.container.clientWidth;

    // Don't show for non-scrollable content
    if (scrollWidth <= clientWidth) {
      this.indicators.positionThumb.style.display = "none";
      return;
    }

    // Show thumb
    this.indicators.positionThumb.style.display = "block";

    // Calculate thumb width as percentage of visible area
    const thumbWidthPercent = (clientWidth / scrollWidth) * 100;
    this.indicators.positionThumb.style.width = `${thumbWidthPercent}%`;

    // Calculate position as percentage of scroll progress
    const maxScroll = scrollWidth - clientWidth;
    const scrollPercent = (scrollLeft / maxScroll) * 100;

    // Apply position with transform for better performance
    this.indicators.positionThumb.style.transform = `translateX(${scrollPercent}%)`;

    // Only show indicator when scrollable and actively scrolling
    const shouldShow =
      this.state.isScrollable &&
      (this.state.isScrolling || this.state.isDragging);

    this.indicators.positionThumb.style.opacity = shouldShow ? "0.8" : "0.3";
  }

  /**
   * Update the edge fade indicators
   */
  updateEdgeIndicators() {
    // Get scroll metrics
    const scrollLeft = this.container.scrollLeft;
    const scrollWidth = this.container.scrollWidth;
    const clientWidth = this.container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Only show indicators if content is scrollable
    if (!this.state.isScrollable) {
      this.container.classList.remove("show-start-fade", "show-end-fade");
      return;
    }

    // Show start fade indicator when scrolled
    this.container.classList.toggle("show-start-fade", scrollLeft > 10);

    // Show end fade indicator when more content is available
    this.container.classList.toggle(
      "show-end-fade",
      scrollLeft < maxScroll - 10
    );
  }

  /**
   * Check if the container is scrollable
   * @returns {boolean} Whether the container is scrollable
   */
  checkScrollability() {
    // Get the latest dimensions
    this.state.scrollWidth = this.container.scrollWidth;
    this.state.clientWidth = this.container.clientWidth;

    // Content is scrollable if scroll width is significantly larger than client width
    const wasScrollable = this.state.isScrollable;
    this.state.isScrollable =
      this.state.scrollWidth > this.state.clientWidth + 10;

    // Update scroll ratio
    if (this.state.isScrollable) {
      const maxScroll = this.state.scrollWidth - this.state.clientWidth;
      this.state.scrollRatio = this.state.clientWidth / this.state.scrollWidth;
    } else {
      this.state.scrollRatio = 1;
    }

    // Update container class for styling
    this.container.classList.toggle("scrollable", this.state.isScrollable);

    // If scrollability changed, update indicators
    if (wasScrollable !== this.state.isScrollable) {
      this.updatePositionIndicator();
      this.updateEdgeIndicators();
    }

    return this.state.isScrollable;
  }

  /**
   * Center the active tab with smooth animation
   */
  centerActiveTab() {
    const activeTab = this.container.querySelector(".category-tab.active");
    if (!activeTab) return;

    // Calculate the position to center the tab
    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();

    const tabCenter = activeTab.offsetLeft + tabRect.width / 2;
    const containerCenter = containerRect.width / 2;

    // Calculate target scroll position
    const targetScrollLeft = tabCenter - containerCenter;

    // Use spring physics for smoother animation
    this.animateToPosition(targetScrollLeft);
  }

  /**
   * Snap to the nearest tab with spring physics
   */
  snapToNearestTab() {
    const tabs = Array.from(this.container.querySelectorAll(".category-tab"));
    if (tabs.length === 0) return;

    // Calculate viewport center
    const viewportCenter =
      this.container.scrollLeft + this.container.clientWidth / 2;

    // Find the closest tab to the viewport center
    let closestTab = null;
    let closestDistance = Infinity;

    tabs.forEach((tab) => {
      const tabRect = tab.getBoundingClientRect();
      const tabCenter = tab.offsetLeft + tabRect.width / 2;
      const distance = Math.abs(tabCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestTab = tab;
      }
    });

    // If we found a close tab, snap to it
    if (closestTab) {
      const tabRect = closestTab.getBoundingClientRect();
      const tabCenter = closestTab.offsetLeft + tabRect.width / 2;
      const containerCenter = this.container.clientWidth / 2;

      // Calculate target scroll position
      const targetScrollLeft = tabCenter - containerCenter;

      // Use spring physics for smoother animation
      this.animateToPosition(targetScrollLeft);
    }
  }

  /**
   * Animate to a specific scroll position with spring physics
   * @param {number} targetPosition - Target scroll position
   */
  animateToPosition(targetPosition) {
    // Cancel any existing animation
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Get current position
    const startPosition = this.container.scrollLeft;

    // Exit early if we're already very close
    if (Math.abs(startPosition - targetPosition) < 2) return;

    // Set up spring parameters
    let velocity = 0;
    let currentPosition = startPosition;
    let lastTimestamp = performance.now();

    // Spring animation function
    const animateSpring = (timestamp) => {
      // Calculate elapsed time since last frame
      const elapsed = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      // Calculate normalized time step (aimed at 60fps)
      const dt = elapsed / 16.67;

      // Calculate distance to target
      const distanceToTarget = targetPosition - currentPosition;

      // Spring force: proportional to distance
      const springForce = distanceToTarget * 0.1 * dt;

      // Apply spring force to velocity
      velocity += springForce;

      // Apply damping to prevent oscillation
      velocity *= 0.85;

      // Update position
      currentPosition += velocity;

      // Apply to DOM
      this.container.scrollLeft = currentPosition;

      // Update indicators
      this.updatePositionIndicator();
      this.updateEdgeIndicators();

      // Check if we should continue the animation
      if (Math.abs(velocity) > 0.1 || Math.abs(distanceToTarget) > 1) {
        this.animationFrame = requestAnimationFrame(animateSpring);
      } else {
        // We're close enough to the target, just set the final position
        this.container.scrollLeft = targetPosition;
        this.updatePositionIndicator();
        this.updateEdgeIndicators();
      }
    };

    // Start the animation
    this.animationFrame = requestAnimationFrame(animateSpring);
  }

  /**
   * Show swipe hint for first-time users
   */
  showSwipeHint() {
    // Create hint element if it doesn't exist
    if (!this.container.querySelector(".swipe-hint")) {
      const hint = document.createElement("div");
      hint.className = "swipe-hint";

      const content = document.createElement("div");
      content.className = "swipe-hint-content";

      const icon = document.createElement("div");
      icon.className = "swipe-hint-icon";
      icon.innerHTML =
        '<i class="fas fa-chevron-left"></i><i class="fas fa-chevron-right"></i>';

      const text = document.createElement("div");
      text.className = "swipe-hint-text";
      text.textContent = "Swipe to browse categories";

      content.appendChild(icon);
      content.appendChild(text);
      hint.appendChild(content);

      this.container.appendChild(hint);

      // Show hint with slight delay
      setTimeout(() => {
        hint.classList.add("visible");

        // Remove hint after animation
        setTimeout(() => {
          hint.classList.remove("visible");

          // Remove after fadeout
          setTimeout(() => {
            hint.remove();
          }, 1000);

          // Mark as visited
          localStorage.setItem("category_scroll_seen", "true");
          this.state.isFirstVisit = false;
        }, 3000);
      }, 500);
    }
  }
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

/**
 * Custom easing function for more natural animations
 * @param {number} t - Progress from 0 to 1
 * @returns {number} Eased value
 */
function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

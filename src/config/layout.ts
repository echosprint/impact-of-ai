/**
 * Layout configuration constants
 */

export const LAYOUT_CONFIG = {
  // Viewport and positioning
  VIEWPORT_CENTER_TOLERANCE: 0.4, // 40% of viewport height around center
  MINIMUM_VISIBILITY_THRESHOLD: 0.2, // Minimum visibility score for reference activation
  
  // Timing and performance
  SCROLL_THROTTLE_MS: 16, // ~60fps throttling
  RESIZE_DEBOUNCE_MS: 150,
  ANIMATION_DURATION_MS: 400,
  CONTENT_RENDER_DELAY_MS: 500,
  IMAGE_LOAD_DELAY_MS: 100,
  
  // Reference sizing
  REFERENCE_WIDTH_PERCENTAGE: 0.9, // 90% of column width
  REFERENCE_RIGHT_AREA_PERCENTAGE: 0.9, // 90% of right area
  REFERENCE_RIGHT_MARGIN_PERCENTAGE: 0.075, // 7.5% margin
  REFERENCE_VIEWPORT_PERCENTAGE: 0.25, // 25% of viewport (fallback)
  REFERENCE_VIEWPORT_MARGIN_PERCENTAGE: 0.02, // 2% margin (fallback)
  
  // Minimum dimensions
  MIN_REFERENCE_WIDTH: 350, // Minimum reference width in pixels
  MIN_REFERENCE_WIDTH_FALLBACK: 380, // Fallback minimum width
  
  // Breakpoints
  DESKTOP_BREAKPOINT: 1024,
  TABLET_BREAKPOINT: 640,
  
  // Mobile sizing
  MOBILE_MARGIN: '1rem',
  
  // Animation easing
  ANIMATION_EASING: 'cubic-bezier(0.4, 0, 0.2, 1)',
  SMOOTH_EASING: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  
  // Reading speed
  WORDS_PER_MINUTE: 200,
} as const;

export const RESPONSIVE_CONFIG = {
  // Mobile expand settings
  MOBILE_EXPANDED_WIDTH_PERCENTAGE: 125, // 125% for mobile
  MOBILE_MAX_WIDTH: 320,
  MOBILE_TRANSFORM: 'translateY(-5px) translateX(-20%)',
  
  // Tablet expand settings  
  TABLET_EXPANDED_WIDTH_PERCENTAGE: 135, // 135% for tablet
  TABLET_MAX_WIDTH: 400,
  TABLET_TRANSFORM: 'translateY(-6px) translateX(-26%)',
  
  // Desktop expand settings
  DESKTOP_EXPANDED_WIDTH_PERCENTAGE: 160, // 160% for desktop
  DESKTOP_MAX_WIDTH: 640,
  DESKTOP_TRANSFORM: 'translateY(-8px) translateX(-50%)',
} as const;

export const Z_INDEX = {
  REFERENCE_BASE: 20,
  REFERENCE_EXPANDED: 30,
  CONNECTION_ELEMENTS: 10,
  FADE_EFFECTS: 5,
} as const;
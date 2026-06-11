
/**
 * Suppresses console errors from browser extensions to reduce noise in development
 */
export const suppressExtensionErrors = () => {
  // Store original console.error
  const originalConsoleError = console.error;
  
  // Override console.error to filter out extension-related errors
  console.error = (...args: unknown[]) => {
    // Check if any argument contains chrome-extension URL or Lovable editor warnings
    const hasExtensionError = args.some(arg =>
      typeof arg === 'string' && (
        arg.includes('chrome-extension://') ||
        arg.includes('Failed to load resource:') && arg.includes('chrome-extension://') ||
        arg.includes('net::ERR_FILE_NOT_FOUND') && arg.includes('chrome-extension://') ||
        // Lovable editor injects data-lov-id props which cause React Fragment warnings
        arg.includes('data-lov-id') ||
        arg.includes('data-lov-')
      )
    );

    // Only log if it's not an extension error
    if (!hasExtensionError) {
      originalConsoleError.apply(console, args);
    }
  };

  // Handle resource loading errors (like failed scripts, stylesheets, etc.)
  window.addEventListener('error', (event) => {
    // Check if the error is from a chrome extension
    if (event.filename && event.filename.startsWith('chrome-extension://')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Also check the target element for extension-related sources
    if (event.target && event.target !== window) {
      const element = event.target as HTMLElement;
      if (element.getAttribute && (
        element.getAttribute('src')?.startsWith('chrome-extension://') ||
        element.getAttribute('href')?.startsWith('chrome-extension://')
      )) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    }
  }, true);

  // Handle unhandled promise rejections that might be extension-related
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason && typeof reason === 'object' && reason.message) {
      if (reason.message.includes('chrome-extension://')) {
        event.preventDefault();
        return false;
      }
    }
  });

  // Override window.onerror as an additional safety net
  const originalWindowOnError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Suppress errors from chrome extensions
    if (source && source.startsWith('chrome-extension://')) {
      return true; // Prevent default error handling
    }
    
    // Call original handler for non-extension errors
    if (originalWindowOnError) {
      return originalWindowOnError.call(window, message, source, lineno, colno, error);
    }
    return false;
  };

  console.log('🔇 Chrome extension error suppression enabled');
};

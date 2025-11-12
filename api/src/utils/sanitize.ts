/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeHtml = (input: string): string => {
  if (!input) return "";
  
  // Remove script tags and their content
  let sanitized = input.replace(/<script[^>]*>.*?<\/script>/gi, "");
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe[^>]*>.*?<\/iframe>/gi, "");
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  
  // Remove style tags
  sanitized = sanitized.replace(/<style[^>]*>.*?<\/style>/gi, "");
  
  // Allow basic formatting tags only (optional - if you want to allow some HTML)
  // For now, we'll strip all HTML tags except newlines
  sanitized = sanitized.replace(/<[^>]+>/g, "");
  
  return sanitized.trim();
};

/**
 * Sanitize text for display (more permissive - allows basic formatting)
 */
export const sanitizeTextForDisplay = (input: string): string => {
  if (!input) return "";
  
  // Remove dangerous tags but keep basic formatting
  let sanitized = input
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "");
  
  // Convert newlines to <br> for display (optional)
  // sanitized = sanitized.replace(/\n/g, "<br>");
  
  return sanitized.trim();
};


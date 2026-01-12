/**
 * Form Field Utilities
 * 
 * Utility functions to ensure form fields have proper id and name attributes
 * for accessibility and form submission compliance.
 */

/**
 * Generate a unique Unix timestamp-based ID for form fields
 * 
 * @param {string} prefix - A descriptive prefix for the ID (e.g., 'contact-name', 'auth-email')
 * @returns {string} A unique ID string combining prefix, Unix timestamp, and random string
 * 
 * @example
 * generateUniqueId('contact-name')
 * // Returns: 'contact-name-1703123456789-a3b5c7d9e'
 */
export const generateUniqueId = (prefix) => {
  if (!prefix || typeof prefix !== 'string') {
    throw new Error('Prefix must be a non-empty string');
  }
  
  // Generate unique ID using Unix timestamp and random string
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substr(2, 9);
  
  return `${prefix}-${timestamp}-${randomStr}`;
};

/**
 * Generate multiple unique IDs for form fields at once
 * 
 * @param {Object} fieldPrefixes - Object with field names as keys and prefixes as values
 * @returns {Object} Object with the same keys but unique IDs as values
 * 
 * @example
 * generateFieldIds({
 *   name: 'contact-name',
 *   email: 'contact-email',
 *   phone: 'contact-phone'
 * })
 * // Returns: {
 * //   name: 'contact-name-1703123456789-a3b5c7d9e',
 * //   email: 'contact-email-1703123456789-b4c6d8e0f',
 * //   phone: 'contact-phone-1703123456789-c5d7e9f1a'
 * // }
 */
export const generateFieldIds = (fieldPrefixes) => {
  if (!fieldPrefixes || typeof fieldPrefixes !== 'object') {
    throw new Error('fieldPrefixes must be an object');
  }
  
  const fieldIds = {};
  for (const [fieldName, prefix] of Object.entries(fieldPrefixes)) {
    fieldIds[fieldName] = generateUniqueId(prefix);
  }
  
  return fieldIds;
};

/**
 * Ensure a form field has both id and name attributes
 * If id is missing, generates one. If name is missing, uses the id or generates one.
 * 
 * @param {Object} props - Form field props
 * @param {string} props.id - Existing id attribute (optional)
 * @param {string} props.name - Existing name attribute (optional)
 * @param {string} prefix - Prefix for generating unique ID if needed
 * @returns {Object} Props object with guaranteed id and name attributes
 * 
 * @example
 * ensureFieldAttributes({ value: 'test' }, 'contact-name')
 * // Returns: { value: 'test', id: 'contact-name-1703123456789-a3b5c7d9e', name: 'contact-name-1703123456789-a3b5c7d9e' }
 * 
 * @example
 * ensureFieldAttributes({ id: 'existing-id', value: 'test' }, 'contact-name')
 * // Returns: { id: 'existing-id', value: 'test', name: 'existing-id' }
 */
export const ensureFieldAttributes = (props = {}, prefix) => {
  if (!props || typeof props !== 'object') {
    throw new Error('Props must be an object');
  }
  
  const result = { ...props };
  
  // Generate id if missing
  if (!result.id) {
    if (!prefix) {
      // Try to derive prefix from name if available
      prefix = result.name || 'field';
    }
    result.id = generateUniqueId(prefix);
  }
  
  // Generate name if missing (use id as fallback)
  if (!result.name) {
    result.name = result.id;
  }
  
  return result;
};

/**
 * Validate that a form field element has required attributes
 * 
 * @param {HTMLElement|Object} element - Form field element or props object
 * @returns {Object} Validation result with isValid flag and missing attributes array
 * 
 * @example
 * validateFieldAttributes({ id: 'test', name: 'test' })
 * // Returns: { isValid: true, missing: [] }
 * 
 * @example
 * validateFieldAttributes({ id: 'test' })
 * // Returns: { isValid: false, missing: ['name'] }
 */
export const validateFieldAttributes = (element) => {
  if (!element) {
    return { isValid: false, missing: ['id', 'name'] };
  }
  
  const missing = [];
  
  // Check for id or name attribute
  const hasId = element.id !== undefined && element.id !== null && element.id !== '';
  const hasName = element.name !== undefined && element.name !== null && element.name !== '';
  
  if (!hasId && !hasName) {
    missing.push('id or name');
  } else {
    if (!hasId) missing.push('id');
    if (!hasName) missing.push('name');
  }
  
  return {
    isValid: missing.length === 0,
    missing
  };
};


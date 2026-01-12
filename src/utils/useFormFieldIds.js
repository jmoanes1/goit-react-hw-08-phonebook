/**
 * React Hook: useFormFieldIds
 * 
 * Custom React hook to generate and memoize unique form field IDs
 * using Unix timestamp-based identifiers.
 * 
 * @param {Object} fieldPrefixes - Object with field names as keys and prefixes as values
 * @returns {Object} Memoized object with unique IDs for each field
 * 
 * @example
 * const fieldIds = useFormFieldIds({
 *   name: 'contact-name',
 *   email: 'contact-email',
 *   phone: 'contact-phone'
 * });
 * 
 * // Use in JSX:
 * <input id={fieldIds.name} name="name" />
 * <input id={fieldIds.email} name="email" />
 */
import { useMemo } from 'react';
import { generateFieldIds } from './formFieldUtils';

export const useFormFieldIds = (fieldPrefixes) => {
  return useMemo(() => {
    return generateFieldIds(fieldPrefixes);
  }, []); // Empty dependency array - IDs are generated once per component instance
};

export default useFormFieldIds;


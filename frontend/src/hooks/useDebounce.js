import { useState, useEffect } from "react";
 
/**
 * Delays updating a value until the user stops typing.
 * Usage: const debouncedValue = useDebounce(value, 500);
 */
export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
 
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
 
    return () => clearTimeout(handler);
  }, [value, delay]);
 
  return debouncedValue;
}

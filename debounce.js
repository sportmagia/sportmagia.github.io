// @ts-check

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 *
 * @template T
 * @param {(...args: any[]) => T} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} [options] - The options object
 * @param {boolean} [options.leading=false] - Specify invoking on the leading edge of the timeout
 * @param {boolean} [options.trailing=true] - Specify invoking on the trailing edge of the timeout
 * @returns {(...args: any[]) => void} - Returns the new debounced function
 */
export function debounce(func, wait, options = {}) {
  const { leading = false, trailing = true } = options;

  /** @type {ReturnType<typeof setTimeout>|undefined} */
  let timeout;
  /** @type {any[]|undefined} */
  let lastArgs;
  /** @type {any|undefined} */
  let lastThis;
  /** @type {T|undefined} */
  let result;
  let isInvoked = false;

  /**
   * Clears the timeout and resets state
   */
  const clear = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = undefined;
    }
  };

  /**
   * Executes the function with the last known arguments
   * @returns {T|undefined}
   */
  const invoke = () => {
    if (lastArgs === undefined || lastThis === undefined) return undefined;
    result = func.apply(lastThis, lastArgs);
    lastArgs = undefined;
    lastThis = undefined;
    isInvoked = true;
    return result;
  };

  /**
   * The debounced function
   * @param {...any} args - Arguments to pass to the debounced function
   */
  function debounced(...args) {
    lastArgs = args;
    // @ts-ignore - 'this' is expected to be dynamic
    lastThis = this;

    // Handle leading edge invocation
    if (!timeout && leading && !isInvoked) {
      invoke();
    }

    clear();

    timeout = setTimeout(() => {
      // Handle trailing edge invocation
      if (trailing && (lastArgs || !isInvoked)) {
        invoke();
      }
      isInvoked = false;
      timeout = undefined;
    }, wait);
  }

  /**
   * Cancels the debounced function
   */
  debounced.cancel = clear;

  return debounced;
}

export default debounce;

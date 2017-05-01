'use strict';

const asyncIteratorSymbol = Symbol('asyncIterator');

/**
 * @typedef {Function<Promise<{value: Array, done: boolean}>>} NextFunction
 */

/**
 * Returns an asyncIterator implementation
 *
 * @returns {{ next: NextFunction }}
 *
 * @example
 *   var a = { prop1: true, prop2: { prop3: 'foo' } };
 *   a[Symbol.iterator] = objectIterator;
 *   for (let v of a) { console.log(v); }
 */
function asyncIterator() {
  let iter;
  if (typeof this.entries === 'function') {
    iter = this.entries();
    return {
      next: () => {
        const nextValue = iter.next();
        if (Array.isArray(nextValue.value)) {
          return Promise.all(nextValue.value)
            .then(result => ({
              value: result,
              done: nextValue.done
            }));
        }
        return Promise.resolve(nextValue);
      }
    }
  } else if (typeof this === 'object') {
    iter = Object.getOwnPropertyNames(this)[Symbol.iterator]();
    return {
      next: () => {
        const key = iter.next();
        const value = key.value ? this[key.value] : undefined;
        // Return a value that's compatible with Array.prototype.entries()
        return Promise.all([key.value, value, key.done])
          .then(result => ({
            value: result[0] ? [result[0], result[1]] : undefined,
            done: result[2]
          }));
      }
    }
  } else {
    return singleValueIterator(this);
  }
}

function singleValueIterator(value) {
  let done = false;
  return {
    next: () => {
      let ret = {
        value: [void 0, void 0],
        done
      };

      if (!done) {
        // Return a value that's compatible with Array.prototype.entries()
        ret.value = [void 0, value],
          done = true;
      }

      return Promise.resolve(ret);
    }
  }
}

function addToObjectPrototype() {
  Object.prototype[asyncIteratorSymbol] = asyncIterator;
}

module.exports = {
  addToObjectPrototype,
  asyncIterator,
  asyncIteratorSymbol,
  singleValueIterator
};

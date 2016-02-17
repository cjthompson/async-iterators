"use strict";

/**
 * Check if something implements the Symbol.iterator interface
 * @param {*} obj The object to check
 * @returns {boolean} Returns TRUE if Symbol.iterator exists
 */
function isIterable (obj) {
  if (obj == null) return false;
  return obj[Symbol.iterator] !== void 0;
}

/**
 * Returns an iterator implementation
 *
 * @example
 *   var a = { prop1: true, prop2: { prop3: 'foo' } };
 *   a[Symbol.iterator] = objectIterator;
 *   for (let v of a) { console.log(v); }
 */
function objectIterator () {
  if (typeof this.entries === 'function') {
    return this.entries();
  }
  if (typeof this === 'object') {
    let iter = Object.getOwnPropertyNames(this)[Symbol.iterator]();
    return {
      next: () => {
        let key = iter.next();
        let value = this[key.value];
        // Return a value that's compatible with Array.prototype.entries()
        return { value: [key.value, value], done: key.done };
      }
    }
  } else {
    let done = false;
    return {
      next: () => {
        if (!done) {
          // Return a value that's compatible with Array.prototype.entries()
          let ret = { value: [void 0, this], done: false };
          done = true;
          return ret;
        } else {
          return { value: void 0, done: true };
        }
      }
    }
  } 
}

/**
 * Iterator over any iterable, calling `fn` on each value
 *
 * @params {*} obj       Any object that implements Symbol.iterator
 * @params {Function} fn A function to act on each value. Can return a promise.
 * @returns {Promise} Returns a promise that resolves when the loop has completed
 */
function forEach (obj, fn) {
  var iter;
  if (typeof obj === 'object') {
    iter = objectIterator.call(obj);
  } else {
    return Promise.resolve(fn(obj, void 0, obj));
  }

  return new Promise(function (resolve, reject) {
    var current = iter.next();
    if (current.done) { resolve(); } else {
      (function loop () {
        function next () {
          current = iter.next();
          if (current.done) { resolve(); } else { loop(); }
        }
        setImmediate(function () {
          let val, key;
          if (current.value && current.value.length === 2) {
            key = current.value[0];
            val = current.value[1];
          } else {
            val = current.value;
          }
          Promise.resolve(fn(val, key, obj)).then(next).catch(reject);
        });
      })();
    }
  });
};

module.exports = {
  forEach
};

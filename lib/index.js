"use strict";

/**
 * Returns an iterator implementation
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
        return Promise.resolve(iter.next());
      }
    }
  } else if (typeof this === 'object') {
    iter = Object.getOwnPropertyNames(this)[Symbol.iterator]();
    return {
      next: () => {
        const key = iter.next();
        const value = this[key.value];
        // Return a value that's compatible with Array.prototype.entries()
        return Promise.resolve({
          value: [key.value, value],
          done: key.done
        });
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

function iterate(obj, fn, initAccum) {
  const iter = asyncIterator.call(obj);

  return new Promise((resolve, reject) => {
    (function next(prevResult) {
      setImmediate(() => {
        iter.next().then(result => {
          if (result.done) {
            return resolve(prevResult);
          }

          let val, key;
          if (result.value) {
            key = result.value[0];
            val = result.value[1];
          }
          
          try {
            next(fn(prevResult, val, key, obj));
          } catch (e) {
            return reject(e);
          }
        });
      })
    })(initAccum);
  });
}
/**
 * Iterator over any iterable, calling `fn` on each value
 *
 * @params {*} obj       Any object that implements Symbol.iterator
 * @params {Function} fn A function to act on each value. Can return a promise.
 * @returns {Promise} Returns a promise that resolves when the loop has completed
 */
function forEach(obj, fn) {
  return iterate(obj, (a, v, k, o) => {
    fn(v, k, o);
  });
};

/**
 * Iterator over any iterable, calling `fn` on each value
 *
 * @params {*} obj       Any object that implements Symbol.iterator
 * @params {Function} fn A function to act on each value. Can return a promise.
 * @returns {Promise} Returns a promise that resolves when the loop has completed
 */
function map(obj, fn) {
  const result = new Array(obj.length);
  let index = 0;

  return iterate(obj, (a, v, k, o) => {
    a[index++] = fn(v, k, o);
    return a;
  }, result);
};

function reduce(obj, fn, initAccum) {
  return iterate(obj, fn, initAccum);
}

function transform(obj, fn, initAccum) {
  return iterate(obj, (a, v, k, o) => {
    fn(a, v, k, o);
    return a;
  }, initAccum || {});
}

module.exports = {
  asyncIterator,
  forEach,
  map,
  reduce,
  transform
};

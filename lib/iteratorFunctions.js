"use strict";

const a = require('./asyncIterator');

function iterate(obj, fn, initAccum) {
  const iter = (obj[a.asyncIteratorSymbol] || a.asyncIterator).call(obj);

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
            const iterateeResult = fn(prevResult, val, key, obj);
            if (iterateeResult instanceof Promise) {
              iterateeResult.then(next).catch(reject);
            } else {
              next(iterateeResult);
            }
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
  return iterate(obj, (a, v, k, o) => fn(v, k, o));
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
    const i = fn(v, k, o);
    if (i instanceof Promise) {
      return i.then(r => { a[index++] = r; return a; });
    }
    a[index++] = i;
    return a;
  }, result);
};

function reduce(obj, fn, initAccum) {
  return iterate(obj, fn, initAccum);
}

function transform(obj, fn, initAccum) {
  return iterate(obj, (a, v, k, o) => {
    const i = fn(a, v, k, o);
    if (i instanceof Promise) {
      return i.then(() => a);
    }
    return a;
  }, initAccum || {});
}

module.exports = {
  forEach,
  map,
  reduce,
  transform
};

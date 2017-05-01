# async-iterators
`async-iterators` is a library designed to provide iterator functions that run each loop of the iterator asynchronously.  This allows you to run CPU intensive loops without blocking the event loop or Promise-based functions in sequenece.

The library implements the proposed ECMAScript async iterators functionality by using a custom iterator where `next()` returns a `Promise` of the value.  See [Asynchronous Iterators for JavaScript](https://github.com/tc39/proposal-async-iteration).

This library exposes an async iterator function along with a Symbol that can be used to attach the iterator to any object.

In addition to the iterator, there are `map`, `reduce`, and `transform` functions that utilize the async iterator to break up these normally synchronous operations up by using `setImmediate` around each loop iteration.
To prevent blocking the event loop, each `iterator.next()` function is called within a `setImmediate`.

## Dependencies
`async-iterators` has no external dependencies.  It is written using ES6 syntax compatible with node 4.x and higher.

## asyncIterator
`async-Iterators` exports `asyncIterator` function and `asyncIteratorSymbol`, which can be used for custom iteration.

### Example
```javascript
const asyncIterator = require('async-iterators');
asyncIterator.addToObjectPrototype(); // = Object.prototype[asyncIteratorSymbol] = asyncIterator;

const transformObj = {
  a: 1,
  b: 2,
  c: 3
};


function transform(obj) {
  const iterator = obj[asyncIterator.asyncIteratorSymbol]();

  return new Promise((resolve, reject) => {
    let sum = 0;
    let keys = '';

    function loop() {
      iterator.next().then(result => {
        if (!result.done) {
          keys += result.value[0];
          sum += result.value[1];
          loop();
        } else {
          resolve({ keys, sum });
        }
      })
      .catch(reject);
    }
    
    loop();
  });
}

async function doIt() {
  return await transform(transformObj);
}

doIt().then(result => console.log({ sum, keys }));
// { keys: 'abc', sum: 6 }
```

### Promises
`asyncIterator.next()` will return the resolved value of Promises that are values in the iterable. Using the same code as above:

```javascript
const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

transform(promises).then(result => console.log({ sum, keys }));
// { keys: '012', sum: 6 }
```

So, in the `loop` function, we can call `result.value[1]` and get the value rather than the Promise, since `next()` doesn't resolve until the value of the iterator resolves.

An example use case may be calling out to multiple APIs to collect data, but then needing to process the responses in a specific order as part of a transform.  You can have all the promises fire off asyncronously, but the transform would still loop in order as each promise resolves.

## Avoid blocking the event loop with: forEach, map, reduce, transform
The most common use cases for iterating are a simple loop (`forEach`), or doing transforms using `map` or `reduce`.  This library provides implementations of these common iteration functions using an `asyncIterator`.  These functions support objects and arrays.

These functions use `setImmediate` to fire off each cycle of the loop in order to avoid blocking the event loop.  This does add overhead, but it's very useful to avoid blocking the event loop with CPU intensive transformations.  They also facilitate using these transforms over arrays or objects of Promises.

These functions automatically use `asyncIterator`, so there's no need to call `asyncIterator.addToObjectPrototype` or add the iterator manually.

### forEach
`forEach` iterates over an array or object but does not return a value.

Signature: `forEach(obj: Iterable, (value, key, obj) => {}): void`

```javascript
const forEach = require('async-iterators').forEach;

const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

let sum = 0;
forEach(promises, v => sum += v)
  .then(() => console.log(sum));
// 6
```

### map
`map` iterates over an array or object and returns an array with the result of each iteration of the loop.  This is the same as `Array.prototype.map` or `lodash.map`.

Signature: `map(obj: Iterable, (value, key, obj) => {}): Array`

```javascript
const map = require('async-iterators').map;

const obj = { a: 1, b: 2, c: 3};

const result = map(obj, (v, k) => v + k)
  .then(arr => console.log(arr));
// [ '1a', '2b', '3c' ]
```

### reduce
`reduce` iterates over an array. The `iteratee` function accepts an accumulator value as the first argument and must return a value to be used as the accumulator for the next iteration, or at the end, as the result of the loop.

Signature: `reduce(obj: Iterable, (accumulator, value, key, obj) => {}): any`

```javascript
const reduce = require('async-iterators').reduce;

const obj = { a: 1, b: 2, c: 3 };

const result = reduce(obj, (accum, v, k) => accum + v + k, '').
  then(result => console.log(`result: ${result}`));
// '1a2b3c'
```

### transform
`transform` is based on `reduce`, except that the initial accumulator defaults to an empty object, and iteratee function doesn't have to return the object in each loop.  The iterator is mutated during the loop and then returned.

Signature: `transform(obj: Iterable, (accumulator, value, key, obj) => {}): object`

```javascript
const transform = require('async-iterators').transform;

const obj = { a: 1, b: 2, c: 3 };

const result = transform(obj, (accum, v, k) => v > 1 ? accum[k.toUpperCase()] = v * 2 : undefined).
  then(result => console.log('result:', result));
// result: { B: 4, C: 6 }
```

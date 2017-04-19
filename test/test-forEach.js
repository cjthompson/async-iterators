"use strict";

require('must');
const forEach = require('../lib').forEach;
const map = require('../lib').map;
const transform = require('../lib').transform;
const reduce = require('../lib').reduce;

describe('Async forEach', function () {
  it('should be async', function () {
    const test = new Array(20000);
    let index = 0;
    const interval = setInterval(() => index++, 1);
    return forEach(test, (v,k) => { test[k] = k + (test[k-1] || 1); })
      .then(result => {
        clearInterval(interval);
        index.must.be.gt(50);
      });
  });

  it('should iterate an array with keys and values', function () {
    return forEach([1,2,3,4], (v,k) => { v.must.equal(k + 1); });
  });

  it('should mutate an external variable', function () {
    let sum = 0;
    return forEach([1,2,3,4], v => sum += v)
      .then(result => sum.must.equal(10));
  });

  it('should iterate an object with keys and values', function () {
    return forEach({a: 'a', b: 'b', c: 'c'}, (v,k) => { v.must.equal(k); });
  });

  it('should iterate an object with numeric keys', function () {
    return forEach({1: 1, 2: 2, 3: 3}, (v,k) => { v.must.equal(Number(k)); });
  });

  it('should iterate an object with non-enumerable values', function () {
    return forEach({a: true, b: 1, c: new Date(), d: /test/}, _ => {});
  });

  it('should iterate a nested object with keys and values', function () {
    return forEach({a: 'a', b: { b1: 'b1', b2: 'b2', 3: '3' }, c: [0,1,2]}, (v,k) => {
      return forEach((typeof v === 'object') ? v : {[k]: v}, (v2,k2) => {
        v2.must.equal(k2);
      });
    });
  });
});

describe('Async map', function () {
  it('should iterate an array with keys and values', function () {
    return map([1,2,3,4], (v,k) => v.must.equal(k + 1));
  });

  it('should return an array without mutating the source array', function () {
    const source = [1,2,3];
    return map(source, (v) => v * 2)
      .then(result => {
        result.must.eql([2, 4, 6]);
        source.must.eql([1, 2, 3]);
      });
  });

  it('should iterate an object with keys and values', function () {
    return map({a: 'a', b: 'b', c: 'c'}, (v,k) => v + k);
  });

  it('should return an array without mutating the source object', function () {
    const source = { a: 1, b: 2, c: 3 };
    return map(source, (v) => v * 2)
      .then(result => {
        result.must.eql([2, 4, 6]);
        source.must.eql({ a: 1, b: 2, c: 3 });
      });
  });

  it('should iterate an object with numeric keys', function () {
    const source = {1: 1, 2: 2, 3: 3};
    return map(source, (v,k) => { 
      v.must.equal(Number(k));
      return v * 2;
    })
      .then(result => {
        result.must.eql([2, 4, 6]);
        source.must.eql({ "1": 1, "2": 2, "3": 3 });        
      })
  });

  it('should iterate an object with non-enumerable values', function () {
    return map({a: true, b: 1, c: [1,2], d: /test/}, v => String(v))
      .then(result => {
        result.must.eql([ 'true', '1', '1,2', '/test/']);
      });
  });

  it('should iterate an array with keys and values', function () {
    const start = [1,2,3,4];
    return map(start, (v,k) => v * 2)
    .then(result => {
      result.must.eql([2,4,6,8]);
      start.must.eql([1,2,3,4]);
    });
  });
});

describe('Async transform', function () {
  it('should transform an array with keys and values', function () {
    return transform([1,2,3,4], (a, v, k) => {
      a[v] = k;
    }, {})
      .then(result => {
        result.must.eql({ '1': 0, '2': 1, '3': 2, '4': 3 });
      })
  });

  it('should transform an array without mutating the source array', function () {
    const source = [1,2,3];
    return transform(source, (a, v) => a.push(v * 2), [])
      .then(result => {
        result.must.eql([2, 4, 6]);
        source.must.eql([1, 2, 3]);
      });
  });

  it('should transform an object with keys and values', function () {
    return transform({a: true, b: 'b', c: true}, (a, v, k) => v === true ?  a[k] = 'hi' : undefined, {})
      .then(result => {
        result.must.eql({ a: 'hi', c: 'hi' });
      });
  });

  it('should iterate an object with numeric keys', function () {
    const source = {1: 1, 2: 2, 3: 3};
    return transform(source, (a, v, k) => {
      a[k] = v * 2;
    })
      .then(result => {
        result.must.eql({ 1: 2, 2: 4, 3: 6 });
        source.must.eql({ "1": 1, "2": 2, "3": 3 });        
      })
  });

  it('should iterate an object with non-enumerable values', function () {
    return transform({a: true, b: 1, c: [1, 2], d: /test/}, (a, v, k) => a[String(v)] = v)
      .then(result => {
        result.must.eql({ '1': 1, 'true': true, '1,2': [1, 2], '/test/': /test/ });
      });
  });

  it('should iterate an array with keys and values', function () {
    const start = [1,2,3,4];
    const keys = ['a', 'b', 'c', 'd'];
    return transform(start, (a, v, k) => a[keys[k]] = v * 2, {})
    .then(result => {
      result.must.eql({ a: 2, b: 4, c: 6, d: 8 });
      start.must.eql([1,2,3,4]);
    });
  });
});

describe('Async reduce', function () {
    it('should return the sum of object key values', function () {
    const source = { a: 1, b: 2, c: 3 };
    return reduce(source, (a, v, k) => a + v, 0)
      .then(result => {
        result.must.eql(6);
        source.must.eql({ a: 1, b: 2, c: 3 });
      });
  });
});

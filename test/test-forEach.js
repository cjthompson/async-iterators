"use strict";

var forEach = require('../src').forEach;

describe('Async For Each', function () {
  it('should iterate an array with keys and values', function () {
    return forEach([1,2,3,4], (v,k) => { v.must.equal(k + 1); });
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


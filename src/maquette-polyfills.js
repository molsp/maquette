(function (global) {

  "use strict";

  // polyfill for window.requestAnimationFrame
  var haveraf = function(vendor) {
    return global.requestAnimationFrame && global.cancelAnimationFrame ||
      (
        (global.requestAnimationFrame = global[vendor + 'RequestAnimationFrame']) &&
        (global.cancelAnimationFrame = (global[vendor + 'CancelAnimationFrame'] ||
                                        global[vendor + 'CancelRequestAnimationFrame']))
      );
  };

  if (!haveraf('webkit') && !haveraf('moz') ||
      /iP(ad|hone|od).*OS 6/.test(global.navigator.userAgent)) { // buggy iOS6

    // Closures
    var now = Date.now || function() { return +new Date(); };   // pre-es5
    var lastTime = 0;

    // Polyfills
    global.requestAnimationFrame = function(callback) {
      var nowTime = now();
      var nextTime = Math.max(lastTime + 16, nowTime);
      return setTimeout(function() {
          callback(lastTime = nextTime);
        }, nextTime - nowTime);
    };
    global.cancelAnimationFrame = clearTimeout;
  }

  // polyfill for Array.isArray
  if(!Array.isArray) {
    Array.isArray = function (arg) {
      return Object.prototype.toString.call(arg) === '[object Array]';
    };
  }
  
  // Polyfill for Object.Keys
  // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
  if(!Object.keys) {
    Object.keys = (function () {
      'use strict';
      var hasOwnProperty = Object.prototype.hasOwnProperty,
          hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
          dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
          ],
          dontEnumsLength = dontEnums.length;

      return function (obj) {
        if(typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
          throw new TypeError('Object.keys called on non-object');
        }

        var result = [], prop, i;

        for(prop in obj) {
          if(hasOwnProperty.call(obj, prop)) {
            result.push(prop);
          }
        }

        if(hasDontEnumBug) {
          for(i = 0; i < dontEnumsLength; i++) {
            if(hasOwnProperty.call(obj, dontEnums[i])) {
              result.push(dontEnums[i]);
            }
          }
        }
        return result;
      };
    }());
  }

  // Polyfill for Array.prototype.forEach
  // Production steps of ECMA-262, Edition 5, 15.4.4.18
  // Reference: http://es5.github.io/#x15.4.4.18
  if(!Array.prototype.forEach) {

    Array.prototype.forEach = function (callback, thisArg) {

      var T, k;

      if(this == null) {
        throw new TypeError(' this is null or not defined');
      }

      // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If IsCallable(callback) is false, throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if(typeof callback !== "function") {
        throw new TypeError(callback + ' is not a function');
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if(arguments.length > 1) {
        T = thisArg;
      }

      // 6. Let k be 0
      k = 0;

      // 7. Repeat, while k < len
      while(k < len) {

        var kValue;

        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if(k in O) {

          // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
          kValue = O[k];

          // ii. Call the Call internal method of callback with T as the this value and
          // argument list containing kValue, k, and O.
          callback.call(T, kValue, k, O);
        }
        // d. Increase k by 1.
        k++;
      }
      // 8. return undefined
    };
  }
  
  // Polyfill for textContent
  if(!("textContent" in document.documentElement)) {

    (function (createElement) {

      var onPropertyChange = function (e) {

        if(e.propertyName === "textContent") {
          e.srcElement.innerText = e.srcElement.textContent;
        }
      };
      
      // In Maquette all dom is created with document.createElement
      // override this function to add the textContent property
      document.createElement = function (tagName) {
        var element = createElement(tagName);
        element.textContent = "";
        element.attachEvent("onpropertychange", onPropertyChange);
        return element;
      };

    })(document.createElement);
  }

  // polyfill for classList
  if(!("classList" in document.documentElement)) {

    (function (join, splice, createElement) {

      function tokenize(token) {
        if(/^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/.test(token)) {
          return String(token);
        } else {
          throw new Error('InvalidCharacterError: DOM Exception 5');
        }
      }

      function toObject(self) {
        for(var index = -1, object = {}, element; element = self[++index];) {
          object[element] = true;
        }

        return object;
      }

      function fromObject(self, object) {
        var array = [], token;

        for(token in object) {
          if(object[token]) {
            array.push(token);
          }
        }

        splice.apply(self, [0, self.length].concat(array));
      }
      
      // In Maquette all dom is created with document.createElement
      // override this function to add classList functionality
      document.createElement = function (tagName) {
        var element = createElement(tagName);
        var classList = [];
        element.classList = {
          add: function () {

            for(var object = toObject(classList), index = 0, token; index in arguments; ++index) {
              token = tokenize(arguments[index]);

              object[token] = true;
            }

            fromObject(classList, object);

            element.className = join.call(classList, '');
          },
          remove: function () {

            for(var object = toObject(classList), index = 0, token; index in arguments; ++index) {
              token = tokenize(arguments[index]);

              object[token] = false;
            }

            fromObject(classList, object);

            element.className = join.call(classList, '');
          }
        }
        return element;
      };

    }(Array.prototype.join, Array.prototype.splice, document.createElement));
  }

})(this);

/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 6163:
/***/ ((module) => {

module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  }

  return it;
};

/***/ }),

/***/ 2569:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(794);

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  }

  return it;
};

/***/ }),

/***/ 5766:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toIndexedObject = __webpack_require__(2977);

var toLength = __webpack_require__(97);

var toAbsoluteIndex = __webpack_require__(6782); // `Array.prototype.{ indexOf, includes }` methods implementation


var createMethod = function createMethod(IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value; // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check

    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++]; // eslint-disable-next-line no-self-compare -- NaN check

      if (value != value) return true; // Array#indexOf ignores holes, Array#includes - not
    } else for (; length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    }
    return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

/***/ }),

/***/ 9624:
/***/ ((module) => {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

/***/ }),

/***/ 3058:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(8191);

var classofRaw = __webpack_require__(9624);

var wellKnownSymbol = __webpack_require__(3649);

var TO_STRING_TAG = wellKnownSymbol('toStringTag'); // ES3 wrong here

var CORRECT_ARGUMENTS = classofRaw(function () {
  return arguments;
}()) == 'Arguments'; // fallback for IE11 Script Access Denied error

var tryGet = function tryGet(it, key) {
  try {
    return it[key];
  } catch (error) {
    /* empty */
  }
}; // getting tag from ES6+ `Object.prototype.toString`


module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null' // @@toStringTag case
  : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag // builtinTag case
  : CORRECT_ARGUMENTS ? classofRaw(O) // ES3 arguments fallback
  : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

/***/ }),

/***/ 3478:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(4402);

var ownKeys = __webpack_require__(929);

var getOwnPropertyDescriptorModule = __webpack_require__(6683);

var definePropertyModule = __webpack_require__(4615);

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

/***/ }),

/***/ 57:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8494);

var definePropertyModule = __webpack_require__(4615);

var createPropertyDescriptor = __webpack_require__(4677);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

/***/ }),

/***/ 4677:
/***/ ((module) => {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

/***/ }),

/***/ 5999:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var toPrimitive = __webpack_require__(2670);

var definePropertyModule = __webpack_require__(4615);

var createPropertyDescriptor = __webpack_require__(4677);

module.exports = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) definePropertyModule.f(object, propertyKey, createPropertyDescriptor(0, value));else object[propertyKey] = value;
};

/***/ }),

/***/ 8494:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(6544); // Detect IE8's incomplete defineProperty implementation


module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, {
    get: function get() {
      return 7;
    }
  })[1] != 7;
});

/***/ }),

/***/ 6668:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var isObject = __webpack_require__(794);

var document = global.document; // typeof document.createElement is 'object' in old IE

var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

/***/ }),

/***/ 6918:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(5897);

module.exports = getBuiltIn('navigator', 'userAgent') || '';

/***/ }),

/***/ 4061:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var userAgent = __webpack_require__(6918);

var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);

  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

module.exports = version && +version;

/***/ }),

/***/ 5690:
/***/ ((module) => {

// IE8- don't enum bug keys
module.exports = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

/***/ }),

/***/ 7263:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var global = __webpack_require__(7583);

var getOwnPropertyDescriptor = __webpack_require__(6683).f;

var createNonEnumerableProperty = __webpack_require__(57);

var redefine = __webpack_require__(1270);

var setGlobal = __webpack_require__(460);

var copyConstructorProperties = __webpack_require__(3478);

var isForced = __webpack_require__(4451);
/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/


module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;

  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }

  if (target) for (key in source) {
    sourceProperty = source[key];

    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];

    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced); // contained in target

    if (!FORCED && targetProperty !== undefined) {
      if (_typeof(sourceProperty) === _typeof(targetProperty)) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    } // add a flag to not completely full polyfills


    if (options.sham || targetProperty && targetProperty.sham) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    } // extend global


    redefine(target, key, sourceProperty, options);
  }
};

/***/ }),

/***/ 6544:
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

/***/ }),

/***/ 2938:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var aFunction = __webpack_require__(6163); // optional / simple context binding


module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;

  switch (length) {
    case 0:
      return function () {
        return fn.call(that);
      };

    case 1:
      return function (a) {
        return fn.call(that, a);
      };

    case 2:
      return function (a, b) {
        return fn.call(that, a, b);
      };

    case 3:
      return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
  }

  return function ()
  /* ...args */
  {
    return fn.apply(that, arguments);
  };
};

/***/ }),

/***/ 5897:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(1287);

var global = __webpack_require__(7583);

var aFunction = function aFunction(variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace]) : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};

/***/ }),

/***/ 8272:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(3058);

var Iterators = __webpack_require__(339);

var wellKnownSymbol = __webpack_require__(3649);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
};

/***/ }),

/***/ 7583:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var check = function check(it) {
  return it && it.Math == Math && it;
}; // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028


module.exports = // eslint-disable-next-line es/no-global-this -- safe
check((typeof globalThis === "undefined" ? "undefined" : _typeof(globalThis)) == 'object' && globalThis) || check((typeof window === "undefined" ? "undefined" : _typeof(window)) == 'object' && window) || // eslint-disable-next-line no-restricted-globals -- safe
check((typeof self === "undefined" ? "undefined" : _typeof(self)) == 'object' && self) || check((typeof __webpack_require__.g === "undefined" ? "undefined" : _typeof(__webpack_require__.g)) == 'object' && __webpack_require__.g) || // eslint-disable-next-line no-new-func -- fallback
function () {
  return this;
}() || Function('return this')();

/***/ }),

/***/ 4402:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toObject = __webpack_require__(1324);

var hasOwnProperty = {}.hasOwnProperty;

module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty.call(toObject(it), key);
};

/***/ }),

/***/ 4639:
/***/ ((module) => {

module.exports = {};

/***/ }),

/***/ 275:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8494);

var fails = __webpack_require__(6544);

var createElement = __webpack_require__(6668); // Thank's IE8 for his funny defineProperty


module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function get() {
      return 7;
    }
  }).a != 7;
});

/***/ }),

/***/ 5044:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(6544);

var classof = __webpack_require__(9624);

var split = ''.split; // fallback for non-array-like ES3 and non-enumerable old V8 strings

module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

/***/ }),

/***/ 9734:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var store = __webpack_require__(1314);

var functionToString = Function.toString; // this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper

if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;

/***/ }),

/***/ 2743:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var NATIVE_WEAK_MAP = __webpack_require__(9491);

var global = __webpack_require__(7583);

var isObject = __webpack_require__(794);

var createNonEnumerableProperty = __webpack_require__(57);

var objectHas = __webpack_require__(4402);

var shared = __webpack_require__(1314);

var sharedKey = __webpack_require__(9137);

var hiddenKeys = __webpack_require__(4639);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function enforce(it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function getterFor(TYPE) {
  return function (it) {
    var state;

    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    }

    return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;

  set = function set(it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };

  get = function get(it) {
    return wmget.call(store, it) || {};
  };

  has = function has(it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;

  set = function set(it, metadata) {
    if (objectHas(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };

  get = function get(it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };

  has = function has(it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

/***/ }),

/***/ 114:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(3649);

var Iterators = __webpack_require__(339);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype; // check on default Array iterator

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};

/***/ }),

/***/ 4451:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(6544);

var replacement = /#|\.prototype\./;

var isForced = function isForced(feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true : value == NATIVE ? false : typeof detection == 'function' ? fails(detection) : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';
module.exports = isForced;

/***/ }),

/***/ 794:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

module.exports = function (it) {
  return _typeof(it) === 'object' ? it !== null : typeof it === 'function';
};

/***/ }),

/***/ 6268:
/***/ ((module) => {

module.exports = false;

/***/ }),

/***/ 4026:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var anObject = __webpack_require__(2569);

var isArrayIteratorMethod = __webpack_require__(114);

var toLength = __webpack_require__(97);

var bind = __webpack_require__(2938);

var getIteratorMethod = __webpack_require__(8272);

var iteratorClose = __webpack_require__(7093);

var Result = function Result(stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function stop(condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function callFn(value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    }

    return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable'); // optimisation for array iterators

    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      }

      return new Result(false);
    }

    iterator = iterFn.call(iterable);
  }

  next = iterator.next;

  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }

    if (_typeof(result) == 'object' && result && result instanceof Result) return result;
  }

  return new Result(false);
};

/***/ }),

/***/ 7093:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(2569);

module.exports = function (iterator) {
  var returnMethod = iterator['return'];

  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};

/***/ }),

/***/ 339:
/***/ ((module) => {

module.exports = {};

/***/ }),

/***/ 8640:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(4061);

var fails = __webpack_require__(6544); // eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing


module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol(); // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances

  return !String(symbol) || !(Object(symbol) instanceof Symbol) || // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
  !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});

/***/ }),

/***/ 9491:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var inspectSource = __webpack_require__(9734);

var WeakMap = global.WeakMap;
module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

/***/ }),

/***/ 4615:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8494);

var IE8_DOM_DEFINE = __webpack_require__(275);

var anObject = __webpack_require__(2569);

var toPrimitive = __webpack_require__(2670); // eslint-disable-next-line es/no-object-defineproperty -- safe


var $defineProperty = Object.defineProperty; // `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty

exports.f = DESCRIPTORS ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) {
    /* empty */
  }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

/***/ }),

/***/ 6683:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(8494);

var propertyIsEnumerableModule = __webpack_require__(112);

var createPropertyDescriptor = __webpack_require__(4677);

var toIndexedObject = __webpack_require__(2977);

var toPrimitive = __webpack_require__(2670);

var has = __webpack_require__(4402);

var IE8_DOM_DEFINE = __webpack_require__(275); // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe


var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor

exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) {
    /* empty */
  }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

/***/ }),

/***/ 9275:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(8356);

var enumBugKeys = __webpack_require__(5690);

var hiddenKeys = enumBugKeys.concat('length', 'prototype'); // `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

/***/ }),

/***/ 4012:
/***/ ((__unused_webpack_module, exports) => {

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;

/***/ }),

/***/ 8356:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(4402);

var toIndexedObject = __webpack_require__(2977);

var indexOf = __webpack_require__(5766).indexOf;

var hiddenKeys = __webpack_require__(4639);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;

  for (key in O) {
    !has(hiddenKeys, key) && has(O, key) && result.push(key);
  } // Don't enum bug & hidden keys


  while (names.length > i) {
    if (has(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
  }

  return result;
};

/***/ }),

/***/ 112:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var $propertyIsEnumerable = {}.propertyIsEnumerable; // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe

var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // Nashorn ~ JDK8 bug

var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({
  1: 2
}, 1); // `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable

exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;

/***/ }),

/***/ 929:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(5897);

var getOwnPropertyNamesModule = __webpack_require__(9275);

var getOwnPropertySymbolsModule = __webpack_require__(4012);

var anObject = __webpack_require__(2569); // all object keys, includes non-enumerable and symbols


module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

/***/ }),

/***/ 1287:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

module.exports = global;

/***/ }),

/***/ 1270:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var createNonEnumerableProperty = __webpack_require__(57);

var has = __webpack_require__(4402);

var setGlobal = __webpack_require__(460);

var inspectSource = __webpack_require__(9734);

var InternalStateModule = __webpack_require__(2743);

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(String).split('String');
(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var state;

  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) {
      createNonEnumerableProperty(value, 'name', key);
    }

    state = enforceInternalState(value);

    if (!state.source) {
      state.source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
  }

  if (O === global) {
    if (simple) O[key] = value;else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }

  if (simple) O[key] = value;else createNonEnumerableProperty(O, key, value); // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});

/***/ }),

/***/ 3955:
/***/ ((module) => {

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

/***/ }),

/***/ 460:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var createNonEnumerableProperty = __webpack_require__(57);

module.exports = function (key, value) {
  try {
    createNonEnumerableProperty(global, key, value);
  } catch (error) {
    global[key] = value;
  }

  return value;
};

/***/ }),

/***/ 9137:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var shared = __webpack_require__(7836);

var uid = __webpack_require__(8284);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

/***/ }),

/***/ 1314:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var setGlobal = __webpack_require__(460);

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});
module.exports = store;

/***/ }),

/***/ 7836:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var IS_PURE = __webpack_require__(6268);

var store = __webpack_require__(1314);

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.14.0',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});

/***/ }),

/***/ 6782:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(5089);

var max = Math.max;
var min = Math.min; // Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).

module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

/***/ }),

/***/ 2977:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(5044);

var requireObjectCoercible = __webpack_require__(3955);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

/***/ }),

/***/ 5089:
/***/ ((module) => {

var ceil = Math.ceil;
var floor = Math.floor; // `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger

module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

/***/ }),

/***/ 97:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(5089);

var min = Math.min; // `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength

module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

/***/ }),

/***/ 1324:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var requireObjectCoercible = __webpack_require__(3955); // `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject


module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};

/***/ }),

/***/ 2670:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(794); // `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string


module.exports = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

/***/ }),

/***/ 8191:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(3649);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};
test[TO_STRING_TAG] = 'z';
module.exports = String(test) === '[object z]';

/***/ }),

/***/ 8284:
/***/ ((module) => {

var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

/***/ }),

/***/ 7786:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(8640);

module.exports = NATIVE_SYMBOL && !Symbol.sham && _typeof(Symbol.iterator) == 'symbol';

/***/ }),

/***/ 3649:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(7583);

var shared = __webpack_require__(7836);

var has = __webpack_require__(4402);

var uid = __webpack_require__(8284);

var NATIVE_SYMBOL = __webpack_require__(8640);

var USE_SYMBOL_AS_UID = __webpack_require__(7786);

var WellKnownSymbolsStore = shared('wks');
var _Symbol = global.Symbol;
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? _Symbol : _Symbol && _Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!has(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (NATIVE_SYMBOL && has(_Symbol, name)) {
      WellKnownSymbolsStore[name] = _Symbol[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  }

  return WellKnownSymbolsStore[name];
};

/***/ }),

/***/ 5809:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(7263);

var iterate = __webpack_require__(4026);

var createProperty = __webpack_require__(5999); // `Object.fromEntries` method
// https://github.com/tc39/proposal-object-from-entries


$({
  target: 'Object',
  stat: true
}, {
  fromEntries: function fromEntries(iterable) {
    var obj = {};
    iterate(iterable, function (k, v) {
      createProperty(obj, k, v);
    }, {
      AS_ENTRIES: true
    });
    return obj;
  }
});

/***/ }),

/***/ 1662:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _wrapRegExp() { _wrapRegExp = function _wrapRegExp(re, groups) { return new BabelRegExp(re, undefined, groups); }; var _super = RegExp.prototype; var _groups = new WeakMap(); function BabelRegExp(re, flags, groups) { var _this = new RegExp(re, flags); _groups.set(_this, groups || _groups.get(re)); return _setPrototypeOf(_this, BabelRegExp.prototype); } _inherits(BabelRegExp, RegExp); BabelRegExp.prototype.exec = function (str) { var result = _super.exec.call(this, str); if (result) result.groups = buildGroups(result, this); return result; }; BabelRegExp.prototype[Symbol.replace] = function (str, substitution) { if (typeof substitution === "string") { var groups = _groups.get(this); return _super[Symbol.replace].call(this, str, substitution.replace(/\$<([^>]+)>/g, function (_, name) { return "$" + groups[name]; })); } else if (typeof substitution === "function") { var _this = this; return _super[Symbol.replace].call(this, str, function () { var args = arguments; if (_typeof(args[args.length - 1]) !== "object") { args = [].slice.call(args); args.push(buildGroups(args, _this)); } return substitution.apply(this, args); }); } else { return _super[Symbol.replace].call(this, str, substitution); } }; function buildGroups(result, re) { var g = _groups.get(re); return Object.keys(g).reduce(function (groups, name) { groups[name] = result[g[name]]; return groups; }, Object.create(null)); } return _wrapRegExp.apply(this, arguments); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Clan = exports.ClanError = void 0;

var tslib_1 = __webpack_require__(7622);

__webpack_require__(1030);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var logger_1 = tslib_1.__importDefault(__webpack_require__(8685));

var utils_1 = __webpack_require__(8588);

var ClanError =
/** @class */
function (_super) {
  tslib_1.__extends(ClanError, _super);

  function ClanError(message, reason) {
    var _this = _super.call(this, message) || this;

    _this.reason = reason;
    Object.setPrototypeOf(_this, ClanError.prototype);
    return _this;
  }

  return ClanError;
}(Error);

exports.ClanError = ClanError; // It would be fantastic to have this function properly typed
// But until someone can work out how to do it, it gets the
// comment blocks of shame

/* eslint-disable */

function validate(target, propertyName, descriptor) {
  if (!(descriptor === null || descriptor === void 0 ? void 0 : descriptor.value)) return;
  var method = descriptor.value; // @ts-ignore

  descriptor.value = function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    } // @ts-ignore


    if (this.id !== kolmafia_1.getClanId()) {
      throw new Error("You are no longer a member of this clan");
    }

    return method.apply(this, args);
  };
}
/* eslint-enable */


var clanIdCache = {};

var toPlayerId = function toPlayerId(player) {
  return typeof player === "string" ? kolmafia_1.getPlayerId(player) : player;
};

var LOG_FAX_PATTERN = /*#__PURE__*/_wrapRegExp(/([0-9]{2}\/[0-9]{2}\/[0-9]{2}, [0-9]{2}:[0-9]{2}(?:AM|PM): )<a (?:(?!>)[\s\S])+>((?:(?!<)[\s\S])+)<\/a>(?: faxed in a (.*?))<br>/, {
  monster: 3
});

var WHITELIST_DEGREE_PATTERN = /*#__PURE__*/_wrapRegExp(/(.*?) \(\xB0([0-9]+)\)/, {
  name: 1,
  degree: 2
});

var Clan =
/** @class */
function () {
  function Clan(id, name) {
    this.id = id;
    this.name = name;
  }

  Clan._join = function (id) {
    var result = kolmafia_1.visitUrl("showclan.php?recruiter=1&whichclan=" + id + "&pwd&whichclan=" + id + "&action=joinclan&apply=Apply+to+this+Clan&confirm=on");

    if (!result.includes("clanhalltop.gif")) {
      throw new Error("Could not join clan");
    }

    return Clan.get();
  };

  Clan._withStash = function (borrowFn, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  returnFn, // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback) {
    var borrowed = borrowFn();
    var map = utils_1.arrayToCountedMap(borrowed);

    try {
      return callback(borrowed);
    } finally {
      if (map.size > 0) {
        var returned_1 = utils_1.arrayToCountedMap(returnFn(borrowed));
        map.forEach(function (quantity, item) {
          var remaining = quantity - (returned_1.get(item) || 0);

          if (remaining > 0) {
            map.set(item, remaining);
          } else {
            map["delete"](item);
          }
        });

        if (map.size > 0) {
          logger_1["default"].error("Failed to return <b>" + utils_1.countedMapToString(map) + "</b> to <b>" + this.name + "</b> stash");
        }
      }
    }
  };
  /**
   * Join a clan and return its instance
   * @param clanIdOrName Clan id or name
   */


  Clan.join = function (clanIdOrName) {
    var clanId;

    if (typeof clanIdOrName === "string") {
      var clanName_1 = clanIdOrName.toLowerCase();

      if (clanName_1 === kolmafia_1.getClanName().toLowerCase()) {
        return Clan.get();
      }

      if (!(clanName_1 in clanIdCache)) {
        var clan = Clan.getWhitelisted().find(function (c) {
          return c.name.toLowerCase() === clanName_1;
        });

        if (!clan) {
          throw new Error("Player is not whitelisted to clan");
        }

        clanIdCache[clanName_1] = clan.id;
      }

      clanId = clanIdCache[clanName_1];
    } else {
      clanId = clanIdOrName;

      if (clanId === kolmafia_1.getClanId()) {
        return Clan.get();
      }
    }

    return Clan._join(clanId);
  };
  /**
   * Execute callback as a member of a clan
   * and then restore prior membership
   * @param clanIdOrName Clan id or name
   */


  Clan["with"] = function (clanIdOrName, callback) {
    var startingClan = Clan.get();
    var clan = Clan.join(clanIdOrName);

    try {
      return callback(clan);
    } finally {
      startingClan.join();
    }
  }; // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types


  Clan.withStash = function (clanIdOrName, items, callback) {
    return Clan._withStash(function () {
      return Clan["with"](clanIdOrName, function (clan) {
        return clan.take(items);
      });
    }, function (borrowed) {
      return Clan["with"](clanIdOrName, function (clan) {
        return clan.put(borrowed);
      });
    }, callback);
  };
  /**
   * Return player's current Clan
   */


  Clan.get = function () {
    return new Clan(kolmafia_1.getClanId(), kolmafia_1.getClanName());
  };
  /**
   * Get list of clans to which the player is whitelisted
   */


  Clan.getWhitelisted = function () {
    var page = kolmafia_1.visitUrl("clan_signup.php");
    return kolmafia_1.xpath(page, '//select[@name="whichclan"]//option').map(function (option) {
      var validHtml = "<select>" + option + "</select>";
      var id = Number.parseInt(kolmafia_1.xpath(validHtml, '//@value')[0]);
      var name = kolmafia_1.xpath(validHtml, '//text()')[0];
      return new Clan(id, name);
    });
  };
  /**
   * Join clan
   */


  Clan.prototype.join = function () {
    return Clan._join(this.id);
  };

  Clan.prototype.check = function () {
    return kolmafia_1.visitUrl("clan_hall.php").includes("<b>" + this.name + "</b>");
  };
  /**
   * Return the monster that is currently in the current clan's fax machine if any
   */


  Clan.prototype.getCurrentFax = function () {
    var logs = kolmafia_1.visitUrl("clan_log.php");
    var lastFax = logs.match(LOG_FAX_PATTERN);
    if (!lastFax) return null;

    var _a = tslib_1.__read(lastFax, 4),
        monsterName = _a[3];

    if (!monsterName) return null;
    return Monster.get(monsterName);
  };
  /**
   * List available ranks (name, degree and id) from the current clan
   */


  Clan.prototype.getRanks = function () {
    var page = kolmafia_1.visitUrl("clan_whitelist.php");
    return kolmafia_1.xpath(page, '//select[@name="level"]//option').map(function (option) {
      var validHtml = "<select>" + option + "</select>";
      var match = kolmafia_1.xpath(validHtml, '//text()')[0].match(WHITELIST_DEGREE_PATTERN);
      var id = kolmafia_1.xpath(validHtml, '//@value')[0];
      if (!match || !id) return null;

      var _a = tslib_1.__read(match, 3),
          name = _a[1],
          degree = _a[2];

      return {
        name: name,
        degree: Number.parseInt(degree),
        id: Number.parseInt(id)
      };
    }).filter(utils_1.notNull);
  };
  /**
   * Add a player to the current clan's whitelist.
   * If the player is already in the whitelist this will change their rank or title.
   * @param player Player id or name
   * @param rankName Rank to give the player. If not provided they will be given the lowest rank
   * @param title Title to give the player. If not provided, will be blank
   */


  Clan.prototype.addPlayerToWhitelist = function (player, rankName, title) {
    if (title === void 0) {
      title = "";
    }

    var playerId = toPlayerId(player);
    var ranks = this.getRanks();
    var rank = rankName ? ranks.find(function (r) {
      return r.name === rankName;
    }) : ranks.sort(function (a, b) {
      return a.degree - b.degree;
    })[0];
    if (!rank) return false;
    var result = kolmafia_1.visitUrl("clan_whitelist.php?action=add&pwd&addwho=" + playerId + "&level=" + rank.id + "&title=" + title);
    return result.includes("added to whitelist.") || result.includes("That player is already on the whitelist");
  };
  /**
   * Remove a player from the current clan's whitelist
   * @param player Player id or name
   */


  Clan.prototype.removePlayerFromWhitelist = function (player) {
    var playerId = toPlayerId(player);
    var result = kolmafia_1.visitUrl("clan_whitelist.php?action=updatewl&pwd&who=" + playerId + "&remove=Remove");
    return result.includes("Whitelist updated.");
  };
  /**
   * Return the amount of meat in the current clan's coffer.
   */


  Clan.prototype.getMeatInCoffer = function () {
    var page = kolmafia_1.visitUrl("clan_stash.php");

    var _a = tslib_1.__read(page.match(/Your <b>Clan Coffer<\/b> contains ([\d,]+) Meat./) || ["0", "0"], 2),
        meat = _a[1];

    return utils_1.parseNumber(meat);
  };
  /**
   * Add the given amount of meat to the current clan's coffer.
   * @param amount Amount of meat to put in coffer
   */


  Clan.prototype.putMeatInCoffer = function (amount) {
    var result = kolmafia_1.visitUrl("clan_stash.php?pwd&action=contribute&howmuch=" + amount);
    return result.includes("You contributed");
  };

  Clan.prototype.take = function (items) {
    var map = utils_1.arrayToCountedMap(items);
    map.forEach(function (quantity, item) {
      var e_1, _a, e_2, _b;

      var needed = Math.max(0, quantity - kolmafia_1.availableAmount(item));

      if (needed === 0) {
        return map.set(item, 0);
      }

      var foldGroup = lib_1.getFoldGroup(item);

      try {
        for (var foldGroup_1 = tslib_1.__values(foldGroup), foldGroup_1_1 = foldGroup_1.next(); !foldGroup_1_1.done; foldGroup_1_1 = foldGroup_1.next()) {
          var foldable = foldGroup_1_1.value;
          var quantityToFold = Math.min(needed, kolmafia_1.availableAmount(foldable));

          for (var i = 0; i < quantityToFold; i++) {
            kolmafia_1.cliExecute("fold " + item.name);
            needed--;
          }

          return map.set(item, needed);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (foldGroup_1_1 && !foldGroup_1_1.done && (_a = foldGroup_1["return"])) _a.call(foldGroup_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }

      kolmafia_1.refreshStash();

      try {
        for (var _c = tslib_1.__values(tslib_1.__spread([item], foldGroup)), _d = _c.next(); !_d.done; _d = _c.next()) {
          var matchingItem = _d.value;
          var quantityToTake = Math.min(needed, kolmafia_1.stashAmount(matchingItem));
          if (quantityToTake === 0) continue; // If we can't take from the stash, there's no sense in iterating through the whole fold group

          if (!kolmafia_1.takeStash(quantityToTake, matchingItem)) return;

          if (matchingItem === item) {
            needed -= quantityToTake;
          } else {
            for (var i = 0; i < quantityToTake; i++) {
              kolmafia_1.cliExecute("fold " + matchingItem.name);
              needed--;
            }
          }
        }
      } catch (e_2_1) {
        e_2 = {
          error: e_2_1
        };
      } finally {
        try {
          if (_d && !_d.done && (_b = _c["return"])) _b.call(_c);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
    });
    return Array.isArray(items) ? utils_1.countedMapToArray(map) : map;
  };

  Clan.prototype.put = function (items) {
    var map = utils_1.arrayToCountedMap(items);
    if (!this.check()) throw new Error("Wanted to return " + utils_1.countedMapToString(map) + " to " + this.name + " but KoLmafia's clan data is out of sync");
    map.forEach(function (quantity, item) {
      kolmafia_1.retrieveItem(quantity, item);
      var returned = Math.min(quantity, kolmafia_1.availableAmount(item));
      kolmafia_1.putStash(returned, item);
      map.set(item, quantity - returned);
    });
    return Array.isArray(items) ? utils_1.countedMapToArray(map) : map;
  }; // eslint-disable-next-line @typescript-eslint/no-explicit-any


  Clan.prototype.withStash = function (items, callback) {
    var _this = this;

    var map = utils_1.arrayToCountedMap(items);
    return Clan._withStash(function () {
      return _this.take(map);
    }, function (borrowed) {
      return _this.put(borrowed);
    }, callback);
  };

  tslib_1.__decorate([validate], Clan.prototype, "getCurrentFax", null);

  tslib_1.__decorate([validate], Clan.prototype, "getRanks", null);

  tslib_1.__decorate([validate], Clan.prototype, "addPlayerToWhitelist", null);

  tslib_1.__decorate([validate], Clan.prototype, "removePlayerFromWhitelist", null);

  tslib_1.__decorate([validate], Clan.prototype, "getMeatInCoffer", null);

  tslib_1.__decorate([validate], Clan.prototype, "putMeatInCoffer", null);

  tslib_1.__decorate([validate], Clan.prototype, "take", null);

  tslib_1.__decorate([validate], Clan.prototype, "put", null);

  tslib_1.__decorate([validate], Clan.prototype, "withStash", null);

  return Clan;
}();

exports.Clan = Clan;

/***/ }),

/***/ 2219:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Copier = void 0;

var Copier =
/** @class */
function () {
  function Copier(couldCopy, prepare, canCopy, copiedMonster, fightCopy) {
    this.fightCopy = null;
    this.couldCopy = couldCopy;
    this.prepare = prepare;
    this.canCopy = canCopy;
    this.copiedMonster = copiedMonster;
    if (fightCopy) this.fightCopy = fightCopy;
  }

  return Copier;
}();

exports.Copier = Copier;

/***/ }),

/***/ 9477:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

var tslib_1 = __webpack_require__(7622);

__webpack_require__(8433);

var kolmafia_1 = __webpack_require__(1664);

var utils_1 = __webpack_require__(8588);

var Kmail =
/** @class */
function () {
  function Kmail(rawKmail) {
    this.id = Number(rawKmail.id);
    this.date = new Date(rawKmail.localtime);
    this.type = rawKmail.type;
    this.senderId = Number(rawKmail.fromid);
    this.senderName = rawKmail.fromname;
    this.message = rawKmail.message;
  }
  /**
   * Parses a kmail from KoL's native format
   *
   * @param rawKmail Kmail in the format supplies by api.php
   * @returns Parsed kmail
   */


  Kmail.parse = function (rawKmail) {
    return new Kmail(rawKmail);
  };
  /**
   * Returns all of the player's kmails
   *
   * @returns Parsed kmails
   */


  Kmail.inbox = function () {
    return JSON.parse(kolmafia_1.visitUrl("api.php?what=kmail&for=ASSistant")).map(Kmail.parse);
  };
  /**
   * Bulk delete kmails
   *
   * @param kmails Kmails to delete
   * @returns Number of kmails deleted
   */


  Kmail["delete"] = function (kmails) {
    var _a, _b;

    var results = kolmafia_1.visitUrl("messages.php?the_action=delete&box=Inbox&pwd&" + kmails.map(function (k) {
      return "sel" + k.id + "=on";
    }).join("&"));
    return Number((_b = (_a = results.match(/<td>(\d) messages? deleted.<\/td>/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : 0);
  };

  Kmail._genericSend = function (to, message, items, meat, chunkSize, constructUrl, successString) {
    var e_1, _a;

    var m = meat;

    var sendableItems = tslib_1.__spread(utils_1.arrayToCountedMap(items).entries()).filter(function (_a) {
      var _b = tslib_1.__read(_a, 1),
          item = _b[0];

      return kolmafia_1.isGiftable(item);
    });

    var result = true;
    var chunks = utils_1.chunk(sendableItems, chunkSize);

    try {
      // Split the items to be sent into chunks of max 11 item types
      for (var _b = tslib_1.__values(chunks.length > 0 ? chunks : [null]), _c = _b.next(); !_c.done; _c = _b.next()) {
        var c = _c.value;
        var itemsQuery = c === null ? [] : c.map(function (_a, index) {
          var _b = tslib_1.__read(_a, 2),
              item = _b[0],
              quantity = _b[1];

          return "whichitem" + (index + 1) + "=" + kolmafia_1.toInt(item) + "&howmany" + (index + 1) + "=" + quantity;
        });
        var r = kolmafia_1.visitUrl(constructUrl(m, itemsQuery.join("&"), itemsQuery.length));

        if (r.includes("That player cannot receive Meat or items")) {
          return Kmail.gift(to, message, items, meat);
        } // Make sure we don't send the same batch of meat with every chunk


        m = 0;
        result && (result = r.includes(successString));
      }
    } catch (e_1_1) {
      e_1 = {
        error: e_1_1
      };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
      } finally {
        if (e_1) throw e_1.error;
      }
    }

    return result;
  };
  /**
   * Sends a kmail to a player
   *
   * Sends multiple kmails if more than 11 unique item types are attached.
   * Ignores any ungiftable items.
   * Sends a gift package to players in run
   *
   * @param to The player name or id to receive the kmail
   * @param message The text contents of the message
   * @param items The items to be attached
   * @param meat The quantity of meat to be attached
   * @returns True if the kmail was successfully sent
   */


  Kmail.send = function (to, message, items, meat) {
    if (message === void 0) {
      message = "";
    }

    if (items === void 0) {
      items = [];
    }

    if (meat === void 0) {
      meat = 0;
    }

    return Kmail._genericSend(to, message, items, meat, 11, function (meat, itemsQuery) {
      return "sendmessage.php?action=send&pwd&towho=" + to + "&message=" + message + (itemsQuery ? "&" + itemsQuery : "") + "&sendmeat=" + meat;
    }, ">Message sent.</");
  };
  /**
   * Sends a gift to a player
   *
   * Sends multiple kmails if more than 3 unique item types are attached.
   * Ignores any ungiftable items.
   *
   * @param to The player name or id to receive the gift
   * @param note The note on the outside of the gift
   * @param items The items to be attached
   * @param meat The quantity of meat to be attached
   * @param insideNode The note on the inside of the gift
   * @returns True if the gift was successfully sent
   */


  Kmail.gift = function (to, message, items, meat, insideNote) {
    if (message === void 0) {
      message = "";
    }

    if (items === void 0) {
      items = [];
    }

    if (meat === void 0) {
      meat = 0;
    }

    if (insideNote === void 0) {
      insideNote = "";
    }

    var baseUrl = "town_sendgift.php?action=Yep.&pwd&fromwhere=0&note=" + message + "&insidenote=" + insideNote + "&towho=" + to;
    return Kmail._genericSend(to, message, items, meat, 3, function (m, itemsQuery, chunkSize) {
      return baseUrl + "&whichpackage=" + chunkSize + (itemsQuery ? "&" + itemsQuery : "") + "&sendmeat=" + m;
    }, ">Package sent.</");
  };
  /**
   * Delete the kmail
   *
   * @returns Whether the kmail was deleted
   */


  Kmail.prototype["delete"] = function () {
    return Kmail["delete"]([this]) === 1;
  };
  /**
   * Get items attached to the kmail
   *
   * @returns Map of items attached to the kmail and their quantities
   */


  Kmail.prototype.items = function () {
    return new Map(Object.entries(kolmafia_1.extractItems(this.message)).map(function (_a) {
      var _b = tslib_1.__read(_a, 2),
          itemName = _b[0],
          quantity = _b[1];

      return [Item.get(itemName), quantity];
    }));
  };
  /**
   * Get meat attached to the kmail
   *
   * @returns Meat attached to the kmail
   */


  Kmail.prototype.meat = function () {
    return kolmafia_1.extractMeat(this.message);
  };
  /**
   * Reply to kmail
   *
   * @see Kmail.send
   *
   * @returns True if the kmail was successfully sent
   */


  Kmail.prototype.reply = function (message, items, meat) {
    if (message === void 0) {
      message = "";
    }

    if (items === void 0) {
      items = [];
    }

    if (meat === void 0) {
      meat = 0;
    }

    return Kmail.send(this.senderId, message, items, meat);
  };

  return Kmail;
}();

exports.default = Kmail;

/***/ }),

/***/ 6906:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Paths = exports.Path = void 0;

var tslib_1 = __webpack_require__(7622);

var template_string_1 = __webpack_require__(678);

var Path =
/** @class */
function () {
  function Path(name, id, hasAllPerms, hasCampground, hasTerrarium, stomachSize, liverSize, spleenSize, classes) {
    if (hasAllPerms === void 0) {
      hasAllPerms = true;
    }

    if (hasCampground === void 0) {
      hasCampground = true;
    }

    if (hasTerrarium === void 0) {
      hasTerrarium = true;
    }

    if (stomachSize === void 0) {
      stomachSize = 15;
    }

    if (liverSize === void 0) {
      liverSize = 15;
    }

    if (spleenSize === void 0) {
      spleenSize = 15;
    }

    if (classes === void 0) {
      classes = template_string_1.$classes(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Seal Clubber, Turtle Tamer, Sauceror, Pastamancer, Disco Bandit, Accordion Thief"], ["Seal Clubber, Turtle Tamer, Sauceror, Pastamancer, Disco Bandit, Accordion Thief"])));
    }

    this.name = name;
    this.id = id;
    this.hasAllPerms = hasAllPerms;
    this.hasCampground = hasCampground;
    this.hasTerrarium = hasTerrarium;
    this.stomachSize = stomachSize;
    this.liverSize = liverSize;
    this.spleenSize = spleenSize;
    this.classes = classes;
  }

  return Path;
}();

exports.Path = Path;
exports.Paths = {
  Unrestricted: new Path("Unrestricted", 0),
  Boozetafarian: new Path("Boozetafarian", 1, false, true, true, 0),
  Teetotaler: new Path("Teetotaler", 2, false, true, true, 15, 0),
  Oxygenarian: new Path("Oxygenarian", 3, false, true, true, 0, 0),
  BeesHateYou: new Path("Bees Hate You", 4),
  WayOfTheSurprisingFist: new Path("Way of the Surprising Fist", 6),
  Trendy: new Path("Trendy", 6),
  AvatarOfBoris: new Path("Avatar of Boris", 8, false, true, false, 20, 5, 15, template_string_1.$classes(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Avatar of Boris"], ["Avatar of Boris"])))),
  BugbearInvasion: new Path("Bugbear Invasion", 9),
  ZombieSlayer: new Path("Zombie Slayer", 10, false, true, true, 15, 5, 15, template_string_1.$classes(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["Zombie Master"], ["Zombie Master"])))),
  ClassAct: new Path("Class Act", 11, false),
  AvatarofJarlsberg: new Path("Avatar of Jarlsberg", 12, false, true, false, 10, 10, 15, template_string_1.$classes(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["Avatar of Jarlsberg"], ["Avatar of Jarlsberg"])))),
  Big: new Path("BIG!", 14),
  KolHs: new Path("KOLHS", 15),
  ClassAct2: new Path("Class Act II: A Class For Pigs", 16, false),
  AvatarofSneakyPete: new Path("Avatar of Sneaky Pete", 17, false, true, false, 5, 20, 15, template_string_1.$classes(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["Avatar of Sneaky Pete"], ["Avatar of Sneaky Pete"])))),
  SlowAndSteady: new Path("Slow and Steady", 18),
  HeavyRains: new Path("Heavy Rains", 19),
  Picky: new Path("Picky", 21, false),
  Standard: new Path("Standard", 22),
  ActuallyEdTheUndying: new Path("Actually Ed the Undying", 23, false, false, false, 0, 0, 5, template_string_1.$classes(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["Ed"], ["Ed"])))),
  OneCrazyRandomSummer: new Path("One Crazy Random Summer", 24),
  CommunityService: new Path("Community Service", 25),
  AvatarOfWestOfLoathing: new Path("Avatar of West of Loathing", 26, false, true, true, 10, 10, 10, template_string_1.$classes(templateObject_7 || (templateObject_7 = tslib_1.__makeTemplateObject(["Cow Puncher, Snake Oiler, Beanslinger"], ["Cow Puncher, Snake Oiler, Beanslinger"])))),
  TheSource: new Path("The Source", 27),
  NuclearAutumn: new Path("Nuclear Autumn", 28, false, false, true, 3, 3, 3),
  GelatinousNoob: new Path("Gelatinous Noob", 29, false, true, true, 0, 0, 0, template_string_1.$classes(templateObject_8 || (templateObject_8 = tslib_1.__makeTemplateObject(["Gelatinous Noob"], ["Gelatinous Noob"])))),
  LicenseToAdventure: new Path("License to Adventure", 30, true, true, false, 0, 2, 15),
  LiveAscendRepeat: new Path("Live. Ascend. Repeat.", 31),
  PocketFamiliars: new Path("Pocket Familiars", 32, false, true, false),
  GLover: new Path("G-Lover", 33),
  DisguisesDelimit: new Path("Disguises Delimit", 34),
  DarkGyffte: new Path("Dark Gyffte", 35, false, true, false, 5, 5, 15, template_string_1.$classes(templateObject_9 || (templateObject_9 = tslib_1.__makeTemplateObject(["Vampyre"], ["Vampyre"])))),
  TwoCrazyRandomSummer: new Path("Two Crazy Random Summer", 36),
  KingdomOfExploathing: new Path("Kingdom of Exploathing", 37),
  PathOfThePlumber: new Path("Path of the Plumber", 38, false, true, true, 20, 0, 5, template_string_1.$classes(templateObject_10 || (templateObject_10 = tslib_1.__makeTemplateObject(["Plumber"], ["Plumber"])))),
  LowKeySummer: new Path("Low Key Summer", 40),
  GreyGoo: new Path("Grey Goo", 40),
  YouRobot: new Path("You, Robot", 41, false, false, true, 0, 0, 0),
  QuantumTerrarium: new Path("Quantum Terrarium", 42, true, true, false)
};
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10;

/***/ }),

/***/ 1689:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.prepareAscension = exports.ascend = exports.Lifestyle = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var template_string_1 = __webpack_require__(678);

var property_1 = __webpack_require__(1347);

var resources_1 = __webpack_require__(1895);

var lib_1 = __webpack_require__(3311);

var Lifestyle;

(function (Lifestyle) {
  Lifestyle[Lifestyle["casual"] = 1] = "casual";
  Lifestyle[Lifestyle["softcore"] = 2] = "softcore";
  Lifestyle[Lifestyle["normal"] = 2] = "normal";
  Lifestyle[Lifestyle["hardcore"] = 3] = "hardcore";
})(Lifestyle = exports.Lifestyle || (exports.Lifestyle = {}));

function toMoonId(moon, playerClass) {
  if (typeof moon === "number") return moon;

  var offset = function offset() {
    switch (playerClass.primestat) {
      case template_string_1.$stat(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Muscle"], ["Muscle"]))):
        return 0;

      case template_string_1.$stat(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Mysticality"], ["Mysticality"]))):
        return 1;

      case template_string_1.$stat(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["Moxie"], ["Moxie"]))):
        return 2;

      default:
        throw "unknown prime stat for " + playerClass;
    }
  };

  switch (moon.toLowerCase()) {
    case "mongoose":
      return 1;

    case "wallaby":
      return 2;

    case "vole":
      return 3;

    case "platypus":
      return 4;

    case "opossum":
      return 5;

    case "marmot":
      return 6;

    case "wombat":
      return 7;

    case "blender":
      return 8;

    case "packrat":
      return 9;

    case "degrassi":
    case "degrassi knoll":
    case "friendly degrassi knoll":
    case "knoll":
      return 1 + offset();

    case "canada":
    case "canadia":
    case "little canadia":
      return 4 + offset();

    case "gnomads":
    case "gnomish":
    case "gnomish gnomads camp":
      return 7 + offset();

    default:
      return -1;
  }
}

function ascend(path, playerClass, lifestyle, moon, consumable, pet) {
  if (consumable === void 0) {
    consumable = template_string_1.$item(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["astral six-pack"], ["astral six-pack"])));
  }

  if (pet === void 0) {
    pet = undefined;
  }

  if (!kolmafia_1.containsText(kolmafia_1.visitUrl("charpane.php"), "Astral Spirit")) {
    kolmafia_1.print("It'd really be better if you were already through the gash. Oh well!", "blue");
    kolmafia_1.visitUrl("ascend.php?action=ascend&confirm=on&confirm2=on");
  }

  if (!kolmafia_1.containsText(kolmafia_1.visitUrl("charpane.php"), "Astral Spirit")) throw "Failed to ascend.";
  if (!path.classes.includes(playerClass)) throw "Invalid class " + playerClass + " for this path";
  if (path.id < 0) throw "Invalid path ID " + path.id;
  var moonId = toMoonId(moon, playerClass);
  if (moonId < 1 || moonId > 9) throw "Invalid moon " + moon;
  if (consumable && !template_string_1.$items(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["astral six-pack, astral hot dog dinner"], ["astral six-pack, astral hot dog dinner"]))).includes(consumable)) throw "Invalid consumable " + consumable;
  if (pet && !template_string_1.$items(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["astral bludgeon, astral shield, astral chapeau, astral bracer, astral longbow, astral shorts, astral mace, astral ring, astral statuette, astral pistol, astral mask, astral pet sweater, astral shirt, astral belt"], ["astral bludgeon, astral shield, astral chapeau, astral bracer, astral longbow, astral shorts, astral mace, astral ring, astral statuette, astral pistol, astral mask, astral pet sweater, astral shirt, astral belt"]))).includes(pet)) throw "Invalid astral item " + pet;
  kolmafia_1.visitUrl("afterlife.php?action=pearlygates");
  if (consumable) kolmafia_1.visitUrl("afterlife.php?action=buydeli&whichitem=" + kolmafia_1.toInt(consumable));
  if (pet) kolmafia_1.visitUrl("afterlife.php?action=buyarmory&whichitem=" + kolmafia_1.toInt(pet));
  kolmafia_1.visitUrl("afterlife.php?action=ascend&confirmascend=1&whichsign=" + moonId + "&gender=2&whichclass=" + kolmafia_1.toInt(playerClass) + "&whichpath=" + path.id + "&asctype=" + lifestyle + "&nopetok=1&noskillsok=1&lamepathok=1&pwd", true);
}

exports.ascend = ascend;
var worksheds = template_string_1.$items(templateObject_7 || (templateObject_7 = tslib_1.__makeTemplateObject(["warbear LP-ROM burner, warbear jackhammer drill press, warbear induction oven, warbear high-efficiency still, warbear chemistry lab, warbear auto-anvil, spinning wheel, snow machine, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic, Asdon Martin keyfob, diabolic pizza cube"], ["warbear LP-ROM burner, warbear jackhammer drill press, warbear induction oven, warbear high-efficiency still, warbear chemistry lab, warbear auto-anvil, spinning wheel, snow machine, Little Geneticist DNA-Splicing Lab, portable Mayo Clinic, Asdon Martin keyfob, diabolic pizza cube"])));
var gardens = template_string_1.$items(templateObject_8 || (templateObject_8 = tslib_1.__makeTemplateObject(["packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores"], ["packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores"]))); // eslint-disable-next-line libram/verify-constants

var eudorae = template_string_1.$items(templateObject_9 || (templateObject_9 = tslib_1.__makeTemplateObject(["My Own Pen Pal kit, GameInformPowerDailyPro subscription card, Xi Receiver Unit, New-You Club Membership Form, Our Daily Candles\u2122 order form"], ["My Own Pen Pal kit, GameInformPowerDailyPro subscription card, Xi Receiver Unit, New-You Club Membership Form, Our Daily Candles\u2122 order form"])));
var desks = template_string_1.$items(templateObject_10 || (templateObject_10 = tslib_1.__makeTemplateObject(["fancy stationery set, Swiss piggy bank, continental juice bar"], ["fancy stationery set, Swiss piggy bank, continental juice bar"])));
var ceilings = template_string_1.$items(templateObject_11 || (templateObject_11 = tslib_1.__makeTemplateObject(["antler chandelier, ceiling fan, artificial skylight"], ["antler chandelier, ceiling fan, artificial skylight"])));
var nightstands = template_string_1.$items(templateObject_12 || (templateObject_12 = tslib_1.__makeTemplateObject(["foreign language tapes, bowl of potpourri, electric muscle stimulator"], ["foreign language tapes, bowl of potpourri, electric muscle stimulator"])));

function prepareAscension(ascensionItems, chateauItems, throwOnFail) {
  if (throwOnFail === void 0) {
    throwOnFail = true;
  }

  if (ascensionItems) {
    if (ascensionItems.workshed && kolmafia_1.getWorkshed() !== ascensionItems.workshed) {
      if (!worksheds.includes(ascensionItems.workshed) && throwOnFail) throw "Invalid workshed: " + ascensionItems.workshed + "!";else if (!lib_1.have(ascensionItems.workshed) && throwOnFail) throw "I'm sorry buddy, but you don't seem to own a " + ascensionItems.workshed + ". Which makes it REALLY hard for us to plop one into your workshed.";else if (property_1.get("_workshedItemUsed") && throwOnFail) throw "Seems like you've already swapped your workshed, buddy.";else kolmafia_1.use(ascensionItems.workshed);
      if (kolmafia_1.getWorkshed() !== ascensionItems.workshed && throwOnFail) throw "We really thought we changed your workshed to a " + ascensionItems.workshed + ", but Mafia is saying otherwise.";
    }

    if (ascensionItems.garden && !Object.getOwnPropertyNames(kolmafia_1.getCampground()).includes(ascensionItems.garden.name)) {
      if (!gardens.includes(ascensionItems.garden) && throwOnFail) throw "Invalid garden: " + ascensionItems.garden + "!";else if (!lib_1.have(ascensionItems.garden) && throwOnFail) throw "I'm sorry buddy, but you don't seem to own a " + ascensionItems.garden + ". Which makes it REALLY hard for us to plant one into your garden.";else kolmafia_1.use(ascensionItems.garden);
      if (!Object.getOwnPropertyNames(kolmafia_1.getCampground()).includes(ascensionItems.garden.name) && throwOnFail) throw "We really thought we changed your garden to a " + ascensionItems.garden + ", but Mafia is saying otherwise.";
    }

    if (ascensionItems.eudora && kolmafia_1.eudoraItem() !== ascensionItems.eudora) {
      if (!eudorae.includes(ascensionItems.eudora) && throwOnFail) throw "Invalid eudora: " + ascensionItems.eudora + "!";
      var eudoraNumber = 1 + eudorae.indexOf(ascensionItems.eudora);
      if (!kolmafia_1.xpath(kolmafia_1.visitUrl("account.php?tab=correspondence"), "//select[@name=\"whichpenpal\"]/option/@value").includes(eudoraNumber.toString()) && throwOnFail) throw "I'm sorry buddy, but you don't seem to be subscribed to " + ascensionItems.eudora + ". Which makes it REALLY hard to correspond with them.";else kolmafia_1.visitUrl("account.php?actions[]=whichpenpal&whichpenpal=" + eudoraNumber + "&action=Update", true);
      if (kolmafia_1.eudoraItem() !== ascensionItems.eudora && throwOnFail) throw "We really thought we chaned your eudora to a " + ascensionItems.eudora + ", but Mafia is saying otherwise.";
    }
  }

  if (chateauItems && resources_1.ChateauMantegna.have()) {
    if (chateauItems.ceiling && resources_1.ChateauMantegna.getCeiling() !== chateauItems.ceiling) {
      if (!ceilings.includes(chateauItems.ceiling) && throwOnFail) throw "Invalid chateau ceiling: " + chateauItems.ceiling + "!";else if (!resources_1.ChateauMantegna.changeCeiling(chateauItems.ceiling) && throwOnFail) throw "We tried, but were unable to change your chateau ceiling to " + chateauItems.ceiling + ". Probably.";
    }

    if (chateauItems.desk && resources_1.ChateauMantegna.getDesk() !== chateauItems.desk) {
      if (!desks.includes(chateauItems.desk) && throwOnFail) throw "Invalid chateau desk: " + chateauItems.desk + "!";else if (!resources_1.ChateauMantegna.changeDesk(chateauItems.desk) && throwOnFail) throw "We tried, but were unable to change your chateau desk to " + chateauItems.desk + ". Probably.";
    }

    if (chateauItems.nightstand && resources_1.ChateauMantegna.getNightstand() !== chateauItems.nightstand) {
      if (!nightstands.includes(chateauItems.nightstand) && throwOnFail) throw "Invalid chateau nightstand: " + chateauItems.nightstand + "!";else if (!resources_1.ChateauMantegna.changeNightstand(chateauItems.nightstand) && throwOnFail) throw "We tried, but were unable to change your chateau nightstand to " + chateauItems.nightstand + ". Probably.";
    }
  }
}

exports.prepareAscension = prepareAscension;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;

/***/ }),

/***/ 1762:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.adventureMacroAuto = exports.adventureMacro = exports.Macro = exports.getMacroId = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var template_string_1 = __webpack_require__(678);

var property_1 = __webpack_require__(1347);

var MACRO_NAME = "Script Autoattack Macro";
/**
 * Get the KoL native ID of the macro with name Script Autoattack Macro.
 *
 * @category Combat
 * @returns {number} The macro ID.
 */

function getMacroId() {
  var macroMatches = kolmafia_1.xpath(kolmafia_1.visitUrl("account_combatmacros.php"), "//select[@name=\"macroid\"]/option[text()=\"" + MACRO_NAME + "\"]/@value");

  if (macroMatches.length === 0) {
    kolmafia_1.visitUrl("account_combatmacros.php?action=new");
    var newMacroText = kolmafia_1.visitUrl("account_combatmacros.php?macroid=0&name=" + MACRO_NAME + "&macrotext=abort&action=save");
    return parseInt(kolmafia_1.xpath(newMacroText, "//input[@name=macroid]/@value")[0], 10);
  } else {
    return parseInt(macroMatches[0], 10);
  }
}

exports.getMacroId = getMacroId;

function itemOrNameToItem(itemOrName) {
  return typeof itemOrName === "string" ? Item.get(itemOrName) : itemOrName;
}

var substringCombatItems = template_string_1.$items(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["spider web, really sticky spider web, dictionary, NG, Cloaca-Cola, yo-yo, top, ball, kite, yo, red potion, blue potion, adder, red button, pile of sand, mushroom, deluxe mushroom"], ["spider web, really sticky spider web, dictionary, NG, Cloaca-Cola, yo-yo, top, ball, kite, yo, red potion, blue potion, adder, red button, pile of sand, mushroom, deluxe mushroom"])));
var substringCombatSkills = template_string_1.$skills(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Shoot, Thrust-Smack, Headbutt, Toss, Sing, Disarm, LIGHT, BURN, Extract, Meteor Shower, Cleave, Boil, Slice, Rainbow"], ["Shoot, Thrust-Smack, Headbutt, Toss, Sing, Disarm, LIGHT, BURN, Extract, Meteor Shower, Cleave, Boil, Slice, Rainbow"])));

function itemOrItemsBallsMacroName(itemOrItems) {
  if (Array.isArray(itemOrItems)) {
    return itemOrItems.map(itemOrItemsBallsMacroName).join(", ");
  } else {
    var item = itemOrNameToItem(itemOrItems);
    return !substringCombatItems.includes(item) ? item.name : kolmafia_1.toInt(item).toString();
  }
}

function itemOrItemsBallsMacroPredicate(itemOrItems) {
  if (Array.isArray(itemOrItems)) {
    return itemOrItems.map(itemOrItemsBallsMacroName).join(" && ");
  } else {
    return "hascombatitem " + itemOrItems;
  }
}

function skillOrNameToSkill(skillOrName) {
  if (typeof skillOrName === "string") {
    return Skill.get(skillOrName);
  } else {
    return skillOrName;
  }
}

function skillBallsMacroName(skillOrName) {
  var skill = skillOrNameToSkill(skillOrName);
  return skill.name.match(/^[A-Za-z ]+$/) && !substringCombatSkills.includes(skill) ? skill.name : kolmafia_1.toInt(skill);
}
/**
 * BALLS macro builder for direct submission to KoL.
 * Create a new macro with `new Macro()` and add steps using the instance methods.
 * Uses a fluent interface, so each step returns the object for easy chaining of steps.
 * Each method is also defined as a static method that creates a new Macro with only that step.
 * For example, you can do `Macro.skill('Saucestorm').attack()`.
 */


var Macro =
/** @class */
function () {
  function Macro() {
    this.components = [];
  }
  /**
   * Convert macro to string.
   */


  Macro.prototype.toString = function () {
    return this.components.join(";");
  };
  /**
   * Save a macro to a Mafia property for use in a consult script.
   */


  Macro.prototype.save = function () {
    property_1.set(Macro.SAVED_MACRO_PROPERTY, this.toString());
  };
  /**
   * Load a saved macro from the Mafia property.
   */


  Macro.load = function () {
    var _a;

    return (_a = new this()).step.apply(_a, tslib_1.__spread(property_1.get(Macro.SAVED_MACRO_PROPERTY).split(";")));
  };
  /**
   * Clear the saved macro in the Mafia property.
   */


  Macro.clearSaved = function () {
    kolmafia_1.removeProperty(Macro.SAVED_MACRO_PROPERTY);
  };
  /**
   * Statefully add one or several steps to a macro.
   * @param nextSteps The steps to add to the macro.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.step = function () {
    var _a;

    var nextSteps = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      nextSteps[_i] = arguments[_i];
    }

    var nextStepsStrings = (_a = []).concat.apply(_a, tslib_1.__spread(nextSteps.map(function (x) {
      return x instanceof Macro ? x.components : [x];
    })));

    this.components = tslib_1.__spread(this.components, nextStepsStrings.filter(function (s) {
      return s.length > 0;
    }));
    return this;
  };
  /**
   * Statefully add one or several steps to a macro.
   * @param nextSteps The steps to add to the macro.
   * @returns {Macro} This object itself.
   */


  Macro.step = function () {
    var _a;

    var nextSteps = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      nextSteps[_i] = arguments[_i];
    }

    return (_a = new this()).step.apply(_a, tslib_1.__spread(nextSteps));
  };
  /**
   * Submit the built macro to KoL. Only works inside combat.
   */


  Macro.prototype.submit = function () {
    var _final = this.toString();

    return kolmafia_1.visitUrl("fight.php?action=macro&macrotext=" + kolmafia_1.urlEncode(_final), true, true);
  };
  /**
   * Set this macro as a KoL native autoattack.
   */


  Macro.prototype.setAutoAttack = function () {
    if (Macro.cachedMacroId === null) Macro.cachedMacroId = getMacroId();

    if (kolmafia_1.getAutoAttack() === 99000000 + Macro.cachedMacroId && this.toString() === Macro.cachedAutoAttack) {
      // This macro is already set. Don"t make the server request.
      return;
    }

    kolmafia_1.visitUrl("account_combatmacros.php?macroid=" + Macro.cachedMacroId + "&name=" + kolmafia_1.urlEncode(MACRO_NAME) + "&macrotext=" + kolmafia_1.urlEncode(this.toString()) + "&action=save", true, true);
    kolmafia_1.visitUrl("account.php?am=1&action=autoattack&value=" + (99000000 + Macro.cachedMacroId) + "&ajax=1");
    Macro.cachedAutoAttack = this.toString();
  };
  /**
   * Add an "abort" step to this macro.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.abort = function () {
    return this.step("abort");
  };
  /**
   * Create a new macro with an "abort" step.
   * @returns {Macro} This object itself.
   */


  Macro.abort = function () {
    return new this().abort();
  };
  /**
   * Add an "if" statement to this macro.
   * @param condition The BALLS condition for the if statement.
   * @param ifTrue Continuation if the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.if_ = function (condition, ifTrue) {
    return this.step("if " + condition).step(ifTrue).step("endif");
  };
  /**
   * Create a new macro with an "if" statement.
   * @param condition The BALLS condition for the if statement.
   * @param ifTrue Continuation if the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.if_ = function (condition, ifTrue) {
    return new this().if_(condition, ifTrue);
  };
  /**
   * Add a "while" statement to this macro.
   * @param condition The BALLS condition for the if statement.
   * @param contents Loop to repeat while the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.while_ = function (condition, contents) {
    return this.step("while " + condition).step(contents).step("endwhile");
  };
  /**
   * Create a new macro with a "while" statement.
   * @param condition The BALLS condition for the if statement.
   * @param contents Loop to repeat while the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.while_ = function (condition, contents) {
    return new this().while_(condition, contents);
  };
  /**
   * Conditionally add a step to a macro based on a condition evaluated at the time of building the macro.
   * @param condition The JS condition.
   * @param ifTrue Continuation to add if the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.externalIf = function (condition, ifTrue) {
    return condition ? this.step(ifTrue) : this;
  };
  /**
   * Create a new macro with a condition evaluated at the time of building the macro.
   * @param condition The JS condition.
   * @param ifTrue Continuation to add if the condition is true.
   * @returns {Macro} This object itself.
   */


  Macro.externalIf = function (condition, ifTrue) {
    return new this().externalIf(condition, ifTrue);
  };
  /**
   * Add a repeat step to the macro.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.repeat = function () {
    return this.step("repeat");
  };
  /**
   * Add one or more skill cast steps to the macro.
   * @param skills Skills to cast.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.skill = function () {
    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return this.step.apply(this, tslib_1.__spread(skills.map(function (skill) {
      return "skill " + skillBallsMacroName(skill);
    })));
  };
  /**
   * Create a new macro with one or more skill cast steps.
   * @param skills Skills to cast.
   * @returns {Macro} This object itself.
   */


  Macro.skill = function () {
    var _a;

    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return (_a = new this()).skill.apply(_a, tslib_1.__spread(skills));
  };
  /**
   * Add one or more skill cast steps to the macro, where each step checks if you have the skill first.
   * @param skills Skills to try casting.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.trySkill = function () {
    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return this.step.apply(this, tslib_1.__spread(skills.map(function (skill) {
      return Macro.if_("hasskill " + skillBallsMacroName(skill), Macro.skill(skill));
    })));
  };
  /**
   * Create a new macro with one or more skill cast steps, where each step checks if you have the skill first.
   * @param skills Skills to try casting.
   * @returns {Macro} This object itself.
   */


  Macro.trySkill = function () {
    var _a;

    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return (_a = new this()).trySkill.apply(_a, tslib_1.__spread(skills));
  };
  /**
   * Add one or more skill-cast-and-repeat steps to the macro, where each step checks if you have the skill first.
   * @param skills Skills to try repeatedly casting.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.trySkillRepeat = function () {
    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return this.step.apply(this, tslib_1.__spread(skills.map(function (skill) {
      return Macro.if_("hasskill " + skillBallsMacroName(skill), Macro.skill(skill).repeat());
    })));
  };
  /**
   * Create a new macro with one or more skill-cast-and-repeat steps, where each step checks if you have the skill first.
   * @param skills Skills to try repeatedly casting.
   * @returns {Macro} This object itself.
   */


  Macro.trySkillRepeat = function () {
    var _a;

    var skills = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      skills[_i] = arguments[_i];
    }

    return (_a = new this()).trySkillRepeat.apply(_a, tslib_1.__spread(skills));
  };
  /**
   * Add one or more item steps to the macro.
   * @param items Items to use. Pass a tuple [item1, item2] to funksling.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.item = function () {
    var items = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      items[_i] = arguments[_i];
    }

    return this.step.apply(this, tslib_1.__spread(items.map(function (itemOrItems) {
      return "use " + itemOrItemsBallsMacroName(itemOrItems);
    })));
  };
  /**
   * Create a new macro with one or more item steps.
   * @param items Items to use. Pass a tuple [item1, item2] to funksling.
   * @returns {Macro} This object itself.
   */


  Macro.item = function () {
    var _a;

    var items = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      items[_i] = arguments[_i];
    }

    return (_a = new this()).item.apply(_a, tslib_1.__spread(items));
  };
  /**
   * Add one or more item steps to the macro, where each step checks to see if you have the item first.
   * @param items Items to try using. Pass a tuple [item1, item2] to funksling.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.tryItem = function () {
    var items = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      items[_i] = arguments[_i];
    }

    return this.step.apply(this, tslib_1.__spread(items.map(function (item) {
      return Macro.if_(itemOrItemsBallsMacroPredicate(item), "use " + itemOrItemsBallsMacroName(item));
    })));
  };
  /**
   * Create a new macro with one or more item steps, where each step checks to see if you have the item first.
   * @param items Items to try using. Pass a tuple [item1, item2] to funksling.
   * @returns {Macro} This object itself.
   */


  Macro.tryItem = function () {
    var _a;

    var items = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      items[_i] = arguments[_i];
    }

    return (_a = new this()).tryItem.apply(_a, tslib_1.__spread(items));
  };
  /**
   * Add an attack step to the macro.
   * @returns {Macro} This object itself.
   */


  Macro.prototype.attack = function () {
    return this.step("attack");
  };
  /**
   * Create a new macro with an attack step.
   * @returns {Macro} This object itself.
   */


  Macro.attack = function () {
    return new this().attack();
  };

  Macro.SAVED_MACRO_PROPERTY = "libram_savedMacro";
  Macro.cachedMacroId = null;
  Macro.cachedAutoAttack = null;
  return Macro;
}();

exports.Macro = Macro;
/**
 * Adventure in a location and handle all combats with a given macro.
 * To use this function you will need to create a consult script that runs Macro.load().submit() and a CCS that calls that consult script.
 * See examples/consult.ts for an example.
 *
 * @category Combat
 * @param loc Location to adventure in.
 * @param macro Macro to execute.
 */

function adventureMacro(loc, macro) {
  macro.save();
  kolmafia_1.setAutoAttack(0);

  try {
    kolmafia_1.adv1(loc, 0, "");

    while (kolmafia_1.inMultiFight()) {
      kolmafia_1.runCombat();
    }

    if (kolmafia_1.choiceFollowsFight()) kolmafia_1.visitUrl("choice.php");
  } finally {
    Macro.clearSaved();
  }
}

exports.adventureMacro = adventureMacro;
/**
 * Adventure in a location and handle all combats with a given autoattack and manual macro.
 * To use the nextMacro parameter you will need to create a consult script that runs Macro.load().submit() and a CCS that calls that consult script.
 * See examples/consult.ts for an example.
 *
 * @category Combat
 * @param loc Location to adventure in.
 * @param autoMacro Macro to execute via KoL autoattack.
 * @param nextMacro Macro to execute manually after autoattack completes.
 */

function adventureMacroAuto(loc, autoMacro, nextMacro) {
  if (nextMacro === void 0) {
    nextMacro = null;
  }

  nextMacro = nextMacro !== null && nextMacro !== void 0 ? nextMacro : Macro.abort();
  autoMacro.setAutoAttack();
  nextMacro.save();

  try {
    kolmafia_1.adv1(loc, 0, "");

    while (kolmafia_1.inMultiFight()) {
      kolmafia_1.runCombat();
    }

    if (kolmafia_1.choiceFollowsFight()) kolmafia_1.visitUrl("choice.php");
  } finally {
    Macro.clearSaved();
  }
}

exports.adventureMacroAuto = adventureMacroAuto;
var templateObject_1, templateObject_2;

/***/ }),

/***/ 6448:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.error = exports.warn = exports.info = exports.log = void 0;

var kolmafia_1 = __webpack_require__(1664); // eslint-disable-next-line @typescript-eslint/no-explicit-any


var logColor = function logColor(color) {
  return function () {
    var args = [];

    for (var _i = 0; _i < arguments.length; _i++) {
      args[_i] = arguments[_i];
    }

    var output = args.map(function (x) {
      return x.toString();
    }).join(" ");

    if (color) {
      kolmafia_1.print(output, color);
    } else {
      kolmafia_1.print(output);
    }
  };
};

exports.log = logColor();
exports.info = logColor("blue");
exports.warn = logColor("red");
exports.error = logColor("red");

/***/ }),

/***/ 9803:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.withChoice = exports.withChoices = exports.withProperty = exports.withProperties = exports.setProperties = exports.set = exports.PropertiesManager = exports.get = exports.property = exports.console = exports.logger = exports.Kmail = void 0;

var tslib_1 = __webpack_require__(7622);

tslib_1.__exportStar(__webpack_require__(1689), exports);

tslib_1.__exportStar(__webpack_require__(1662), exports);

tslib_1.__exportStar(__webpack_require__(1762), exports);

tslib_1.__exportStar(__webpack_require__(3311), exports);

tslib_1.__exportStar(__webpack_require__(9376), exports);

tslib_1.__exportStar(__webpack_require__(6115), exports);

tslib_1.__exportStar(__webpack_require__(1895), exports);

tslib_1.__exportStar(__webpack_require__(1157), exports);

tslib_1.__exportStar(__webpack_require__(678), exports);

var Kmail_1 = __webpack_require__(9477);

Object.defineProperty(exports, "Kmail", ({
  enumerable: true,
  get: function get() {
    return tslib_1.__importDefault(Kmail_1)["default"];
  }
}));

tslib_1.__exportStar(__webpack_require__(6906), exports);

var logger_1 = __webpack_require__(8685);

Object.defineProperty(exports, "logger", ({
  enumerable: true,
  get: function get() {
    return tslib_1.__importDefault(logger_1)["default"];
  }
}));
exports.console = tslib_1.__importStar(__webpack_require__(6448));
exports.property = tslib_1.__importStar(__webpack_require__(1347));

var property_1 = __webpack_require__(1347);

Object.defineProperty(exports, "get", ({
  enumerable: true,
  get: function get() {
    return property_1.get;
  }
}));
Object.defineProperty(exports, "PropertiesManager", ({
  enumerable: true,
  get: function get() {
    return property_1.PropertiesManager;
  }
}));
Object.defineProperty(exports, "set", ({
  enumerable: true,
  get: function get() {
    return property_1.set;
  }
}));
Object.defineProperty(exports, "setProperties", ({
  enumerable: true,
  get: function get() {
    return property_1.setProperties;
  }
}));
Object.defineProperty(exports, "withProperties", ({
  enumerable: true,
  get: function get() {
    return property_1.withProperties;
  }
}));
Object.defineProperty(exports, "withProperty", ({
  enumerable: true,
  get: function get() {
    return property_1.withProperty;
  }
}));
Object.defineProperty(exports, "withChoices", ({
  enumerable: true,
  get: function get() {
    return property_1.withChoices;
  }
}));
Object.defineProperty(exports, "withChoice", ({
  enumerable: true,
  get: function get() {
    return property_1.withChoice;
  }
}));

/***/ }),

/***/ 3311:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.uneffect = exports.getAverageAdventures = exports.getAverage = exports.noneToNull = exports.canUse = exports.getBanishedMonsters = exports.getZapGroup = exports.getFoldGroup = exports.isCurrentFamiliar = exports.getWandererChance = exports.getFamiliarWandererChance = exports.getKramcoWandererChance = exports.isWandererNow = exports.isVoteWandererNow = exports.haveWandererCounter = exports.getTotalFamiliarWanderers = exports.haveCounter = exports.Wanderer = exports.haveInCampground = exports.have = exports.getRemainingSpleen = exports.getRemainingStomach = exports.getRemainingLiver = exports.getMonsterLocations = exports.canRememberSong = exports.getSongCount = exports.getActiveSongs = exports.getActiveEffects = exports.isSong = exports.getSongLimit = void 0;

var tslib_1 = __webpack_require__(7622);
/** @module GeneralLibrary */


__webpack_require__(8433);

var kolmafia_1 = __webpack_require__(1664);

var template_string_1 = __webpack_require__(678);

var property_1 = __webpack_require__(1347);

var utils_1 = __webpack_require__(8588);
/**
 * Returns the current maximum Accordion Thief songs the player can have in their head
 *
 * @category General
 */


function getSongLimit() {
  return 3 + (kolmafia_1.booleanModifier("Four Songs") ? 1 : 0) + kolmafia_1.numericModifier("Additional Song");
}

exports.getSongLimit = getSongLimit;
/**
 * Return whether the Skill or Effect provided is an Accordion Thief song
 *
 * @category General
 * @param skillOrEffect The Skill or Effect
 */

function isSong(skillOrEffect) {
  var skill = skillOrEffect instanceof Effect ? kolmafia_1.toSkill(skillOrEffect) : skillOrEffect;
  return skill["class"] === template_string_1.$class(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Accordion Thief"], ["Accordion Thief"]))) && skill.buff;
}

exports.isSong = isSong;
/**
 * List all active Effects
 *
 * @category General
 */

function getActiveEffects() {
  return Object.keys(kolmafia_1.myEffects()).map(function (e) {
    return Effect.get(e);
  });
}

exports.getActiveEffects = getActiveEffects;
/**
 * List currently active Accordion Thief songs
 *
 * @category General
 */

function getActiveSongs() {
  return getActiveEffects().filter(isSong);
}

exports.getActiveSongs = getActiveSongs;
/**
 * List number of active Accordion Thief songs
 *
 * @category General
 */

function getSongCount() {
  return getActiveSongs().length;
}

exports.getSongCount = getSongCount;
/**
 * Returns true if the player can remember another Accordion Thief song
 *
 * @category General
 * @param quantity Number of songs to test the space for
 */

function canRememberSong(quantity) {
  if (quantity === void 0) {
    quantity = 1;
  }

  return getSongLimit() - getSongCount() >= quantity;
}

exports.canRememberSong = canRememberSong;
/**
 * Return the locations in which the given monster can be encountered naturally
 *
 * @category General
 * @param monster Monster to find
 */

function getMonsterLocations(monster) {
  return Location.all().filter(function (location) {
    return monster.name in kolmafia_1.appearanceRates(location);
  });
}

exports.getMonsterLocations = getMonsterLocations;
/**
 * Return the player's remaining liver space
 *
 * @category General
 */

function getRemainingLiver() {
  return kolmafia_1.inebrietyLimit() - kolmafia_1.myInebriety();
}

exports.getRemainingLiver = getRemainingLiver;
/**
 * Return the player's remaining stomach space
 *
 * @category General
 */

function getRemainingStomach() {
  return kolmafia_1.fullnessLimit() - kolmafia_1.myFullness();
}

exports.getRemainingStomach = getRemainingStomach;
/**
 * Return the player's remaining spleen space
 *
 * @category General
 */

function getRemainingSpleen() {
  return kolmafia_1.spleenLimit() - kolmafia_1.mySpleenUse();
}

exports.getRemainingSpleen = getRemainingSpleen;
/**
 * Return whether the player "has" any entity which one could feasibly "have".
 *
 * @category General
 * @param thing Thing to check
 * @param quantity Number to check that the player has
 */

function have(thing, quantity) {
  if (quantity === void 0) {
    quantity = 1;
  }

  if (thing instanceof Effect) {
    return kolmafia_1.haveEffect(thing) >= quantity;
  }

  if (thing instanceof Familiar) {
    return kolmafia_1.haveFamiliar(thing);
  }

  if (thing instanceof Item) {
    return kolmafia_1.availableAmount(thing) >= quantity;
  }

  if (thing instanceof Servant) {
    return kolmafia_1.haveServant(thing);
  }

  if (thing instanceof Skill) {
    return kolmafia_1.haveSkill(thing);
  }

  if (thing instanceof Thrall) {
    var thrall = kolmafia_1.myThrall();
    return thrall.id === thing.id && thrall.level >= quantity;
  }

  return false;
}

exports.have = have;
/**
 * Return whether an item is in the player's campground
 *
 * @category General
 * @param item The item mafia uses to represent the campground item
 */

function haveInCampground(item) {
  return Object.keys(kolmafia_1.getCampground()).map(function (i) {
    return Item.get(i);
  }).includes(item);
}

exports.haveInCampground = haveInCampground;
var Wanderer;

(function (Wanderer) {
  Wanderer["Digitize"] = "Digitize Monster";
  Wanderer["Enamorang"] = "Enamorang Monster";
  Wanderer["Familiar"] = "Familiar";
  Wanderer["Holiday"] = "Holiday Monster";
  Wanderer["Kramco"] = "Kramco";
  Wanderer["Nemesis"] = "Nemesis Assassin";
  Wanderer["Portscan"] = "portscan.edu";
  Wanderer["Romantic"] = "Romantic Monster";
  Wanderer["Vote"] = "Vote Monster";
})(Wanderer = exports.Wanderer || (exports.Wanderer = {}));

var deterministicWanderers = [Wanderer.Digitize, Wanderer.Portscan];
/**
 * Return whether the player has the queried counter
 *
 * @category General
 */

function haveCounter(counterName, minTurns, maxTurns) {
  if (minTurns === void 0) {
    minTurns = 0;
  }

  if (maxTurns === void 0) {
    maxTurns = 500;
  }

  return kolmafia_1.getCounters(counterName, minTurns, maxTurns) === counterName;
}

exports.haveCounter = haveCounter;
/**
 * Returns the player's total number of Artistic Goth Kid and/or Mini-Hipster
 * wanderers encountered today
 *
 * @category Wanderers
 */

function getTotalFamiliarWanderers() {
  var hipsterFights = property_1.get("_hipsterAdv");
  var gothFights = property_1.get("_gothKidFights");
  return hipsterFights + gothFights;
}

exports.getTotalFamiliarWanderers = getTotalFamiliarWanderers;
/**
 * Return whether the player has the queried wandering counter
 *
 * @category Wanderers
 */

function haveWandererCounter(wanderer) {
  if (deterministicWanderers.includes(wanderer)) {
    return haveCounter(wanderer);
  }

  var begin = wanderer + " window begin";
  var end = wanderer + " window end";
  return haveCounter(begin) || haveCounter(end);
}

exports.haveWandererCounter = haveWandererCounter;
/**
 * Returns whether the player will encounter a vote wanderer on the next turn,
 * providing an "I Voted!" sticker is equipped.
 *
 * @category Wanderers
 */

function isVoteWandererNow() {
  return kolmafia_1.totalTurnsPlayed() % 11 == 1;
}

exports.isVoteWandererNow = isVoteWandererNow;
/**
 * Tells us whether we can expect a given wanderer now. Behaves differently
 * for different types of wanderer.
 *
 * - For deterministic wanderers, return whether the player will encounter
 *   the queried wanderer on the next turn
 *
 * - For variable wanderers (window), return whether the player is within
 *   an encounter window for the queried wanderer
 *
 * - For variable wanderers (chance per turn), returns true unless the player
 *   has exhausted the number of wanderers possible
 *
 * @category Wanderers
 * @param wanderer Wanderer to check
 */

function isWandererNow(wanderer) {
  if (deterministicWanderers.includes(wanderer)) {
    return haveCounter(wanderer, 0, 0);
  }

  if (wanderer == Wanderer.Kramco) {
    return true;
  }

  if (wanderer === Wanderer.Vote) {
    return isVoteWandererNow();
  }

  if (wanderer === Wanderer.Familiar) {
    return getTotalFamiliarWanderers() < 7;
  }

  var begin = wanderer + " window begin";
  var end = wanderer + " window end";
  return !haveCounter(begin, 1) && haveCounter(end);
}

exports.isWandererNow = isWandererNow;
/**
 * Returns the float chance the player will encounter a sausage goblin on the
 * next turn, providing the Kramco Sausage-o-Matic is equipped.
 *
 * @category Wanderers
 */

function getKramcoWandererChance() {
  var fights = property_1.get("_sausageFights");
  var lastFight = property_1.get("_lastSausageMonsterTurn");
  var totalTurns = kolmafia_1.totalTurnsPlayed();

  if (fights < 1) {
    return lastFight === totalTurns && kolmafia_1.myTurncount() < 1 ? 0.5 : 1.0;
  }

  var turnsSinceLastFight = totalTurns - lastFight;
  return Math.min(1.0, (turnsSinceLastFight + 1) / (5 + fights * 3 + Math.pow(Math.max(0, fights - 5), 3)));
}

exports.getKramcoWandererChance = getKramcoWandererChance;
/**
 * Returns the float chance the player will encounter an Artistic Goth Kid or
 * Mini-Hipster wanderer on the next turn, providing a familiar is equipped.
 *
 * NOTE: You must complete one combat with the Artistic Goth Kid before you
 * can encounter any wanderers. Consequently,ƒ the first combat with the
 * Artist Goth Kid is effectively 0% chance to encounter a wanderer.
 *
 * @category Wanderers
 */

function getFamiliarWandererChance() {
  var totalFights = getTotalFamiliarWanderers();
  var probability = [0.5, 0.4, 0.3, 0.2];

  if (totalFights < 4) {
    return probability[totalFights];
  }

  return totalFights > 7 ? 0.0 : 0.1;
}

exports.getFamiliarWandererChance = getFamiliarWandererChance;
/**
 * Returns the float chance the player will encounter the queried wanderer
 * on the next turn.
 *
 * @category Wanderers
 * @param wanderer Wanderer to check
 */

function getWandererChance(wanderer) {
  if (deterministicWanderers.includes(wanderer)) {
    return haveCounter(wanderer, 0, 0) ? 1.0 : 0.0;
  }

  if (wanderer === Wanderer.Kramco) {
    getKramcoWandererChance();
  }

  if (wanderer === Wanderer.Vote) {
    return isVoteWandererNow() ? 1.0 : 0.0;
  }

  if (wanderer === Wanderer.Familiar) {
    getFamiliarWandererChance();
  }

  var begin = wanderer + " window begin";
  var end = wanderer + " window end";

  if (haveCounter(begin, 1, 100)) {
    return 0.0;
  }

  var counters = property_1.get("relayCounters");
  var re = new RegExp("(\\d+):" + end);
  var matches = counters.match(re);

  if (matches && matches.length === 2) {
    var window = Number.parseInt(matches[1]) - kolmafia_1.myTurncount();
    return 1.0 / window;
  }

  return 0.0;
}

exports.getWandererChance = getWandererChance;
/**
 * Returns true if the player's current familiar is equal to the one supplied
 *
 * @category General
 * @param familiar Familiar to check
 */

function isCurrentFamiliar(familiar) {
  return kolmafia_1.myFamiliar() === familiar;
}

exports.isCurrentFamiliar = isCurrentFamiliar;
/**
 * Returns the fold group (if any) of which the given item is a part
 *
 * @category General
 * @param item Item that is part of the required fold group
 */

function getFoldGroup(item) {
  return Object.entries(kolmafia_1.getRelated(item, "fold")).sort(function (_a, _b) {
    var _c = tslib_1.__read(_a, 2),
        a = _c[1];

    var _d = tslib_1.__read(_b, 2),
        b = _d[1];

    return a - b;
  }).map(function (_a) {
    var _b = tslib_1.__read(_a, 1),
        i = _b[0];

    return Item.get(i);
  });
}

exports.getFoldGroup = getFoldGroup;
/**
 * Returns the zap group (if any) of which the given item is a part
 *
 * @category General
 * @param item Item that is part of the required zap group
 */

function getZapGroup(item) {
  return Object.keys(kolmafia_1.getRelated(item, "zap")).map(function (i) {
    return Item.get(i);
  });
}

exports.getZapGroup = getZapGroup;
/**
 * Get a map of banished monsters keyed by what banished them
 *
 * @category General
 */

function getBanishedMonsters() {
  var e_1, _a;

  var banishes = utils_1.chunk(property_1.get("banishedMonsters").split(":"), 3);
  var result = new Map();

  try {
    for (var banishes_1 = tslib_1.__values(banishes), banishes_1_1 = banishes_1.next(); !banishes_1_1.done; banishes_1_1 = banishes_1.next()) {
      var _b = tslib_1.__read(banishes_1_1.value, 2),
          foe = _b[0],
          banisher = _b[1];

      if (foe === undefined || banisher === undefined) break; // toItem doesn"t error if the item doesn"t exist, so we have to use that.

      var banisherItem = kolmafia_1.toItem(banisher);
      var banisherObject = [Item.get("none"), null].includes(banisherItem) ? Skill.get(banisher) : banisherItem;
      result.set(banisherObject, Monster.get(foe));
    }
  } catch (e_1_1) {
    e_1 = {
      error: e_1_1
    };
  } finally {
    try {
      if (banishes_1_1 && !banishes_1_1.done && (_a = banishes_1["return"])) _a.call(banishes_1);
    } finally {
      if (e_1) throw e_1.error;
    }
  }

  return result;
}

exports.getBanishedMonsters = getBanishedMonsters;
/**
 * Returns true if the item is usable
 *
 * This function will be an ongoing work in progress
 *
 * @param item Item to check
 */

function canUse(item) {
  var path = kolmafia_1.myPath();

  if (path !== "Nuclear Autumn") {
    if (template_string_1.$items(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Shrieking Weasel holo-record, Power-Guy 2000 holo-record, Lucky Strikes holo-record, EMD holo-record, Superdrifter holo-record, The Pigs holo-record, Drunk Uncles holo-record"], ["Shrieking Weasel holo-record, Power-Guy 2000 holo-record, Lucky Strikes holo-record, EMD holo-record, Superdrifter holo-record, The Pigs holo-record, Drunk Uncles holo-record"]))).includes(item)) {
      return false;
    }
  }

  if (path === "G-Lover") {
    if (!item.name.toLowerCase().includes("g")) return false;
  }

  if (path === "Bees Hate You") {
    if (item.name.toLowerCase().includes("b")) return false;
  }

  return true;
}

exports.canUse = canUse;
/**
 * Turn KoLmafia `none`s to JavaScript `null`s
 *
 * @param thing Thing that can have a mafia "none" value
 */

function noneToNull(thing) {
  if (thing instanceof Effect) {
    return thing === Effect.get("none") ? null : thing;
  }

  if (thing instanceof Familiar) {
    return thing === Familiar.get("none") ? null : thing;
  }

  if (thing instanceof Item) {
    return thing === Item.get("none") ? null : thing;
  }

  return thing;
}

exports.noneToNull = noneToNull;
/**
 * Return the average value from the sort of range that KoLmafia encodes as a string
 *
 * @param range KoLmafia-style range string
 */

function getAverage(range) {
  var _a;

  if (range.indexOf("-") < 0) return Number(range);

  var _b = tslib_1.__read((_a = range.match(/(-?[0-9]+)-(-?[0-9]+)/)) !== null && _a !== void 0 ? _a : ["0", "0", "0"], 3),
      lower = _b[1],
      upper = _b[2];

  return (Number(lower) + Number(upper)) / 2;
}

exports.getAverage = getAverage;
/**
 * Return average adventures expected from consuming an item
 *
 * If item is not a consumable, will just return "0".
 *
 * @param item Consumable item
 */

function getAverageAdventures(item) {
  return getAverage(item.adventures);
}

exports.getAverageAdventures = getAverageAdventures;
/**
 * Remove an effect
 *
 * @category General
 * @param effect Effect to remove
 */

function uneffect(effect) {
  return kolmafia_1.cliExecute("uneffect " + effect.name);
}

exports.uneffect = uneffect;
var templateObject_1, templateObject_2;

/***/ }),

/***/ 8685:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));

var kolmafia_1 = __webpack_require__(1664);

var defaultHandlers = {
  info: function info(message) {
    return kolmafia_1.printHtml("<b>[Libram]</b> " + message);
  },
  warning: function warning(message) {
    return kolmafia_1.printHtml("<span style=\"background: orange; color: white;\"><b>[Libram]</b> " + message + "</span>");
  },
  error: function error(_error) {
    return kolmafia_1.printHtml("<span style=\"background: red; color: white;\"><b>[Libram]</b> " + _error.toString() + "</span>");
  }
};

var Logger =
/** @class */
function () {
  function Logger() {
    this.handlers = defaultHandlers;
  } // eslint-disable-next-line @typescript-eslint/no-explicit-any


  Logger.prototype.setHandler = function (level, callback) {
    this.handlers[level] = callback;
  }; // eslint-disable-next-line @typescript-eslint/no-explicit-any


  Logger.prototype.log = function (level, message) {
    this.handlers[level](message);
  };

  Logger.prototype.info = function (message) {
    this.log("info", message);
  };

  Logger.prototype.warning = function (message) {
    this.log("warning", message);
  };

  Logger.prototype.error = function (message) {
    this.log("error", message);
  };

  return Logger;
}();

exports.default = new Logger();

/***/ }),

/***/ 9376:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.maximizeCached = exports.setDefaultMaximizeOptions = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var template_string_1 = __webpack_require__(678);

var logger_1 = tslib_1.__importDefault(__webpack_require__(8685));

var defaultMaximizeOptions = {
  updateOnFamiliarChange: true,
  updateOnCanEquipChanged: true,
  forceEquip: [],
  preventEquip: [],
  bonusEquip: new Map(),
  onlySlot: [],
  preventSlot: []
};
/**
 *
 * @param options Default options for each maximizer run.
 * @param options.updateOnFamiliarChange Re-run the maximizer if familiar has changed. Default true.
 * @param options.updateOnCanEquipChanged Re-run the maximizer if stats have changed what can be equipped. Default true.
 * @param options.forceEquip Equipment to force-equip ("equip X").
 * @param options.preventEquip Equipment to prevent equipping ("-equip X").
 * @param options.bonusEquip Equipment to apply a bonus to ("200 bonus X").
 */

function setDefaultMaximizeOptions(options) {
  Object.assign(defaultMaximizeOptions, options);
}

exports.setDefaultMaximizeOptions = setDefaultMaximizeOptions; // Subset of slots that are valid for caching.

var cachedSlots = template_string_1.$slots(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["hat, weapon, off-hand, back, shirt, pants, acc1, acc2, acc3, familiar"], ["hat, weapon, off-hand, back, shirt, pants, acc1, acc2, acc3, familiar"])));

var CacheEntry =
/** @class */
function () {
  function CacheEntry(equipment, rider, familiar, canEquipItemCount) {
    this.equipment = equipment;
    this.rider = rider;
    this.familiar = familiar;
    this.canEquipItemCount = canEquipItemCount;
  }

  return CacheEntry;
}(); // Objective cache entries.


var cachedObjectives = {}; // Cache to prevent rescanning all items unnecessarily

var cachedStats = [0, 0, 0];
var cachedCanEquipItemCount = 0;
/**
 * Count the number of unique items that can be equipped.
 * @returns The count of unique items.
 */

function canEquipItemCount() {
  var stats = template_string_1.$stats(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Muscle, Mysticality, Moxie"], ["Muscle, Mysticality, Moxie"]))).map(function (stat) {
    return Math.min(kolmafia_1.myBasestat(stat), 300);
  });

  if (stats.every(function (value, index) {
    return value === cachedStats[index];
  })) {
    return cachedCanEquipItemCount;
  }

  cachedStats = stats;
  cachedCanEquipItemCount = Item.all().filter(function (item) {
    return kolmafia_1.canEquip(item);
  }).length;
  return cachedCanEquipItemCount;
}
/**
 * Checks the objective cache for a valid entry.
 * @param cacheKey The cache key to check.
 * @param updateOnFamiliarChange Ignore cache if familiar has changed.
 * @param updateOnCanEquipChanged Ignore cache if stats have changed what can be equipped.
 * @returns A valid CacheEntry or null.
 */


function checkCache(cacheKey, updateOnFamiliarChange, updateOnCanEquipChanged) {
  var entry = cachedObjectives[cacheKey];

  if (!entry) {
    return null;
  }

  if (updateOnFamiliarChange && kolmafia_1.myFamiliar() !== entry.familiar) {
    logger_1["default"].warning("Equipment found in maximize cache but familiar is different.");
    return null;
  }

  if (updateOnCanEquipChanged && entry.canEquipItemCount !== canEquipItemCount()) {
    logger_1["default"].warning("Equipment found in maximize cache but equippable item list is out of date.");
    return null;
  }

  return entry;
}
/**
 * Applies equipment that was found in the cache.
 * @param entry The CacheEntry to apply
 */


function applyCached(entry) {
  var e_1, _a;

  try {
    for (var _b = tslib_1.__values(entry.equipment), _c = _b.next(); !_c.done; _c = _b.next()) {
      var _d = tslib_1.__read(_c.value, 2),
          slot = _d[0],
          item = _d[1];

      if (kolmafia_1.equippedItem(slot) !== item && kolmafia_1.availableAmount(item) > 0) {
        kolmafia_1.equip(slot, item);
      }
    }
  } catch (e_1_1) {
    e_1 = {
      error: e_1_1
    };
  } finally {
    try {
      if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
    } finally {
      if (e_1) throw e_1.error;
    }
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) > 0 && entry.rider.get(template_string_1.$item(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))))) {
    kolmafia_1.enthroneFamiliar(entry.rider.get(template_string_1.$item(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) || template_string_1.$familiar(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["none"], ["none"]))));
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_7 || (templateObject_7 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) > 0 && entry.rider.get(template_string_1.$item(templateObject_8 || (templateObject_8 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))))) {
    kolmafia_1.bjornifyFamiliar(entry.rider.get(template_string_1.$item(templateObject_9 || (templateObject_9 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) || template_string_1.$familiar(templateObject_10 || (templateObject_10 = tslib_1.__makeTemplateObject(["none"], ["none"]))));
  }
}
/**
 * Verifies that a CacheEntry was applied successfully.
 * @param entry The CacheEntry to verify
 * @returns If all desired equipment was appliedn in the correct slots.
 */


function verifyCached(entry) {
  var e_2, _a;

  var success = true;

  try {
    for (var _b = tslib_1.__values(entry.equipment), _c = _b.next(); !_c.done; _c = _b.next()) {
      var _d = tslib_1.__read(_c.value, 2),
          slot = _d[0],
          item = _d[1];

      if (kolmafia_1.equippedItem(slot) !== item) {
        logger_1["default"].warning("Failed to apply cached " + item + " in " + slot + ".");
        success = false;
      }
    }
  } catch (e_2_1) {
    e_2 = {
      error: e_2_1
    };
  } finally {
    try {
      if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
    } finally {
      if (e_2) throw e_2.error;
    }
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_11 || (templateObject_11 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) > 0 && entry.rider.get(template_string_1.$item(templateObject_12 || (templateObject_12 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))))) {
    if (entry.rider.get(template_string_1.$item(templateObject_13 || (templateObject_13 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) !== kolmafia_1.myEnthronedFamiliar()) {
      logger_1["default"].warning("Failed to apply " + entry.rider.get(template_string_1.$item(templateObject_14 || (templateObject_14 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) + " in " + template_string_1.$item(templateObject_15 || (templateObject_15 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))) + ".");
      success = false;
    }
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_16 || (templateObject_16 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) > 0 && entry.rider.get(template_string_1.$item(templateObject_17 || (templateObject_17 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))))) {
    if (entry.rider.get(template_string_1.$item(templateObject_18 || (templateObject_18 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) !== kolmafia_1.myBjornedFamiliar()) {
      logger_1["default"].warning("Failed to apply" + entry.rider.get(template_string_1.$item(templateObject_19 || (templateObject_19 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) + " in " + template_string_1.$item(templateObject_20 || (templateObject_20 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))) + ".");
      success = false;
    }
  }

  return success;
}
/**
 * Save current equipment to the objective cache.
 * @param cacheKey The cache key to save.
 */


function saveCached(cacheKey, options) {
  var e_3, _a, e_4, _b, e_5, _c;

  var equipment = new Map();
  var rider = new Map();

  try {
    for (var cachedSlots_1 = tslib_1.__values(cachedSlots), cachedSlots_1_1 = cachedSlots_1.next(); !cachedSlots_1_1.done; cachedSlots_1_1 = cachedSlots_1.next()) {
      var slot = cachedSlots_1_1.value;
      equipment.set(slot, kolmafia_1.equippedItem(slot));
    }
  } catch (e_3_1) {
    e_3 = {
      error: e_3_1
    };
  } finally {
    try {
      if (cachedSlots_1_1 && !cachedSlots_1_1.done && (_a = cachedSlots_1["return"])) _a.call(cachedSlots_1);
    } finally {
      if (e_3) throw e_3.error;
    }
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_21 || (templateObject_21 = tslib_1.__makeTemplateObject(["card sleeve"], ["card sleeve"])))) > 0) {
    equipment.set(template_string_1.$slot(templateObject_22 || (templateObject_22 = tslib_1.__makeTemplateObject(["card-sleeve"], ["card-sleeve"]))), kolmafia_1.equippedItem(template_string_1.$slot(templateObject_23 || (templateObject_23 = tslib_1.__makeTemplateObject(["card-sleeve"], ["card-sleeve"])))));
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_24 || (templateObject_24 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"])))) > 0) {
    rider.set(template_string_1.$item(templateObject_25 || (templateObject_25 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))), kolmafia_1.myEnthronedFamiliar());
  }

  if (kolmafia_1.equippedAmount(template_string_1.$item(templateObject_26 || (templateObject_26 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"])))) > 0) {
    rider.set(template_string_1.$item(templateObject_27 || (templateObject_27 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))), kolmafia_1.myBjornedFamiliar());
  }

  if (options.preventSlot && options.preventSlot.length > 0) {
    try {
      for (var _d = tslib_1.__values(options.preventSlot), _e = _d.next(); !_e.done; _e = _d.next()) {
        var slot = _e.value;
        equipment["delete"](slot);
      }
    } catch (e_4_1) {
      e_4 = {
        error: e_4_1
      };
    } finally {
      try {
        if (_e && !_e.done && (_b = _d["return"])) _b.call(_d);
      } finally {
        if (e_4) throw e_4.error;
      }
    }

    if (options.preventSlot.includes(template_string_1.$slot(templateObject_28 || (templateObject_28 = tslib_1.__makeTemplateObject(["buddy-bjorn"], ["buddy-bjorn"]))))) {
      rider["delete"](template_string_1.$item(templateObject_29 || (templateObject_29 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))));
    }

    if (options.preventSlot.includes(template_string_1.$slot(templateObject_30 || (templateObject_30 = tslib_1.__makeTemplateObject(["crown-of-thrones"], ["crown-of-thrones"]))))) {
      rider["delete"](template_string_1.$item(templateObject_31 || (templateObject_31 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))));
    }
  }

  if (options.onlySlot && options.onlySlot.length > 0) {
    try {
      for (var _f = tslib_1.__values(Slot.all()), _g = _f.next(); !_g.done; _g = _f.next()) {
        var slot = _g.value;

        if (!options.onlySlot.includes(slot)) {
          equipment["delete"](slot);
        }
      }
    } catch (e_5_1) {
      e_5 = {
        error: e_5_1
      };
    } finally {
      try {
        if (_g && !_g.done && (_c = _f["return"])) _c.call(_f);
      } finally {
        if (e_5) throw e_5.error;
      }
    }

    if (!options.onlySlot.includes(template_string_1.$slot(templateObject_32 || (templateObject_32 = tslib_1.__makeTemplateObject(["buddy-bjorn"], ["buddy-bjorn"]))))) {
      rider["delete"](template_string_1.$item(templateObject_33 || (templateObject_33 = tslib_1.__makeTemplateObject(["Buddy Bjorn"], ["Buddy Bjorn"]))));
    }

    if (!options.onlySlot.includes(template_string_1.$slot(templateObject_34 || (templateObject_34 = tslib_1.__makeTemplateObject(["crown-of-thrones"], ["crown-of-thrones"]))))) {
      rider["delete"](template_string_1.$item(templateObject_35 || (templateObject_35 = tslib_1.__makeTemplateObject(["Crown of Thrones"], ["Crown of Thrones"]))));
    }
  }

  cachedObjectives[cacheKey] = new CacheEntry(equipment, rider, kolmafia_1.myFamiliar(), canEquipItemCount());
}
/**
 * Run the maximizer, but only if the objective and certain pieces of game state haven't changed since it was last run.
 * @param objectives Objectives to maximize for.
 * @param options Options for this run of the maximizer.
 * @param options.updateOnFamiliarChange Re-run the maximizer if familiar has changed. Default true.
 * @param options.updateOnCanEquipChanged Re-run the maximizer if stats have changed what can be equipped. Default true.
 * @param options.forceEquip Equipment to force-equip ("equip X").
 * @param options.preventEquip Equipment to prevent equipping ("-equip X").
 * @param options.bonusEquip Equipment to apply a bonus to ("200 bonus X").
 */


function maximizeCached(objectives, options) {
  if (options === void 0) {
    options = {};
  }

  var _a = tslib_1.__assign(tslib_1.__assign({}, defaultMaximizeOptions), options),
      updateOnFamiliarChange = _a.updateOnFamiliarChange,
      updateOnCanEquipChanged = _a.updateOnCanEquipChanged,
      forceEquip = _a.forceEquip,
      preventEquip = _a.preventEquip,
      bonusEquip = _a.bonusEquip,
      onlySlot = _a.onlySlot,
      preventSlot = _a.preventSlot; // Sort each group in objective to ensure consistent ordering in string


  var objective = tslib_1.__spread(objectives.sort(), forceEquip.map(function (item) {
    return "equip " + item;
  }).sort(), preventEquip.map(function (item) {
    return "-equip " + item;
  }).sort(), onlySlot.filter(function (slot) {
    return !template_string_1.$slots(templateObject_36 || (templateObject_36 = tslib_1.__makeTemplateObject(["buddy-bjorn, crown-of-thrones"], ["buddy-bjorn, crown-of-thrones"]))).includes(slot);
  }).map(function (slot) {
    return "" + slot;
  }).sort(), preventSlot.filter(function (slot) {
    return !template_string_1.$slots(templateObject_37 || (templateObject_37 = tslib_1.__makeTemplateObject(["buddy-bjorn, crown-of-thrones"], ["buddy-bjorn, crown-of-thrones"]))).includes(slot);
  }).map(function (slot) {
    return "-" + slot;
  }).sort(), Array.from(bonusEquip.entries()).map(function (_a) {
    var _b = tslib_1.__read(_a, 2),
        item = _b[0],
        bonus = _b[1];

    return Math.round(bonus * 100) / 100 + " bonus " + item;
  }).sort()).join(", ");

  var cacheEntry = checkCache(objective, updateOnFamiliarChange, updateOnCanEquipChanged);

  if (cacheEntry) {
    logger_1["default"].info("Equipment found in maximize cache, equipping...");
    applyCached(cacheEntry);

    if (verifyCached(cacheEntry)) {
      logger_1["default"].info("Equipped cached " + objective);
      return;
    }

    logger_1["default"].warning("Maximize cache application failed, maximizing...");
  }

  kolmafia_1.maximize(objective, false);
  saveCached(objective, options);
}

exports.maximizeCached = maximizeCached;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27, templateObject_28, templateObject_29, templateObject_30, templateObject_31, templateObject_32, templateObject_33, templateObject_34, templateObject_35, templateObject_36, templateObject_37;

/***/ }),

/***/ 6115:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Mood = exports.MagicalSausages = exports.OscusSoda = exports.MpSource = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

var utils_1 = __webpack_require__(8588);

var MpSource =
/** @class */
function () {
  function MpSource() {}

  MpSource.prototype.usesRemaining = function () {
    return null;
  };

  MpSource.prototype.availableMpMax = function () {
    return this.availableMpMin();
  };

  return MpSource;
}();

exports.MpSource = MpSource;

var OscusSoda =
/** @class */
function (_super) {
  tslib_1.__extends(OscusSoda, _super);

  function OscusSoda() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  OscusSoda.prototype.available = function () {
    return lib_1.have(template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Oscus's neverending soda"], ["Oscus's neverending soda"]))));
  };

  OscusSoda.prototype.usesRemaining = function () {
    return property_1.get("oscusSodaUsed") ? 0 : 1;
  };

  OscusSoda.prototype.availableMpMin = function () {
    return this.available() ? 200 : 0;
  };

  OscusSoda.prototype.availableMpMax = function () {
    return this.available() ? 300 : 0;
  };

  OscusSoda.prototype.execute = function () {
    kolmafia_1.use(template_string_1.$item(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Oscus's neverending soda"], ["Oscus's neverending soda"]))));
  };

  OscusSoda.instance = new OscusSoda();
  return OscusSoda;
}(MpSource);

exports.OscusSoda = OscusSoda;

var MagicalSausages =
/** @class */
function (_super) {
  tslib_1.__extends(MagicalSausages, _super);

  function MagicalSausages() {
    return _super !== null && _super.apply(this, arguments) || this;
  }

  MagicalSausages.prototype.usesRemaining = function () {
    return 23 - property_1.get("_sausagesEaten");
  };

  MagicalSausages.prototype.availableMpMin = function () {
    var maxSausages = Math.min(23 - property_1.get("_sausagesEaten"), kolmafia_1.itemAmount(template_string_1.$item(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["magical sausage"], ["magical sausage"])))) + kolmafia_1.itemAmount(template_string_1.$item(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["magical sausage casing"], ["magical sausage casing"])))));
    return Math.min(kolmafia_1.myMaxmp(), 999) * maxSausages;
  };

  MagicalSausages.prototype.execute = function () {
    var mpSpaceAvailable = kolmafia_1.myMaxmp() - kolmafia_1.myMp();
    if (mpSpaceAvailable < 700) return;
    var maxSausages = Math.min(23 - property_1.get("_sausagesEaten"), kolmafia_1.itemAmount(template_string_1.$item(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["magical sausage"], ["magical sausage"])))) + kolmafia_1.itemAmount(template_string_1.$item(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["magical sausage casing"], ["magical sausage casing"])))), Math.floor((kolmafia_1.myMaxmp() - kolmafia_1.myMp()) / Math.min(kolmafia_1.myMaxmp() - kolmafia_1.myMp(), 999)));
    kolmafia_1.retrieveItem(maxSausages, template_string_1.$item(templateObject_7 || (templateObject_7 = tslib_1.__makeTemplateObject(["magical sausage"], ["magical sausage"]))));
    kolmafia_1.eat(maxSausages, template_string_1.$item(templateObject_8 || (templateObject_8 = tslib_1.__makeTemplateObject(["magical sausage"], ["magical sausage"]))));
  };

  MagicalSausages.instance = new MagicalSausages();
  return MagicalSausages;
}(MpSource);

exports.MagicalSausages = MagicalSausages;

var MoodElement =
/** @class */
function () {
  function MoodElement() {}

  MoodElement.prototype.mpCostPerTurn = function () {
    return 0;
  };

  MoodElement.prototype.turnIncrement = function () {
    return 1;
  };

  return MoodElement;
}();

var SkillMoodElement =
/** @class */
function (_super) {
  tslib_1.__extends(SkillMoodElement, _super);

  function SkillMoodElement(skill) {
    var _this = _super.call(this) || this;

    _this.skill = skill;
    return _this;
  }

  SkillMoodElement.prototype.mpCostPerTurn = function () {
    var turns = kolmafia_1.turnsPerCast(this.skill);
    return turns > 0 ? kolmafia_1.mpCost(this.skill) / turns : 0;
  };

  SkillMoodElement.prototype.turnIncrement = function () {
    return kolmafia_1.turnsPerCast(this.skill);
  };

  SkillMoodElement.prototype.execute = function (mood, ensureTurns) {
    var e_1, _a;

    var effect = kolmafia_1.toEffect(this.skill);
    var initialTurns = kolmafia_1.haveEffect(effect);
    if (!kolmafia_1.haveSkill(this.skill)) return false;
    if (initialTurns >= ensureTurns) return true; // Deal with song slots.

    if (mood.options.songSlots.length > 0 && lib_1.isSong(this.skill)) {
      var _loop_1 = function _loop_1(song) {
        var slot = mood.options.songSlots.find(function (slot) {
          return slot.includes(song);
        });
        if (!slot || slot.includes(effect)) kolmafia_1.cliExecute("shrug " + song);
      };

      try {
        for (var _b = tslib_1.__values(lib_1.getActiveSongs()), _c = _b.next(); !_c.done; _c = _b.next()) {
          var song = _c.value;

          _loop_1(song);
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    }

    var oldRemainingCasts = -1;
    var remainingCasts = Math.ceil((ensureTurns - kolmafia_1.haveEffect(effect)) / kolmafia_1.turnsPerCast(this.skill));

    while (remainingCasts > 0 && oldRemainingCasts !== remainingCasts) {
      var maxCasts = void 0;

      if (kolmafia_1.hpCost(this.skill) > 0) {
        // FIXME: restore HP
        maxCasts = Math.floor(kolmafia_1.myHp() / kolmafia_1.hpCost(this.skill));
      } else {
        var cost = kolmafia_1.mpCost(this.skill);
        maxCasts = Math.floor(kolmafia_1.myMp() / cost);

        if (maxCasts === 0) {
          mood.moreMp(cost);
          maxCasts = Math.floor(kolmafia_1.myMp() / cost);
        }
      }

      var casts = utils_1.clamp(remainingCasts, 0, Math.min(100, maxCasts));
      kolmafia_1.useSkill(casts, this.skill);
      oldRemainingCasts = remainingCasts;
      remainingCasts = Math.ceil((ensureTurns - kolmafia_1.haveEffect(effect)) / kolmafia_1.turnsPerCast(this.skill));
    }

    return kolmafia_1.haveEffect(effect) > ensureTurns;
  };

  return SkillMoodElement;
}(MoodElement);

var PotionMoodElement =
/** @class */
function (_super) {
  tslib_1.__extends(PotionMoodElement, _super);

  function PotionMoodElement(potion, maxPricePerTurn) {
    var _this = _super.call(this) || this;

    _this.potion = potion;
    _this.maxPricePerTurn = maxPricePerTurn;
    return _this;
  }

  PotionMoodElement.prototype.execute = function (mood, ensureTurns) {
    // FIXME: Smarter buying logic.
    // FIXME: Allow constructing stuff (e.g. snow cleats)
    var effect = kolmafia_1.effectModifier(this.potion, "Effect");
    var effectTurns = kolmafia_1.haveEffect(effect);
    var turnsPerUse = kolmafia_1.numericModifier(this.potion, "Effect Duration");

    if (kolmafia_1.mallPrice(this.potion) > this.maxPricePerTurn * turnsPerUse) {
      return false;
    }

    if (effectTurns < ensureTurns) {
      var uses = (ensureTurns - effectTurns) / turnsPerUse;
      var quantityToBuy = utils_1.clamp(uses - kolmafia_1.availableAmount(this.potion), 0, 100);
      kolmafia_1.buy(quantityToBuy, this.potion, this.maxPricePerTurn * turnsPerUse);
      var quantityToUse = utils_1.clamp(uses, 0, kolmafia_1.availableAmount(this.potion));
      kolmafia_1.use(quantityToUse, this.potion);
    }

    return kolmafia_1.haveEffect(effect) >= ensureTurns;
  };

  return PotionMoodElement;
}(MoodElement);

var GenieMoodElement =
/** @class */
function (_super) {
  tslib_1.__extends(GenieMoodElement, _super);

  function GenieMoodElement(effect) {
    var _this = _super.call(this) || this;

    _this.effect = effect;
    return _this;
  }

  GenieMoodElement.prototype.execute = function (mood, ensureTurns) {
    if (kolmafia_1.haveEffect(this.effect) >= ensureTurns) return true;
    var neededWishes = Math.ceil((kolmafia_1.haveEffect(this.effect) - ensureTurns) / 20);
    var wishesToBuy = utils_1.clamp(neededWishes - kolmafia_1.availableAmount(template_string_1.$item(templateObject_9 || (templateObject_9 = tslib_1.__makeTemplateObject(["pocket wish"], ["pocket wish"])))), 0, 20);
    kolmafia_1.buy(wishesToBuy, template_string_1.$item(templateObject_10 || (templateObject_10 = tslib_1.__makeTemplateObject(["pocket wish"], ["pocket wish"]))), 50000);
    var wishesToUse = utils_1.clamp(neededWishes, 0, kolmafia_1.availableAmount(template_string_1.$item(templateObject_11 || (templateObject_11 = tslib_1.__makeTemplateObject(["pocket wish"], ["pocket wish"])))));

    for (; wishesToUse > 0; wishesToUse--) {
      kolmafia_1.cliExecute("genie effect " + this.effect.name);
    }

    return kolmafia_1.haveEffect(this.effect) >= ensureTurns;
  };

  return GenieMoodElement;
}(MoodElement);

var CustomMoodElement =
/** @class */
function (_super) {
  tslib_1.__extends(CustomMoodElement, _super);

  function CustomMoodElement(effect, gainEffect) {
    var _this = _super.call(this) || this;

    _this.effect = effect;
    _this.gainEffect = gainEffect !== null && gainEffect !== void 0 ? gainEffect : function () {
      return kolmafia_1.cliExecute(effect["default"]);
    };
    return _this;
  }

  CustomMoodElement.prototype.execute = function (mood, ensureTurns) {
    var currentTurns = kolmafia_1.haveEffect(this.effect);
    var lastCurrentTurns = -1;

    while (currentTurns < ensureTurns && currentTurns !== lastCurrentTurns) {
      this.gainEffect();
      lastCurrentTurns = currentTurns;
      currentTurns = kolmafia_1.haveEffect(this.effect);
    }

    return kolmafia_1.haveEffect(this.effect) > ensureTurns;
  };

  return CustomMoodElement;
}(MoodElement);
/**
 * Class representing a mood object. Add mood elements using the instance methods, which can be chained.
 */


var Mood =
/** @class */
function () {
  /**
   * Construct a new Mood instance.
   * @param options Options for mood.
   */
  function Mood(options) {
    if (options === void 0) {
      options = {};
    }

    this.elements = [];
    this.options = tslib_1.__assign(tslib_1.__assign({}, Mood.defaultOptions), options);
  }
  /**
   * Set default options for new Mood instances.
   * @param options Default options for new Mood instances.
   */


  Mood.setDefaultOptions = function (options) {
    Mood.defaultOptions = tslib_1.__assign(tslib_1.__assign({}, Mood.defaultOptions), options);
  };
  /**
   * Get the MP available for casting skills.
   */


  Mood.prototype.availableMp = function () {
    return this.options.mpSources.map(function (mpSource) {
      return mpSource.availableMpMin();
    }).reduce(function (x, y) {
      return x + y;
    }, 0);
  };

  Mood.prototype.moreMp = function (minimumTarget) {
    var e_2, _a;

    try {
      for (var _b = tslib_1.__values(this.options.mpSources), _c = _b.next(); !_c.done; _c = _b.next()) {
        var mpSource = _c.value;
        var usesRemaining = mpSource.usesRemaining();

        if (usesRemaining !== null && usesRemaining > 0) {
          mpSource.execute();
          if (kolmafia_1.myMp() >= minimumTarget) break;
        }
      }
    } catch (e_2_1) {
      e_2 = {
        error: e_2_1
      };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
      } finally {
        if (e_2) throw e_2.error;
      }
    }
  };
  /**
   * Add a skill to the mood.
   * @param skill Skill to add.
   */


  Mood.prototype.skill = function (skill) {
    this.elements.push(new SkillMoodElement(skill));
    return this;
  };
  /**
   * Add an effect to the mood, with casting based on {effect.default}.
   * @param effect Effect to add.
   * @param gainEffect How to gain the effect. Only runs if we don't have the effect.
   */


  Mood.prototype.effect = function (effect, gainEffect) {
    var skill = kolmafia_1.toSkill(effect);

    if (!gainEffect && skill !== template_string_1.$skill(templateObject_12 || (templateObject_12 = tslib_1.__makeTemplateObject(["none"], ["none"])))) {
      this.skill(skill);
    } else {
      this.elements.push(new CustomMoodElement(effect, gainEffect));
    }

    return this;
  };
  /**
   * Add a potion to the mood.
   * @param potion Potion to add.
   * @param maxPricePerTurn Maximum price to pay per turn of the effect.
   */


  Mood.prototype.potion = function (potion, maxPricePerTurn) {
    this.elements.push(new PotionMoodElement(potion, maxPricePerTurn));
    return this;
  };
  /**
   * Add an effect to acquire via pocket wishes to the mood.
   * @param effect Effect to wish for in the mood.
   */


  Mood.prototype.genie = function (effect) {
    this.elements.push(new GenieMoodElement(effect));
    return this;
  };
  /**
   * Execute the mood, trying to ensure {ensureTurns} of each effect.
   * @param ensureTurns Turns of each effect to try and achieve.
   * @returns Whether or not we successfully got this many turns of every effect in the mood.
   */


  Mood.prototype.execute = function (ensureTurns) {
    var e_3, _a;

    if (ensureTurns === void 0) {
      ensureTurns = 1;
    }

    var availableMp = this.availableMp();
    var totalMpPerTurn = this.elements.map(function (element) {
      return element.mpCostPerTurn();
    }).reduce(function (x, y) {
      return x + y;
    }, 0);
    var potentialTurns = Math.floor(availableMp / totalMpPerTurn);
    var completeSuccess = true;

    try {
      for (var _b = tslib_1.__values(this.elements), _c = _b.next(); !_c.done; _c = _b.next()) {
        var element = _c.value;
        var elementTurns = ensureTurns;

        if (element.mpCostPerTurn() > 0) {
          var elementPotentialTurns = Math.floor(potentialTurns / element.turnIncrement()) * element.turnIncrement();
          elementTurns = Math.min(ensureTurns, elementPotentialTurns);
        }

        completeSuccess = element.execute(this, elementTurns) || completeSuccess;
      }
    } catch (e_3_1) {
      e_3 = {
        error: e_3_1
      };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
      } finally {
        if (e_3) throw e_3.error;
      }
    }

    return completeSuccess;
  };

  Mood.defaultOptions = {
    songSlots: [],
    mpSources: [MagicalSausages.instance, OscusSoda.instance]
  };
  return Mood;
}();

exports.Mood = Mood;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12;

/***/ }),

/***/ 1347:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.PropertiesManager = exports.withChoice = exports.withChoices = exports.withProperty = exports.withProperties = exports.setProperties = exports.set = exports.get = exports.getThrall = exports.getStat = exports.getSlot = exports.getSkill = exports.getServant = exports.getPhylum = exports.getMonster = exports.getLocation = exports.getItem = exports.getFamiliar = exports.getElement = exports.getEffect = exports.getCoinmaster = exports.getClass = exports.getBounty = exports.getNumber = exports.getBoolean = exports.getCommaSeparated = exports.getString = void 0;

var tslib_1 = __webpack_require__(7622);

__webpack_require__(8433);

__webpack_require__(9333);

var kolmafia_1 = __webpack_require__(1664);

var propertyTyping_1 = __webpack_require__(9412);

var createPropertyGetter = function createPropertyGetter(transform) {
  return function (property, default_) {
    var value = kolmafia_1.getProperty(property);

    if (default_ !== undefined && value === "") {
      return default_;
    }

    return transform(value, property);
  };
};

var createMafiaClassPropertyGetter = function createMafiaClassPropertyGetter(Type) {
  return createPropertyGetter(function (value) {
    if (value === "") return null;
    var v = Type.get(value);
    return v === Type.get("none") ? null : v;
  });
};

exports.getString = createPropertyGetter(function (value) {
  return value;
});
exports.getCommaSeparated = createPropertyGetter(function (value) {
  return value.split(/, ?/);
});
exports.getBoolean = createPropertyGetter(function (value) {
  return value === "true";
});
exports.getNumber = createPropertyGetter(function (value) {
  return Number(value);
});
exports.getBounty = createMafiaClassPropertyGetter(Bounty);
exports.getClass = createMafiaClassPropertyGetter(Class);
exports.getCoinmaster = createMafiaClassPropertyGetter(Coinmaster);
exports.getEffect = createMafiaClassPropertyGetter(Effect);
exports.getElement = createMafiaClassPropertyGetter(Element);
exports.getFamiliar = createMafiaClassPropertyGetter(Familiar);
exports.getItem = createMafiaClassPropertyGetter(Item);
exports.getLocation = createMafiaClassPropertyGetter(Location);
exports.getMonster = createMafiaClassPropertyGetter(Monster);
exports.getPhylum = createMafiaClassPropertyGetter(Phylum);
exports.getServant = createMafiaClassPropertyGetter(Servant);
exports.getSkill = createMafiaClassPropertyGetter(Skill);
exports.getSlot = createMafiaClassPropertyGetter(Slot);
exports.getStat = createMafiaClassPropertyGetter(Stat);
exports.getThrall = createMafiaClassPropertyGetter(Thrall);

function get(property, _default) {
  var value = exports.getString(property);

  if (propertyTyping_1.isMonsterProperty(property)) {
    return exports.getMonster(property, _default);
  }

  if (propertyTyping_1.isLocationProperty(property)) {
    return exports.getLocation(property, _default);
  }

  if (value === "") {
    return _default === undefined ? "" : _default;
  }

  if (propertyTyping_1.isBooleanProperty(property, value)) {
    return exports.getBoolean(property, _default);
  }

  if (propertyTyping_1.isNumericProperty(property, value)) {
    return exports.getNumber(property, _default);
  }

  return value;
}

exports.get = get;

function set(property, value) {
  var stringValue = value === null ? "" : value.toString();
  kolmafia_1.setProperty(property, stringValue);
}

exports.set = set;

function setProperties(properties) {
  var e_1, _a;

  try {
    for (var _b = tslib_1.__values(Object.entries(properties)), _c = _b.next(); !_c.done; _c = _b.next()) {
      var _d = tslib_1.__read(_c.value, 2),
          prop = _d[0],
          value = _d[1];

      set(prop, value);
    }
  } catch (e_1_1) {
    e_1 = {
      error: e_1_1
    };
  } finally {
    try {
      if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
    } finally {
      if (e_1) throw e_1.error;
    }
  }
}

exports.setProperties = setProperties;

function withProperties(properties, callback) {
  var propertiesBackup = Object.fromEntries(Object.entries(properties).map(function (_a) {
    var _b = tslib_1.__read(_a, 1),
        prop = _b[0];

    return [prop, get(prop)];
  }));
  setProperties(properties);

  try {
    callback();
  } finally {
    setProperties(propertiesBackup);
  }
}

exports.withProperties = withProperties;

function withProperty(property, value, callback) {
  var _a;

  withProperties((_a = {}, _a[property] = value, _a), callback);
}

exports.withProperty = withProperty;

function withChoices(choices, callback) {
  var properties = Object.fromEntries(Object.entries(choices).map(function (_a) {
    var _b = tslib_1.__read(_a, 2),
        choice = _b[0],
        option = _b[1];

    return ["choiceAdventure" + choice, option];
  }));
  withProperties(properties, callback);
}

exports.withChoices = withChoices;

function withChoice(choice, value, callback) {
  var _a;

  withChoices((_a = {}, _a[choice] = value, _a), callback);
}

exports.withChoice = withChoice;

var PropertiesManager =
/** @class */
function () {
  function PropertiesManager() {
    this.properties = {};
  }

  PropertiesManager.prototype.set = function (propertiesToSet) {
    var e_2, _a;

    try {
      for (var _b = tslib_1.__values(Object.entries(propertiesToSet)), _c = _b.next(); !_c.done; _c = _b.next()) {
        var _d = tslib_1.__read(_c.value, 2),
            propertyName = _d[0],
            propertyValue = _d[1];

        if (this.properties[propertyName] === undefined) {
          this.properties[propertyName] = get(propertyName);
        }

        set(propertyName, propertyValue);
      }
    } catch (e_2_1) {
      e_2 = {
        error: e_2_1
      };
    } finally {
      try {
        if (_c && !_c.done && (_a = _b["return"])) _a.call(_b);
      } finally {
        if (e_2) throw e_2.error;
      }
    }
  };

  PropertiesManager.prototype.setChoices = function (choicesToSet) {
    this.set(Object.fromEntries(Object.entries(choicesToSet).map(function (_a) {
      var _b = tslib_1.__read(_a, 2),
          choiceNumber = _b[0],
          choiceValue = _b[1];

      return ["choiceAdventure" + choiceNumber, choiceValue];
    })));
  };

  PropertiesManager.prototype.resetAll = function () {
    Object.entries(this.properties).forEach(function (_a) {
      var _b = tslib_1.__read(_a, 2),
          propertyName = _b[0],
          propertyValue = _b[1];

      return set(propertyName, propertyValue);
    });
  };

  return PropertiesManager;
}();

exports.PropertiesManager = PropertiesManager;

/***/ }),

/***/ 9412:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.isStatProperty = exports.isFamiliarProperty = exports.isMonsterProperty = exports.isLocationProperty = exports.isBooleanProperty = exports.isNumericOrStringProperty = exports.isNumericProperty = void 0;

function isNumericProperty(property, value) {
  return !isNaN(Number(value)) && !isNaN(parseFloat(value));
}

exports.isNumericProperty = isNumericProperty;
var choiceAdventurePattern = /^choiceAdventure\d+$/;

function isNumericOrStringProperty(property) {
  return choiceAdventurePattern.test(property);
}

exports.isNumericOrStringProperty = isNumericOrStringProperty;
var fakeBooleans = ["trackVoteMonster", "_jickJarAvailable"];

function isBooleanProperty(property, value) {
  if (fakeBooleans.includes(property)) return false;
  return ["true", "false"].includes(value);
}

exports.isBooleanProperty = isBooleanProperty;
var otherLocations = ["nextSpookyravenElizabethRoom", "nextSpookyravenStephenRoom", "sourceOracleTarget"];

function isLocationProperty(property) {
  return otherLocations.includes(property) || property.endsWith("Location");
}

exports.isLocationProperty = isLocationProperty;
var otherMonsters = ["romanticTarget", "yearbookCameraTarget"];

function isMonsterProperty(property) {
  if (otherMonsters.includes(property)) return true;
  return property.endsWith("Monster");
}

exports.isMonsterProperty = isMonsterProperty;

function isFamiliarProperty(property) {
  return property.endsWith("Familiar");
}

exports.isFamiliarProperty = isFamiliarProperty;
var statProps = ["nsChallenge1", "shrugTopper", "snojoSetting"];

function isStatProperty(property) {
  return statProps.includes(property);
}

exports.isStatProperty = isStatProperty;

/***/ }),

/***/ 5661:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.prepareRunaway = exports.canRunaway = exports.couldRunaway = exports.getRemainingRunaways = exports.getMaxRunaways = exports.getRunaways = exports.have = exports.familiar = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

var lib_1 = __webpack_require__(3311);

exports.familiar = template_string_1.$familiar(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Frumious Bandersnatch"], ["Frumious Bandersnatch"])));
/**
 * Returns true if the player has the Frumious Bandersnatch in their
 * terrariukm
 */

function have() {
  return lib_1.have(exports.familiar);
}

exports.have = have;
/**
 * Returns the number of free runaways that have already been used
 * @see StompingBoots with which the Bandersnatch shares a counter
 */

function getRunaways() {
  return property_1.get("_banderRunaways");
}

exports.getRunaways = getRunaways;
/**
 * Returns the total number of free runaways that the player can
 * get from their Bandersnatch
 *
 * @param considerWeightAdjustment Include familiar weight modifiers
 */

function getMaxRunaways(considerWeightAdjustment) {
  if (considerWeightAdjustment === void 0) {
    considerWeightAdjustment = true;
  }

  var weightBuffs = considerWeightAdjustment ? kolmafia_1.weightAdjustment() : 0;
  return Math.floor((kolmafia_1.familiarWeight(exports.familiar) + weightBuffs) / 5);
}

exports.getMaxRunaways = getMaxRunaways;
/**
 * Returns the number of remaining free runaways the player can
 * get from their Bandersnatch
 *
 * @param considerWeightAdjustment
 */

function getRemainingRunaways(considerWeightAdjustment) {
  if (considerWeightAdjustment === void 0) {
    considerWeightAdjustment = true;
  }

  return Math.max(0, getMaxRunaways(considerWeightAdjustment) - getRunaways());
}

exports.getRemainingRunaways = getRemainingRunaways;
/**
 * Returns true if the player could use their Bandersnatch to
 * get a free run in theory
 *
 * @param considerWeightAdjustment Include familiar weight modifiers
 */

function couldRunaway(considerWeightAdjustment) {
  if (considerWeightAdjustment === void 0) {
    considerWeightAdjustment = true;
  }

  return have() && getRemainingRunaways(considerWeightAdjustment) > 0;
}

exports.couldRunaway = couldRunaway;
var odeSkill = template_string_1.$skill(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["The Ode to Booze"], ["The Ode to Booze"])));
var odeEffect = template_string_1.$effect(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["Ode to Booze"], ["Ode to Booze"])));
/**
 * Returns true if the player can use their Bandersnatch to get a
 * free run right now
 */

function canRunaway() {
  return lib_1.isCurrentFamiliar(exports.familiar) && couldRunaway() && lib_1.have(odeEffect);
}

exports.canRunaway = canRunaway;
/**
 * Prepare a Bandersnatch runaway.
 *
 * This will cast Ode to Booze and equip take your Bandersnatch with you.
 * If any of those steps fail, it will return false.
 *
 * @param songsToRemove Ordered list of songs that could be shrugged to make room for Ode to Booze
 */

function prepareRunaway(songsToRemove) {
  var e_1, _a;

  if (!lib_1.have(odeEffect)) {
    if (!lib_1.have(odeSkill)) {
      return false;
    }

    if (!lib_1.canRememberSong()) {
      var activeSongs = lib_1.getActiveSongs();

      try {
        for (var songsToRemove_1 = tslib_1.__values(songsToRemove), songsToRemove_1_1 = songsToRemove_1.next(); !songsToRemove_1_1.done; songsToRemove_1_1 = songsToRemove_1.next()) {
          var song = songsToRemove_1_1.value;

          if (activeSongs.includes(song) && lib_1.uneffect(song)) {
            break;
          }
        }
      } catch (e_1_1) {
        e_1 = {
          error: e_1_1
        };
      } finally {
        try {
          if (songsToRemove_1_1 && !songsToRemove_1_1.done && (_a = songsToRemove_1["return"])) _a.call(songsToRemove_1);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
    }

    if (!kolmafia_1.useSkill(odeSkill)) {
      return false;
    }
  }

  return kolmafia_1.useFamiliar(exports.familiar);
}

exports.prepareRunaway = prepareRunaway;
var templateObject_1, templateObject_2, templateObject_3;

/***/ }),

/***/ 7235:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.useSpookyPuttySheet = exports.getSpookyPuttySheetMonster = exports.prepareSpookyPuttySheet = exports.getSpookyPuttySheetCopiesMade = exports.have = exports.sheet = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.sheet = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Spooky Putty sheet"], ["Spooky Putty sheet"])));

function have() {
  return lib_1.getFoldGroup(exports.sheet).some(function (item) {
    return lib_1.have(item);
  });
}

exports.have = have;

function getSpookyPuttySheetCopiesMade() {
  return Math.max(0, property_1.get("spookyPuttyCopiesMade"));
}

exports.getSpookyPuttySheetCopiesMade = getSpookyPuttySheetCopiesMade;

function prepareSpookyPuttySheet() {
  if (!have()) return false;
  if (lib_1.have(exports.sheet)) return true;
  return kolmafia_1.cliExecute("fold Spooky putty sheet");
}

exports.prepareSpookyPuttySheet = prepareSpookyPuttySheet;

function getSpookyPuttySheetMonster() {
  return property_1.get("spookyPuttyMonster");
}

exports.getSpookyPuttySheetMonster = getSpookyPuttySheetMonster;

function useSpookyPuttySheet() {
  return kolmafia_1.use(exports.sheet);
}

exports.useSpookyPuttySheet = useSpookyPuttySheet;
var templateObject_1;

/***/ }),

/***/ 3758:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.BadlyRomanticArrow = exports.getBadlyRomanticArrowMonster = exports.canUseBadlyRomanticArrow = exports.prepareBadlyRomanticArrow = exports.couldUseBadlyRomanticArrow = exports.haveBadlyRomanticArrowUsesRemaining = exports.getBadlyRomanticArrowUses = exports.have = exports.familiar = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var Copier_1 = __webpack_require__(2219);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.familiar = template_string_1.$familiar(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Obtuse Angel"], ["Obtuse Angel"])));
/**
 * Returns true if the player has an Obtuse Angel
 */

function have() {
  return lib_1.have(exports.familiar);
}

exports.have = have;
/**
 * Returns number of badly romantic arrows used
 */

function getBadlyRomanticArrowUses() {
  return Math.max(0, property_1.get("_badlyRomanticArrows"));
}

exports.getBadlyRomanticArrowUses = getBadlyRomanticArrowUses;
/**
 * Returns true if badly romantic arrow can still be used
 */

function haveBadlyRomanticArrowUsesRemaining() {
  return getBadlyRomanticArrowUses() === 0;
}

exports.haveBadlyRomanticArrowUsesRemaining = haveBadlyRomanticArrowUsesRemaining;
/**
 * Returns true if the player could use badly romantic arrow in theory
 */

function couldUseBadlyRomanticArrow() {
  return have() && haveBadlyRomanticArrowUsesRemaining();
}

exports.couldUseBadlyRomanticArrow = couldUseBadlyRomanticArrow;
/**
 * Prepares badly romantic arrow for use
 */

function prepareBadlyRomanticArrow() {
  return kolmafia_1.useFamiliar(exports.familiar);
}

exports.prepareBadlyRomanticArrow = prepareBadlyRomanticArrow;
/**
 * Returns true if the player can use badly romantic arrow right now
 */

function canUseBadlyRomanticArrow() {
  return lib_1.isCurrentFamiliar(exports.familiar) && haveBadlyRomanticArrowUsesRemaining();
}

exports.canUseBadlyRomanticArrow = canUseBadlyRomanticArrow;
/**
 * Returns the current badly romantic arrow monster target
 */

function getBadlyRomanticArrowMonster() {
  return property_1.get("romanticTarget");
}

exports.getBadlyRomanticArrowMonster = getBadlyRomanticArrowMonster;
exports.BadlyRomanticArrow = new Copier_1.Copier(function () {
  return couldUseBadlyRomanticArrow();
}, function () {
  return prepareBadlyRomanticArrow();
}, function () {
  return canUseBadlyRomanticArrow();
}, function () {
  return getBadlyRomanticArrowMonster();
});
var templateObject_1;

/***/ }),

/***/ 4945:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.useRainDohBlackBox = exports.getRainDohBlackBoxMonster = exports.getRainDohBlackBoxCopiesMade = exports.have = exports.box = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.box = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Rain-Doh black box"], ["Rain-Doh black box"])));

function have() {
  return lib_1.getFoldGroup(exports.box).some(function (item) {
    return lib_1.have(item);
  });
}

exports.have = have;

function getRainDohBlackBoxCopiesMade() {
  return Math.max(0, property_1.get("_raindohCopiesMade"));
}

exports.getRainDohBlackBoxCopiesMade = getRainDohBlackBoxCopiesMade;

function getRainDohBlackBoxMonster() {
  return property_1.get("rainDohMonster");
}

exports.getRainDohBlackBoxMonster = getRainDohBlackBoxMonster;

function useRainDohBlackBox() {
  return kolmafia_1.use(exports.box);
}

exports.useRainDohBlackBox = useRainDohBlackBox;
var templateObject_1;

/***/ }),

/***/ 5915:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.UnfinishedIceSculpture = exports.getUnfinishedIceSculptureMonster = exports.couldUseUnfinishedIceSculpture = exports.isUnfinishedIceSculptureUsed = exports.haveUnfinishedIceSculpture = exports.have = void 0;

var tslib_1 = __webpack_require__(7622);

var Copier_1 = __webpack_require__(2219);

var property_1 = __webpack_require__(1347);

var lib_1 = __webpack_require__(3311);

var template_string_1 = __webpack_require__(678);

function have() {
  return lib_1.haveInCampground(template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["packet of winter seeds"], ["packet of winter seeds"]))));
}

exports.have = have;

function haveUnfinishedIceSculpture() {
  return lib_1.have(template_string_1.$item(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["unfinished ice sculpture"], ["unfinished ice sculpture"]))));
}

exports.haveUnfinishedIceSculpture = haveUnfinishedIceSculpture;

function isUnfinishedIceSculptureUsed() {
  return property_1.get("_iceSculptureUsed");
}

exports.isUnfinishedIceSculptureUsed = isUnfinishedIceSculptureUsed;

function couldUseUnfinishedIceSculpture() {
  return lib_1.have(template_string_1.$item(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["unfinished ice sculpture"], ["unfinished ice sculpture"])))) && !lib_1.have(template_string_1.$item(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["ice sculpture"], ["ice sculpture"]))));
}

exports.couldUseUnfinishedIceSculpture = couldUseUnfinishedIceSculpture;

function getUnfinishedIceSculptureMonster() {
  return property_1.get("iceSculptureMonster");
}

exports.getUnfinishedIceSculptureMonster = getUnfinishedIceSculptureMonster;
exports.UnfinishedIceSculpture = new Copier_1.Copier(function () {
  return couldUseUnfinishedIceSculpture();
}, null, function () {
  return couldUseUnfinishedIceSculpture();
}, function () {
  return getUnfinishedIceSculptureMonster();
});
var templateObject_1, templateObject_2, templateObject_3, templateObject_4;

/***/ }),

/***/ 7975:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.changeNightstand = exports.changeCeiling = exports.changeDesk = exports.getNightstand = exports.getCeiling = exports.getDesk = exports.fightPainting = exports.paintingFought = exports.paintingMonster = exports.have = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var template_string_1 = __webpack_require__(678);

var property_1 = __webpack_require__(1347);

function have() {
  return property_1.get("chateauAvailable");
}

exports.have = have;

function paintingMonster() {
  return property_1.get("chateauMonster");
}

exports.paintingMonster = paintingMonster;

function paintingFought() {
  return property_1.get("_chateauMonsterFought");
}

exports.paintingFought = paintingFought;

function fightPainting() {
  kolmafia_1.visitUrl("place.php?whichplace=chateau&action=chateau_painting", false);
  return kolmafia_1.runCombat();
}

exports.fightPainting = fightPainting;
var desks = template_string_1.$items(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["fancy stationery set, Swiss piggy bank, continental juice bar"], ["fancy stationery set, Swiss piggy bank, continental juice bar"])));
var ceilings = template_string_1.$items(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["antler chandelier, ceiling fan, artificial skylight"], ["antler chandelier, ceiling fan, artificial skylight"])));
var nightstands = template_string_1.$items(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["foreign language tapes, bowl of potpourri, electric muscle stimulator"], ["foreign language tapes, bowl of potpourri, electric muscle stimulator"])));

function getDesk() {
  return desks.find(function (desk) {
    return Object.keys(kolmafia_1.getChateau()).includes(desk.name);
  }) || template_string_1.$item(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["none"], ["none"])));
}

exports.getDesk = getDesk;

function getCeiling() {
  return ceilings.find(function (ceiling) {
    return Object.keys(kolmafia_1.getChateau()).includes(ceiling.name);
  }) || template_string_1.$item(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["none"], ["none"])));
}

exports.getCeiling = getCeiling;

function getNightstand() {
  return nightstands.find(function (nightstand) {
    return Object.keys(kolmafia_1.getChateau()).includes(nightstand.name);
  }) || template_string_1.$item(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["none"], ["none"])));
}

exports.getNightstand = getNightstand;

function changeDesk(desk) {
  if (getDesk() === desk) return true;
  if (!desks.includes(desk)) return false;
  kolmafia_1.buy(desk);
  return getDesk() === desk;
}

exports.changeDesk = changeDesk;

function changeCeiling(ceiling) {
  if (getCeiling() === ceiling) return true;
  if (!ceilings.includes(ceiling)) return false;
  kolmafia_1.buy(ceiling);
  return getCeiling() === ceiling;
}

exports.changeCeiling = changeCeiling;

function changeNightstand(nightstand) {
  if (getNightstand() === nightstand) return true;
  if (!nightstands.includes(nightstand)) return false;
  kolmafia_1.buy(nightstand);
  return getNightstand() === nightstand;
}

exports.changeNightstand = changeNightstand;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6;

/***/ }),

/***/ 1577:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.getPortscanUses = exports.getEnhanceUses = exports.getDuplicateUses = exports.Digitize = exports.canDigitize = exports.prepareDigitize = exports.couldDigitize = exports.getDigitizeUsesRemaining = exports.getMaximumDigitizeUses = exports.getDigitizeMonsterCount = exports.getDigitizeMonster = exports.getDigitizeUses = exports.getChips = exports.extrude = exports.Items = exports.isCurrentSkill = exports.getSkills = exports.educate = exports.Skills = exports.enquiry = exports.RolloverBuffs = exports.enhance = exports.Buffs = exports.have = exports.item = void 0;

var tslib_1 = __webpack_require__(7622);

__webpack_require__(5266);

var kolmafia_1 = __webpack_require__(1664);

var isEqual_1 = tslib_1.__importDefault(__webpack_require__(7120));

var Copier_1 = __webpack_require__(2219);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.item = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Source terminal"], ["Source terminal"])));

function have() {
  return lib_1.haveInCampground(exports.item);
}

exports.have = have;
/**
 * Buffs that can be acquired from Enhance
 *
 * - Items: +30% Item Drop
 * - Meat: +60% Meat Drop
 * - Init: +50% Initiative
 * - Critical: +10% chance of Critical Hit, +10% chance of Spell Critical Hit
 * - Damage: +5 Prismatic Damage
 * - Substats: +3 Stats Per Fight
 */

exports.Buffs = {
  Items: template_string_1.$effect(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["items.enh"], ["items.enh"]))),
  Meat: template_string_1.$effect(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["meat.enh"], ["meat.enh"]))),
  Init: template_string_1.$effect(templateObject_4 || (templateObject_4 = tslib_1.__makeTemplateObject(["init.enh"], ["init.enh"]))),
  Critical: template_string_1.$effect(templateObject_5 || (templateObject_5 = tslib_1.__makeTemplateObject(["critical.enh"], ["critical.enh"]))),
  Damage: template_string_1.$effect(templateObject_6 || (templateObject_6 = tslib_1.__makeTemplateObject(["damage.enh"], ["damage.enh"]))),
  Substats: template_string_1.$effect(templateObject_7 || (templateObject_7 = tslib_1.__makeTemplateObject(["substats.enh"], ["substats.enh"])))
};
/**
 * Acquire a buff from the Source Terminal
 * @param buff The buff to acquire
 * @see Buffs
 */

function enhance(buff) {
  if (!Object.values(exports.Buffs).includes(buff)) {
    return false;
  }

  return kolmafia_1.cliExecute("terminal enhance " + buff.name);
}

exports.enhance = enhance;
/**
 * Rollover buffs that can be acquired from Enquiry
 */

exports.RolloverBuffs = {
  /** +5 Familiar Weight */
  Familiar: template_string_1.$effect(templateObject_8 || (templateObject_8 = tslib_1.__makeTemplateObject(["familiar.enq"], ["familiar.enq"]))),

  /** +25 ML */
  Monsters: template_string_1.$effect(templateObject_9 || (templateObject_9 = tslib_1.__makeTemplateObject(["monsters.enq"], ["monsters.enq"]))),

  /** +5 Prismatic Resistance */
  Protect: template_string_1.$effect(templateObject_10 || (templateObject_10 = tslib_1.__makeTemplateObject(["protect.enq"], ["protect.enq"]))),

  /** +100% Muscle, +100% Mysticality, +100% Moxie */
  Stats: template_string_1.$effect(templateObject_11 || (templateObject_11 = tslib_1.__makeTemplateObject(["stats.enq"], ["stats.enq"])))
};
/**
 * Acquire a buff from the Source Terminal
 * @param buff The buff to acquire
 * @see RolloverBuffs
 */

function enquiry(rolloverBuff) {
  if (!Object.values(exports.RolloverBuffs).includes(rolloverBuff)) {
    return false;
  }

  return kolmafia_1.cliExecute("terminal enquiry " + rolloverBuff.name);
}

exports.enquiry = enquiry;
/**
 * Skills that can be acquired from Enhance
 */

exports.Skills = {
  /** Collect Source essence from enemies once per combat */
  Extract: template_string_1.$skill(templateObject_12 || (templateObject_12 = tslib_1.__makeTemplateObject(["Extract"], ["Extract"]))),

  /** Stagger and create a wandering monster 1-3 times per day */
  Digitize: template_string_1.$skill(templateObject_13 || (templateObject_13 = tslib_1.__makeTemplateObject(["Digitize"], ["Digitize"]))),

  /** Stagger and deal 25% of enemy HP in damage once per combat */
  Compress: template_string_1.$skill(templateObject_14 || (templateObject_14 = tslib_1.__makeTemplateObject(["Compress"], ["Compress"]))),

  /** Double monster's HP, attack, defence, attacks per round and item drops once per fight and once per day (five in The Source) */
  Duplicate: template_string_1.$skill(templateObject_15 || (templateObject_15 = tslib_1.__makeTemplateObject(["Duplicate"], ["Duplicate"]))),

  /** Causes government agent/Source Agent wanderer next turn once per combat and three times per day */
  Portscan: template_string_1.$skill(templateObject_16 || (templateObject_16 = tslib_1.__makeTemplateObject(["Portscan"], ["Portscan"]))),

  /** Increase Max MP by 100% and recover 1000 MP once per combat with a 30 turn cooldown */
  Turbo: template_string_1.$skill(templateObject_17 || (templateObject_17 = tslib_1.__makeTemplateObject(["Turbo"], ["Turbo"])))
};
/**
 * Make a skill available.
 * The Source Terminal can give the player access to two skills at any time
 * @param skill Skill to learn
 * @see Skills
 */

function educate(skills) {
  var e_1, _a;

  var skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];
  if (isEqual_1["default"](skillsArray, getSkills())) return true;

  try {
    for (var skillsArray_1 = tslib_1.__values(skillsArray), skillsArray_1_1 = skillsArray_1.next(); !skillsArray_1_1.done; skillsArray_1_1 = skillsArray_1.next()) {
      var skill = skillsArray_1_1.value;
      if (!Object.values(exports.Skills).includes(skill)) return false;
      kolmafia_1.cliExecute("terminal educate " + skill.name.toLowerCase() + ".edu");
    }
  } catch (e_1_1) {
    e_1 = {
      error: e_1_1
    };
  } finally {
    try {
      if (skillsArray_1_1 && !skillsArray_1_1.done && (_a = skillsArray_1["return"])) _a.call(skillsArray_1);
    } finally {
      if (e_1) throw e_1.error;
    }
  }

  return true;
}

exports.educate = educate;
/**
 * Return the Skills currently available from Source Terminal
 */

function getSkills() {
  return ["sourceTerminalEducate1", "sourceTerminalEducate2"].map(function (p) {
    return property_1.get(p);
  }).filter(function (s) {
    return s !== "";
  }).map(function (s) {
    return Skill.get(s.slice(0, -4));
  });
}

exports.getSkills = getSkills;

function isCurrentSkill(skills) {
  var currentSkills = getSkills();
  var skillsArray = Array.isArray(skills) ? skills.slice(0, 2) : [skills];
  return skillsArray.every(function (skill) {
    return currentSkills.includes(skill);
  });
}

exports.isCurrentSkill = isCurrentSkill;
/**
 * Items that can be generated by the Source Terminal
 */

exports.Items = {
  /** 4 fullness EPIC food */
  BrowserCookie: template_string_1.$item(templateObject_18 || (templateObject_18 = tslib_1.__makeTemplateObject(["browser cookie"], ["browser cookie"]))),

  /** 4 potency EPIC booze */
  HackedGibson: template_string_1.$item(templateObject_19 || (templateObject_19 = tslib_1.__makeTemplateObject(["hacked gibson"], ["hacked gibson"]))),

  /** +10% item drop, improved yield from extraction skill */
  Shades: template_string_1.$item(templateObject_20 || (templateObject_20 = tslib_1.__makeTemplateObject(["Source shades"], ["Source shades"]))),
  GRAM: template_string_1.$item(templateObject_21 || (templateObject_21 = tslib_1.__makeTemplateObject(["Source terminal GRAM chip"], ["Source terminal GRAM chip"]))),
  PRAM: template_string_1.$item(templateObject_22 || (templateObject_22 = tslib_1.__makeTemplateObject(["Source terminal PRAM chip"], ["Source terminal PRAM chip"]))),
  SPAM: template_string_1.$item(templateObject_23 || (templateObject_23 = tslib_1.__makeTemplateObject(["Source terminal SPAM chip"], ["Source terminal SPAM chip"]))),
  CRAM: template_string_1.$item(templateObject_24 || (templateObject_24 = tslib_1.__makeTemplateObject(["Source terminal CRAM chip"], ["Source terminal CRAM chip"]))),
  DRAM: template_string_1.$item(templateObject_25 || (templateObject_25 = tslib_1.__makeTemplateObject(["Source terminal DRAM chip"], ["Source terminal DRAM chip"]))),

  /** Increase maximum daily casts of Digitze by one, usable once per player */
  TRAM: template_string_1.$item(templateObject_26 || (templateObject_26 = tslib_1.__makeTemplateObject(["Source terminal TRAM chip"], ["Source terminal TRAM chip"]))),
  SoftwareBug: template_string_1.$item(templateObject_27 || (templateObject_27 = tslib_1.__makeTemplateObject(["software bug"], ["software bug"])))
};
/**
 * Collect an item from the Source Terminal (up to three times a day)
 * @param item Item to collect
 * @see Items
 */

function extrude(item) {
  if (!Object.values(exports.Items).includes(item)) {
    return false;
  }

  return kolmafia_1.cliExecute("terminal extrude " + item.name);
}

exports.extrude = extrude;
/**
 * Return chips currently installed to player's Source Terminal
 */

function getChips() {
  return property_1.get("sourceTerminalChips").split(",");
}

exports.getChips = getChips;
/**
 * Return number of times digitize was cast today
 */

function getDigitizeUses() {
  return property_1.get("_sourceTerminalDigitizeUses");
}

exports.getDigitizeUses = getDigitizeUses;
/**
 * Return Monster that is currently digitized, else null
 */

function getDigitizeMonster() {
  return property_1.get("_sourceTerminalDigitizeMonster");
}

exports.getDigitizeMonster = getDigitizeMonster;
/**
 * Return number of digitized monsters encountered since it was last cast
 */

function getDigitizeMonsterCount() {
  return property_1.get("_sourceTerminalDigitizeMonsterCount");
}

exports.getDigitizeMonsterCount = getDigitizeMonsterCount;
/**
 * Return maximum number of digitizes player can cast
 */

function getMaximumDigitizeUses() {
  var chips = getChips();
  return 1 + (chips.includes("TRAM") ? 1 : 0) + (chips.includes("TRIGRAM") ? 1 : 0);
}

exports.getMaximumDigitizeUses = getMaximumDigitizeUses;
/**
 * Returns the current day's number of remaining digitize uses
 */

function getDigitizeUsesRemaining() {
  return getMaximumDigitizeUses() - getDigitizeUses();
}

exports.getDigitizeUsesRemaining = getDigitizeUsesRemaining;
/**
 * Returns whether the player could theoretically cast Digitize
 */

function couldDigitize() {
  return getDigitizeUses() < getMaximumDigitizeUses();
}

exports.couldDigitize = couldDigitize;

function prepareDigitize() {
  if (!isCurrentSkill(exports.Skills.Digitize)) {
    return educate(exports.Skills.Digitize);
  }

  return true;
}

exports.prepareDigitize = prepareDigitize;
/**
 * Returns whether the player can cast Digitize immediately
 * This only considers whether the player has learned the skill
 * and has sufficient daily casts remaining, not whether they have sufficient MP
 */

function canDigitize() {
  return couldDigitize() && getSkills().includes(exports.Skills.Digitize);
}

exports.canDigitize = canDigitize;
exports.Digitize = new Copier_1.Copier(function () {
  return couldDigitize();
}, function () {
  return prepareDigitize();
}, function () {
  return canDigitize();
}, function () {
  return getDigitizeMonster();
});
/**
 * Return number of times duplicate was cast today
 */

function getDuplicateUses() {
  return property_1.get("_sourceTerminalDuplicateUses");
}

exports.getDuplicateUses = getDuplicateUses;
/**
 * Return number of times enhance was cast today
 */

function getEnhanceUses() {
  return property_1.get("_sourceTerminalEnhanceUses");
}

exports.getEnhanceUses = getEnhanceUses;
/**
 * Return number of times portscan was cast today
 */

function getPortscanUses() {
  return property_1.get("_sourceTerminalPortscanUses");
}

exports.getPortscanUses = getPortscanUses;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21, templateObject_22, templateObject_23, templateObject_24, templateObject_25, templateObject_26, templateObject_27;

/***/ }),

/***/ 7271:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.fightPiece = exports.pieces = exports.fightsDone = exports.have = exports.item = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.item = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Witchess Set"], ["Witchess Set"])));

function have() {
  return lib_1.haveInCampground(exports.item);
}

exports.have = have;

function fightsDone() {
  return property_1.get("_witchessFights");
}

exports.fightsDone = fightsDone;
exports.pieces = Monster.get(["Witchess Pawn", "Witchess Knight", "Witchess Bishop", "Witchess Rook", "Witchess Queen", "Witchess King", "Witchess Witch", "Witchess Ox"]);

function fightPiece(piece) {
  if (!exports.pieces.includes(piece)) throw new Error("That is not a valid piece.");

  if (!kolmafia_1.visitUrl("campground.php?action=witchess").includes("whichchoice value=1181")) {
    throw new Error("Failed to open Witchess.");
  }

  if (!kolmafia_1.runChoice(1).includes("whichchoice=1182")) {
    throw new Error("Failed to visit shrink ray.");
  }

  if (!kolmafia_1.visitUrl("choice.php?option=1&pwd=" + kolmafia_1.myHash() + "&whichchoice=1182&piece=" + kolmafia_1.toInt(piece), false).includes(piece.name)) {
    throw new Error("Failed to start fight.");
  }

  return kolmafia_1.runCombat();
}

exports.fightPiece = fightPiece;
var templateObject_1;

/***/ }),

/***/ 6255:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.fightAll = exports.LovEnamorang = exports.getLovEnamorangMonster = exports.couldUseLoveEnamorang = exports.getLovEnamorangUses = exports.haveLovEnamorang = exports.isUsed = exports.have = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var Copier_1 = __webpack_require__(2219);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

function have() {
  return property_1.get("loveTunnelAvailable");
}

exports.have = have;

function isUsed() {
  return property_1.get("_loveTunnelUsed");
}

exports.isUsed = isUsed;

function haveLovEnamorang() {
  return lib_1.have(template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["LOV Enamorang"], ["LOV Enamorang"]))));
}

exports.haveLovEnamorang = haveLovEnamorang;

function getLovEnamorangUses() {
  return property_1.get("_enamorangs");
}

exports.getLovEnamorangUses = getLovEnamorangUses;

function couldUseLoveEnamorang() {
  return !lib_1.haveWandererCounter(lib_1.Wanderer.Enamorang) && getLovEnamorangUses() < 3 && haveLovEnamorang();
}

exports.couldUseLoveEnamorang = couldUseLoveEnamorang;

function getLovEnamorangMonster() {
  return property_1.get("enamorangMonster");
}

exports.getLovEnamorangMonster = getLovEnamorangMonster;
exports.LovEnamorang = new Copier_1.Copier(function () {
  return couldUseLoveEnamorang();
}, null, function () {
  return couldUseLoveEnamorang();
}, function () {
  return getLovEnamorangMonster();
});

function equipmentChoice(equipment) {
  switch (equipment) {
    case "LOV Eardigan":
      return 1;

    case "LOV Epaulettes":
      return 2;

    case "LOV Earring":
      return 3;
  }
}

function effectChoice(effect) {
  switch (effect) {
    case "Lovebotamy":
      return 1;

    case "Open Heart Surgery":
      return 2;

    case "Wandering Eye Surgery":
      return 3;
  }
}

function extraChoice(extra) {
  switch (extra) {
    case "LOV Enamorang":
      return 1;

    case "LOV Emotionizer":
      return 2;

    case "LOV Extraterrestrial Chocolate":
      return 3;

    case "LOV Echinacea Bouquet":
      return 4;

    case "LOV Elephant":
      return 5;

    case "toast":
      return 6;

    case null:
      return 7;
  }
}
/**
 * Fight all LOV monsters and get buffs/equipment.
 * @param equipment Equipment to take from LOV.
 * @param effect Effect to take from LOV.
 * @param extra Extra item to take from LOV.
 */


function fightAll(equipment, effect, extra) {
  property_1.set("choiceAdventure1222", 1); // Entrance

  property_1.set("choiceAdventure1223", 1); // Fight LOV Enforcer

  property_1.set("choiceAdventure1224", equipmentChoice(equipment));
  property_1.set("choiceAdventure1225", 1); // Fight LOV Engineer

  property_1.set("choiceAdventure1226", effectChoice(effect));
  property_1.set("choiceAdventure1227", 1); // Fight LOV Equivocator

  property_1.set("choiceAdventure1228", extraChoice(extra));
  kolmafia_1.adv1(template_string_1.$location(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["The Tunnel of L.O.V.E."], ["The Tunnel of L.O.V.E."]))), 0, "");
}

exports.fightAll = fightAll;
var templateObject_1, templateObject_2;

/***/ }),

/***/ 2211:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.dropProgress = exports.setSong = exports.songChangesLeft = exports.song = exports.songBoomSongs = exports.have = exports.item = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.item = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["SongBoom\u2122 BoomBox"], ["SongBoom\u2122 BoomBox"])));

function have() {
  return lib_1.have(exports.item);
}

exports.have = have;
var keywords = {
  "Eye of the Giger": "spooky",
  "Food Vibrations": "food",
  "Remainin' Alive": "dr",
  "These Fists Were Made for Punchin'": "damage",
  "Total Eclipse of Your Meat": "meat"
};
exports.songBoomSongs = new Set(Object.keys(keywords));
/**
 * Current song.
 */

function song() {
  var stored = property_1.get("boomBoxSong");
  return exports.songBoomSongs.has(stored) ? stored : null;
}

exports.song = song;
/**
 * Song changes left today.
 */

function songChangesLeft() {
  return property_1.get("_boomBoxSongsLeft");
}

exports.songChangesLeft = songChangesLeft;
/**
 * Change the song.
 * @param newSong Song to change to.
 */

function setSong(newSong) {
  if (song() !== newSong) {
    if (songChangesLeft() === 0) throw new Error("Out of song changes!");
    kolmafia_1.cliExecute("boombox " + (newSong ? keywords[newSong] : "none"));
    return true;
  } else {
    return false;
  }
}

exports.setSong = setSong;
/**
 * Progress to next song drop (e.g. gathered meat-clip).
 */

function dropProgress() {
  return property_1.get("_boomBoxFights");
}

exports.dropProgress = dropProgress;
var templateObject_1;

/***/ }),

/***/ 5352:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.haveBooze = exports.havePlatinumBooze = exports.Cocktails = exports.getBooze = exports.getTier = exports.getLocation = exports.abandon = exports.canAbandon = exports.haveFullBronzeBonus = exports.acceptBronze = exports.getBronze = exports.acceptGold = exports.haveFullGoldBonus = exports.canGold = exports.getGoldToday = exports.getGold = exports.acceptPlatinum = exports.haveFullPlatinumBonus = exports.canPlatinum = exports.getPlatinumToday = exports.getPlatinum = exports.isQuestActive = exports.have = exports.item = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);

var lib_1 = __webpack_require__(3311);

var property_1 = __webpack_require__(1347);

var template_string_1 = __webpack_require__(678);

exports.item = template_string_1.$item(templateObject_1 || (templateObject_1 = tslib_1.__makeTemplateObject(["Guzzlr tablet"], ["Guzzlr tablet"])));

function have() {
  return lib_1.have(exports.item);
}

exports.have = have;

function useTabletWithChoice(option) {
  property_1.withChoice(1412, option, function () {
    return kolmafia_1.use(1, exports.item);
  });
}

function isQuestActive() {
  return property_1.get("questGuzzlr") !== "unstarted";
}

exports.isQuestActive = isQuestActive;
/**
 * Platinum deliveries completed overall
 */

function getPlatinum() {
  return property_1.get("guzzlrPlatinumDeliveries");
}

exports.getPlatinum = getPlatinum;
/**
 * Platinum deliveries completed today
 */

function getPlatinumToday() {
  return property_1.get("_guzzlrPlatinumDeliveries");
}

exports.getPlatinumToday = getPlatinumToday;
/**
 * Can do a platinum delivery (haven't done one today)
 */

function canPlatinum() {
  return !isQuestActive() && getGold() >= 5 && getPlatinumToday() < 1;
}

exports.canPlatinum = canPlatinum;
/**
 * Have fully unlocked the platinum delivery bonuses (done >= 30)
 */

function haveFullPlatinumBonus() {
  return getPlatinum() >= 30;
}

exports.haveFullPlatinumBonus = haveFullPlatinumBonus;
/**
 * Accept platinum delivery
 */

function acceptPlatinum() {
  if (!canPlatinum()) return false;
  useTabletWithChoice(4);
  return true;
}

exports.acceptPlatinum = acceptPlatinum;
/**
 * Gold deliveries completed overall
 */

function getGold() {
  return property_1.get("guzzlrGoldDeliveries");
}

exports.getGold = getGold;
/**
 * Gold deliveries completed today
 */

function getGoldToday() {
  return property_1.get("_guzzlrGoldDeliveries");
}

exports.getGoldToday = getGoldToday;
/**
 * Can do a gold delivery (have done fewer than 3 today)
 */

function canGold() {
  return !isQuestActive() && getBronze() >= 5 && getGoldToday() < 3;
}

exports.canGold = canGold;
/**
 * Have fully unlocked the platinum delivery bonuses (done >= 30)
 */

function haveFullGoldBonus() {
  return getGold() >= 150;
}

exports.haveFullGoldBonus = haveFullGoldBonus;
/**
 * Accept gold delivery
 */

function acceptGold() {
  if (!canGold()) return false;
  useTabletWithChoice(3);
  return true;
}

exports.acceptGold = acceptGold;
/**
 * Bronze deliveries completed overall
 */

function getBronze() {
  return property_1.get("guzzlrBronzeDeliveries");
}

exports.getBronze = getBronze;
/**
 * Accept bronze delivery
 */

function acceptBronze() {
  if (isQuestActive()) return false;
  useTabletWithChoice(2);
  return true;
}

exports.acceptBronze = acceptBronze;
/**
 * Have fully unlocked the platinum delivery bonuses (done >= 30)
 */

function haveFullBronzeBonus() {
  return getBronze() >= 196;
}

exports.haveFullBronzeBonus = haveFullBronzeBonus;
/**
 * Can abandon the current Guzzlr quest
 */

function canAbandon() {
  return isQuestActive() && !property_1.get("_guzzlrQuestAbandoned");
}

exports.canAbandon = canAbandon;
/**
 * Abandon Guzzlr quest
 */

function abandon() {
  if (!canAbandon()) return false;
  kolmafia_1.visitUrl("inventory.php?tap=guzzlr", false);
  kolmafia_1.runChoice(1);
  kolmafia_1.runChoice(5);
  return true;
}

exports.abandon = abandon;
/**
 * Get current Guzzlr quest location
 */

function getLocation() {
  return property_1.get("guzzlrQuestLocation");
}

exports.getLocation = getLocation;
/**
 * Get current Guzzlr quest tier
 */

function getTier() {
  var tier = property_1.get("guzzlrQuestTier");
  return tier === "" ? null : tier;
}

exports.getTier = getTier;
/**
 * Get current Guzzlr quest booze
 */

function getBooze() {
  var booze = property_1.get("guzzlrQuestBooze");
  if (booze === "") return null;
  return Item.get(booze);
}

exports.getBooze = getBooze;
/**
 * List of the platinum cocktails
 */

exports.Cocktails = template_string_1.$items(templateObject_2 || (templateObject_2 = tslib_1.__makeTemplateObject(["Buttery Boy, Steamboat, Ghiaccio Colada, Nog-on-the-Cob, Sourfinger"], ["Buttery Boy, Steamboat, Ghiaccio Colada, Nog-on-the-Cob, Sourfinger"])));
/**
 * Returns true if the user has a platinum cocktail in their inventory
 */

function havePlatinumBooze() {
  return exports.Cocktails.some(function (cock) {
    return lib_1.have(cock);
  });
}

exports.havePlatinumBooze = havePlatinumBooze;
/**
 * Returns true if the user has the cocktail that they need for their current quest
 *
 * If they have no quest, returns false
 */

function haveBooze() {
  var booze = getBooze();

  switch (booze) {
    case null:
      return false;

    case template_string_1.$item(templateObject_3 || (templateObject_3 = tslib_1.__makeTemplateObject(["Guzzlr cocktail set"], ["Guzzlr cocktail set"]))):
      return havePlatinumBooze();

    default:
      return lib_1.have(booze);
  }
}

exports.haveBooze = haveBooze;
var templateObject_1, templateObject_2, templateObject_3;

/***/ }),

/***/ 1895:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.Guzzlr = exports.Witchess = exports.WinterGarden = exports.TunnelOfLove = exports.SpookyPutty = exports.SourceTerminal = exports.SongBoom = exports.RainDoh = exports.ObtuseAngel = exports.ChateauMantegna = exports.Bandersnatch = void 0;

var tslib_1 = __webpack_require__(7622);

exports.Bandersnatch = tslib_1.__importStar(__webpack_require__(5661));
exports.ChateauMantegna = tslib_1.__importStar(__webpack_require__(7975));
exports.ObtuseAngel = tslib_1.__importStar(__webpack_require__(3758));
exports.RainDoh = tslib_1.__importStar(__webpack_require__(4945));
exports.SongBoom = tslib_1.__importStar(__webpack_require__(2211));
exports.SourceTerminal = tslib_1.__importStar(__webpack_require__(1577));
exports.SpookyPutty = tslib_1.__importStar(__webpack_require__(7235));
exports.TunnelOfLove = tslib_1.__importStar(__webpack_require__(6255));
exports.WinterGarden = tslib_1.__importStar(__webpack_require__(5915));
exports.Witchess = tslib_1.__importStar(__webpack_require__(7271));
exports.Guzzlr = tslib_1.__importStar(__webpack_require__(5352));

tslib_1.__exportStar(__webpack_require__(5231), exports);

/***/ }),

/***/ 5231:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.SpookyPuttySheet = exports.couldUseSpookyPuttySheet = exports.RainDohBlackBox = exports.couldUseRainDohBlackBox = exports.getTotalPuttyLikeCopiesMade = void 0;

var Copier_1 = __webpack_require__(2219);

var SpookyPutty_1 = __webpack_require__(7235);

var RainDoh_1 = __webpack_require__(4945);

function getTotalPuttyLikeCopiesMade() {
  return SpookyPutty_1.getSpookyPuttySheetCopiesMade() + RainDoh_1.getRainDohBlackBoxCopiesMade();
}

exports.getTotalPuttyLikeCopiesMade = getTotalPuttyLikeCopiesMade;

function couldUseRainDohBlackBox() {
  return RainDoh_1.have() && RainDoh_1.getRainDohBlackBoxCopiesMade() < 5 && getTotalPuttyLikeCopiesMade() < 6;
}

exports.couldUseRainDohBlackBox = couldUseRainDohBlackBox;
exports.RainDohBlackBox = new Copier_1.Copier(function () {
  return couldUseRainDohBlackBox();
}, null, function () {
  return couldUseRainDohBlackBox();
}, function () {
  return RainDoh_1.getRainDohBlackBoxMonster();
}, function () {
  return RainDoh_1.useRainDohBlackBox();
});

function couldUseSpookyPuttySheet() {
  return SpookyPutty_1.have() && SpookyPutty_1.getSpookyPuttySheetCopiesMade() < 5 && getTotalPuttyLikeCopiesMade() < 6;
}

exports.couldUseSpookyPuttySheet = couldUseSpookyPuttySheet;
exports.SpookyPuttySheet = new Copier_1.Copier(function () {
  return couldUseSpookyPuttySheet();
}, function () {
  return SpookyPutty_1.prepareSpookyPuttySheet();
}, function () {
  return couldUseSpookyPuttySheet();
}, function () {
  return SpookyPutty_1.getSpookyPuttySheetMonster();
}, function () {
  return SpookyPutty_1.useSpookyPuttySheet();
});

/***/ }),

/***/ 1157:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

/**
 * Provides functions for checking KoLmafia's version and revision.
 * @packageDocumentation
 */

Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.sinceKolmafiaVersion = exports.sinceKolmafiaRevision = exports.KolmafiaVersionError = void 0;

var tslib_1 = __webpack_require__(7622);

var kolmafia_1 = __webpack_require__(1664);
/**
 * Represents an exception thrown when the current KoLmafia version does not
 * match an expected condition.
 */


var KolmafiaVersionError =
/** @class */
function (_super) {
  tslib_1.__extends(KolmafiaVersionError, _super);

  function KolmafiaVersionError(message) {
    var _this = _super.call(this, message) || this; // Explicitly set the prototype, so that 'instanceof' still works in Node.js
    // even when the class is transpiled down to ES5
    // See: https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
    // Note that this code isn't needed for Rhino.


    Object.setPrototypeOf(_this, KolmafiaVersionError.prototype);
    return _this;
  }

  return KolmafiaVersionError;
}(Error);

exports.KolmafiaVersionError = KolmafiaVersionError; // Manually set class name, so that the stack trace shows proper name in Rhino

KolmafiaVersionError.prototype.name = "KolmafiaVersionError";
/**
 * Returns the currently executing script name, suitable for embedding in an
 * error message.
 * @returns Path of the main script wrapped in single-quotes, or `"This script"`
 *    if the path cannot be determined
 */

function getScriptName() {
  var _a; // In Rhino, the current script name is available in require.main.id


  var scriptName = (_a = __webpack_require__.c[__webpack_require__.s]) === null || _a === void 0 ? void 0 : _a.id;
  return scriptName ? "'" + scriptName + "'" : "This script";
}
/**
 * If KoLmafia's revision number is less than `revision`, throws an exception.
 * Otherwise, does nothing.
 *
 * This behaves like the `since rXXX;` statement in ASH.
 * @param revision Revision number
 * @throws {KolmafiaVersionError}
 *    If KoLmafia's revision number is less than `revision`.
 * @throws {TypeError} If `revision` is not an integer
 *
 * @example
 * ```ts
 * // Throws if KoLmafia revision is less than r20500
 * sinceKolmafiaRevision(20500);
 * ```
 */


function sinceKolmafiaRevision(revision) {
  if (!Number.isInteger(revision)) {
    throw new TypeError("Invalid revision number " + revision + " (must be an integer)");
  } // Based on net.sourceforge.kolmafia.textui.Parser.sinceException()


  if (kolmafia_1.getRevision() < revision) {
    throw new KolmafiaVersionError(getScriptName() + " requires revision r" + revision + " of kolmafia or higher (current: " + kolmafia_1.getRevision() + "). Up-to-date builds can be found at https://ci.kolmafia.us/.");
  }
}

exports.sinceKolmafiaRevision = sinceKolmafiaRevision;
/**
 * If KoLmafia's version is less than `majorVersion.minorVersion`, throws an
 * exception.
 * Otherwise, does nothing.
 *
 * This behaves like the `since X.Y;` statement in ASH.
 * @param majorVersion Major version number
 * @param minorVersion Minor version number
 * @throws {KolmafiaVersionError}
 *    If KoLmafia's major version is less than `majorVersion`, or if the major
 *    versions are equal but the minor version is less than `minorVersion`
 * @throws {TypeError}
 *    If either `majorVersion` or `minorVersion` are not integers
 *
 * @example
 * ```ts
 * // Throws if KoLmafia version is less than 20.7
 * sinceKolmafiaVersion(20, 7);
 * ```
 */

function sinceKolmafiaVersion(majorVersion, minorVersion) {
  if (!Number.isInteger(majorVersion)) {
    throw new TypeError("Invalid major version number " + majorVersion + " (must be an integer)");
  }

  if (!Number.isInteger(minorVersion)) {
    throw new TypeError("Invalid minor version number " + minorVersion + " (must be an integer)");
  }

  var versionStr = kolmafia_1.getVersion();
  var versionStrMatch = /v(\d+)\.(\d+)/.exec(versionStr);

  if (!versionStrMatch) {
    // This is not something the user should handle
    throw new Error("Unexpected KoLmafia version string: \"" + versionStr + "\". You may need to update the script.");
  }

  var currentMajorVersion = Number(versionStrMatch[1]);
  var currentMinorVersion = Number(versionStrMatch[2]); // Based on net.sourceforge.kolmafia.textui.Parser.sinceException()

  if (currentMajorVersion < majorVersion || currentMajorVersion === majorVersion && currentMinorVersion < minorVersion) {
    throw new KolmafiaVersionError(getScriptName() + " requires version " + majorVersion + "." + minorVersion + " of kolmafia or higher (current: " + currentMajorVersion + "." + currentMinorVersion + "). Up-to-date builds can be found at https://ci.kolmafia.us/.");
  }
}

exports.sinceKolmafiaVersion = sinceKolmafiaVersion;

/***/ }),

/***/ 678:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.$thralls = exports.$thrall = exports.$stats = exports.$stat = exports.$slots = exports.$slot = exports.$skills = exports.$skill = exports.$servants = exports.$servant = exports.$phyla = exports.$phylum = exports.$monsters = exports.$monster = exports.$locations = exports.$location = exports.$items = exports.$item = exports.$familiars = exports.$familiar = exports.$elements = exports.$element = exports.$effects = exports.$effect = exports.$coinmasters = exports.$coinmaster = exports.$classes = exports.$class = exports.$bounties = exports.$bounty = void 0;

var tslib_1 = __webpack_require__(7622);

var concatTemplateString = function concatTemplateString(literals) {
  var placeholders = [];

  for (var _i = 1; _i < arguments.length; _i++) {
    placeholders[_i - 1] = arguments[_i];
  }

  return literals.reduce(function (acc, literal, i) {
    return acc + literal + (placeholders[i] || "");
  }, "");
};

var createSingleConstant = function createSingleConstant(Type) {
  return function (literals) {
    var placeholders = [];

    for (var _i = 1; _i < arguments.length; _i++) {
      placeholders[_i - 1] = arguments[_i];
    }

    var input = concatTemplateString.apply(void 0, tslib_1.__spread([literals], placeholders));
    return Type.get(input);
  };
};

var createPluralConstant = function createPluralConstant(Type) {
  return function (literals) {
    var placeholders = [];

    for (var _i = 1; _i < arguments.length; _i++) {
      placeholders[_i - 1] = arguments[_i];
    }

    var input = concatTemplateString.apply(void 0, tslib_1.__spread([literals], placeholders));

    if (input === "") {
      return Type.all();
    }

    return Type.get(input.split(/\s*,\s*/));
  };
};
/**
 * A Bounty specified by name.
 *
 * @category In-game constant
 */


exports.$bounty = createSingleConstant(Bounty);
/**
 * A list of Bounties specified by a comma-separated list of names.
 * For a list of all possible Bounties, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$bounties = createPluralConstant(Bounty);
/**
 * A Class specified by name.
 *
 * @category In-game constant
 */

exports.$class = createSingleConstant(Class);
/**
 * A list of Classes specified by a comma-separated list of names.
 * For a list of all possible Classes, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$classes = createPluralConstant(Class);
/**
 * A Coinmaster specified by name.
 *
 * @category In-game constant
 */

exports.$coinmaster = createSingleConstant(Coinmaster);
/**
 * A list of Coinmasters specified by a comma-separated list of names.
 * For a list of all possible Coinmasters, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$coinmasters = createPluralConstant(Coinmaster);
/**
 * An Effect specified by name.
 *
 * @category In-game constant
 */

exports.$effect = createSingleConstant(Effect);
/**
 * A list of Effects specified by a comma-separated list of names.
 * For a list of all possible Effects, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$effects = createPluralConstant(Effect);
/**
 * An Element specified by name.
 *
 * @category In-game constant
 */

exports.$element = createSingleConstant(Element);
/**
 * A list of Elements specified by a comma-separated list of names.
 * For a list of all possible Elements, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$elements = createPluralConstant(Element);
/**
 * A Familiar specified by name.
 *
 * @category In-game constant
 */

exports.$familiar = createSingleConstant(Familiar);
/**
 * A list of Familiars specified by a comma-separated list of names.
 * For a list of all possible Familiars, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$familiars = createPluralConstant(Familiar);
/**
 * An Item specified by name.
 *
 * @category In-game constant
 */

exports.$item = createSingleConstant(Item);
/**
 * A list of Items specified by a comma-separated list of names.
 * For a list of all possible Items, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$items = createPluralConstant(Item);
/**
 * A Location specified by name.
 *
 * @category In-game constant
 */

exports.$location = createSingleConstant(Location);
/**
 * A list of Locations specified by a comma-separated list of names.
 * For a list of all possible Locations, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$locations = createPluralConstant(Location);
/**
 * A Monster specified by name.
 *
 * @category In-game constant
 */

exports.$monster = createSingleConstant(Monster);
/**
 * A list of Monsters specified by a comma-separated list of names.
 * For a list of all possible Monsters, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$monsters = createPluralConstant(Monster);
/**
 * A Phylum specified by name.
 *
 * @category In-game constant
 */

exports.$phylum = createSingleConstant(Phylum);
/**
 * A list of Phyla specified by a comma-separated list of names.
 * For a list of all possible Phyla, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$phyla = createPluralConstant(Phylum);
/**
 * A Servant specified by name.
 *
 * @category In-game constant
 */

exports.$servant = createSingleConstant(Servant);
/**
 * A list of Servants specified by a comma-separated list of names.
 * For a list of all possible Servants, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$servants = createPluralConstant(Servant);
/**
 * A Skill specified by name.
 *
 * @category In-game constant
 */

exports.$skill = createSingleConstant(Skill);
/**
 * A list of Skills specified by a comma-separated list of names.
 * For a list of all possible Skills, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$skills = createPluralConstant(Skill);
/**
 * A Slot specified by name.
 *
 * @category In-game constant
 */

exports.$slot = createSingleConstant(Slot);
/**
 * A list of Slots specified by a comma-separated list of names.
 * For a list of all possible Slots, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$slots = createPluralConstant(Slot);
/**
 * A Stat specified by name.
 *
 * @category In-game constant
 */

exports.$stat = createSingleConstant(Stat);
/**
 * A list of Stats specified by a comma-separated list of names.
 * For a list of all possible Stats, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$stats = createPluralConstant(Stat);
/**
 * A Thrall specified by name.
 *
 * @category In-game constant
 */

exports.$thrall = createSingleConstant(Thrall);
/**
 * A list of Thralls specified by a comma-separated list of names.
 * For a list of all possible Thralls, leave the template string blank.
 *
 * @category In-game constant
 */

exports.$thralls = createPluralConstant(Thrall);

/***/ }),

/***/ 8588:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";


Object.defineProperty(exports, "__esModule", ({
  value: true
}));
exports.countedMapToString = exports.countedMapToArray = exports.arrayToCountedMap = exports.chunk = exports.clamp = exports.parseNumber = exports.notNull = void 0;

var tslib_1 = __webpack_require__(7622);

function notNull(value) {
  return value !== null;
}

exports.notNull = notNull;

function parseNumber(n) {
  return Number.parseInt(n.replace(/,/g, ""));
}

exports.parseNumber = parseNumber;
/**
 * Clamp a number between lower and upper bounds.
 *
 * @param n Number to clamp.
 * @param min Lower bound.
 * @param max Upper bound.
 */

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

exports.clamp = clamp;
/**
 * Split an {@param array} into {@param chunkSize} sized chunks
 *
 * @param array Array to split
 * @param chunkSize Size of chunk
 */

function chunk(array, chunkSize) {
  var result = [];

  for (var i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }

  return result;
}

exports.chunk = chunk;

function arrayToCountedMap(array) {
  if (!Array.isArray(array)) return array;
  var map = new Map();
  array.forEach(function (item) {
    map.set(item, (map.get(item) || 0) + 1);
  });
  return map;
}

exports.arrayToCountedMap = arrayToCountedMap;

function countedMapToArray(map) {
  return tslib_1.__spread(map).flatMap(function (_a) {
    var _b = tslib_1.__read(_a, 2),
        item = _b[0],
        quantity = _b[1];

    return Array(quantity).fill(item);
  });
}

exports.countedMapToArray = countedMapToArray;

function countedMapToString(map) {
  return tslib_1.__spread(map).map(function (_a) {
    var _b = tslib_1.__read(_a, 2),
        item = _b[0],
        quantity = _b[1];

    return quantity + " x " + item;
  }).join(", ");
}

exports.countedMapToString = countedMapToString;

/***/ }),

/***/ 5544:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(8009);

__webpack_require__(3236);

var entryUnbind = __webpack_require__(7592);

module.exports = entryUnbind('Array', 'flatMap');

/***/ }),

/***/ 4199:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(4875);

var path = __webpack_require__(9039);

module.exports = path.Object.entries;

/***/ }),

/***/ 6231:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(893);

__webpack_require__(8819);

var path = __webpack_require__(9039);

module.exports = path.Object.fromEntries;

/***/ }),

/***/ 2195:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

__webpack_require__(2231);

var path = __webpack_require__(9039);

module.exports = path.Object.values;

/***/ }),

/***/ 1030:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(5544);

module.exports = parent;

/***/ }),

/***/ 8433:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(4199);

module.exports = parent;

/***/ }),

/***/ 9333:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(6231);

module.exports = parent;

/***/ }),

/***/ 5266:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var parent = __webpack_require__(2195);

module.exports = parent;

/***/ }),

/***/ 1361:
/***/ ((module) => {

module.exports = function (it) {
  if (typeof it != 'function') {
    throw TypeError(String(it) + ' is not a function');
  }

  return it;
};

/***/ }),

/***/ 2955:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(2949);

module.exports = function (it) {
  if (!isObject(it) && it !== null) {
    throw TypeError("Can't set " + String(it) + ' as a prototype');
  }

  return it;
};

/***/ }),

/***/ 7331:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(7457);

var create = __webpack_require__(5131);

var definePropertyModule = __webpack_require__(811);

var UNSCOPABLES = wellKnownSymbol('unscopables');
var ArrayPrototype = Array.prototype; // Array.prototype[@@unscopables]
// https://tc39.es/ecma262/#sec-array.prototype-@@unscopables

if (ArrayPrototype[UNSCOPABLES] == undefined) {
  definePropertyModule.f(ArrayPrototype, UNSCOPABLES, {
    configurable: true,
    value: create(null)
  });
} // add a key to Array.prototype[@@unscopables]


module.exports = function (key) {
  ArrayPrototype[UNSCOPABLES][key] = true;
};

/***/ }),

/***/ 3739:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(2949);

module.exports = function (it) {
  if (!isObject(it)) {
    throw TypeError(String(it) + ' is not an object');
  }

  return it;
};

/***/ }),

/***/ 477:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toIndexedObject = __webpack_require__(6211);

var toLength = __webpack_require__(588);

var toAbsoluteIndex = __webpack_require__(8786); // `Array.prototype.{ indexOf, includes }` methods implementation


var createMethod = function createMethod(IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIndexedObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value; // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare -- NaN check

    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++]; // eslint-disable-next-line no-self-compare -- NaN check

      if (value != value) return true; // Array#indexOf ignores holes, Array#includes - not
    } else for (; length > index; index++) {
      if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
    }
    return !IS_INCLUDES && -1;
  };
};

module.exports = {
  // `Array.prototype.includes` method
  // https://tc39.es/ecma262/#sec-array.prototype.includes
  includes: createMethod(true),
  // `Array.prototype.indexOf` method
  // https://tc39.es/ecma262/#sec-array.prototype.indexof
  indexOf: createMethod(false)
};

/***/ }),

/***/ 586:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(2949);

var isArray = __webpack_require__(1746);

var wellKnownSymbol = __webpack_require__(7457);

var SPECIES = wellKnownSymbol('species'); // `ArraySpeciesCreate` abstract operation
// https://tc39.es/ecma262/#sec-arrayspeciescreate

module.exports = function (originalArray, length) {
  var C;

  if (isArray(originalArray)) {
    C = originalArray.constructor; // cross-realm fallback

    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;else if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  }

  return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
};

/***/ }),

/***/ 6202:
/***/ ((module) => {

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

/***/ }),

/***/ 5830:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var TO_STRING_TAG_SUPPORT = __webpack_require__(4657);

var classofRaw = __webpack_require__(6202);

var wellKnownSymbol = __webpack_require__(7457);

var TO_STRING_TAG = wellKnownSymbol('toStringTag'); // ES3 wrong here

var CORRECT_ARGUMENTS = classofRaw(function () {
  return arguments;
}()) == 'Arguments'; // fallback for IE11 Script Access Denied error

var tryGet = function tryGet(it, key) {
  try {
    return it[key];
  } catch (error) {
    /* empty */
  }
}; // getting tag from ES6+ `Object.prototype.toString`


module.exports = TO_STRING_TAG_SUPPORT ? classofRaw : function (it) {
  var O, tag, result;
  return it === undefined ? 'Undefined' : it === null ? 'Null' // @@toStringTag case
  : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG)) == 'string' ? tag // builtinTag case
  : CORRECT_ARGUMENTS ? classofRaw(O) // ES3 arguments fallback
  : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
};

/***/ }),

/***/ 3780:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(2551);

var ownKeys = __webpack_require__(6813);

var getOwnPropertyDescriptorModule = __webpack_require__(9609);

var definePropertyModule = __webpack_require__(811);

module.exports = function (target, source) {
  var keys = ownKeys(source);
  var defineProperty = definePropertyModule.f;
  var getOwnPropertyDescriptor = getOwnPropertyDescriptorModule.f;

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
  }
};

/***/ }),

/***/ 3473:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(8901);

module.exports = !fails(function () {
  function F() {
    /* empty */
  }

  F.prototype.constructor = null; // eslint-disable-next-line es/no-object-getprototypeof -- required for testing

  return Object.getPrototypeOf(new F()) !== F.prototype;
});

/***/ }),

/***/ 5107:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var IteratorPrototype = __webpack_require__(9297).IteratorPrototype;

var create = __webpack_require__(5131);

var createPropertyDescriptor = __webpack_require__(3300);

var setToStringTag = __webpack_require__(4653);

var Iterators = __webpack_require__(9759);

var returnThis = function returnThis() {
  return this;
};

module.exports = function (IteratorConstructor, NAME, next) {
  var TO_STRING_TAG = NAME + ' Iterator';
  IteratorConstructor.prototype = create(IteratorPrototype, {
    next: createPropertyDescriptor(1, next)
  });
  setToStringTag(IteratorConstructor, TO_STRING_TAG, false, true);
  Iterators[TO_STRING_TAG] = returnThis;
  return IteratorConstructor;
};

/***/ }),

/***/ 4059:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var definePropertyModule = __webpack_require__(811);

var createPropertyDescriptor = __webpack_require__(3300);

module.exports = DESCRIPTORS ? function (object, key, value) {
  return definePropertyModule.f(object, key, createPropertyDescriptor(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

/***/ }),

/***/ 3300:
/***/ ((module) => {

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

/***/ }),

/***/ 812:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var toPrimitive = __webpack_require__(4375);

var definePropertyModule = __webpack_require__(811);

var createPropertyDescriptor = __webpack_require__(3300);

module.exports = function (object, key, value) {
  var propertyKey = toPrimitive(key);
  if (propertyKey in object) definePropertyModule.f(object, propertyKey, createPropertyDescriptor(0, value));else object[propertyKey] = value;
};

/***/ }),

/***/ 5500:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $ = __webpack_require__(9004);

var createIteratorConstructor = __webpack_require__(5107);

var getPrototypeOf = __webpack_require__(8450);

var setPrototypeOf = __webpack_require__(1686);

var setToStringTag = __webpack_require__(4653);

var createNonEnumerableProperty = __webpack_require__(4059);

var redefine = __webpack_require__(6486);

var wellKnownSymbol = __webpack_require__(7457);

var IS_PURE = __webpack_require__(6719);

var Iterators = __webpack_require__(9759);

var IteratorsCore = __webpack_require__(9297);

var IteratorPrototype = IteratorsCore.IteratorPrototype;
var BUGGY_SAFARI_ITERATORS = IteratorsCore.BUGGY_SAFARI_ITERATORS;
var ITERATOR = wellKnownSymbol('iterator');
var KEYS = 'keys';
var VALUES = 'values';
var ENTRIES = 'entries';

var returnThis = function returnThis() {
  return this;
};

module.exports = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
  createIteratorConstructor(IteratorConstructor, NAME, next);

  var getIterationMethod = function getIterationMethod(KIND) {
    if (KIND === DEFAULT && defaultIterator) return defaultIterator;
    if (!BUGGY_SAFARI_ITERATORS && KIND in IterablePrototype) return IterablePrototype[KIND];

    switch (KIND) {
      case KEYS:
        return function keys() {
          return new IteratorConstructor(this, KIND);
        };

      case VALUES:
        return function values() {
          return new IteratorConstructor(this, KIND);
        };

      case ENTRIES:
        return function entries() {
          return new IteratorConstructor(this, KIND);
        };
    }

    return function () {
      return new IteratorConstructor(this);
    };
  };

  var TO_STRING_TAG = NAME + ' Iterator';
  var INCORRECT_VALUES_NAME = false;
  var IterablePrototype = Iterable.prototype;
  var nativeIterator = IterablePrototype[ITERATOR] || IterablePrototype['@@iterator'] || DEFAULT && IterablePrototype[DEFAULT];
  var defaultIterator = !BUGGY_SAFARI_ITERATORS && nativeIterator || getIterationMethod(DEFAULT);
  var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
  var CurrentIteratorPrototype, methods, KEY; // fix native

  if (anyNativeIterator) {
    CurrentIteratorPrototype = getPrototypeOf(anyNativeIterator.call(new Iterable()));

    if (IteratorPrototype !== Object.prototype && CurrentIteratorPrototype.next) {
      if (!IS_PURE && getPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype) {
        if (setPrototypeOf) {
          setPrototypeOf(CurrentIteratorPrototype, IteratorPrototype);
        } else if (typeof CurrentIteratorPrototype[ITERATOR] != 'function') {
          createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR, returnThis);
        }
      } // Set @@toStringTag to native iterators


      setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true, true);
      if (IS_PURE) Iterators[TO_STRING_TAG] = returnThis;
    }
  } // fix Array.prototype.{ values, @@iterator }.name in V8 / FF


  if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
    INCORRECT_VALUES_NAME = true;

    defaultIterator = function values() {
      return nativeIterator.call(this);
    };
  } // define iterator


  if ((!IS_PURE || FORCED) && IterablePrototype[ITERATOR] !== defaultIterator) {
    createNonEnumerableProperty(IterablePrototype, ITERATOR, defaultIterator);
  }

  Iterators[NAME] = defaultIterator; // export additional methods

  if (DEFAULT) {
    methods = {
      values: getIterationMethod(VALUES),
      keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
      entries: getIterationMethod(ENTRIES)
    };
    if (FORCED) for (KEY in methods) {
      if (BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
        redefine(IterablePrototype, KEY, methods[KEY]);
      }
    } else $({
      target: NAME,
      proto: true,
      forced: BUGGY_SAFARI_ITERATORS || INCORRECT_VALUES_NAME
    }, methods);
  }

  return methods;
};

/***/ }),

/***/ 2171:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(8901); // Detect IE8's incomplete defineProperty implementation


module.exports = !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- required for testing
  return Object.defineProperty({}, 1, {
    get: function get() {
      return 7;
    }
  })[1] != 7;
});

/***/ }),

/***/ 4603:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var isObject = __webpack_require__(2949);

var document = global.document; // typeof document.createElement is 'object' in old IE

var EXISTS = isObject(document) && isObject(document.createElement);

module.exports = function (it) {
  return EXISTS ? document.createElement(it) : {};
};

/***/ }),

/***/ 5096:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(1575);

module.exports = getBuiltIn('navigator', 'userAgent') || '';

/***/ }),

/***/ 2912:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var userAgent = __webpack_require__(5096);

var process = global.process;
var versions = process && process.versions;
var v8 = versions && versions.v8;
var match, version;

if (v8) {
  match = v8.split('.');
  version = match[0] < 4 ? 1 : match[0] + match[1];
} else if (userAgent) {
  match = userAgent.match(/Edge\/(\d+)/);

  if (!match || match[1] >= 74) {
    match = userAgent.match(/Chrome\/(\d+)/);
    if (match) version = match[1];
  }
}

module.exports = version && +version;

/***/ }),

/***/ 7592:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var bind = __webpack_require__(1871);

var call = Function.call;

module.exports = function (CONSTRUCTOR, METHOD, length) {
  return bind(call, global[CONSTRUCTOR].prototype[METHOD], length);
};

/***/ }),

/***/ 393:
/***/ ((module) => {

// IE8- don't enum bug keys
module.exports = ['constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf'];

/***/ }),

/***/ 9004:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var global = __webpack_require__(2328);

var getOwnPropertyDescriptor = __webpack_require__(9609).f;

var createNonEnumerableProperty = __webpack_require__(4059);

var redefine = __webpack_require__(6486);

var setGlobal = __webpack_require__(3351);

var copyConstructorProperties = __webpack_require__(3780);

var isForced = __webpack_require__(2612);
/*
  options.target      - name of the target object
  options.global      - target is the global object
  options.stat        - export as static methods of target
  options.proto       - export as prototype methods of target
  options.real        - real prototype method for the `pure` version
  options.forced      - export even if the native feature is available
  options.bind        - bind methods to the target, required for the `pure` version
  options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
  options.unsafe      - use the simple assignment of property instead of delete + defineProperty
  options.sham        - add a flag to not completely full polyfills
  options.enumerable  - export as enumerable property
  options.noTargetGet - prevent calling a getter on target
*/


module.exports = function (options, source) {
  var TARGET = options.target;
  var GLOBAL = options.global;
  var STATIC = options.stat;
  var FORCED, target, key, targetProperty, sourceProperty, descriptor;

  if (GLOBAL) {
    target = global;
  } else if (STATIC) {
    target = global[TARGET] || setGlobal(TARGET, {});
  } else {
    target = (global[TARGET] || {}).prototype;
  }

  if (target) for (key in source) {
    sourceProperty = source[key];

    if (options.noTargetGet) {
      descriptor = getOwnPropertyDescriptor(target, key);
      targetProperty = descriptor && descriptor.value;
    } else targetProperty = target[key];

    FORCED = isForced(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced); // contained in target

    if (!FORCED && targetProperty !== undefined) {
      if (_typeof(sourceProperty) === _typeof(targetProperty)) continue;
      copyConstructorProperties(sourceProperty, targetProperty);
    } // add a flag to not completely full polyfills


    if (options.sham || targetProperty && targetProperty.sham) {
      createNonEnumerableProperty(sourceProperty, 'sham', true);
    } // extend global


    redefine(target, key, sourceProperty, options);
  }
};

/***/ }),

/***/ 8901:
/***/ ((module) => {

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (error) {
    return true;
  }
};

/***/ }),

/***/ 8529:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var isArray = __webpack_require__(1746);

var toLength = __webpack_require__(588);

var bind = __webpack_require__(1871); // `FlattenIntoArray` abstract operation
// https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray


var flattenIntoArray = function flattenIntoArray(target, original, source, sourceLen, start, depth, mapper, thisArg) {
  var targetIndex = start;
  var sourceIndex = 0;
  var mapFn = mapper ? bind(mapper, thisArg, 3) : false;
  var element;

  while (sourceIndex < sourceLen) {
    if (sourceIndex in source) {
      element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

      if (depth > 0 && isArray(element)) {
        targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
      } else {
        if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
        target[targetIndex] = element;
      }

      targetIndex++;
    }

    sourceIndex++;
  }

  return targetIndex;
};

module.exports = flattenIntoArray;

/***/ }),

/***/ 1871:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var aFunction = __webpack_require__(1361); // optional / simple context binding


module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;

  switch (length) {
    case 0:
      return function () {
        return fn.call(that);
      };

    case 1:
      return function (a) {
        return fn.call(that, a);
      };

    case 2:
      return function (a, b) {
        return fn.call(that, a, b);
      };

    case 3:
      return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
  }

  return function ()
  /* ...args */
  {
    return fn.apply(that, arguments);
  };
};

/***/ }),

/***/ 1575:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var path = __webpack_require__(9039);

var global = __webpack_require__(2328);

var aFunction = function aFunction(variable) {
  return typeof variable == 'function' ? variable : undefined;
};

module.exports = function (namespace, method) {
  return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global[namespace]) : path[namespace] && path[namespace][method] || global[namespace] && global[namespace][method];
};

/***/ }),

/***/ 1072:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(5830);

var Iterators = __webpack_require__(9759);

var wellKnownSymbol = __webpack_require__(7457);

var ITERATOR = wellKnownSymbol('iterator');

module.exports = function (it) {
  if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
};

/***/ }),

/***/ 2328:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var check = function check(it) {
  return it && it.Math == Math && it;
}; // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028


module.exports = // eslint-disable-next-line es/no-global-this -- safe
check((typeof globalThis === "undefined" ? "undefined" : _typeof(globalThis)) == 'object' && globalThis) || check((typeof window === "undefined" ? "undefined" : _typeof(window)) == 'object' && window) || // eslint-disable-next-line no-restricted-globals -- safe
check((typeof self === "undefined" ? "undefined" : _typeof(self)) == 'object' && self) || check((typeof __webpack_require__.g === "undefined" ? "undefined" : _typeof(__webpack_require__.g)) == 'object' && __webpack_require__.g) || // eslint-disable-next-line no-new-func -- fallback
function () {
  return this;
}() || Function('return this')();

/***/ }),

/***/ 2551:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toObject = __webpack_require__(6068);

var hasOwnProperty = {}.hasOwnProperty;

module.exports = Object.hasOwn || function hasOwn(it, key) {
  return hasOwnProperty.call(toObject(it), key);
};

/***/ }),

/***/ 1055:
/***/ ((module) => {

module.exports = {};

/***/ }),

/***/ 4861:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(1575);

module.exports = getBuiltIn('document', 'documentElement');

/***/ }),

/***/ 2674:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var fails = __webpack_require__(8901);

var createElement = __webpack_require__(4603); // Thank's IE8 for his funny defineProperty


module.exports = !DESCRIPTORS && !fails(function () {
  // eslint-disable-next-line es/no-object-defineproperty -- requied for testing
  return Object.defineProperty(createElement('div'), 'a', {
    get: function get() {
      return 7;
    }
  }).a != 7;
});

/***/ }),

/***/ 8483:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(8901);

var classof = __webpack_require__(6202);

var split = ''.split; // fallback for non-array-like ES3 and non-enumerable old V8 strings

module.exports = fails(function () {
  // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
  // eslint-disable-next-line no-prototype-builtins -- safe
  return !Object('z').propertyIsEnumerable(0);
}) ? function (it) {
  return classof(it) == 'String' ? split.call(it, '') : Object(it);
} : Object;

/***/ }),

/***/ 7599:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var store = __webpack_require__(5153);

var functionToString = Function.toString; // this helper broken in `core-js@3.4.1-3.4.4`, so we can't use `shared` helper

if (typeof store.inspectSource != 'function') {
  store.inspectSource = function (it) {
    return functionToString.call(it);
  };
}

module.exports = store.inspectSource;

/***/ }),

/***/ 4081:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var NATIVE_WEAK_MAP = __webpack_require__(1770);

var global = __webpack_require__(2328);

var isObject = __webpack_require__(2949);

var createNonEnumerableProperty = __webpack_require__(4059);

var objectHas = __webpack_require__(2551);

var shared = __webpack_require__(5153);

var sharedKey = __webpack_require__(1449);

var hiddenKeys = __webpack_require__(1055);

var OBJECT_ALREADY_INITIALIZED = 'Object already initialized';
var WeakMap = global.WeakMap;
var set, get, has;

var enforce = function enforce(it) {
  return has(it) ? get(it) : set(it, {});
};

var getterFor = function getterFor(TYPE) {
  return function (it) {
    var state;

    if (!isObject(it) || (state = get(it)).type !== TYPE) {
      throw TypeError('Incompatible receiver, ' + TYPE + ' required');
    }

    return state;
  };
};

if (NATIVE_WEAK_MAP || shared.state) {
  var store = shared.state || (shared.state = new WeakMap());
  var wmget = store.get;
  var wmhas = store.has;
  var wmset = store.set;

  set = function set(it, metadata) {
    if (wmhas.call(store, it)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    wmset.call(store, it, metadata);
    return metadata;
  };

  get = function get(it) {
    return wmget.call(store, it) || {};
  };

  has = function has(it) {
    return wmhas.call(store, it);
  };
} else {
  var STATE = sharedKey('state');
  hiddenKeys[STATE] = true;

  set = function set(it, metadata) {
    if (objectHas(it, STATE)) throw new TypeError(OBJECT_ALREADY_INITIALIZED);
    metadata.facade = it;
    createNonEnumerableProperty(it, STATE, metadata);
    return metadata;
  };

  get = function get(it) {
    return objectHas(it, STATE) ? it[STATE] : {};
  };

  has = function has(it) {
    return objectHas(it, STATE);
  };
}

module.exports = {
  set: set,
  get: get,
  has: has,
  enforce: enforce,
  getterFor: getterFor
};

/***/ }),

/***/ 8110:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(7457);

var Iterators = __webpack_require__(9759);

var ITERATOR = wellKnownSymbol('iterator');
var ArrayPrototype = Array.prototype; // check on default Array iterator

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayPrototype[ITERATOR] === it);
};

/***/ }),

/***/ 1746:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var classof = __webpack_require__(6202); // `IsArray` abstract operation
// https://tc39.es/ecma262/#sec-isarray
// eslint-disable-next-line es/no-array-isarray -- safe


module.exports = Array.isArray || function isArray(arg) {
  return classof(arg) == 'Array';
};

/***/ }),

/***/ 2612:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fails = __webpack_require__(8901);

var replacement = /#|\.prototype\./;

var isForced = function isForced(feature, detection) {
  var value = data[normalize(feature)];
  return value == POLYFILL ? true : value == NATIVE ? false : typeof detection == 'function' ? fails(detection) : !!detection;
};

var normalize = isForced.normalize = function (string) {
  return String(string).replace(replacement, '.').toLowerCase();
};

var data = isForced.data = {};
var NATIVE = isForced.NATIVE = 'N';
var POLYFILL = isForced.POLYFILL = 'P';
module.exports = isForced;

/***/ }),

/***/ 2949:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

module.exports = function (it) {
  return _typeof(it) === 'object' ? it !== null : typeof it === 'function';
};

/***/ }),

/***/ 6719:
/***/ ((module) => {

module.exports = false;

/***/ }),

/***/ 6449:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var anObject = __webpack_require__(3739);

var isArrayIteratorMethod = __webpack_require__(8110);

var toLength = __webpack_require__(588);

var bind = __webpack_require__(1871);

var getIteratorMethod = __webpack_require__(1072);

var iteratorClose = __webpack_require__(6535);

var Result = function Result(stopped, result) {
  this.stopped = stopped;
  this.result = result;
};

module.exports = function (iterable, unboundFunction, options) {
  var that = options && options.that;
  var AS_ENTRIES = !!(options && options.AS_ENTRIES);
  var IS_ITERATOR = !!(options && options.IS_ITERATOR);
  var INTERRUPTED = !!(options && options.INTERRUPTED);
  var fn = bind(unboundFunction, that, 1 + AS_ENTRIES + INTERRUPTED);
  var iterator, iterFn, index, length, result, next, step;

  var stop = function stop(condition) {
    if (iterator) iteratorClose(iterator);
    return new Result(true, condition);
  };

  var callFn = function callFn(value) {
    if (AS_ENTRIES) {
      anObject(value);
      return INTERRUPTED ? fn(value[0], value[1], stop) : fn(value[0], value[1]);
    }

    return INTERRUPTED ? fn(value, stop) : fn(value);
  };

  if (IS_ITERATOR) {
    iterator = iterable;
  } else {
    iterFn = getIteratorMethod(iterable);
    if (typeof iterFn != 'function') throw TypeError('Target is not iterable'); // optimisation for array iterators

    if (isArrayIteratorMethod(iterFn)) {
      for (index = 0, length = toLength(iterable.length); length > index; index++) {
        result = callFn(iterable[index]);
        if (result && result instanceof Result) return result;
      }

      return new Result(false);
    }

    iterator = iterFn.call(iterable);
  }

  next = iterator.next;

  while (!(step = next.call(iterator)).done) {
    try {
      result = callFn(step.value);
    } catch (error) {
      iteratorClose(iterator);
      throw error;
    }

    if (_typeof(result) == 'object' && result && result instanceof Result) return result;
  }

  return new Result(false);
};

/***/ }),

/***/ 6535:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(3739);

module.exports = function (iterator) {
  var returnMethod = iterator['return'];

  if (returnMethod !== undefined) {
    return anObject(returnMethod.call(iterator)).value;
  }
};

/***/ }),

/***/ 9297:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var fails = __webpack_require__(8901);

var getPrototypeOf = __webpack_require__(8450);

var createNonEnumerableProperty = __webpack_require__(4059);

var has = __webpack_require__(2551);

var wellKnownSymbol = __webpack_require__(7457);

var IS_PURE = __webpack_require__(6719);

var ITERATOR = wellKnownSymbol('iterator');
var BUGGY_SAFARI_ITERATORS = false;

var returnThis = function returnThis() {
  return this;
}; // `%IteratorPrototype%` object
// https://tc39.es/ecma262/#sec-%iteratorprototype%-object


var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;
/* eslint-disable es/no-array-prototype-keys -- safe */

if ([].keys) {
  arrayIterator = [].keys(); // Safari 8 has buggy iterators w/o `next`

  if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;else {
    PrototypeOfArrayIteratorPrototype = getPrototypeOf(getPrototypeOf(arrayIterator));
    if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
  }
}

var NEW_ITERATOR_PROTOTYPE = IteratorPrototype == undefined || fails(function () {
  var test = {}; // FF44- legacy iterators case

  return IteratorPrototype[ITERATOR].call(test) !== test;
});
if (NEW_ITERATOR_PROTOTYPE) IteratorPrototype = {}; // `%IteratorPrototype%[@@iterator]()` method
// https://tc39.es/ecma262/#sec-%iteratorprototype%-@@iterator

if ((!IS_PURE || NEW_ITERATOR_PROTOTYPE) && !has(IteratorPrototype, ITERATOR)) {
  createNonEnumerableProperty(IteratorPrototype, ITERATOR, returnThis);
}

module.exports = {
  IteratorPrototype: IteratorPrototype,
  BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
};

/***/ }),

/***/ 9759:
/***/ ((module) => {

module.exports = {};

/***/ }),

/***/ 4938:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable es/no-symbol -- required for testing */
var V8_VERSION = __webpack_require__(2912);

var fails = __webpack_require__(8901); // eslint-disable-next-line es/no-object-getownpropertysymbols -- required for testing


module.exports = !!Object.getOwnPropertySymbols && !fails(function () {
  var symbol = Symbol(); // Chrome 38 Symbol has incorrect toString conversion
  // `get-own-property-symbols` polyfill symbols converted to object are not Symbol instances

  return !String(symbol) || !(Object(symbol) instanceof Symbol) || // Chrome 38-40 symbols are not inherited from DOM collections prototypes to instances
  !Symbol.sham && V8_VERSION && V8_VERSION < 41;
});

/***/ }),

/***/ 1770:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var inspectSource = __webpack_require__(7599);

var WeakMap = global.WeakMap;
module.exports = typeof WeakMap === 'function' && /native code/.test(inspectSource(WeakMap));

/***/ }),

/***/ 5131:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var anObject = __webpack_require__(3739);

var defineProperties = __webpack_require__(422);

var enumBugKeys = __webpack_require__(393);

var hiddenKeys = __webpack_require__(1055);

var html = __webpack_require__(4861);

var documentCreateElement = __webpack_require__(4603);

var sharedKey = __webpack_require__(1449);

var GT = '>';
var LT = '<';
var PROTOTYPE = 'prototype';
var SCRIPT = 'script';
var IE_PROTO = sharedKey('IE_PROTO');

var EmptyConstructor = function EmptyConstructor() {
  /* empty */
};

var scriptTag = function scriptTag(content) {
  return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
}; // Create object with fake `null` prototype: use ActiveX Object with cleared prototype


var NullProtoObjectViaActiveX = function NullProtoObjectViaActiveX(activeXDocument) {
  activeXDocument.write(scriptTag(''));
  activeXDocument.close();
  var temp = activeXDocument.parentWindow.Object;
  activeXDocument = null; // avoid memory leak

  return temp;
}; // Create object with fake `null` prototype: use iframe Object with cleared prototype


var NullProtoObjectViaIFrame = function NullProtoObjectViaIFrame() {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = documentCreateElement('iframe');
  var JS = 'java' + SCRIPT + ':';
  var iframeDocument;
  iframe.style.display = 'none';
  html.appendChild(iframe); // https://github.com/zloirock/core-js/issues/475

  iframe.src = String(JS);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(scriptTag('document.F=Object'));
  iframeDocument.close();
  return iframeDocument.F;
}; // Check for document.domain and active x support
// No need to use active x approach when document.domain is not set
// see https://github.com/es-shims/es5-shim/issues/150
// variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
// avoid IE GC bug


var activeXDocument;

var _NullProtoObject = function NullProtoObject() {
  try {
    /* global ActiveXObject -- old IE */
    activeXDocument = document.domain && new ActiveXObject('htmlfile');
  } catch (error) {
    /* ignore */
  }

  _NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
  var length = enumBugKeys.length;

  while (length--) {
    delete _NullProtoObject[PROTOTYPE][enumBugKeys[length]];
  }

  return _NullProtoObject();
};

hiddenKeys[IE_PROTO] = true; // `Object.create` method
// https://tc39.es/ecma262/#sec-object.create

module.exports = Object.create || function create(O, Properties) {
  var result;

  if (O !== null) {
    EmptyConstructor[PROTOTYPE] = anObject(O);
    result = new EmptyConstructor();
    EmptyConstructor[PROTOTYPE] = null; // add "__proto__" for Object.getPrototypeOf polyfill

    result[IE_PROTO] = O;
  } else result = _NullProtoObject();

  return Properties === undefined ? result : defineProperties(result, Properties);
};

/***/ }),

/***/ 422:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var definePropertyModule = __webpack_require__(811);

var anObject = __webpack_require__(3739);

var objectKeys = __webpack_require__(669); // `Object.defineProperties` method
// https://tc39.es/ecma262/#sec-object.defineproperties
// eslint-disable-next-line es/no-object-defineproperties -- safe


module.exports = DESCRIPTORS ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = objectKeys(Properties);
  var length = keys.length;
  var index = 0;
  var key;

  while (length > index) {
    definePropertyModule.f(O, key = keys[index++], Properties[key]);
  }

  return O;
};

/***/ }),

/***/ 811:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var IE8_DOM_DEFINE = __webpack_require__(2674);

var anObject = __webpack_require__(3739);

var toPrimitive = __webpack_require__(4375); // eslint-disable-next-line es/no-object-defineproperty -- safe


var $defineProperty = Object.defineProperty; // `Object.defineProperty` method
// https://tc39.es/ecma262/#sec-object.defineproperty

exports.f = DESCRIPTORS ? $defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return $defineProperty(O, P, Attributes);
  } catch (error) {
    /* empty */
  }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

/***/ }),

/***/ 9609:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var propertyIsEnumerableModule = __webpack_require__(7395);

var createPropertyDescriptor = __webpack_require__(3300);

var toIndexedObject = __webpack_require__(6211);

var toPrimitive = __webpack_require__(4375);

var has = __webpack_require__(2551);

var IE8_DOM_DEFINE = __webpack_require__(2674); // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe


var $getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // `Object.getOwnPropertyDescriptor` method
// https://tc39.es/ecma262/#sec-object.getownpropertydescriptor

exports.f = DESCRIPTORS ? $getOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
  O = toIndexedObject(O);
  P = toPrimitive(P, true);
  if (IE8_DOM_DEFINE) try {
    return $getOwnPropertyDescriptor(O, P);
  } catch (error) {
    /* empty */
  }
  if (has(O, P)) return createPropertyDescriptor(!propertyIsEnumerableModule.f.call(O, P), O[P]);
};

/***/ }),

/***/ 5166:
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(4085);

var enumBugKeys = __webpack_require__(393);

var hiddenKeys = enumBugKeys.concat('length', 'prototype'); // `Object.getOwnPropertyNames` method
// https://tc39.es/ecma262/#sec-object.getownpropertynames
// eslint-disable-next-line es/no-object-getownpropertynames -- safe

exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
  return internalObjectKeys(O, hiddenKeys);
};

/***/ }),

/***/ 5863:
/***/ ((__unused_webpack_module, exports) => {

// eslint-disable-next-line es/no-object-getownpropertysymbols -- safe
exports.f = Object.getOwnPropertySymbols;

/***/ }),

/***/ 8450:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(2551);

var toObject = __webpack_require__(6068);

var sharedKey = __webpack_require__(1449);

var CORRECT_PROTOTYPE_GETTER = __webpack_require__(3473);

var IE_PROTO = sharedKey('IE_PROTO');
var ObjectPrototype = Object.prototype; // `Object.getPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.getprototypeof
// eslint-disable-next-line es/no-object-getprototypeof -- safe

module.exports = CORRECT_PROTOTYPE_GETTER ? Object.getPrototypeOf : function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];

  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  }

  return O instanceof Object ? ObjectPrototype : null;
};

/***/ }),

/***/ 4085:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var has = __webpack_require__(2551);

var toIndexedObject = __webpack_require__(6211);

var indexOf = __webpack_require__(477).indexOf;

var hiddenKeys = __webpack_require__(1055);

module.exports = function (object, names) {
  var O = toIndexedObject(object);
  var i = 0;
  var result = [];
  var key;

  for (key in O) {
    !has(hiddenKeys, key) && has(O, key) && result.push(key);
  } // Don't enum bug & hidden keys


  while (names.length > i) {
    if (has(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
  }

  return result;
};

/***/ }),

/***/ 669:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var internalObjectKeys = __webpack_require__(4085);

var enumBugKeys = __webpack_require__(393); // `Object.keys` method
// https://tc39.es/ecma262/#sec-object.keys
// eslint-disable-next-line es/no-object-keys -- safe


module.exports = Object.keys || function keys(O) {
  return internalObjectKeys(O, enumBugKeys);
};

/***/ }),

/***/ 7395:
/***/ ((__unused_webpack_module, exports) => {

"use strict";


var $propertyIsEnumerable = {}.propertyIsEnumerable; // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe

var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor; // Nashorn ~ JDK8 bug

var NASHORN_BUG = getOwnPropertyDescriptor && !$propertyIsEnumerable.call({
  1: 2
}, 1); // `Object.prototype.propertyIsEnumerable` method implementation
// https://tc39.es/ecma262/#sec-object.prototype.propertyisenumerable

exports.f = NASHORN_BUG ? function propertyIsEnumerable(V) {
  var descriptor = getOwnPropertyDescriptor(this, V);
  return !!descriptor && descriptor.enumerable;
} : $propertyIsEnumerable;

/***/ }),

/***/ 1686:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* eslint-disable no-proto -- safe */
var anObject = __webpack_require__(3739);

var aPossiblePrototype = __webpack_require__(2955); // `Object.setPrototypeOf` method
// https://tc39.es/ecma262/#sec-object.setprototypeof
// Works with __proto__ only. Old v8 can't work with null proto objects.
// eslint-disable-next-line es/no-object-setprototypeof -- safe


module.exports = Object.setPrototypeOf || ('__proto__' in {} ? function () {
  var CORRECT_SETTER = false;
  var test = {};
  var setter;

  try {
    // eslint-disable-next-line es/no-object-getownpropertydescriptor -- safe
    setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
    setter.call(test, []);
    CORRECT_SETTER = test instanceof Array;
  } catch (error) {
    /* empty */
  }

  return function setPrototypeOf(O, proto) {
    anObject(O);
    aPossiblePrototype(proto);
    if (CORRECT_SETTER) setter.call(O, proto);else O.__proto__ = proto;
    return O;
  };
}() : undefined);

/***/ }),

/***/ 8256:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DESCRIPTORS = __webpack_require__(2171);

var objectKeys = __webpack_require__(669);

var toIndexedObject = __webpack_require__(6211);

var propertyIsEnumerable = __webpack_require__(7395).f; // `Object.{ entries, values }` methods implementation


var createMethod = function createMethod(TO_ENTRIES) {
  return function (it) {
    var O = toIndexedObject(it);
    var keys = objectKeys(O);
    var length = keys.length;
    var i = 0;
    var result = [];
    var key;

    while (length > i) {
      key = keys[i++];

      if (!DESCRIPTORS || propertyIsEnumerable.call(O, key)) {
        result.push(TO_ENTRIES ? [key, O[key]] : O[key]);
      }
    }

    return result;
  };
};

module.exports = {
  // `Object.entries` method
  // https://tc39.es/ecma262/#sec-object.entries
  entries: createMethod(true),
  // `Object.values` method
  // https://tc39.es/ecma262/#sec-object.values
  values: createMethod(false)
};

/***/ }),

/***/ 6813:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getBuiltIn = __webpack_require__(1575);

var getOwnPropertyNamesModule = __webpack_require__(5166);

var getOwnPropertySymbolsModule = __webpack_require__(5863);

var anObject = __webpack_require__(3739); // all object keys, includes non-enumerable and symbols


module.exports = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
  var keys = getOwnPropertyNamesModule.f(anObject(it));
  var getOwnPropertySymbols = getOwnPropertySymbolsModule.f;
  return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
};

/***/ }),

/***/ 9039:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

module.exports = global;

/***/ }),

/***/ 6486:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var createNonEnumerableProperty = __webpack_require__(4059);

var has = __webpack_require__(2551);

var setGlobal = __webpack_require__(3351);

var inspectSource = __webpack_require__(7599);

var InternalStateModule = __webpack_require__(4081);

var getInternalState = InternalStateModule.get;
var enforceInternalState = InternalStateModule.enforce;
var TEMPLATE = String(String).split('String');
(module.exports = function (O, key, value, options) {
  var unsafe = options ? !!options.unsafe : false;
  var simple = options ? !!options.enumerable : false;
  var noTargetGet = options ? !!options.noTargetGet : false;
  var state;

  if (typeof value == 'function') {
    if (typeof key == 'string' && !has(value, 'name')) {
      createNonEnumerableProperty(value, 'name', key);
    }

    state = enforceInternalState(value);

    if (!state.source) {
      state.source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
  }

  if (O === global) {
    if (simple) O[key] = value;else setGlobal(key, value);
    return;
  } else if (!unsafe) {
    delete O[key];
  } else if (!noTargetGet && O[key]) {
    simple = true;
  }

  if (simple) O[key] = value;else createNonEnumerableProperty(O, key, value); // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, 'toString', function toString() {
  return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
});

/***/ }),

/***/ 4682:
/***/ ((module) => {

// `RequireObjectCoercible` abstract operation
// https://tc39.es/ecma262/#sec-requireobjectcoercible
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on " + it);
  return it;
};

/***/ }),

/***/ 3351:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var createNonEnumerableProperty = __webpack_require__(4059);

module.exports = function (key, value) {
  try {
    createNonEnumerableProperty(global, key, value);
  } catch (error) {
    global[key] = value;
  }

  return value;
};

/***/ }),

/***/ 4653:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var defineProperty = __webpack_require__(811).f;

var has = __webpack_require__(2551);

var wellKnownSymbol = __webpack_require__(7457);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');

module.exports = function (it, TAG, STATIC) {
  if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG)) {
    defineProperty(it, TO_STRING_TAG, {
      configurable: true,
      value: TAG
    });
  }
};

/***/ }),

/***/ 1449:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var shared = __webpack_require__(8849);

var uid = __webpack_require__(858);

var keys = shared('keys');

module.exports = function (key) {
  return keys[key] || (keys[key] = uid(key));
};

/***/ }),

/***/ 5153:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var setGlobal = __webpack_require__(3351);

var SHARED = '__core-js_shared__';
var store = global[SHARED] || setGlobal(SHARED, {});
module.exports = store;

/***/ }),

/***/ 8849:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var IS_PURE = __webpack_require__(6719);

var store = __webpack_require__(5153);

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: '3.15.2',
  mode: IS_PURE ? 'pure' : 'global',
  copyright: '© 2021 Denis Pushkarev (zloirock.ru)'
});

/***/ }),

/***/ 8786:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(4770);

var max = Math.max;
var min = Math.min; // Helper for a popular repeating case of the spec:
// Let integer be ? ToInteger(index).
// If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).

module.exports = function (index, length) {
  var integer = toInteger(index);
  return integer < 0 ? max(integer + length, 0) : min(integer, length);
};

/***/ }),

/***/ 6211:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

// toObject with fallback for non-array-like ES3 strings
var IndexedObject = __webpack_require__(8483);

var requireObjectCoercible = __webpack_require__(4682);

module.exports = function (it) {
  return IndexedObject(requireObjectCoercible(it));
};

/***/ }),

/***/ 4770:
/***/ ((module) => {

var ceil = Math.ceil;
var floor = Math.floor; // `ToInteger` abstract operation
// https://tc39.es/ecma262/#sec-tointeger

module.exports = function (argument) {
  return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
};

/***/ }),

/***/ 588:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var toInteger = __webpack_require__(4770);

var min = Math.min; // `ToLength` abstract operation
// https://tc39.es/ecma262/#sec-tolength

module.exports = function (argument) {
  return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
};

/***/ }),

/***/ 6068:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var requireObjectCoercible = __webpack_require__(4682); // `ToObject` abstract operation
// https://tc39.es/ecma262/#sec-toobject


module.exports = function (argument) {
  return Object(requireObjectCoercible(argument));
};

/***/ }),

/***/ 4375:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isObject = __webpack_require__(2949); // `ToPrimitive` abstract operation
// https://tc39.es/ecma262/#sec-toprimitive
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string


module.exports = function (input, PREFERRED_STRING) {
  if (!isObject(input)) return input;
  var fn, val;
  if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
  if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
  throw TypeError("Can't convert object to primitive value");
};

/***/ }),

/***/ 4657:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var wellKnownSymbol = __webpack_require__(7457);

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var test = {};
test[TO_STRING_TAG] = 'z';
module.exports = String(test) === '[object z]';

/***/ }),

/***/ 858:
/***/ ((module) => {

var id = 0;
var postfix = Math.random();

module.exports = function (key) {
  return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
};

/***/ }),

/***/ 4719:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/* eslint-disable es/no-symbol -- required for testing */
var NATIVE_SYMBOL = __webpack_require__(4938);

module.exports = NATIVE_SYMBOL && !Symbol.sham && _typeof(Symbol.iterator) == 'symbol';

/***/ }),

/***/ 7457:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var global = __webpack_require__(2328);

var shared = __webpack_require__(8849);

var has = __webpack_require__(2551);

var uid = __webpack_require__(858);

var NATIVE_SYMBOL = __webpack_require__(4938);

var USE_SYMBOL_AS_UID = __webpack_require__(4719);

var WellKnownSymbolsStore = shared('wks');
var _Symbol = global.Symbol;
var createWellKnownSymbol = USE_SYMBOL_AS_UID ? _Symbol : _Symbol && _Symbol.withoutSetter || uid;

module.exports = function (name) {
  if (!has(WellKnownSymbolsStore, name) || !(NATIVE_SYMBOL || typeof WellKnownSymbolsStore[name] == 'string')) {
    if (NATIVE_SYMBOL && has(_Symbol, name)) {
      WellKnownSymbolsStore[name] = _Symbol[name];
    } else {
      WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    }
  }

  return WellKnownSymbolsStore[name];
};

/***/ }),

/***/ 8009:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var $ = __webpack_require__(9004);

var flattenIntoArray = __webpack_require__(8529);

var toObject = __webpack_require__(6068);

var toLength = __webpack_require__(588);

var aFunction = __webpack_require__(1361);

var arraySpeciesCreate = __webpack_require__(586); // `Array.prototype.flatMap` method
// https://tc39.es/ecma262/#sec-array.prototype.flatmap


$({
  target: 'Array',
  proto: true
}, {
  flatMap: function flatMap(callbackfn
  /* , thisArg */
  ) {
    var O = toObject(this);
    var sourceLen = toLength(O.length);
    var A;
    aFunction(callbackfn);
    A = arraySpeciesCreate(O, 0);
    A.length = flattenIntoArray(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    return A;
  }
});

/***/ }),

/***/ 893:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


var toIndexedObject = __webpack_require__(6211);

var addToUnscopables = __webpack_require__(7331);

var Iterators = __webpack_require__(9759);

var InternalStateModule = __webpack_require__(4081);

var defineIterator = __webpack_require__(5500);

var ARRAY_ITERATOR = 'Array Iterator';
var setInternalState = InternalStateModule.set;
var getInternalState = InternalStateModule.getterFor(ARRAY_ITERATOR); // `Array.prototype.entries` method
// https://tc39.es/ecma262/#sec-array.prototype.entries
// `Array.prototype.keys` method
// https://tc39.es/ecma262/#sec-array.prototype.keys
// `Array.prototype.values` method
// https://tc39.es/ecma262/#sec-array.prototype.values
// `Array.prototype[@@iterator]` method
// https://tc39.es/ecma262/#sec-array.prototype-@@iterator
// `CreateArrayIterator` internal method
// https://tc39.es/ecma262/#sec-createarrayiterator

module.exports = defineIterator(Array, 'Array', function (iterated, kind) {
  setInternalState(this, {
    type: ARRAY_ITERATOR,
    target: toIndexedObject(iterated),
    // target
    index: 0,
    // next index
    kind: kind // kind

  }); // `%ArrayIteratorPrototype%.next` method
  // https://tc39.es/ecma262/#sec-%arrayiteratorprototype%.next
}, function () {
  var state = getInternalState(this);
  var target = state.target;
  var kind = state.kind;
  var index = state.index++;

  if (!target || index >= target.length) {
    state.target = undefined;
    return {
      value: undefined,
      done: true
    };
  }

  if (kind == 'keys') return {
    value: index,
    done: false
  };
  if (kind == 'values') return {
    value: target[index],
    done: false
  };
  return {
    value: [index, target[index]],
    done: false
  };
}, 'values'); // argumentsList[@@iterator] is %ArrayProto_values%
// https://tc39.es/ecma262/#sec-createunmappedargumentsobject
// https://tc39.es/ecma262/#sec-createmappedargumentsobject

Iterators.Arguments = Iterators.Array; // https://tc39.es/ecma262/#sec-array.prototype-@@unscopables

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

/***/ }),

/***/ 3236:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

// this method was added to unscopables after implementation
// in popular engines, so it's moved to a separate module
var addToUnscopables = __webpack_require__(7331); // https://tc39.es/ecma262/#sec-array.prototype-@@unscopables


addToUnscopables('flatMap');

/***/ }),

/***/ 4875:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(9004);

var $entries = __webpack_require__(8256).entries; // `Object.entries` method
// https://tc39.es/ecma262/#sec-object.entries


$({
  target: 'Object',
  stat: true
}, {
  entries: function entries(O) {
    return $entries(O);
  }
});

/***/ }),

/***/ 8819:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(9004);

var iterate = __webpack_require__(6449);

var createProperty = __webpack_require__(812); // `Object.fromEntries` method
// https://github.com/tc39/proposal-object-from-entries


$({
  target: 'Object',
  stat: true
}, {
  fromEntries: function fromEntries(iterable) {
    var obj = {};
    iterate(iterable, function (k, v) {
      createProperty(obj, k, v);
    }, {
      AS_ENTRIES: true
    });
    return obj;
  }
});

/***/ }),

/***/ 2231:
/***/ ((__unused_webpack_module, __unused_webpack_exports, __webpack_require__) => {

var $ = __webpack_require__(9004);

var $values = __webpack_require__(8256).values; // `Object.values` method
// https://tc39.es/ecma262/#sec-object.values


$({
  target: 'Object',
  stat: true
}, {
  values: function values(O) {
    return $values(O);
  }
});

/***/ }),

/***/ 9940:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203),
    root = __webpack_require__(4362);
/* Built-in method references that are verified to be native. */


var DataView = getNative(root, 'DataView');
module.exports = DataView;

/***/ }),

/***/ 1979:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var hashClear = __webpack_require__(9129),
    hashDelete = __webpack_require__(9047),
    hashGet = __webpack_require__(3486),
    hashHas = __webpack_require__(4786),
    hashSet = __webpack_require__(6444);
/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */


function Hash(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `Hash`.


Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;
module.exports = Hash;

/***/ }),

/***/ 2768:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var listCacheClear = __webpack_require__(3708),
    listCacheDelete = __webpack_require__(6993),
    listCacheGet = __webpack_require__(286),
    listCacheHas = __webpack_require__(1678),
    listCacheSet = __webpack_require__(9743);
/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */


function ListCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `ListCache`.


ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;
module.exports = ListCache;

/***/ }),

/***/ 4804:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203),
    root = __webpack_require__(4362);
/* Built-in method references that are verified to be native. */


var Map = getNative(root, 'Map');
module.exports = Map;

/***/ }),

/***/ 8423:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var mapCacheClear = __webpack_require__(6977),
    mapCacheDelete = __webpack_require__(7474),
    mapCacheGet = __webpack_require__(727),
    mapCacheHas = __webpack_require__(3653),
    mapCacheSet = __webpack_require__(6140);
/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */


function MapCache(entries) {
  var index = -1,
      length = entries == null ? 0 : entries.length;
  this.clear();

  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
} // Add methods to `MapCache`.


MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;
module.exports = MapCache;

/***/ }),

/***/ 7114:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203),
    root = __webpack_require__(4362);
/* Built-in method references that are verified to be native. */


var Promise = getNative(root, 'Promise');
module.exports = Promise;

/***/ }),

/***/ 689:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203),
    root = __webpack_require__(4362);
/* Built-in method references that are verified to be native. */


var Set = getNative(root, 'Set');
module.exports = Set;

/***/ }),

/***/ 9832:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var MapCache = __webpack_require__(8423),
    setCacheAdd = __webpack_require__(9911),
    setCacheHas = __webpack_require__(7447);
/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */


function SetCache(values) {
  var index = -1,
      length = values == null ? 0 : values.length;
  this.__data__ = new MapCache();

  while (++index < length) {
    this.add(values[index]);
  }
} // Add methods to `SetCache`.


SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;
module.exports = SetCache;

/***/ }),

/***/ 959:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(2768),
    stackClear = __webpack_require__(7553),
    stackDelete = __webpack_require__(6038),
    stackGet = __webpack_require__(2397),
    stackHas = __webpack_require__(2421),
    stackSet = __webpack_require__(2936);
/**
 * Creates a stack cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */


function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
} // Add methods to `Stack`.


Stack.prototype.clear = stackClear;
Stack.prototype['delete'] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;
module.exports = Stack;

/***/ }),

/***/ 2773:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(4362);
/** Built-in value references. */


var _Symbol = root.Symbol;
module.exports = _Symbol;

/***/ }),

/***/ 2496:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(4362);
/** Built-in value references. */


var Uint8Array = root.Uint8Array;
module.exports = Uint8Array;

/***/ }),

/***/ 5284:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203),
    root = __webpack_require__(4362);
/* Built-in method references that are verified to be native. */


var WeakMap = getNative(root, 'WeakMap');
module.exports = WeakMap;

/***/ }),

/***/ 6523:
/***/ ((module) => {

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
function arrayFilter(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length,
      resIndex = 0,
      result = [];

  while (++index < length) {
    var value = array[index];

    if (predicate(value, index, array)) {
      result[resIndex++] = value;
    }
  }

  return result;
}

module.exports = arrayFilter;

/***/ }),

/***/ 8083:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseTimes = __webpack_require__(5094),
    isArguments = __webpack_require__(9246),
    isArray = __webpack_require__(3670),
    isBuffer = __webpack_require__(2343),
    isIndex = __webpack_require__(4782),
    isTypedArray = __webpack_require__(1589);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */

function arrayLikeKeys(value, inherited) {
  var isArr = isArray(value),
      isArg = !isArr && isArguments(value),
      isBuff = !isArr && !isArg && isBuffer(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && ( // Safari 9 has enumerable `arguments.length` in strict mode.
    key == 'length' || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == 'offset' || key == 'parent') || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') || // Skip index properties.
    isIndex(key, length)))) {
      result.push(key);
    }
  }

  return result;
}

module.exports = arrayLikeKeys;

/***/ }),

/***/ 8421:
/***/ ((module) => {

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }

  return array;
}

module.exports = arrayPush;

/***/ }),

/***/ 4481:
/***/ ((module) => {

/**
 * A specialized version of `_.some` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {boolean} Returns `true` if any element passes the predicate check,
 *  else `false`.
 */
function arraySome(array, predicate) {
  var index = -1,
      length = array == null ? 0 : array.length;

  while (++index < length) {
    if (predicate(array[index], index, array)) {
      return true;
    }
  }

  return false;
}

module.exports = arraySome;

/***/ }),

/***/ 6213:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var eq = __webpack_require__(7950);
/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */


function assocIndexOf(array, key) {
  var length = array.length;

  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }

  return -1;
}

module.exports = assocIndexOf;

/***/ }),

/***/ 891:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayPush = __webpack_require__(8421),
    isArray = __webpack_require__(3670);
/**
 * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
 * `keysFunc` and `symbolsFunc` to get the enumerable property names and
 * symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Function} keysFunc The function to get the keys of `object`.
 * @param {Function} symbolsFunc The function to get the symbols of `object`.
 * @returns {Array} Returns the array of property names and symbols.
 */


function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
}

module.exports = baseGetAllKeys;

/***/ }),

/***/ 1185:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _Symbol = __webpack_require__(2773),
    getRawTag = __webpack_require__(3888),
    objectToString = __webpack_require__(2299);
/** `Object#toString` result references. */


var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';
/** Built-in value references. */

var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;
/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */

function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }

  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

module.exports = baseGetTag;

/***/ }),

/***/ 1075:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(1185),
    isObjectLike = __webpack_require__(4939);
/** `Object#toString` result references. */


var argsTag = '[object Arguments]';
/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */

function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag;
}

module.exports = baseIsArguments;

/***/ }),

/***/ 9856:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsEqualDeep = __webpack_require__(1829),
    isObjectLike = __webpack_require__(4939);
/**
 * The base implementation of `_.isEqual` which supports partial comparisons
 * and tracks traversed objects.
 *
 * @private
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @param {boolean} bitmask The bitmask flags.
 *  1 - Unordered comparison
 *  2 - Partial comparison
 * @param {Function} [customizer] The function to customize comparisons.
 * @param {Object} [stack] Tracks traversed `value` and `other` objects.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 */


function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }

  if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
    return value !== value && other !== other;
  }

  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}

module.exports = baseIsEqual;

/***/ }),

/***/ 1829:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Stack = __webpack_require__(959),
    equalArrays = __webpack_require__(3426),
    equalByTag = __webpack_require__(1402),
    equalObjects = __webpack_require__(4572),
    getTag = __webpack_require__(2417),
    isArray = __webpack_require__(3670),
    isBuffer = __webpack_require__(2343),
    isTypedArray = __webpack_require__(1589);
/** Used to compose bitmasks for value comparisons. */


var COMPARE_PARTIAL_FLAG = 1;
/** `Object#toString` result references. */

var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    objectTag = '[object Object]';
/** Used for built-in method references. */

var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * A specialized version of `baseIsEqual` for arrays and objects which performs
 * deep comparisons and tracks traversed objects enabling objects with circular
 * references to be compared.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} [stack] Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray(object),
      othIsArr = isArray(other),
      objTag = objIsArr ? arrayTag : getTag(object),
      othTag = othIsArr ? arrayTag : getTag(other);
  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;
  var objIsObj = objTag == objectTag,
      othIsObj = othTag == objectTag,
      isSameTag = objTag == othTag;

  if (isSameTag && isBuffer(object)) {
    if (!isBuffer(other)) {
      return false;
    }

    objIsArr = true;
    objIsObj = false;
  }

  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack());
    return objIsArr || isTypedArray(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }

  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
        othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object,
          othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }

  if (!isSameTag) {
    return false;
  }

  stack || (stack = new Stack());
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}

module.exports = baseIsEqualDeep;

/***/ }),

/***/ 4106:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isFunction = __webpack_require__(3626),
    isMasked = __webpack_require__(9249),
    isObject = __webpack_require__(71),
    toSource = __webpack_require__(1214);
/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */


var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
/** Used to detect host constructors (Safari). */

var reIsHostCtor = /^\[object .+?Constructor\]$/;
/** Used for built-in method references. */

var funcProto = Function.prototype,
    objectProto = Object.prototype;
/** Used to resolve the decompiled source of functions. */

var funcToString = funcProto.toString;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/** Used to detect if a method is native. */

var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */

function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }

  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

/***/ }),

/***/ 3638:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(1185),
    isLength = __webpack_require__(7100),
    isObjectLike = __webpack_require__(4939);
/** `Object#toString` result references. */


var argsTag = '[object Arguments]',
    arrayTag = '[object Array]',
    boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    funcTag = '[object Function]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    objectTag = '[object Object]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    weakMapTag = '[object WeakMap]';
var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]',
    float32Tag = '[object Float32Array]',
    float64Tag = '[object Float64Array]',
    int8Tag = '[object Int8Array]',
    int16Tag = '[object Int16Array]',
    int32Tag = '[object Int32Array]',
    uint8Tag = '[object Uint8Array]',
    uint8ClampedTag = '[object Uint8ClampedArray]',
    uint16Tag = '[object Uint16Array]',
    uint32Tag = '[object Uint32Array]';
/** Used to identify `toStringTag` values of typed arrays. */

var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */

function baseIsTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}

module.exports = baseIsTypedArray;

/***/ }),

/***/ 7521:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isPrototype = __webpack_require__(2803),
    nativeKeys = __webpack_require__(3865);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */

function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys(object);
  }

  var result = [];

  for (var key in Object(object)) {
    if (hasOwnProperty.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }

  return result;
}

module.exports = baseKeys;

/***/ }),

/***/ 5094:
/***/ ((module) => {

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }

  return result;
}

module.exports = baseTimes;

/***/ }),

/***/ 9081:
/***/ ((module) => {

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}

module.exports = baseUnary;

/***/ }),

/***/ 3159:
/***/ ((module) => {

/**
 * Checks if a `cache` value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

module.exports = cacheHas;

/***/ }),

/***/ 1741:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var root = __webpack_require__(4362);
/** Used to detect overreaching core-js shims. */


var coreJsData = root['__core-js_shared__'];
module.exports = coreJsData;

/***/ }),

/***/ 3426:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var SetCache = __webpack_require__(9832),
    arraySome = __webpack_require__(4481),
    cacheHas = __webpack_require__(3159);
/** Used to compose bitmasks for value comparisons. */


var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;
/**
 * A specialized version of `baseIsEqualDeep` for arrays with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Array} array The array to compare.
 * @param {Array} other The other array to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `array` and `other` objects.
 * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
 */

function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      arrLength = array.length,
      othLength = other.length;

  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  } // Check that cyclic values are equal.


  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);

  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }

  var index = -1,
      result = true,
      seen = bitmask & COMPARE_UNORDERED_FLAG ? new SetCache() : undefined;
  stack.set(array, other);
  stack.set(other, array); // Ignore non-index properties.

  while (++index < arrLength) {
    var arrValue = array[index],
        othValue = other[index];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
    }

    if (compared !== undefined) {
      if (compared) {
        continue;
      }

      result = false;
      break;
    } // Recursively compare arrays (susceptible to call stack limits).


    if (seen) {
      if (!arraySome(other, function (othValue, othIndex) {
        if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }

  stack['delete'](array);
  stack['delete'](other);
  return result;
}

module.exports = equalArrays;

/***/ }),

/***/ 1402:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _Symbol = __webpack_require__(2773),
    Uint8Array = __webpack_require__(2496),
    eq = __webpack_require__(7950),
    equalArrays = __webpack_require__(3426),
    mapToArray = __webpack_require__(8961),
    setToArray = __webpack_require__(6983);
/** Used to compose bitmasks for value comparisons. */


var COMPARE_PARTIAL_FLAG = 1,
    COMPARE_UNORDERED_FLAG = 2;
/** `Object#toString` result references. */

var boolTag = '[object Boolean]',
    dateTag = '[object Date]',
    errorTag = '[object Error]',
    mapTag = '[object Map]',
    numberTag = '[object Number]',
    regexpTag = '[object RegExp]',
    setTag = '[object Set]',
    stringTag = '[object String]',
    symbolTag = '[object Symbol]';
var arrayBufferTag = '[object ArrayBuffer]',
    dataViewTag = '[object DataView]';
/** Used to convert symbols to primitives and strings. */

var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;
/**
 * A specialized version of `baseIsEqualDeep` for comparing objects of
 * the same `toStringTag`.
 *
 * **Note:** This function only supports comparing values with tags of
 * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {string} tag The `toStringTag` of the objects to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }

      object = object.buffer;
      other = other.buffer;

    case arrayBufferTag:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
        return false;
      }

      return true;

    case boolTag:
    case dateTag:
    case numberTag:
      // Coerce booleans to `1` or `0` and dates to milliseconds.
      // Invalid dates are coerced to `NaN`.
      return eq(+object, +other);

    case errorTag:
      return object.name == other.name && object.message == other.message;

    case regexpTag:
    case stringTag:
      // Coerce regexes to strings and treat strings, primitives and objects,
      // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
      // for more details.
      return object == other + '';

    case mapTag:
      var convert = mapToArray;

    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG;
      convert || (convert = setToArray);

      if (object.size != other.size && !isPartial) {
        return false;
      } // Assume cyclic values are equal.


      var stacked = stack.get(object);

      if (stacked) {
        return stacked == other;
      }

      bitmask |= COMPARE_UNORDERED_FLAG; // Recursively compare objects (susceptible to call stack limits).

      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack['delete'](object);
      return result;

    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }

  }

  return false;
}

module.exports = equalByTag;

/***/ }),

/***/ 4572:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getAllKeys = __webpack_require__(5788);
/** Used to compose bitmasks for value comparisons. */


var COMPARE_PARTIAL_FLAG = 1;
/** Used for built-in method references. */

var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * A specialized version of `baseIsEqualDeep` for objects with support for
 * partial deep comparisons.
 *
 * @private
 * @param {Object} object The object to compare.
 * @param {Object} other The other object to compare.
 * @param {number} bitmask The bitmask flags. See `baseIsEqual` for more details.
 * @param {Function} customizer The function to customize comparisons.
 * @param {Function} equalFunc The function to determine equivalents of values.
 * @param {Object} stack Tracks traversed `object` and `other` objects.
 * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
 */

function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG,
      objProps = getAllKeys(object),
      objLength = objProps.length,
      othProps = getAllKeys(other),
      othLength = othProps.length;

  if (objLength != othLength && !isPartial) {
    return false;
  }

  var index = objLength;

  while (index--) {
    var key = objProps[index];

    if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
      return false;
    }
  } // Check that cyclic values are equal.


  var objStacked = stack.get(object);
  var othStacked = stack.get(other);

  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }

  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;

  while (++index < objLength) {
    key = objProps[index];
    var objValue = object[key],
        othValue = other[key];

    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    } // Recursively compare objects (susceptible to call stack limits).


    if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }

    skipCtor || (skipCtor = key == 'constructor');
  }

  if (result && !skipCtor) {
    var objCtor = object.constructor,
        othCtor = other.constructor; // Non `Object` object instances with different constructors are not equal.

    if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
      result = false;
    }
  }

  stack['delete'](object);
  stack['delete'](other);
  return result;
}

module.exports = equalObjects;

/***/ }),

/***/ 8556:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof __webpack_require__.g === "undefined" ? "undefined" : _typeof(__webpack_require__.g)) == 'object' && __webpack_require__.g && __webpack_require__.g.Object === Object && __webpack_require__.g;
module.exports = freeGlobal;

/***/ }),

/***/ 5788:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetAllKeys = __webpack_require__(891),
    getSymbols = __webpack_require__(7976),
    keys = __webpack_require__(3225);
/**
 * Creates an array of own enumerable property names and symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names and symbols.
 */


function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols);
}

module.exports = getAllKeys;

/***/ }),

/***/ 404:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isKeyable = __webpack_require__(4480);
/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */


function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

module.exports = getMapData;

/***/ }),

/***/ 3203:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsNative = __webpack_require__(4106),
    getValue = __webpack_require__(7338);
/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */


function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

/***/ }),

/***/ 3888:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var _Symbol = __webpack_require__(2773);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */

var nativeObjectToString = objectProto.toString;
/** Built-in value references. */

var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;
/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */

function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);

  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }

  return result;
}

module.exports = getRawTag;

/***/ }),

/***/ 7976:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayFilter = __webpack_require__(6523),
    stubArray = __webpack_require__(4043);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Built-in value references. */

var propertyIsEnumerable = objectProto.propertyIsEnumerable;
/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeGetSymbols = Object.getOwnPropertySymbols;
/**
 * Creates an array of the own enumerable symbols of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of symbols.
 */

var getSymbols = !nativeGetSymbols ? stubArray : function (object) {
  if (object == null) {
    return [];
  }

  object = Object(object);
  return arrayFilter(nativeGetSymbols(object), function (symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};
module.exports = getSymbols;

/***/ }),

/***/ 2417:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var DataView = __webpack_require__(9940),
    Map = __webpack_require__(4804),
    Promise = __webpack_require__(7114),
    Set = __webpack_require__(689),
    WeakMap = __webpack_require__(5284),
    baseGetTag = __webpack_require__(1185),
    toSource = __webpack_require__(1214);
/** `Object#toString` result references. */


var mapTag = '[object Map]',
    objectTag = '[object Object]',
    promiseTag = '[object Promise]',
    setTag = '[object Set]',
    weakMapTag = '[object WeakMap]';
var dataViewTag = '[object DataView]';
/** Used to detect maps, sets, and weakmaps. */

var dataViewCtorString = toSource(DataView),
    mapCtorString = toSource(Map),
    promiseCtorString = toSource(Promise),
    setCtorString = toSource(Set),
    weakMapCtorString = toSource(WeakMap);
/**
 * Gets the `toStringTag` of `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */

var getTag = baseGetTag; // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.

if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
  getTag = function getTag(value) {
    var result = baseGetTag(value),
        Ctor = result == objectTag ? value.constructor : undefined,
        ctorString = Ctor ? toSource(Ctor) : '';

    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag;

        case mapCtorString:
          return mapTag;

        case promiseCtorString:
          return promiseTag;

        case setCtorString:
          return setTag;

        case weakMapCtorString:
          return weakMapTag;
      }
    }

    return result;
  };
}

module.exports = getTag;

/***/ }),

/***/ 7338:
/***/ ((module) => {

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

/***/ }),

/***/ 9129:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(6326);
/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */


function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

/***/ }),

/***/ 9047:
/***/ ((module) => {

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

/***/ }),

/***/ 3486:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(6326);
/** Used to stand-in for `undefined` hash values. */


var HASH_UNDEFINED = '__lodash_hash_undefined__';
/** Used for built-in method references. */

var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */

function hashGet(key) {
  var data = this.__data__;

  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }

  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

/***/ }),

/***/ 4786:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(6326);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */

function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

/***/ }),

/***/ 6444:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var nativeCreate = __webpack_require__(6326);
/** Used to stand-in for `undefined` hash values. */


var HASH_UNDEFINED = '__lodash_hash_undefined__';
/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */

function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

/***/ }),

/***/ 4782:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;
/** Used to detect unsigned integer values. */

var reIsUint = /^(?:0|[1-9]\d*)$/;
/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */

function isIndex(value, length) {
  var type = _typeof(value);

  length = length == null ? MAX_SAFE_INTEGER : length;
  return !!length && (type == 'number' || type != 'symbol' && reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
}

module.exports = isIndex;

/***/ }),

/***/ 4480:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = _typeof(value);

  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

module.exports = isKeyable;

/***/ }),

/***/ 9249:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var coreJsData = __webpack_require__(1741);
/** Used to detect methods masquerading as native. */


var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();
/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */


function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

module.exports = isMasked;

/***/ }),

/***/ 2803:
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;
/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */

function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;
  return value === proto;
}

module.exports = isPrototype;

/***/ }),

/***/ 3708:
/***/ ((module) => {

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

/***/ }),

/***/ 6993:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6213);
/** Used for built-in method references. */


var arrayProto = Array.prototype;
/** Built-in value references. */

var splice = arrayProto.splice;
/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */

function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }

  var lastIndex = data.length - 1;

  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }

  --this.size;
  return true;
}

module.exports = listCacheDelete;

/***/ }),

/***/ 286:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6213);
/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */


function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);
  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

/***/ }),

/***/ 1678:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6213);
/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */


function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

/***/ }),

/***/ 9743:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var assocIndexOf = __webpack_require__(6213);
/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */


function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }

  return this;
}

module.exports = listCacheSet;

/***/ }),

/***/ 6977:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var Hash = __webpack_require__(1979),
    ListCache = __webpack_require__(2768),
    Map = __webpack_require__(4804);
/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */


function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

module.exports = mapCacheClear;

/***/ }),

/***/ 7474:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(404);
/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */


function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

/***/ }),

/***/ 727:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(404);
/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */


function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

/***/ }),

/***/ 3653:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(404);
/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */


function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

/***/ }),

/***/ 6140:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getMapData = __webpack_require__(404);
/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */


function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

/***/ }),

/***/ 8961:
/***/ ((module) => {

/**
 * Converts `map` to its key-value pairs.
 *
 * @private
 * @param {Object} map The map to convert.
 * @returns {Array} Returns the key-value pairs.
 */
function mapToArray(map) {
  var index = -1,
      result = Array(map.size);
  map.forEach(function (value, key) {
    result[++index] = [key, value];
  });
  return result;
}

module.exports = mapToArray;

/***/ }),

/***/ 6326:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var getNative = __webpack_require__(3203);
/* Built-in method references that are verified to be native. */


var nativeCreate = getNative(Object, 'create');
module.exports = nativeCreate;

/***/ }),

/***/ 3865:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var overArg = __webpack_require__(5290);
/* Built-in method references for those with the same name as other `lodash` methods. */


var nativeKeys = overArg(Object.keys, Object);
module.exports = nativeKeys;

/***/ }),

/***/ 1985:
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var freeGlobal = __webpack_require__(8556);
/** Detect free variable `exports`. */


var freeExports = ( false ? 0 : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;
/** Detect free variable `module`. */

var freeModule = freeExports && ( false ? 0 : _typeof(module)) == 'object' && module && !module.nodeType && module;
/** Detect the popular CommonJS extension `module.exports`. */

var moduleExports = freeModule && freeModule.exports === freeExports;
/** Detect free variable `process` from Node.js. */

var freeProcess = moduleExports && freeGlobal.process;
/** Used to access faster Node.js helpers. */

var nodeUtil = function () {
  try {
    // Use `util.types` for Node.js 10+.
    var types = freeModule && freeModule.require && freeModule.require('util').types;

    if (types) {
      return types;
    } // Legacy `process.binding('util')` for Node.js < 10.


    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}();

module.exports = nodeUtil;

/***/ }),

/***/ 2299:
/***/ ((module) => {

/** Used for built-in method references. */
var objectProto = Object.prototype;
/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */

var nativeObjectToString = objectProto.toString;
/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */

function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

/***/ }),

/***/ 5290:
/***/ ((module) => {

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function (arg) {
    return func(transform(arg));
  };
}

module.exports = overArg;

/***/ }),

/***/ 4362:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var freeGlobal = __webpack_require__(8556);
/** Detect free variable `self`. */


var freeSelf = (typeof self === "undefined" ? "undefined" : _typeof(self)) == 'object' && self && self.Object === Object && self;
/** Used as a reference to the global object. */

var root = freeGlobal || freeSelf || Function('return this')();
module.exports = root;

/***/ }),

/***/ 9911:
/***/ ((module) => {

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';
/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */

function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);

  return this;
}

module.exports = setCacheAdd;

/***/ }),

/***/ 7447:
/***/ ((module) => {

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

module.exports = setCacheHas;

/***/ }),

/***/ 6983:
/***/ ((module) => {

/**
 * Converts `set` to an array of its values.
 *
 * @private
 * @param {Object} set The set to convert.
 * @returns {Array} Returns the values.
 */
function setToArray(set) {
  var index = -1,
      result = Array(set.size);
  set.forEach(function (value) {
    result[++index] = value;
  });
  return result;
}

module.exports = setToArray;

/***/ }),

/***/ 7553:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(2768);
/**
 * Removes all key-value entries from the stack.
 *
 * @private
 * @name clear
 * @memberOf Stack
 */


function stackClear() {
  this.__data__ = new ListCache();
  this.size = 0;
}

module.exports = stackClear;

/***/ }),

/***/ 6038:
/***/ ((module) => {

/**
 * Removes `key` and its value from the stack.
 *
 * @private
 * @name delete
 * @memberOf Stack
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function stackDelete(key) {
  var data = this.__data__,
      result = data['delete'](key);
  this.size = data.size;
  return result;
}

module.exports = stackDelete;

/***/ }),

/***/ 2397:
/***/ ((module) => {

/**
 * Gets the stack value for `key`.
 *
 * @private
 * @name get
 * @memberOf Stack
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function stackGet(key) {
  return this.__data__.get(key);
}

module.exports = stackGet;

/***/ }),

/***/ 2421:
/***/ ((module) => {

/**
 * Checks if a stack value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Stack
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function stackHas(key) {
  return this.__data__.has(key);
}

module.exports = stackHas;

/***/ }),

/***/ 2936:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var ListCache = __webpack_require__(2768),
    Map = __webpack_require__(4804),
    MapCache = __webpack_require__(8423);
/** Used as the size to enable large array optimizations. */


var LARGE_ARRAY_SIZE = 200;
/**
 * Sets the stack `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Stack
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the stack cache instance.
 */

function stackSet(key, value) {
  var data = this.__data__;

  if (data instanceof ListCache) {
    var pairs = data.__data__;

    if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }

    data = this.__data__ = new MapCache(pairs);
  }

  data.set(key, value);
  this.size = data.size;
  return this;
}

module.exports = stackSet;

/***/ }),

/***/ 1214:
/***/ ((module) => {

/** Used for built-in method references. */
var funcProto = Function.prototype;
/** Used to resolve the decompiled source of functions. */

var funcToString = funcProto.toString;
/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */

function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}

    try {
      return func + '';
    } catch (e) {}
  }

  return '';
}

module.exports = toSource;

/***/ }),

/***/ 7950:
/***/ ((module) => {

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

module.exports = eq;

/***/ }),

/***/ 9246:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsArguments = __webpack_require__(1075),
    isObjectLike = __webpack_require__(4939);
/** Used for built-in method references. */


var objectProto = Object.prototype;
/** Used to check objects for own properties. */

var hasOwnProperty = objectProto.hasOwnProperty;
/** Built-in value references. */

var propertyIsEnumerable = objectProto.propertyIsEnumerable;
/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */

var isArguments = baseIsArguments(function () {
  return arguments;
}()) ? baseIsArguments : function (value) {
  return isObjectLike(value) && hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
};
module.exports = isArguments;

/***/ }),

/***/ 3670:
/***/ ((module) => {

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;
module.exports = isArray;

/***/ }),

/***/ 6175:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var isFunction = __webpack_require__(3626),
    isLength = __webpack_require__(7100);
/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */


function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

module.exports = isArrayLike;

/***/ }),

/***/ 2343:
/***/ ((module, exports, __webpack_require__) => {

/* module decorator */ module = __webpack_require__.nmd(module);
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var root = __webpack_require__(4362),
    stubFalse = __webpack_require__(3444);
/** Detect free variable `exports`. */


var freeExports = ( false ? 0 : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;
/** Detect free variable `module`. */

var freeModule = freeExports && ( false ? 0 : _typeof(module)) == 'object' && module && !module.nodeType && module;
/** Detect the popular CommonJS extension `module.exports`. */

var moduleExports = freeModule && freeModule.exports === freeExports;
/** Built-in value references. */

var Buffer = moduleExports ? root.Buffer : undefined;
/* Built-in method references for those with the same name as other `lodash` methods. */

var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;
/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */

var isBuffer = nativeIsBuffer || stubFalse;
module.exports = isBuffer;

/***/ }),

/***/ 7120:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsEqual = __webpack_require__(9856);
/**
 * Performs a deep comparison between two values to determine if they are
 * equivalent.
 *
 * **Note:** This method supports comparing arrays, array buffers, booleans,
 * date objects, error objects, maps, numbers, `Object` objects, regexes,
 * sets, strings, symbols, and typed arrays. `Object` objects are compared
 * by their own, not inherited, enumerable properties. Functions and DOM
 * nodes are compared by strict equality, i.e. `===`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.isEqual(object, other);
 * // => true
 *
 * object === other;
 * // => false
 */


function isEqual(value, other) {
  return baseIsEqual(value, other);
}

module.exports = isEqual;

/***/ }),

/***/ 3626:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseGetTag = __webpack_require__(1185),
    isObject = __webpack_require__(71);
/** `Object#toString` result references. */


var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';
/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */

function isFunction(value) {
  if (!isObject(value)) {
    return false;
  } // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.


  var tag = baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

/***/ }),

/***/ 7100:
/***/ ((module) => {

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;
/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */

function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

module.exports = isLength;

/***/ }),

/***/ 71:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = _typeof(value);

  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

/***/ }),

/***/ 4939:
/***/ ((module) => {

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && _typeof(value) == 'object';
}

module.exports = isObjectLike;

/***/ }),

/***/ 1589:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var baseIsTypedArray = __webpack_require__(3638),
    baseUnary = __webpack_require__(9081),
    nodeUtil = __webpack_require__(1985);
/* Node.js helper references. */


var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;
/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */

var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
module.exports = isTypedArray;

/***/ }),

/***/ 3225:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var arrayLikeKeys = __webpack_require__(8083),
    baseKeys = __webpack_require__(7521),
    isArrayLike = __webpack_require__(6175);
/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */


function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}

module.exports = keys;

/***/ }),

/***/ 4043:
/***/ ((module) => {

/**
 * This method returns a new empty array.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {Array} Returns the new empty array.
 * @example
 *
 * var arrays = _.times(2, _.stubArray);
 *
 * console.log(arrays);
 * // => [[], []]
 *
 * console.log(arrays[0] === arrays[1]);
 * // => false
 */
function stubArray() {
  return [];
}

module.exports = stubArray;

/***/ }),

/***/ 3444:
/***/ ((module) => {

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

module.exports = stubFalse;

/***/ }),

/***/ 7622:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "__extends": () => (/* binding */ __extends),
/* harmony export */   "__assign": () => (/* binding */ _assign),
/* harmony export */   "__rest": () => (/* binding */ __rest),
/* harmony export */   "__decorate": () => (/* binding */ __decorate),
/* harmony export */   "__param": () => (/* binding */ __param),
/* harmony export */   "__metadata": () => (/* binding */ __metadata),
/* harmony export */   "__awaiter": () => (/* binding */ __awaiter),
/* harmony export */   "__generator": () => (/* binding */ __generator),
/* harmony export */   "__createBinding": () => (/* binding */ __createBinding),
/* harmony export */   "__exportStar": () => (/* binding */ __exportStar),
/* harmony export */   "__values": () => (/* binding */ __values),
/* harmony export */   "__read": () => (/* binding */ __read),
/* harmony export */   "__spread": () => (/* binding */ __spread),
/* harmony export */   "__spreadArrays": () => (/* binding */ __spreadArrays),
/* harmony export */   "__spreadArray": () => (/* binding */ __spreadArray),
/* harmony export */   "__await": () => (/* binding */ __await),
/* harmony export */   "__asyncGenerator": () => (/* binding */ __asyncGenerator),
/* harmony export */   "__asyncDelegator": () => (/* binding */ __asyncDelegator),
/* harmony export */   "__asyncValues": () => (/* binding */ __asyncValues),
/* harmony export */   "__makeTemplateObject": () => (/* binding */ __makeTemplateObject),
/* harmony export */   "__importStar": () => (/* binding */ __importStar),
/* harmony export */   "__importDefault": () => (/* binding */ __importDefault),
/* harmony export */   "__classPrivateFieldGet": () => (/* binding */ __classPrivateFieldGet),
/* harmony export */   "__classPrivateFieldSet": () => (/* binding */ __classPrivateFieldSet)
/* harmony export */ });
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

/* global Reflect, Promise */
var _extendStatics = function extendStatics(d, b) {
  _extendStatics = Object.setPrototypeOf || {
    __proto__: []
  } instanceof Array && function (d, b) {
    d.__proto__ = b;
  } || function (d, b) {
    for (var p in b) {
      if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p];
    }
  };

  return _extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null) throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");

  _extendStatics(d, b);

  function __() {
    this.constructor = d;
  }

  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var _assign = function __assign() {
  _assign = Object.assign || function __assign(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];

      for (var p in s) {
        if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
    }

    return t;
  };

  return _assign.apply(this, arguments);
};


function __rest(s, e) {
  var t = {};

  for (var p in s) {
    if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  }

  if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
    if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
  }
  return t;
}
function __decorate(decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) {
    if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  }
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
function __metadata(metadataKey, metadataValue) {
  if ((typeof Reflect === "undefined" ? "undefined" : _typeof(Reflect)) === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function (resolve) {
      resolve(value);
    });
  }

  return new (P || (P = Promise))(function (resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }

    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }

    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }

    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = {
    label: 0,
    sent: function sent() {
      if (t[0] & 1) throw t[1];
      return t[1];
    },
    trys: [],
    ops: []
  },
      f,
      y,
      t,
      g;
  return g = {
    next: verb(0),
    "throw": verb(1),
    "return": verb(2)
  }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
    return this;
  }), g;

  function verb(n) {
    return function (v) {
      return step([n, v]);
    };
  }

  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");

    while (_) {
      try {
        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
        if (y = 0, t) op = [op[0] & 2, t.value];

        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;

          case 4:
            _.label++;
            return {
              value: op[1],
              done: false
            };

          case 5:
            _.label++;
            y = op[1];
            op = [0];
            continue;

          case 7:
            op = _.ops.pop();

            _.trys.pop();

            continue;

          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }

            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }

            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }

            if (t && _.label < t[2]) {
              _.label = t[2];

              _.ops.push(op);

              break;
            }

            if (t[2]) _.ops.pop();

            _.trys.pop();

            continue;
        }

        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y = 0;
      } finally {
        f = t = 0;
      }
    }

    if (op[0] & 5) throw op[1];
    return {
      value: op[0] ? op[1] : void 0,
      done: true
    };
  }
}
var __createBinding = Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function get() {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
};
function __exportStar(m, o) {
  for (var p in m) {
    if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
  }
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator,
      m = s && o[s],
      i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function next() {
      if (o && i >= o.length) o = void 0;
      return {
        value: o && o[i++],
        done: !o
      };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o),
      r,
      ar = [],
      e;

  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) {
      ar.push(r.value);
    }
  } catch (error) {
    e = {
      error: error
    };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }

  return ar;
}
/** @deprecated */

function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++) {
    ar = ar.concat(__read(arguments[i]));
  }

  return ar;
}
/** @deprecated */

function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) {
    s += arguments[i].length;
  }

  for (var r = Array(s), k = 0, i = 0; i < il; i++) {
    for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) {
      r[k] = a[j];
    }
  }

  return r;
}
function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
    if (ar || !(i in from)) {
      if (!ar) ar = Array.prototype.slice.call(from, 0, i);
      ar[i] = from[i];
    }
  }
  return to.concat(ar || from);
}
function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}
function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []),
      i,
      q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
    return this;
  }, i;

  function verb(n) {
    if (g[n]) i[n] = function (v) {
      return new Promise(function (a, b) {
        q.push([n, v, a, b]) > 1 || resume(n, v);
      });
    };
  }

  function resume(n, v) {
    try {
      step(g[n](v));
    } catch (e) {
      settle(q[0][3], e);
    }
  }

  function step(r) {
    r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r);
  }

  function fulfill(value) {
    resume("next", value);
  }

  function reject(value) {
    resume("throw", value);
  }

  function settle(f, v) {
    if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]);
  }
}
function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) {
    throw e;
  }), verb("return"), i[Symbol.iterator] = function () {
    return this;
  }, i;

  function verb(n, f) {
    i[n] = o[n] ? function (v) {
      return (p = !p) ? {
        value: __await(o[n](v)),
        done: n === "return"
      } : f ? f(v) : v;
    } : f;
  }
}
function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator],
      i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () {
    return this;
  }, i);

  function verb(n) {
    i[n] = o[n] && function (v) {
      return new Promise(function (resolve, reject) {
        v = o[n](v), settle(resolve, reject, v.done, v.value);
      });
    };
  }

  function settle(resolve, reject, d, v) {
    Promise.resolve(v).then(function (v) {
      resolve({
        value: v,
        done: d
      });
    }, reject);
  }
}
function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) {
    Object.defineProperty(cooked, "raw", {
      value: raw
    });
  } else {
    cooked.raw = raw;
  }

  return cooked;
}
;

var __setModuleDefault = Object.create ? function (o, v) {
  Object.defineProperty(o, "default", {
    enumerable: true,
    value: v
  });
} : function (o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) {
    if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  }

  __setModuleDefault(result, mod);

  return result;
}
function __importDefault(mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}

/***/ }),

/***/ 4223:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Macro": () => (/* binding */ Macro),
/* harmony export */   "withMacro": () => (/* binding */ withMacro)
/* harmony export */ });
/* unused harmony export main */
/* harmony import */ var kolmafia__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1664);
/* harmony import */ var kolmafia__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(kolmafia__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var libram__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(9803);
/* harmony import */ var libram__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(libram__WEBPACK_IMPORTED_MODULE_1__);
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var _templateObject, _templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26, _templateObject27, _templateObject28;

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }




function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}

function shouldRedigitize() {
  var digitizesLeft = clamp(3 - (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_sourceTerminalDigitizeUses"), 0, 3);
  var monsterCount = (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_sourceTerminalDigitizeMonsterCount") + 1; // triangular number * 10 - 3

  var digitizeAdventuresUsed = monsterCount * (monsterCount + 1) * 5 - 3; // Redigitize if fewer adventures than this digitize usage.

  return libram__WEBPACK_IMPORTED_MODULE_1__.SourceTerminal.have() && (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.myAdventures)() * 1.04 < digitizesLeft * digitizeAdventuresUsed;
}

var Macro = /*#__PURE__*/function (_LibramMacro) {
  _inherits(Macro, _LibramMacro);

  var _super = _createSuper(Macro);

  function Macro() {
    _classCallCheck(this, Macro);

    return _super.apply(this, arguments);
  }

  _createClass(Macro, [{
    key: "submit",
    value: function submit() {
      (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.print)(this.components.join("\n"));
      return _get(_getPrototypeOf(Macro.prototype), "submit", this).call(this);
    }
  }, {
    key: "tryHaveSkill",
    value: function tryHaveSkill(skillOrName) {
      var skill = typeof skillOrName === "string" ? Skill.get(skillOrName) : skillOrName;
      return this.externalIf((0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.haveSkill)(skill), Macro.skill(skill));
    }
  }, {
    key: "tryCopier",
    value: function tryCopier(itemOrSkill) {
      switch (itemOrSkill) {
        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject || (_templateObject = _taggedTemplateLiteral(["Spooky Putty sheet"]))):
          return this.externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("spookyPuttyCopiesMade") + Math.max(1, (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_raindohCopiesMade")) < 6, Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral(["Rain-Doh black box"]))):
          return this.externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_raindohCopiesMade") + Math.max(1, (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("spookyPuttyCopiesMade")) < 6, Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject3 || (_templateObject3 = _taggedTemplateLiteral(["4-d camera"]))):
          return this.externalIf(!(0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_cameraUsed") && !(0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject4 || (_templateObject4 = _taggedTemplateLiteral(["shaking 4-d camera"])))), Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject5 || (_templateObject5 = _taggedTemplateLiteral(["crappy camera"]))):
          return this.externalIf(!(0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_crappyCameraUsed") && !(0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject6 || (_templateObject6 = _taggedTemplateLiteral(["shaking crappy camera"])))), Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject7 || (_templateObject7 = _taggedTemplateLiteral(["unfinished ice sculpture"]))):
          return this.externalIf(!(0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_iceSculptureUsed") && !(0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject8 || (_templateObject8 = _taggedTemplateLiteral(["ice sculpture"])))), Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject9 || (_templateObject9 = _taggedTemplateLiteral(["pulled green taffy"]))):
          return this.externalIf(!(0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_envyfishEggUsed") && !(0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject10 || (_templateObject10 = _taggedTemplateLiteral(["envyfish egg"])))), Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject11 || (_templateObject11 = _taggedTemplateLiteral(["print screen button"]))):
          return this.tryItem(itemOrSkill);

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject12 || (_templateObject12 = _taggedTemplateLiteral(["alpine watercolor set"]))):
          return this.tryItem(itemOrSkill);

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject13 || (_templateObject13 = _taggedTemplateLiteral(["LOV Enamorang"]))):
          return this.externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_enamorangs") < 5 && !(0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("enamorangMonster"), Macro.tryItem(itemOrSkill));

        case (0,libram__WEBPACK_IMPORTED_MODULE_1__.$skill)(_templateObject14 || (_templateObject14 = _taggedTemplateLiteral(["Digitize"]))):
          return this.externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_sourceTerminalDigitizeUses") < 1 + ((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("sourceTerminalChips").includes("TRAM") ? 1 : 0) + ((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("sourceTerminalChips").includes("TRIGRAM") ? 1 : 0), Macro.trySkill(itemOrSkill));
      } // Unsupported item or skill


      return this;
    }
  }, {
    key: "meatKill",
    value: function meatKill() {
      var sealClubberSetup = (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject15 || (_templateObject15 = _taggedTemplateLiteral(["mafia pointer finger ring"])))) > 0 && (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.myClass)() === (0,libram__WEBPACK_IMPORTED_MODULE_1__.$class)(_templateObject16 || (_templateObject16 = _taggedTemplateLiteral(["Seal Clubber"]))) && (0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$skill)(_templateObject17 || (_templateObject17 = _taggedTemplateLiteral(["Furious Wallop"]))));
      var opsSetup = (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject18 || (_templateObject18 = _taggedTemplateLiteral(["mafia pointer finger ring"])))) > 0 && (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject19 || (_templateObject19 = _taggedTemplateLiteral(["Operation Patriot Shield"])))) > 0;
      var katanaSetup = (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject20 || (_templateObject20 = _taggedTemplateLiteral(["mafia pointer finger ring"])))) > 0 && (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject21 || (_templateObject21 = _taggedTemplateLiteral(["haiku katana"])))) > 0;
      var capeSetup = (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedAmount)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$item)(_templateObject22 || (_templateObject22 = _taggedTemplateLiteral(["mafia pointer finger ring"])))) > 0 && (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("retroCapeSuperhero") === "robot" && (0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("retroCapeWashingInstructions") === "kill" && (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.itemType)((0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.equippedItem)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$slot)(_templateObject23 || (_templateObject23 = _taggedTemplateLiteral(["weapon"]))))) === "pistol"; // TODO: Hobo monkey stasis. VYKEA couch issue. Probably other stuff.

      return this.externalIf(shouldRedigitize(), Macro.if_("monstername ".concat((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_sourceTerminalDigitizeMonster")), Macro.trySkill("Digitize"))).tryHaveSkill("Sing Along").externalIf(!(0,libram__WEBPACK_IMPORTED_MODULE_1__.have)((0,libram__WEBPACK_IMPORTED_MODULE_1__.$effect)(_templateObject24 || (_templateObject24 = _taggedTemplateLiteral(["On the Trail"])))), Macro.if_("monstername garbage tourist", Macro.trySkill("Transcendent Olfaction"))).externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_gallapagosMonster") !== (0,libram__WEBPACK_IMPORTED_MODULE_1__.$monster)(_templateObject25 || (_templateObject25 = _taggedTemplateLiteral(["garbage tourist"]))), Macro.if_("monstername garbage tourist", Macro.trySkill("Gallapagosian Mating Call"))).externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("_latteMonster") !== (0,libram__WEBPACK_IMPORTED_MODULE_1__.$monster)(_templateObject26 || (_templateObject26 = _taggedTemplateLiteral(["garbage tourist"]))) || (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.getCounters)("Latte Monster", 0, 30).trim() === "", Macro.if_("monstername garbage tourist", Macro.trySkill("Offer Latte to Opponent"))).externalIf((0,libram__WEBPACK_IMPORTED_MODULE_1__.get)("lastCopyableMonster") === (0,libram__WEBPACK_IMPORTED_MODULE_1__.$monster)(_templateObject27 || (_templateObject27 = _taggedTemplateLiteral(["garbage tourist"]))), Macro.if_("!monstername garbage tourist", Macro.trySkill("Feel Nostalgic"))).externalIf((0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.myFamiliar)() === (0,libram__WEBPACK_IMPORTED_MODULE_1__.$familiar)(_templateObject28 || (_templateObject28 = _taggedTemplateLiteral(["Stocking Mimic"]))), Macro.skill("Curse of Weaksauce").while_("!pastround 10", Macro.item("seal tooth"))).externalIf(sealClubberSetup, Macro.trySkill("Furious Wallop").attack()).externalIf(opsSetup, Macro.skill("Throw Shield").attack()).externalIf(katanaSetup, Macro.skill("Summer Siesta").attack()).externalIf(capeSetup, Macro.skill("Precision Shot")).trySkill("Pocket Crumbs").if_("discobandit", Macro.trySkill("Disco Dance of Doom").trySkill("Disco Dance II: Electric Boogaloo").trySkill("Disco Dance 3: Back in the Habit")).trySkill("Curse of Weaksauce").attack().repeat();
    }
  }], [{
    key: "tryHaveSkill",
    value: function tryHaveSkill(skillOrName) {
      return new Macro().tryHaveSkill(skillOrName);
    }
  }, {
    key: "tryCopier",
    value: function tryCopier(itemOrSkill) {
      return new Macro().tryCopier(itemOrSkill);
    }
  }, {
    key: "meatKill",
    value: function meatKill() {
      return new Macro().meatKill();
    }
  }]);

  return Macro;
}(libram__WEBPACK_IMPORTED_MODULE_1__.Macro);
function withMacro(macro, action) {
  (0,kolmafia__WEBPACK_IMPORTED_MODULE_0__.setAutoAttack)(0);
  macro.save();

  try {
    return action();
  } finally {
    Macro.clearSaved();
  }
}
function main() {
  Macro.load().submit();

  while (inMultiFight()) {
    runCombat();
  }
}

/***/ }),

/***/ 6391:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  "canContinue": () => (/* binding */ canContinue),
  "main": () => (/* binding */ main)
});

// EXTERNAL MODULE: external "kolmafia"
var external_kolmafia_ = __webpack_require__(1664);
// EXTERNAL MODULE: ./node_modules/libram/dist/index.js
var dist = __webpack_require__(9803);
// EXTERNAL MODULE: ./src/combat.ts
var combat = __webpack_require__(4223);
;// CONCATENATED MODULE: ./src/acquire.ts

var priceCaps = {
  "jar of fermented pickle juice": 75000,
  "Frosty's frosty mug": 50000,
  "extra-greasy slider": 45000,
  "Ol' Scratch's salad fork": 50000,
  "transdermal smoke patch": 8000,
  "voodoo snuff": 36000,
  "antimatter wad": 24000,
  "octolus oculus": 12000,
  "blood-drive sticker": 210000,
  "spice melange": 500000,
  "splendid martini": 20000,
  "Eye and a Twist": 20000,
  "jumping horseradish": 20000,
  "Ambitious Turkey": 20000,
  "Special Seasoning": 20000,
  "astral pilsner": 0
};
function acquire(qty, item, maxPrice) {
  var throwOnFail = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;
  if (maxPrice === undefined) maxPrice = priceCaps[item.name];
  if (maxPrice === undefined) throw "No price cap for ".concat(item.name, ".");
  (0,external_kolmafia_.print)("Trying to acquire ".concat(qty, " ").concat(item.plural, "; max price ").concat(maxPrice.toFixed(0), "."), "green");
  if (qty * (0,external_kolmafia_.mallPrice)(item) > 1000000) throw "bad get!";
  var startAmount = (0,external_kolmafia_.itemAmount)(item);
  var remaining = qty - startAmount;
  if (remaining <= 0) return qty;
  var getCloset = Math.min(remaining, (0,external_kolmafia_.closetAmount)(item));
  if (!(0,external_kolmafia_.takeCloset)(getCloset, item) && throwOnFail) throw "failed to remove from closet";
  remaining -= getCloset;
  if (remaining <= 0) return qty;
  var getStorage = Math.min(remaining, (0,external_kolmafia_.storageAmount)(item));
  if (!(0,external_kolmafia_.takeStorage)(getStorage, item) && throwOnFail) throw "failed to remove from storage";
  remaining -= getStorage;
  if (remaining <= 0) return qty;
  var getMall = Math.min(remaining, (0,external_kolmafia_.shopAmount)(item));

  if (!(0,external_kolmafia_.takeShop)(getMall, item)) {
    (0,external_kolmafia_.cliExecute)("refresh shop");
    (0,external_kolmafia_.cliExecute)("refresh inventory");
    remaining = qty - (0,external_kolmafia_.itemAmount)(item);
    getMall = Math.min(remaining, (0,external_kolmafia_.shopAmount)(item));
    if (!(0,external_kolmafia_.takeShop)(getMall, item) && throwOnFail) throw "failed to remove from shop";
  }

  remaining -= getMall;
  if (remaining <= 0) return qty;
  if (maxPrice <= 0) throw "buying disabled for ".concat(item.name, ".");
  (0,external_kolmafia_.buy)(remaining, item, maxPrice);
  if ((0,external_kolmafia_.itemAmount)(item) < qty && throwOnFail) throw "Mall price too high for ".concat(item.name, ".");
  return (0,external_kolmafia_.itemAmount)(item) - startAmount;
}
;// CONCATENATED MODULE: external "canadv.ash"
const external_canadv_ash_namespaceObject = require("canadv.ash");;
;// CONCATENATED MODULE: ./src/asdon.ts
var _templateObject, _templateObject2;

function _taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }



var fuelBlacklist = (0,dist.$items)(_templateObject || (_templateObject = _taggedTemplateLiteral(["cup of \"tea\", thermos of \"whiskey\", Lucky Lindy, Bee's Knees, Sockdollager, Ish Kabibble, Hot Socks, Phonus Balonus, Flivver, Sloppy Jalopy, glass of \"milk\""])));

function averageAdventures(it) {
  if (it.adventures.includes("-")) {
    var bounds = it.adventures.split("-");
    return (parseInt(bounds[0], 10) + parseInt(bounds[1], 10)) / 2.0;
  } else {
    return parseInt(it.adventures, 10);
  }
}

function price(item) {
  return (0,external_kolmafia_.historicalPrice)(item) === 0 ? (0,external_kolmafia_.mallPrice)(item) : (0,external_kolmafia_.historicalPrice)(item);
}

function calculateFuelEfficiency(it, targetUnits) {
  var units = averageAdventures(it);
  return price(it) / Math.min(targetUnits, units);
}

function isFuelItem(it) {
  return !(0,external_kolmafia_.isNpcItem)(it) && it.fullness + it.inebriety > 0 && averageAdventures(it) > 0 && it.tradeable && it.discardable && !fuelBlacklist.includes(it);
}

var potentialFuel = (0,dist.$items)(_templateObject2 || (_templateObject2 = _taggedTemplateLiteral([""]))).filter(isFuelItem);

function getBestFuel(targetUnits) {
  var key1 = function key1(item) {
    return -averageAdventures(item);
  };

  var key2 = function key2(item) {
    return calculateFuelEfficiency(item, targetUnits);
  };

  potentialFuel.sort(function (x, y) {
    return key1(x) - key1(y);
  });
  potentialFuel.sort(function (x, y) {
    return key2(x) - key2(y);
  });
  return potentialFuel[0];
}

function insertFuel(it) {
  var quantity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;
  var result = (0,external_kolmafia_.visitUrl)("campground.php?action=fuelconvertor&pwd&qty=".concat(quantity, "&iid=").concat((0,external_kolmafia_.toInt)(it), "&go=Convert%21"));
  return result.includes("The display updates with a");
}

function fillAsdonMartinTo(targetUnits) {
  while ((0,external_kolmafia_.getFuel)() < targetUnits) {
    var remaining = targetUnits - (0,external_kolmafia_.getFuel)();
    var fuel = getBestFuel(remaining);
    var count = Math.ceil(targetUnits / averageAdventures(fuel));
    (0,external_kolmafia_.retrieveItem)(count, fuel);

    if (!insertFuel(fuel, count)) {
      (0,external_kolmafia_.abort)("Fuelling failed");
    }
  }
}
;// CONCATENATED MODULE: ./src/clan.ts
var clan_templateObject;

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function clan_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }



function withStash(itemsToTake, action) {
  var manager = new StashManager();

  try {
    manager.take.apply(manager, _toConsumableArray(itemsToTake));
    return action();
  } finally {
    manager.putBackAll();
  }
}
function withVIPClan(action) {
  var clanIdOrName = (0,dist.get)("garbo_vipClan", undefined);

  if (!clanIdOrName && (0,dist.have)((0,dist.$item)(clan_templateObject || (clan_templateObject = clan_taggedTemplateLiteral(["Clan VIP Lounge key"]))))) {
    if ((0,external_kolmafia_.userConfirm)("The preference 'garbo_vipClan' is not set. Use the current clan as a VIP clan? (Defaults to yes in 15 seconds)", 15000, true)) {
      clanIdOrName = (0,external_kolmafia_.getClanId)();
      (0,dist.set)("garbo_vipClan", clanIdOrName);
    }
  }

  return withClan(clanIdOrName || (0,external_kolmafia_.getClanId)(), action);
}

function withClan(clanIdOrName, action) {
  var startingClanId = (0,external_kolmafia_.getClanId)();
  dist.Clan.join(clanIdOrName);

  try {
    return action();
  } finally {
    dist.Clan.join(startingClanId);
  }
}

var StashManager = /*#__PURE__*/function () {
  function StashManager(clanIdOrName) {
    _classCallCheck(this, StashManager);

    _defineProperty(this, "clanIdOrName", void 0);

    _defineProperty(this, "taken", new Map());

    if (clanIdOrName === undefined) {
      clanIdOrName = (0,dist.get)("garbo_stashClan", undefined);

      if (!clanIdOrName) {
        if ((0,external_kolmafia_.userConfirm)("The preference 'garbo_stashClan' is not set. Use the current clan as a stash clan? (Defaults to yes in 15 seconds)", 15000, true)) {
          clanIdOrName = (0,external_kolmafia_.getClanId)();
          (0,dist.set)("garbo_stashClan", clanIdOrName);
        } else {
          throw "No garbo_stashClan set.";
        }
      }
    }

    this.clanIdOrName = clanIdOrName;
  }

  _createClass(StashManager, [{
    key: "take",
    value: function take() {
      var _this = this;

      for (var _len = arguments.length, items = new Array(_len), _key = 0; _key < _len; _key++) {
        items[_key] = arguments[_key];
      }

      withClan(this.clanIdOrName, function () {
        var _iterator = _createForOfIteratorHelper(items),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var item = _step.value;
            if ((0,dist.have)(item)) continue;

            if ((0,dist.getFoldGroup)(item).some(function (fold) {
              return (0,dist.have)(fold);
            })) {
              (0,external_kolmafia_.cliExecute)("fold ".concat(item.name));
              continue;
            }

            var foldArray = [item].concat(_toConsumableArray((0,dist.getFoldGroup)(item)));
            (0,external_kolmafia_.refreshStash)();

            var _iterator2 = _createForOfIteratorHelper(foldArray),
                _step2;

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                var fold = _step2.value;

                try {
                  if ((0,external_kolmafia_.stashAmount)(fold) > 0) {
                    if ((0,external_kolmafia_.takeStash)(1, fold)) {
                      var _this$taken$get;

                      (0,external_kolmafia_.print)("Took ".concat(fold.name, " from stash in ").concat((0,external_kolmafia_.getClanName)(), "."), "blue");
                      if (fold !== item) (0,external_kolmafia_.cliExecute)("fold ".concat(item.name));

                      _this.taken.set(item, ((_this$taken$get = _this.taken.get(item)) !== null && _this$taken$get !== void 0 ? _this$taken$get : 0) + 1);

                      break;
                    } else {
                      (0,external_kolmafia_.print)("Failed to take ".concat(fold.name, " from the stash. Do you have stash access in ").concat((0,external_kolmafia_.getClanName)(), "?"), "red");
                    }
                  }
                } catch (_unused) {
                  (0,external_kolmafia_.print)("Failed to take ".concat(fold.name, " from stash in ").concat((0,external_kolmafia_.getClanName)(), "."), "red");
                }
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            if ((0,dist.have)(item)) continue;
            (0,external_kolmafia_.print)("Couldn't find ".concat(item.name, " in clan stash for ").concat((0,external_kolmafia_.getClanName)(), "."), "red");
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      });
    }
    /**
     * Ensure at least one of each of {items} in inventory.
     * @param items Items to take from the stash.
     */

  }, {
    key: "ensure",
    value: function ensure() {
      for (var _len2 = arguments.length, items = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        items[_key2] = arguments[_key2];
      }

      this.take.apply(this, _toConsumableArray(items.filter(function (item) {
        return (0,external_kolmafia_.availableAmount)(item) === 0;
      })));
    }
  }, {
    key: "putBack",
    value: function putBack() {
      var _this2 = this;

      for (var _len3 = arguments.length, items = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        items[_key3] = arguments[_key3];
      }

      withClan(this.clanIdOrName, function () {
        var _iterator3 = _createForOfIteratorHelper(items),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _this2$taken$get;

            var item = _step3.value;
            var count = (_this2$taken$get = _this2.taken.get(item)) !== null && _this2$taken$get !== void 0 ? _this2$taken$get : 0;

            if (count > 0) {
              (0,external_kolmafia_.retrieveItem)(count, item);

              if ((0,external_kolmafia_.putStash)(count, item)) {
                (0,external_kolmafia_.print)("Returned ".concat(item.name, " to stash in ").concat((0,external_kolmafia_.getClanName)(), "."), "blue");

                _this2.taken["delete"](item);
              } else {
                throw "Failed to return ".concat(item.name, " to stash.");
              }
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      });
    }
    /**
     * Put all items back in the stash.
     */

  }, {
    key: "putBackAll",
    value: function putBackAll() {
      this.putBack.apply(this, _toConsumableArray(this.taken.keys()));
    }
  }]);

  return StashManager;
}();
;// CONCATENATED MODULE: ./src/globalvars.ts
var globalvars_templateObject;

function globalvars_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }



var log = {
  initialEmbezzlersFought: 0,
  digitizedEmbezzlersFought: 0
};
var globalOptions = {
  stopTurncount: null,
  ascending: false
};
function estimatedTurns() {
  return globalOptions.stopTurncount ? globalOptions.stopTurncount - (0,external_kolmafia_.myTurncount)() : ((0,external_kolmafia_.myAdventures)() + (globalOptions.ascending && (0,external_kolmafia_.myInebriety)() <= (0,external_kolmafia_.inebrietyLimit)() ? 60 : 0)) * ((0,dist.have)((0,dist.$item)(globalvars_templateObject || (globalvars_templateObject = globalvars_taggedTemplateLiteral(["mafia thumb ring"])))) ? 1.04 : 1);
}
;// CONCATENATED MODULE: ./src/lib.ts
var lib_templateObject, lib_templateObject2, _templateObject3, _templateObject4, _templateObject5, _templateObject6, _templateObject7, _templateObject8, _templateObject9, _templateObject10, _templateObject11, _templateObject12, _templateObject13, _templateObject14, _templateObject15, _templateObject16, _templateObject17, _templateObject18, _templateObject19, _templateObject20, _templateObject21, _templateObject22, _templateObject23, _templateObject24, _templateObject25, _templateObject26, _templateObject27, _templateObject28, _templateObject29, _templateObject30, _templateObject31, _templateObject32, _templateObject33, _templateObject34, _templateObject35, _templateObject36, _templateObject37, _templateObject38, _templateObject39, _templateObject40, _templateObject41, _templateObject42, _templateObject43, _templateObject44, _templateObject45, _templateObject46;

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { lib_defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function lib_toConsumableArray(arr) { return lib_arrayWithoutHoles(arr) || lib_iterableToArray(arr) || lib_unsupportedIterableToArray(arr) || lib_nonIterableSpread(); }

function lib_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function lib_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function lib_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return lib_arrayLikeToArray(arr); }

function lib_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function lib_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function lib_createClass(Constructor, protoProps, staticProps) { if (protoProps) lib_defineProperties(Constructor.prototype, protoProps); if (staticProps) lib_defineProperties(Constructor, staticProps); return Constructor; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || lib_unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function lib_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return lib_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return lib_arrayLikeToArray(o, minLen); }

function lib_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function lib_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

function lib_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }





var BonusEquipMode;

(function (BonusEquipMode) {
  BonusEquipMode[BonusEquipMode["FREE"] = 0] = "FREE";
  BonusEquipMode[BonusEquipMode["EMBEZZLER"] = 1] = "EMBEZZLER";
  BonusEquipMode[BonusEquipMode["BARF"] = 2] = "BARF";
  BonusEquipMode[BonusEquipMode["DMT"] = 3] = "DMT";
})(BonusEquipMode || (BonusEquipMode = {}));

var propertyManager = new dist.PropertiesManager();
var baseMeat = dist.SongBoom.have() && (dist.SongBoom.songChangesLeft() > 0 || dist.SongBoom.song() === "Total Eclipse of Your Meat") ? 275 : 250;
function setChoice(adventure, value) {
  propertyManager.setChoices(lib_defineProperty({}, adventure, value));
}
function ensureEffect(effect) {
  if (!(0,dist.have)(effect)) (0,external_kolmafia_.cliExecute)(effect["default"]);
}
function clamp(n, min, max) {
  return Math.min(Math.max(n, min), max);
}
/**
 * Sum an array of numbers.
 * @param addends Addends to sum.
 */

function sum(addends) {
  return addends.reduce(function (s, n) {
    return s + n;
  }, 0);
}
function mapMonster(location, monster) {
  if ((0,external_kolmafia_.haveSkill)((0,dist.$skill)(lib_templateObject || (lib_templateObject = lib_taggedTemplateLiteral(["Map the Monsters"])))) && !(0,dist.get)("mappingMonsters") && (0,dist.get)("_monstersMapped") < 3) {
    (0,external_kolmafia_.useSkill)((0,dist.$skill)(lib_templateObject2 || (lib_templateObject2 = lib_taggedTemplateLiteral(["Map the Monsters"]))));
  }

  if (!(0,dist.get)("mappingMonsters")) throw "Failed to setup Map the Monsters.";
  var mapPage = (0,external_kolmafia_.visitUrl)((0,external_kolmafia_.toUrl)(location), false, true);
  if (!mapPage.includes("Leading Yourself Right to Them")) throw "Something went wrong mapping.";
  var fightPage = (0,external_kolmafia_.visitUrl)("choice.php?pwd&whichchoice=1435&option=1&heyscriptswhatsupwinkwink=".concat(monster.id));
  if (!fightPage.includes(monster.name)) throw "Something went wrong starting the fight.";
}
function argmax(values) {
  return values.reduce(function (_ref, _ref2) {
    var _ref3 = _slicedToArray(_ref, 2),
        minValue = _ref3[0],
        minScore = _ref3[1];

    var _ref4 = _slicedToArray(_ref2, 2),
        value = _ref4[0],
        score = _ref4[1];

    return score > minScore ? [value, score] : [minValue, minScore];
  })[0];
}
function questStep(questName) {
  var stringStep = dist.property.getString(questName);
  if (stringStep === "unstarted" || stringStep === "") return -1;else if (stringStep === "started") return 0;else if (stringStep === "finished") return 999;else {
    if (stringStep.substring(0, 4) !== "step") {
      throw "Quest state parsing error.";
    }

    return parseInt(stringStep.substring(4), 10);
  }
}
var zonePotions = [{
  zone: "Spaaace",
  effect: (0,dist.$effect)(_templateObject3 || (_templateObject3 = lib_taggedTemplateLiteral(["Transpondent"]))),
  potion: (0,dist.$item)(_templateObject4 || (_templateObject4 = lib_taggedTemplateLiteral(["transporter transponder"])))
}, {
  zone: "Wormwood",
  effect: (0,dist.$effect)(_templateObject5 || (_templateObject5 = lib_taggedTemplateLiteral(["Absinthe-Minded"]))),
  potion: (0,dist.$item)(_templateObject6 || (_templateObject6 = lib_taggedTemplateLiteral(["tiny bottle of absinthe"])))
}, {
  zone: "RabbitHole",
  effect: (0,dist.$effect)(_templateObject7 || (_templateObject7 = lib_taggedTemplateLiteral(["Down the Rabbit Hole"]))),
  potion: (0,dist.$item)(_templateObject8 || (_templateObject8 = lib_taggedTemplateLiteral(["\"DRINK ME\" potion"])))
}];

function acceptBestGuzzlrQuest() {
  if (!dist.Guzzlr.isQuestActive()) {
    if (dist.Guzzlr.canPlatinum() && (!dist.Guzzlr.haveFullPlatinumBonus() || dist.Guzzlr.haveFullBronzeBonus() && dist.Guzzlr.haveFullGoldBonus())) {
      dist.Guzzlr.acceptPlatinum();
    } else if (dist.Guzzlr.canGold() && (!dist.Guzzlr.haveFullGoldBonus() || dist.Guzzlr.haveFullBronzeBonus())) {
      dist.Guzzlr.acceptGold();
    } else {
      dist.Guzzlr.acceptBronze();
    }
  }
}

function prepWandererZone() {
  var defaultLocation = (0,dist.get)("_spookyAirportToday") || (0,dist.get)("spookyAirportAlways") ? (0,dist.$location)(_templateObject9 || (_templateObject9 = lib_taggedTemplateLiteral(["The Deep Dark Jungle"]))) : (0,dist.$location)(_templateObject10 || (_templateObject10 = lib_taggedTemplateLiteral(["Noob Cave"])));
  if (!dist.Guzzlr.have()) return defaultLocation;
  acceptBestGuzzlrQuest();
  if (!guzzlrCheck()) dist.Guzzlr.abandon();
  acceptBestGuzzlrQuest();
  var guzzlZone = dist.Guzzlr.getLocation();
  if (!guzzlrCheck()) return defaultLocation;else if (!guzzlZone) return defaultLocation;else {
    if (dist.Guzzlr.getTier() === "platinum") {
      zonePotions.forEach(function (place) {
        if (guzzlZone.zone === place.zone && !(0,dist.have)(place.effect)) {
          if (!(0,dist.have)(place.potion)) {
            (0,external_kolmafia_.buy)(1, place.potion, 10000);
          }

          (0,external_kolmafia_.use)(1, place.potion);
        }
      });

      if (!dist.Guzzlr.havePlatinumBooze()) {
        (0,external_kolmafia_.cliExecute)("make buttery boy");
      }
    } else {
      var guzzlrBooze = dist.Guzzlr.getBooze();

      if (!guzzlrBooze) {
        return defaultLocation;
      } else if (!(0,dist.have)(guzzlrBooze)) {
        (0,external_kolmafia_.print)("just picking up some booze before we roll", "blue");
        (0,external_kolmafia_.cliExecute)("acquire ".concat(guzzlrBooze));
      }
    }

    return guzzlZone;
  }
}

function guzzlrCheck() {
  var guzzlZone = dist.Guzzlr.getLocation();
  if (!guzzlZone) return false;
  var forbiddenZones = [""]; //can't stockpile these potions,

  if (!(0,dist.get)("_spookyAirportToday") && !(0,dist.get)("spookyAirportAlways")) {
    forbiddenZones.push("Conspiracy Island");
  }

  if (!(0,dist.get)("_stenchAirportToday") && !(0,dist.get)("stenchAirportAlways")) {
    forbiddenZones.push("Dinseylandfill");
  }

  if (!(0,dist.get)("_hotAirportToday") && !(0,dist.get)("hotAirportAlways")) {
    forbiddenZones.push("That 70s Volcano");
  }

  if (!(0,dist.get)("_coldAirportToday") && !(0,dist.get)("coldAirportAlways")) {
    forbiddenZones.push("The Glaciest");
  }

  if (!(0,dist.get)("_sleazeAirportToday") && !(0,dist.get)("sleazeAirportAlways")) {
    forbiddenZones.push("Spring Break Beach");
  }

  zonePotions.forEach(function (place) {
    if (guzzlZone.zone === place.zone && !(0,dist.have)(place.effect)) {
      if (!(0,dist.have)(place.potion)) {
        (0,external_kolmafia_.buy)(1, place.potion, 10000);
      }

      (0,external_kolmafia_.use)(1, place.potion);
    }
  });
  var blacklist = (0,dist.$locations)(_templateObject11 || (_templateObject11 = lib_taggedTemplateLiteral(["The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, Madness Bakery, The Secret Government Laboratory, The Overgrown Lot, The Skeleton Store"])));

  if (forbiddenZones.includes(guzzlZone.zone) || blacklist.includes(guzzlZone) || !guzzlZone.wanderers || guzzlZone.environment === "underwater" || !(0,external_canadv_ash_namespaceObject.canAdv)(guzzlZone, false)) {
    return false;
  } else {
    return true;
  }
}

var Requirement = /*#__PURE__*/function () {
  function Requirement(maximizeParameters_, maximizeOptions_) {
    lib_classCallCheck(this, Requirement);

    lib_defineProperty(this, "maximizeParameters_", void 0);

    lib_defineProperty(this, "maximizeOptions_", void 0);

    this.maximizeParameters_ = maximizeParameters_;
    this.maximizeOptions_ = maximizeOptions_;
  }

  lib_createClass(Requirement, [{
    key: "maximizeParameters",
    value: function maximizeParameters() {
      return this.maximizeParameters_;
    }
  }, {
    key: "maximizeOptions",
    value: function maximizeOptions() {
      return this.maximizeOptions_;
    }
  }, {
    key: "merge",
    value: function merge(other) {
      var _optionsA$bonusEquip$, _optionsA$bonusEquip, _optionsB$bonusEquip$, _optionsB$bonusEquip, _optionsA$forceEquip, _optionsB$forceEquip, _optionsA$preventEqui, _optionsB$preventEqui, _optionsA$onlySlot, _optionsB$onlySlot, _optionsA$preventSlot, _optionsB$preventSlot;

      var optionsA = this.maximizeOptions();
      var optionsB = other.maximizeOptions();
      return new Requirement([].concat(lib_toConsumableArray(this.maximizeParameters()), lib_toConsumableArray(other.maximizeParameters())), _objectSpread(_objectSpread(_objectSpread({}, optionsA), optionsB), {}, {
        bonusEquip: new Map([].concat(lib_toConsumableArray((_optionsA$bonusEquip$ = (_optionsA$bonusEquip = optionsA.bonusEquip) === null || _optionsA$bonusEquip === void 0 ? void 0 : _optionsA$bonusEquip.entries()) !== null && _optionsA$bonusEquip$ !== void 0 ? _optionsA$bonusEquip$ : []), lib_toConsumableArray((_optionsB$bonusEquip$ = (_optionsB$bonusEquip = optionsB.bonusEquip) === null || _optionsB$bonusEquip === void 0 ? void 0 : _optionsB$bonusEquip.entries()) !== null && _optionsB$bonusEquip$ !== void 0 ? _optionsB$bonusEquip$ : []))),
        forceEquip: [].concat(lib_toConsumableArray((_optionsA$forceEquip = optionsA.forceEquip) !== null && _optionsA$forceEquip !== void 0 ? _optionsA$forceEquip : []), lib_toConsumableArray((_optionsB$forceEquip = optionsB.forceEquip) !== null && _optionsB$forceEquip !== void 0 ? _optionsB$forceEquip : [])),
        preventEquip: [].concat(lib_toConsumableArray((_optionsA$preventEqui = optionsA.preventEquip) !== null && _optionsA$preventEqui !== void 0 ? _optionsA$preventEqui : []), lib_toConsumableArray((_optionsB$preventEqui = optionsB.preventEquip) !== null && _optionsB$preventEqui !== void 0 ? _optionsB$preventEqui : [])),
        onlySlot: [].concat(lib_toConsumableArray((_optionsA$onlySlot = optionsA.onlySlot) !== null && _optionsA$onlySlot !== void 0 ? _optionsA$onlySlot : []), lib_toConsumableArray((_optionsB$onlySlot = optionsB.onlySlot) !== null && _optionsB$onlySlot !== void 0 ? _optionsB$onlySlot : [])),
        preventSlot: [].concat(lib_toConsumableArray((_optionsA$preventSlot = optionsA.preventSlot) !== null && _optionsA$preventSlot !== void 0 ? _optionsA$preventSlot : []), lib_toConsumableArray((_optionsB$preventSlot = optionsB.preventSlot) !== null && _optionsB$preventSlot !== void 0 ? _optionsB$preventSlot : []))
      }));
    }
  }], [{
    key: "merge",
    value: function merge(allRequirements) {
      return allRequirements.reduce(function (x, y) {
        return x.merge(y);
      });
    }
  }]);

  return Requirement;
}();
var physicalImmuneMacro = dist.Macro.trySkill("curse of weaksauce").trySkill("sing along").trySkill("extract").externalIf((0,dist.have)((0,dist.$skill)(_templateObject12 || (_templateObject12 = lib_taggedTemplateLiteral(["Saucestorm"])))), dist.Macro.skill("Saucestorm").repeat()).externalIf((0,dist.have)((0,dist.$skill)(_templateObject13 || (_templateObject13 = lib_taggedTemplateLiteral(["Saucegeyser"])))), dist.Macro.skill("Saucegeyser").repeat()).externalIf((0,dist.have)((0,dist.$skill)(_templateObject14 || (_templateObject14 = lib_taggedTemplateLiteral(["Cannelloni Cannon"])))), dist.Macro.skill("Cannelloni Cannon").repeat()).externalIf((0,dist.have)((0,dist.$skill)(_templateObject15 || (_templateObject15 = lib_taggedTemplateLiteral(["Wave of Sauce"])))), dist.Macro.skill("Wave of Sauce").repeat()).externalIf((0,dist.have)((0,dist.$skill)(_templateObject16 || (_templateObject16 = lib_taggedTemplateLiteral(["Saucecicle"])))), dist.Macro.skill("Saucecicle").repeat()); //The Freezewoman is spooky-aligned, don't worry

function tryFeast(familiar) {
  if ((0,dist.have)(familiar)) {
    (0,external_kolmafia_.useFamiliar)(familiar);
    (0,external_kolmafia_.use)((0,dist.$item)(_templateObject17 || (_templateObject17 = lib_taggedTemplateLiteral(["moveable feast"]))));
  }
}
var FreeRun = function FreeRun(name, available, macro, requirement, prepare) {
  lib_classCallCheck(this, FreeRun);

  lib_defineProperty(this, "name", void 0);

  lib_defineProperty(this, "available", void 0);

  lib_defineProperty(this, "macro", void 0);

  lib_defineProperty(this, "requirement", void 0);

  lib_defineProperty(this, "prepare", void 0);

  this.name = name;
  this.available = available;
  this.macro = macro;
  this.requirement = requirement;
  this.prepare = prepare;
};
var banishesToUse = questStep("questL11Worship") > 0 && (0,dist.get)("_drunkPygmyBanishes") === 0 ? 2 : 3;
var freeRuns = [
/*
new freeRun(
   () => {
    if (getWorkshed() !== $item`Asdon Martin keyfob`) return false;
    const banishes = get("banishedMonsters").split(":");
    const bumperIndex = banishes
      .map((string) => string.toLowerCase())
      .indexOf("spring-loaded front bumper");
    if (bumperIndex === -1) return true;
    return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
  },
  () => {
    fillAsdonMartinTo(50);
    retrieveItem(1, $item`louder than bomb`);
  },
  Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").item("louder than bomb")
),
code removed because of boss monsters
*/
new FreeRun("Bander", function () {
  return (0,dist.have)((0,dist.$familiar)(_templateObject18 || (_templateObject18 = lib_taggedTemplateLiteral(["Frumious Bandersnatch"])))) && ((0,dist.have)((0,dist.$effect)(_templateObject19 || (_templateObject19 = lib_taggedTemplateLiteral(["Ode to Booze"])))) || (0,dist.getSongCount)() < (0,dist.getSongLimit)()) && dist.Bandersnatch.getRemainingRunaways() > 0;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"), new Requirement(["Familiar Weight"], {}), function () {
  (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject20 || (_templateObject20 = lib_taggedTemplateLiteral(["Frumious Bandersnatch"]))));
  ensureEffect((0,dist.$effect)(_templateObject21 || (_templateObject21 = lib_taggedTemplateLiteral(["Ode to Booze"]))));
}), new FreeRun("Boots", function () {
  return (0,dist.have)((0,dist.$familiar)(_templateObject22 || (_templateObject22 = lib_taggedTemplateLiteral(["Pair of Stomping Boots"])))) && dist.Bandersnatch.getRemainingRunaways() > 0;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"), new Requirement(["Familiar Weight"], {}), function () {
  return (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject23 || (_templateObject23 = lib_taggedTemplateLiteral(["Pair of Stomping Boots"]))));
}), new FreeRun("Snokebomb", function () {
  return (0,dist.get)("_snokebombUsed") < banishesToUse && (0,dist.have)((0,dist.$skill)(_templateObject24 || (_templateObject24 = lib_taggedTemplateLiteral(["Snokebomb"]))));
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("snokebomb"), undefined, function () {
  return (0,external_kolmafia_.restoreMp)(50);
}), new FreeRun("Hatred", function () {
  return (0,dist.get)("_feelHatredUsed") < banishesToUse && (0,dist.have)((0,dist.$skill)(_templateObject25 || (_templateObject25 = lib_taggedTemplateLiteral(["Emotionally Chipped"]))));
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("feel hatred")), new FreeRun("KGB", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject26 || (_templateObject26 = lib_taggedTemplateLiteral(["Kremlin's Greatest Briefcase"])))) && (0,dist.get)("_kgbTranquilizerDartUses") < 3;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("KGB tranquilizer dart"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject27 || (_templateObject27 = lib_taggedTemplateLiteral(["Kremlin's Greatest Briefcase"])))
})), new FreeRun("Latte", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject28 || (_templateObject28 = lib_taggedTemplateLiteral(["latte lovers member's mug"])))) && !(0,dist.get)("_latteBanishUsed");
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Throw Latte on Opponent"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject29 || (_templateObject29 = lib_taggedTemplateLiteral(["latte lovers member's mug"])))
})), new FreeRun("Docbag", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject30 || (_templateObject30 = lib_taggedTemplateLiteral(["Lil' Doctor\u2122 bag"])))) && (0,dist.get)("_reflexHammerUsed") < 3;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("reflex hammer"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject31 || (_templateObject31 = lib_taggedTemplateLiteral(["Lil' Doctor\u2122 bag"])))
})), new FreeRun("Middle Finger", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject32 || (_templateObject32 = lib_taggedTemplateLiteral(["mafia middle finger ring"])))) && !(0,dist.get)("_mafiaMiddleFingerRingUsed");
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Show them your ring"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject33 || (_templateObject33 = lib_taggedTemplateLiteral(["mafia middle finger ring"])))
})), new FreeRun("VMask", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject34 || (_templateObject34 = lib_taggedTemplateLiteral(["V for Vivala mask"])))) && !(0,dist.get)("_vmaskBanisherUsed");
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Creepy Grin"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject35 || (_templateObject35 = lib_taggedTemplateLiteral(["V for Vivala mask"])))
}), function () {
  return (0,external_kolmafia_.restoreMp)(30);
}), new FreeRun("Stinkeye", function () {
  return (0,dist.getFoldGroup)((0,dist.$item)(_templateObject36 || (_templateObject36 = lib_taggedTemplateLiteral(["stinky cheese diaper"])))).some(function (item) {
    return (0,dist.have)(item);
  }) && !(0,dist.get)("_stinkyCheeseBanisherUsed");
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Give Your Opponent the Stinkeye"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject37 || (_templateObject37 = lib_taggedTemplateLiteral(["stinky cheese eye"])))
}), function () {
  if (!(0,dist.have)((0,dist.$item)(_templateObject38 || (_templateObject38 = lib_taggedTemplateLiteral(["stinky cheese eye"]))))) (0,external_kolmafia_.cliExecute)("fold stinky cheese eye");
}), new FreeRun("Scrapbook", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject39 || (_templateObject39 = lib_taggedTemplateLiteral(["familiar scrapbook"])))) && (0,dist.get)("scrapbookCharges") >= 100;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Show Your Boring Familiar Pictures"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject40 || (_templateObject40 = lib_taggedTemplateLiteral(["familiar scrapbook"])))
})), new FreeRun("Navel Ring", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject41 || (_templateObject41 = lib_taggedTemplateLiteral(["navel ring of navel gazing"])))) && (0,dist.get)("_navelRunaways") < 3;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject42 || (_templateObject42 = lib_taggedTemplateLiteral(["navel ring of navel gazing"])))
})), new FreeRun("GAP", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject43 || (_templateObject43 = lib_taggedTemplateLiteral(["Greatest American Pants"])))) && (0,dist.get)("_navelRunaways") < 3;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"), new Requirement([], {
  forceEquip: (0,dist.$items)(_templateObject44 || (_templateObject44 = lib_taggedTemplateLiteral(["Greatest American Pants"])))
})), new FreeRun("Parasol", function () {
  return (0,dist.have)((0,dist.$item)(_templateObject45 || (_templateObject45 = lib_taggedTemplateLiteral(["peppermint parasol"])))) && globalOptions.ascending && (0,dist.get)("parasolUsed") < 9 && (0,dist.get)("_navelRunaways") < 3;
}, dist.Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").item("peppermint parasol"))];
function findRun() {
  var useFamiliar = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
  return freeRuns.find(function (run) {
    return run.available() && (useFamiliar || !["Bander", "Boots"].includes(run.name));
  });
}
var valueMap = new Map();
var MALL_VALUE_MODIFIER = 0.9;
function saleValue() {
  for (var _len = arguments.length, items = new Array(_len), _key = 0; _key < _len; _key++) {
    items[_key] = arguments[_key];
  }

  return items.map(function (item) {
    if (valueMap.has(item)) return valueMap.get(item) || 0;

    if (item.discardable) {
      valueMap.set(item, (0,external_kolmafia_.mallPrice)(item) > Math.max(2 * (0,external_kolmafia_.autosellPrice)(item), 100) ? MALL_VALUE_MODIFIER * (0,external_kolmafia_.mallPrice)(item) : (0,external_kolmafia_.autosellPrice)(item));
    } else {
      valueMap.set(item, (0,external_kolmafia_.mallPrice)(item) > 100 ? MALL_VALUE_MODIFIER * (0,external_kolmafia_.mallPrice)(item) : 0);
    }

    return valueMap.get(item) || 0;
  }).reduce(function (s, price) {
    return s + price;
  }, 0) / items.length;
}
function kramcoGuaranteed() {
  return (0,dist.have)((0,dist.$item)(_templateObject46 || (_templateObject46 = lib_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"])))) && (0,dist.getKramcoWandererChance)() >= 1;
}
;// CONCATENATED MODULE: ./src/familiar.ts
var familiar_templateObject, familiar_templateObject2, familiar_templateObject3, familiar_templateObject4, familiar_templateObject5, familiar_templateObject6, familiar_templateObject7, familiar_templateObject8, familiar_templateObject9, familiar_templateObject10, familiar_templateObject11, familiar_templateObject12, familiar_templateObject13, familiar_templateObject14, familiar_templateObject15, familiar_templateObject16, familiar_templateObject17, familiar_templateObject18, familiar_templateObject19, familiar_templateObject20, familiar_templateObject21, familiar_templateObject22, familiar_templateObject23, familiar_templateObject24, familiar_templateObject25, familiar_templateObject26, familiar_templateObject27, familiar_templateObject28, familiar_templateObject29, familiar_templateObject30, familiar_templateObject31;

function familiar_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = familiar_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function familiar_toConsumableArray(arr) { return familiar_arrayWithoutHoles(arr) || familiar_iterableToArray(arr) || familiar_unsupportedIterableToArray(arr) || familiar_nonIterableSpread(); }

function familiar_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function familiar_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return familiar_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return familiar_arrayLikeToArray(o, minLen); }

function familiar_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function familiar_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return familiar_arrayLikeToArray(arr); }

function familiar_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function familiar_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }





var _meatFamiliar;

function meatFamiliar() {
  if (!_meatFamiliar) {
    if ((0,external_kolmafia_.myInebriety)() > (0,external_kolmafia_.inebrietyLimit)() && (0,dist.have)((0,dist.$familiar)(familiar_templateObject || (familiar_templateObject = familiar_taggedTemplateLiteral(["Trick-or-Treating Tot"])))) && (0,dist.have)((0,dist.$item)(familiar_templateObject2 || (familiar_templateObject2 = familiar_taggedTemplateLiteral(["li'l pirate costume"]))))) {
      _meatFamiliar = (0,dist.$familiar)(familiar_templateObject3 || (familiar_templateObject3 = familiar_taggedTemplateLiteral(["Trick-or-Treating Tot"])));
    } else {
      var bestLeps = Familiar.all().filter(dist.have).sort(function (a, b) {
        return (0,external_kolmafia_.numericModifier)(b, "Meat Drop", 1, (0,dist.$item)(familiar_templateObject4 || (familiar_templateObject4 = familiar_taggedTemplateLiteral(["none"])))) - (0,external_kolmafia_.numericModifier)(a, "Meat Drop", 1, (0,dist.$item)(familiar_templateObject5 || (familiar_templateObject5 = familiar_taggedTemplateLiteral(["none"]))));
      });
      var bestLepMult = (0,external_kolmafia_.numericModifier)(bestLeps[0], "Meat Drop", 1, (0,dist.$item)(familiar_templateObject6 || (familiar_templateObject6 = familiar_taggedTemplateLiteral(["none"]))));
      _meatFamiliar = bestLeps.filter(function (familiar) {
        return (0,external_kolmafia_.numericModifier)(familiar, "Meat Drop", 1, (0,dist.$item)(familiar_templateObject7 || (familiar_templateObject7 = familiar_taggedTemplateLiteral(["none"])))) === bestLepMult;
      }).sort(function (a, b) {
        return (0,external_kolmafia_.numericModifier)(b, "Item Drop", 1, (0,dist.$item)(familiar_templateObject8 || (familiar_templateObject8 = familiar_taggedTemplateLiteral(["none"])))) - (0,external_kolmafia_.numericModifier)(a, "Item Drop", 1, (0,dist.$item)(familiar_templateObject9 || (familiar_templateObject9 = familiar_taggedTemplateLiteral(["none"]))));
      })[0];
    }
  }

  return _meatFamiliar;
}

function myFamiliarWeight() {
  var familiar = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  if (familiar === null) familiar = (0,external_kolmafia_.myFamiliar)();
  return (0,external_kolmafia_.familiarWeight)(familiar) + (0,external_kolmafia_.weightAdjustment)();
} // 5, 10, 15, 20, 25 +5/turn: 5.29, 4.52, 3.91, 3.42, 3.03


var rotatingFamiliars = {
  "Fist Turkey": {
    expected: [3.91, 4.52, 4.52, 5.29, 5.29],
    drop: (0,dist.$item)(familiar_templateObject10 || (familiar_templateObject10 = familiar_taggedTemplateLiteral(["Ambitious Turkey"]))),
    pref: "_turkeyBooze"
  },
  "Llama Lama": {
    expected: [3.42, 3.91, 4.52, 5.29, 5.29],
    drop: (0,dist.$item)(familiar_templateObject11 || (familiar_templateObject11 = familiar_taggedTemplateLiteral(["llama lama gong"]))),
    pref: "_gongDrops"
  },
  "Astral Badger": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject12 || (familiar_templateObject12 = familiar_taggedTemplateLiteral(["astral mushroom"]))),
    pref: "_astralDrops"
  },
  "Li'l Xenomorph": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject13 || (familiar_templateObject13 = familiar_taggedTemplateLiteral(["transporter transponder"]))),
    pref: "_transponderDrops"
  },
  "Rogue Program": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject14 || (familiar_templateObject14 = familiar_taggedTemplateLiteral(["Game Grid token"]))),
    pref: "_tokenDrops"
  },
  "Bloovian Groose": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject15 || (familiar_templateObject15 = familiar_taggedTemplateLiteral(["groose grease"]))),
    pref: "_grooseDrops"
  },
  "Baby Sandworm": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject16 || (familiar_templateObject16 = familiar_taggedTemplateLiteral(["agua de vida"]))),
    pref: "_aguaDrops"
  },
  "Green Pixie": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject17 || (familiar_templateObject17 = familiar_taggedTemplateLiteral(["tiny bottle of absinthe"]))),
    pref: "_absintheDrops"
  },
  "Blavious Kloop": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject18 || (familiar_templateObject18 = familiar_taggedTemplateLiteral(["devilish folio"]))),
    pref: "_kloopDrops"
  },
  "Galloping Grill": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: (0,dist.$item)(familiar_templateObject19 || (familiar_templateObject19 = familiar_taggedTemplateLiteral(["hot ashes"]))),
    pref: "_hotAshesDrops"
  }
};
var savedMimicDropValue = null;

function mimicDropValue() {
  var _savedMimicDropValue;

  return (_savedMimicDropValue = savedMimicDropValue) !== null && _savedMimicDropValue !== void 0 ? _savedMimicDropValue : savedMimicDropValue = saleValue.apply(void 0, familiar_toConsumableArray((0,dist.$items)(familiar_templateObject20 || (familiar_templateObject20 = familiar_taggedTemplateLiteral(["Polka Pop, BitterSweetTarts, Piddles"]))))) / (6.29 * 0.95 + 1 * 0.05);
}

function freeFightFamiliar() {
  var familiarValue = [];

  if ((0,dist.have)((0,dist.$familiar)(familiar_templateObject21 || (familiar_templateObject21 = familiar_taggedTemplateLiteral(["Pocket Professor"])))) && (0,dist.$familiar)(familiar_templateObject22 || (familiar_templateObject22 = familiar_taggedTemplateLiteral(["Pocket Professor"]))).experience < 400 && !(0,dist.get)("_thesisDelivered")) {
    // Estimate based on value to charge thesis.
    familiarValue.push([(0,dist.$familiar)(familiar_templateObject23 || (familiar_templateObject23 = familiar_taggedTemplateLiteral(["Pocket Professor"]))), 3000]);
  }

  for (var _i = 0, _Object$keys = Object.keys(rotatingFamiliars); _i < _Object$keys.length; _i++) {
    var familiarName = _Object$keys[_i];
    var familiar = Familiar.get(familiarName);

    if ((0,dist.have)(familiar)) {
      var _rotatingFamiliars$fa = rotatingFamiliars[familiarName],
          expected = _rotatingFamiliars$fa.expected,
          drop = _rotatingFamiliars$fa.drop,
          pref = _rotatingFamiliars$fa.pref;
      var dropsAlready = (0,dist.get)(pref);
      if (dropsAlready >= expected.length) continue;
      var value = (0,external_kolmafia_.mallPrice)(drop) / expected[dropsAlready];
      familiarValue.push([familiar, value]);
    }
  }

  if ((0,dist.have)((0,dist.$familiar)(familiar_templateObject24 || (familiar_templateObject24 = familiar_taggedTemplateLiteral(["Stocking Mimic"]))))) {
    var mimicWeight = myFamiliarWeight((0,dist.$familiar)(familiar_templateObject25 || (familiar_templateObject25 = familiar_taggedTemplateLiteral(["Stocking Mimic"]))));
    var actionPercentage = 1 / 3 + ((0,external_kolmafia_.haveEffect)((0,dist.$effect)(familiar_templateObject26 || (familiar_templateObject26 = familiar_taggedTemplateLiteral(["Jingle Jangle Jingle"])))) ? 0.1 : 0);
    var mimicValue = mimicDropValue() + mimicWeight * actionPercentage * 1 / 4 * 10 * 4 * 1.2;
    familiarValue.push([(0,dist.$familiar)(familiar_templateObject27 || (familiar_templateObject27 = familiar_taggedTemplateLiteral(["Stocking Mimic"]))), mimicValue]);
  }

  if ((0,external_kolmafia_.haveFamiliar)((0,dist.$familiar)(familiar_templateObject28 || (familiar_templateObject28 = familiar_taggedTemplateLiteral(["Robortender"]))))) familiarValue.push([(0,dist.$familiar)(familiar_templateObject29 || (familiar_templateObject29 = familiar_taggedTemplateLiteral(["Robortender"]))), 200]);

  var _iterator = familiar_createForOfIteratorHelper((0,dist.$familiars)(familiar_templateObject31 || (familiar_templateObject31 = familiar_taggedTemplateLiteral(["Hobo Monkey, Cat Burglar, Urchin Urchin, Leprechaun"])))),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var _familiar = _step.value;
      if ((0,external_kolmafia_.haveFamiliar)(_familiar)) familiarValue.push([_familiar, 1]);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  familiarValue.push([(0,dist.$familiar)(familiar_templateObject30 || (familiar_templateObject30 = familiar_taggedTemplateLiteral(["none"]))), 0]);
  return argmax(familiarValue);
}
// EXTERNAL MODULE: ./node_modules/core-js/modules/es.object.from-entries.js
var es_object_from_entries = __webpack_require__(5809);
;// CONCATENATED MODULE: ./src/potions.ts
var potions_templateObject, potions_templateObject2, potions_templateObject3, potions_templateObject4, potions_templateObject5, potions_templateObject6, potions_templateObject7, potions_templateObject8;

function potions_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function potions_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function potions_createClass(Constructor, protoProps, staticProps) { if (protoProps) potions_defineProperties(Constructor.prototype, protoProps); if (staticProps) potions_defineProperties(Constructor, staticProps); return Constructor; }

function potions_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function potions_toConsumableArray(arr) { return potions_arrayWithoutHoles(arr) || potions_iterableToArray(arr) || potions_unsupportedIterableToArray(arr) || potions_nonIterableSpread(); }

function potions_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function potions_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function potions_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return potions_arrayLikeToArray(arr); }

function potions_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = potions_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function potions_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return potions_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return potions_arrayLikeToArray(o, minLen); }

function potions_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function potions_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }









var banned = (0,dist.$items)(potions_templateObject || (potions_templateObject = potions_taggedTemplateLiteral(["Uncle Greenspan's Bathroom Finance Guide"])));
var mutuallyExclusiveList = [(0,dist.$effects)(potions_templateObject2 || (potions_templateObject2 = potions_taggedTemplateLiteral(["Blue Tongue, Green Tongue, Orange Tongue, Purple Tongue, Red Tongue, Black Tongue"])))];
var mutuallyExclusive = new Map();

for (var _i = 0, _mutuallyExclusiveLis = mutuallyExclusiveList; _i < _mutuallyExclusiveLis.length; _i++) {
  var effectGroup = _mutuallyExclusiveLis[_i];

  var _iterator = potions_createForOfIteratorHelper(effectGroup),
      _step;

  try {
    var _loop = function _loop() {
      var _mutuallyExclusive$ge;

      var effect = _step.value;
      mutuallyExclusive.set(effect, [].concat(potions_toConsumableArray((_mutuallyExclusive$ge = mutuallyExclusive.get(effect)) !== null && _mutuallyExclusive$ge !== void 0 ? _mutuallyExclusive$ge : []), potions_toConsumableArray(effectGroup.filter(function (other) {
        return other !== effect;
      }))));
    };

    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      _loop();
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
}

var Potion = /*#__PURE__*/function () {
  function Potion(potion) {
    potions_classCallCheck(this, Potion);

    potions_defineProperty(this, "potion", void 0);

    this.potion = potion;
  }

  potions_createClass(Potion, [{
    key: "effect",
    value: function effect() {
      return (0,external_kolmafia_.effectModifier)(this.potion, "Effect");
    }
  }, {
    key: "effectDuration",
    value: function effectDuration() {
      return (0,external_kolmafia_.numericModifier)(this.potion, "Effect Duration");
    }
  }, {
    key: "meatDrop",
    value: function meatDrop() {
      return (0,external_kolmafia_.numericModifier)(this.effect(), "Meat Drop");
    }
  }, {
    key: "familiarWeight",
    value: function familiarWeight() {
      return (0,external_kolmafia_.numericModifier)(this.effect(), "Familiar Weight");
    }
  }, {
    key: "bonusMeat",
    value: function bonusMeat() {
      var familiarMultiplier = (0,dist.have)((0,dist.$familiar)(potions_templateObject3 || (potions_templateObject3 = potions_taggedTemplateLiteral(["Robortender"])))) ? 2 : (0,dist.have)((0,dist.$familiar)(potions_templateObject4 || (potions_templateObject4 = potions_taggedTemplateLiteral(["Hobo Monkey"])))) ? 1.25 : 1; // Assume base weight of 100 pounds. This is off but close enough.

      var assumedBaseWeight = 100; // Marginal value of familiar weight in % meat drop.

      var marginalValue = 2 * familiarMultiplier + Math.sqrt(220 * familiarMultiplier) / (2 * Math.sqrt(assumedBaseWeight));
      return this.familiarWeight() * marginalValue + this.meatDrop();
    }
  }, {
    key: "gross",
    value: function gross(embezzlers) {
      var doubleDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var bonusMeat = this.bonusMeat();
      var duration = this.effectDuration() * (doubleDuration ? 2 : 1); // Number of embezzlers this will actually be in effect for.

      var embezzlersApplied = Math.max(Math.min(duration, embezzlers) - (0,external_kolmafia_.haveEffect)(this.effect()), 0);
      return bonusMeat / 100 * (baseMeat * duration + 750 * embezzlersApplied);
    }
  }, {
    key: "price",
    value: function price(historical) {
      // If asked for historical, and age < 14 days, use historical.
      return historical && (0,external_kolmafia_.historicalAge)(this.potion) < 14 ? (0,external_kolmafia_.historicalPrice)(this.potion) : (0,external_kolmafia_.mallPrice)(this.potion);
    }
  }, {
    key: "net",
    value: function net(embezzlers) {
      var doubleDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var historical = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
      return this.gross(embezzlers, doubleDuration) - this.price(historical);
    }
  }, {
    key: "doublingValue",
    value: function doublingValue(embezzlers) {
      var historical = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      return Math.max(this.net(embezzlers, true, historical), 0) - Math.max(this.net(embezzlers, false, historical), 0);
    }
  }, {
    key: "useAsValuable",
    value: function useAsValuable(embezzlers) {
      var doubleDuration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var duration = this.effectDuration() * (doubleDuration ? 2 : 1);
      var quantityToUse = 0;
      var embezzlersRemaining = Math.max(embezzlers - (0,external_kolmafia_.haveEffect)(this.effect()), 0);
      var keepGoing = true; // Use however many will land entirely on embezzler turns.

      var embezzlerQuantity = Math.floor(embezzlersRemaining / duration);

      if (this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlerQuantity > 0) {
        acquire(embezzlerQuantity, this.potion, this.gross(embezzlersRemaining, doubleDuration), false);
        quantityToUse = Math.min(embezzlerQuantity, (0,external_kolmafia_.itemAmount)(this.potion));
        (0,external_kolmafia_.print)("Determined that ".concat(quantityToUse, " ").concat(this.potion.plural, " are profitable on embezzlers: net value ").concat(this.net(embezzlersRemaining, doubleDuration).toFixed(0), "."), "blue");
        embezzlersRemaining -= quantityToUse * duration;
      }

      if (quantityToUse < embezzlerQuantity || doubleDuration && quantityToUse > 0) {
        keepGoing = false;
      } // Now, is there one with both embezzlers and non-embezzlers?


      if (keepGoing && this.net(embezzlersRemaining, doubleDuration) > 0 && embezzlersRemaining > 0) {
        acquire(1, this.potion, this.gross(embezzlersRemaining, doubleDuration), false);
        var additional = Math.min(1, (0,external_kolmafia_.itemAmount)(this.potion) - quantityToUse);
        (0,external_kolmafia_.print)("Determined that ".concat(additional, " ").concat(this.potion.plural, " are profitable on partial embezzlers: net value ").concat(this.net(embezzlersRemaining, doubleDuration).toFixed(0), "."), "blue");
        quantityToUse += additional;
        embezzlersRemaining = Math.max(embezzlersRemaining - additional * duration, 0);
      }

      if (embezzlersRemaining > 0 || doubleDuration && quantityToUse > 0) keepGoing = false; // How many should we use with non-embezzlers?

      if (keepGoing && this.net(0, doubleDuration) > 0) {
        var adventureCap = estimatedTurns();
        var tourists = adventureCap - (0,external_kolmafia_.haveEffect)(this.effect()) - quantityToUse * duration;

        if (tourists > 0) {
          var touristQuantity = Math.ceil(tourists / duration);
          acquire(touristQuantity, this.potion, this.gross(0, doubleDuration), false);

          var _additional = Math.min(touristQuantity, (0,external_kolmafia_.itemAmount)(this.potion) - quantityToUse);

          (0,external_kolmafia_.print)("Determined that ".concat(_additional, " ").concat(this.potion.plural, " are profitable on tourists: net value ").concat(this.net(0, doubleDuration).toFixed(0), "."), "blue");
          quantityToUse += _additional;
        }
      }

      if (quantityToUse > 0) {
        if (doubleDuration) quantityToUse = 1;
        (0,external_kolmafia_.use)(quantityToUse, this.potion);
      }
    }
  }]);

  return Potion;
}();

function potionSetup() {
  var doEmbezzlers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  // TODO: Count PYEC.
  // TODO: Count free fights (25 meat each for most).
  var embezzlers = doEmbezzlers ? embezzlerCount() : 0;
  var potions = Item.all().filter(function (item) {
    return item.tradeable && !banned.includes(item) && (0,external_kolmafia_.itemType)(item) === "potion";
  });
  var meatPotions = potions.map(function (item) {
    return new Potion(item);
  }).filter(function (potion) {
    return potion.bonusMeat() > 0;
  });

  if ((0,dist.have)((0,dist.$item)(potions_templateObject5 || (potions_templateObject5 = potions_taggedTemplateLiteral(["Eight Days a Week Pill Keeper"])))) && !(0,dist.get)("_freePillKeeperUsed")) {
    var testPotionsDoubled = meatPotions.filter(function (potion) {
      return potion.gross(embezzlers, true) / potion.price(true) > 0.5;
    });
    testPotionsDoubled.sort(function (x, y) {
      return -(x.doublingValue(embezzlers) - y.doublingValue(embezzlers));
    });

    if (testPotionsDoubled.length > 0) {
      var potion = testPotionsDoubled[0]; // Estimate that the opportunity cost of free PK useage is 10k meat - approximately +1 embezzler.

      if (potion.doublingValue(embezzlers) > ((0,external_canadv_ash_namespaceObject.canAdv)((0,dist.$location)(potions_templateObject6 || (potions_templateObject6 = potions_taggedTemplateLiteral(["Cobb's Knob Treasury"]))), false) ? 15000 : 0)) {
        (0,external_kolmafia_.cliExecute)("pillkeeper extend");
        (0,external_kolmafia_.print)("Best doubling potion: ".concat(potion.potion.name, ", value ").concat(potion.doublingValue(embezzlers).toFixed(0)), "blue");
        potion.useAsValuable(embezzlers, true);
      }
    }
  } // Only test potions which are reasonably close to being profitable using historical price.


  var testPotions = meatPotions.filter(function (potion) {
    return potion.gross(embezzlers) / potion.price(true) > 0.5;
  });
  testPotions.sort(function (x, y) {
    return -(x.net(embezzlers) - y.net(embezzlers));
  });
  var excludedEffects = new Set();

  var _iterator2 = potions_createForOfIteratorHelper((0,dist.getActiveEffects)()),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _mutuallyExclusive$ge2;

      var effect = _step2.value;

      var _iterator4 = potions_createForOfIteratorHelper((_mutuallyExclusive$ge2 = mutuallyExclusive.get(effect)) !== null && _mutuallyExclusive$ge2 !== void 0 ? _mutuallyExclusive$ge2 : []),
          _step4;

      try {
        for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
          var excluded = _step4.value;
          excludedEffects.add(excluded);
        }
      } catch (err) {
        _iterator4.e(err);
      } finally {
        _iterator4.f();
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  var _iterator3 = potions_createForOfIteratorHelper(testPotions),
      _step3;

  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _potion = _step3.value;

      var _effect = _potion.effect();

      if (excludedEffects.has(_effect)) continue;

      _potion.useAsValuable(embezzlers);

      if ((0,dist.have)(_effect)) {
        var _mutuallyExclusive$ge3;

        var _iterator5 = potions_createForOfIteratorHelper((_mutuallyExclusive$ge3 = mutuallyExclusive.get(_effect)) !== null && _mutuallyExclusive$ge3 !== void 0 ? _mutuallyExclusive$ge3 : []),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var _excluded = _step5.value;
            excludedEffects.add(_excluded);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }
      }
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
}
function bathroomFinance(embezzlers) {
  if ((0,dist.have)((0,dist.$effect)(potions_templateObject7 || (potions_templateObject7 = potions_taggedTemplateLiteral(["Buy!  Sell!  Buy!  Sell!"]))))) return; // Average meat % for embezzlers is sum of arithmetic series, 2 * sum(1 -> embezzlers)

  var averageEmbezzlerGross = (baseMeat + 750) * 2 * (embezzlers + 1) / 2 / 100;
  var embezzlerGross = averageEmbezzlerGross * embezzlers;
  var tourists = 100 - embezzlers; // Average meat % for tourists is sum of arithmetic series, 2 * sum(embezzlers + 1 -> 100)

  var averageTouristGross = baseMeat * 2 * (100 + embezzlers + 1) / 2 / 100;
  var touristGross = averageTouristGross * tourists;
  var greenspan = (0,dist.$item)(potions_templateObject8 || (potions_templateObject8 = potions_taggedTemplateLiteral(["Uncle Greenspan's Bathroom Finance Guide"])));

  if (touristGross + embezzlerGross > (0,external_kolmafia_.mallPrice)(greenspan)) {
    (0,external_kolmafia_.print)("Using Uncle Greenspan's guide!", "blue");
    acquire(1, greenspan, touristGross + embezzlerGross);
    if ((0,external_kolmafia_.itemAmount)(greenspan) > 0) (0,external_kolmafia_.use)(greenspan);
  }
}
;// CONCATENATED MODULE: ./src/mood.ts
var mood_templateObject, mood_templateObject2, mood_templateObject3, mood_templateObject4, mood_templateObject5, mood_templateObject6, mood_templateObject7, mood_templateObject8, mood_templateObject9, mood_templateObject10, mood_templateObject11, mood_templateObject12, mood_templateObject13, mood_templateObject14, mood_templateObject15, mood_templateObject16, mood_templateObject17, mood_templateObject18, mood_templateObject19, mood_templateObject20, mood_templateObject21, mood_templateObject22, mood_templateObject23, mood_templateObject24, mood_templateObject25, mood_templateObject26, mood_templateObject27, mood_templateObject28, mood_templateObject29, mood_templateObject30, mood_templateObject31, mood_templateObject32, mood_templateObject33, mood_templateObject34, mood_templateObject35, mood_templateObject36, mood_templateObject37, mood_templateObject38, mood_templateObject39, mood_templateObject40, mood_templateObject41, mood_templateObject42;

function mood_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }






dist.Mood.setDefaultOptions({
  songSlots: [(0,dist.$effects)(mood_templateObject || (mood_templateObject = mood_taggedTemplateLiteral(["Polka of Plenty"]))), (0,dist.$effects)(mood_templateObject2 || (mood_templateObject2 = mood_taggedTemplateLiteral(["Fat Leon's Phat Loot Lyric, Ur-Kel's Aria of Annoyance"]))), (0,dist.$effects)(mood_templateObject3 || (mood_templateObject3 = mood_taggedTemplateLiteral(["Chorale of Companionship"]))), (0,dist.$effects)(mood_templateObject4 || (mood_templateObject4 = mood_taggedTemplateLiteral(["The Ballad of Richie Thingfinder"])))]
});
function meatMood() {
  var urKels = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
  var embezzlers = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  var mood = new dist.Mood();
  mood.potion((0,dist.$item)(mood_templateObject5 || (mood_templateObject5 = mood_taggedTemplateLiteral(["How to Avoid Scams"]))), 3 * baseMeat);
  mood.potion((0,dist.$item)(mood_templateObject6 || (mood_templateObject6 = mood_taggedTemplateLiteral(["resolution: be wealthier"]))), 0.3 * baseMeat);
  mood.potion((0,dist.$item)(mood_templateObject7 || (mood_templateObject7 = mood_taggedTemplateLiteral(["resolution: be happier"]))), 0.15 * 0.45 * 0.8 * 200);
  mood.potion((0,dist.$item)(mood_templateObject8 || (mood_templateObject8 = mood_taggedTemplateLiteral(["Flaskfull of Hollow"]))), 5);
  mood.skill((0,dist.$skill)(mood_templateObject9 || (mood_templateObject9 = mood_taggedTemplateLiteral(["Blood Bond"]))));
  mood.skill((0,dist.$skill)(mood_templateObject10 || (mood_templateObject10 = mood_taggedTemplateLiteral(["Leash of Linguini"]))));
  mood.skill((0,dist.$skill)(mood_templateObject11 || (mood_templateObject11 = mood_taggedTemplateLiteral(["Empathy of the Newt"]))));
  mood.skill((0,dist.$skill)(mood_templateObject12 || (mood_templateObject12 = mood_taggedTemplateLiteral(["The Polka of Plenty"]))));
  mood.skill((0,dist.$skill)(mood_templateObject13 || (mood_templateObject13 = mood_taggedTemplateLiteral(["Disco Leer"]))));
  mood.skill(urKels ? (0,dist.$skill)(mood_templateObject14 || (mood_templateObject14 = mood_taggedTemplateLiteral(["Ur-Kel's Aria of Annoyance"]))) : (0,dist.$skill)(mood_templateObject15 || (mood_templateObject15 = mood_taggedTemplateLiteral(["Fat Leon's Phat Loot Lyric"]))));
  mood.skill((0,dist.$skill)(mood_templateObject16 || (mood_templateObject16 = mood_taggedTemplateLiteral(["Singer's Faithful Ocelot"]))));
  mood.skill((0,dist.$skill)(mood_templateObject17 || (mood_templateObject17 = mood_taggedTemplateLiteral(["The Spirit of Taking"]))));
  mood.skill((0,dist.$skill)(mood_templateObject18 || (mood_templateObject18 = mood_taggedTemplateLiteral(["Drescher's Annoying Noise"]))));
  mood.skill((0,dist.$skill)(mood_templateObject19 || (mood_templateObject19 = mood_taggedTemplateLiteral(["Pride of the Puffin"]))));
  if ((0,external_kolmafia_.myClass)() !== (0,dist.$class)(mood_templateObject20 || (mood_templateObject20 = mood_taggedTemplateLiteral(["Pastamancer"])))) mood.skill((0,dist.$skill)(mood_templateObject21 || (mood_templateObject21 = mood_taggedTemplateLiteral(["Bind Lasagmbie"]))));

  if ((0,external_kolmafia_.haveSkill)((0,dist.$skill)(mood_templateObject22 || (mood_templateObject22 = mood_taggedTemplateLiteral(["Sweet Synthesis"]))))) {
    mood.effect((0,dist.$effect)(mood_templateObject23 || (mood_templateObject23 = mood_taggedTemplateLiteral(["Synthesis: Greed"]))), function () {
      if ((0,external_kolmafia_.mySpleenUse)() < (0,external_kolmafia_.spleenLimit)()) (0,external_kolmafia_.cliExecute)("synthesize greed");
    });
  }

  if ((0,external_kolmafia_.getCampground)()["Asdon Martin keyfob"] !== undefined) {
    if ((0,external_kolmafia_.getFuel)() < 37) (0,external_kolmafia_.cliExecute)("asdonmartin fuel 1 pie man was not meant to eat");
    mood.effect((0,dist.$effect)(mood_templateObject24 || (mood_templateObject24 = mood_taggedTemplateLiteral(["Driving Observantly"]))));
  }

  if ((0,dist.have)((0,dist.$item)(mood_templateObject25 || (mood_templateObject25 = mood_taggedTemplateLiteral(["Kremlin's Greatest Briefcase"]))))) {
    mood.effect((0,dist.$effect)(mood_templateObject26 || (mood_templateObject26 = mood_taggedTemplateLiteral(["A View to Some Meat"]))), function () {
      if ((0,dist.get)("_kgbClicksUsed") < 22) {
        var buffTries = Math.ceil((22 - (0,dist.get)("_kgbClicksUsed")) / 3);
        (0,external_kolmafia_.cliExecute)("Briefcase buff ".concat(new Array(buffTries).fill("meat").join(" ")));
      }
    });
  }

  if (!(0,dist.get)("concertVisited") && (0,dist.get)("sidequestArenaCompleted") === "fratboy") {
    (0,external_kolmafia_.cliExecute)("concert winklered");
  } else if (!(0,dist.get)("concertVisited") && (0,dist.get)("sidequestArenaCompleted") === "hippy") {
    (0,external_kolmafia_.cliExecute)("concert optimist primal");
  }

  potionSetup(embezzlers);
  return mood;
}
function freeFightMood() {
  var mood = new dist.Mood();

  if (!(0,dist.get)("_garbo_defectiveTokenAttempted", false)) {
    (0,dist.set)("_garbo_defectiveTokenAttempted", true);
    withStash((0,dist.$items)(mood_templateObject27 || (mood_templateObject27 = mood_taggedTemplateLiteral(["defective Game Grid token"]))), function () {
      if (!(0,dist.get)("_defectiveTokenUsed") && (0,dist.have)((0,dist.$item)(mood_templateObject28 || (mood_templateObject28 = mood_taggedTemplateLiteral(["defective Game Grid token"]))))) (0,external_kolmafia_.use)((0,dist.$item)(mood_templateObject29 || (mood_templateObject29 = mood_taggedTemplateLiteral(["defective Game Grid token"]))));
    });
  }

  if (!(0,dist.get)("_glennGoldenDiceUsed")) {
    if ((0,dist.have)((0,dist.$item)(mood_templateObject30 || (mood_templateObject30 = mood_taggedTemplateLiteral(["Glenn's golden dice"]))))) (0,external_kolmafia_.use)((0,dist.$item)(mood_templateObject31 || (mood_templateObject31 = mood_taggedTemplateLiteral(["Glenn's golden dice"]))));
  }

  if ((0,external_kolmafia_.getClanLounge)()["Clan pool table"] !== undefined) {
    while ((0,dist.get)("_poolGames") < 3) {
      (0,external_kolmafia_.cliExecute)("pool aggressive");
    }
  }

  if ((0,external_kolmafia_.haveEffect)((0,dist.$effect)(mood_templateObject32 || (mood_templateObject32 = mood_taggedTemplateLiteral(["Blue Swayed"])))) < 50) {
    (0,external_kolmafia_.use)(Math.ceil((50 - (0,external_kolmafia_.haveEffect)((0,dist.$effect)(mood_templateObject33 || (mood_templateObject33 = mood_taggedTemplateLiteral(["Blue Swayed"]))))) / 10), (0,dist.$item)(mood_templateObject34 || (mood_templateObject34 = mood_taggedTemplateLiteral(["pulled blue taffy"]))));
  }

  mood.potion((0,dist.$item)(mood_templateObject35 || (mood_templateObject35 = mood_taggedTemplateLiteral(["white candy heart"]))), 30);
  var goodSongs = (0,dist.$skills)(mood_templateObject36 || (mood_templateObject36 = mood_taggedTemplateLiteral(["Chorale of Companionship, The Ballad of Richie Thingfinder, Ur-Kel's Aria of Annoyance, The Polka of Plenty"])));

  for (var _i = 0, _Object$keys = Object.keys((0,external_kolmafia_.myEffects)()); _i < _Object$keys.length; _i++) {
    var effectName = _Object$keys[_i];
    var effect = Effect.get(effectName);
    var skill = (0,external_kolmafia_.toSkill)(effect);

    if (skill["class"] === (0,dist.$class)(mood_templateObject37 || (mood_templateObject37 = mood_taggedTemplateLiteral(["Accordion Thief"]))) && skill.buff && !goodSongs.includes(skill)) {
      (0,external_kolmafia_.cliExecute)("shrug ".concat(effectName));
    }
  }

  if (((0,dist.get)("daycareOpen") || (0,dist.get)("_daycareToday")) && !(0,dist.get)("_daycareSpa")) {
    (0,external_kolmafia_.cliExecute)("daycare mysticality");
  }

  if ((0,dist.have)((0,dist.$item)(mood_templateObject38 || (mood_templateObject38 = mood_taggedTemplateLiteral(["redwood rain stick"])))) && !(0,dist.get)("_redwoodRainStickUsed")) {
    (0,external_kolmafia_.use)((0,dist.$item)(mood_templateObject39 || (mood_templateObject39 = mood_taggedTemplateLiteral(["redwood rain stick"]))));
  }

  var beachHeadsUsed = (0,dist.get)("_beachHeadsUsed");

  if ((0,dist.have)((0,dist.$item)(mood_templateObject40 || (mood_templateObject40 = mood_taggedTemplateLiteral(["Beach Comb"])))) && !beachHeadsUsed.toString().split(",").includes("10")) {
    mood.effect((0,dist.$effect)(mood_templateObject41 || (mood_templateObject41 = mood_taggedTemplateLiteral(["Do I Know You From Somewhere?"]))));
  }

  if (dist.Witchess.have() && !(0,dist.get)("_witchessBuff")) {
    mood.effect((0,dist.$effect)(mood_templateObject42 || (mood_templateObject42 = mood_taggedTemplateLiteral(["Puzzle Champ"]))));
  }

  if (questStep("questL06Friar") === 999 && !(0,dist.get)("friarsBlessingReceived")) {
    (0,external_kolmafia_.cliExecute)("friars familiar");
  }

  return mood;
}
;// CONCATENATED MODULE: ./src/bjorn.ts
var bjorn_templateObject, bjorn_templateObject2, bjorn_templateObject3, bjorn_templateObject4, bjorn_templateObject5, bjorn_templateObject6, bjorn_templateObject7, bjorn_templateObject8, bjorn_templateObject9, bjorn_templateObject10, bjorn_templateObject11, bjorn_templateObject12, bjorn_templateObject13, bjorn_templateObject14, bjorn_templateObject15, bjorn_templateObject16, bjorn_templateObject17, bjorn_templateObject18, bjorn_templateObject19, bjorn_templateObject20, bjorn_templateObject21, bjorn_templateObject22, bjorn_templateObject23, bjorn_templateObject24, bjorn_templateObject25, bjorn_templateObject26, bjorn_templateObject27, bjorn_templateObject28, bjorn_templateObject29, bjorn_templateObject30, bjorn_templateObject31, bjorn_templateObject32, bjorn_templateObject33, bjorn_templateObject34, bjorn_templateObject35, bjorn_templateObject36, bjorn_templateObject37, bjorn_templateObject38, bjorn_templateObject39, bjorn_templateObject40, bjorn_templateObject41, bjorn_templateObject42, bjorn_templateObject43, bjorn_templateObject44, bjorn_templateObject45, bjorn_templateObject46, _templateObject47, _templateObject48, _templateObject49, _templateObject50, _templateObject51, _templateObject52, _templateObject53, _templateObject54, _templateObject55, _templateObject56, _templateObject57, _templateObject58, _templateObject59, _templateObject60, _templateObject61, _templateObject62, _templateObject63, _templateObject64, _templateObject65, _templateObject66, _templateObject67, _templateObject68, _templateObject69, _templateObject70, _templateObject71, _templateObject72, _templateObject73, _templateObject74, _templateObject75, _templateObject76, _templateObject77, _templateObject78, _templateObject79, _templateObject80, _templateObject81, _templateObject82, _templateObject83, _templateObject84, _templateObject85, _templateObject86, _templateObject87, _templateObject88, _templateObject89, _templateObject90, _templateObject91, _templateObject92, _templateObject93, _templateObject94, _templateObject95, _templateObject96, _templateObject97, _templateObject98, _templateObject99, _templateObject100, _templateObject101, _templateObject102;

function bjorn_toConsumableArray(arr) { return bjorn_arrayWithoutHoles(arr) || bjorn_iterableToArray(arr) || bjorn_unsupportedIterableToArray(arr) || bjorn_nonIterableSpread(); }

function bjorn_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function bjorn_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return bjorn_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return bjorn_arrayLikeToArray(o, minLen); }

function bjorn_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function bjorn_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return bjorn_arrayLikeToArray(arr); }

function bjorn_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function bjorn_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }





var BjornModifierType;

(function (BjornModifierType) {
  BjornModifierType[BjornModifierType["MEAT"] = 0] = "MEAT";
  BjornModifierType[BjornModifierType["ITEM"] = 1] = "ITEM";
  BjornModifierType[BjornModifierType["FMWT"] = 2] = "FMWT";
})(BjornModifierType || (BjornModifierType = {}));

var bjornFams = [{
  familiar: (0,dist.$familiar)(bjorn_templateObject || (bjorn_templateObject = bjorn_taggedTemplateLiteral(["Puck Man"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject2 || (bjorn_templateObject2 = bjorn_taggedTemplateLiteral(["yellow pixel"]))));
  },
  probability: 0.25,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_yellowPixelDropsCrown") < 25;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject3 || (bjorn_templateObject3 = bjorn_taggedTemplateLiteral(["Ms. Puck Man"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject4 || (bjorn_templateObject4 = bjorn_taggedTemplateLiteral(["yellow pixel"]))));
  },
  probability: 0.25,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_yellowPixelDropsCrown") < 25;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject5 || (bjorn_templateObject5 = bjorn_taggedTemplateLiteral(["Grimstone Golem"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject6 || (bjorn_templateObject6 = bjorn_taggedTemplateLiteral(["grimstone mask"]))));
  },
  probability: 0.5,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_grimstoneMaskDropsCrown") < 1;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject7 || (bjorn_templateObject7 = bjorn_taggedTemplateLiteral(["Knob Goblin Organ Grinder"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 25
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject8 || (bjorn_templateObject8 = bjorn_taggedTemplateLiteral(["Happy Medium"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 25
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject9 || (bjorn_templateObject9 = bjorn_taggedTemplateLiteral(["Garbage Fire"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject10 || (bjorn_templateObject10 = bjorn_taggedTemplateLiteral(["burning newspaper"]))));
  },
  probability: 0.5,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_garbageFireDropsCrown") < 3;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject11 || (bjorn_templateObject11 = bjorn_taggedTemplateLiteral(["Machine Elf"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject12 || (bjorn_templateObject12 = bjorn_taggedTemplateLiteral(["abstraction: sensation, abstraction: thought, abstraction: action, abstraction: category, abstraction: perception, abstraction: purpose"])))));
  },
  probability: 0.2,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_abstractionDropsCrown") < 25;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject13 || (bjorn_templateObject13 = bjorn_taggedTemplateLiteral(["Trick-or-Treating Tot"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject14 || (bjorn_templateObject14 = bjorn_taggedTemplateLiteral(["hoarded candy wad"]))));
  },
  probability: 0.5,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_hoardedCandyDropsCrown") < 3;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject15 || (bjorn_templateObject15 = bjorn_taggedTemplateLiteral(["Warbear Drone"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject16 || (bjorn_templateObject16 = bjorn_taggedTemplateLiteral(["warbear whosit"]))));
  },
  probability: 1 / 4.5
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject17 || (bjorn_templateObject17 = bjorn_taggedTemplateLiteral(["Li'l Xenomorph"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject18 || (bjorn_templateObject18 = bjorn_taggedTemplateLiteral(["lunar isotope"]))));
  },
  probability: 0.05,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 15
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject19 || (bjorn_templateObject19 = bjorn_taggedTemplateLiteral(["Pottery Barn Owl"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject20 || (bjorn_templateObject20 = bjorn_taggedTemplateLiteral(["volcanic ash"]))));
  },
  probability: 0.1
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject21 || (bjorn_templateObject21 = bjorn_taggedTemplateLiteral(["Grim Brother"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject22 || (bjorn_templateObject22 = bjorn_taggedTemplateLiteral(["grim fairy tale"]))));
  },
  probability: 1,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_grimFairyTaleDropsCrown") < 2;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject23 || (bjorn_templateObject23 = bjorn_taggedTemplateLiteral(["Optimistic Candle"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject24 || (bjorn_templateObject24 = bjorn_taggedTemplateLiteral(["glob of melted wax"]))));
  },
  probability: 1,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_optimisticCandleDropsCrown") < 3;
  },
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 15
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject25 || (bjorn_templateObject25 = bjorn_taggedTemplateLiteral(["Adventurous Spelunker"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject26 || (bjorn_templateObject26 = bjorn_taggedTemplateLiteral(["teflon ore, velcro ore, vinyl ore, cardboard ore, styrofoam ore, bubblewrap ore"])))));
  },
  probability: 1,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_oreDropsCrown") < 6;
  },
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 15
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject27 || (bjorn_templateObject27 = bjorn_taggedTemplateLiteral(["Twitching Space Critter"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject28 || (bjorn_templateObject28 = bjorn_taggedTemplateLiteral(["space beast fur"]))));
  },
  probability: 1,
  dropPredicate: function dropPredicate() {
    return (0,dist.get)("_spaceFurDropsCrown") < 1;
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject29 || (bjorn_templateObject29 = bjorn_taggedTemplateLiteral(["Party Mouse"]))),
  meatVal: function meatVal() {
    return 50;
  },

  /*
  The below code is more accurate. However, party mouse is virtually never going to be worthwhile and this causes so many useless mall hits it isn't funny.
     saleValue(
      ...Item.all().filter(
        (booze) =>
          ["decent", "good"].includes(booze.quality) &&
          booze.inebriety > 0 &&
          booze.tradeable &&
          booze.discardable &&
          !$items`glass of "milk", cup of "tea", thermos of "whiskey", Lucky Lindy, Bee's Knees, Sockdollager, Ish Kabibble, Hot Socks, Phonus Balonus, Flivver, Sloppy Jalopy`.includes(
            booze
          )
      )
    ),
    */
  probability: 0.05
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject30 || (bjorn_templateObject30 = bjorn_taggedTemplateLiteral(["Yule Hound"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject31 || (bjorn_templateObject31 = bjorn_taggedTemplateLiteral(["candy cane"]))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject32 || (bjorn_templateObject32 = bjorn_taggedTemplateLiteral(["Gluttonous Green Ghost"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject33 || (bjorn_templateObject33 = bjorn_taggedTemplateLiteral(["bean burrito, enchanted bean burrito, jumping bean burrito"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject34 || (bjorn_templateObject34 = bjorn_taggedTemplateLiteral(["Reassembled Blackbird"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject35 || (bjorn_templateObject35 = bjorn_taggedTemplateLiteral(["blackberry"]))));
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 10
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject36 || (bjorn_templateObject36 = bjorn_taggedTemplateLiteral(["Reconstituted Crow"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(bjorn_templateObject37 || (bjorn_templateObject37 = bjorn_taggedTemplateLiteral(["blackberry"]))));
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 10
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject38 || (bjorn_templateObject38 = bjorn_taggedTemplateLiteral(["Hunchbacked Minion"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject39 || (bjorn_templateObject39 = bjorn_taggedTemplateLiteral(["disembodied brain, skeleton bone, skeleton bone, skeleton bone, skeleton bone"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject40 || (bjorn_templateObject40 = bjorn_taggedTemplateLiteral(["Reanimated Reanimator"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject41 || (bjorn_templateObject41 = bjorn_taggedTemplateLiteral(["hot wing, broken skull"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject42 || (bjorn_templateObject42 = bjorn_taggedTemplateLiteral(["Attention-Deficit Demon"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject43 || (bjorn_templateObject43 = bjorn_taggedTemplateLiteral(["chorizo brownies, white chocolate and tomato pizza, carob chunk noodles"])))));
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject44 || (bjorn_templateObject44 = bjorn_taggedTemplateLiteral(["Piano Cat"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(bjorn_templateObject45 || (bjorn_templateObject45 = bjorn_taggedTemplateLiteral(["beertini, papaya slung, salty slug, tomato daiquiri"])))));
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(bjorn_templateObject46 || (bjorn_templateObject46 = bjorn_taggedTemplateLiteral(["Golden Monkey"]))),
  meatVal: function meatVal() {
    return 100;
  },
  probability: 0.5,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 25
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject47 || (_templateObject47 = bjorn_taggedTemplateLiteral(["Robot Reindeer"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject48 || (_templateObject48 = bjorn_taggedTemplateLiteral(["candy cane, eggnog, fruitcake, gingerbread bugbear"])))));
  },
  probability: 0.3
}, {
  familiar: (0,dist.$familiar)(_templateObject49 || (_templateObject49 = bjorn_taggedTemplateLiteral(["Stocking Mimic"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject50 || (_templateObject50 = bjorn_taggedTemplateLiteral(["Angry Farmer candy, Cold Hots candy, Rock Pops, Tasty Fun Good rice candy, Wint-O-Fresh mint"])))));
  },
  probability: 0.3
}, {
  familiar: (0,dist.$familiar)(_templateObject51 || (_templateObject51 = bjorn_taggedTemplateLiteral(["BRICKO chick"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(_templateObject52 || (_templateObject52 = bjorn_taggedTemplateLiteral(["BRICKO brick"]))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject53 || (_templateObject53 = bjorn_taggedTemplateLiteral(["Cotton Candy Carnie"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(_templateObject54 || (_templateObject54 = bjorn_taggedTemplateLiteral(["cotton candy pinch"]))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject55 || (_templateObject55 = bjorn_taggedTemplateLiteral(["Untamed Turtle"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject56 || (_templateObject56 = bjorn_taggedTemplateLiteral(["snailmail bits, turtlemail bits, turtle wax"])))));
  },
  probability: 0.35
}, {
  familiar: (0,dist.$familiar)(_templateObject57 || (_templateObject57 = bjorn_taggedTemplateLiteral(["Astral Badger"]))),
  meatVal: function meatVal() {
    return 2 * saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject58 || (_templateObject58 = bjorn_taggedTemplateLiteral(["spooky mushroom, Knob mushroom, Knoll mushroom"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject59 || (_templateObject59 = bjorn_taggedTemplateLiteral(["Green Pixie"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(_templateObject60 || (_templateObject60 = bjorn_taggedTemplateLiteral(["bottle of tequila"]))));
  },
  probability: 0.2
}, {
  familiar: (0,dist.$familiar)(_templateObject61 || (_templateObject61 = bjorn_taggedTemplateLiteral(["Angry Goat"]))),
  meatVal: function meatVal() {
    return saleValue((0,dist.$item)(_templateObject62 || (_templateObject62 = bjorn_taggedTemplateLiteral(["goat cheese pizza"]))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject63 || (_templateObject63 = bjorn_taggedTemplateLiteral(["Adorable Seal Larva"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject64 || (_templateObject64 = bjorn_taggedTemplateLiteral(["stench nuggets, spooky nuggets, hot nuggets, cold nuggets, sleaze nuggets"])))));
  },
  probability: 0.35
}, {
  familiar: (0,dist.$familiar)(_templateObject65 || (_templateObject65 = bjorn_taggedTemplateLiteral(["Ancient Yuletide Troll"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject66 || (_templateObject66 = bjorn_taggedTemplateLiteral(["candy cane, eggnog, fruitcake, gingerbread bugbear"])))));
  },
  probability: 0.3
}, {
  familiar: (0,dist.$familiar)(_templateObject67 || (_templateObject67 = bjorn_taggedTemplateLiteral(["Sweet Nutcracker"]))),
  meatVal: function meatVal() {
    return saleValue.apply(void 0, bjorn_toConsumableArray((0,dist.$items)(_templateObject68 || (_templateObject68 = bjorn_taggedTemplateLiteral(["candy cane, eggnog, fruitcake, gingerbread bugbear"])))));
  },
  probability: 0.3
}, {
  familiar: (0,dist.$familiar)(_templateObject69 || (_templateObject69 = bjorn_taggedTemplateLiteral(["Casagnova Gnome"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject70 || (_templateObject70 = bjorn_taggedTemplateLiteral(["Coffee Pixie"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject71 || (_templateObject71 = bjorn_taggedTemplateLiteral(["Dancing Frog"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject72 || (_templateObject72 = bjorn_taggedTemplateLiteral(["Grouper Groupie"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject73 || (_templateObject73 = bjorn_taggedTemplateLiteral(["Hand Turkey"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject74 || (_templateObject74 = bjorn_taggedTemplateLiteral(["Hippo Ballerina"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject75 || (_templateObject75 = bjorn_taggedTemplateLiteral(["Jitterbug"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject76 || (_templateObject76 = bjorn_taggedTemplateLiteral(["Leprechaun"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject77 || (_templateObject77 = bjorn_taggedTemplateLiteral(["Obtuse Angel"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject78 || (_templateObject78 = bjorn_taggedTemplateLiteral(["Psychedelic Bear"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject79 || (_templateObject79 = bjorn_taggedTemplateLiteral(["Robortender"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 20
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject80 || (_templateObject80 = bjorn_taggedTemplateLiteral(["Ghost of Crimbo Commerce"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 25
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject81 || (_templateObject81 = bjorn_taggedTemplateLiteral(["Hobo Monkey"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.MEAT,
    modifier: 25
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject82 || (_templateObject82 = bjorn_taggedTemplateLiteral(["Rockin' Robin"]))),
  meatVal: function meatVal() {
    return 60;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 15
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject83 || (_templateObject83 = bjorn_taggedTemplateLiteral(["Feral Kobold"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 15
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject84 || (_templateObject84 = bjorn_taggedTemplateLiteral(["Oily Woim"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 10
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject85 || (_templateObject85 = bjorn_taggedTemplateLiteral(["Cat Burglar"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.ITEM,
    modifier: 10
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject86 || (_templateObject86 = bjorn_taggedTemplateLiteral(["Misshapen Animal Skeleton"]))),
  meatVal: function meatVal() {
    return 30;
  },
  probability: 1,
  modifier: {
    type: BjornModifierType.FMWT,
    modifier: 5
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject87 || (_templateObject87 = bjorn_taggedTemplateLiteral(["Gelatinous Cubeling"]))),
  meatVal: function meatVal() {
    return 0;
  },
  probability: 0,
  modifier: {
    type: BjornModifierType.FMWT,
    modifier: 5
  }
}, {
  familiar: (0,dist.$familiar)(_templateObject88 || (_templateObject88 = bjorn_taggedTemplateLiteral(["Frozen Gravy Fairy"]))),
  // drops a cold nugget every combat, 5 of which can be used to make a cold wad
  meatVal: function meatVal() {
    return Math.max(0.2 * saleValue((0,dist.$item)(_templateObject89 || (_templateObject89 = bjorn_taggedTemplateLiteral(["cold wad"])))), saleValue((0,dist.$item)(_templateObject90 || (_templateObject90 = bjorn_taggedTemplateLiteral(["cold nuggets"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject91 || (_templateObject91 = bjorn_taggedTemplateLiteral(["Stinky Gravy Fairy"]))),
  // drops a stench nugget every combat, 5 of which can be used to make a stench wad
  meatVal: function meatVal() {
    return Math.max(0.2 * saleValue((0,dist.$item)(_templateObject92 || (_templateObject92 = bjorn_taggedTemplateLiteral(["stench wad"])))), saleValue((0,dist.$item)(_templateObject93 || (_templateObject93 = bjorn_taggedTemplateLiteral(["stench nuggets"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject94 || (_templateObject94 = bjorn_taggedTemplateLiteral(["Sleazy Gravy Fairy"]))),
  // drops a sleaze nugget every combat, 5 of which can be used to make a sleaze wad
  meatVal: function meatVal() {
    return Math.max(0.2 * saleValue((0,dist.$item)(_templateObject95 || (_templateObject95 = bjorn_taggedTemplateLiteral(["sleaze wad"])))), saleValue((0,dist.$item)(_templateObject96 || (_templateObject96 = bjorn_taggedTemplateLiteral(["sleaze nuggets"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject97 || (_templateObject97 = bjorn_taggedTemplateLiteral(["Spooky Gravy Fairy"]))),
  // drops a spooky nugget every combat, 5 of which can be used to make a spooky wad
  meatVal: function meatVal() {
    return Math.max(0.2 * saleValue((0,dist.$item)(_templateObject98 || (_templateObject98 = bjorn_taggedTemplateLiteral(["spooky wad"])))), saleValue((0,dist.$item)(_templateObject99 || (_templateObject99 = bjorn_taggedTemplateLiteral(["spooky nuggets"])))));
  },
  probability: 1
}, {
  familiar: (0,dist.$familiar)(_templateObject100 || (_templateObject100 = bjorn_taggedTemplateLiteral(["Flaming Gravy Fairy"]))),
  // drops a hot nugget every combat, 5 of which can be used to make a hot wad
  meatVal: function meatVal() {
    return Math.max(0.2 * saleValue((0,dist.$item)(_templateObject101 || (_templateObject101 = bjorn_taggedTemplateLiteral(["hot wad"])))), saleValue((0,dist.$item)(_templateObject102 || (_templateObject102 = bjorn_taggedTemplateLiteral(["hot nuggets"])))));
  },
  probability: 1
}].filter(function (bjornFam) {
  return (0,dist.have)(bjornFam.familiar);
});
var bjornLists = new Map();

function generateBjornList(mode) {
  var additionalValue = function additionalValue(familiar) {
    if (!familiar.modifier) return 0;
    var meatVal = [BonusEquipMode.DMT, BonusEquipMode.FREE].includes(mode) ? 0 : baseMeat + (mode === BonusEquipMode.EMBEZZLER ? 750 : 0);
    var itemVal = mode === BonusEquipMode.BARF ? 72 : 0;
    if (familiar.modifier.type === BjornModifierType.MEAT) return familiar.modifier.modifier * meatVal / 100;
    if (familiar.modifier.type === BjornModifierType.ITEM) return familiar.modifier.modifier * itemVal / 100;

    if (familiar.modifier.type === BjornModifierType.FMWT) {
      var lepMultiplier = (0,external_kolmafia_.numericModifier)(meatFamiliar(), "Leprechaun", 1, Item.get("none"));
      var fairyMultiplier = (0,external_kolmafia_.numericModifier)(meatFamiliar(), "Fairy", 1, Item.get("none"));
      return (meatVal * (10 * lepMultiplier + 5 * Math.sqrt(lepMultiplier)) + itemVal * (5 * fairyMultiplier + 2.5 * Math.sqrt(fairyMultiplier))) / 100;
    }

    return 0;
  };

  return bjorn_toConsumableArray(bjornFams).sort(function (a, b) {
    return (!b.dropPredicate || b.dropPredicate() && ![BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].includes(mode) ? b.meatVal() * b.probability : 0) + additionalValue(b) - ((!a.dropPredicate || a.dropPredicate() && ![BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].includes(mode) ? a.meatVal() * a.probability : 0) + additionalValue(a));
  });
}

function pickBjorn() {
  var mode = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : BonusEquipMode.FREE;

  if (!bjornLists.has(mode)) {
    bjornLists.set(mode, generateBjornList(mode));
  }

  var bjornList = bjornLists.get(mode);

  if (bjornList) {
    while (bjornList[0].dropPredicate && !bjornList[0].dropPredicate()) {
      bjornList.shift();
    }

    if ((0,external_kolmafia_.myFamiliar)() !== bjornList[0].familiar) return bjornList[0];

    while (bjornList[1].dropPredicate && !bjornList[1].dropPredicate()) {
      bjornList.splice(1, 1);
    }

    return bjornList[1];
  }

  throw new Error("Something went wrong while selecting a familiar to bjornify or crownulate");
}
;// CONCATENATED MODULE: ./src/outfit.ts
var outfit_templateObject, outfit_templateObject2, outfit_templateObject3, outfit_templateObject4, outfit_templateObject5, outfit_templateObject6, outfit_templateObject7, outfit_templateObject8, outfit_templateObject9, outfit_templateObject10, outfit_templateObject11, outfit_templateObject12, outfit_templateObject13, outfit_templateObject14, outfit_templateObject15, outfit_templateObject16, outfit_templateObject17, outfit_templateObject18, outfit_templateObject19, outfit_templateObject20, outfit_templateObject21, outfit_templateObject22, outfit_templateObject23, outfit_templateObject24, outfit_templateObject25, outfit_templateObject26, outfit_templateObject27, outfit_templateObject28, outfit_templateObject29, outfit_templateObject30, outfit_templateObject31, outfit_templateObject32, outfit_templateObject33, outfit_templateObject34, outfit_templateObject35, outfit_templateObject36, outfit_templateObject37, outfit_templateObject38, outfit_templateObject39, outfit_templateObject40, outfit_templateObject41, outfit_templateObject42, outfit_templateObject43, outfit_templateObject44, outfit_templateObject45, outfit_templateObject46, outfit_templateObject47, outfit_templateObject48, outfit_templateObject49, outfit_templateObject50, outfit_templateObject51, outfit_templateObject52, outfit_templateObject53, outfit_templateObject54, outfit_templateObject55, outfit_templateObject56, outfit_templateObject57, outfit_templateObject58, outfit_templateObject59, outfit_templateObject60, outfit_templateObject61, outfit_templateObject62, outfit_templateObject63, outfit_templateObject64, outfit_templateObject65, outfit_templateObject66, outfit_templateObject67, outfit_templateObject68, outfit_templateObject69, outfit_templateObject70, outfit_templateObject71;

function outfit_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = outfit_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function outfit_toConsumableArray(arr) { return outfit_arrayWithoutHoles(arr) || outfit_iterableToArray(arr) || outfit_unsupportedIterableToArray(arr) || outfit_nonIterableSpread(); }

function outfit_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function outfit_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return outfit_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return outfit_arrayLikeToArray(o, minLen); }

function outfit_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function outfit_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return outfit_arrayLikeToArray(arr); }

function outfit_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function outfit_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }






var bestAdventuresFromPants = Item.all().filter(function (item) {
  return (0,external_kolmafia_.toSlot)(item) === (0,dist.$slot)(outfit_templateObject || (outfit_templateObject = outfit_taggedTemplateLiteral(["pants"]))) && (0,dist.have)(item) && (0,external_kolmafia_.numericModifier)(item, "Adventures") > 0;
}).map(function (pants) {
  return (0,external_kolmafia_.numericModifier)(pants, "Adventures");
}).sort(function (a, b) {
  return b - a;
})[0] || 0;
function freeFightOutfit() {
  var requirements = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var equipMode = (0,external_kolmafia_.myFamiliar)() === (0,dist.$familiar)(outfit_templateObject2 || (outfit_templateObject2 = outfit_taggedTemplateLiteral(["Machine Elf"]))) ? BonusEquipMode.DMT : BonusEquipMode.FREE;
  var bjornChoice = pickBjorn(equipMode);
  var compiledRequirements = Requirement.merge([].concat(outfit_toConsumableArray(requirements), [new Requirement((0,external_kolmafia_.myFamiliar)() === (0,dist.$familiar)(outfit_templateObject3 || (outfit_templateObject3 = outfit_taggedTemplateLiteral(["Pocket Professor"]))) ? ["Familiar Experience"] : ["Familiar Weight"], {
    bonusEquip: new Map([].concat(outfit_toConsumableArray(dropsItems(equipMode)), outfit_toConsumableArray(pantsgiving()), outfit_toConsumableArray(cheeses(false))))
  })]));
  var bjornAlike = (0,dist.have)((0,dist.$item)(outfit_templateObject4 || (outfit_templateObject4 = outfit_taggedTemplateLiteral(["Buddy Bjorn"])))) && !(compiledRequirements.maximizeOptions_.forceEquip && compiledRequirements.maximizeOptions_.forceEquip.some(function (equipment) {
    return (0,external_kolmafia_.toSlot)(equipment) === (0,dist.$slot)(outfit_templateObject5 || (outfit_templateObject5 = outfit_taggedTemplateLiteral(["back"])));
  })) ? (0,dist.$item)(outfit_templateObject6 || (outfit_templateObject6 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))) : (0,dist.$item)(outfit_templateObject7 || (outfit_templateObject7 = outfit_taggedTemplateLiteral(["Crown of Thrones"])));
  var finalRequirements = compiledRequirements.merge(new Requirement([], {
    bonusEquip: new Map([[bjornAlike, !bjornChoice.dropPredicate || bjornChoice.dropPredicate() ? bjornChoice.meatVal() * bjornChoice.probability : 0]]),
    preventEquip: bjornAlike === (0,dist.$item)(outfit_templateObject8 || (outfit_templateObject8 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))) ? (0,dist.$items)(outfit_templateObject9 || (outfit_templateObject9 = outfit_taggedTemplateLiteral(["Crown of Thrones"]))) : (0,dist.$items)(outfit_templateObject10 || (outfit_templateObject10 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))),
    preventSlot: (0,dist.$slots)(outfit_templateObject11 || (outfit_templateObject11 = outfit_taggedTemplateLiteral(["crown-of-thrones, buddy-bjorn"])))
  }));
  (0,dist.maximizeCached)(finalRequirements.maximizeParameters(), finalRequirements.maximizeOptions());
  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject12 || (outfit_templateObject12 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))))) (0,external_kolmafia_.bjornifyFamiliar)(bjornChoice.familiar);
  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject13 || (outfit_templateObject13 = outfit_taggedTemplateLiteral(["Crown of Thrones"]))))) (0,external_kolmafia_.enthroneFamiliar)(bjornChoice.familiar);
  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject14 || (outfit_templateObject14 = outfit_taggedTemplateLiteral(["Snow Suit"])))) && (0,dist.get)("snowsuit") !== "nose") (0,external_kolmafia_.cliExecute)("snowsuit nose");
}
function meatOutfit(embezzlerUp) {
  var requirements = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var sea = arguments.length > 2 ? arguments[2] : undefined;
  var forceEquip = [];
  var additionalRequirements = [];
  var equipMode = embezzlerUp ? BonusEquipMode.EMBEZZLER : BonusEquipMode.BARF;
  var bjornChoice = pickBjorn(equipMode);

  if ((0,external_kolmafia_.myInebriety)() > (0,external_kolmafia_.inebrietyLimit)()) {
    forceEquip.push((0,dist.$item)(outfit_templateObject15 || (outfit_templateObject15 = outfit_taggedTemplateLiteral(["Drunkula's wineglass"]))));
  } else if (!embezzlerUp) {
    if ((0,dist.getKramcoWandererChance)() > 0.05 && (0,dist.have)((0,dist.$item)(outfit_templateObject16 || (outfit_templateObject16 = outfit_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"]))))) {
      forceEquip.push((0,dist.$item)(outfit_templateObject17 || (outfit_templateObject17 = outfit_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"]))));
    } // TODO: Fix pointer finger ring construction.


    if ((0,external_kolmafia_.myClass)() !== (0,dist.$class)(outfit_templateObject18 || (outfit_templateObject18 = outfit_taggedTemplateLiteral(["Seal Clubber"])))) {
      if ((0,dist.have)((0,dist.$item)(outfit_templateObject19 || (outfit_templateObject19 = outfit_taggedTemplateLiteral(["haiku katana"]))))) {
        forceEquip.push((0,dist.$item)(outfit_templateObject20 || (outfit_templateObject20 = outfit_taggedTemplateLiteral(["haiku katana"]))));
      } else if ((0,dist.have)((0,dist.$item)(outfit_templateObject21 || (outfit_templateObject21 = outfit_taggedTemplateLiteral(["unwrapped knock-off retro superhero cape"]))))) {
        if (!(0,dist.have)((0,dist.$item)(outfit_templateObject22 || (outfit_templateObject22 = outfit_taggedTemplateLiteral(["ice nine"]))))) (0,external_kolmafia_.retrieveItem)((0,dist.$item)(outfit_templateObject23 || (outfit_templateObject23 = outfit_taggedTemplateLiteral(["ice nine"]))));
        forceEquip.push((0,dist.$item)(outfit_templateObject24 || (outfit_templateObject24 = outfit_taggedTemplateLiteral(["ice nine"]))));
      }
    }

    if ((0,dist.have)((0,dist.$item)(outfit_templateObject25 || (outfit_templateObject25 = outfit_taggedTemplateLiteral(["protonic accelerator pack"])))) && (0,dist.get)("questPAGhost") === "unstarted" && (0,dist.get)("nextParanormalActivity") <= (0,external_kolmafia_.totalTurnsPlayed)() && !forceEquip.includes((0,dist.$item)(outfit_templateObject26 || (outfit_templateObject26 = outfit_taggedTemplateLiteral(["ice nine"]))))) {
      forceEquip.push((0,dist.$item)(outfit_templateObject27 || (outfit_templateObject27 = outfit_taggedTemplateLiteral(["protonic accelerator pack"]))));
    }

    forceEquip.push((0,dist.$item)(outfit_templateObject28 || (outfit_templateObject28 = outfit_taggedTemplateLiteral(["mafia pointer finger ring"]))));
  }

  if ((0,external_kolmafia_.myFamiliar)() === (0,dist.$familiar)(outfit_templateObject29 || (outfit_templateObject29 = outfit_taggedTemplateLiteral(["Obtuse Angel"])))) {
    forceEquip.push((0,dist.$item)(outfit_templateObject30 || (outfit_templateObject30 = outfit_taggedTemplateLiteral(["quake of arrows"]))));
    if (!(0,dist.have)((0,dist.$item)(outfit_templateObject31 || (outfit_templateObject31 = outfit_taggedTemplateLiteral(["quake of arrows"]))))) (0,external_kolmafia_.retrieveItem)((0,dist.$item)(outfit_templateObject32 || (outfit_templateObject32 = outfit_taggedTemplateLiteral(["quake of arrows"]))));
  }

  if (sea) {
    additionalRequirements.push("sea");
  }

  var bjornAlike = (0,dist.have)((0,dist.$item)(outfit_templateObject33 || (outfit_templateObject33 = outfit_taggedTemplateLiteral(["Buddy Bjorn"])))) && !forceEquip.some(function (item) {
    return (0,external_kolmafia_.toSlot)(item) === (0,dist.$slot)(outfit_templateObject34 || (outfit_templateObject34 = outfit_taggedTemplateLiteral(["back"])));
  }) ? (0,dist.$item)(outfit_templateObject35 || (outfit_templateObject35 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))) : (0,dist.$item)(outfit_templateObject36 || (outfit_templateObject36 = outfit_taggedTemplateLiteral(["Crown of Thrones"])));
  var compiledRequirements = Requirement.merge([].concat(outfit_toConsumableArray(requirements), [new Requirement(["".concat(((embezzlerUp ? baseMeat + 750 : baseMeat) / 100).toFixed(2), " Meat Drop"), "".concat(embezzlerUp ? 0 : 0.72, " Item Drop")].concat(additionalRequirements), {
    forceEquip: forceEquip,
    preventEquip: [].concat(outfit_toConsumableArray((0,dist.$items)(outfit_templateObject37 || (outfit_templateObject37 = outfit_taggedTemplateLiteral(["broken champagne bottle, unwrapped knock-off retro superhero cape"])))), outfit_toConsumableArray(embezzlerUp ? (0,dist.$items)(outfit_templateObject38 || (outfit_templateObject38 = outfit_taggedTemplateLiteral(["cheap sunglasses"]))) : []), [bjornAlike === (0,dist.$item)(outfit_templateObject39 || (outfit_templateObject39 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))) ? (0,dist.$item)(outfit_templateObject40 || (outfit_templateObject40 = outfit_taggedTemplateLiteral(["Crown of Thrones"]))) : (0,dist.$item)(outfit_templateObject41 || (outfit_templateObject41 = outfit_taggedTemplateLiteral(["Buddy Bjorn"])))]),
    bonusEquip: new Map([].concat(outfit_toConsumableArray(dropsItems(equipMode)), outfit_toConsumableArray(embezzlerUp ? [] : pantsgiving()), outfit_toConsumableArray(cheeses(embezzlerUp)), [[bjornAlike, !bjornChoice.dropPredicate || bjornChoice.dropPredicate() ? bjornChoice.meatVal() * bjornChoice.probability : 0]])),
    preventSlot: (0,dist.$slots)(outfit_templateObject42 || (outfit_templateObject42 = outfit_taggedTemplateLiteral(["crown-of-thrones, buddy-bjorn"])))
  })]));
  (0,dist.maximizeCached)(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());

  if ((0,external_kolmafia_.equippedAmount)((0,dist.$item)(outfit_templateObject43 || (outfit_templateObject43 = outfit_taggedTemplateLiteral(["ice nine"])))) > 0) {
    (0,external_kolmafia_.equip)((0,dist.$item)(outfit_templateObject44 || (outfit_templateObject44 = outfit_taggedTemplateLiteral(["unwrapped knock-off retro superhero cape"]))));
  }

  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject45 || (outfit_templateObject45 = outfit_taggedTemplateLiteral(["Buddy Bjorn"]))))) (0,external_kolmafia_.bjornifyFamiliar)(bjornChoice.familiar);
  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject46 || (outfit_templateObject46 = outfit_taggedTemplateLiteral(["Crown of Thrones"]))))) (0,external_kolmafia_.enthroneFamiliar)(bjornChoice.familiar);
  if ((0,external_kolmafia_.haveEquipped)((0,dist.$item)(outfit_templateObject47 || (outfit_templateObject47 = outfit_taggedTemplateLiteral(["Snow Suit"])))) && (0,dist.get)("snowsuit") !== "nose") (0,external_kolmafia_.cliExecute)("snowsuit nose");

  if (sea) {
    if (!(0,external_kolmafia_.booleanModifier)("Adventure Underwater")) {
      var _iterator = outfit_createForOfIteratorHelper(waterBreathingEquipment),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var airSource = _step.value;

          if ((0,dist.have)(airSource)) {
            if (airSource === (0,dist.$item)(outfit_templateObject48 || (outfit_templateObject48 = outfit_taggedTemplateLiteral(["The Crown of Ed the Undying"])))) (0,external_kolmafia_.cliExecute)("edpiece fish");
            (0,external_kolmafia_.equip)(airSource);
            break;
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    }

    if (!(0,external_kolmafia_.booleanModifier)("Underwater Familiar")) {
      var _iterator2 = outfit_createForOfIteratorHelper(familiarWaterBreathingEquipment),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var _airSource = _step2.value;

          if ((0,dist.have)(_airSource)) {
            (0,external_kolmafia_.equip)(_airSource);
            break;
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }
  }
}
var waterBreathingEquipment = (0,dist.$items)(outfit_templateObject49 || (outfit_templateObject49 = outfit_taggedTemplateLiteral(["The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank"])));
var familiarWaterBreathingEquipment = (0,dist.$items)(outfit_templateObject50 || (outfit_templateObject50 = outfit_taggedTemplateLiteral(["das boot, little bitty bathysphere"])));

function pantsgiving() {
  if (!(0,dist.have)((0,dist.$item)(outfit_templateObject51 || (outfit_templateObject51 = outfit_taggedTemplateLiteral(["Pantsgiving"]))))) return new Map();
  var count = (0,dist.get)("_pantsgivingCount");
  var turnArray = [5, 50, 500, 5000];
  var index = (0,external_kolmafia_.myFullness)() === (0,external_kolmafia_.fullnessLimit)() ? (0,dist.get)("_pantsgivingFullness") : turnArray.findIndex(function (x) {
    return count < x;
  });
  var turns = turnArray[index] || 50000;
  if (turns - count > estimatedTurns()) return new Map();
  var sinusVal = 50 * 1.0 * baseMeat; //if we add mayozapine support, fiddle with this

  var fullnessValue = sinusVal + (0,dist.get)("valueOfAdventure") * 6.5 - ((0,external_kolmafia_.mallPrice)((0,dist.$item)(outfit_templateObject52 || (outfit_templateObject52 = outfit_taggedTemplateLiteral(["jumping horseradish"])))) + (0,external_kolmafia_.mallPrice)((0,dist.$item)(outfit_templateObject53 || (outfit_templateObject53 = outfit_taggedTemplateLiteral(["Special Seasoning"])))));
  return new Map([[(0,dist.$item)(outfit_templateObject54 || (outfit_templateObject54 = outfit_taggedTemplateLiteral(["Pantsgiving"]))), fullnessValue / (turns * 0.9)]]);
}

var haveSomeCheese = (0,dist.getFoldGroup)((0,dist.$item)(outfit_templateObject55 || (outfit_templateObject55 = outfit_taggedTemplateLiteral(["stinky cheese diaper"])))).some(function (item) {
  return (0,dist.have)(item);
});

function cheeses(embezzlerUp) {
  return haveSomeCheese && !globalOptions.ascending && (0,dist.get)("_stinkyCheeseCount") < 100 && estimatedTurns() >= 100 - (0,dist.get)("_stinkyCheeseCount") && !embezzlerUp ? new Map((0,dist.getFoldGroup)((0,dist.$item)(outfit_templateObject56 || (outfit_templateObject56 = outfit_taggedTemplateLiteral(["stinky cheese diaper"])))).map(function (item) {
    return [item, (0,dist.get)("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100)];
  })) : [];
}

function snowSuit(equipMode) {
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!(0,dist.have)((0,dist.$item)(outfit_templateObject57 || (outfit_templateObject57 = outfit_taggedTemplateLiteral(["Snow Suit"])))) || (0,dist.get)("_carrotNoseDrops") >= 3 || [BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].some(function (mode) {
    return mode === equipMode;
  })) return new Map([]);
  return new Map([[(0,dist.$item)(outfit_templateObject58 || (outfit_templateObject58 = outfit_taggedTemplateLiteral(["Snow Suit"]))), saleValue((0,dist.$item)(outfit_templateObject59 || (outfit_templateObject59 = outfit_taggedTemplateLiteral(["carrot nose"])))) / 10]]);
}

function mayflowerBouquet(equipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!(0,dist.have)((0,dist.$item)(outfit_templateObject60 || (outfit_templateObject60 = outfit_taggedTemplateLiteral(["Mayflower bouquet"])))) || [BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].some(function (mode) {
    return mode === equipMode;
  })) return new Map([]);
  var sporadicMeatBonus = 40 * 0.125 * (equipMode === BonusEquipMode.BARF ? baseMeat : 0) / 100;
  var averageFlowerValue = (saleValue((0,dist.$item)(outfit_templateObject61 || (outfit_templateObject61 = outfit_taggedTemplateLiteral(["tin magnolia"])))) + saleValue((0,dist.$item)(outfit_templateObject62 || (outfit_templateObject62 = outfit_taggedTemplateLiteral(["upsy daisy"])))) + saleValue((0,dist.$item)(outfit_templateObject63 || (outfit_templateObject63 = outfit_taggedTemplateLiteral(["lesser grodulated violet"])))) + saleValue((0,dist.$item)(outfit_templateObject64 || (outfit_templateObject64 = outfit_taggedTemplateLiteral(["half-orchid"])))) + saleValue((0,dist.$item)(outfit_templateObject65 || (outfit_templateObject65 = outfit_taggedTemplateLiteral(["begpwnia"])))) / 5) * Math.max(0.01, 0.5 - (0,dist.get)("_mayflowerDrops") * 0.11);
  return new Map([[(0,dist.$item)(outfit_templateObject66 || (outfit_templateObject66 = outfit_taggedTemplateLiteral(["Mayflower bouquet"]))), ((0,dist.get)("_mayflowerDrops") < 10 ? averageFlowerValue : 0) + sporadicMeatBonus]]);
}

function dropsItems(equipMode) {
  var isFree = [BonusEquipMode.FREE, BonusEquipMode.DMT].some(function (mode) {
    return mode === equipMode;
  });
  return new Map([[(0,dist.$item)(outfit_templateObject67 || (outfit_templateObject67 = outfit_taggedTemplateLiteral(["mafia thumb ring"]))), !isFree ? 300 : 0], [(0,dist.$item)(outfit_templateObject68 || (outfit_templateObject68 = outfit_taggedTemplateLiteral(["lucky gold ring"]))), 400], [(0,dist.$item)(outfit_templateObject69 || (outfit_templateObject69 = outfit_taggedTemplateLiteral(["Mr. Cheeng's spectacles"]))), 250], [(0,dist.$item)(outfit_templateObject70 || (outfit_templateObject70 = outfit_taggedTemplateLiteral(["pantogram pants"]))), (0,dist.get)("_pantogramModifier").includes("Drops Items") ? 100 : 0], [(0,dist.$item)(outfit_templateObject71 || (outfit_templateObject71 = outfit_taggedTemplateLiteral(["Mr. Screege's spectacles"]))), 180]].concat(outfit_toConsumableArray(snowSuit(equipMode)), outfit_toConsumableArray(mayflowerBouquet(equipMode))));
}
// EXTERNAL MODULE: ./node_modules/libram/dist/property.js
var property = __webpack_require__(1347);
;// CONCATENATED MODULE: ./src/fights.ts
var fights_templateObject, fights_templateObject2, fights_templateObject3, fights_templateObject4, fights_templateObject5, fights_templateObject6, fights_templateObject7, fights_templateObject8, fights_templateObject9, fights_templateObject10, fights_templateObject11, fights_templateObject12, fights_templateObject13, fights_templateObject14, fights_templateObject15, fights_templateObject16, fights_templateObject17, fights_templateObject18, fights_templateObject19, fights_templateObject20, fights_templateObject21, fights_templateObject22, fights_templateObject23, fights_templateObject24, fights_templateObject25, fights_templateObject26, fights_templateObject27, fights_templateObject28, fights_templateObject29, fights_templateObject30, fights_templateObject31, fights_templateObject32, fights_templateObject33, fights_templateObject34, fights_templateObject35, fights_templateObject36, fights_templateObject37, fights_templateObject38, fights_templateObject39, fights_templateObject40, fights_templateObject41, fights_templateObject42, fights_templateObject43, fights_templateObject44, fights_templateObject45, fights_templateObject46, fights_templateObject47, fights_templateObject48, fights_templateObject49, fights_templateObject50, fights_templateObject51, fights_templateObject52, fights_templateObject53, fights_templateObject54, fights_templateObject55, fights_templateObject56, fights_templateObject57, fights_templateObject58, fights_templateObject59, fights_templateObject60, fights_templateObject61, fights_templateObject62, fights_templateObject63, fights_templateObject64, fights_templateObject65, fights_templateObject66, fights_templateObject67, fights_templateObject68, fights_templateObject69, fights_templateObject70, fights_templateObject71, fights_templateObject72, fights_templateObject73, fights_templateObject74, fights_templateObject75, fights_templateObject76, fights_templateObject77, fights_templateObject78, fights_templateObject79, fights_templateObject80, fights_templateObject81, fights_templateObject82, fights_templateObject83, fights_templateObject84, fights_templateObject85, fights_templateObject86, fights_templateObject87, fights_templateObject88, fights_templateObject89, fights_templateObject90, fights_templateObject91, fights_templateObject92, fights_templateObject93, fights_templateObject94, fights_templateObject95, fights_templateObject96, fights_templateObject97, fights_templateObject98, fights_templateObject99, fights_templateObject100, fights_templateObject101, fights_templateObject102, _templateObject103, _templateObject104, _templateObject105, _templateObject106, _templateObject107, _templateObject108, _templateObject109, _templateObject110, _templateObject111, _templateObject112, _templateObject113, _templateObject114, _templateObject115, _templateObject116, _templateObject117, _templateObject118, _templateObject119, _templateObject120, _templateObject121, _templateObject122, _templateObject123, _templateObject124, _templateObject125, _templateObject126, _templateObject127, _templateObject128, _templateObject129, _templateObject130, _templateObject131, _templateObject132, _templateObject133, _templateObject134, _templateObject135, _templateObject136, _templateObject137, _templateObject138, _templateObject139, _templateObject140, _templateObject141, _templateObject142, _templateObject143, _templateObject144, _templateObject145, _templateObject146, _templateObject147, _templateObject148, _templateObject149, _templateObject150, _templateObject151, _templateObject152, _templateObject153, _templateObject154, _templateObject155, _templateObject156, _templateObject157, _templateObject158, _templateObject159, _templateObject160, _templateObject161, _templateObject162, _templateObject163, _templateObject164, _templateObject165, _templateObject166, _templateObject167, _templateObject168, _templateObject169, _templateObject170, _templateObject171, _templateObject172, _templateObject173, _templateObject174, _templateObject175, _templateObject176, _templateObject177, _templateObject178, _templateObject179, _templateObject180, _templateObject181, _templateObject182, _templateObject183, _templateObject184, _templateObject185, _templateObject186, _templateObject187, _templateObject188, _templateObject189, _templateObject190, _templateObject191, _templateObject192, _templateObject193, _templateObject194, _templateObject195, _templateObject196, _templateObject197, _templateObject198, _templateObject199, _templateObject200, _templateObject201, _templateObject202, _templateObject203, _templateObject204, _templateObject205, _templateObject206, _templateObject207, _templateObject208, _templateObject209, _templateObject210, _templateObject211, _templateObject212, _templateObject213, _templateObject214, _templateObject215, _templateObject216, _templateObject217, _templateObject218, _templateObject219, _templateObject220, _templateObject221, _templateObject222, _templateObject223, _templateObject224, _templateObject225, _templateObject226, _templateObject227, _templateObject228, _templateObject229, _templateObject230, _templateObject231, _templateObject232, _templateObject233, _templateObject234, _templateObject235, _templateObject236, _templateObject237, _templateObject238, _templateObject239, _templateObject240, _templateObject241, _templateObject242, _templateObject243, _templateObject244, _templateObject245, _templateObject246, _templateObject247, _templateObject248, _templateObject249, _templateObject250, _templateObject251, _templateObject252, _templateObject253, _templateObject254, _templateObject255, _templateObject256, _templateObject257, _templateObject258, _templateObject259, _templateObject260, _templateObject261, _templateObject262, _templateObject263, _templateObject264, _templateObject265, _templateObject266, _templateObject267, _templateObject268, _templateObject269, _templateObject270, _templateObject271, _templateObject272, _templateObject273, _templateObject274, _templateObject275, _templateObject276, _templateObject277, _templateObject278, _templateObject279, _templateObject280, _templateObject281, _templateObject282, _templateObject283, _templateObject284, _templateObject285, _templateObject286, _templateObject287, _templateObject288, _templateObject289, _templateObject290, _templateObject291, _templateObject292, _templateObject293, _templateObject294, _templateObject295, _templateObject296, _templateObject297, _templateObject298, _templateObject299, _templateObject300, _templateObject301, _templateObject302, _templateObject303;

function fights_defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function fights_createClass(Constructor, protoProps, staticProps) { if (protoProps) fights_defineProperties(Constructor.prototype, protoProps); if (staticProps) fights_defineProperties(Constructor, staticProps); return Constructor; }

function fights_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = fights_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function fights_toConsumableArray(arr) { return fights_arrayWithoutHoles(arr) || fights_iterableToArray(arr) || fights_unsupportedIterableToArray(arr) || fights_nonIterableSpread(); }

function fights_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function fights_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return fights_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return fights_arrayLikeToArray(o, minLen); }

function fights_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function fights_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return fights_arrayLikeToArray(arr); }

function fights_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function fights_classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function fights_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function fights_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }

















function checkFax() {
  if (!(0,dist.have)((0,dist.$item)(fights_templateObject || (fights_templateObject = fights_taggedTemplateLiteral(["photocopied monster"]))))) (0,external_kolmafia_.cliExecute)("fax receive");
  if ((0,property.getString)("photocopyMonster") === "Knob Goblin Embezzler") return true;
  (0,external_kolmafia_.cliExecute)("fax send");
  return false;
}

function faxEmbezzler() {
  if (!(0,dist.get)("_photocopyUsed")) {
    if (checkFax()) return;
    (0,external_kolmafia_.chatPrivate)("cheesefax", "Knob Goblin Embezzler");

    for (var i = 0; i < 3; i++) {
      (0,external_kolmafia_.wait)(10);
      if (checkFax()) return;
    }

    (0,external_kolmafia_.abort)("Failed to acquire photocopied Knob Goblin Embezzler.");
  }
}

var EmbezzlerFight = function EmbezzlerFight(name, available, potential, run) {
  var requirements = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : [];
  var draggable = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

  fights_classCallCheck(this, EmbezzlerFight);

  fights_defineProperty(this, "available", void 0);

  fights_defineProperty(this, "potential", void 0);

  fights_defineProperty(this, "run", void 0);

  fights_defineProperty(this, "requirements", void 0);

  fights_defineProperty(this, "draggable", void 0);

  fights_defineProperty(this, "name", void 0);

  this.name = name;
  this.available = available;
  this.potential = potential;
  this.run = run;
  this.requirements = requirements;
  this.draggable = draggable;
};

var firstChainMacro = function firstChainMacro() {
  return combat.Macro.if_("monstername Knob Goblin Embezzler", combat.Macro.if_("!hasskill Lecture on Relativity", combat.Macro.externalIf((0,dist.get)("_sourceTerminalDigitizeMonster") !== (0,dist.$monster)(fights_templateObject2 || (fights_templateObject2 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))), combat.Macro.tryCopier((0,dist.$skill)(fights_templateObject3 || (fights_templateObject3 = fights_taggedTemplateLiteral(["Digitize"]))))).tryCopier((0,dist.$item)(fights_templateObject4 || (fights_templateObject4 = fights_taggedTemplateLiteral(["Spooky Putty sheet"])))).tryCopier((0,dist.$item)(fights_templateObject5 || (fights_templateObject5 = fights_taggedTemplateLiteral(["Rain-Doh black box"])))).tryCopier((0,dist.$item)(fights_templateObject6 || (fights_templateObject6 = fights_taggedTemplateLiteral(["4-d camera"])))).tryCopier((0,dist.$item)(fights_templateObject7 || (fights_templateObject7 = fights_taggedTemplateLiteral(["unfinished ice sculpture"]))))).trySkill("Lecture on Relativity").meatKill()).abort();
};

var secondChainMacro = function secondChainMacro() {
  return combat.Macro.if_("monstername Knob Goblin Embezzler", combat.Macro.externalIf((0,external_kolmafia_.myFamiliar)() === (0,dist.$familiar)(fights_templateObject8 || (fights_templateObject8 = fights_taggedTemplateLiteral(["Pocket Professor"]))), combat.Macro.if_("!hasskill Lecture on Relativity", combat.Macro.trySkill("Meteor Shower")).if_("!hasskill Lecture on Relativity", combat.Macro.externalIf((0,dist.get)("_sourceTerminalDigitizeMonster") !== (0,dist.$monster)(fights_templateObject9 || (fights_templateObject9 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))), combat.Macro.tryCopier((0,dist.$skill)(fights_templateObject10 || (fights_templateObject10 = fights_taggedTemplateLiteral(["Digitize"]))))).tryCopier((0,dist.$item)(fights_templateObject11 || (fights_templateObject11 = fights_taggedTemplateLiteral(["Spooky Putty sheet"])))).tryCopier((0,dist.$item)(fights_templateObject12 || (fights_templateObject12 = fights_taggedTemplateLiteral(["Rain-Doh black box"])))).tryCopier((0,dist.$item)(fights_templateObject13 || (fights_templateObject13 = fights_taggedTemplateLiteral(["4-d camera"])))).tryCopier((0,dist.$item)(fights_templateObject14 || (fights_templateObject14 = fights_taggedTemplateLiteral(["unfinished ice sculpture"]))))).trySkill("Lecture on Relativity")).meatKill()).abort();
};

var embezzlerMacro = function embezzlerMacro() {
  return combat.Macro.if_("monstername Knob Goblin Embezzler", combat.Macro.if_("snarfblat 186", combat.Macro.tryCopier((0,dist.$item)(fights_templateObject15 || (fights_templateObject15 = fights_taggedTemplateLiteral(["pulled green taffy"]))))).trySkill("Wink At").trySkill("Fire a badly romantic arrow").externalIf((0,dist.get)("_sourceTerminalDigitizeMonster") !== (0,dist.$monster)(fights_templateObject16 || (fights_templateObject16 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))), combat.Macro.tryCopier((0,dist.$skill)(fights_templateObject17 || (fights_templateObject17 = fights_taggedTemplateLiteral(["Digitize"]))))).tryCopier((0,dist.$item)(fights_templateObject18 || (fights_templateObject18 = fights_taggedTemplateLiteral(["Spooky Putty sheet"])))).tryCopier((0,dist.$item)(fights_templateObject19 || (fights_templateObject19 = fights_taggedTemplateLiteral(["Rain-Doh black box"])))).tryCopier((0,dist.$item)(fights_templateObject20 || (fights_templateObject20 = fights_taggedTemplateLiteral(["4-d camera"])))).tryCopier((0,dist.$item)(fights_templateObject21 || (fights_templateObject21 = fights_taggedTemplateLiteral(["unfinished ice sculpture"])))).meatKill()).abort();
};

var embezzlerSources = [new EmbezzlerFight("Digitize", function () {
  return (0,dist.get)("_sourceTerminalDigitizeMonster") === (0,dist.$monster)(fights_templateObject22 || (fights_templateObject22 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && (0,external_kolmafia_.getCounters)("Digitize Monster", 0, 0).trim() !== "";
}, function () {
  return dist.SourceTerminal.have() && (0,dist.get)("_sourceTerminalDigitizeUses") === 0 ? 1 : 0;
}, function (options) {
  (0,external_kolmafia_.adv1)(options.location || (0,dist.$location)(fights_templateObject23 || (fights_templateObject23 = fights_taggedTemplateLiteral(["Noob Cave"]))));
}, [], true), new EmbezzlerFight("Backup", function () {
  return (0,dist.get)("lastCopyableMonster") === (0,dist.$monster)(fights_templateObject24 || (fights_templateObject24 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && (0,dist.have)((0,dist.$item)(fights_templateObject25 || (fights_templateObject25 = fights_taggedTemplateLiteral(["backup camera"])))) && (0,dist.get)("_backUpUses") < 11;
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject26 || (fights_templateObject26 = fights_taggedTemplateLiteral(["backup camera"])))) ? 11 - (0,dist.get)("_backUpUses") : 0;
}, function (options) {
  var realLocation = options.location && options.location.combatPercent >= 100 ? options.location : (0,dist.$location)(fights_templateObject27 || (fights_templateObject27 = fights_taggedTemplateLiteral(["Noob Cave"])));
  (0,dist.adventureMacro)(realLocation, combat.Macro.if_("!monstername Knob Goblin Embezzler", combat.Macro.skill("Back-Up to Your Last Enemy")).step(options.macro || embezzlerMacro()));
}, [new Requirement([], {
  forceEquip: (0,dist.$items)(fights_templateObject28 || (fights_templateObject28 = fights_taggedTemplateLiteral(["backup camera"]))),
  bonusEquip: new Map([[(0,dist.$item)(fights_templateObject29 || (fights_templateObject29 = fights_taggedTemplateLiteral(["backup camera"]))), 5000]])
})], true), new EmbezzlerFight("Fax", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject30 || (fights_templateObject30 = fights_taggedTemplateLiteral(["Clan VIP Lounge key"])))) && !(0,dist.get)("_photocopyUsed");
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject31 || (fights_templateObject31 = fights_taggedTemplateLiteral(["Clan VIP Lounge key"])))) && !(0,dist.get)("_photocopyUsed") ? 1 : 0;
}, function () {
  faxEmbezzler();
  (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject32 || (fights_templateObject32 = fights_taggedTemplateLiteral(["photocopied monster"]))));
}), new EmbezzlerFight("Pillkeeper Semirare", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject33 || (fights_templateObject33 = fights_taggedTemplateLiteral(["Eight Days a Week Pill Keeper"])))) && (0,external_canadv_ash_namespaceObject.canAdv)((0,dist.$location)(fights_templateObject34 || (fights_templateObject34 = fights_taggedTemplateLiteral(["Cobb's Knob Treasury"]))), true) && !(0,dist.get)("_freePillKeeperUsed");
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject35 || (fights_templateObject35 = fights_taggedTemplateLiteral(["Eight Days a Week Pill Keeper"])))) && (0,external_canadv_ash_namespaceObject.canAdv)((0,dist.$location)(fights_templateObject36 || (fights_templateObject36 = fights_taggedTemplateLiteral(["Cobb's Knob Treasury"]))), true) && !(0,dist.get)("_freePillKeeperUsed") ? 1 : 0;
}, function () {
  (0,external_kolmafia_.cliExecute)("pillkeeper semirare");
  (0,external_kolmafia_.adv1)((0,dist.$location)(fights_templateObject37 || (fights_templateObject37 = fights_taggedTemplateLiteral(["Cobb's Knob Treasury"]))));
}), new EmbezzlerFight("Chateau Painting", function () {
  return dist.ChateauMantegna.have() && !dist.ChateauMantegna.paintingFought() && dist.ChateauMantegna.paintingMonster() === (0,dist.$monster)(fights_templateObject38 || (fights_templateObject38 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"])));
}, function () {
  return dist.ChateauMantegna.have() && !dist.ChateauMantegna.paintingFought() && dist.ChateauMantegna.paintingMonster() === (0,dist.$monster)(fights_templateObject39 || (fights_templateObject39 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) ? 1 : 0;
}, function () {
  return dist.ChateauMantegna.fightPainting();
}), new EmbezzlerFight("Spooky Putty & Rain-Doh", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject40 || (fights_templateObject40 = fights_taggedTemplateLiteral(["Spooky Putty monster"])))) && (0,dist.get)("spookyPuttyMonster") === (0,dist.$monster)(fights_templateObject41 || (fights_templateObject41 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) || (0,dist.have)((0,dist.$item)(fights_templateObject42 || (fights_templateObject42 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"])))) && (0,dist.get)("rainDohMonster") === (0,dist.$monster)(fights_templateObject43 || (fights_templateObject43 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"])));
}, function () {
  if (((0,dist.have)((0,dist.$item)(fights_templateObject44 || (fights_templateObject44 = fights_taggedTemplateLiteral(["Spooky Putty sheet"])))) || (0,dist.have)((0,dist.$item)(fights_templateObject45 || (fights_templateObject45 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))))) && ((0,dist.have)((0,dist.$item)(fights_templateObject46 || (fights_templateObject46 = fights_taggedTemplateLiteral(["Rain-Doh black box"])))) || (0,dist.have)((0,dist.$item)(fights_templateObject47 || (fights_templateObject47 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"])))))) {
    return 6 - (0,dist.get)("spookyPuttyCopiesMade") - (0,dist.get)("_raindohCopiesMade") + (0,external_kolmafia_.itemAmount)((0,dist.$item)(fights_templateObject48 || (fights_templateObject48 = fights_taggedTemplateLiteral(["Spooky Putty monster"])))) + (0,external_kolmafia_.itemAmount)((0,dist.$item)(fights_templateObject49 || (fights_templateObject49 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"]))));
  } else if ((0,dist.have)((0,dist.$item)(fights_templateObject50 || (fights_templateObject50 = fights_taggedTemplateLiteral(["Spooky Putty sheet"])))) || (0,dist.have)((0,dist.$item)(fights_templateObject51 || (fights_templateObject51 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))))) {
    return 5 - (0,dist.get)("spookyPuttyCopiesMade") + (0,external_kolmafia_.itemAmount)((0,dist.$item)(fights_templateObject52 || (fights_templateObject52 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))));
  } else if ((0,dist.have)((0,dist.$item)(fights_templateObject53 || (fights_templateObject53 = fights_taggedTemplateLiteral(["Rain-Doh black box"])))) || (0,dist.have)((0,dist.$item)(fights_templateObject54 || (fights_templateObject54 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"]))))) {
    return 5 - (0,dist.get)("_raindohCopiesMade") + (0,external_kolmafia_.itemAmount)((0,dist.$item)(fights_templateObject55 || (fights_templateObject55 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"]))));
  }

  return 0;
}, function () {
  if ((0,dist.have)((0,dist.$item)(fights_templateObject56 || (fights_templateObject56 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))))) return (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject57 || (fights_templateObject57 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))));
  return (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject58 || (fights_templateObject58 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"]))));
}), new EmbezzlerFight("4-d Camera", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject59 || (fights_templateObject59 = fights_taggedTemplateLiteral(["shaking 4-d camera"])))) && (0,dist.get)("cameraMonster") === (0,dist.$monster)(fights_templateObject60 || (fights_templateObject60 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_cameraUsed");
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject61 || (fights_templateObject61 = fights_taggedTemplateLiteral(["shaking 4-d camera"])))) && (0,dist.get)("cameraMonster") === (0,dist.$monster)(fights_templateObject62 || (fights_templateObject62 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_cameraUsed") ? 1 : 0;
}, function () {
  return (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject63 || (fights_templateObject63 = fights_taggedTemplateLiteral(["shaking 4-d camera"]))));
}), new EmbezzlerFight("Ice Sculpture", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject64 || (fights_templateObject64 = fights_taggedTemplateLiteral(["ice sculpture"])))) && (0,dist.get)("iceSculptureMonster") === (0,dist.$monster)(fights_templateObject65 || (fights_templateObject65 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_iceSculptureUsed");
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject66 || (fights_templateObject66 = fights_taggedTemplateLiteral(["ice sculpture"])))) && (0,dist.get)("iceSculptureMonster") === (0,dist.$monster)(fights_templateObject67 || (fights_templateObject67 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_iceSculptureUsed") ? 1 : 0;
}, function () {
  return (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject68 || (fights_templateObject68 = fights_taggedTemplateLiteral(["ice sculpture"]))));
}), new EmbezzlerFight("Green Taffy", function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject69 || (fights_templateObject69 = fights_taggedTemplateLiteral(["envyfish egg"])))) && (0,dist.get)("envyfishMonster") === (0,dist.$monster)(fights_templateObject70 || (fights_templateObject70 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_envyfishEggUsed");
}, function () {
  return (0,dist.have)((0,dist.$item)(fights_templateObject71 || (fights_templateObject71 = fights_taggedTemplateLiteral(["envyfish egg"])))) && (0,dist.get)("envyfishMonster") === (0,dist.$monster)(fights_templateObject72 || (fights_templateObject72 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && !(0,dist.get)("_envyfishEggUsed") ? 1 : 0;
}, function () {
  return (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject73 || (fights_templateObject73 = fights_taggedTemplateLiteral(["envyfish egg"]))));
}), new EmbezzlerFight("Professor MeatChain", function () {
  return false;
}, function () {
  return (0,dist.have)((0,dist.$familiar)(fights_templateObject74 || (fights_templateObject74 = fights_taggedTemplateLiteral(["Pocket Professor"])))) && !(0,dist.get)("_garbo_meatChain", false) ? 10 : 0;
}, function () {
  return;
}), new EmbezzlerFight("Professor WeightChain", function () {
  return false;
}, function () {
  return (0,dist.have)((0,dist.$familiar)(fights_templateObject75 || (fights_templateObject75 = fights_taggedTemplateLiteral(["Pocket Professor"])))) && !(0,dist.get)("_garbo_weightChain", false) ? 5 : 0;
}, function () {
  return;
})];
function embezzlerCount() {
  return sum(embezzlerSources.map(function (source) {
    return source.potential();
  }));
}

function embezzlerSetup() {
  meatMood(true, true).execute(estimatedTurns());
  safeRestore();
  if ((0,external_kolmafia_.mySpleenUse)() < (0,external_kolmafia_.spleenLimit)()) ensureEffect((0,dist.$effect)(fights_templateObject76 || (fights_templateObject76 = fights_taggedTemplateLiteral(["Eau d' Clochard"]))));

  if ((0,external_kolmafia_.mySpleenUse)() < (0,external_kolmafia_.spleenLimit)() && (0,dist.have)((0,dist.$item)(fights_templateObject77 || (fights_templateObject77 = fights_taggedTemplateLiteral(["body spradium"]))))) {
    ensureEffect((0,dist.$effect)(fights_templateObject78 || (fights_templateObject78 = fights_taggedTemplateLiteral(["Boxing Day Glow"]))));
  }

  freeFightMood().execute(50);
  withStash((0,dist.$items)(fights_templateObject79 || (fights_templateObject79 = fights_taggedTemplateLiteral(["Platinum Yendorian Express Card"]))), function () {
    if ((0,dist.have)((0,dist.$item)(fights_templateObject80 || (fights_templateObject80 = fights_taggedTemplateLiteral(["Platinum Yendorian Express Card"]))))) {
      (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject81 || (fights_templateObject81 = fights_taggedTemplateLiteral(["Platinum Yendorian Express Card"]))));
    }
  });
  if ((0,dist.have)((0,dist.$item)(fights_templateObject82 || (fights_templateObject82 = fights_taggedTemplateLiteral(["License to Chill"])))) && !(0,dist.get)("_licenseToChillUsed")) (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject83 || (fights_templateObject83 = fights_taggedTemplateLiteral(["License to Chill"]))));

  if (globalOptions.ascending && questStep("questM16Temple") > 0 && (0,dist.get)("lastTempleAdventures") < (0,external_kolmafia_.myAscensions)() && acquire(1, (0,dist.$item)(fights_templateObject84 || (fights_templateObject84 = fights_taggedTemplateLiteral(["stone wool"]))), 3 * (0,dist.get)("valueOfAdventure") + 100, false) > 0) {
    ensureEffect((0,dist.$effect)(fights_templateObject85 || (fights_templateObject85 = fights_taggedTemplateLiteral(["Stone-Faced"]))));
    setChoice(582, 1);
    setChoice(579, 3);

    while ((0,dist.get)("lastTempleAdventures") < (0,external_kolmafia_.myAscensions)()) {
      var runSource = findRun() || new FreeRun("LTB", function () {
        return (0,external_kolmafia_.retrieveItem)((0,dist.$item)(fights_templateObject86 || (fights_templateObject86 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))));
      }, combat.Macro.item("Louder Than Bomb"), new Requirement([], {}), function () {
        return (0,external_kolmafia_.retrieveItem)((0,dist.$item)(fights_templateObject87 || (fights_templateObject87 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))));
      });

      if (runSource) {
        if (runSource.prepare) runSource.prepare();
        freeFightOutfit(fights_toConsumableArray(runSource.requirement ? [runSource.requirement] : []));
        (0,dist.adventureMacro)((0,dist.$location)(fights_templateObject88 || (fights_templateObject88 = fights_taggedTemplateLiteral(["The Hidden Temple"]))), runSource.macro);
      } else {
        break;
      }
    }
  }

  bathroomFinance(embezzlerCount());
  var averageEmbezzlerNet = (baseMeat + 750) * (0,external_kolmafia_.meatDropModifier)() / 100;
  var averageTouristNet = baseMeat * (0,external_kolmafia_.meatDropModifier)() / 100;
  if (dist.SourceTerminal.have()) dist.SourceTerminal.educate([(0,dist.$skill)(fights_templateObject89 || (fights_templateObject89 = fights_taggedTemplateLiteral(["Extract"]))), (0,dist.$skill)(fights_templateObject90 || (fights_templateObject90 = fights_taggedTemplateLiteral(["Digitize"])))]);

  if (!(0,dist.get)("_cameraUsed") && !(0,dist.have)((0,dist.$item)(fights_templateObject91 || (fights_templateObject91 = fights_taggedTemplateLiteral(["shaking 4-d camera"])))) && averageEmbezzlerNet - averageTouristNet > (0,external_kolmafia_.mallPrice)((0,dist.$item)(fights_templateObject92 || (fights_templateObject92 = fights_taggedTemplateLiteral(["4-d camera"]))))) {
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(fights_templateObject93 || (fights_templateObject93 = fights_taggedTemplateLiteral(["4-d camera"]))));
  }

  if (!(0,dist.get)("_iceSculptureUsed") && !(0,dist.have)((0,dist.$item)(fights_templateObject94 || (fights_templateObject94 = fights_taggedTemplateLiteral(["ice sculpture"])))) && averageEmbezzlerNet - averageTouristNet > (0,external_kolmafia_.mallPrice)((0,dist.$item)(fights_templateObject95 || (fights_templateObject95 = fights_taggedTemplateLiteral(["snow berries"])))) + (0,external_kolmafia_.mallPrice)((0,dist.$item)(fights_templateObject96 || (fights_templateObject96 = fights_taggedTemplateLiteral(["ice harvest"])))) * 3) {
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(fights_templateObject97 || (fights_templateObject97 = fights_taggedTemplateLiteral(["unfinished ice sculpture"]))));
  } // Fix invalid copiers (caused by ascending or combat text-effects)


  if ((0,dist.have)((0,dist.$item)(fights_templateObject98 || (fights_templateObject98 = fights_taggedTemplateLiteral(["Spooky Putty monster"])))) && !(0,dist.get)("spookyPuttyMonster")) {
    // Visit the description to update the monster as it may be valid but not tracked correctly
    (0,external_kolmafia_.visitUrl)("desc_item.php?whichitem=".concat((0,dist.$item)(fights_templateObject99 || (fights_templateObject99 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))).descid), false, false);

    if (!(0,dist.get)("spookyPuttyMonster")) {
      // Still invalid, use it to turn back into the spooky putty sheet
      (0,external_kolmafia_.use)((0,dist.$item)(fights_templateObject100 || (fights_templateObject100 = fights_taggedTemplateLiteral(["Spooky Putty monster"]))));
    }
  }

  if ((0,dist.have)((0,dist.$item)(fights_templateObject101 || (fights_templateObject101 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"])))) && !(0,dist.get)("rainDohMonster")) {
    (0,external_kolmafia_.visitUrl)("desc_item.php?whichitem=".concat((0,dist.$item)(fights_templateObject102 || (fights_templateObject102 = fights_taggedTemplateLiteral(["Rain-Doh box full of monster"]))).descid), false, false);
  }

  if ((0,dist.have)((0,dist.$item)(_templateObject103 || (_templateObject103 = fights_taggedTemplateLiteral(["shaking 4-d camera"])))) && !(0,dist.get)("cameraMonster")) {
    (0,external_kolmafia_.visitUrl)("desc_item.php?whichitem=".concat((0,dist.$item)(_templateObject104 || (_templateObject104 = fights_taggedTemplateLiteral(["shaking 4-d camera"]))).descid), false, false);
  }

  if ((0,dist.have)((0,dist.$item)(_templateObject105 || (_templateObject105 = fights_taggedTemplateLiteral(["envyfish egg"])))) && !(0,dist.get)("envyfishMonster")) {
    (0,external_kolmafia_.visitUrl)("desc_item.php?whichitem=".concat((0,dist.$item)(_templateObject106 || (_templateObject106 = fights_taggedTemplateLiteral(["envyfish egg"]))).descid), false, false);
  }

  if ((0,dist.have)((0,dist.$item)(_templateObject107 || (_templateObject107 = fights_taggedTemplateLiteral(["ice sculpture"])))) && !(0,dist.get)("iceSculptureMonster")) {
    (0,external_kolmafia_.visitUrl)("desc_item.php?whichitem=".concat((0,dist.$item)(_templateObject108 || (_templateObject108 = fights_taggedTemplateLiteral(["ice sculpture"]))).descid), false, false);
  }
}

function getEmbezzlerFight() {
  var _iterator = fights_createForOfIteratorHelper(embezzlerSources),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var fight = _step.value;
      if (fight.available()) return fight;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  var potential = embezzlerCount();

  if (potential > 0 && (0,dist.get)("_genieFightsUsed") < 3 && (0,external_kolmafia_.userConfirm)("Garbo has detected you have ".concat(potential, " potential ways to copy an Embezzler, but no way to start a fight with one. Should we wish for an Embezzler?"))) {
    return new EmbezzlerFight("Pocket Wish", function () {
      return false;
    }, function () {
      return 0;
    }, function () {
      (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject109 || (_templateObject109 = fights_taggedTemplateLiteral(["pocket wish"]))));
      (0,external_kolmafia_.visitUrl)("inv_use.php?pwd=".concat((0,external_kolmafia_.myHash)(), "&which=3&whichitem=9537"), false, true);
      (0,external_kolmafia_.visitUrl)("choice.php?pwd&whichchoice=1267&option=1&wish=to fight a Knob Goblin Embezzler ", true, true);
      (0,external_kolmafia_.visitUrl)("main.php", false);
      (0,external_kolmafia_.runCombat)();
    });
  }

  return null;
}

function startDigitize() {
  if ((0,external_kolmafia_.getCounters)("Digitize Monster", 0, 100).trim() === "" && (0,dist.get)("_sourceTerminalDigitizeUses") !== 0) {
    do {
      var run = findRun() || new FreeRun("LTB", function () {
        return (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject111 || (_templateObject111 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))));
      }, combat.Macro.item("Louder Than Bomb"), new Requirement([], {}), function () {
        return (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject112 || (_templateObject112 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))));
      });
      if (run.prepare) run.prepare();
      freeFightOutfit(fights_toConsumableArray(run.requirement ? [run.requirement] : []));
      (0,dist.adventureMacro)((0,dist.$location)(_templateObject113 || (_templateObject113 = fights_taggedTemplateLiteral(["Noob Cave"]))), run.macro);
    } while ((0,dist.get)("lastCopyableMonster") === (0,dist.$monster)(_templateObject110 || (_templateObject110 = fights_taggedTemplateLiteral(["Government agent"]))));
  }
}

var witchessPieces = [{
  piece: (0,dist.$monster)(_templateObject114 || (_templateObject114 = fights_taggedTemplateLiteral(["Witchess Bishop"]))),
  drop: (0,dist.$item)(_templateObject115 || (_templateObject115 = fights_taggedTemplateLiteral(["Sacramento wine"])))
}, {
  piece: (0,dist.$monster)(_templateObject116 || (_templateObject116 = fights_taggedTemplateLiteral(["Witchess Knight"]))),
  drop: (0,dist.$item)(_templateObject117 || (_templateObject117 = fights_taggedTemplateLiteral(["jumping horseradish"])))
}, {
  piece: (0,dist.$monster)(_templateObject118 || (_templateObject118 = fights_taggedTemplateLiteral(["Witchess Pawn"]))),
  drop: (0,dist.$item)(_templateObject119 || (_templateObject119 = fights_taggedTemplateLiteral(["armored prawn"])))
}, {
  piece: (0,dist.$monster)(_templateObject120 || (_templateObject120 = fights_taggedTemplateLiteral(["Witchess Rook"]))),
  drop: (0,dist.$item)(_templateObject121 || (_templateObject121 = fights_taggedTemplateLiteral(["Greek fire"])))
}];

function bestWitchessPiece() {
  return witchessPieces.sort(function (a, b) {
    return saleValue(b.drop) - saleValue(a.drop);
  })[0].piece;
}

function dailyFights() {
  if ((0,external_kolmafia_.myInebriety)() > (0,external_kolmafia_.inebrietyLimit)()) return;

  if (embezzlerSources.some(function (source) {
    return source.potential();
  })) {
    withStash((0,dist.$items)(_templateObject122 || (_templateObject122 = fights_taggedTemplateLiteral(["Spooky Putty sheet"]))), function () {
      embezzlerSetup(); // FIRST EMBEZZLER CHAIN

      if ((0,dist.have)((0,dist.$familiar)(_templateObject123 || (_templateObject123 = fights_taggedTemplateLiteral(["Pocket Professor"])))) && !(0,dist.get)("_garbo_meatChain", false)) {
        var startLectures = (0,dist.get)("_pocketProfessorLectures");
        var fightSource = getEmbezzlerFight();
        if (!fightSource) return;
        (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject124 || (_templateObject124 = fights_taggedTemplateLiteral(["Pocket Professor"]))));
        meatOutfit(true, [].concat(fights_toConsumableArray(fightSource.requirements), [new Requirement([], {
          forceEquip: (0,dist.$items)(_templateObject125 || (_templateObject125 = fights_taggedTemplateLiteral(["Pocket Professor memory chip"])))
        })]));

        if ((0,dist.get)("_pocketProfessorLectures") < 2 + Math.ceil(Math.sqrt((0,external_kolmafia_.familiarWeight)((0,external_kolmafia_.myFamiliar)()) + (0,external_kolmafia_.weightAdjustment)()))) {
          (0,combat.withMacro)(firstChainMacro(), function () {
            return fightSource.run({
              location: prepWandererZone(),
              macro: firstChainMacro()
            });
          });
          log.initialEmbezzlersFought += 1 + (0,dist.get)("_pocketProfessorLectures") - startLectures;
        }

        (0,dist.set)("_garbo_meatChain", true);
      }

      startDigitize(); // SECOND EMBEZZLER CHAIN

      if ((0,dist.have)((0,dist.$familiar)(_templateObject126 || (_templateObject126 = fights_taggedTemplateLiteral(["Pocket Professor"])))) && !(0,dist.get)("_garbo_weightChain", false)) {
        var _startLectures = (0,dist.get)("_pocketProfessorLectures");

        var _fightSource = getEmbezzlerFight();

        if (!_fightSource) return;
        (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject127 || (_templateObject127 = fights_taggedTemplateLiteral(["Pocket Professor"]))));
        var requirements = Requirement.merge([new Requirement(["Familiar Weight"], {
          forceEquip: (0,dist.$items)(_templateObject128 || (_templateObject128 = fights_taggedTemplateLiteral(["Pocket Professor memory chip"])))
        })].concat(fights_toConsumableArray(_fightSource.requirements)));
        (0,dist.maximizeCached)(requirements.maximizeParameters(), requirements.maximizeOptions());

        if ((0,dist.get)("_pocketProfessorLectures") < 2 + Math.ceil(Math.sqrt((0,external_kolmafia_.familiarWeight)((0,external_kolmafia_.myFamiliar)()) + (0,external_kolmafia_.weightAdjustment)()))) {
          (0,combat.withMacro)(secondChainMacro(), function () {
            return _fightSource.run({
              location: prepWandererZone(),
              macro: secondChainMacro()
            });
          });
          log.initialEmbezzlersFought += 1 + (0,dist.get)("_pocketProfessorLectures") - _startLectures;
        }

        (0,dist.set)("_garbo_weightChain", true);
      }

      startDigitize(); // REMAINING EMBEZZLER FIGHTS

      var nextFight = getEmbezzlerFight();

      while (nextFight !== null) {
        var startTurns = (0,external_kolmafia_.totalTurnsPlayed)();
        if ((0,dist.have)((0,dist.$skill)(_templateObject129 || (_templateObject129 = fights_taggedTemplateLiteral(["Musk of the Moose"])))) && !(0,dist.have)((0,dist.$effect)(_templateObject130 || (_templateObject130 = fights_taggedTemplateLiteral(["Musk of the Moose"]))))) (0,external_kolmafia_.useSkill)((0,dist.$skill)(_templateObject131 || (_templateObject131 = fights_taggedTemplateLiteral(["Musk of the Moose"]))));
        (0,combat.withMacro)(embezzlerMacro(), function () {
          if (nextFight) {
            (0,external_kolmafia_.useFamiliar)(meatFamiliar());

            if (((0,dist.have)((0,dist.$familiar)(_templateObject132 || (_templateObject132 = fights_taggedTemplateLiteral(["Reanimated Reanimator"])))) || (0,dist.have)((0,dist.$familiar)(_templateObject133 || (_templateObject133 = fights_taggedTemplateLiteral(["Obtuse Angel"]))))) && (0,dist.get)("_badlyRomanticArrows") === 0 && !nextFight.draggable) {
              if ((0,dist.have)((0,dist.$familiar)(_templateObject134 || (_templateObject134 = fights_taggedTemplateLiteral(["Obtuse Angel"]))))) (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject135 || (_templateObject135 = fights_taggedTemplateLiteral(["Obtuse Angel"]))));else (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject136 || (_templateObject136 = fights_taggedTemplateLiteral(["Reanimated Reanimator"]))));
            }

            if (nextFight.draggable && !(0,dist.get)("_envyfishEggUsed") && ((0,external_kolmafia_.booleanModifier)("Adventure Underwater") || waterBreathingEquipment.some(dist.have)) && ((0,external_kolmafia_.booleanModifier)("Underwater Familiar") || familiarWaterBreathingEquipment.some(dist.have)) && ((0,dist.have)((0,dist.$effect)(_templateObject137 || (_templateObject137 = fights_taggedTemplateLiteral(["Fishy"])))) || (0,dist.have)((0,dist.$item)(_templateObject138 || (_templateObject138 = fights_taggedTemplateLiteral(["fishy pipe"])))) && !(0,dist.get)("_fishyPipeUsed")) && !(0,dist.have)((0,dist.$item)(_templateObject139 || (_templateObject139 = fights_taggedTemplateLiteral(["envyfish egg"]))))) {
              (0,external_kolmafia_.setLocation)((0,dist.$location)(_templateObject140 || (_templateObject140 = fights_taggedTemplateLiteral(["The Briny Deeps"]))));
              meatOutfit(true, nextFight.requirements, true);

              if ((0,dist.get)("questS01OldGuy") === "unstarted") {
                (0,external_kolmafia_.visitUrl)("place.php?whichplace=sea_oldman&action=oldman_oldman");
              }

              (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject141 || (_templateObject141 = fights_taggedTemplateLiteral(["pulled green taffy"]))));
              if (!(0,dist.have)((0,dist.$effect)(_templateObject142 || (_templateObject142 = fights_taggedTemplateLiteral(["Fishy"]))))) (0,external_kolmafia_.use)((0,dist.$item)(_templateObject143 || (_templateObject143 = fights_taggedTemplateLiteral(["fishy pipe"]))));
              nextFight.run({
                location: (0,dist.$location)(_templateObject144 || (_templateObject144 = fights_taggedTemplateLiteral(["The Briny Deeps"])))
              });
            } else if (nextFight.draggable) {
              var location = prepWandererZone();
              (0,external_kolmafia_.setLocation)(location);
              meatOutfit(true, nextFight.requirements);
              nextFight.run({
                location: location
              });
            } else {
              (0,external_kolmafia_.setLocation)((0,dist.$location)(_templateObject145 || (_templateObject145 = fights_taggedTemplateLiteral(["Noob Cave"]))));
              meatOutfit(true, nextFight.requirements);
              nextFight.run({
                location: (0,dist.$location)(_templateObject146 || (_templateObject146 = fights_taggedTemplateLiteral(["Noob Cave"])))
              });
            }
          }
        });

        if ((0,external_kolmafia_.totalTurnsPlayed)() - startTurns === 1 && (0,dist.get)("lastCopyableMonster") === (0,dist.$monster)(_templateObject147 || (_templateObject147 = fights_taggedTemplateLiteral(["Knob Goblin Embezzler"]))) && (nextFight.name === "Backup" || (0,dist.get)("lastEncounter") === "Knob Goblin Embezzler")) {
          log.initialEmbezzlersFought++;
        }

        startDigitize();
        nextFight = getEmbezzlerFight();

        if (kramcoGuaranteed() && (!nextFight || nextFight.name !== "Backup" && nextFight.name !== "Digitize")) {
          doSausage();
        }
      }
    });
  }
}
var bestNonCheerleaderFairy;

function bestFairy() {
  if ((0,dist.have)((0,dist.$familiar)(_templateObject148 || (_templateObject148 = fights_taggedTemplateLiteral(["Trick-or-Treating Tot"])))) && (0,dist.have)((0,dist.$item)(_templateObject149 || (_templateObject149 = fights_taggedTemplateLiteral(["li'l ninja costume"]))))) return (0,dist.$familiar)(_templateObject150 || (_templateObject150 = fights_taggedTemplateLiteral(["Trick-or-Treating Tot"])));
  if ((0,dist.get)("_cheerleaderSteam") > 100 && (0,dist.have)((0,dist.$familiar)(_templateObject151 || (_templateObject151 = fights_taggedTemplateLiteral(["Steam-Powered Cheerleader"]))))) return (0,dist.$familiar)(_templateObject152 || (_templateObject152 = fights_taggedTemplateLiteral(["Steam-Powered Cheerleader"])));

  if (!bestNonCheerleaderFairy) {
    (0,external_kolmafia_.setLocation)((0,dist.$location)(_templateObject153 || (_templateObject153 = fights_taggedTemplateLiteral(["Noob Cave"]))));
    var bestNonCheerleaderFairies = Familiar.all().filter(function (familiar) {
      return (0,dist.have)(familiar) && familiar !== (0,dist.$familiar)(_templateObject154 || (_templateObject154 = fights_taggedTemplateLiteral(["Steam-Powered Cheerleader"])));
    }).sort(function (a, b) {
      return (0,external_kolmafia_.numericModifier)(b, "Fairy", 1, (0,dist.$item)(_templateObject155 || (_templateObject155 = fights_taggedTemplateLiteral(["none"])))) - (0,external_kolmafia_.numericModifier)(a, "Fairy", 1, (0,dist.$item)(_templateObject156 || (_templateObject156 = fights_taggedTemplateLiteral(["none"]))));
    });
    var bestFairyMult = (0,external_kolmafia_.numericModifier)(bestNonCheerleaderFairies[0], "Fairy", 1, (0,dist.$item)(_templateObject157 || (_templateObject157 = fights_taggedTemplateLiteral(["none"]))));
    bestNonCheerleaderFairy = bestNonCheerleaderFairies.filter(function (fairy) {
      return (0,external_kolmafia_.numericModifier)(fairy, "Fairy", 1, (0,dist.$item)(_templateObject158 || (_templateObject158 = fights_taggedTemplateLiteral(["none"])))) === bestFairyMult;
    }).sort(function (a, b) {
      return (0,external_kolmafia_.numericModifier)(b, "Leprechaun", 1, (0,dist.$item)(_templateObject159 || (_templateObject159 = fights_taggedTemplateLiteral(["none"])))) - (0,external_kolmafia_.numericModifier)(a, "Leprechaun", 1, (0,dist.$item)(_templateObject160 || (_templateObject160 = fights_taggedTemplateLiteral(["none"]))));
    })[0];
  }

  return bestNonCheerleaderFairy;
}

var FreeFight = /*#__PURE__*/function () {
  function FreeFight(available, run) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    fights_classCallCheck(this, FreeFight);

    fights_defineProperty(this, "available", void 0);

    fights_defineProperty(this, "run", void 0);

    fights_defineProperty(this, "options", void 0);

    this.available = available;
    this.run = run;
    this.options = options;
  }

  fights_createClass(FreeFight, [{
    key: "runAll",
    value: function runAll() {
      if (!this.available()) return; // FIXME: make a better decision here.

      if ((this.options.cost ? this.options.cost() : 0) > 2000) return;

      while (this.available()) {
        var _this$options$familia;

        (0,external_kolmafia_.useFamiliar)(this.options.familiar ? (_this$options$familia = this.options.familiar()) !== null && _this$options$familia !== void 0 ? _this$options$familia : freeFightFamiliar() : freeFightFamiliar());
        freeFightMood().execute();
        freeFightOutfit(this.options.requirements ? this.options.requirements() : []);
        safeRestore();
        (0,combat.withMacro)(combat.Macro.meatKill(), this.run);
        horseradish(); // Slot in our Professor Thesis if it's become available

        if (thesisReady()) deliverThesis();
      }
    }
  }]);

  return FreeFight;
}();

var pygmyMacro = combat.Macro.if_("monstername pygmy bowler", combat.Macro.trySkill("Snokebomb").item((0,dist.$item)(_templateObject161 || (_templateObject161 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))))).if_("monstername pygmy orderlies", combat.Macro.trySkill("Feel Hatred").item((0,dist.$item)(_templateObject162 || (_templateObject162 = fights_taggedTemplateLiteral(["divine champagne popper"]))))).if_("monstername pygmy janitor", combat.Macro.item((0,dist.$item)(_templateObject163 || (_templateObject163 = fights_taggedTemplateLiteral(["tennis ball"]))))).if_("monstername time-spinner prank", combat.Macro.meatKill()).abort();
var freeFightSources = [// Get a Fish Head from our robortender if available
new FreeFight(function () {
  return (0,dist.have)((0,dist.$item)(_templateObject164 || (_templateObject164 = fights_taggedTemplateLiteral(["Cargo Cultist Shorts"])))) && (0,dist.have)((0,dist.$familiar)(_templateObject165 || (_templateObject165 = fights_taggedTemplateLiteral(["Robortender"])))) && !(0,dist.get)("_cargoPocketEmptied") && String((0,dist.get)("cargoPocketsEmptied", "")).indexOf("428") === -1;
}, function () {
  return (0,external_kolmafia_.cliExecute)("cargo monster Mob Penguin Thug");
}, {
  familiar: function familiar() {
    return (0,dist.$familiar)(_templateObject166 || (_templateObject166 = fights_taggedTemplateLiteral(["Robortender"])));
  }
}), new FreeFight(function () {
  return dist.TunnelOfLove.have() && !dist.TunnelOfLove.isUsed();
}, function () {
  dist.TunnelOfLove.fightAll("LOV Epaulettes", "Open Heart Surgery", "LOV Extraterrestrial Chocolate");
  (0,external_kolmafia_.visitUrl)("choice.php");
  if ((0,external_kolmafia_.handlingChoice)()) throw "Did not get all the way through LOV.";
}), new FreeFight(function () {
  var _ChateauMantegna$pain, _ChateauMantegna$pain2, _ChateauMantegna$pain3;

  return dist.ChateauMantegna.have() && !dist.ChateauMantegna.paintingFought() && ((_ChateauMantegna$pain = (_ChateauMantegna$pain2 = dist.ChateauMantegna.paintingMonster()) === null || _ChateauMantegna$pain2 === void 0 ? void 0 : (_ChateauMantegna$pain3 = _ChateauMantegna$pain2.attributes) === null || _ChateauMantegna$pain3 === void 0 ? void 0 : _ChateauMantegna$pain3.includes("FREE")) !== null && _ChateauMantegna$pain !== void 0 ? _ChateauMantegna$pain : false);
}, function () {
  return dist.ChateauMantegna.fightPainting();
}), new FreeFight(function () {
  return (0,dist.get)("questL02Larva") !== "unstarted" && !(0,dist.get)("_eldritchTentacleFought");
}, function () {
  var haveEldritchEssence = (0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject167 || (_templateObject167 = fights_taggedTemplateLiteral(["eldritch essence"])))) !== 0;
  (0,external_kolmafia_.visitUrl)("place.php?whichplace=forestvillage&action=fv_scientist", false);
  if (!(0,external_kolmafia_.handlingChoice)()) throw "No choice?";
  (0,external_kolmafia_.runChoice)(haveEldritchEssence ? 2 : 1);
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$skill)(_templateObject168 || (_templateObject168 = fights_taggedTemplateLiteral(["Evoke Eldritch Horror"])))) && !(0,dist.get)("_eldritchHorrorEvoked");
}, function () {
  return (0,external_kolmafia_.useSkill)((0,dist.$skill)(_templateObject169 || (_templateObject169 = fights_taggedTemplateLiteral(["Evoke Eldritch Horror"]))));
}), new FreeFight(function () {
  return clamp(3 - (0,dist.get)("_lynyrdSnareUses"), 0, 3);
}, function () {
  return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject170 || (_templateObject170 = fights_taggedTemplateLiteral(["lynyrd snare"]))));
}, {
  cost: function cost() {
    return (0,external_kolmafia_.mallPrice)((0,dist.$item)(_templateObject171 || (_templateObject171 = fights_taggedTemplateLiteral(["lynyrd snare"]))));
  }
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$item)(_templateObject172 || (_templateObject172 = fights_taggedTemplateLiteral(["[glitch season reward name]"])))) && !(0,dist.get)("_glitchMonsterFights");
}, function () {
  (0,external_kolmafia_.visitUrl)("inv_eat.php?pwd&whichitem=10207");
  (0,external_kolmafia_.runCombat)();
}), // 6	10	0	0	Infernal Seals	variety of items; must be Seal Clubber for 5, must also have Claw of the Infernal Seal in inventory for 10.
new FreeFight(function () {
  var maxSeals = (0,external_kolmafia_.retrieveItem)(1, (0,dist.$item)(_templateObject173 || (_templateObject173 = fights_taggedTemplateLiteral(["Claw of the Infernal Seal"])))) ? 10 : 5;
  var maxSealsAvailable = (0,dist.get)("lastGuildStoreOpen") === (0,external_kolmafia_.myAscensions)() ? maxSeals : Math.min(maxSeals, Math.floor((0,external_kolmafia_.availableAmount)((0,dist.$item)(_templateObject174 || (_templateObject174 = fights_taggedTemplateLiteral(["seal-blubber candle"])))) / 3));
  return (0,external_kolmafia_.myClass)() === (0,dist.$class)(_templateObject175 || (_templateObject175 = fights_taggedTemplateLiteral(["Seal Clubber"]))) ? Math.max(maxSealsAvailable - (0,dist.get)("_sealsSummoned"), 0) : 0;
}, function () {
  var figurine = (0,dist.get)("lastGuildStoreOpen") === (0,external_kolmafia_.myAscensions)() ? (0,dist.$item)(_templateObject176 || (_templateObject176 = fights_taggedTemplateLiteral(["figurine of a wretched-looking seal"]))) : (0,dist.$item)(_templateObject177 || (_templateObject177 = fights_taggedTemplateLiteral(["figurine of an ancient seal"])));
  (0,external_kolmafia_.retrieveItem)(1, figurine);
  (0,external_kolmafia_.retrieveItem)((0,dist.get)("lastGuildStoreOpen") === (0,external_kolmafia_.myAscensions)() ? 1 : 3, (0,dist.$item)(_templateObject178 || (_templateObject178 = fights_taggedTemplateLiteral(["seal-blubber candle"]))));
  (0,external_kolmafia_.use)(figurine);
}, {
  requirements: function requirements() {
    return [new Requirement(["Club"], {})];
  }
}), new FreeFight(function () {
  return clamp(10 - (0,dist.get)("_brickoFights"), 0, 10);
}, function () {
  return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject179 || (_templateObject179 = fights_taggedTemplateLiteral(["BRICKO ooze"]))));
}, {
  cost: function cost() {
    return (0,external_kolmafia_.mallPrice)((0,dist.$item)(_templateObject180 || (_templateObject180 = fights_taggedTemplateLiteral(["BRICKO eye brick"])))) + 2 * (0,external_kolmafia_.mallPrice)((0,dist.$item)(_templateObject181 || (_templateObject181 = fights_taggedTemplateLiteral(["BRICKO brick"]))));
  }
}), //Initial 9 Pygmy fights
new FreeFight(function () {
  return (0,dist.get)("questL11Worship") !== "unstarted" ? clamp(9 - (0,dist.get)("_drunkPygmyBanishes"), 0, 9) : 0;
}, function () {
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject182 || (_templateObject182 = fights_taggedTemplateLiteral(["bowling ball"])))), (0,dist.$item)(_templateObject183 || (_templateObject183 = fights_taggedTemplateLiteral(["bowling ball"]))));
  (0,external_kolmafia_.retrieveItem)(clamp(9 - (0,dist.get)("_drunkPygmyBanishes"), 0, 9), (0,dist.$item)(_templateObject184 || (_templateObject184 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject185 || (_templateObject185 = fights_taggedTemplateLiteral(["Louder Than Bomb"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject186 || (_templateObject186 = fights_taggedTemplateLiteral(["tennis ball"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject187 || (_templateObject187 = fights_taggedTemplateLiteral(["divine champagne popper"]))));
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject188 || (_templateObject188 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), pygmyMacro);
}), //10th Pygmy fight. If we have an orb, equip it for this fight, to save for later
new FreeFight(function () {
  return (0,dist.get)("questL11Worship") !== "unstarted" && (0,dist.get)("_drunkPygmyBanishes") === 9;
}, function () {
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject189 || (_templateObject189 = fights_taggedTemplateLiteral(["bowling ball"])))), (0,dist.$item)(_templateObject190 || (_templateObject190 = fights_taggedTemplateLiteral(["bowling ball"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject191 || (_templateObject191 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject192 || (_templateObject192 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), pygmyMacro);
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      forceEquip: (0,dist.$items)(_templateObject193 || (_templateObject193 = fights_taggedTemplateLiteral(["miniature crystal ball"]))).filter(function (item) {
        return (0,dist.have)(item);
      })
    })];
  }
}), //11th pygmy fight if we lack a saber
new FreeFight(function () {
  return (0,dist.get)("questL11Worship") !== "unstarted" && (0,dist.get)("_drunkPygmyBanishes") === 10 && !(0,dist.have)((0,dist.$item)(_templateObject194 || (_templateObject194 = fights_taggedTemplateLiteral(["Fourth of May Cosplay Saber"]))));
}, function () {
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject195 || (_templateObject195 = fights_taggedTemplateLiteral(["bowling ball"])))), (0,dist.$item)(_templateObject196 || (_templateObject196 = fights_taggedTemplateLiteral(["bowling ball"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject197 || (_templateObject197 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject198 || (_templateObject198 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), pygmyMacro);
}), //11th+ pygmy fight if we have a saber- saber friends
new FreeFight(function () {
  var rightTime = (0,dist.have)((0,dist.$item)(_templateObject199 || (_templateObject199 = fights_taggedTemplateLiteral(["Fourth of May Cosplay Saber"])))) && (0,dist.get)("_drunkPygmyBanishes") >= 10;
  var saberedMonster = (0,dist.get)("_saberForceMonster");
  var wrongPygmySabered = saberedMonster && (0,dist.$monsters)(_templateObject200 || (_templateObject200 = fights_taggedTemplateLiteral(["pygmy orderlies, pygmy bowler, pygmy janitor"]))).includes(saberedMonster);
  var drunksCanAppear = (0,dist.get)("_drunkPygmyBanishes") === 10 || saberedMonster === (0,dist.$monster)(_templateObject201 || (_templateObject201 = fights_taggedTemplateLiteral(["drunk pygmy"]))) && (0,dist.get)("_saberForceMonsterCount");
  var remainingSaberPygmies = (saberedMonster === (0,dist.$monster)(_templateObject202 || (_templateObject202 = fights_taggedTemplateLiteral(["drunk pygmy"]))) ? (0,dist.get)("_saberForceMonsterCount") : 0) + 2 * clamp(5 - (0,dist.get)("_saberForceUses"), 0, 5);
  return (0,dist.get)("questL11Worship") !== "unstarted" && rightTime && !wrongPygmySabered && drunksCanAppear && remainingSaberPygmies;
}, function () {
  if (((0,dist.get)("_saberForceMonster") !== (0,dist.$monster)(_templateObject203 || (_templateObject203 = fights_taggedTemplateLiteral(["drunk pygmy"]))) || (0,dist.get)("_saberForceMonsterCount") === 1) && (0,dist.get)("_saberForceUses") < 5) {
    (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject204 || (_templateObject204 = fights_taggedTemplateLiteral(["bowling ball"])))), (0,dist.$item)(_templateObject205 || (_templateObject205 = fights_taggedTemplateLiteral(["bowling ball"]))));
    (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject206 || (_templateObject206 = fights_taggedTemplateLiteral(["Bowl of Scorpions"])))), (0,dist.$item)(_templateObject207 || (_templateObject207 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
    (0,dist.adventureMacro)((0,dist.$location)(_templateObject208 || (_templateObject208 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), combat.Macro.skill("Use the Force"));
  } else {
    if ((0,external_kolmafia_.closetAmount)((0,dist.$item)(_templateObject209 || (_templateObject209 = fights_taggedTemplateLiteral(["Bowl of Scorpions"])))) > 0) (0,external_kolmafia_.takeCloset)((0,external_kolmafia_.closetAmount)((0,dist.$item)(_templateObject210 || (_templateObject210 = fights_taggedTemplateLiteral(["Bowl of Scorpions"])))), (0,dist.$item)(_templateObject211 || (_templateObject211 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));else (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject212 || (_templateObject212 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
    (0,dist.adventureMacro)((0,dist.$location)(_templateObject213 || (_templateObject213 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), pygmyMacro);
  }
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      forceEquip: (0,dist.$items)(_templateObject214 || (_templateObject214 = fights_taggedTemplateLiteral(["Fourth of May Cosplay Saber"]))),
      bonusEquip: new Map([[(0,dist.$item)(_templateObject215 || (_templateObject215 = fights_taggedTemplateLiteral(["garbage sticker"]))), 100]]),
      preventEquip: (0,dist.$items)(_templateObject216 || (_templateObject216 = fights_taggedTemplateLiteral(["Staff of Queso Escusado, stinky cheese sword"])))
    })];
  }
}), //Finally, saber or not, if we have a drunk pygmy in our crystal ball, let it out.
new FreeFight(function () {
  return (0,dist.get)("questL11Worship") !== "unstarted" && (0,dist.get)("crystalBallMonster") === (0,dist.$monster)(_templateObject217 || (_templateObject217 = fights_taggedTemplateLiteral(["drunk pygmy"]))) && (0,dist.get)("_drunkPygmyBanishes") >= 11;
}, function () {
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(_templateObject218 || (_templateObject218 = fights_taggedTemplateLiteral(["bowling ball"])))), (0,dist.$item)(_templateObject219 || (_templateObject219 = fights_taggedTemplateLiteral(["bowling ball"]))));
  (0,external_kolmafia_.retrieveItem)(1, (0,dist.$item)(_templateObject220 || (_templateObject220 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject221 || (_templateObject221 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))), combat.Macro.abort());
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      forceEquip: (0,dist.$items)(_templateObject222 || (_templateObject222 = fights_taggedTemplateLiteral(["miniature crystal ball"]))).filter(function (item) {
        return (0,dist.have)(item);
      }),
      bonusEquip: new Map([[(0,dist.$item)(_templateObject223 || (_templateObject223 = fights_taggedTemplateLiteral(["garbage sticker"]))), 100]]),
      preventEquip: (0,dist.$items)(_templateObject224 || (_templateObject224 = fights_taggedTemplateLiteral(["Staff of Queso Escusado, stinky cheese sword"])))
    })];
  }
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$item)(_templateObject225 || (_templateObject225 = fights_taggedTemplateLiteral(["Time-Spinner"])))) && (0,dist.$location)(_templateObject226 || (_templateObject226 = fights_taggedTemplateLiteral(["The Hidden Bowling Alley"]))).combatQueue.includes("drunk pygmy") && (0,dist.get)("_timeSpinnerMinutesUsed") < 8;
}, function () {
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(_templateObject227 || (_templateObject227 = fights_taggedTemplateLiteral(["Bowl of Scorpions"]))));
  combat.Macro.trySkill("Extract").trySkill("Sing Along").setAutoAttack;
  (0,external_kolmafia_.visitUrl)("inv_use.php?whichitem=".concat((0,external_kolmafia_.toInt)((0,dist.$item)(_templateObject228 || (_templateObject228 = fights_taggedTemplateLiteral(["Time-Spinner"]))))));
  (0,external_kolmafia_.runChoice)(1);
  (0,external_kolmafia_.visitUrl)("choice.php?whichchoice=1196&monid=".concat((0,dist.$monster)(_templateObject229 || (_templateObject229 = fights_taggedTemplateLiteral(["drunk pygmy"]))).id, "&option=1"));
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      bonusEquip: new Map([[(0,dist.$item)(_templateObject230 || (_templateObject230 = fights_taggedTemplateLiteral(["garbage sticker"]))), 100]]),
      preventEquip: (0,dist.$items)(_templateObject231 || (_templateObject231 = fights_taggedTemplateLiteral(["Staff of Queso Escusado, stinky cheese sword"])))
    })];
  }
}), new FreeFight(function () {
  return (0,dist.get)("_sausageFights") === 0 && (0,dist.have)((0,dist.$item)(_templateObject232 || (_templateObject232 = fights_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"]))));
}, function () {
  return (0,external_kolmafia_.adv1)(prepWandererZone(), -1, "");
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      forceEquip: (0,dist.$items)(_templateObject233 || (_templateObject233 = fights_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"])))
    })];
  }
}), new FreeFight(function () {
  return (0,dist.get)("questL11Ron") === "finished" ? 5 - (0,dist.get)("_glarkCableUses") : 0;
}, function () {
  (0,external_kolmafia_.retrieveItem)(5 - (0,dist.get)("_glarkCableUses"), (0,dist.$item)(_templateObject234 || (_templateObject234 = fights_taggedTemplateLiteral(["glark cable"]))));
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject235 || (_templateObject235 = fights_taggedTemplateLiteral(["The Red Zeppelin"]))), combat.Macro.item((0,dist.$item)(_templateObject236 || (_templateObject236 = fights_taggedTemplateLiteral(["glark cable"])))));
}), // Mushroom garden
new FreeFight(function () {
  return ((0,dist.have)((0,dist.$item)(_templateObject237 || (_templateObject237 = fights_taggedTemplateLiteral(["packet of mushroom spores"])))) || (0,external_kolmafia_.getCampground)()["packet of mushroom spores"] !== undefined) && (0,dist.get)("_mushroomGardenFights") === 0;
}, function () {
  if ((0,dist.have)((0,dist.$item)(_templateObject238 || (_templateObject238 = fights_taggedTemplateLiteral(["packet of mushroom spores"]))))) (0,external_kolmafia_.use)((0,dist.$item)(_templateObject239 || (_templateObject239 = fights_taggedTemplateLiteral(["packet of mushroom spores"]))));

  if (dist.SourceTerminal.have()) {
    dist.SourceTerminal.educate([(0,dist.$skill)(_templateObject240 || (_templateObject240 = fights_taggedTemplateLiteral(["Extract"]))), (0,dist.$skill)(_templateObject241 || (_templateObject241 = fights_taggedTemplateLiteral(["Portscan"])))]);
  }

  (0,dist.adventureMacro)((0,dist.$location)(_templateObject242 || (_templateObject242 = fights_taggedTemplateLiteral(["Your Mushroom Garden"]))), combat.Macro.if_("hasskill macrometeorite", combat.Macro.trySkill("Portscan")).meatKill());
  if ((0,dist.have)((0,dist.$item)(_templateObject243 || (_templateObject243 = fights_taggedTemplateLiteral(["packet of tall grass seeds"]))))) (0,external_kolmafia_.use)((0,dist.$item)(_templateObject244 || (_templateObject244 = fights_taggedTemplateLiteral(["packet of tall grass seeds"]))));
}, {
  familiar: function familiar() {
    return (0,dist.have)((0,dist.$familiar)(_templateObject245 || (_templateObject245 = fights_taggedTemplateLiteral(["Robortender"])))) ? (0,dist.$familiar)(_templateObject246 || (_templateObject246 = fights_taggedTemplateLiteral(["Robortender"]))) : null;
  }
}), // Portscan and mushroom garden
new FreeFight(function () {
  return ((0,dist.have)((0,dist.$item)(_templateObject247 || (_templateObject247 = fights_taggedTemplateLiteral(["packet of mushroom spores"])))) || (0,external_kolmafia_.getCampground)()["packet of mushroom spores"] !== undefined) && (0,external_kolmafia_.getCounters)("portscan.edu", 0, 0) === "portscan.edu" && (0,dist.have)((0,dist.$skill)(_templateObject248 || (_templateObject248 = fights_taggedTemplateLiteral(["Macrometeorite"])))) && (0,dist.get)("_macrometeoriteUses") < 10;
}, function () {
  if ((0,dist.have)((0,dist.$item)(_templateObject249 || (_templateObject249 = fights_taggedTemplateLiteral(["packet of mushroom spores"]))))) (0,external_kolmafia_.use)((0,dist.$item)(_templateObject250 || (_templateObject250 = fights_taggedTemplateLiteral(["packet of mushroom spores"]))));

  if (dist.SourceTerminal.have()) {
    dist.SourceTerminal.educate([(0,dist.$skill)(_templateObject251 || (_templateObject251 = fights_taggedTemplateLiteral(["Extract"]))), (0,dist.$skill)(_templateObject252 || (_templateObject252 = fights_taggedTemplateLiteral(["Portscan"])))]);
  }

  (0,dist.adventureMacro)((0,dist.$location)(_templateObject253 || (_templateObject253 = fights_taggedTemplateLiteral(["Your Mushroom Garden"]))), combat.Macro.if_("monstername government agent", combat.Macro.skill("Macrometeorite")).if_("monstername piranha plant", combat.Macro.if_("hasskill macrometeorite", combat.Macro.trySkill("Portscan")).meatKill()));
  if ((0,dist.have)((0,dist.$item)(_templateObject254 || (_templateObject254 = fights_taggedTemplateLiteral(["packet of tall grass seeds"]))))) (0,external_kolmafia_.use)((0,dist.$item)(_templateObject255 || (_templateObject255 = fights_taggedTemplateLiteral(["packet of tall grass seeds"]))));
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$familiar)(_templateObject256 || (_templateObject256 = fights_taggedTemplateLiteral(["God Lobster"])))) ? clamp(3 - (0,dist.get)("_godLobsterFights"), 0, 3) : 0;
}, function () {
  (0,external_kolmafia_.visitUrl)("main.php?fightgodlobster=1");
  (0,external_kolmafia_.runCombat)();
  (0,external_kolmafia_.visitUrl)("choice.php");
  if ((0,external_kolmafia_.handlingChoice)()) (0,external_kolmafia_.runChoice)(3);
}, {
  familiar: function familiar() {
    return (0,dist.$familiar)(_templateObject257 || (_templateObject257 = fights_taggedTemplateLiteral(["God Lobster"])));
  }
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$familiar)(_templateObject258 || (_templateObject258 = fights_taggedTemplateLiteral(["Machine Elf"])))) ? clamp(5 - (0,dist.get)("_machineTunnelsAdv"), 0, 5) : 0;
}, function () {
  return (0,external_kolmafia_.adv1)((0,dist.$location)(_templateObject259 || (_templateObject259 = fights_taggedTemplateLiteral(["The Deep Machine Tunnels"]))), -1, "");
}, {
  familiar: function familiar() {
    return (0,dist.$familiar)(_templateObject260 || (_templateObject260 = fights_taggedTemplateLiteral(["Machine Elf"])));
  }
}), // 28	5	0	0	Witchess pieces	must have a Witchess Set; can copy for more
new FreeFight(function () {
  return dist.Witchess.have() ? clamp(5 - dist.Witchess.fightsDone(), 0, 5) : 0;
}, function () {
  return dist.Witchess.fightPiece(bestWitchessPiece());
}), new FreeFight(function () {
  return (0,dist.get)("snojoAvailable") && clamp(10 - (0,dist.get)("_snojoFreeFights"), 0, 10);
}, function () {
  if ((0,dist.get)("snojoSetting", "NONE") === "NONE") {
    (0,external_kolmafia_.visitUrl)("place.php?whichplace=snojo&action=snojo_controller");
    (0,external_kolmafia_.runChoice)(3);
  }

  (0,external_kolmafia_.adv1)((0,dist.$location)(_templateObject261 || (_templateObject261 = fights_taggedTemplateLiteral(["The X-32-F Combat Training Snowman"]))), -1, "");
}), new FreeFight(function () {
  return (0,dist.get)("neverendingPartyAlways") && questStep("_questPartyFair") < 999 ? clamp(10 - (0,dist.get)("_neverendingPartyFreeTurns"), 0, 10) : 0;
}, function () {
  nepQuest();
  (0,dist.adventureMacro)((0,dist.$location)(_templateObject262 || (_templateObject262 = fights_taggedTemplateLiteral(["The Neverending Party"]))), combat.Macro.trySkill("Feel Pride").meatKill());

  if ((0,dist.get)("choiceAdventure1324") !== 5 && questStep("_questPartyFair") > 0) {
    (0,external_kolmafia_.print)("Found Gerald/ine!", "blue");
    setChoice(1324, 5);
  }
}, {
  requirements: function requirements() {
    return [new Requirement([], {
      forceEquip: (0,dist.have)((0,dist.$item)(_templateObject263 || (_templateObject263 = fights_taggedTemplateLiteral(["January's Garbage Tote"])))) ? (0,dist.$items)(_templateObject264 || (_templateObject264 = fights_taggedTemplateLiteral(["makeshift garbage shirt"]))) : []
    })];
  }
})];
var freeKillSources = [new FreeFight(function () {
  return !(0,dist.get)("_gingerbreadMobHitUsed") && (0,dist.have)((0,dist.$skill)(_templateObject265 || (_templateObject265 = fights_taggedTemplateLiteral(["Gingerbread Mob Hit"]))));
}, function () {
  return (0,combat.withMacro)(combat.Macro.skill("Sing Along").trySkill("Gingerbread Mob Hit"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject266 || (_templateObject266 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {})];
  }
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$skill)(_templateObject267 || (_templateObject267 = fights_taggedTemplateLiteral(["Shattering Punch"])))) ? clamp(3 - (0,dist.get)("_shatteringPunchUsed"), 0, 3) : 0;
}, function () {
  return (0,combat.withMacro)(combat.Macro.skill("Sing Along").trySkill("Shattering Punch"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject268 || (_templateObject268 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {})];
  }
}), // Use the jokester's gun even if we don't have tot
new FreeFight(function () {
  return !(0,dist.get)("_firedJokestersGun") && (0,dist.have)((0,dist.$item)(_templateObject269 || (_templateObject269 = fights_taggedTemplateLiteral(["The Jokester's gun"]))));
}, function () {
  return (0,combat.withMacro)(combat.Macro.skill("Sing Along").trySkill("Fire the Jokester's Gun"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject270 || (_templateObject270 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {
      forceEquip: (0,dist.$items)(_templateObject271 || (_templateObject271 = fights_taggedTemplateLiteral(["The Jokester's gun"])))
    })];
  }
}), // 22	3	0	0	Chest X-Ray	combat skill	must have a Lil' Doctor™ bag equipped
new FreeFight(function () {
  return (0,dist.have)((0,dist.$item)(_templateObject272 || (_templateObject272 = fights_taggedTemplateLiteral(["Lil' Doctor\u2122 bag"])))) ? clamp(3 - (0,dist.get)("_chestXRayUsed"), 0, 3) : 0;
}, function () {
  return (0,combat.withMacro)(combat.Macro.skill("Sing Along").trySkill("Chest X-Ray"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject273 || (_templateObject273 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {
      forceEquip: (0,dist.$items)(_templateObject274 || (_templateObject274 = fights_taggedTemplateLiteral(["Lil' Doctor\u2122 bag"])))
    })];
  }
}), new FreeFight(function () {
  return (0,dist.have)((0,dist.$item)(_templateObject275 || (_templateObject275 = fights_taggedTemplateLiteral(["replica bat-oomerang"])))) ? clamp(3 - (0,dist.get)("_usedReplicaBatoomerang"), 0, 3) : 0;
}, function () {
  return (0,combat.withMacro)(combat.Macro.skill("Sing Along").item("replica bat-oomerang"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject276 || (_templateObject276 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {})];
  }
}), new FreeFight(function () {
  return !(0,dist.get)("_missileLauncherUsed") && (0,external_kolmafia_.getCampground)()["Asdon Martin keyfob"] !== undefined;
}, function () {
  fillAsdonMartinTo(100);
  (0,combat.withMacro)(combat.Macro.skill("Sing Along").skill("Asdon Martin: Missile Launcher"), function () {
    return (0,external_kolmafia_.use)((0,dist.$item)(_templateObject277 || (_templateObject277 = fights_taggedTemplateLiteral(["drum machine"]))));
  });
}, {
  familiar: bestFairy,
  requirements: function requirements() {
    return [new Requirement(["100 Item Drop"], {})];
  }
})];
function freeFights() {
  if ((0,external_kolmafia_.myInebriety)() > (0,external_kolmafia_.inebrietyLimit)()) return;
  (0,external_kolmafia_.visitUrl)("place.php?whichplace=town_wrong");
  propertyManager.setChoices({
    1310: 3,
    //god lob stats
    1119: 5,
    //escape DMT
    1387: 2,
    //"You will go find two friends and meet me here."
    1324: 5 //Fight a random partier

  });

  var _iterator2 = fights_createForOfIteratorHelper(freeFightSources),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var freeFightSource = _step2.value;
      freeFightSource.runAll();
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }

  if (!(0,dist.have)((0,dist.$item)(_templateObject278 || (_templateObject278 = fights_taggedTemplateLiteral(["li'l ninja costume"])))) && (0,dist.have)((0,dist.$familiar)(_templateObject279 || (_templateObject279 = fights_taggedTemplateLiteral(["Trick-or-Treating Tot"])))) && !(0,dist.get)("_firedJokestersGun") && (0,dist.have)((0,dist.$item)(_templateObject280 || (_templateObject280 = fights_taggedTemplateLiteral(["The Jokester's gun"]))))) {
    (0,external_kolmafia_.useFamiliar)(freeFightFamiliar());
    freeFightMood().execute();
    freeFightOutfit([new Requirement([], {
      forceEquip: (0,dist.$items)(_templateObject281 || (_templateObject281 = fights_taggedTemplateLiteral(["The Jokester's gun"])))
    })]);

    if (questStep("questL08Trapper") >= 2) {
      (0,dist.adventureMacroAuto)((0,dist.$location)(_templateObject282 || (_templateObject282 = fights_taggedTemplateLiteral(["Lair of the Ninja Snowmen"]))), combat.Macro.skill("Fire the Jokester's Gun"));
    } else if ((0,dist.have)((0,dist.$skill)(_templateObject283 || (_templateObject283 = fights_taggedTemplateLiteral(["Comprehensive Cartography"])))) && (0,dist.get)("_monstersMapped") < 3) {
      try {
        combat.Macro.skill("Fire the Jokester's Gun").setAutoAttack();
        mapMonster((0,dist.$location)(_templateObject284 || (_templateObject284 = fights_taggedTemplateLiteral(["The Haiku Dungeon"]))), (0,dist.$monster)(_templateObject285 || (_templateObject285 = fights_taggedTemplateLiteral(["amateur ninja"]))));
      } finally {
        (0,external_kolmafia_.setAutoAttack)(0);
      }
    }
  }

  try {
    var _iterator3 = fights_createForOfIteratorHelper(freeKillSources),
        _step3;

    try {
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        var freeKillSource = _step3.value;

        if (freeKillSource.available()) {
          // TODO: Add potions that are profitable for free kills.
          // TODO: Don't run free kills at all if they're not profitable.
          ensureEffect((0,dist.$effect)(_templateObject286 || (_templateObject286 = fights_taggedTemplateLiteral(["Feeling Lost"]))));

          if ((0,dist.have)((0,dist.$skill)(_templateObject287 || (_templateObject287 = fights_taggedTemplateLiteral(["Steely-Eyed Squint"])))) && !(0,dist.get)("_steelyEyedSquintUsed")) {
            (0,external_kolmafia_.useSkill)((0,dist.$skill)(_templateObject288 || (_templateObject288 = fights_taggedTemplateLiteral(["Steely-Eyed Squint"]))));
          }
        }

        freeKillSource.runAll();
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
  } finally {
    (0,external_kolmafia_.cliExecute)("uneffect Feeling Lost");
    if ((0,dist.have)((0,dist.$item)(_templateObject289 || (_templateObject289 = fights_taggedTemplateLiteral(["January's Garbage Tote"]))))) (0,external_kolmafia_.cliExecute)("fold wad of used tape");
  }
}

function nepQuest() {
  if ((0,dist.get)("_questPartyFair") === "unstarted") {
    (0,external_kolmafia_.visitUrl)("adventure.php?snarfblat=528");

    if ((0,dist.get)("_questPartyFairQuest") === "food") {
      (0,external_kolmafia_.runChoice)(1);
      setChoice(1324, 2);
      setChoice(1326, 3);
    } else if ((0,dist.get)("_questPartyFairQuest") === "booze") {
      (0,external_kolmafia_.runChoice)(1);
      setChoice(1324, 3);
      setChoice(1327, 3);
    } else {
      (0,external_kolmafia_.runChoice)(2);
      setChoice(1324, 5);
    }
  }
}

function thesisReady() {
  return !(0,dist.get)("_thesisDelivered") && (0,dist.have)((0,dist.$familiar)(_templateObject290 || (_templateObject290 = fights_taggedTemplateLiteral(["Pocket Professor"])))) && (0,dist.$familiar)(_templateObject291 || (_templateObject291 = fights_taggedTemplateLiteral(["Pocket Professor"]))).experience >= 400;
}

function deliverThesis() {
  var thesisInNEP = (0,dist.get)("neverendingPartyAlways") && (0,dist.get)("_neverendingPartyFreeTurns") < 10 && questStep("_questPartyFair") < 999; //Set up NEP if we haven't yet

  if (thesisInNEP) nepQuest();
  (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(_templateObject292 || (_templateObject292 = fights_taggedTemplateLiteral(["Pocket Professor"]))));
  freeFightMood().execute();
  freeFightOutfit([new Requirement(["100 muscle"], {})]);
  safeRestore();

  if ((0,dist.have)((0,dist.$item)(_templateObject293 || (_templateObject293 = fights_taggedTemplateLiteral(["Powerful Glove"])))) && !(0,dist.have)((0,dist.$effect)(_templateObject294 || (_templateObject294 = fights_taggedTemplateLiteral(["Triple-Sized"])))) && (0,dist.get)("_powerfulGloveBatteryPowerUsed") <= 95) {
    (0,external_kolmafia_.cliExecute)("checkpoint");
    (0,external_kolmafia_.equip)((0,dist.$slot)(_templateObject295 || (_templateObject295 = fights_taggedTemplateLiteral(["acc1"]))), (0,dist.$item)(_templateObject296 || (_templateObject296 = fights_taggedTemplateLiteral(["Powerful Glove"]))));
    ensureEffect((0,dist.$effect)(_templateObject297 || (_templateObject297 = fights_taggedTemplateLiteral(["Triple-Sized"]))));
    (0,external_kolmafia_.outfit)("checkpoint");
  }

  (0,external_kolmafia_.cliExecute)("gain 1800 muscle");
  (0,dist.adventureMacro)(thesisInNEP ? (0,dist.$location)(_templateObject298 || (_templateObject298 = fights_taggedTemplateLiteral(["The Neverending Party"]))) : (0,dist.$location)(_templateObject299 || (_templateObject299 = fights_taggedTemplateLiteral(["Uncle Gator's Country Fun-Time Liquid Waste Sluice"]))), combat.Macro.skill("Deliver your Thesis"));
}

function safeRestore() {
  if ((0,external_kolmafia_.myHp)() < (0,external_kolmafia_.myMaxhp)() * 0.5) {
    (0,external_kolmafia_.restoreHp)((0,external_kolmafia_.myMaxhp)() * 0.9);
  }

  if ((0,external_kolmafia_.myMp)() < 50 && (0,external_kolmafia_.myMaxmp)() > 50) {
    if (((0,dist.have)((0,dist.$item)(_templateObject300 || (_templateObject300 = fights_taggedTemplateLiteral(["magical sausage"])))) || (0,dist.have)((0,dist.$item)(_templateObject301 || (_templateObject301 = fights_taggedTemplateLiteral(["magical sausage casing"]))))) && (0,dist.get)("_sausagesEaten") < 23) {
      (0,external_kolmafia_.eat)((0,dist.$item)(_templateObject302 || (_templateObject302 = fights_taggedTemplateLiteral(["magical sausage"]))));
    }

    (0,external_kolmafia_.restoreMp)(50);
  }
}

function doSausage() {
  if (!kramcoGuaranteed()) return;
  (0,external_kolmafia_.useFamiliar)(freeFightFamiliar());
  freeFightOutfit([new Requirement([], {
    forceEquip: (0,dist.$items)(_templateObject303 || (_templateObject303 = fights_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"])))
  })]);
  (0,dist.adventureMacroAuto)(prepWandererZone(), combat.Macro.meatKill());
  (0,external_kolmafia_.setAutoAttack)(0);
}
;// CONCATENATED MODULE: ./src/diet.ts
var diet_templateObject, diet_templateObject2, diet_templateObject3, diet_templateObject4, diet_templateObject5, diet_templateObject6, diet_templateObject7, diet_templateObject8, diet_templateObject9, diet_templateObject10, diet_templateObject11, diet_templateObject12, diet_templateObject13, diet_templateObject14, diet_templateObject15, diet_templateObject16, diet_templateObject17, diet_templateObject18, diet_templateObject19, diet_templateObject20, diet_templateObject21, diet_templateObject22, diet_templateObject23, diet_templateObject24, diet_templateObject25, diet_templateObject26, diet_templateObject27, diet_templateObject28, diet_templateObject29, diet_templateObject30, diet_templateObject31, diet_templateObject32, diet_templateObject33, diet_templateObject34, diet_templateObject35, diet_templateObject36, diet_templateObject37, diet_templateObject38, diet_templateObject39, diet_templateObject40, diet_templateObject41, diet_templateObject42, diet_templateObject43, diet_templateObject44, diet_templateObject45, diet_templateObject46, diet_templateObject47, diet_templateObject48, diet_templateObject49, diet_templateObject50, diet_templateObject51, diet_templateObject52, diet_templateObject53, diet_templateObject54, diet_templateObject55, diet_templateObject56, diet_templateObject57, diet_templateObject58, diet_templateObject59, diet_templateObject60, diet_templateObject61, diet_templateObject62, diet_templateObject63, diet_templateObject64, diet_templateObject65, diet_templateObject66, diet_templateObject67, diet_templateObject68, diet_templateObject69, diet_templateObject70, diet_templateObject71, diet_templateObject72, diet_templateObject73, diet_templateObject74, diet_templateObject75, diet_templateObject76, diet_templateObject77, diet_templateObject78, diet_templateObject79, diet_templateObject80, diet_templateObject81, diet_templateObject82, diet_templateObject83, diet_templateObject84, diet_templateObject85, diet_templateObject86, diet_templateObject87, diet_templateObject88, diet_templateObject89, diet_templateObject90;

function diet_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = diet_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function diet_slicedToArray(arr, i) { return diet_arrayWithHoles(arr) || diet_iterableToArrayLimit(arr, i) || diet_unsupportedIterableToArray(arr, i) || diet_nonIterableRest(); }

function diet_nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function diet_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return diet_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return diet_arrayLikeToArray(o, minLen); }

function diet_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function diet_iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function diet_arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function diet_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }







var MPA = (0,dist.get)("valueOfAdventure");
(0,external_kolmafia_.print)("Using adventure value ".concat(MPA, "."), "blue");

function eatSafe(qty, item) {
  acquire(qty, (0,dist.$item)(diet_templateObject || (diet_templateObject = diet_taggedTemplateLiteral(["Special Seasoning"]))));
  acquire(qty, item);
  if (!(0,external_kolmafia_.eat)(qty, item)) throw "Failed to eat safely";
}

function drinkSafe(qty, item) {
  var prevDrunk = (0,external_kolmafia_.myInebriety)();
  acquire(qty, item);
  if (!(0,external_kolmafia_.drink)(qty, item)) throw "Failed to drink safely";

  if (item.inebriety === 1 && prevDrunk === qty + (0,external_kolmafia_.myInebriety)() - 1) {
    // sometimes mafia does not track the mime army shot glass property
    (0,external_kolmafia_.setProperty)("_mimeArmyShotglassUsed", "true");
  }
}

function chewSafe(qty, item) {
  acquire(qty, item);
  if (!(0,external_kolmafia_.chew)(qty, item)) throw "Failed to chew safely";
}

function eatSpleen(qty, item) {
  if ((0,external_kolmafia_.mySpleenUse)() < 5) throw "No spleen to clear with this.";
  eatSafe(qty, item);
}

function drinkSpleen(qty, item) {
  if ((0,external_kolmafia_.mySpleenUse)() < 5) throw "No spleen to clear with this.";
  drinkSafe(qty, item);
}

function adventureGain(item) {
  if (item.adventures.includes("-")) {
    var _item$adventures$spli = item.adventures.split("-").map(function (s) {
      return parseInt(s, 10);
    }),
        _item$adventures$spli2 = diet_slicedToArray(_item$adventures$spli, 2),
        min = _item$adventures$spli2[0],
        max = _item$adventures$spli2[1];

    return (min + max) / 2.0;
  } else {
    return parseInt(item.adventures, 10);
  }
}

function propTrue(prop) {
  if (typeof prop === "boolean") {
    return prop;
  } else {
    return (0,dist.get)(prop);
  }
}

function useIfUnused(item, prop, maxPrice) {
  if (!propTrue(prop)) {
    if ((0,external_kolmafia_.mallPrice)(item) <= maxPrice) {
      acquire(1, item, maxPrice);
      (0,external_kolmafia_.use)(1, item);
    } else {
      (0,external_kolmafia_.print)("Skipping ".concat(item.name, "; too expensive (").concat((0,external_kolmafia_.mallPrice)(item), " > ").concat(maxPrice, ")."));
    }
  }
}

var valuePerSpleen = function valuePerSpleen(item) {
  return (adventureGain(item) * MPA - (0,external_kolmafia_.mallPrice)(item)) / item.spleen;
};

var savedBestSpleenItem = null;
var savedPotentialSpleenItems = null;

function getBestSpleenItems() {
  if (savedBestSpleenItem === null || savedPotentialSpleenItems === null) {
    savedPotentialSpleenItems = (0,dist.$items)(diet_templateObject2 || (diet_templateObject2 = diet_taggedTemplateLiteral(["octolus oculus, transdermal smoke patch, antimatter wad, voodoo snuff, blood-drive sticker"])));
    savedPotentialSpleenItems.sort(function (x, y) {
      return valuePerSpleen(y) - valuePerSpleen(x);
    });

    var _iterator = diet_createForOfIteratorHelper(savedPotentialSpleenItems),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var spleenItem = _step.value;
        (0,external_kolmafia_.print)("".concat(spleenItem, " value/spleen: ").concat(valuePerSpleen(spleenItem)));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    savedBestSpleenItem = savedPotentialSpleenItems[0];
  }

  return {
    bestSpleenItem: savedBestSpleenItem,
    potentialSpleenItems: savedPotentialSpleenItems
  };
}

function fillSomeSpleen() {
  var _getBestSpleenItems = getBestSpleenItems(),
      bestSpleenItem = _getBestSpleenItems.bestSpleenItem;

  (0,external_kolmafia_.print)("Spleen item: ".concat(bestSpleenItem));
  fillSpleenWith(bestSpleenItem);
}

function fillSpleenWith(spleenItem) {
  if ((0,external_kolmafia_.mySpleenUse)() + spleenItem.spleen <= (0,external_kolmafia_.spleenLimit)()) {
    // (adventureGain * spleenA + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // spleenA + spleenB = spleenTotal
    // (adventureGain * (spleenTotal - spleenB) + adventures) * 1.04 + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * (spleenTotal - spleenB) + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * spleenTotal - 1.04 * adventureGain * spleenB + 1.04 * adventures + 40 = 30 * spleenB + synthTurns
    // 1.04 * adventureGain * spleenTotal + 1.04 * adventures + 40 = 30 * spleenB + synthTurns + 1.04 * adventureGain * spleenB
    // (1.04 * adventureGain * spleenTotal + 1.04 * adventures + 40 - synthTurns) / (30 + 1.04 * adventureGain) = spleenB
    var synthTurns = (0,external_kolmafia_.haveEffect)((0,dist.$effect)(diet_templateObject3 || (diet_templateObject3 = diet_taggedTemplateLiteral(["Synthesis: Greed"]))));
    var spleenTotal = (0,external_kolmafia_.spleenLimit)() - (0,external_kolmafia_.mySpleenUse)();
    var adventuresPerItem = adventureGain(spleenItem);
    var spleenSynth = Math.ceil((1.04 * adventuresPerItem * spleenTotal + estimatedTurns() - synthTurns) / (30 + 1.04 * adventuresPerItem));

    if ((0,dist.have)((0,dist.$skill)(diet_templateObject4 || (diet_templateObject4 = diet_taggedTemplateLiteral(["Sweet Synthesis"]))))) {
      for (var i = 0; i < clamp(spleenSynth, 0, (0,external_kolmafia_.spleenLimit)() - (0,external_kolmafia_.mySpleenUse)()); i++) {
        (0,external_kolmafia_.sweetSynthesis)((0,dist.$effect)(diet_templateObject5 || (diet_templateObject5 = diet_taggedTemplateLiteral(["Synthesis: Greed"]))));
      }
    }

    var count = Math.floor(((0,external_kolmafia_.spleenLimit)() - (0,external_kolmafia_.mySpleenUse)()) / spleenItem.spleen);
    acquire(count, spleenItem);
    chewSafe(count, spleenItem);
  }
}

function fillStomach() {
  if ((0,external_kolmafia_.myLevel)() >= 15 && !(0,dist.get)("_hungerSauceUsed") && (0,external_kolmafia_.mallPrice)((0,dist.$item)(diet_templateObject6 || (diet_templateObject6 = diet_taggedTemplateLiteral(["Hunger\u2122 Sauce"])))) < 3 * MPA) {
    acquire(1, (0,dist.$item)(diet_templateObject7 || (diet_templateObject7 = diet_taggedTemplateLiteral(["Hunger\u2122 Sauce"]))), 3 * MPA);
    (0,external_kolmafia_.use)(1, (0,dist.$item)(diet_templateObject8 || (diet_templateObject8 = diet_taggedTemplateLiteral(["Hunger\u2122 Sauce"]))));
  }

  useIfUnused((0,dist.$item)(diet_templateObject9 || (diet_templateObject9 = diet_taggedTemplateLiteral(["milk of magnesium"]))), "_milkOfMagnesiumUsed", 5 * MPA);

  while ((0,external_kolmafia_.myFullness)() + 5 <= (0,external_kolmafia_.fullnessLimit)()) {
    if ((0,external_kolmafia_.myMaxhp)() < 1000) (0,external_kolmafia_.maximize)("0.05hp, hot res", false);
    var count = Math.floor(Math.min(((0,external_kolmafia_.fullnessLimit)() - (0,external_kolmafia_.myFullness)()) / 5, (0,external_kolmafia_.mySpleenUse)() / 5));
    eatSpleen(count, (0,dist.$item)(diet_templateObject10 || (diet_templateObject10 = diet_taggedTemplateLiteral(["Ol' Scratch's salad fork"]))));
    mindMayo(Mayo.flex, count);
    eatSpleen(count, (0,dist.$item)(diet_templateObject11 || (diet_templateObject11 = diet_taggedTemplateLiteral(["extra-greasy slider"]))));
    fillSomeSpleen();
  }
}

function fillLiverAstralPilsner() {
  if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(diet_templateObject12 || (diet_templateObject12 = diet_taggedTemplateLiteral(["astral pilsner"])))) === 0) {
    return;
  }

  try {
    if (!(0,dist.get)("_mimeArmyShotglassUsed") && (0,external_kolmafia_.itemAmount)((0,dist.$item)(diet_templateObject13 || (diet_templateObject13 = diet_taggedTemplateLiteral(["mime army shotglass"])))) > 0 && (0,external_kolmafia_.availableAmount)((0,dist.$item)(diet_templateObject14 || (diet_templateObject14 = diet_taggedTemplateLiteral(["astral pilsner"])))) > 0) {
      drinkSafe(1, (0,dist.$item)(diet_templateObject15 || (diet_templateObject15 = diet_taggedTemplateLiteral(["astral pilsner"]))));
    }

    if (globalOptions.ascending && (0,external_kolmafia_.myInebriety)() + 1 <= (0,external_kolmafia_.inebrietyLimit)() && (0,external_kolmafia_.availableAmount)((0,dist.$item)(diet_templateObject16 || (diet_templateObject16 = diet_taggedTemplateLiteral(["astral pilsner"])))) > 0) {
      var count = Math.floor(Math.min((0,external_kolmafia_.inebrietyLimit)() - (0,external_kolmafia_.myInebriety)(), (0,external_kolmafia_.availableAmount)((0,dist.$item)(diet_templateObject17 || (diet_templateObject17 = diet_taggedTemplateLiteral(["astral pilsner"]))))));
      drinkSafe(count, (0,dist.$item)(diet_templateObject18 || (diet_templateObject18 = diet_taggedTemplateLiteral(["astral pilsner"]))));
    }
  } catch (_unused) {
    (0,external_kolmafia_.print)("Failed to drink astral pilsner.", "red");
  }
}

function fillLiver() {
  if ((0,external_kolmafia_.myFamiliar)() === (0,dist.$familiar)(diet_templateObject19 || (diet_templateObject19 = diet_taggedTemplateLiteral(["Stooper"])))) {
    (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(diet_templateObject20 || (diet_templateObject20 = diet_taggedTemplateLiteral(["none"]))));
  }

  fillLiverAstralPilsner();

  if (!(0,dist.get)("_mimeArmyShotglassUsed") && (0,external_kolmafia_.itemAmount)((0,dist.$item)(diet_templateObject21 || (diet_templateObject21 = diet_taggedTemplateLiteral(["mime army shotglass"])))) > 0) {
    (0,external_kolmafia_.equip)((0,dist.$item)(diet_templateObject22 || (diet_templateObject22 = diet_taggedTemplateLiteral(["tuxedo shirt"]))));
    drinkSafe(1, (0,dist.$item)(diet_templateObject23 || (diet_templateObject23 = diet_taggedTemplateLiteral(["splendid martini"]))));
  }

  while ((0,external_kolmafia_.myInebriety)() + 5 <= (0,external_kolmafia_.inebrietyLimit)()) {
    if ((0,external_kolmafia_.myMaxhp)() < 1000) (0,external_kolmafia_.maximize)("0.05hp, cold res", false);
    var count = Math.floor(Math.min(((0,external_kolmafia_.inebrietyLimit)() - (0,external_kolmafia_.myInebriety)()) / 5, (0,external_kolmafia_.mySpleenUse)() / 5));
    drinkSpleen(count, (0,dist.$item)(diet_templateObject24 || (diet_templateObject24 = diet_taggedTemplateLiteral(["Frosty's frosty mug"]))));
    drinkSpleen(count, (0,dist.$item)(diet_templateObject25 || (diet_templateObject25 = diet_taggedTemplateLiteral(["jar of fermented pickle juice"]))));
    fillSomeSpleen();
  }
}

function runDiet() {
  if ((0,dist.get)("barrelShrineUnlocked") && !(0,dist.get)("_barrelPrayer") && (0,dist.$classes)(diet_templateObject26 || (diet_templateObject26 = diet_taggedTemplateLiteral(["Turtle Tamer, Accordion Thief"]))).includes((0,external_kolmafia_.myClass)())) {
    (0,external_kolmafia_.cliExecute)("barrelprayer buff");
  }

  var _getBestSpleenItems2 = getBestSpleenItems(),
      bestSpleenItem = _getBestSpleenItems2.bestSpleenItem;

  if ((0,external_kolmafia_.mySpleenUse)() === 0) {
    if (!(0,dist.have)((0,dist.$effect)(diet_templateObject27 || (diet_templateObject27 = diet_taggedTemplateLiteral(["Eau d' Clochard"]))))) {
      if (!(0,dist.have)((0,dist.$item)(diet_templateObject28 || (diet_templateObject28 = diet_taggedTemplateLiteral(["beggin' cologne"]))))) {
        var equilibriumPrice = (baseMeat * (0,external_kolmafia_.numericModifier)((0,dist.$effect)(diet_templateObject29 || (diet_templateObject29 = diet_taggedTemplateLiteral(["Eau d' Clochard"]))), "Meat") * (0,external_kolmafia_.numericModifier)((0,dist.$item)(diet_templateObject30 || (diet_templateObject30 = diet_taggedTemplateLiteral(["beggin' cologne"]))), "Effect Duration") + Math.min((0,external_kolmafia_.numericModifier)((0,dist.$item)(diet_templateObject31 || (diet_templateObject31 = diet_taggedTemplateLiteral(["beggin' cologne"]))), "Effect Duration"), embezzlerCount()) * 750) / 100 - valuePerSpleen(bestSpleenItem);
        if (equilibriumPrice > 0) (0,external_kolmafia_.buy)(1, (0,dist.$item)(diet_templateObject32 || (diet_templateObject32 = diet_taggedTemplateLiteral(["beggin' cologne"]))), equilibriumPrice);
      }

      if ((0,dist.have)((0,dist.$item)(diet_templateObject33 || (diet_templateObject33 = diet_taggedTemplateLiteral(["beggin' cologne"]))))) {
        (0,external_kolmafia_.chew)(1, (0,dist.$item)(diet_templateObject34 || (diet_templateObject34 = diet_taggedTemplateLiteral(["beggin' cologne"]))));
      }
    }

    if ((0,dist.have)((0,dist.$skill)(diet_templateObject35 || (diet_templateObject35 = diet_taggedTemplateLiteral(["Sweet Synthesis"]))))) ensureEffect((0,dist.$effect)(diet_templateObject36 || (diet_templateObject36 = diet_taggedTemplateLiteral(["Synthesis: Collection"]))));
    if ((0,dist.have)((0,dist.$item)(diet_templateObject37 || (diet_templateObject37 = diet_taggedTemplateLiteral(["body spradium"]))))) ensureEffect((0,dist.$effect)(diet_templateObject38 || (diet_templateObject38 = diet_taggedTemplateLiteral(["Boxing Day Glow"]))));
  }

  useIfUnused((0,dist.$item)(diet_templateObject39 || (diet_templateObject39 = diet_taggedTemplateLiteral(["fancy chocolate car"]))), (0,dist.get)("_chocolatesUsed") === 0, 2 * MPA);
  var loveChocolateCount = Math.max(3 - Math.floor(20000 / MPA) - (0,dist.get)("_loveChocolatesUsed"), 0);
  var loveChocolateEat = Math.min(loveChocolateCount, (0,external_kolmafia_.itemAmount)((0,dist.$item)(diet_templateObject40 || (diet_templateObject40 = diet_taggedTemplateLiteral(["LOV Extraterrestrial Chocolate"])))));
  (0,external_kolmafia_.use)(loveChocolateEat, (0,dist.$item)(diet_templateObject41 || (diet_templateObject41 = diet_taggedTemplateLiteral(["LOV Extraterrestrial Chocolate"]))));
  var choco = new Map([[(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject42 || (diet_templateObject42 = diet_taggedTemplateLiteral(["Seal Clubber"])))), (0,dist.$item)(diet_templateObject43 || (diet_templateObject43 = diet_taggedTemplateLiteral(["chocolate seal-clubbing club"])))], [(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject44 || (diet_templateObject44 = diet_taggedTemplateLiteral(["Turtle Tamer"])))), (0,dist.$item)(diet_templateObject45 || (diet_templateObject45 = diet_taggedTemplateLiteral(["chocolate turtle totem"])))], [(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject46 || (diet_templateObject46 = diet_taggedTemplateLiteral(["Pastamancer"])))), (0,dist.$item)(diet_templateObject47 || (diet_templateObject47 = diet_taggedTemplateLiteral(["chocolate pasta spoon"])))], [(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject48 || (diet_templateObject48 = diet_taggedTemplateLiteral(["Sauceror"])))), (0,dist.$item)(diet_templateObject49 || (diet_templateObject49 = diet_taggedTemplateLiteral(["chocolate saucepan"])))], [(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject50 || (diet_templateObject50 = diet_taggedTemplateLiteral(["Accordion Thief"])))), (0,dist.$item)(diet_templateObject51 || (diet_templateObject51 = diet_taggedTemplateLiteral(["chocolate stolen accordion"])))], [(0,external_kolmafia_.toInt)((0,dist.$class)(diet_templateObject52 || (diet_templateObject52 = diet_taggedTemplateLiteral(["Disco Bandit"])))), (0,dist.$item)(diet_templateObject53 || (diet_templateObject53 = diet_taggedTemplateLiteral(["chocolate disco ball"])))]]);

  if (choco.has((0,external_kolmafia_.toInt)((0,external_kolmafia_.myClass)())) && (0,dist.get)("_chocolatesUsed") < 3) {
    var used = (0,dist.get)("_chocolatesUsed");
    var item = choco.get((0,external_kolmafia_.toInt)((0,external_kolmafia_.myClass)())) || (0,dist.$item)(diet_templateObject54 || (diet_templateObject54 = diet_taggedTemplateLiteral(["none"])));
    var count = clamp(3 - used, 0, 3);
    (0,external_kolmafia_.use)(count, item);
  }

  useIfUnused((0,dist.$item)(diet_templateObject55 || (diet_templateObject55 = diet_taggedTemplateLiteral(["fancy chocolate sculpture"]))), (0,dist.get)("_chocolateSculpturesUsed") < 1, 5 * MPA + 5000);
  useIfUnused((0,dist.$item)(diet_templateObject56 || (diet_templateObject56 = diet_taggedTemplateLiteral(["essential tofu"]))), "_essentialTofuUsed", 5 * MPA);

  if (!(0,dist.get)("_etchedHourglassUsed") && (0,dist.have)((0,dist.$item)(diet_templateObject57 || (diet_templateObject57 = diet_taggedTemplateLiteral(["etched hourglass"]))))) {
    (0,external_kolmafia_.use)(1, (0,dist.$item)(diet_templateObject58 || (diet_templateObject58 = diet_taggedTemplateLiteral(["etched hourglass"]))));
  }

  if ((0,external_kolmafia_.getProperty)("_timesArrowUsed") !== "true" && (0,external_kolmafia_.mallPrice)((0,dist.$item)(diet_templateObject59 || (diet_templateObject59 = diet_taggedTemplateLiteral(["time's arrow"])))) < 5 * MPA) {
    acquire(1, (0,dist.$item)(diet_templateObject60 || (diet_templateObject60 = diet_taggedTemplateLiteral(["time's arrow"]))), 5 * MPA);
    (0,external_kolmafia_.cliExecute)("csend 1 time's arrow to botticelli");
    (0,external_kolmafia_.setProperty)("_timesArrowUsed", "true");
  }

  if ((0,dist.have)((0,dist.$skill)(diet_templateObject61 || (diet_templateObject61 = diet_taggedTemplateLiteral(["Ancestral Recall"])))) && (0,external_kolmafia_.mallPrice)((0,dist.$item)(diet_templateObject62 || (diet_templateObject62 = diet_taggedTemplateLiteral(["blue mana"])))) < 3 * MPA) {
    var casts = Math.max(10 - (0,dist.get)("_ancestralRecallCasts"), 0);
    acquire(casts, (0,dist.$item)(diet_templateObject63 || (diet_templateObject63 = diet_taggedTemplateLiteral(["blue mana"]))), 3 * MPA);
    (0,external_kolmafia_.useSkill)(casts, (0,dist.$skill)(diet_templateObject64 || (diet_templateObject64 = diet_taggedTemplateLiteral(["Ancestral Recall"]))));
  }

  if (globalOptions.ascending) useIfUnused((0,dist.$item)(diet_templateObject65 || (diet_templateObject65 = diet_taggedTemplateLiteral(["borrowed time"]))), "_borrowedTimeUsed", 5 * MPA);
  fillSomeSpleen();
  fillStomach();
  fillLiver();

  if (!(0,dist.get)("_distentionPillUsed") && 1 <= (0,external_kolmafia_.myInebriety)()) {
    if (!(0,dist.get)("garbo_skipPillCheck", false) && !(0,dist.have)((0,dist.$item)(diet_templateObject66 || (diet_templateObject66 = diet_taggedTemplateLiteral(["distention pill"]))), 1)) {
      (0,dist.set)("garbo_skipPillCheck", (0,external_kolmafia_.userConfirm)("You do not have any distention pills. Continue anyway? (Defaulting to no in 15 seconds)", 15000, false));
    }

    if (((0,dist.have)((0,dist.$item)(diet_templateObject67 || (diet_templateObject67 = diet_taggedTemplateLiteral(["distention pill"]))), 1) || !(0,dist.get)("garbo_skipPillCheck", false)) && !(0,external_kolmafia_.use)((0,dist.$item)(diet_templateObject68 || (diet_templateObject68 = diet_taggedTemplateLiteral(["distention pill"]))))) {
      (0,external_kolmafia_.print)("WARNING: Out of distention pills.", "red");
    }
  }

  if (!(0,dist.get)("_syntheticDogHairPillUsed") && 1 <= (0,external_kolmafia_.myInebriety)()) {
    if (!(0,dist.get)("garbo_skipPillCheck", false) && !(0,dist.have)((0,dist.$item)(diet_templateObject69 || (diet_templateObject69 = diet_taggedTemplateLiteral(["synthetic dog hair pill"]))), 1)) {
      (0,dist.set)("garbo_skipPillCheck", (0,external_kolmafia_.userConfirm)("You do not have any synthetic dog hair pills. Continue anyway? (Defaulting to no in 15 seconds)", 15000, false));
    }

    if (((0,dist.have)((0,dist.$item)(diet_templateObject70 || (diet_templateObject70 = diet_taggedTemplateLiteral(["synthetic dog hair pill"]))), 1) || !(0,dist.get)("garbo_skipPillCheck", false)) && !(0,external_kolmafia_.use)((0,dist.$item)(diet_templateObject71 || (diet_templateObject71 = diet_taggedTemplateLiteral(["synthetic dog hair pill"]))))) {
      (0,external_kolmafia_.print)("WARNING: Out of synthetic dog hair pills.", "red");
    }
  }

  var mojoFilterCount = 3 - (0,dist.get)("currentMojoFilters");
  acquire(mojoFilterCount, (0,dist.$item)(diet_templateObject72 || (diet_templateObject72 = diet_taggedTemplateLiteral(["mojo filter"]))), valuePerSpleen(bestSpleenItem), false);

  if ((0,dist.have)((0,dist.$item)(diet_templateObject73 || (diet_templateObject73 = diet_taggedTemplateLiteral(["mojo filter"]))))) {
    (0,external_kolmafia_.use)(Math.min(mojoFilterCount, (0,external_kolmafia_.availableAmount)((0,dist.$item)(diet_templateObject74 || (diet_templateObject74 = diet_taggedTemplateLiteral(["mojo filter"]))))), (0,dist.$item)(diet_templateObject75 || (diet_templateObject75 = diet_taggedTemplateLiteral(["mojo filter"]))));
    fillSomeSpleen();
  }

  while ((0,external_kolmafia_.myFullness)() < (0,external_kolmafia_.fullnessLimit)()) {
    if ((0,external_kolmafia_.mallPrice)((0,dist.$item)(diet_templateObject76 || (diet_templateObject76 = diet_taggedTemplateLiteral(["fudge spork"])))) < 3 * MPA && !(0,dist.get)("_fudgeSporkUsed")) (0,external_kolmafia_.eat)(1, (0,dist.$item)(diet_templateObject77 || (diet_templateObject77 = diet_taggedTemplateLiteral(["fudge spork"]))));
    mindMayo(Mayo.zapine, 1);
    eatSafe(1, (0,dist.$item)(diet_templateObject78 || (diet_templateObject78 = diet_taggedTemplateLiteral(["jumping horseradish"]))));
  }

  while ((0,external_kolmafia_.myInebriety)() < (0,external_kolmafia_.inebrietyLimit)()) {
    drinkSafe(1, (0,dist.$item)(diet_templateObject79 || (diet_templateObject79 = diet_taggedTemplateLiteral(["Ambitious Turkey"]))));
  }
}
function horseradish() {
  if ((0,external_kolmafia_.myFullness)() < (0,external_kolmafia_.fullnessLimit)()) {
    if ((0,external_kolmafia_.mallPrice)((0,dist.$item)(diet_templateObject80 || (diet_templateObject80 = diet_taggedTemplateLiteral(["fudge spork"])))) < 3 * MPA && !(0,dist.get)("_fudgeSporkUsed")) (0,external_kolmafia_.eat)(1, (0,dist.$item)(diet_templateObject81 || (diet_templateObject81 = diet_taggedTemplateLiteral(["fudge spork"]))));
    mindMayo(Mayo.zapine, 1);
    eatSafe(1, (0,dist.$item)(diet_templateObject82 || (diet_templateObject82 = diet_taggedTemplateLiteral(["jumping horseradish"]))));
  }
}
var Mayo = {
  nex: (0,dist.$item)(diet_templateObject83 || (diet_templateObject83 = diet_taggedTemplateLiteral(["Mayonex"]))),
  diol: (0,dist.$item)(diet_templateObject84 || (diet_templateObject84 = diet_taggedTemplateLiteral(["Mayodiol"]))),
  zapine: (0,dist.$item)(diet_templateObject85 || (diet_templateObject85 = diet_taggedTemplateLiteral(["Mayozapine"]))),
  flex: (0,dist.$item)(diet_templateObject86 || (diet_templateObject86 = diet_taggedTemplateLiteral(["Mayoflex"])))
};

function mindMayo(mayo, quantity) {
  if ((0,external_kolmafia_.getWorkshed)() !== (0,dist.$item)(diet_templateObject87 || (diet_templateObject87 = diet_taggedTemplateLiteral(["portable Mayo Clinic"])))) return;
  if ((0,dist.get)("mayoInMouth") && (0,dist.get)("mayoInMouth") !== mayo.name) throw "You used a bad mayo, my friend!"; //Is this what we want?

  (0,external_kolmafia_.retrieveItem)(quantity, mayo);
  if (!(0,dist.have)((0,dist.$item)(diet_templateObject88 || (diet_templateObject88 = diet_taggedTemplateLiteral(["Mayo Minder\u2122"]))))) (0,external_kolmafia_.buy)((0,dist.$item)(diet_templateObject89 || (diet_templateObject89 = diet_taggedTemplateLiteral(["Mayo Minder\u2122"]))));

  if ((0,dist.get)("mayoMinderSetting") !== mayo.name) {
    setChoice(1076, (0,external_kolmafia_.toInt)(mayo) - 8260);
    (0,external_kolmafia_.use)((0,dist.$item)(diet_templateObject90 || (diet_templateObject90 = diet_taggedTemplateLiteral(["Mayo Minder\u2122"]))));
  }
}
;// CONCATENATED MODULE: ./src/dailies.ts
var dailies_templateObject, dailies_templateObject2, dailies_templateObject3, dailies_templateObject4, dailies_templateObject5, dailies_templateObject6, dailies_templateObject7, dailies_templateObject8, dailies_templateObject9, dailies_templateObject10, dailies_templateObject11, dailies_templateObject12, dailies_templateObject13, dailies_templateObject14, dailies_templateObject15, dailies_templateObject16, dailies_templateObject17, dailies_templateObject18, dailies_templateObject19, dailies_templateObject20, dailies_templateObject21, dailies_templateObject22, dailies_templateObject23, dailies_templateObject24, dailies_templateObject25, dailies_templateObject26, dailies_templateObject27, dailies_templateObject28, dailies_templateObject29, dailies_templateObject30, dailies_templateObject31, dailies_templateObject32, dailies_templateObject33, dailies_templateObject34, dailies_templateObject35, dailies_templateObject36, dailies_templateObject37, dailies_templateObject38, dailies_templateObject39, dailies_templateObject40, dailies_templateObject41, dailies_templateObject42, dailies_templateObject43, dailies_templateObject44, dailies_templateObject45, dailies_templateObject46, dailies_templateObject47, dailies_templateObject48, dailies_templateObject49, dailies_templateObject50, dailies_templateObject51, dailies_templateObject52, dailies_templateObject53, dailies_templateObject54, dailies_templateObject55, dailies_templateObject56, dailies_templateObject57, dailies_templateObject58, dailies_templateObject59, dailies_templateObject60, dailies_templateObject61, dailies_templateObject62, dailies_templateObject63, dailies_templateObject64, dailies_templateObject65, dailies_templateObject66, dailies_templateObject67, dailies_templateObject68, dailies_templateObject69, dailies_templateObject70, dailies_templateObject71, dailies_templateObject72, dailies_templateObject73, dailies_templateObject74, dailies_templateObject75, dailies_templateObject76, dailies_templateObject77, dailies_templateObject78, dailies_templateObject79, dailies_templateObject80, dailies_templateObject81, dailies_templateObject82, dailies_templateObject83, dailies_templateObject84, dailies_templateObject85, dailies_templateObject86, dailies_templateObject87, dailies_templateObject88, dailies_templateObject89, dailies_templateObject90, dailies_templateObject91, dailies_templateObject92, dailies_templateObject93, dailies_templateObject94, dailies_templateObject95, dailies_templateObject96, dailies_templateObject97, dailies_templateObject98, dailies_templateObject99, dailies_templateObject100, dailies_templateObject101, dailies_templateObject102, dailies_templateObject103, dailies_templateObject104, dailies_templateObject105, dailies_templateObject106, dailies_templateObject107;

function dailies_slicedToArray(arr, i) { return dailies_arrayWithHoles(arr) || dailies_iterableToArrayLimit(arr, i) || dailies_unsupportedIterableToArray(arr, i) || dailies_nonIterableRest(); }

function dailies_nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function dailies_iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function dailies_arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function dailies_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = dailies_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e2) { throw _e2; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e3) { didErr = true; err = _e3; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function dailies_toConsumableArray(arr) { return dailies_arrayWithoutHoles(arr) || dailies_iterableToArray(arr) || dailies_unsupportedIterableToArray(arr) || dailies_nonIterableSpread(); }

function dailies_nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function dailies_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return dailies_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return dailies_arrayLikeToArray(o, minLen); }

function dailies_iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function dailies_arrayWithoutHoles(arr) { if (Array.isArray(arr)) return dailies_arrayLikeToArray(arr); }

function dailies_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function dailies_defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function dailies_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }










function voterSetup() {
  if ((0,dist.have)((0,dist.$item)(dailies_templateObject || (dailies_templateObject = dailies_taggedTemplateLiteral(["\"I Voted!\" sticker"])))) || !((0,dist.get)("voteAlways") || (0,dist.get)("_voteToday"))) return;
  (0,external_kolmafia_.visitUrl)("place.php?whichplace=town_right&action=townright_vote");
  var votingMonsterPriority = ["terrible mutant", "angry ghost", "government bureaucrat", "annoyed snake", "slime blob"];
  var initPriority = new Map([["Meat Drop: +30", 10], ["Item Drop: +15", 9], ["Familiar Experience: +2", 8], ["Adventures: +1", 7], ["Monster Level: +10", 5], ["".concat((0,external_kolmafia_.myPrimestat)(), " Percent: +25"), 3], ["Experience (".concat((0,external_kolmafia_.myPrimestat)(), "): +4"), 2], ["Meat Drop: -30", -2], ["Item Drop: -15", -2], ["Familiar Experience: -2", -2]]);
  var monsterVote = votingMonsterPriority.indexOf((0,dist.get)("_voteMonster1")) < votingMonsterPriority.indexOf((0,dist.get)("_voteMonster2")) ? 1 : 2;
  var voteLocalPriorityArr = [[0, initPriority.get((0,dist.get)("_voteLocal1")) || ((0,dist.get)("_voteLocal1").indexOf("-") === -1 ? 1 : -1)], [1, initPriority.get((0,dist.get)("_voteLocal2")) || ((0,dist.get)("_voteLocal2").indexOf("-") === -1 ? 1 : -1)], [2, initPriority.get((0,dist.get)("_voteLocal3")) || ((0,dist.get)("_voteLocal3").indexOf("-") === -1 ? 1 : -1)], [3, initPriority.get((0,dist.get)("_voteLocal4")) || ((0,dist.get)("_voteLocal4").indexOf("-") === -1 ? 1 : -1)]];
  var bestVotes = voteLocalPriorityArr.sort(function (a, b) {
    return b[1] - a[1];
  });
  var firstInit = bestVotes[0][0];
  var secondInit = bestVotes[1][0];
  (0,external_kolmafia_.visitUrl)("choice.php?option=1&whichchoice=1331&g=".concat(monsterVote, "&local[]=").concat(firstInit, "&local[]=").concat(secondInit));
}
function configureGear() {
  if ((0,dist.have)((0,dist.$familiar)(dailies_templateObject2 || (dailies_templateObject2 = dailies_taggedTemplateLiteral(["Cornbeefadon"])))) && !(0,dist.have)((0,dist.$item)(dailies_templateObject3 || (dailies_templateObject3 = dailies_taggedTemplateLiteral(["amulet coin"]))))) {
    (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject4 || (dailies_templateObject4 = dailies_taggedTemplateLiteral(["Cornbeefadon"]))));
    (0,external_kolmafia_.use)((0,dist.$item)(dailies_templateObject5 || (dailies_templateObject5 = dailies_taggedTemplateLiteral(["box of Familiar Jacks"]))));
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject6 || (dailies_templateObject6 = dailies_taggedTemplateLiteral(["portable pantogram"])))) && !(0,dist.have)((0,dist.$item)(dailies_templateObject7 || (dailies_templateObject7 = dailies_taggedTemplateLiteral(["pantogram pants"]))))) {
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(dailies_templateObject8 || (dailies_templateObject8 = dailies_taggedTemplateLiteral(["ten-leaf clover"]))));
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(dailies_templateObject9 || (dailies_templateObject9 = dailies_taggedTemplateLiteral(["porquoise"]))));
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(dailies_templateObject10 || (dailies_templateObject10 = dailies_taggedTemplateLiteral(["bubblin' crude"]))));
    var m = new Map([[(0,dist.$stat)(dailies_templateObject11 || (dailies_templateObject11 = dailies_taggedTemplateLiteral(["Muscle"]))), 1], [(0,dist.$stat)(dailies_templateObject12 || (dailies_templateObject12 = dailies_taggedTemplateLiteral(["Mysticality"]))), 2], [(0,dist.$stat)(dailies_templateObject13 || (dailies_templateObject13 = dailies_taggedTemplateLiteral(["Moxie"]))), 3]]).get((0,external_kolmafia_.myPrimestat)());
    (0,external_kolmafia_.visitUrl)("inv_use.php?pwd&whichitem=9573");
    (0,external_kolmafia_.visitUrl)("choice.php?whichchoice=1270&pwd&option=1&m=".concat(m, "&e=5&s1=5789,1&s2=706,1&s3=24,1"));
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject14 || (dailies_templateObject14 = dailies_taggedTemplateLiteral(["Fourth of May Cosplay Saber"])))) && (0,dist.get)("_saberMod") === 0) {
    // Get familiar weight.
    (0,external_kolmafia_.visitUrl)("main.php?action=may4");
    (0,external_kolmafia_.runChoice)(4);
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject15 || (dailies_templateObject15 = dailies_taggedTemplateLiteral(["Bastille Battalion control rig"])))) && (0,dist.get)("_bastilleGames") === 0) {
    (0,external_kolmafia_.cliExecute)("bastille myst brutalist gesture");
  }
}
function latte() {
  var latte = (0,dist.$item)(dailies_templateObject16 || (dailies_templateObject16 = dailies_taggedTemplateLiteral(["latte lovers member's mug"])));

  if ((0,dist.have)(latte) && questStep("questL02Larva") > -1 && questStep("questL11MacGuffin") > -1) {
    (0,dist.withChoice)(1329, 2, function () {
      return (0,external_kolmafia_.visitUrl)("main.php?latte=1", false);
    });

    if ((0,external_kolmafia_.numericModifier)(latte, "Familiar Weight") !== 5 || (0,external_kolmafia_.numericModifier)(latte, "Meat Drop") !== 40) {
      var _propertyManager$setC;

      propertyManager.setChoices((_propertyManager$setC = {}, dailies_defineProperty(_propertyManager$setC, 923, 1), dailies_defineProperty(_propertyManager$setC, 924, 1), dailies_defineProperty(_propertyManager$setC, 502, 2), dailies_defineProperty(_propertyManager$setC, 505, 2), _propertyManager$setC));

      while (!(0,dist.get)("latteUnlocks").includes("cajun") && findRun()) {
        var runSource = findRun();
        if (!runSource) break;
        if (runSource.prepare) runSource.prepare();
        freeFightOutfit([new Requirement([], {
          forceEquip: (0,dist.$items)(dailies_templateObject17 || (dailies_templateObject17 = dailies_taggedTemplateLiteral(["latte lovers member's mug"])))
        })].concat(dailies_toConsumableArray(runSource.requirement ? [runSource.requirement] : [])));
        (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject18 || (dailies_templateObject18 = dailies_taggedTemplateLiteral(["The Black Forest"]))), runSource.macro);
        horseradish();
      }

      while (!(0,dist.get)("latteUnlocks").includes("rawhide") && findRun()) {
        var _runSource = findRun();

        if (!_runSource) break;
        if (_runSource.prepare) _runSource.prepare();
        freeFightOutfit([new Requirement([], {
          forceEquip: (0,dist.$items)(dailies_templateObject19 || (dailies_templateObject19 = dailies_taggedTemplateLiteral(["latte lovers member's mug"])))
        })].concat(dailies_toConsumableArray(_runSource.requirement ? [_runSource.requirement] : [])));
        (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject20 || (dailies_templateObject20 = dailies_taggedTemplateLiteral(["The Spooky Forest"]))), _runSource.macro);
        horseradish();
      }
    }

    while (!(0,dist.get)("latteUnlocks").includes("carrot") && findRun()) {
      var _runSource2 = findRun();

      if (!_runSource2) break;
      if (_runSource2.prepare) _runSource2.prepare();
      freeFightOutfit([new Requirement([], {
        forceEquip: (0,dist.$items)(dailies_templateObject21 || (dailies_templateObject21 = dailies_taggedTemplateLiteral(["latte lovers member's mug"])))
      })].concat(dailies_toConsumableArray(_runSource2.requirement ? [_runSource2.requirement] : [])));
      (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject22 || (dailies_templateObject22 = dailies_taggedTemplateLiteral(["The Dire Warren"]))), _runSource2.macro);
      horseradish();
    }

    if ((0,dist.get)("latteUnlocks").includes("cajun") && (0,dist.get)("latteUnlocks").includes("rawhide") && (0,dist.get)("_latteRefillsUsed") < 3) {
      var latteIngredients = ["cajun", "rawhide", (0,dist.get)("latteUnlocks").includes("carrot") ? "carrot" : (0,external_kolmafia_.myPrimestat)() === (0,dist.$stat)(dailies_templateObject23 || (dailies_templateObject23 = dailies_taggedTemplateLiteral(["muscle"]))) ? "vanilla" : (0,external_kolmafia_.myPrimestat)() === (0,dist.$stat)(dailies_templateObject24 || (dailies_templateObject24 = dailies_taggedTemplateLiteral(["mysticality"]))) ? "pumpkin spice" : "cinnamon"].join(" ");
      (0,external_kolmafia_.cliExecute)("latte refill ".concat(latteIngredients));
    }
  }
}
function prepFamiliars() {
  if ((0,dist.have)((0,dist.$familiar)(dailies_templateObject25 || (dailies_templateObject25 = dailies_taggedTemplateLiteral(["Robortender"]))))) {
    var _iterator = dailies_createForOfIteratorHelper((0,dist.$items)(dailies_templateObject26 || (dailies_templateObject26 = dailies_taggedTemplateLiteral(["Newark, drive-by shooting, Feliz Navidad, single entendre, Bloody Nora"])))),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var drink = _step.value;
        if ((0,dist.get)("_roboDrinks").includes(drink.name)) continue;
        (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject27 || (dailies_templateObject27 = dailies_taggedTemplateLiteral(["Robortender"]))));
        if ((0,external_kolmafia_.itemAmount)(drink) === 0) (0,external_kolmafia_.retrieveItem)(1, drink);
        (0,external_kolmafia_.print)("Feeding robortender ".concat(drink, "."), "blue");
        (0,external_kolmafia_.visitUrl)("inventory.php?action=robooze&which=1&whichitem=".concat((0,external_kolmafia_.toInt)(drink)));
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject28 || (dailies_templateObject28 = dailies_taggedTemplateLiteral(["mumming trunk"])))) && !(0,dist.get)("_mummeryMods").includes("Meat Drop")) {
    (0,external_kolmafia_.useFamiliar)(meatFamiliar());
    (0,external_kolmafia_.cliExecute)("mummery meat");
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject29 || (dailies_templateObject29 = dailies_taggedTemplateLiteral(["mumming trunk"])))) && !(0,dist.get)("_mummeryMods").includes("Item Drop") && (0,dist.have)((0,dist.$familiar)(dailies_templateObject30 || (dailies_templateObject30 = dailies_taggedTemplateLiteral(["Trick-or-Treating Tot"]))))) {
    (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject31 || (dailies_templateObject31 = dailies_taggedTemplateLiteral(["Trick-or-Treating Tot"]))));
    (0,external_kolmafia_.cliExecute)("mummery item");
  }

  if ((0,dist.get)("_feastUsed") === 0) {
    withStash((0,dist.$items)(dailies_templateObject32 || (dailies_templateObject32 = dailies_taggedTemplateLiteral(["moveable feast"]))), function () {
      if ((0,dist.have)((0,dist.$item)(dailies_templateObject33 || (dailies_templateObject33 = dailies_taggedTemplateLiteral(["moveable feast"]))))) [].concat(dailies_toConsumableArray((0,dist.$familiars)(dailies_templateObject34 || (dailies_templateObject34 = dailies_taggedTemplateLiteral(["Pocket Professor, Frumious Bandersnatch, Pair of Stomping Boots"])))), [meatFamiliar()]).forEach(tryFeast);
    });
  }
}
function horse() {
  (0,external_kolmafia_.visitUrl)("place.php?whichplace=town_right");

  if ((0,dist.get)("horseryAvailable") && (0,dist.get)("_horsery") !== "dark horse") {
    (0,external_kolmafia_.cliExecute)("horsery dark");
  }
}
function dailyBuffs() {
  if (!(0,dist.get)("_clanFortuneBuffUsed") && (0,dist.have)((0,dist.$item)(dailies_templateObject35 || (dailies_templateObject35 = dailies_taggedTemplateLiteral(["Clan VIP Lounge key"])))) && (0,external_kolmafia_.getClanLounge)()["Clan Carnival Game"] !== undefined) {
    (0,external_kolmafia_.cliExecute)("fortune buff meat");
  }

  if (!(0,dist.get)("demonSummoned") && (0,dist.get)("demonName2", false) && (0,dist.get)("questL11Manor") === "finished") {
    (0,external_kolmafia_.cliExecute)("summon Preternatural Greed");
  }

  while (dist.SourceTerminal.have() && dist.SourceTerminal.getEnhanceUses() < 3) {
    (0,external_kolmafia_.cliExecute)("terminal enhance meat.enh");
  }

  if (!(0,dist.get)("_madTeaParty")) {
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(dailies_templateObject36 || (dailies_templateObject36 = dailies_taggedTemplateLiteral(["filthy knitted dread sack"]))));
    ensureEffect((0,dist.$effect)(dailies_templateObject37 || (dailies_templateObject37 = dailies_taggedTemplateLiteral(["Down the Rabbit Hole"]))));
    (0,external_kolmafia_.cliExecute)("hatter 22");
  }
}
function configureMisc() {
  if (dist.SongBoom.songChangesLeft() > 0) dist.SongBoom.setSong("Total Eclipse of Your Meat");

  if (dist.SourceTerminal.have()) {
    dist.SourceTerminal.educate([(0,dist.$skill)(dailies_templateObject38 || (dailies_templateObject38 = dailies_taggedTemplateLiteral(["Extract"]))), (0,dist.$skill)(dailies_templateObject39 || (dailies_templateObject39 = dailies_taggedTemplateLiteral(["Digitize"])))]);
    dist.SourceTerminal.enquiry((0,dist.$effect)(dailies_templateObject40 || (dailies_templateObject40 = dailies_taggedTemplateLiteral(["familiar.enq"]))));
  }

  if ((0,dist.get)("_VYKEACompanionLevel") === 0) {
    var vykeas = [[1, 0], [2, 1], [3, 11]]; //excluding 4 and 5 as per bean's suggestion

    var vykeaProfit = function vykeaProfit(level, cost) {
      return estimatedTurns() * baseMeat * 0.1 * level - 5 * (0,external_kolmafia_.mallPrice)((0,dist.$item)(dailies_templateObject41 || (dailies_templateObject41 = dailies_taggedTemplateLiteral(["VYKEA rail"])))) + cost * (0,external_kolmafia_.mallPrice)((0,dist.$item)(dailies_templateObject42 || (dailies_templateObject42 = dailies_taggedTemplateLiteral(["VYKEA dowel"])))) + 5 * (0,external_kolmafia_.mallPrice)((0,dist.$item)(dailies_templateObject43 || (dailies_templateObject43 = dailies_taggedTemplateLiteral(["VYKEA plank"])))) + 1 * (0,external_kolmafia_.mallPrice)((0,dist.$item)(dailies_templateObject44 || (dailies_templateObject44 = dailies_taggedTemplateLiteral(["VYKEA hex key"]))));
    };

    if (vykeas.some(function (_ref) {
      var _ref2 = dailies_slicedToArray(_ref, 2),
          level = _ref2[0],
          cost = _ref2[1];

      return vykeaProfit(level, cost) > 0;
    })) {
      var level = vykeas.sort(function (a, b) {
        return vykeaProfit.apply(void 0, dailies_toConsumableArray(b)) - vykeaProfit.apply(void 0, dailies_toConsumableArray(a));
      })[0][0];
      (0,external_kolmafia_.retrieveItem)((0,dist.$item)(dailies_templateObject45 || (dailies_templateObject45 = dailies_taggedTemplateLiteral(["VYKEA hex key"]))));
      (0,external_kolmafia_.cliExecute)("create level ".concat(level, " couch"));
    }
  }

  if ((0,external_kolmafia_.myClass)() === (0,dist.$class)(dailies_templateObject46 || (dailies_templateObject46 = dailies_taggedTemplateLiteral(["Pastamancer"]))) && (0,external_kolmafia_.myThrall)() !== (0,dist.$thrall)(dailies_templateObject47 || (dailies_templateObject47 = dailies_taggedTemplateLiteral(["Lasagmbie"]))) && (0,external_kolmafia_.haveSkill)((0,dist.$skill)(dailies_templateObject48 || (dailies_templateObject48 = dailies_taggedTemplateLiteral(["Bind Lasagmbie"]))))) {
    (0,external_kolmafia_.useSkill)((0,dist.$skill)(dailies_templateObject49 || (dailies_templateObject49 = dailies_taggedTemplateLiteral(["Bind Lasagmbie"]))));
  }

  if ((0,external_kolmafia_.myClass)() === (0,dist.$class)(dailies_templateObject50 || (dailies_templateObject50 = dailies_taggedTemplateLiteral(["Pastamancer"]))) && (0,dist.have)((0,dist.$item)(dailies_templateObject51 || (dailies_templateObject51 = dailies_taggedTemplateLiteral(["experimental carbon fiber pasta additive"])))) && !(0,dist.get)("_pastaAdditive") && (0,external_kolmafia_.myThrall)().level < 10) {
    (0,external_kolmafia_.use)((0,dist.$item)(dailies_templateObject52 || (dailies_templateObject52 = dailies_taggedTemplateLiteral(["experimental carbon fiber pasta additive"]))));
  }

  if ((0,external_kolmafia_.getClanLounge)()["Olympic-sized Clan crate"] !== undefined && !(0,dist.get)("_olympicSwimmingPoolItemFound") && (0,dist.have)((0,dist.$item)(dailies_templateObject53 || (dailies_templateObject53 = dailies_taggedTemplateLiteral(["Clan VIP Lounge key"]))))) {
    (0,external_kolmafia_.cliExecute)("swim item");
  }

  (0,external_kolmafia_.changeMcd)(10);
}
function volcanoDailies() {
  if (!((0,dist.get)("hotAirportAlways") || (0,dist.get)("_hotAirportToday"))) return;
  if (!(0,dist.get)("_volcanoItemRedeemed")) checkVolcanoQuest();
  (0,external_kolmafia_.print)("Getting my free volcoino!", "blue");

  if (!(0,dist.get)("_infernoDiscoVisited")) {
    (0,dist.$items)(dailies_templateObject54 || (dailies_templateObject54 = dailies_taggedTemplateLiteral(["smooth velvet pocket square, smooth velvet socks, smooth velvet hat, smooth velvet shirt, smooth velvet hanky, smooth velvet pants"]))).forEach(function (discoEquip) {
      (0,external_kolmafia_.retrieveItem)(discoEquip);
    });
    (0,external_kolmafia_.maximize)("disco style", false);
    (0,external_kolmafia_.visitUrl)("place.php?whichplace=airport_hot&action=airport4_zone1");
    (0,external_kolmafia_.runChoice)(7);
  }

  if ((0,dist.have)((0,dist.$skill)(dailies_templateObject55 || (dailies_templateObject55 = dailies_taggedTemplateLiteral(["Unaccompanied Miner"])))) && (0,dist.get)("_unaccompaniedMinerUsed") < 5) {
    (0,external_kolmafia_.cliExecute)("minevolcano.ash ".concat(5 - (0,dist.get)("_unaccompaniedMinerUsed")));
  }
}

function checkVolcanoQuest() {
  (0,external_kolmafia_.print)("Checking volcano quest", "blue");
  (0,external_kolmafia_.visitUrl)("place.php?whichplace=airport_hot&action=airport4_questhub");
  var volcanoItems = [dist.property.getItem("_volcanoItem1") || (0,dist.$item)(dailies_templateObject56 || (dailies_templateObject56 = dailies_taggedTemplateLiteral(["none"]))), dist.property.getItem("_volcanoItem2") || (0,dist.$item)(dailies_templateObject57 || (dailies_templateObject57 = dailies_taggedTemplateLiteral(["none"]))), dist.property.getItem("_volcanoItem3") || (0,dist.$item)(dailies_templateObject58 || (dailies_templateObject58 = dailies_taggedTemplateLiteral(["none"])))];
  var volcanoWhatToDo = new Map([[(0,dist.$item)(dailies_templateObject59 || (dailies_templateObject59 = dailies_taggedTemplateLiteral(["New Age healing crystal"]))), function () {
    if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject60 || (dailies_templateObject60 = dailies_taggedTemplateLiteral(["New Age healing crystal"])))) >= 5) return true;else {
      return (0,external_kolmafia_.buy)(5 - (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject61 || (dailies_templateObject61 = dailies_taggedTemplateLiteral(["New Age healing crystal"])))), (0,dist.$item)(dailies_templateObject62 || (dailies_templateObject62 = dailies_taggedTemplateLiteral(["New Age healing crystal"]))), 1000) === 5 - (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject63 || (dailies_templateObject63 = dailies_taggedTemplateLiteral(["New Age healing crystal"]))));
    }
  }], [(0,dist.$item)(dailies_templateObject64 || (dailies_templateObject64 = dailies_taggedTemplateLiteral(["SMOOCH bottlecap"]))), function () {
    if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject65 || (dailies_templateObject65 = dailies_taggedTemplateLiteral(["SMOOCH bottlecap"])))) > 0) return true;else return (0,external_kolmafia_.buy)(1, (0,dist.$item)(dailies_templateObject66 || (dailies_templateObject66 = dailies_taggedTemplateLiteral(["SMOOCH bottlecap"]))), 5000) === 1;
  }], [(0,dist.$item)(dailies_templateObject67 || (dailies_templateObject67 = dailies_taggedTemplateLiteral(["gooey lava globs"]))), function () {
    if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject68 || (dailies_templateObject68 = dailies_taggedTemplateLiteral(["gooey lava globs"])))) >= 5) {
      return true;
    } else {
      var toBuy = 5 - (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject69 || (dailies_templateObject69 = dailies_taggedTemplateLiteral(["gooey lava globs"]))));
      return (0,external_kolmafia_.buy)(toBuy, (0,dist.$item)(dailies_templateObject70 || (dailies_templateObject70 = dailies_taggedTemplateLiteral(["gooey lava globs"]))), 5000) === toBuy;
    }
  }], [(0,dist.$item)(dailies_templateObject71 || (dailies_templateObject71 = dailies_taggedTemplateLiteral(["fused fuse"]))), function () {
    return (0,dist.have)((0,dist.$item)(dailies_templateObject72 || (dailies_templateObject72 = dailies_taggedTemplateLiteral(["Clara's bell"]))));
  }], [(0,dist.$item)(dailies_templateObject73 || (dailies_templateObject73 = dailies_taggedTemplateLiteral(["smooth velvet bra"]))), function () {
    if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject74 || (dailies_templateObject74 = dailies_taggedTemplateLiteral(["smooth velvet bra"])))) < 3) {
      (0,external_kolmafia_.cliExecute)("acquire ".concat((3 - (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject75 || (dailies_templateObject75 = dailies_taggedTemplateLiteral(["smooth velvet bra"]))))).toString(), " smooth velvet bra"));
    }

    return (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject76 || (dailies_templateObject76 = dailies_taggedTemplateLiteral(["smooth velvet bra"])))) >= 3;
  }], [(0,dist.$item)(dailies_templateObject77 || (dailies_templateObject77 = dailies_taggedTemplateLiteral(["SMOOCH bracers"]))), function () {
    if ((0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject78 || (dailies_templateObject78 = dailies_taggedTemplateLiteral(["SMOOCH bracers"])))) < 3) {
      (0,external_kolmafia_.cliExecute)("acquire ".concat((3 - (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject79 || (dailies_templateObject79 = dailies_taggedTemplateLiteral(["SMOOCH bracers"]))))).toString(), " smooch bracers"));
    }

    return (0,external_kolmafia_.availableAmount)((0,dist.$item)(dailies_templateObject80 || (dailies_templateObject80 = dailies_taggedTemplateLiteral(["SMOOCH bracers"])))) >= 3;
  }]]);

  var _iterator2 = dailies_createForOfIteratorHelper(volcanoWhatToDo.entries()),
      _step2;

  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _step2$value = dailies_slicedToArray(_step2.value, 2),
          volcanoItem = _step2$value[0],
          tryToGetIt = _step2$value[1];

      if (volcanoItems.includes(volcanoItem)) {
        if (tryToGetIt()) {
          if (volcanoItem !== (0,dist.$item)(dailies_templateObject81 || (dailies_templateObject81 = dailies_taggedTemplateLiteral(["fused fuse"])))) {
            (0,external_kolmafia_.visitUrl)("place.php?whichplace=airport_hot&action=airport4_questhub");
            (0,external_kolmafia_.print)("Alright buddy, turning in ".concat(volcanoItem.plural, " for a volcoino!"), "red");
            var choice = volcanoItems.indexOf(volcanoItem) === -1 ? 4 : 1 + volcanoItems.indexOf(volcanoItem);
            (0,external_kolmafia_.runChoice)(choice);
          }
        }
      }
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
}

function cheat() {
  if ((0,dist.have)((0,dist.$item)(dailies_templateObject82 || (dailies_templateObject82 = dailies_taggedTemplateLiteral(["Deck of Every Card"]))))) {
    ["1952 Mickey Mantle", "Island", "Ancestral Recall"].forEach(function (card) {
      if ((0,dist.get)("_deckCardsDrawn") <= 10 && !(0,dist.get)("_deckCardsSeen").includes(card)) (0,external_kolmafia_.cliExecute)("cheat ".concat(card));
    });
  }
}
function gin() {
  if ((0,dist.have)((0,dist.$item)(dailies_templateObject83 || (dailies_templateObject83 = dailies_taggedTemplateLiteral(["Time-Spinner"]))))) {
    if (!(0,dist.get)("_timeSpinnerReplicatorUsed") && (0,dist.get)("timeSpinnerMedals") >= 5 && (0,dist.get)("_timeSpinnerMinutesUsed") <= 8) {
      (0,external_kolmafia_.cliExecute)("FarFuture drink");
    }
  }
}
var teas = (0,dist.$items)(dailies_templateObject84 || (dailies_templateObject84 = dailies_taggedTemplateLiteral(["cuppa Activi tea, cuppa Alacri tea, cuppa Boo tea, cuppa Chari tea, cuppa Craft tea, cuppa Cruel tea, cuppa Dexteri tea, cuppa Feroci tea, cuppa Flamibili tea, cuppa Flexibili tea, cuppa Frost tea, cuppa Gill tea, cuppa Impregnabili tea, cuppa Improprie tea, cuppa Insani tea, cuppa Irritabili tea, cuppa Loyal tea, cuppa Mana tea, cuppa Mediocri tea, cuppa Monstrosi tea, cuppa Morbidi tea, cuppa Nas tea, cuppa Net tea, cuppa Neuroplastici tea, cuppa Obscuri tea, cuppa Physicali tea, cuppa Proprie tea, cuppa Royal tea, cuppa Serendipi tea, cuppa Sobrie tea, cuppa Toast tea, cuppa Twen tea, cuppa Uncertain tea, cuppa Vitali tea, cuppa Voraci tea, cuppa Wit tea, cuppa Yet tea"])));
function pickTea() {
  if (!(0,external_kolmafia_.getCampground)()["potted tea tree"] || (0,dist.get)("_pottedTeaTreeUsed")) return;
  var bestTea = teas.sort(function (a, b) {
    return saleValue(b) - saleValue(a);
  })[0];
  var shakeVal = 3 * saleValue.apply(void 0, dailies_toConsumableArray(teas));
  var teaAction = shakeVal > saleValue(bestTea) ? "shake" : bestTea.name;
  (0,external_kolmafia_.cliExecute)("teatree ".concat(teaAction));
}
function gaze() {
  if (!(0,dist.get)("getawayCampsiteUnlocked")) return;
  if (!(0,dist.get)("_campAwayCloudBuffs")) (0,external_kolmafia_.visitUrl)("place.php?whichplace=campaway&action=campaway_sky");

  while ((0,dist.get)("_campAwaySmileBuffs") < 3) {
    (0,external_kolmafia_.visitUrl)("place.php?whichplace=campaway&action=campaway_sky");
  }
}
function jellyfish() {
  if (!(0,dist.have)((0,dist.$familiar)(dailies_templateObject85 || (dailies_templateObject85 = dailies_taggedTemplateLiteral(["Space Jellyfish"])))) || !((0,dist.have)((0,dist.$skill)(dailies_templateObject86 || (dailies_templateObject86 = dailies_taggedTemplateLiteral(["Meteor Lore"])))) && (0,dist.get)("_macrometeoriteUses") < 10 || (0,dist.have)((0,dist.$item)(dailies_templateObject87 || (dailies_templateObject87 = dailies_taggedTemplateLiteral(["Powerful Glove"])))) && (0,dist.get)("_powerfulGloveBatteryPowerUsed") < 91)) {
    return;
  }

  (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject88 || (dailies_templateObject88 = dailies_taggedTemplateLiteral(["Space Jellyfish"]))));
  (0,external_kolmafia_.setAutoAttack)(0);
  freeFightOutfit();

  while (findRun(false) && (0,dist.have)((0,dist.$skill)(dailies_templateObject89 || (dailies_templateObject89 = dailies_taggedTemplateLiteral(["Meteor Lore"])))) && (0,dist.get)("_macrometeoriteUses") < 10) {
    var runSource = findRun(false);
    if (!runSource) break;
    if (runSource.prepare) runSource.prepare();
    freeFightOutfit(dailies_toConsumableArray(runSource.requirement ? [runSource.requirement] : []));
    var jellyMacro = combat.Macro.while_("!pastround 28 && hasskill macrometeorite", combat.Macro.skill("extract jelly").skill("macrometeorite")).trySkill("extract jelly").step(runSource.macro);
    (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject90 || (dailies_templateObject90 = dailies_taggedTemplateLiteral(["Barf Mountain"]))), jellyMacro);
  }

  if ((0,dist.have)((0,dist.$item)(dailies_templateObject91 || (dailies_templateObject91 = dailies_taggedTemplateLiteral(["Powerful Glove"]))))) {
    while (findRun(false) && (0,dist.get)("_powerfulGloveBatteryPowerUsed") < 91) {
      var _runSource3 = findRun(false);

      if (!_runSource3) break;
      if (_runSource3.prepare) _runSource3.prepare();
      freeFightOutfit([new Requirement([], {
        forceEquip: (0,dist.$items)(dailies_templateObject92 || (dailies_templateObject92 = dailies_taggedTemplateLiteral(["Powerful Glove"])))
      })].concat(dailies_toConsumableArray(_runSource3.requirement ? [_runSource3.requirement] : [])));

      var _jellyMacro = combat.Macro.while_("!pastround 28 && hasskill CHEAT CODE: Replace Enemy", combat.Macro.skill("extract jelly").skill("CHEAT CODE: Replace Enemy")).trySkill("extract jelly").step(_runSource3.macro);

      (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject93 || (dailies_templateObject93 = dailies_taggedTemplateLiteral(["Barf Mountain"]))), _jellyMacro);
    }
  }
}
function gingerbreadPrepNoon() {
  if (!(0,dist.get)("gingerbreadCityAvailable") && !(0,dist.get)("_gingerbreadCityToday")) return;

  if ((0,dist.get)("gingerAdvanceClockUnlocked") && !(0,dist.get)("_gingerbreadClockVisited") && (0,dist.get)("_gingerbreadCityTurns") <= 3) {
    setChoice(1215, 1);
    (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject94 || (dailies_templateObject94 = dailies_taggedTemplateLiteral(["Gingerbread Civic Center"]))), combat.Macro.abort());
  }

  while (findRun() && (0,dist.get)("_gingerbreadCityTurns") + ((0,dist.get)("_gingerbreadClockAdvanced") ? 5 : 0) < 9) {
    var run = findRun();
    if (!run) break;
    if (run.prepare) run.prepare();
    freeFightOutfit(dailies_toConsumableArray(run.requirement ? [run.requirement] : []));
    (0,dist.adventureMacro)((0,dist.$location)(dailies_templateObject95 || (dailies_templateObject95 = dailies_taggedTemplateLiteral(["Gingerbread Civic Center"]))), run.macro);

    if (["Even Tamer Than Usual", "Never Break the Chain", "Close, but Yes Cigar", "Armchair Quarterback"].includes((0,dist.get)("lastEncounter"))) {
      (0,dist.set)("_gingerbreadCityTurns", 1 + (0,dist.get)("_gingerbreadCityTurns"));
    }
  }
}
function hipsterFishing() {
  if ((0,dist.get)("_hipsterAdv") >= 7) return;

  if ((0,dist.have)((0,dist.$familiar)(dailies_templateObject96 || (dailies_templateObject96 = dailies_taggedTemplateLiteral(["Mini-Hipster"]))))) {
    (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject97 || (dailies_templateObject97 = dailies_taggedTemplateLiteral(["Mini-Hipster"]))));
  } else if ((0,dist.have)((0,dist.$familiar)(dailies_templateObject98 || (dailies_templateObject98 = dailies_taggedTemplateLiteral(["Artistic Goth Kid"]))))) {
    (0,external_kolmafia_.useFamiliar)((0,dist.$familiar)(dailies_templateObject99 || (dailies_templateObject99 = dailies_taggedTemplateLiteral(["Artistic Goth Kid"]))));
  } else return;

  while (findRun(false) && (0,dist.get)("_hipsterAdv") < 7) {
    var targetLocation = prepWandererZone().combatPercent === 100 ? prepWandererZone() : (0,dist.$location)(dailies_templateObject100 || (dailies_templateObject100 = dailies_taggedTemplateLiteral(["Noob Cave"])));
    var runSource = findRun(false);
    if (!runSource) return;
    if (runSource.prepare) runSource.prepare();
    freeFightOutfit([].concat(dailies_toConsumableArray(runSource.requirement ? [runSource.requirement] : []), [new Requirement([], {
      bonusEquip: new Map([[(0,dist.$item)(dailies_templateObject101 || (dailies_templateObject101 = dailies_taggedTemplateLiteral(["ironic moustache"]))), saleValue((0,dist.$item)(dailies_templateObject102 || (dailies_templateObject102 = dailies_taggedTemplateLiteral(["mole skin notebook"]))))], [(0,dist.$item)(dailies_templateObject103 || (dailies_templateObject103 = dailies_taggedTemplateLiteral(["chiptune guitar"]))), saleValue((0,dist.$item)(dailies_templateObject104 || (dailies_templateObject104 = dailies_taggedTemplateLiteral(["ironic knit cap"]))))], [(0,dist.$item)(dailies_templateObject105 || (dailies_templateObject105 = dailies_taggedTemplateLiteral(["fixed-gear bicycle"]))), saleValue((0,dist.$item)(dailies_templateObject106 || (dailies_templateObject106 = dailies_taggedTemplateLiteral(["ironic oversized sunglasses"]))))]])
    })]));
    (0,dist.adventureMacro)(targetLocation, combat.Macro.if_("(monsterid 969) || (monsterid 970) || (monsterid 971) || (monsterid 972) || (monsterid 973) || (monstername Black Crayon *)", combat.Macro.meatKill()).step(runSource.macro));
  }
}
function martini() {
  if (!(0,dist.have)((0,dist.$item)(dailies_templateObject107 || (dailies_templateObject107 = dailies_taggedTemplateLiteral(["Kremlin's Greatest Briefcase"])))) || (0,dist.get)("_kgbClicksUsed") > 17 || (0,dist.get)("_kgbDispenserUses") >= 3) {
    return;
  }

  (0,external_kolmafia_.cliExecute)("Briefcase collect");
}
;// CONCATENATED MODULE: ./src/index.ts
var src_templateObject, src_templateObject2, src_templateObject3, src_templateObject4, src_templateObject5, src_templateObject6, src_templateObject7, src_templateObject8, src_templateObject9, src_templateObject10, src_templateObject11, src_templateObject12, src_templateObject13, src_templateObject14, src_templateObject15, src_templateObject16, src_templateObject17, src_templateObject18, src_templateObject19, src_templateObject20, src_templateObject21, src_templateObject22, src_templateObject23, src_templateObject24, src_templateObject25, src_templateObject26, src_templateObject27, src_templateObject28, src_templateObject29, src_templateObject30, src_templateObject31, src_templateObject32, src_templateObject33, src_templateObject34, src_templateObject35, src_templateObject36, src_templateObject37, src_templateObject38, src_templateObject39, src_templateObject40, src_templateObject41, src_templateObject42, src_templateObject43, src_templateObject44, src_templateObject45, src_templateObject46, src_templateObject47, src_templateObject48, src_templateObject49, src_templateObject50, src_templateObject51, src_templateObject52, src_templateObject53, src_templateObject54, src_templateObject55, src_templateObject56, src_templateObject57, src_templateObject58;

function src_createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = src_unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function src_unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return src_arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return src_arrayLikeToArray(o, minLen); }

function src_arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function src_taggedTemplateLiteral(strings, raw) { if (!raw) { raw = strings.slice(0); } return Object.freeze(Object.defineProperties(strings, { raw: { value: Object.freeze(raw) } })); }












 // Max price for tickets. You should rethink whether Barf is the best place if they're this expensive.

var TICKET_MAX_PRICE = 500000;

function ensureBarfAccess() {
  if (!((0,dist.get)("stenchAirportAlways") || (0,dist.get)("_stenchAirportToday"))) {
    var ticket = (0,dist.$item)(src_templateObject || (src_templateObject = src_taggedTemplateLiteral(["one-day ticket to Dinseylandfill"]))); // TODO: Get better item acquisition logic that e.g. checks own mall store.

    if (!(0,dist.have)(ticket)) (0,external_kolmafia_.buy)(1, ticket, TICKET_MAX_PRICE);
    (0,external_kolmafia_.use)(ticket);
  }

  if (!(0,dist.get)("_dinseyGarbageDisposed")) {
    (0,external_kolmafia_.print)("Disposing of garbage.", "blue");
    (0,external_kolmafia_.retrieveItem)((0,dist.$item)(src_templateObject2 || (src_templateObject2 = src_taggedTemplateLiteral(["bag of park garbage"]))));
    (0,external_kolmafia_.visitUrl)("place.php?whichplace=airport_stench&action=airport3_tunnels");
    (0,external_kolmafia_.runChoice)(6);
    (0,external_kolmafia_.cliExecute)("refresh inv");
  }
}

function dailySetup() {
  voterSetup();
  martini();
  gaze();
  configureGear();
  horse();
  prepFamiliars();
  dailyBuffs();
  configureMisc();
  volcanoDailies();
  cheat();
  gin();
  pickTea();
  if ((0,external_kolmafia_.myInebriety)() > (0,external_kolmafia_.inebrietyLimit)()) return;
  (0,external_kolmafia_.refreshStash)();
  var stashRun = (0,external_kolmafia_.stashAmount)((0,dist.$item)(src_templateObject3 || (src_templateObject3 = src_taggedTemplateLiteral(["navel ring of navel gazing"])))) ? (0,dist.$items)(src_templateObject4 || (src_templateObject4 = src_taggedTemplateLiteral(["navel ring of navel gazing"]))) : (0,external_kolmafia_.stashAmount)((0,dist.$item)(src_templateObject5 || (src_templateObject5 = src_taggedTemplateLiteral(["Greatest American Pants"])))) ? (0,dist.$items)(src_templateObject6 || (src_templateObject6 = src_taggedTemplateLiteral(["Greatest American Pants"]))) : [];
  withStash(stashRun, function () {
    gingerbreadPrepNoon();
    latte();
    jellyfish();
    hipsterFishing();
  });
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(src_templateObject7 || (src_templateObject7 = src_taggedTemplateLiteral(["Half a Purse"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(src_templateObject8 || (src_templateObject8 = src_taggedTemplateLiteral(["seal tooth"]))));
  (0,external_kolmafia_.retrieveItem)((0,dist.$item)(src_templateObject9 || (src_templateObject9 = src_taggedTemplateLiteral(["The Jokester's gun"]))));
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(src_templateObject10 || (src_templateObject10 = src_taggedTemplateLiteral(["hobo nickel"])))), (0,dist.$item)(src_templateObject11 || (src_templateObject11 = src_taggedTemplateLiteral(["hobo nickel"]))));
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(src_templateObject12 || (src_templateObject12 = src_taggedTemplateLiteral(["sand dollar"])))), (0,dist.$item)(src_templateObject13 || (src_templateObject13 = src_taggedTemplateLiteral(["sand dollar"]))));
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(src_templateObject14 || (src_templateObject14 = src_taggedTemplateLiteral(["4-d camera"])))), (0,dist.$item)(src_templateObject15 || (src_templateObject15 = src_taggedTemplateLiteral(["4-d camera"]))));
  (0,external_kolmafia_.putCloset)((0,external_kolmafia_.itemAmount)((0,dist.$item)(src_templateObject16 || (src_templateObject16 = src_taggedTemplateLiteral(["unfinished ice sculpture"])))), (0,dist.$item)(src_templateObject17 || (src_templateObject17 = src_taggedTemplateLiteral(["unfinished ice sculpture"]))));
}

function barfTurn() {
  var startTurns = (0,external_kolmafia_.totalTurnsPlayed)();
  horseradish();
  if ((0,dist.have)((0,dist.$effect)(src_templateObject18 || (src_templateObject18 = src_taggedTemplateLiteral(["Beaten Up"]))))) throw "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready.";

  if (dist.SourceTerminal.have()) {
    dist.SourceTerminal.educate([(0,dist.$skill)(src_templateObject19 || (src_templateObject19 = src_taggedTemplateLiteral(["Extract"]))), (0,dist.$skill)(src_templateObject20 || (src_templateObject20 = src_taggedTemplateLiteral(["Digitize"])))]);
  }

  if ((0,dist.have)((0,dist.$item)(src_templateObject21 || (src_templateObject21 = src_taggedTemplateLiteral(["unwrapped knock-off retro superhero cape"])))) && ((0,dist.get)("retroCapeSuperhero") !== "robot" || (0,dist.get)("retroCapeWashingInstructions") !== "kill")) {
    (0,external_kolmafia_.cliExecute)("retrocape robot kill");
  }

  if ((0,dist.have)((0,dist.$item)(src_templateObject22 || (src_templateObject22 = src_taggedTemplateLiteral(["latte lovers member's mug"])))) && (0,dist.get)("_latteRefillsUsed") < 3 && (0,dist.get)("_latteCopyUsed") && (0,dist.get)("latteUnlocks").includes("cajun") && (0,dist.get)("latteUnlocks").includes("rawhide")) {
    var latteIngredients = ["cajun", "rawhide", (0,dist.get)("latteUnlocks").includes("carrot") ? "carrot" : (0,external_kolmafia_.myPrimestat)() === (0,dist.$stat)(src_templateObject23 || (src_templateObject23 = src_taggedTemplateLiteral(["muscle"]))) ? "vanilla" : (0,external_kolmafia_.myPrimestat)() === (0,dist.$stat)(src_templateObject24 || (src_templateObject24 = src_taggedTemplateLiteral(["mysticality"]))) ? "pumpkin spice" : "cinnamon"].join(" ");
    (0,external_kolmafia_.cliExecute)("latte refill ".concat(latteIngredients));
  }

  var embezzlerUp = (0,external_kolmafia_.getCounters)("Digitize Monster", 0, 0).trim() !== ""; // a. set up mood stuff

  meatMood().execute(estimatedTurns());
  safeRestore(); //get enough mp to use summer siesta and enough hp to not get our ass kicked

  var ghostLocation = (0,dist.get)("ghostLocation"); // b. check for wanderers, and do them

  if ((0,dist.have)((0,dist.$item)(src_templateObject25 || (src_templateObject25 = src_taggedTemplateLiteral(["envyfish egg"])))) && !(0,dist.get)("_envyfishEggUsed")) {
    meatOutfit(true);
    (0,combat.withMacro)(combat.Macro.meatKill(), function () {
      return (0,external_kolmafia_.use)((0,dist.$item)(src_templateObject26 || (src_templateObject26 = src_taggedTemplateLiteral(["envyfish egg"]))));
    });
  } else if ((0,external_kolmafia_.myInebriety)() <= (0,external_kolmafia_.inebrietyLimit)() && (0,dist.have)((0,dist.$item)(src_templateObject27 || (src_templateObject27 = src_taggedTemplateLiteral(["protonic accelerator pack"])))) && (0,dist.get)("questPAGhost") !== "unstarted" && ghostLocation) {
    (0,external_kolmafia_.useFamiliar)(freeFightFamiliar());
    freeFightOutfit([new Requirement([], {
      forceEquip: (0,dist.$items)(src_templateObject28 || (src_templateObject28 = src_taggedTemplateLiteral(["protonic accelerator pack"])))
    })]);
    (0,dist.adventureMacro)(ghostLocation, physicalImmuneMacro);
  } else if ((0,external_kolmafia_.myInebriety)() <= (0,external_kolmafia_.inebrietyLimit)() && (0,dist.have)((0,dist.$item)(src_templateObject29 || (src_templateObject29 = src_taggedTemplateLiteral(["\"I Voted!\" sticker"])))) && (0,external_kolmafia_.getCounters)("Vote", 0, 0) !== "" && (0,dist.get)("_voteFreeFights") < 3) {
    (0,external_kolmafia_.useFamiliar)(freeFightFamiliar());
    freeFightOutfit([new Requirement([], {
      forceEquip: (0,dist.$items)(src_templateObject30 || (src_templateObject30 = src_taggedTemplateLiteral(["\"I Voted!\" sticker"])))
    })]);
    (0,dist.adventureMacroAuto)(prepWandererZone(), combat.Macro.step(physicalImmuneMacro).meatKill());
  } else if ((0,external_kolmafia_.myInebriety)() <= (0,external_kolmafia_.inebrietyLimit)() && !embezzlerUp && kramcoGuaranteed()) {
    (0,external_kolmafia_.useFamiliar)(freeFightFamiliar());
    freeFightOutfit([new Requirement([], {
      forceEquip: (0,dist.$items)(src_templateObject31 || (src_templateObject31 = src_taggedTemplateLiteral(["Kramco Sausage-o-Matic\u2122"])))
    })]);
    (0,dist.adventureMacroAuto)(prepWandererZone(), combat.Macro.meatKill());
  } else {
    if ((0,dist.have)((0,dist.$item)(src_templateObject32 || (src_templateObject32 = src_taggedTemplateLiteral(["unwrapped knock-off retro superhero cape"])))) && ((0,dist.get)("retroCapeSuperhero") !== "robot" || (0,dist.get)("retroCapeWashingInstructions") !== "kill")) {
      (0,external_kolmafia_.cliExecute)("retrocape robot kill");
    } // c. set up familiar


    (0,external_kolmafia_.useFamiliar)(meatFamiliar());
    var location = embezzlerUp ? !(0,dist.get)("_envyfishEggUsed") && ((0,external_kolmafia_.booleanModifier)("Adventure Underwater") || waterBreathingEquipment.some(dist.have)) && ((0,external_kolmafia_.booleanModifier)("Underwater Familiar") || familiarWaterBreathingEquipment.some(dist.have)) && ((0,dist.have)((0,dist.$effect)(src_templateObject33 || (src_templateObject33 = src_taggedTemplateLiteral(["Fishy"])))) || (0,dist.have)((0,dist.$item)(src_templateObject34 || (src_templateObject34 = src_taggedTemplateLiteral(["fishy pipe"])))) && !(0,dist.get)("_fishyPipeUsed")) && !(0,dist.have)((0,dist.$item)(src_templateObject35 || (src_templateObject35 = src_taggedTemplateLiteral(["envyfish egg"])))) ? (0,dist.$location)(src_templateObject36 || (src_templateObject36 = src_taggedTemplateLiteral(["The Briny Deeps"]))) : prepWandererZone() : (0,dist.$location)(src_templateObject37 || (src_templateObject37 = src_taggedTemplateLiteral(["Barf Mountain"])));
    var underwater = location === (0,dist.$location)(src_templateObject38 || (src_templateObject38 = src_taggedTemplateLiteral(["The Briny Deeps"])));

    if (underwater) {
      // now fight one underwater
      if ((0,dist.get)("questS01OldGuy") === "unstarted") {
        (0,external_kolmafia_.visitUrl)("place.php?whichplace=sea_oldman&action=oldman_oldman");
      }

      (0,external_kolmafia_.retrieveItem)((0,dist.$item)(src_templateObject39 || (src_templateObject39 = src_taggedTemplateLiteral(["pulled green taffy"]))));
      if (!(0,dist.have)((0,dist.$effect)(src_templateObject40 || (src_templateObject40 = src_taggedTemplateLiteral(["Fishy"]))))) (0,external_kolmafia_.use)((0,dist.$item)(src_templateObject41 || (src_templateObject41 = src_taggedTemplateLiteral(["fishy pipe"]))));
    } // d. get dressed


    meatOutfit(embezzlerUp, [], underwater);
    (0,dist.adventureMacroAuto)(location, combat.Macro.externalIf(underwater, combat.Macro.if_("monsterid ".concat((0,dist.$monster)(src_templateObject42 || (src_templateObject42 = src_taggedTemplateLiteral(["Knob Goblin Embezzler"]))).id), combat.Macro.item("pulled green taffy"))).meatKill(), combat.Macro.if_("(monsterid ".concat((0,dist.$monster)(src_templateObject43 || (src_templateObject43 = src_taggedTemplateLiteral(["Knob Goblin Embezzler"]))).id, ") && !gotjump && !(pastround 2)"), combat.Macro.externalIf(underwater, combat.Macro.item("pulled green taffy")).meatKill()).abort());
  }

  if (Object.keys((0,external_kolmafia_.reverseNumberology)()).includes("69") && (0,dist.get)("_universeCalculated") < (0,dist.get)("skillLevel144")) {
    (0,external_kolmafia_.cliExecute)("numberology 69");
  }

  if ((0,external_kolmafia_.myAdventures)() === 1) {
    if (((0,dist.have)((0,dist.$item)(src_templateObject44 || (src_templateObject44 = src_taggedTemplateLiteral(["magical sausage"])))) || (0,dist.have)((0,dist.$item)(src_templateObject45 || (src_templateObject45 = src_taggedTemplateLiteral(["magical sausage casing"]))))) && (0,dist.get)("_sausagesEaten") < 23) {
      (0,external_kolmafia_.eat)((0,dist.$item)(src_templateObject46 || (src_templateObject46 = src_taggedTemplateLiteral(["magical sausage"]))));
    }
  }

  if ((0,external_kolmafia_.totalTurnsPlayed)() - startTurns === 1 && (0,dist.get)("lastEncounter") === "Knob Goblin Embezzler") if (embezzlerUp) log.digitizedEmbezzlersFought++;else log.initialEmbezzlersFought++;
}

function canContinue() {
  return (0,external_kolmafia_.myAdventures)() > 0 && (globalOptions.stopTurncount === null || (0,external_kolmafia_.myTurncount)() < globalOptions.stopTurncount);
}
function main() {
  var argString = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  (0,dist.sinceKolmafiaRevision)(20767);

  if ((0,dist.get)("valueOfAdventure") <= 3500) {
    throw "Your valueOfAdventure is set to ".concat((0,dist.get)("valueOfAdventure"), ", which is too low for barf farming to be worthwhile. If you forgot to set it, use \"set valueOfAdventure = XXXX\" to set it to your marginal turn meat value.");
  }

  if ((0,dist.get)("valueOfAdventure") >= 10000) {
    throw "Your valueOfAdventure is set to ".concat((0,dist.get)("valueOfAdventure"), ", which is definitely incorrect. Please set it to your reliable marginal turn value.");
  }

  var args = argString.split(" ");

  var _iterator = src_createForOfIteratorHelper(args),
      _step;

  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var arg = _step.value;

      if (arg.match(/\d+/)) {
        globalOptions.stopTurncount = (0,external_kolmafia_.myTurncount)() + parseInt(arg, 10);
      }

      if (arg.match(/ascend/)) {
        globalOptions.ascending = true;
      }
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }

  var gardens = (0,dist.$items)(src_templateObject47 || (src_templateObject47 = src_taggedTemplateLiteral(["packet of pumpkin seeds, Peppermint Pip Packet, packet of dragon's teeth, packet of beer seeds, packet of winter seeds, packet of thanksgarden seeds, packet of tall grass seeds, packet of mushroom spores"])));
  var startingGarden = gardens.find(function (garden) {
    return Object.getOwnPropertyNames((0,external_kolmafia_.getCampground)()).includes(garden.name);
  });

  if (startingGarden && !(0,dist.$items)(src_templateObject48 || (src_templateObject48 = src_taggedTemplateLiteral(["packet of tall grass seeds, packet of mushroom spores"]))).includes(startingGarden) && (0,external_kolmafia_.getCampground)()[startingGarden.name] && (0,dist.$items)(src_templateObject49 || (src_templateObject49 = src_taggedTemplateLiteral(["packet of tall grass seeds, packet of mushroom spores"]))).some(function (gardenSeed) {
    return (0,dist.have)(gardenSeed);
  })) {
    (0,external_kolmafia_.visitUrl)("campground.php?action=garden&pwd");
  }

  var aaBossFlag = (0,external_kolmafia_.xpath)((0,external_kolmafia_.visitUrl)("account.php?tab=combat"), "//*[@id=\"opt_flag_aabosses\"]/label/input[@type='checkbox']@checked")[0] === "checked" ? 1 : 0;

  try {
    (0,external_kolmafia_.print)("Collecting garbage!", "blue");

    if (globalOptions.stopTurncount !== null) {
      (0,external_kolmafia_.print)("Stopping in ".concat(globalOptions.stopTurncount - (0,external_kolmafia_.myTurncount)()), "blue");
    }

    (0,external_kolmafia_.print)();
    if ((0,dist.have)((0,dist.$item)(src_templateObject50 || (src_templateObject50 = src_taggedTemplateLiteral(["packet of tall grass seeds"])))) && (0,external_kolmafia_.myGardenType)() !== "grass" && (0,external_kolmafia_.myGardenType)() !== "mushroom") (0,external_kolmafia_.use)((0,dist.$item)(src_templateObject51 || (src_templateObject51 = src_taggedTemplateLiteral(["packet of tall grass seeds"]))));
    (0,external_kolmafia_.setAutoAttack)(0);
    (0,external_kolmafia_.visitUrl)("account.php?actions[]=flag_aabosses&flag_aabosses=1&action=Update", true);
    propertyManager.set({
      battleAction: "custom combat script",
      autoSatisfyWithMall: true,
      autoSatisfyWithNPCs: true,
      autoSatisfyWithCoinmasters: true,
      dontStopForCounters: true,
      maximizerFoldables: true
    });
    (0,external_kolmafia_.cliExecute)("mood apathetic");
    (0,external_kolmafia_.cliExecute)("ccs garbo");
    safeRestore();

    if (questStep("questM23Meatsmith") === -1) {
      (0,external_kolmafia_.visitUrl)("shop.php?whichshop=meatsmith&action=talk");
      (0,external_kolmafia_.runChoice)(1);
    }

    if (questStep("questM24Doc") === -1) {
      (0,external_kolmafia_.visitUrl)("shop.php?whichshop=doc&action=talk");
      (0,external_kolmafia_.runChoice)(1);
    }

    if (questStep("questM25Armorer") === -1) {
      (0,external_kolmafia_.visitUrl)("shop.php?whichshop=armory&action=talk");
      (0,external_kolmafia_.runChoice)(1);
    }

    if ((0,external_kolmafia_.myClass)() === (0,dist.$class)(src_templateObject52 || (src_templateObject52 = src_taggedTemplateLiteral(["Seal Clubber"]))) && !(0,dist.have)((0,dist.$skill)(src_templateObject53 || (src_templateObject53 = src_taggedTemplateLiteral(["Furious Wallop"])))) && (0,external_kolmafia_.guildStoreAvailable)()) {
      (0,external_kolmafia_.visitUrl)("guild.php?action=buyskill&skillid=32", true);
    }

    var stashItems = (0,dist.$items)(src_templateObject54 || (src_templateObject54 = src_taggedTemplateLiteral(["repaid diaper, Buddy Bjorn, Crown of Thrones, origami pasties, Pantsgiving"])));
    if ((0,external_kolmafia_.myInebriety)() <= (0,external_kolmafia_.inebrietyLimit)() && ((0,external_kolmafia_.myClass)() !== (0,dist.$class)(src_templateObject55 || (src_templateObject55 = src_taggedTemplateLiteral(["Seal Clubber"]))) || !(0,dist.have)((0,dist.$skill)(src_templateObject56 || (src_templateObject56 = src_taggedTemplateLiteral(["Furious Wallop"])))))) stashItems.push((0,dist.$item)(src_templateObject57 || (src_templateObject57 = src_taggedTemplateLiteral(["haiku katana"])))); // FIXME: Dynamically figure out pointer ring approach.

    withStash(stashItems, function () {
      withVIPClan(function () {
        // 0. diet stuff.
        runDiet(); // 1. get a ticket

        ensureBarfAccess(); // 2. make an outfit (amulet coin, pantogram, etc), misc other stuff (VYKEA, songboom, robortender drinks)

        dailySetup();
        (0,dist.setDefaultMaximizeOptions)({
          preventEquip: (0,dist.$items)(src_templateObject58 || (src_templateObject58 = src_taggedTemplateLiteral(["broken champagne bottle, Spooky Putty snake, Spooky Putty mitre, Spooky Putty leotard, Spooky Putty ball, papier-mitre, smoke ball"])))
        }); // 4. do some embezzler stuff

        freeFights();
        dailyFights(); // 5. burn turns at barf

        try {
          while (canContinue()) {
            barfTurn();
          }
        } finally {
          (0,external_kolmafia_.setAutoAttack)(0);
        }
      });
    });
  } finally {
    propertyManager.resetAll();
    (0,external_kolmafia_.visitUrl)("account.php?actions[]=flag_aabosses&flag_aabosses=".concat(aaBossFlag, "&action=Update"), true);
    if (startingGarden && (0,dist.have)(startingGarden)) (0,external_kolmafia_.use)(startingGarden);

    if (questStep("_questPartyFair") > 0) {
      var partyFairInfo = (0,dist.get)("_questPartyFairProgress").split(" ");
      (0,external_kolmafia_.print)("Gerald/ine wants ".concat(partyFairInfo[0], " ").concat((0,external_kolmafia_.toItem)(partyFairInfo[1]).plural, ", please!"), "blue");
    }

    (0,external_kolmafia_.print)("You fought ".concat(log.initialEmbezzlersFought, " KGEs at the beginning of the day, and an additional ").concat(log.digitizedEmbezzlersFought, " digitized KGEs throughout the day. Good work, probably!"), "blue");
  }
}

/***/ }),

/***/ 1664:
/***/ ((module) => {

"use strict";
module.exports = require("kolmafia");;

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = __webpack_module_cache__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/node module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.nmd = (module) => {
/******/ 			module.paths = [];
/******/ 			if (!module.children) module.children = [];
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// module cache are used so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	var __webpack_exports__ = __webpack_require__(__webpack_require__.s = 6391);
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var i in __webpack_exports__) __webpack_export_target__[i] = __webpack_exports__[i];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
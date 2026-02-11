"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = function(target, all) {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = function(to, from, except, desc) {
  if (from && typeof from === "object" || typeof from === "function")
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: function(k) {
          return from[k];
        }.bind(null, key), enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
  return to;
};
var __toCommonJS = function(mod) {
  return __copyProps(__defProp({}, "__esModule", { value: true }), mod);
};

// src/price_garbo.ts
var price_garbo_exports = {};
__export(price_garbo_exports, {
  main: function() {
    return main;
  },
  printPriceOverrideWarning: function() {
    return printPriceOverrideWarning;
  },
  readItemValues: function() {
    return readItemValues;
  },
  writeItemValues: function() {
    return writeItemValues;
  }
});
module.exports = __toCommonJS(price_garbo_exports);
var import_kolmafia = require("kolmafia");
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}
function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e, n, i, u, a = [], f = true, o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = false;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = true) ;
    } catch (r2) {
      o = true, n = r2;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
var FILE_PATH = "garbo_item_values.json";
var quiet = false;
function maybePrint(message) {
  var color = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : void 0;
  if (!quiet) {
    (0, import_kolmafia.print)(message, color);
  }
}
function readItemValues() {
  var itemValuesStr = (0, import_kolmafia.fileToBuffer)(FILE_PATH);
  if (itemValuesStr.length > 0) {
    var val = JSON.parse(itemValuesStr);
    var parsedItems = Object.entries(val).map(function(_ref) {
      var _ref2 = _slicedToArray(_ref, 2), itemStr = _ref2[0], price = _ref2[1];
      return [(0, import_kolmafia.toItem)(itemStr), price];
    });
    return new Map(parsedItems);
  } else {
    return /* @__PURE__ */ new Map();
  }
}
function writeItemValues(itemValues) {
  (0, import_kolmafia.bufferToFile)(JSON.stringify(Object.fromEntries(itemValues)), FILE_PATH);
}
function list() {
  readItemValues().forEach(function(price, item) {
    return (0, import_kolmafia.print)("".concat(item, ": ").concat(price));
  });
}
function add(item, price) {
  var map = readItemValues();
  maybePrint("Adding ".concat(item, " @ ").concat(price, " to your garbo_price_values"));
  map.set(item, price);
  writeItemValues(map);
}
function remove(item) {
  var map = readItemValues();
  maybePrint("Removing ".concat(item, " from your garbo_price_values"));
  map.delete(item);
  writeItemValues(map);
}
function printPriceOverrideWarning() {
  maybePrint("WARNING: You are using garbo item price overrides. This can have unexpected side effects on dieting and adventuring!", "red");
}
function main() {
  var argString = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : "";
  if (argString[0] === "q") {
    quiet = true;
    argString = argString.replace("q", "").trim();
  }
  var parts = argString.split(" ");
  var valid = false;
  var price = 0;
  if (parts.length > 1 && (parts[parts.length - 1].match(/-1/) || parts[parts.length - 1].match(/\d+/))) {
    price = (0, import_kolmafia.toFloat)(parts[parts.length - 1]);
    valid = true;
  }
  var item = (0, import_kolmafia.toItem)(parts.slice(0, -1).join(" "));
  if (item === import_kolmafia.Item.none) {
    valid = false;
  }
  if (argString === "list") {
    list();
  } else if (!valid || argString === "help" || argString === "") {
    printPriceOverrideWarning();
    (0, import_kolmafia.print)("garbo-price: help | list | [item] [price]\n  help: print this help\n  list: print all items and their prices from the file\n  [q?] [item] [price]: add an item to the list @ price (use price of -1 to remove from the list)    q will cause the item message to not print anything when adding or removing items");
  } else if (price === -1) {
    remove(item);
  } else {
    add(item, price);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  main,
  printPriceOverrideWarning,
  readItemValues,
  writeItemValues
});

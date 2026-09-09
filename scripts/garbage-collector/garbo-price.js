'use strict';

var kolmafia = require('kolmafia');

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
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
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var FILE_PATH = "garbo_item_values.json";
var quiet = false;
function maybePrint(message) {
  var color = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
  if (!quiet) {
    kolmafia.print(message, color);
  }
}
function readItemValues() {
  var itemValuesStr = kolmafia.fileToBuffer(FILE_PATH);
  if (itemValuesStr.length > 0) {
    var val = JSON.parse(itemValuesStr);
    var parsedItems = Object.entries(val).map(_ref => {
      var _ref2 = _slicedToArray(_ref, 2),
        itemStr = _ref2[0],
        price = _ref2[1];
      return [kolmafia.toItem(itemStr), price];
    });
    return new Map(parsedItems);
  } else {
    return new Map();
  }
}
function writeItemValues(itemValues) {
  kolmafia.bufferToFile(JSON.stringify(Object.fromEntries(itemValues)), FILE_PATH);
}
function list() {
  readItemValues().forEach((price, item) => kolmafia.print(`${item}: ${price}`));
}
function add(item, price) {
  var map = readItemValues();
  maybePrint(`Adding ${item} @ ${price} to your garbo_price_values`);
  map.set(item, price);
  writeItemValues(map);
}
function remove(item) {
  var map = readItemValues();
  maybePrint(`Removing ${item} from your garbo_price_values`);
  map.delete(item);
  writeItemValues(map);
}
function printPriceOverrideWarning() {
  maybePrint("WARNING: You are using garbo item price overrides. This can have unexpected side effects on dieting and adventuring!", "red");
}
function main() {
  var argString = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "";
  if (argString[0] === "q") {
    quiet = true;
    argString = argString.replace("q", "").trim();
  }
  var parts = argString.split(" ");
  var valid = false;
  var price = 0;
  if (parts.length > 1 && (parts[parts.length - 1].match(/-1/) || parts[parts.length - 1].match(/\d+/))) {
    price = kolmafia.toFloat(parts[parts.length - 1]);
    valid = true;
  }
  var item = kolmafia.toItem(parts.slice(0, -1).join(" "));
  if (item === kolmafia.Item.none) {
    valid = false;
  }
  if (argString === "list") {
    list();
  } else if (!valid || argString === "help" || argString === "") {
    printPriceOverrideWarning();
    kolmafia.print("garbo-price: help | list | [item] [price]\n" + "  help: print this help\n" + "  list: print all items and their prices from the file\n" + "  [q?] [item] [price]: add an item to the list @ price (use price of -1 to remove from the list)" + "    q will cause the item message to not print anything when adding or removing items");
  } else if (price === -1) {
    remove(item);
  } else {
    add(item, price);
  }
}

exports.main = main;
exports.printPriceOverrideWarning = printPriceOverrideWarning;
exports.readItemValues = readItemValues;
exports.writeItemValues = writeItemValues;

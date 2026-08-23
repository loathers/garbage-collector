import { Item, print, toFloat, toItem } from "kolmafia";
import {
  printPriceOverrideWarning,
  readItemValues,
  writeItemValues,
} from "garbo-lib";

let quiet = false;
function maybePrint(message: string, color: string | undefined = undefined) {
  if (!quiet) {
    print(message, color);
  }
}

function list(): void {
  readItemValues().forEach((price, item) => print(`${item}: ${price}`));
}

function add(item: Item, price: number) {
  const map = readItemValues();
  maybePrint(`Adding ${item} @ ${price} to your garbo_price_values`);
  map.set(item, price);
  writeItemValues(map);
}

function remove(item: Item) {
  const map = readItemValues();
  maybePrint(`Removing ${item} from your garbo_price_values`);
  map.delete(item);
  writeItemValues(map);
}

export function main(argString = ""): void {
  if (argString[0] === "q") {
    quiet = true;
    argString = argString.replace("q", "").trim();
  }
  const parts = argString.split(" ");
  let valid = false;
  let price = 0;

  if (
    parts.length > 1 &&
    (parts[parts.length - 1].match(/-1/) ||
      parts[parts.length - 1].match(/\d+/))
  ) {
    price = toFloat(parts[parts.length - 1]);
    valid = true;
  }
  const item = toItem(parts.slice(0, -1).join(" "));
  if (item === Item.none) {
    valid = false;
  }
  if (argString === "list") {
    list();
  } else if (!valid || argString === "help" || argString === "") {
    printPriceOverrideWarning();
    print(
      "garbo-price: help | list | [item] [price]\n" +
        "  help: print this help\n" +
        "  list: print all items and their prices from the file\n" +
        "  [q?] [item] [price]: add an item to the list @ price (use price of -1 to remove from the list)" +
        "    q will cause the item message to not print anything when adding or removing items",
    );
  } else if (price === -1) {
    remove(item);
  } else {
    add(item, price);
  }
}

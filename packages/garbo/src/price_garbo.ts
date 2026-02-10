import {
  bufferToFile,
  fileToBuffer,
  Item,
  print,
  toFloat,
  toItem,
} from "kolmafia";

const FILE_PATH = "garbo_item_values.json";

export function readItemValues(): Map<Item, number> {
  const itemValuesStr = fileToBuffer(FILE_PATH);
  if (itemValuesStr.length > 0) {
    const val: { [item: string]: number } = JSON.parse(itemValuesStr);
    const parsedItems: [Item, number][] = Object.entries(val).map(
      ([itemStr, price]) => [toItem(itemStr), price],
    );
    return new Map<Item, number>(parsedItems);
  } else {
    return new Map<Item, number>();
  }
}
export function writeItemValues(itemValues: Map<Item, number>) {
  bufferToFile(JSON.stringify(Object.fromEntries(itemValues)), FILE_PATH);
}

function list(): void {
  readItemValues().forEach((price, item) => print(`${item}: ${price}`));
}

function add(item: Item, price: number) {
  const map = readItemValues();
  map.set(item, price);
  writeItemValues(map);
}

function remove(item: Item) {
  const map = readItemValues();
  map.delete(item);
  writeItemValues(map);
}

export function main(argString = ""): void {
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
    print(
      "garbo-price: help | list | [item] [price]\n" +
        "  help: print this help\n" +
        "  list: print all items and their prices from the file\n" +
        "  [item] [price]: add an item to the list @ price (use price of -1 to remove from the list)",
    );
  } else if (price === -1) {
    remove(item);
  } else {
    add(item, price);
  }
}

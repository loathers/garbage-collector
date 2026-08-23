import { bufferToFile, fileToBuffer, Item, print, toItem } from "kolmafia";
import { logMessage } from "./log";
import { makeValue, ValueFunctions } from "./value";

const FILE_PATH = "garbo_item_values.json";

let _warningPrinted = false;
/**
 * Prints a one-time warning that garbo price overrides are being used.
 */
export function printPriceOverrideWarning() {
  if (_warningPrinted) return;
  _warningPrinted = true;
  print(
    "WARNING: You are using garbo item price overrides. This can have unexpected side effects on dieting and adventuring!",
    "red",
  );
}

/**
 * Reads the garbo item values override file and parses it into a Map.
 * Returns an empty Map if the file does not exist or is empty.
 */
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

/**
 * Writes a Map of item values to the garbo item values override file.
 * @param itemValues - The Map of items to their override prices.
 */
export function writeItemValues(itemValues: Map<Item, number>) {
  bufferToFile(JSON.stringify(Object.fromEntries(itemValues)), FILE_PATH);
}

let _valueFunctions: ValueFunctions | undefined;
function garboValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    const overrideItemValues = readItemValues();
    if (overrideItemValues.size > 0) {
      printPriceOverrideWarning();
      logMessage("GARBO PRICE OVERRIDES");
      overrideItemValues.forEach((value, item) => {
        logMessage(`${item}: ${value}`);
      });
    }
    _valueFunctions = makeValue({
      itemValues: overrideItemValues,
    });
  }
  return _valueFunctions;
}

/**
 * Returns the garbo value of an item, accounting for price overrides.
 * @param item - The item to get the value of.
 */
export function garboValue(item: Item): number {
  return garboValueFunctions().value(item);
}

/**
 * Returns the average value of multiple items, accounting for price overrides.
 * @param items - The items to average the value of.
 */
export function garboAverageValue(...items: Item[]): number {
  return garboValueFunctions().averageValue(...items);
}

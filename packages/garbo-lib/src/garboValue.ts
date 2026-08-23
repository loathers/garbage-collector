import { bufferToFile, fileToBuffer, Item, print, toItem } from "kolmafia";
import { $item } from "libram";
import { logMessage } from "./log";
import { makeValue, ValueFunctions } from "./value";

const FILE_PATH = "garbo_item_values.json";

let _warningPrinted = false;
export function printPriceOverrideWarning() {
  if (_warningPrinted) return;
  _warningPrinted = true;
  print(
    "WARNING: You are using garbo item price overrides. This can have unexpected side effects on dieting and adventuring!",
    "red",
  );
}

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

let _valueFunctions: ValueFunctions | undefined;
function garboValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    const itemValues = new Map([[$item`fake hand`, 50_000]]);
    const overrideItemValues = readItemValues();
    if (overrideItemValues.size > 0) {
      printPriceOverrideWarning();
      logMessage("GARBO PRICE OVERRIDES");
      overrideItemValues.forEach((value, item) => {
        logMessage(`${item}: ${value}`);
        itemValues.set(item, value);
      });
    }
    _valueFunctions = makeValue({
      itemValues,
    });
  }
  return _valueFunctions;
}

export function garboValue(item: Item): number {
  return garboValueFunctions().value(item);
}

export function garboAverageValue(...items: Item[]): number {
  return garboValueFunctions().averageValue(...items);
}

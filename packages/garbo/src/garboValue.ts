import { Item } from "kolmafia";
import { $item } from "libram";
import { logMessage, makeValue, ValueFunctions } from "garbo-lib";
import { printPriceOverrideWarning, readItemValues } from "./price_garbo";

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

import { Item } from "kolmafia";
import { makeKnuckleboneValue, makeValue, ValueFunctions } from "garbo-lib";

import { $item } from "libram";
import { printPriceOverrideWarning, readItemValues } from "./price_garbo";
import { printLog } from "./log";

type GarboValueFunctions = ValueFunctions & {
  knuckleboneValue: () => number;
};

let _valueFunctions: GarboValueFunctions | undefined;
function garboValueFunctions(): GarboValueFunctions {
  if (!_valueFunctions) {
    const itemValues = new Map([[$item`fake hand`, 50_000]]);
    const overrideItemValues = readItemValues();
    if (overrideItemValues.size > 0) {
      printPriceOverrideWarning();
      printLog("GARBO PRICE OVERRIDES");
      overrideItemValues.forEach((value, item) => {
        printLog(`${item}: ${value}`);
        itemValues.set(item, value);
      });
    }
    const valueFunctions = makeValue({ itemValues });
    valueFunctions.value($item`knucklebone`); // Freeze the accounting value at initialization
    const boneOverride = itemValues.get($item`knucklebone`);
    _valueFunctions = {
      ...valueFunctions,
      knuckleboneValue:
        boneOverride === undefined
          ? makeKnuckleboneValue(valueFunctions.value)
          : () => boneOverride,
    };
  }
  return _valueFunctions;
}

export function garboValue(item: Item): number {
  return garboValueFunctions().value(item);
}

export function garboAverageValue(...items: Item[]): number {
  return garboValueFunctions().averageValue(...items);
}

export function garboKnuckleboneValue(): number {
  return garboValueFunctions().knuckleboneValue();
}

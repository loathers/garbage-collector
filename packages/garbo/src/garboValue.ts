import { Item } from "kolmafia";
import { makeValue, ValueFunctions } from "garbo-lib";

import { $item } from "libram";
import { readItemValues } from "./price_garbo";

let _valueFunctions: ValueFunctions | undefined;
function garboValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    const itemValues = new Map([[$item`fake hand`, 50_000]]);
    readItemValues().forEach((value, item) => itemValues.set(item, value));
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

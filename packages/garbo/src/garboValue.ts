import { fileToBuffer, Item, toItem } from "kolmafia";
import { makeValue, ValueFunctions } from "garbo-lib";

import { $item } from "libram";

let _valueFunctions: ValueFunctions | undefined;
function garboValueFunctions(): ValueFunctions {
  if (!_valueFunctions) {
    const itemValuesStr = fileToBuffer("garbo_item_values.json");
    const itemValues = new Map([[$item`fake hand`, 50_000]]);
    if (itemValuesStr.length > 0) {
      const val: { [item: string]: number } = JSON.parse(itemValuesStr);
      const parsedItems: [Item, number][] = Object.entries(val.items).map(
        ([itemStr, quantity]) => [toItem(itemStr), quantity],
      );
      parsedItems.forEach((e) => itemValues.set(e[0], e[1]));
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

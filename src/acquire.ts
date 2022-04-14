import {
  cliExecute,
  closetAmount,
  Item,
  itemAmount,
  mallPrice,
  print,
  retrieveItem,
  shopAmount,
  storageAmount,
  takeCloset,
  takeShop,
  takeStorage,
} from "kolmafia";
import { get, withProperties } from "libram";

const priceCaps: { [index: string]: number } = {
  "cuppa Voraci tea": 200000,
  "cuppa Sobrie tea": 200000,
  "potion of the field gar": 50000,
  "Special Seasoning": 20000,
  "spice melange": 500000,
  "mojo filter": 10000,
  "Ol' Scratch's salad fork": 200000,
  "Frosty's frosty mug": 200000,
  "sweet tooth": 200000,
};

export function acquire(qty: number, item: Item, maxPrice?: number, throwOnFail = true): number {
  if (maxPrice === undefined) maxPrice = priceCaps[item.name];
  if (!item.tradeable || (maxPrice !== undefined && maxPrice <= 0)) return 0;
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;

  print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");

  if (qty * mallPrice(item) > 1000000) throw "Aggregate cost too high! Probably a bug.";

  const startAmount = itemAmount(item);

  let remaining = qty - startAmount;
  if (remaining <= 0) return qty;

  const logError = (target: Item, source: string) => {
    throw `Failed to remove ${target} from ${source}`;
  };

  if (get("autoSatisfyWithCloset")) {
    const getCloset = Math.min(remaining, closetAmount(item));
    if (!takeCloset(getCloset, item) && throwOnFail) logError(item, "closet");
    remaining -= getCloset;
    if (remaining <= 0) return qty;
  }

  const getStorage = Math.min(remaining, storageAmount(item));
  if (!takeStorage(getStorage, item) && throwOnFail) logError(item, "storage");
  remaining -= getStorage;
  if (remaining <= 0) return qty;

  let getMall = Math.min(remaining, shopAmount(item));
  if (!takeShop(getMall, item)) {
    cliExecute("refresh shop");
    cliExecute("refresh inventory");
    remaining = qty - itemAmount(item);
    getMall = Math.min(remaining, shopAmount(item));
    if (!takeShop(getMall, item) && throwOnFail) logError(item, "shop");
  }
  remaining -= getMall;
  if (remaining <= 0) return qty;

  if (maxPrice <= 0) throw `buying disabled for ${item.name}.`;

  withProperties(
    {
      autoBuyPriceLimit: maxPrice,
    },
    () => retrieveItem(qty, item)
  );
  if (itemAmount(item) < qty && throwOnFail) throw `Mall price too high for ${item.name}.`;
  return itemAmount(item) - startAmount;
}

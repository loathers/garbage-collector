import {
  buy,
  cliExecute,
  closetAmount,
  Coinmaster,
  Item,
  itemAmount,
  mallPrice,
  print,
  retrieveItem,
  sellPrice,
  sellsItem,
  shopAmount,
  storageAmount,
  takeCloset,
  takeShop,
  takeStorage,
} from "kolmafia";
import { get, withProperty } from "libram";
import { garboValue } from "./garboValue";

export const priceCaps: { [index: string]: number } = {
  "cuppa Voraci tea": 200000,
  "cuppa Sobrie tea": 200000,
  "potion of the field gar": 50000,
  "Special Seasoning": 20000,
  "mini kiwi aioli": 20000,
  "whet stone": 20000,
  "spice melange": 500000,
  "mojo filter": 20000,
  "Ol' Scratch's salad fork": 200000,
  "Frosty's frosty mug": 200000,
  "sweet tooth": 250000,
};

export function acquire(
  qty: number,
  item: Item,
  maxPrice?: number,
  throwOnFail = true,
  maxAggregateCost?: number,
  tryRetrievingUntradeable = false,
): number {
  if (maxPrice === undefined) maxPrice = priceCaps[item.name];
  if (
    (!item.tradeable && !tryRetrievingUntradeable) ||
    (maxPrice !== undefined && maxPrice <= 0)
  ) {
    return 0;
  }
  if (maxPrice === undefined) throw new Error(`No price cap for ${item.name}.`);

  print(
    `Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(
      0,
    )}.`,
    "green",
  );

  if (qty * mallPrice(item) > (maxAggregateCost ?? 1000000)) {
    throw new Error("Aggregate cost too high! Probably a bug.");
  }

  const startAmount = itemAmount(item);

  let remaining = qty - startAmount;
  if (remaining <= 0) return qty;

  const logError = (target: Item, source: string) => {
    throw new Error(`Failed to remove ${target} from ${source}`);
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
  const coinmaster = Coinmaster.all().find((cm) => sellsItem(cm, item));
  const coinmasterPrice = coinmaster
    ? garboValue(coinmaster.item) * sellPrice(coinmaster, item)
    : 0;
  if (coinmaster && coinmasterPrice > mallPrice(item)) {
    buy(item, remaining, maxPrice);
  } else {
    withProperty("autoBuyPriceLimit", maxPrice, () => retrieveItem(item, qty));
  }
  if (itemAmount(item) < qty && throwOnFail) {
    throw new Error(
      `Failed to purchase sufficient quantities of ${item} from the mall.`,
    );
  }

  return itemAmount(item) - startAmount;
}

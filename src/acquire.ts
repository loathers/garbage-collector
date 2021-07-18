import {
  buy,
  cliExecute,
  closetAmount,
  itemAmount,
  mallPrice,
  print,
  shopAmount,
  storageAmount,
  takeCloset,
  takeShop,
  takeStorage,
} from "kolmafia";

const priceCaps: { [index: string]: number } = {
  "jar of fermented pickle juice": 75000,
  "Frosty's frosty mug": 50000,
  "extra-greasy slider": 45000,
  "Ol' Scratch's salad fork": 50000,
  "transdermal smoke patch": 8000,
  "voodoo snuff": 36000,
  "antimatter wad": 24000,
  "octolus oculus": 12000,
  "blood-drive sticker": 210000,
  "spice melange": 500000,
  "splendid martini": 20000,
  "Eye and a Twist": 20000,
  "jumping horseradish": 20000,
  "Ambitious Turkey": 20000,
  "Special Seasoning": 20000,
};

export function acquire(qty: number, item: Item, maxPrice?: number, throwOnFail = true): void {
  if (maxPrice === undefined) maxPrice = priceCaps[item.name];
  if (maxPrice === undefined) throw `No price cap for ${item.name}.`;

  print(`Trying to acquire ${qty} ${item.plural}; max price ${maxPrice.toFixed(0)}.`, "green");

  if (qty * mallPrice(item) > 1000000) throw "bad get!";

  let remaining = qty - itemAmount(item);
  if (remaining <= 0) return;

  const getCloset = Math.min(remaining, closetAmount(item));
  if (!takeCloset(getCloset, item) && throwOnFail) throw "failed to remove from closet";
  remaining -= getCloset;
  if (remaining <= 0) return;

  const getStorage = Math.min(remaining, storageAmount(item));
  if (!takeStorage(getStorage, item) && throwOnFail) throw "failed to remove from storage";
  remaining -= getStorage;
  if (remaining <= 0) return;

  let getMall = Math.min(remaining, shopAmount(item));
  if (!takeShop(getMall, item)) {
    cliExecute("refresh shop");
    cliExecute("refresh inventory");
    remaining = qty - itemAmount(item);
    getMall = Math.min(remaining, shopAmount(item));
    if (!takeShop(getMall, item) && throwOnFail) throw "failed to remove from shop";
  }
  remaining -= getMall;
  if (remaining <= 0) return;

  buy(remaining, item, maxPrice);
  if (itemAmount(item) < qty && throwOnFail) throw `Mall price too high for ${item.name}.`;
}

import {
  autosellPrice,
  getInventory,
  mallPrice,
  mySessionMeat,
  toItem,
  print,
  mySessionItems,
} from "kolmafia";
import { sumNumbers, getSaleValue, $item } from "libram";

function mySessionItemsWrapper(): Map<Item, number> {
  // const inventory = new Map<Item, number>();
  const inventory: [Item, number][] = Object.entries(mySessionItems()).map(
    ([itemStr, quantity]) => [toItem(itemStr), quantity]
  );
  return new Map(inventory);
}
function inventoryDifference(a: Map<Item, number>, b: Map<Item, number>): Map<Item, number> {
  // return every entry that is in a and not in b
  const difference = new Map<Item, number>();
  for (const [item, quantity] of a.entries()) {
    const diff = quantity - (b.get(item) ?? 0);
    if (diff !== 0) {
      difference.set(item, quantity - (b.get(item) ?? 0));
    }
  }
  return difference;
}

interface ItemDetail {
  item: Item;
  value: number;
  quantity: number;
}
interface ItemResult {
  meat: number;
  items: number;
  total: number;
  itemDetails: ItemDetail[];
}

class Snapshot {
  meat: number;
  items: Map<Item, number>;
  constructor(meat?: number, items?: Map<Item, number>) {
    this.meat = meat ?? mySessionMeat();
    this.items = items ?? mySessionItemsWrapper();
  }

  value(itemValue: (item: Item) => number): ItemResult {
    // TODO: add garbo specific pricing (sugar equipment for synth, etc.)

    const meat = this.meat;
    const itemDetails = [...this.items.entries()].map(([item, quantity]) => {
      return { item, quantity, value: itemValue(item) * quantity };
    });
    const items = sumNumbers(itemDetails.map((detail) => detail.value));

    return { meat, items, total: meat + items, itemDetails };
  }
  print(price: (item: Item) => number): void {
    const value = this.value(price);
    const printProfit = (details: ItemDetail[]) => {
      for (const { item, quantity, value } of details) {
        print(`  ${item} (${quantity}) @ ${value}`);
      }
    };
    const lowValue = value.itemDetails.filter((detail) => detail.value < 0);
    const highValue = value.itemDetails.filter((detail) => detail.value > 0);

    print(`Total Snapshot Value: ${value.total}`);
    print(`Of that, ${value.meat} came from meat and ${value.items} came from items`);
    print(` You gained meat on ${highValue.length} items including:`);
    printProfit(highValue);
    print(` You lost meat on ${lowValue.length} items including:`);
    printProfit(lowValue);
  }

  difference(other: Snapshot): Snapshot {
    return new Snapshot(this.meat - other.meat, inventoryDifference(this.items, other.items));
  }
  static difference(a: Snapshot, b: Snapshot): Snapshot {
    return a.difference(b);
  }
}

function specialValue(item: Item): number {
  // todo: provide a more dynamic computation of what is worth it
  if (item === $item`Freddy Kruegerand`) {
    return Math.max(
      getSaleValue($item`bottle of Bloodweiser`) / 200,
      getSaleValue($item`electric Kool-Aid`) / 200,
      getSaleValue($item`Dreadsylvanian skeleton key`) / 25
    );
  } else if (item === $item`Beach Buck`) {
    return garboValue($item`one-day ticket to Spring Break Beach`) / 100;
  } else if (item === $item`Coinspiracy`) {
    return Math.max(
      getSaleValue($item`one-day ticket to Conspiracy Island`) / 100,
      getSaleValue($item`karma shawarma`) / 7
    );
  } else if (item === $item`FunFunds™`) {
    return getSaleValue($item`one-day ticket to Dinseylandfill`) / 20;
  } else if (item === $item`Volcoino`) {
    return getSaleValue($item`one-day ticket to That 70s Volcano`) / 3;
  } else if (item === $item`Wal-Mart gift certificate`) {
    return getSaleValue($item`one-day ticket to The Glaciest`) / 50;
  } else if (item === $item`Rubee™`) {
    return getSaleValue($item`FantasyRealm guest pass`) / 350;
  } else if (item === $item`Guzzlrbuck`) {
    return getSaleValue($item`Never Don't Stop Not Striving`) / 1000;
  }
  return -1;
}

export function garboValue(...items: Item[]) {
  const specialValueItems = items.filter((item) => specialValue(item) >= 0);
  const saleValueItems = items.filter((item) => specialValue(item) < 0);

  return (
    getSaleValue(...saleValueItems) + sumNumbers(specialValueItems.map((i) => specialValue(i)))
  );
}

let snapshot: Snapshot | null = null;
export function startSnapshot(): void {
  snapshot = new Snapshot();
}

export function printSnapshot(): void {
  if (snapshot) {
    new Snapshot().difference(snapshot).print(getSaleValue);
  }
}

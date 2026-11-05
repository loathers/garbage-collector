import {
  canAdventure,
  dailySpecial,
  Item,
  mallPrice,
  npcPrice,
  print,
  retrievePrice,
  use,
} from "kolmafia";
import {
  $item,
  $items,
  $locations,
  get,
  have,
  MayoClinic,
  MenuItem,
} from "libram";
import { acquire } from "../acquire";
import { HIGHLIGHT } from "../lib";
import { PotionTier } from "../potions";
import { GarboWorkshed } from "../tasks/post/worksheds";

export const MPA = get("valueOfAdventure");

print(`Using adventure value ${MPA}.`, HIGHLIGHT);

export const Mayo = MayoClinic.Mayo;

type NoodleTier = `${PotionTier} (noodle-doubled)`;

export type Note = PotionTier | NoodleTier | null;

/**
 * Pastas of legend lead to Legendary Digestion when eaten; we'll have to handle the choice.
 */
export const LEGENDARY_DIGESTION_CHOICE_ID = 1599;

export const LEGENDARY_DIGESTION_STOMACH = 5;

export const legendaryNoodleDishes = $items`Frutti di Scatoletta, Pesto alla Marziano, Arrattabbattabiata, Orzo di Riso, Pasta Grimavera, Linguini Ubriacapa, Gnocci Domani, Formica e Pepe, Tubetto Gelatto`;

export const isNoodleTier = (data: Note | undefined): data is NoodleTier =>
  !!data?.endsWith("(noodle-doubled)");

export function existingNoodleCharges(): number {
  return get("legendaryNoodlesStomach");
}

export function hasMoonZoneRestaurant(): boolean {
  return $locations`Camp Logging Camp, Thugnderdome`.some((loc) =>
    canAdventure(loc),
  );
}

export function availableFromMoonZoneRestaurant(item: Item) {
  return hasMoonZoneRestaurant() && dailySpecial() === item;
}

function propTrue(prop: string | boolean) {
  if (typeof prop === "boolean") {
    return prop as boolean;
  } else {
    return get(prop);
  }
}

export function useIfUnused(
  item: Item,
  prop: string | boolean,
  maxPrice: number,
) {
  if (!propTrue(prop)) {
    if (mallPrice(item) <= maxPrice) {
      acquire(1, item, maxPrice, false);
      if (!have(item)) return;
      use(1, item);
    } else {
      print(
        `Skipping ${item.name}; too expensive (${mallPrice(
          item,
        )} > ${maxPrice}).`,
      );
    }
  }
}

export const saladFork = $item`Ol' Scratch's salad fork`;

export const frostyMug = $item`Frosty's frosty mug`;

export const spleenCleaners = new Map([
  [$item`extra-greasy slider`, 5],
  [$item`jar of fermented pickle juice`, 5],
  [$item`mojo filter`, 1],
]);

export const stomachLiverCleaners = new Map([
  [$item`spice melange`, [-3, -3]],
  [$item`synthetic dog hair pill`, [0, -1]],
  [$item`cuppa Sobrie tea`, [0, -1]],
  [$item`designer sweatpants`, [0, -1]],
  [$item`august scepter`, [-1, 0]],
  [$item`Mr. Burnsger`, [4, -2]],
  [$item`Doc Clock's thyme cocktail`, [-2, 4]],
  [$item`The Plumber's mushroom stew`, [3, -1]],
  [$item`The Mad Liquor`, [-1, 3]],
]);

export type Organ = "food" | "booze" | "spleen item";

function dailySpecialPrice(item: Item) {
  if (!hasMoonZoneRestaurant() || item !== get("_dailySpecial")) return 0;
  return get("_dailySpecialPrice");
}

MenuItem.defaultPriceFunction = (item: Item) => {
  const prices = [
    retrievePrice(item),
    mallPrice(item),
    npcPrice(item),
    dailySpecialPrice(item),
  ].filter((p) => p > 0 && p < Number.MAX_SAFE_INTEGER);
  if (prices.length > 0) {
    return Math.min(...prices);
  }
  return !item.tradeable && have(item) ? 0 : Infinity;
};

const PRE_DIET_WORKSHEDS = [
  undefined,
  ...$items`Asdon Martin keyfob (on ring), TakerSpace letter of Marque, spinning wheel`,
];

export function switchingToMayo(): boolean {
  return (
    GarboWorkshed.next?.workshed === $item`portable Mayo Clinic` &&
    (PRE_DIET_WORKSHEDS.includes(GarboWorkshed.current?.workshed) ||
      !!GarboWorkshed.current?.canRemove())
  );
}

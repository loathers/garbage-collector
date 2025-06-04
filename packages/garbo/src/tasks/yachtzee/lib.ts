import {
  $effect,
  $item,
  CinchoDeMayo,
  clamp,
  get,
  getModifier,
  have,
  maxBy,
} from "libram";
import { globalOptions } from "../../config";
import {
  canEquip,
  Effect,
  equippedItem,
  haveEffect,
  haveEquipped,
  Item,
  toSlot,
} from "kolmafia";
import { waterBreathingEquipment } from "../../outfit";
import { felizValue } from "../../lib";

export function cinchNCs(): number {
  return CinchoDeMayo.have()
    ? Math.floor(CinchoDeMayo.totalAvailableCinch() / 60)
    : 0;
}

export function cinchYachtzeeProfitable(): boolean {
  // A yachtzee costs a turn and gives us 20k meat for 60 cinch, projectile pinata costs 5 cinch and gets us 3 feliz candies
  return 20000 - get("valueOfAdventure") > 12 * 3 * felizValue();
}

// These NCs do not require us to enter combat to activate them
export const freeNCs = (): number =>
  (have($item`Clara's bell`) && !globalOptions.clarasBellClaimed ? 1 : 0) +
  (cinchYachtzeeProfitable() ? cinchNCs() : 0) +
  (have($item`Apriling band tuba`)
    ? $item`Apriling band tuba`.dailyusesleft
    : 0);

export function maximumYachtzees(): number {
  return clamp(
    freeNCs(),
    0,
    haveEffect($effect`Fishy`) +
      (have($item`fishy pipe`) && !get("_fishyPipeUsed") ? 10 : 0) +
      (get("skateParkStatus") === "ice" && !get("_skateBuff1") ? 30 : 0),
  );
}

export function yachtzeeBuffValue(obj: Item | Effect): number {
  return clamp(
    (2000 *
      (getModifier("Meat Drop", obj) +
        getModifier("Familiar Weight", obj) * 2.5)) /
      100,
    0,
    20000,
  );
}

export function getBestWaterBreathingEquipment(yachtzeeTurns: number): {
  item: Item;
  cost: number;
} {
  const waterBreathingEquipmentCosts = waterBreathingEquipment.map((it) => ({
    item: it,
    cost:
      have(it) && canEquip(it)
        ? yachtzeeTurns * yachtzeeBuffValue(equippedItem(toSlot(it)))
        : Infinity,
  }));
  const bestWaterBreathingEquipment = waterBreathingEquipment.some((item) =>
    haveEquipped(item),
  )
    ? { item: $item.none, cost: 0 }
    : maxBy(waterBreathingEquipmentCosts, "cost", true);
  return bestWaterBreathingEquipment;
}

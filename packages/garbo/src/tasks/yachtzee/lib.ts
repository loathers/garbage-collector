import { $item, clamp, getModifier, have, maxBy } from "libram";
import {
  canEquip,
  Effect,
  equippedItem,
  haveEquipped,
  Item,
  toSlot,
} from "kolmafia";
import { waterBreathingEquipment } from "../../outfit";

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

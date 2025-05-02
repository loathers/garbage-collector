import {
  canEquip,
  equip,
  equippedItem,
  haveEquipped,
  Item,
  myFamiliar,
  toSlot,
  use,
  useFamiliar,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $slot,
  get,
  getModifier,
  have,
  maxBy,
  Requirement,
} from "libram";
import { withStash } from "../clan";
import {
  familiarWaterBreathingEquipment,
  waterBreathingEquipment,
} from "../outfit";
import { bestYachtzeeFamiliar } from "./familiar";
import { yachtzeeBuffValue } from "./lib";

export const maximizeMeat = (): boolean =>
  new Requirement(
    [
      "meat",
      ...(myFamiliar().underwater ||
      have($effect`Driving Waterproofly`) ||
      have($effect`Wet Willied`)
        ? []
        : ["underwater familiar"]),
    ],
    {
      preventEquip: $items`anemoney clip, cursed magnifying glass, Kramco Sausage-o-Matic™, cheap sunglasses`,
    },
  ).maximize();

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

export function prepareOutfitAndFamiliar(): void {
  useFamiliar(bestYachtzeeFamiliar());
  if (
    !get("_feastedFamiliars").includes(myFamiliar().toString()) &&
    get("_feastedFamiliars").split(";").length < 5
  ) {
    withStash($items`moveable feast`, () => use($item`moveable feast`));
  }
  maximizeMeat();
  if (!myFamiliar().underwater) {
    equip(
      $slot`familiar`,
      maxBy(
        familiarWaterBreathingEquipment.filter((it) => have(it)),
        (eq) => getModifier("Familiar Weight", eq),
      ),
    );
  }
}

import {
  canEquip,
  equip,
  equippedItem,
  haveEquipped,
  Item,
  mallPrice,
  myFamiliar,
  numericModifier,
  toSlot,
  use,
  useFamiliar,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $slot,
  $slots,
  findLeprechaunMultiplier,
  get,
  have,
  Requirement,
} from "libram";
import { acquire } from "../acquire";
import { withStash } from "../clan";
import { meatFamiliar } from "../familiar";
import { baseMeat } from "../lib";
import { familiarWaterBreathingEquipment, useUPCs, waterBreathingEquipment } from "../outfit";
import { bestYachtzeeFamiliar } from "./familiar";
import { expectedEmbezzlers, yachtzeeBuffValue } from "./lib";

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
    }
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
  const bestWaterBreathingEquipment = waterBreathingEquipment.some((item) => haveEquipped(item))
    ? { item: $item.none, cost: 0 }
    : waterBreathingEquipmentCosts.reduce((left, right) => (left.cost < right.cost ? left : right));
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
      familiarWaterBreathingEquipment
        .filter((it) => have(it))
        .reduce((a, b) =>
          numericModifier(a, "Familiar Weight") > numericModifier(b, "Familiar Weight") ? a : b
        )
    );
  }
}

export function stickerSetup(expectedYachts: number): void {
  const currentStickers = $slots`sticker1, sticker2, sticker3`.map((s) => equippedItem(s));
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if (currentStickers.every((sticker) => sticker === UPC)) return;
  const yachtOpportunityCost = 25 * findLeprechaunMultiplier(bestYachtzeeFamiliar());
  const embezzlerOpportunityCost = 25 * findLeprechaunMultiplier(meatFamiliar());
  const addedValueOfFullSword =
    ((75 - yachtOpportunityCost) * expectedYachts * 2000) / 100 +
    ((75 - embezzlerOpportunityCost) * Math.min(20, expectedEmbezzlers) * (750 + baseMeat)) / 100;
  if (mallPrice(UPC) < addedValueOfFullSword / 3) {
    const needed = 3 - currentStickers.filter((sticker) => sticker === UPC).length;
    if (needed) acquire(needed, UPC, addedValueOfFullSword / 3, false);
    useUPCs();
  }
}

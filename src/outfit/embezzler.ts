import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { canEquip, toJson } from "kolmafia";
import { $item, $items, $location, have } from "libram";
import { meatFamiliar } from "../familiar";
import { chooseBjorn } from "./bjorn";
import { bonusGear } from "./dropsgear";
import {
  bestBjornalike,
  BonusEquipMode,
  cleaverCheck,
  familiarWaterBreathingEquipment,
  useUPCsIfNeeded,
  validateGarbageFoldable,
  valueOfMeat,
  waterBreathingEquipment,
} from "./lib";

export function embezzlerOutfit(spec: OutfitSpec = {}, target = $location.none): Outfit {
  cleaverCheck();
  validateGarbageFoldable(spec);
  const outfit = Outfit.from(
    spec,
    new Error(`Failed to construct outfit from spec ${toJson(spec)}`)
  );


  outfit.modifier.push(`${valueOfMeat(BonusEquipMode.EMBEZZLER)} Meat Drop`, "-tie");
  outfit.familiar ??= meatFamiliar();

  const bjornChoice = chooseBjorn(BonusEquipMode.EMBEZZLER, outfit.familiar);

  const underwater = target.environment === "underwater";
  if (underwater) {
    if (!outfit.familiar.underwater) {
      const familiarEquip = familiarWaterBreathingEquipment.find((item) => have(item));
      if (familiarEquip) outfit.equip(familiarEquip);
    }

    const airEquip = waterBreathingEquipment.find((item) => have(item) && canEquip(item));
    if (!airEquip || !outfit.equip(airEquip)) outfit.modifier.push("sea");
  }

  useUPCsIfNeeded(outfit);

  outfit.bonuses = bonusGear(BonusEquipMode.EMBEZZLER);
  const bjornalike = bestBjornalike(outfit);

  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
    outfit.equip(bjornalike);
    const other = $items`Buddy Bjorn, Crown of Thrones`.filter((i) => i !== bjornalike)[0];
    outfit.avoid.push(other);
    switch (bjornalike) {
      case $item`Buddy Bjorn`:
        outfit.bjornify(bjornChoice.familiar);
        break;
      case $item`Crown of Thrones`:
        outfit.bjornify(bjornChoice.familiar);
        break;
    }
  }

  outfit.setModes({
    snowsuit: "nose",
    parka: "kachungasaur",
    edpiece: "fish",
  });

  return outfit;
}

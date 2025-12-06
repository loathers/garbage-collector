import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  Environment,
  Guzzlr,
  have,
} from "libram";
import { freeFightFamiliar, meatFamiliar } from "../familiar";
import { chooseBjorn } from "./bjorn";
import { bonusGear, toyCupidBow } from "./dropsgear";
import {
  applyCheeseBonus,
  bestBjornalike,
  cleaverCheck,
  familiarWaterBreathingEquipment,
  useUPCsIfNeeded,
  validateGarbageFoldable,
  waterBreathingEquipment,
} from "./lib";
import {
  BonusEquipMode,
  modeValueOfMeat,
  songboomMeat,
  targetingMeat,
} from "../lib";
import { globalOptions } from "../config";
import { Location, meatDrop } from "kolmafia";
import { shouldRedigitize } from "../combat";

export function meatTargetOutfit(
  spec: OutfitSpec = {},
  location?: Location,
): Outfit {
  cleaverCheck();
  validateGarbageFoldable(spec);
  const outfit = Outfit.from(
    spec,
    new Error(`Failed to construct outfit from spec ${JSON.stringify(spec)}`),
  );

  if (location === $location`Crab Island`) {
    const meat = meatDrop($monster`giant giant crab`) + songboomMeat();
    outfit.modifier.push(`${meat / 100} Meat Drop`, "-tie");
  } else if (
    location === $location`Cobb's Knob Treasury` &&
    have($effect`Lucky!`)
  ) {
    const meat = meatDrop($monster`Knob Goblin Embezzler`) + songboomMeat();
    outfit.modifier.push(`${meat / 100} Meat Drop`, "-tie");
  } else if (targetingMeat()) {
    outfit.modifier.push(
      `${modeValueOfMeat(BonusEquipMode.MEAT_TARGET)} Meat Drop`,
      "-tie",
    );
  } else if (globalOptions.target.attributes.includes("FREE")) {
    outfit.modifier.push("-tie");
  }
  applyCheeseBonus(
    outfit,
    targetingMeat() ? BonusEquipMode.MEAT_TARGET : BonusEquipMode.FREE,
  );
  outfit.avoid.push($item`cheap sunglasses`); // Even if we're adventuring in Barf Mountain itself, these are bad
  outfit.familiar ??= targetingMeat()
    ? meatFamiliar()
    : freeFightFamiliar(location ?? globalOptions.target, {
        equipmentForced: !outfit.canEquip($item`toy Cupid bow`),
      });

  const bjornChoice = chooseBjorn(
    targetingMeat() ? BonusEquipMode.MEAT_TARGET : BonusEquipMode.FREE,
    outfit.familiar,
  );

  const underwater = location?.environment === "underwater";
  if (underwater) {
    if (!outfit.familiar.underwater) {
      outfit.equipFirst(familiarWaterBreathingEquipment);
    }

    if (!outfit.equipFirst(waterBreathingEquipment)) {
      outfit.modifier.push("sea");
    }
  }

  if (outfit.familiar === $familiar`Jill-of-All-Trades`) {
    outfit.equip($item`LED candle`);
    outfit.setModes({ jillcandle: "ultraviolet" });
  }

  if (outfit.familiar === $familiar`Skeleton of Crimbo Past`) {
    outfit.equip($item`small peppermint-flavored sugar walking crook`);
  }

  useUPCsIfNeeded(outfit);

  outfit.addBonuses(
    bonusGear(
      targetingMeat() ? BonusEquipMode.MEAT_TARGET : BonusEquipMode.FREE,
    ),
  );

  if (!targetingMeat()) outfit.addBonuses(toyCupidBow(outfit.familiar));

  const bjornalike = bestBjornalike(outfit);

  if (
    location === Guzzlr.getLocation() &&
    Guzzlr.turnsLeftOnQuest(false) === 1 &&
    Guzzlr.haveBooze()
  ) {
    outfit.addBonus(
      $item`Guzzlr pants`,
      Guzzlr.expectedReward(true) - Guzzlr.expectedReward(false),
    );
  }

  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
    outfit.equip(bjornalike);
    const other = $items`Buddy Bjorn, Crown of Thrones`.filter(
      (i) => i !== bjornalike,
    )[0];
    outfit.avoid.push(other);
    switch (bjornalike) {
      case $item`Buddy Bjorn`:
        outfit.bjornify(bjornChoice.familiar);
        break;
      case $item`Crown of Thrones`:
        outfit.enthrone(bjornChoice.familiar);
        break;
    }
  }

  outfit.setModes({
    snowsuit: "nose",
    parka: "kachungasaur",
    edpiece: "fish",
  });

  if (
    !have($effect`Everything Looks Purple`) &&
    location?.environment !== Environment.Underwater &&
    !shouldRedigitize()
  ) {
    outfit.equip($item`Roman Candelabra`);
  }

  return outfit;
}

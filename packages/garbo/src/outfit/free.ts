import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { Familiar, Location } from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  Delayed,
  get,
  Guzzlr,
  SourceTerminal,
  undelay,
} from "libram";
import { WanderDetails } from "garbo-lib";

import { FamiliarMenuOptions, freeFightFamiliar } from "../familiar";
import { BonusEquipMode, MEAT_TARGET_MULTIPLIER, sober } from "../lib";
import { wanderer } from "../garboWanderer";

import { chooseBjorn } from "./bjorn";
import { bonusGear, toyCupidBow } from "./dropsgear";
import { applyCheeseBonus, cleaverCheck, validateGarbageFoldable } from "./lib";
import {
  adventuresPerSweat,
  mimicExperienceNeeded,
  turnsNeededForNextAdventure,
} from "../resources";
import { globalOptions } from "../config";
import { estimatedGarboTurns } from "../turns";

const famExpValue = new Map<Familiar, Delayed<number>>([
  [
    $familiar`Chest Mimic`,
    () =>
      $familiar`Chest Mimic`.experience < mimicExperienceNeeded(true)
        ? (MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50
        : 0,
  ],
  [
    $familiar`Pocket Professor`,
    () =>
      $familiar`Pocket Professor`.experience < 400 &&
      (!get("_thesisDelivered") || !globalOptions.ascend)
        ? (11 * get("valueOfAdventure")) / 200
        : 0,
  ],
  [
    $familiar`Grey Goose`,
    () =>
      $familiar`Grey Goose`.experience < 400 &&
      (!get("_meatifyMatterUsed") || !globalOptions.ascend)
        ? 15 ** 4 / 400
        : 0,
  ],
]);

export type FreeFightOutfitMenuOptions = {
  location?: Location;
  duplicate?: boolean;
  wanderOptions?: WanderDetails;
  familiarOptions?: FamiliarMenuOptions;
};
export function freeFightOutfit(
  spec: OutfitSpec = {},
  options: FreeFightOutfitMenuOptions = {},
): Outfit {
  cleaverCheck();

  const computedSpec = computeOutfitSpec(spec, options);

  validateGarbageFoldable(computedSpec);
  const outfit = Outfit.from(
    computedSpec,
    new Error(`Failed to construct outfit from spec ${JSON.stringify(spec)}!`),
  );

  outfit.familiar ??= freeFightFamiliar(
    computeFamiliarMenuOptions(
      options.familiarOptions,
      options.duplicate ?? false,
      outfit,
    ),
  );
  const mode =
    options.location === $location`The Deep Machine Tunnels`
      ? BonusEquipMode.DMT
      : BonusEquipMode.FREE;

  if (outfit.familiar !== $familiar`Patriotic Eagle`) {
    const familiarExpValue = undelay(famExpValue.get(outfit.familiar));

    outfit.modifier.push(
      familiarExpValue
        ? `${familiarExpValue} Familiar Experience`
        : "Familiar Weight",
    );
  }

  const bjornChoice = chooseBjorn(mode, outfit.familiar);

  if (get("_vampyreCloakeFormUses") < 10) {
    outfit.setBonus($item`vampyric cloake`, 500);
  }

  outfit.addBonuses(bonusGear(mode));
  applyCheeseBonus(outfit, mode);

  if (
    !(globalOptions.ascend && !sober()) &&
    turnsNeededForNextAdventure() <= estimatedGarboTurns()
  ) {
    outfit.setBonus(
      $item`tiny stillsuit`,
      get("valueOfAdventure") * 2 * adventuresPerSweat(),
    );
  }

  if (mode !== BonusEquipMode.DMT) {
    outfit.addBonuses(toyCupidBow(outfit.familiar));
  }

  if (
    computeLocation(options) === Guzzlr.getLocation() &&
    Guzzlr.turnsLeftOnQuest(false) === 1 &&
    Guzzlr.haveBooze()
  ) {
    outfit.addBonus(
      $item`Guzzlr pants`,
      Guzzlr.expectedReward(true) - Guzzlr.expectedReward(false),
    );
  }

  const bjornalike = $items`Crown of Thrones, Buddy Bjorn`.find((item) =>
    outfit.canEquip(item),
  );
  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
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
    parka: "dilophosaur",
  });

  return outfit;
}

function computeOutfitSpec(
  spec: OutfitSpec,
  options: FreeFightOutfitMenuOptions,
): OutfitSpec {
  if (options.wanderOptions) {
    return {
      ...spec,
      equip: [
        ...(spec.equip ?? []),
        ...wanderer().getEquipment(options.wanderOptions),
      ],
    };
  }
  return spec;
}

function computeLocation(
  options: FreeFightOutfitMenuOptions,
): Location | undefined {
  if (options.location) {
    return options.location;
  }
  if (options.wanderOptions) {
    return wanderer().getTarget(options.wanderOptions).location;
  }
  return undefined;
}

function computeFamiliarMenuOptions(
  options: FamiliarMenuOptions = {},
  duplicate: boolean,
  outfit: Outfit,
): FamiliarMenuOptions {
  return {
    ...options,
    allowAttackFamiliars:
      options.allowAttackFamiliars ??
      !(
        duplicate &&
        SourceTerminal.have() &&
        SourceTerminal.duplicateUsesRemaining() > 0
      ),
    equipmentForced:
      options.equipmentForced || !outfit.canEquip($item`toy Cupid bow`),
  };
}

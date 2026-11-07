import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { Familiar, Location, setLocation } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  Delayed,
  get,
  Guzzlr,
  have,
  MonodentOfTheSea,
  SourceTerminal,
  undelay,
} from "libram";

import {
  FamiliarMenuOptions,
  freeFightFamiliar,
} from "../familiar/freeFightFamiliar";
import {
  CombatOutcomes,
  combatOutcomeWeight,
  MEAT_TARGET_MULTIPLIER,
} from "../lib";
import { AdventureArgument, toAdventure, wanderer } from "../garboWanderer";

import { chooseBjorn } from "./bjorn";
import { bonusGear, toyCupidBow } from "./dropsgear";
import {
  applyCheeseBonus,
  BonusEquipMode,
  cleaverCheck,
  validateGarbageFoldable,
} from "./lib";
import { mimicExperienceNeeded } from "../resources/chestMimic";
import { stillsuitBonus } from "../resources/stillsuit";
import { globalOptions } from "../config";
import { experienceChargingValue } from "../familiar/experienceFamiliars";
import { shouldAvoidTemporaryCupidBowSwap } from "../familiar/toyCupidBowValue";

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
        ? experienceChargingValue($familiar`Grey Goose`, "free")
        : 0,
  ],
]);

export type FreeFightOutfitMenuOptions = {
  duplicate?: boolean;
  outcomes?: CombatOutcomes;
  familiarOptions?: Omit<FamiliarMenuOptions, "outcomes">;
  // Remaining fights in a stint that requires a familiar from the spec or wanderer plan.
  combatCount?: number;
};
export function freeFightOutfit(
  spec: OutfitSpec = {},
  adventure: AdventureArgument,
  options: FreeFightOutfitMenuOptions = {},
): Outfit {
  cleaverCheck();

  const { location, wanderTarget } = toAdventure(adventure);
  setLocation(location);

  const computedSpec = computeOutfitSpec(spec, location);
  if (wanderTarget && wanderTarget.familiar !== $familiar.none) {
    computedSpec.familiar = wanderTarget.familiar;
  }

  validateGarbageFoldable(computedSpec);
  const outfit = Outfit.from(
    computedSpec,
    new Error(`Failed to construct outfit from spec ${JSON.stringify(spec)}!`),
  );

  if (wanderTarget) {
    if (wanderTarget.peridotMonster !== $monster.none) {
      outfit.equip($item`Peridot of Peril`);
    }
    if (wanderTarget.useRefractedGaze) {
      outfit.equip($item`blood cubic zirconia`);
    }
    if (wanderTarget.useFeesh) outfit.equip($item`Monodent of the Sea`);
  }

  if (location.environment === "underwater") outfit.modifier.push("+sea");
  if (MonodentOfTheSea.waveZone() === location && !have($effect`Fishy`)) {
    outfit.equip($item`Monodent of the Sea`);
  }

  const requiredFamiliar = outfit.familiar;
  const outcomes =
    options.outcomes ??
    (options.familiarOptions?.mode === "run" ? "run" : "win");
  const winWeight = combatOutcomeWeight(outcomes, ["win"]);
  outfit.familiar ??= freeFightFamiliar(
    adventure,
    computeFamiliarMenuOptions(
      { ...options.familiarOptions, outcomes },
      options.duplicate ?? false,
      outfit,
    ),
  );
  const mode =
    location === $location`The Deep Machine Tunnels`
      ? BonusEquipMode.DMT
      : BonusEquipMode.FREE;

  if (outfit.familiar !== $familiar`Patriotic Eagle`) {
    const familiarExpValue =
      (undelay(famExpValue.get(outfit.familiar)) ?? 0) * winWeight;

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

  outfit.addBonuses(bonusGear(mode, { outcomes }));
  applyCheeseBonus(outfit, mode);

  outfit.setBonus($item`tiny stillsuit`, stillsuitBonus());

  if (mode !== BonusEquipMode.DMT) {
    if (
      requiredFamiliar &&
      options.combatCount !== undefined &&
      !outfit.haveEquipped($item`toy Cupid bow`) &&
      shouldAvoidTemporaryCupidBowSwap(requiredFamiliar, options.combatCount)
    ) {
      outfit.avoid.push($item`toy Cupid bow`);
    } else {
      outfit.addBonuses(toyCupidBow(outfit, adventure));
    }
  }

  if (
    location === Guzzlr.getLocation() &&
    Guzzlr.turnsLeftOnQuest(false) === 1 &&
    Guzzlr.haveBooze()
  ) {
    outfit.addBonus(
      $item`Guzzlr pants`,
      (Guzzlr.expectedReward(true) - Guzzlr.expectedReward(false)) * winWeight,
    );
  }

  const bjornalike = $items`Crown of Thrones, Buddy Bjorn`.find((item) =>
    outfit.canEquip(item),
  );
  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value * winWeight);
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

function computeOutfitSpec(spec: OutfitSpec, location: Location): OutfitSpec {
  return {
    ...spec,
    equip: [...(spec.equip ?? []), ...wanderer().getEquipment(location)],
  };
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

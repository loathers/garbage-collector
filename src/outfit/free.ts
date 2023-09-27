import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { Location, toJson } from "kolmafia";
import { $familiar, $familiars, $item, $items, get, Guzzlr } from "libram";
import { freeFightFamiliar } from "../familiar";
import { chooseBjorn } from "./bjorn";
import { bonusGear } from "./dropsgear";
import { cleaverCheck, validateGarbageFoldable } from "./lib";
import { BonusEquipMode } from "../lib";
import { DraggableFight, WanderOptions } from "../wanderer";
import { wanderer } from "../garboWanderer";

type MenuOptions = {
  canChooseMacro?: boolean;
  location?: Location;
  includeExperienceFamiliars?: boolean;
  allowAttackFamiliars?: boolean;
  wanderOptions?: DraggableFight | WanderOptions;
};
export function freeFightOutfit(spec: OutfitSpec = {}, options: MenuOptions = {}): Outfit {
  cleaverCheck();

  const { wanderOptions } = options;
  const wanderedSpec: OutfitSpec = wanderOptions
    ? {
        ...spec,
        equip: [...(spec.equip ?? []), ...wanderer().getEquipment(wanderOptions)],
      }
    : spec;

  validateGarbageFoldable(wanderedSpec);
  const outfit = Outfit.from(
    wanderedSpec,
    new Error(`Failed to construct outfit from spec ${toJson(spec)}!`),
  );

  outfit.familiar ??= freeFightFamiliar(options);
  const mode =
    outfit.familiar === $familiar`Machine Elf` ? BonusEquipMode.DMT : BonusEquipMode.FREE;

  if (outfit.familiar !== $familiar`Patriotic Eagle`) {
    outfit.modifier.push(
      $familiars`Pocket Professor, Grey Goose`.includes(outfit.familiar)
        ? "Familiar Experience"
        : "Familiar Weight",
    );
  }

  const bjornChoice = chooseBjorn(mode, outfit.familiar);

  if (get("_vampyreCloakeFormUses") < 10) outfit.setBonus($item`vampyric cloake`, 500);
  bonusGear(mode).forEach((value, item) => outfit.addBonus(item, value));

  if (outfit.familiar !== $familiar`Grey Goose`) outfit.setBonus($item`tiny stillsuit`, 500);

  if (
    options.location === Guzzlr.getLocation() &&
    Guzzlr.turnsLeftOnQuest(false) === 1 &&
    Guzzlr.haveBooze()
  ) {
    outfit.addBonus(
      $item`Guzzlr pants`,
      Guzzlr.expectedReward(true) - Guzzlr.expectedReward(false),
    );
  }

  const bjornalike = $items`Crown of Thrones, Buddy Bjorn`.find((item) => outfit.canEquip(item));
  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
    const other = $items`Buddy Bjorn, Crown of Thrones`.filter((i) => i !== bjornalike)[0];
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

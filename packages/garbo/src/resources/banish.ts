import { Item, myClass, myFury, Skill } from "kolmafia";
import {
  $class,
  $item,
  $monster,
  $skill,
  get,
  getBanishedMonsters,
  have,
} from "libram";
import { farmingStrategy, getMonstersToBanish } from "../farmingStrategy";
import { Macro } from "../combat";

export type BanishMethod = {
  available: () => boolean;
  macro: Macro;
  source: Skill | Item;
  equip?: Item;
  retrieve?: boolean;
};

const banishMethods: BanishMethod[] = [
  {
    source: $skill`Spring Kick`,
    available: () => have($item`spring shoes`),
    macro: Macro.trySkill($skill`Spring Kick`).trySkill($skill`Spring Away`),
    equip: $item`spring shoes`,
  },
  {
    source: $skill`Batter Up!`,
    available: () =>
      myClass() === $class`Seal Clubber` &&
      have($skill`Batter Up!`) &&
      myFury() >= 5,
    macro: Macro.trySkill($skill`Batter Up!`),
    equip: $item`seal-clubbing club`,
  },
  {
    source: $skill`Order a Kneecapping`,
    available: () =>
      have($skill`Order a Kneecapping`) && !get("_kneecappingOrdered"),
    macro: Macro.trySkill($skill`Order a Kneecapping`),
  },
  {
    source: $item`human musk`,
    available: () => true,
    macro: Macro.tryItem($item`human musk`),
    retrieve: true,
  },
  {
    source: $skill`Sea *dent: Throw a Lightning Bolt`,
    available: () =>
      have($item`Monodent of the Sea`) && get("_seadentLightningUsed", 0) < 11,
    equip: $item`Monodent of the Sea`,
    macro: Macro.trySkill($skill`Sea *dent: Throw a Lightning Bolt`),
  },
];

export function chooseBanish(): BanishMethod | null {
  if (getMonstersToBanish(farmingStrategy().monstersToBanish).length === 0) {
    return null;
  }

  const banishedMonsters = getBanishedMonsters();

  return (
    banishMethods.find(
      (method) =>
        method.available() &&
        !farmingStrategy().monstersToBanish.includes(
          banishedMonsters.get(method.source) ?? $monster.none,
        ),
    ) ?? null
  );
}

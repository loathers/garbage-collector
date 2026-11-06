import { Item, myClass, myFury, Skill } from "kolmafia";
import {
  $class,
  $item,
  $monster,
  $skill,
  get,
  getBanishedMonsters,
  have,
  MonodentOfTheSea,
} from "libram";
import { FarmingStrategy } from "../farmingStrategy";
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
    source: MonodentOfTheSea.skills.ThrowALightningBolt,
    available: () => MonodentOfTheSea.lightningBoltsRemaining() > 0,
    equip: $item`Monodent of the Sea`,
    macro: Macro.trySkill(MonodentOfTheSea.skills.ThrowALightningBolt),
  },
];

const banishAvailable = (method: BanishMethod) =>
  method.available() &&
  !FarmingStrategy.banishMonsters.includes(
    getBanishedMonsters().get(method.source) ?? $monster.none,
  );

export function chooseBanish(): BanishMethod | null {
  if (FarmingStrategy.monstersToBanish().length === 0) {
    return null;
  }

  const banishedMonsters = getBanishedMonsters();
  const targetMonster = FarmingStrategy.primaryMonster();

  // If a preceding script banished our target, reuse that banish first.
  return (
    banishMethods.find(
      (method) =>
        banishAvailable(method) &&
        banishedMonsters.get(method.source) === targetMonster,
    ) ??
    // Otherwise use FIFO.
    banishMethods.find(banishAvailable) ??
    null
  );
}

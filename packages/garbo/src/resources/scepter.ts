import {
  canEquip,
  Item,
  myLevel,
  myMeat,
  Skill,
  toSlot,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  AugustScepter,
  clamp,
  get,
  getModifier,
  have,
} from "libram";
import { globalOptions } from "../config";
import { garboAverageValue, garboValue } from "../garboValue";
import { getBestLuckyAdventure } from "../lib";
import { effectValue, Potion } from "../potions";
import { GarboTask } from "../tasks/engine";
import { highMeatMonsterCount } from "../turns";

type ScepterSkill = {
  skill: Skill;
  value: () => number;
  type: "special" | "summon" | "buff" | "fight";
};
const SKILL_OPTIONS: ScepterSkill[] = [
  // August 1 deliberately omitted; does not trigger on monster replacers
  {
    skill: $skill`Aug. 2nd: Find an Eleven-Leaf Clover Day`,
    value: () => getBestLuckyAdventure().value(),
    type: "special",
  },
  {
    skill: $skill`Aug. 3rd: Watermelon Day!`,
    value: () => garboValue($item`watermelon`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 4th: Water Balloon Day!`,
    value: () => 3 * garboValue($item`water balloon`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 5th: Oyster Day!`,
    value: () =>
      3 *
      garboAverageValue(
        ...$items`brilliant oyster egg, gleaming oyster egg, glistening oyster egg, lustrous oyster egg, magnificent oyster egg, pearlescent oyster egg, scintillating oyster egg`,
      ),
    type: "summon",
  },
  {
    skill: $skill`Aug. 7th: Lighthouse Day!`,
    value: () => effectValue($effect`Incredibly Well Lit`, 30),
    type: "buff",
  },
  {
    skill: $skill`Aug. 8th: Cat Day!`,
    value: () => globalOptions.prefs.valueOfFreeFight,
    type: "fight",
  },
  {
    skill: $skill`Aug. 13th: Left/Off Hander's Day!`,
    value: () =>
      new Potion($item`august scepter`, {
        effect: $effect`Offhand Remarkable`,
        duration: 30,
        effectValues: { meatDrop: 80 }, // Half a purse
      }).gross(highMeatMonsterCount("Scepter")) +
      (globalOptions.ascend
        ? 0
        : (5 + (have($familiar`Left-Hand Man`) ? 5 : 0)) *
          get("valueOfAdventure")),
    type: "special", // Don't want to cast right away
  },
  {
    skill: $skill`Aug. 14th: Financial Awareness  Day!`,
    value: () => Math.min(100 * myLevel(), 1500, myMeat()) / 2,
    type: "summon",
  },
  {
    skill: $skill`Aug. 16th: Roller Coaster Day!`,
    value: () => 8 * get("valueOfAdventure"),
    type: "special",
  },
  {
    skill: $skill`Aug. 18th: Serendipity Day!`,
    value: () => 3000, // Dummy value; we should some day calculate this based on free fight count, careful to avoid circular imports
    type: "buff",
  },
  {
    skill: $skill`Aug. 22nd: Tooth Fairy Day!`,
    value: () => globalOptions.prefs.valueOfFreeFight,
    type: "fight",
  },
  {
    skill: $skill`Aug. 24th: Waffle Day!`,
    value: () => 3 * garboValue($item`waffle`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 25th: Banana Split Day!`,
    value: () => garboValue($item`banana split`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 26th: Toilet Paper Day!`,
    value: () => garboValue($item`handful of toilet paper`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 29th: More Herbs, Less Salt  Day!`,
    value: () => 3 * garboValue($item`Mrs. Rush`),
    type: "summon",
  },
  {
    skill: $skill`Aug. 30th: Beach Day!`,
    value: () =>
      100 +
      (globalOptions.ascend
        ? 0
        : clamp(
            7 -
              getModifier(
                "Adventures",
                Item.all()
                  .filter(
                    (i) => have(i) && toSlot(i) === $slot`acc1` && canEquip(i),
                  )
                  .sort(
                    (a, b) =>
                      getModifier("Adventures", b) -
                      getModifier("Adventures", a),
                  )[2] ?? $item.none,
              ),
            0,
            7,
          ) * get("valueOfAdventure")),
    type: "summon",
  },
  {
    skill: $skill`Aug. 31st: Cabernet Sauvignon  Day!`,
    value: () => 2 * garboValue($item`bottle of Cabernet Sauvignon`),
    type: "summon",
  },
];

let bestScepterSkills: ScepterSkill[] | null = null;
function getBestScepterSkills(): ScepterSkill[] {
  return (bestScepterSkills ??= SKILL_OPTIONS.filter(
    ({ skill }) =>
      AugustScepter.todaysSkill() !== skill && skill.dailylimit > 0,
  )
    .sort((a, b) => b.value() - a.value())
    .splice(0, clamp(5 - get("_augSkillsCast"), 0, 5)));
}

export function shouldAugustCast(skill: Skill) {
  return (
    AugustScepter.have() &&
    ((getBestScepterSkills().some((s) => skill === s.skill) &&
      skill.dailylimit &&
      get("_augSkillsCast") < 5) ||
      (AugustScepter.todaysSkill() === skill &&
        !AugustScepter.getTodayCast() &&
        skill.dailylimit >= 1))
  );
}

function summonTask({ skill }: ScepterSkill): GarboTask {
  return {
    name: skill.name,
    completed: () => !shouldAugustCast(skill),
    do: () => useSkill(skill),
    spendsTurn: false,
  };
}

export function augustSummonTasks(): GarboTask[] {
  return AugustScepter.have()
    ? SKILL_OPTIONS.filter(({ type }) => type === "summon").map(summonTask)
    : [];
}

export function castAugustScepterBuffs() {
  if (AugustScepter.have()) {
    for (const { skill } of SKILL_OPTIONS.filter(
      ({ skill, type }) => shouldAugustCast(skill) && type === "buff",
    )) {
      useSkill(skill);
    }

    const today = SKILL_OPTIONS.find(
      ({ skill, type }) =>
        type === "buff" && skill === AugustScepter.todaysSkill(),
    );
    if (today && !AugustScepter.getTodayCast()) useSkill(today.skill);

    if (
      globalOptions.ascend &&
      shouldAugustCast($skill`Aug. 13th: Left/Off Hander's Day!`)
    ) {
      useSkill($skill`Aug. 13th: Left/Off Hander's Day!`);
    }
  }
}

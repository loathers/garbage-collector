import { canAdventure, Item } from "kolmafia";
import { $item, $location, get, have, maxBy } from "libram";
import { garboValue } from "../../garboValue";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { AlternateTask } from "../engine";

export function arrrborDayTasks(): AlternateTask[] {
  const arrrborDayOffhand = new Map([
    [
      $item`bag of Crotchety Pine saplings`,
      $item`handful of Crotchety Pine needles`,
    ],
    [
      $item`bag of Saccharine Maple saplings`,
      $item`lump of Saccharine Maple sap`,
    ],
    [
      $item`bag of Laughing Willow saplings`,
      $item`handful of Laughing Willow bark`,
    ],
  ]);

  function arrrborDayHaveSapling(): boolean {
    return [...arrrborDayOffhand.keys()].some((i) => have(i));
  }

  const partial = {
    do: () => $location`The Arrrboretum`,
    outfit: () => {
      return {
        modifier: "MP Regen",
        bonuses: new Map(
          [...arrrborDayOffhand.entries()].map(([key, value]) => [
            key,
            garboValue(value),
          ]),
        ),
      };
    },
    choices: () => {
      const bestOffhand = maxBy([...arrrborDayOffhand.keys()], (i) =>
        have(i) ? 0 : garboValue(arrrborDayOffhand.get(i) ?? Item.none),
      );
      const choice = [...arrrborDayOffhand.keys()].indexOf(bestOffhand) + 1;
      return { 209: choice, 210: 1, 438: 1, 458: 1 };
    },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "Unexpected combat while attempting The Arrrboretum adventure",
      ),
    ),
    sobriety: "sober",
    spendsTurn: true,
    turns: 2, // Each task could take up to 2 turns if a sapling was planted last Arrrbor Day
    limit: { skip: 2 }, // Cannot get another sapling by ascending and will always encounter Plant a Tree, Plant a Tree!
  } satisfies Partial<AlternateTask>;

  return [
    {
      ...partial,
      name: `Arrrbor Day: Acquire Sapling`,
      completed: () => arrrborDayHaveSapling(),
      ready: () =>
        canAdventure($location`The Arrrboretum`) &&
        !have($item`Underworld acorn`),
    },
    {
      ...partial,
      name: `Arrrbor Day: Plant Sapling`,
      completed: () => get("_saplingsPlanted") > 0,
      ready: () =>
        canAdventure($location`The Arrrboretum`) &&
        arrrborDayHaveSapling() &&
        !have($item`Underworld acorn`),
    },
  ];
}

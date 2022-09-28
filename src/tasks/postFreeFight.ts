import { Task } from "grimoire-kolmafia";
import { cliExecute, mallPrice, myClass, myThrall, use, useSkill } from "kolmafia";
import { $class, $item, $skill, $thrall, get, have } from "libram";
import { baseMeat } from "../lib";
import { estimatedTurns } from "../turns";

function bestVykeaLevel(): number {
  const vykeas: [number, number][] = [
    [1, 0],
    [2, 1],
    [3, 11],
  ]; // excluding 4 and 5 as per bean's suggestion
  const vykeaProfit = (level: number, cost: number) =>
    estimatedTurns() * baseMeat * 0.1 * level -
    (5 * mallPrice($item`VYKEA rail`) +
      cost * mallPrice($item`VYKEA dowel`) +
      5 * mallPrice($item`VYKEA plank`) +
      1 * mallPrice($item`VYKEA instructions`));

  if (vykeas.some(([level, cost]) => vykeaProfit(level, cost) > 0)) {
    return vykeas.sort((a, b) => vykeaProfit(...b) - vykeaProfit(...a))[0][0];
  }
  return 0;
}

export const PostFreeFightTasks: Task[] = [
  {
    name: "Configure Vykea",
    ready: () => get("_VYKEACompanionLevel") === 0 && bestVykeaLevel() > 0,
    completed: () => get("_VYKEACompanionLevel") > 0,
    do: () => cliExecute(`create level ${bestVykeaLevel()} couch`),
    acquire: [{ item: $item`VYKEA hex key` }],
  },
  {
    name: "Configure Thrall",
    ready: () => myClass() === $class`Pastamancer` && have($skill`Bind Lasagmbie`),
    completed: () => myThrall() === $thrall`Lasagmbie`,
    do: () => useSkill($skill`Bind Lasagmbie`),
  },
  {
    name: "Level Up Thrall",
    ready: () =>
      myClass() === $class`Pastamancer` &&
      have($item`experimental carbon fiber pasta additive`) &&
      myThrall() !== $thrall.none,
    completed: () => get("_pastaAdditive") || myThrall().level >= 10,
    do: () => use($item`experimental carbon fiber pasta additive`),
  },
];

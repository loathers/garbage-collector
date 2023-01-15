import { Task } from "grimoire-kolmafia";
import { cliExecute, mallPrice, myClass, myThrall, use, useSkill } from "kolmafia";
import { $class, $item, $skill, $thrall, get, have } from "libram";
import { baseMeat, maxBy } from "../lib";
import { estimatedTurns } from "../turns";

function bestVykeaLevel(): number {
  const vykeas = [
    { level: 1, dowelCost: 0 },
    { level: 2, dowelCost: 1 },
    { level: 3, dowelCost: 11 },
  ]; // excluding 4 and 5 as per bean's suggestion
  const vykeaProfit = (vykea: { level: number; dowelCost: number }) => {
    const { level, dowelCost } = vykea;
    return (
      estimatedTurns() * baseMeat * 0.1 * level -
      (5 * mallPrice($item`VYKEA rail`) +
        dowelCost * mallPrice($item`VYKEA dowel`) +
        5 * mallPrice($item`VYKEA plank`) +
        1 * mallPrice($item`VYKEA instructions`))
    );
  };

  if (vykeas.some((vykea) => vykeaProfit(vykea) > 0)) {
    return maxBy(vykeas, vykeaProfit).level;
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

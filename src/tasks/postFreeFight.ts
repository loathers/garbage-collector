import { Task } from "grimoire-kolmafia";
import { myClass, myThrall, use, useSkill } from "kolmafia";
import { $class, $item, $skill, $thrall, get, have } from "libram";

export const PostFreeFightTasks: Task[] = [
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

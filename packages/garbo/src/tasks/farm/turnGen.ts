import {
  eat,
  inebrietyLimit,
  maximize,
  myAdventures,
  myInebriety,
  use,
} from "kolmafia";
import { $item, $skill, DesignerSweatpants } from "libram";
import { GarboTask } from "../engine";
import { Quest } from "grimoire-kolmafia";
import { globalOptions } from "../../config";
import { computeDiet, consumeDiet } from "../../diet";
import { howManySausagesCouldIEat } from "../../lib";

const TurnGenTasks: GarboTask[] = [
  {
    name: "Sausage",
    ready: () => myAdventures() <= 1 + globalOptions.saveTurns,
    completed: () => howManySausagesCouldIEat() === 0,
    prepare: () => maximize("MP", false),
    do: () => eat(howManySausagesCouldIEat(), $item`magical sausage`),
    spendsTurn: false,
  },
  {
    name: "Sweatpants",
    ready: () =>
      !globalOptions.nodiet &&
      DesignerSweatpants.canUseSkill($skill`Sweat Out Some Booze`) &&
      myInebriety() > 0 &&
      myAdventures() <= 1 + globalOptions.saveTurns,
    completed: () =>
      $skill`Sweat Out Some Booze`.dailylimit === 0 ||
      myInebriety() -
        DesignerSweatpants.potentialCasts($skill`Sweat Out Some Booze`) >
        inebrietyLimit(),
    do: () => {
      while (
        DesignerSweatpants.canUseSkill($skill`Sweat Out Some Booze`) &&
        myInebriety() > 0
      ) {
        DesignerSweatpants.useSkill($skill`Sweat Out Some Booze`);
      }
      consumeDiet(computeDiet().sweatpants(), "SWEATPANTS");
    },
    spendsTurn: false,
  },
  {
    name: "Law of Averages",
    ready: () => myAdventures() <= Math.min(1 + globalOptions.saveTurns, 199),
    completed: () => $item`Law of Averages`.dailyusesleft === 0,
    do: () => use($item`Law of Averages`),
    spendsTurn: false,
  },
];

export const TurnGenQuest: Quest<GarboTask> = {
  name: "Turn Gen",
  tasks: TurnGenTasks,
};

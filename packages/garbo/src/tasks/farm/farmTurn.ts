import { have } from "libram";
import { myAdventures, myLocation } from "kolmafia";
import { $effect, CrepeParachute } from "libram";
import { Quest } from "grimoire-kolmafia";

import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";
import { farmingStrategy } from "../../lib";

export const FarmTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: [
    {
      name: "Parachute",
      ready: () =>
        CrepeParachute.have() &&
        shouldCheckParachute() &&
        myLocation() === farmingStrategy().location(),
      completed: () => have($effect`Everything looks Beige`),
      outfit: () => farmingStrategy().outfit(),
      do: () => CrepeParachute.fight(farmingStrategy().targetMonster()),
      combat: farmingStrategy().combat(),
      prepare: () => farmingStrategy().prepare(),
      post: () => {
        if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
        farmingStrategy().post();
      },
      spendsTurn: true,
    },
    {
      name: "Farm",
      ready: () => myLocation() === farmingStrategy().location(),
      completed: () => myAdventures() === 0,

      prepare: () => farmingStrategy().prepare(),

      outfit: () => farmingStrategy().outfit(),

      do: () => farmingStrategy().location,

      combat: farmingStrategy().combat(),

      post: () => farmingStrategy().post(),

      spendsTurn: true,
    },
  ],
  completed: () => !canContinue(),
};

import { $item, have } from "libram";
import { myAdventures, myLocation, retrieveItem } from "kolmafia";
import { $effect, CrepeParachute } from "libram";
import { Quest } from "grimoire-kolmafia";

import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";
import { farmingStrategy } from "../../farmingStrategy";
import { trackMarginalMpa } from "../../session";
import postCombatActions from "../../post";
import { getCowoMonstersToBanish, redTaffyWorth } from "../../resources/banish";
import { meatMood } from "../../mood";
import { estimatedGarboTurns } from "../../turns";

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
      post: () => {
        if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
        trackMarginalMpa();
        postCombatActions();
      },
      spendsTurn: true,
    },
    {
      name: "Farm",
      ready: () => myLocation() === farmingStrategy().location(),
      completed: () => myAdventures() === 0,

      prepare: () => {
          if (redTaffyWorth() && farmingStrategy().location().environment === "underwater") {
            retrieveItem($item`pulled red taffy`);
          }
          meatMood().execute(estimatedGarboTurns());

          if (getCowoMonstersToBanish().length > 0) {
            retrieveItem($item`human musk`);
          }
      },

      outfit: () => farmingStrategy().outfit(),

      do: () => farmingStrategy().location(),

      combat: farmingStrategy().combat(),

      post: () => {
        trackMarginalMpa();
        postCombatActions();
      },

      spendsTurn: true,
    },
  ],
  completed: () => !canContinue(),
};

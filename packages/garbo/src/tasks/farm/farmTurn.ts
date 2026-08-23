import { have } from "libram";
import { myAdventures, myLocation, totalTurnsPlayed } from "kolmafia";
import { $effect, CrepeParachute } from "libram";
import { Quest } from "grimoire-kolmafia";
import { GarboStrategy } from "../../combatStrategy";
import { barfOutfit } from "../../outfit";
import { estimatedGarboTurns } from "../../turns";
import { completeBarfQuest } from "../../resources";
import { trackMarginalMpa } from "../../session";
import { meatMood } from "../../mood";

import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";
import { farmingStrategy } from "../../lib";
import { Macro } from "../../combat";

export const BarfTurnQuest: Quest<GarboTask> = {
  name: "Barf Turn",
  tasks: [
    {
      name: "Parachute",
      ready: () =>
        CrepeParachute.have() &&
        shouldCheckParachute() &&
        myLocation() === farmingStrategy().location,
      completed: () => have($effect`Everything looks Beige`),
      outfit: () => barfOutfit({}),
      do: () => CrepeParachute.fight(farmingStrategy().targetMonster()),
      combat: new GarboStrategy(() => Macro.meatKill()),
      prepare: () =>
        !(totalTurnsPlayed() % 11) && meatMood().execute(estimatedGarboTurns()),
      post: () => {
        if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
        completeBarfQuest();
        trackMarginalMpa();
      },
      spendsTurn: true,
    },
    {
      name: "Farm",
      ready: () => myLocation() === farmingStrategy().location,
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

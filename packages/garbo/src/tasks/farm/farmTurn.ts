import { $item, $monster, get, have, undelay } from "libram";
import { myAdventures, myLocation, retrieveItem, toMonster } from "kolmafia";
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
import { getMonstersToBanish, redTaffyWorth } from "../../resources/banish";
import { meatMood } from "../../mood";
import { estimatedGarboTurns } from "../../turns";
import { barfOutfit } from "../../outfit";

export function FarmTurnQuest(): Quest<GarboTask> {
  return {
    name: `${farmingStrategy().location}`,
    tasks: [
      {
        name: "Parachute",
        ready: () =>
          CrepeParachute.have() &&
          shouldCheckParachute() &&
          myLocation() === farmingStrategy().location &&
          farmingStrategy().shouldOlfact,
        completed: () =>
          have($effect`Everything looks Beige`) || myAdventures() === 0,
        outfit: (context) => barfOutfit(farmingStrategy().outfit(context)),
        do: () =>
          CrepeParachute.fight(undelay(farmingStrategy().targetMonster)),
        combat: farmingStrategy().combat,
        post: () => {
          farmingStrategy().post?.();
          if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
          trackMarginalMpa();
        },
        spendsTurn: true,
      },
      {
        name: "Farm",
        completed: () => myAdventures() === 0,
        prepare: () => {
          if (
            redTaffyWorth() &&
            farmingStrategy().location.environment === "underwater"
          ) {
            retrieveItem($item`pulled red taffy`);
          }
          meatMood().execute(estimatedGarboTurns());

          if (getMonstersToBanish().length > 0) {
            retrieveItem($item`human musk`);
          }
        },
        outfit: (context) => barfOutfit(farmingStrategy().outfit(context)),
        do: () => farmingStrategy().location,
        combat: farmingStrategy().combat,
        post: () => {
          farmingStrategy().post?.();
          trackMarginalMpa();

          if (toMonster(get("lastEncounter")) === $monster`tumbleweed`) {
            throw "You encountered a tumbleweed and should not have, resolve your banishes";
          }

          if (getMonstersToBanish().includes(toMonster(get("lastEncounter")))) {
            throw "You encountered a banishable monster and didn't banish it, sort your life out!";
          }
        },
        spendsTurn: true,
      },
    ],
    completed: () => !canContinue(),
  };
}

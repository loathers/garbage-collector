import { $item, $monster, get, have, undelay } from "libram";
import {
  Item,
  myAdventures,
  myLocation,
  retrieveItem,
  toMonster,
} from "kolmafia";
import { $effect, CrepeParachute } from "libram";
import { Quest } from "grimoire-kolmafia";

import { GarboTask } from "../engine";
import {
  canContinue,
  shouldCheckParachute,
  updateParachuteFailure,
} from "./lib";
import {
  FarmingStrategy,
  getMonstersToBanish,
  redTaffyWorth,
} from "../../farmingStrategy";
import { trackMarginalMpa } from "../../session";
import { meatMood } from "../../mood";
import { estimatedGarboTurns } from "../../turns";
import { barfOutfit } from "../../outfit";
import { FarmingContext } from "../context";

export function FarmTurnQuest(): Quest<
  GarboTask<FarmingContext>,
  FarmingContext
> {
  return {
    name: `${FarmingStrategy.location}`,
    tasks: [
      {
        name: "Parachute",
        ready: () =>
          CrepeParachute.have() &&
          shouldCheckParachute() &&
          myLocation() === FarmingStrategy.location &&
          FarmingStrategy.shouldOlfact,
        completed: () =>
          have($effect`Everything looks Beige`) || myAdventures() === 0,
        outfit: (context) => barfOutfit(FarmingStrategy.outfit(context)),
        do: () => CrepeParachute.fight(undelay(FarmingStrategy.targetMonster)),
        combat: FarmingStrategy.combat,
        post: () => {
          FarmingStrategy.post?.();
          if (!have($effect`Everything looks Beige`)) updateParachuteFailure();
          trackMarginalMpa();
        },
        spendsTurn: true,
      },
      {
        name: "Farm",
        completed: () => myAdventures() === 0,
        prepare: (context) => {
          if (redTaffyWorth() && FarmingStrategy.isUnderwater) {
            retrieveItem($item`pulled red taffy`);
          }
          meatMood().execute(estimatedGarboTurns());

          if (
            context.banish?.retrieve &&
            context.banish.source instanceof Item
          ) {
            retrieveItem(context.banish.source);
          }
        },
        outfit: (context) => barfOutfit(FarmingStrategy.outfit(context)),
        do: () => FarmingStrategy.location,
        combat: FarmingStrategy.combat,
        post: () => {
          FarmingStrategy.post?.();
          trackMarginalMpa();

          if (toMonster(get("lastEncounter")) === $monster`tumbleweed`) {
            throw new Error(
              "You encountered a tumbleweed and should not have, resolve your banishes",
            );
          }

          if (
            getMonstersToBanish(FarmingStrategy.banishMonsters).includes(
              toMonster(get("lastEncounter")),
            )
          ) {
            throw new Error(
              "You encountered a banishable monster and didn't banish it, sort your life out!",
            );
          }
        },
        spendsTurn: true,
      },
    ],
    completed: () => !canContinue(),
  };
}

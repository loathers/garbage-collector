import { $item, $location, $monster, get, have, undelay } from "libram";
import {
  Item,
  mallPrice,
  myAdventures,
  myLocation,
  toMonster,
  totalTurnsPlayed,
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
  averageRedTaffyValue,
  FarmingStrategy,
  getMonstersToBanish,
  redTaffyWorth,
} from "../../farmingStrategy";
import { trackMarginalMpa } from "../../session";
import { meatMood } from "../../mood";
import { estimatedGarboTurns } from "../../turns";
import { barfOutfit } from "../../outfit";
import { FarmingContext } from "../context";
import { GarboStrategy } from "../../combatStrategy";
import { acquire } from "../../acquire";

export const farmPrepare = (context: FarmingContext) => {
  if (redTaffyWorth() && FarmingStrategy.isUnderwater()) {
    acquire(
      estimatedGarboTurns(),
      $item`pulled red taffy`,
      averageRedTaffyValue(),
      false, // It's fine to continue running if there aren't appropriately priced taffies
    );
  }
  if (
    FarmingStrategy.location === $location`The Coral Corral` &&
    get("seahorseName") === "" &&
    get("lassoTrainingCount") >= 20
  ) {
    acquire(3, $item`sea cowbell`, 5000, true); // Arbitrary max price
    acquire(1, $item`sea lasso`, 5000, true);
  }

  if (
    FarmingStrategy.location === $location`Barf Mountain` &&
    !get("dinseyRollercoasterNext") &&
    !(totalTurnsPlayed() % 11)
  ) {
    meatMood().execute(estimatedGarboTurns());
  } else {
    meatMood().execute(estimatedGarboTurns());
  }

  if (context.banish?.retrieve && context.banish.source instanceof Item) {
    acquire(1, context.banish.source, mallPrice(context.banish.source) * 1.2); // Sanity check on price, 20%
  }
};

export const farmPost = () => {
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
};

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
        combat: new GarboStrategy((context) => FarmingStrategy.macro(context)),
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
        prepare: farmPrepare,
        outfit: (context) => barfOutfit(FarmingStrategy.outfit(context)),
        do: () => FarmingStrategy.location,
        combat: new GarboStrategy((context) => FarmingStrategy.macro(context)),
        post: farmPost,
        spendsTurn: true,
      },
    ],
    completed: () => !canContinue(),
  };
}

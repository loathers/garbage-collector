import { GarboTask } from "./engine";
import { globalOptions } from "../config";
import { meatMood } from "../mood";
import { estimatedGarboTurns } from "../turns";
import {
  cowoChooseBanish,
  getCowoMonstersToBanish,
  redTaffyWorth,
} from "../resources/cowoResources";
import { myAdventures, retrieveItem, toMonster } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $monsters,
  AsdonMartin,
  get,
  have,
} from "libram";
import { barfOutfit } from "../outfit";
import { GarboStrategy } from "../combatStrategy";
import { Macro } from "../combat";
import { trackMarginalMpa } from "../session";

export function CowoTasks(): GarboTask[] {
  return [
    {
      name: "Cowo",
      ready: () => globalOptions.cowo,
      prepare: () => {
        if (redTaffyWorth()) {
          retrieveItem($item`red taffy`);
        }
        meatMood().execute(estimatedGarboTurns());

        if (getCowoMonstersToBanish().length > 0) {
          retrieveItem($item`human musk`);
        }

        if (!have($effect`Driving Waterproofly`)) {
          AsdonMartin.drive(
            $effect`Driving Waterproofly`,
            estimatedGarboTurns(),
          );
        }
      },
      completed: () => myAdventures() === 0,
      outfit: () => {
        const outfit = barfOutfit({
          pants: have($effect`Driving Waterproofly`)
            ? undefined
            : $item`really, really nice swimming trunks`,
          famequip: have($effect`Driving Waterproofly`)
            ? undefined
            : $item`das boot`,
        });
        const banishMethod = cowoChooseBanish();

        if (banishMethod?.equip) {
          outfit.equip(banishMethod.equip);
        }

        return outfit;
      },
      do: $location`The Coral Corral`,
      combat: new GarboStrategy(() => {
        const banishMethod = cowoChooseBanish();

        if (banishMethod === null && getCowoMonstersToBanish().length > 0) {
          throw new Error(
            "I have monsters to banish for cowo, but no banishes are available!",
          );
        }
        if (redTaffyWorth()) {
          return Macro.if_(
            $monsters`Mer-kin rustler, sea cowboy`,
            banishMethod?.macro() ?? Macro.abort(),
          )
            .tryItem($item`red taffy`)
            .meatKill();
        } else {
          return Macro.if_(
            $monsters`Mer-kin rustler, sea cowboy`,
            banishMethod?.macro() ?? Macro.abort(),
          ).meatKill();
        }
      }),
      post: () => {
        trackMarginalMpa();

        if (
          getCowoMonstersToBanish().includes(toMonster(get("lastEncounter")))
        ) {
          throw "You encountered a banishable monster and didn't banish it, sort your life out!";
        }
      },
      spendsTurn: true,
    },
  ];
}

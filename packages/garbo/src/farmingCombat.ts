import { equippedItem, itemType, myBuffedstat } from "kolmafia";
import { $item, $monster, $skill, $slot, $stat, get, have } from "libram";
import { Macro } from "./combat";
import { GarboStrategy } from "./combatStrategy";
import { FarmingMethod, globalOptions } from "./config";
import { redTaffyWorth } from "./farmingStrategy";
import { completeBarfQuest } from "./resources/realm";
import { FarmingContext } from "./tasks/context";

interface FarmingCombatOptions {
  combat: (context: FarmingContext) => Macro;
  post?: () => void;
}

const BARF_MOUNTAIN: FarmingCombatOptions = {
  combat: () => Macro.meatKill(),
  post: completeBarfQuest,
};

const THE_CORAL_CORRAL: FarmingCombatOptions = {
  combat: ({ banish }) =>
    Macro.externalIf(
      !get("seahorseName"),
      Macro.if_(
        $monster`wild seahorse`,
        Macro.item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea cowbell`)
          .item($item`sea lasso`)
          .abortWithMsg("Wild seahorse should have been tamed, what happened?"),
      ),
    )
      .farmingBanish(banish)
      .externalIf(
        myBuffedstat($stat`Moxie`) < $monster`sea cow`.baseAttack + 10 ||
          (have($skill`Hero of the Half-Shell`) &&
            itemType(equippedItem($slot`offhand`)) === "shield" &&
            myBuffedstat($stat`Muscle`) < $monster`sea cow`.baseAttack + 10),
        Macro.delevel(),
      )
      .externalIf(redTaffyWorth(), Macro.tryItem($item`pulled red taffy`))
      .meatKill(),
};

const FARMING_COMBATS: Record<FarmingMethod, FarmingCombatOptions> = {
  [FarmingMethod.BARF_MOUNTAIN]: BARF_MOUNTAIN,
  [FarmingMethod.THE_CORAL_CORRAL]: THE_CORAL_CORRAL,
};

function currentCombat(): FarmingCombatOptions {
  return FARMING_COMBATS[globalOptions.prefs.farmingMethod];
}

export const FarmingCombat = {
  combat: (context: FarmingContext): Macro => currentCombat().combat(context),
  post: (): void => currentCombat().post?.(),
  strategy: (): GarboStrategy<FarmingContext> =>
    new GarboStrategy(currentCombat().combat),
};

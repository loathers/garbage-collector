import { currentRound, handlingChoice, print, visitUrl } from "kolmafia";
import { $monster, get, getAcquirePrice } from "libram";
import { Macro } from "./combat";
import { globalOptions } from "./config";
import { HIGHLIGHT, ULTRA_RARE_MONSTERS, unlimitedFreeRunList } from "./lib";

// Get out of fights, combats, etc, so we can return stash items and otherwise clean up.
export function prepareForCleanup(): boolean {
  if (currentRound() > 0) {
    print("In fight, trying to get away before cleanup...", HIGHLIGHT);
    Macro.if_(
      [globalOptions.target, $monster`giant giant crab`],
      Macro.attack().repeat(),
    )
      .if_(ULTRA_RARE_MONSTERS, Macro.abort())
      .tryItem(
        ...unlimitedFreeRunList
          .filter((item) => getAcquirePrice(item) < get("valueOfAdventure"))
          .sort((a, b) => getAcquirePrice(a) - getAcquirePrice(b)),
      )
      .step("runaway")
      .submit();
    if (currentRound() > 0) return false;
  }

  visitUrl("main.php");
  if (handlingChoice()) {
    print("Stuck in a choice, can't return stash items.", "red");
    return false;
  }
  return true;
}

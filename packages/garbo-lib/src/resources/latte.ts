import { canAdventure, print, visitUrl } from "kolmafia";
import {
  $item,
  $skill,
  byStat,
  get,
  have,
  Latte,
  set,
  setEqual,
  Tuple,
} from "libram";

type Ingredients = Tuple<Latte.Ingredient, 3>;
function desirableIngredients() {
  return have($skill`Head in the Game`) &&
    have($item`mafia pointer finger ring`)
    ? (["msg", "cajun", "rawhide", "carrot"] as const)
    : (["cajun", "rawhide", "carrot"] as const);
}

/**
 * Returns whether the latte ingredients should be unlocked based on
 * the player's skills and available adventure locations.
 */
export function shouldUnlockIngredients(): boolean {
  if (!Latte.have()) return false;
  const shouldTryToUnlockIngredients =
    desirableIngredients().filter(
      (i) =>
        Latte.ingredientsUnlocked().includes(i) ||
        canAdventure(Latte.locationOf(i)),
    ).length >= 3;
  const doneUnlockingIngredients =
    desirableIngredients().filter((i) =>
      Latte.ingredientsUnlocked().includes(i),
    ).length >= 3;
  return shouldTryToUnlockIngredients && !doneUnlockingIngredients;
}

function ingredientsToFillWith(): Ingredients {
  return [
    ...desirableIngredients().filter((i) =>
      Latte.ingredientsUnlocked().includes(i),
    ),
    ...byStat<Latte.Ingredient[]>({
      Muscle: ["vanilla", "pumpkin", "cinnamon"],
      Moxie: ["cinnamon", "pumpkin", "vanilla"],
      Mysticality: ["pumpkin", "vanilla", "cinnamon"],
    }),
  ].splice(0, 3) as Ingredients;
}

function latteMalformed(): boolean {
  return (["vanilla", "pumpkin", "cinnamon"] as const).some(
    (defaultIngredient) =>
      !Latte.ingredientsUnlocked().includes(defaultIngredient),
  );
}

/**
 * Checks if the latte has malformed ingredients and corrects them.
 * Returns true if the latte is properly configured or was corrected,
 * false if the latte shop is inaccessible and the latte is disabled.
 */
export function checkAndCorrectLatteMalformation(): boolean {
  if (!latteMalformed()) return true;

  visitUrl("main.php?latte=1", false);

  if (!latteMalformed()) return true;

  print("Can't access Latte Lover's Mug shop, disabling it", "red");
  set("_latteBanishUsed", true);
  set("_latteCopyUsed", true);
  set("_latteRefillsUsed", 3);
  return false;
}

/**
 * Returns whether the latte should be filled based on refill usage,
 * copy/banish flags, and whether the current ingredients match desired ones.
 */
export function shouldFillLatte(): boolean {
  if (
    !have($item`latte lovers member's mug`) ||
    get("_latteRefillsUsed") >= 3
  ) {
    return false;
  }

  if (get("_latteCopyUsed")) return true;
  if (get("_latteBanishUsed")) return true;

  if (
    checkAndCorrectLatteMalformation() &&
    !setEqual(Latte.currentIngredients(), ingredientsToFillWith())
  ) {
    return true;
  }

  return false;
}

/**
 * Fills the latte with desired ingredients if conditions are met.
 * Returns true if the latte was successfully filled.
 */
export function tryFillLatte(): boolean {
  return (
    shouldFillLatte() &&
    Latte.fill(...ingredientsToFillWith()) &&
    checkAndCorrectLatteMalformation()
  );
}

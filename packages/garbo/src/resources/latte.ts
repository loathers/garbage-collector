import { canAdventure } from "kolmafia";
import {
  $item,
  $location,
  $skill,
  arrayEquals,
  byStat,
  get,
  have,
  Latte,
  Tuple,
} from "libram";

type Ingredients = Tuple<Latte.Ingredient, 3>;
function desirableIngredients(): Latte.Ingredient[] {
  return have($skill`Head in the Game`) &&
    have($item`mafia pointer finger ring`)
    ? ["msg", "cajun", "rawhide", "carrot"]
    : ["cajun", "rawhide", "carrot"];
}

export function shouldUnlockIngredients(): boolean {
  return (
    desirableIngredients().filter(
      (i) =>
        Latte.ingredientsUnlocked().includes(i) ||
        canAdventure(Latte.locationOf(i) ?? $location`Noob Cave`),
    ).length >= 3
  );
}

function ingredientsToFillWith(): Ingredients {
  return [
    ...desirableIngredients().filter((i) =>
      Latte.ingredientsUnlocked().includes(i),
    ),
    byStat({
      Muscle: ["vanilla", "pumpkin spice", "cinnamon"],
      Moxie: ["cinnamon", "pumpkin spice", "vanilla"],
      Mysticality: ["pumpkin spice", "vanilla", "cinnamon"],
    }),
  ].splice(0, 3) as Ingredients;
}

function shouldFillLatte(): boolean {
  if (
    !have($item`latte lovers member's mug`) ||
    get("_latteRefillsUsed") >= 3
  ) {
    return false;
  }

  if (!get("_latteCopyUsed")) return true;

  if (!arrayEquals(Latte.currentIngredients(), ingredientsToFillWith())) {
    return true;
  }

  return false;
}

export function tryFillLatte(): boolean {
  return shouldFillLatte() && Latte.fill(...ingredientsToFillWith());
}

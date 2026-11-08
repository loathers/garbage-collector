import {
  descToItem,
  handlingChoice,
  Item,
  runChoice,
  visitUrl,
} from "kolmafia";
import { $item, maxBy, sum, TakerSpace } from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { FarmingStrategy } from "../farmingStrategy";

export function grabMedicine(): void {
  const options = visitUrl("campground.php?action=workshed");
  let i = 0;
  let match;
  const regexp = /descitem\((\d+)\)/g;
  const itemChoices = new Map<Item, number>();
  if (!globalOptions.nobarf) {
    switch (FarmingStrategy.location.environment) {
      case "underground":
        itemChoices.set($item`Breathitin™`, -1);
        break;
      case "indoor":
        itemChoices.set($item`Extrovermectin™`, -1);
        break;
      case "outdoor":
        itemChoices.set($item`Homebodyl™`, -1);
        break;
      default:
        itemChoices.set($item`Fleshazole™`, -1);
        break;
    }
    // if spending turns at barf, we probably will be able to get an extro so always consider it
  }

  while ((match = regexp.exec(options)) !== null) {
    i++;
    const item = descToItem(match[1]);
    itemChoices.set(item, i);
  }

  const bestItem = maxBy([...itemChoices.keys()], garboValue);
  const bestChoice = itemChoices.get(bestItem);
  if (bestChoice && bestChoice > 0) {
    visitUrl("campground.php?action=workshed");
    runChoice(bestChoice);
  }
  if (handlingChoice()) visitUrl("main.php");
}

// Silk and Gold are thrice as rare as other ingredients, so we value them thrice as much
// Yes, it's pretty dumb
function naiveTakerspaceCost(recipe: TakerSpace.Recipe): number {
  return sum(
    [...recipe.entries()],
    ([index, amount]) => amount * ([4, 5].includes(index) ? 3 : 1),
  );
}

export function bestTakerspaceItem(): Item | null {
  const makeables = [...TakerSpace.allRecipes().entries()].filter(([i]) =>
    TakerSpace.canMake(i),
  );
  return makeables.length
    ? maxBy(
        makeables,
        ([item, recipe]) => garboValue(item) / naiveTakerspaceCost(recipe),
      )[0]
    : null;
}

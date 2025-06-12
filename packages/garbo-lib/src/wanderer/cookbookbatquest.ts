import { Location, Monster } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { $locations, get } from "libram";

export function cookbookbatQuestFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  const questLocation = get("_cookbookbatQuestLastLocation");
  const questReward = get("_cookbookbatQuestIngredient");
  const questMonster = get("_cookbookbatQuestMonster");
  const blackListedLocations = $locations`Frat House, The Orcish Frat House (Bombed Back to the Stone Age)`; // Seem to be unable to distinguish between them
  if (
    ["yellow ray", "freefight", "freerun"].includes(type) && // Runs still get you the quest reward
    questLocation &&
    questReward &&
    questMonster &&
    !locationSkiplist.includes(questLocation) &&
    !blackListedLocations.includes(questLocation)
  ) {
    return [
      new WandererTarget(
        `Cookbookbat Quest`,
        questLocation,
        0,
        new Map<Monster, number>([
          [questMonster, 3 * options.itemValue(questReward)],
        ]),
      ),
    ];
  }
  return [];
}

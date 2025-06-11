import { Location, Monster } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { get } from "libram";

export function cookbookbatQuestFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  const questLocation = get("_cookbookbatQuestLastLocation");
  const questReward = get("_cookbookbatQuestIngredient");
  const questMonster = get("_cookbookbatQuestMonster");
  if (
    ["yellow ray", "freefight", "freerun"].includes(type) &&
    questLocation &&
    questReward &&
    questMonster &&
    !locationSkiplist.includes(questLocation)
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

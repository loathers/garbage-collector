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
  // TODO: These are fixed in mafia (we get the correct location), however we cannot use peridot to target them for cookbookbat specifically, because we cannot know which monster cookbookbat wants because of duplicate names
  const blackListedLocations = $locations`The Orcish Frat House, The Orcish Frat House (Bombed Back to the Stone Age)`;
  if (
    ["yellow ray", "freefight", "freerun"].includes(type) && // Runs still get you the quest reward
    questLocation &&
    questReward &&
    questMonster &&
    !locationSkiplist.includes(questLocation) &&
    !blackListedLocations.includes(questLocation)
  ) {
    return [
      new WandererTarget({
        name: `Cookbookbat Quest`,
        location: questLocation,
        zoneValue: 0,
        monsterBonusValues: new Map<Monster, number>([
          [questMonster, 3 * options.itemValue(questReward)],
        ]),
      }),
    ];
  }
  return [];
}

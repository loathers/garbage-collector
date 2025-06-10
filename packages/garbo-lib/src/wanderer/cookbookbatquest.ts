import { Location, Monster } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { get, PeridotOfPeril } from "libram";

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
    !locationSkiplist.includes(questLocation) &&
    questReward
  ) {
    if (
      PeridotOfPeril.have() &&
      PeridotOfPeril.canImperil(questLocation) &&
      questMonster
    ) {
      return [
        new WandererTarget(
          `Cookbookbat Quest (Peridot: ${questMonster.name})`,
          questLocation,
          0,
          new Map<Monster, number>([
            [questMonster, 3 * options.itemValue(questReward)],
          ]),
          undefined,
          questMonster,
          type === "freefight"
            ? "normal"
            : type === "yellow ray"
              ? "forced"
              : "none",
        ),
      ];
    }
  }
  return [];
}

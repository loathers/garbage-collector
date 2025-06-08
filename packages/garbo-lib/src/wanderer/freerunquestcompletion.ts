import { appearanceRates, getMonsters, Location } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { get, PeridotOfPeril } from "libram";

export function freeRunQuestCompletionFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  const questLocation = get("_cookbookbatQuestLastLocation");
  const questReward = get("_cookbookbatQuestIngredient");
  const questMonster = get("_cookbookbatQuestMonster");
  if (
    type === "freerun" &&
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
          `Cookbookbat Freerun Quest (Peridot)`,
          questLocation,
          3 * options.itemValue(questReward),
          undefined,
          questMonster,
        ),
      ];
    } else {
      const badAttributes = ["LUCKY", "ULTRARARE", "BOSS"];
      const rates = appearanceRates(questLocation);
      const monsters = getMonsters(questLocation).filter(
        (m) =>
          !badAttributes.some((s) => m.attributes.includes(s)) &&
          rates[m.name] > 0,
      );
      return [
        new WandererTarget(
          `Cookbookbat Freerun Quest`,
          questLocation,
          (3 * options.itemValue(questReward)) / monsters.length,
        ),
      ];
    }
  }
  return [];
}

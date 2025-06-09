import { appearanceRates, getMonsters, Location } from "kolmafia";
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
          `Cookbookbat Quest (Peridot)`,
          questLocation,
          3 * options.itemValue(questReward),
          0,
          undefined,
          questMonster,
          type === "freefight"
            ? "normal"
            : type === "yellow ray"
              ? "forced"
              : "none",
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
          `Cookbookbat Quest`,
          questLocation,
          (3 * options.itemValue(questReward)) / monsters.length, // FIXME account for actual monster apperanceRates
          0,
        ),
      ];
    }
  }
  return [];
}

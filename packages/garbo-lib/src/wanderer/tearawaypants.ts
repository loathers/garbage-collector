import { canAdventure, Location } from "kolmafia";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";
import { $locations, get, TearawayPants } from "libram";

const VALID_DRAGGABLE_TYPES: DraggableFight[] = [
  "backup",
  "yellow ray",
  "freerun",
];

export function tearawayPantsFactory(
  type: DraggableFight,
  locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (!VALID_DRAGGABLE_TYPES.includes(type) || !TearawayPants.have()) {
    return [];
  }
  return $locations`The Fun-Guy Mansion, The Fungal Nethers`
    .filter((l) => canAdventure(l) && !locationSkiplist.includes(l))
    .map(
      (l) =>
        new WandererTarget(
          `Tearaway Pants ${l}`,
          l,
          TearawayPants.plantsAdventureChance() *
            (options.valueOfAdventure ?? get("valueOfAdventure")),
        ),
    );
}

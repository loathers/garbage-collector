import { Item, Location } from "kolmafia";
import { $item, $location, get, realmAvailable, RealmType } from "libram";
import { DraggableFight, WandererFactoryOptions, WandererTarget } from "./lib";

type LovebugTarget = { element: RealmType; location: Location; currency: Item };
const LovebugTargets: LovebugTarget[] = [
  // exclude barf mountain because we spend most of our turns there anyway
  {
    element: "cold",
    location: $location`VYKEA`,
    currency: $item`Wal-Mart gift certificate`,
  },
  {
    element: "sleaze",
    location: $location`The Fun-Guy Mansion`,
    currency: $item`Beach Buck`,
  },
  {
    element: "spooky",
    location: $location`The Deep Dark Jungle`,
    currency: $item`Coinspiracy`,
  },
];

export function lovebugsFactory(
  _type: DraggableFight,
  _locationSkiplist: Location[],
  options: WandererFactoryOptions,
): WandererTarget[] {
  if (get("lovebugsUnlocked")) {
    return LovebugTargets.filter((t) => realmAvailable(t.element)).map(
      (t) =>
        new WandererTarget(
          `Lovebugs ${t.location}`,
          t.location,
          options.itemValue(t.currency) * 0.05,
        ),
    );
  }
  return [];
}

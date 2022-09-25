import { Item, Location } from "kolmafia";
import { $item, $location, get } from "libram";
import { realmAvailable, RealmType } from "../lib";
import { garboValue } from "../session";
import { WandererTarget } from "./lib";

type LovebugTarget = { element: RealmType; location: Location; currency: Item };
const LovebugTargets: LovebugTarget[] = [
  { element: "cold", location: $location`VYKEA`, currency: $item`Wal-Mart gift certificate` },
  { element: "spooky", location: $location`The Fun-Guy Mansion`, currency: $item`Beach Buck` },
  { element: "sleaze", location: $location`The Deep Dark Jungle`, currency: $item`Coinspiracy` },
];

export function lovebugsFactory(): WandererTarget[] | undefined {
  if (get("lovebugsUnlocked")) {
    return LovebugTargets.filter((t) => realmAvailable(t.element)).map(
      (t) => new WandererTarget(`Lovebugs ${t.location}`, t.location, garboValue(t.currency) * 0.05)
    );
  }
  return undefined;
}

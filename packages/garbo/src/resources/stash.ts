import { $item, get, have } from "libram";
import { stash } from "../stash";

export function returnExhaustedStashItems(): void {
  if (get("_navelRunaways") >= 3) {
    stash.done(
      $item`navel ring of navel gazing`,
      $item`Greatest American Pants`,
    );
  }
  if (
    get("spookyPuttyCopiesMade") + Math.max(1, get("_raindohCopiesMade")) >=
      6 &&
    !have($item`Spooky Putty monster`)
  ) {
    stash.done($item`Spooky Putty sheet`);
  }
  if (get("_stinkyCheeseCount") >= 100) {
    stash.done($item`stinky cheese diaper`);
  }
}

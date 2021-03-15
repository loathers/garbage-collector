import { myInebriety, inebrietyLimit, haveFamiliar } from "kolmafia";
import { have, $familiar, $item, $familiars } from "libram";

export function chooseFamiliar() {
  if (
    myInebriety() > inebrietyLimit() &&
    have($familiar`Trick-or-Treating Tot`) &&
    have($item`li'l pirate costume`)
  ) {
    return $familiar`Trick-or-Treating Tot`;
  } else {
    for (const familiar of $familiars`Robortender, Hobo Monkey, Cat Burglar, Leprechaun`) {
      if (haveFamiliar(familiar)) return familiar;
    }
  }
  throw new Error("No good Barf familiars!");
}

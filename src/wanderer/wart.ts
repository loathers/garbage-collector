import { $familiar, $item, $items, $location, $locations, get, have } from "libram";
import { DraggableFight, WandererTarget } from "./lib";
import { realmAvailable } from "../lib";
import { Item, Location } from "kolmafia";
import { garboValue } from "../session";

const cardLocations = new Map<Location, Item>([
  [$location`Barf Mountain`, $item`keycard α`],
  [$location`Pirates of the Garbage Barges`, $item`keycard β`],
  [$location`The Toxic Teacups`, $item`keycard γ`],
  [$location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`, $item`keycard δ`],
]);

const targetPrioirity = $locations`Pirates of the Garbage Barges, The Toxic Teacups, Uncle Gator's Country Fun-Time Liquid Waste Sluice, Barf Mountain`;

export function wartFactory(_type: DraggableFight, locationSkiplist: Location[]): WandererTarget[] {
  if (
    !realmAvailable("stench") ||
    $items`keycard α, keycard β, keycard γ, keycard δ`.every((card) => have(card))
  ) {
    return [];
  }

  const cardsNeeded = $items`keycard α, keycard β, keycard γ, keycard δ`.filter(
    (card) => !have(card)
  ).length;
  const expectedValueOfKillingWart =
    (have($familiar`Grey Goose`) ? 3 : 2) * garboValue($item`brain preservation fluid`) +
    garboValue($item`Wart Dinsey: An Afterlife`) -
    (1 + cardsNeeded) * get("valueOfAdventure");
  const turncost = 100 * cardsNeeded;
  const target = targetPrioirity
    .filter((l) => !locationSkiplist.includes(l))
    .find((location) => {
      const card = cardLocations.get(location);
      return card && have(card);
    });
  if (!target || !turncost) return [];
  return [
    new WandererTarget(
      `Wart Dinsey ${cardLocations.get(target)}`,
      target,
      expectedValueOfKillingWart / turncost
    ),
  ];
}

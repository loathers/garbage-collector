import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import { toSlot } from "kolmafia";
import { $slot } from "libram";
import { barfFamiliar } from "../familiar/barfFamiliar";
import { trackMarginalTurnExtraValue } from "../session";
import { computeBarfOutfit } from "./barf";

export function barfOutfit(spec: OutfitSpec, sim = false): Outfit {
  const { familiar, extraValue } = barfFamiliar(
    Boolean(
      spec.famequip ||
        spec.equip?.some((equipment) => toSlot(equipment) === $slot`familiar`),
    ),
  );
  try {
    return computeBarfOutfit({ familiar, ...spec }, sim);
  } finally {
    trackMarginalTurnExtraValue(extraValue);
  }
}

import { AcquireItem, Outfit } from "grimoire-kolmafia";
import {
  $familiar,
  $item,
  get,
  getSaleValue,
  have,
  sum,
} from "libram";
import {
  canEquip,
  getOutfits,
  mallPrice,
  outfit,
  outfitPieces,
  outfitTreats,
  print,
  runChoice,
  toItem,
  use,
  visitUrl,
} from "kolmafia";
import { GarboTask } from "../tasks/engine";
import { garboValue } from "../garboValue";

const HOUSE_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

let blockHtml = "";

function getBlockHtml(): string {
  blockHtml ||= visitUrl("place.php?whichplace=town&action=town_trickortreat");
  return blockHtml;
}

function treatValue(outfit: string): number {
  return sum(
    Object.entries(outfitTreats(outfit)),
    ([candyName, probability]) => probability * garboValue(toItem(candyName))
  );
}

export function getTreatOutfit(): string {
  const outfits = getOutfits();
  const outfitsWithValues = outfits.map((outfit) => ({
    outfit,
    relativeValue: treatValue(outfit),
}));

const outfitWithHighestValue = outfitsWithValues.reduce((prev, current) => {
  return prev.relativeValue > current.relativeValue ? prev : current;
});

  return outfitWithHighestValue.outfit;
} //ChatGPT made this, I have no idea if it works!

export function treatOutfit(): Outfit {
  const outfit = new Outfit();
  const pieces = outfitPieces(getTreatOutfit());
  for (const piece of pieces) {
    if (!outfit.equip(piece))
      print(`Could not equip all pieces of treat outfit: aborted on ${piece}`);
  }

  outfit.equip($item`lucky Crimbo tiki necklace`);
  outfit.equip($familiar`Trick-or-Treating Tot`);
  return outfit;
}

export function candyRichBlockValue(): number {
    const outfitCandyValue = treatValue(getTreatOutfit());
    const totOutfitCandyMultiplier = have($familiar`Trick-or-Treating Tot`) ? 1.6 : 1;
    const bowlValue = (1 / 5) * getSaleValue($item`huge bowl of candy`);
    const prunetsValue = have($familiar`Trick-or-Treating Tot`)
      ? 4 * 0.2 * getSaleValue($item`Prunets`)
      : 0;

    const outfitCandyTotal = 3 * outfitCandyValue * totOutfitCandyMultiplier;
    return (outfitCandyTotal + bowlValue + prunetsValue);
}

function shouldAcquireCandyMap(): boolean {
  if(candyRichBlockValue() < mallPrice($item`map to a candy-rich block`))
    return true;
  else
    return false;
}

function useCandyMapTask(): GarboTask {
  return {
  name: "Acquire Candy Map",
  ready: () => shouldAcquireCandyMap(),
  completed: () => get("_mapToACandyRichBlockUsed"),
  do: (): void => {
    AcquireItem($item`map to a candy-rich block`)
    use($item`map to a candy-rich block`)
  },
};
}

function doCandyTreat(): GarboTask {
  return {
    name: "Treat",
    completed: () => get("_mapToACandyRichBlockUsed"),
    outfit: treatOutfit,
    do: (): void => {
      use($item`map to a candy-rich block`)
      // We do all treat houses in a row as one task for speed reasons
      for (const house of HOUSE_NUMBERS) {
        if (getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?house_l`))) {
          visitUrl(`choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`);
        } else if (getBlockHtml().match(RegExp(`whichhouse=${house}>[^>]*?starhouse`))) {
          visitUrl(`choice.php?whichchoice=804&option=3&whichhouse=${house}&pwd`);
          runChoice(2);
        }
      }
    },
  };
}

export function freeCandyTasks(): GarboTask[] {
  return useCandyMapTask() + doCandyTreat();
}
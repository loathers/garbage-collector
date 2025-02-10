import {
  canAdventure,
  canEquip,
  haveOutfit,
  itemAmount,
  Location,
  outfitPieces,
} from "kolmafia";
import {
  $item,
  $items,
  $location,
  get,
  getAverageAdventures,
  GingerBread,
  have,
  maxBy,
} from "libram";
import { bestConsumable } from "../diet";
import { targetMeat } from "../lib";
import { garboValue } from "../garboValue";

const MIDNIGHTS = [
  {
    location: $location`Gingerbread Upscale Retail District`,
    choices: { 1209: 2, 1214: 1 },
    available: () =>
      haveOutfit("gingerbread best") &&
      outfitPieces("gingerbread best").every((piece) => canEquip(piece)) &&
      itemAmount($item`high-end ginger wine`) < 11,
    value: () => {
      const best = bestConsumable(
        "booze",
        true,
        $items`high-end ginger wine, astral pilsner`,
      );
      const gingerWineValue =
        (0.5 * 30 * targetMeat() +
          getAverageAdventures($item`high-end ginger wine`) *
            get("valueOfAdventure")) /
        2;
      const valueDif = gingerWineValue - best.value;
      return 2 * valueDif;
    },
  },
  {
    location: $location`Gingerbread Upscale Retail District`,
    available: () =>
      haveOutfit("gingerbread best") &&
      outfitPieces("gingerbread best").every((piece) => canEquip(piece)) &&
      have($item`sprinkles`, 300),
    choices: { 1209: 2, 1214: 2 },
    value: () => garboValue($item`fancy chocolate sculpture`),
  },
  {
    location: $location`Gingerbread Upscale Retail District`,
    available: () =>
      haveOutfit("gingerbread best") &&
      outfitPieces("gingerbread best").every((piece) => canEquip(piece)) &&
      have($item`sprinkles`, 1000),
    choices: { 1209: 2, 1214: 3 },
    value: () => garboValue($item`Pop Art: a Guide`),
  },
  {
    location: $location`Gingerbread Upscale Retail District`,
    available: () =>
      haveOutfit("gingerbread best") &&
      outfitPieces("gingerbread best").every((piece) => canEquip(piece)) &&
      have($item`sprinkles`, 1000),
    choices: { 1209: 2, 1214: 4 },
    value: () => garboValue($item`No Hats as Art`),
  },
  {
    location: $location`Gingerbread Civic Center`,
    choices: { 1203: 2 },
    available: () =>
      have($item`sprinkles`, 300) && !GingerBread.canJudgeFudge(),
    value: () => garboValue($item`counterfeit city`),
  },
  {
    location: $location`Gingerbread Civic Center`,
    choices: { 1203: 4 },
    available: () => have($item`sprinkles`, 5) && !GingerBread.canJudgeFudge(),
    value: () => 5 * garboValue($item`gingerbread cigarette`),
  },
] as const;

const DEFAULT_MIDNIGHT = {
  location: $location`Gingerbread Train Station`,
  choices: { 1205: 1 },
  value: () => 0,
} as const;

export function bestMidnightAvailable(): {
  location: Location;
  choices: { [x in number]: number };
} {
  const availableMidnights = [
    ...MIDNIGHTS.filter(
      ({ location, available }) => canAdventure(location) && available(),
    ),
    DEFAULT_MIDNIGHT,
  ];
  return maxBy(availableMidnights, ({ value }) => value());
}

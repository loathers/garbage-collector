import {
  $item,
  AprilingBandHelmet,
  clamp,
  get,
  have,
  realmAvailable,
} from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { getBestLuckyAdventure, YACHTZEE_VALUE } from "../lib";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { toItem } from "kolmafia";
import { FarmingStrategy } from "../farmingStrategy";

const instruments: {
  instrument: AprilingBandHelmet.Instrument;
  value: () => number;
}[] = [
  {
    instrument: "Apriling band tuba",
    value: () =>
      realmAvailable("sleaze")
        ? (YACHTZEE_VALUE - get("valueOfAdventure")) * 3
        : 0,
  },
  {
    instrument: "Apriling band quad tom",
    value: () =>
      (globalOptions.prefs.valueOfFreeFight +
        0.02 * garboValue($item`spice melange`)) *
      3,
  },
  {
    instrument: "Apriling band saxophone",
    value: () => getBestLuckyAdventure().value() * 3,
  },
  {
    instrument: "Apriling band piccolo",
    value: () =>
      Math.max(
        0,
        ...getExperienceFamiliars(
          "free",
          (familiar) =>
            40 * clamp(Math.floor((400 - familiar.experience) / 40), 0, 3),
          "award",
        ).map(({ expectedValue }) => expectedValue),
      ),
  },
  {
    instrument: "Apriling band tuba",
    value: () =>
      realmAvailable("sleaze") && FarmingStrategy.isUnderwater()
        ? (YACHTZEE_VALUE - get("valueOfAdventure")) * 3 // Yachtzee
        : 0, // Are there any other valuable NCs?
  },
];

export function getBestAprilInstruments(): AprilingBandHelmet.Instrument[] {
  const available = clamp(2 - get("_aprilBandInstruments"), 0, 2);

  return instruments
    .filter(({ instrument }) => !have(toItem(instrument)))
    .sort((a, b) => b.value() - a.value())
    .splice(0, available)
    .map(({ instrument }) => instrument);
}

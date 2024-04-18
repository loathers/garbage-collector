import { $item, $location, AprilingBandHelmet, clamp, get, have } from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { EMBEZZLER_MULTIPLIER } from "../lib";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { canAdventure, toItem } from "kolmafia";

const instruments: {
  instrument: AprilingBandHelmet.Instrument;
  value: () => number;
}[] = [
  {
    instrument: "Apriling band quad tom",
    value: () =>
      globalOptions.prefs.valueOfFreeFight +
      0.02 * garboValue($item`spice melange`),
  },
  {
    instrument: "Apriling band saxophone",
    value: () =>
      canAdventure($location`Cobb's Knob Treasury`)
        ? EMBEZZLER_MULTIPLIER() * get("valueOfAdventure")
        : 0,
  },
  {
    instrument: "Apriling band piccolo",
    value: () =>
      Math.max(
        0,
        ...getExperienceFamiliars().map(
          ({ expectedValue }) => expectedValue / 12,
        ),
      ) *
      20 *
      3,
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

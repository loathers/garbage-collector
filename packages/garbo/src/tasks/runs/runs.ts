import { $effect, $item, $skill, get, have } from "libram";
import { Macro } from "../../combat";
import { FreeRunSource } from "./lib";
import { globalOptions } from "../../config";

export const RunSources: FreeRunSource[] = [
  {
    name: "Spring Runaway",
    spec: { acc1: $item`spring shoes` },
    macro: Macro.skill($skill`Spring Away`),
    available: () => !have($effect`Everything Looks Green`),
    have: () => have($item`spring shoes`),
  },
  {
    name: "GAP Runaway",
    spec: { pants: $item`Greatest American Pants` },
    macro: Macro.runaway(),
    available: () => get("_navelRunaways") < 3,
    have: () => have($item`Greatest American Pants`),
  },
  {
    name: "Navel Ring Runaway",
    spec: { acc1: $item`navel ring of navel gazing` },
    macro: Macro.runaway(),
    available: () => get("_navelRunaways") < 3,
    have: () => have($item`navel ring of navel gazing`),
  },
  {
    name: "Fish Oil Smoke Bomb",
    spec: {},
    macro: Macro.item($item`fish oil smoke bomb`),
    available: () => have($item`fish oil smoke bomb`),
    have: () => globalOptions.ascend,
  },
];

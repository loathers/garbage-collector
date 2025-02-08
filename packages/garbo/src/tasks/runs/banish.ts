import { $item, $skill, clamp, get, getFoldGroup, have } from "libram";
import { FreeRunBanishSource } from "./lib";
import { Macro } from "../../combat";

export const BanishSources: FreeRunBanishSource[] = [
  {
    name: "KGB Tranquilizer Dart",
    banish: $skill`KGB tranquilizer dart`,
    spec: { acc1: $item`Kremlin's Greatest Briefcase` },
    macro: Macro.skill($skill`KGB tranquilizer dart`),
    have: () => have($item`Kremlin's Greatest Briefcase`),
    available: () => get("_kgbTranquilizerDartUses") < 3,
    remaining: () => clamp(3 - get("_kgbTranquilizerDartUses"), 0, 3),
  },
  {
    name: "Latte Lovers Member's Mug",
    banish: $skill`Throw latte on Opponent`,
    spec: { offhand: $item`Latte Lovers Member's Mug` },
    macro: Macro.skill($skill`Throw latte on opponent`),
    have: () => have($item`Latte Lovers Member's Mug`),
    available: () => !get("_latteBanishUsed"),
    remaining: () => Number(!get("_latteBanishUsed")),
  },
  {
    name: "Mafia Middle Finger Ring",
    banish: $skill`Show them your middle finger`,
    spec: { acc1: $item`Mafia middle finger ring` },
    macro: Macro.skill($skill`Show them your middle finger`),
    have: () => have($item`Mafia middle finger ring`),
    available: () => get("_mafiaMiddleFingerRingUsed"),
    remaining: () => Number(!get("_mafiaMiddleFingerRingUsed")),
  },
  {
    name: "Creepy Grin",
    banish: $skill`Creepy Grin`,
    spec: { acc1: $item`V for Vivala Mask` },
    macro: Macro.skill($skill`Creepy Grin`),
    have: () => have($item`V for Vivala Mask`),
    available: () => get("_vmaskBanisherUsed"),
    remaining: () => Number(!get("_vmaskBanisherUsed")),
  },
  {
    name: "Stinky Cheese Eye",
    banish: $skill`Give Your Opponent The Stinkeye`,
    spec: { acc1: $item`stinky cheese eye` },
    macro: Macro.skill($skill`Give Your Opponent The Stinkeye`),
    have: () =>
      [
        $item`stinky cheese eye`,
        ...getFoldGroup($item`stinky cheese eye`),
      ].some((i) => have(i)),
    available: () => !get("_stinkyCheeseBanisherUsed"),
    remaining: () => Number(!get("_stinkyCheeseBanisherUsed")),
  },
  // et cetera
];

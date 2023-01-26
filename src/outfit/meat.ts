import {
  bjornifyFamiliar,
  canEquip,
  cliExecute,
  enthroneFamiliar,
  equippedItem,
  haveEquipped,
  inebrietyLimit,
  Item,
  mallPrice,
  myClass,
  myFamiliar,
  myInebriety,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  $slots,
  findLeprechaunMultiplier,
  get,
  getKramcoWandererChance,
  have,
  Modes,
  Requirement,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { embezzlerCount } from "../embezzler";
import { meatFamiliar } from "../familiar";
import { baseMeat } from "../lib";
import { digitizedMonstersRemaining } from "../turns";
import { bestBjornalike, pickBjorn, valueBjornModifiers } from "./bjorn";
import { bonusGear } from "./bonusgear";
import {
  BonusEquipMode,
  familiarWaterBreathingEquipment,
  useUPCs,
  waterBreathingEquipment,
} from "./lib";

const stickerSlots = $slots`sticker1, sticker2, sticker3`;
const UPC = $item`scratch 'n' sniff UPC sticker`;
const DEFAULT_MODES: Modes = {
  parka: "kachungasaur",
  backupcamera: "meat",
  snowsuit: "nose",
  retrocape: "robot kill",
  edpiece: "fish",
};
export function meatOutfit(embezzlerUp: boolean, requirement?: Requirement, sea?: boolean): void {
  const mode = embezzlerUp ? BonusEquipMode.EMBEZZLER : BonusEquipMode.BARF;
  const bjornChoice = pickBjorn(mode);

  const parameters = [...(requirement?.maximizeParameters ?? []), "-tie"];
  const forceEquip = requirement?.maximizeOptions.forceEquip ?? [];
  const preventEquip = requirement?.maximizeOptions.preventEquip ?? [];
  const preventSlot = requirement?.maximizeOptions.preventSlot ?? [];
  const modes = {
    ...DEFAULT_MODES,
    ...(requirement?.maximizeOptions.modes ?? {}),
  };

  if (!("parka" in modes)) modes.parka = "kachungasaur";

  if (!embezzlerUp) {
    if (myInebriety() > inebrietyLimit()) {
      forceEquip.push($item`Drunkula's wineglass`);
    } else {
      if (
        have($item`protonic accelerator pack`) &&
        get("questPAGhost") === "unstarted" &&
        get("nextParanormalActivity") <= totalTurnsPlayed() &&
        !preventEquip.includes($item`protonic accelerator pack`)
      ) {
        forceEquip.push($item`protonic accelerator pack`);
      }

      if (have($item`mafia pointer finger ring`)) {
        if (myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`)) {
          forceEquip.push($item`mafia pointer finger ring`);
        } else if (have($item`Operation Patriot Shield`) && myClass() === $class`Turtle Tamer`) {
          forceEquip.push(...$items`Operation Patriot Shield, mafia pointer finger ring`);
        } else if (have($item`haiku katana`)) {
          forceEquip.push(...$items`haiku katana, mafia pointer finger ring`);
        } else if (
          have($item`unwrapped knock-off retro superhero cape`) &&
          forceEquip.every((equipment) => toSlot(equipment) !== $slot`back`)
        ) {
          const gun =
            have($item`love`) && meatFamiliar() === $familiar`Robortender`
              ? $item`love`
              : $item`ice nine`;
          if (gun === $item`ice nine` && !have($item`ice nine`)) {
            cliExecute("refresh inventory");
            retrieveItem($item`ice nine`);
          }
          forceEquip.push(
            gun,
            ...$items`unwrapped knock-off retro superhero cape, mafia pointer finger ring`
          );
          modes.retrocape = "robot kill";
        } else if (have($item`Operation Patriot Shield`)) {
          forceEquip.push(...$items`Operation Patriot Shield, mafia pointer finger ring`);
        }
      }

      if (
        getKramcoWandererChance() > 0.05 &&
        have($item`Kramco Sausage-o-Matic™`) &&
        forceEquip.every((equipment) => toSlot(equipment) !== $slot`off-hand`) &&
        !preventEquip.includes($item`Kramco Sausage-o-Matic™`)
      ) {
        forceEquip.push($item`Kramco Sausage-o-Matic™`);
      }
    }
  } else {
    const currentWeapon = 25 * findLeprechaunMultiplier(meatFamiliar());
    const embezzlers = globalOptions.ascend
      ? Math.min(20, embezzlerCount() || digitizedMonstersRemaining())
      : 20;

    const addedValueOfFullSword = (embezzlers * ((75 - currentWeapon) * (750 + baseMeat))) / 100;
    if (addedValueOfFullSword > 3 * mallPrice(UPC)) {
      const needed = 3 - stickerSlots.filter((sticker) => equippedItem(sticker) === UPC).length;
      if (needed) acquire(needed, UPC, addedValueOfFullSword / 3, false);
      useUPCs();
    }
  }

  if (stickerSlots.map((s) => equippedItem(s)).includes($item.none)) {
    preventEquip.push(...$items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`);
  }

  if (myFamiliar() === $familiar`Obtuse Angel`) {
    forceEquip.push($item`quake of arrows`);
    if (!have($item`quake of arrows`)) retrieveItem($item`quake of arrows`);
  }
  if (sea) {
    if (!myFamiliar().underwater) {
      const familiarEquip = familiarWaterBreathingEquipment.find((item) => have(item));
      if (familiarEquip) forceEquip.push(familiarEquip);
    }
    const airEquip = waterBreathingEquipment.find((item) => have(item) && canEquip(item));
    if (airEquip) forceEquip.push(airEquip);
    else parameters.push("sea");
  }

  const bjornAlike = bestBjornalike(forceEquip);
  const compiledRequirements = new Requirement(parameters, {
    forceEquip,
    preventEquip: [
      ...preventEquip,
      ...(embezzlerUp ? $items`cheap sunglasses` : []),
      bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
    ].filter((item) => !forceEquip.includes(item)),
    preventSlot,
    modes,
    bonusEquip: new Map<Item, number>([
      ...bonusGear(mode),
      ...(bjornAlike
        ? new Map<Item, number>([
            [
              bjornAlike,
              (!bjornChoice.dropPredicate || bjornChoice.dropPredicate()
                ? bjornChoice.meatVal() * bjornChoice.probability
                : 0) + valueBjornModifiers(mode, bjornChoice.modifier),
            ],
          ])
        : []),
    ]),
  });

  compiledRequirements.maximize();

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);

  const missingEquips = () =>
    (compiledRequirements.maximizeOptions.forceEquip ?? []).filter(
      (equipment) => !haveEquipped(equipment)
    );

  if (missingEquips().length > 0) {
    cliExecute("refresh all");
    new Requirement([], { forceUpdate: true }).merge(compiledRequirements).maximize();
  }
  if (missingEquips().length > 0) {
    throw new Error(
      `Maximizer failed to equip the following equipment: ${missingEquips()
        .map((equipment) => equipment.name)
        .join(", ")}.?`
    );
  }
}

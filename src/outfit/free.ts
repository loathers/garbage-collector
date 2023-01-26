import {
  bjornifyFamiliar,
  cliExecute,
  enthroneFamiliar,
  haveEquipped,
  Item,
  myFamiliar,
  toSlot,
} from "kolmafia";
import { $familiar, $familiars, $item, $slot, get, have, Requirement } from "libram";
import { bonusGear } from "./bonusgear";
import { bestBjornalike, pickBjorn } from "./bjorn";
import { BonusEquipMode } from "./lib";
const DEFAULT_MODES = { snowsuit: "nose" };
export function freeFightOutfit(requirement?: Requirement): void {
  const mode = myFamiliar() === $familiar`Machine Elf` ? BonusEquipMode.DMT : BonusEquipMode.FREE;

  const bjornChoice = pickBjorn(mode);
  const parameters = [...(requirement?.maximizeParameters ?? []), "-tie"];
  const forceEquip = requirement?.maximizeOptions.forceEquip ?? [];
  const bonusEquip = requirement?.maximizeOptions.bonusEquip ?? new Map();
  const preventEquip = requirement?.maximizeOptions.preventEquip ?? [];
  const preventSlot = requirement?.maximizeOptions.preventSlot ?? [];
  const modes = { ...DEFAULT_MODES, ...(requirement?.maximizeOptions.modes ?? {}) };

  parameters.push(
    $familiars`Pocket Professor, Grey Goose`.includes(myFamiliar())
      ? "Familiar Experience"
      : "Familiar Weight"
  );
  [];

  if (
    have($item`vampyric cloake`) &&
    get("_vampyreCloakeFormUses") < 10 &&
    forceEquip.every((equip) => toSlot(equip) !== $slot`back`)
  ) {
    forceEquip.push($item`vampyric cloake`);
  }

  const bjornAlike = bestBjornalike(forceEquip);

  preventEquip.push(
    bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`
  );

  if (myFamiliar() !== $familiar`Grey Goose`) bonusEquip.set($item`tiny stillsuit`, 69);

  const finalRequirement = new Requirement(parameters, {
    forceEquip,
    preventEquip: [
      ...preventEquip,
      bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
    ].filter((item) => !forceEquip.includes(item)),
    bonusEquip: new Map<Item, number>([
      ...bonusEquip,
      ...bonusGear(mode),
      ...(bjornAlike
        ? new Map<Item, number>([
            [
              bjornAlike,
              !bjornChoice.dropPredicate || bjornChoice.dropPredicate()
                ? bjornChoice.meatVal() * bjornChoice.probability
                : 0,
            ],
          ])
        : []),
    ]),
    preventSlot,
    modes,
  });
  finalRequirement.maximize();

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);

  const missingEquips = () =>
    (finalRequirement.maximizeOptions.forceEquip ?? []).filter(
      (equipment) => !haveEquipped(equipment)
    );
  if (missingEquips().length > 0) {
    cliExecute("refresh all");
    new Requirement([], { forceUpdate: true }).merge(finalRequirement).maximize();
  }
  if (missingEquips().length > 0) {
    throw new Error(
      `Maximizer failed to equip the following equipment: ${missingEquips()
        .map((equipment) => equipment.name)
        .join(", ")}.?`
    );
  }
}

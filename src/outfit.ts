import {
  bjornifyFamiliar,
  canAdventure,
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
  numericModifier,
  retrieveItem,
  toInt,
  toSlot,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  $slots,
  CombatLoversLocket,
  findLeprechaunMultiplier,
  get,
  getKramcoWandererChance,
  have,
  Requirement,
} from "libram";
import { acquire } from "./acquire";
import { bestBjornalike, bonusGear, pickBjorn, valueBjornModifiers } from "./dropsgear";
import { embezzlerCount } from "./embezzler";
import { meatFamiliar } from "./familiar";
import { baseMeat, globalOptions } from "./lib";
import { digitizedMonstersRemaining } from "./wanderer";

export function freeFightOutfit(requirement?: Requirement): void {
  const equipMode = myFamiliar() === $familiar`Machine Elf` ? "dmt" : "free";
  const bjornChoice = pickBjorn(equipMode);

  const parameters = [...(requirement?.maximizeParameters ?? []), "-tie"];
  const forceEquip = requirement?.maximizeOptions.forceEquip ?? [];
  const bonusEquip = requirement?.maximizeOptions.bonusEquip ?? new Map();
  const preventEquip = requirement?.maximizeOptions.preventEquip ?? [];
  const preventSlot = requirement?.maximizeOptions.preventSlot ?? [];

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
      ...bonusGear(equipMode),
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
    preventSlot: preventSlot,
  });
  finalRequirement.maximize();

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");

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

export function refreshLatte(): boolean {
  // Refresh unlocked latte ingredients
  if (have($item`latte lovers member's mug`)) {
    visitUrl("main.php?latte=1", false);
  }

  return have($item`latte lovers member's mug`);
}

export function tryFillLatte(): boolean {
  if (
    have($item`latte lovers member's mug`) &&
    get("_latteRefillsUsed") < 3 &&
    (get("_latteCopyUsed") ||
      (get("latteUnlocks").includes("cajun") &&
        get("latteUnlocks").includes("rawhide") &&
        (numericModifier($item`latte lovers member's mug`, "Familiar Weight") !== 5 ||
          numericModifier($item`latte lovers member's mug`, "Meat Drop") !== 40 ||
          (get("latteUnlocks").includes("carrot") &&
            numericModifier($item`latte lovers member's mug`, "Item Drop") !== 20))))
  ) {
    const goodLatteIngredients = ["cajun", "rawhide", "carrot"];
    const latteIngredients = goodLatteIngredients.filter((ingredient) =>
      get("latteUnlocks").includes(ingredient)
    );
    if (latteIngredients.length < 3) latteIngredients.push("pumpkin");
    if (latteIngredients.length < 3) latteIngredients.push("vanilla");
    if (latteIngredients.length < 3) latteIngredients.push("cinnamon");
    cliExecute(`latte refill ${latteIngredients.join(" ")}`);
  }

  return (
    numericModifier($item`latte lovers member's mug`, "Familiar Weight") === 5 &&
    numericModifier($item`latte lovers member's mug`, "Meat Drop") === 40
  );
}

export function meatOutfit(embezzlerUp: boolean, requirement?: Requirement, sea?: boolean): void {
  const equipMode = embezzlerUp ? "embezzler" : "barf";
  const bjornChoice = pickBjorn(equipMode);

  const parameters = [...(requirement?.maximizeParameters ?? []), "-tie"];
  const forceEquip = requirement?.maximizeOptions.forceEquip ?? [];
  const preventEquip = requirement?.maximizeOptions.preventEquip ?? [];
  const preventSlot = requirement?.maximizeOptions.preventSlot ?? [];

  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
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

  const stickerSlots = $slots`sticker1, sticker2, sticker3`;
  const UPC = $item`scratch 'n' sniff UPC sticker`;

  if (embezzlerUp) {
    const currentWeapon = 25 * findLeprechaunMultiplier(meatFamiliar());
    const embezzlers = globalOptions.ascending
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

  if (
    embezzlerUp &&
    myFamiliar() !== $familiar`Pocket Professor` &&
    CombatLoversLocket.have() &&
    !CombatLoversLocket.unlockedLocketMonsters().includes($monster`Knob Goblin Embezzler`)
  ) {
    forceEquip.push(CombatLoversLocket.locket);
  }

  const bjornAlike = bestBjornalike(forceEquip);
  const compiledRequirements = (requirement ?? new Requirement([], {})).merge(
    new Requirement(
      [
        `${((embezzlerUp ? baseMeat + 750 : baseMeat) / 100).toFixed(2)} Meat Drop`,
        `${embezzlerUp ? 0 : 0.72} Item Drop`,
        ...parameters,
      ],
      {
        forceEquip,
        preventEquip: [
          ...preventEquip,
          ...(embezzlerUp ? $items`cheap sunglasses` : []),
          bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
        ].filter((item) => !forceEquip.includes(item)),
        bonusEquip: new Map([
          ...bonusGear(equipMode),
          ...(bjornAlike
            ? new Map<Item, number>([
                [
                  bjornAlike,
                  (!bjornChoice.dropPredicate || bjornChoice.dropPredicate()
                    ? bjornChoice.meatVal() * bjornChoice.probability
                    : 0) + valueBjornModifiers(equipMode, bjornChoice.modifier),
                ],
              ])
            : []),
        ]),
        preventSlot: preventSlot,
      }
    )
  );
  compiledRequirements.maximize();

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");
  if (
    haveEquipped($item`unwrapped knock-off retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "robot" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape robot kill");
  }

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

  if (sea && haveEquipped($item`The Crown of Ed the Undying`)) cliExecute("edpiece fish");
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

let cachedUsingPurse: boolean | null = null;
export function usingPurse(): boolean {
  if (cachedUsingPurse === null) {
    cachedUsingPurse =
      myInebriety() <= inebrietyLimit() &&
      (!have($item`latte lovers member's mug`) ||
        !have($familiar`Robortender`) ||
        !canAdventure($location`The Black Forest`));
  }
  return cachedUsingPurse;
}

export function useUPCs(): void {
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if ($items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`.every((i) => !have(i))) {
    visitUrl(`bedazzle.php?action=juststick&sticker=${toInt(UPC)}&pwd`);
  }
  for (let slotNumber = 1; slotNumber <= 3; slotNumber++) {
    const slot = toSlot(`sticker${slotNumber}`);
    const sticker = equippedItem(slot);
    if (sticker === UPC) continue;
    visitUrl("bedazzle.php");
    if (sticker !== $item.none) {
      visitUrl(`bedazzle.php?action=peel&pwd&slot=${slotNumber}`);
    }
    visitUrl(`bedazzle.php?action=stick&pwd&slot=${slotNumber}&sticker=${toInt(UPC)}`);
  }
}

import {
  bjornifyFamiliar,
  booleanModifier,
  cliExecute,
  enthroneFamiliar,
  equip,
  equippedAmount,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  haveEquipped,
  inebrietyLimit,
  mallPrice,
  myClass,
  myFamiliar,
  myFullness,
  myInebriety,
  numericModifier,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $slot,
  $slots,
  get,
  getFoldGroup,
  getKramcoWandererChance,
  have,
  maximizeCached,
} from "libram";
import { pickBjorn } from "./bjorn";
import { estimatedTurns, globalOptions } from "./globalvars";
import { baseMeat, BonusEquipMode, Requirement, saleValue } from "./lib";

const bestAdventuresFromPants =
  Item.all()
    .filter(
      (item) =>
        toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0
    )
    .map((pants) => numericModifier(pants, "Adventures"))
    .sort((a, b) => b - a)[0] || 0;

export function freeFightOutfit(requirements: Requirement[] = [new Requirement([], {})]): void {
  const equipMode =
    myFamiliar() === $familiar`Machine Elf` ? BonusEquipMode.DMT : BonusEquipMode.FREE;
  const bjornChoice = pickBjorn(equipMode);
  const compiledRequirements = Requirement.merge(requirements) ;
  const compiledOptions = compiledRequirements.maximizeOptions();
  const compiledParameters = compiledRequirements.maximizeParameters();

  const forceEquip = compiledOptions.forceEquip ?? [];
  const bonusEquip = compiledOptions.bonusEquip ?? new Map<Item, number>();
  const preventEquip = compiledOptions.preventEquip ?? [];
  const preventSlot = compiledOptions.preventSlot ?? [];
  const parameters = compiledParameters;

  parameters.push(
    myFamiliar() === $familiar`Pocket Professor` ? "Familiar Experience" : "Familiar Weight"
  );

  if (
    have($item`vampyric cloake`) &&
    get("_vampyreCloakeFormUses") < 10 &&
    forceEquip.every((equip) => toSlot(equip) !== $slot`back`)
  ) {
    forceEquip.push($item`vampyric cloake`);
  }

  const bjornAlike =
    have($item`Buddy Bjorn`) && forceEquip.every((equipment) => toSlot(equipment) !== $slot`back`)
      ? $item`Buddy Bjorn`
      : $item`Crown of Thrones`;
  preventEquip.push(
    bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`
  );

  const finalRequirement = new Requirement(parameters, {
    forceEquip: forceEquip,
    preventEquip: preventEquip,
    bonusEquip: new Map<Item, number>([
      ...bonusEquip,
      ...dropsItems(equipMode),
      ...pantsgiving(),
      ...cheeses(false),
      [
        bjornAlike,
        !bjornChoice.dropPredicate || bjornChoice.dropPredicate()
          ? bjornChoice.meatVal() * bjornChoice.probability
          : 0,
      ],
    ]),
    preventSlot: [...preventSlot, ...$slots`crown-of-thrones, buddy-bjorn`],
  });
  maximizeCached(finalRequirement.maximizeParameters(), finalRequirement.maximizeOptions());

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");
}

export function meatOutfit(
  embezzlerUp: boolean,
  requirements: Requirement[] = [],
  sea?: boolean
): void {
  const forceEquip = [];
  const additionalRequirements = [];
  const equipMode = embezzlerUp ? BonusEquipMode.EMBEZZLER : BonusEquipMode.BARF;
  const bjornChoice = pickBjorn(equipMode);

  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
    if (getKramcoWandererChance() > 0.05 && have($item`Kramco Sausage-o-Matic™`)) {
      forceEquip.push($item`Kramco Sausage-o-Matic™`);
    }
    // TODO: Fix pointer finger ring construction.
    if (myClass() !== $class`Seal Clubber`) {
      if (have($item`haiku katana`)) {
        forceEquip.push($item`haiku katana`);
      } else if (have($item`unwrapped knock-off retro superhero cape`)) {
        if (!have($item`ice nine`)) retrieveItem($item`ice nine`);
        forceEquip.push($item`ice nine`);
      }
    }
    if (
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") === "unstarted" &&
      get("nextParanormalActivity") <= totalTurnsPlayed() &&
      !forceEquip.includes($item`ice nine`)
    ) {
      forceEquip.push($item`protonic accelerator pack`);
    }
    forceEquip.push($item`mafia pointer finger ring`);
  }
  if (myFamiliar() === $familiar`Obtuse Angel`) {
    forceEquip.push($item`quake of arrows`);
    if (!have($item`quake of arrows`)) retrieveItem($item`quake of arrows`);
  }
  if (sea) {
    additionalRequirements.push("sea");
  }
  const bjornAlike =
    have($item`Buddy Bjorn`) && !forceEquip.some((item) => toSlot(item) === $slot`back`)
      ? $item`Buddy Bjorn`
      : $item`Crown of Thrones`;
  const compiledRequirements = Requirement.merge([
    ...requirements,
    new Requirement(
      [
        `${((embezzlerUp ? baseMeat + 750 : baseMeat) / 100).toFixed(2)} Meat Drop`,
        `${embezzlerUp ? 0 : 0.72} Item Drop`,
        ...additionalRequirements,
      ],
      {
        forceEquip,
        preventEquip: [
          ...$items`broken champagne bottle, unwrapped knock-off retro superhero cape`,
          ...(embezzlerUp ? $items`cheap sunglasses` : []),
          bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
        ],
        bonusEquip: new Map([
          ...dropsItems(equipMode),
          ...(embezzlerUp ? [] : pantsgiving()),
          ...cheeses(embezzlerUp),
          [
            bjornAlike,
            !bjornChoice.dropPredicate || bjornChoice.dropPredicate()
              ? bjornChoice.meatVal() * bjornChoice.probability
              : 0,
          ],
        ]),
        preventSlot: $slots`crown-of-thrones, buddy-bjorn`,
      }
    ),
  ]);

  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());

  if (equippedAmount($item`ice nine`) > 0) {
    equip($item`unwrapped knock-off retro superhero cape`);
  }
  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");
  if (sea) {
    if (!booleanModifier("Adventure Underwater")) {
      for (const airSource of waterBreathingEquipment) {
        if (have(airSource)) {
          if (airSource === $item`The Crown of Ed the Undying`) cliExecute("edpiece fish");
          equip(airSource);
          break;
        }
      }
    }
    if (!booleanModifier("Underwater Familiar")) {
      for (const airSource of familiarWaterBreathingEquipment) {
        if (have(airSource)) {
          equip(airSource);
          break;
        }
      }
    }
  }
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy Mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

function pantsgiving() {
  if (!have($item`Pantsgiving`)) return new Map<Item, number>();
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;
  if (turns - count > estimatedTurns()) return new Map<Item, number>();
  const expectedSinusTurns = getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
  const expectedUseableSinusTurns = globalOptions.ascending
    ? Math.min(
        estimatedTurns() - haveEffect($effect`Kicked in the Sinuses`),
        expectedSinusTurns,
        estimatedTurns() - (turns - count)
      )
    : expectedSinusTurns;
  const sinusVal = expectedUseableSinusTurns * 1.0 * baseMeat;
  if (turns - count > estimatedTurns()) return new Map<Item, number>();
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`Special Seasoning`));
  return new Map<Item, number>([[$item`Pantsgiving`, fullnessValue / (turns * 0.9)]]);
}
const haveSomeCheese = getFoldGroup($item`stinky cheese diaper`).some((item) => have(item));
function cheeses(embezzlerUp: boolean) {
  return haveSomeCheese &&
    !globalOptions.ascending &&
    get("_stinkyCheeseCount") < 100 &&
    estimatedTurns() >= 100 - get("_stinkyCheeseCount") &&
    !embezzlerUp
    ? new Map<Item, number>(
        getFoldGroup($item`stinky cheese diaper`).map((item) => [
          item,
          get("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100),
        ])
      )
    : [];
}
function snowSuit(equipMode: BonusEquipMode) {
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (
    !have($item`Snow Suit`) ||
    get("_carrotNoseDrops") >= 3 ||
    [BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].some((mode) => mode === equipMode)
  )
    return new Map<Item, number>([]);

  return new Map<Item, number>([[$item`Snow Suit`, saleValue($item`carrot nose`) / 10]]);
}
function mayflowerBouquet(equipMode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (
    !have($item`Mayflower bouquet`) ||
    [BonusEquipMode.EMBEZZLER, BonusEquipMode.DMT].some((mode) => mode === equipMode)
  )
    return new Map<Item, number>([]);

  const sporadicMeatBonus = (40 * 0.125 * (equipMode === BonusEquipMode.BARF ? baseMeat : 0)) / 100;
  const averageFlowerValue =
    saleValue(
      ...$items`tin magnolia, upsy daisy, lesser grodulated violet, half-orchid, begpwnia`
    ) * Math.max(0.01, 0.5 - get("_mayflowerDrops") * 0.11);
  return new Map<Item, number>([
    [
      $item`Mayflower bouquet`,
      (get("_mayflowerDrops") < 10 ? averageFlowerValue : 0) + sporadicMeatBonus,
    ],
  ]);
}
function dropsItems(equipMode: BonusEquipMode) {
  const isFree = [BonusEquipMode.FREE, BonusEquipMode.DMT].some((mode) => mode === equipMode);
  return new Map<Item, number>([
    [$item`mafia thumb ring`, !isFree ? 300 : 0],
    [$item`lucky gold ring`, 400],
    [$item`Mr. Cheeng's spectacles`, 250],
    [$item`pantogram pants`, get("_pantogramModifier").includes("Drops Items") ? 100 : 0],
    [$item`Mr. Screege's spectacles`, 180],
    ...snowSuit(equipMode),
    ...mayflowerBouquet(equipMode),
  ]);
}

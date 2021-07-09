import {
  myInebriety,
  inebrietyLimit,
  myFamiliar,
  myClass,
  retrieveItem,
  equippedAmount,
  equip,
  totalTurnsPlayed,
  booleanModifier,
  cliExecute,
  haveEquipped,
  bjornifyFamiliar,
  enthroneFamiliar,
  toSlot,
  myAdventures,
  mallPrice,
  fullnessLimit,
  myFullness,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $slot,
  get,
  getKramcoWandererChance,
  have,
  maximizeCached,
  MaximizeOptions,
} from "libram";
import { pickBjorn, PickBjornMode, withProperties } from "./lib";
import { baseMeat } from "./mood";

export class Requirement {
  maximizeParameters_: string[];
  maximizeOptions_: MaximizeOptions;

  constructor(maximizeParameters_: string[], maximizeOptions_: MaximizeOptions) {
    this.maximizeParameters_ = maximizeParameters_;
    this.maximizeOptions_ = maximizeOptions_;
  }

  maximizeParameters() {
    return this.maximizeParameters_;
  }

  maximizeOptions() {
    return this.maximizeOptions_;
  }

  merge(other: Requirement) {
    const optionsA = this.maximizeOptions();
    const optionsB = other.maximizeOptions();
    return new Requirement([...this.maximizeParameters(), ...other.maximizeParameters()], {
      ...optionsA,
      ...optionsB,
      bonusEquip: new Map([
        ...(optionsA.bonusEquip?.entries() ?? []),
        ...(optionsB.bonusEquip?.entries() ?? []),
      ]),
      forceEquip: [...(optionsA.forceEquip ?? []), ...(optionsB.forceEquip ?? [])],
      preventEquip: [...(optionsA.preventEquip ?? []), ...(optionsB.preventEquip ?? [])],
    });
  }

  static merge(allRequirements: Requirement[]) {
    return allRequirements.reduce((x, y) => x.merge(y));
  }
}

export function freeFightOutfit(requirements: Requirement[] = []) {
  const bjornChoice = pickBjorn(PickBjornMode.FREE);

  const compiledRequirements = Requirement.merge([
    ...requirements,
    new Requirement(
      myFamiliar() === $familiar`Pocket Professor` ? ["Familiar Experience"] : ["Familiar Weight"],
      {
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, 100],
          [$item`Mr. Screege's spectacles`, 180],
          [$item`pantsgiving`, pantsgivingBonus()],
        ]),
      }
    ),
  ]);
  const bjornAlike =
    have($item`buddy bjorn`) &&
    !(
      compiledRequirements.maximizeOptions_.forceEquip &&
      compiledRequirements.maximizeOptions_.forceEquip.some(
        (equipment) => toSlot(equipment) === $slot`back`
      )
    )
      ? $item`buddy bjorn`
      : $item`crown of thrones`;
  const finalRequirements = compiledRequirements.merge(
    new Requirement([], {
      bonusEquip: new Map([
        [
          bjornAlike,
          !bjornChoice.dropPredicate || bjornChoice.dropPredicate()
            ? bjornChoice.meatVal() * bjornChoice.probability
            : 0,
        ],
      ]),
      preventEquip:
        bjornAlike === $item`buddy bjorn` ? $items`crown of thrones` : $items`buddy bjorn`,
    })
  );

  maximizeCached(finalRequirements.maximizeParameters(), finalRequirements.maximizeOptions());
  if (haveEquipped($item`buddy bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`crown of thrones`)) enthroneFamiliar(bjornChoice.familiar);
}

export function meatOutfit(embezzlerUp: boolean, requirements: Requirement[] = [], sea?: boolean) {
  const forceEquip = [];
  const additionalRequirements = [];
  const bjornChoice = pickBjorn(embezzlerUp ? PickBjornMode.EMBEZZLER : PickBjornMode.BARF);

  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
    if (getKramcoWandererChance() > 0.05 && have($item`Kramco Sausage-o-Matic™`)) {
      forceEquip.push($item`Kramco Sausage-o-Matic™`);
    }
    // TODO: Fix pointer finger ring construction.
    if (myClass() != $class`Seal Clubber`) {
      if (have($item`haiku katana`)) {
        forceEquip.push($item`haiku katana`);
      } else if (have($item`unwrapped retro superhero cape`)) {
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
  if (sea) {
    additionalRequirements.push("sea");
  }
  const bjornAlike =
    have($item`buddy bjorn`) && !forceEquip.some((item) => toSlot(item) === $slot`back`)
      ? $item`buddy bjorn`
      : $item`crown of thrones`;
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
          ...$items`broken champagne bottle, unwrapped retro superhero cape`,
          ...(embezzlerUp ? $items`cheap sunglasses` : []),
          bjornAlike === $item`buddy bjorn` ? $item`crown of thrones` : $item`buddy bjorn`,
        ],
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`mafia thumb ring`, 300],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, 100],
          [$item`Mr. Screege's spectacles`, 180],
          [$item`pantsgiving`, embezzlerUp ? 0 : pantsgivingBonus()],
          [
            bjornAlike,
            !bjornChoice.dropPredicate || bjornChoice.dropPredicate()
              ? bjornChoice.meatVal() * bjornChoice.probability
              : 0,
          ],
        ]),
      }
    ),
  ]);

  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());

  if (equippedAmount($item`ice nine`) > 0) {
    equip($item`unwrapped retro superhero cape`);
  }
  if (haveEquipped($item`buddy bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`crown of thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (sea) {
    if (!booleanModifier("Adventure Underwater")) {
      for (let airSource of waterBreathingEquipment) {
        if (have(airSource)) {
          if (airSource === $item`the crown of ed the undying`) cliExecute("edpiece fish");
          equip(airSource);
          break;
        }
      }
    }
    if (!booleanModifier("Underwater Familiar")) {
      for (let airSource of familiarWaterBreathingEquipment) {
        if (have(airSource)) {
          equip(airSource);
          break;
        }
      }
    }
  }
}

export const waterBreathingEquipment = $items`The Crown of Ed the Undying, aerated diving helmet, crappy mer-kin mask, Mer-kin gladiator mask, Mer-kin scholar mask, old SCUBA tank`;
export const familiarWaterBreathingEquipment = $items`das boot, little bitty bathysphere`;

function pantsgivingBonus() {
  if (!have($item`pantsgiving`)) return 0;
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;
  if (turns - count > myAdventures() * 1.04) return 0;
  const sinusVal = 50 * 1.0 * baseMeat; //if we add mayozapine support, fiddle with this
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`special seasoning`));
  return fullnessValue / (turns * 0.9);
}

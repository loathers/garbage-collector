import {
  myInebriety,
  inebrietyLimit,
  useFamiliar,
  myFamiliar,
  myClass,
  retrieveItem,
  equippedAmount,
  equip,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  get,
  getKramcoWandererChance,
  have,
  maximizeCached,
  MaximizeOptions,
} from "libram";
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
  const compiledRequirements = Requirement.merge([
    ...requirements,
    new Requirement(
      myFamiliar() === $familiar`Pocket Professor` ? ["Familiar Experience"] : ["Familiar Weight"],
      {
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, 100],
        ]),
      }
    ),
  ]);
  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());
}

export function meatOutfit(embezzlerUp: boolean, requirements: Requirement[] = [], sea?: boolean) {
  const forceEquip = [];
  const additionalRequirements = [];
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
    additionalRequirements.push("sea")
  }
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
        ],
        bonusEquip: new Map([
          [$item`lucky gold ring`, 400],
          [$item`mafia thumb ring`, 300],
          [$item`Mr. Cheeng's spectacles`, 250],
          [$item`pantogram pants`, 100],
        ]),
      }
    ),
  ]);
  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());
  if (equippedAmount($item`ice nine`) > 0) {
    equip($item`unwrapped retro superhero cape`);
  }
  if (sea) maximizeCached(["sea -tie"]);
}

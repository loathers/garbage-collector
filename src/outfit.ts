import { myInebriety, inebrietyLimit, useFamiliar } from "kolmafia";
import { $item, $items, getKramcoWandererChance, maximizeCached, MaximizeOptions } from "libram";
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
    new Requirement(["Familiar Weight"], {
      forceEquip: $items`pantogram pants, lucky gold ring, Mr. Cheeng's spectacles`,
    }),
  ]);
  maximizeCached(compiledRequirements.maximizeParameters(), compiledRequirements.maximizeOptions());
}

export function meatOutfit(embezzlerUp: boolean) {
  const forceEquip = [];
  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
    if (getKramcoWandererChance() > 0.05) forceEquip.push($item`Kramco Sausage-o-Matic™`);
    // TODO: Fix pointer finger ring construction.
    forceEquip.push(...$items`haiku katana, mafia pointer finger ring`);
  }
  maximizeCached(
    [
      `${((embezzlerUp ? baseMeat + 750 : baseMeat) / 100).toFixed(2)} Meat Drop`,
      `${embezzlerUp ? 0 : 0.72} Item Drop`,
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
        [$item`pantogram pants`, 200],
      ]),
    }
  );
}

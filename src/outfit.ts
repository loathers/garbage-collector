import {
  bjornifyFamiliar,
  booleanModifier,
  cliExecute,
  enthroneFamiliar,
  equip,
  equippedItem,
  haveEquipped,
  inebrietyLimit,
  myClass,
  myFamiliar,
  myInebriety,
  numericModifier,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  $slots,
  get,
  getKramcoWandererChance,
  have,
  maximizeCached,
  Requirement,
} from "libram";
import { Potion } from "./potions";
import { bestBjornalike, bonusGear, pickBjorn, valueBjornModifiers } from "./dropsgear";
import { baseMeat } from "./lib";

export function freeFightOutfit(requirements: Requirement[] = []): void {
  const equipMode = myFamiliar() === $familiar`Machine Elf` ? "dmt" : "free";
  const bjornChoice = pickBjorn(equipMode);
  const compiledRequirements = Requirement.merge(requirements);
  const compiledOptions = compiledRequirements.maximizeOptions;
  const compiledParameters = compiledRequirements.maximizeParameters;

  const forceEquip = compiledOptions.forceEquip ?? [];
  const bonusEquip = compiledOptions.bonusEquip ?? new Map<Item, number>();
  const preventEquip = compiledOptions.preventEquip ?? [];
  const preventSlot = compiledOptions.preventSlot ?? [];
  const parameters = compiledParameters;

  parameters.push(
    myFamiliar() === $familiar`Pocket Professor` ? "Familiar Experience" : "Familiar Weight"
  );

  if (
    have($item`protonic accelerator pack`) &&
    get("questPAGhost") === "unstarted" &&
    get("nextParanormalActivity") <= totalTurnsPlayed()
  ) {
    forceEquip.push($item`protonic accelerator pack`);
  }

  const bjornAlike = bestBjornalike(forceEquip);

  preventEquip.push(
    bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`
  );

  const finalRequirement = new Requirement(parameters, {
    forceEquip: forceEquip,
    preventEquip: [
      ...preventEquip,
      ...$items`broken champagne bottle, Spooky Putty snake, Spooky Putty mitre, Spooky Putty leotard, Spooky Putty ball, papier-mitre, smoke ball`,
    ],
    bonusEquip: new Map<Item, number>([
      ...bonusEquip,
      ...cloake(),
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
    preventSlot: [...preventSlot, ...$slots`crown-of-thrones, buddy-bjorn`],
  });
  maximizeCached(finalRequirement.maximizeParameters, finalRequirement.maximizeOptions);

  if (bjornAlike && have(bjornAlike) && equippedItem(toSlot(bjornAlike)) === $item`none`)
    equip(bjornAlike);

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");
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

export function meatOutfit(
  embezzlerUp: boolean,
  requirements: Requirement[] = [],
  sea?: boolean
): void {
  const forceEquip: Item[] = [];
  const additionalRequirements = [];
  const equipMode = embezzlerUp ? "embezzler" : "barf";
  const bjornChoice = pickBjorn(equipMode);

  if (myInebriety() > inebrietyLimit()) {
    forceEquip.push($item`Drunkula's wineglass`);
  } else if (!embezzlerUp) {
    if (
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") === "unstarted" &&
      get("nextParanormalActivity") <= totalTurnsPlayed()
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
        if (!have($item`ice nine`)) {
          cliExecute("refresh inventory");
          retrieveItem($item`ice nine`);
        }
        forceEquip.push(
          ...$items`unwrapped knock-off retro superhero cape, ice nine, mafia pointer finger ring`
        );
      } else if (have($item`Operation Patriot Shield`)) {
        forceEquip.push(...$items`Operation Patriot Shield, mafia pointer finger ring`);
      }
    }

    if (
      getKramcoWandererChance() > 0.05 &&
      have($item`Kramco Sausage-o-Matic™`) &&
      forceEquip.every((equipment) => toSlot(equipment) !== $slot`off-hand`)
    ) {
      forceEquip.push($item`Kramco Sausage-o-Matic™`);
    }
  }
  if (myFamiliar() === $familiar`Obtuse Angel`) {
    forceEquip.push($item`quake of arrows`);
    if (!have($item`quake of arrows`)) retrieveItem($item`quake of arrows`);
  }
  if (sea) {
    additionalRequirements.push("sea");
  }
  const bjornAlike = bestBjornalike(forceEquip);
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
          ...$items`broken champagne bottle, Spooky Putty snake, Spooky Putty mitre, Spooky Putty leotard, Spooky Putty ball, papier-mitre, smoke ball`,
          ...(embezzlerUp ? $items`cheap sunglasses` : []),
          bjornAlike === $item`Buddy Bjorn` ? $item`Crown of Thrones` : $item`Buddy Bjorn`,
        ],
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
        preventSlot: $slots`crown-of-thrones, buddy-bjorn`,
      }
    ),
  ]);

  maximizeCached(compiledRequirements.maximizeParameters, compiledRequirements.maximizeOptions);

  if (bjornAlike && have(bjornAlike) && equippedItem(toSlot(bjornAlike)) === $item`none`)
    equip(bjornAlike);

  if (haveEquipped($item`Buddy Bjorn`)) bjornifyFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Crown of Thrones`)) enthroneFamiliar(bjornChoice.familiar);
  if (haveEquipped($item`Snow Suit`) && get("snowsuit") !== "nose") cliExecute("snowsuit nose");
  if (
    haveEquipped($item`unwrapped knock-off retro superhero cape`) &&
    (get("retroCapeSuperhero") !== "robot" || get("retroCapeWashingInstructions") !== "kill")
  ) {
    cliExecute("retrocape robot kill");
  }
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

function cloake(): Map<Item, number> {
  if (!have($item`vampyric cloake`) || get("_vampyreCloakeFormUses") >= 10) return new Map();

  const value = new Potion($item`vampyric cloake`, {
    effect: $effect`Wolf Form`,
    duration: 1,
  }).gross(embezzlerCount());
  return new Map<Item, number>([[$item`vampyric cloake`, value]]);
}


import {
  bjornifyFamiliar,
  booleanModifier,
  cliExecute,
  enthroneFamiliar,
  equip,
  equippedItem,
  fullnessLimit,
  getWorkshed,
  haveEffect,
  haveEquipped,
  inebrietyLimit,
  itemAmount,
  mallPrice,
  myClass,
  myFamiliar,
  myFullness,
  myInebriety,
  numericModifier,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  $slots,
  get,
  getFoldGroup,
  getKramcoWandererChance,
  getSaleValue,
  have,
  maximizeCached,
  Requirement,
} from "libram";
import { pickBjorn, valueBjornModifiers } from "./bjorn";
import { estimatedTurns } from "./embezzler";
import { meatFamiliar } from "./familiar";
import { baseMeat, BonusEquipMode, globalOptions, leprechaunMultiplier } from "./lib";

const bestAdventuresFromPants =
  Item.all()
    .filter(
      (item) =>
        toSlot(item) === $slot`pants` && have(item) && numericModifier(item, "Adventures") > 0
    )
    .map((pants) => numericModifier(pants, "Adventures"))
    .sort((a, b) => b - a)[0] || 0;

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

  const finalRequirement = new Requirement(parameters, {
    forceEquip: forceEquip,
    preventEquip: [
      ...preventEquip,
      ...$items`broken champagne bottle, Spooky Putty snake, Spooky Putty mitre, Spooky Putty leotard, Spooky Putty ball, papier-mitre, smoke ball`,
    ],
    bonusEquip: new Map<Item, number>([
      ...bonusEquip,
      ...dropsItems(equipMode),
      ...pantsgiving(),
      ...cheeses(false),
      ...shavingBonus(),
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
          ...dropsItems(equipMode),
          ...(embezzlerUp ? [] : pantsgiving()),
          ...cheeses(embezzlerUp),
          ...shavingBonus(),
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

const pantsgivingBonuses = new Map<number, number>();
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

  const cachedBonus = pantsgivingBonuses.get(turns);
  if (cachedBonus) return new Map([[$item`Pantsgiving`, cachedBonus]]);

  const expectedSinusTurns = getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
  const expectedUseableSinusTurns = globalOptions.ascending
    ? Math.min(
        estimatedTurns() - haveEffect($effect`Kicked in the Sinuses`),
        expectedSinusTurns,
        estimatedTurns() - (turns - count)
      )
    : expectedSinusTurns;
  const sinusVal = expectedUseableSinusTurns * 1.0 * baseMeat;
  const fullnessValue =
    sinusVal +
    get("valueOfAdventure") * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`Special Seasoning`));
  const pantsgivingBonus = fullnessValue / (turns * 0.9);
  pantsgivingBonuses.set(turns, pantsgivingBonus);
  return new Map<Item, number>([[$item`Pantsgiving`, pantsgivingBonus]]);
}

const haveSomeCheese = getFoldGroup($item`stinky cheese diaper`).some((item) => have(item));
function cheeses(embezzlerUp: boolean) {
  return haveSomeCheese &&
    !globalOptions.ascending &&
    get("_stinkyCheeseCount") < 100 &&
    estimatedTurns() >= 100 - get("_stinkyCheeseCount") &&
    !embezzlerUp
    ? new Map<Item, number>(
        getFoldGroup($item`stinky cheese diaper`)
          .filter((item) => toSlot(item) !== $slot`weapon`)
          .map((item) => [
            item,
            get("valueOfAdventure") * (10 - bestAdventuresFromPants) * (1 / 100),
          ])
      )
    : [];
}

function mafiaThumbRing(equipMode: BonusEquipMode) {
  if (!have($item`mafia thumb ring`) || ["free", "dmt"].some((mode) => mode === equipMode)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [$item`mafia thumb ring`, (1 / 0.96 - 1) * get("valueOfAdventure")],
  ]);
}

function luckyGoldRing(equipMode: BonusEquipMode) {
  if (!have($item`lucky gold ring`)) {
    return new Map<Item, number>([]);
  }

  // Volcoino has a low drop rate which isn't accounted for here
  // Overestimating until it drops is probably fine, don't @ me
  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? getSaleValue($item`sand dollar`) : 0, // This should be closeted
      itemAmount($item`Freddy Kruegerand`) > 0
        ? Math.max(
            getSaleValue($item`bottle of Bloodweiser`) / 200,
            getSaleValue($item`electric Kool-Aid`) / 200
          )
        : 0,
      get("sleazeAirportAlways") || get("_sleazeAirportToday")
        ? getSaleValue($item`one-day ticket to Spring Break Beach`) / 100
        : 0,
      get("spookyAirportAlways") || get("_spookyAirportToday")
        ? Math.max(
            getSaleValue($item`one-day ticket to Conspiracy Island`) / 100,
            getSaleValue($item`karma shawarma`) / 7
          )
        : 0,
      get("stenchAirportAlways") || get("_stenchAirportToday")
        ? getSaleValue($item`one-day ticket to Dinseylandfill`) / 20
        : 0,
      (get("hotAirportAlways") || get("_hotAirportToday")) && !get("_luckyGoldRingVolcoino")
        ? getSaleValue($item`one-day ticket to That 70s Volcano`) / 3
        : 0,
      get("coldAirportAlways") || get("_coldAirportToday")
        ? getSaleValue($item`one-day ticket to The Glaciest`) / 50
        : 0,
      get("frAlways") || get("_frToday") ? getSaleValue($item`FantasyRealm guest pass`) / 350 : 0,
    ].filter((value) => value > 0),
  ];

  // Items drop every ~10 turns
  return new Map<Item, number>([
    [
      $item`lucky gold ring`,
      dropValues.reduce((previous, current) => previous + current) / dropValues.length / 10,
    ],
  ]);
}

function mrCheengsSpectacles(equipMode: BonusEquipMode) {
  if (!have($item`Mr. Cheeng's spectacles`)) {
    return new Map<Item, number>([]);
  }

  // Items drop every 4 turns
  // TODO: Possible drops are speculated to be any pvpable potion that will never be banned by standard
  return new Map<Item, number>([[$item`Mr. Cheeng's spectacles`, 400]]);
}

function mrScreegesSpectacles(equipMode: BonusEquipMode) {
  if (!have($item`Mr. Screege's spectacles`)) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`Mr. Screege's spectacles`, 180]]);
}

function pantogramPants(equipMode: BonusEquipMode) {
  if (!have($item`pantogram pants`) || !get("_pantogramModifier").includes("Drops Items")) {
    return new Map<Item, number>([]);
  }

  // TODO: Calculate actual bonus value (good luck!)
  return new Map<Item, number>([[$item`pantogram pants`, 100]]);
}

function bagOfManyConfections(equipMode: BonusEquipMode) {
  if (!have($item`bag of many confections`)) {
    return new Map<Item, number>([]);
  }

  return new Map<Item, number>([
    [
      $item`bag of many confections`,
      getSaleValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6,
    ],
  ]);
}

function snowSuit(equipMode: BonusEquipMode) {
  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (
    !have($item`Snow Suit`) ||
    get("_carrotNoseDrops") >= 3 ||
    ["embezzler", "dmt"].some((mode) => mode === equipMode)
  )
    return new Map<Item, number>([]);

  return new Map<Item, number>([[$item`Snow Suit`, getSaleValue($item`carrot nose`) / 10]]);
}

function mayflowerBouquet(equipMode: BonusEquipMode) {
  // +40% meat drop 12.5% of the time (effectively 5%)
  // Drops flowers 50% of the time, wiki says 5-10 a day.
  // Theorized that flower drop rate drops off but no info on wiki.
  // During testing I got 4 drops then the 5th took like 40 more adventures
  // so let's just assume rate drops by 11% with a min of 1% ¯\_(ツ)_/¯

  // Ignore for EMBEZZLER
  // Ignore for DMT, assuming mafia might get confused about the drop by the weird combats
  if (!have($item`Mayflower bouquet`) || ["embezzler", "dmt"].some((mode) => mode === equipMode))
    return new Map<Item, number>([]);

  const sporadicMeatBonus = (40 * 0.125 * (equipMode === "barf" ? baseMeat : 0)) / 100;
  const averageFlowerValue =
    getSaleValue(
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
  return new Map<Item, number>([
    ...mafiaThumbRing(equipMode),
    ...luckyGoldRing(equipMode),
    ...mrCheengsSpectacles(equipMode),
    ...mrScreegesSpectacles(equipMode),
    ...pantogramPants(equipMode),
    ...bagOfManyConfections(equipMode),
    ...snowSuit(equipMode),
    ...mayflowerBouquet(equipMode),
  ]);
}

function bestBjornalike(existingForceEquips: Item[]): Item | undefined {
  const bjornalikes = $items`Buddy Bjorn, Crown of Thrones`;
  const slots = bjornalikes
    .map((bjornalike) => toSlot(bjornalike))
    .filter((slot) => !existingForceEquips.some((equipment) => toSlot(equipment) === slot));
  if (!slots.length) return undefined;
  if (slots.length < 2 || bjornalikes.some((thing) => !have(thing))) {
    return bjornalikes.find((thing) => have(thing) && slots.includes(toSlot(thing)));
  }

  const hasStrongLep = leprechaunMultiplier(meatFamiliar()) >= 2;
  const goodRobortHats = $items`crumpled felt fedora`;
  if (myClass() === $class`Turtle Tamer`) goodRobortHats.push($item`warbear foil hat`);
  if (numericModifier($item`shining star cap`, "Familiar Weight") === 10)
    goodRobortHats.push($item`shining star cap`);
  if (have($item`carpe`) && (!hasStrongLep || !goodRobortHats.some((hat) => have(hat)))) {
    return $item`Crown of Thrones`;
  }
  return $item`Buddy Bjorn`;
}

function shavingBonus(): Map<Item, number> {
  if (!have($item`Daylight Shavings Helmet`)) return new Map();
  if (
    $effects`Barbell Moustache, Cowboy Stache, Friendly Chops, Grizzly Beard, Gull-Wing Moustache, Musician's Musician's Moustache, Pointy Wizard Beard, Space Warlord's Beard, Spectacle Moustache, Surrealist's Moustache, Toiletbrush Moustache`.some(
      (effect) => have(effect)
    )
  ) {
    return new Map();
  }

  const bonusValue = (baseMeat * 100 + 72 * 50) / 100;
  return new Map<Item, number>([[$item`Daylight Shavings Helmet`, bonusValue]]);
}

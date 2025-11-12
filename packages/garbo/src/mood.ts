import {
  alliedRadio,
  booleanModifier,
  cliExecute,
  Effect,
  getWorkshed,
  haveEffect,
  itemAmount,
  mallPrice,
  myClass,
  myLevel,
  numericModifier,
  use,
  useSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $item,
  $skill,
  AsdonMartin,
  get,
  have,
  Mood,
  uneffect,
} from "libram";
import {
  baseMeat as baseMeatFunc,
  safeRestoreMpTarget,
  setChoice,
} from "./lib";
import { usingPurse } from "./outfit";
import { effectValue } from "./potions";
import { acquire } from "./acquire";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric, Ur-Kel's Aria of Annoyance`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
  useNativeRestores: true,
});

export function meatMood(
  urKels = false,
  meat: undefined | number = undefined,
): Mood {
  const baseMeat = baseMeatFunc();
  meat ||= baseMeat;
  // Reserve the amount of MP we try to restore before each fight.
  const mood = new Mood({ reserveMp: safeRestoreMpTarget() });

  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);
  mood.potion($item`resolution: be happier`, 0.15 * 0.45 * 0.8 * 200);

  const flaskValue = usingPurse() ? 0.3 * baseMeat : 5;
  mood.potion($item`Flaskfull of Hollow`, flaskValue);

  mood.skill($skill`Blood Bond`);
  mood.skill($skill`Leash of Linguini`);
  mood.skill($skill`Empathy of the Newt`);

  if (have($item`April Shower Thoughts shield`)) {
    mood.effect($effect`Thoughtful Empathy`);
    mood.effect($effect`Lubricating Sauce`);
    mood.effect($effect`Tubes of Universal Meat`);
    mood.effect($effect`Strength of the Tortoise`);
  }

  mood.skill($skill`The Polka of Plenty`);
  mood.skill($skill`Disco Leer`);
  mood.skill(
    urKels
      ? $skill`Ur-Kel's Aria of Annoyance`
      : $skill`Fat Leon's Phat Loot Lyric`,
  );
  mood.skill($skill`Singer's Faithful Ocelot`);
  mood.skill($skill`The Spirit of Taking`);
  mood.skill($skill`Drescher's Annoying Noise`);
  mood.skill($skill`Pride of the Puffin`);
  mood.skill($skill`Walk: Leisurely Amble`);
  mood.skill($skill`Call For Backup`);
  mood.skill($skill`Soothing Flute`);

  const mmjCost =
    (100 -
      (have($skill`Five Finger Discount`) ? 5 : 0) -
      (have($item`Travoltan trousers`) ? 5 : 0)) *
    (200 / (1.5 * myLevel() + 5));
  const genericManaPotionCost =
    mallPrice($item`generic mana potion`) * (200 / (2.5 * myLevel()));
  const mpRestorerCost = Math.min(mmjCost, genericManaPotionCost);

  if (myClass() !== $class`Pastamancer` && 0.1 * meat * 10 > mpRestorerCost) {
    mood.skill($skill`Bind Lasagmbie`);
  }

  if (getWorkshed() === $item`Asdon Martin keyfob (on ring)`) {
    mood.drive(AsdonMartin.Driving.Observantly);
  }

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View to Some Meat`, () => {
      if (get("_kgbClicksUsed") < 22) {
        const buffTries = Math.ceil((22 - get("_kgbClicksUsed")) / 3);
        cliExecute(
          `Briefcase buff ${new Array<string>(buffTries)
            .fill("meat")
            .join(" ")}`,
        );
      }
    });
  }

  if (!get("concertVisited") && get("sidequestArenaCompleted") === "fratboy") {
    cliExecute("concert winklered");
  } else if (
    !get("concertVisited") &&
    get("sidequestArenaCompleted") === "hippy"
  ) {
    cliExecute("concert optimist primal");
  }

  if (itemAmount($item`Bird-a-Day calendar`) > 0) {
    if (!have($skill`Seek out a Bird`) || !get("_canSeekBirds")) {
      use(1, $item`Bird-a-Day calendar`);
    }

    if (
      have($skill`Visit your Favorite Bird`) &&
      !get("_favoriteBirdVisited") &&
      (numericModifier($effect`Blessing of your favorite Bird`, "Meat Drop") >
        0 ||
        numericModifier($effect`Blessing of your favorite Bird`, "Item Drop") >
          0)
    ) {
      useSkill($skill`Visit your Favorite Bird`);
    }

    if (
      have($skill`Seek out a Bird`) &&
      get("_birdsSoughtToday") < 6 &&
      (numericModifier($effect`Blessing of the Bird`, "Meat Drop") > 0 ||
        numericModifier($effect`Blessing of the Bird`, "Item Drop") > 0)
    ) {
      // Ensure we don't get stuck in the choice if the count is wrong
      setChoice(1399, 2);
      useSkill($skill`Seek out a Bird`, 6 - get("_birdsSoughtToday"));
    }
  }

  if (
    have($skill`Incredible Self-Esteem`) &&
    $effects`Always be Collecting, Work For Hours a Week`.some((effect) =>
      have(effect),
    ) &&
    !get("_incredibleSelfEsteemCast")
  ) {
    useSkill($skill`Incredible Self-Esteem`);
  }

  if (!get("_alliedRadioWildsunBoon") && wildsunBoonWorthIt()) {
    const acquired = acquire(
      1,
      $item`handheld Allied radio`,
      effectValue($effect`Wildsun Boon`, 100),
      false,
    );
    if (!acquired) _wildsunBoonWorthIt = false;
    alliedRadio("wildsun boon");
  }

  const canRecord =
    getWorkshed() === $item`warbear LP-ROM burner` ||
    (have($item`warbear LP-ROM burner`) && !get("_workshedItemUsed")) ||
    get("questG04Nemesis") === "finished";

  if (myClass() === $class`Accordion Thief` && myLevel() >= 15 && !canRecord) {
    if (have($skill`The Ballad of Richie Thingfinder`)) {
      useSkill(
        $skill`The Ballad of Richie Thingfinder`,
        10 - get("_thingfinderCasts"),
      );
    }
    if (have($skill`Chorale of Companionship`)) {
      useSkill(
        $skill`Chorale of Companionship`,
        10 - get("_companionshipCasts"),
      );
    }
  }

  shrugBadEffects();

  return mood;
}

export function freeFightMood(...additionalEffects: Effect[]): Mood {
  const mood = new Mood();

  for (const effect of additionalEffects) {
    mood.effect(effect);
  }

  if (haveEffect($effect`Blue Swayed`) < 50) {
    use(
      Math.ceil((50 - haveEffect($effect`Blue Swayed`)) / 10),
      $item`pulled blue taffy`,
    );
  }
  mood.potion($item`white candy heart`, 30);

  mood.skill($skill`Curiosity of Br'er Tarrypin`);

  shrugBadEffects(...additionalEffects);

  if (getWorkshed() === $item`Asdon Martin keyfob (on ring)`) {
    mood.drive(AsdonMartin.Driving.Observantly);
  }

  return mood;
}

const damageEffects = Effect.all().filter((x) =>
  ["Thorns", "Sporadic Thorns", "Damage Aura", "Sporadic Damage Aura"].some(
    (modifier) => numericModifier(x, modifier) > 0,
  ),
);
const textAlteringEffects = Effect.all().filter((x) =>
  booleanModifier(x, "Alters Page Text"),
);
export const teleportEffects = Effect.all().filter((x) =>
  booleanModifier(x, "Adventure Randomly"),
);
const otherBadEffects = Effect.all().filter(
  (x) => booleanModifier(x, "Blind") || booleanModifier(x, "Always Fumble"),
);
export function shrugBadEffects(...exclude: Effect[]): void {
  [
    ...damageEffects,
    ...textAlteringEffects,
    ...teleportEffects,
    ...otherBadEffects,
  ]
    .filter((effect) => have(effect) && !exclude.includes(effect))
    .forEach((effect) => uneffect(effect));
}

let _wildsunBoonWorthIt: boolean;
function wildsunBoonWorthIt(): boolean {
  return (_wildsunBoonWorthIt ??=
    effectValue($effect`Wildsun Boon`, 100) >
    mallPrice($item`handheld Allied radio`));
}

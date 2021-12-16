import {
  cliExecute,
  getClanLounge,
  getWorkshed,
  haveEffect,
  haveSkill,
  itemAmount,
  myClass,
  myEffects,
  myLevel,
  mySpleenUse,
  numericModifier,
  spleenLimit,
  toSkill,
  use,
  useSkill,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $skill,
  $skills,
  AsdonMartin,
  get,
  have,
  Mood,
  set,
  uneffect,
  Witchess,
} from "libram";
import { baseMeat, questStep, setChoice } from "./lib";
import { estimatedTurns } from "./embezzler";
import { withStash } from "./clan";
import synthesize from "./synthesis";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric, Ur-Kel's Aria of Annoyance`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
});

export function meatMood(urKels = false): Mood {
  const mood = new Mood();

  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);
  mood.potion($item`resolution: be happier`, 0.15 * 0.45 * 0.8 * 200);

  const flaskValue =
    get("latteUnlocks").includes("cajun") &&
    get("latteUnlocks").includes("rawhide") &&
    have($familiar`Robortender`)
      ? 5
      : 0.3 * baseMeat;
  mood.potion($item`Flaskfull of Hollow`, flaskValue);

  mood.skill($skill`Blood Bond`);
  mood.skill($skill`Leash of Linguini`);
  mood.skill($skill`Empathy of the Newt`);

  mood.skill($skill`The Polka of Plenty`);
  mood.skill($skill`Disco Leer`);
  mood.skill(urKels ? $skill`Ur-Kel's Aria of Annoyance` : $skill`Fat Leon's Phat Loot Lyric`);
  mood.skill($skill`Singer's Faithful Ocelot`);
  mood.skill($skill`The Spirit of Taking`);
  mood.skill($skill`Drescher's Annoying Noise`);
  mood.skill($skill`Pride of the Puffin`);
  if (myClass() !== $class`Pastamancer`) mood.skill($skill`Bind Lasagmbie`);

  if (haveSkill($skill`Sweet Synthesis`)) {
    mood.effect($effect`Synthesis: Greed`, () => {
      if (
        mySpleenUse() < spleenLimit() &&
        haveEffect($effect`Synthesis: Greed`) < estimatedTurns()
      ) {
        synthesize(1, $effect`Synthesis: Greed`);
      }
    });
  }

  if (getWorkshed() === $item`Asdon Martin keyfob`) mood.drive(AsdonMartin.Driving.Observantly);

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View to Some Meat`, () => {
      if (get("_kgbClicksUsed") < 22) {
        const buffTries = Math.ceil((22 - get("_kgbClicksUsed")) / 3);
        cliExecute(`Briefcase buff ${new Array<string>(buffTries).fill("meat").join(" ")}`);
      }
    });
  }

  if (!get("concertVisited") && get("sidequestArenaCompleted") === "fratboy") {
    cliExecute("concert winklered");
  } else if (!get("concertVisited") && get("sidequestArenaCompleted") === "hippy") {
    cliExecute("concert optimist primal");
  }

  if (itemAmount($item`Bird-a-Day calendar`) > 0) {
    if (!have($skill`Seek out a Bird`)) {
      use(1, $item`Bird-a-Day calendar`);
    }

    if (
      have($skill`Visit your Favorite Bird`) &&
      !get("_favoriteBirdVisited") &&
      (numericModifier($effect`Blessing of your favorite Bird`, "Meat Drop") > 0 ||
        numericModifier($effect`Blessing of your favorite Bird`, "Item Drop") > 0)
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

  const canRecord =
    getWorkshed() === $item`warbear LP-ROM burner` ||
    have($item`warbear LP-ROM burner` || get("questG04Nemesis") === "finished");

  if (myClass() === $class`Accordion Thief` && myLevel() >= 15 && !canRecord) {
    if (have($skill`The Ballad of Richie Thingfinder`)) {
      useSkill($skill`The Ballad of Richie Thingfinder`, 10 - get("_thingfinderCasts"));
    }
    if (have($skill`Chorale of Companionship`)) {
      useSkill($skill`Chorale of Companionship`, 10 - get("_companionshipCasts"));
    }
  }

  shrugBadEffects();

  return mood;
}

export function freeFightMood(): Mood {
  const mood = new Mood();

  if (!get<boolean>("_garbo_defectiveTokenAttempted", false)) {
    set("_garbo_defectiveTokenAttempted", true);
    withStash($items`defective Game Grid token`, () => {
      if (!get("_defectiveTokenUsed") && have($item`defective Game Grid token`))
        use($item`defective Game Grid token`);
    });
  }

  if (!get("_glennGoldenDiceUsed")) {
    if (have($item`Glenn's golden dice`)) use($item`Glenn's golden dice`);
  }

  if (getClanLounge()["Clan pool table"] !== undefined) {
    while (get("_poolGames") < 3) cliExecute("pool aggressive");
  }

  if (haveEffect($effect`Blue Swayed`) < 50) {
    use(Math.ceil((50 - haveEffect($effect`Blue Swayed`)) / 10), $item`pulled blue taffy`);
  }
  mood.potion($item`white candy heart`, 30);

  const goodSongs = $skills`Chorale of Companionship, The Ballad of Richie Thingfinder, Ur-Kel's Aria of Annoyance, The Polka of Plenty`;
  for (const effectName of Object.keys(myEffects())) {
    const effect = Effect.get(effectName);
    const skill = toSkill(effect);
    if (skill.class === $class`Accordion Thief` && skill.buff && !goodSongs.includes(skill)) {
      cliExecute(`shrug ${effectName}`);
    }
  }

  if ((get("daycareOpen") || get("_daycareToday")) && !get("_daycareSpa")) {
    cliExecute("daycare mysticality");
  }
  if (have($item`redwood rain stick`) && !get("_redwoodRainStickUsed")) {
    use($item`redwood rain stick`);
  }
  const beachHeadsUsed: number | string = get("_beachHeadsUsed");
  if (have($item`Beach Comb`) && !beachHeadsUsed.toString().split(",").includes("10")) {
    mood.effect($effect`Do I Know You From Somewhere?`);
  }
  if (Witchess.have() && !get("_witchessBuff")) {
    mood.effect($effect`Puzzle Champ`);
  }
  if (questStep("questL06Friar") === 999 && !get("friarsBlessingReceived")) {
    cliExecute("friars familiar");
  }
  if (have($item`The Legendary Beat`) && !get("_legendaryBeat")) {
    use($item`The Legendary Beat`);
  }
  shrugBadEffects();

  return mood;
}

const stings = [
  ...$effects`Apoplectic with Rage, Barfpits, Berry Thorny, Biologically Shocked, Bone Homie, Boner Battalion, Coal-Powered, Curse of the Black Pearl Onion, Dizzy with Rage, Drenched With Filth, EVISCERATE!, Fangs and Pangs, Frigidalmatian, Gummi Badass, Haiku State of Mind, It's Electric!, Jabañero Saucesphere, Jalapeño Saucesphere, Little Mouse Skull Buddy, Long Live GORF, Mayeaugh, Permanent Halloween, Psalm of Pointiness, Pygmy Drinking Buddy, Quivering with Rage, Scarysauce, Skeletal Cleric, Skeletal Rogue, Skeletal Warrior, Skeletal Wizard, Smokin', Soul Funk, Spiky Frozen Hair, Stinkybeard, Stuck-Up Hair, Can Has Cyborger, Feeling Nervous`,
  $effect`Burning, Man`,
  $effect`Yes, Can Haz`,
];
const textAlteringEffects = $effects`Can Has Cyborger, Dis Abled, Haiku State of Mind, Just the Best Anapests, O Hai!, Robocamo`;
function shrugBadEffects() {
  [...stings, ...textAlteringEffects].forEach((effect) => {
    if (have(effect)) {
      uneffect(effect);
    }
  });
}

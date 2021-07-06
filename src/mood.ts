import {
  buy,
  cliExecute,
  getCampground,
  getClanLounge,
  getFuel,
  haveEffect,
  haveSkill,
  mallPrice,
  myClass,
  myEffects,
  mySpleenUse,
  spleenLimit,
  toSkill,
  use,
} from "kolmafia";
import {
  $class,
  $effect,
  $effects,
  $item,
  $items,
  $skill,
  $skills,
  get,
  have,
  Mood,
  set,
  SongBoom,
  Witchess,
} from "libram";
import { fillAsdonMartinTo } from "./asdon";
import { questStep } from "./lib";
import { withStash } from "./stash";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric, Ur-Kel's Aria of Annoyance`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
});

export const baseMeat =
  SongBoom.have() &&
  (SongBoom.songChangesLeft() > 0 || SongBoom.song() === "Total Eclipse of Your Meat")
    ? 275
    : 250;

export function meatMood(urKels = false) {
  const mood = new Mood();

  // TODO: Check all potions and grab those that are worth.
  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);
  mood.potion($item`resolution: be happier`, 0.15 * 0.45 * 0.8 * 200);
  mood.potion($item`Flaskfull of Hollow`, 5);

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
      if (mySpleenUse() < spleenLimit()) cliExecute("synthesize greed");
    });
  }

  if (getCampground()["Asdon Martin keyfob"] !== undefined) {
    if (getFuel() < 37) cliExecute("asdonmartin fuel 1 pie man was not meant to eat");
    mood.effect($effect`Driving Observantly`);
  }

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View To Some Meat`, () => {
      if (get("_kgbClicksUsed") < 22) {
        const buffTries = Math.ceil((22 - get("_kgbClicksUsed")) / 3);
        cliExecute(`Briefcase buff ${new Array<string>(buffTries).fill("meat").join(" ")}`);
      }
    });
  }

  if (!get("concertVisited") && get("sidequestArenaCompleted") === "fratboy") {
    cliExecute("concert winklered");
  }

  return mood;
}

export function freeFightMood() {
  const mood = new Mood();

  if (!get<boolean>("_garbo_defectiveTokenAttempted", false)) {
    set("_garbo_defectiveTokenAttempted", true);
    withStash($items`defective game grid token`, () => {
      if (!get("_defectiveTokenUsed") && have($item`defective game grid token`))
        use($item`defective game grid token`);
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

  // FIXME: Figure out what's actually good!
  if (!have($effect`Frosty`) && mallPrice($item`frost flower`) < 70000) {
    if (!have($item`frost flower`)) buy($item`frost flower`);
    use($item`frost flower`);
  }

  const goodSongs = $skills`Chorale of Companionship, The Ballad of Richie Thingfinder, Ur-Kel's Aria of Annoyance, The Polka of Plenty`;
  for (const effectName of Object.keys(myEffects())) {
    const effect = Effect.get(effectName);
    const skill = toSkill(effect);
    if (skill.class === $class`Accordion Thief` && skill.buff && !goodSongs.includes(skill)) {
      cliExecute(`shrug ${effectName}`);
    }
  }

  mood.potion($item`recording of Chorale of Companionship`, 500);
  mood.potion($item`recording of The Ballad of Richie Thingfinder`, 500);

  mood.potion($item`pink candy heart`, 300);
  mood.potion($item`resolution: be luckier`, 120);
  mood.potion($item`Meat-inflating powder`, 500);
  mood.potion($item`Polka Pop`, 500);
  mood.potion($item`resolution: be happier`, 500);
  mood.potion($item`blue snowcone`, 500);
  mood.potion($item`eagle feather`, 500);
  mood.potion($item`cyclops eyedrops`, 500);

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

  return mood;
}

import { cliExecute, getFuel, myClass, mySpleenUse, print, spleenLimit } from "kolmafia";
import { $class, $effect, $effects, $item, $skill, get, have, Mood, SongBoom } from "libram";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
});

export const baseMeat = SongBoom.have() ? 275 : 250;

export function meatMood() {
  const mood = new Mood();

  // TODO: Check all potions and grab those that are worth.
  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);
  mood.potion($item`resolution: be happier`, 0.15 * 0.45 * 0.8 * 200);

  mood.skill($skill`Blood Bond`);
  mood.skill($skill`Leash of Linguini`);
  mood.skill($skill`Empathy of the Newt`);

  mood.skill($skill`The Polka of Plenty`);
  mood.skill($skill`Disco Leer`);
  mood.skill($skill`Fat Leon's Phat Loot Lyric`);
  mood.skill($skill`Singer's Faithful Ocelot`);
  mood.skill($skill`The Spirit of Taking`);
  if (myClass() !== $class`Pastamancer`) mood.skill($skill`Bind Lasagmbie`);

  mood.effect($effect`Synthesis: Greed`, () => {
    if (mySpleenUse() < spleenLimit()) cliExecute("synthesize greed");
  });

  if (getFuel() < 37) cliExecute("asdonmartin fuel 1 pie man was not meant to eat");
  mood.effect($effect`Driving Observantly`);

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View To Some Meat`, () => {
      if (get("_kgbClicksUsed") <= 19) {
        const buffTries = Math.floor((22 - get("_kgbClicksUsed")) / 3);
        cliExecute(`briefcase buff ${new Array<string>(buffTries).fill("meat").join(" ")}`);
        print(`briefcase buff ${new Array<string>(buffTries).fill("meat").join(" ")}`);
      }
    });
  }

  return mood;
}

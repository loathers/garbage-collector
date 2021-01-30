import { cliExecute, myClass } from "kolmafia";
import { $class, $effect, $effects, $item, $skill, get, have, Mood } from "libram";

Mood.setDefaultOptions({
  songSlots: [
    $effects`Polka of Plenty`,
    $effects`Fat Leon's Phat Loot Lyric`,
    $effects`Chorale of Companionship`,
    $effects`The Ballad of Richie Thingfinder`,
  ],
});

export const baseMeat = have($item`SongBoom Boom Box`) ? 275 : 250;

export function meatMood() {
  const mood = new Mood();

  // TODO: Check all potions and grab those that are worth.
  mood.potion($item`How to Avoid Scams`, 3 * baseMeat);
  mood.potion($item`resolution: be wealthier`, 0.3 * baseMeat);

  mood.skill($skill`The Polka of Plenty`);
  mood.skill($skill`Disco Leer`);
  mood.skill($skill`Fat Leon's Phat Loot Lyric`);
  mood.skill($skill`Singer's Faithful Ocelot`);
  mood.skill($skill`The Spirit of Taking`);
  if (myClass() !== $class`Pastamancer`) mood.skill($skill`Bind Lasagmbie`);

  mood.effect($effect`Synthesis: Greed`);
  mood.effect($effect`Driving Observantly`);

  if (have($item`Kremlin's Greatest Briefcase`)) {
    mood.effect($effect`A View To Some Meat`, () => {
      if (get("_kgbClicksUsed") < 24) {
        cliExecute(
          `briefcase buff ${new Array(24 - get("_kgbClicksUsed")).map(() => "meat").join(" ")}`
        );
      }
    });
  }

  return mood;
}

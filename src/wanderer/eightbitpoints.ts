import { Effect, Location, Skill } from "kolmafia";
import { $location, clamp, get, getModifier, have, sum } from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";

const doubled: { [x in string]: Location } = {
  green: $location`Hero's Field`,
  black: $location`Vanya's Castle`,
  red: $location`The Fungus Plains`,
  blue: $location`Megalo-City`,
};

const bonusPoints = new Map<Location, { modifier: NumericModifier; offset: number }>([
  [$location`Hero's Field`, { modifier: "Item Drop", offset: 100 }],
  [$location`Vanya's Castle`, { modifier: "Initiative", offset: 300 }],
  [$location`Megalo-City`, { modifier: "Damage Absorption", offset: 300 }],
  [$location`The Fungus Plains`, { modifier: "Meat Drop", offset: 150 }],
]);

function expectedPoints(location: Location): number {
  const isDoubled = doubled[get("8BitScore")] === location;
  const data = bonusPoints.get(location);
  if (!data) return 0;
  const { modifier, offset } = data;

  return (
    clamp(
      sum(
        [...Skill.all(), ...Effect.all()].filter((x) => have(x)),
        (x) => getModifier(modifier, x)
      ) - offset,
      0,
      300
    ) * (isDoubled ? 1 : 1 / 2)
  );
}

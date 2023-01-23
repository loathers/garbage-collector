import { Effect, Location, Skill } from "kolmafia";
import { $location, clamp, get, getModifier, have, sum } from "libram";
import { NumericModifier } from "libram/dist/modifierTypes";
type EightBitData = { modifier: NumericModifier; offset: number; color: string };

const bonusPoints = new Map<Location, EightBitData>([
  [$location`Hero's Field`, { modifier: "Item Drop", offset: 100, color: "green" }],
  [$location`Vanya's Castle`, { modifier: "Initiative", offset: 300, color: "black" }],
  [$location`Megalo-City`, { modifier: "Damage Absorption", offset: 300, color: "red" }],
  [$location`The Fungus Plains`, { modifier: "Meat Drop", offset: 150, color: "blue" }],
]);

function expectedPoints({ modifier, offset, color }: EightBitData): number {
  const isDoubled = color === get("8BitColor");
  return (
    clamp(
      100 +
        sum(
          [...Skill.all(), ...Effect.all()].filter((x) => have(x)),
          (x) => getModifier(modifier, x)
        ) -
        offset,
      0,
      400
    ) * (isDoubled ? 1 : 1 / 2)
  );
}

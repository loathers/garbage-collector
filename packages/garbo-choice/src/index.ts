import { ChoiceAdventureScript, runChoice } from "kolmafia";
import { getBestMobiusOption } from "./resources";
import { get, NumericOrStringProperty } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber) => {
  switch (choiceNumber) {
    case 536: // Map for pills
      return; // Doesn't follow traditional choice adventure structure
    case 1562:
      return void runChoice(getBestMobiusOption());
    default: {
      const option = get(
        `choiceAdventure${choiceNumber}` as NumericOrStringProperty,
      );
      if (option) {
        if (typeof option === "number") return void runChoice(option);
        const [numeric, params] = option.split("&", 2);
        return void runChoice(Number(numeric), params);
      }
    }
  }
};

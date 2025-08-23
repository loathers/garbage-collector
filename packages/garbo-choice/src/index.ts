import { ChoiceAdventureScript, runChoice, xpath } from "kolmafia";
import { getBestDartsOption, getBestMobiusOption } from "./resources";
import { get, NumericOrStringProperty } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber, pageText) => {
  switch (choiceNumber) {
    case 536: // Map for pills
    case 914: // Louvre it or Leave it
    case 1499: // Labyrinth of shadows
      return; // Doesn't follow traditional choice adventure structure
    case 1525:
      return void runChoice(getBestDartsOption());
    case 1557: {
      const option = get("choiceAdventure1557" as NumericOrStringProperty);
      if (typeof option === "string") {
        const monsterId = option.slice("1&bandersnatch=".length);
        if (
          !xpath(pageText, `//form//input[@bandersnatch='${monsterId}']`).length
        ) {
          return void runChoice(2);
        }
      }
      return;
    }
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

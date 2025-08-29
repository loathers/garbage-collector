import { ChoiceAdventureScript, runChoice } from "kolmafia";
import {
  getBestDartsOption,
  getBestMobiusOption,
  runPeridotChoice,
} from "./resources";
import { get, NumericOrStringProperty } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber, pageText) => {
  switch (choiceNumber) {
    case 536: // Map for pills
    case 914: // Louvre it or Leave it
    case 1499: // Labyrinth of shadows
    case 890: // Lights Out
    case 891: //
    case 892: //
    case 893: //
    case 894: //
    case 895: //
    case 896: //
    case 897: //
    case 898: //
    case 899: //
    case 900: //
    case 901: //
    case 902: //
    case 903: // Lights Out
      return; // Doesn't follow traditional choice adventure structure
    case 1525:
      return void runChoice(getBestDartsOption());
    case 1557:
      return void runPeridotChoice(pageText);
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

import {
  availableChoiceOptions,
  ChoiceAdventureScript,
  runChoice,
} from "kolmafia";
import {
  getBestDartsOption,
  getBestMobiusOption,
  runPeridotChoice,
} from "./resources";
import { get, NumericOrStringProperty } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber, pageText) => {
  switch (choiceNumber) {
    case 536: // Map for pills
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
    case 914: // Louvre it or Leave it
    case 1499: // Labyrinth of shadows
      return; // Doesn't follow traditional choice adventure structure
    case 785: // Air Apparent
      if (get("choiceAdventure785") === 4) {
        runChoice(4); // Take the candy cane sword cane Meat
        return void runChoice(6); // Leave without spending a turn
      }
      break;
    case 1322: // The Beginning of the Neverend
      return void runChoice(
        ["food", "booze", "trash", "dj"].includes(get("_questPartyFairQuest"))
          ? 1
          : 2,
      );
    case 1525:
      return void runChoice(getBestDartsOption());
    case 1557:
      return void runPeridotChoice(pageText);
    case 1562:
      return void runChoice(getBestMobiusOption());
    case 1596: // Dig at Zone
      if (get("choiceAdventure1596", 0) === 2) {
        while (availableChoiceOptions()[2]) runChoice(2);
        return void runChoice(4); // Done digging
      }
      break;
  }

  // This fallthrough case has proven inexplicably essential.
  const option = get(
    `choiceAdventure${choiceNumber}` as NumericOrStringProperty,
  );
  if (option) {
    if (typeof option === "number") return void runChoice(option);
    const [numeric, ...params] = option.split("&");
    return void runChoice(Number(numeric), params.join("&"));
  }
};

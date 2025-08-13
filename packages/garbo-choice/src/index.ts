import { ChoiceAdventureScript, runChoice } from "kolmafia";
import { getBestMobiusOption } from "./resources";

export const main: ChoiceAdventureScript = (choiceNumber) => {
  switch (choiceNumber) {
    case 1224:
      return void runChoice(3); // LOV Epaulettes
    case 1226:
      return void runChoice(2); // Open Heart Surgery
    case 1228:
      return void runChoice(3); // LOV ExtraTerrestrial Chocolate
    case 1562:
      return void runChoice(getBestMobiusOption());
  }
};

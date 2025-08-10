import {
  availableChoiceOptions,
  ChoiceAdventureScript,
  runChoice,
} from "kolmafia";
import { highestPriorityOption } from "./resources/darts";
import { mobiusChoice } from "./resources";

export const main: ChoiceAdventureScript = (choiceNumber: number) => {
  const options = availableChoiceOptions();
  switch (choiceNumber) {
    case 1562:
      return void runChoice(mobiusChoice(options));
    case 1525:
      return void runChoice(highestPriorityOption(options));
    case 1224:
      return runChoice(3); // "LOV Epaulettes",
    case 1226:
      return runChoice(2); // "Open Heart Surgery",
    case 1228:
      return runChoice(3); // "LOV Extraterrestrial Chocolate",
  }
};

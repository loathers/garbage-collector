import {
  availableChoiceOptions,
  ChoiceAdventureScript,
  runChoice,
  toInt,
} from "kolmafia";
import { highestPriorityOption } from "./resources/darts";
import { mobiusChoice } from "./resources";
import { get } from "libram";

export const main: ChoiceAdventureScript = (choiceNumber: number) => {
  const options = availableChoiceOptions();
  switch (choiceNumber) {
    case 1562:
      return void runChoice(mobiusChoice(options));
    case 1525:
      return void runChoice(highestPriorityOption(options));
    default: {
      const option = toInt(get(`choiceAdventure${choiceNumber}`));
      if (option) return void runChoice(option);
    }
  }

};

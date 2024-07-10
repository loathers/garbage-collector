import { runChoice } from "kolmafia";
import { highestPriorityOption } from "./darts";

export function main(choiceNumber: number) {
  switch (choiceNumber) {
    case 1525:
      return runChoice(highestPriorityOption());
  }
  return -1;
}

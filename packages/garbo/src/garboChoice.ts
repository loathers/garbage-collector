import { runChoice } from "kolmafia";
import { get } from "libram";

export function main(choiceNumber: number) {


  if (choiceNumber === 1360) {
    while (get("_pirateRealmGrub") < 10 && get("_pirateRealmGold") > 10) {
      runChoice(1);
    }
    while (get("_pirateRealmGrog") < 10 && get("_pirateRealmGold") > 10) {
      runChoice(2);
    }
    while (get("_pirateRealmGold") > 10) {
      runChoice(3);
    }
    runChoice(6);
  }
  if (choiceNumber === 1224) {
    runChoice(3);
  }
  if (choiceNumber === 1226) {
    runChoice(2);
  }
  if (choiceNumber === 1228) {
    runChoice(3);
  }
}

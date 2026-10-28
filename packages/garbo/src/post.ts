import { returnExhaustedStashItems } from "./stash";
import { safeRestore } from "./restore";
import { runGarboQuests } from "./tasks/engine";
import { PostQuest } from "./tasks/post";

export default function postCombatActions() {
  runGarboQuests([PostQuest()]);
  returnExhaustedStashItems();
  safeRestore();
}

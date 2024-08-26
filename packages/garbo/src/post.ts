import { safeRestore } from "./lib";
import { runSafeGarboQuests } from "./tasks";
import { PostQuest } from "./tasks/post";

export default function postCombatActions() {
  runSafeGarboQuests([PostQuest()]);
  safeRestore();
}

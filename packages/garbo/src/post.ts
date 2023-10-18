import { safeRestore } from "./lib";
import { runGarboQuests } from "./tasks";
import { PostQuest } from "./tasks/post";

export default function postCombatActions() {
  runGarboQuests([PostQuest()]);
  safeRestore();
}

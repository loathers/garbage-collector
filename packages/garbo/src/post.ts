import { safeRestore } from "./lib";
import { runGarboQuests } from "./tasks/engine";
import { PostQuest } from "./tasks/post";

export default function postCombatActions() {
  runGarboQuests([PostQuest()]);
  safeRestore();
}

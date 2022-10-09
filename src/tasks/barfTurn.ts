import { barfTasks } from "./barfTasks";
import { runBarfTasks } from "./engine";

export function barfTurns(): void {
  runBarfTasks(barfTasks);
}

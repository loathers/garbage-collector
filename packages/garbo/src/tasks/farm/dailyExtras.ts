import { mayamCalendarSummon } from "../../resources";
import { GarboTask } from "../engine";
import { Quest } from "grimoire-kolmafia";

export const DailyExtrasQuest: Quest<GarboTask, unknown> = {
  name: "Daily Extras",
  tasks: [mayamCalendarSummon()],
};

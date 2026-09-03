import { mayamCalendarSummon } from "../../resources";
import { GarboContext } from "../context";
import { GarboTask } from "../engine";
import { Quest } from "grimoire-kolmafia";

export const DailyExtrasQuest: Quest<GarboTask, GarboContext> = {
  name: "Daily Extras",
  tasks: [mayamCalendarSummon()],
};

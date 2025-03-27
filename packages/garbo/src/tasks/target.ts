import { Quest } from "grimoire-kolmafia";
import {
  $item,
  $items,
  $location,
  CrystalBall,
  examine,
  get,
  getFoldGroup,
  have,
  set,
} from "libram";
import { GarboTask } from "./engine";
import { GarboStrategy, Macro } from "../combat";
import { getChangeLastAdvLocationMethod } from "../target/lib";
import { doingGregFight } from "../resources";
import { freeFightOutfit } from "../outfit";
import {
  canFaxbot,
  cliExecute,
  faxbot,
  getClanLounge,
  inebrietyLimit,
  myInebriety,
  use,
  wait,
} from "kolmafia";
import { globalOptions } from "../config";

export const SetupTargetCopyQuest: Quest<GarboTask> = {
  name: "SetupTargetCopy",
  ready: () => myInebriety() <= inebrietyLimit(),
  tasks: [
    {
      // Need the daily dungeon to either be totally finished or to be on a NC we can walk away from
      name: "Setup Daily Dungeon",
      outfit: () =>
        freeFightOutfit({ equip: $items`ring of Detect Boring Doors` }),
      // walk away from any nc we can walk away from, skip boring doors, open the final chest
      choices: () => ({ 689: 1, 690: 2, 691: 2, 692: 8, 693: 3 }),
      acquire: [{ item: $item`ring of Detect Boring Doors` }],
      ready: () =>
        getChangeLastAdvLocationMethod() === "dailydungeon" &&
        CrystalBall.have() &&
        doingGregFight(),
      completed: () =>
        get("dailyDungeonDone") ||
        ["It's Almost Certainly a Trap", "I Wanna Be a Door"].includes(
          get("_lastDailyDungeonEncounter"),
        ),
      do: $location`The Daily Dungeon`,
      post: () => set("_lastDailyDungeonEncounter", get("lastEncounter")),
      spendsTurn: true,
      combat: new GarboStrategy(() => Macro.kill()),
    },
    {
      name: "Fold Spooky Putty sheet",
      ready: () =>
        !have($item`Spooky Putty monster`) &&
        getFoldGroup($item`Spooky Putty sheet`).some((item) => have(item)),
      completed: () => have($item`Spooky Putty sheet`),
      do: () => cliExecute("fold spooky putty sheet"),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    // Fix invalid copiers (caused by ascending or combat text-effects)
    {
      name: "Fix Spooky Putty monster",
      ready: () => have($item`Spooky Putty monster`),
      completed: () =>
        !!get("spookyPuttyMonster") || !have($item`Spooky Putty monster`),
      do: () => {
        examine($item`Spooky Putty monster`);
        if (!get("spookyPuttyMonster")) {
          // Still invalid, use it to turn back into the spooky putty sheet
          use($item`Spooky Putty monster`);
        }
      },
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: "Fix Rain-Doh box full of monster",
      ready: () => have($item`Rain-Doh box full of monster`),
      completed: () => !!get("rainDohMonster"),
      do: () => examine($item`Rain-Doh box full of monster`),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: "Fix shaking 4-d camera",
      ready: () => have($item`shaking 4-d camera`),
      completed: () => !!get("cameraMonster"),
      do: () => examine($item`shaking 4-d camera`),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: "Fix envyfish egg",
      ready: () => have($item`envyfish egg`),
      completed: () => !!get("envyfishMonster"),
      do: () => examine($item`envyfish egg`),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: "Fix ice sculpture",
      ready: () => have($item`ice sculpture`),
      completed: () => !!get("iceSculptureMonster"),
      do: () => examine($item`ice sculpture`),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: "Fix photocopied monster",
      ready: () => have($item`photocopied monster`),
      completed: () => !!get("photocopyMonster"),
      do: () => examine($item`photocopied monster`),
      spendsTurn: false,
      limit: { skip: 1 },
    },
    {
      name: `Discard Fax`,
      ready: () =>
        !get("_photocopyUsed") &&
        get("photocopyMonster") !== globalOptions.target &&
        have($item`Clan VIP Lounge key`) &&
        getClanLounge()["deluxe fax machine"] !== undefined &&
        canFaxbot(globalOptions.target),
      completed: () => !have($item`photocopied monster`),
      do: () => cliExecute("fax send"),
      spendsTurn: false,
      limit: { skip: 2 },
    },
    // Fax the copy target before starting, to prevent an abort in case the faxbot networks are down
    {
      name: `Faxbot copytarget`,
      ready: () =>
        !get("_photocopyUsed") &&
        have($item`Clan VIP Lounge key`) &&
        getClanLounge()["deluxe fax machine"] !== undefined &&
        canFaxbot(globalOptions.target),
      completed: () =>
        have($item`photocopied monster`) &&
        get("photocopyMonster") === globalOptions.target,
      do: () => {
        faxbot(globalOptions.target);
        for (let i = 0; i < 3; i++) {
          wait(10 + i * 2);
          if (!have($item`photocopied monster`)) {
            cliExecute("fax receive");
            if (get("photocopyMonster") === globalOptions.target) {
              break;
            }
          }
        }
      },
      spendsTurn: false,
      limit: { skip: 1 },
    },
  ],
};

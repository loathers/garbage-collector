import {
  getClanLounge,
  myHash,
  myRain,
  print,
  runChoice,
  runCombat,
  toInt,
  use,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $skill,
  ChateauMantegna,
  ChestMimic,
  CombatLoversLocket,
  Counter,
  CrystalBall,
  get,
  have,
  HeavyRains,
  property,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import {
  averageTargetNet,
  HIGHLIGHT,
  isFreeAndCopyable,
  WISH_VALUE,
} from "../lib";
import { gregReady, possibleGregCrystalBall } from "../resources";
import { copyTargetCount, copyTargetSources } from "../target";
import { puttyLeft } from "../target/lib";
import { CopyTargetTask } from "./engine";
import { GarboStrategy, Macro } from "../combat";
import { wanderer } from "../garboWanderer";
import { meatTargetOutfit } from "../outfit";

let monsterInEggnet: boolean;
const mosterIsInEggnet = () =>
  (monsterInEggnet ??= ChestMimic.getReceivableMonsters().includes(
    globalOptions.target,
  ));

// TO DO: non-trivial combat strategies, choosing outfit function based on copy target
// Outfit needs to support prof, angel, and underwater
// Combat can passively support prof probably
// Might be a weird edge case where we're copying a free fight and want to charge our professor
// But I think we're fine?

export const CopyTargetFights: CopyTargetTask[] = (
  [
    {
      name: "Chateau Painting",
      ready: () =>
        ChateauMantegna.have() &&
        !ChateauMantegna.paintingFought() &&
        ChateauMantegna.paintingMonster() === globalOptions.target,
      completed: () => ChateauMantegna.paintingFought(),
      do: (): void => {
        ChateauMantegna.fightPainting();
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "chainstarter",
    },
    {
      name: "Combat Lover's Locket",
      ready: () =>
        CombatLoversLocket.availableLocketMonsters().includes(
          globalOptions.target,
        ),
      completed: () =>
        !CombatLoversLocket.availableLocketMonsters().includes(
          globalOptions.target,
        ),
      do: (): void => {
        CombatLoversLocket.reminisce(globalOptions.target);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "chainstarter",
    },
    {
      name: "Fax",
      ready: () =>
        have($item`Clan VIP Lounge key`) &&
        !get("_photocopyUsed") &&
        have($item`photocopied monster`) &&
        property.get("photocopyMonster") === globalOptions.target &&
        getClanLounge()["deluxe fax machine"] !== undefined,
      completed: () => get("_photocopyUsed"),
      do: (): void => {
        use($item`photocopied monster`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "chainstarter",
    },
    {
      name: "Mimic Egg",
      ready: () => ChestMimic.differentiableQuantity(globalOptions.target) >= 1,
      completed: () =>
        ChestMimic.differentiableQuantity(globalOptions.target) < 1,
      do: (): void => {
        ChestMimic.differentiate(globalOptions.target);
      },
      canInitializeWandererCounters: false,
      fightType: "chainstarter",
    },
    {
      name: "Rain Man",
      ready: () => have($skill`Rain Man`) && myRain() >= 50,
      completed: () => myRain() < 50,
      do: (): void => {
        HeavyRains.rainMan(globalOptions.target);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "chainstarter",
    },
    {
      name: "Time-Spinner",
      ready: () =>
        have($item`Time-Spinner`) &&
        $locations`Noob Cave, The Dire Warren, The Haunted Kitchen`.some(
          (location) =>
            location.combatQueue.includes(globalOptions.target.name),
        ) &&
        get("_timeSpinnerMinutesUsed") <= 7,
      completed: () => get("_timeSpinnerMinutesUsed") > 7,
      do: (): void => {
        visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
        runChoice(1);
        visitUrl(
          `choice.php?whichchoice=1196&monid=${globalOptions.target.id}&option=1`,
        );
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Spooky Putty & Rain-Doh",
      ready: () =>
        (have($item`Spooky Putty monster`) &&
          get("spookyPuttyMonster") === globalOptions.target) ||
        (have($item`Rain-Doh box full of monster`) &&
          get("rainDohMonster") === globalOptions.target),
      completed: () => puttyLeft() < 1,
      do: (): void => {
        visitUrl(`inv_use.php?whichitem=${toInt($item`Time-Spinner`)}`);
        runChoice(1);
        visitUrl(
          `choice.php?whichchoice=1196&monid=${globalOptions.target.id}&option=1`,
        );
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "4-d Camera",
      ready: () =>
        have($item`shaking 4-d camera`) &&
        get("cameraMonster") === globalOptions.target &&
        !get("_cameraUsed"),
      completed: () => get("_cameraUsed"),
      do: (): void => {
        use($item`shaking 4-d camera`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Ice Sculpture",
      ready: () =>
        have($item`ice sculpture`) &&
        get("iceSculptureMonster") === globalOptions.target &&
        !get("_iceSculptureUsed"),
      completed: () => get("_iceSculptureUsed"),
      do: (): void => {
        use($item`ice sculpture`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Green Taffy",
      ready: () =>
        have($item`envyfish egg`) &&
        get("envyfishMonster") === globalOptions.target &&
        !get("_envyfishEggUsed"),
      completed: () => get("_envyfishEggUsed"),
      do: (): void => {
        use($item`envyfish egg`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Screencapped Monster",
      ready: () =>
        have($item`screencapped monster`) &&
        property.get("screencappedMonster") === globalOptions.target,
      completed: () =>
        !have($item`screencapped monster`) ||
        !(property.get("screencappedMonster") === globalOptions.target),
      do: (): void => {
        use($item`screencapped monster`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Sticky Clay Homunculus",
      ready: () =>
        have($item`sticky clay homunculus`) &&
        property.get("crudeMonster") === globalOptions.target,
      completed: () =>
        !have($item`sticky clay homunculus`) ||
        !(property.get("crudeMonster") === globalOptions.target),
      do: (): void => {
        use($item`sticky clay homunculus`);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "regular",
    },
    {
      name: "Digitize",
      ready: () =>
        get("_sourceTerminalDigitizeMonster") === globalOptions.target &&
        Counter.get("Digitize Monster") <= 0,
      completed: () =>
        Counter.get("Digitize Monster") > 0 ||
        !(get("_sourceTerminalDigitizeMonster") === globalOptions.target),
      do: (): void => {},
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "wanderer",
    },
    {
      name: "Guaranteed Romantic Monster",
      ready: () =>
        get("_romanticFightsLeft") > 0 &&
        Counter.get("Romantic Monster window begin") <= 0 &&
        Counter.get("Romantic Monster window end") <= 0,
      completed: () => get("_romanticFightsLeft") <= 0,
      do: (): void => {},
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "wanderer",
    },
    {
      name: "Enamorang",
      ready: () =>
        Counter.get("Enamorang") <= 0 &&
        get("enamorangMonster") === globalOptions.target,
      completed: () => Counter.get("Enamorang") <= 0,
      do: (): void => {},
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: false,
      fightType: "wanderer",
    },
    {
      name: "Orb Prediction",
      ready: () =>
        have($item`miniature crystal ball`) &&
        !get("_garbo_doneGregging", false) &&
        CrystalBall.ponder().get($location`The Dire Warren`) ===
          globalOptions.target,
      completed: () => !possibleGregCrystalBall(),
      do: $location`The Dire Warren`,
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      outfit: () => meatTargetOutfit({ equip: $items`miniature crystal ball` }),
      canInitializeWandererCounters: true,
      fightType: "conditional",
    },
    {
      name: "Macrometeorite",
      ready: () =>
        gregReady() &&
        have($skill`Meteor Lore`) &&
        get("_macrometeoriteUses") < 10,
      completed: () => get("_macrometeoriteUses") >= 10,
      do: $location`Noob Cave`,
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "gregarious",
    },
    {
      name: "Powerful Glove",
      ready: () =>
        gregReady() &&
        have($item`Powerful Glove`) &&
        get("_powerfulGloveBatteryPowerUsed") <= 90,
      completed: () => get("_powerfulGloveBatteryPowerUsed") >= 95,
      do: $location`The Dire Warren`,
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "gregarious",
    },
    {
      name: "Be Gregarious",
      ready: () => get("beGregariousFightsLeft") >= 0,
      completed: () => get("beGregariousFightsLeft") <= 0,
      do: $location`The Dire Warren`,
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "gregarious",
    },
    {
      name: "Habitats Monster",
      ready: () => get("_monsterHabitatsFightsLeft") >= 0,
      completed: () => get("_monsterHabitatsFightsLeft") <= 0,
      do: $location`The Dire Warren`,
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "gregarious",
    },
    {
      name: "Backup",
      ready: () =>
        get("lastCopyableMonster") === globalOptions.target &&
        have($item`backup camera`) &&
        get("_backUpUses") < 11,
      completed: () => get("_backUpUses") >= 11,
      do: () => wanderer().getTarget("backup"),
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      outfit: () =>
        meatTargetOutfit({
          equip: $items`backup camera`,
          modes: { backupcamera: "meat" },
        }),
      fightType: "conditional",
    },
    {
      name: "Professor CopyChain",
      ready: () =>
        have($familiar`Pocket Professor`) && !get("_garbo_meatChain", false),
      completed: () => get("_garbo_meatChain", false),
      do: (): void => {},
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "fake",
    },
    {
      name: "Mimic Egg (from clinic)",
      ready: () =>
        ChestMimic.have() &&
        $familiar`Chest Mimic`.experience >= 100 &&
        mosterIsInEggnet(),
      completed: () => get("_mimicEggsObtained") >= 11, // gonna need help here, too I think.
      do: (): void => {
        ChestMimic.receive(globalOptions.target);
        ChestMimic.differentiate(globalOptions.target);
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "emergencychainstarter",
    },
    {
      name: "Pocket Wish",
      ready: () =>
        globalOptions.target.wishable &&
        get("_genieFightsUsed") >= 3 &&
        Math.floor(copyTargetCount()) > 1,
      prepare: () => {
        const potential = Math.floor(copyTargetCount());
        if (globalOptions.askedAboutWish) return globalOptions.wishAnswer;
        const profit = (potential + 1) * averageTargetNet() - WISH_VALUE;
        if (profit < 0) return false;
        print(
          `You have the following copy target sources untapped right now:`,
          HIGHLIGHT,
        );
        copyTargetSources
          .filter((source) => source.potential() > 0)
          .map((source) => `${source.potential()} from ${source.name}`)
          .forEach((text) => print(text, HIGHLIGHT));
        globalOptions.askedAboutWish = true;
        globalOptions.wishAnswer = copyTargetConfirmInvocation(
          `Garbo has detected you have ${potential} potential ways to copy a ${
            globalOptions.target
          }, but no way to start a fight with one. Current ${
            globalOptions.target
          } net (before potions) is ${averageTargetNet()}, so we expect to earn ${profit} meat, after the cost of a wish. Should we wish for ${
            globalOptions.target
          }?`,
        );
        return globalOptions.wishAnswer;
      },
      completed: () =>
        globalOptions.wishAnswer === false || get("_genieFightsUsed") >= 3, // gonna need help here, too I think.
      do: (): void => {
        acquire(1, $item`pocket wish`, WISH_VALUE);
        visitUrl(
          `inv_use.php?pwd=${myHash()}&which=3&whichitem=9537`,
          false,
          true,
        );
        visitUrl(
          `choice.php?pwd&whichchoice=1267&option=1&wish=to fight a ${globalOptions.target} `,
          true,
          true,
        );
        visitUrl("main.php", false);
        runCombat();
        globalOptions.askedAboutWish = false;
      },
      spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
      canInitializeWandererCounters: true,
      fightType: "emergencychainstarter",
    },
  ] as Omit<CopyTargetTask, "outfit" | "combat" | "spendsTurn">[]
).map((partialTask) => ({
  combat: new GarboStrategy(() => Macro.target(partialTask.name)),
  outfit: () => meatTargetOutfit(),
  spendsTurn: () => !isFreeAndCopyable(globalOptions.target),
  ...partialTask,
}));

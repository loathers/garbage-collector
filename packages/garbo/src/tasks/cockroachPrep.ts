import { Outfit, Quest } from "grimoire-kolmafia";
import { GarboTask } from "./engine";
import {
  $effect,
  $item,
  $items,
  $location,
  $stat,
  get,
  have,
  maxBy,
  questStep,
  uneffect,
} from "libram";
import {
  abort,
  adv1,
  Effect,
  mallPrice,
  myBuffedstat,
  myEffects,
  numericModifier,
  retrieveItem,
  runChoice,
  toEffect,
  use,
  visitUrl,
} from "kolmafia";
import { garboValue } from "../garboValue";
import { freeFightFamiliar } from "../familiar";
import { freeFightOutfit, meatTargetOutfit } from "../outfit";
import { GarboStrategy, Macro } from "../combat";
import { acquire } from "../acquire";

// Just checking for the gummi effects for now, maybe can check other stuff later?
function checkAndFixOvercapStats(): void {
  const stats = [$stat`Muscle`, $stat`Moxie`, $stat`Mysticality`];
  const effects: Effect[] = Object.keys(myEffects()).map((effectName) =>
    toEffect(effectName),
  );

  stats.forEach((stat) => {
    while (myBuffedstat(stat) > 100) {
      if (
        !have($effect`Mush-Mouth`) &&
        mallPrice($item`Fun-Guy spore`) < 5_000
      ) {
        retrieveItem($item`Fun-Guy spore`);
        use($item`Fun-Guy spore`);
      }
      if (stat === $stat`muscle`) {
        if (
          !have($item`decorative fountain`) &&
          !have($effect`Sleepy`) &&
          mallPrice($item`decorative fountain`) < 2_000
        ) {
          retrieveItem($item`decorative fountain`);
        }
        if (!have($effect`Sleepy`)) {
          use($item`decorative fountain`);
        }
      }

      if (stat === $stat`moxie`) {
        if (
          !have($item`patchouli incense stick`) &&
          !have($effect`Far Out`) &&
          mallPrice($item`patchouli incense stick`) < 2_000
        ) {
          retrieveItem($item`patchouli incense stick`);
        }
        use($item`patchouli incense stick`);

        if (have($effect`Endless Drool`) && stat === $stat`Moxie`) {
          uneffect($effect`Endless Drool`);
        }
      }

      if (mallPrice($item`Mr. Mediocrebar`) < 2_000 && !have($effect`Apathy`)) {
        retrieveItem($item`Mr. Mediocrebar`);
        use($item`Mr. Mediocrebar`);
      }

      if (have($effect`Feeling Excited`)) uneffect($effect`Feeling Excited`);
      // Get effect names from myEffects and convert them to Effect instances
      effects.forEach((ef) => {
        // Check if the effect modifier includes the stat and not "meat"
        if (
          numericModifier(ef, `${stat.toString}`) &&
          !(
            numericModifier(ef, "meat drop") > 0 ||
            numericModifier(ef, "familiar weight") ||
            numericModifier(ef, "smithsness") ||
            numericModifier(ef, "item drop")
          )
        ) {
          uneffect(ef); // Remove the effect
        }
      });
    }
  });

  if (
    myBuffedstat($stat`Moxie`) >= 100 ||
    myBuffedstat($stat`Mysticality`) >= 100 ||
    myBuffedstat($stat`Muscle`) >= 100
  ) {
    abort(
      "Buffed stats are too high for PirateRealm! Check for equipment or buffs that we can add to prevent in the script",
    );
  }
}

function dessertIslandWorthIt(): boolean {
  // guesstimating value of giant crab at 3*VOA
  if (garboValue($item`cocoa of youth`) > 3 * get("valueOfAdventure")) {
    return true;
  }
  return false;
}

function crewRoleValue(crewmate: string): number {
  // Cuisinier is highest value if cocoa of youth is more meat than expected from giant crab
  if (dessertIslandWorthIt() && crewmate.includes("Cuisinier")) {
    return 50;
  }
  // Coxswain helps save turns if we run from storms
  if (crewmate.includes("Coxswain")) return 40;
  // Harquebusier gives us extra fun from combats
  if (crewmate.includes("Harquebusier")) return 30;
  // Crypto, Cuisinier (if cocoa not worth it), and Mixologist have small bonuses we care about less
  return 0;
}

function crewAdjectiveValue(crewmate: string): number {
  // Wide-Eyed give us bonus fun when counting birds in smooth sailing, and we'll mostly be doing that rather than spending limited grub/grog
  if (crewmate.includes("Wide-Eyed")) return 5;
  // Gluttonous can help when running out of grub, even though we usually shouldn't?
  if (crewmate.includes("Gluttonous")) return 4;
  // Beligerent, Dipsomaniacal, and Pinch-Fisted don't make much difference
  return 0;
}

function chooseCrew(): void {
  const bestChoice = maxBy([1, 2, 3], (choiceOption) => {
    const crewmatePref = `_pirateRealmCrewmate${choiceOption}`;
    const crewmate = get(crewmatePref);
    const roleValue = crewRoleValue(crewmate);
    const adjectiveValue = crewAdjectiveValue(crewmate);
    return roleValue + adjectiveValue;
  });
  runChoice(bestChoice);
}

export const CockroachSetup: Quest<GarboTask> = {
  name: "Setup Cockroach Target",
  completed: () =>
    get("_lastPirateRealmIsland") === $location`Trash Island` ||
    !get("pirateRealmUnlockedAnemometer"),
  tasks: [
    // Tasks to progress pirate realm up to selecting Trash Island go here
    // We'll have to be careful about things like max stats becoming too high (bofa is annoying for this!)
    // To be optimal we would progress up until we're about to fight the giant giant crab, and then after buffing and fighting it, we then select trash island.
    // We might need some restructuring to do this nicely?
    {
      name: "Get PirateRealm Eyepatch",
      completed: () => have($item`PirateRealm eyepatch`),
      do: () => visitUrl("place.php?whichplace=realm_pirate&action=pr_port"),
      limit: { tries: 1 },
      spendsTurn: false,
    },
    {
      name: "Start PirateRealm Journey",
      ready: () => have($item`PirateRealm eyepatch`),
      completed: () => questStep("_questPirateRealm") > 0,
      prepare: () => checkAndFixOvercapStats(),
      do: () => {
        visitUrl("place.php?whichplace=realm_pirate&action=pr_port");
        runChoice(1); // Head to Groggy's
        chooseCrew(); // Choose our crew
        runChoice(4); // Choose anemometer for trash island
        if (get("pirateRealmStormsEscaped") >= 10) {
          runChoice(4); // Swift Clipper, if it's unlocked
        } else {
          runChoice(3); // Otherwise, Speedy Caravel
        }
        runChoice(1); // Head for the sea
      },
      outfit: { equip: $items`PirateRealm eyepatch` },
      limit: { tries: 1 },
      spendsTurn: false,
    },
    {
      name: "Choose First Island",
      ready: () => questStep("_questPirateRealm") === 1,
      completed: () => questStep("_questPirateRealm") > 1,
      prepare: () => checkAndFixOvercapStats(),
      do: () => adv1($location`Sailing the PirateRealm Seas`),
      outfit: (): Outfit => {
        return freeFightOutfit({ acc3: $items`PirateRealm eyepatch` });
      },
      choices: () => ({
        1352:
          dessertIslandWorthIt() &&
          get("_pirateRealmCrewmate").includes("Cuisinier")
            ? 6
            : 1,
      }),
      limit: { tries: 1 },
      spendsTurn: false,
    },
    {
      name: "Sail to first Island",
      ready: () => questStep("_questPirateRealm") === 2,
      completed: () => questStep("_questPirateRealm") > 2,
      prepare: () => checkAndFixOvercapStats(),
      do: () => adv1($location`Sailing the PirateRealm Seas`),
      outfit: {
        equip: $items`PirateRealm eyepatch, PirateRealm party hat, Red Roger's red right foot`,
      },
      choices: () => ({
        1365: 1,
        1364: 2,
        1361: 1,
        1357: get("_pirateRealmGold") >= 50 ? 3 : 4,
        1360: 6, // Will need to add shop handling, perhaps to choice adventure script
        1356: 3,
        1362:
          get("_pirateRealmShipSpeed") - get("_pirateRealmSailingTurns") >= 2
            ? 2
            : 1,
        1363: 2,
        1359: 1, // Emergency grog adventure, choice one seems more consistent?
        1358: 1, // Emergency grub adventure, choice one seems more consistent?
        1367: 1, // Wrecked ship, this uses glue, need a pref for glue to make this not break if we don't have glue
      }),
      limit: { tries: 8 },
      spendsTurn: true,
    },
    {
      name: "Land Ho (First Island)",
      ready: () => questStep("_questPirateRealm") === 3,
      completed: () => questStep("_questPirateRealm") > 3,
      prepare: () => checkAndFixOvercapStats(),
      do: () => {
        // Should give us the Land-Ho adventure
        if (visitUrl("adventure.php?snarfblat=530").includes("Land Ho!")) {
          runChoice(1);
        } else {
          abort("Expected Land Ho! but didn't get it!");
        }
      },
      outfit: {
        equip: $items`PirateRealm eyepatch`,
      },
      limit: { tries: 1 },
      spendsTurn: false,
    },
    {
      name: "Standard Island Combats (Island 1)",
      ready: () => questStep("_questPirateRealm") === 4,
      completed: () => questStep("_questPirateRealm") > 4,
      prepare: () => {
        checkAndFixOvercapStats();
        if (
          mallPrice($item`windicle`) < 3 * get("valueOfAdventure") &&
          !get("_pirateRealmWindicleUsed")
        ) {
          acquire(1, $item`windicle`, 3 * get("valueOfAdventure"), true);
        }
      },
      do: () => adv1(get("_lastPirateRealmIsland", $location`none`)),
      outfit: () =>
        freeFightOutfit({
          equip: $items`PirateRealm eyepatch`,
          familiar: freeFightFamiliar({
            canChooseMacro: false,
            location: get("_lastPirateRealmIsland", $location`none`),
            allowAttackFamiliars: true,
            mode: "free",
          }),
        }),
      combat: new GarboStrategy(() =>
        Macro.externalIf(
          mallPrice($item`windicle`) < 3 * get("valueOfAdventure") &&
            !get("_pirateRealmWindicleUsed") &&
            get("_pirateRealmIslandMonstersDefeated") <= 1,
          Macro.item($item`windicle`),
        ).basicCombat(),
      ),
      limit: { tries: 8 },
      spendsTurn: true,
    },
    {
      name: "Final Island Encounter (Island 1)", // Ideally we delay this to do it before our copy target fights for meat but here for now
      ready: () => questStep("_questPirateRealm") === 5,
      completed: () => questStep("_questPirateRealm") > 5,
      prepare: () => {
        checkAndFixOvercapStats();
      },
      do: () => {
        if (get("_lastPirateRealmIsland") === $location`Dessert Island`) {
          // Should give us cocoa of youth
          if (
            visitUrl("adventure.php?snarfblat=531").includes(
              "Chocolate Fountain of Youth",
            )
          ) {
            runChoice(1);
          } else {
            abort("Expected cocoa of youth but got something else!");
          }
        } else {
          adv1($location`Crab Island`);
        }
      },
      outfit: () => {
        if (get("_lastPirateRealmIsland") === $location`Crab Island`) {
          const spec = meatTargetOutfit({
            modifier: ["meat"],
            equip: $items`PirateRealm eyepatch`,
          });
          return spec;
        }
        return { equip: $items`PirateRealm eyepatch` };
      },
      choices: { 1385: 1, 1368: 1 }, // Take cocoa of youth, fight crab
      combat: new GarboStrategy(() => Macro.delevel().meatKill()),
      limit: { tries: 1 },
      spendsTurn: true,
    },
    {
      name: "Choose Trash Island",
      ready: () => questStep("_questPirateRealm") === 6,
      completed: () => questStep("_questPirateRealm") > 6,
      prepare: () => checkAndFixOvercapStats(),
      do: () => adv1($location`Sailing the PirateRealm Seas`),
      outfit: { equip: $items`PirateRealm eyepatch` },
      choices: { 1353: 5 }, // Trash Island
      limit: { tries: 1 },
      spendsTurn: false,
    },
  ],
};

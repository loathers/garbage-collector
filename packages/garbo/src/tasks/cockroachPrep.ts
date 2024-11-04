import { Quest } from "grimoire-kolmafia";
import { GarboTask } from "./engine";
import {
  $item,
  $items,
  $location,
  $stat,
  get,
  getModifier,
  have,
  maxBy,
  questStep,
  uneffect,
} from "libram";
import {
  abort,
  adv1,
  Effect,
  effectModifier,
  isShruggable,
  Item,
  mallPrice,
  myBuffedstat,
  myEffects,
  retrieveItem,
  runChoice,
  Stat,
  toEffect,
  use,
  visitUrl,
} from "kolmafia";
import { garboValue } from "../garboValue";
import { freeFightFamiliar } from "../familiar";
import { freeFightOutfit, meatTargetOutfit } from "../outfit";
import { GarboStrategy, Macro } from "../combat";
import { acquire } from "../acquire";

function pickBestDebuff(stat: Stat): Item {
  const statName = stat.toString();

  const debuffMenu = Item.all()
    .filter((it) => {
      const effect = effectModifier(it, "Effect").toString();
      return effect && !(effect in myEffects());
    })
    .filter((it) => getModifier(statName, it) < 0)
    .map(
      (it) => [it, mallPrice(it) / getModifier(statName, it)] as [Item, number],
    ); // getModifier should return a negative value, flipping these negative

  // ...so that when we maxBy we pick the smallest negative value, spending the least meat
  return maxBy(debuffMenu, ([, value]) => value)[0];
}

// Just checking for the gummi effects for now, maybe can check other stuff later?
function checkAndFixOvercapStats(): void {
  const stats = Stat.all();
  const effects: Effect[] = Object.keys(myEffects()).map((effectName) =>
    toEffect(effectName),
  );

  // Use a traditional for loop for stats
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];
    const statName = stat.toString();

    while (myBuffedstat(stat) > 100) {
      for (const isShruggablePass of [true, false]) {
        for (let j = 0; j < effects.length; j++) {
          const ef = effects[j];
          if (
            isShruggable(ef) === isShruggablePass && // Process shruggable effects in first pass, non-shruggable in second
            (getModifier(statName, ef) ||
              getModifier(`${statName} Percent`, ef)) &&
            !(
              getModifier("Meat Drop", ef) > 0 ||
              getModifier("Familiar Weight", ef) > 0 ||
              getModifier("Smithsness", ef) > 0 ||
              getModifier("Item Drop", ef) > 0
            )
          ) {
            uneffect(ef); // Remove the effect
          }
        }
      }
      const debuffItem = () => pickBestDebuff(stat);
      retrieveItem(debuffItem());
      use(debuffItem());
    }
  }

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

const funPointValue = garboValue($item`PirateRealm guest pass`) / 600;
const carnPlantValue =
  get("valueOfAdventure") / (20 + get("_carnivorousPottedPlantWins"));
const funPointBonuses = new Map<Item, number>([
  [$item`Red Roger's red left foot`, funPointValue],
  [$item`PirateRealm party hat`, funPointValue],
  [$item`carnivorous potted plant`, carnPlantValue],
]);

export const CockroachSetup: Quest<GarboTask> = {
  name: "Setup Cockroach Target",
  ready: () => get("pirateRealmUnlockedAnemometer"),
  completed: () => get("_lastPirateRealmIsland") === $location`Trash Island`,
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
      outfit: () => freeFightOutfit({ acc3: $items`PirateRealm eyepatch` }),
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
          bonuses: funPointBonuses,
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

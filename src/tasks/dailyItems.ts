import { AcquireItem, Quest } from "grimoire-kolmafia";
import {
  abort,
  buy,
  cliExecute,
  getCampground,
  getClanLounge,
  getMonsters,
  Item,
  itemDropsArray,
  itemPockets,
  mallPrice,
  meatPockets,
  pickedPockets,
  pocketItems,
  pocketMeat,
  print,
  runChoice,
  scrapPockets,
  sellsItem,
  toItem,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $coinmaster,
  $item,
  $items,
  $skill,
  $skills,
  ChateauMantegna,
  ClosedCircuitPayphone,
  get,
  have,
  maxBy,
  questStep,
  SourceTerminal,
  sum,
  withChoice,
} from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { embezzlerCount } from "../embezzler";
import { doingGregFight } from "../extrovermectin";
import { coinmasterPrice } from "../lib";
import { rufusPotion } from "../potions";
import { garboAverageValue, garboValue } from "../garboValue";
import { GarboTask } from "./engine";
import { augustSummonTasks } from "../resources";

const SummonTomes = $skills`Summon Snowcones, Summon Stickers, Summon Sugar Sheets, Summon Rad Libs, Summon Smithsness`;
const Wads = $items`twinkly wad, cold wad, stench wad, hot wad, sleaze wad, spooky wad`;
let _shouldClearRufusQuest: boolean | null = null;

function drawBestCards(): void {
  const cardsLeft = Math.floor(3 - get("_deckCardsDrawn") / 5);
  const cardsSeen = get("_deckCardsSeen").toLowerCase();
  const bestCards = [
    { card: "Island", item: $item`blue mana` },
    { card: "Ancestral Recall", item: $item`blue mana` },
    { card: "Plains", item: $item`white mana` },
    { card: "Healing Salve", item: $item`white mana` },
    { card: "Swamp", item: $item`black mana` },
    { card: "Dark Ritual", item: $item`black mana` },
    { card: "Mountain", item: $item`red mana` },
    { card: "Lightning bolt", item: $item`red mana` },
    { card: "Forest", item: $item`green mana` },
    { card: "Giant Growth", item: $item`green mana` },
    { card: "Gift Card", item: $item`gift card` },
    { card: "Mickey", item: $item`1952 Mickey Mantle card` },
  ]
    .filter(({ card }) => !cardsSeen.includes(card.toLowerCase()))
    .sort((a, b) => garboValue(b.item) - garboValue(a.item))
    .splice(0, cardsLeft)
    .map(({ card }) => card);
  for (const card of bestCards) {
    cliExecute(`cheat ${card}`);
  }
}

function bestExtrude(): Item {
  return maxBy($items`browser cookie, hacked gibson`, garboValue);
}

function pickCargoPocket(): void {
  const picked = pickedPockets();
  const items = itemPockets();
  const meats = meatPockets();
  const scraps = scrapPockets();

  function pocketValue(pocket: number): number {
    let value = 0;
    if (pocket in picked) {
      return value;
    }
    if (pocket in items) {
      value += sum(
        Object.entries(pocketItems(pocket)),
        ([item, count]) => garboValue(toItem(item), true) * count,
      );
    }
    if (pocket in meats) {
      value += sum(Object.values(pocketMeat(pocket)), (x) => parseInt(x));
    }
    if (pocket in scraps) {
      value += 200;
    }
    return value;
  }

  const pockets: [number, number][] = [];
  for (let i = 1; i <= 666; i++) {
    const value = pocketValue(i);
    if (value > 0) {
      pockets.push([i, value]);
    }
  }

  if (pockets.length > 0) {
    cliExecute(`cargo ${Math.trunc(maxBy(pockets, 1)[0])}`);
  }
}

let triedForest = false;
const DailyItemTasks: GarboTask[] = [
  ...SummonTomes.map(
    (skill) =>
      <GarboTask>{
        name: `{skill}`,
        ready: () => have(skill),
        completed: () => skill.dailylimit === 0,
        do: () => useSkill(skill, skill.dailylimit),
      },
  ),
  ...[
    {
      name: "Summon Clip Art",
      ready: () => have($skill`Summon Clip Art`),
      completed: () => $skill`Summon Clip Art`.dailylimit === 0,
      do: (): void => {
        let best = $item.none;
        for (let itemId = 5224; itemId <= 5283; itemId++) {
          const current = Item.get(`[${itemId}]`);
          if (garboValue(current) > garboValue(best)) {
            best = current;
          }
        }
        if (best !== $item.none) {
          cliExecute(`try; create ${$skill`Summon Clip Art`.dailylimit} ${best}`);
        }
      },
    },
    {
      name: "2002 Mr. Store",
      ready: () => have($item`2002 Mr. Store Catalog`),
      completed: () =>
        get("availableMrStore2002Credits", 0) === 0 && get("_2002MrStoreCreditsCollected", true),
      do: (): void => {
        const bestItem = maxBy(
          Item.all().filter((i) => sellsItem($coinmaster`Mr. Store 2002`, i)),
          garboValue,
        );
        buy($coinmaster`Mr. Store 2002`, get("availableMrStore2002Credits", 0), bestItem);
      },
    },
    {
      name: "Chateau Mantegna Desk",
      ready: () => ChateauMantegna.have(),
      completed: () => get("_chateauDeskHarvested"),
      do: () => visitUrl("place.php?whichplace=chateau&action=chateau_desk2", false),
    },
    {
      name: "Kremlin's Greatest Briefcase Collect",
      ready: () => have($item`Kremlin's Greatest Briefcase`),
      completed: () => get("_kgbClicksUsed") > 17 || get("_kgbDispenserUses") >= 3,
      do: () => cliExecute("Briefcase collect"),
    },
    {
      name: "Ice Cold April Shower",
      ready: () => have($item`Clan VIP Lounge key`) && getClanLounge()["Clan shower"] !== undefined,
      completed: () => get("_aprilShower"),
      do: () => cliExecute("try; shower ice"),
    },
    {
      name: "Swimming Pool Item",
      ready: () =>
        have($item`Clan VIP Lounge key`) &&
        getClanLounge()["Olympic-sized Clan crate"] !== undefined,
      completed: () => get("_olympicSwimmingPoolItemFound"),
      do: () => cliExecute("swim item"),
    },
    {
      name: "Cheat Deck of Every Card",
      ready: () => have($item`Deck of Every Card`),
      completed: () => Math.floor(3 - get("_deckCardsDrawn") / 5) === 0,
      do: drawBestCards,
    },
    {
      name: "Source Terminal Extrude",
      ready: () => SourceTerminal.have(),
      completed: () =>
        get("_sourceTerminalExtrudes") === 3 ||
        garboValue(bestExtrude()) < garboValue($item`Source essence`) * 10,
      do: () => SourceTerminal.extrude(bestExtrude()),
      acquire: [{ item: $item`Source essence`, num: 10 }],
      limit: { skip: 3 },
    },
    {
      name: "Internet Meme Shop viral video",
      completed: () =>
        get("_internetViralVideoBought") ||
        garboValue($item`viral video`) <
          garboValue($item`BACON`) * coinmasterPrice($item`viral video`),
      do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`viral video`),
      acquire: [{ item: $item`BACON`, num: coinmasterPrice($item`viral video`) }],
    },
    {
      name: "Internet Meme Shop plus one",
      completed: () =>
        get("_internetPlusOneBought") ||
        garboValue($item`plus one`) < garboValue($item`BACON`) * coinmasterPrice($item`plus one`),
      do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`plus one`),
      acquire: [{ item: $item`BACON`, num: coinmasterPrice($item`plus one`) }],
    },
    {
      name: "Internet Meme Shop gallon of milk",
      completed: () =>
        get("_internetGallonOfMilkBought") ||
        garboValue($item`gallon of milk`) <
          garboValue($item`BACON`) * coinmasterPrice($item`gallon of milk`),
      do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`gallon of milk`),
      acquire: [{ item: $item`BACON`, num: coinmasterPrice($item`gallon of milk`) }],
    },
    {
      name: "Internet Meme Shop print screen button",
      completed: () =>
        get("_internetPrintScreenButtonBought") ||
        garboValue($item`print screen button`) <
          garboValue($item`BACON`) * coinmasterPrice($item`print screen button`),
      do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`print screen button`),
      acquire: [{ item: $item`BACON`, num: coinmasterPrice($item`print screen button`) }],
    },
    {
      name: "Internet Meme Shop daily dungeon malware",
      completed: () =>
        get("_internetDailyDungeonMalwareBought") ||
        garboValue($item`daily dungeon malware`) <
          garboValue($item`BACON`) * coinmasterPrice($item`daily dungeon malware`),
      do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`daily dungeon malware`),
      acquire: [{ item: $item`BACON`, num: coinmasterPrice($item`daily dungeon malware`) }],
    },
    {
      name: "Rainbow Gravitation",
      ready: () => have($skill`Rainbow Gravitation`),
      completed: () =>
        get("prismaticSummons") === 3 || garboValue($item`prismatic wad`) < sum(Wads, garboValue),
      do: () => useSkill($skill`Rainbow Gravitation`, 3 - get("prismaticSummons")),
      acquire: () => Wads.map((x) => <AcquireItem>{ item: x, num: 3 - get("prismaticSummons") }),
    },
    {
      name: "Request Sandwich",
      ready: () => have($skill`Request Sandwich`),
      completed: () => get("_requestSandwichSucceeded"),
      do: () => useSkill($skill`Request Sandwich`),
      limit: { skip: 10 },
    },
    {
      name: "Demand Sandwich",
      ready: () => have($skill`Demand Sandwich`),
      completed: () => get("_demandSandwich") > 0,
      do: () => useSkill($skill`Demand Sandwich`),
    },
    {
      name: "Tea Tree",
      ready: () => getCampground()["potted tea tree"] !== undefined,
      completed: () => get("_pottedTeaTreeUsed"),
      do: (): void => {
        const teas = $items`cuppa Activi tea, cuppa Alacri tea, cuppa Boo tea, cuppa Chari tea, cuppa Craft tea, cuppa Cruel tea, cuppa Dexteri tea, cuppa Feroci tea, cuppa Flamibili tea, cuppa Flexibili tea, cuppa Frost tea, cuppa Gill tea, cuppa Impregnabili tea, cuppa Improprie tea, cuppa Insani tea, cuppa Irritabili tea, cuppa Loyal tea, cuppa Mana tea, cuppa Mediocri tea, cuppa Monstrosi tea, cuppa Morbidi tea, cuppa Nas tea, cuppa Net tea, cuppa Neuroplastici tea, cuppa Obscuri tea, cuppa Physicali tea, cuppa Proprie tea, cuppa Royal tea, cuppa Serendipi tea, cuppa Sobrie tea, cuppa Toast tea, cuppa Twen tea, cuppa Uncertain tea, cuppa Vitali tea, cuppa Voraci tea, cuppa Wit tea, cuppa Yet tea`;
        const bestTea = maxBy(teas, garboValue);
        const shakeVal = 3 * garboAverageValue(...teas);
        const teaAction = shakeVal > garboValue(bestTea) ? "shake" : bestTea.name;
        cliExecute(`teatree ${teaAction}`);
      },
    },
    {
      name: "Check Jick Jar",
      ready: () => have($item`psychoanalytic jar`),
      completed: () => get("_jickJarAvailable") !== "unknown",
      do: () => visitUrl("showplayer.php?who=1"),
    },
    {
      name: "Acquire Jick Jar",
      ready: () => have($item`psychoanalytic jar`) && get("_jickJarAvailable") === "true",
      completed: () => get("_psychoJarFilled"),
      do: () => visitUrl("showplayer.php?who=1&action=jung&whichperson=jick"),
    },
    {
      name: "Cargo Shorts Pocket",
      ready: () => have($item`Cargo Cultist Shorts`),
      completed: () => get("_cargoPocketEmptied"),
      do: pickCargoPocket,
    },
    {
      name: "Time-Spinner Gin",
      ready: () =>
        have($item`Time-Spinner`) &&
        !doingGregFight() &&
        get("timeSpinnerMedals") >= 5 &&
        get("_timeSpinnerMinutesUsed") <= 8,
      completed: () => get("_timeSpinnerReplicatorUsed"),
      do: () => cliExecute("FarFuture drink"),
    },
    {
      name: "FantasyRealm Hat",
      ready: () => get("frAlways") || get("_frToday"),
      completed: () => have($item`FantasyRealm G. E. M.`),
      do: () => {
        visitUrl("place.php?whichplace=realm_fantasy&action=fr_initcenter");
        runChoice(-1);
      },
      choices: { 1280: 1 },
    },
    {
      name: "Lodestone",
      ready: () => have($item`lodestone`) && !get("_lodestoneUsed"),
      completed: () => get("_lodestoneUsed"),
      do: () => use($item`lodestone`),
    },
    {
      name: "Update Garbage Tote",
      ready: () => have($item`January's Garbage Tote`) && !get("_garbageItemChanged"),
      completed: () => get("_garbageItemChanged"),
      do: () => cliExecute("fold broken champagne bottle"),
    },
    {
      name: "Learn About Bugs",
      ready: () => have($item`S.I.T. Course Completion Certificate`),
      completed: () => get("_sitCourseCompleted") || have($skill`Insectologist`),
      do: () => use($item`S.I.T. Course Completion Certificate`),
      choices: { 1494: 2 },
    },
    {
      name: "Clear Existing Rufus Quest",
      completed: () => get("_shadowAffinityToday") || _shouldClearRufusQuest !== null,
      do: (): void => {
        const value = rufusPotion.value(embezzlerCount());
        const price = rufusPotion.price(false);
        _shouldClearRufusQuest = value.some(
          (value) =>
            (!globalOptions.nobarf || value.name === "embezzler") && value.value - price > 0,
        );
        if (_shouldClearRufusQuest) {
          const target = ClosedCircuitPayphone.rufusTarget() as Item;
          if (get("rufusQuestType") === "items") {
            if (acquire(3, target, 2 * mallPrice(target), false, 100000)) {
              withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
            }
          } else if (get("rufusQuestType") === "artifact") {
            if (have(target)) withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
          }
        }
      },
    },
    {
      name: "Accept Rufus Quest for Forest",
      ready: () => ClosedCircuitPayphone.have() && !ClosedCircuitPayphone.rufusTarget(),
      completed: () => get("_shadowForestLooted") || have($item`Rufus's shadow lodestone`),
      do: () => ClosedCircuitPayphone.chooseQuest(() => 3),
    },
    {
      name: "Acquire Rufus Items",
      ready: () => {
        if (!ClosedCircuitPayphone.have()) return false;
        const target = ClosedCircuitPayphone.rufusTarget();
        return target instanceof Item && target.tradeable;
      },
      completed: () =>
        get("_shadowForestLooted") || have($item`Rufus's shadow lodestone`) || triedForest,
      do: () => {
        const target = ClosedCircuitPayphone.rufusTarget();
        const bestRift = ClosedCircuitPayphone.chooseRift({
          canAdventure: true,
          sortBy: (l) =>
            sum(getMonsters(l), (m) => sum(itemDropsArray(m), ({ drop }) => garboValue(drop))),
        });
        if (!bestRift) abort("Failed to choose rift for Shadow Forest");
        const value =
          (((6 + 9) / 2) *
            sum(getMonsters(bestRift), (m) =>
              sum(itemDropsArray(m), ({ drop }) => garboValue(drop)),
            )) /
          3;
        if (target instanceof Item && target.tradeable) {
          if (acquire(3, target, value, false) < 3) {
            print(`Our Rufus quest is ${target}, which costs too much to do the Forest!`, "red");
          }
          triedForest = true;
        }
      },
    },
    {
      name: "Turn In Rufus Quest for Forest",
      ready: () => questStep("questRufus") === 1,
      completed: () => get("_shadowForestLooted") || have($item`Rufus's shadow lodestone`),
      do: () => ClosedCircuitPayphone.submitQuest(),
    },
    {
      name: "Shadow Forest",
      ready: () => have($item`Rufus's shadow lodestone`),
      completed: () => get("_shadowForestLooted"),
      do: () =>
        ClosedCircuitPayphone.chooseRift({
          canAdventure: true,
          sortBy: (l) =>
            sum(getMonsters(l), (m) => sum(itemDropsArray(m), ({ drop }) => garboValue(drop))),
        }) ?? abort("Failed to find appropriate rift for Shadow Forest"),
      choices: {
        1500: 3,
      },
    },
    ...augustSummonTasks(),
  ],
];

export const DailyItemsQuest: Quest<GarboTask> = {
  name: "Daily Items",
  tasks: DailyItemTasks,
};

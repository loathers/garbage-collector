import { AcquireItem, Quest } from "grimoire-kolmafia";
import {
  abort,
  buy,
  canAdventure,
  canEquip,
  cliExecute,
  getCampground,
  getClanLounge,
  getMonsters,
  inebrietyLimit,
  Item,
  itemAmount,
  itemDropsArray,
  itemPockets,
  mallPrice,
  meatPockets,
  myInebriety,
  pickedPockets,
  pocketItems,
  pocketMeat,
  print,
  runChoice,
  scrapPockets,
  sellPrice,
  sellsItem,
  toInt,
  toItem,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $coinmaster,
  $item,
  $items,
  $location,
  $skill,
  $skills,
  AprilingBandHelmet,
  BurningLeaves,
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
import { aprilFoolsRufus } from "../lib";
import { rufusPotion } from "../potions";
import { garboAverageValue, garboValue } from "../garboValue";
import { GarboTask } from "./engine";
import {
  augustSummonTasks,
  candyMapDailyTasks,
  doingGregFight,
  getBestAprilInstruments,
  leprecondoTask,
  mayamCalendarSummon,
} from "../resources";
import { meatFamiliar } from "../familiar";
import getExperienceFamiliars from "../familiar/experienceFamiliars";
import { highMeatMonsterCount } from "../turns";

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
        ([item, count]) => garboValue(toItem(item)) * count,
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

function bestDevilerCandy(): Item {
  // These are replenishable notrade nodiscard items that we would prefer to use
  const priorityUntradeableNoDiscardList =
    $items`sugar shotgun, sugar shillelagh, sugar shank, sugar chapeau, sugar shorts, sugar shield, sugar shirt`.filter(
      (i) => itemAmount(i) > 1,
    );
  if (priorityUntradeableNoDiscardList.length > 0) {
    return maxBy(priorityUntradeableNoDiscardList, itemAmount);
  }

  const bestCandyFromMall = maxBy(
    Item.all().filter((i) => i.candy && i.tradeable),
    mallPrice,
    true,
  );
  // These are notrade items that have an autosell value that we don't mind using if they are the cheapest
  const safeUntradeableCandies = $items`Comet Pop, black candy heart, peanut brittle shield`;
  // Find the best candy from inventory, accounting for value of autosell when mall min
  const inventoryCandies = Item.all().filter(
    (i) =>
      i.candy &&
      (have(i) && !i.tradeable ? safeUntradeableCandies.includes(i) : true),
  );
  const bestInventoryCandy = (() => {
    if (inventoryCandies.length === 0) return null;
    const naiveBest = maxBy(inventoryCandies, garboValue, true);
    return maxBy(
      inventoryCandies.filter((c) => garboValue(c) === garboValue(naiveBest)),
      itemAmount,
    );
  })();

  return !!bestInventoryCandy &&
    garboValue(bestInventoryCandy) < mallPrice(bestCandyFromMall)
    ? bestInventoryCandy
    : bestCandyFromMall;
}

let cachedbestDevilerCandy: Item | null = null;
function getBestDevilerCandy(): Item {
  if (cachedbestDevilerCandy === null) {
    cachedbestDevilerCandy = bestDevilerCandy();
  }
  return cachedbestDevilerCandy;
}

const chooseAprilFamiliar = () => {
  const experienceFamiliars = getExperienceFamiliars("free").filter(
    ({ familiar }) => familiar.experience <= 360,
  );
  if (experienceFamiliars.length) {
    return maxBy(experienceFamiliars, "expectedValue").familiar;
  }
  return meatFamiliar().experience <= 360 ? meatFamiliar() : null;
};

const SummonTasks: GarboTask[] = [
  ...SummonTomes.map(
    (skill) =>
      <GarboTask>{
        name: `${skill}`,
        ready: () => have(skill),
        completed: () => skill.dailylimit === 0,
        do: () => useSkill(skill, skill.dailylimit),
        spendsTurn: false,
      },
  ),
];

let triedForest = false;
const DailyItemTasks: GarboTask[] = [
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
    spendsTurn: false,
  },
  {
    name: "2002 Mr. Store",
    ready: () => have($item`2002 Mr. Store Catalog`),
    completed: () =>
      get("availableMrStore2002Credits") === 0 &&
      get("_2002MrStoreCreditsCollected"),
    do: (): void => {
      const bestItem = maxBy(
        Item.all().filter((i) => sellsItem($coinmaster`Mr. Store 2002`, i)),
        garboValue,
      );
      buy(
        $coinmaster`Mr. Store 2002`,
        get("availableMrStore2002Credits"),
        bestItem,
      );
    },
    spendsTurn: false,
  },
  {
    name: "Spend Sept-Ember Embers",
    ready: () => have($item`Sept-Ember Censer`) && globalOptions.ascend,
    completed: () => get("availableSeptEmbers") === 0,
    do: (): void => {
      const itemsWithCosts = Item.all()
        .filter((i) => sellsItem($coinmaster`Sept-Ember Censer`, i))
        .map((item) => ({
          item,
          cost: sellPrice($coinmaster`Sept-Ember Censer`, item),
          value:
            garboValue(item) / sellPrice($coinmaster`Sept-Ember Censer`, item),
        }));

      while (get("availableSeptEmbers") > 0) {
        const { item, cost } = maxBy(
          itemsWithCosts.filter(
            ({ cost }) => cost <= get("availableSeptEmbers"),
          ),
          "value",
        );
        const toBuy = Math.floor(get("availableSeptEmbers") / cost);
        buy($coinmaster`Sept-Ember Censer`, toBuy, item);
      }
    },
    spendsTurn: false,
  },
  {
    name: "Chateau Mantegna Desk",
    ready: () => ChateauMantegna.have(),
    completed: () => get("_chateauDeskHarvested"),
    do: () =>
      visitUrl("place.php?whichplace=chateau&action=chateau_desk2", false),
    spendsTurn: false,
  },
  {
    name: "Kremlin's Greatest Briefcase Collect",
    ready: () => have($item`Kremlin's Greatest Briefcase`),
    completed: () =>
      get("_kgbClicksUsed") > 17 || get("_kgbDispenserUses") >= 3,
    do: () => cliExecute("Briefcase collect"),
    spendsTurn: false,
  },
  {
    name: "Ice Cold April Shower",
    ready: () =>
      have($item`Clan VIP Lounge key`) &&
      getClanLounge()["Clan shower"] !== undefined,
    completed: () => get("_aprilShower"),
    do: () => cliExecute("try; shower ice"),
    spendsTurn: false,
  },
  {
    name: "Swimming Pool Item",
    ready: () =>
      have($item`Clan VIP Lounge key`) &&
      getClanLounge()["Olympic-sized Clan crate"] !== undefined,
    completed: () => get("_olympicSwimmingPoolItemFound"),
    do: () => cliExecute("swim item"),
    spendsTurn: false,
  },
  {
    name: "Cheat Deck of Every Card",
    ready: () => have($item`Deck of Every Card`),
    completed: () => Math.floor(3 - get("_deckCardsDrawn") / 5) === 0,
    do: drawBestCards,
    spendsTurn: false,
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
    spendsTurn: false,
  },
  {
    name: "Internet Meme Shop viral video",
    completed: () =>
      get("_internetViralVideoBought") ||
      garboValue($item`viral video`) <
        garboValue($item`BACON`) *
          sellPrice($coinmaster`Internet Meme Shop`, $item`viral video`),
    do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`viral video`),
    acquire: [
      {
        item: $item`BACON`,
        num: sellPrice($coinmaster`Internet Meme Shop`, $item`viral video`),
      },
    ],
    spendsTurn: false,
  },
  {
    name: "Internet Meme Shop plus one",
    completed: () =>
      get("_internetPlusOneBought") ||
      garboValue($item`plus one`) <
        garboValue($item`BACON`) *
          sellPrice($coinmaster`Internet Meme Shop`, $item`plus one`),
    do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`plus one`),
    acquire: [
      {
        item: $item`BACON`,
        num: sellPrice($coinmaster`Internet Meme Shop`, $item`plus one`),
      },
    ],
    spendsTurn: false,
  },
  {
    name: "Internet Meme Shop gallon of milk",
    completed: () =>
      get("_internetGallonOfMilkBought") ||
      garboValue($item`gallon of milk`) <
        garboValue($item`BACON`) *
          sellPrice($coinmaster`Internet Meme Shop`, $item`gallon of milk`),
    do: () => buy($coinmaster`Internet Meme Shop`, 1, $item`gallon of milk`),
    acquire: [
      {
        item: $item`BACON`,
        num: sellPrice($coinmaster`Internet Meme Shop`, $item`gallon of milk`),
      },
    ],
    spendsTurn: false,
  },
  {
    name: "Internet Meme Shop print screen button",
    completed: () =>
      get("_internetPrintScreenButtonBought") ||
      garboValue($item`print screen button`) <
        garboValue($item`BACON`) *
          sellPrice(
            $coinmaster`Internet Meme Shop`,
            $item`print screen button`,
          ),
    do: () =>
      buy($coinmaster`Internet Meme Shop`, 1, $item`print screen button`),
    acquire: [
      {
        item: $item`BACON`,
        num: sellPrice(
          $coinmaster`Internet Meme Shop`,
          $item`print screen button`,
        ),
      },
    ],
    spendsTurn: false,
  },
  {
    name: "Internet Meme Shop daily dungeon malware",
    completed: () =>
      get("_internetDailyDungeonMalwareBought") ||
      garboValue($item`daily dungeon malware`) <
        garboValue($item`BACON`) *
          sellPrice(
            $coinmaster`Internet Meme Shop`,
            $item`daily dungeon malware`,
          ),
    do: () =>
      buy($coinmaster`Internet Meme Shop`, 1, $item`daily dungeon malware`),
    acquire: [
      {
        item: $item`BACON`,
        num: sellPrice(
          $coinmaster`Internet Meme Shop`,
          $item`daily dungeon malware`,
        ),
      },
    ],
    spendsTurn: false,
  },
  {
    name: "Rainbow Gravitation",
    ready: () => have($skill`Rainbow Gravitation`),
    completed: () =>
      get("prismaticSummons") === 3 ||
      garboValue($item`prismatic wad`) < sum(Wads, garboValue),
    do: () =>
      useSkill($skill`Rainbow Gravitation`, 3 - get("prismaticSummons")),
    acquire: () =>
      Wads.map(
        (x) => <AcquireItem>{ item: x, num: 3 - get("prismaticSummons") },
      ),
    spendsTurn: false,
  },
  {
    name: "Request Sandwich",
    ready: () => have($skill`Request Sandwich`),
    completed: () => get("_requestSandwichSucceeded"),
    do: () => useSkill($skill`Request Sandwich`),
    limit: { skip: 10 },
    spendsTurn: false,
  },
  {
    name: "Demand Sandwich",
    ready: () => have($skill`Demand Sandwich`),
    completed: () => get("_demandSandwich") > 0,
    do: () => useSkill($skill`Demand Sandwich`),
    spendsTurn: false,
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
    spendsTurn: false,
  },
  {
    name: "Check Jick Jar",
    ready: () => have($item`psychoanalytic jar`),
    completed: () => get("_jickJarAvailable") !== "unknown",
    do: () => visitUrl("showplayer.php?who=1"),
    spendsTurn: false,
  },
  {
    name: "Acquire Jick Jar",
    ready: () =>
      have($item`psychoanalytic jar`) && get("_jickJarAvailable") === "true",
    completed: () => get("_psychoJarFilled"),
    do: () => visitUrl("showplayer.php?who=1&action=jung&whichperson=jick"),
    spendsTurn: false,
  },
  {
    name: "Cargo Shorts Pocket",
    ready: () => have($item`Cargo Cultist Shorts`),
    completed: () => get("_cargoPocketEmptied"),
    do: pickCargoPocket,
    spendsTurn: false,
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
    spendsTurn: false,
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
    spendsTurn: false,
  },
  {
    name: "Lodestone",
    ready: () => have($item`lodestone`) && !get("_lodestoneUsed"),
    completed: () => get("_lodestoneUsed"),
    do: () => use($item`lodestone`),
    spendsTurn: false,
  },
  {
    name: "Learn About Bugs",
    ready: () => have($item`S.I.T. Course Completion Certificate`),
    completed: () => get("_sitCourseCompleted") || have($skill`Insectologist`),
    do: () => use($item`S.I.T. Course Completion Certificate`),
    choices: { 1494: 2 },
    spendsTurn: false,
  },
  {
    name: "Rake Leaves",
    ready: () => BurningLeaves.have(),
    completed: () => have($item`rake`),
    do: () => {
      visitUrl("campground.php?preaction=leaves");
      visitUrl("main.php"); // Mafia not marking as can walk away
    },
    spendsTurn: false,
  },
  {
    name: "Burning Leaves lit leaf lasso",
    ready: () =>
      BurningLeaves.have() &&
      BurningLeaves.numberOfLeaves() >=
        (BurningLeaves.burnFor.get($item`lit leaf lasso`) ?? Infinity),
    completed: () => get("_leafLassosCrafted") >= 3,
    do: () => BurningLeaves.burnSpecialLeaves($item`lit leaf lasso`),
    limit: { skip: 3 },
    spendsTurn: false,
  },
  {
    name: "Burning Leaves day shortener",
    ready: () =>
      BurningLeaves.have() &&
      BurningLeaves.numberOfLeaves() >=
        (BurningLeaves.burnFor.get($item`day shortener`) ?? Infinity),
    completed: () => get("_leafDayShortenerCrafted"),
    do: () => BurningLeaves.burnSpecialLeaves($item`day shortener`),
    spendsTurn: false,
  },
  {
    name: "Candy cane sword cane Shrine Meat",
    ready: () =>
      have($item`candy cane sword cane`) &&
      canAdventure($location`An Overgrown Shrine (Northeast)`) &&
      (!(myInebriety() > inebrietyLimit()) ||
        (have($item`Drunkula's wineglass`) &&
          canEquip($item`Drunkula's wineglass`))),
    completed: () => get("_candyCaneSwordOvergrownShrine"),
    do: () => {
      visitUrl("adventure.php?snarfblat=348");
      runChoice(4);
      runChoice(6);
    },
    outfit: () => ({
      weapon: $item`candy cane sword cane`,
      offhand:
        myInebriety() > inebrietyLimit()
          ? $item`Drunkula's wineglass`
          : undefined,
    }),
    limit: { skip: 3 },
    spendsTurn: false,
  },
  {
    name: "Clear Existing Rufus Quest",
    completed: () =>
      get("_shadowAffinityToday") || _shouldClearRufusQuest !== null,
    do: (): void => {
      const value = rufusPotion.value(highMeatMonsterCount());
      const price = rufusPotion.price(false);
      _shouldClearRufusQuest = value.some(
        (value) =>
          (!globalOptions.nobarf || value.name === "target") &&
          value.value - price > 0,
      );
      if (_shouldClearRufusQuest) {
        const target = ClosedCircuitPayphone.rufusTarget() as Item;
        if (get("rufusQuestType") === "items") {
          if (acquire(3, target, 2 * mallPrice(target), false, 100000)) {
            withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
          }
        } else if (get("rufusQuestType") === "artifact") {
          if (have(target)) {
            withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
          }
        }
      }
    },
    spendsTurn: false,
  },
  {
    name: "Accept Rufus Quest for Forest",
    ready: () =>
      ClosedCircuitPayphone.have() && !ClosedCircuitPayphone.rufusTarget(),
    completed: () =>
      get("_shadowForestLooted") || have($item`Rufus's shadow lodestone`),
    do: () => {
      ClosedCircuitPayphone.chooseQuest(() => 3);
      aprilFoolsRufus();
    },
    spendsTurn: false,
  },
  {
    name: "Acquire Rufus Items",
    ready: () => {
      if (!ClosedCircuitPayphone.have()) return false;
      const target = ClosedCircuitPayphone.rufusTarget();
      return target instanceof Item && target.tradeable;
    },
    completed: () =>
      get("_shadowForestLooted") ||
      have($item`Rufus's shadow lodestone`) ||
      triedForest,
    do: () => {
      const target = ClosedCircuitPayphone.rufusTarget();
      const bestRift = ClosedCircuitPayphone.chooseRift({
        canAdventure: true,
        sortBy: (l) =>
          sum(getMonsters(l), (m) =>
            sum(itemDropsArray(m), ({ drop }) => garboValue(drop)),
          ),
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
          print(
            `Our Rufus quest is ${target}, which costs too much to do the Forest!`,
            "red",
          );
        }
        triedForest = true;
      }
    },
    spendsTurn: false,
  },
  {
    name: "Turn In Rufus Quest for Forest",
    ready: () => questStep("questRufus") === 1,
    completed: () =>
      get("_shadowForestLooted") || have($item`Rufus's shadow lodestone`),
    do: () => ClosedCircuitPayphone.submitQuest(),
    spendsTurn: false,
  },
  {
    name: "Shadow Forest",
    ready: () => have($item`Rufus's shadow lodestone`),
    completed: () => get("_shadowForestLooted"),
    do: () =>
      ClosedCircuitPayphone.chooseRift({
        canAdventure: true,
        sortBy: (l) =>
          sum(getMonsters(l), (m) =>
            sum(itemDropsArray(m), ({ drop }) => garboValue(drop)),
          ),
      }) ?? abort("Failed to find appropriate rift for Shadow Forest"),
    choices: {
      1500: 3,
    },
    spendsTurn: false,
  },
  ...augustSummonTasks(),
  ...candyMapDailyTasks(),
  {
    name: "Get April Instruments",
    completed: () => !AprilingBandHelmet.canJoinSection(),
    do: () =>
      getBestAprilInstruments().forEach((instrument) =>
        AprilingBandHelmet.joinSection(instrument),
      ),
    spendsTurn: false,
  },
  {
    name: "Play the April piccolo",
    ready: () => have($item`Apriling band piccolo`),
    do: () => {
      let familiar = chooseAprilFamiliar();
      while (
        familiar &&
        AprilingBandHelmet.canPlay($item`Apriling band piccolo`)
      ) {
        useFamiliar(familiar);
        AprilingBandHelmet.play($item`Apriling band piccolo`);
        familiar = chooseAprilFamiliar();
      }
    },
    completed: () => !AprilingBandHelmet.canPlay($item`Apriling band piccolo`),
    spendsTurn: false,
  },
  mayamCalendarSummon(),
  {
    name: "Devil Cheapest Candy",
    ready: () => have($item`candy egg deviler`), // TODO: Support guild stash
    completed: () =>
      get("_candyEggsDeviled") >= 3 ||
      garboValue($item`deviled candy egg`) < garboValue(getBestDevilerCandy()),
    do: () => {
      acquire(
        1,
        getBestDevilerCandy(),
        garboValue($item`deviled candy egg`),
        true,
      );
      print(
        `${getBestDevilerCandy()} will be deviled for expected profit of ${garboValue($item`deviled candy egg`) - garboValue(getBestDevilerCandy())}`,
      );
      visitUrl(`inventory.php?action=eggdevil&pwd`);
      runChoice(1, `a=${toInt(getBestDevilerCandy())}`);
      cachedbestDevilerCandy = null;
    },
    limit: { skip: 3 },
    spendsTurn: false,
  },
  leprecondoTask(),
];

export const DailyItemsQuest: Quest<GarboTask> = {
  name: "Daily Items",
  tasks: [...SummonTasks, ...DailyItemTasks],
};

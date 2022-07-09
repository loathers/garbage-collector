import {
  abort,
  adv1,
  buy,
  changeMcd,
  cliExecute,
  equip,
  familiarEquippedEquipment,
  fileToBuffer,
  gamedayToInt,
  getCampground,
  getClanLounge,
  handlingChoice,
  haveSkill,
  holiday,
  inebrietyLimit,
  Item,
  itemAmount,
  itemPockets,
  mallPrice,
  maximize,
  meatPockets,
  myClass,
  myHp,
  myInebriety,
  myLevel,
  myMaxhp,
  myPrimestat,
  myThrall,
  pickedPockets,
  pocketItems,
  pocketMeat,
  print,
  putCloset,
  restoreHp,
  retrieveItem,
  retrievePrice,
  runChoice,
  scrapPockets,
  toItem,
  toSlot,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $coinmaster,
  $effect,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $skills,
  $slot,
  $stat,
  $thrall,
  BeachComb,
  ChateauMantegna,
  ensureEffect,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  Pantogram,
  property,
  Robortender,
  set,
  SongBoom,
  SourceTerminal,
  sum,
  uneffect,
  withProperty,
} from "libram";
import { calculateMeatFamiliar, meatFamiliar } from "./familiar";
import {
  argmax,
  baseMeat,
  coinmasterPrice,
  garbageTouristRatio,
  globalOptions,
  HIGHLIGHT,
  logMessage,
  realmAvailable,
  today,
  tryFeast,
  turnsToNC,
  userConfirmDialog,
} from "./lib";
import { withStash } from "./clan";
import { embezzlerCount, estimatedTurns } from "./embezzler";
import { refreshLatte } from "./outfit";
import { digitizedMonstersRemaining } from "./wanderer";
import { doingExtrovermectin } from "./extrovermectin";
import { garboAverageValue, garboValue } from "./session";
import { acquire } from "./acquire";
import { estimatedTentacles } from "./fights";

export function dailySetup(): void {
  voterSetup();
  martini();
  chateauDesk();
  gaze();
  configureGear();
  horse();
  prepFamiliars();
  dailyBuffs();
  configureMisc();
  nepQuest();
  volcanoDailies();
  cheat();
  tomeSummons();
  gin();
  extrude();
  internetMemeShop();
  pickTea();
  pickCargoPocket();
  refreshLatte();
  implement();
  comb();
  getAttuned();
  jickjar();
  seaJelly();

  retrieveItem($item`Half a Purse`);
  if (have($familiar`Hobo Monkey`) || have($item`hobo nickel`, 1000)) {
    putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  }
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
  if (myInebriety() > inebrietyLimit()) return;
  retrieveItem($item`seal tooth`);
  retrieveItem($item`The Jokester's gun`);
  putCloset(itemAmount($item`4-d camera`), $item`4-d camera`);
  putCloset(itemAmount($item`unfinished ice sculpture`), $item`unfinished ice sculpture`);
}

export function postFreeFightDailySetup(): void {
  configureVykea();
  configureThrall();
}

function voterSetup(): void {
  if (have($item`"I Voted!" sticker`) || !(get("voteAlways") || get("_voteToday"))) return;

  // We do this funny logic on annoyed snake & slime blob because they both suck for profits
  // And because we don't want to lock people out of grabbing an outfit
  const voterValueTable = [
    {
      monster: $monster`terrible mutant`,
      value: garboValue($item`glob of undifferentiated tissue`) + 10,
    },
    {
      monster: $monster`angry ghost`,
      value: garboValue($item`ghostly ectoplasm`) * 1.11,
    },
    {
      monster: $monster`government bureaucrat`,
      value: garboValue($item`absentee voter ballot`) * 0.05 + 75 * 0.25 + 50,
    },
    {
      monster: $monster`annoyed snake`,
      value: gamedayToInt(),
    },
    {
      monster: $monster`slime blob`,
      value: 95 - gamedayToInt(),
    },
  ];

  visitUrl("place.php?whichplace=town_right&action=townright_vote");

  const votingMonsterPriority = voterValueTable
    .sort((a, b) => b.value - a.value)
    .map((element) => element.monster.name);

  const initPriority = new Map<string, number>([
    ["Meat Drop: +30", 10],
    ["Item Drop: +15", 9],
    ["Familiar Experience: +2", 8],
    ["Adventures: +1", globalOptions.ascending ? -2 : 7],
    ["Monster Level: +10", 5],
    [`${myPrimestat()} Percent: +25`, 3],
    [`Experience (${myPrimestat()}): +4`, 2],
    ["Meat Drop: -30", -2],
    ["Item Drop: -15", -2],
    ["Familiar Experience: -2", -2],
  ]);

  const monsterVote =
    votingMonsterPriority.indexOf(get("_voteMonster1")) <
    votingMonsterPriority.indexOf(get("_voteMonster2"))
      ? 1
      : 2;

  const voteLocalPriorityArr = [
    [0, initPriority.get(get("_voteLocal1")) || (get("_voteLocal1").indexOf("-") === -1 ? 1 : -1)],
    [1, initPriority.get(get("_voteLocal2")) || (get("_voteLocal2").indexOf("-") === -1 ? 1 : -1)],
    [2, initPriority.get(get("_voteLocal3")) || (get("_voteLocal3").indexOf("-") === -1 ? 1 : -1)],
    [3, initPriority.get(get("_voteLocal4")) || (get("_voteLocal4").indexOf("-") === -1 ? 1 : -1)],
  ];

  const bestVotes = voteLocalPriorityArr.sort((a, b) => b[1] - a[1]);
  const init = bestVotes[0][0];

  visitUrl(`choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${init}&local[]=${init}`);
}

function configureGear(): void {
  pantogram();

  if (have($familiar`Cornbeefadon`) && !have($item`amulet coin`)) {
    useFamiliar($familiar`Cornbeefadon`);
    use($item`box of Familiar Jacks`);
  }

  if (
    have($familiar`Shorter-Order Cook`) &&
    familiarEquippedEquipment($familiar`Shorter-Order Cook`) !== $item`blue plate`
  ) {
    retrieveItem($item`blue plate`);
    useFamiliar($familiar`Shorter-Order Cook`);
    equip($slot`familiar`, $item`blue plate`);
  }

  if (have($item`Fourth of May Cosplay Saber`) && get("_saberMod") === 0) {
    // Get familiar weight.
    visitUrl("main.php?action=may4");
    runChoice(4);
  }

  if (have($item`Bastille Battalion control rig`) && get("_bastilleGames") === 0) {
    cliExecute("bastille myst brutalist gesture");
  }
}

function newarkValue(): number {
  const lastCalculated = get("garbo_newarkValueDate", 0);
  if (!get("garbo_newarkValue", 0) || today - lastCalculated > 7 * 24 * 60 * 60 * 1000) {
    const newarkDrops = (
      JSON.parse(fileToBuffer("garbo_robo_drinks_data.json")) as {
        Newark: string[];
        "Feliz Navidad": string[];
      }
    )["Newark"];
    set(
      "garbo_newarkValue",
      (sum(newarkDrops, (name) => garboValue(toItem(name))) / newarkDrops.length).toFixed(0)
    );
    set("garbo_newarkValueDate", today);
  }
  return get("garbo_newarkValue", 0) * 0.25 * estimatedTurns();
}

function felizValue(): number {
  const lastCalculated = get("garbo_felizValueDate", 0);
  if (!get("garbo_felizValue", 0) || today - lastCalculated > 7 * 24 * 60 * 60 * 1000) {
    const felizDrops = (
      JSON.parse(fileToBuffer("garbo_robo_drinks_data.json")) as {
        Newark: string[];
        "Feliz Navidad": string[];
      }
    )["Feliz Navidad"];
    set(
      "garbo_felizValue",
      (sum(felizDrops, (name) => garboValue(toItem(name))) / felizDrops.length).toFixed(0)
    );
    set("garbo_felizValueDate", today);
  }
  return get("garbo_felizValue", 0) * 0.25 * estimatedTurns();
}

function drivebyValue(): number {
  const embezzlers = embezzlerCount();
  const tourists = ((estimatedTurns() - embezzlers) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const meatPercentDelta =
    Math.sqrt(220 * 2 * marginalRoboWeight) -
    Math.sqrt(220 * 2 * marginalRoboWeight) +
    2 * marginalRoboWeight;
  return (meatPercentDelta / 100) * ((750 + baseMeat) * embezzlers + baseMeat * tourists);
}

function entendreValue(): number {
  const embezzlers = embezzlerCount();
  const tourists = ((estimatedTurns() - embezzlers) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const itemPercent = Math.sqrt(55 * marginalRoboWeight) + marginalRoboWeight - 3;
  const garbageBagsDropRate = 0.15 * 3; // 3 bags each with a 15% drop chance
  const meatStackDropRate = 0.3 * 4; // 4 stacks each with a 30% drop chance
  return (
    (itemPercent / 100) *
    (meatStackDropRate * embezzlers + garbageBagsDropRate * tourists * garbageTouristRatio)
  );
}

export function prepFamiliars(): void {
  if (have($familiar`Robortender`)) {
    const roboDrinks = {
      "Drive-by shooting": { priceCap: drivebyValue(), mandatory: true },
      Newark: {
        priceCap: newarkValue(),
        mandatory: false,
      },
      "Feliz Navidad": { priceCap: felizValue(), mandatory: false },
      "Bloody Nora": {
        priceCap: get("_envyfishEggUsed")
          ? (750 + baseMeat) * (0.5 + ((4 + Math.sqrt(110 / 100)) * 30) / 100)
          : 0,
        mandatory: false,
      },
      "Single entendre": { priceCap: entendreValue(), mandatory: false },
    };
    for (const [drinkName, { priceCap, mandatory }] of Object.entries(roboDrinks)) {
      if (get("_roboDrinks").toLowerCase().includes(drinkName.toLowerCase())) continue;
      useFamiliar($familiar`Robortender`);
      const drink = toItem(drinkName);
      if (retrievePrice(drink) > priceCap) {
        if (mandatory) {
          calculateMeatFamiliar();
          if (
            !userConfirmDialog(
              `Garbo cannot find a reasonably priced drive-by-shooting (price cap: ${priceCap}), and will not be using your robortender. Is that cool with you?`,
              true
            )
          ) {
            abort(
              "Alright, then, I guess you should try to find a reasonbly priced drive-by-shooting. Or do different things with your day."
            );
          }
          break;
        }
        continue;
      }
      withProperty("autoBuyPriceLimit", priceCap, () => retrieveItem(1, drink));
      if (have(drink)) Robortender.feed(drink);
    }
  }

  if (have($item`mumming trunk`) && !get("_mummeryMods").includes("Meat Drop")) {
    useFamiliar(meatFamiliar());
    cliExecute("mummery meat");
  }

  if (
    have($item`mumming trunk`) &&
    !get("_mummeryMods").includes("Item Drop") &&
    have($familiar`Trick-or-Treating Tot`)
  ) {
    useFamiliar($familiar`Trick-or-Treating Tot`);
    cliExecute("mummery item");
  }

  if (get("_feastUsed") === 0) {
    withStash($items`moveable feast`, () => {
      if (have($item`moveable feast`)) {
        [
          ...$familiars`Pocket Professor, Frumious Bandersnatch, Pair of Stomping Boots`,
          meatFamiliar(),
        ].forEach(tryFeast);
      }
    });
  }
}

function horse(): void {
  visitUrl("place.php?whichplace=town_right");
  if (get("horseryAvailable") && get("_horsery") !== "dark horse") {
    cliExecute("horsery dark");
  }
}

function dailyBuffs(): void {
  if (have($item`Beach Comb`)) BeachComb.tryHead($effect`Do I Know You From Somewhere?`);

  if (
    !get("_clanFortuneBuffUsed") &&
    have($item`Clan VIP Lounge key`) &&
    getClanLounge()["Clan Carnival Game"] !== undefined
  ) {
    cliExecute("fortune buff meat");
  }

  if (!get("demonSummoned") && get("demonName2", false) && get("questL11Manor") === "finished") {
    cliExecute("summon Preternatural Greed");
  }

  while (SourceTerminal.have() && SourceTerminal.enhanceUsesRemaining() > 0) {
    SourceTerminal.enhance($effect`meat.enh`);
  }

  if (!get("_madTeaParty")) {
    retrieveItem($item`filthy knitted dread sack`);
    ensureEffect($effect`Down the Rabbit Hole`);
    cliExecute("hatter 22");
  }
}

function configureMisc(): void {
  if (SongBoom.songChangesLeft() > 0) {
    if (myInebriety() > inebrietyLimit()) SongBoom.setSong("Food Vibrations");
    else SongBoom.setSong("Total Eclipse of Your Meat");
  }
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  withStash($items`BittyCar MeatCar, BittyCar SoulCar`, () => {
    for (const [car, active] of [
      [$item`BittyCar MeatCar`, "meatcar"],
      [$item`BittyCar SoulCar`, "soulcar"],
    ] as [Item, string][]) {
      if (have(car)) {
        if (get("_bittycar") !== active) use(1, car);
        break;
      }
    }
  });

  if (
    getClanLounge()["Olympic-sized Clan crate"] !== undefined &&
    !get("_olympicSwimmingPoolItemFound") &&
    have($item`Clan VIP Lounge key`)
  ) {
    cliExecute("swim item");
  }

  changeMcd(10);
}

function configureThrall() {
  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Lasagmbie` &&
    haveSkill($skill`Bind Lasagmbie`)
  ) {
    useSkill($skill`Bind Lasagmbie`);
  }

  if (
    myClass() === $class`Pastamancer` &&
    have($item`experimental carbon fiber pasta additive`) &&
    !get("_pastaAdditive") &&
    myThrall().level < 10
  ) {
    use($item`experimental carbon fiber pasta additive`);
  }
}

function configureVykea() {
  if (get("_VYKEACompanionLevel") === 0) {
    const vykeas: [number, number][] = [
      [1, 0],
      [2, 1],
      [3, 11],
    ]; // excluding 4 and 5 as per bean's suggestion
    const vykeaProfit = (level: number, cost: number) =>
      estimatedTurns() * baseMeat * 0.1 * level -
      (5 * mallPrice($item`VYKEA rail`) +
        cost * mallPrice($item`VYKEA dowel`) +
        5 * mallPrice($item`VYKEA plank`) +
        1 * mallPrice($item`VYKEA instructions`));

    if (vykeas.some(([level, cost]) => vykeaProfit(level, cost) > 0)) {
      const level = vykeas.sort((a, b) => vykeaProfit(...b) - vykeaProfit(...a))[0][0];
      retrieveItem($item`VYKEA hex key`);
      cliExecute(`create level ${level} couch`);
    }
  }
}

function nepQuest(): void {
  if (!(get("neverendingPartyAlways") || get("_neverendingPartyToday"))) return;

  if (get("_questPartyFair") === "unstarted") {
    visitUrl(toUrl($location`The Neverending Party`));
    if (["food", "booze", "trash", "dj"].includes(get("_questPartyFairQuest"))) {
      runChoice(1); // Accept quest
    } else {
      runChoice(2); // Decline quest
    }
  }

  if (["food", "booze"].includes(get("_questPartyFairQuest"))) {
    print("Gerald/ine quest!", HIGHLIGHT);
    globalOptions.clarasBellClaimed = true;
  }
}

function volcanoDailies(): void {
  if (!realmAvailable("hot")) return;
  if (!get("_volcanoItemRedeemed")) checkVolcanoQuest();

  if (!get("_infernoDiscoVisited")) {
    print("Getting my free volcoino!", HIGHLIGHT);
    $items`smooth velvet pocket square, smooth velvet socks, smooth velvet hat, smooth velvet shirt, smooth velvet hanky, smooth velvet pants`.forEach(
      (discoEquip) => {
        retrieveItem(discoEquip);
      }
    );
    maximize("disco style", false);
    visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
    runChoice(7);
  }

  if (have($skill`Unaccompanied Miner`) && get("_unaccompaniedMinerUsed") < 5) {
    restoreHp(myMaxhp() * 0.9);
    cliExecute(`minevolcano.ash ${5 - get("_unaccompaniedMinerUsed")}`);
    if (have($effect`Beaten Up`)) {
      uneffect($effect`Beaten Up`);
    }
    if (myHp() < myMaxhp() * 0.5) {
      restoreHp(myMaxhp() * 0.9);
    }
  }
}

type VolcanoItem = { quantity: number; item: Item; choice: number };

function volcanoItemValue({ quantity, item }: VolcanoItem): number {
  const basePrice = retrievePrice(item, quantity);
  if (basePrice >= 0) return basePrice;
  if (item === $item`fused fuse`) {
    // Check if clara's bell is available and unused
    if (!have($item`Clara's bell`) || globalOptions.clarasBellClaimed) return Infinity;
    // Check if we can use Clara's bell for Yachtzee
    // If so, we call the opportunity cost of this about 40k
    if (realmAvailable("sleaze") && have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
      return quantity * 40000;
    } else {
      return quantity * get("valueOfAdventure");
    }
  }
  return Infinity;
}

function checkVolcanoQuest() {
  print("Checking volcano quest", HIGHLIGHT);
  visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
  const volcoinoValue = garboValue($item`Volcoino`);
  const bestItem = [
    {
      item: property.getItem("_volcanoItem1") ?? $item`none`,
      quantity: get("_volcanoItemCount1"),
      choice: 1,
    },
    {
      item: property.getItem("_volcanoItem2") ?? $item`none`,
      quantity: get("_volcanoItemCount2"),
      choice: 2,
    },
    {
      item: property.getItem("_volcanoItem3") ?? $item`none`,
      quantity: get("_volcanoItemCount3"),
      choice: 3,
    },
  ].reduce((a, b) => (volcanoItemValue(a) < volcanoItemValue(b) ? a : b));
  if (bestItem.item === $item`fused fuse`) {
    globalOptions.clarasBellClaimed = true;
    logMessage("Grab a fused fused with your clara's bell charge while overdrunk!");
  } else if (volcanoItemValue(bestItem) < volcoinoValue) {
    withProperty("autoBuyPriceLimit", volcoinoValue, () =>
      retrieveItem(bestItem.item, bestItem.quantity)
    );
    visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
    runChoice(bestItem.choice);
  }
}

function cheat(): void {
  if (!have($item`Deck of Every Card`)) return;
  const cardsLeft = Math.floor(3 - get("_deckCardsDrawn") / 5);
  if (!cardsLeft) return;
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

function tomeSummons(): void {
  const tomes = $skills`Summon Snowcones, Summon Stickers, Summon Sugar Sheets, Summon Rad Libs, Summon Smithsness`;
  tomes.forEach((skill) => {
    if (have(skill) && skill.dailylimit > 0) {
      useSkill(skill, skill.dailylimit);
    }
  });

  if (have($skill`Summon Clip Art`) && $skill`Summon Clip Art`.dailylimit > 0) {
    let best = $item`none`;
    for (let itemId = 5224; itemId <= 5283; itemId++) {
      const current = Item.get(`[${itemId}]`);
      if (garboValue(current) > garboValue(best)) {
        best = current;
      }
    }
    if (best !== $item`none`) {
      cliExecute(`try; create ${$skill`Summon Clip Art`.dailylimit} ${best}`);
    }
  }
}

function extrude(): void {
  if (SourceTerminal.have()) {
    const extrudeConsumables = $items`browser cookie, hacked gibson`;
    const bestExtrude = extrudeConsumables.sort((a, b) => garboValue(b) - garboValue(a))[0];
    if (garboValue(bestExtrude) < garboValue($item`Source essence`) * 10) {
      return;
    }

    let extrudes = get("_sourceTerminalExtrudes");
    while (extrudes < 3) {
      if (
        !retrieveItem($item`Source essence`, 10) ||
        !SourceTerminal.extrude(bestExtrude) ||
        get("_sourceTerminalExtrudes") === extrudes
      ) {
        break;
      }
      extrudes = get("_sourceTerminalExtrudes");
    }
  }
}

function gin(): void {
  if (have($item`Time-Spinner`)) {
    if (
      !doingExtrovermectin() &&
      !get("_timeSpinnerReplicatorUsed") &&
      get("timeSpinnerMedals") >= 5 &&
      get("_timeSpinnerMinutesUsed") <= 8
    ) {
      cliExecute("FarFuture drink");
    }
  }
}

function internetMemeShop(): void {
  const baconValue = mallPrice($item`BACON`);

  const internetMemeShopProperties = {
    _internetViralVideoBought: $item`viral video`,
    _internetPlusOneBought: $item`plus one`,
    _internetGallonOfMilkBought: $item`gallon of milk`,
    _internetPrintScreenButtonBought: $item`print screen button`,
    _internetDailyDungeonMalwareBought: $item`daily dungeon malware`,
  };

  for (const [property, item] of Object.entries(internetMemeShopProperties)) {
    if (!get(property, false) && baconValue * coinmasterPrice(item) < garboValue(item)) {
      retrieveItem($item`BACON`, coinmasterPrice(item));
      buy($coinmaster`Internet Meme Shop`, 1, item);
    }
  }
}

const teas = $items`cuppa Activi tea, cuppa Alacri tea, cuppa Boo tea, cuppa Chari tea, cuppa Craft tea, cuppa Cruel tea, cuppa Dexteri tea, cuppa Feroci tea, cuppa Flamibili tea, cuppa Flexibili tea, cuppa Frost tea, cuppa Gill tea, cuppa Impregnabili tea, cuppa Improprie tea, cuppa Insani tea, cuppa Irritabili tea, cuppa Loyal tea, cuppa Mana tea, cuppa Mediocri tea, cuppa Monstrosi tea, cuppa Morbidi tea, cuppa Nas tea, cuppa Net tea, cuppa Neuroplastici tea, cuppa Obscuri tea, cuppa Physicali tea, cuppa Proprie tea, cuppa Royal tea, cuppa Serendipi tea, cuppa Sobrie tea, cuppa Toast tea, cuppa Twen tea, cuppa Uncertain tea, cuppa Vitali tea, cuppa Voraci tea, cuppa Wit tea, cuppa Yet tea`;
function pickTea(): void {
  if (!getCampground()["potted tea tree"] || get("_pottedTeaTreeUsed")) return;
  const bestTea = teas.sort((a, b) => garboValue(b) - garboValue(a))[0];
  const shakeVal = 3 * garboAverageValue(...teas);
  const teaAction = shakeVal > garboValue(bestTea) ? "shake" : bestTea.name;
  cliExecute(`teatree ${teaAction}`);
}

function gaze(): void {
  if (!get("getawayCampsiteUnlocked")) return;
  if (!get("_campAwayCloudBuffs")) visitUrl("place.php?whichplace=campaway&action=campaway_sky");
  while (get("_campAwaySmileBuffs") < 3) {
    visitUrl("place.php?whichplace=campaway&action=campaway_sky");
  }
}

function martini(): void {
  if (
    !have($item`Kremlin's Greatest Briefcase`) ||
    get("_kgbClicksUsed") > 17 ||
    get("_kgbDispenserUses") >= 3
  ) {
    return;
  }
  cliExecute("Briefcase collect");
}

function chateauDesk(): void {
  if (ChateauMantegna.have() && !get("_chateauDeskHarvested")) {
    visitUrl("place.php?whichplace=chateau&action=chateau_desk2", false);
  }
}

export function implement(): void {
  if (!have($item`[glitch season reward name]`) || get("_glitchItemImplemented")) return;
  retrieveItem($item`[glitch season reward name]`);
  use($item`[glitch season reward name]`);
}

function pantogram(): void {
  if (!Pantogram.have() || Pantogram.havePants()) return;
  let pantogramValue: number;
  if (have($item`repaid diaper`) && have($familiar`Robortender`)) {
    const expectedBarfTurns = globalOptions.noBarf
      ? 0
      : estimatedTurns() - digitizedMonstersRemaining() - embezzlerCount();
    pantogramValue = 100 * expectedBarfTurns;
  } else {
    const lepMult = findLeprechaunMultiplier(meatFamiliar());
    const lepBonus = 2 * lepMult + Math.sqrt(lepMult);
    const totalPantsValue = (pants: Item) =>
      getModifier("Meat Drop", pants) + getModifier("Familiar Weight", pants) * lepBonus;
    const bestPantsValue =
      Item.all()
        .filter((item) => have(item) && toSlot(item) === $slot`pants`)
        .map((pants) => totalPantsValue(pants))
        .sort((a, b) => b - a)[0] ?? 0;
    pantogramValue = (100 + 0.6 * baseMeat - (bestPantsValue * baseMeat) / 100) * estimatedTurns();
  }
  const cloverPrice = Math.min(
    ...$items`ten-leaf clover, disassembled clover`.map((item) => mallPrice(item))
  );
  if (cloverPrice + mallPrice($item`porquoise`) > pantogramValue) {
    return;
  }
  acquire(1, $item`porquoise`, pantogramValue - cloverPrice, false);
  if (!have($item`porquoise`)) return;
  retrieveItem($item`ten-leaf clover`);
  retrieveItem($item`bubblin' crude`);
  const alignment = (new Map([
    [$stat`Muscle`, "Muscle"],
    [$stat`Mysticality`, "Mysticality"],
    [$stat`Moxie`, "Moxie"],
  ]).get(myPrimestat()) ?? "Mysticality") as "Muscle" | "Mysticality" | "Moxie";
  Pantogram.makePants(
    alignment,
    "Sleaze Resistance: 2",
    "MP Regen Max: 15",
    "Drops Items: true",
    "Meat Drop: 60"
  );
}

function pickCargoPocket(): void {
  if (!have($item`Cargo Cultist Shorts`) || get("_cargoPocketEmptied")) return;

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
      value += Object.entries(pocketItems(pocket))
        .map(([item, count]) => garboValue(toItem(item)) * count)
        .reduce((prev, cur) => prev + cur, 0);
    }
    if (pocket in meats) {
      value += Object.values(pocketMeat(pocket))
        .map((x) => parseInt(x))
        .reduce((prev, cur) => prev + cur, 0);
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
    cliExecute(`cargo ${Math.trunc(argmax(pockets))}`);
  }
}

function comb(): void {
  if (!have($item`Beach Comb`)) return;
  const combs = 11 - get("_freeBeachWalksUsed");
  cliExecute(`combo ${combs}`);
}

function getAttuned(): void {
  if (
    holiday() === "Generic Summer Holiday" &&
    !have($effect`Eldritch Attunement`) &&
    estimatedTentacles() * get("garbo_valueOfFreeFight", 2000) > get("valueOfAdventure")
  ) {
    retrieveItem($item`water wings`);
    equip($item`water wings`);
    adv1($location`Generic Summer Holiday Swimming!`);
  }
}

function jickjar(): void {
  if (!have($item`psychoanalytic jar`)) return;
  if (get("_jickJarAvailable") === "unknown") visitUrl("showplayer.php?who=1");
  if (get("_jickJarAvailable") === "true") {
    visitUrl("showplayer.php?who=1&action=jung&whichperson=jick");
  }
}

function seaJelly(): void {
  if (myLevel() < 11) return;
  if (!have($familiar`space jellyfish`)) return;
  if (get("_seaJellyHarvested") === true) return;
  useFamiliar($familiar`space jellyfish`);
  visitUrl("place.php?whichplace=sea_oldman&action=oldman_oldman");
  visitUrl("place.php?whichplace=thesea&action=thesea_left2");
  runChoice(1);
}

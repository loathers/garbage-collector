import {
  buy,
  changeMcd,
  cliExecute,
  getCampground,
  getClanLounge,
  haveSkill,
  inebrietyLimit,
  itemAmount,
  mallPrice,
  maximize,
  myClass,
  myHp,
  myInebriety,
  myMaxhp,
  myPrimestat,
  myThrall,
  print,
  putCloset,
  restoreHp,
  retrieveItem,
  runChoice,
  toInt,
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
  $skill,
  $skills,
  $stat,
  $thrall,
  ChateauMantegna,
  ensureEffect,
  get,
  getSaleValue,
  have,
  property,
  SongBoom,
  SourceTerminal,
  uneffect,
  withProperty,
} from "libram";
import { meatFamiliar } from "./familiar";
import { baseMeat, coinmasterPrice, logMessage, tryFeast } from "./lib";
import { withStash } from "./clan";
import { estimatedTurns } from "./embezzler";
import { refreshLatte } from "./outfit";

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
  volcanoDailies();
  cheat();
  tomeSummons();
  gin();
  internetMemeShop();
  pickTea();
  refreshLatte();
  implement();

  if (myInebriety() > inebrietyLimit()) return;
  retrieveItem($item`Half a Purse`);
  retrieveItem($item`seal tooth`);
  retrieveItem($item`The Jokester's gun`);
  putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
  putCloset(itemAmount($item`4-d camera`), $item`4-d camera`);
  putCloset(itemAmount($item`unfinished ice sculpture`), $item`unfinished ice sculpture`);
}

export function postFreeFightDailySetup(): void {
  configureVykea();
  configureThrall();
}

function voterSetup(): void {
  if (have($item`"I Voted!" sticker`) || !(get("voteAlways") || get("_voteToday"))) return;
  visitUrl("place.php?whichplace=town_right&action=townright_vote");

  const votingMonsterPriority = [
    "terrible mutant",
    "angry ghost",
    "government bureaucrat",
    "annoyed snake",
    "slime blob",
  ];

  const initPriority = new Map<string, number>([
    ["Meat Drop: +30", 10],
    ["Item Drop: +15", 9],
    ["Familiar Experience: +2", 8],
    ["Adventures: +1", 7],
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
  const firstInit = bestVotes[0][0];
  const secondInit = bestVotes[1][0];

  visitUrl(
    `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
  );
}

function configureGear(): void {
  if (have($familiar`Cornbeefadon`) && !have($item`amulet coin`)) {
    useFamiliar($familiar`Cornbeefadon`);
    use($item`box of Familiar Jacks`);
  }

  if (have($item`portable pantogram`) && !have($item`pantogram pants`)) {
    retrieveItem($item`ten-leaf clover`);
    retrieveItem($item`porquoise`);
    retrieveItem($item`bubblin' crude`);
    const m = new Map([
      [$stat`Muscle`, 1],
      [$stat`Mysticality`, 2],
      [$stat`Moxie`, 3],
    ]).get(myPrimestat());
    visitUrl("inv_use.php?pwd&whichitem=9573");
    visitUrl(`choice.php?whichchoice=1270&pwd&option=1&m=${m}&e=5&s1=5789,1&s2=706,1&s3=24,1`);
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

function prepFamiliars(): void {
  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre, Bloody Nora`) {
      if (get("_roboDrinks").includes(drink.name)) continue;
      useFamiliar($familiar`Robortender`);
      if (itemAmount(drink) === 0) retrieveItem(1, drink);
      print(`Feeding robortender ${drink}.`, "blue");
      visitUrl(`inventory.php?action=robooze&which=1&whichitem=${toInt(drink)}`);
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
      if (have($item`moveable feast`))
        [
          ...$familiars`Pocket Professor, Frumious Bandersnatch, Pair of Stomping Boots`,
          meatFamiliar(),
        ].forEach(tryFeast);
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

  while (SourceTerminal.have() && SourceTerminal.getEnhanceUses() < 3) {
    cliExecute("terminal enhance meat.enh");
  }
  if (!get("_madTeaParty")) {
    retrieveItem($item`filthy knitted dread sack`);
    ensureEffect($effect`Down the Rabbit Hole`);
    cliExecute("hatter 22");
  }
}

function configureMisc(): void {
  if (SongBoom.songChangesLeft() > 0) SongBoom.setSong("Total Eclipse of Your Meat");
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  for (const [car, active] of [
    [$item`BittyCar MeatCar`, "meatcar"],
    [$item`BittyCar SoulCar`, "soulcar"],
  ] as [Item, string][]) {
    if (have(car) && get("_bittycar") !== active) {
      use(1, car);
      break;
    }
  }

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
    ]; //excluding 4 and 5 as per bean's suggestion
    const vykeaProfit = (level: number, cost: number) =>
      estimatedTurns() * baseMeat * 0.1 * level -
      5 * mallPrice($item`VYKEA rail`) +
      cost * mallPrice($item`VYKEA dowel`) +
      5 * mallPrice($item`VYKEA plank`) +
      1 * mallPrice($item`VYKEA hex key`);

    if (vykeas.some(([level, cost]) => vykeaProfit(level, cost) > 0)) {
      const level = vykeas.sort((a, b) => vykeaProfit(...b) - vykeaProfit(...a))[0][0];
      retrieveItem($item`VYKEA hex key`);
      cliExecute(`create level ${level} couch`);
    }
  }
}

function volcanoDailies(): void {
  if (!(get("hotAirportAlways") || get("_hotAirportToday"))) return;
  if (!get("_volcanoItemRedeemed")) checkVolcanoQuest();

  print("Getting my free volcoino!", "blue");
  if (!get("_infernoDiscoVisited")) {
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
function checkVolcanoQuest() {
  print("Checking volcano quest", "blue");
  visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
  const volcoinoValue = (1 / 3) * getSaleValue($item`one-day ticket to That 70s Volcano`);
  const volcanoProperties = new Map<Item, number>([
    [property.getItem("_volcanoItem1") || $item`none`, get("_volcanoItemCount1")],
    [property.getItem("_volcanoItem2") || $item`none`, get("_volcanoItemCount2")],
    [property.getItem("_volcanoItem3") || $item`none`, get("_volcanoItemCount3")],
  ]);
  const volcanoItems = [
    {
      item: $item`New Age healing crystal`,
      price: 5 * mallPrice($item`New Age healing crystal`),
      numberNeeded: 5,
    },
    {
      item: $item`SMOOCH bottlecap`,
      price: 1 * mallPrice($item`SMOOCH bottlecap`),
      numberNeeded: 1,
    },
    {
      item: $item`gooey lava globs`,
      price: 5 * mallPrice($item`gooey lava globs`),
      numberNeeded: 5,
    },
    {
      item: $item`smooth velvet bra`,
      price:
        3 * Math.min(mallPrice($item`smooth velvet bra`), 3 * mallPrice($item`unsmoothed velvet`)),
      numberNeeded:
        3 * (mallPrice($item`smooth velvet bra`) > 3 * mallPrice($item`unsmoothed velvet`) ? 3 : 1),
    },
    {
      item: $item`SMOOCH bracers`,
      price: 5 * mallPrice($item`superheated metal`),
      numberNeeded: 25,
    },
    ...(have($item`Clara's bell`) && !get("_claraBellUsed")
      ? [{ item: $item`fused fuse`, price: get("valueOfAdventure"), numberNeeded: 1 }]
      : []),
  ]
    .filter(
      (entry) =>
        Array.from(volcanoProperties.keys()).includes(entry.item) && entry.price < volcoinoValue
    )
    .sort((a, b) => b.price - a.price);

  if (volcanoItems.length) {
    const chosenItem = volcanoItems[0];
    if (chosenItem.item === $item`fused fuse`) {
      logMessage("Remember to nab a fused fuse with your stooper!");
    } else {
      const choice = 1 + Array.from(volcanoProperties.keys()).indexOf(chosenItem.item);
      withProperty("autoBuyPriceLimit", Math.round(volcoinoValue / chosenItem.numberNeeded), () =>
        retrieveItem(chosenItem.item, volcanoProperties.get(chosenItem.item) ?? 0)
      );
      visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
      print(`Alright buddy, turning in ${chosenItem.item.plural} for a volcoino!`, "red");
      runChoice(choice);
    }
  }
}

function cheat(): void {
  if (have($item`Deck of Every Card`)) {
    [
      getSaleValue($item`gift card`) >= getSaleValue($item`1952 Mickey Mantle card`)
        ? "Gift Card"
        : "1952 Mickey Mantle",
      "Island",
      "Ancestral Recall",
    ].forEach((card) => {
      if (get("_deckCardsDrawn") <= 10 && !get("_deckCardsSeen").includes(card))
        cliExecute(`cheat ${card}`);
    });
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
      if (getSaleValue(current) > getSaleValue(best)) {
        best = current;
      }
    }
    if (best !== $item`none`) {
      cliExecute(`try; create ${$skill`Summon Clip Art`.dailylimit} ${best}`);
    }
  }
}

function gin(): void {
  if (have($item`Time-Spinner`)) {
    if (
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
    if (!get<boolean>(property) && baconValue * coinmasterPrice(item) < getSaleValue(item)) {
      retrieveItem($item`BACON`, coinmasterPrice(item));
      buy($coinmaster`Internet Meme Shop`, 1, item);
    }
  }
}

const teas = $items`cuppa Activi tea, cuppa Alacri tea, cuppa Boo tea, cuppa Chari tea, cuppa Craft tea, cuppa Cruel tea, cuppa Dexteri tea, cuppa Feroci tea, cuppa Flamibili tea, cuppa Flexibili tea, cuppa Frost tea, cuppa Gill tea, cuppa Impregnabili tea, cuppa Improprie tea, cuppa Insani tea, cuppa Irritabili tea, cuppa Loyal tea, cuppa Mana tea, cuppa Mediocri tea, cuppa Monstrosi tea, cuppa Morbidi tea, cuppa Nas tea, cuppa Net tea, cuppa Neuroplastici tea, cuppa Obscuri tea, cuppa Physicali tea, cuppa Proprie tea, cuppa Royal tea, cuppa Serendipi tea, cuppa Sobrie tea, cuppa Toast tea, cuppa Twen tea, cuppa Uncertain tea, cuppa Vitali tea, cuppa Voraci tea, cuppa Wit tea, cuppa Yet tea`;
function pickTea(): void {
  if (!getCampground()["potted tea tree"] || get("_pottedTeaTreeUsed")) return;
  const bestTea = teas.sort((a, b) => getSaleValue(b) - getSaleValue(a))[0];
  const shakeVal = 3 * getSaleValue(...teas);
  const teaAction = shakeVal > getSaleValue(bestTea) ? "shake" : bestTea.name;
  cliExecute(`teatree ${teaAction}`);
}

function gaze(): void {
  if (!get("getawayCampsiteUnlocked")) return;
  if (!get("_campAwayCloudBuffs")) visitUrl("place.php?whichplace=campaway&action=campaway_sky");
  while (get("_campAwaySmileBuffs") < 3)
    visitUrl("place.php?whichplace=campaway&action=campaway_sky");
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

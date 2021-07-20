import {
  availableAmount,
  buy,
  changeMcd,
  cliExecute,
  equip,
  getCampground,
  getClanLounge,
  haveSkill,
  itemAmount,
  mallPrice,
  maximize,
  myAdventures,
  myClass,
  myPrimestat,
  myThrall,
  numericModifier,
  print,
  retrieveItem,
  runChoice,
  setAutoAttack,
  toInt,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  $stat,
  $thrall,
  adventureMacro,
  get,
  have,
  Macro,
  property,
  SongBoom,
  SourceTerminal,
} from "libram";
import { globalOptions } from ".";
import { horseradish } from "./diet";
import { meatFamiliar } from "./familiar";
import { ensureEffect, findRun, questStep, trueValue, tryFeast } from "./lib";
import { baseMeat } from "./mood";
import { freeFightOutfit } from "./outfit";
import { withStash } from "./clan";
import { withChoice, withChoices } from "libram/dist/property";

export function voterSetup(): void {
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

export function configureGear(): void {
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

export function latte(): void {
  const latte = $item`latte lovers member's mug`;
  if (have(latte) && questStep("questL02Larva") > -1 && questStep("questL11MacGuffin") > -1) {
    withChoice(1329, 2, () => visitUrl("main.php?latte=1", false));
    if (
      numericModifier(latte, "Familiar Weight") !== 5 ||
      numericModifier(latte, "Meat Drop") !== 40
    ) {
      if (!get("latteUnlocks").includes("cajun") && findRun()) {
        withChoices({ 923: 1, 924: 1 }, () => {
          while (!get("latteUnlocks").includes("cajun") && findRun()) {
            const runSource = findRun();
            if (!runSource) break;
            runSource.prepare();
            equip($slot`off-hand`, latte);
            adventureMacro($location`the black forest`, runSource.macro);
            horseradish();
          }
        });
      }
      if (!get("latteUnlocks").includes("rawhide") && findRun()) {
        withChoices({ 502: 2, 505: 2 }, () => {
          while (!get("latteUnlocks").includes("rawhide") && findRun()) {
            const runSource = findRun();
            if (!runSource) break;
            runSource.prepare();
            equip($slot`off-hand`, latte);
            adventureMacro($location`the spooky forest`, runSource.macro);
            horseradish();
          }
        });
      }
      if (!get("latteUnlocks").includes("carrot") && findRun()) {
        while (!get("latteUnlocks").includes("carrot") && findRun()) {
          const runSource = findRun();
          if (!runSource) break;
          runSource.prepare();
          equip($slot`off-hand`, latte);
          adventureMacro($location`the dire warren`, runSource.macro);
          horseradish();
        }
      }
      if (
        get("latteUnlocks").includes("cajun") &&
        get("latteUnlocks").includes("rawhide") &&
        get("_latteRefillsUsed") < 3
      ) {
        const latteIngredients = [
          "cajun",
          "rawhide",
          get("latteUnlocks").includes("carrot")
            ? "carrot"
            : myPrimestat() === $stat`muscle`
            ? "vanilla"
            : myPrimestat() === $stat`mysticality`
            ? "pumpkin spice"
            : "cinnamon",
        ].join(" ");
        cliExecute(`latte refill ${latteIngredients}`);
      }
    }
  }
}

export function prepFamiliars(): void {
  if (have($familiar`Robortender`)) {
    for (const drink of $items`Newark, drive-by shooting, Feliz Navidad, single entendre, bloody nora`) {
      if (get("_roboDrinks").includes(drink.name)) continue;
      useFamiliar($familiar`robortender`);
      if (itemAmount(drink) === 0) buy(1, drink, 150000);
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

export function horse(): void {
  visitUrl("place.php?whichplace=town_right");
  if (get("horseryAvailable") && get("_horsery") !== "dark horse") {
    cliExecute("horsery dark");
  }
}

export function dailyBuffs(): void {
  if (
    !get("_clanFortuneBuffUsed") &&
    have($item`Clan VIP lounge key`) &&
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

export function configureMisc(): void {
  if (SongBoom.songChangesLeft() > 0) SongBoom.setSong("Total Eclipse of Your Meat");
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  if (get("_VYKEACompanionLevel") === 0) {
    const expectedTurns =
      myAdventures() / 0.96 - (globalOptions.stopTurncount ? globalOptions.stopTurncount : 0);
    const vykeas: [number, number][] = [
      [1, 0],
      [2, 1],
      [3, 11],
    ]; //excluding 4 and 5 as per bean's suggestion
    const vykeaProfit = (level: number, cost: number) =>
      expectedTurns * baseMeat * 0.1 * level -
      5 * mallPrice($item`vykea rail`) +
      cost * mallPrice($item`vykea dowel`) +
      5 * mallPrice($item`vykea plank`) +
      1 * mallPrice($item`VYKEA hex key`);

    if (vykeas.some(([level, cost]) => vykeaProfit(level, cost) > 0)) {
      const level = vykeas.sort((a, b) => vykeaProfit(...b) - vykeaProfit(...a))[0][0];
      retrieveItem($item`VYKEA hex key`);
      cliExecute(`create level ${level} couch`);
    }
  }

  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Lasagmbie` &&
    haveSkill($skill`Bind Lasagmbie`)
  ) {
    useSkill($skill`Bind Lasagmbie`);
  }

  if (
    getClanLounge()["Olympic-sized Clan crate"] !== undefined &&
    !get("_olympicSwimmingPoolItemFound") &&
    have($item` Clan VIP Lounge key`)
  ) {
    cliExecute("swim item");
  }

  changeMcd(10);
}

export function volcanoDailies(): void {
  if (!(get("hotAirportAlways") || get("_hotAirportToday"))) return;
  if (!get("_volcanoItemRedeemed")) checkVolcanoQuest();

  print("Getting my free volcoino!", "blue");
  if (!get("_infernoDiscoVisited")) {
    $items` smooth velvet pocket square, smooth velvet socks, smooth velvet hat, smooth velvet shirt, smooth velvet hanky, smooth velvet pants`.forEach(
      (discoEquip) => {
        retrieveItem(discoEquip);
      }
    );
    maximize("disco style", false);
    visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
    runChoice(7);
  }

  if (have($skill`Unaccompanied Miner`) && get("_unaccompaniedMinerUsed") < 5) {
    cliExecute(`minevolcano.ash ${5 - get("_unaccompaniedMinerUsed")}`);
  }
}
function checkVolcanoQuest() {
  print("Checking volcano quest", "blue");
  visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
  const volcanoItems = [
    property.getItem("_volcanoItem1") || $item`none`,
    property.getItem("_volcanoItem2") || $item`none`,
    property.getItem("_volcanoItem3") || $item`none`,
  ];
  const volcanoWhatToDo: Map<Item, () => boolean> = new Map<Item, () => boolean>([
    [
      $item`new age healing crystal`,
      () => {
        if (availableAmount($item`new age healing crystal`) >= 5) return true;
        else {
          return (
            buy(
              5 - availableAmount($item`new age healing crystal`),
              $item`new age healing crystal`,
              1000
            ) ===
            5 - availableAmount($item`new age healing crystal`)
          );
        }
      },
    ],
    [
      $item`smooch bottlecap`,
      () => {
        if (availableAmount($item`smooch bottlecap`) > 0) return true;
        else return buy(1, $item`smooch bottlecap`, 5000) === 1;
      },
    ],
    [
      $item`gooey lava globs`,
      () => {
        if (availableAmount($item`gooey lava globs`) >= 5) {
          return true;
        } else {
          const toBuy = 5 - availableAmount($item`gooey lava globs`);
          return buy(toBuy, $item`gooey lava globs`, 5000) === toBuy;
        }
      },
    ],
    [
      $item`fused fuse`,
      () => {
        return have($item`clara's bell`);
      },
    ],
    [
      $item`smooth velvet bra`,
      () => {
        if (availableAmount($item`smooth velvet bra`) < 3) {
          cliExecute(
            `acquire ${(
              3 - availableAmount($item`smooth velvet bra`)
            ).toString()} smooth velvet bra`
          );
        }
        return availableAmount($item`smooth velvet bra`) >= 3;
      },
    ],
    [
      $item`smooch bracers`,
      () => {
        if (availableAmount($item`smooch bracers`) < 3) {
          cliExecute(
            `acquire ${(3 - availableAmount($item`smooch bracers`)).toString()} smooch bracers`
          );
        }
        return availableAmount($item`smooch bracers`) >= 3;
      },
    ],
  ]);
  for (const [volcanoItem, tryToGetIt] of volcanoWhatToDo.entries()) {
    if (volcanoItems.includes(volcanoItem)) {
      if (tryToGetIt()) {
        if (volcanoItem !== $item`fused fuse`) {
          visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
          print(`Alright buddy, turning in ${volcanoItem.plural} for a volcoino!`, "red");
          const choice =
            volcanoItems.indexOf(volcanoItem) === -1 ? 4 : 1 + volcanoItems.indexOf(volcanoItem);
          runChoice(choice);
        }
      }
    }
  }
}

export function cheat(): void {
  if (have($item`deck of every card`)) {
    ["1952 Mickey Mantle", "Island", "Ancestral Recall"].forEach((card) => {
      if (get("_deckCardsDrawn") <= 10 && !get("_deckCardsSeen").includes(card))
        cliExecute(`cheat ${card}`);
    });
  }
}

export function gin(): void {
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

const teas = $items`cuppa Activi tea, cuppa Alacri tea, cuppa Boo tea, cuppa Chari tea, cuppa Craft tea, cuppa Cruel tea, cuppa Dexteri tea, cuppa Feroci tea, cuppa Flamibili tea, cuppa Flexibili tea, cuppa Frost tea, cuppa Gill tea, cuppa Impregnabili tea, cuppa Improprie tea, cuppa Insani tea, cuppa Irritabili tea, cuppa Loyal tea, cuppa Mana tea, cuppa Mediocri tea, cuppa Monstrosi tea, cuppa Morbidi tea, cuppa Nas tea, cuppa Net tea, cuppa Neuroplastici tea, cuppa Obscuri tea, cuppa Physicali tea, cuppa Proprie tea, cuppa Royal tea, cuppa Serendipi Tea, cuppa Sobrie tea, cuppa Toast tea, cuppa Twen tea, cuppa Uncertain tea, cuppa Vitali tea, Cuppa Voraci tea, cuppa Wit tea, cuppa Yet tea`;
export function pickTea(): void {
  if (!getCampground()["potted tea tree"] || get("_pottedTeaTreeUsed")) return;
  const bestTea = teas.sort((a, b) => trueValue(b) - trueValue(a))[0];
  const shakeVal = 3 * trueValue(...teas);
  const teaAction = shakeVal > trueValue(bestTea) ? "shake" : bestTea.name;
  cliExecute(`teatree ${teaAction}`);
}

export function gaze(): void {
  if (!get("getawayCampsiteUnlocked")) return;
  if (!get("_campAwayCloudBuffs")) visitUrl("place.php?whichplace=campaway&action=campaway_sky");
  while (get("_campAwaySmileBuffs") < 3)
    visitUrl("place.php?whichplace=campaway&action=campaway_sky");
}
export function jellyfish(): void {
  if (
    !have($familiar`space jellyfish`) ||
    !(
      (have($skill`meteor lore`) && get("_macrometeoriteUses") < 10) ||
      (have($item`powerful glove`) && get("_powerfulGloveBatteryPowerUsed") < 91)
    )
  ) {
    return;
  }
  useFamiliar($familiar`space jellyfish`);
  setAutoAttack(0);
  freeFightOutfit();
  while (findRun(false) && have($skill`meteor lore`) && get("_macrometeoriteUses") < 10) {
    const runSource = findRun(false);
    if (!runSource) break;
    runSource.prepare();
    const jellyMacro = Macro.while_(
      "!pastround 28 && hasskill macrometeorite",
      Macro.skill("extract jelly").skill("macrometeorite")
    ).step(runSource.macro);
    adventureMacro($location`barf mountain`, jellyMacro);
  }
  if (have($item`powerful glove`)) {
    freeFightOutfit();
    equip($slot`acc2`, $item`powerful glove`);
    while (findRun(false) && get("_powerfulGloveBatteryPowerUsed") < 91) {
      const runSource = findRun(false);
      if (!runSource) break;
      runSource.prepare();
      const jellyMacro = Macro.while_(
        "!pastround 28 && hasskill CHEAT CODE: Replace Enemy",
        Macro.skill("extract jelly").skill("CHEAT CODE: Replace Enemy")
      ).step(runSource.macro);
      adventureMacro($location`barf mountain`, jellyMacro);
    }
  }
}

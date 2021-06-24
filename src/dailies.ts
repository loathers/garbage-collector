import {
  visitUrl,
  myPrimestat,
  useFamiliar,
  use,
  retrieveItem,
  runChoice,
  cliExecute,
  numericModifier,
  maximize,
  buy,
  itemAmount,
  print,
  toInt,
  getClanLounge,
  changeMcd,
  haveSkill,
  myClass,
  myThrall,
  useSkill,
  availableAmount,
  equip,
  adv1,
} from "kolmafia";
import {
  have,
  $item,
  get,
  $familiar,
  $stat,
  $effect,
  $location,
  $familiars,
  $items,
  SourceTerminal,
  $class,
  $skill,
  $thrall,
  SongBoom,
  property,
  $slot,
  adventureMacroAuto,
} from "libram";
import { meatFamiliar } from "./familiar";
import { questStep, ensureEffect, setChoice, tryFeast, tryToRun } from "./lib";
import { withStash } from "./stash";

export function voterSetup() {
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
    initPriority.get(get("_voteLocal1")) || get("_voteLocal1").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal2")) || get("_voteLocal2").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal3")) || get("_voteLocal3").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal4")) || get("_voteLocal4").indexOf("-") === -1 ? 1 : -1,
  ];

  const bestVotes = voteLocalPriorityArr.sort((a, b) => a - b);
  const firstPriority = bestVotes[0];
  const secondPriority = bestVotes[1];

  const firstInit = voteLocalPriorityArr.indexOf(firstPriority);
  const secondInit = voteLocalPriorityArr.indexOf(secondPriority);

  visitUrl(
    `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
  );
}

export function configureGear() {
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

export function latte() {
  const latte = $item`latte lovers member's mug`;
  if (have(latte) && questStep("questL02Larva") > -1 && questStep("questL11MacGuffin") > -1) {
    if (
      numericModifier(latte, "Familiar Weight") !== 5 ||
      numericModifier(latte, "Meat Drop") !== 40
    ) {
      if (!get("latteUnlocks").includes("cajun") && tryToRun()) {
        equip($slot`off-hand`, latte);
        setChoice(923, 1);
        setChoice(924, 1);
        while (!get("latteUnlocks").includes("cajun") && tryToRun()) {
          adv1($location`the black forest`, -1, "");
        }
      }
      if (!get("latteUnlocks").includes("rawhide") && tryToRun()) {
        equip($slot`off-hand`, latte);
        setChoice(502, 2);
        setChoice(505, 2);
        while (!get("latteUnlocks").includes("rawhide") && tryToRun()) {
          adv1($location`the spooky forest`, -1, "");
        }
      }
      if (!get("latteUnlocks").includes("carrot") && tryToRun()) {
        equip($slot`off-hand`, latte);
        setChoice(502, 2);
        setChoice(505, 2);
        while (!get("latteUnlocks").includes("carrot") && tryToRun()) {
          adv1($location`the dire warren`, -1, "");
        }
      }
      if (
        get("latteUnlocks").includes("cajun") &&
        get("latteUnlocks").includes("rawhide") &&
        get("_latteRefillsUsed") < 3
      ) {
        const latteIngredients =
          "cajun rawhide " +
          (get("latteUnlocks").includes("carrot")
            ? "carrot"
            : myPrimestat() === $stat`muscle`
            ? "vanilla"
            : myPrimestat() === $stat`mysticality`
            ? "pumpkin spice"
            : "cinnamon");
        cliExecute(`latte refill ${latteIngredients}`);
      }
    }
  }
}

export function prepFamiliars() {
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
        [...$familiars`Pocket Professor, Frumious Bandersnatch`, meatFamiliar()].forEach(tryFeast);
    });
  }
}

export function horse() {
  visitUrl("place.php?whichplace=town_right");
  if (get("horseryAvailable") && get("_horsery") !== "dark horse") {
    cliExecute("horsery dark");
  }
}

export function dailyBuffs() {
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
    ensureEffect($effect`Down the Rabbit Hole`);
    cliExecute("hatter 22");
  }
}

export function configureMisc() {
  SongBoom.setSong("Total Eclipse of Your Meat");
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  if (get("_VYKEACompanionLevel") === 0) {
    retrieveItem($item`VYKEA hex key`);
    cliExecute("create level 3 couch");
  }

  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Lasagmbie` &&
    haveSkill($skill`Bind Lasagmbie`)
  ) {
    useSkill($skill`Bind Lasagmbie`);
  }

  changeMcd(10);
}

export function volcanoDailies() {
  if (!(get("hotAirportAlways") || get("_hotAirportToday"))) return;
  if (!get("_volcanoItemRedeemed")) checkVolcanoQuest();

  print("Getting my free volcoino!", "blue");
  if (!get("_infernoDiscoVisited")) {
    maximize("disco style", false);
    visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
    runChoice(7);
  }

  if (get("_unaccompaniedMinerUsed") < 5) {
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
export function cheat() {
  if (have($item`deck of every card`)) {
    ["1952 Mickey Mantle", "Island", "Ancestral Recall"].forEach((card) => {
      if (get("_deckCardsDrawn") <= 10 && !get("_deckCardsSeen").includes(card))
        cliExecute(`cheat ${card}`);
    });
  }
}

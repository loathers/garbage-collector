import {
  useFamiliar,
  use,
  retrieveItem,
  myPrimestat,
  visitUrl,
  runChoice,
  cliExecute,
  numericModifier,
  haveFamiliar,
  maximize,
  adv1,
  itemAmount,
  buy,
  print,
  toInt,
  myClass,
  myThrall,
  haveSkill,
  useSkill,
  getClanLounge,
  changeMcd,
  putCloset,
  availableAmount,
} from "kolmafia";
import {
  have,
  $familiar,
  $item,
  $stat,
  get,
  SongBoom,
  SourceTerminal,
  $skill,
  $effect,
  Bandersnatch,
  Macro,
  $location,
  $items,
  $familiars,
  $class,
  $thrall,
  property,
} from "libram";
import { meatFamiliar } from "./familiar";
import { voterSetup, questStep, ensureEffect, setChoice } from "./lib";
import { withStash } from "./stash";

function tryFeast(familiar: Familiar) {
  if (have(familiar)) {
    useFamiliar(familiar);
    use($item`moveable feast`);
  }
}

export function dailySetup() {
  voterSetup();
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

  SongBoom.setSong("Total Eclipse of Your Meat");
  if (SourceTerminal.have()) {
    SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);
    SourceTerminal.enquiry($effect`familiar.enq`);
  }

  const latte = $item`latte lovers member's mug`;
  if (have(latte) && questStep("questL02Larva") > -1 && questStep("questL11MacGuffin") > -1) {
    if (
      numericModifier(latte, "Familiar Weight") !== 5 ||
      numericModifier(latte, "Meat Drop") !== 40
    ) {
      if (
        !get("latteUnlocks").includes("cajun") &&
        (haveFamiliar($familiar`frumious bandersnatch`) ||
          haveFamiliar($familiar`pair of stomping boots`)) &&
        Bandersnatch.getRemainingRunaways() > 0
      ) {
        const runFam = haveFamiliar($familiar`pair of stomping boots`)
          ? $familiar`pair of stomping boots`
          : $familiar`frumious bandersnatch`;
        useFamiliar(runFam);
        maximize("familiar weight, +equip latte lovers member's mug", false);
        if (runFam === $familiar`frumious bandersnatch`) ensureEffect($effect`ode to booze`);
        Macro.step("runaway").setAutoAttack();
        setChoice(923, 1);
        setChoice(924, 1);
        while (!get("latteUnlocks").includes("cajun") && Bandersnatch.getRemainingRunaways() > 0) {
          adv1($location`the black forest`, -1, "");
        }
      }
      if (
        !get("latteUnlocks").includes("rawhide") &&
        (haveFamiliar($familiar`frumious bandersnatch`) ||
          haveFamiliar($familiar`pair of stomping boots`)) &&
        Bandersnatch.getRemainingRunaways() > 0
      ) {
        const runFam = haveFamiliar($familiar`pair of stomping boots`)
          ? $familiar`pair of stomping boots`
          : $familiar`frumious bandersnatch`;
        useFamiliar(runFam);
        maximize("familiar weight, +equip latte lovers member's mug", false);
        if (runFam === $familiar`frumious bandersnatch`) ensureEffect($effect`ode to booze`);
        Macro.step("runaway").setAutoAttack();
        setChoice(502, 2);
        setChoice(505, 2);
        while (
          !get("latteUnlocks").includes("rawhide") &&
          Bandersnatch.getRemainingRunaways() > 0
        ) {
          adv1($location`the spooky forest`, -1, "");
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

  if (get("_VYKEACompanionLevel") === 0) {
    retrieveItem($item`VYKEA hex key`);
    cliExecute("create level 3 couch");
  }

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

  if (
    myClass() === $class`Pastamancer` &&
    myThrall() !== $thrall`Lasagmbie` &&
    haveSkill($skill`Bind Lasagmbie`)
  ) {
    useSkill($skill`Bind Lasagmbie`);
  }

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

  if (get("horseryAvailable") && get("_horsery") !== "dark horse") {
    cliExecute("horsery dark");
  }

  while (SourceTerminal.have() && SourceTerminal.getEnhanceUses() < 3) {
    cliExecute("terminal enhance meat.enh");
  }
  if (!get("_madTeaParty")) {
    ensureEffect($effect`Down the Rabbit Hole`);
    cliExecute("hatter 22");
  }

  changeMcd(10);

  retrieveItem($item`Half a Purse`);
  volcanoDailies();

  putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`);
  putCloset(itemAmount($item`sand dollar`), $item`sand dollar`);
}

function volcanoDailies() {
  if (!(get("hotAirportAlways") || get("_hotAirportToday"))) return;
  if (!get("_volcanoItemRedeemed")) {
    const volcanoChoice = checkVolcanoQuest();
    if (volcanoChoice !== $item`none` && volcanoChoice !== $item`fused fuse`) {
      const volcanoItems: Map<Item, number> = new Map<Item, number>([
        [property.getItem("_volcanoItem1") || $item`none`, 1],
        [property.getItem("_volcanoItem2") || $item`none`, 2],
        [property.getItem("_volcanoItem3") || $item`none`, 3],
      ]);
      const choice = volcanoItems.get(volcanoChoice) || 4;
      visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
      runChoice(choice);
    }
  }

  print("Getting my free volcoino!", "blue");
  if (!get("_infernoDiscoVisited")) {
    maximize("disco style", false);
    visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
    runChoice(7);
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
          return (
            buy(5 - availableAmount($item`gooey lava globs`), $item`gooey lava globs`, 5000) ===
            5 - availableAmount($item`gooey lava globs`)
          );
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
        print(
          `Alright garbo user, you're going to do the volcano quest with a ${volcanoItem.name} or whatever`,
          "blue"
        );
        return volcanoItem;
      }
    }
  }
  return $item`none`;
}

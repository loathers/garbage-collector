import { Task } from "grimoire-kolmafia";
import {
  adv1,
  canadiaAvailable,
  canEquip,
  changeMcd,
  cliExecute,
  currentMcd,
  gamedayToInt,
  getClanLounge,
  gnomadsAvailable,
  holiday,
  inebrietyLimit,
  Item,
  itemAmount,
  mallPrice,
  myClass,
  myDaycount,
  myHash,
  myInebriety,
  myPath,
  myPrimestat,
  print,
  putCloset,
  retrieveItem,
  retrievePrice,
  runChoice,
  toSlot,
  toUrl,
  use,
  visitUrl,
  votingBoothInitiatives,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $slot,
  BeachComb,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  maxBy,
  Pantogram,
  set,
  SongBoom,
  SourceTerminal,
} from "libram";
import { acquire } from "../acquire";
import { withStash } from "../clan";
import { globalOptions } from "../config";
import { embezzlerCount } from "../embezzler";
import { meatFamiliar } from "../familiar";
import { estimatedTentacles } from "../fights";
import { baseMeat, HIGHLIGHT } from "../lib";
import { garboValue } from "../session";
import { digitizedMonstersRemaining, estimatedGarboTurns } from "../turns";

const closetItems = $items`4-d camera, sand dollar, unfinished ice sculpture`;
const retrieveItems = $items`Half a Purse, seal tooth, The Jokester's gun`;

let latteRefreshed = false;
let horseryRefreshed = false;
let attemptCompletingBarfQuest = true;
let snojoConfigured = false;

function voterSetup(): void {
  const initPriority: Map<string, number> = new Map([
    [
      "Meat Drop: +30",
      0.3 *
        ((baseMeat + 750) * embezzlerCount() +
          baseMeat * (estimatedGarboTurns() - embezzlerCount())),
    ],
    [
      "Item Drop: +15",
      0.15 *
        (4 * 100 * 0.3 * embezzlerCount() +
          3 * 200 * 0.15 * (estimatedGarboTurns() - embezzlerCount())),
    ],
    ["Adventures: +1", globalOptions.ascend ? 0 : get("valueOfAdventure")],
    ["Familiar Experience: +2", 8],
    ["Monster Level: +10", 5],
    [`${myPrimestat()} Percent: +25`, 3],
    [`Experience (${myPrimestat()}): +4`, 2],
    ["Meat Drop: -30", -2],
    ["Item Drop: -15", -2],
    ["Familiar Experience: -2", -2],
  ]);

  if (!get("voteAlways") && !get("_voteToday")) {
    const availableInitiatives: Map<string, number> = new Map(
      Object.keys(votingBoothInitiatives(myClass(), myPath(), myDaycount())).map((init) => {
        const val = initPriority.get(init) ?? 0;
        return [init, val];
      })
    );

    const initiativeValue = 2 * Math.max(...availableInitiatives.values());

    const fightValue = 3 * globalOptions.prefs.valueOfFreeFight;
    const ballotValue = initiativeValue + fightValue;
    if (
      ballotValue > mallPrice($item`absentee voter ballot`) &&
      acquire(1, $item`absentee voter ballot`, ballotValue, false)
    ) {
      visitUrl(`inv_use.php?which=3&whichitem=9991&pwd=${myHash()}`);
    } else return;
  }

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
  ] as const;

  const init = maxBy(voteLocalPriorityArr, 1)[0];

  visitUrl(`choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${init}&local[]=${init}`);
}

function pantogram(): void {
  if (!Pantogram.have() || Pantogram.havePants()) return;
  let pantogramValue: number;
  if (have($item`repaid diaper`) && have($familiar`Robortender`)) {
    const expectedBarfTurns = globalOptions.nobarf
      ? 0
      : estimatedGarboTurns() - digitizedMonstersRemaining() - embezzlerCount();
    pantogramValue = 100 * expectedBarfTurns;
  } else {
    const lepMult = findLeprechaunMultiplier(meatFamiliar());
    const lepBonus = 2 * lepMult + Math.sqrt(lepMult);

    const totalPantsValue = (pants: Item) =>
      getModifier("Meat Drop", pants) + getModifier("Familiar Weight", pants) * lepBonus;

    const alternativePants = Item.all()
      .filter((item) => have(item) && toSlot(item) === $slot`pants`)
      .map((pants) => totalPantsValue(pants));
    const bestPantsValue = Math.max(0, ...alternativePants);

    pantogramValue =
      (100 + 0.6 * baseMeat - (bestPantsValue * baseMeat) / 100) * estimatedGarboTurns();
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
  Pantogram.makePants(
    myPrimestat().toString(),
    "Sleaze Resistance: 2",
    "MP Regen Max: 15",
    "Drops Items: true",
    "Meat Drop: 60"
  );
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

export function completeBarfQuest(): void {
  if (!attemptCompletingBarfQuest) return;

  if (get("questEStGiveMeFuel") === "started") {
    const globuleCosts = retrievePrice($item`toxic globule`, 20);
    if (globuleCosts < 3 * garboValue($item`FunFunds™`)) {
      print(
        `The cost of 20 toxic globules (${globuleCosts}) is less than the profits expected from 3 FunFunds™ (${
          3 * garboValue($item`FunFunds™`)
        }). Proceeding to acquire toxic globules.`,
        "green"
      );
      attemptCompletingBarfQuest =
        acquire(20, $item`toxic globule`, (1.5 * globuleCosts) / 20, false) >= 20;
    } else {
      attemptCompletingBarfQuest = false;
      print(
        `The cost of 20 toxic globules (${globuleCosts}) exceeds the profits expected from 3 FunFunds™ (${
          3 * garboValue($item`FunFunds™`)
        }). Consider farming some globules yourself.`,
        "red"
      );
    }
  }
  if (get("questEStSuperLuber") === "step2" || get("questEStGiveMeFuel") === "step1") {
    print("Completing Barf Quest", "blue");
    visitUrl("place.php?whichplace=airport_stench&action=airport3_kiosk");
    visitUrl("choice.php?whichchoice=1066&pwd&option=3");
  }
  return;
}

function checkBarfQuest(): void {
  const page = visitUrl("place.php?whichplace=airport_stench&action=airport3_kiosk");

  // If we are on an assignment, try completing and then return after
  if (page.includes("Current Assignment")) {
    return completeBarfQuest();
  }

  // If there are no available nor current assignments, then we are done for the day
  if (!page.includes("Available Assignments")) {
    // Reset prefs to unstarted just in case (since they do not automatically reset on rollover)
    set("questEStSuperLuber", "unstarted");
    set("questEStGiveMeFuel", "unstarted");
    return;
  }

  const targets = globalOptions.nobarf
    ? ["Electrical Maintenance"]
    : ["Track Maintenance", "Electrical Maintenance"]; // In decreasing order of priority

  // Page includes Track/Electrical Maintenance and we aren't on an assignment -> choose assignment
  const quests = [
    page.match("(width=250>)(.*?)(value=1>)")?.[2]?.match("(<b>)(.*?)(</b>)")?.[2] ?? "",
    page.match("(value=1>)(.*?)(value=2>)")?.[2]?.match("(<b>)(.*?)(</b>)")?.[2] ?? "",
  ];
  print("Barf Quests Available:", "blue");
  quests.forEach((quest) => print(quest, "blue"));

  // If page does not include Track/Electrical Maintenance quest, return
  if (!targets.some((target) => page.includes(target))) {
    print("No suitable Barf Quests available.", "red");
    return;
  }

  for (const target of targets) {
    for (const [idx, qst] of quests.entries()) {
      if (target === qst) {
        print(`Accepting Barf Quest: ${qst}`, "blue");
        visitUrl(`choice.php?whichchoice=1066&pwd&option=${idx + 1}`);
        return completeBarfQuest();
      }
    }
  }
  return;
}

export function configureSnojo(): void {
  if (snojoConfigured) return;

  // if we're ascending, pick whichever consumable has the best price
  // each consumable takes 7 turns and we can spend 10 per day
  const options = new Map<number, number>([
    [(10 / 7) * garboValue($item`ancient medicinal herbs`), 1],
    [(10 / 7) * garboValue($item`ice rice`), 2],
    [(10 / 7) * garboValue($item`iced plum wine`), 3],
  ]);
  // otherwise, assume we're in for at least five days and consider scrolls
  // we get 7 consumables in 5 days, plus a scroll
  if (!globalOptions.ascend) {
    if (get("snojoMuscleWins") < 50) {
      options.set(
        (7 * garboValue($item`ancient medicinal herbs`) +
          garboValue($item`training scroll:  Shattering Punch`)) /
          5,
        1
      );
    }
    if (get("snojoMysticalityWins") < 50) {
      options.set(
        (7 * garboValue($item`ice rice`) + garboValue($item`training scroll:  Snokebomb`)) / 5,
        2
      );
    }
    if (get("snojoMoxieWins") < 50) {
      options.set(
        (7 * garboValue($item`iced plum wine`) +
          garboValue($item`training scroll:  Shivering Monkey Technique`)) /
          5,
        3
      );
    }
  }

  const bestProfit = Math.max(...options.keys());
  const option = options.get(bestProfit);
  if (option) {
    visitUrl("place.php?whichplace=snojo&action=snojo_controller");
    runChoice(option);
    snojoConfigured = true;
  }
}

export const DailyTasks: Task[] = [
  {
    name: "Refresh Latte",
    ready: () => have($item`latte lovers member's mug`),
    completed: () => latteRefreshed,
    do: (): void => {
      visitUrl("main.php?latte=1", false);
      latteRefreshed = true;
    },
  },
  {
    name: "Configure I Voted! Sticker",
    ready: () => true,
    completed: () => have($item`"I Voted!" sticker`),
    do: () => voterSetup(),
  },
  {
    name: "Configure Pantogram",
    ready: () => Pantogram.have(),
    completed: () => Pantogram.havePants(),
    do: () => pantogram(),
  },
  {
    name: "Configure Fourth of May Cosplay Saber",
    ready: () => have($item`Fourth of May Cosplay Saber`),
    completed: () => get("_saberMod") !== 0,
    do: (): void => {
      visitUrl("main.php?action=may4");
      // Familiar weight
      runChoice(4);
    },
  },
  {
    name: "Bastille Battalion",
    ready: () => have($item`Bastille Battalion control rig`),
    completed: () => get("_bastilleGames") !== 0,
    do: () => cliExecute("bastille myst brutalist gesture"),
  },
  {
    name: "11th Precinct",
    ready: () => get("hasDetectiveSchool"),
    completed: () => get("_detectiveCasesCompleted") >= 3,
    do: () => cliExecute("Detective Solver.ash"),
  },
  {
    name: "Getaway Campsite Buffs",
    ready: () => get("getawayCampsiteUnlocked"),
    completed: () => get("_campAwayCloudBuffs") + get("_campAwaySmileBuffs") === 4,
    do: () => visitUrl("place.php?whichplace=campaway&action=campaway_sky"),
    limit: { soft: 4 },
  },
  {
    name: "Verify Horsery",
    ready: () => true,
    completed: () => horseryRefreshed || get("horseryAvailable"),
    do: (): void => {
      visitUrl("place.php?whichplace=town_right");
      horseryRefreshed = true;
    },
  },
  {
    name: "Prepare Horsery",
    after: ["Verify Horsery"],
    ready: () => get("horseryAvailable"),
    completed: () => get("_horsery") === "dark horse",
    do: () => cliExecute("horsery dark"),
  },
  {
    name: "Beach Comb One-Day",
    ready: () => have($item`piece of driftwood`) && !have($item`Beach Comb`),
    completed: () => have($item`driftwood beach comb`),
    do: () => use($item`piece of driftwood`),
  },
  {
    name: "Beach Comb Buff",
    ready: () => have($item`Beach Comb`) || have($item`driftwood beach comb`),
    completed: () =>
      get("_beachHeadsUsed").split(",").includes("10") || get("_freeBeachWalksUsed") >= 11,
    do: () => BeachComb.tryHead($effect`Do I Know You From Somewhere?`),
  },
  {
    name: "Beach Comb Free Walks",
    ready: () => have($item`Beach Comb`) || have($item`driftwood beach comb`),
    completed: () => get("_freeBeachWalksUsed") >= 11,
    do: () => cliExecute(`combo ${11 - get("_freeBeachWalksUsed")}`),
  },
  {
    name: "Clan Fortune Buff",
    ready: () =>
      have($item`Clan VIP Lounge key`) && getClanLounge()["Clan Carnival Game"] !== undefined,
    completed: () => get("_clanFortuneBuffUsed"),
    do: () => cliExecute("fortune buff meat"),
  },
  {
    name: "Summon Demon",
    ready: () => !!get("demonName2") && get("questL11Manor") === "finished",
    completed: () => get("demonSummoned"),
    do: () => cliExecute("summon Preternatural Greed"),
  },
  {
    name: "Source Terminal Enhance",
    ready: () => SourceTerminal.have(),
    completed: () => SourceTerminal.enhanceUsesRemaining() === 0,
    do: () => SourceTerminal.enhance($effect`meat.enh`),
    limit: { soft: 3 },
  },
  {
    name: "Source Terminal Enquire",
    ready: () => SourceTerminal.have(),
    completed: () => get("sourceTerminalEnquiry") === "familiar.enq",
    do: () => SourceTerminal.enquiry($effect`familiar.enq`),
  },
  {
    name: "Mad Tea Party Buff",
    ready: () => !get("_madTeaParty"),
    completed: () => get("_madTeaParty"),
    do: () => cliExecute("hatter 22"),
    acquire: [{ item: $item`filthy knitted dread sack` }],
    effects: [$effect`Down the Rabbit Hole`],
  },
  {
    name: "SongBoom Buff",
    ready: () =>
      SongBoom.have() && SongBoom.songChangesLeft() > 0 && myInebriety() <= inebrietyLimit(),
    completed: () => SongBoom.song() === "Total Eclipse of Your Meat",
    do: () => SongBoom.setSong("Total Eclipse of Your Meat"),
  },
  {
    name: "SongBoom Buff (Drunk)",
    ready: () =>
      SongBoom.have() && SongBoom.songChangesLeft() > 0 && myInebriety() > inebrietyLimit(),
    completed: () => SongBoom.song() === "Food Vibrations",
    do: () => SongBoom.setSong("Food Vibrations"),
  },
  {
    name: "Set Mind Control Device",
    ready: () => canadiaAvailable() || gnomadsAvailable() || have($item`detuned radio`),
    completed: () => currentMcd() === (canadiaAvailable() ? 11 : 10),
    do: () => changeMcd(canadiaAvailable() ? 11 : 10),
  },
  {
    name: "Implement [glitch season reward name]",
    ready: () => have($item`[glitch season reward name]`),
    completed: () => get("_glitchItemImplemented"),
    do: () => use($item`[glitch season reward name]`),
  },
  {
    name: "Use BittyCar MeatCart",
    ready: () => get("_bittycar") !== "meatcar",
    completed: () => get("_bittycar") === "meatcar",
    do: () => withStash([$item`BittyCar MeatCar`], () => use(1, $item`BittyCar MeatCar`)),
  },
  {
    name: "Use BittyCar SoulCar",
    ready: () => get("_bittycar") !== "meatcar" && get("_bittycar") !== "soulcar",
    completed: () => get("_bittycar") === "soulcar",
    do: () => withStash([$item`BittyCar SoulCar`], () => use(1, $item`BittyCar SoulCar`)),
  },
  {
    name: "Holiday Eldritch Attunement",
    ready: () =>
      holiday() === "Generic Summer Holiday" &&
      !have($effect`Eldritch Attunement`) &&
      estimatedTentacles() * globalOptions.prefs.valueOfFreeFight > get("valueOfAdventure"),
    completed: () => have($effect`Eldritch Attunement`),
    do: () => adv1($location`Generic Summer Holiday Swimming!`),
    acquire: [{ item: $item`water wings` }],
    outfit: () =>
      myInebriety() > inebrietyLimit() &&
      have($item`Drunkula's wineglass`) &&
      canEquip($item`Drunkula's wineglass`)
        ? { offhand: $item`Drunkula's wineglass`, acc1: $item`water wings` }
        : { acc1: $item`water wings` },
  },
  {
    name: "Check Neverending Party Quest",
    ready: () =>
      (get("neverendingPartyAlways") || get("_neverendingPartyToday")) &&
      get("_questPartyFair") === "unstarted",
    completed: () => get("_questPartyFair") !== "unstarted",
    do: () => nepQuest(),
    outfit: () =>
      myInebriety() > inebrietyLimit() &&
      have($item`Drunkula's wineglass`) &&
      canEquip($item`Drunkula's wineglass`)
        ? { offhand: $item`Drunkula's wineglass` }
        : {},
  },
  {
    name: "Check Barf Mountain Quest",
    ready: () => get("stenchAirportAlways") || get("_stenchAirportToday"),
    completed: () => !attemptCompletingBarfQuest,
    do: () => checkBarfQuest(),
  },
  {
    name: "Configure Snojo",
    ready: () => get("snojoAvailable") && get("_snojoFreeFights") < 10,
    completed: () => snojoConfigured,
    do: () => configureSnojo(),
  },
  // Final tasks
  {
    name: "Closet Items",
    ready: () => closetItems.some((item) => itemAmount(item)),
    completed: () => closetItems.every((item) => itemAmount(item) === 0),
    do: () => closetItems.forEach((item) => putCloset(itemAmount(item), item)),
  },
  {
    name: "Closet Hobo Nickels",
    ready: () => have($familiar`Hobo Monkey`) || have($item`hobo nickel`, 1000),
    completed: () => itemAmount($item`hobo nickel`) === 0,
    do: () => putCloset(itemAmount($item`hobo nickel`), $item`hobo nickel`),
  },
  {
    name: "Retrieve Items",
    ready: () => retrieveItems.some((item) => itemAmount(item) === 0),
    completed: () => retrieveItems.every((item) => itemAmount(item) > 0),
    do: () => retrieveItems.forEach((item) => retrieveItem(item)),
  },
];

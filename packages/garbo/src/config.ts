import { Args } from "grimoire-kolmafia";
import { Item, print } from "kolmafia";
import { $item, $items, $monster } from "libram";

const workshedAliases = [
  { item: $item`model train set`, aliases: ["trainrealm"] },
  {
    item: $item`Asdon Martin keyfob (on ring)`,
    aliases: ["breadcar", "car", "aston"],
  },
  { item: $item`Little Geneticist DNA-Splicing Lab`, aliases: ["dnalab"] },
];
const unaliasedSheds = $items`TakerSpace letter of Marque, cold medicine cabinet, diabolic pizza cube, portable Mayo Clinic, spinning wheel, warbear auto-anvil, warbear chemistry lab, warbear high-efficiency still, warbear induction oven, warbear jackhammer drill press, warbear LP-ROM burner`;
const allWorkshedAliases = [
  ...workshedAliases.map(({ item, aliases }) => {
    return { item: item, aliases: [...aliases, item.name.toLowerCase()] };
  }),
  ...unaliasedSheds.map((item) => {
    return { item: item, aliases: [item.name.toLowerCase()] };
  }),
];

function toInitials(s: string): string {
  const initials = s
    .split(" ")
    .map((term) => term[0])
    .join("");
  return initials.length >= 3 ? initials : "";
}

function stripString(s: string): string {
  if (s.includes(" ")) return stripString(s.replace(" ", ""));
  else if (s.includes("-")) return stripString(s.replace("-", ""));
  return s;
}

function stringToWorkshedItem(s: string): Item | null {
  // An empty string is a subset of every string and will match all the worksheds
  // So we explicitly handle this case here
  if (s === "") return null;

  const lowerCaseWorkshed = s.toLowerCase();
  const strippedWorkshed = stripString(lowerCaseWorkshed);
  const validWorksheds = allWorkshedAliases.filter(
    ({ item, aliases }) =>
      toInitials(item.name.toLowerCase()) === lowerCaseWorkshed ||
      item.name.toLowerCase().includes(lowerCaseWorkshed) ||
      stripString(item.name.toLowerCase()).includes(strippedWorkshed) ||
      aliases.some((alias) => alias === lowerCaseWorkshed),
  );

  // grimoire catches the errors and throws its own errors
  // so throw new Error(text) would result in the text not getting printed.
  if (validWorksheds.length > 1) {
    print(`Invalid Workshed: ${s} matches multiple worksheds! Matched:`, "red");
    validWorksheds.forEach(({ item }) => print(`${item}`, "red"));
    throw new Error();
  } else if (validWorksheds.length === 0) {
    print(`Invalid Workshed: ${s} does not match any worksheds!`, "red");
    throw new Error();
  }

  return validWorksheds[0].item;
}

export const globalOptions = Args.create(
  "garbo",
  'This script is an automated turn-burning script for the Kingdom of Loathing that spends a day\'s resources and adventures on farming\n\
You can use multiple options in conjunction, e.g. "garbo nobarf ascend"',
  {
    ascend: Args.flag({
      setting: "",
      help: "operate under the assumption that you're ascending after running it, rather than experiencing rollover. It will use borrowed time, it won't charge stinky cheese items, etc.",
      default: false,
    }),
    loginvalidwishes: Args.flag({
      setting: "",
      help: "Logs any invalid wishes at the end of the day.",
      hidden: true,
    }),
    nobarf: Args.flag({
      setting: "",
      help: "do beginning of the day setup, copy target monster, and various daily flags, but will terminate before normal Barf Mountain turns. May close NEP for the day.",
      default: false,
    }),
    nodiet: Args.flag({
      setting: "",
      help: "skip eating and drinking anything as a part of its run (including pantsgiving).",
      default: false,
    }),
    quick: Args.flag({
      setting: "",
      help: "garbo will sacrifice some optimal behaviors to run quicker. Estimated and actual profits may be less accurate in this mode. Sets quickcombat and quickgear.",
      default: false,
    }),
    quickcombat: Args.flag({
      setting: "",
      help: "garbo will stasis in combat for 5 turns instead of 20, trading some potential profits for a faster run speed.",
      default: false,
    }),
    quickgear: Args.flag({
      setting: "",
      help: "garbo will limit maximizer combinations and exclude some synergistic items, trading correctness for speed.",
      default: false,
    }),
    returnstash: Args.flag({
      setting: "",
      help: "return all items to your stash clan's stash, then quit",
      default: false,
    }),
    simdiet: Args.flag({
      setting: "",
      help: "print out what it computes as an optimal diet and then exit.",
      default: false,
    }),
    turns: Args.number({
      setting: "",
      help: 'terminate after the specified number of turns, e.g. "garbo 200" or "garbo turns=200" will terminate after 200 turns are spent. Negative inputs will cause garbo to terminate when the specified number of turns remain.',
      default: 0,
    }),
    target: Args.monster({
      setting: "garbo_copyTarget",
      help: "The monster to use all copies on",
      default: $monster.none,
    }),
    usekarma: Args.flag({
      setting: "",
      help: "Use instant karma as part of diet",
      default: false,
    }),
    halt: Args.string({
      setting: "",
      help: "Halt after a grimoire task is run that contains this sub-string. If a task is skipped this will not trigger.",
    }),
    history: Args.flag({
      setting: "",
      help: "Write grimoire task history to garbo_history_<date>.csv",
      default: false,
    }),
    version: Args.flag({
      setting: "",
      help: "Print the current version and exit.",
    }),
    workshed: Args.custom<Item | null>(
      {
        default: null,
        help: "Intelligently switch into the workshed whose item name you give us. Also accepts substrings of the item name (e.g. dna, trainset), certain shorthand aliases (e.g. car) and initials of length >= 3 (e.g. cmc).",
        options: [
          ...allWorkshedAliases.map(
            ({ item, aliases }) =>
              [
                item,
                `${[...aliases, toInitials(item.name.toLowerCase())]
                  .filter((alias) => alias !== "")
                  .join(", ")}`,
              ] as [Item, string],
          ),
          [null, "leave this field blank"],
        ],
      },
      stringToWorkshedItem,
      "Item",
    ),
    prefs: Args.group(
      "You can manually set the properties below, but it's recommended that you use the relay interface (dropdown menu at the top left in the browser)",
      {
        valueOfAdventure: Args.number({
          setting: "valueOfAdventure",
          help: "This is a native mafia property, garbo will make purchasing decisions based on this value. Recommended to be at least 3501.",
        }),
        valueOfFreeFight: Args.number({
          setting: "garbo_valueOfFreeFight",
          help: "Set to whatever you estimate the value of a free fight/run to be for you. (Default 2000)",
          default: 2000,
        }),
        valueOfPvPFight: Args.number({
          setting: "garbo_valueOfPvPFight",
          help: "Set to whatever you estimate the value of a PvP fight to be for you. (Default 0)",
          default: 0,
        }),
        yachtzeechain: Args.flag({
          setting: "garbo_yachtzeechain",
          help: "only diets after free fights, and attempts to estimate if Yachtzee! chaining is profitable for you - if so, it consumes a specific diet which uses ~0-36 spleen;\
      if not it automatically continues with the regular diet. Requires Spring Break Beach access (it will not grab a one-day pass for you, but will make an attempt if one is used).\
      Sweet Synthesis is strongly recommended, as with access to other meat% buffs from Source Terminal, Fortune Teller, KGB and the summoning chamber. Having access to a PYEC (on hand or in the clan stash) is a plus.",
          default: false,
        }),
        candydish: Args.flag({
          setting: "garbo_candydish",
          help: "*DANGEROUS* garbo will consider using porcelain candy dishes. This could result in potentially destructive behavior in the instance that the user does not have sufficient meat (1-2 million) to purchase as many dishes as garbo desires or there is a price cliff.",
          default: false,
          hidden: true,
        }),
        dmtDupeItem: Args.item({
          setting: "garbo_dmtDupeItem",
          help: "Item to duplicate in the deep machine tunnel instead of calculating by value. Will be ignored if the item is not in inventory or not able to be duped.",
          hidden: true,
        }),
        meatTargetMultiplier: Args.number({
          setting: "garbo_meatTargetMultiplier",
          help: "The amount we multiply our valueOfAdventure by when estimating marginal meat target profit. (Default 1.5)",
          default: 1.5,
        }),
        stashClan: Args.string({
          setting: "garbo_stashClan",
          help: "If set, garbo will attempt to switch to this clan to take and return useful clan stash item, i.e. a Haiku Katana or Repaid Diaper. Leave blank to disable.",
          default: "",
        }),
        vipClan: Args.string({
          setting: "garbo_vipClan",
          help: "If set, garbo will attempt to switch to this clan to utilize VIP furniture if you have a key. Leave blank to disable",
          default: "",
        }),
        skipAscensionCheck: Args.boolean({
          setting: "garbo_skipAscensionCheck",
          help: "Set to true to skip verifying that your account has broken the prism, otherwise you will be warned upon starting the script.",
        }),
        fightGlitch: Args.boolean({
          setting: "garbo_fightGlitch",
          help: "Set to true to fight the glitch season reward. You need certain skills, see relay for info.",
        }),
        buyPass: Args.boolean({
          setting: "garbo_buyPass",
          help: "Set to true to buy a Dinsey day pass with FunFunds at the end of the day, if possible.",
        }),
        beSelfish: Args.boolean({
          setting: "_garbo_beSelfish",
          help: "Set to true to not spend a small amount of daily resources on community endeavors.",
        }),
        autoUserConfirm: Args.boolean({
          setting: "garbo_autoUserConfirm",
          help: "**WARNING: Experimental** Don't show user confirm dialogs, instead automatically select yes/no in a way that will allow garbo to continue executing. Useful for scripting/headless. Risky and potentially destructive.",
        }),
        autoUserConfirm_targetInvocationsThreshold: Args.number({
          setting: "garbo_autoUserConfirm_targetInvocationsThreshold",
          help: "This is used only when autoUserConfirm is true, will automatically use resources (such as pocket wishes, 11-leaf clovers, etc) up to this threshold to source a target monster for chaining before requesting user interference.",
          default: 1,
        }),
        restoreHpTarget: Args.number({
          setting: "garbo_restoreHpTarget",
          help: "If you're a very high level, what HP threshold should garbo aim to maintain?",
          default: 2000,
        }),
        rolloverBuffer: Args.number({
          setting: "garbo_rolloverBuffer",
          help: "At how many minutes before Rollover should we terminate to let you get ready for bed?",
          default: 5,
        }),
      },
    ),
    /*
      Hidden preferences, CLI input ignored
    */
    stopTurncount: Args.custom<number | null>(
      { hidden: true, default: null },
      () => null,
      "",
    ),
    saveTurns: Args.custom<number>({ hidden: true, default: 0 }, () => 0, ""),
    askedAboutWish: Args.custom<boolean>(
      { hidden: true, default: false },
      () => false,
      "",
    ),
    triedToUnlockHiddenTavern: Args.custom<boolean>(
      { hidden: true, default: false },
      () => false,
      "",
    ),
    wishAnswer: Args.custom<boolean>(
      { hidden: true, default: false },
      () => false,
      "",
    ),
    dietCompleted: Args.flag({
      hidden: true,
      default: false,
    }),
  },
  { positionalArgs: ["turns"] },
);

export function isQuickGear(): boolean {
  return globalOptions.quick || globalOptions.quickgear;
}

export function isQuickCombat(): boolean {
  return globalOptions.quick || globalOptions.quickcombat;
}

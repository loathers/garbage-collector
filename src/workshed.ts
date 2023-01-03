import {
  cliExecute,
  descToItem,
  getFuel,
  getWorkshed,
  handlingChoice,
  haveEffect,
  Item,
  print,
  runChoice,
  toInt,
  toItem,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import { $effect, $item, get, have, property } from "libram";
import { fillTo } from "libram/dist/resources/2017/AsdonMartin";
import { dietCompleted } from "./diet";
import { globalOptions, maxBy } from "./lib";
import { potionSetupCompleted } from "./potions";
import { garboValue } from "./session";
import { estimatedTurns } from "./turns";

export enum TrainsetPiece {
  UNKNOWN = "",
  EMPTY = "empty",
  GAIN_MEAT = "meat_mine",
  EFFECT_MP = "tower_fizzy",
  GAIN_STATS = "viewing_platform",
  HOT_RES_COLD_DMG = "tower_frozen",
  STENCH_RES_SPOOKY_DMG = "spooky_graveyard",
  SMUT_BRIDGE_OR_STATS = "logging_mill",
  CANDY = "candy_factory",
  DOUBLE_NEXT_STATION = "coal_hopper",
  COLD_RES_STENCH_DMG = "tower_sewage",
  SPOOKY_RES_SLEAZE_DMG = "oil_refinery",
  SLEAZE_RES_HOT_DMG = "oil_bridge",
  MORE_ML = "water_bridge",
  MOXIE_STATS = "groin_silo",
  RANDOM_BOOZE = "grain_silo",
  MYS_STATS = "brain_silo",
  MUS_STATS = "brawn_silo",
  BUFF_FOOD_DROP = "prawn_silo",
  DROP_LAST_FOOD_OR_RANDOM = "trackside_diner",
  ORE = "ore_hopper",
}

const pieces: TrainsetPiece[] = [
  TrainsetPiece.EMPTY,
  TrainsetPiece.GAIN_MEAT,
  TrainsetPiece.EFFECT_MP,
  TrainsetPiece.GAIN_STATS,
  TrainsetPiece.HOT_RES_COLD_DMG,
  TrainsetPiece.STENCH_RES_SPOOKY_DMG,
  TrainsetPiece.SMUT_BRIDGE_OR_STATS,
  TrainsetPiece.CANDY,
  TrainsetPiece.DOUBLE_NEXT_STATION,
  TrainsetPiece.COLD_RES_STENCH_DMG,
  TrainsetPiece.UNKNOWN,
  TrainsetPiece.SPOOKY_RES_SLEAZE_DMG,
  TrainsetPiece.SLEAZE_RES_HOT_DMG,
  TrainsetPiece.MORE_ML,
  TrainsetPiece.MOXIE_STATS,
  TrainsetPiece.RANDOM_BOOZE,
  TrainsetPiece.MYS_STATS,
  TrainsetPiece.MUS_STATS,
  TrainsetPiece.BUFF_FOOD_DROP,
  TrainsetPiece.DROP_LAST_FOOD_OR_RANDOM,
  TrainsetPiece.ORE,
];

function getPieceId(piece: TrainsetPiece): number {
  return Math.max(0, pieces.indexOf(piece));
}

function getTrainsetPositionsUntilConfigurable(): number {
  const pos = toInt(get("trainsetPosition", ""));
  const configured = toInt(get("lastTrainsetConfiguration", ""));
  const turnsSinceConfigured = pos - configured;

  return Math.max(0, 40 - turnsSinceConfigured);
}

function isTrainsetConfigurable(): boolean {
  // eslint-disable-next-line libram/verify-constants
  return getWorkshed() === $item`model train set` && getTrainsetPositionsUntilConfigurable() <= 0;
}

function setTrainsetConfiguration(pieces: TrainsetPiece[]) {
  visitUrl("campground.php?action=workshed");

  const pieceIds = pieces
    .map((p) => getPieceId(p))
    .map((pieceId, index) => `slot[${index}]=${pieceId}`);

  const url = `choice.php?forceoption=0&whichchoice=1485&option=1&pwd&${pieceIds.join("&")}`;

  visitUrl(url, true);
  visitUrl("main.php");

  const expected = pieces.join(",");

  if (expected !== get("trainsetConfiguration", "")) {
    throw new Error(
      `Expected trainset configuration to have changed, expected "${expected}" but instead got ${get(
        "trainsetConfiguration",
        ""
      )}`
    );
  }
}

class GarboWorkshed {
  workshed: Item;
  done: () => boolean;
  action: () => void;

  constructor(workshed: Item, done: () => boolean, action: () => void) {
    this.workshed = workshed;
    this.done = done;
    this.action = action;
  }
}

export function currentWorkshed(): GarboWorkshed {
  return worksheds.find((workshed) => workshed.workshed === getWorkshed()) ?? defaultWorkshed;
}

export function getGarboWorkshed(item: Item): GarboWorkshed {
  return worksheds.find((workshed) => workshed.workshed === item) ?? defaultWorkshed;
}

const trainset = new GarboWorkshed(
  // eslint-disable-next-line libram/verify-constants
  $item`model train set`,
  () => {
    // We should always get value from the trainset, so we would never switch from it
    return false;
  },
  () => {
    const pieces = [
      TrainsetPiece.DOUBLE_NEXT_STATION,
      TrainsetPiece.GAIN_MEAT,
      TrainsetPiece.CANDY,
      TrainsetPiece.RANDOM_BOOZE,
      TrainsetPiece.DROP_LAST_FOOD_OR_RANDOM,
      TrainsetPiece.ORE,
      TrainsetPiece.EFFECT_MP,
      TrainsetPiece.GAIN_STATS,
    ];
    if (!isTrainsetConfigurable()) return;
    else if (pieces.join(",") === get("trainsetConfiguration", "")) return;
    setTrainsetConfiguration(pieces);
  }
);

const CMC = new GarboWorkshed(
  $item`cold medicine cabinet`,
  () => {
    return get("_coldMedicineConsults") >= 5;
  },
  () => {
    if (property.getNumber("_nextColdMedicineConsult") > totalTurnsPlayed()) return;
    const options = visitUrl("campground.php?action=workshed");
    let i = 0;
    let match;
    const regexp = /descitem\((\d+)\)/g;
    const itemChoices = new Map<Item, number>();
    if (!globalOptions.noBarf) {
      // if spending turns at barf, we probably will be able to get an extro so always consider it
      itemChoices.set($item`Extrovermectin™`, -1);
    }

    while ((match = regexp.exec(options)) !== null) {
      i++;
      const item = descToItem(match[1]);
      itemChoices.set(item, i);
    }

    const bestItem = maxBy([...itemChoices.keys()], garboValue);
    const bestChoice = itemChoices.get(bestItem);
    if (bestChoice && bestChoice > 0) {
      visitUrl("campground.php?action=workshed");
      runChoice(bestChoice);
    }
    if (handlingChoice()) visitUrl("main.php");
  }
);

const pizzaCube = new GarboWorkshed(
  $item`diabolic pizza cube`,
  () => {
    return dietCompleted;
  },
  () => {
    return;
  }
);

const asdonMartin = new GarboWorkshed(
  $item`Asdon Martin keyfob`,
  () => {
    return haveEffect($effect`Driving Observantly`) >= estimatedTurns();
  },
  () => {
    const currentTurns = haveEffect($effect`Driving Observantly`);
    const requiredTurns = estimatedTurns() - currentTurns;
    const currentFuel = getFuel();
    const requiredFuel = Math.max(Math.ceil(requiredTurns / 30) * 37 - currentFuel, 0);
    if (requiredFuel > 10000) {
      throw new Error(`Wanted to fill ${requiredFuel} fuel in our Asdon, probably a bug!`);
    }
    fillTo(requiredFuel);
    for (let x = 0; x < Math.ceil(requiredTurns / 30); x++) {
      cliExecute("asdonmartin drive observantly");
    }
  }
);

const mayoClinic = new GarboWorkshed(
  $item`portable Mayo Clinic`,
  () => {
    return dietCompleted;
  },
  () => {
    return;
  }
);

const DNALab = new GarboWorkshed(
  $item`Little Geneticist DNA-Splicing Lab`,
  () => {
    // This will likely always return true or false for now, depending on the start state of garbo
    // Since we don't actually support using the syringe in combat at this time, the counter will never change
    return get("_dnaPotionsMade") >= 3;
  },
  () => {
    // Just grab whatever tonics for now, since we don't actually have support for DNA
    const page = visitUrl("campground.php?action=workshed");
    if (page.includes("Human-")) {
      visitUrl("campground.php?action=dnapotion");
    }
  }
);

const snowMachine = new GarboWorkshed(
  $item`snow machine`,
  () => {
    // Assume garden has already been harvested(?)
    return true;
  },
  () => {
    return;
  }
);

const spinningWheel = new GarboWorkshed(
  $item`spinning wheel`,
  () => {
    return get("_spinningWheel");
  },
  () => {
    // We simply assume you will not gain a level while garboing, since we do not do powerlevellings
    // So we will just use the spinning wheel immediately
    visitUrl("campground.php?action=spinningwheel");
  }
);

const autoAnvil = new GarboWorkshed(
  $item`warbear auto-anvil`,
  () => {
    // Garbo does not support meatsmithing, so assume we are done if the user is running garbo
    return true;
  },
  () => {
    return;
  }
);

const chemistryLab = new GarboWorkshed(
  $item`warbear chemistry lab`,
  () => {
    return potionSetupCompleted;
  },
  () => {
    return;
  }
);

const highEfficiencyStill = new GarboWorkshed(
  $item`warbear high-efficiency still`,
  () => {
    return dietCompleted;
  },
  () => {
    return;
  }
);

const inductionOven = new GarboWorkshed(
  $item`warbear induction oven`,
  () => {
    return dietCompleted;
  },
  () => {
    return;
  }
);

const drillPress = new GarboWorkshed(
  $item`warbear jackhammer drill press`,
  () => {
    // Garbo does not support smashing equipment
    return true;
  },
  () => {
    return;
  }
);

const ROMBurner = new GarboWorkshed(
  $item`warbear LP-ROM burner`,
  () => {
    return potionSetupCompleted;
  },
  () => {
    return;
  }
);

const defaultWorkshed = new GarboWorkshed(
  $item`none`,
  () => {
    return true;
  },
  () => {
    return;
  }
);

const worksheds = [
  trainset,
  CMC,
  pizzaCube,
  asdonMartin,
  mayoClinic,
  DNALab,
  snowMachine,
  spinningWheel,
  autoAnvil,
  chemistryLab,
  highEfficiencyStill,
  inductionOven,
  drillPress,
  ROMBurner,
  defaultWorkshed,
];

const nextWorkshed =
  worksheds.find((workshed) => workshed.workshed === toItem(get("_garboNextWorkshed", ""))) ??
  defaultWorkshed;

if (nextWorkshed.workshed === $item`none` && get("_garboNextWorkshed", "").length > 0) {
  throw new Error(`Error: Could not find matching workshed for ${get("_garboNextWorkshed", "")}`);
}

if (
  // eslint-disable-next-line libram/verify-constants
  currentWorkshed().workshed === $item`model train set` &&
  nextWorkshed.workshed !== $item`none`
) {
  print(
    `Warning: We currently do not support switching from the model train set to another workshed, so ${nextWorkshed.workshed} will not be set-up during this run of garbo!`,
    "red"
  );
}

export function handleWorkshed(): void {
  if (!currentWorkshed().done()) currentWorkshed().action();
  if (
    !get("_workshedItemUsed") &&
    currentWorkshed().done() &&
    nextWorkshed.workshed !== $item`none` &&
    have(nextWorkshed.workshed)
  ) {
    use(nextWorkshed.workshed);
    if (!currentWorkshed().done()) currentWorkshed().action();
  }
}

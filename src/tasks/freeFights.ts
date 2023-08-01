import { CombatStrategy, Quest } from "grimoire-kolmafia";
import { GarboTask } from "./engine";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $phyla,
  $skill,
  ChateauMantegna,
  clamp,
  CombatLoversLocket,
  get,
  have,
  maxBy,
  sum,
  TunnelOfLove,
  uneffect,
  Witchess,
} from "libram";
import { Macro } from "../combat";
import { freeFightOutfit } from "../outfit";
import {
  handlingChoice,
  Item,
  itemAmount,
  itemDropsArray,
  mallPrice,
  Monster,
  myMaxhp,
  restoreHp,
  runChoice,
  runCombat,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import { garboValue } from "../value";
import { globalOptions } from "../config";
import { acquire } from "../acquire";
import wanderer from "../wanderer";
import { propertyManager } from "../lib";

type GarboFreeFightTask = GarboTask & { combatCount?: () => number; tentacle?: boolean };

function molemanReady() {
  return have($item`molehill mountain`) && !get("_molehillMountainUsed");
}

const witchessPieces = [
  { piece: $monster`Witchess Bishop`, drop: $item`Sacramento wine` },
  { piece: $monster`Witchess Knight`, drop: $item`jumping horseradish` },
  { piece: $monster`Witchess Pawn`, drop: $item`armored prawn` },
  { piece: $monster`Witchess Rook`, drop: $item`Greek fire` },
];

function bestWitchessPiece() {
  return maxBy(witchessPieces, ({ drop }) => garboValue(drop)).piece;
}

const isFree = (monster: Monster) => monster.attributes.includes("FREE");
const valueDrops = (monster: Monster) =>
  sum(itemDropsArray(monster), ({ drop, rate, type }) =>
    !["c", "0", "p"].includes(type) ? (garboValue(drop, true) * rate) / 100 : 0,
  );
const locketMonster = () => CombatLoversLocket.findMonster(isFree, valueDrops);

const FreeFightTasks: GarboFreeFightTask[] = [
  {
    name: $item`protonic accelerator pack`.name,
    ready: () =>
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      get("ghostLocation") !== null,
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation"),
    combat: new CombatStrategy().autoattack(Macro.ghostBustin()),
    outfit: freeFightOutfit({ back: $item`protonic accelerator pack` }),
    tentacle: true,
  },
  {
    name: $item`molehill mountain`.name,
    ready: () => molemanReady() && (get("_thesisDelivered") || !have($familiar`Pocket Professor`)),
    completed: () => !molemanReady(),
    do: () => use($item`molehill mountain`),
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: true,
  },
  {
    name: "Tunnel of Love",
    ready: TunnelOfLove.have,
    completed: TunnelOfLove.isUsed,
    do: () =>
      TunnelOfLove.fightAll(
        "LOV Epaulettes",
        "Open Heart Surgery",
        "LOV Extraterrestrial Chocolate",
      ),
    // TODO: Get drops
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    combatCount: () => 3,
  },
  {
    name: "Chateau Mantegna",
    ready: () =>
      ChateauMantegna.have() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ?? false),
    completed: ChateauMantegna.paintingFought,
    do: ChateauMantegna.fightPainting,
    tentacle: true,
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(
      have($familiar`Robortender`) &&
        $phyla`elf, fish, hobo, penguin, constellation`.some(
          (phylum) => phylum === ChateauMantegna.paintingMonster()?.phylum,
        )
        ? { familiar: $familiar`Robortender` }
        : {},
    ),
  },
  {
    name: "Eldritch Tentacle",
    ready: () => get("questL02Larva") !== "unstarted",
    completed: () => get("_eldritchTentacleFought"),
    do: () => {
      const haveEldritchEssence = itemAmount($item`eldritch essence`) !== 0;
      visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
      if (!handlingChoice()) throw "No choice?";
      runChoice(haveEldritchEssence ? 2 : 1);
    },
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: false,
  },
  {
    name: $skill`Evoke Eldritch Horror`.name,
    ready: () => have($skill`Evoke Eldritch Horror`),
    completed: () => get("_eldritchHorrorEvoked"),
    do: () => {
      useSkill($skill`Evoke Eldritch Horror`);
      if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
    },
    effects: () =>
      (11 / 200) * garboValue($item`eldritch ichor`) > mallPrice($item`crappy waiter disguise`)
        ? [$effect`Crappily Disguised as a Waiter`]
        : [],
    combat: new CombatStrategy().autoattack(
      Macro.if_(
        $monster`Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl`,
        // Using while_ here in case you run out of mp
        Macro.while_("hasskill Awesome Balls of Fire", Macro.skill($skill`Awesome Balls of Fire`))
          .while_("hasskill Eggsplosion", Macro.skill($skill`Eggsplosion`))
          .while_("hasskill Saucegeyser", Macro.skill($skill`Saucegeyser`))
          .while_("hasskill Weapon of the Pastalord", Macro.skill($skill`Weapon of the Pastalord`))
          .while_("hasskill Lunging Thrust-Smack", Macro.skill($skill`Lunging Thrust-Smack`))
          .attack()
          .repeat(),
      ).basicCombat(),
    ),
    outfit: freeFightOutfit(),
    tentacle: false,
  },
  {
    name: $item`lynyrd snare`.name,
    ready: () => mallPrice($item`lynyrd snare`) <= globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_lynyrdSnareUses") >= 3,
    do: () => use($item`lynyrd snare`),
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    combatCount: () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
  },
  // [glitch season reward name]
  // seals
  // BRICKO
  // Grimacia
  // Pygmys
  {
    name: $item`Kramco Sausage-o-Matic™`.name,
    ready: () => get("_sausageFights") === 0 && have($item`Kramco Sausage-o-Matic™`),
    completed: () => get("_sausageFights") > 0,
    do: () => {
      propertyManager.setChoices(wanderer.getChoices("wanderer")); // todo: use choices
      return wanderer.getTarget("wanderer");
    },
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit({ offhand: $item`Kramco Sausage-o-Matic™` }),
    tentacle: true,
  },
  // glark cable
  // mushroom garden
  // portscan
  {
    name: $familiar`God Lobster`.name,
    ready: () => have($familiar`God Lobster`),
    completed: () => get("_godLobsterFights") >= 3,
    do: () => {
      restoreHp(myMaxhp());
      visitUrl("main.php?fightgodlobster=1");
      runCombat();
      visitUrl("choice.php");
      if (handlingChoice()) runChoice(-1);
    },
    choices: { 1310: !have($item`God Lobster's Crown`) ? 1 : 2 }, // god lob equipment, then stats
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit({
      familiar: $familiar`God Lobster`,
      bonuses: new Map<Item, number>([
        [$item`God Lobster's Scepter`, 1000],
        [$item`God Lobster's Ring`, 2000],
        [$item`God Lobster's Rod`, 3000],
        [$item`God Lobster's Robe`, 4000],
        [$item`God Lobster's Crown`, 5000],
      ]),
    }),
    combatCount: () => clamp(5 - get("_godLobsterFights"), 0, 5),
    tentacle: false,
  },
  {
    name: $familiar`Machine Elf`.name,
    ready: () => have($familiar`Machine Elf`),
    completed: () => get("_machineTunnelsAdv") >= 5,
    do: () => {
      if (garboValue($item`abstraction: certainty`) >= garboValue($item`abstraction: thought`)) {
        acquire(1, $item`abstraction: thought`, garboValue($item`abstraction: certainty`), false);
      }
      if (garboValue($item`abstraction: joy`) >= garboValue($item`abstraction: action`)) {
        acquire(1, $item`abstraction: action`, garboValue($item`abstraction: joy`), false);
      }
      if (garboValue($item`abstraction: motion`) >= garboValue($item`abstraction: sensation`)) {
        acquire(1, $item`abstraction: sensation`, garboValue($item`abstraction: motion`), false);
      }
    },
    choices: { 1119: 6 }, // escape DMT
    combat: new CombatStrategy().autoattack(
      Macro.externalIf(
        garboValue($item`abstraction: certainty`) >= garboValue($item`abstraction: thought`),
        Macro.if_($monster`Perceiver of Sensations`, Macro.tryItem($item`abstraction: thought`)),
      )
        .externalIf(
          garboValue($item`abstraction: joy`) >= garboValue($item`abstraction: action`),
          Macro.if_($monster`Thinker of Thoughts`, Macro.tryItem($item`abstraction: action`)),
        )
        .externalIf(
          garboValue($item`abstraction: motion`) >= garboValue($item`abstraction: sensation`),
          Macro.if_($monster`Performer of Actions`, Macro.tryItem($item`abstraction: sensation`)),
        )
        .basicCombat(),
    ),
    outfit: freeFightOutfit({ familiar: $familiar`Machine Elf` }),
    tentacle: false, // Marked like this as 2 DMT fights get overriden by tentacles (could add +1 combat)
    combatCount: () => clamp(5 - get("_machineTunnelsAdv"), 0, 5),
  },
  {
    name: "Witchess",
    ready: () => Witchess.have(),
    completed: () => Witchess.fightsDone() >= 5,
    do: () => Witchess.fightPiece(bestWitchessPiece()),
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: true,
  },
  {
    name: "Snojo",
    ready: () => get("snojoAvailable"),
    completed: () => get("_snojoFreeFights") >= 10,
    do: () => $location`The X-32-F Combat Training Snowman`,
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: false,
    combatCount: () => clamp(10 - get("_snojoFreeFights"), 0, 10),
  },
  // neverending party
  {
    name: "Speakeasy",
    ready: () => get("ownsSpeakeasy"),
    completed: () => get("_speakeasyFreeFights") >= 3,
    do: () => $location`An Unusually Quiet Barroom Brawl`,
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: true,
    combatCount: () => clamp(3 - get("_speakeasyFreeFights"), 0, 3),
  },
  {
    name: "Reminisce",
    ready: () => CombatLoversLocket.have() && locketMonster() !== null,
    completed: () => CombatLoversLocket.reminiscesLeft() === 0,
    do: () => {
      const monster = locketMonster();
      if (!monster) return;
      CombatLoversLocket.reminisce(monster);
    },
    outfit: freeFightOutfit(
      have($familiar`Robortender`) ? { familiar: $familiar`Robortender` } : {},
    ),
    tentacle: true,
    combatCount: () => clamp(3 - CombatLoversLocket.reminiscesLeft(), 0, 3),
  },
  // li'l ninja costume
  // closed-circuit pay phone
];

export function expectedFights(): number {
  return FreeFightTasks.filter((obj) => (obj.ready?.() ?? true) && !obj.completed()).reduce(
    (acc, obj) => {
      return (
        acc +
        (obj.combatCount?.() ?? 1) *
          (obj?.tentacle === true && have($effect`Eldritch Attunement`) ? 2 : 1)
      );
    },
    0,
  );
}

export const DailyItemsQuest: Quest<GarboTask> = {
  name: "Free Fight",
  tasks: FreeFightTasks,
};

import { Quest } from "grimoire-kolmafia";
import {
  availableAmount,
  canEquip,
  guildStoreAvailable,
  handlingChoice,
  Item,
  itemAmount,
  itemDropsArray,
  itemType,
  mallPrice,
  Monster,
  myClass,
  myMaxhp,
  mySoulsauce,
  restoreHp,
  retrieveItem,
  runChoice,
  runCombat,
  Skill,
  use,
  useSkill,
  visitUrl,
  weaponHands,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $phyla,
  $skill,
  ChateauMantegna,
  clamp,
  CombatLoversLocket,
  Delayed,
  ensureEffect,
  get,
  have,
  maxBy,
  sum,
  TunnelOfLove,
  undelay,
  uneffect,
  Witchess,
} from "libram";
import { acquire } from "../acquire";
import { GarboStrategy, Macro } from "../combat";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { freeFightOutfit } from "../outfit";
import { GarboTask } from "./engine";

type GarboFreeFightTask = GarboTask & {
  combatCount: () => number;
  tentacle: boolean; // if a tentacle fight can follow
};

const DEFAULT_FREE_FIGHT_TASK = {
  // GarboTask
  combat: new GarboStrategy(Macro.basicCombat()),
  outfit: freeFightOutfit,
  spendsTurn: false,
  // GarboFreeFightTask
  combatCount: () => 1,
};

function bestWitchessPiece() {
  return maxBy(Witchess.pieces, (monster) =>
    sum(itemDropsArray(monster), ({ drop }) => garboValue(drop)),
  );
}

const isFree = (monster: Monster) => monster.attributes.includes("FREE");
const valueDrops = (monster: Monster) =>
  sum(itemDropsArray(monster), ({ drop, rate, type }) =>
    !["c", "0", "p"].includes(type) ? (garboValue(drop, true) * rate) / 100 : 0,
  );
const locketMonster = () => CombatLoversLocket.findMonster(isFree, valueDrops);
const locketsToSave = () =>
  CombatLoversLocket.availableLocketMonsters().includes(
    $monster`Knob Goblin Embezzler`,
  )
    ? 1
    : 0;

const maxSealsAvailable = () =>
  retrieveItem(1, $item`Claw of the Infernal Seal`) ? 10 : 5;

function sealsAvailable(): number {
  const max = maxSealsAvailable();
  const available = guildStoreAvailable()
    ? Infinity
    : Math.floor(availableAmount($item`seal-blubber candle`) / 3);
  return Math.min(max, available);
}

const stunDurations = new Map<Skill | Item, Delayed<number>>([
  [$skill`Blood Bubble`, 1],
  [
    $skill`Entangling Noodles`,
    () =>
      myClass() === $class`Pastamancer` && !have($skill`Shadow Noodles`)
        ? 1
        : 0,
  ],
  [$skill`Frost Bite`, 1],
  [$skill`Shadow Noodles`, 2],
  [
    $skill`Shell Up`,
    () => {
      if (myClass() !== $class`Turtle Tamer`) return 0;
      for (const [effect, duration] of new Map([
        [$effect`Glorious Blessing of the Storm Tortoise`, 4],
        [$effect`Grand Blessing of the Storm Tortoise`, 3],
        [$effect`Blessing of the Storm Tortoise`, 2],
      ])) {
        if (have(effect)) return duration;
      }
      return 0;
    },
  ],
  [$skill`Soul Bubble`, () => (mySoulsauce() >= 5 ? 2 : 0)],
  [$skill`Summon Love Gnats`, 1],
  [$item`Rain-Doh blue balls`, 1],
]);

const FreeFightTasks: GarboFreeFightTask[] = [
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: $item`protonic accelerator pack`.name,
    ready: () =>
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      get("ghostLocation") !== null,
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation"),
    combat: new GarboStrategy(Macro.ghostBustin()),
    outfit: () => freeFightOutfit({ back: $item`protonic accelerator pack` }),
    tentacle: true,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: $item`molehill mountain`.name,
    ready: () =>
      have($item`molehill mountain`) &&
      (get("_thesisDelivered") || !have($familiar`Pocket Professor`)),
    completed: () => get("_molehillMountainUsed"),
    do: () => use($item`molehill mountain`),
    tentacle: true,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
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
    combatCount: () => 3,
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Chateau Mantegna",
    ready: () =>
      ChateauMantegna.have() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ??
        false),
    completed: ChateauMantegna.paintingFought,
    do: ChateauMantegna.fightPainting,
    outfit: () =>
      freeFightOutfit(
        have($familiar`Robortender`) &&
          $phyla`elf, fish, hobo, penguin, constellation`.some(
            (phylum) => phylum === ChateauMantegna.paintingMonster()?.phylum,
          )
          ? { familiar: $familiar`Robortender` }
          : {},
      ),
    tentacle: true,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Eldritch Tentacle",
    ready: () => get("questL02Larva") !== "unstarted",
    completed: () => get("_eldritchTentacleFought"),
    do: () => {
      const haveEldritchEssence = itemAmount($item`eldritch essence`) !== 0;
      visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
      if (!handlingChoice()) throw "No choice?";
      runChoice(haveEldritchEssence ? 2 : 1);
    },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: $skill`Evoke Eldritch Horror`.name,
    ready: () => have($skill`Evoke Eldritch Horror`),
    completed: () => get("_eldritchHorrorEvoked"),
    do: () => {
      useSkill($skill`Evoke Eldritch Horror`);
      if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
    },
    effects: () =>
      (11 / 200) * garboValue($item`eldritch ichor`) >
      mallPrice($item`crappy waiter disguise`)
        ? [$effect`Crappily Disguised as a Waiter`]
        : [],
    combat: new GarboStrategy(
      Macro.if_(
        $monster`Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl`,
        // Using while_ here in case you run out of mp
        Macro.while_(
          "hasskill Awesome Balls of Fire",
          Macro.skill($skill`Awesome Balls of Fire`),
        )
          .while_("hasskill Eggsplosion", Macro.skill($skill`Eggsplosion`))
          .while_("hasskill Saucegeyser", Macro.skill($skill`Saucegeyser`))
          .while_(
            "hasskill Weapon of the Pastalord",
            Macro.skill($skill`Weapon of the Pastalord`),
          )
          .while_(
            "hasskill Lunging Thrust-Smack",
            Macro.skill($skill`Lunging Thrust-Smack`),
          )
          .attack()
          .repeat(),
      ).basicCombat(),
    ),
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: $item`lynyrd snare`.name,
    ready: () =>
      mallPrice($item`lynyrd snare`) <= globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_lynyrdSnareUses") >= 3,
    do: () => use($item`lynyrd snare`),
    combat: new GarboStrategy(Macro.basicCombat()),
    combatCount: () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
    limit: { skip: 3 },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "[glitch season reward name]: retrocape edition",
    ready: () =>
      (globalOptions.prefs.fightGlitch ?? false) &&
      have($item`unwrapped knock-off retro superhero cape`) &&
      sum([...stunDurations], ([thing, duration]) =>
        have(thing) ? undelay(duration) : 0,
      ) >= 5,
    completed: () => !!get("_glitchMonsterFights"),
    do: () => {
      visitUrl("inv_eat.php?pwd&whichitem=10207");
      runCombat();
    },
    combat: new GarboStrategy(
      Macro.trySkill($skill`Curse of Marinara`)
        .trySkill($skill`Shell Up`)
        .trySkill($skill`Shadow Noodles`)
        .trySkill($skill`Entangling Noodles`)
        .trySkill($skill`Summon Love Gnats`)
        .trySkill($skill`Frost Bite`)
        .trySkill($skill`Soul Bubble`)
        .tryItem($item`Rain-Doh blue balls`)
        .skill($skill`Blow a Robo-Kiss`)
        .repeat(),
    ),
    outfit: () =>
      freeFightOutfit(
        {
          back: $items`unwrapped knock-off retro superhero cape`,
          modes: { retrocape: ["robot", "kiss"] },
        },
        { canChooseMacro: false },
      ),
    prepare: () => {
      restoreHp(myMaxhp());
      if (have($skill`Ruthless Efficiency`)) {
        ensureEffect($effect`Ruthlessly Efficient`);
      }
      if (have($skill`Mathematical Precision`)) {
        ensureEffect($effect`Mathematically Precise`);
      }
      if (have($skill`Blood Bubble`)) ensureEffect($effect`Blood Bubble`);
      retrieveItem($item`[glitch season reward name]`);
      if (
        get("glitchItemImplementationCount") *
          itemAmount($item`[glitch season reward name]`) >=
        400
      ) {
        retrieveItem($item`gas can`, 2);
      }
    },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "[glitch season reward name]",
    ready: () => globalOptions.prefs.fightGlitch ?? false,
    completed: () => !!get("_glitchMonsterFights"),
    do: () => {
      visitUrl("inv_eat.php?pwd&whichitem=10207");
      runCombat();
    },
    combat: new GarboStrategy(
      Macro.trySkill($skill`Curse of Marinara`)
        .trySkill($skill`Conspiratorial Whispers`)
        .trySkill($skill`Shadow Noodles`)
        .externalIf(
          get("glitchItemImplementationCount") *
            itemAmount($item`[glitch season reward name]`) >=
            400,
          Macro.item([$item`gas can`, $item`gas can`]),
        )
        .externalIf(
          get("lovebugsUnlocked"),
          Macro.trySkill($skill`Summon Love Gnats`).trySkill(
            $skill`Summon Love Mosquito`,
          ),
        )
        .tryItem($item`train whistle`)
        .trySkill($skill`Micrometeorite`)
        .tryItem($item`Time-Spinner`)
        .tryItem($item`little red book`)
        .tryItem($item`Rain-Doh blue balls`)
        .tryItem($item`Rain-Doh indigo cup`)
        .trySkill($skill`Entangling Noodles`)
        .trySkill($skill`Frost Bite`)
        .kill(),
    ),
    outfit: () =>
      freeFightOutfit(
        {
          modifier: ["1000 mainstat"],
          avoid: $items`mutant crown, mutant arm, mutant legs, shield of the Skeleton Lord`,
        },
        { canChooseMacro: false },
      ),
    prepare: () => {
      restoreHp(myMaxhp());
      if (have($skill`Ruthless Efficiency`)) {
        ensureEffect($effect`Ruthlessly Efficient`);
      }
      if (have($skill`Mathematical Precision`)) {
        ensureEffect($effect`Mathematically Precise`);
      }
      if (have($skill`Blood Bubble`)) ensureEffect($effect`Blood Bubble`);
      retrieveItem($item`[glitch season reward name]`);
      if (
        get("glitchItemImplementationCount") *
          itemAmount($item`[glitch season reward name]`) >=
        400
      ) {
        retrieveItem($item`gas can`, 2);
      }
    },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Hellseals",
    ready: () => myClass() === $class`Seal Clubber`,
    completed: () => sealsAvailable() <= 0,
    do: () => {
      const [figurine, candlesNeeded] = guildStoreAvailable()
        ? [$item`figurine of a wretched-looking seal`, 1]
        : [$item`figurine of an ancient seal`, 3];
      retrieveItem(1, figurine);
      retrieveItem(candlesNeeded, $item`seal-blubber candle`);
      use(figurine);
    },
    outfit: () => {
      const clubs = Item.all().filter(
        (i) => have(i) && canEquip(i) && itemType(i) === "club",
      );
      const club =
        clubs.find((i) => weaponHands(i) === 1) ??
        clubs.find((i) => weaponHands(i) === 2) ??
        $item`seal-clubbing club`;
      retrieveItem(club);
      return freeFightOutfit({ weapon: club });
    },
    combat: new GarboStrategy(
      Macro.startCombat()
        .trySkill($skill`Furious Wallop`)
        .while_(
          "hasskill Lunging Thrust-Smack",
          Macro.skill($skill`Lunging Thrust-Smack`),
        )
        .while_("hasskill Thrust-Smack", Macro.skill($skill`Thrust-Smack`))
        .while_("hasskill Lunge Smack", Macro.skill($skill`Lunge Smack`))
        .attack()
        .repeat(),
    ),
    combatCount: sealsAvailable,
    limit: { skip: 10 },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "BRICKO",
    ready: () =>
      mallPrice($item`BRICKO eye brick`) + 2 * mallPrice($item`BRICKO brick`) <=
      globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_brickoFights") >= 10,
    do: () => use($item`BRICKO ooze`),
    outfit: () => freeFightOutfit({}, { canChooseMacro: false }),
    combat: new GarboStrategy(Macro.basicCombat()),
    combatCount: () => clamp(10 - get("_brickoFights"), 0, 10),
    limit: { skip: 10 },
    tentacle: false,
  },
  // First kramco (wanderer)
  // Grimacia
  // Saber
  // Pygmys
  // glark cable
  // mushroom garden
  // portscan
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "God Lobster",
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
    outfit: () =>
      freeFightOutfit({
        familiar: $familiar`God Lobster`,
        bonuses: new Map<Item, number>([
          [$item`God Lobster's Scepter`, 1000],
          [$item`God Lobster's Ring`, 2000],
          [$item`God Lobster's Rod`, 3000],
          [$item`God Lobster's Robe`, 4000],
          [$item`God Lobster's Crown`, 5000],
        ]),
      }),
    combatCount: () => clamp(3 - get("_godLobsterFights"), 0, 3),
    limit: { skip: 3 },
    tentacle: false,
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Machine Elf",
    ready: () => have($familiar`Machine Elf`),
    completed: () => get("_machineTunnelsAdv") >= 5,
    do: () => {
      if (
        garboValue($item`abstraction: certainty`) >=
        garboValue($item`abstraction: thought`)
      ) {
        acquire(
          1,
          $item`abstraction: thought`,
          garboValue($item`abstraction: certainty`),
          false,
        );
      }
      if (
        garboValue($item`abstraction: joy`) >=
        garboValue($item`abstraction: action`)
      ) {
        acquire(
          1,
          $item`abstraction: action`,
          garboValue($item`abstraction: joy`),
          false,
        );
      }
      if (
        garboValue($item`abstraction: motion`) >=
        garboValue($item`abstraction: sensation`)
      ) {
        acquire(
          1,
          $item`abstraction: sensation`,
          garboValue($item`abstraction: motion`),
          false,
        );
      }
      return $location`The Deep Machine Tunnels`;
    },
    choices: { 1119: 6 }, // escape DMT
    combat: new GarboStrategy(
      Macro.externalIf(
        garboValue($item`abstraction: certainty`) >=
          garboValue($item`abstraction: thought`),
        Macro.if_(
          $monster`Perceiver of Sensations`,
          Macro.tryItem($item`abstraction: thought`),
        ),
      )
        .externalIf(
          garboValue($item`abstraction: joy`) >=
            garboValue($item`abstraction: action`),
          Macro.if_(
            $monster`Thinker of Thoughts`,
            Macro.tryItem($item`abstraction: action`),
          ),
        )
        .externalIf(
          garboValue($item`abstraction: motion`) >=
            garboValue($item`abstraction: sensation`),
          Macro.if_(
            $monster`Performer of Actions`,
            Macro.tryItem($item`abstraction: sensation`),
          ),
        )
        .basicCombat(),
    ),
    outfit: () => freeFightOutfit({ familiar: $familiar`Machine Elf` }),
    tentacle: false, // Marked like this as 2 DMT fights get overriden by tentacles (could add +1 combat)
    combatCount: () => clamp(5 - get("_machineTunnelsAdv"), 0, 5),
    limit: { skip: 5 },
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Witchess",
    ready: () => Witchess.have(),
    completed: () => Witchess.fightsDone() >= 5,
    do: () => Witchess.fightPiece(bestWitchessPiece()),
    tentacle: true,
    combatCount: () => clamp(5 - Witchess.fightsDone(), 0, 5),
    limit: { skip: 5 },
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Snojo",
    ready: () => get("snojoAvailable"),
    completed: () => get("_snojoFreeFights") >= 10,
    do: () => $location`The X-32-F Combat Training Snowman`,
    tentacle: false,
    combatCount: () => clamp(10 - get("_snojoFreeFights"), 0, 10),
    limit: { skip: 10 },
  },
  // Neverending party
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Speakeasy",
    ready: () => get("ownsSpeakeasy"),
    completed: () => get("_speakeasyFreeFights") >= 3,
    do: () => $location`An Unusually Quiet Barroom Brawl`,
    tentacle: true,
    combatCount: () => clamp(3 - get("_speakeasyFreeFights"), 0, 3),
    limit: { skip: 3 },
  },
  {
    ...DEFAULT_FREE_FIGHT_TASK,
    name: "Reminisce",
    ready: () => CombatLoversLocket.have() && locketMonster() !== null,
    completed: () => CombatLoversLocket.reminiscesLeft() <= locketsToSave(),
    do: () => {
      const monster = locketMonster();
      if (!monster) return;
      CombatLoversLocket.reminisce(monster);
    },
    outfit: () =>
      freeFightOutfit(
        have($familiar`Robortender`)
          ? { familiar: $familiar`Robortender` }
          : {},
      ),
    tentacle: true,
    combatCount: () =>
      clamp(3 - CombatLoversLocket.reminiscesLeft() - locketsToSave(), 0, 3),
    limit: { skip: 3 },
  },
  // li'l ninja costume
  // closed-circuit pay phone (make into it's own Quest)
];

export function expectedFreeFights(): number {
  const availableFights = FreeFightTasks.filter(
    (task) => (task.ready?.() ?? true) && !task.completed(),
  );
  return sum(
    availableFights,
    ({ combatCount, tentacle }) => combatCount() * (tentacle ? 2 : 1),
  );
}

export function possibleTentacleFights(): number {
  const availableFights = FreeFightTasks.filter(
    (task) => (task.ready?.() ?? true) && !task.completed(),
  );
  return sum(
    availableFights,
    ({ combatCount, tentacle }) => combatCount() * (tentacle ? 1 : 0),
  );
}

export const FreeFightQuest: Quest<GarboTask> = {
  name: "Free Fight",
  tasks: FreeFightTasks,
};

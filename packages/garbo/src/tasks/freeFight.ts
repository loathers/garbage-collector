import { Quest } from "grimoire-kolmafia";
import {
  availableAmount,
  canadiaAvailable,
  canAdventure,
  canEquip,
  changeMcd,
  currentHitStat,
  equippedItem,
  getCampground,
  gnomadsAvailable,
  guildStoreAvailable,
  handlingChoice,
  haveEquipped,
  inebrietyLimit,
  Item,
  itemAmount,
  itemDropsArray,
  itemType,
  Location,
  mallPrice,
  Monster,
  myBuffedstat,
  myClass,
  myFamiliar,
  myInebriety,
  myMaxhp,
  mySoulsauce,
  numericModifier,
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
  $monsters,
  $phyla,
  $skill,
  $slot,
  $stat,
  BurningLeaves,
  ChateauMantegna,
  clamp,
  CombatLoversLocket,
  CommaChameleon,
  Counter,
  Delayed,
  ensureEffect,
  get,
  have,
  maxBy,
  set,
  SourceTerminal,
  sum,
  TearawayPants,
  TunnelOfLove,
  undelay,
  uneffect,
  Witchess,
} from "libram";
import { acquire } from "../acquire";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { freeFightOutfit } from "../outfit";
import { GarboTask } from "./engine";
import { doCandyTrick, doingGregFight, shouldAugustCast } from "../resources";
import { isFreeAndCopyable, kramcoGuaranteed, sober, valueDrops } from "../lib";
import { wanderer } from "../garboWanderer";

export type GarboFreeFightTask = Extract<
  GarboTask,
  { combat: GarboStrategy }
> & {
  combatCount: () => number;
  tentacle: boolean; // if a tentacle fight can follow
};

const DEFAULT_FREE_FIGHT_TASK = {
  // GarboTask
  combat: new GarboStrategy(() => Macro.basicCombat()),
  outfit: freeFightOutfit,
  spendsTurn: false,
  // GarboFreeFightTask
  combatCount: () => 1,
};

function freeFightTask(
  fragment: Omit<GarboFreeFightTask, keyof typeof DEFAULT_FREE_FIGHT_TASK> &
    Partial<Pick<GarboFreeFightTask, keyof typeof DEFAULT_FREE_FIGHT_TASK>>,
) {
  const fullTask = { ...DEFAULT_FREE_FIGHT_TASK, ...fragment };
  // Give us some padding
  return { ...fullTask, limit: { skip: 5 + fullTask.combatCount() } };
}

function bestWitchessPiece() {
  return maxBy(Witchess.pieces, (monster) =>
    sum(itemDropsArray(monster), ({ drop }) => garboValue(drop)),
  );
}

const locketMonster = () =>
  CombatLoversLocket.findMonster(isFreeAndCopyable, valueDrops);
const locketsToSave = () =>
  CombatLoversLocket.canReminisce(globalOptions.target) ? 1 : 0;

const maxSealsAvailable = () =>
  retrieveItem(1, $item`Claw of the Infernal Seal`) ? 10 : 5;

function sealsAvailable(): number {
  const max = maxSealsAvailable();
  const available = guildStoreAvailable()
    ? Infinity
    : Math.floor(availableAmount($item`seal-blubber candle`) / 3);
  return Math.min(max, available);
}

const tearawayPantsFreeFightOutfit = (location: Location) => () =>
  freeFightOutfit(
    {
      bonuses: new Map<Item, number>([
        [
          $item`tearaway pants`,
          get("valueOfAdventure") * TearawayPants.plantsAdventureChance(),
        ],
      ]),
    },
    location,
    { familiarOptions: { canChooseMacro: false, allowAttackFamiliars: false } },
  );

function litLeafMacro(monster: Monster): Macro {
  const tiedUpItem = new Map<Monster, Item>([
    [$monster`flaming leaflet`, $item`tied-up flaming leaflet`],
    [$monster`flaming monstera`, $item`tied-up flaming monstera`],
    [$monster`leaviathan`, $item`tied-up leaviathan`],
  ]).get(monster);

  // Only convert lassos if we can funksling as the combat counts as a free loss
  return Macro.externalIf(
    haveEquipped($item`tearaway pants`),
    Macro.if_(monster, Macro.trySkill($skill`Tear Away your Pants!`)),
  )
    .externalIf(
      tiedUpItem !== undefined &&
        itemAmount($item`lit leaf lasso`) >= 2 &&
        have($skill`Ambidextrous Funkslinging`) &&
        (garboValue(tiedUpItem) - mallPrice($item`lit leaf lasso`)) * 2 >=
          globalOptions.prefs.valueOfFreeFight,
      Macro.if_(
        monster,
        Macro.tryItem([$item`lit leaf lasso`, $item`lit leaf lasso`]),
      ),
    )
    .basicCombat();
}

function dmtCommaValuable(): boolean {
  if (!CommaChameleon.have()) return false;
  const cost =
    mallPrice($item`Deep Machine Tunnels snowglobe`) +
    (CommaChameleon.currentFamiliar() === $familiar`Machine Elf`
      ? 0
      : mallPrice($item`self-dribbling basketball`));
  return globalOptions.prefs.valueOfFreeFight * 5 > cost;
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
    name: $item`protonic accelerator pack`.name,
    ready: () => get("ghostLocation") !== null,
    completed: () => get("questPAGhost") === "unstarted",
    choices: () =>
      wanderer().getChoices(get("ghostLocation") ?? $location.none),
    do: () => get("ghostLocation") ?? $location.none,
    combat: new GarboStrategy(() =>
      have($item`protonic accelerator pack`)
        ? Macro.ghostBustin()
        : Macro.basicCombat(),
    ),
    outfit: () =>
      freeFightOutfit(
        {
          back: have($item`protonic accelerator pack`)
            ? $item`protonic accelerator pack`
            : [],
        },
        get("ghostLocation") ?? $location.none,
      ),
    tentacle: true,
  },
  {
    name: $item`molehill mountain`.name,
    ready: () =>
      have($item`molehill mountain`) &&
      (get("_thesisDelivered") || !have($familiar`Pocket Professor`)),
    completed: () => get("_molehillMountainUsed"),
    do: () => use($item`molehill mountain`),
    tentacle: true,
  },
  {
    name: $skill`Aug. 8th: Cat Day!`.name,
    ready: () => shouldAugustCast($skill`Aug. 8th: Cat Day!`),
    completed: () => $skill`Aug. 8th: Cat Day!`.timescast > 0,
    do: () => useSkill($skill`Aug. 8th: Cat Day!`),
    tentacle: true,
  },
  {
    name: $skill`Aug. 22nd: Tooth Fairy Day!`.name,
    ready: () => shouldAugustCast($skill`Aug. 22nd: Tooth Fairy Day!`),
    completed: () => $skill`Aug. 22nd: Tooth Fairy Day!`.timescast > 0,
    do: () => useSkill($skill`Aug. 22nd: Tooth Fairy Day!`),
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
    combatCount: () => 3,
    tentacle: false,
  },
  {
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
        $location.none,
      ),
    tentacle: true,
  },
  {
    name: "Eldritch Tentacle",
    ready: () => get("questL02Larva") !== "unstarted",
    completed: () =>
      get("_eldritchTentacleFought") ||
      get("_eldritchTentaclesFoughtToday") >= 11,
    do: () => {
      const haveEldritchEssence = itemAmount($item`eldritch essence`) !== 0;
      visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
      if (!handlingChoice()) throw "No choice?";
      runChoice(haveEldritchEssence ? 2 : 1);
    },
    tentacle: false,
  },
  {
    name: $skill`Evoke Eldritch Horror`.name,
    ready: () => have($skill`Evoke Eldritch Horror`),
    completed: () =>
      get("_eldritchHorrorEvoked") ||
      get("_eldritchTentaclesFoughtToday") >= 11,
    do: () => {
      useSkill($skill`Evoke Eldritch Horror`);
      if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
    },
    effects: () =>
      (11 / 200) * garboValue($item`eldritch ichor`) >
      mallPrice($item`crappy waiter disguise`)
        ? [$effect`Crappily Disguised as a Waiter`]
        : [],
    outfit: () =>
      freeFightOutfit(
        {
          bonuses: new Map<Item, number>(
            $items`eldritch hat, eldritch pants, eldritch hammer`.map(
              (item) => [
                item,
                (11 / 200) * garboValue($item`eldritch effluvium`),
              ],
            ),
          ),
        },
        $location.none,
        { familiarOptions: { canChooseMacro: false } },
      ),
    combat: new GarboStrategy(() =>
      Macro.if_(
        $monster`Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl`,
        Macro.externalIf(
          have($effect`Crappily Disguised as a Waiter`),
          Macro.externalIf(
            myBuffedstat($stat`Muscle`) > myBuffedstat($stat`Mysticality`) &&
              (currentHitStat() === $stat`Muscle` ||
                itemType(equippedItem($slot`weapon`)) === "knife"),
            Macro.trySkillRepeat($skill`Lunging Thrust-Smack`),
            Macro.trySkillRepeat($skill`Saucegeyser`),
          ),
        )
          .attack()
          .repeat(),
      ).basicCombat(),
    ),
    tentacle: false,
  },
  {
    name: $item`lynyrd snare`.name,
    ready: () =>
      mallPrice($item`lynyrd snare`) <= globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_lynyrdSnareUses") >= 3,
    do: () => use($item`lynyrd snare`),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
    tentacle: false,
  },
  {
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
    combat: new GarboStrategy(() =>
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
          avoid: $items`mutant crown, mutant arm, mutant legs, shield of the Skeleton Lord`,
          modifier:
            numericModifier("Monster Level") >= 50
              ? "-7 Monster Level"
              : "-Monster Level", // Above 50 ML, monsters resist stuns.
        },
        $location.none,
        {
          familiarOptions: {
            canChooseMacro: false,
            includeExperienceFamiliars: false, // Experience familiars have a high modifier value for fam exp, causing us to not wear -ML
          },
        },
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
        numericModifier("Monster Level") >= 50 && // Above 50 ML, monsters resist stuns.
        (canadiaAvailable() || gnomadsAvailable() || have($item`detuned radio`))
      ) {
        changeMcd(0);
      }
      if (have($effect`Ur-Kel's Aria of Annoyance`)) {
        uneffect($effect`Ur-Kel's Aria of Annoyance`);
      }
    },
    tentacle: false,
  },
  {
    name: "[glitch season reward name]",
    ready: () => globalOptions.prefs.fightGlitch ?? false,
    completed: () => !!get("_glitchMonsterFights"),
    do: () => {
      visitUrl("inv_eat.php?pwd&whichitem=10207");
      runCombat();
    },
    combat: new GarboStrategy(() =>
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
        $location.none,
        { familiarOptions: { canChooseMacro: false } },
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
    name: "Seal Clubbing",
    ready: () => myClass() === $class`Seal Clubber`,
    completed: () =>
      sealsAvailable() <= 0 || get("_sealsSummoned") >= maxSealsAvailable(),
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
      return freeFightOutfit({ weapon: club }, $location.none);
    },
    combat: new GarboStrategy(() =>
      Macro.startCombat()
        .trySkill($skill`Furious Wallop`)
        .trySkillRepeat(
          $skill`Lunging Thrust-Smack`,
          $skill`Thrust-Smack`,
          $skill`Lunge Smack`,
        )
        .attack()
        .repeat(),
    ),
    combatCount: sealsAvailable,
    tentacle: false,
  },
  {
    name: "BRICKO",
    ready: () =>
      mallPrice($item`BRICKO eye brick`) + 2 * mallPrice($item`BRICKO brick`) <=
      globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_brickoFights") >= 10,
    do: () => use($item`BRICKO ooze`),
    outfit: () =>
      freeFightOutfit({}, $location.none, {
        familiarOptions: { canChooseMacro: false },
      }),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(10 - get("_brickoFights"), 0, 10),
    tentacle: false,
  },
  {
    name: "Kramco",
    ready: () => have($item`Kramco Sausage-o-Matic™`),
    completed: () => !kramcoGuaranteed(),
    do: () =>
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
        .location,
    outfit: () =>
      freeFightOutfit(
        { offhand: $item`Kramco Sausage-o-Matic™` },
        wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
          .location,
      ),
    choices: () =>
      wanderer().getChoices({ wanderer: "wanderer", allowEquipment: false }),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(1 - get("_sausageFights"), 0, 1),
    tentacle: true,
  },
  // Grimacia
  // Saber
  // Pygmys
  {
    name: "Glark Cable",
    ready: () =>
      canAdventure($location`The Red Zeppelin`) &&
      get("questL11Ron") === "finished" &&
      myInebriety() <= inebrietyLimit() &&
      mallPrice($item`glark cable`) <= globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_glarkCableUses") >= 5,
    do: $location`The Red Zeppelin`,
    outfit: () =>
      freeFightOutfit({}, $location`The Red Zeppelin`, {
        familiarOptions: {
          canChooseMacro: false,
          allowAttackFamiliars: false,
        },
      }),
    acquire: [{ item: $item`glark cable` }],
    combatCount: () => clamp(5 - get("_glarkCableUses"), 0, 5),
    combat: new GarboStrategy(() =>
      Macro.if_($monster`Eldritch Tentacle`, Macro.basicCombat())
        .item($item`glark cable`)
        .abort(),
    ),
    tentacle: true,
  },
  {
    name: "Mushroom garden",
    ready: () =>
      have($item`packet of mushroom spores`) ||
      getCampground()["packet of mushroom spores"] !== undefined,
    completed: () => get("_mushroomGardenFights") > 0,
    prepare: () => {
      if (have($item`packet of mushroom spores`)) {
        use($item`packet of mushroom spores`);
      }
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
    },
    do: () => $location`Your Mushroom Garden`,
    post: () => {
      if (have($item`packet of tall grass seeds`)) {
        use($item`packet of tall grass seeds`);
      }
    },
    outfit: tearawayPantsFreeFightOutfit($location`Your Mushroom Garden`),
    combat: new GarboStrategy(() =>
      Macro.externalIf(
        !doingGregFight(),
        Macro.if_($skill`Macrometeorite`, Macro.trySkill($skill`Portscan`)),
      )
        .externalIf(
          haveEquipped($item`tearaway pants`),
          Macro.trySkill($skill`Tear Away your Pants!`),
        )
        .basicCombat(),
    ),
    combatCount: () => clamp(1 - get("_mushroomGardenFights"), 0, 1),
    tentacle: true,
  },
  {
    name: "Portscan + Macrometeorite + Mushroom garden",
    ready: () =>
      (have($item`packet of mushroom spores`) ||
        getCampground()["packet of mushroom spores"] !== undefined) &&
      !doingGregFight() &&
      have($skill`Macrometeorite`) &&
      get("_macrometeoriteUses") < 10,
    completed: () => !Counter.exists("portscan.edu"),
    prepare: () => {
      if (have($item`packet of mushroom spores`)) {
        use($item`packet of mushroom spores`);
      }
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
    },
    do: () => $location`Your Mushroom Garden`,
    post: () => {
      if (have($item`packet of tall grass seeds`)) {
        use($item`packet of tall grass seeds`);
      }
    },
    outfit: tearawayPantsFreeFightOutfit($location`Your Mushroom Garden`),
    combat: new GarboStrategy(() =>
      Macro.if_($monster`Government agent`, Macro.skill($skill`Macrometeorite`))
        .if_(
          $monster`piranha plant`,
          Macro.if_($skill`Macrometeorite`, Macro.trySkill($skill`Portscan`)),
        )
        .externalIf(
          haveEquipped($item`tearaway pants`),
          Macro.trySkill($skill`Tear Away your Pants!`),
        )
        .basicCombat(),
    ),
    combatCount: () => clamp(10 - get("_macrometeoriteUses"), 0, 10),
    tentacle: true,
  },
  {
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
    choices: () => ({ 1310: !have($item`God Lobster's Crown`) ? 1 : 2 }), // god lob equipment, then stats
    outfit: () =>
      freeFightOutfit(
        {
          familiar: $familiar`God Lobster`,
          bonuses: new Map<Item, number>([
            [$item`God Lobster's Scepter`, 1000],
            [$item`God Lobster's Ring`, 2000],
            [$item`God Lobster's Rod`, 3000],
            [$item`God Lobster's Robe`, 4000],
            [$item`God Lobster's Crown`, 5000],
          ]),
        },
        $location.none,
      ),
    combatCount: () => clamp(3 - get("_godLobsterFights"), 0, 3),
    tentacle: false,
  },
  {
    name: "Machine Elf",
    ready: () => have($familiar`Machine Elf`) || dmtCommaValuable(),
    completed: () => get("_machineTunnelsAdv") >= 5,
    do: $location`The Deep Machine Tunnels`,
    prepare: () => {
      if (myFamiliar() === $familiar`Comma Chameleon`) {
        if (CommaChameleon.currentFamiliar() !== $familiar`Machine Elf`) {
          acquire(1, $item`self-dribbling basketball`, 10000);
          CommaChameleon.transform($familiar`Machine Elf`);
        }

        if (!canAdventure($location`The Deep Machine Tunnels`)) {
          acquire(1, $item`Deep Machine Tunnels snowglobe`, 2000);
          use($item`Deep Machine Tunnels snowglobe`);
        }
      }
      // We need an else here because if we're using Comma we don't get to convert items.
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
    },
    choices: () => ({ 1119: 6 }), // escape DMT
    combat: new GarboStrategy(() =>
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
    outfit: () =>
      freeFightOutfit(
        {
          familiar: have($familiar`Machine Elf`)
            ? $familiar`Machine Elf`
            : $familiar`Comma Chameleon`,
        },
        $location`The Deep Machine Tunnels`,
      ),
    tentacle: false, // Marked like this as 2 DMT fights get overriden by tentacles (could add +1 combat)
    combatCount: () => clamp(5 - get("_machineTunnelsAdv"), 0, 5),
  },
  {
    name: "Witchess",
    ready: () => Witchess.have(),
    completed: () =>
      Witchess.fightsDone() >= 5 ||
      Witchess.pieces.includes(globalOptions.target),
    do: () => Witchess.fightPiece(bestWitchessPiece()),
    tentacle: true,
    combatCount: () => clamp(5 - Witchess.fightsDone(), 0, 5),
  },
  {
    name: "The X-32-F Combat Training Snowman",
    ready: () => get("snojoAvailable"),
    completed: () => get("_snojoFreeFights") >= 10,
    do: $location`The X-32-F Combat Training Snowman`,
    tentacle: false,
    combatCount: () => clamp(10 - get("_snojoFreeFights"), 0, 10),
  },
  // Neverending party
  {
    name: "An Unusually Quiet Barroom Brawl",
    ready: () => get("ownsSpeakeasy"),
    completed: () => get("_speakeasyFreeFights") >= 3,
    do: $location`An Unusually Quiet Barroom Brawl`,
    tentacle: true,
    combatCount: () => clamp(3 - get("_speakeasyFreeFights"), 0, 3),
  },
  // killRobortCreaturesForFree
  {
    name: $item`combat lover's locket`.name,
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
        $location.none,
      ),
    tentacle: true,
    combatCount: () =>
      clamp(3 - CombatLoversLocket.reminiscesLeft() - locketsToSave(), 0, 3),
  },
  { ...doCandyTrick(), combatCount: () => 5, tentacle: true },
  // leaf burning fights
  {
    name: "Burning Leaves Flaming Leaflet Fight",
    ready: () =>
      BurningLeaves.have() &&
      BurningLeaves.numberOfLeaves() >=
        (BurningLeaves.burnFor.get($monster`flaming leaflet`) ?? Infinity),
    completed: () => get("_leafMonstersFought") >= 5,
    do: () => {
      const lassoCount = itemAmount($item`lit leaf lasso`);
      const result = BurningLeaves.burnSpecialLeaves($monster`flaming leaflet`);
      if (lassoCount > itemAmount($item`lit leaf lasso`)) {
        set("_lastCombatLost", "false");
      }
      return result;
    },
    tentacle: true,
    combatCount: () => clamp(5 - get("_leafMonstersFought"), 0, 5),
    outfit: tearawayPantsFreeFightOutfit($location.none),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming leaflet`)),
  },
  {
    name: $item`tied-up flaming leaflet`.name,
    ready: () =>
      mallPrice($item`tied-up flaming leaflet`) <=
      globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_tiedUpFlamingLeafletFought"),
    acquire: () => [{ item: $item`tied-up flaming leaflet` }],
    do: () => {
      const lassoCount = itemAmount($item`lit leaf lasso`);
      const result = use($item`tied-up flaming leaflet`);
      if (lassoCount > itemAmount($item`lit leaf lasso`)) {
        set("_lastCombatLost", "false");
      }
      return result;
    },
    tentacle: true,
    combatCount: () => (get("_tiedUpFlamingLeafletFought") ? 0 : 1),
    outfit: tearawayPantsFreeFightOutfit($location.none),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming leaflet`)),
  },
  {
    name: $item`tied-up flaming monstera`.name,
    ready: () =>
      mallPrice($item`tied-up flaming monstera`) <=
      globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_tiedUpFlamingMonsteraFought"),
    acquire: () => [{ item: $item`tied-up flaming monstera` }],
    do: () => {
      const lassoCount = itemAmount($item`lit leaf lasso`);
      const result = use($item`tied-up flaming monstera`);
      if (lassoCount > itemAmount($item`lit leaf lasso`)) {
        set("_lastCombatLost", "false");
      }
      return result;
    },
    tentacle: true,
    combatCount: () => (get("_tiedUpFlamingMonsteraFought") ? 0 : 1),
    outfit: tearawayPantsFreeFightOutfit($location.none),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming monstera`)),
  },
  // tied-up leaviathan (scaling, has 100 damage source cap and 2500 hp)
  // li'l ninja costume
  // closed-circuit pay phone (make into it's own Quest)
  {
    name: "CyberRealm Overclock Fights",
    ready: () =>
      canAdventure($location`Cyberzone 1`) &&
      have($item`zero-trust tanktop`) &&
      have($skill`Torso Awareness`) &&
      have($skill`OVERCLOCK(10)`),
    completed: () => get("_cyberFreeFights") >= 10,
    do: $location`Cyberzone 1`, // TODO Support other zones with better equipment and valuing hacker drops
    tentacle: false,
    choices: { 1545: 1 }, // Take damage, get 0's
    outfit: () =>
      freeFightOutfit(
        {
          bonuses: new Map<Item, number>([
            [$item`familiar-in-the-middle wrapper`, garboValue($item`1`)],
            [$item`retro floppy disk`, garboValue($item`1`)],
            [$item`visual packet sniffer`, garboValue($item`1`) / 4], // unspaded droprate
          ]),
          shirt: $item`zero-trust tanktop`,
        },
        $location`Cyberzone 1`,
      ),
    combat: new GarboStrategy(() =>
      Macro.if_(
        $monsters`firewall, ICE barrier, corruption quarantine, parental controls, null container, zombie process, botfly, network worm, ICE man, rat (remote access trojan)`,
        Macro.trySkillRepeat($skill`Throw Cyber Rock`),
      ).basicCombat(),
    ),
    combatCount: () => clamp(10 - get("_cyberFreeFights"), 0, 10),
  },
].map(freeFightTask);

// Expected free fights, not including tentacles
export function expectedFreeFightQuestFights(): number {
  const availableFights = FreeFightTasks.filter(
    (task) => (task.ready?.() ?? true) && !task.completed(),
  );
  return sum(availableFights, ({ combatCount }) => combatCount());
}

// Possible additional free fights from tentacles
export function possibleFreeFightQuestTentacleFights(): number {
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
  ready: () => sober() && !have($effect`Feeling Lost`),
};

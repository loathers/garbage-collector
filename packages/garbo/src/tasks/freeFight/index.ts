import { getTasks, OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  adv1,
  availableAmount,
  canadiaAvailable,
  canAdventure,
  canEquip,
  changeMcd,
  cliExecute,
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
  mallPrice,
  Monster,
  myAdventures,
  myBuffedstat,
  myClass,
  myFamiliar,
  myInebriety,
  myMaxhp,
  mySoulsauce,
  numericModifier,
  print,
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
  Cartography,
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
import { acquire } from "../../acquire";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { globalOptions } from "../../config";
import { garboValue } from "../../garboValue";
import { freeFightOutfit } from "../../outfit/free";
import { MappingTask } from "../engine";
import { doCandyTrick } from "../../resources/candyMap";
import { crateStrategy, doingGregFight } from "../../resources/extrovermectin";
import { ghostAdventure } from "../../resources/protonpack";
import { shouldAugustCast } from "../../resources/scepter";
import {
  ESTIMATED_OVERDRUNK_TURNS,
  getUsingFreeBunnyBanish,
  isFreeAndCopyable,
  kramcoGuaranteed,
  questStep,
  sober,
  valueDrops,
} from "../../lib";
import { AdventureArgument, wanderer } from "../../garboWanderer";

import { freeFightTask, GarboFreeFightTask, prepareParty } from "./lib";
import { PygmyFightTasks, UnlockHiddenTavernTask } from "./pygmy";
import { molemanReady, ThesisTask } from "../thesis";

import { getBestItemStealZone } from "../itemSteal/lib";
import { expectedShadowRiftTentacles, shadowRiftQuest } from "./shadowRift";

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

const tearawayPantsFreeFightOutfit = (adventure: AdventureArgument) => () =>
  freeFightOutfit(
    {
      bonuses: new Map<Item, number>([
        [
          $item`tearaway pants`,
          get("valueOfAdventure") * TearawayPants.plantsAdventureChance(),
        ],
      ]),
    },
    adventure,
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

// Deliberately snapshot stock at module load so pills are farmed in batches.
const haveEnoughPills =
  clamp(availableAmount($item`synthetic dog hair pill`), 0, 100) +
    clamp(availableAmount($item`distention pill`), 0, 100) +
    availableAmount($item`Map to Safety Shelter Grimace Prime`) <
    200 &&
  availableAmount($item`Map to Safety Shelter Grimace Prime`) <
    ESTIMATED_OVERDRUNK_TURNS;
function wantPills(): boolean {
  return (
    have($item`Fourth of May Cosplay Saber`) &&
    crateStrategy() !== "Saber" &&
    haveEnoughPills
  );
}

const reserveCartography = () =>
  getBestItemStealZone(true) !== null && get("_fireExtinguisherCharge") >= 10;
const canMap = () =>
  get("mappingMonsters") ||
  (have($skill`Comprehensive Cartography`) &&
    get("_monstersMapped") < (reserveCartography() ? 2 : 3));

function prepareMapping(): void {
  if (!get("mappingMonsters")) useSkill($skill`Map the Monsters`);
  if (!get("mappingMonsters")) throw new Error("Failed to start mapping.");
}

const remainingPartyFights = () =>
  clamp(
    10 -
      get("_neverendingPartyFreeTurns") -
      (!molemanReady() &&
      !get("_thesisDelivered") &&
      have($familiar`Pocket Professor`)
        ? 1
        : 0),
    0,
    10,
  );

const prepareGrimacia = () => {
  if (have($familiar`Red-Nosed Snapper`)) cliExecute("snapper dude");
};
const GRIMACIA_TASK = {
  adventure: $location`Domed City of Grimacia`,
  completed: () => get("_saberForceUses") >= 5,
  effects: [$effect`Transpondent`],
  choices: { 1387: 3 },
  outfit: () => {
    const canPickPocket =
      myClass() === $class`Accordion Thief` ||
      myClass() === $class`Disco Bandit`;
    const bestPickpocketItem =
      $items`tiny black hole, mime army infiltration glove`.find(
        (item) => have(item) && canEquip(item),
      );
    const spec: OutfitSpec = {
      modifier: ["1000 Pickpocket Chance"],
      equip: $items`Fourth of May Cosplay Saber`,
    };
    if (have($familiar`Red-Nosed Snapper`)) {
      spec.familiar = $familiar`Red-Nosed Snapper`;
    }
    if (!canPickPocket && bestPickpocketItem) {
      spec.equip?.push(bestPickpocketItem);
    }

    return freeFightOutfit(spec, $location`Domed City of Grimacia`, {
      familiarOptions: { canChooseMacro: false },
    });
  },
  tentacle: false,
  combatCount: () => clamp(5 - get("_saberForceUses"), 0, 5),
  prepare: prepareGrimacia,
};

const FreeFightTasks = [
  freeFightTask({
    name: "Cursed Magnifying Glass",
    mapSafe: true,
    adventure: "wanderer",
    ready: () =>
      have($item`cursed magnifying glass`) &&
      get("cursedMagnifyingGlassCount") >= 13,
    completed: () => get("_voidFreeFights") >= 5,
    do: () => wanderer().getTarget("wanderer").location,
    choices: () => wanderer().getChoices("wanderer"),
    outfit: () =>
      freeFightOutfit({ equip: $items`cursed magnifying glass` }, "wanderer"),
    tentacle: false,
    combatCount: () => Math.max(0, 5 - get("_voidFreeFights")),
  }),
  freeFightTask({
    name: $item`protonic accelerator pack`.name,
    mapSafe: true,
    adventure: ghostAdventure,
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
  }),
  freeFightTask({
    name: "Kramco",
    mapSafe: true,
    adventure: { target: $monster`sausage goblin`, location: "wanderer" },
    ready: () => have($item`Kramco Sausage-o-Matic™`),
    completed: () => !kramcoGuaranteed(),
    do: () =>
      wanderer().getTarget({ wanderer: "wanderer", allowEquipment: false })
        .location,
    outfit: () =>
      freeFightOutfit(
        { offhand: $item`Kramco Sausage-o-Matic™` },
        { target: $monster`sausage goblin`, location: "wanderer" },
      ),
    choices: () =>
      wanderer().getChoices({ wanderer: "wanderer", allowEquipment: false }),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(1 - get("_sausageFights"), 0, 1),
    tentacle: true,
  }),
  ThesisTask,
  UnlockHiddenTavernTask,
  freeFightTask({
    ...GRIMACIA_TASK,
    name: "Grimacia Shelter Maps (Cartography)",
    mapSafe: true,
    ready: () => wantPills() && canMap(),
    prepare: () => {
      prepareGrimacia();
      prepareMapping();
    },
    choices: {
      ...GRIMACIA_TASK.choices,
      1435: `1&heyscriptswhatsupwinkwink=${$monster`grizzled survivor`.id}`,
    },
    do: (): void => {
      adv1($location`Domed City of Grimacia`, -1, "");
      if (handlingChoice()) runChoice(-1);
    },
    combat: new GarboStrategy(
      () => new Macro(),
      () => Macro.skill($skill`Use the Force`),
    ),
  }),
  freeFightTask({
    ...GRIMACIA_TASK,
    name: "Grimacia Shelter Maps",
    ready: () => wantPills() && !canMap(),
    prepare: () => {
      prepareGrimacia();
      if (numericModifier($item`Grimacite guayabera`, "Monster Level") < 40) {
        retrieveItem($item`tennis ball`);
        retrieveItem($item`handful of split pea soup`);
        retrieveItem($item`divine champagne popper`);
      }
    },
    do: (): void => {
      adv1($location`Domed City of Grimacia`, -1, "");
      if (handlingChoice()) runChoice(-1);
    },
    combat: new GarboStrategy(
      () =>
        Macro.if_(
          $monster`alielf`,
          Macro.trySkill(
            $skill`Asdon Martin: Spring-Loaded Front Bumper`,
          ).tryItem($item`handful of split pea soup`),
        )
          .if_(
            $monster`cat-alien`,
            get("_snokebombUsed") < (getUsingFreeBunnyBanish() ? 1 : 3)
              ? Macro.trySkill($skill`Snokebomb`).item($item`tennis ball`)
              : Macro.item($item`tennis ball`),
          )
          .if_(
            $monster`dog-alien`,
            Macro.trySkill($skill`Feel Hatred`).tryItem(
              $item`divine champagne popper`,
            ),
          )
          .step("pickpocket"),
      () => Macro.skill($skill`Use the Force`),
    ),
  }),
  freeFightTask({
    name: $item`molehill mountain`.name,
    mapSafe: true,
    adventure: $monster`Moleman`,
    ready: () =>
      have($item`molehill mountain`) &&
      (get("_thesisDelivered") || !have($familiar`Pocket Professor`)),
    completed: () => get("_molehillMountainUsed"),
    do: () => use($item`molehill mountain`),
    tentacle: true,
  }),
  freeFightTask({
    name: $skill`Aug. 8th: Cat Day!`.name,
    mapSafe: true,
    adventure: $monster.none, // TODO
    ready: () => shouldAugustCast($skill`Aug. 8th: Cat Day!`),
    completed: () => $skill`Aug. 8th: Cat Day!`.timescast > 0,
    do: () => useSkill($skill`Aug. 8th: Cat Day!`),
    tentacle: true,
  }),
  freeFightTask({
    name: $skill`Aug. 22nd: Tooth Fairy Day!`.name,
    mapSafe: true,
    adventure: $monster`Tooth Golem`,
    ready: () => shouldAugustCast($skill`Aug. 22nd: Tooth Fairy Day!`),
    completed: () => $skill`Aug. 22nd: Tooth Fairy Day!`.timescast > 0,
    do: () => useSkill($skill`Aug. 22nd: Tooth Fairy Day!`),
    tentacle: true,
  }),
  freeFightTask({
    name: "Tunnel of Love",
    adventure: $location`The Tunnel of L.O.V.E.`,
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
  }),
  freeFightTask({
    name: "Chateau Mantegna",
    mapSafe: true,
    adventure: () => ChateauMantegna.paintingMonster() ?? $monster.none,
    ready: () =>
      ChateauMantegna.have() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ??
        false),
    completed: ChateauMantegna.paintingFought,
    do: () => ChateauMantegna.fightPainting(),
    outfit: () =>
      freeFightOutfit(
        have($familiar`Robortender`) &&
          $phyla`elf, fish, hobo, penguin, constellation`.some(
            (phylum) => phylum === ChateauMantegna.paintingMonster()?.phylum,
          )
          ? { familiar: $familiar`Robortender` }
          : {},
        ChateauMantegna.paintingMonster() ?? $monster.none,
      ),
    tentacle: true,
  }),
  freeFightTask({
    name: "Eldritch Tentacle",
    mapSafe: true,
    adventure: $monster`Eldritch Tentacle`,
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
  }),
  freeFightTask({
    name: $skill`Evoke Eldritch Horror`.name,
    mapSafe: true,
    adventure: $monster`Eldritch Tentacle`,
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
        $monster`Eldritch Tentacle`,
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
  }),
  freeFightTask({
    name: $item`lynyrd snare`.name,
    mapSafe: true,
    adventure: $monster`lynyrd`,
    ready: () =>
      mallPrice($item`lynyrd snare`) <= globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_lynyrdSnareUses") >= 3,
    do: () => use($item`lynyrd snare`),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
    tentacle: false,
  }),
  freeFightTask({
    name: "[glitch season reward name]: retrocape edition",
    mapSafe: true,
    adventure: $monster`%monster%`,
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
        $monster`%monster%`,
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
  }),
  freeFightTask({
    name: "[glitch season reward name]",
    mapSafe: true,
    ready: () => globalOptions.prefs.fightGlitch ?? false,
    adventure: $monster`%monster%`,
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
        $monster`%monster%`,
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
  }),
  freeFightTask({
    name: "Seal Clubbing",
    mapSafe: true,
    ready: () => myClass() === $class`Seal Clubber`,
    completed: () =>
      sealsAvailable() <= 0 || get("_sealsSummoned") >= maxSealsAvailable(),
    adventure: () =>
      guildStoreAvailable()
        ? $monster`Spawn of Wally`
        : $monster`hermetic seal`,
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
      return freeFightOutfit(
        { weapon: club },
        guildStoreAvailable()
          ? $monster`Spawn of Wally`
          : $monster`hermetic seal`,
      );
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
  }),
  freeFightTask({
    name: "BRICKO",
    mapSafe: true,
    adventure: $monster`BRICKO ooze`,
    ready: () =>
      mallPrice($item`BRICKO eye brick`) + 2 * mallPrice($item`BRICKO brick`) <=
      globalOptions.prefs.valueOfFreeFight,
    completed: () => get("_brickoFights") >= 10,
    do: () => use($item`BRICKO ooze`),
    outfit: () =>
      freeFightOutfit({}, $monster`BRICKO ooze`, {
        familiarOptions: { canChooseMacro: false },
      }),
    combat: new GarboStrategy(() => Macro.basicCombat()),
    combatCount: () => clamp(10 - get("_brickoFights"), 0, 10),
    tentacle: false,
  }),
  ...PygmyFightTasks,
  freeFightTask({
    name: "Glark Cable",
    adventure: $location`The Red Zeppelin`,
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
  }),
  freeFightTask({
    name: "Mushroom garden",
    adventure: $location`Your Mushroom Garden`,
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
  }),
  freeFightTask({
    name: "Portscan + Macrometeorite + Mushroom garden",
    adventure: $location`Your Mushroom Garden`,
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
    do: $location`Your Mushroom Garden`,
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
  }),
  freeFightTask({
    name: "God Lobster",
    mapSafe: true,
    adventure: $monster`God Lobster`,
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
        $monster`God Lobster`,
      ),
    combatCount: () => clamp(3 - get("_godLobsterFights"), 0, 3),
    tentacle: false,
  }),
  freeFightTask({
    name: "Machine Elf",
    adventure: $location`The Deep Machine Tunnels`,
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
  }),
  freeFightTask({
    name: "Witchess",
    mapSafe: true,
    adventure: bestWitchessPiece,
    ready: () => Witchess.have(),
    completed: () =>
      Witchess.fightsDone() >= 5 ||
      Witchess.pieces.includes(globalOptions.target),
    do: () => Witchess.fightPiece(bestWitchessPiece()),
    tentacle: true,
    combatCount: () => clamp(5 - Witchess.fightsDone(), 0, 5),
  }),
  freeFightTask({
    name: "The X-32-F Combat Training Snowman",
    adventure: $location`The X-32-F Combat Training Snowman`,
    ready: () => get("snojoAvailable"),
    completed: () => get("_snojoFreeFights") >= 10,
    do: $location`The X-32-F Combat Training Snowman`,
    tentacle: false,
    combatCount: () => clamp(10 - get("_snojoFreeFights"), 0, 10),
  }),
  freeFightTask({
    name: "Neverending Party",
    adventure: $location`The Neverending Party`,
    ready: () =>
      get("neverendingPartyAlways") && questStep("_questPartyFair") < 999,
    completed: () => remainingPartyFights() === 0,
    prepare: prepareParty,
    do: $location`The Neverending Party`,
    combat: new GarboStrategy(() =>
      Macro.tryHaveSkill($skill`Feel Pride`).basicCombat(),
    ),
    outfit: () =>
      freeFightOutfit(
        {
          modifier:
            get("_questPartyFairQuest") === "trash"
              ? ["100 Item Drop"]
              : get("_questPartyFairQuest") === "dj"
                ? ["100 Meat Drop"]
                : [],
          equip: get("_partyHard")
            ? $items`PARTY HARD T-shirt`
            : have($item`January's Garbage Tote`) &&
                (!have($item`broken champagne bottle`) ||
                  get("garbageChampagneCharge") === 0) &&
                (!have($item`deceased crimbo tree`) ||
                  get("garbageTreeCharge") === 0)
              ? $items`makeshift garbage shirt`
              : [],
        },
        $location`The Neverending Party`,
      ),
    tentacle: true,
    combatCount: remainingPartyFights,
  }),
  freeFightTask({
    name: "An Unusually Quiet Barroom Brawl",
    adventure: $location`An Unusually Quiet Barroom Brawl`,
    ready: () => get("ownsSpeakeasy"),
    completed: () => get("_speakeasyFreeFights") >= 3,
    do: $location`An Unusually Quiet Barroom Brawl`,
    tentacle: true,
    combatCount: () => clamp(3 - get("_speakeasyFreeFights"), 0, 3),
  }),
  freeFightTask({
    name: $item`combat lover's locket`.name,
    mapSafe: true,
    adventure: () => locketMonster() ?? $monster.none,
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
        locketMonster() ?? $monster.none,
      ),
    tentacle: true,
    combatCount: () =>
      clamp(3 - CombatLoversLocket.reminiscesLeft() - locketsToSave(), 0, 3),
  }),
  freeFightTask({
    ...doCandyTrick(),
    mapSafe: true,
    adventure: $location`Trick-or-Treating`,
    combatCount: () => 5,
    tentacle: true,
  }),
  freeFightTask({
    name: "Burning Leaves Flaming Leaflet Fight",
    mapSafe: true,
    adventure: $monster`flaming leaflet`,
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
    outfit: tearawayPantsFreeFightOutfit($monster`flaming leaflet`),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming leaflet`)),
  }),
  freeFightTask({
    name: $item`tied-up flaming leaflet`.name,
    mapSafe: true,
    adventure: $monster`flaming leaflet`,
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
    outfit: tearawayPantsFreeFightOutfit($monster`flaming leaflet`),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming leaflet`)),
  }),
  freeFightTask({
    name: $item`tied-up flaming monstera`.name,
    mapSafe: true,
    adventure: $monster`flaming monstera`,
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
    outfit: tearawayPantsFreeFightOutfit($monster`flaming monstera`),
    combat: new GarboStrategy(() => litLeafMacro($monster`flaming monstera`)),
  }),
  freeFightTask({
    name: "Ninja Costume (Lair)",
    adventure: $location`Lair of the Ninja Snowmen`,
    ready: () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      canEquip($item`The Jokester's gun`) &&
      questStep("questL08Trapper") >= 2,
    completed: () =>
      have($item`li'l ninja costume`) || get("_firedJokestersGun"),
    do: $location`Lair of the Ninja Snowmen`,
    outfit: () =>
      freeFightOutfit(
        { equip: $items`The Jokester's gun` },
        $location`Lair of the Ninja Snowmen`,
        { familiarOptions: { canChooseMacro: false } },
      ),
    combat: new GarboStrategy(() =>
      Macro.skill($skill`Fire the Jokester's Gun`).abort(),
    ),
    tentacle: true,
  }),
  freeFightTask({
    name: "Ninja Costume (Cartography)",
    mapSafe: true,
    adventure: {
      location: $location`The Haiku Dungeon`,
      target: $monster`amateur ninja`,
    },
    ready: () =>
      !have($item`li'l ninja costume`) &&
      have($familiar`Trick-or-Treating Tot`) &&
      !get("_firedJokestersGun") &&
      have($item`The Jokester's gun`) &&
      canEquip($item`The Jokester's gun`) &&
      (get("mappingMonsters") || Cartography.availableMaps() > 0),
    completed: () =>
      have($item`li'l ninja costume`) || get("_firedJokestersGun"),
    prepare: prepareMapping,
    choices: {
      1435: `1&heyscriptswhatsupwinkwink=${$monster`amateur ninja`.id}`,
    },
    do: $location`The Haiku Dungeon`,
    outfit: () =>
      freeFightOutfit(
        { equip: $items`The Jokester's gun` },
        {
          location: $location`The Haiku Dungeon`,
          target: $monster`amateur ninja`,
        },
        { familiarOptions: { canChooseMacro: false } },
      ),
    combat: new GarboStrategy(() =>
      Macro.skill($skill`Fire the Jokester's Gun`).abort(),
    ),
    tentacle: true,
  }),
  freeFightTask({
    name: "CyberRealm Overclock Fights",
    adventure: $location`Cyberzone 1`,
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
  }),
];

export function possibleFreeFightQuestTentacleFights(): number {
  const availableFights = FreeFightTasks.filter(
    (task): task is GarboFreeFightTask =>
      "combatCount" in task && "tentacle" in task,
  ).filter(
    (task) => task.tentacle && (task.ready?.() ?? true) && !task.completed(),
  );
  return (
    expectedShadowRiftTentacles() +
    sum(availableFights, (task) => task.combatCount())
  );
}

export function freeFightQuest(): Quest<MappingTask> {
  return {
    name: "Free Fight",
    tasks: [...FreeFightTasks, ...getTasks([shadowRiftQuest()])],
    ready: () => sober() && myAdventures() > 0 && !have($effect`Feeling Lost`),
  };
}

export function mappingRecoveryQuest(): Quest<MappingTask> {
  return {
    name: "Mapping Recovery",
    tasks: [
      {
        name: "Consume Pending Map",
        mapSafe: true,
        ready: () =>
          get("mappingMonsters") &&
          sober() &&
          myAdventures() > 0 &&
          canAdventure($location`The Haunted Kitchen`),
        completed: () => !get("mappingMonsters"),
        prepare: () => {
          print(
            `WARNING: Mapping is still active with no regular mapping task available (${get("_saberForceUses")}/5 Force uses, ${get("_monstersMapped")}/3 maps started). Recovering by fighting a possessed silverware drawer in the Haunted Kitchen; this may spend an adventure.`,
            "red",
          );
        },
        choices: {
          1435: `1&heyscriptswhatsupwinkwink=${$monster`possessed silverware drawer`.id}`,
        },
        do: (): void => {
          adv1($location`The Haunted Kitchen`, -1, "");
          if (handlingChoice()) runChoice(-1);
        },
        outfit: () =>
          freeFightOutfit(
            {},
            {
              location: $location`The Haunted Kitchen`,
              target: $monster`possessed silverware drawer`,
            },
          ),
        combat: new GarboStrategy(() => Macro.basicCombat()),
        spendsTurn: true,
        limit: { tries: 10 },
      },
    ],
  };
}

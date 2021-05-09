import {
  adv1,
  adventure,
  availableAmount,
  buy,
  cliExecute,
  equip,
  faxbot,
  getCampground,
  getClanLounge,
  getCounters,
  handlingChoice,
  itemAmount,
  mallPrice,
  myAdventures,
  myAscensions,
  myClass,
  myEffects,
  myFamiliar,
  mySpleenUse,
  numericModifier,
  outfit,
  print,
  putCloset,
  retrieveItem,
  runChoice,
  runCombat,
  setAutoAttack,
  spleenLimit,
  toSkill,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $skills,
  $slot,
  adventureMacro,
  ChateauMantegna,
  get,
  getAverageAdventures,
  have,
  maximizeCached,
  set,
  SourceTerminal,
  TunnelOfLove,
  Witchess,
} from "libram";
import { Macro, withMacro } from "./combat";
import { freeFightFamiliar, meatFamiliar } from "./familiar";
import { clamp, ensureEffect, mapMonster, setChoice } from "./lib";
import { freeFightMood, meatMood } from "./mood";
import { freeFightOutfit, meatOutfit, Requirement } from "./outfit";
import { withStash } from "./stash";

export function dailyFights() {
  meatMood(true).execute(myAdventures() * 1.04 + 50);
  if (have($item`Clan VIP Lounge key`)) {
    const embezzler = $monster`Knob Goblin embezzler`;
    if (
      (!have($item`photocopied monster`) || get("photocopyMonster") !== embezzler) &&
      !get("_photocopyUsed")
    ) {
      faxbot(embezzler, "CheeseFax");
    }

    if (getClanLounge()["Clan pool table"] !== undefined) {
      while (get("_poolGames") < 3) cliExecute("pool aggressive");
    }
    if (!get<boolean>("_garbo_professorLecturesUsed", false) || get("spookyPuttyCopiesMade") < 5) {
      withStash($items`Spooky Putty sheet, Platinum Yendorian Express Card`, () => {
        if (
          have($familiar`Pocket Professor`) &&
          !get<boolean>("_garbo_professorLecturesUsed", false)
        ) {
          ensureEffect($effect`Peppermint Twisted`);
          if (mySpleenUse() < spleenLimit()) ensureEffect($effect`Eau d' Clochard`);
          if (mySpleenUse() < spleenLimit() && have($item`body spradium`)) {
            ensureEffect($effect`Boxing Day Glow`);
          }

          // First round of prof copies with meat drop gear on.
          if (!get("_photocopyUsed")) {
            freeFightMood().execute(30);
            if (have($item`Platinum Yendorian Express Card`)) {
              use($item`Platinum Yendorian Express Card`);
            }

            if (SourceTerminal.have()) SourceTerminal.educate([$skill`Extract`, $skill`Digitize`]);

            if (!get("_cameraUsed") && !have($item`shaking 4-d camera`))
              retrieveItem($item`4-d camera`);
            useFamiliar($familiar`Pocket Professor`);
            meatOutfit(true);
            withMacro(
              Macro.if_("!hasskill Lecture on Relativity", Macro.trySkill("Digitize"))
                .trySkill("Lecture on Relativity")
                .externalIf(
                  !get("_cameraUsed") && !have($item`shaking 4-d camera`),
                  Macro.tryItem("4-d camera")
                )
                .meatKill(),
              () => use($item`photocopied monster`)
            );
          }

          if (
            getCounters("Digitize Monster", 0, 100).trim() === "" &&
            get("_mushroomGardenFights") === 0
          ) {
            if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
            // adventure in mushroom garden to start digitize timer.
            freeFightOutfit();
            useFamiliar(meatFamiliar());
            adventureMacro($location`Your Mushroom Garden`, Macro.meatKill());
          }

          // Second round of prof copies with familiar weight on.
          freeFightMood().execute(20);
          useFamiliar($familiar`Pocket Professor`);
          maximizeCached(["Familiar Weight"], { forceEquip: $items`Pocket Professor memory chip` });
          withMacro(
            Macro.trySkill("Lecture on Relativity")
              .tryItem($item`Spooky Putty sheet`)
              .meatKill(),
            () => use($item`shaking 4-d camera`)
          );
          set("_garbo_professorLecturesUsed", true);
        } else if (!get("_photocopyUsed")) {
          withMacro(Macro.tryItem($item`Spooky Putty sheet`).meatKill(), () => {
            use($item`photocopied monster`);
          });
          set("_garbo_professorLecturesUsed", true);
        }

        let puttyCount = 1;
        while (availableAmount($item`Spooky Putty monster`) > 0 && puttyCount <= 5) {
          useFamiliar(meatFamiliar());
          meatOutfit(true);
          withMacro(
            Macro.externalIf(
              get("spookyPuttyCopiesMade") < 5 && puttyCount < 5,
              Macro.item($item`Spooky Putty sheet`)
            ).meatKill(),
            () => use($item`Spooky Putty monster`)
          );
          puttyCount++;
        }
        set("spookyPuttyCopiesMade", 5);
      });
    }
  }
}

type FreeFightOptions = {
  cost?: () => number;
  familiar?: () => Familiar | null;
  requirements?: () => Requirement[];
};

class FreeFight {
  available: () => number | boolean;
  run: () => void;
  options: FreeFightOptions;

  constructor(available: () => number | boolean, run: () => void, options: FreeFightOptions = {}) {
    this.available = available;
    this.run = run;
    this.options = options;
  }

  runAll() {
    if (!this.available()) return;
    // FIXME: make a better decision here.
    if ((this.options.cost ? this.options.cost() : 0) > 2000) return;
    while (this.available()) {
      useFamiliar(
        this.options.familiar ? this.options.familiar() ?? freeFightFamiliar() : freeFightFamiliar()
      );
      freeFightMood().execute();
      freeFightOutfit(this.options.requirements ? this.options.requirements() : []);
      withMacro(Macro.meatKill(), this.run);
    }
  }
}

const pygmyMacro = Macro.if_("monstername pygmy bowler", Macro.skill("Snokebomb"))
  .if_("monstername pygmy orderlies", Macro.skill("Feel Hatred"))
  .abort();

const freeFightSources = [
  new FreeFight(
    () => TunnelOfLove.have() && !TunnelOfLove.isUsed(),
    () => {
      TunnelOfLove.fightAll(
        "LOV Epaulettes",
        "Open Heart Surgery",
        "LOV Extraterrestrial Chocolate"
      );

      visitUrl("choice.php");
      if (handlingChoice()) throw "Did not get all the way through LOV.";
    }
  ),

  new FreeFight(
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ?? false),
    () => ChateauMantegna.fightPainting()
  ),

  new FreeFight(
    () => get("questL02Larva") !== "unstarted" && !get("_eldritchTentacleFought"),
    () => {
      visitUrl("place.php?whichplace=forestvillage&action=fv_scientist", false);
      if (!handlingChoice()) throw "No choice?";
      runChoice(1);
    }
  ),

  new FreeFight(
    () => have($skill`Evoke Eldritch Horror`) && !get("_eldritchHorrorEvoked"),
    () => useSkill($skill`Evoke Eldritch Horror`)
  ),

  new FreeFight(
    () => clamp(3 - get("_lynyrdSnareUses"), 0, 3),
    () => use($item`lynyrd snare`),
    {
      cost: () => mallPrice($item`lynyrd snare`),
    }
  ),

  // 6	10	0	0	Infernal Seals	variety of items; must be Seal Clubber for 5, must also have Claw of the Infernal Seal in inventory for 10.
  new FreeFight(
    () => {
      const maxSeals = have($item`Claw of the Infernal Seal`) ? 10 : 5;
      const maxSealsAvailable =
        get("lastGuildStoreOpen") === myAscensions()
          ? maxSeals
          : Math.min(maxSeals, availableAmount($item`seal-blubber candle`));
      return myClass() === $class`Seal Clubber`
        ? Math.max(maxSealsAvailable - get("_sealsSummoned"), 0)
        : 0;
    },
    () => {
      const figurine =
        get("lastGuildStoreOpen") === myAscensions()
          ? $item`figurine of a wretched-looking seal`
          : $item`figurine of an ancient seal`;
      retrieveItem(1, figurine);
      retrieveItem(1, $item`seal-blubber candle`);
      use(figurine);
    },
    {
      requirements: () => [new Requirement(["Club"], {})],
    }
  ),

  new FreeFight(
    () => clamp(10 - get("_brickoFights"), 0, 10),
    () => use($item`BRICKO ooze`),
    {
      cost: () => mallPrice($item`BRICKO eye brick`) + 2 * mallPrice($item`BRICKO brick`),
    }
  ),

  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" ? clamp(10 - get("_drunkPygmyBanishes"), 0, 10) : 0,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(10 - get("_drunkPygmyBanishes"), $item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
    }
  ),

  new FreeFight(
    () =>
      have($item`Fourth of May Cosplay Saber`) && get("_drunkPygmyBanishes") === 10
        ? 2 * clamp(5 - get("_saberForceUses"), 0, 5)
        : 0,
    () => {
      if (get("_saberForceMonster") === null) {
        setChoice(1387, 2);
        putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
        putCloset(itemAmount($item`Bowl of Scorpions`), $item`Bowl of Scorpions`);
        adventureMacro($location`The Hidden Bowling Alley`, Macro.skill("Use the Force"));
      }
      retrieveItem(2, $item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
      putCloset(itemAmount($item`Bowl of Scorpions`), $item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, Macro.skill("Use the Force"));
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`Fourth of May Cosplay Saber`,
        }),
      ],
    }
  ),

  new FreeFight(
    () => get("questL11Worship") !== "unstarted" && get("_drunkPygmyBanishes") === 10,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(11 - get("_drunkPygmyBanishes"), $item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, pygmyMacro);
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
        }),
      ],
    }
  ),

  new FreeFight(
    () =>
      get("questL11Worship") !== "unstarted" &&
      get("crystalBallMonster") === $monster`drunk pygmy` &&
      get("_drunkPygmyBanishes") === 11,
    () => {
      putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
      retrieveItem(1, $item`Bowl of Scorpions`);
      adventureMacro($location`The Hidden Bowling Alley`, Macro.abort());
    },
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`miniature crystal ball`.filter((item) => have(item)),
        }),
      ],
    }
  ),

  new FreeFight(
    () => get("_sausageFights") === 0 && have($item`Kramco Sausage-o-Matic™`),
    () => adv1($location`Noob Cave`, -1, ""),
    {
      requirements: () => [
        new Requirement([], {
          forceEquip: $items`Kramco Sausage-o-Matic™`,
        }),
      ],
    }
  ),

  // FIXME: Glark cable

  // Mushroom garden
  new FreeFight(
    () =>
      (have($item`packet of mushroom spores`) ||
        getCampground()["packet of mushroom spores"] !== undefined) &&
      get("_mushroomGardenFights") === 0,
    () => {
      if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
      adventureMacro($location`Your Mushroom Garden`, Macro.trySkill("Portscan").meatKill());
      if (have($item`Packet of tall grass seeds`)) use($item`Packet of tall grass seeds`);
    },
    {
      familiar: () => (have($familiar`Robortender`) ? $familiar`Robortender` : null),
    }
  ),

  // Portscan and mushroom garden
  new FreeFight(
    () =>
      (have($item`packet of mushroom spores`) ||
        getCampground()["packet of mushroom spores"] !== undefined) &&
      getCounters("portscan.edu", 0, 0) === "portscan.edu" &&
      have($skill`Macrometeorite`) &&
      get("_macrometeoriteUses") < 10,
    () => {
      if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
      if (SourceTerminal.have()) {
        SourceTerminal.educate([$skill`Extract`, $skill`Portscan`]);
      }
      adventureMacro(
        $location`Your Mushroom Garden`,
        Macro.if_("monstername government agent", Macro.skill("Macrometeorite")).if_(
          "monstername piranha plant",
          Macro.trySkill("Portscan").meatKill()
        )
      );
    }
  ),

  new FreeFight(
    () => (have($familiar`God Lobster`) ? clamp(3 - get("_godLobsterFights"), 0, 3) : 0),
    () => {
      setChoice(1310, 3);
      visitUrl("main.php?fightgodlobster=1");
      runCombat();
      visitUrl("choice.php");
      if (handlingChoice()) runChoice(3);
    },
    {
      familiar: () => $familiar`God Lobster`,
    }
  ),

  new FreeFight(
    () => (have($familiar`Machine Elf`) ? clamp(5 - get("_machineTunnelsAdv"), 0, 5) : 0),
    () => adv1($location`The Deep Machine Tunnels`, -1, ""),
    {
      familiar: () => $familiar`Machine Elf`,
    }
  ),

  // 28	5	0	0	Witchess pieces	must have a Witchess Set; can copy for more
  new FreeFight(
    () => (Witchess.have() ? clamp(5 - Witchess.fightsDone(), 0, 5) : 0),
    () => Witchess.fightPiece($monster`Witchess Bishop`)
  ),

  new FreeFight(
    () =>
      get("neverendingPartyAlways") ? clamp(10 - get("_neverendingPartyFreeTurns"), 0, 10) : 0,
    () => {
      // FIXME: Check quest if Gerald(ine).
      setChoice(1322, 2); // reject quest.
      setChoice(1324, 5); // pick fight.
      if (get("_questPartyFair") === "unstarted") adv1($location`The Neverending Party`, -1, "");

      if (
        myFamiliar() === $familiar`Pocket Professor` &&
        $familiar`Pocket Professor`.experience >= 400 &&
        !get("_thesisDelivered")
      ) {
        if (
          have($item`Powerful Glove`) &&
          !have($effect`Triple-Sized`) &&
          get("_powerfulGloveBatteryPowerUsed") <= 95
        ) {
          cliExecute("checkpoint");
          equip($slot`acc1`, $item`Powerful Glove`);
          ensureEffect($effect`Triple-Sized`);
          outfit("checkpoint");
        }
        cliExecute("gain 1800 muscle");
        adventureMacro($location`The Neverending Party`, Macro.skill("Deliver your Thesis"));
      } else {
        adventureMacro($location`The Neverending Party`, Macro.trySkill("Feel Pride").meatKill());
      }
    },
    {
      familiar: () =>
        $familiar`Pocket Professor`.experience >= 400 && !get("_thesisDelivered")
          ? $familiar`Pocket Professor`
          : null,
      requirements: () => [
        new Requirement(
          $familiar`Pocket Professor`.experience >= 400 && !get("_thesisDelivered")
            ? ["100 Muscle"]
            : [],
          {
            forceEquip: have($item`January's Garbage Tote`) ? $items`makeshift garbage shirt` : [],
          }
        ),
      ],
    }
  ),
];

const freeKillSources = [
  new FreeFight(
    () => !get("_gingerbreadMobHitUsed") && have($skill`Gingerbread Mob Hit`),
    () =>
      withMacro(Macro.skill("Sing Along").trySkill("Gingerbread Mob Hit"), () =>
        use($item`drum machine`)
      ),
    {
      familiar: () =>
        have($familiar`Trick-or-Treating Tot`) ? $familiar`Trick-or-Treating Tot` : null,
      requirements: () => [new Requirement(["100 Item Drop"], {})],
    }
  ),

  new FreeFight(
    () => (have($skill`Shattering Punch`) ? clamp(3 - get("_shatteringPunchUsed"), 0, 3) : 0),
    () =>
      withMacro(Macro.skill("Sing Along").trySkill("Shattering Punch"), () =>
        use($item`drum machine`)
      ),
    {
      familiar: () =>
        have($familiar`Trick-or-Treating Tot`) ? $familiar`Trick-or-Treating Tot` : null,
      requirements: () => [new Requirement(["100 Item Drop"], {})],
    }
  ),

  // 22	1	0	0	Fire the Jokester's Gun	combat skill	must have The Jokester's gun equipped (Batfellow content, tradable)
  // 22	3	0	0	Chest X-Ray	combat skill	must have a Lil' Doctor™ bag equipped
  new FreeFight(
    () => (have($item`Lil' Doctor™ bag`) ? clamp(3 - get("_chestXRayUsed"), 0, 3) : 0),
    () =>
      withMacro(Macro.skill("Sing Along").trySkill("Chest X-Ray"), () => use($item`drum machine`)),
    {
      familiar: () =>
        have($familiar`Trick-or-Treating Tot`) ? $familiar`Trick-or-Treating Tot` : null,
      requirements: () => [
        new Requirement(["100 Item Drop"], { forceEquip: $items`Lil' Doctor™ bag` }),
      ],
    }
  ),
];

export function freeFights() {
  for (const freeFightSource of freeFightSources) {
    freeFightSource.runAll();
  }

  if (
    !have($item`li'l ninja costume`) &&
    have($familiar`Trick-or-Treating Tot`) &&
    !get("_firedJokestersGun") &&
    have($item`The Jokester's gun`)
  ) {
    freeFightMood().execute();
    freeFightOutfit([new Requirement([], { forceEquip: $items`The Jokester's gun` })]);
    useFamiliar(freeFightFamiliar());
    freeFightMood().execute();
    freeFightOutfit([new Requirement([], { forceEquip: $items`The Jokester's gun` })]);
    try {
      Macro.skill("Sing Along").skill("Fire the Jokester's Gun").setAutoAttack();
      mapMonster($location`The Haiku Dungeon`, $monster`amateur ninja`);
    } finally {
      setAutoAttack(0);
    }
  }

  try {
    for (const freeKillSource of freeKillSources) {
      if (freeKillSource.available()) {
        ensureEffect($effect`Feeling Lost`);
        if (have($skill`Steely-Eyed Squint`) && !get("_steelyEyedSquintUsed")) {
          useSkill($skill`Steely-Eyed Squint`);
        }
      }

      freeKillSource.runAll();
    }
  } finally {
    cliExecute("uneffect Feeling Lost");
  }
}

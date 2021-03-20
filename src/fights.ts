import {
  adv1,
  availableAmount,
  buy,
  cliExecute,
  faxbot,
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
  putCloset,
  retrieveItem,
  runChoice,
  runCombat,
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
  adventureMacro,
  ChateauMantegna,
  get,
  have,
  maximizeCached,
  set,
  SourceTerminal,
  TunnelOfLove,
  Witchess,
} from "libram";
import { Macro, withMacro } from "./combat";
import { freeFightFamiliar, meatFamiliar } from "./familiar";
import { clamp, ensureEffect, setChoice } from "./lib";
import { freeFightMood, meatMood } from "./mood";
import { freeFightOutfit, meatOutfit, Requirement } from "./outfit";
import { withStash } from "./stash";

export function dailyFights() {
  meatMood().execute(myAdventures() * 1.04 + 50);

  const embezzler = $monster`Knob Goblin embezzler`;
  if (
    SourceTerminal.have() &&
    SourceTerminal.getDigitizeMonster() !== embezzler &&
    !get("_photocopyUsed")
  ) {
    ensureEffect($effect`Peppermint Twisted`);
    if (mySpleenUse() < spleenLimit()) {
      ensureEffect($effect`Eau d' Clochard`);
      if (have($item`body spradium`)) ensureEffect($effect`Boxing Day Glow`);
    }

    if (!have($item`photocopied monster`) || get("photocopyMonster") !== embezzler) {
      faxbot(embezzler, "CheeseFax");
    }
    // TODO: Prof copies, spooky putty copies, ice sculpture if worth, etc.
    if (SourceTerminal.getDigitizeMonster() === null) {
      if (!get("_iceSculptureUsed")) retrieveItem($item`unfinished ice sculpture`);
      if (!get("_cameraUsed")) retrieveItem($item`4-d camera`);
      if (!get("_envyfishEggUsed")) retrieveItem($item`pulled green taffy`);
      useFamiliar(meatFamiliar());
      withMacro(
        Macro.skill("Digitize")
          .externalIf(!get("_iceSculptureUsed"), Macro.tryItem("unfinished ice sculpture"))
          .externalIf(!get("_cameraUsed"), Macro.tryItem("4-d camera"))
          .meatKill(),
        () => use($item`photocopied monster`)
      );
    }
  }

  if (getCounters("Digitize Monster", 0, 100).trim() === "" && get("_mushroomGardenFights") === 0) {
    if (have($item`packet of mushroom spores`)) use($item`packet of mushroom spores`);
    // adventure in mushroom garden to start digitize timer.
    freeFightOutfit();
    useFamiliar(meatFamiliar());
    adventureMacro($location`Your Mushroom Garden`, Macro.meatKill());
  }

  while (get("_poolGames") < 3) cliExecute("pool aggressive");

  if (!get<boolean>("_garbo_professorLecturesUsed", false) || get("spookyPuttyCopiesMade") < 5) {
    withStash($items`Spooky Putty sheet, Platinum Yendorian Express Card`, () => {
      if (
        have($familiar`Pocket Professor`) &&
        !get<boolean>("_garbo_professorLecturesUsed", false)
      ) {
        const goodSongs = $skills`Chorale of Companionship, The Ballad of Richie Thingfinder, Fat Leon's Phat Loot Lyric, The Polka of Plenty`;
        for (const effectName of Object.keys(myEffects())) {
          const effect = Effect.get(effectName);
          const skill = toSkill(effect);
          if (skill.class === $class`Accordion Thief` && skill.buff && !goodSongs.includes(skill)) {
            cliExecute(`shrug ${effectName}`);
          }
        }

        // FIXME: Figure out what's actually good!
        if (!have($effect`Frosty`) && mallPrice($item`frost flower`) < 60000) {
          if (!have($item`frost flower`)) buy($item`frost flower`);
          use($item`frost flower`);
        }
        ensureEffect($effect`Chorale of Companionship`);
        ensureEffect($effect`The Ballad of Richie Thingfinder`);
        ensureEffect($effect`Heart of Pink`);
        ensureEffect($effect`Fortunate Resolve`);
        ensureEffect($effect`Big Meat Big Prizes`);
        ensureEffect($effect`Do I Know You From Somewhere?`);
        ensureEffect($effect`Puzzle Champ`);
        if (have($item`Platinum Yendorian Express Card`)) {
          use($item`Platinum Yendorian Express Card`);
        }
        // now we can do prof copies.
        useFamiliar($familiar`Pocket Professor`);
        if (have($item`ice sculpture`)) {
          maximizeCached(["Meat Drop"], { forceEquip: $items`amulet coin` });
          Macro.trySkill("Lecture on Relativity").meatKill().save();
          withMacro(Macro.trySkill("Lecture on Relativity").meatKill(), () =>
            use($item`ice sculpture`)
          );
        }
        maximizeCached(["Familiar Weight"], { forceEquip: $items`Pocket Professor memory chip` });
        withMacro(
          Macro.trySkill("Lecture on Relativity")
            .tryItem($item`Spooky Putty sheet`)
            .meatKill(),
          () => use($item`shaking 4-d camera`)
        );
        set("_garbo_professorLecturesUsed", true);
      } else if (have($item`ice sculpture`) || have($item`shaking 4-d camera`)) {
        withMacro(Macro.tryItem($item`Spooky Putty sheet`).meatKill(), () => {
          if (have($item`ice sculpture`)) use($item`ice sculpture`);
          if (have($item`shaking 4-d camera`)) use($item`shaking 4-d camera`);
        });
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
  /* if (!get("_envyfishEggUsed")) {
      // now fight one underwater
      use($item`fishy pipe`);
      if (getCounters("Digitize Monster", 0, 0).trim() !== "Digitize Monster") {
        throw new Error("Something went wrong with digitize.");
      }
    } */
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
      freeFightMood().execute();
      freeFightOutfit(this.options.requirements ? this.options.requirements() : []);
      useFamiliar(
        this.options.familiar ? this.options.familiar() ?? freeFightFamiliar() : freeFightFamiliar()
      );
      freeFightMood().execute();
      freeFightOutfit(this.options.requirements ? this.options.requirements() : []);
      withMacro(Macro.meatKill(), this.run);
    }
  }
}

const freeFightSources = [
  new FreeFight(
    () => TunnelOfLove.have() && !TunnelOfLove.isUsed(),
    () => {
      const effect = have($effect`Wandering Eye Surgery`)
        ? "Open Heart Surgery"
        : "Wandering Eye Surgery";
      TunnelOfLove.fightAll("LOV Epaulettes", effect, "LOV Extraterrestrial Chocolate");

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
      // FIXME: Some problem with mafia tracking here.
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
      adventureMacro($location`The Hidden Bowling Alley`, Macro.abort());
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
      adventureMacro($location`The Hidden Bowling Alley`, Macro.abort());
      adventureMacro($location`The Hidden Bowling Alley`, Macro.abort());
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
      retrieveItem(10 - get("_drunkPygmyBanishes"), $item`Bowl of Scorpions`);
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
    () => get("_sausageFights") === 0,
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

  // 21	10	0	0	Partygoers from The Neverending Party	must have used a Neverending Party invitation envelope.
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
        cliExecute("gain 1800 muscle");
        adventureMacro($location`The Neverending Party`, Macro.skill("Deliver your Thesis"));
      } else {
        adv1($location`The Neverending Party`, -1, "");
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

  // Mushroom garden
  // Portscan and mushroom garden

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
    () => clamp(5 - Witchess.fightsDone(), 0, 5),
    () => Witchess.fightPiece($monster`Witchess Bishop`)
  ),
];

export function freeFights() {
  for (const freeFightSource of freeFightSources) {
    freeFightSource.runAll();
  }
}

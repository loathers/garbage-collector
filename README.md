# Garbage Collector

- [Garbage Collector](#garbage-collector)
  - [Introduction](#introduction)
  - [Setup](#setup)
    - [Set `valueOfAdventure`](#set-valueofadventure)
    - [Set your Stash and VIP clans](#set-your-stash-and-vip-clans)
    - [Suggested: Universal Recovery](#suggested-universal-recovery)
  - [Usage](#usage)
    - [`nobarf` flag](#nobarf-flag)
    - [`ascend` flag](#ascend-flag)
    - [`help` flag](#help-flag)
  - [Frequent Questions](#frequent-questions)

## Introduction

This script is an automated turn-burning script for the Kingdom of Loathing that spends a day's resources and adventures on farming in [Barf Mountain](https://kol.coldfront.net/thekolwiki/index.php/Barf_Mountain). This script should ideally be used by folks who have a decent number of IOTMs, but it should have some profit generation even for relatively low-shiny accounts due to the inherent value of Barf Mountain turns.

## Setup

To install the script, use the following command in the KoLMafia CLI.

```text
svn checkout https://github.com/Loathing-Associates-Scripting-Society/garbage-collector/branches/release/
```

Before running Garbage Collector, there are a few tasks you must do.

### Set `valueOfAdventure`

You need to let Garbo know how much it can expect your turns to be worth near the end of the day. One easy way to do this is to set it at 3501 meat manually, then examine your session logs to see how much meat you were actually generating in the last 10-15 turns of the day. To set this, run the following command in the KoLMafia CLI:

```text
set valueOfAdventure = 3501;
```

### Set your Stash and VIP clans

When at all possible, Garbo will try to access a friendly clan stash to see if it can access certain items you don't have that can profitably augment farming -- things like a Movable Feast, a sheet of Spooky Putty, a Haiku Katana, etc. To set your stash clan, copy the name of your intended stash clan and run the following code (using BAFH as an example):

```text
set garbo_stashClan = "Bonus Adventures from Hell"
```

Additionally, if you have a VIP Lounge Key, Garbo will try to make use of any VIP furniture to augment its farming. To set your VIP clan, copy the name of your intended VIP clan and run the following code (once again using BAFH as an example):

```text
set garbo_vipClan = "Bonus Adventures from Hell"
```

### Suggested: Universal Recovery

Sometimes, this script will get you caught in a weird loop if your auto-recovery is incorrectly set and Mafia decides to fix HP problems by adventuring at your campsite. To avoid this, uncheck everything in auto-recovery and check out Universal Recovery.

```text
svn checkout https://svn.code.sf.net/p/kolmafiascripts/mafiarecovery/code/
```

## Usage

To invoke Garbage Collector, type `garbo` in the Mafia GCLI. In addition, you can use various flags to configure how Garbage Collector runs. Additionally, you can also specify the number of turns for garbo to run.

### `nobarf` flag

Running Garbo in `nobarf` mode will not target spending the bulk of your turns at Barf Mountain. Instead, it will just do your daily flag turns, as well as attempt to fight as many Knob Goblin Embezzlers as possible.

### `ascend` flag

Garbo operates under the assumption that you plan on staying in this run over rollover. It will, by default, avoid using borrowed time, charge stinky cheese equipment, and hopefully do other stuff that hinges on this assumption. If that assumption is incorrect, you can call `garbo ascend` instead of the classic `garbo`, and it will then operate under the assumption that you do plan to ascend. As time goes on, we expect more and more features to pay attention to the ascend flag, so it's good to get in the habit of doing so.

### `help` flag

Running Garbo `help` will print out simple help documentation and not run any turns.

If you have issues with this script, please post about them in the #garbage-collector channel within the [Ascension Speed Society Discord](https://discord.gg/tbUCRT5), and someone will eventually (at some point) endeavor to solve them. Someday. Maybe.

## Frequent Questions

> Why is Garbo adventuring outside of Barf Mountain?

Garbo will use your resources to earn meat everywhere possible such as the Hidden Bowling Alley, The Haunted Library, The Deep Dark Jungle, or The Ice Hotel. These generally won't cost a turn to do.

> Garbo buys a one-day pass to Dinseylandfill even though I own the charter?

Ensure that ☑️ Have Dinseylandfill is checked in IotM tracking in KolMafia's preferences.

> Garbo is failing to buy items from the mall?

Increase autoBuyPriceLimit by typing `set autoBuyPriceLimit = 1234` where 1234 is the new value you need.

> Garbo crashed with error Mall price too high for item?

Try rerunning it once. These checks are emergency stops in case the mall prices go beyond expectations.

> Garbo crashed with error Macro Aborted - Unknown predicate: monsterhpbelow 69?

If you own Monster Manuel, factoids are required for the relevant monsters that will be encountered by Garbo. You can just finish combat manually and resume until these errors go away (up to once per unique monster).

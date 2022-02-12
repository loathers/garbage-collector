# Garbage Collector

- [Garbage Collector](#garbage-collector)
  - [Introduction](#introduction)
  - [Is Garbo for me?](#is-garbo-for-me)
  - [Setup](#setup)
    - [Set `valueOfAdventure`](#set-valueofadventure)
    - [Set your VIP clan](#set-your-vip-clan)
    - [Suggested: Universal Recovery](#suggested-universal-recovery)
  - [Usage](#usage)
    - [`nobarf` flag](#nobarf-flag)
    - [`ascend` flag](#ascend-flag)
    - [`nodiet` flag](#nodiet-flag)
    - [`simdiet` flag](#simdiet-flag)
    - [Turncount](#turncount)
    - [`help` flag](#help-flag)
  - [Frequent Questions](#frequent-questions)

## Introduction

This script is an automated turn-burning script for the Kingdom of Loathing that spends a day's resources and adventures on farming in [Barf Mountain](https://kol.coldfront.net/thekolwiki/index.php/Barf_Mountain). This script should ideally be used by folks who have a decent number of IOTMs, but it should have some profit generation even for relatively low-shiny accounts due to the inherent value of Barf Mountain turns.

Garbage Collector, or Garbo for short, is a tool that is designed to maximally extract value from all resources you have available and those you didn't know you had available. When it does something you don't expect, it is either because it has mall data to back up that decision or because the developers intuited that the decision would be profitable. So don't worry about that cognac you were saving for marriage, it's safe.

Garbo is minimally configurable to make things simpler for both the users and the developers, and it will always try to make the most profitable decisions possible.

## Is Garbo for me?

Probably! Unlike Volcano farming, a stable 3,450 MPA option which takes a few thousand meat to get permanently set up for, Garbo responds well to various shinies at your disposal. However, it is entirely possible to get respectable results on accounts without a single IotM - a Seal Clubber with Transcendent Olfaction, all the relevant +meat% and +item% skills permed, and a suite of aftercore farmable gear plus a mafia pointer finger ring should be able to still pull in about 4,000 MPA once limited-per-day buffs run out. And the shinier you are, the higher this number grows! High-end users report getting in the range of 6,000 MPA in their end-day turns, and get to have high early meat generation via chained Knob Goblin Embezzler copy fights.

Consult [this page](ITEMS.md) for a list of various items that are useful to have for Garbo, as well as a list of shinies that it supports and extracts value from. The baseline 4,000 MPA setup is detailed there as well, with a matching spreadsheet.

## Setup

To install the script, use the following command in the KoLMafia CLI.

```text
svn checkout https://github.com/Loathing-Associates-Scripting-Society/garbage-collector/branches/release/
```

Before running Garbage Collector, there are a few tasks you must do.

### Set `valueOfAdventure`

You need to let Garbo know how much it can expect your turns to be worth near the end of the day. One easy way to do this is to set it at 4000 meat manually, then examine your session logs to see how much value you were actually generating in the last 10-15 turns of the day. To set this, run the following command in the KoLMafia CLI:

```text
set valueOfAdventure = 4000;
```

Once you're done running Garbo, take a look at your end of day turns and note the average amount of meat the monsters were dropping. Don't forget the 500 meat from the pointer finger ring, if appropriate. Then take a look at the outfit Garbo equipped for you, note any non-meat-generating options and find a maximizer call in your log. The call will specify a bonus for each of these options it's considering. Extract the relevant ones, add them into the total you've had already, and voila - your own `valueOfAdventure`! Common non-meat-generating options that work their way into Garbo outfits include the lucky gold ring, Mr. Cheeng's spectacles, mafia thumb ring, and Crown of Thrones/buddy bjorn.

### Set your VIP clan

If you have a VIP Lounge Key, Garbo will try to make use of any VIP furniture to augment its farming. To set your VIP clan, copy the name of your intended VIP clan and run the following code (using BAFH as an example):

```text
set garbo_vipClan = "Bonus Adventures from Hell"
```

This is optional - you can skip providing this clan and Garbo will still run.

### Suggested: Universal Recovery

Sometimes, this script will get you caught in a weird loop if your auto-recovery is incorrectly set and Mafia decides to fix HP problems by adventuring at your campsite. To avoid this, uncheck everything in auto-recovery and check out Universal Recovery.

```text
svn checkout https://svn.code.sf.net/p/kolmafiascripts/mafiarecovery/code/
```

Universal Recovery will look a lot like mafia's default recovery settings, but will be managed in a more sophisticated manner. You can access these settings via the relay browser.

## Usage

To invoke Garbage Collector, type `garbo` in the Mafia GCLI. In addition, you can use various flags to configure how Garbage Collector runs. Additionally, you can also specify the number of turns for garbo to run.

### `nobarf` flag

Running Garbo in `nobarf` mode will not target spending the bulk of your turns at Barf Mountain. Instead, it will just do your daily flag turns, as well as attempt to fight as many Knob Goblin Embezzlers as possible.

### `ascend` flag

Garbo operates under the assumption that you plan on staying in this run over rollover. It will, by default, avoid using borrowed time, charge stinky cheese equipment, and hopefully do other stuff that hinges on this assumption. If that assumption is incorrect, you can call `garbo ascend` instead of the classic `garbo`, and it will then operate under the assumption that you do plan to ascend.

`garbo ascend` will collect Safety Maps to Grimace Prime and will use your overdrunk turns to gain distention pills and synthetic dog hair pills. Simply run `garbo ascend` again after your nightcap, before you ascend, and it will spend as many turns farming with Drunkula's Wineglass if you have one, and then use remaining turns on maps for pills. Garbo won't obtain more than 100 of each pill, so don't worry about getting too many.

As time goes on, we expect more and more features to pay attention to the ascend flag, so it's good to get in the habit of doing so.

### `nodiet` flag

_EXPERIMENTAL_ Garbo will not eat or drink anything as part of the run (including Pantsgiving snacks). This command can be run in conjunction with the `ascend` flag ie; `garbo nodiet ascend`.

### `simdiet` flag

Garbo will list the optimal diet it plans to consume computed from your defined mpa and current prices, and then exit.

### Turncount

Garbo can run for a specified number of turns, or run until you have a specified number of turns remaining. To run for `N` turns, run `garbo N`. To run until `M` turns are remaining, run `garbo -M`.

### `help` flag

Running Garbo `help` will print out simple help documentation and not run any turns.

If you have issues with this script, please post about them in the #garbage-collector channel within the [Ascension Speed Society Discord](https://discord.gg/tbUCRT5), and someone will eventually (at some point) endeavor to solve them. Someday. Maybe.

## Frequent Questions

> Why is Garbo adventuring outside of Barf Mountain?

Garbo will use your resources to earn meat everywhere possible such as the Hidden Bowling Alley, The Haunted Library, The Deep Dark Jungle, or The Ice Hotel. These generally won't cost a turn to do.

> Garbo buys a one-day pass to Dinseylandfill even though I own the charter?

Ensure that ☑️ Have Dinseylandfill is checked in IotM tracking in KolMafia's preferences.

> I'm in a clan with a loaded stash, can Garbo make use of the Pantsgiving that's sitting there waiting for me to pull it?

When possible, Garbo will try to access a friendly clan stash to see if it can access certain items you don't have that can profitably augment farming -- things like a Movable Feast, a sheet of Spooky Putty, a Haiku Katana, etc. To set your stash clan, copy the name of your intended stash clan and run the following code (using BAFH as an example):

```text
set garbo_stashClan = "Bonus Adventures from Hell"
```

Just like `garbo_vipClan`, this is entirely optional.

> Garbo is failing to buy items from the mall?

Increase autoBuyPriceLimit by typing `set autoBuyPriceLimit = 1234` where 1234 is the new value you need.

> Garbo crashed with error Mall price too high for item?

Try rerunning it once. These checks are emergency stops in case the mall prices go beyond expectations.

> Garbo crashed with error Macro Aborted - Unknown predicate: monsterhpbelow 69?

If you own Monster Manuel, factoids are required for the relevant monsters that will be encountered by Garbo. You can just finish combat manually and resume until these errors go away (up to once per unique monster).

> Help, I ran garbo and now some of my stuff is missing!

Garbo will use your consumables and potions if it is deemed profitable to do so. Garbo will also deposit certain items into your closet for safe keeping.

> I was trying to click around the mall/campground/inventory/etc and then Garbo crashed, and now it is behaving strangely! Is this a bug?

Garbo can be very fragile during some particular segments of the run and it is strongly recommended you do not click on anything while it is performing. This isn't a bug, Garbo is just pretty complex and the last thing either of us wants is to try looking for a bug that isn't there! Go make yourself a sandwich, do some chores, or relax and watch the meat number go up.

> Help! Garbo keeps opening the mini-browser to the shore!

Ultimately the person to complain to about this is Jick, or CDM, or your family doctor. Garbo needs to do something very silly in order for orb to work optimally, and doing so causes mafia to open the shore in the mini-browser. You can ignore it. It's very weird, I know, but ultimately harmless.

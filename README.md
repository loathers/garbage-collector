# Garbage Collector

This script is an automated turn-burning script for the Kingdom of Loathing that spends a day's resources and adventures on farming in [Barf Mountain](https://kol.coldfront.net/thekolwiki/index.php/Barf_Mountain). This script should ideally be used by folks who have a decent number of IOTMs, but it should have some profit generation even for relatively low-shiny accounts due to the inherent value of Barf Mountain turns.

To install the script, use the following command in the KoLMafia CLI.

```
svn checkout https://github.com/Loathing-Associates-Scripting-Society/garbage-collector/branches/release/
```

Before running Garbage Collector, there are a few tasks you must do.

# Set the value of a marginal adventure

You need to let Garbo know how much it can expect your turns to be worth near the end of the day. One easy way to do this is to set it at 3000 meat manually, then examine your session logs to see how much meat you were actually generating in the last 10-15 turns of the day. To set this, run the following command in the KoLMafia CLI:

```
set valueOfAdventure = 3000;
```

# Set your Stash and VIP clans

When at all possible, Garbo will try to access a friendly clan stash to see if it can access certain items you don't have that can profitably augment farming -- things like a Movable Feast, a sheet of Spooky Putty, a Haiku Katana, etc. To set your stash clan, copy the name of your intended stash clan and run the following code (using BAFH as an example):

```
set garbo_stashClan = "Bonus Adventures from Hell"
```

Additionally, if you have a VIP Lounge Key, Garbo will try to make use of any VIP furniture to augment its farming. To set your VIP clan, copy the name of your intended VIP clan and run the following code (once again using BAFH as an example):

```
set garbo_vipClan = "Bonus Adventures from Hell"
```

# Install "Universal Recovery"

Sometimes, this script will get you caught in a weird loop if your auto-recovery is incorrectly set and Mafia decides to fix HP problems by adventuring at your campsite. To avoid this, uncheck everything in auto-recovery and check out Universal Recovery.

```
svn checkout https://svn.code.sf.net/p/kolmafiascripts/mafiarecovery/code/
```

If you have issues with this script, please post about them in the #mafia-and-scripting channel within the [Ascension Speed Society Discord](https://discord.gg/tbUCRT5), and someone will eventually (at some point) endeavor to solve them. Someday. Maybe.

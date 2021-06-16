# Garbage Collector

This script is an automated turn-burning script for the Kingdom of Loathing that spends a day's resources and adventures on farming in [Barf Mountain](https://kol.coldfront.net/thekolwiki/index.php/Barf_Mountain). This script should ideally be used by folks who have a decent number of IOTMs, but it should have some profit generation even for relatively low-shiny accounts due to the inherent value of Barf Mountain turns.

To install the script, use the following command in the KoLMafia CLI.

```
svn checkout https://github.com/Loathing-Associates-Scripting-Society/garbage-collector/branches/main/KoLmafia/
```

Before running Garbage Collector, there are a few tasks you must do.

# Enable Autoattack versus Special Monsters

You will need to enable autoattack versus special monsters to enable the script to kill several iterations of Knob Goblin Embezzlers. In order to do this, please go to your KOL base game settings, navigate to the "Combat" page, and enable the first setting under your combat options (circled below).

![image](https://user-images.githubusercontent.com/8014761/120696502-a3514a80-c47a-11eb-85c4-f7244342095c.png)

# Set the value of a marginal adventure

You need to let Garbo know how much it can expect your turns to be worth near the end of the day. One easy way to do this is to set it at 3000 meat manually, then examine your session logs to see how much meat you were actually generating in the last 10-15 turns of the day. To set this, run the following command in the KoLMafia CLI:

```
set valueOfAdventure = 3000;
```

# Set your "stash clan"

When at all possible, Garbo will try to access a friendly clan stash to see if it can access certain items you don't have that can profitably augment farming -- things like a Movable Feast, a sheet of Spooky Putty, a Haiku Katana, etc. To set your stash clan, copy the name of your intended stash clan and run the following code (using BAFH as an example):

```
set stashClan = "Bonus Adventures from Hell"`
```

# Install "Universal Recovery"

Sometimes, this script will get you caught in a weird loop if your auto-recovery is incorrectly set and Mafia decides to fix HP problems by adventuring at your campsite. To avoid this, uncheck everything in auto-recovery and check out Universal Recovery.

```
svn checkout https://svn.code.sf.net/p/kolmafiascripts/mafiarecovery/code/
```

If you have issues with this script, please post about them in the #mafia-and-scripting channel within the [Ascension Speed Society Discord](https://discord.gg/tbUCRT5), and someone will eventually (at some point) endeavor to solve them. Someday. Maybe.

# Developing Garbage Collector

Garbo is a permanent work in progress, and any and all contributions are encouraged. If you want to contribute, feel free to send in pull requests, and they will be dealt with in as timely a manner as possible. When making PRs for garbo, please remember the following:

- Do not check in the files in the KoLmafia directory. Due to a quirk of how we're distributing the code here, we can't just gitignore them, but checking in changes to these files can lead to entirely avoidable merge conflicts. The workflow will automatically build the files once the PR is merged.
- Make sure to run prettier, or said workflows will prevent you merging.

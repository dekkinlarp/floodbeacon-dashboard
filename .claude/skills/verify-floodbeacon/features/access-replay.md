# Responder access replay

Response shows real November 2021 Coldwater gauge observations alongside an
illustrative access network and two-day historical hindsight. It does not
require a backend or external map service.

## Sub-features

- Daily replay, play/pause/restart and keyboard-accessible date slider.
- Planning areas ordered by first scenario access loss, with alternative routes.
- Selected-area explanations using assumed thresholds and the relevant sample.
- Estimated discharge flags and explicit incomplete end-of-record outlooks.
- Desktop/mobile, English/Thai, light/dark, and explicit data-loading errors.

## How to get to it (user POV)

Open **Response**, or use `/?view=response`. The initial frame is November 13:
Area A has a sampled loss the next day, Area B two days later, Area C retains an
untriggered path. Select Area A or B, advance to November 15, and inspect the
changes. Restart returns to November 11.

## Driving it with drive.mjs

```sh
node .claude/skills/verify-floodbeacon/scripts/drive.mjs goto '/?view=response'
node .claude/skills/verify-floodbeacon/scripts/drive.mjs wait --role heading --name 'Community access'
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name 'Planning area A Consider'
node .claude/skills/verify-floodbeacon/scripts/drive.mjs screenshot --path artifacts/verify-floodbeacon/access-before-loss.png
node .claude/skills/verify-floodbeacon/scripts/drive.mjs snapshot --path artifacts/verify-floodbeacon/access-before-loss.aria.yaml
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name Play
node .claude/skills/verify-floodbeacon/scripts/drive.mjs click --role button --name Pause
node .claude/skills/verify-floodbeacon/scripts/drive.mjs console
```

Use keyboard Home/End and arrow keys on the **Historical replay** slider to
test precise dates. November 15 stage is 3.18 m and discharge 239.0 m³/s
(Estimated). A and B are isolated in the scenario; C retains a modeled path.
November 19 has an incomplete outlook. Check the 390px layout and a width near
the phone breakpoint, and verify language/theme controls remain visible on
desktop. A missing or unsupported JSON file must show an explicit error.

## Gotchas

- Graph geometry and closures are assumed; never compare these lines to real
  roads as proof of actual isolation.
- The two-day outlook contains later observations, not a historical forecast.
- Gauge stage is not local road depth; discharge is not bridge flow velocity.
- A below-threshold corridor is modeled available, not certified passable.
- Start the checkout with its own locked dependencies (`npm ci`); sharing
  another Vite checkout's dependency/cache directory can create duplicate React
  modules and invalidate browser verification.

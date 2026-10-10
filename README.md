# Moto Rush · 像素機車大賽

**Play:** https://ywchen0711.github.io/moto-rush/

A pixel-art motorbike racing game in the spirit of the classic 90s bike racers: **superbike** road races and
**motocross** with jumps and mid-air tricks. Pure HTML5 canvas and JavaScript — no libraries, no image files
(every sprite and background is painted in code), synthesized sound. Chinese and English.

- **Two disciplines, six tracks**
  - Superbike: Sunset Coast, Alpine Pass (big hills, hairpins), Neon City (night streets, right angles)
  - Motocross: Canyon Dust, Muddy Woods (whoops), Volcano Ridge (huge jumps)
- **Modes**: single race against seven riders, a three-race championship (10-8-6-5-4-3-2-1 points), and time trial
- **Riders**: Josh, Jasper, Jeff and Erin — each with their own top speed, acceleration, handling and grip;
  the other three race against you with four rivals
- **Riding**: bends push you outwards (brake before the yellow arrows), nitro, slipstream behind other riders,
  perfect starts, jumps with real airtime, tricks in the air (finish them before you land!), crashes,
  hay bales and tyre walls that bounce you back
- Pseudo-3D road with curves and hills, parallax backgrounds, a camera that leans with the bike, dust, speed lines,
  a minimap, best-lap records saved in your browser
- Keyboard (arrows/WASD, Space or Shift for nitro and tricks, P to pause), touch buttons on phones, gamepads

## Files

```
js/tracks.js   the six tracks (sections: straights, curves, hills, jumps, whoops) and the riders
js/world.js    track building, physics, AI, laps and results — runs in Node too
js/art.js      pixel sprites and backgrounds, painted in code
js/render.js   the pseudo-3D renderer and HUD
js/audio.js    synthesized engine and effects
js/main.js     menus, input, game loop, championships, records
tools/sim.js   AI-only races on every track: lap times, crashes, airtime, everyone finishes
```

`node tools/sim.js` runs the checks.

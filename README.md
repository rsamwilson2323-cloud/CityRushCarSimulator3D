# 🚗 City Rush Car Simulator 3D

> **Three worlds. One little buggy. Endless detours.**

A colorful browser-based 3D arcade driving game where you can explore a forest and river playground, compete in a dusk circuit race, or cruise through a lively cartoon city filled with traffic, pedestrians, landmarks, and collectibles.

![City Rush Car Simulator 3D](https://img.shields.io/badge/City%20Rush-Car%20Simulator%203D-ff4757?style=for-the-badge)
![Three.js](https://img.shields.io/badge/Three.js-r128-black?style=for-the-badge\&logo=three.js)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?style=for-the-badge\&logo=javascript)
![PWA](https://img.shields.io/badge/PWA-Ready-5a67d8?style=for-the-badge)

---

## 🎮 About The Game

**City Rush Car Simulator 3D** is a browser-based 3D arcade driving experience built around a small off-road buggy.

The game combines:

* 🌲 Forest exploration
* 🌊 River and water driving
* 🏁 Circuit racing
* 🏙️ Cartoon city exploration
* 🚗 Traffic vehicles
* 🚕 Taxi vehicles
* 🚓 Police vehicles
* 🧍 Pedestrian NPCs
* ⭐ Collectible stars
* 💥 Destructible objects
* ⚡ Nitro boost
* 💨 Drift mechanics
* 🏎️ Stunt gameplay
* 🗺️ Minimap navigation
* 🎨 Vehicle customization
* 📊 Personal records
* 📱 Mobile touch controls
* 🔊 Procedural engine and game sounds

The main menu provides three playable worlds: **Forest & River Playground**, **Dusk Circuit Race**, and **Toon City**.

---

# 🌍 Game Modes

## 🌲 1. Forest & River Playground

Explore a large natural environment featuring:

* 🌲 Pine and autumn forest
* 🌊 Sparkling river
* 🌉 Wooden bridges
* 💦 Water splashes
* 🚀 Large river ramps
* 📦 Destructible crates
* ⭐ 10 collectible golden stars
* 💨 Drift and stunt opportunities
* ⚡ Nitro boosting

The forest environment includes a large meadow and winding river system designed for free-roaming exploration and stunt driving.

**Goal:** Explore the environment, collect stars, smash objects, perform stunts, and discover different areas of the playground.

---

## 🏁 2. Dusk Circuit Race

Compete in an off-road circuit race against **6 AI rivals**.

Features include:

* 🏎️ 7-car race grid
* 🤖 AI opponents
* 🏁 Multi-lap racing
* ⏱️ Lap timing
* 🏆 Position tracking
* 💥 Vehicle collisions
* 🛞 Rumble curbs
* 📊 Personal best lap records
* 🥇 Podium results

The race uses a countdown before starting and tracks the player's lap, position, best lap, and total race time.

---

## 🏙️ 3. Toon City

Explore a colorful open-world cartoon city.

The city features:

* 🏢 Colorful buildings
* 🏪 Shops
* 🌳 Parks
* 🌊 Seaside areas
* 🚗 Moving traffic
* 🚕 Taxis
* 🚓 Police vehicles
* 🧍 Walking pedestrians
* 🚶 Crosswalks
* ⭐ 16 collectible stars
* 🗺️ District identification
* 🌦️ Environmental systems

The Toon City mode dynamically creates its world, collision system, city-life simulation, and collectible stars when the mode starts.

The city-life system spawns approximately **24 traffic vehicles** and **18–24 pedestrians**, with traffic and pedestrian behavior updated continuously.

---

# 🚗 Vehicle Gameplay

The player drives a stylized off-road buggy designed for arcade-style driving.

Core driving mechanics include:

* Acceleration
* Reverse
* Steering
* Braking
* Nitro
* Drifting
* Stunts
* Vehicle resetting
* Collision interaction

The HUD tracks vehicle-related gameplay information including speed, nitro, stars, score, and race information depending on the selected game mode.

---

# ⚡ Nitro Boost

Use **Shift** to activate Nitro.

Nitro provides a temporary speed boost and is useful for:

* 🏁 Overtaking opponents
* 🚀 Launching over ramps
* 🌲 Crossing difficult terrain
* 🏙️ Quickly navigating the city
* 💨 Extending high-speed drift combos

The game maintains a Nitro fuel value and resets the fuel when changing or restarting worlds.

---

# 💨 Drift & Stunts

City Rush is designed around arcade driving rather than purely realistic road simulation.

Players can:

* Drift around corners
* Perform jumps
* Launch from ramps
* Build stunt combos
* Collect bonus objects
* Use Nitro during jumps
* Explore off-road areas

A combo system tracks stunt/drift scoring and contributes to the player's overall score.

---

# 💥 Destruction

The game contains interactive and destructible environmental objects.

Players can crash into objects while driving and trigger:

* 💥 Impact effects
* 📦 Object destruction
* 💨 Smoke
* 🧩 Debris
* 📳 Collision feedback
* 🏆 Combo scoring

World cleanup systems remove destroyed or inactive objects to prevent unnecessary accumulation during gameplay.

---

# ⭐ Collectibles

Stars are placed throughout the game's exploration worlds.

### Forest

**10 golden stars**

### Toon City

**16 collectible stars**

Collected stars are tracked by the HUD and can contribute to personal progression and records.

In Toon City, collectible star objects are created from the world's predefined star positions when the city is initialized.

---

# 🎨 Vehicle Garage

The main menu includes a vehicle garage where players can change the buggy's paint color.

Available paint options include:

| Paint               | Style       |
| ------------------- | ----------- |
| 🔴 Crimson Flame    | Red         |
| 🟦 Cyber Cyan       | Cyan        |
| 🟡 Golden Champion  | Yellow      |
| 🟢 Forest Camo      | Green       |
| ⚫ Midnight Carbon   | Dark Carbon |
| 🟣 Neon Ultraviolet | Purple      |

The selected paint is persisted and applied to the player's vehicle model.

---

# 🎮 Controls

## 🖥️ Desktop

| Key       | Action           |
| --------- | ---------------- |
| `W` / `↑` | Accelerate       |
| `S` / `↓` | Reverse / Brake  |
| `A`       | Steer Left       |
| `D`       | Steer Right      |
| `SHIFT`   | ⚡ Nitro          |
| `SPACE`   | 💨 Drift         |
| `C`       | 📷 Change Camera |
| `R`       | 🔄 Reset Vehicle |

The in-game desktop guide exposes the core driving, Nitro, drift, camera, and reset controls.

---

## 📱 Mobile Controls

The game includes touch controls for mobile and coarse-pointer devices.

Available controls include:

* ◀ Steer Left
* ▶ Steer Right
* ▲ Accelerate
* ▼ Brake / Reverse
* ⚡ Nitro
* 💨 Drift

The interface automatically adapts the control layout for smaller screens.

---

# 📷 Camera

The game supports multiple camera interactions.

Use:

```text
C
```

to change the camera mode.

The minimap and camera system are available during the major gameplay modes, helping players navigate the environments and follow the action.

---

# 🗺️ Minimap

A circular minimap is displayed during gameplay.

It helps players:

* Navigate the environment
* Understand their surroundings
* Locate areas of interest
* Follow race progress
* Explore Toon City

The minimap is initialized when Forest, Race, and Toon City modes begin.

---

# 🏙️ Toon City Life

Toon City is more than a static environment.

The city contains simulated activity including:

### 🚗 Traffic

Traffic vehicles include:

* 🚕 Taxi
* 🚗 Sedan
* 🚐 Van
* 🚓 Police

The traffic system continuously updates vehicle movement using predefined traffic waypoints.

### 🧍 Pedestrians

Pedestrians roam around the city.

They can react to the player's vehicle when it approaches them at higher speeds, creating a more dynamic city atmosphere.

### 🚶 Crosswalks

Major intersections contain zebra crosswalks to make the city feel more alive.

---

# 🔊 Sound System

City Rush includes a procedural sound engine built using the browser's **Web Audio API**.

The sound system generates effects such as:

* 🚗 Engine rumble
* ⚡ Nitro sound
* ⭐ Star pickup
* 💥 Smash / collision sounds
* 🔔 UI feedback
* 🏎️ Driving audio

The engine sound dynamically changes based on vehicle speed and Nitro state.

---

# 💾 Persistent Records

The game stores player records and customization data.

The main menu can display:

* 🏆 Best Lap
* 🏅 Highest Stunt Score
* ⭐ Stars Collected
* 📸 Top Speed
* 🎨 Selected Vehicle Paint
* ⚡ Graphics Quality

Race completion can save a new best-lap record when achieved.

---

# ⚙️ Graphics Quality

Players can choose between:

```text
LOW
MED
HIGH
```

Graphics quality can be changed directly from the main menu.

The project also initializes a saved graphics-quality setting when the game starts.

For mobile devices, a lower graphics setting can help maintain smoother performance.

---

# 📱 Progressive Web App

City Rush is configured as a Progressive Web App.

The manifest defines:

* App name: **City Rush Car Simulator 3D**
* Short name: **City Rush**
* Standalone display mode
* Landscape orientation
* Custom theme color
* Sports-car application icons

The application also registers a service worker when served over HTTP/HTTPS.

---

# 📦 Project Structure

```text
CityRushCarSimulator3D/
│
├── index.html
├── manifest.json
├── sw.js
├── capacitor.config.json
├── package-lock.json
├── run.bat
├── .gitignore
│
└── assets/
    ├── toon-city-world.js
    └── toon-city-life.js
```

### Main Files

| File                        | Purpose                                                   |
| --------------------------- | --------------------------------------------------------- |
| `index.html`                | Main game application, UI, gameplay systems and rendering |
| `assets/toon-city-world.js` | Toon City environment generation                          |
| `assets/toon-city-life.js`  | City traffic and pedestrian systems                       |
| `manifest.json`             | PWA configuration                                         |
| `sw.js`                     | Service worker and caching                                |
| `capacitor.config.json`     | Capacitor application configuration                       |
| `run.bat`                   | Windows launch helper                                     |
| `package-lock.json`         | npm lockfile                                              |

The main HTML loads the two Toon City modules directly.

---

# 🧰 Technology Stack

| Technology         | Purpose                                     |
| ------------------ | ------------------------------------------- |
| **HTML5**          | Application structure                       |
| **CSS3**           | UI, menus, HUD and responsive layouts       |
| **JavaScript**     | Game logic and systems                      |
| **Three.js**       | 3D rendering                                |
| **Web Audio API**  | Procedural game audio                       |
| **PWA APIs**       | Installable/offline-capable web application |
| **Service Worker** | Caching and update handling                 |
| **Capacitor**      | Native application configuration            |

The current game loads **Three.js r128** from CDN.

---

# 🚀 Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/rsamwilson2323-cloud/CityRushCarSimulator3D.git
```

## 2. Enter the Project

```bash
cd CityRushCarSimulator3D
```

## 3. Start a Local Web Server

Because the game loads JavaScript modules and browser resources, running it through a local HTTP server is recommended.

### Using Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Using npx

```bash
npx serve .
```

Then open the local address provided by the server.

---

# 🪟 Windows Quick Start

If the repository contains the supplied `run.bat`, you can use the Windows launcher to start the project.

Alternatively:

```powershell
python -m http.server 8000
```

Then visit:

```text
http://localhost:8000
```

---

# 🌐 Browser Requirements

Recommended:

* Google Chrome
* Microsoft Edge
* Modern Chromium-based browser
* Hardware acceleration enabled

A modern browser is recommended for the best 3D performance.

---

# 📲 Mobile

City Rush supports responsive layouts and touch controls.

The application is configured for:

```text
Landscape Orientation
```

Mobile controls appear automatically on touch-oriented devices.

For the best driving experience, landscape mode is recommended.

---

# ⚡ Performance

The project includes several systems intended to keep the game responsive:

* Dynamic world cleanup
* Selective environment updates
* Traffic simulation
* Distance-based city interaction
* Graphics quality presets
* Reusable visual effects
* Minimap updates
* Responsive mobile UI

The game also exposes runtime rendering information through its internal game-state/debug interface, including render calls, triangles, geometries, and textures.

---

# 🧪 Development

The project is intentionally lightweight.

Most of the core game functionality is contained in:

```text
index.html
```

while the Toon City world and city-life systems are separated into:

```text
assets/toon-city-world.js
assets/toon-city-life.js
```

This makes the project relatively easy to experiment with and extend.

---

# 🔧 Customization Ideas

Developers can extend City Rush with features such as:

* 🏎️ More playable cars
* 🎨 More paint styles
* 🔧 Vehicle upgrades
* 🏁 More race tracks
* 🏆 Championship mode
* 🌦️ Dynamic weather
* 🌙 Full day/night cycle
* 🚦 Traffic lights
* 🚓 Police chase missions
* 🚕 Taxi missions
* 🧍 More NPC behaviors
* ⭐ More collectibles
* 🗺️ Larger city districts
* 🎮 Gamepad support
* 🏅 Achievement system
* 💰 Coin/economy system
* 🌐 Online multiplayer
* 📱 Improved mobile driving controls

---

# 🏗️ Game Architecture

The general gameplay flow can be represented as:

```text
                 CITY RUSH
                     │
          ┌──────────┼──────────┐
          │          │          │
       FOREST      RACE      TOON CITY
          │          │          │
       River       AI Cars    Traffic
       Ramps       Laps       Pedestrians
       Stars       Timing     Districts
       Crates      Position   Stars
          │          │          │
          └──────────┼──────────┘
                     │
                  PLAYER
                     │
          ┌──────────┼──────────┐
          │          │          │
        DRIVE      DRIFT      NITRO
          │          │          │
          └──────────┼──────────┘
                     │
                 SCORE / RECORDS
```

---

# 🔄 World Switching

Each game mode has its own initialization and cleanup process.

For example:

```javascript
startForestMode();
startRaceMode();
startToonCityMode();
```

When switching worlds, the application removes active world objects and resets mode-specific systems before loading the next environment.

This keeps the three environments separated while allowing them to share the same player vehicle and core gameplay systems.

---

# 🎯 Game Objectives

There is no single way to play City Rush.

You can:

### 🌲 Explore

Drive around the Forest & River Playground and search for collectibles.

### 🏁 Compete

Race against AI opponents and try to set a new fastest lap.

### 🏙️ Discover

Explore Toon City, visit different districts, interact with the city environment, and collect stars.

### 💥 Cause Chaos

Smash objects, drift, jump, boost, and create your own driving challenges.

### 🏆 Chase Records

Improve:

* Best Lap
* Stunt Score
* Star Collection
* Top Speed

---

# 🎨 Visual Style

City Rush uses a colorful stylized arcade aesthetic.

The UI uses:

* Glassmorphism panels
* Gradient buttons
* Bright accent colors
* Responsive layouts
* Rounded controls
* HUD overlays
* Animated interface elements

The main menu describes the experience as:

> **Three worlds. One little buggy. Endless detours.**

---

# 🛠️ Troubleshooting

## Blank Screen

Make sure you are running the project through an HTTP server rather than opening `index.html` directly.

Try:

```bash
python -m http.server 8000
```

or:

```bash
npx serve .
```

---

## Game Does Not Load

Open the browser developer console:

```text
F12 → Console
```

Look for missing files or JavaScript errors.

Make sure these files exist:

```text
index.html
manifest.json
sw.js
assets/toon-city-world.js
assets/toon-city-life.js
```

---

## Toon City Does Not Appear

Verify that both city modules are available:

```html
<script src="assets/toon-city-world.js"></script>
<script src="assets/toon-city-life.js"></script>
```

These are loaded by the main application.

---

## Low FPS

Try:

1. Set Graphics Quality to `MED` or `LOW`.
2. Close unnecessary browser tabs.
3. Enable hardware acceleration.
4. Use a modern Chromium-based browser.
5. Reduce the amount of active visual effects if you are modifying the game.

---

## Service Worker Cache Issues

The service worker uses a versioned cache and follows a network-first strategy for core game documents so updated builds can replace older cached versions.

If developing locally and an old build appears:

```text
DevTools → Application → Service Workers
```

and clear the site's stored data/cache.

---

# 📜 License

Add your project's license information here.

For example:

```text
MIT License
```

if the repository is intended to be released under the MIT License.

---

# 👨‍💻 Author

**Sam Wilson**

Built as a browser-based 3D driving/game development project.

---

# ⭐ Support the Project

If you enjoy **City Rush Car Simulator 3D**:

* ⭐ Star the repository
* 🍴 Fork the project
* 🐛 Report bugs
* 💡 Suggest new features
* 🔧 Submit improvements
* 📢 Share the game

---

# 🚗 Final

**City Rush Car Simulator 3D** is built to be more than a simple driving demo.

Whether you're:

🌲 exploring the forest,

🌊 splashing through the river,

🏁 battling AI racers,

🏙️ cruising through Toon City,

⭐ hunting collectibles,

💨 chaining drifts,

⚡ firing the Nitro,

or 💥 smashing through the environment...

there is always another route to take.

## 🚗 Drive. Drift. Explore. Race. Repeat.

**Welcome to City Rush.**

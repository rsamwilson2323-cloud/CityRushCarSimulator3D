import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

// Uses an installed Playwright or an explicitly provided package path.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const args = process.argv.slice(2);
const value = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const baseUrl = value('--url', 'http://127.0.0.1:8000');
const outDir = path.resolve(value('--out', 'scratch/toon-city-results'));
await fs.mkdir(outDir, { recursive: true });
const report = { checks: [], errors: [], states: {}, memory: [], metrics: {} };
const browser = await chromium.launch({ headless: !args.includes('--headed'), args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const observe = page => {
  page.on('pageerror', error => report.errors.push({ type: 'pageerror', message: error.message }));
  page.on('console', msg => { if (msg.type() === 'error') report.errors.push({ type: 'console', message: msg.text() }); });
};
async function check(name, fn) {
  try { const detail = await fn(); report.checks.push({ name, passed: true, detail }); }
  catch (error) { report.checks.push({ name, passed: false, error: error.stack || String(error) }); }
  console.log((report.checks.at(-1).passed ? 'PASS ' : 'FAIL ') + name);
}
const state = page => page.evaluate(() => ({
  mode: currentMode, paused: isPaused,
  player: { x: player.x, y: player.y, z: player.z, heading: player.heading, speed: player.speed, nitro: player.nitroFuel, grounded: player.isGrounded },
  renderer: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures, programs: renderer.info.programs?.length, dpr: renderer.getPixelRatio() },
  camera: CAMERA_MODES[cameraModeIndex],
  text: typeof window.render_game_to_text === 'function' ? JSON.parse(window.render_game_to_text()) : null,
  objects: activeWorldObjects.length,
  city: typeof toonCityWorld === 'undefined' || !toonCityWorld ? null : { keys: Object.keys(toonCityWorld), stats: toonCityWorld.stats || null },
  life: typeof toonCityLife === 'undefined' || !toonCityLife ? null : { keys: Object.keys(toonCityLife), stats: typeof toonCityLife.getStats === 'function' ? toonCityLife.getStats() : toonCityLife.stats || null }
}));
const step = (page, ms) => page.evaluate(async milliseconds => {
  assertHook();
  function assertHook() { if (typeof window.advanceTime !== 'function') throw new Error('window.advanceTime missing'); }
  await window.advanceTime(milliseconds);
}, ms);
async function keysFor(page, keyNames, ms) {
  for (const key of keyNames) await page.keyboard.down(key);
  await step(page, ms);
  for (const key of [...keyNames].reverse()) await page.keyboard.up(key);
}
const snap = (page, name) => page.screenshot({ path: path.join(outDir, name + '.png'), fullPage: true, timeout: 30000 });
const distance = (a, b) => Math.hypot(a.player.x - b.player.x, a.player.z - b.player.z);
const cityUrl = new URL(baseUrl);
cityUrl.searchParams.set('test', '1');
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
const page = await context.newPage();
observe(page);

try {
  await page.goto(cityUrl.href, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForFunction(() => typeof THREE !== 'undefined' && typeof currentMode !== 'undefined', null, { timeout: 30000 });
  await check('menu offers all three maps', async () => {
    for (const selector of ['#btn-mode-city', '#btn-mode-race', '#btn-mode-tooncity']) assert(await page.locator(selector).isVisible(), selector + ' should be visible');
    await snap(page, '01-menu-desktop');
  });
  await page.locator('#btn-gfx-low').click();
  await page.locator('#btn-mode-tooncity').click();
  await page.waitForFunction(() => currentMode === 'tooncity');
  await step(page, 100);
  await check('city entry, text state and render', async () => {
    const s = await state(page); report.states.entry = s;
    assert.equal(s.mode, 'tooncity'); assert.equal(s.paused, false); assert(s.city); assert(s.life);
    assert(s.text && s.text.mode === 'tooncity', 'JSON text should identify city');
    assert(s.renderer.calls > 0 && s.renderer.triangles > 0, 'renderer has city geometry');
    assert(await page.locator('#game-hud').isVisible()); assert(!(await page.locator('#main-menu').isVisible()));
    await snap(page, '02-city-spawn-desktop'); return s.renderer;
  });
  await check('acceleration changes player position and speed', async () => {
    const before = await state(page); await keysFor(page, ['w'], 650); const after = await state(page);
    assert(distance(before, after) > 2, 'forward should travel over 2 world units'); assert(after.player.speed > 0);
    report.states.forward = after; return { distance: distance(before, after), speed: after.player.speed };
  });
  await check('steering changes heading while driving', async () => {
    const before = await state(page); await keysFor(page, ['w', 'd'], 180); const after = await state(page);
    assert(Math.abs(after.player.heading - before.player.heading) > 0.02); return { before: before.player.heading, after: after.player.heading };
  });
  await check('nitro spends fuel while driving', async () => {
    const before = await state(page); await keysFor(page, ['w', 'Shift'], 500); const after = await state(page);
    assert(after.player.nitro < before.player.nitro); assert(Number.isFinite(after.player.speed));
    report.states.nitro = after; await snap(page, '03-driving-desktop'); return { before: before.player.nitro, after: after.player.nitro };
  });
  await check('pause holds simulation and resume continues', async () => {
    await page.keyboard.press('p'); const before = await state(page); assert.equal(before.paused, true);
    await keysFor(page, ['w'], 800); const held = await state(page); assert(distance(before, held) < 0.0001);
    await page.keyboard.press('p'); await keysFor(page, ['w'], 180); const after = await state(page);
    assert.equal(after.paused, false); assert(distance(held, after) > 0.1);
  });
  await check('reset recovers flipped vehicle and stops speed', async () => {
    await page.evaluate(() => { player.y = 8; player.roll = 2; player.pitch = 1; player.vy = -1; });
    await page.keyboard.press('r'); const s = await state(page);
    assert.equal(s.player.speed, 0); assert(s.player.y < 2); assert.equal(s.player.grounded, true); report.states.reset = s;
  });
  await check('camera cycle uses all four views', async () => {
    const modes = new Set(); for (let i = 0; i < 4; i++) { await page.keyboard.press('c'); await step(page, 30); modes.add((await state(page)).camera); }
    assert.equal(modes.size, 4);
  });
  await check('pause to menu then reenter clears pause and overlay', async () => {
    await page.keyboard.press('p'); await page.keyboard.press('Escape'); assert(await page.locator('#main-menu').isVisible());
    assert.equal((await state(page)).mode, null); assert(!(await page.locator('#pause-overlay').isVisible()));
    await page.locator('#btn-mode-tooncity').click(); await step(page, 50); assert.equal((await state(page)).paused, false);
  });
  await check('repeated city entries release world GPU resources', async () => {
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Escape'); await page.locator('#btn-mode-tooncity').click(); await step(page, 100);
      const s = await state(page); report.memory.push({ iteration: i, ...s.renderer });
    }
    const first = report.memory[0], last = report.memory.at(-1);
    assert(last.geometries <= first.geometries + 4, `geometry growth ${first.geometries} -> ${last.geometries}`);
    assert(last.textures <= first.textures + 2, `texture growth ${first.textures} -> ${last.textures}`);
    return report.memory;
  });
  await check('forest mode still starts and returns to city', async () => {
    await page.keyboard.press('Escape'); await page.locator('#btn-mode-city').click(); await step(page, 50);
    assert.equal((await state(page)).mode, 'forest'); await snap(page, '04-forest-regression');
    await page.keyboard.press('Escape'); await page.locator('#btn-mode-tooncity').click(); await step(page, 50); assert.equal((await state(page)).mode, 'tooncity');
  });
  await check('race countdown cannot leak into another mode', async () => {
    await page.keyboard.press('Escape'); await page.locator('#btn-mode-race').click(); await step(page, 50);
    assert.equal((await state(page)).mode, 'race'); await snap(page, '05-race-regression');
    await page.keyboard.press('Escape'); await page.locator('#btn-mode-tooncity').click(); await step(page, 4300);
    assert.equal((await state(page)).mode, 'tooncity'); assert(!(await page.locator('#countdown-banner').isVisible()));
  });
  await check('all graphics options render without errors', async () => {
    const details = [];
    for (const quality of ['low', 'med', 'high']) {
      await page.evaluate(q => setGraphicsQuality(q), quality); await step(page, 50); const s = await state(page);
      assert(s.renderer.calls > 0); details.push({ quality, ...s.renderer });
    }
    report.metrics.quality = details; await snap(page, '06-city-high-quality'); return details;
  });
  await check('traffic moves on streets and walkers stay on sidewalks', async () => {
    const detail = await page.evaluate(() => {
      const before = toonCityLife.vehicles.map(v => ({x:v.x,z:v.z}));
      const pBefore = toonCityLife.pedestrians.map(p => ({x:p.x,z:p.z}));
      for (let i = 0; i < 900; i++) stepGame(1/60);
      const moving = toonCityLife.vehicles.filter((v,i) => Math.hypot(v.x-before[i].x,v.z-before[i].z)>3).length;
      const walking = toonCityLife.pedestrians.filter((p,i) => Math.hypot(p.x-pBefore[i].x,p.z-pBefore[i].z)>1).length;
      const offRoad = toonCityLife.vehicles.filter(v => !toonCityWorld.roads.some(r => Math.abs(v.x-r)<12 || Math.abs(v.z-r)<12)).length;
      const offSidewalk = toonCityLife.pedestrians.filter(p => !toonCityWorld.blocks.some(b => {
        const x=Math.abs(p.x-b.x),z=Math.abs(p.z-b.z); return x<48 && z<48 && Math.max(x,z)>42;
      })).length;
      return {moving,walking,offRoad,offSidewalk};
    });
    assert(detail.moving >= 10); assert.equal(detail.walking,96); assert.equal(detail.offRoad,0); assert.equal(detail.offSidewalk,0); return detail;
  });
  await check('horn triggers nearby walker reactions', async () => {
    const reactions = await page.evaluate(() => { const p=toonCityLife.pedestrians[0]; player.reset(p.x+4,0,p.z,0); toonCityLife.honk(player); return toonCityLife.pedestrians.filter(p=>p.reaction>0).length; });
    assert(reactions>0);
  });
  await check('solid buildings, traffic and world edge stop the buggy', async () => {
    const result = await page.evaluate(() => {
      const c=toonCityWorld.colliders.find(c=>c.boxHalfX>10 && c.boxHeight>10);
      player.reset(c.position.x-c.boxHalfX-2,0,c.position.z,-Math.PI/2); player.speed=1; keys.forward=true;
      for(let i=0;i<30;i++) stepGame(1/60); keys.forward=false;
      const inside = Math.abs(player.x-c.position.x)<c.boxHalfX+1.3 && Math.abs(player.z-c.position.z)<c.boxHalfZ+1.3;
      const v=toonCityLife.vehicles[0]; player.reset(v.x,0,v.z,0); player.speed=1; const trafficHit=toonCityLife.resolvePlayer(player);
      player.reset(409,0,395,-Math.PI/2); player.speed=2; stepGame(1/60);
      return {inside,trafficHit,bounded: Math.abs(player.x)<=407 && Math.abs(player.z)<=407};
    });
    assert.equal(result.inside,false); assert(result.trafficHit); assert(result.bounded); return result;
  });
  await check('all sixteen stars are collectible and award completion', async () => {
    const result=await page.evaluate(()=>{
      for(const star of collectibleStars) { if(star.collected) continue; player.reset(star.position.x,0,star.position.z,0); stepGame(1/60); }
      return {found:collectedStarCount,hint:document.getElementById('city-hint').innerText};
    });
    assert.equal(result.found,16); assert(result.hint.includes('All 16')); return result;
  });
  await check('landmarks and waterfront render with scenery', async () => {
    await page.evaluate(()=>{ player.reset(35,0,108,0); camera.position.set(155,115,180); camera.lookAt(60,15,60); camera.updateMatrixWorld(); toonCityWorld.update(player,'high',camera); renderer.render(scene,camera); }); await snap(page,'11-central-square');
    await page.evaluate(()=>{ player.reset(380,0,90,Math.PI); cameraModeIndex=1; cameraZoom=1.5; updateCameraPosition(true); }); await step(page,100); await snap(page,'12-waterfront');
    const s=await state(page); assert(s.renderer.triangles>5000);
  });
  const mobile = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36' });
  const mp = await mobile.newPage(); observe(mp);
  await check('mobile landscape menu and touch acceleration', async () => {
    await mp.goto(cityUrl.href, { waitUntil: 'networkidle', timeout: 60000 }); await mp.locator('#btn-mode-tooncity').waitFor();
    await snap(mp, '07-menu-mobile-landscape'); await mp.locator('#btn-mode-tooncity').click(); await step(mp, 50);
    assert(await mp.locator('#mobile-controls').isVisible()); const before = await state(mp);
    const bounds = await mp.locator('#touch-gas').boundingBox(); assert(bounds);
    const session = await mobile.newCDPSession(mp);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
    await step(mp, 650); await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const after = await state(mp); assert(distance(before, after) > 2); report.states.mobile = after;
    await snap(mp, '08-city-mobile-landscape'); return after.renderer;
  });
  await check('portrait city and menu remain within viewport', async () => {
    await mp.setViewportSize({ width: 390, height: 844 }); await step(mp, 50); await snap(mp, '09-city-mobile-portrait');
    assert(await mp.locator('#btn-hud-menu').isVisible()); await mp.locator('#btn-hud-menu').click();
    await snap(mp, '10-menu-mobile-portrait');
    const menuCard = mp.locator('#btn-mode-tooncity'); await menuCard.scrollIntoViewIfNeeded(); assert(await menuCard.isVisible());
    const size = await mp.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert(size.scrollWidth <= size.width + 1, 'page should have no horizontal overflow');
  });
  await mobile.close();
  await check('no browser runtime or console errors', async () => assert.deepEqual(report.errors, []));
} catch (error) {
  report.checks.push({ name: 'fatal setup or navigation', passed: false, error: error.stack || String(error) });
  try { await snap(page, 'fatal'); } catch {}
} finally {
  await browser.close();
  await fs.writeFile(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
}
const failures = report.checks.filter(c => !c.passed);
console.log(JSON.stringify({ passed: report.checks.length - failures.length, failed: failures.length, failures, errors: report.errors, memory: report.memory, outDir }, null, 2));
process.exitCode = failures.length ? 1 : 0;


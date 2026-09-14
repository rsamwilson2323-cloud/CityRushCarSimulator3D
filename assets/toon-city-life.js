/* Cartoon Commons traffic and walkers. All animated pieces share 11 GPU batches. */
(function () {
    'use strict';

    window.createToonCityLife = function (THREE, scene, world, initialQuality) {
        const root = new THREE.Group();
        root.name = 'Cartoon Commons life';
        const roads = world.roads || [-360, -240, -120, 0, 120, 240, 360];
        const blocks = world.blocks || [];
        const vehicles = [];
        const pedestrians = [];
        const batches = [];
        const geometries = [];
        const materials = [];
        const stats = { vehicles: 42, pedestrians: 96, visibleVehicles: 0, visiblePedestrians: 0, drawCalls: 11 };
        const dummy = new THREE.Object3D();
        const actorMatrix = new THREE.Matrix4();
        const partMatrix = new THREE.Matrix4();
        const palette = [0xff765c, 0x40bbce, 0xffcf4f, 0x936fd4, 0x7cd19b, 0xf58fba, 0x4385d5, 0xf4f0dc];
        const paint = palette.map(c => new THREE.Color(c));
        const skins = [0xffd2a8, 0xd99970, 0x8b543e, 0xf2b892, 0x643f32].map(c => new THREE.Color(c));
        const hairs = [0x46332c, 0x211e28, 0xbd793d, 0xf5cf64, 0x70534d].map(c => new THREE.Color(c));
        const pants = [0x34506a, 0x595475, 0x42665b, 0x50433f].map(c => new THREE.Color(c));
        const white = new THREE.Color(0xfff8e9);
        const dark = new THREE.Color(0x24344b);
        const red = new THREE.Color(0xf74e46);
        const brakeRed = new THREE.Color(0xff9c82);
        const lamp = new THREE.Color(0xfff0a7);
        let elapsed = 0;
        let disposed = false;
        let quality = initialQuality || 'high';
        let lastPlayerX = null;
        let lastPlayerZ = null;
        let randomSeed = 736251;
        function random() {
            randomSeed = (Math.imul(randomSeed, 1664525) + 1013904223) >>> 0;
            return randomSeed / 4294967296;
        }
        function geometry(g) { geometries.push(g); return g; }
        function material(m) { materials.push(m); return m; }
        function roundedBox() {
            const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3);
            const pos = g.attributes.position;
            const radius = 0.19;
            for (let i = 0; i < pos.count; i++) {
                const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
                const cx = Math.max(-0.5 + radius, Math.min(0.5 - radius, x));
                const cy = Math.max(-0.5 + radius, Math.min(0.5 - radius, y));
                const cz = Math.max(-0.5 + radius, Math.min(0.5 - radius, z));
                const dx = x - cx, dy = y - cy, dz = z - cz;
                const scale = radius / (Math.hypot(dx, dy, dz) || 1);
                pos.setXYZ(i, cx + dx * scale, cy + dy * scale, cz + dz * scale);
            }
            g.computeVertexNormals();
            return geometry(g);
        }
        const round = roundedBox();
        const sphere = geometry(new THREE.SphereGeometry(1, 8, 6));
        const cap = geometry(new THREE.SphereGeometry(1, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.51));
        const cylinder = geometry(new THREE.CylinderGeometry(1, 1, 1, 10));
        const circle = geometry(new THREE.CircleGeometry(1, 12));
        const colored = material(new THREE.MeshLambertMaterial({ color: 0xffffff }));
        const glassMaterial = material(new THREE.MeshLambertMaterial({ color: 0x244761, emissive: 0x081422 }));
        const rubberMaterial = material(new THREE.MeshLambertMaterial({ color: 0x263044 }));
        const hubMaterial = material(new THREE.MeshLambertMaterial({ color: 0xffefd1 }));
        const lightMaterial = material(new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const shadowMaterial = material(new THREE.MeshBasicMaterial({ color: 0x243941, transparent: true, opacity: 0.17, depthWrite: false }));

        function batch(name, geo, mat, capacity, colors) {
            const mesh = new THREE.InstancedMesh(geo, mat, capacity);
            mesh.name = name;
            // r128 only knows the source geometry bounds, not the moving instances.
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            // r128 allocates instanceColor from mesh.count: allocate at capacity
            // before reducing the draw count, otherwise all colors have a zero-length buffer.
            if (colors) mesh.setColorAt(0, white);
            mesh.count = 0;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            root.add(mesh);
            const b = { mesh: mesh, count: 0, colors: !!colors };
            batches.push(b);
            return b;
        }
        const carBodies = batch('Candy car bodies and roofs', round, colored, 84, true);
        const carGlass = batch('Panoramic car windows', round, glassMaterial, 42, false);
        const wheels = batch('Traffic tires', cylinder, rubberMaterial, 168, false);
        const hubs = batch('Traffic wheel hubs', cylinder, hubMaterial, 168, false);
        const bumpers = batch('Traffic bumpers', round, hubMaterial, 84, false);
        const lights = batch('Traffic head and tail lamps', round, lightMaterial, 168, true);
        const clothes = batch('Walker clothes and shoes', round, colored, 96 * 12, true);
        const skin = batch('Walker heads hands and eyes', sphere, colored, 96 * 6, true);
        const hair = batch('Walker hair and hats', cap, colored, 96, true);
        const pupils = batch('Walker expressions', sphere, rubberMaterial, 96 * 2, false);
        const shadows = batch('Soft actor contact shadows', circle, shadowMaterial, 138, false);

        function actor(x, y, z, heading, size) {
            dummy.position.set(x, y, z);
            dummy.rotation.set(0, heading, 0);
            dummy.scale.setScalar(size || 1);
            dummy.updateMatrix();
            actorMatrix.copy(dummy.matrix);
        }
        function part(b, x, y, z, sx, sy, sz, color, rx, ry, rz) {
            dummy.position.set(x, y, z);
            dummy.rotation.set(rx || 0, ry || 0, rz || 0);
            dummy.scale.set(sx, sy, sz);
            dummy.updateMatrix();
            partMatrix.multiplyMatrices(actorMatrix, dummy.matrix);
            b.mesh.setMatrixAt(b.count, partMatrix);
            if (b.colors) b.mesh.setColorAt(b.count, color || white);
            b.count++;
        }

        // A clockwise rounded rectangle follows the right lane on every street.
        // Every corner stays inside its junction; no diagonal shortcut cuts a block.
        function makeLoop(minX, maxX, minZ, maxZ, radius) {
            const r = Math.min(radius, (maxX - minX) / 4, (maxZ - minZ) / 4);
            const w = maxX - minX - 2 * r;
            const h = maxZ - minZ - 2 * r;
            const turn = Math.PI * r / 2;
            const segments = [
                { x: minX + r, z: minZ, dx: 1, dz: 0, length: w },
                { x: maxX - r, z: minZ + r, angle: -Math.PI / 2, length: turn },
                { x: maxX, z: minZ + r, dx: 0, dz: 1, length: h },
                { x: maxX - r, z: maxZ - r, angle: 0, length: turn },
                { x: maxX - r, z: maxZ, dx: -1, dz: 0, length: w },
                { x: minX + r, z: maxZ - r, angle: Math.PI / 2, length: turn },
                { x: minX, z: maxZ - r, dx: 0, dz: -1, length: h },
                { x: minX + r, z: minZ + r, angle: Math.PI, length: turn }
            ];
            return { segments: segments, radius: r, length: 2 * (w + h) + 4 * turn };
        }
        function sample(loop, distance, target, direction) {
            let at = ((distance % loop.length) + loop.length) % loop.length;
            let segment = loop.segments[7];
            for (let i = 0; i < loop.segments.length; i++) {
                segment = loop.segments[i];
                if (at <= segment.length) break;
                at -= segment.length;
            }
            let dx, dz;
            if (segment.angle !== undefined) {
                const a = segment.angle + at / loop.radius;
                target.x = segment.x + Math.cos(a) * loop.radius;
                target.z = segment.z + Math.sin(a) * loop.radius;
                dx = -Math.sin(a); dz = Math.cos(a);
                target.turning = true;
            } else {
                target.x = segment.x + segment.dx * at;
                target.z = segment.z + segment.dz * at;
                dx = segment.dx; dz = segment.dz;
                target.turning = false;
            }
            const sign = direction || 1;
            target.forwardX = dx * sign;
            target.forwardZ = dz * sign;
            target.heading = Math.atan2(-dx * sign, -dz * sign);
        }

        const specifications = [
            [2, 4, 2, 4], [1, 3, 2, 4], [3, 5, 2, 4], [2, 4, 1, 3],
            [2, 4, 3, 5], [1, 5, 1, 5], [0, 2, 0, 3], [0, 2, 3, 6],
            [4, 6, 0, 3], [4, 6, 3, 6], [1, 4, 0, 2], [2, 5, 4, 6],
            [2, 3, 3, 4], [3, 4, 3, 4], [2, 3, 2, 3], [3, 4, 2, 3],
            [0, 3, 1, 4], [3, 6, 2, 5]
        ];
        for (let routeIndex = 0; routeIndex < specifications.length; routeIndex++) {
            const s = specifications[routeIndex];
            const loop = makeLoop(roads[s[0]] + 5, roads[s[1]] - 5, roads[s[2]] + 5, roads[s[3]] - 5, 8);
            const count = routeIndex < 6 ? 3 : 2;
            for (let j = 0; j < count; j++) {
                const v = {
                    id: vehicles.length, route: loop, distance: loop.length * (j + random() * 0.45) / count,
                    x: 0, z: 0, heading: 0, speed: 0, cruiseSpeed: 13 + random() * 8,
                    color: paint[vehicles.length % paint.length], pause: 0,
                    van: vehicles.length % 7 === 0, visible: true
                };
                sample(loop, v.distance, v);
                // Different circuits can share a street: don't spawn overlapping cars.
                for (let attempt = 0; attempt < 70; attempt++) {
                    if (!vehicles.some(other => Math.hypot(v.x - other.x, v.z - other.z) < 11)) break;
                    v.distance += 17;
                    sample(loop, v.distance, v);
                }
                vehicles.push(v);
            }
        }
        stats.vehicles = vehicles.length;

        for (let i = 0; i < 96 && blocks.length; i++) {
            const b = blocks[(i * 13) % blocks.length];
            const half = (b.half || 48) - 1.5;
            const loop = makeLoop(b.x - half, b.x + half, b.z - half, b.z + half, 3);
            const p = {
                id: i, route: loop, distance: random() * loop.length, direction: i % 3 ? 1 : -1,
                x: 0, z: 0, heading: 0, speed: 1.5 + random() * 1.1,
                phase: random() * Math.PI * 2, reaction: 0, reactionCooldown: 0,
                shirt: paint[i % paint.length], skin: skins[i % skins.length], hair: hairs[i % hairs.length],
                pants: pants[i % pants.length], hat: i % 4 === 0, size: 0.94 + random() * 0.2, visible: true
            };
            sample(loop, p.distance, p, p.direction);
            pedestrians.push(p);
        }
        stats.pedestrians = pedestrians.length;

        function level(q) {
            if (typeof q === 'string') return q.toLowerCase();
            return q && (q.level || q.preset || q.name || (q.low ? 'low' : 'high')) || 'high';
        }

        function signalLimit(v) {
            if (v.turning) return Infinity;
            const horizontal = Math.abs(v.forwardX) > 0.9;
            const position = horizontal ? v.x : v.z;
            const direction = horizontal ? v.forwardX : v.forwardZ;
            let ahead = Infinity;
            let crossing = 0;
            for (let i = 0; i < roads.length; i++) {
                const d = (roads[i] - position) * direction;
                if (d >= 14 && d < ahead) { ahead = d; crossing = i; }
            }
            if (ahead > 48) return Infinity;
            const otherPosition = horizontal ? v.z : v.x;
            let street = 0;
            for (let i = 1; i < roads.length; i++) {
                if (Math.abs(roads[i] - otherPosition) < Math.abs(roads[street] - otherPosition)) street = i;
            }
            const phase = (elapsed + ((crossing + street) % 3) * 2.3) % 22;
            const green = horizontal ? phase < 10 : phase >= 11 && phase < 21;
            return green ? Infinity : Math.max(0, ahead - 17);
        }

        function react(p, player, seconds) {
            if (p.reactionCooldown <= 0) {
                const away = (p.x - player.x) * p.forwardX + (p.z - player.z) * p.forwardZ;
                if (away < 0) p.direction *= -1;
                p.reactionCooldown = seconds + 1;
            }
            p.reaction = Math.max(p.reaction, seconds);
        }

        function advance(dt, player) {
            // Sense from the previous positions first, so yielding is independent of array order.
            for (let i = 0; i < vehicles.length; i++) {
                const v = vehicles[i];
                v.pause = Math.max(0, v.pause - dt);
                let gap = signalLimit(v);
                const sensor = 12 + v.speed * 1.45;
                if (player && (player.y || 0) < 3) {
                    const dx = player.x - v.x, dz = player.z - v.z;
                    const ahead = dx * v.forwardX + dz * v.forwardZ;
                    const side = Math.abs(dx * v.forwardZ - dz * v.forwardX);
                    if (ahead > -1 && ahead < sensor && side < 3.6) gap = Math.min(gap, Math.max(0, ahead - 7.8));
                }
                for (let j = 0; j < vehicles.length; j++) {
                    if (j === i) continue;
                    const other = vehicles[j];
                    const dx = other.x - v.x, dz = other.z - v.z;
                    if (Math.abs(dx) > sensor || Math.abs(dz) > sensor) continue;
                    const ahead = dx * v.forwardX + dz * v.forwardZ;
                    const side = Math.abs(dx * v.forwardZ - dz * v.forwardX);
                    if (ahead > 0.2 && ahead < sensor && side < 3.05) {
                        gap = Math.min(gap, Math.max(0, ahead - 7.5));
                    }
                    // Clear cars already in a junction before entering across their path.
                    const alignment = v.forwardX * other.forwardX + v.forwardZ * other.forwardZ;
                    if (Math.abs(alignment) < 0.45 && ahead > 0 && ahead < 11 && side < 8 && other.speed > 0.5) {
                        if (side < ahead || (Math.abs(side - ahead) < 1 && j < i)) gap = 0;
                    }
                }
                v.nextSpeed = v.pause > 0 ? 0 : Math.min(v.cruiseSpeed, Math.sqrt(2 * 15 * gap));
                v.maxAdvance = gap;
            }
            for (let i = 0; i < vehicles.length; i++) {
                const v = vehicles[i];
                const rate = v.nextSpeed < v.speed ? 27 : 5;
                v.speed += Math.max(-rate * dt, Math.min(rate * dt, v.nextSpeed - v.speed));
                const travel = Math.min(v.speed * dt, v.maxAdvance);
                if (travel < v.speed * dt) v.speed = travel / Math.max(dt, 0.001);
                v.distance = (v.distance + travel) % v.route.length;
                sample(v.route, v.distance, v);
            }
            for (let i = 0; i < pedestrians.length; i++) {
                const p = pedestrians[i];
                p.reaction = Math.max(0, p.reaction - dt);
                p.reactionCooldown = Math.max(0, p.reactionCooldown - dt);
                if (player) {
                    const d2 = (p.x - player.x) ** 2 + (p.z - player.z) ** 2;
                    if (d2 < 49 && (player.y || 0) < 3 && Math.abs(player.speed || 0) > 0.05) react(p, player, 1.6);
                }
                const pace = p.speed * (p.reaction > 0 ? 1.65 : 1);
                p.distance += p.direction * pace * dt;
                p.phase += pace * dt * 3.9;
                sample(p.route, p.distance, p, p.direction);
            }
        }

        function render(player) {
            for (let i = 0; i < batches.length; i++) batches[i].count = 0;
            const q = level(quality);
            const low = q === 'low' || q === 'performance';
            const medium = q === 'med' || q === 'medium' || q === 'balanced';
            const px = player ? player.x : 5, pz = player ? player.z : 65;
            const carRange = low ? 230 : medium ? 310 : 400;
            const pedRange = low ? 130 : medium ? 200 : 270;
            stats.visibleVehicles = 0;
            stats.visiblePedestrians = 0;
            for (let i = 0; i < vehicles.length; i++) {
                const v = vehicles[i];
                const d2 = (v.x - px) ** 2 + (v.z - pz) ** 2;
                v.visible = d2 < carRange * carRange && (!low || i % 3 !== 2 || d2 < 110 * 110);
                if (!v.visible) continue;
                stats.visibleVehicles++;
                const detail = d2 < (low ? 75 * 75 : 150 * 150);
                const cabinHeight = v.van ? 1.30 : 1.04;
                const cabinLength = v.van ? 2.9 : 2.28;
                actor(v.x, 0, v.z, v.heading);
                part(carBodies, 0, 0.88, 0, 2.68, 0.9, 5.15, v.color);
                part(carGlass, 0, 1.48 + (v.van ? 0.15 : 0), 0.35, 2.1, cabinHeight, cabinLength);
                part(carBodies, 0, 1.99 + (v.van ? 0.28 : 0), 0.38, 2.2, 0.21, cabinLength + 0.03, i % 3 === 0 ? white : v.color);
                for (let side = -1; side <= 1; side += 2) {
                    for (let end = -1; end <= 1; end += 2) {
                        part(wheels, side * 1.30, 0.57, end * 1.60, 0.51, 0.35, 0.51, null, 0, 0, Math.PI / 2);
                        if (detail) part(hubs, side * 1.50, 0.57, end * 1.60, 0.28, 0.035, 0.28, null, 0, 0, Math.PI / 2);
                    }
                    part(lights, side * 0.87, 1.0, -2.51, 0.49, 0.32, 0.16, lamp);
                    part(lights, side * 0.92, 1.02, 2.51, 0.38, 0.27, 0.14, v.speed < 2 ? brakeRed : red);
                }
                if (detail) {
                    part(bumpers, 0, 0.64, -2.54, 2.2, 0.22, 0.17);
                    part(bumpers, 0, 0.64, 2.54, 2.2, 0.22, 0.17);
                    part(shadows, 0, 0.055, 0, 1.8, 2.95, 1, null, -Math.PI / 2);
                }
            }
            for (let i = 0; i < pedestrians.length; i++) {
                const p = pedestrians[i];
                const d2 = (p.x - px) ** 2 + (p.z - pz) ** 2;
                p.visible = d2 < pedRange * pedRange && (!low || i % 3 !== 2 || d2 < 60 * 60);
                if (!p.visible) continue;
                stats.visiblePedestrians++;
                const detail = d2 < (low ? 55 * 55 : 105 * 105);
                const animated = d2 < (low ? 70 * 70 : 160 * 160);
                const swing = animated ? Math.sin(p.phase) * 0.48 : 0;
                const bounce = animated ? Math.abs(Math.sin(p.phase)) * 0.047 : 0;
                actor(p.x, 0.17, p.z, p.heading, p.size);
                part(clothes, 0, 1.23 + bounce, 0, 0.69, 0.79, 0.45, p.shirt);
                part(skin, 0, 1.94 + bounce, 0, 0.43, 0.47, 0.40, p.skin);
                part(hair, 0, 2.03 + bounce, 0.012, 0.45, 0.49, 0.43, p.hat ? p.shirt : p.hair);
                if (p.hat && detail) part(clothes, 0, 2.055 + bounce, -0.28, 0.70, 0.08, 0.55, p.shirt);
                for (let side = -1; side <= 1; side += 2) {
                    const leg = swing * side;
                    part(clothes, side * 0.19, 0.56, Math.sin(leg) * 0.22, 0.23, 0.71, 0.25, p.pants, leg);
                    part(clothes, side * 0.19, 0.20, Math.sin(leg) * 0.39 - 0.055, 0.28, 0.20, 0.41, dark, leg * 0.3);
                    if (detail || animated) {
                        const wave = p.reaction > 0 && side === 1;
                        const arm = wave ? -2.1 + Math.sin(elapsed * 13) * 0.15 : -swing * side * 0.75;
                        const ay = wave ? 1.56 : 1.24 + bounce;
                        part(clothes, side * 0.46, ay, -Math.sin(arm) * 0.13, 0.21, 0.58, 0.24, p.shirt, arm);
                        if (detail) part(skin, side * 0.46, ay - Math.cos(arm) * 0.29, -Math.sin(arm) * 0.42, 0.115, 0.13, 0.12, p.skin);
                    }
                    if (detail) {
                        part(skin, side * 0.15, 1.985 + bounce, -0.367, 0.104, 0.12, 0.062, white);
                        part(pupils, side * 0.15, 1.985 + bounce, -0.420, 0.048, 0.062, 0.029);
                    }
                }
                if (detail) {
                    part(skin, 0, 1.88 + bounce, -0.40, 0.085, 0.09, 0.115, p.skin);
                    part(shadows, 0, -0.108, 0, 0.64, 0.48, 1, null, -Math.PI / 2);
                }
            }
            for (let i = 0; i < batches.length; i++) {
                const b = batches[i];
                b.mesh.count = b.count;
                b.mesh.instanceMatrix.needsUpdate = true;
                if (b.mesh.instanceColor) b.mesh.instanceColor.needsUpdate = true;
            }
        }

        function update(dt, player, nextQuality) {
            if (disposed) return;
            if (nextQuality !== undefined) quality = nextQuality;
            const step = Math.max(0, Math.min(Number.isFinite(dt) ? dt : 0, 0.1));
            elapsed += step;
            // Simulation continues for distant actors, including those hidden by quality settings.
            advance(step, player);
            render(player);
        }

        function honk(player) {
            if (!player || disposed) return 0;
            let reactions = 0;
            for (let i = 0; i < pedestrians.length; i++) {
                const p = pedestrians[i];
                if ((p.x - player.x) ** 2 + (p.z - player.z) ** 2 < 32 * 32) {
                    react(p, player, 2.1);
                    reactions++;
                }
            }
            return reactions;
        }

        // Call after player movement and before copying player.x/z to the player mesh.
        // This sweeps the player's circle against nearby traffic boxes, even on low quality.
        function resolvePlayer(player) {
            if (!player || disposed) return false;
            if ((player.y || 0) > 2.7) { lastPlayerX = player.x; lastPlayerZ = player.z; return false; }
            const startX = lastPlayerX === null ? player.x : lastPlayerX;
            const startZ = lastPlayerZ === null ? player.z : lastPlayerZ;
            const dx = player.x - startX, dz = player.z - startZ;
            // Treat a reset/teleport as a new starting point, not a trip through the whole map.
            const steps = Math.hypot(dx, dz) < 35 ? Math.min(24, Math.max(1, Math.ceil(Math.hypot(dx, dz) / 1.2))) : 1;
            let hit = false;
            for (let step = 1; step <= steps && !hit; step++) {
                let x = steps === 1 ? player.x : startX + dx * step / steps;
                let z = steps === 1 ? player.z : startZ + dz * step / steps;
                for (let i = 0; i < vehicles.length; i++) {
                    const v = vehicles[i];
                    const ox = x - v.x, oz = z - v.z;
                    if (Math.abs(ox) > 6 || Math.abs(oz) > 6) continue;
                    const c = Math.cos(v.heading), s = Math.sin(v.heading);
                    const lx = c * ox - s * oz, lz = s * ox + c * oz;
                    const nearestX = Math.max(-1.42, Math.min(1.42, lx));
                    const nearestZ = Math.max(-2.64, Math.min(2.64, lz));
                    let nx = lx - nearestX, nz = lz - nearestZ;
                    let distance = Math.hypot(nx, nz);
                    const radius = 1.65;
                    if (distance >= radius) continue;
                    let correction = radius - distance + 0.025;
                    if (distance < 0.0001) {
                        if (1.42 - Math.abs(lx) < 2.64 - Math.abs(lz)) {
                            nx = lx >= 0 ? 1 : -1; nz = 0;
                            correction = radius + 1.42 - Math.abs(lx) + 0.025;
                        } else {
                            nx = 0; nz = lz >= 0 ? 1 : -1;
                            correction = radius + 2.64 - Math.abs(lz) + 0.025;
                        }
                        distance = 1;
                    }
                    nx /= distance; nz /= distance;
                    x += (c * nx + s * nz) * correction;
                    z += (-s * nx + c * nz) * correction;
                    player.x = x; player.z = z;
                    player.speed *= 0.22;
                    v.speed = 0; v.pause = 0.65;
                    hit = true;
                    break;
                }
            }
            lastPlayerX = player.x; lastPlayerZ = player.z;
            return hit;
        }

        function dispose() {
            if (disposed) return;
            disposed = true;
            if (root.parent) root.parent.remove(root);
            for (let i = 0; i < batches.length; i++) {
                if (batches[i].mesh.dispose) batches[i].mesh.dispose();
            }
            for (let i = 0; i < geometries.length; i++) geometries[i].dispose();
            for (let i = 0; i < materials.length; i++) materials[i].dispose();
            root.clear();
        }

        render({ x: 5, z: 65 });
        return { root: root, vehicles: vehicles, pedestrians: pedestrians, update: update, honk: honk, resolvePlayer: resolvePlayer, dispose: dispose, stats: stats };
    };
}());

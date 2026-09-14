/* A hand-composed toy city, built from shared, spatially batched geometry. */
(function () {
    'use strict';

    window.createToonCityWorld = function (THREE, scene) {
        const root = new THREE.Group();
        root.name = 'Sunbeam City';
        const roads = [-360, -240, -120, 0, 120, 240, 360];
        const blocks = [], colliders = [], chunks = new Map();
        const bounds = 410;
        const geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            sphere: new THREE.SphereGeometry(0.5, 8, 6),
            cylinder: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
            cone: new THREE.ConeGeometry(0.5, 1, 8)
        };
        const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const ownedGeometries = Object.values(geometries);
        const ownedMaterials = [material], ownedTextures = [];
        const color = new THREE.Color();
        const transform = new THREE.Object3D();
        let instanceCount = 0, buildingCount = 0, treeCount = 0;
        let disposed = false;
        const C = {
            cream: 0xfff2d7, curb: 0xf6e2c4, pavement: 0xe9d9be,
            asphalt: 0x536777, roadLine: 0xfff0b4, grass: 0x9ad478,
            dark: 0x37566a, window: 0x4d91a6, windowLight: 0xb8e3dc,
            wood: 0xa76c49, trunk: 0x957052, leaf: 0x6dc383,
            coral: 0xed8c76, pink: 0xecacc1, yellow: 0xf4cc72,
            mint: 0x8dcdb6, blue: 0x8abacd, lavender: 0xb4a6d3
        };
        function random(n) {
            const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
            return x - Math.floor(x);
        }
        function chunkAt(x, z) {
            const ix = Math.floor((x + 420) / 120);
            const iz = Math.floor((z + 420) / 120);
            const key = ix + ':' + iz;
            if (!chunks.has(key)) {
                chunks.set(key, { x: ix * 120 - 360, z: iz * 120 - 360,
                    batches: {}, signs: [], group: new THREE.Group() });
            }
            return chunks.get(key);
        }
        function shape(type, x, y, z, sx, sy, sz, tint, rx, ry, rz) {
            const ch = chunkAt(x, z);
            (ch.batches[type] || (ch.batches[type] = [])).push(
                [x, y, z, sx, sy, sz, tint, rx || 0, ry || 0, rz || 0]);
            instanceCount++;
        }
        function box(x, y, z, w, h, d, tint, ry) {
            shape('box', x, y, z, w, h, d, tint, 0, ry || 0, 0);
        }
        function sphere(x, y, z, w, h, d, tint) {
            shape('sphere', x, y, z, w, h, d, tint);
        }
        function cylinder(x, y, z, diameter, h, tint) {
            shape('cylinder', x, y, z, diameter, h, diameter, tint);
        }
        function solid(x, z, w, d, h) {
            colliders.push({ position: { x: x, y: 0, z: z }, isBox: true,
                boxHalfX: w / 2, boxHalfZ: d / 2, boxHeight: h });
        }

        // One texture and one merged label mesh per chunk, regardless of shop count.
        const labels = ['SUNBEAM CITY', 'SCOOPS', 'CORNER CAFE', 'BLOOM & CO.',
            'THE BOOK NOOK', 'PIZZA CLUB', 'HAPPY MART', 'SODA POP',
            'CLOUD NINE', 'GOOD MORNING', 'TOY BOX', 'BAKERY',
            'ARCADE', 'CITY POST', 'PAWS & CO.', 'FRESH MARKET',
            'CLOCK', 'SUNBEAM PARK', 'HARBOR WALK', 'CENTRAL SQUARE',
            'SUNSHINE SCHOOL', 'CITY HALL', 'POOL CLUB', 'STAR CINEMA'];
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = 1024;
        atlasCanvas.height = 1024;
        const context = atlasCanvas.getContext('2d');
        context.fillStyle = '#fff3db';
        context.fillRect(0, 0, 1024, 1024);
        const labelColors = ['#327a83', '#da6d87', '#ce764d', '#59966b', '#667ea3', '#ca6451'];
        labels.forEach(function (name, i) {
            const x = (i % 4) * 256, y = Math.floor(i / 4) * 128;
            context.fillStyle = i === 16 ? '#fff4da' : labelColors[i % labelColors.length];
            context.fillRect(x + 3, y + 3, 250, 122);
            context.strokeStyle = '#fff3db';
            context.lineWidth = 3;
            context.strokeRect(x + 10, y + 10, 236, 108);
            if (i === 16) {
                context.fillStyle = '#fff4da';
                context.fillRect(x, y, 256, 128);
                context.strokeStyle = '#385970';
                context.lineWidth = 4;
                context.beginPath();
                context.arc(x + 128, y + 64, 54, 0, Math.PI * 2);
                context.stroke();
                for (let h = 0; h < 12; h++) {
                    const a = h * Math.PI / 6;
                    context.beginPath();
                    context.moveTo(x + 128 + Math.sin(a) * 44, y + 64 - Math.cos(a) * 44);
                    context.lineTo(x + 128 + Math.sin(a) * 49, y + 64 - Math.cos(a) * 49);
                    context.stroke();
                }
                context.lineWidth = 6;
                context.beginPath();
                context.moveTo(x + 105, y + 44);
                context.lineTo(x + 128, y + 64);
                context.lineTo(x + 147, y + 33);
                context.stroke();
            } else {
                context.fillStyle = '#fff5df';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                const size = name.length > 15 ? 22 : name.length > 11 ? 25 : 32;
                context.font = '900 ' + size + 'px Trebuchet MS, Arial, sans-serif';
                context.fillText(name, x + 128, y + 60, 222);
                context.font = 'bold 11px Arial, sans-serif';
                context.fillText(i < 16 ? 'A LITTLE EVERYDAY MAGIC' : 'WELCOME • TAKE THE SCENIC ROUTE', x + 128, y + 94, 215);
            }
        });
        const atlas = new THREE.CanvasTexture(atlasCanvas);
        atlas.encoding = THREE.sRGBEncoding;
        atlas.anisotropy = 2;
        ownedTextures.push(atlas);
        const signMaterial = new THREE.MeshLambertMaterial({ map: atlas, side: THREE.DoubleSide });
        ownedMaterials.push(signMaterial);
        function sign(x, y, z, w, h, id, angle) {
            chunkAt(x, z).signs.push({ x: x, y: y, z: z, w: w, h: h, id: id, angle: angle || 0 });
        }

        function tree(x, z, size, seed) {
            const s = size || 1;
            cylinder(x, 2.8 * s, z, 0.85 * s, 5.6 * s, C.trunk);
            const leaf = [0x66bb7c, 0x83c970, 0x59afa0, 0xb2cd6f][Math.floor(random(seed) * 4)];
            sphere(x, 7 * s, z, 7.6 * s, 8 * s, 7.4 * s, leaf);
            sphere(x - 2 * s, 6.2 * s, z + 0.8 * s, 5 * s, 5.6 * s, 5 * s, leaf);
            sphere(x + 1.9 * s, 7.7 * s, z - 0.5 * s, 4.4 * s, 5 * s, 4.7 * s, leaf);
            solid(x, z, 0.9 * s, 0.9 * s, 5.6 * s);
            treeCount++;
        }
        function flowerbed(x, z, w, d, seed) {
            box(x, 0.36, z, w, 0.45, d, C.cream);
            box(x, 0.65, z, w - 0.4, 0.25, d - 0.4, 0x63995f);
            const count = Math.max(3, Math.floor(w / 1.5));
            for (let i = 0; i < count; i++) {
                const px = x - w / 2 + (i + 0.5) * w / count;
                sphere(px, 1.0, z, 1.1, 0.7, 1.1, [C.yellow, C.coral, C.pink][(i + seed) % 3]);
            }
        }
        function bench(x, z, angle) {
            const ca = Math.cos(angle || 0), sa = Math.sin(angle || 0);
            function part(dx, y, dz, w, h, d, tint) {
                box(x + dx * ca + dz * sa, y, z - dx * sa + dz * ca, w, h, d, tint, angle || 0);
            }
            part(0, 1.2, 0, 4.5, 0.25, 1.4, C.wood);
            part(0, 2.05, 0.6, 4.5, 1.25, 0.2, C.wood);
            part(-1.6, 0.65, 0, 0.25, 1.2, 1.4, C.dark);
            part(1.6, 0.65, 0, 0.25, 1.2, 1.4, C.dark);
        }
        function lamp(x, z) {
            cylinder(x, 3.7, z, 0.23, 7.2, C.dark);
            cylinder(x, 0.6, z, 0.65, 1.0, C.dark);
            sphere(x, 7.55, z, 1.25, 1.35, 1.25, 0xffecc1);
            shape('cone', x, 8.35, z, 1.65, 0.6, 1.65, C.dark);
        }

        function building(x, z, w, d, h, tint, id, frontage, roofStyle) {
            buildingCount++;
            solid(x, z, w, d, h + 0.6);
            box(x, h / 2 + 0.2, z, w, h, d, tint);
            box(x, 0.9, z, w + 0.6, 1.4, d + 0.6, C.cream);
            box(x, h + 0.3, z, w + 1.1, 0.7, d + 1.1, C.cream);
            box(x, h + 0.9, z, w - 0.8, 0.6, d - 0.8, 0x7c8b8d);
            const floors = Math.max(1, Math.floor((h - 7) / 5));
            const cols = Math.max(2, Math.floor(w / 5.5));
            for (let f = 0; f < floors; f++) {
                const wy = 8.2 + f * 5;
                if (wy + 1.5 > h) break;
                for (let c = 0; c < cols; c++) {
                    const wx = x + (c - (cols - 1) / 2) * (w - 5) / Math.max(1, cols - 1);
                    for (let side = -1; side <= 1; side += 2) {
                        const wz = z + side * (d / 2 + 0.04);
                        box(wx, wy, wz, 3.0, 3.4, 0.2, C.cream);
                        box(wx, wy + 0.05, wz + side * 0.12, 2.5, 2.9, 0.15, C.window);
                        box(wx - 0.65, wy + 0.5, wz + side * 0.22, 0.7, 1.5, 0.06, C.windowLight);
                        box(wx, wy - 1.8, wz, 3.5, 0.25, 0.6, C.cream);
                    }
                }
                const sideCols = Math.max(2, Math.floor(d / 7));
                for (let c = 0; c < sideCols; c++) {
                    const wz = z + (c - (sideCols - 1) / 2) * (d - 5) / Math.max(1, sideCols - 1);
                    for (let side = -1; side <= 1; side += 2) {
                        const wx = x + side * (w / 2 + 0.1);
                        box(wx, wy, wz, 0.2, 3.4, 3.1, C.cream);
                        box(wx + side * 0.12, wy, wz, 0.1, 2.8, 2.5, C.window);
                        box(wx + side * 0.18, wy + 0.6, wz - 0.7, 0.06, 1.4, 0.6, C.windowLight);
                    }
                }
            }
            const front = frontage || 1;
            const faceZ = z + front * (d / 2 + 0.15);
            const shopTint = [C.coral, C.mint, C.yellow, C.pink, C.blue][id % 5];
            box(x, 3.0, faceZ, w - 3, 4.5, 0.3, C.dark);
            const glassWidth = (w - 6) / 2;
            for (let side = -1; side <= 1; side += 2) {
                box(x + side * (glassWidth / 2 + 1.3), 3.15, faceZ + front * 0.2, glassWidth - 0.4, 3.4, 0.1, C.windowLight);
            }
            box(x, 2.7, faceZ + front * 0.23, 2.0, 4.0, 0.15, C.window);
            box(x + 0.65, 2.65, faceZ + front * 0.36, 0.12, 0.5, 0.13, C.yellow);
            const awningW = w - 1.8;
            box(x, 5.6, faceZ + front * 1.1, awningW, 0.35, 2.4, C.cream);
            const stripes = Math.max(4, Math.floor(awningW / 1.6));
            for (let i = 0; i < stripes; i++) {
                const stripeX = x - awningW / 2 + (i + 0.5) * awningW / stripes;
                box(stripeX, 5.82, faceZ + front * 1.1, awningW / stripes * 0.92, 0.14, 2.4, i % 2 ? C.cream : shopTint);
                box(stripeX, 5.4, faceZ + front * 2.2, awningW / stripes * 0.92, 0.6, 0.16, i % 2 ? C.cream : shopTint);
            }
            sign(x, 6.65, faceZ + front * 0.22, Math.min(w - 2.8, 14), 1.85, id % 16, front === -1 ? Math.PI : 0);
            if (roofStyle === 1) {
                // Tiny roof gardens and pastel service rooms break the skyline.
                box(x - w * 0.18, h + 1.25, z, w * 0.35, 0.4, d * 0.42, 0x74b87a);
                sphere(x - w * 0.18, h + 2.8, z, 4.5, 3.0, 4.5, C.leaf);
                box(x + w * 0.25, h + 2.1, z, 3.3, 2.2, 3.3, tint);
            } else if (roofStyle === 2) {
                cylinder(x, h + 2.2, z, 4.8, 3, shopTint);
                shape('cone', x, h + 4.2, z, 6, 1.5, 6, C.cream);
            } else if (roofStyle === 3) {
                for (let i = -1; i <= 1; i++) box(x + i * w * 0.27, h + 1.7, z + d * 0.3, w * 0.2, 1.8, 0.8, tint);
            }
        }

        function park(x, z, seed, isPool) {
            box(x, 0.25, z, 85, 0.16, 85, 0x9bd27b);
            box(x, 0.37, z, 8, 0.1, 87, 0xf4dfbb);
            box(x, 0.38, z, 87, 0.1, 8, 0xf4dfbb);
            if (isPool) {
                box(x, 0.5, z, 33, 0.4, 23, C.cream);
                box(x, 0.72, z, 29, 0.1, 19, 0x76d5dc);
                for (let i = -2; i <= 2; i++) box(x + i * 5, 0.79, z, 0.2, 0.04, 18, 0xb6f1e7);
                for (let i = -1; i <= 1; i++) {
                    box(x + i * 11, 0.8, z + 18, 3, 0.8, 7, C.cream);
                    cylinder(x + i * 11, 3.0, z + 23, 0.2, 5.5, C.wood);
                    shape('cone', x + i * 11, 5.8, z + 23, 9, 2.5, 9, i % 2 ? C.yellow : C.coral);
                }
            } else {
                cylinder(x, 0.65, z, 18, 0.8, C.cream);
                cylinder(x, 1.1, z, 15.8, 0.12, 0x6dd0d4);
                cylinder(x, 2.0, z, 3.5, 2.5, C.cream);
                cylinder(x, 3.35, z, 8, 0.5, C.cream);
                cylinder(x, 3.63, z, 6.8, 0.12, 0x88dde0);
                sphere(x, 4.5, z, 2.0, 1.9, 2.0, C.yellow);
                solid(x, z, 16.5, 16.5, 1.25);
            }
            for (let dx = -1; dx <= 1; dx += 2) {
                for (let dz = -1; dz <= 1; dz += 2) {
                    tree(x + dx * 29, z + dz * 28, 1.3 + random(seed + dx + dz) * 0.3, seed + dx * 4 + dz);
                    tree(x + dx * 15, z + dz * 35, 0.85, seed + dx + dz * 3);
                    flowerbed(x + dx * 27, z + dz * 15, 11, 3, seed);
                }
            }
            bench(x - 13, z - 21, 0);
            bench(x + 13, z + 21, Math.PI);
            bench(x - 21, z + 12, -Math.PI / 2);
            bench(x + 21, z - 12, Math.PI / 2);
            sign(x - 20, 2.2, z - 42, 9, 2.7, isPool ? 22 : 17, Math.PI);
            box(x - 23.5, 1.3, z - 42, 0.3, 2.7, 0.3, C.wood);
            box(x - 16.5, 1.3, z - 42, 0.3, 2.7, 0.3, C.wood);
        }

        // Ground, straight boulevards and restrained road markings keep navigation clear.
        box(-28, -0.35, 0, 844, 0.55, 856, 0xb5d58a);
        box(474, -0.4, 0, 174, 0.4, 910, 0x76cdd5);
        for (let r = 0; r < roads.length; r++) {
            const v = roads[r];
            // Short road slabs share the same visibility chunks as nearby architecture.
            for (let p = -390; p < 390; p += 60) {
                box(v, -0.015, p + 30, 24, 0.035, 60, C.asphalt);
                box(p + 30, -0.01, v, 60, 0.035, 24, C.asphalt);
            }
            for (let p = -384; p <= 384; p += 12) {
                if (roads.some(function (cross) { return Math.abs(cross - p) < 17; })) continue;
                box(v, 0.024, p, 0.28, 0.035, 5.0, C.roadLine);
                box(p, 0.027, v, 5.0, 0.035, 0.28, C.roadLine);
            }
            for (let s = 0; s < roads.length; s++) {
                const cross = roads[s];
                for (let stripe = -4; stripe <= 4; stripe++) {
                    const t = stripe * 2;
                    box(v + t, 0.035, cross - 15.5, 1.1, 0.035, 4.6, C.cream);
                    box(v + t, 0.035, cross + 15.5, 1.1, 0.035, 4.6, C.cream);
                    box(v - 15.5, 0.039, cross + t, 4.6, 0.035, 1.1, C.cream);
                    box(v + 15.5, 0.039, cross + t, 4.6, 0.035, 1.1, C.cream);
                }
            }
        }

        const palettes = [
            [C.coral, C.yellow, C.mint, C.pink],
            [C.blue, C.lavender, C.mint, C.yellow],
            [C.yellow, C.coral, C.pink, C.mint],
            [C.mint, C.blue, C.yellow, C.lavender]
        ];
        const parkKeys = new Set(['0:0', '0:3', '1:1', '1:4', '2:5', '3:1', '4:3', '5:0', '5:4']);
        for (let ix = 0; ix < 6; ix++) {
            for (let iz = 0; iz < 6; iz++) {
                const x = -300 + ix * 120, z = -300 + iz * 120;
                const seed = ix * 19 + iz * 7 + 3;
                const plaza = ix === 3 && iz === 3;
                const green = parkKeys.has(ix + ':' + iz);
                blocks.push({ x: x, z: z, half: 48, park: green || plaza });
                box(x, 0.08, z, 96, 0.2, 96, C.pavement);
                // A continuous pale curb reads clearly even with shadows disabled.
                box(x - 47.55, 0.22, z, 0.9, 0.1, 96, C.curb);
                box(x + 47.55, 0.22, z, 0.9, 0.1, 96, C.curb);
                box(x, 0.22, z - 47.55, 95, 0.1, 0.9, C.curb);
                box(x, 0.22, z + 47.55, 95, 0.1, 0.9, C.curb);
                lamp(x - 44, z - 40);
                lamp(x + 44, z + 40);
                if (plaza) continue;
                if (green) {
                    park(x, z, seed, ix === 5 && iz === 4);
                } else {
                    box(x, 0.25, z, 82, 0.1, 82, 0xa9cf88);
                    const palette = palettes[Math.floor(ix / 2) + (iz > 2 ? 1 : 0)];
                    const townhouses = (ix + iz) % 5 === 0;
                    const cols = townhouses ? 3 : 2;
                    for (let row = 0; row < 2; row++) {
                        for (let col = 0; col < cols; col++) {
                            const bx = x + (col - (cols - 1) / 2) * (townhouses ? 26 : 43);
                            const bz = z + (row === 0 ? -24 : 24);
                            const w = townhouses ? 22 : 30 + random(seed + col) * 5;
                            const d = 26 + random(seed + row + col * 3) * 5;
                            const h = townhouses ? 15 + col * 3 : 18 + Math.floor(random(seed + col * 5 + row * 13) * 4) * 5;
                            building(bx, bz, w, d, h, palette[(col + row + seed) % 4], seed + row * 3 + col, row === 0 ? -1 : 1, (seed + row + col) % 4);
                        }
                    }
                    tree(x, z, 0.9, seed);
                    tree(x - 39, z, 0.9, seed + 5);
                    tree(x + 39, z, 0.9, seed + 7);
                    flowerbed(x - 11, z, 9, 3, seed);
                    flowerbed(x + 11, z, 9, 3, seed + 1);
                    bench(x, z + 8, 0);
                    // Mailbox and planters give the ground floor a human scale.
                    box(x + 41, 1.1, z - 13, 1.3, 1.8, 1.1, C.blue);
                    box(x + 41, 1.65, z - 13.57, 0.9, 0.12, 0.08, C.dark);
                }
            }
        }

        // Central square: a clock tower with four readable faces and a golden roof.
        const tx = 60, tz = 60;
        box(tx, 0.27, tz, 84, 0.1, 84, 0xf2d7b3);
        for (let i = -3; i <= 3; i++) {
            box(tx + i * 10, 0.335, tz, 0.13, 0.035, 82, 0xe0bd98);
            box(tx, 0.34, tz + i * 10, 82, 0.035, 0.13, 0xe0bd98);
        }
        cylinder(tx, 0.75, tz, 23, 0.9, C.cream);
        box(tx, 17, tz, 11, 33, 11, C.coral);
        solid(tx, tz, 13, 13, 49);
        for (let cornerX = -1; cornerX <= 1; cornerX += 2) {
            for (let cornerZ = -1; cornerZ <= 1; cornerZ += 2) box(tx + cornerX * 5.2, 17, tz + cornerZ * 5.2, 0.7, 33, 0.7, C.cream);
        }
        box(tx, 8.5, tz, 12.5, 0.7, 12.5, C.cream);
        box(tx, 25, tz, 12.5, 1.2, 12.5, C.cream);
        box(tx, 33.8, tz, 14, 1.5, 14, C.cream);
        box(tx, 38.5, tz, 12.5, 8, 12.5, C.yellow);
        for (let side = 0; side < 4; side++) {
            const a = side * Math.PI / 2;
            sign(tx + Math.sin(a) * 6.31, 38.8, tz + Math.cos(a) * 6.31, 10.5, 7.0, 16, a);
            box(tx + Math.sin(a) * 5.6, 18, tz + Math.cos(a) * 5.6, side % 2 ? 0.3 : 3, 8, side % 2 ? 3 : 0.3, C.window);
        }
        box(tx, 43.1, tz, 14, 0.8, 14, C.cream);
        shape('cone', tx, 48.0, tz, 20, 9, 20, 0xd79061, 0, Math.PI / 4, 0);
        cylinder(tx, 54, tz, 0.28, 4.0, C.dark);
        sphere(tx, 55.9, tz, 1.2, 1.2, 1.2, C.yellow);
        sign(tx, 6.3, tz - 5.57, 9.5, 2.7, 19, Math.PI);
        for (let dx = -1; dx <= 1; dx += 2) {
            for (let dz = -1; dz <= 1; dz += 2) {
                tree(tx + dx * 32, tz + dz * 32, 1.3, dx * 9 + dz + 30);
                flowerbed(tx + dx * 30, tz + dz * 20, 13, 4, 2);
                bench(tx + dx * 18, tz + dz * 31, dz < 0 ? 0 : Math.PI);
            }
        }
        // Cafe tables, chairs and broad candy-colored parasols on the square.
        for (let i = 0; i < 3; i++) {
            const x = tx - 30, z = tz - 13 + i * 14;
            cylinder(x, 1.6, z, 3.8, 0.3, C.cream);
            cylinder(x, 0.85, z, 0.4, 1.6, C.dark);
            cylinder(x, 3.3, z, 0.2, 6.0, C.wood);
            shape('cone', x, 6.3, z, 8.8, 2, 8.8, [C.pink, C.mint, C.yellow][i]);
            for (let side = -1; side <= 1; side += 2) {
                box(x + side * 3.2, 0.9, z, 1.6, 0.4, 1.6, C.coral);
                box(x + side * 3.8, 1.7, z, 0.2, 1.7, 1.6, C.coral);
            }
        }

        // Eastern harbor, with a safe promenade and distant candy-colored sailboats.
        for (let z = -390; z < 390; z += 30) {
            box(383, 0.12, z + 15, 20, 0.3, 30, 0xebd2ac);
            box(394, 0.45, z + 15, 2, 1.1, 30, C.cream);
            box(394, 2.1, z + 15, 0.25, 0.2, 30, C.dark);
            for (let post = 0; post < 3; post++) cylinder(394, 1.5, z + post * 10, 0.3, 2.5, C.dark);
            if ((z + 390) % 60 === 0) {
                lamp(376, z + 16);
                bench(387, z + 16, Math.PI / 2);
                tree(378, z + 1, 0.8, z + 420);
            }
            box(417, -0.14, z + 7, 18, 0.035, 0.22, 0xb3e6de);
            box(447, -0.14, z + 19, 24, 0.035, 0.18, 0xb3e6de);
        }
        solid(394, 0, 2, 800, 2.25);
        sign(389, 5.5, 48, 15, 3, 18, -Math.PI / 2);
        box(389, 2.9, 42, 0.25, 5.8, 0.25, C.dark);
        box(389, 2.9, 54, 0.25, 5.8, 0.25, C.dark);
        for (let boat = 0; boat < 5; boat++) {
            const bx = 425 + boat % 2 * 22, bz = -275 + boat * 131;
            sphere(bx, 0.1, bz, 7, 2.1, 17, [C.coral, C.yellow, C.blue][boat % 3]);
            cylinder(bx, 5.2, bz, 0.22, 11, C.cream);
            shape('cone', bx, 6, bz, 8.8, 9, 0.2, C.cream, 0, 0, -0.22);
            shape('cone', bx + 1.5, 4.8, bz, 5.5, 7, 0.2, C.pink, 0, 0, 0.2);
        }
        // Soft green hills form a toy-set backdrop without expensive sky geometry.
        for (let i = 0; i < 10; i++) {
            const v = -400 + i * 88;
            sphere(v, -5, -453, 120, 58 + random(i) * 35, 96, i % 2 ? 0x93bc8c : 0xa5ca92);
            sphere(v, -5, 453, 120, 58 + random(i + 12) * 35, 96, i % 2 ? 0x93bc8c : 0xa5ca92);
            if (i < 9) sphere(-453, -5, v, 96, 55 + random(i + 7) * 25, 120, 0x9ac58b);
        }

        function buildSignMesh(ch) {
            if (!ch.signs.length) return;
            const positions = [], uvs = [], indices = [];
            ch.signs.forEach(function (s, i) {
                const c = Math.cos(s.angle), sn = Math.sin(s.angle);
                const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
                corners.forEach(function (corner) {
                    positions.push(s.x + corner[0] * s.w * c, s.y + corner[1] * s.h, s.z - corner[0] * s.w * sn);
                });
                const u0 = ((s.id % 4) * 256 + 3) / 1024;
                const u1 = ((s.id % 4) * 256 + 253) / 1024;
                const v1 = 1 - (Math.floor(s.id / 4) * 128 + 3) / 1024;
                const v0 = 1 - (Math.floor(s.id / 4) * 128 + 125) / 1024;
                uvs.push(u0, v0, u1, v0, u1, v1, u0, v1);
                const j = i * 4;
                indices.push(j, j + 1, j + 2, j, j + 2, j + 3);
            });
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
            geo.setIndex(indices);
            geo.computeVertexNormals();
            geo.computeBoundingSphere();
            ownedGeometries.push(geo);
            const mesh = new THREE.Mesh(geo, signMaterial);
            ch.group.add(mesh);
        }
        chunks.forEach(function (ch) {
            Object.keys(ch.batches).forEach(function (type) {
                const entries = ch.batches[type];
                const mesh = new THREE.InstancedMesh(geometries[type], material, entries.length);
                mesh.name = 'City ' + type + ' batch';
                mesh.frustumCulled = false; // r128 has no correct per-instance bounds.
                mesh.castShadow = false;
                mesh.receiveShadow = true;
                entries.forEach(function (entry, i) {
                    transform.position.set(entry[0], entry[1], entry[2]);
                    transform.scale.set(entry[3], entry[4], entry[5]);
                    transform.rotation.set(entry[7], entry[8], entry[9]);
                    transform.updateMatrix();
                    mesh.setMatrixAt(i, transform.matrix);
                    mesh.setColorAt(i, color.setHex(entry[6]));
                });
                mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);
                mesh.instanceMatrix.needsUpdate = true;
                if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
                ch.group.add(mesh);
            });
            buildSignMesh(ch);
            ch.group.matrixAutoUpdate = false;
            root.add(ch.group);
            ch.batches = null;
            ch.signs = null;
        });

        // Buildings cast simple box shadows: two cheap draws instead of rendering
        // thousands of windows and awnings again into the shadow map.
        const shadowMaterial = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
        ownedMaterials.push(shadowMaterial);
        const shadowBuildings = colliders.filter(c => c.boxHeight > 8 && c.boxHalfX > 3 && c.boxHalfZ < 40);
        const shadowProxies = new THREE.InstancedMesh(geometries.box, shadowMaterial, shadowBuildings.length);
        shadowProxies.castShadow = true;
        shadowProxies.frustumCulled = false;
        shadowBuildings.forEach(function (c, i) {
            transform.position.set(c.position.x, c.boxHeight / 2, c.position.z);
            transform.rotation.set(0, 0, 0);
            transform.scale.set(c.boxHalfX * 2, c.boxHeight, c.boxHalfZ * 2);
            transform.updateMatrix();
            shadowProxies.setMatrixAt(i, transform.matrix);
        });
        root.add(shadowProxies);

        const starPositions = [
            { x: 5, y: 1.5, z: 19 }, { x: 120, y: 1.5, z: 62 },
            { x: 60, y: 1.5, z: 120 }, { x: 95, y: 1.5, z: 59 },
            { x: -120, y: 1.5, z: 65 }, { x: -60, y: 1.5, z: -120 },
            { x: 240, y: 1.5, z: -60 }, { x: 300, y: 1.5, z: -240 },
            { x: 360, y: 1.5, z: 175 }, { x: 382, y: 1.5, z: -110 },
            { x: 180, y: 1.5, z: 360 }, { x: -120, y: 1.5, z: 297 },
            { x: -300, y: 1.5, z: 240 }, { x: -360, y: 1.5, z: 61 },
            { x: -240, y: 1.5, z: -298 }, { x: 65, y: 1.5, z: -360 }
        ];
        const stats = { buildings: buildingCount, trees: treeCount,
            instances: instanceCount, chunks: chunks.size, visibleChunks: chunks.size,
            drawCalls: 0, colliders: colliders.length };
        const viewFrustum = new THREE.Frustum();
        const viewProjection = new THREE.Matrix4();
        const chunkSphere = new THREE.Sphere(new THREE.Vector3(), 110);
        function update(player, quality, camera) {
            if (disposed) return;
            const p = player && (player.position || player);
            if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) return;
            const value = typeof quality === 'object' && quality ? (quality.name || quality.level || quality.tier) : quality;
            shadowProxies.visible = value !== 'low' && value !== 0;
            const distance = value === 'low' || value === 0 ? 195 : value === 'high' || value === 2 ? 300 : 250;
            if (camera) {
                camera.updateMatrixWorld();
                viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
                viewFrustum.setFromProjectionMatrix(viewProjection);
            }
            let visible = 0, calls = 0;
            chunks.forEach(function (ch) {
                const dx = Math.max(0, Math.abs(p.x - ch.x) - 65);
                const dz = Math.max(0, Math.abs(p.z - ch.z) - 65);
                // Ground and water live in broad central batches, which stay visible.
                const broadGround = ch.x === 0 && ch.z === 0;
                const broadWater = ch.x === 480 && ch.z === 0;
                chunkSphere.center.set(ch.x, 20, ch.z);
                ch.group.visible = broadGround || broadWater || (dx * dx + dz * dz < distance * distance && (!camera || viewFrustum.intersectsSphere(chunkSphere)));
                if (ch.group.visible) { visible++; calls += ch.group.children.length; }
            });
            stats.visibleChunks = visible;
            stats.drawCalls = calls;
        }
        update({ x: 5, z: 65 }, 'medium');
        return {
            root: root, colliders: colliders, roads: roads, blocks: blocks, bounds: bounds,
            spawn: { x: 5, y: 0, z: 65, heading: 0 }, starPositions: starPositions,
            landmarks: [
                { name: 'Central Square', x: 60, z: 60 },
                { name: 'Harbor Walk', x: 382, z: 60 },
                { name: 'Sunbeam Park', x: -180, z: -180 },
                { name: 'Pastel Village', x: -300, z: 180 },
                { name: 'Pool Club', x: 300, z: 180 }
            ],
            stats: stats, update: update,
            dispose: function () {
                if (disposed) return;
                disposed = true;
                root.removeFromParent ? root.removeFromParent() : root.parent && root.parent.remove(root);
                root.traverse(function (object) { if (object.isInstancedMesh && object.dispose) object.dispose(); });
                ownedGeometries.forEach(function (geo) { geo.dispose(); });
                ownedMaterials.forEach(function (mat) { mat.dispose(); });
                ownedTextures.forEach(function (texture) { texture.dispose(); });
                chunks.clear();
                root.clear();
            }
        };
    };
}());

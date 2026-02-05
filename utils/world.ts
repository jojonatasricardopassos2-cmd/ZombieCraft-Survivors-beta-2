
import { BlockType, WorldData } from '../types.ts';
import { WORLD_HEIGHT, WORLD_WIDTH, ORE_CHUNK_SIZE, SEA_LEVEL, BLOCK_SIZE, DEEP_SLATE_LEVEL } from '../constants.ts';

// Pseudo-Random Number Generator (Linear Congruential Generator)
class SeededRNG {
    private seed: number;
    constructor(seed: number) {
        this.seed = seed;
    }
    
    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

function noise(x: number, seed: number): number {
  const n = Math.sin(x * 12.9898 + seed) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, seed: number, scale: number): number {
  const intX = Math.floor(x / scale);
  const fracX = (x / scale) - intX;
  const v1 = noise(intX, seed);
  const v2 = noise(intX + 1, seed);
  return v1 * (1 - fracX) + v2 * fracX;
}

export function generateWorld(seedInput: number): WorldData {
  const blocks = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(BlockType.AIR);
  const light = new Array(WORLD_WIDTH * WORLD_HEIGHT).fill(0);
  
  const rng = new SeededRNG(seedInput);
  const noiseSeed = seedInput; 

  // Surface generation
  const surfaceHeight = new Array(WORLD_WIDTH);
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const baseHeight = Math.floor(WORLD_HEIGHT * 0.30); 
    const variation = Math.floor(
      smoothNoise(x, noiseSeed, 30) * 15 + 
      smoothNoise(x, noiseSeed + 100, 10) * 5
    );
    surfaceHeight[x] = baseHeight + variation;
  }

  // 1. Basic Solid Terrain
  for (let x = 0; x < WORLD_WIDTH; x++) {
    const h = surfaceHeight[x];
    const isForestBiome = x >= 500;
    
    // Jagged Deep Slate Transition Noise
    const deepNoise = smoothNoise(x, noiseSeed + 500, 10); 
    const deepThreshold = DEEP_SLATE_LEVEL + Math.floor(deepNoise * 20 - 10);

    for (let y = 0; y < WORLD_HEIGHT; y++) {
      const idx = y * WORLD_WIDTH + x;

      if (y >= WORLD_HEIGHT - 2) {
        blocks[idx] = BlockType.BEDROCK;
        continue;
      }

      let blockType = BlockType.AIR;

      if (y === h) {
          blockType = isForestBiome ? BlockType.DARK_GRASS : BlockType.GRASS;
      } else if (y > h && y < h + 4) {
          blockType = BlockType.DIRT;
      } else if (y >= h + 4) {
          if (y > deepThreshold) {
              blockType = BlockType.DEEP_STONE;
          } else {
              blockType = BlockType.STONE;
          }
      }
      
      if (blockType === BlockType.AIR && y > h && y > SEA_LEVEL) {
          blockType = BlockType.WATER;
      }

      blocks[idx] = blockType;
    }
  }
  
  // 1.5 Transition Lake (between Plains and Forest ~500)
  // Lake spans from 480 to 520 roughly
  const lakeStartX = 480;
  const lakeEndX = 520;
  for (let x = lakeStartX; x < lakeEndX; x++) {
       const lakeBottom = surfaceHeight[x] + 6 + Math.floor(rng.next() * 3);
       const lakeSurface = Math.floor(WORLD_HEIGHT * 0.30) + 5; 
       
       for(let y = 0; y < WORLD_HEIGHT; y++) {
            const idx = y * WORLD_WIDTH + x;
            if (y > lakeSurface && y <= lakeBottom) {
                 blocks[idx] = BlockType.WATER;
            } else if (y > lakeBottom) {
                 if (blocks[idx] === BlockType.AIR || blocks[idx] === BlockType.WATER) blocks[idx] = BlockType.SAND; 
                 else if (y <= lakeBottom + 2) blocks[idx] = BlockType.SAND; 
            } else if (y <= lakeSurface && y > lakeSurface - 2) {
                 blocks[idx] = BlockType.AIR; 
            }
       }
  }

  // 2. Ore Generation
  for (let cx = 0; cx < WORLD_WIDTH; cx += ORE_CHUNK_SIZE) {
      // COPPER (Abundant, surface to mid)
      generateOreCluster(blocks, BlockType.COPPER_ORE, cx, 0.9, 10, DEEP_SLATE_LEVEL, 4, 8, rng);

      // COAL (Common, Surface to deep)
      generateOreCluster(blocks, BlockType.COAL_ORE, cx, 0.8, 15, WORLD_HEIGHT - 10, 5, 10, rng);

      // IRON (Common, mid depth)
      generateOreCluster(blocks, BlockType.IRON_ORE, cx, 0.7, 40, DEEP_SLATE_LEVEL + 20, 3, 6, rng);

      // GOLD (Rare, caves/deep)
      generateOreCluster(blocks, BlockType.GOLD_ORE, cx, 0.5, 80, WORLD_HEIGHT - 5, 2, 5, rng);

      // DIAMOND (Rare, Deep Slate only mostly)
      generateOreCluster(blocks, BlockType.DIAMOND_ORE, cx, 0.3, DEEP_SLATE_LEVEL, WORLD_HEIGHT - 3, 2, 4, rng);

      // TITANIUM (Rare, Deep Slate near bedrock)
      generateOreCluster(blocks, BlockType.TITANIUM_ORE, cx, 0.25, DEEP_SLATE_LEVEL + 20, WORLD_HEIGHT - 2, 2, 3, rng);

      // URANIUM (Very Rare, Lowest part of Deep Slate)
      generateOreCluster(blocks, BlockType.URANIUM_ORE, cx, 0.15, WORLD_HEIGHT - 50, WORLD_HEIGHT - 2, 1, 2, rng);
  }

  // 3. Caves (Start deeper, Adjusted Sizes)
  const numCaves = 120; // Increased significantly for 1000x1000 map to ensure density
  const avgSurface = Math.floor(WORLD_HEIGHT * 0.30);
  const caveStartDepth = avgSurface + 20; 

  for(let c=0; c<numCaves; c++) {
      const caveStartX = Math.floor(rng.next() * WORLD_WIDTH);
      let caveY = Math.floor(rng.next() * (WORLD_HEIGHT - caveStartDepth - 20)) + caveStartDepth;
      
      for (let step = 0; step < 250; step++) {
          caveY += (rng.next() - 0.5) * 4;
          const currentCaveX = (caveStartX + (Math.sin(step * 0.1) * 10) + (step * (rng.next() > 0.5 ? 1 : -1))) % WORLD_WIDTH;
          
          let radius = 2 + rng.next() * 3;
          // Normal caves smaller
          if (caveY <= DEEP_SLATE_LEVEL) {
              radius = 1 + rng.next() * 2; // Smaller radius for normal stone caves
          }
          // Smaller caves in Deep Slate too
          if (caveY > DEEP_SLATE_LEVEL) {
              radius = 1.5 + rng.next() * 1.5; 
          }

          for (let cx = Math.floor(currentCaveX - radius); cx <= Math.floor(currentCaveX + radius); cx++) {
              for (let cy = Math.floor(caveY - radius); cy <= Math.floor(caveY + radius); cy++) {
                  let safeX = cx;
                  if (safeX < 0) safeX += WORLD_WIDTH;
                  if (safeX >= WORLD_WIDTH) safeX -= WORLD_WIDTH;
                  
                  if (cy > 0 && cy < WORLD_HEIGHT - 2) {
                      const dx = cx - currentCaveX;
                      const dy = cy - caveY;
                      if (dx*dx + dy*dy < radius*radius) {
                          const idx = cy * WORLD_WIDTH + safeX;
                          // Don't cut surface
                          if (cy > surfaceHeight[safeX] + 5) {
                              blocks[idx] = BlockType.AIR;
                          }
                      }
                  }
              }
          }
      }
  }
  
  // 3.5 Rare Structure: Uranium Altar (Forest Only)
  // Try to place it once
  let altarPlaced = false;
  let attempts = 0;
  while (!altarPlaced && attempts < 100) {
      // Forest starts at 500
      const sx = 550 + Math.floor(rng.next() * (WORLD_WIDTH - 600)); 
      const sy = surfaceHeight[sx];
      
      // Check if flat enough (3 blocks wide)
      if (Math.abs(surfaceHeight[sx] - surfaceHeight[sx+1]) < 2 && Math.abs(surfaceHeight[sx] - surfaceHeight[sx+2]) < 2) {
          // Place 3 Uranium Blocks
          blocks[(sy - 1) * WORLD_WIDTH + sx] = BlockType.URANIUM_BLOCK;
          blocks[(sy - 1) * WORLD_WIDTH + sx + 1] = BlockType.URANIUM_BLOCK;
          blocks[(sy - 1) * WORLD_WIDTH + sx + 2] = BlockType.URANIUM_BLOCK;
          
          // Clear space above
          for(let i=0; i<3; i++) {
             blocks[(sy - 2) * WORLD_WIDTH + sx + i] = BlockType.AIR;
             blocks[(sy - 3) * WORLD_WIDTH + sx + i] = BlockType.AIR;
          }
          altarPlaced = true;
          console.log(`Uranium Altar placed at X: ${sx}, Y: ${sy}`);
      }
      attempts++;
  }

  // 4. Vegetation
  for (let x = 0; x < WORLD_WIDTH; x++) {
      // Skip lake area
      if (x >= lakeStartX - 2 && x <= lakeEndX + 2) continue;

      let groundY = -1;
      for(let y=0; y<WORLD_HEIGHT; y++) {
          const b = blocks[y * WORLD_WIDTH + x];
          if (b === BlockType.GRASS || b === BlockType.DARK_GRASS || b === BlockType.DIRT || b === BlockType.STONE) {
              groundY = y;
              break;
          }
          if (b === BlockType.WATER || b === BlockType.AIR || b === BlockType.URANIUM_BLOCK) continue;
      }

      if (groundY !== -1) {
        const groundBlock = blocks[groundY * WORLD_WIDTH + x];
        if ((groundBlock === BlockType.GRASS || groundBlock === BlockType.DARK_GRASS) && blocks[(groundY-1)*WORLD_WIDTH + x] === BlockType.AIR) {
            const r = rng.next();
            const isForest = x >= 500;

            // Trees
            if (r < (isForest ? 0.08 : 0.05) && x > 2 && x < WORLD_WIDTH - 2) {
                const heightAdd = isForest ? Math.floor(rng.next() * 4) + 4 : Math.floor(rng.next() * 2);
                const treeHeight = 4 + heightAdd; // Forest trees 8-12, Normal 4-6
                const logType = isForest ? BlockType.DARK_WOOD : BlockType.WOOD;
                const leafType = isForest ? BlockType.DARK_LEAVES : BlockType.LEAVES;

                for (let i = 1; i <= treeHeight; i++) {
                    blocks[(groundY - i) * WORLD_WIDTH + x] = logType;
                }
                
                const leafRadius = isForest ? 3 : 2;
                
                for (let lx = x - leafRadius; lx <= x + leafRadius; lx++) {
                    for (let ly = groundY - treeHeight - leafRadius; ly <= groundY - treeHeight; ly++) {
                        const lIdx = ly * WORLD_WIDTH + lx;
                        if (lIdx >= 0 && blocks[lIdx] === BlockType.AIR) {
                            if (lx !== x || ly < groundY - treeHeight) {
                                blocks[lIdx] = leafType;
                            }
                        }
                    }
                }
            } 
            // Bushes
            else if (r < 0.08) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.BERRY_BUSH; // Cherry
            }
            else if (r < 0.11) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.SEED_BUSH; // Seeds
            }
            else if (r < 0.15) {
                blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.BUSH; // Generic
            }
            // Flowers
            else if (r < 0.18) {
                const flowerR = rng.next();
                if (flowerR < 0.33) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_RED;
                else if (flowerR < 0.66) blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_GREEN;
                else blocks[(groundY - 1) * WORLD_WIDTH + x] = BlockType.FLOWER_BLUE;
            }
        }
      }
  }

  return { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks, light };
}

function generateOreCluster(blocks: number[], oreType: BlockType, startX: number, probability: number, minDepth: number, maxDepth: number, minSize: number, maxSize: number, rng: SeededRNG) {
    if (rng.next() > probability) return;

    const x = Math.min(Math.max(0, startX + Math.floor(rng.next() * ORE_CHUNK_SIZE)), WORLD_WIDTH - 1);
    const y = Math.min(Math.max(0, minDepth + Math.floor(rng.next() * (maxDepth - minDepth))), WORLD_HEIGHT - 1);
    const idx = y * WORLD_WIDTH + x;

    const target = blocks[idx];
    if (target === BlockType.STONE || target === BlockType.DIRT || target === BlockType.DEEP_STONE) {
        blocks[idx] = oreType;
        const size = Math.floor(rng.next() * (maxSize - minSize + 1)) + minSize;
        
        for(let i=0; i<size; i++) {
            const dx = Math.floor(rng.next() * 3) - 1;
            const dy = Math.floor(rng.next() * 3) - 1;
            const nx = x + dx;
            const ny = y + dy;
            if(nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
                const nIdx = ny * WORLD_WIDTH + nx;
                const nTarget = blocks[nIdx];
                if(nTarget === BlockType.STONE || nTarget === BlockType.DIRT || nTarget === BlockType.DEEP_STONE) {
                    blocks[nIdx] = oreType;
                }
            }
        }
    }
}

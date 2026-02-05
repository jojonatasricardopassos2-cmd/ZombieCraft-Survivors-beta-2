
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
    BLOCK_SIZE, WORLD_HEIGHT, WORLD_WIDTH, GRAVITY, 
    PLAYER_SPEED, PLAYER_RUN_SPEED, JUMP_FORCE, BLOCK_COLORS, 
    REACH_DISTANCE, FULL_DAY_TICKS, DUSK_START, NIGHT_START, DAWN_START,
    COOKING_RECIPES, FUEL_VALUES, FOOD_VALUES, ITEM_COLORS, TERMINAL_VELOCITY, TRANSLATIONS, DAMAGE_VALUES, MAX_LIGHT, BLOCK_HARDNESS,
    ARMOR_PROTECTION, ITEM_NAMES, MAX_DURABILITY, XP_PER_MOB, DEFAULT_STATS, MAX_STAMINA, BASE_STAMINA_DRAIN, BASE_STAMINA_REGEN, HUNGER_DECAY_TICK, SPRINT_HUNGER_DRAIN, DEEP_SLATE_LEVEL, TICKS_PER_HOUR
} from '../constants.ts';
import { BlockType, Entity, ItemStack, ItemType, WorldData, CraftingRecipe, FurnaceData, Equipment, SavedWorld, PlayerStats, CropData, GameOptions } from '../types.ts';
import { generateWorld } from '../utils/world.ts';
import { saveWorldToDB } from '../utils/storage.ts';
import { Inventory } from './UI/Inventory.tsx';
import { FurnaceUI } from './UI/FurnaceUI.tsx';
import { ChestUI } from './UI/ChestUI.tsx';
import { HammerBuildUI } from './UI/HammerBuildUI.tsx';
import { UpgradeUI } from './UI/UpgradeUI.tsx';
import { MainMenu } from './MainMenu.tsx';
import { AdminPanel } from './UI/AdminPanel.tsx';
import { SleepUI } from './UI/SleepUI.tsx';
import { MobileControls } from './UI/MobileControls.tsx';

function getMousePos(canvas: HTMLCanvasElement, evt: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

// Generate random IDs to avoid collision in MP
const generateEntityId = () => Math.floor(Math.random() * 1000000000);

// 1. Blocks that light passes through (Visual Transparency)
const LIGHT_TRANSPARENT_BLOCKS = new Set([
    BlockType.AIR, BlockType.GLASS, BlockType.WATER, BlockType.TORCH,
    BlockType.LEAVES, BlockType.DARK_LEAVES, BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH,
    BlockType.ROOF_WOOD, BlockType.ROOF_STONE, BlockType.ROOF_WOOD_LEFT, BlockType.ROOF_STONE_LEFT,
    BlockType.WALL_WOOD, BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
    BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
    BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED, BlockType.UPGRADE_BENCH,
    BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
    BlockType.CRAFTING_TABLE, BlockType.FURNACE, 
    // Chests also let light pass usually in 2D to avoid dark spots behind them
    BlockType.CHEST, BlockType.CHEST_MEDIUM, BlockType.CHEST_LARGE, BlockType.STONE_CHEST 
]);

// 2. Blocks that entities can walk through (No Collision)
// NOTE: Glass is NOT here, so it has physics (solid). Chests ARE here, so they have no physics (intangible).
const NON_COLLIDABLE_BLOCKS = new Set([
    BlockType.AIR, BlockType.WATER, BlockType.TORCH,
    BlockType.LEAVES, BlockType.DARK_LEAVES, BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH,
    BlockType.ROOF_WOOD, BlockType.ROOF_STONE, BlockType.ROOF_WOOD_LEFT, BlockType.ROOF_STONE_LEFT,
    BlockType.WALL_WOOD, BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
    BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
    BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED, BlockType.UPGRADE_BENCH,
    BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
    BlockType.CRAFTING_TABLE, BlockType.FURNACE,
    BlockType.CHEST, BlockType.CHEST_MEDIUM, BlockType.CHEST_LARGE, BlockType.STONE_CHEST
]);

interface Notification {
    id: number;
    message: string;
    timestamp: number;
}

export const GameCanvas: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number | null>(null);
    
    const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'PAUSED'>('MENU');
    const [lang, setLang] = useState<'EN' | 'PT'>('EN');
    const t = TRANSLATIONS[lang];

    const worldRef = useRef<WorldData | null>(null);
    const playerRef = useRef<Entity>({
        id: generateEntityId(), type: 'PLAYER', x: 0, y: 0, width: 20, height: 56,
        vx: 0, vy: 0, grounded: false, health: 10, maxHealth: 10, facingRight: true,
        attackCooldown: 0
    });
    
    // Multiplayer Support
    // We add a 'lastSeen' property to track active players
    const otherPlayersRef = useRef<(Entity & { lastSeen?: number })[]>([]);
    const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const hungerRef = useRef<number>(10);
    const staminaRef = useRef<number>(MAX_STAMINA);
    const sprintRef = useRef<boolean>(false);
    const blockingRef = useRef<boolean>(false);
    
    const [playerLevel, setPlayerLevel] = useState(1);
    const [playerXP, setPlayerXP] = useState(0);
    const [skillPoints, setSkillPoints] = useState(0);
    const [playerStats, setPlayerStats] = useState<PlayerStats>(DEFAULT_STATS);
    const [options, setOptions] = useState<GameOptions>({ showCoordinates: false, adminMode: false, isMobile: false });

    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
    const [adminFlags, setAdminFlags] = useState({ noClip: false, nightVision: false, showCreative: false });

    const keysRef = useRef<Record<string, boolean>>({});
    const mouseRef = useRef<{x: number, y: number, left: boolean, right: boolean}>({ x: 0, y: 0, left: false, right: false });
    const cameraRef = useRef({ x: 0, y: 0 });
    const entitiesRef = useRef<Entity[]>([]);
    const timeRef = useRef<number>(0); 
    const furnacesRef = useRef<Map<string, FurnaceData>>(new Map());
    const chestsRef = useRef<Map<string, ItemStack[]>>(new Map());
    const cropsRef = useRef<Map<string, CropData>>(new Map());

    const breakingRef = useRef<{ x: number, y: number, progress: number }>({ x: -1, y: -1, progress: 0 });
    const lastHungerDamageRef = useRef<number>(0);
    const lastRadiationDamageRef = useRef<number>(0);
    const lastPlacementTime = useRef<number>(0);
    
    const spearChargeStartRef = useRef<number | null>(null);
    const [activeBuildBlock, setActiveBuildBlock] = useState<BlockType | null>(null);
    const [isSleepUIOpen, setIsSleepUIOpen] = useState(false);

    const [currentWorldId, setCurrentWorldId] = useState<string>('');
    const [currentWorldName, setCurrentWorldName] = useState<string>('');
    const [currentSeed, setCurrentSeed] = useState<number>(0);

    const [inventory, setInventory] = useState<(ItemStack | null)[]>(() => Array(36).fill(null));
    const [cursorItem, setCursorItem] = useState<ItemStack | null>(null);
    const [selectedSlot, setSelectedSlot] = useState(0);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [isFurnaceOpen, setIsFurnaceOpen] = useState(false);
    const [isChestOpen, setIsChestOpen] = useState(false);
    const [isHammerMenuOpen, setIsHammerMenuOpen] = useState(false);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    
    const [activeFurnacePos, setActiveFurnacePos] = useState<string | null>(null);
    const [activeChestPos, setActiveChestPos] = useState<string | null>(null);
    const [activeChestSize, setActiveChestSize] = useState<number>(20);

    const [uiMousePos, setUiMousePos] = useState({ x: 0, y: 0 });
    const [equipment, setEquipment] = useState<Equipment>({ helmet: null, chestplate: null, leggings: null, boots: null, offHand: null });
    
    const [hearts, setHearts] = useState(10);
    const [hunger, setHunger] = useState(10);
    const [stamina, setStamina] = useState(MAX_STAMINA);
    const [nearbyStation, setNearbyStation] = useState<BlockType | 'NONE'>('NONE');
    const [uiTick, setUiTick] = useState(0);

    const addNotification = (msg: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message: msg, timestamp: id }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // --- BROADCAST HELPER ---
    const broadcast = (type: string, payload: any) => {
        if (broadcastChannelRef.current) {
            broadcastChannelRef.current.postMessage({ type, payload });
        }
    };

    // --- HELPER FUNCTIONS ---

    const canDamageBlock = (block: BlockType, tool: ItemStack | null): boolean => {
        const handBreakable = new Set([
            BlockType.AIR, BlockType.WATER,
            BlockType.DIRT, BlockType.GRASS, BlockType.DARK_GRASS, BlockType.SAND,
            BlockType.LEAVES, BlockType.DARK_LEAVES,
            BlockType.BUSH, BlockType.BERRY_BUSH, BlockType.SEED_BUSH,
            BlockType.FLOWER_RED, BlockType.FLOWER_GREEN, BlockType.FLOWER_BLUE,
            BlockType.CROP_WHEAT, BlockType.CROP_CARROT, BlockType.CROP_POTATO,
            BlockType.TORCH
        ]);

        if (handBreakable.has(block)) return true;
        if (!tool) return false;

        const id = tool.id.toString();
        const woodTypes = new Set([
            BlockType.WOOD, BlockType.DARK_WOOD, BlockType.PLANKS,
            BlockType.DOOR_BOTTOM_CLOSED, BlockType.DOOR_TOP_CLOSED,
            BlockType.DOOR_BOTTOM_OPEN, BlockType.DOOR_TOP_OPEN,
            BlockType.CRAFTING_TABLE, BlockType.CHEST, BlockType.CHEST_MEDIUM, 
            BlockType.CHEST_LARGE, BlockType.BED, BlockType.BED_MEDIUM, BlockType.BED_ADVANCED,
            BlockType.ROOF_WOOD, BlockType.ROOF_WOOD_LEFT, BlockType.WALL_WOOD
        ]);

        if (woodTypes.has(block)) return id.includes('axe');
        return id.includes('pickaxe');
    };

    const updateLighting = (world: WorldData, time: number) => {
        const lightMap = new Int8Array(WORLD_WIDTH * WORLD_HEIGHT).fill(0);
        const queue: number[] = [];
        let skyLight = MAX_LIGHT; 
        
        if (time >= DUSK_START && time < NIGHT_START) {
            skyLight = 7;
        } else if (time >= NIGHT_START) {
            skyLight = 4;
        }
        
        for (let x = 0; x < WORLD_WIDTH; x++) {
            let currentLight = skyLight;
            for (let y = 0; y < WORLD_HEIGHT; y++) {
                const idx = y * WORLD_WIDTH + x;
                const block = world.blocks[idx];
                const isTransparent = LIGHT_TRANSPARENT_BLOCKS.has(block);
                
                if (isTransparent) {
                    lightMap[idx] = currentLight;
                    if (block === BlockType.LEAVES || block === BlockType.DARK_LEAVES || block === BlockType.WATER || block === BlockType.ROOF_WOOD || block === BlockType.ROOF_STONE || block === BlockType.ROOF_WOOD_LEFT || block === BlockType.ROOF_STONE_LEFT) currentLight = Math.max(0, currentLight - 3); 
                    if (currentLight > 1) queue.push(idx);
                } else {
                    lightMap[idx] = currentLight;
                    currentLight = 0; 
                }
            }
        }
        
        for(let i=0; i<world.blocks.length; i++) {
            if (world.blocks[i] === BlockType.TORCH) { lightMap[i] = 14; queue.push(i); }
            if (world.blocks[i] === BlockType.URANIUM_ORE) { lightMap[i] = 12; queue.push(i); }
            if (world.blocks[i] === BlockType.URANIUM_BLOCK) { lightMap[i] = 14; queue.push(i); }
        }
        
        let head = 0;
        while (head < queue.length) {
            const idx = queue[head++];
            const level = lightMap[idx];
            if (level <= 1) continue;
            const x = idx % WORLD_WIDTH;
            const neighbors = [idx + 1, idx - 1, idx + WORLD_WIDTH, idx - WORLD_WIDTH];
            if (x === WORLD_WIDTH - 1) neighbors[0] = -1; 
            if (x === 0) neighbors[1] = -1;
            for (const nIdx of neighbors) {
                if (nIdx >= 0 && nIdx < lightMap.length) {
                    if (lightMap[nIdx] < level - 1) {
                         lightMap[nIdx] = level - 1;
                         if (LIGHT_TRANSPARENT_BLOCKS.has(world.blocks[nIdx])) { queue.push(nIdx); }
                    }
                }
            }
        }
        world.light = Array.from(lightMap);
    };

    const setBlockAt = (x: number, y: number, type: BlockType, shouldBroadcast: boolean = true) => {
        if (!worldRef.current) return;
        if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) return;
        
        // Don't update if block is same
        if (worldRef.current.blocks[y * WORLD_WIDTH + x] === type) return;

        worldRef.current.blocks[y * WORLD_WIDTH + x] = type;
        updateLighting(worldRef.current, timeRef.current);
        
        if (shouldBroadcast) {
            broadcast('BLOCK_UPDATE', { x, y, type });
        }
    };

    const checkCollision = (ent: Entity, world: WorldData): boolean => {
        const startX = Math.floor(ent.x / BLOCK_SIZE);
        const endX = Math.floor((ent.x + ent.width) / BLOCK_SIZE);
        const startY = Math.floor(ent.y / BLOCK_SIZE);
        const endY = Math.floor((ent.y + ent.height) / BLOCK_SIZE);

        for(let y=startY; y<=endY; y++) {
            for(let x=startX; x<=endX; x++) {
                if (x < 0 || x >= WORLD_WIDTH || y < 0 || y >= WORLD_HEIGHT) continue;
                const b = world.blocks[y*WORLD_WIDTH+x];
                if (!NON_COLLIDABLE_BLOCKS.has(b)) return true;
            }
        }
        return false;
    };

    const spawnMob = (type: 'ZOMBIE' | 'PIG' | 'COW' | 'SHEEP') => {
        if (!worldRef.current) return;
        
        // MULTIPLAYER: Only Host spawns mobs
        if (options.multiplayer?.mode === 'CLIENT') return;

        let spawnX = 0;
        let spawnY = 0;
        let attempts = 0;
        const pX = Math.floor(playerRef.current.x / BLOCK_SIZE);
        
        while(attempts < 10) {
             const dist = 20 + Math.floor(Math.random() * 20);
             const dir = Math.random() < 0.5 ? 1 : -1;
             spawnX = Math.max(0, Math.min(WORLD_WIDTH - 1, pX + (dist * dir)));
             for(let y=0; y<WORLD_HEIGHT; y++) {
                 if (worldRef.current.blocks[y * WORLD_WIDTH + spawnX] !== BlockType.AIR) {
                     spawnY = (y - 1) * BLOCK_SIZE;
                     break;
                 }
             }
             if (spawnY > 0) break;
             attempts++;
        }
        
        if (spawnY > 0) {
             const mob: Entity = {
                 id: generateEntityId(),
                 type,
                 x: spawnX * BLOCK_SIZE,
                 y: spawnY,
                 width: (type === 'PIG') ? 28 : (type === 'COW' ? 32 : (type === 'SHEEP' ? 30 : 20)),
                 height: (type === 'ZOMBIE' ? 56 : (type === 'COW' ? 24 : 20)),
                 vx: 0, vy: 0, grounded: false,
                 health: type === 'ZOMBIE' ? 20 : 10,
                 maxHealth: type === 'ZOMBIE' ? 20 : 10,
                 facingRight: true,
                 attackCooldown: 0
             };
             entitiesRef.current.push(mob);
             // Note: In Host mode, the periodic SYNC_ENTITIES broadcast will send this to clients
        }
    };
    
    const spawnBoss = (x: number, y: number) => {
        // MULTIPLAYER: Only Host spawns boss
        if (options.multiplayer?.mode === 'CLIENT') return;

        entitiesRef.current.push({
            id: generateEntityId(),
            type: 'MUTANT_ZOMBIE',
            x: x,
            y: y,
            width: 40,
            height: 80,
            vx: 0, vy: 0, grounded: false,
            health: 500,
            maxHealth: 500,
            facingRight: true,
            attackCooldown: 0
        });
    }

    const spawnDrop = (x: number, y: number, itemId: BlockType | string, count: number, meta?: any, shouldBroadcast: boolean = true) => {
        const id = generateEntityId();
        const drop: Entity = {
            id,
            type: 'DROP',
            x, y, width: 12, height: 12, vx: (Math.random() - 0.5) * 4, vy: -3,
            grounded: false, health: 1, maxHealth: 1, facingRight: true,
            itemId, itemCount: count, itemMeta: meta, creationTime: Date.now()
        };
        
        // Add to local list immediately for visual feedback
        if(!entitiesRef.current.find(e => e.id === id)) {
            entitiesRef.current.push(drop);
        }
        
        if (shouldBroadcast) {
            broadcast('SPAWN_DROP', { ...drop });
        }
    };

    const getBreakSpeed = (block: BlockType, tool: ItemStack | null): number => {
        let speed = 1;
        if (!tool) return 1;
        const id = tool.id.toString();
        let multiplier = 1;
        if (id.includes('wood')) multiplier = 2;
        if (id.includes('stone')) multiplier = 3;
        if (id.includes('iron')) multiplier = 5;
        if (id.includes('gold')) multiplier = 8;
        if (id.includes('diamond')) multiplier = 10;
        if (id.includes('titanium')) multiplier = 15;
        if (id.includes('uranium')) multiplier = 20;

        const isPickaxe = id.includes('pickaxe');
        const isAxe = id.includes('axe');
        const isShovel = id.includes('shovel');
        
        const isStone = block === BlockType.STONE || block === BlockType.COAL_ORE || block === BlockType.IRON_ORE; 
        const isWood = block === BlockType.WOOD || block === BlockType.PLANKS || block === BlockType.DOOR_BOTTOM_CLOSED;
        const isDirt = block === BlockType.DIRT || block === BlockType.GRASS || block === BlockType.SAND;
        
        if (isPickaxe && isStone) speed *= multiplier;
        if (isAxe && isWood) speed *= multiplier;
        if (isShovel && isDirt) speed *= multiplier;
        
        speed += playerStats.strength * 0.5;
        return speed;
    };
    
    const canHarvest = (block: BlockType, tool: ItemStack | null): boolean => {
        if (block === BlockType.BEDROCK) return false;
        if (block === BlockType.DIAMOND_ORE || block === BlockType.GOLD_ORE || block === BlockType.TITANIUM_ORE) {
             if (!tool) return false;
             const id = tool.id.toString();
             if (id.includes('wood') || id.includes('stone')) return false; 
        }
        if (block === BlockType.URANIUM_BLOCK || block === BlockType.TITANIUM_BLOCK) {
            if (!tool) return false;
            const id = tool.id.toString();
            if (!id.includes('pickaxe') || id.includes('wood') || id.includes('stone') || id.includes('iron')) return false;
        }
        return true;
    };

    const damageTool = (slotIndex: number) => {
        setInventory(prev => {
            const item = prev[slotIndex];
            if (!item || item.type !== ItemType.TOOL) return prev;
            
            let mat = '';
            const id = item.id.toString();
            if (id.includes('wood') || id.includes('basic')) mat = 'wood';
            else if (id.includes('stone')) mat = 'stone';
            else if (id.includes('iron')) mat = 'iron';
            else if (id.includes('gold')) mat = 'gold';
            else if (id.includes('diamond')) mat = 'diamond';
            else if (id.includes('titanium')) mat = 'titanium';
            else if (id.includes('copper')) mat = 'copper';
            else if (id.includes('uranium')) mat = 'uranium';
            
            const max = MAX_DURABILITY[mat];
            if (!max) return prev;
            
            const newMeta = { ...item.meta, damage: (item.meta?.damage || 0) + 1 };
            if (newMeta.damage >= max) {
                const n = [...prev];
                n[slotIndex] = null;
                return n;
            } else {
                const n = [...prev];
                n[slotIndex] = { ...item, meta: newMeta };
                return n;
            }
        });
    };
    
    const damageOffhand = () => {
         if (equipment.offHand && equipment.offHand.type === ItemType.SHIELD) {
             const item = equipment.offHand;
             let mat = 'wood'; 
             if (item.id.toString().includes('iron')) mat = 'iron';
             const max = MAX_DURABILITY[mat] || 100;
             const newMeta = { ...item.meta, damage: (item.meta?.damage || 0) + 1 };
             if (newMeta.damage >= max) {
                 setEquipment(prev => ({ ...prev, offHand: null }));
             } else {
                 setEquipment(prev => ({ ...prev, offHand: { ...item, meta: newMeta } }));
             }
         }
    };

    const handleInteraction = () => {
        if (worldRef.current) {
            const pStartX = Math.floor(playerRef.current.x / BLOCK_SIZE);
            const pEndX = Math.floor((playerRef.current.x + playerRef.current.width) / BLOCK_SIZE);
            const pStartY = Math.floor(playerRef.current.y / BLOCK_SIZE);
            const pEndY = Math.floor((playerRef.current.y + playerRef.current.height) / BLOCK_SIZE);

            for (let y = pStartY; y <= pEndY; y++) {
                for (let x = pStartX; x <= pEndX; x++) {
                    const idx = y * WORLD_WIDTH + x;
                    const b = worldRef.current.blocks[idx];
                    const key = `${x},${y}`;

                    if (b === BlockType.CRAFTING_TABLE) {
                        setNearbyStation(BlockType.CRAFTING_TABLE);
                        setIsInventoryOpen(true);
                        return;
                    } else if (b === BlockType.FURNACE) {
                        if (!furnacesRef.current.has(key)) {
                            furnacesRef.current.set(key, { input: null, fuel: null, output: null, burnTime: 0, maxBurnTime: 0, cookTime: 0 });
                        }
                        setActiveFurnacePos(key);
                        setIsFurnaceOpen(true);
                        return;
                    } else if (b === BlockType.UPGRADE_BENCH) {
                        setIsUpgradeOpen(true);
                        return;
                    } else if (b === BlockType.CHEST || b === BlockType.CHEST_MEDIUM || b === BlockType.CHEST_LARGE || b === BlockType.STONE_CHEST) {
                        if (!chestsRef.current.has(key)) {
                            chestsRef.current.set(key, Array(20).fill(null));
                        }
                        const size = b === BlockType.CHEST_LARGE ? 100 : (b === BlockType.CHEST_MEDIUM || b === BlockType.STONE_CHEST ? 50 : 20);
                        setActiveChestSize(size);
                        
                        const currentContent = chestsRef.current.get(key)!;
                        if (currentContent.length !== size) {
                             const newContent = Array(size).fill(null);
                             for(let i=0; i<Math.min(currentContent.length, size); i++) newContent[i] = currentContent[i];
                             chestsRef.current.set(key, newContent);
                        }
                        
                        setActiveChestPos(key);
                        setIsChestOpen(true);
                        return;
                    }
                }
            }
        }

        const mx = mouseRef.current.x + cameraRef.current.x;
        const my = mouseRef.current.y + cameraRef.current.y;
        const bx = Math.floor(mx / BLOCK_SIZE);
        const by = Math.floor(my / BLOCK_SIZE);
        
        const dist = Math.sqrt(Math.pow(bx*BLOCK_SIZE + BLOCK_SIZE/2 - (playerRef.current.x+playerRef.current.width/2), 2) + Math.pow(by*BLOCK_SIZE + BLOCK_SIZE/2 - (playerRef.current.y+playerRef.current.height/2), 2));
        if (dist > REACH_DISTANCE * 1.5) return;

        if (worldRef.current) {
            const idx = by * WORLD_WIDTH + bx;
            const b = worldRef.current.blocks[idx];
            const key = `${bx},${by}`;
            
            if (b === BlockType.CHEST || b === BlockType.CHEST_MEDIUM || b === BlockType.CHEST_LARGE || b === BlockType.STONE_CHEST) {
                if (!chestsRef.current.has(key)) {
                    chestsRef.current.set(key, Array(20).fill(null));
                }
                const size = b === BlockType.CHEST_LARGE ? 100 : (b === BlockType.CHEST_MEDIUM || b === BlockType.STONE_CHEST ? 50 : 20);
                setActiveChestSize(size);
                
                const currentContent = chestsRef.current.get(key)!;
                if (currentContent.length !== size) {
                     const newContent = Array(size).fill(null);
                     for(let i=0; i<Math.min(currentContent.length, size); i++) newContent[i] = currentContent[i];
                     chestsRef.current.set(key, newContent);
                }
                
                setActiveChestPos(key);
                setIsChestOpen(true);
            } else if (b === BlockType.BED || b === BlockType.BED_MEDIUM || b === BlockType.BED_ADVANCED) {
                if (timeRef.current >= NIGHT_START || timeRef.current < DAWN_START) {
                    setIsSleepUIOpen(true);
                }
            }
        }
    };
    
    const dropItem = () => {
        const item = inventory[selectedSlot];
        if (item) {
             spawnDrop(playerRef.current.x, playerRef.current.y, item.id, 1, item.meta);
             setInventory(prev => {
                 const n = [...prev];
                 if (n[selectedSlot]) {
                     n[selectedSlot]!.count--;
                     if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null;
                 }
                 return n;
             });
        }
    };

    const drawMob = (ctx: CanvasRenderingContext2D, ent: Entity) => {
        ctx.save();
        ctx.translate(ent.x + ent.width/2, ent.y + ent.height/2);
        if (!ent.facingRight) ctx.scale(-1, 1);
        
        const legOffset = Math.sin(ent.x / 10) * 4;

        if (ent.type === 'ZOMBIE' || ent.type === 'MUTANT_ZOMBIE') {
            const isMutant = ent.type === 'MUTANT_ZOMBIE';
            const scale = isMutant ? 1.5 : 1;
            ctx.fillStyle = isMutant ? '#1a237e' : '#1a237e'; 
            ctx.fillRect(-6 * scale, 12 * scale, 4 * scale, (16 + legOffset) * scale);
            ctx.fillRect(2 * scale, 12 * scale, 4 * scale, (16 - legOffset) * scale);
            ctx.fillStyle = isMutant ? '#283593' : '#0d47a1'; 
            ctx.fillRect(-10 * scale, -16 * scale, 20 * scale, 28 * scale);
            if (isMutant) {
                ctx.fillStyle = '#64dd17'; 
                ctx.fillRect(-4 * scale, -8 * scale, 8 * scale, 4 * scale);
                ctx.fillRect(-4 * scale, 0 * scale, 8 * scale, 4 * scale);
            }
            ctx.fillStyle = isMutant ? '#43a047' : '#2e7d32'; 
            ctx.fillRect(0, -14 * scale, 22 * scale, 6 * scale); 
            ctx.fillStyle = isMutant ? '#1b5e20' : '#1b5e20';
            ctx.fillRect(-10 * scale, -14 * scale, 10 * scale, 6 * scale); 
            ctx.fillStyle = isMutant ? '#43a047' : '#2e7d32'; 
            ctx.fillRect(-10 * scale, -28 * scale, 20 * scale, 20 * scale); 
            ctx.fillStyle = '#000';
            ctx.fillRect(2 * scale, -22 * scale, 4 * scale, 4 * scale); 
            ctx.fillStyle = isMutant ? '#f00' : '#000';
            ctx.fillRect(6 * scale, -22 * scale, 4 * scale, 4 * scale); 
        } 
        else if (ent.type === 'COW') {
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(-12, 6, 6, 10 + legOffset); 
            ctx.fillRect(6, 6, 6, 10 - legOffset); 
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(-16, -8, 32, 18);
            ctx.fillStyle = '#fff';
            ctx.fillRect(-4, -6, 10, 8);
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(14, -12, 12, 12);
            ctx.fillStyle = '#bdbdbd';
            ctx.fillRect(16, -16, 2, 4);
            ctx.fillRect(22, -16, 2, 4);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(-2, 10, 6, 2);
        } 
        else if (ent.type === 'PIG') {
            ctx.fillStyle = '#f06292';
            ctx.fillRect(-10, 6, 4, 8 + legOffset);
            ctx.fillRect(6, 6, 4, 8 - legOffset);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(-14, -6, 28, 14);
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(12, -8, 10, 10);
            ctx.fillStyle = '#e91e63';
            ctx.fillRect(20, -4, 4, 4);
        } 
        else if (ent.type === 'SHEEP') {
            ctx.fillStyle = '#d7ccc8'; 
            ctx.fillRect(-10, 6, 4, 8 + legOffset);
            ctx.fillRect(8, 6, 4, 8 - legOffset);
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(-14, -10, 30, 20); 
            ctx.fillStyle = '#eee'; 
            ctx.fillRect(-12, -8, 26, 16);
            ctx.fillStyle = '#d7ccc8'; 
            ctx.fillRect(14, -8, 8, 8);
        }
        else if (ent.type === 'PLAYER') {
            // Render other players
            ctx.fillStyle = '#7e57c2'; // Purple tint
            ctx.fillRect(-10, -28, 20, 56);
            ctx.fillStyle = 'white';
            ctx.fillRect((ent.facingRight?4:-8), -20, 4, 4); // Eye
            
            // Name tag
            if(ent.playerName) {
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(ent.playerName, 0, -35);
                ctx.fillText(ent.playerName, 0, -35);
            }
        }
        else {
            ctx.fillStyle = 'red';
            ctx.fillRect(-ent.width/2, -ent.height/2, ent.width, ent.height);
        }
        ctx.restore();
    };

    // --- UI HANDLERS & EVENT LISTENERS ---
    
    const handleInventorySlotClick = (index: number, button: number) => {
        if (index < 0 || index >= inventory.length) return;
        const clickedItem = inventory[index];
        if (button === 2) {
            if (cursorItem && !clickedItem) {
                setInventory(prev => { const n = [...prev]; n[index] = { ...cursorItem, count: 1 }; return n; });
                setCursorItem(prev => { if (!prev) return null; const n = { ...prev, count: prev.count - 1 }; return n.count > 0 ? n : null; });
            } else if (!cursorItem && clickedItem) {
                const half = Math.ceil(clickedItem.count / 2);
                setCursorItem({ ...clickedItem, count: half });
                setInventory(prev => { const n = [...prev]; n[index] = { ...clickedItem, count: clickedItem.count - half }; if (n[index]!.count <= 0) n[index] = null; return n; });
            }
            return;
        }
        if (cursorItem) {
            if (clickedItem) {
                if (clickedItem.id === cursorItem.id) {
                    setInventory(prev => { const n = [...prev]; const space = 64 - clickedItem.count; const toAdd = Math.min(space, cursorItem.count); n[index] = { ...clickedItem, count: clickedItem.count + toAdd }; return n; });
                    setCursorItem(prev => { if (!prev) return null; const n = { ...prev, count: prev.count - Math.min(64 - clickedItem.count, prev.count) }; return n.count > 0 ? n : null; });
                } else {
                    setInventory(prev => { const n = [...prev]; n[index] = cursorItem; return n; }); setCursorItem(clickedItem);
                }
            } else { setInventory(prev => { const n = [...prev]; n[index] = cursorItem; return n; }); setCursorItem(null); }
        } else { if (clickedItem) { setCursorItem(clickedItem); setInventory(prev => { const n = [...prev]; n[index] = null; return n; }); } }
    };

    const handleCraft = (recipe: CraftingRecipe) => {
        let can = true; const tempInv = [...inventory];
        for (const ing of recipe.ingredients) {
            let needed = ing.count;
            for (let i = 0; i < tempInv.length; i++) {
                if (tempInv[i] && tempInv[i]!.id === ing.id) { const take = Math.min(needed, tempInv[i]!.count); tempInv[i] = { ...tempInv[i]!, count: tempInv[i]!.count - take }; if (tempInv[i]!.count <= 0) tempInv[i] = null; needed -= take; if (needed <= 0) break; }
            }
            if (needed > 0) { can = false; break; }
        }
        if (can) {
            setInventory(tempInv); const res = recipe.result; let added = false;
            for (let i = 0; i < tempInv.length; i++) { if (tempInv[i] && tempInv[i]!.id === res.id && tempInv[i]!.count < 64) { const space = 64 - tempInv[i]!.count; const add = Math.min(space, res.count); tempInv[i]!.count += add; added = true; break; } }
            if (!added) { for(let i=0; i<tempInv.length; i++) { if (!tempInv[i]) { tempInv[i] = { ...res }; added = true; break; } } }
            if (!added) { spawnDrop(playerRef.current.x, playerRef.current.y, res.id, res.count); }
            setInventory(tempInv);
        }
    };

    const handleEquip = (item: ItemStack, slot: keyof Equipment) => {
        if (cursorItem) {
            const valid = (slot === 'helmet' && cursorItem.id.toString().includes('helmet')) || (slot === 'chestplate' && cursorItem.id.toString().includes('chestplate')) || (slot === 'leggings' && cursorItem.id.toString().includes('leggings')) || (slot === 'boots' && cursorItem.id.toString().includes('boots')) || (slot === 'offHand');
            if (valid) { const old = equipment[slot]; setEquipment(prev => ({ ...prev, [slot]: cursorItem })); setCursorItem(old); }
        } else { if (item) { setCursorItem(item); setEquipment(prev => ({ ...prev, [slot]: null })); } }
    };

    const handleUnequip = (slot: keyof Equipment) => {
        const item = equipment[slot]; if (!item) return;
        const newInv = [...inventory]; let placed = false;
        for(let i=0; i<newInv.length; i++) { if (!newInv[i]) { newInv[i] = item; placed = true; break; } }
        if (placed) setInventory(newInv); else spawnDrop(playerRef.current.x, playerRef.current.y, item.id, item.count, item.meta);
        setEquipment(prev => ({ ...prev, [slot]: null }));
    };

    const handleFurnaceClick = (pos: string, slotType: 'input' | 'fuel' | 'output') => {
        const furnace = furnacesRef.current.get(pos); if (!furnace) return;
        
        // UI Logic
        if (cursorItem) {
            if (slotType === 'output') return; 
            const target = slotType === 'input' ? furnace.input : furnace.fuel;
            if (!target) { if (slotType === 'input') furnace.input = cursorItem; else furnace.fuel = cursorItem; setCursorItem(null); } 
            else { if (target.id === cursorItem.id) { target.count += cursorItem.count; setCursorItem(null); } else { if (slotType === 'input') furnace.input = cursorItem; else furnace.fuel = cursorItem; setCursorItem(target); } }
        } else {
            const target = slotType === 'input' ? furnace.input : (slotType === 'fuel' ? furnace.fuel : furnace.output);
            if (target) { setCursorItem(target); if (slotType === 'input') furnace.input = null; else if (slotType === 'fuel') furnace.fuel = null; else furnace.output = null; }
        }

        // Broadcast Update
        broadcast('FURNACE_UPDATE', { key: pos, data: furnace });
    };

    const handleChestSlotClick = (index: number) => {
        if (!activeChestPos || !chestsRef.current.has(activeChestPos)) return;
        const content = chestsRef.current.get(activeChestPos)!; const clicked = content[index];
        if (cursorItem) { if (clicked) { if (clicked.id === cursorItem.id) { clicked.count += cursorItem.count; setCursorItem(null); } else { content[index] = cursorItem; setCursorItem(clicked); } } else { content[index] = cursorItem; setCursorItem(null); } } else { if (clicked) { setCursorItem(clicked); content[index] = null; } }
        
        // Broadcast Update
        broadcast('CHEST_UPDATE', { key: activeChestPos, content });
    };

    const handleHammerBuild = (blockType: BlockType) => { setActiveBuildBlock(blockType); setIsHammerMenuOpen(false); };
    const handleUpgrade = (item1: ItemStack, item2: ItemStack): ItemStack | null => { if (item1.id === item2.id && (item1.type === ItemType.TOOL || item1.type === ItemType.ARMOR)) { return { ...item1, meta: { ...item1.meta, damage: 0 } }; } return null; };
    const handleReturnItem = (item: ItemStack) => { let added = false; setInventory(prev => { const n = [...prev]; for(let i=0; i<n.length; i++) { if (!n[i]) { n[i] = item; added = true; break; } } return n; }); if (!added) spawnDrop(playerRef.current.x, playerRef.current.y, item.id, item.count, item.meta); };
    const handleAdminGiveItem = (item: ItemStack) => { setInventory(prev => { const n = [...prev]; for(let i=0; i<n.length; i++) { if (!n[i]) { n[i] = { ...item }; return n; } } return n; }); };
    const handleAdminSetTime = (time: 'DAY' | 'NIGHT') => { if (time === 'DAY') timeRef.current = DAWN_START; else timeRef.current = NIGHT_START; if(worldRef.current) updateLighting(worldRef.current, timeRef.current); };
    const handleSleep = (hour: number) => { let targetTick = (hour - 6) * 1500; if (targetTick < 0) targetTick += FULL_DAY_TICKS; timeRef.current = targetTick; if(worldRef.current) updateLighting(worldRef.current, timeRef.current); setIsSleepUIOpen(false); };

    // --- GAME LIFECYCLE ---

    const startNewGame = (save: SavedWorld | null, newConfig?: { name: string, seed: number, options: GameOptions }) => {
        if (save) {
            worldRef.current = save.worldData; playerRef.current = save.player; setInventory(save.inventory); setEquipment(save.equipment); setCurrentWorldId(save.id); setCurrentWorldName(save.name); setCurrentSeed(save.seed); timeRef.current = save.time;
            setPlayerLevel(save.level || 1); setPlayerXP(save.xp || 0); setSkillPoints(save.skillPoints || 0); setPlayerStats(save.stats || DEFAULT_STATS); staminaRef.current = save.stamina !== undefined ? save.stamina : MAX_STAMINA; hungerRef.current = save.hunger !== undefined ? save.hunger : 10;
            if (save.options) setOptions(save.options);
            furnacesRef.current = new Map(save.furnaces); chestsRef.current = new Map(save.chests); if (save.crops) cropsRef.current = new Map(save.crops); else cropsRef.current = new Map();
            entitiesRef.current = []; setHearts(save.player.health); setHunger(hungerRef.current); setStamina(staminaRef.current); updateLighting(worldRef.current, timeRef.current);
        } else if (newConfig) {
            // NOTE: If multiplayer client, we wait for seed from host. If host/singleplayer, generate now.
            if (!newConfig.options?.multiplayer || newConfig.options.multiplayer.mode === 'HOST') {
                const w = generateWorld(newConfig.seed); worldRef.current = w; 
                respawnPlayer(w); updateLighting(w, 0);
            } else {
                // Client mode: World will be generated when seed is received.
                // For now initialize empty to prevent crash
                worldRef.current = { width: WORLD_WIDTH, height: WORLD_HEIGHT, blocks: new Array(WORLD_WIDTH*WORLD_HEIGHT).fill(0), light: [] };
            }
            
            setCurrentWorldId(Date.now().toString()); setCurrentWorldName(newConfig.name); setCurrentSeed(newConfig.seed); 
            if (newConfig.options) setOptions(newConfig.options); 
            timeRef.current = 0; 
            setPlayerLevel(1); setPlayerXP(0); setSkillPoints(0); setPlayerStats(DEFAULT_STATS); staminaRef.current = MAX_STAMINA; hungerRef.current = 10;
            const inv = Array(36).fill(null); inv[0] = { id: BlockType.TORCH, count: 16, type: ItemType.BLOCK }; setInventory(inv); setEquipment({ helmet: null, chestplate: null, leggings: null, boots: null, offHand: null });
            furnacesRef.current = new Map(); chestsRef.current = new Map(); cropsRef.current = new Map(); entitiesRef.current = []; 
        }
        
        setGameState('PLAYING');
    };

    // --- MULTIPLAYER LOGIC ---
    useEffect(() => {
        if (gameState === 'PLAYING' && options.multiplayer) {
            const channelName = `mr2d_room_${options.multiplayer.roomId}`;
            const bc = new BroadcastChannel(channelName);
            broadcastChannelRef.current = bc;
            
            const myPlayerId = Date.now() + Math.random(); 

            // Send Join Signal
            bc.postMessage({ type: 'JOIN', payload: { id: myPlayerId, name: options.multiplayer.playerName } });

            bc.onmessage = (event) => {
                const { type, payload } = event.data;
                
                if (type === 'JOIN') {
                    if (payload.id !== myPlayerId) {
                        addNotification(`${payload.name || 'Player'} joined the world!`);
                        if (options.multiplayer?.mode === 'HOST' && worldRef.current) {
                            // SEND FULL WORLD DATA ON JOIN TO SYNC BROKEN BLOCKS
                            bc.postMessage({ 
                                type: 'SYNC_WORLD', 
                                payload: { 
                                    seed: currentSeed,
                                    world: worldRef.current // Send the actual modified world object
                                } 
                            });
                        }
                    }
                } else if (type === 'UPDATE') {
                    if (payload.id !== myPlayerId) {
                        const existingIdx = otherPlayersRef.current.findIndex(p => p.id === payload.id);
                        if (existingIdx !== -1) {
                            otherPlayersRef.current[existingIdx] = { 
                                ...otherPlayersRef.current[existingIdx], 
                                ...payload,
                                lastSeen: Date.now() // Update heartbeat
                            };
                        } else {
                            otherPlayersRef.current.push({
                                ...payload,
                                type: 'PLAYER',
                                width: 20, height: 56, grounded: true, health: 100, maxHealth: 100,
                                lastSeen: Date.now()
                            });
                        }
                    }
                } else if (type === 'SYNC_WORLD') {
                    if (options.multiplayer?.mode === 'CLIENT' && payload.world) {
                        // Receiving full world data from host
                        console.log("Received Full World Sync from Host");
                        worldRef.current = payload.world;
                        respawnPlayer(payload.world);
                        updateLighting(payload.world, 0);
                        setCurrentSeed(payload.seed);
                        addNotification("Synced with Host World!");
                    } else if (options.multiplayer?.mode === 'CLIENT' && payload.seed && !payload.world) {
                        // Fallback for seed-only (legacy check)
                        console.log("Received Seed from Host:", payload.seed);
                        if (currentSeed !== payload.seed) {
                            const w = generateWorld(payload.seed);
                            worldRef.current = w;
                            respawnPlayer(w);
                            updateLighting(w, 0);
                            setCurrentSeed(payload.seed);
                            addNotification("Synced with Host World!");
                        }
                    }
                } else if (type === 'BLOCK_UPDATE') {
                    // Another player placed/broke a block
                    setBlockAt(payload.x, payload.y, payload.type, false); // False = Don't broadcast back
                } else if (type === 'CHEST_UPDATE') {
                    chestsRef.current.set(payload.key, payload.content);
                    if (activeChestPos === payload.key && isChestOpen) setUiTick(t => t+1);
                } else if (type === 'FURNACE_UPDATE') {
                    furnacesRef.current.set(payload.key, payload.data);
                    if (activeFurnacePos === payload.key && isFurnaceOpen) setUiTick(t => t+1);
                } else if (type === 'SPAWN_DROP') {
                    // Both Host and Client receive this.
                    // Check if we already have it to avoid duplicates
                    if (!entitiesRef.current.find(e => e.id === payload.id)) {
                        entitiesRef.current.push({
                            ...payload,
                            id: payload.id, 
                            type: 'DROP',
                            creationTime: Date.now()
                        });
                    }
                } else if (type === 'REMOVE_DROP') {
                    entitiesRef.current = entitiesRef.current.filter(e => e.id !== payload.id);
                } else if (type === 'SYNC_ENTITIES') {
                    // Client syncs ALL entities (Mobs + Drops) from Host
                    if (options.multiplayer?.mode === 'CLIENT') {
                        const hostEntities = payload as Entity[];
                        
                        // Merge Strategy: Keep local players, replace everything else (Mobs/Drops) with Host state
                        // This prevents Client physics fighting Host physics
                        const localPlayers = entitiesRef.current.filter(e => e.type === 'PLAYER' || e.type === 'PROJECTILE');
                        
                        const syncedEntities = [...localPlayers, ...hostEntities];
                        entitiesRef.current = syncedEntities;
                    }
                } else if (type === 'DAMAGE_MOB') {
                    // Host receives damage request from Client
                    if (options.multiplayer?.mode === 'HOST') {
                        const targetMob = entitiesRef.current.find(e => e.id === payload.id);
                        if (targetMob) {
                            targetMob.health -= payload.damage;
                            targetMob.lastDamageTime = Date.now();
                            targetMob.vx = payload.knockbackX || 0;
                            targetMob.vy = payload.knockbackY || -3;
                            
                            if (targetMob.health <= 0) {
                                // Loot logic is handled in game loop by Host
                            }
                        }
                    }
                }
            };

            // Periodic Update Loop (Movement & Host Sync & Cleanup)
            const interval = setInterval(() => {
                const p = playerRef.current;
                
                // 1. Send Player Position
                bc.postMessage({
                    type: 'UPDATE',
                    payload: {
                        id: myPlayerId,
                        x: p.x,
                        y: p.y,
                        vx: p.vx,
                        vy: p.vy,
                        facingRight: p.facingRight,
                        playerName: options.multiplayer?.playerName
                    }
                });

                // 2. Cleanup "Ghost" Players (No heartbeat for > 3 seconds)
                const now = Date.now();
                otherPlayersRef.current = otherPlayersRef.current.filter(op => {
                    return (now - (op.lastSeen || 0)) < 3000;
                });

                // 3. Host Syncs Everything (Mobs + Drops)
                if (options.multiplayer?.mode === 'HOST') {
                    const syncableEntities = entitiesRef.current.filter(e => e.type !== 'PLAYER' && e.type !== 'PROJECTILE');
                    if (syncableEntities.length > 0) {
                        bc.postMessage({
                            type: 'SYNC_ENTITIES',
                            payload: syncableEntities
                        });
                    }
                }

            }, 50); 

            return () => {
                clearInterval(interval);
                bc.close();
            };
        }
    }, [gameState, options.multiplayer, currentSeed, activeChestPos, activeFurnacePos, isChestOpen, isFurnaceOpen]);


    const saveGame = async () => {
        if (!worldRef.current) return;
        const save: SavedWorld = { id: currentWorldId, name: currentWorldName, seed: currentSeed, worldData: worldRef.current, player: playerRef.current, inventory: inventory, equipment: equipment, furnaces: Array.from(furnacesRef.current.entries()), chests: Array.from(chestsRef.current.entries()), crops: Array.from(cropsRef.current.entries()), time: timeRef.current, lastPlayed: Date.now(), xp: playerXP, level: playerLevel, skillPoints: skillPoints, stats: playerStats, stamina: staminaRef.current, hunger: hungerRef.current, options: options };
        try { await saveWorldToDB(save); console.log("Game Saved to IndexedDB!"); } catch (e) { console.error("Save failed", e); alert("Failed to save game! Database error."); }
    };

    const handleSaveAndQuit = () => { saveGame().then(() => { setGameState('MENU'); worldRef.current = null; setAdminFlags({ noClip: false, nightVision: false, showCreative: false }); setIsAdminMenuOpen(false); setNotifications([]); otherPlayersRef.current = []; if(broadcastChannelRef.current) broadcastChannelRef.current.close(); }); };

    const checkTotemRevive = () => {
        // Check Offhand first (standard MC behavior)
        if (equipment.offHand && equipment.offHand.id === 'uranium_totem') {
             // Consume Offhand
             setEquipment(prev => ({...prev, offHand: null}));
             // Revive effects
             playerRef.current.health = 4; // 2 hearts
             setHearts(4);
             // Particle effect
             for(let i=0; i<15; i++) { 
                 entitiesRef.current.push({ 
                     id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + 10, y: playerRef.current.y + 20, width: 4, height: 4, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now(), itemMeta: { damage: 0 } 
                 }); 
             }
             return true;
        }

        // Then check Inventory
        const totemIndex = inventory.findIndex(item => item && item.id === 'uranium_totem');
        if (totemIndex !== -1) {
            playerRef.current.health = 4; setHearts(4);
            setInventory(prev => { const n = [...prev]; n[totemIndex] = null; return n; });
            for(let i=0; i<15; i++) { entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + 10, y: playerRef.current.y + 20, width: 4, height: 4, vx: (Math.random() - 0.5) * 8, vy: (Math.random() - 0.5) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: true, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now(), itemMeta: { damage: 0 } }); }
            return true;
        }
        return false;
    }

    const respawnPlayer = (w: WorldData) => {
        if (checkTotemRevive()) return;
        const midX = Math.floor(WORLD_WIDTH / 2); let spawnY = 0;
        for(let y=0; y<WORLD_HEIGHT; y++) { if (w.blocks[y * WORLD_WIDTH + midX] !== BlockType.AIR && w.blocks[y * WORLD_WIDTH + midX] !== BlockType.WATER) { spawnY = (y - 3) * BLOCK_SIZE; break; } }
        if (spawnY === 0) spawnY = 10 * BLOCK_SIZE;
        playerRef.current.y = spawnY; playerRef.current.x = midX * BLOCK_SIZE; playerRef.current.vx = 0; playerRef.current.vy = 0;
        const maxHP = 10 + playerStats.vitality * 2; playerRef.current.maxHealth = maxHP; playerRef.current.health = maxHP; hungerRef.current = 10; staminaRef.current = MAX_STAMINA + (playerStats.endurance * 20); setHearts(maxHP); setHunger(10);
    };

    const gainXP = (amount: number) => {
        setPlayerXP(prev => { let newXP = prev + amount; let currentLevel = playerLevel; let threshold = currentLevel * 100; while (newXP >= threshold) { newXP -= threshold; currentLevel++; setSkillPoints(sp => sp + 1); threshold = currentLevel * 100; } setPlayerLevel(currentLevel); return newXP; });
    };

    const upgradeStat = (statName: keyof PlayerStats) => {
        if (skillPoints > 0) { setPlayerStats(prev => { const updated = { ...prev, [statName]: prev[statName] + 1 }; if (statName === 'vitality') { const newMax = 10 + updated.vitality * 2; playerRef.current.maxHealth = newMax; } return updated; }); setSkillPoints(prev => prev - 1); }
    };

    const getRenderLight = (x: number, y: number, baseLight: number, player: Entity, hasTorch: boolean) => {
        if (adminFlags.nightVision) return 15; let l = baseLight;
        if (hasTorch) { const px = Math.floor((player.x + player.width/2) / BLOCK_SIZE); const py = Math.floor((player.y + player.height/2) / BLOCK_SIZE); const dist = Math.abs(x - px) + Math.abs(y - py); if (dist < 9) l = Math.max(l, 14 - Math.floor(dist * 1.5)); }
        return l;
    };

    const isProtectedFromRadiation = (eq: Equipment): boolean => {
        const isHazmat = eq.helmet?.id === 'hazmat_helmet' && eq.chestplate?.id === 'hazmat_chestplate' && eq.leggings?.id === 'hazmat_leggings' && eq.boots?.id === 'hazmat_boots';
        const isReinforcedIron = eq.helmet?.id === 'reinforced_iron_helmet' && eq.chestplate?.id === 'reinforced_iron_chestplate' && eq.leggings?.id === 'reinforced_iron_leggings' && eq.boots?.id === 'reinforced_iron_boots';
        const isTitanium = eq.helmet?.id === 'titanium_helmet' && eq.chestplate?.id === 'titanium_chestplate' && eq.leggings?.id === 'titanium_leggings' && eq.boots?.id === 'titanium_boots';
        const isUranium = eq.helmet?.id === 'uranium_helmet' && eq.chestplate?.id === 'uranium_chestplate' && eq.leggings?.id === 'uranium_leggings' && eq.boots?.id === 'uranium_boots';
        return isHazmat || isReinforcedIron || isTitanium || isUranium;
    }

    useEffect(() => {
        const handleResize = () => { if (canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } };
        window.addEventListener('resize', handleResize);
        // Force resize once on mount
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState === 'MENU') return;
            if (e.code === 'Escape') { if (isInventoryOpen || isFurnaceOpen || isChestOpen || isHammerMenuOpen || isUpgradeOpen || isAdminMenuOpen || isSleepUIOpen) { setIsInventoryOpen(false); setIsFurnaceOpen(false); setIsChestOpen(false); setIsHammerMenuOpen(false); setIsUpgradeOpen(false); setIsAdminMenuOpen(false); setIsSleepUIOpen(false); setActiveBuildBlock(null); setCursorItem(null); } else { setGameState(prev => prev === 'PLAYING' ? 'PAUSED' : 'PLAYING'); } return; }
            if (gameState !== 'PLAYING') return;
            keysRef.current[e.code] = true;
            if (e.code === 'KeyE') { const heldItem = inventory[selectedSlot]; if (heldItem && heldItem.id.toString().includes('hammer')) { setIsHammerMenuOpen(true); return; } if (isFurnaceOpen || isChestOpen || isUpgradeOpen || isSleepUIOpen) { setIsFurnaceOpen(false); setIsChestOpen(false); setIsUpgradeOpen(false); setIsSleepUIOpen(false); if (cursorItem) setCursorItem(null); } else { if (isInventoryOpen) { setIsInventoryOpen(false); setNearbyStation('NONE'); } else { setIsInventoryOpen(true); setNearbyStation('NONE'); } } }
            if (e.code === 'KeyF') handleInteraction();
            if (e.code === 'KeyG') dropItem();
            if (e.code === 'KeyQ') { if (equipment.offHand && equipment.offHand.type === ItemType.SHIELD) { blockingRef.current = true; } }
            if (e.code === 'KeyP') { if (options.adminMode) { setIsAdminMenuOpen(prev => !prev); } }
            if (e.code.startsWith('Digit')) { const num = parseInt(e.code.replace('Digit', '')); if (num > 0 && num <= 9) setSelectedSlot(num - 1); }
            if (e.code === 'ShiftLeft') sprintRef.current = true;
            if (e.code === 'KeyR') { setEquipment(prev => ({ ...prev, offHand: inventory[selectedSlot] })); setInventory(prev => { const newInv = [...prev]; newInv[selectedSlot] = equipment.offHand; return newInv; }); }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysRef.current[e.code] = false; if (e.code === 'ShiftLeft') sprintRef.current = false; if (e.code === 'KeyQ') blockingRef.current = false; };
        const handleMouseDown = (e: MouseEvent) => { if (gameState !== 'PLAYING') return; if (e.button === 0) mouseRef.current.left = true; if (e.button === 2) { mouseRef.current.right = true; const heldItem = inventory[selectedSlot]; if (heldItem && heldItem.id.toString().includes('spear') && !heldItem.id.toString().includes('hunting')) { spearChargeStartRef.current = Date.now(); } } };
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 0) { mouseRef.current.left = false; breakingRef.current = { x: -1, y: -1, progress: 0 }; }
            if (e.button === 2) {
                mouseRef.current.right = false;
                const heldItem = inventory[selectedSlot];
                if (heldItem && heldItem.type === ItemType.ARMOR) { const idStr = heldItem.id.toString(); let slot: keyof Equipment | null = null; if (idStr.includes('helmet')) slot = 'helmet'; else if (idStr.includes('chestplate')) slot = 'chestplate'; else if (idStr.includes('leggings')) slot = 'leggings'; else if (idStr.includes('boots')) slot = 'boots'; if (slot) { const currentEquip = equipment[slot]; setEquipment(prev => ({ ...prev, [slot]: heldItem })); setInventory(prev => { const n = [...prev]; n[selectedSlot] = currentEquip; return n; }); return; } }
                const bx = Math.floor((mouseRef.current.x + cameraRef.current.x) / BLOCK_SIZE); const by = Math.floor((mouseRef.current.y + cameraRef.current.y) / BLOCK_SIZE);
                if (worldRef.current) { const idx = by * WORLD_WIDTH + bx; const b = worldRef.current.blocks[idx]; if (b === BlockType.DOOR_BOTTOM_CLOSED) { setBlockAt(bx, by, BlockType.DOOR_BOTTOM_OPEN); setBlockAt(bx, by - 1, BlockType.DOOR_TOP_OPEN); } else if (b === BlockType.DOOR_BOTTOM_OPEN) { setBlockAt(bx, by, BlockType.DOOR_BOTTOM_CLOSED); setBlockAt(bx, by - 1, BlockType.DOOR_TOP_CLOSED); } else if (b === BlockType.DOOR_TOP_CLOSED) { setBlockAt(bx, by, BlockType.DOOR_TOP_OPEN); setBlockAt(bx, by + 1, BlockType.DOOR_BOTTOM_OPEN); } else if (b === BlockType.DOOR_TOP_OPEN) { setBlockAt(bx, by, BlockType.DOOR_TOP_CLOSED); setBlockAt(bx, by + 1, BlockType.DOOR_BOTTOM_CLOSED); } }
                const heldId = heldItem ? heldItem.id.toString() : '';
                if (heldId === 'bow' || heldId === 'crossbow') { const arrowIdx = inventory.findIndex(i => i && i.id === 'arrow' && i.count > 0); if (arrowIdx !== -1) { const isCrossbow = heldId === 'crossbow'; const cooldown = isCrossbow ? 3000 : 1000; if ((playerRef.current.attackCooldown || 0) <= 0) { const cvs = canvasRef.current; if (cvs) { const mx = mouseRef.current.x; const my = mouseRef.current.y; const px = playerRef.current.x + playerRef.current.width/2 - cameraRef.current.x; const py = playerRef.current.y + playerRef.current.height/2 - cameraRef.current.y; const angle = Math.atan2(my - py, mx - px); const force = 15; const shotCount = isCrossbow ? 3 : 1; for(let i=0; i<shotCount; i++) { const spread = isCrossbow ? (i - 1) * 0.1 : 0; const vx = Math.cos(angle + spread) * force; const vy = Math.sin(angle + spread) * force; entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + (vx > 0 ? 20 : -10), y: playerRef.current.y + 10, width: 16, height: 4, vx, vy, grounded: false, health: 1, maxHealth: 1, facingRight: vx > 0, rotation: angle + spread, itemId: 'arrow', projectileState: 'FLYING', ownerId: playerRef.current.id, creationTime: Date.now() }); } setInventory(prev => { const newInv = [...prev]; if (newInv[arrowIdx]) { newInv[arrowIdx]!.count--; if (newInv[arrowIdx]!.count <= 0) newInv[arrowIdx] = null; } return newInv; }); playerRef.current.attackCooldown = cooldown / 16; } } } }
                if (spearChargeStartRef.current) { const chargeTime = Date.now() - spearChargeStartRef.current; const osc = (Math.sin(chargeTime / 300) + 1) / 2; spearChargeStartRef.current = null; if (heldItem && heldItem.id.toString().includes('spear') && !heldItem.id.toString().includes('hunting')) { const force = 10 + (osc * 15); const cvs = canvasRef.current; if(cvs) { const mx = mouseRef.current.x; const my = mouseRef.current.y; const px = playerRef.current.x + playerRef.current.width/2 - cameraRef.current.x; const py = playerRef.current.y + playerRef.current.height/2 - cameraRef.current.y; const angle = Math.atan2(my - py, mx - px); const vx = Math.cos(angle) * force; const vy = Math.sin(angle) * force; entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: playerRef.current.x + (vx > 0 ? 20 : -10), y: playerRef.current.y + 10, width: 32, height: 8, vx, vy, grounded: false, health: 1, maxHealth: 1, facingRight: vx > 0, rotation: angle, itemId: heldItem.id, projectileState: 'FLYING', ownerId: playerRef.current.id, loyalty: heldItem.meta?.loyalty, creationTime: Date.now() }); setInventory(prev => { const n = [...prev]; n[selectedSlot] = null; return n; }); } } }
            }
        };
        const handleMouseMove = (e: MouseEvent) => { setUiMousePos({ x: e.clientX, y: e.clientY }); if (canvasRef.current) { const pos = getMousePos(canvasRef.current, e); mouseRef.current.x = pos.x; mouseRef.current.y = pos.y; } };
        
        // Touch handler for aiming on canvas
        const handleTouchStart = (e: TouchEvent) => {
            if (options.isMobile && gameState === 'PLAYING' && canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                mouseRef.current.x = x;
                mouseRef.current.y = y;
            }
        };

        window.addEventListener('keydown', handleKeyDown); window.addEventListener('keyup', handleKeyUp); window.addEventListener('mousedown', handleMouseDown); window.addEventListener('mouseup', handleMouseUp); window.addEventListener('mousemove', handleMouseMove); window.addEventListener('contextmenu', (e) => e.preventDefault());
        
        if (options.isMobile) {
            window.addEventListener('touchstart', handleTouchStart);
            window.addEventListener('touchmove', handleTouchStart);
        }

        requestRef.current = requestAnimationFrame(gameLoop);
        return () => { 
            window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); window.removeEventListener('mousedown', handleMouseDown); window.removeEventListener('mouseup', handleMouseUp); window.removeEventListener('mousemove', handleMouseMove); if (requestRef.current) cancelAnimationFrame(requestRef.current);
            if (options.isMobile) {
                window.removeEventListener('touchstart', handleTouchStart);
                window.removeEventListener('touchmove', handleTouchStart);
            }
        };
    }, [gameState, cursorItem, isFurnaceOpen, isChestOpen, isInventoryOpen, inventory, selectedSlot, playerStats, equipment, isHammerMenuOpen, activeBuildBlock, isUpgradeOpen, options.adminMode, isSleepUIOpen, options.isMobile]); 

    // --- GAME LOOP ---
    const gameLoop = () => {
        if (gameState !== 'PLAYING') { requestRef.current = requestAnimationFrame(gameLoop); if (gameState === 'PAUSED' && canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); if(ctx) { ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height); } } return; }
        const player = playerRef.current; const world = worldRef.current; const cvs = canvasRef.current; if (!world || !cvs) return; const ctx = cvs.getContext('2d'); if (!ctx) return;
        const isPaused = isInventoryOpen || isFurnaceOpen || isChestOpen || isHammerMenuOpen || isUpgradeOpen || isAdminMenuOpen || isSleepUIOpen;
        
        if (!isPaused) {
            timeRef.current = (timeRef.current + 1) % FULL_DAY_TICKS;
            const animals = entitiesRef.current.filter(e => e.type !== 'DROP' && e.type !== 'PROJECTILE' && e.type !== 'PLAYER'); if (animals.length > 50) { const toRemove = animals.length - 50; let removed = 0; for (let i = 0; i < entitiesRef.current.length; i++) { if (removed >= toRemove) break; const e = entitiesRef.current[i]; if (['COW','PIG','SHEEP','ZOMBIE'].includes(e.type)) { entitiesRef.current.splice(i, 1); i--; removed++; } } }
            const hasUranium = inventory.some(i => i && (i.id === 'uranium' || i.id === BlockType.URANIUM_ORE)); if (hasUranium && !isProtectedFromRadiation(equipment)) { if (Date.now() - lastRadiationDamageRef.current > 1000) { player.health = Math.max(0, player.health - 0.5); lastRadiationDamageRef.current = Date.now(); } }
            const maxStamina = MAX_STAMINA + (playerStats.endurance * 20); const drainEfficiency = Math.max(0.1, 1 - (playerStats.endurance * 0.05)); const regenEfficiency = 1 + (playerStats.endurance * 0.1); if (!sprintRef.current) { if (staminaRef.current < maxStamina && hungerRef.current > 0) staminaRef.current = Math.min(maxStamina, staminaRef.current + (BASE_STAMINA_REGEN * regenEfficiency)); } else { if (Math.abs(player.vx) > PLAYER_SPEED) { if (staminaRef.current > 0) staminaRef.current = Math.max(0, staminaRef.current - (BASE_STAMINA_DRAIN * drainEfficiency)); else hungerRef.current = Math.max(0, hungerRef.current - SPRINT_HUNGER_DRAIN); } }
            const decayInterval = HUNGER_DECAY_TICK + (playerStats.metabolism * 1000); if (timeRef.current % decayInterval < 1 && hungerRef.current > 0) hungerRef.current = Math.max(0, hungerRef.current - 0.5);
            if (timeRef.current % 1000 === 0) { cropsRef.current.forEach((crop, key) => { if (crop.stage < 3 && Math.random() < 0.3) { crop.stage++; if (Date.now() - crop.plantedTime > 60000 * 5) crop.stage = 3; } }); }
            if ((Math.abs(timeRef.current - DUSK_START) < 5) || (Math.abs(timeRef.current - NIGHT_START) < 5) || (Math.abs(timeRef.current - DAWN_START) < 5)) updateLighting(world, timeRef.current);
            if (timeRef.current % 1000 === 0) updateLighting(world, timeRef.current);
            if (timeRef.current < DUSK_START && world.light[0] < 15 && timeRef.current % 60 === 0) updateLighting(world, timeRef.current);
            furnacesRef.current.forEach((furnace) => { let dirty = false; if (furnace.burnTime > 0) { furnace.burnTime--; dirty = true; } else if (furnace.burnTime <= 0 && furnace.input && furnace.fuel && furnace.input.count > 0 && furnace.fuel.count > 0) { const outputId = COOKING_RECIPES[furnace.input.id.toString()]; if (outputId) { if (!furnace.output || (furnace.output.id === outputId && furnace.output.count < 64)) { const fuelVal = FUEL_VALUES[furnace.fuel.id.toString()]; if (fuelVal) { furnace.maxBurnTime = fuelVal; furnace.burnTime = fuelVal; furnace.fuel.count--; if(furnace.fuel.count <= 0) furnace.fuel = null; dirty = true; } } } } if (furnace.burnTime > 0 && furnace.input) { const outputId = COOKING_RECIPES[furnace.input.id.toString()]; if (outputId) { if (!furnace.output || (furnace.output.id === outputId && furnace.output.count < 64)) { furnace.cookTime++; if (furnace.cookTime >= 200) { furnace.cookTime = 0; furnace.input.count--; if (furnace.input.count <= 0) furnace.input = null; if (!furnace.output) furnace.output = { id: outputId, count: 1, type: outputId.includes('ingot') || outputId === 'diamond' ? ItemType.MATERIAL : ItemType.FOOD }; else furnace.output.count++; } dirty = true; } else furnace.cookTime = 0; } else furnace.cookTime = 0; } else if (furnace.cookTime > 0) { furnace.cookTime = 0; dirty = true; } });
            if ((isFurnaceOpen || isChestOpen) && timeRef.current % 10 === 0) setUiTick(t => t+1);
            const isDay = timeRef.current >= 0 && timeRef.current < DUSK_START;
            if (Math.random() < 0.02 && entitiesRef.current.length < 50) { const r = Math.random(); if (isDay && r < 0.3) spawnMob(r < 0.1 ? 'PIG' : (r < 0.2 ? 'SHEEP' : 'COW')); else if (!isDay && r < 0.5) spawnMob('ZOMBIE'); }
            const baseSpeed = PLAYER_SPEED + (playerStats.agility * 0.5); const runSpeed = PLAYER_RUN_SPEED + (playerStats.agility * 0.8); const speed = (sprintRef.current && (hungerRef.current > 3 || staminaRef.current > 0)) ? runSpeed : baseSpeed;
            if (blockingRef.current) { if (keysRef.current['KeyA']) { player.vx = -speed * 0.3; player.facingRight = false; } else if (keysRef.current['KeyD']) { player.vx = speed * 0.3; player.facingRight = true; } else { player.vx *= 0.8; } } else { if (keysRef.current['KeyA']) { player.vx = -speed; player.facingRight = false; } else if (keysRef.current['KeyD']) { player.vx = speed; player.facingRight = true; } else { player.vx *= 0.8; } }
            if (adminFlags.noClip) { const flySpeed = speed * 1.5; player.vx = 0; player.vy = 0; if (keysRef.current['KeyW']) player.vy = -flySpeed; if (keysRef.current['KeyS']) player.vy = flySpeed; if (keysRef.current['KeyA']) { player.vx = -flySpeed; player.facingRight = false; } if (keysRef.current['KeyD']) { player.vx = flySpeed; player.facingRight = true; } player.x += player.vx; player.y += player.vy; player.grounded = false; } else { const pCenterX = Math.floor((player.x + player.width/2)/BLOCK_SIZE); const pCenterY = Math.floor((player.y + player.height/2)/BLOCK_SIZE); const inWaterIdx = pCenterY * WORLD_WIDTH + pCenterX; const inWater = world.blocks[inWaterIdx] === BlockType.WATER; if (inWater) { player.vy += 0.1; if (player.vy > 2) player.vy = 2; player.vx *= 0.8; player.vy *= 0.9; if (keysRef.current['Space']) player.vy = -3; if (sprintRef.current) { const swimSpeed = 4; if (keysRef.current['KeyA']) player.vx = -swimSpeed; else if (keysRef.current['KeyD']) player.vx = swimSpeed; else { if (player.facingRight) player.vx = swimSpeed; else player.vx = -swimSpeed; } } } else { if ((keysRef.current['Space'] || keysRef.current['KeyW']) && player.grounded) { player.vy = -JUMP_FORCE; player.grounded = false; } player.vy += GRAVITY; if (player.vy > TERMINAL_VELOCITY) player.vy = TERMINAL_VELOCITY; } player.x += player.vx; if (checkCollision(player, world)) { player.x -= player.vx; player.vx = 0; } player.y += player.vy; player.grounded = false; if (checkCollision(player, world)) { player.y -= player.vy; if (player.vy > 0) player.grounded = true; player.vy = 0; } }
            if (player.x < 0) player.x = 0; if (player.x > WORLD_WIDTH * BLOCK_SIZE - player.width) player.x = WORLD_WIDTH * BLOCK_SIZE - player.width; if (player.y > WORLD_HEIGHT * BLOCK_SIZE || player.health <= 0) respawnPlayer(world); player.attackCooldown = Math.max(0, (player.attackCooldown || 0) - 1); setHearts(player.health); setHunger(hungerRef.current); setStamina(staminaRef.current);
            
            // --- ENTITY LOOP ---
            for (let i = entitiesRef.current.length - 1; i >= 0; i--) {
                const ent = entitiesRef.current[i];
                
                // --- DROP LOGIC ---
                if (ent.type === 'DROP') { 
                    // CLIENT: Do not simulate physics for drops, just render them based on host data
                    if (options.multiplayer?.mode === 'CLIENT') {
                        // Check if player picked it up locally (Client-side pickup prediction)
                        const dx = (player.x + player.width/2) - (ent.x + ent.width/2); 
                        const dy = (player.y + player.height/2) - (ent.y + ent.height/2); 
                        if (Math.sqrt(dx*dx + dy*dy) < 30) { 
                            setInventory(prev => { 
                                const newInv = [...prev]; let added = false; const isTool = ent.itemId && typeof ent.itemId === 'string' && (ent.itemId.includes('pickaxe') || ent.itemId.includes('sword') || ent.itemId.includes('axe') || ent.itemId.includes('shovel') || ent.itemId.includes('katana') || ent.itemId.includes('spear') || ent.itemId.includes('hammer') || ent.itemId.includes('hoe') || ent.itemId.includes('shield') || ent.itemId.includes('dagger') || ent.itemId.includes('club') || ent.itemId.includes('scythe') || ent.itemId.includes('bow') || ent.itemId.includes('crossbow') || ent.itemId.includes('knife') || ent.itemId === 'uranium_totem'); if (!isTool) { for(let j=0; j<36; j++) { if (newInv[j] && newInv[j]!.id === ent.itemId && newInv[j]!.count < 64) { newInv[j]!.count += (ent.itemCount || 1); added = true; break; } } } if (!added) { for(let j=0; j<36; j++) { if (!newInv[j]) { newInv[j] = { id: ent.itemId!, count: (ent.itemCount || 1), type: typeof ent.itemId === 'number' ? ItemType.BLOCK : (FOOD_VALUES[ent.itemId as string] ? ItemType.FOOD : (isTool ? (ent.itemId.toString().includes('shield') ? ItemType.SHIELD : ItemType.TOOL) : ItemType.MATERIAL)), meta: ent.itemMeta }; added = true; break; } } } 
                                return newInv; 
                            }); 
                            broadcast('REMOVE_DROP', { id: ent.id });
                            entitiesRef.current.splice(i, 1); 
                        }
                        continue; 
                    }

                    // HOST/SP: Simulate Physics
                    if (ent.creationTime && Date.now() - ent.creationTime > 60000) { entitiesRef.current.splice(i, 1); continue; } 
                    ent.vy += GRAVITY; ent.y += ent.vy; if (checkCollision(ent, world)) { ent.y -= ent.vy; ent.vy = 0; } 
                    
                    // Host Pickup check (Self)
                    const dx = (player.x + player.width/2) - (ent.x + ent.width/2); 
                    const dy = (player.y + player.height/2) - (ent.y + ent.height/2); 
                    if (Math.sqrt(dx*dx + dy*dy) < 30) { 
                        setInventory(prev => { const newInv = [...prev]; let added = false; const isTool = ent.itemId && typeof ent.itemId === 'string' && (ent.itemId.includes('pickaxe') || ent.itemId.includes('sword') || ent.itemId.includes('axe') || ent.itemId.includes('shovel') || ent.itemId.includes('katana') || ent.itemId.includes('spear') || ent.itemId.includes('hammer') || ent.itemId.includes('hoe') || ent.itemId.includes('shield') || ent.itemId.includes('dagger') || ent.itemId.includes('club') || ent.itemId.includes('scythe') || ent.itemId.includes('bow') || ent.itemId.includes('crossbow') || ent.itemId.includes('knife') || ent.itemId === 'uranium_totem'); if (!isTool) { for(let j=0; j<36; j++) { if (newInv[j] && newInv[j]!.id === ent.itemId && newInv[j]!.count < 64) { newInv[j]!.count += (ent.itemCount || 1); added = true; break; } } } if (!added) { for(let j=0; j<36; j++) { if (!newInv[j]) { newInv[j] = { id: ent.itemId!, count: (ent.itemCount || 1), type: typeof ent.itemId === 'number' ? ItemType.BLOCK : (FOOD_VALUES[ent.itemId as string] ? ItemType.FOOD : (isTool ? (ent.itemId.toString().includes('shield') ? ItemType.SHIELD : ItemType.TOOL) : ItemType.MATERIAL)), meta: ent.itemMeta }; added = true; break; } } } return newInv; }); 
                        broadcast('REMOVE_DROP', { id: ent.id });
                        entitiesRef.current.splice(i, 1); 
                        continue; 
                    } 
                    continue; 
                }
                
                // --- PROJECTILE LOGIC ---
                else if (ent.type === 'PROJECTILE') { /* Projectile logic same as before */ if (ent.projectileState === 'FLYING') { ent.vy += 0.2; ent.x += ent.vx; ent.y += ent.vy; ent.rotation = Math.atan2(ent.vy, ent.vx); let projectileDestroyed = false; for (let j = entitiesRef.current.length - 1; j >= 0; j--) { const mob = entitiesRef.current[j]; if (mob.type === 'PLAYER' || mob.type === 'DROP' || mob.type === 'PROJECTILE') continue; if (ent.x < mob.x + mob.width && ent.x + ent.width > mob.x && ent.y < mob.y + mob.height && ent.y + ent.height > mob.y) { const heldItemId = ent.itemId ? ent.itemId.toString() : 'wood_spear'; const isArrow = heldItemId === 'arrow'; const isRadioactive = heldItemId === 'uranium'; const damage = isRadioactive ? 5 : (isArrow ? 4 : (DAMAGE_VALUES[heldItemId] || 1)); mob.health -= damage; mob.lastDamageTime = Date.now(); if (mob.health <= 0) { gainXP(XP_PER_MOB); entitiesRef.current.splice(j, 1); if (mob.type === 'COW') { spawnDrop(mob.x, mob.y, 'raw_beef', 2); spawnDrop(mob.x, mob.y, 'leather', 1); } if (mob.type === 'PIG') spawnDrop(mob.x, mob.y, 'raw_porkchop', 2); if (mob.type === 'SHEEP') spawnDrop(mob.x, mob.y, BlockType.WOOL, 1); if (mob.type === 'ZOMBIE') spawnDrop(mob.x, mob.y, 'raw_beef', 1); if (mob.type === 'MUTANT_ZOMBIE') { spawnDrop(mob.x, mob.y, 'uranium_totem', 1); spawnDrop(mob.x, mob.y, 'uranium', 5); } } if (ent.loyalty) ent.projectileState = 'RETURNING'; else { if(!isArrow && !isRadioactive) spawnDrop(ent.x, ent.y, ent.itemId!, 1, ent.itemMeta); entitiesRef.current.splice(i, 1); } projectileDestroyed = true; break; } if (ent.itemId === 'uranium') { const p = playerRef.current; if (ent.x < p.x + p.width && ent.x + ent.width > p.x && ent.y < p.y + p.height && ent.y + ent.height > p.y) { p.health -= 5; entitiesRef.current.splice(i, 1); projectileDestroyed = true; break; } } } if (projectileDestroyed) continue; if (checkCollision(ent, world)) { if (ent.loyalty) ent.projectileState = 'RETURNING'; else { if(ent.itemId !== 'arrow' && ent.itemId !== 'uranium') spawnDrop(ent.x, ent.y, ent.itemId!, 1, ent.itemMeta); entitiesRef.current.splice(i, 1); continue; } } } else if (ent.projectileState === 'RETURNING') { const dx = player.x - ent.x; const dy = player.y - ent.y; const dist = Math.sqrt(dx*dx + dy*dy); const speed = 15; ent.vx = (dx / dist) * speed; ent.vy = (dy / dist) * speed; ent.x += ent.vx; ent.y += ent.vy; ent.rotation = Math.atan2(ent.vy, ent.vx) + Math.PI; if (dist < 30) { entitiesRef.current.splice(i, 1); setInventory(prev => { const newInv = [...prev]; let added = false; for(let j=0; j<36; j++) { if(newInv[j] && newInv[j]!.id === ent.itemId && newInv[j]!.meta?.loyalty === ent.loyalty && newInv[j]!.count < 64) { newInv[j]!.count++; added = true; break; } } if(!added) { for(let j=0; j<36; j++) { if(!newInv[j]) { newInv[j] = { id: ent.itemId!, count: 1, type: ItemType.TOOL, meta: ent.itemMeta }; if (ent.loyalty) { if(!newInv[j]!.meta) newInv[j]!.meta = {}; newInv[j]!.meta!.loyalty = true; } break; } } } return newInv; }); continue; } } continue; }
                
                // --- MOB LOGIC ---
                // HOST AUTHORITATIVE: Only Host runs mob physics/AI
                if (options.multiplayer?.mode === 'CLIENT' && (ent.type === 'ZOMBIE' || ent.type === 'COW' || ent.type === 'PIG' || ent.type === 'SHEEP' || ent.type === 'MUTANT_ZOMBIE')) {
                    continue; // Client just renders based on x/y/facingRight from Host sync
                }

                ent.vy += GRAVITY; ent.y += ent.vy; if (checkCollision(ent, world)) { ent.y -= ent.vy; ent.vy = 0; } let wallInFront = false; const nextX = ent.x + (ent.facingRight ? 5 : -5); const corners = [{ x: nextX, y: ent.y }, { x: nextX + ent.width, y: ent.y }, { x: nextX, y: ent.y + ent.height - 2 }, { x: nextX + ent.width, y: ent.y + ent.height - 2 }]; for(const p of corners) { const bx = Math.floor(p.x / BLOCK_SIZE); const by = Math.floor(p.y / BLOCK_SIZE); const b = world.blocks[by*WORLD_WIDTH + bx]; if (!NON_COLLIDABLE_BLOCKS.has(b)) wallInFront = true; } if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; const isPanic = (ent.health < ent.maxHealth && (ent.lastDamageTime && Date.now() - ent.lastDamageTime < 5000));
                
                // AI TARGETING LOGIC
                let targetX = player.x;
                let targetY = player.y;
                let minDist = Math.abs(player.x - ent.x);
                let closestPlayer = player;

                // Check other players (Host checks clients)
                otherPlayersRef.current.forEach(op => {
                    const d = Math.abs(op.x - ent.x);
                    if (d < minDist) {
                        minDist = d;
                        targetX = op.x;
                        targetY = op.y;
                        closestPlayer = op;
                    }
                });

                const distToPlayer = targetX - ent.x; 
                const distY = Math.abs(targetY - ent.y);

                if (ent.type === 'ZOMBIE' || ent.type === 'MUTANT_ZOMBIE') { 
                    if (ent.type === 'ZOMBIE' && isDay) { entitiesRef.current.splice(i, 1); continue; } 
                    
                    if (ent.type === 'MUTANT_ZOMBIE') { 
                        if (Math.abs(distToPlayer) < 600 && distY < 300) { 
                            ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 3 : -3; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                            if (Math.random() < 0.02) { 
                                const angle = Math.atan2((targetY + 20) - ent.y, (targetX + 10) - ent.x); 
                                entitiesRef.current.push({ id: generateEntityId(), type: 'PROJECTILE', x: ent.x + ent.width/2, y: ent.y + ent.height/2, width: 12, height: 12, vx: Math.cos(angle) * 8, vy: Math.sin(angle) * 8, grounded: false, health: 1, maxHealth: 1, facingRight: ent.facingRight, itemId: 'uranium', projectileState: 'FLYING', creationTime: Date.now() }); 
                            } 
                        } 
                    } else if (Math.abs(distToPlayer) < 400 && distY < 200) { 
                        ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 2.5 : -2.5; 
                        if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; 
                        if (distY > 32 && targetY < ent.y && ent.vy === 0 && Math.random() < 0.1) ent.vy = -JUMP_FORCE; 
                    } else { 
                        if (Math.random() < 0.02) { ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; } 
                    } 
                    
                    // Attack Check (Host Only)
                    if (Math.abs(distToPlayer) < 20 && Math.abs(targetY - ent.y) < 40 && (ent.attackCooldown || 0) <= 0) { 
                        // If it's the main player, damage immediately
                        if (closestPlayer.id === player.id) {
                            let blocked = false; if (blockingRef.current) { const mobIsRight = ent.x > player.x; if (player.facingRight && mobIsRight) blocked = true; if (!player.facingRight && !mobIsRight) blocked = true; } 
                            if (blocked) { ent.vx = player.facingRight ? 8 : -8; ent.vy = -5; damageOffhand(); ent.attackCooldown = 30; } 
                            else { 
                                const rawDamage = (ent.type==='ZOMBIE'?2: (ent.type==='MUTANT_ZOMBIE' ? 2 : 5)); 
                                let reduction = 0; if(equipment.helmet) reduction += ARMOR_PROTECTION[equipment.helmet.id.toString()] || 0; if(equipment.chestplate) reduction += ARMOR_PROTECTION[equipment.chestplate.id.toString()] || 0; if(equipment.leggings) reduction += ARMOR_PROTECTION[equipment.leggings.id.toString()] || 0; if(equipment.boots) reduction += ARMOR_PROTECTION[equipment.boots.id.toString()] || 0; 
                                player.health -= Math.max(0.5, rawDamage * (1 - reduction)); player.vx += (distToPlayer>0?5:-5); player.vy = -3; ent.attackCooldown = 60; hungerRef.current = Math.max(0, hungerRef.current - 1); 
                            } 
                        } else {
                            // If it's a client player, we can't damage them directly easily here without complex messaging
                            // For now, visual attack
                            ent.attackCooldown = 60;
                        }
                    } 
                    ent.attackCooldown = Math.max(0, (ent.attackCooldown || 0) - 1); 
                } else { 
                    const heldItem = inventory[selectedSlot]; 
                    // Simple logic: Animals only follow Host holding items for now to avoid complexity
                    let attracted = false; 
                    if (heldItem) { 
                        if (ent.type === 'PIG' && heldItem.id === 'carrot') attracted = true; 
                        if ((ent.type === 'COW' || ent.type === 'SHEEP') && heldItem.id === 'wheat') attracted = true; 
                    } 
                    if (attracted) { 
                        if (Math.abs(distToPlayer) < 200) { ent.facingRight = distToPlayer > 0; ent.vx = ent.facingRight ? 3 : -3; if (wallInFront && ent.vy === 0) ent.vy = -JUMP_FORCE; } else { ent.vx = 0; } 
                    } else if (isPanic) { 
                        ent.facingRight = targetX < ent.x; ent.vx = ent.facingRight ? 3 : -3; 
                    } else if (Math.random() < 0.02) { 
                        ent.vx = (Math.random() - 0.5) * 2; if (ent.vx > 0) ent.facingRight = true; if (ent.vx < 0) ent.facingRight = false; 
                    } 
                }
                ent.x += ent.vx; if (checkCollision(ent, world)) { ent.x -= ent.vx; ent.vx *= -1; ent.facingRight = !ent.facingRight; }
            }
        }

        const cx = player.x + player.width/2;
        const cy = player.y + player.height/2;
        const worldMouseX = mouseRef.current.x + cameraRef.current.x;
        const worldMouseY = mouseRef.current.y + cameraRef.current.y;
        const dist = Math.sqrt(Math.pow(worldMouseX - cx, 2) + Math.pow(worldMouseY - cy, 2));
        const reach = REACH_DISTANCE + (playerStats.reach * BLOCK_SIZE);

        if (dist < reach && !isPaused && !isFurnaceOpen && !isChestOpen && !isAdminMenuOpen && !isSleepUIOpen) {
            const bx = Math.floor(worldMouseX / BLOCK_SIZE); const by = Math.floor(worldMouseY / BLOCK_SIZE);
            if (mouseRef.current.left) {
                const heldItem = inventory[selectedSlot];
                let hitEntity = false;
                if ((player.attackCooldown || 0) <= 0) {
                     const isKatana = heldItem && heldItem.id.toString().includes('katana'); const isScythe = heldItem && heldItem.id.toString().includes('scythe');
                     const targets = entitiesRef.current.filter(ent => { if (ent.type === 'DROP' || ent.type === 'PROJECTILE') return false; return (worldMouseX >= ent.x && worldMouseX <= ent.x + ent.width && worldMouseY >= ent.y && worldMouseY <= ent.y + ent.height) || ((isKatana || isScythe) && Math.abs(ent.x - worldMouseX) < 60 && Math.abs(ent.y - worldMouseY) < 60); });
                     let hitTargets = targets.slice(0, 1); if (isKatana) hitTargets = targets.slice(0, 3); if (isScythe) hitTargets = targets.slice(0, 5);
                     if (hitTargets.length > 0) { hitEntity = true; const heldItemId = heldItem ? heldItem.id.toString() : 'hand'; let cooldown = 20; if (heldItemId.includes('war_hammer')) cooldown = 300; else if (heldItemId.includes('scythe')) cooldown = 240; else if (heldItemId.includes('battle_axe')) cooldown = 100; else if (isKatana) { if (heldItemId.includes('wood') || heldItemId.includes('copper') || heldItemId.includes('stone')) cooldown = 120; else if (heldItemId.includes('iron') || heldItemId.includes('gold') || heldItemId.includes('diamond')) cooldown = 180; else if (heldItemId.includes('titanium') || heldItemId.includes('uranium')) cooldown = 240; } else if (heldItemId.includes('knife')) cooldown = 10; else if (heldItemId.includes('short_sword')) cooldown = 15; player.attackCooldown = cooldown; hitTargets.forEach(ent => { let baseDamage = DAMAGE_VALUES[heldItemId] || 1; if (heldItemId.includes('club')) { if (player.vy > 0 && !player.grounded) baseDamage *= 1.5; } if (heldItemId.includes('dagger')) { const d = Math.sqrt(Math.pow(ent.x - player.x, 2) + Math.pow(ent.y - player.y, 2)); if (d < 40) baseDamage *= 1.5; else baseDamage *= 0.5; } const damage = baseDamage + (playerStats.strength * 0.5) + (isKatana ? 1 : 0); 
                     
                     // Damage logic: Local if SP, Remote if MP Client
                     if (options.multiplayer?.mode === 'CLIENT') {
                         broadcast('DAMAGE_MOB', { id: ent.id, damage: damage, knockbackX: player.x < ent.x ? 5 : -5, knockbackY: -3 });
                         // Visual feedback only
                         ent.health -= damage; 
                         ent.vx = player.x < ent.x ? 5 : -5; ent.vy = -3;
                     } else {
                         // Host/SP
                         ent.health -= damage; ent.lastDamageTime = Date.now(); ent.vx = player.x < ent.x ? 5 : -5; ent.vy = -3; 
                         if (ent.health <= 0) { gainXP(XP_PER_MOB); if (ent.type === 'COW') { spawnDrop(ent.x, ent.y, 'raw_beef', 2); spawnDrop(ent.x, ent.y, 'leather', 1); } if (ent.type === 'PIG') spawnDrop(ent.x, ent.y, 'raw_porkchop', 2); if (ent.type === 'SHEEP') { spawnDrop(ent.x, ent.y, 'raw_mutton', 1); spawnDrop(ent.x, ent.y, BlockType.WOOL, 1); } if (ent.type === 'MUTANT_ZOMBIE') { spawnDrop(ent.x, ent.y, 'uranium_totem', 1); spawnDrop(ent.x, ent.y, 'uranium', 5); } entitiesRef.current = entitiesRef.current.filter(e => e.id !== ent.id); } 
                     }
                     
                     }); damageTool(selectedSlot); }
                }
                if (!hitEntity) { if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) { const bType = world.blocks[by * WORLD_WIDTH + bx]; if (bType !== BlockType.AIR && bType !== BlockType.BEDROCK && bType !== BlockType.WATER) { if (breakingRef.current.x !== bx || breakingRef.current.y !== by) breakingRef.current = { x: bx, y: by, progress: 0 }; if (canDamageBlock(bType, heldItem)) { const speed = getBreakSpeed(bType, heldItem); breakingRef.current.progress += Math.max(1, speed); const hardness = BLOCK_HARDNESS[bType] || 100; if (breakingRef.current.progress >= hardness) { const key = `${bx},${by}`; if (bType === BlockType.FURNACE) furnacesRef.current.delete(key); if (bType === BlockType.CHEST || bType === BlockType.CHEST_MEDIUM || bType === BlockType.CHEST_LARGE || bType === BlockType.STONE_CHEST) chestsRef.current.delete(key); if (bType === BlockType.CROP_WHEAT || bType === BlockType.CROP_CARROT || bType === BlockType.CROP_POTATO) { const crop = cropsRef.current.get(key); if(crop) { if(crop.type==='WHEAT') spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'wheat_seeds', 1); if(crop.stage>=3) { if(crop.type==='WHEAT') spawnDrop(bx*BLOCK_SIZE, by*BLOCK_SIZE, 'wheat', 1); } cropsRef.current.delete(key); } } if (bType === BlockType.DOOR_BOTTOM_CLOSED || bType === BlockType.DOOR_BOTTOM_OPEN) { setBlockAt(bx, by - 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_BOTTOM_CLOSED, 1); } else if (bType === BlockType.DOOR_TOP_CLOSED || bType === BlockType.DOOR_TOP_OPEN) { setBlockAt(bx, by + 1, BlockType.AIR); spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, BlockType.DOOR_BOTTOM_CLOSED, 1); } setBlockAt(bx, by, BlockType.AIR); if (canHarvest(bType, heldItem)) { if (bType === BlockType.BERRY_BUSH) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'cherry', 1 + Math.floor(Math.random() * 2)); } else if (bType === BlockType.SEED_BUSH) { const rand = Math.random(); if (rand < 0.33) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'wheat_seeds', 1); else if (rand < 0.66) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'carrot', 1); else spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'potato', 1); } else if (bType === BlockType.BUSH) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'stick', 1); } else if (bType === BlockType.GRASS || bType === BlockType.DARK_GRASS) { if (Math.random() < 0.1) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'wheat_seeds', 1); if (Math.random() < 0.05) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'carrot', 1); if (Math.random() < 0.05) spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'potato', 1); } else if (bType === BlockType.URANIUM_ORE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, 'uranium', 1); } else if (bType === BlockType.FLOWER_RED || bType === BlockType.FLOWER_GREEN || bType === BlockType.FLOWER_BLUE) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, bType, 1); } else if (!bType.toString().includes('DOOR') && !bType.toString().includes('CROP')) { spawnDrop(bx * BLOCK_SIZE, by * BLOCK_SIZE, bType, 1); } } breakingRef.current = { x: -1, y: -1, progress: 0 }; damageTool(selectedSlot); } } else { breakingRef.current = { x: -1, y: -1, progress: 0 }; } } else breakingRef.current = { x: -1, y: -1, progress: 0 }; } }
            } else breakingRef.current = { x: -1, y: -1, progress: 0 };
            
            if (mouseRef.current.left && activeBuildBlock && inventory[selectedSlot] && inventory[selectedSlot]!.id.toString().includes('hammer')) {
                 if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                     const now = Date.now();
                     if (now - lastPlacementTime.current > 200) {
                         const idx = by * WORLD_WIDTH + bx;
                         if (world.blocks[idx] === BlockType.AIR || world.blocks[idx] === BlockType.WATER) {
                             let reqId = BlockType.PLANKS;
                             if (activeBuildBlock === BlockType.ROOF_STONE || activeBuildBlock === BlockType.ROOF_STONE_LEFT) reqId = BlockType.STONE;
                             const hasMat = inventory.some(i => i && i.id === reqId && i.count >= 1);
                             if (hasMat) {
                                 setBlockAt(bx, by, activeBuildBlock);
                                 setInventory(prev => { const n = [...prev]; const matIdx = n.findIndex(i => i && i.id === reqId && i.count >= 1); if (matIdx !== -1 && n[matIdx]) { n[matIdx]!.count--; if (n[matIdx]!.count <= 0) n[matIdx] = null; } return n; });
                                 lastPlacementTime.current = now;
                             }
                         }
                     }
                 }
            }
            if (mouseRef.current.right && !spearChargeStartRef.current) {
                 const now = Date.now();
                 if (now - lastPlacementTime.current > 200) {
                     const heldItem = inventory[selectedSlot];
                     if (heldItem && heldItem.type === ItemType.BLOCK) {
                         if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                             const idx = by * WORLD_WIDTH + bx;
                             if (world.blocks[idx] === BlockType.AIR || world.blocks[idx] === BlockType.WATER) {
                                 const pLeft = Math.floor(player.x / BLOCK_SIZE); const pRight = Math.floor((player.x + player.width) / BLOCK_SIZE);
                                 const pTop = Math.floor(player.y / BLOCK_SIZE); const pBottom = Math.floor((player.y + player.height) / BLOCK_SIZE);
                                 const intersecting = (bx >= pLeft && bx <= pRight && by >= pTop && by <= pBottom);
                                 if (heldItem.id === BlockType.DOOR_BOTTOM_CLOSED) {
                                     if (by > 0 && world.blocks[(by-1)*WORLD_WIDTH + bx] === BlockType.AIR && !intersecting) {
                                         setBlockAt(bx, by, BlockType.DOOR_BOTTOM_CLOSED); setBlockAt(bx, by-1, BlockType.DOOR_TOP_CLOSED);
                                         setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                                         lastPlacementTime.current = now;
                                     }
                                 } else if (!intersecting) {
                                     setBlockAt(bx, by, heldItem.id as BlockType);
                                     setInventory(prev => { const n = [...prev]; if (n[selectedSlot]) { n[selectedSlot]!.count--; if (n[selectedSlot]!.count <= 0) n[selectedSlot] = null; } return n; });
                                     lastPlacementTime.current = now;
                                     
                                     // Check for Boss Summon Structure
                                     if (heldItem.id === BlockType.TITANIUM_BLOCK && world.blocks[(by+1)*WORLD_WIDTH + bx] === BlockType.URANIUM_BLOCK) {
                                         const checkPattern = (cx: number, cy: number) => { for(let i=0; i<3; i++) { if (world.blocks[cy * WORLD_WIDTH + (cx+i)] !== BlockType.TITANIUM_BLOCK) return false; if (world.blocks[(cy+1) * WORLD_WIDTH + (cx+i)] !== BlockType.URANIUM_BLOCK) return false; } return true; };
                                         let startX = -1; if (checkPattern(bx, by)) startX = bx; else if (checkPattern(bx - 1, by)) startX = bx - 1; else if (checkPattern(bx - 2, by)) startX = bx - 2;
                                         if (startX !== -1) { for(let i=0; i<3; i++) { setBlockAt(startX + i, by, BlockType.AIR); setBlockAt(startX + i, by + 1, BlockType.AIR); } spawnBoss((startX + 1) * BLOCK_SIZE, by * BLOCK_SIZE); }
                                     }
                                 }
                             }
                         }
                     }
                 }
            }
        }

        // --- DRAWING ---
        cameraRef.current.x = player.x - cvs.width / 2; cameraRef.current.y = player.y - cvs.height / 2;
        if (cameraRef.current.x < 0) cameraRef.current.x = 0; if (cameraRef.current.x > WORLD_WIDTH * BLOCK_SIZE - cvs.width) cameraRef.current.x = WORLD_WIDTH * BLOCK_SIZE - cvs.width; if (cameraRef.current.y < 0) cameraRef.current.y = 0; if (cameraRef.current.y > WORLD_HEIGHT * BLOCK_SIZE - cvs.height) cameraRef.current.y = WORLD_HEIGHT * BLOCK_SIZE - cvs.height;

        let skyColor = '#87CEEB'; if (timeRef.current > DUSK_START || timeRef.current < DAWN_START) skyColor = '#000033'; 
        ctx.fillStyle = skyColor; ctx.fillRect(0, 0, cvs.width, cvs.height);
        
        ctx.save();
        ctx.translate(-Math.floor(cameraRef.current.x), -Math.floor(cameraRef.current.y));

        const startCol = Math.floor(cameraRef.current.x / BLOCK_SIZE) - 1; const endCol = startCol + (cvs.width / BLOCK_SIZE) + 3;
        const startRow = Math.floor(cameraRef.current.y / BLOCK_SIZE) - 1; const endRow = startRow + (cvs.height / BLOCK_SIZE) + 3;
        const hasTorch = (inventory[selectedSlot]?.id === BlockType.TORCH) || (equipment.offHand?.id === BlockType.TORCH);

        for (let y = startRow; y <= endRow; y++) {
            for (let x = startCol; x <= endCol; x++) {
                if (y < 0 || y >= WORLD_HEIGHT || x < 0 || x >= WORLD_WIDTH) continue;
                const idx = y * WORLD_WIDTH + x; const block = world.blocks[idx]; const baseLight = world.light[idx] || 0; const light = getRenderLight(x, y, baseLight, player, hasTorch);

                if (block !== BlockType.AIR) {
                    const isOre = (block === BlockType.COAL_ORE || block === BlockType.IRON_ORE || block === BlockType.GOLD_ORE || block === BlockType.DIAMOND_ORE || block === BlockType.COPPER_ORE || block === BlockType.TITANIUM_ORE || block === BlockType.URANIUM_ORE);
                    if (block === BlockType.WATER) { ctx.globalAlpha = 0.6; ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.globalAlpha = 1.0; }
                    else if (block === BlockType.GLASS) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.strokeRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4); ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x*BLOCK_SIZE + 6, y*BLOCK_SIZE + 6, 4, 4); ctx.fillRect(x*BLOCK_SIZE + 12, y*BLOCK_SIZE + 12, 2, 2); }
                    else if (block === BlockType.ROOF_WOOD || block === BlockType.ROOF_STONE) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.fill(); }
                    else if (block === BlockType.ROOF_WOOD_LEFT || block === BlockType.ROOF_STONE_LEFT) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.beginPath(); ctx.moveTo(x * BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE); ctx.lineTo(x * BLOCK_SIZE + BLOCK_SIZE, y * BLOCK_SIZE + BLOCK_SIZE); ctx.fill(); }
                    else if (block === BlockType.WALL_WOOD) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); }
                    else if (block === BlockType.UPGRADE_BENCH) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 10, BLOCK_SIZE, 22); ctx.fillStyle = '#90a4ae'; ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 10, 24, 6); }
                    else if (block === BlockType.DOOR_BOTTOM_CLOSED || block === BlockType.DOOR_TOP_CLOSED) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE, 20, BLOCK_SIZE); }
                    else if (block === BlockType.DOOR_BOTTOM_OPEN || block === BlockType.DOOR_TOP_OPEN) { ctx.fillStyle = BLOCK_COLORS[block === BlockType.DOOR_BOTTOM_OPEN ? BlockType.DOOR_BOTTOM_CLOSED : BlockType.DOOR_TOP_CLOSED]; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE, 6, BLOCK_SIZE); }
                    else if (block === BlockType.CROP_WHEAT || block === BlockType.CROP_CARROT || block === BlockType.CROP_POTATO) { const crop = cropsRef.current.get(`${x},${y}`); if (crop) { const h = 8 + (crop.stage * 6); ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + (BLOCK_SIZE - h), 16, h); } }
                    else if (block === BlockType.BERRY_BUSH) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 8, 24, 24); ctx.fillStyle = '#e91e63'; ctx.beginPath(); ctx.arc(x*BLOCK_SIZE+10, y*BLOCK_SIZE+14, 2, 0, Math.PI*2); ctx.fill(); }
                    else if (block === BlockType.SEED_BUSH) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 10, 20, 22); }
                    else if (block === BlockType.FLOWER_RED || block === BlockType.FLOWER_GREEN || block === BlockType.FLOWER_BLUE) { ctx.fillStyle = '#2e7d32'; ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 16, 4, 16); ctx.fillStyle = BLOCK_COLORS[block]; ctx.beginPath(); ctx.arc(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 14, 6, 0, Math.PI * 2); ctx.fill(); }
                    else if (block === BlockType.URANIUM_BLOCK) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.fillStyle = '#76ff03'; ctx.fillRect(x * BLOCK_SIZE + 8, y * BLOCK_SIZE + 8, 16, 16); }
                    else if (block === BlockType.TITANIUM_BLOCK) { ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.strokeStyle = '#fff'; ctx.strokeRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 4, 24, 24); }
                    else if (isOre) { const isDeep = block === BlockType.TITANIUM_ORE || block === BlockType.URANIUM_ORE || y > DEEP_SLATE_LEVEL; const baseColor = isDeep ? BLOCK_COLORS[BlockType.DEEP_STONE] : BLOCK_COLORS[BlockType.STONE]; ctx.fillStyle = baseColor; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); ctx.fillStyle = BLOCK_COLORS[block]; ctx.fillRect(x * BLOCK_SIZE + 6, y * BLOCK_SIZE + 6, 6, 6); ctx.fillRect(x * BLOCK_SIZE + 18, y * BLOCK_SIZE + 10, 6, 6); ctx.fillRect(x * BLOCK_SIZE + 10, y * BLOCK_SIZE + 20, 6, 6); }
                    else { ctx.fillStyle = BLOCK_COLORS[block] || '#f0f'; if (block === BlockType.BUSH) ctx.fillRect(x * BLOCK_SIZE + 4, y * BLOCK_SIZE + 12, 24, 20); else if (block === BlockType.BED || block === BlockType.BED_MEDIUM || block === BlockType.BED_ADVANCED) { ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE + 16, BLOCK_SIZE, 16); ctx.fillStyle = '#fff'; ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 18, 8, 6); } else if (block === BlockType.CHEST || block === BlockType.CHEST_MEDIUM || block === BlockType.CHEST_LARGE || block === BlockType.STONE_CHEST) { ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 10, 28, 22); ctx.fillStyle = block === BlockType.STONE_CHEST ? '#bdbdbd' : '#ffecb3'; ctx.fillRect(x * BLOCK_SIZE + 14, y * BLOCK_SIZE + 18, 4, 6); } else ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); if(block === BlockType.FURNACE) { ctx.fillStyle = '#000'; ctx.fillRect(x*BLOCK_SIZE + 10, y*BLOCK_SIZE + 10, 12, 12); } if (block === BlockType.CRAFTING_TABLE) { ctx.font = '20px serif'; ctx.fillStyle = '#000'; ctx.fillText('⛏️', x*BLOCK_SIZE + 4, y*BLOCK_SIZE + 24); } }
                }
                
                if (breakingRef.current.x === x && breakingRef.current.y === y && breakingRef.current.progress > 0) { const bType = world.blocks[y*WORLD_WIDTH+x]; const hardness = BLOCK_HARDNESS[bType] || 100; const pct = Math.min(1, breakingRef.current.progress / hardness); ctx.fillStyle = '#000'; ctx.fillRect(x*BLOCK_SIZE + 2, y*BLOCK_SIZE + 2, 28, 4); ctx.fillStyle = '#0f0'; ctx.fillRect(x*BLOCK_SIZE + 2, y*BLOCK_SIZE + 2, 28 * pct, 4); }
                if (light < 15) { const darkness = 1 - (light / 15); ctx.fillStyle = `rgba(0,0,0, ${Math.min(0.96, darkness)})`; ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE); }
            }
        }

        // Draw Player
        ctx.fillStyle = 'blue'; ctx.fillRect(player.x, player.y, player.width, player.height); ctx.fillStyle = 'white'; ctx.fillRect(player.x + (player.facingRight?12:4), player.y + 8, 4, 4);
        if (equipment.helmet) { let col = '#b0bec5'; const id = equipment.helmet.id.toString(); if(id.includes('copper')) col='#d35400'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#1565c0'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#607d8b'; else if(id.includes('hazmat')) col='#ffeb3b'; ctx.fillStyle = col; ctx.fillRect(player.x - 2, player.y - 2, player.width + 4, 10); }
        if (equipment.chestplate) { let col = '#90a4ae'; const id = equipment.chestplate.id.toString(); if(id.includes('copper')) col='#d35400'; else if(id.includes('gold')) col='#fbc02d'; else if(id.includes('diamond')) col='#00bcd4'; else if(id.includes('titanium')) col='#1565c0'; else if(id.includes('uranium')) col='#76ff03'; else if(id.includes('reinforced')) col='#607d8b'; else if(id.includes('hazmat')) col='#ffeb3b'; ctx.fillStyle = col; ctx.fillRect(player.x, player.y + 12, player.width, 18); }
        if (equipment.offHand && equipment.offHand.id === BlockType.TORCH) { ctx.fillStyle = '#ffeb3b'; if (player.facingRight) ctx.fillRect(player.x - 8, player.y + 20, 4, 10); else ctx.fillRect(player.x + player.width + 4, player.y + 20, 4, 10); }
        if (equipment.offHand && equipment.offHand.type === ItemType.SHIELD) { ctx.save(); ctx.translate(player.x + player.width/2, player.y + player.height/2); if (!player.facingRight) ctx.scale(-1, 1); if (blockingRef.current) ctx.translate(10, 0); else { ctx.translate(0, 5); ctx.rotate(0.2); } const shieldColor = ITEM_COLORS[equipment.offHand.id.toString()] || '#888'; ctx.fillStyle = shieldColor; ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(6, -10); ctx.lineTo(6, 4); ctx.lineTo(0, 10); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }

        // Draw Other Players (Multiplayer)
        otherPlayersRef.current.forEach(p => {
            ctx.fillStyle = '#7e57c2'; // Purple tint
            ctx.fillRect(p.x, p.y, p.width, p.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(p.x + (p.facingRight?4:-8), p.y + 8, 4, 4); // Eye
            
            // Name tag
            if(p.playerName) {
                ctx.font = 'bold 12px monospace';
                ctx.textAlign = 'center';
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeText(p.playerName, p.x + p.width/2, p.y - 10);
                ctx.fillText(p.playerName, p.x + p.width/2, p.y - 10);
            }
        });

        entitiesRef.current.forEach(ent => { 
            if(ent.type === 'DROP') { 
                const col = ent.itemId && typeof ent.itemId === 'string' && ITEM_COLORS[ent.itemId] ? ITEM_COLORS[ent.itemId] : (ent.itemId && typeof ent.itemId === 'number' ? BLOCK_COLORS[ent.itemId] : '#fff'); 
                ctx.fillStyle = col; ctx.fillRect(ent.x, ent.y, ent.width, ent.height); 
            } else if (ent.type === 'PROJECTILE') {
                if (ent.itemId === 'uranium') { 
                    ctx.fillStyle = '#76ff03'; ctx.beginPath(); ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, 6, 0, Math.PI * 2); ctx.fill(); 
                } else if (ent.itemId === 'uranium_totem') {
                    // Totem particles (green/yellow mix)
                    ctx.fillStyle = Math.random() < 0.5 ? '#76ff03' : '#ffd600'; 
                    ctx.beginPath(); ctx.arc(ent.x + ent.width/2, ent.y + ent.height/2, 4, 0, Math.PI * 2); ctx.fill();
                } else {
                    // Arrow or others
                    drawMob(ctx, ent);
                }
            } else { 
                drawMob(ctx, ent); 
            } 
        });

        // Draw Aim Cursor for Mobile
        if (options.isMobile && !isPaused) {
            const worldMouseX = mouseRef.current.x + cameraRef.current.x;
            const worldMouseY = mouseRef.current.y + cameraRef.current.y;
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(worldMouseX, worldMouseY, 15, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(worldMouseX - 20, worldMouseY);
            ctx.lineTo(worldMouseX + 20, worldMouseY);
            ctx.moveTo(worldMouseX, worldMouseY - 20);
            ctx.lineTo(worldMouseX, worldMouseY + 20);
            ctx.stroke();
        }

        if (dist < reach && !isPaused && !isFurnaceOpen && !isChestOpen && !isAdminMenuOpen && !isSleepUIOpen) {
            const worldMouseX = mouseRef.current.x + cameraRef.current.x;
            const worldMouseY = mouseRef.current.y + cameraRef.current.y;
            const bx = Math.floor(worldMouseX / BLOCK_SIZE); const by = Math.floor(worldMouseY / BLOCK_SIZE); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(bx*BLOCK_SIZE, by*BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            if (breakingRef.current.x === bx && breakingRef.current.y === by && breakingRef.current.progress > 0) { const bType = world.blocks[by * WORLD_WIDTH + bx]; const hardness = BLOCK_HARDNESS[bType] || 100; const pct = Math.min(1, breakingRef.current.progress / hardness); ctx.fillStyle = '#000'; ctx.fillRect(bx*BLOCK_SIZE + 2, by*BLOCK_SIZE + 2, 28, 4); ctx.fillStyle = '#0f0'; ctx.fillRect(bx*BLOCK_SIZE + 2, by*BLOCK_SIZE + 2, 28 * pct, 4); }
        }
        ctx.restore();
        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const currentItemName = inventory[selectedSlot] ? (ITEM_NAMES[lang][inventory[selectedSlot]!.id.toString()] || inventory[selectedSlot]!.id.toString()) : '';
    const xpForNextLevel = playerLevel * 100;
    const xpProgress = Math.min(1, playerXP / xpForNextLevel);
    const maxStaminaCalc = MAX_STAMINA + (playerStats.endurance * 20);
    let chargePct = 0; if (spearChargeStartRef.current) { const diff = Date.now() - spearChargeStartRef.current; chargePct = (Math.sin(diff / 300) + 1) / 2; }

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} className="block" />
            {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
                <>
                    {/* MOBILE CONTROLS OVERLAY */}
                    {options.isMobile && !isInventoryOpen && !isFurnaceOpen && !isChestOpen && (
                        <MobileControls 
                            onInput={(inputs) => {
                                // Map Virtual Joystick/Buttons to Keys/Mouse
                                const p = playerRef.current;
                                const baseSpeed = PLAYER_SPEED + (playerStats.agility * 0.5);
                                
                                // Joystick Movement
                                if (Math.abs(inputs.x) > 0.1) {
                                    if (blockingRef.current) {
                                        p.vx = inputs.x * baseSpeed * 0.3;
                                    } else {
                                        p.vx = inputs.x * baseSpeed;
                                    }
                                    if (inputs.x > 0) p.facingRight = true;
                                    if (inputs.x < 0) p.facingRight = false;
                                } else if (!blockingRef.current) {
                                    p.vx *= 0.8;
                                }

                                // Buttons
                                keysRef.current['Space'] = inputs.jump;
                                mouseRef.current.left = inputs.attack;
                                mouseRef.current.right = inputs.place;
                            }}
                            onToggleInventory={() => setIsInventoryOpen(true)}
                            onDrop={dropItem}
                            onEquip={() => {
                                // Quick offhand swap logic reused
                                setEquipment(prev => ({ ...prev, offHand: inventory[selectedSlot] })); 
                                setInventory(prev => { const newInv = [...prev]; newInv[selectedSlot] = equipment.offHand; return newInv; });
                            }}
                        />
                    )}

                    <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10">
                        <div className="flex gap-1">{Array.from({length: Math.ceil(playerRef.current.maxHealth / 2) * 2 / 2}).map((_, i) => (<span key={i} className="text-2xl drop-shadow-md">{i < Math.floor(hearts) ? '❤️' : (i < hearts ? '💔' : '🖤')}</span>))}</div>
                        <div className="flex gap-1">{Array.from({length: 10}).map((_, i) => (<span key={i} className="text-2xl drop-shadow-md">{i < Math.floor(hunger) ? '🍗' : '🦴'}</span>))}</div>
                        <div className="w-48 h-3 bg-gray-800 border border-gray-600 rounded mt-1 relative overflow-hidden"><div className="h-full bg-yellow-400 transition-all duration-200" style={{ width: `${(stamina / maxStaminaCalc) * 100}%` }}></div><span className="absolute inset-0 text-[8px] flex items-center justify-center text-black font-bold">⚡</span></div>
                        {spearChargeStartRef.current && (<div className="absolute left-16 top-32 w-8 h-32 bg-black border-2 border-black rounded-lg overflow-hidden flex flex-col-reverse relative"><div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(to top, #00ff00 0%, #ffff00 50%, #ff0000 100%)' }}></div><div className="absolute w-full h-2 bg-gray-400 border-y border-black/50" style={{ bottom: `${chargePct * 100}%`, transition: 'bottom 75ms linear' }}></div></div>)}
                        {options.showCoordinates && (<div className="text-white font-mono text-sm bg-black/50 p-2 rounded w-fit absolute top-0 left-0 m-1 border border-gray-600 shadow-md">X: {Math.floor(playerRef.current.x / BLOCK_SIZE)} Y: {Math.floor(playerRef.current.y / BLOCK_SIZE)}</div>)}
                        {options.adminMode && !isAdminMenuOpen && (<div className="text-red-400 font-mono text-xs bg-black/50 p-1 rounded w-fit absolute top-20 left-0 m-1">{t.ADMIN_HINT}</div>)}
                        
                        {/* Display Multiplayer Info */}
                        {options.multiplayer && (
                            <div className="bg-purple-900/80 border border-purple-500 p-2 rounded text-white font-mono text-sm mt-2 shadow-lg">
                                <div className="font-bold text-yellow-300">ONLINE: {options.multiplayer.mode}</div>
                                <div>Room: {options.multiplayer.roomId}</div>
                            </div>
                        )}
                        
                        {/* NOTIFICATIONS AREA */}
                        <div className="fixed top-10 left-1/2 transform -translate-x-1/2 flex flex-col gap-2 pointer-events-none w-full items-center z-50">
                            {notifications.map(note => (
                                <div key={note.id} className="bg-black/70 text-yellow-300 px-4 py-2 rounded-full border border-yellow-500 shadow-lg animate-fade-in-out font-bold">
                                    {note.message}
                                </div>
                            ))}
                        </div>
                    </div>
                    {!isInventoryOpen && (<div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 w-[350px] sm:w-[450px] z-10 pointer-events-none"><div className="w-full h-2 bg-gray-900 border border-gray-600 rounded-full relative overflow-hidden"><div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${xpProgress * 100}%` }}></div></div><div className="text-center text-xs text-green-300 font-bold drop-shadow-md mt-1">{playerLevel}</div></div>)}
                    {currentItemName && (<div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 text-white font-bold drop-shadow-md text-lg pointer-events-none z-10">{currentItemName}</div>)}
                    {activeBuildBlock && !isHammerMenuOpen && (<div className="absolute top-4 right-4 bg-black/60 p-2 text-white rounded pointer-events-none">Hammer Mode: {ITEM_NAMES[lang][activeBuildBlock]}</div>)}
                    <Inventory items={inventory} isOpen={isInventoryOpen} onClose={() => { setIsInventoryOpen(false); setNearbyStation('NONE'); }} onSelectSlot={setSelectedSlot} selectedSlot={selectedSlot} onCraft={handleCraft} nearbyStation={nearbyStation} cursorItem={cursorItem} onSlotClick={handleInventorySlotClick} mousePos={uiMousePos} lang={lang} equipment={equipment} onEquip={handleEquip} onUnequip={handleUnequip} stats={playerStats} skillPoints={skillPoints} level={playerLevel} onUpgradeStat={upgradeStat} isMobile={options.isMobile} />
                    {isFurnaceOpen && activeFurnacePos && furnacesRef.current.get(activeFurnacePos) && (<FurnaceUI input={furnacesRef.current.get(activeFurnacePos)!.input} fuel={furnacesRef.current.get(activeFurnacePos)!.fuel} output={furnacesRef.current.get(activeFurnacePos)!.output} progress={furnacesRef.current.get(activeFurnacePos)!.cookTime / 200} burnProgress={furnacesRef.current.get(activeFurnacePos)!.maxBurnTime ? furnacesRef.current.get(activeFurnacePos)!.burnTime / furnacesRef.current.get(activeFurnacePos)!.maxBurnTime : 0} onClose={() => { setIsFurnaceOpen(false); if(cursorItem) setCursorItem(null); }} onSlotClick={(slotType) => activeFurnacePos && handleFurnaceClick(activeFurnacePos, slotType)} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} />)}
                    {isChestOpen && activeChestPos && chestsRef.current.has(activeChestPos) && (<ChestUI slots={activeChestSize} contents={chestsRef.current.get(activeChestPos)!} onClose={() => { setIsChestOpen(false); if(cursorItem) setCursorItem(null); }} onSlotClick={handleChestSlotClick} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} />)}
                    {isHammerMenuOpen && (<HammerBuildUI onClose={() => setIsHammerMenuOpen(false)} onSelectBuild={handleHammerBuild} lang={lang} playerInv={inventory} />)}
                    {isUpgradeOpen && (<UpgradeUI onClose={() => setIsUpgradeOpen(false)} playerInv={inventory} onPlayerSlotClick={(idx) => handleInventorySlotClick(idx, 0)} selectedSlot={selectedSlot} lang={lang} onUpgrade={handleUpgrade} onReturnItem={handleReturnItem} />)}
                    {isAdminMenuOpen && (<AdminPanel onClose={() => setIsAdminMenuOpen(false)} adminState={adminFlags} setAdminState={setAdminFlags} onGiveItem={handleAdminGiveItem} onSetTime={handleAdminSetTime} lang={lang} />)}
                    {isSleepUIOpen && (<SleepUI onClose={() => setIsSleepUIOpen(false)} onSleep={handleSleep} lang={lang} />)}
                </>
            )}
            {gameState === 'PAUSED' && (<div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"><div className="flex flex-col gap-4 w-64"><h1 className="text-4xl text-white font-bold text-center mb-4">PAUSED</h1><button onClick={() => setGameState('PLAYING')} className="bg-gray-700 hover:bg-green-600 text-white p-4 border-2 border-gray-400 font-mono text-xl">Back to Game</button><button onClick={() => setLang(l => l === 'EN' ? 'PT' : 'EN')} className="bg-gray-700 hover:bg-blue-600 text-white p-4 border-2 border-gray-400 font-mono text-xl flex justify-between"><span>Language</span><span className="text-yellow-400">{lang}</span></button><button onClick={handleSaveAndQuit} className="bg-gray-700 hover:bg-red-600 text-white p-4 border-2 border-gray-400 font-mono text-xl">Save & Quit</button></div></div>)}
            {gameState === 'MENU' && (<MainMenu onStartGame={startNewGame} lang={lang} setLang={setLang} />)}
        </div>
    );
};

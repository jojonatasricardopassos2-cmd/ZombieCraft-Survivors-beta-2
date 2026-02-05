
import { BlockType, ItemType, CraftingRecipe, PlayerStats, ItemStack } from './types.ts';

export const BLOCK_SIZE = 32;
export const WORLD_WIDTH = 1000;
export const WORLD_HEIGHT = 1000; // Increased Depth
export const SEA_LEVEL = 64; 
export const DEEP_SLATE_LEVEL = 800; 
export const CHUNK_SIZE = 16;
export const ORE_CHUNK_SIZE = 5; 
export const GRAVITY = 0.5;
export const TERMINAL_VELOCITY = 15;
export const PLAYER_SPEED = 4;
export const PLAYER_RUN_SPEED = 7;
export const JUMP_FORCE = 9;
export const REACH_DISTANCE = 5 * BLOCK_SIZE;

// Day/Night Cycle
export const FULL_DAY_TICKS = 36000;
export const TICKS_PER_HOUR = 1500; // 36000 / 24 hours
// New Time System: 0 = 6 AM. 
export const DAWN_START = 0; // 6 AM
export const DUSK_START = 12 * 1500; // 6 PM (18:00) -> 12 hours after 6am
export const NIGHT_START = 13 * 1500; // 7 PM (19:00)

export const MAX_LIGHT = 15;
export const MIN_LIGHT = 1; 

// RPG Constants
export const XP_PER_MOB = 10;
export const MAX_STAMINA = 100;
export const BASE_STAMINA_DRAIN = 0.5; 
export const BASE_STAMINA_REGEN = 0.3; 
export const HUNGER_DECAY_TICK = 3600; 
export const SPRINT_HUNGER_DRAIN = 0.05; 

export const DEFAULT_STATS: PlayerStats = {
    strength: 0,
    reach: 0,
    vitality: 0,
    metabolism: 0,
    endurance: 0,
    agility: 0
};

export const BLOCK_COLORS: Record<number, string> = {
  [BlockType.AIR]: 'transparent',
  [BlockType.DIRT]: '#5d4037',
  [BlockType.GRASS]: '#388e3c',
  [BlockType.DARK_GRASS]: '#1b5e20',
  [BlockType.STONE]: '#757575',
  [BlockType.DEEP_STONE]: '#263238', 
  [BlockType.WOOD]: '#4e342e',
  [BlockType.DARK_WOOD]: '#3e2723', 
  [BlockType.LEAVES]: '#2e7d32',
  [BlockType.DARK_LEAVES]: '#004d40', 
  [BlockType.PLANKS]: '#8d6e63',
  [BlockType.COAL_ORE]: '#212121',
  [BlockType.IRON_ORE]: '#d7ccc8',
  [BlockType.GOLD_ORE]: '#ffecb3',
  [BlockType.DIAMOND_ORE]: '#80deea',
  [BlockType.TITANIUM_ORE]: '#0d47a1', 
  [BlockType.URANIUM_ORE]: '#76ff03', // Bright Green
  [BlockType.COPPER_ORE]: '#e67e22',
  [BlockType.BEDROCK]: '#000000',
  [BlockType.SAND]: '#e6c288', 
  [BlockType.GLASS]: 'rgba(200, 240, 255, 0.3)', 
  [BlockType.CRAFTING_TABLE]: '#6d4c41',
  [BlockType.FURNACE]: '#424242',
  [BlockType.TORCH]: '#ffeb3b',
  [BlockType.CHEST]: '#795548', 
  [BlockType.CHEST_MEDIUM]: '#5d4037', 
  [BlockType.CHEST_LARGE]: '#3e2723', 
  [BlockType.STONE_CHEST]: '#616161', // Dark Grey for Stone Chest
  [BlockType.BUSH]: '#558b2f',
  [BlockType.BERRY_BUSH]: '#2e7d32',
  [BlockType.SEED_BUSH]: '#558b2f',
  [BlockType.WOOL]: '#eeeeee',
  [BlockType.BED]: '#d32f2f', 
  [BlockType.BED_MEDIUM]: '#1976d2', 
  [BlockType.BED_ADVANCED]: '#7b1fa2', 
  [BlockType.WATER]: 'rgba(50, 50, 200, 0.5)', 
  [BlockType.ROOF_WOOD]: '#a1887f',
  [BlockType.ROOF_STONE]: '#616161',
  [BlockType.ROOF_WOOD_LEFT]: '#a1887f',
  [BlockType.ROOF_STONE_LEFT]: '#616161',
  [BlockType.WALL_WOOD]: '#5d4037',
  [BlockType.UPGRADE_BENCH]: '#37474f',
  [BlockType.DOOR_BOTTOM_CLOSED]: '#8d6e63',
  [BlockType.DOOR_TOP_CLOSED]: '#8d6e63',
  [BlockType.DOOR_BOTTOM_OPEN]: '#8d6e63',
  [BlockType.DOOR_TOP_OPEN]: '#8d6e63',
  [BlockType.FARMLAND]: '#3e2723',
  [BlockType.CROP_WHEAT]: '#cddc39',
  [BlockType.CROP_CARROT]: '#ff9800',
  [BlockType.CROP_POTATO]: '#ffe0b2',
  [BlockType.FLOWER_RED]: '#e53935',
  [BlockType.FLOWER_GREEN]: '#43a047',
  [BlockType.FLOWER_BLUE]: '#1e88e5',
  [BlockType.URANIUM_BLOCK]: '#64dd17', // Neon Green
  [BlockType.TITANIUM_BLOCK]: '#304ffe', // Deep Blue
};

// Hardness values
export const BLOCK_HARDNESS: Record<number, number> = {
    [BlockType.LEAVES]: 20, [BlockType.DARK_LEAVES]: 25, [BlockType.BUSH]: 10, [BlockType.BERRY_BUSH]: 10, [BlockType.SEED_BUSH]: 10,
    [BlockType.FLOWER_RED]: 5, [BlockType.FLOWER_GREEN]: 5, [BlockType.FLOWER_BLUE]: 5, [BlockType.DIRT]: 50, [BlockType.GRASS]: 50,
    [BlockType.DARK_GRASS]: 60, [BlockType.FARMLAND]: 50, [BlockType.SAND]: 40, [BlockType.WOOL]: 30, [BlockType.GLASS]: 20,
    [BlockType.PLANKS]: 150, [BlockType.DOOR_BOTTOM_CLOSED]: 150, [BlockType.DOOR_TOP_CLOSED]: 150, [BlockType.DOOR_BOTTOM_OPEN]: 150,
    [BlockType.DOOR_TOP_OPEN]: 150, [BlockType.CRAFTING_TABLE]: 150, [BlockType.CHEST]: 150, [BlockType.CHEST_MEDIUM]: 200,
    [BlockType.CHEST_LARGE]: 250, [BlockType.STONE_CHEST]: 300, [BlockType.WOOD]: 200, [BlockType.DARK_WOOD]: 250, [BlockType.STONE]: 300,
    [BlockType.DEEP_STONE]: 600, [BlockType.COAL_ORE]: 300, [BlockType.COPPER_ORE]: 300, [BlockType.IRON_ORE]: 400, [BlockType.GOLD_ORE]: 400,
    [BlockType.DIAMOND_ORE]: 500, [BlockType.TITANIUM_ORE]: 800, [BlockType.URANIUM_ORE]: 1200, [BlockType.FURNACE]: 300, [BlockType.TORCH]: 5,
    [BlockType.BED]: 100, [BlockType.BED_MEDIUM]: 150, [BlockType.BED_ADVANCED]: 200, [BlockType.ROOF_WOOD]: 150, [BlockType.ROOF_STONE]: 300,
    [BlockType.ROOF_WOOD_LEFT]: 150, [BlockType.ROOF_STONE_LEFT]: 300, [BlockType.WALL_WOOD]: 100, [BlockType.UPGRADE_BENCH]: 400,
    [BlockType.BEDROCK]: 99999999, [BlockType.WATER]: 99999999, [BlockType.CROP_WHEAT]: 1, [BlockType.CROP_CARROT]: 1, [BlockType.CROP_POTATO]: 1,
    [BlockType.URANIUM_BLOCK]: 1500, [BlockType.TITANIUM_BLOCK]: 1200
};

// Max durability for tools (Simplified categories)
export const MAX_DURABILITY: Record<string, number> = {
    'wood': 100, 'copper': 150, 'stone': 250, 'iron': 350, 'gold': 500, 'diamond': 1000, 'titanium': 2000, 'uranium': 4000,
    'hazmat': 150, 'reinforced_iron': 600
};

// Protection
export const ARMOR_PROTECTION: Record<string, number> = {
    'hazmat_helmet': 0.05, 'hazmat_chestplate': 0.15, 'hazmat_leggings': 0.10, 'hazmat_boots': 0.05,
    'copper_helmet': 0.03, 'copper_chestplate': 0.08, 'copper_leggings': 0.07, 'copper_boots': 0.03,
    'iron_helmet': 0.05, 'iron_chestplate': 0.10, 'iron_leggings': 0.10, 'iron_boots': 0.05,
    'reinforced_iron_helmet': 0.08, 'reinforced_iron_chestplate': 0.18, 'reinforced_iron_leggings': 0.14, 'reinforced_iron_boots': 0.08,
    'gold_helmet': 0.10, 'gold_chestplate': 0.15, 'gold_leggings': 0.15, 'gold_boots': 0.05,
    'diamond_helmet': 0.10, 'diamond_chestplate': 0.20, 'diamond_leggings': 0.16, 'diamond_boots': 0.10,
    'titanium_helmet': 0.15, 'titanium_chestplate': 0.30, 'titanium_leggings': 0.25, 'titanium_boots': 0.15,
    'uranium_helmet': 0.20, 'uranium_chestplate': 0.35, 'uranium_leggings': 0.30, 'uranium_boots': 0.20,
};

// --- DYNAMIC RECIPE GENERATION FOR WEAPONS ---
const MATERIALS = [
    { id: 'wood', tier: BlockType.PLANKS, name_en: 'Wood', name_pt: 'Madeira' },
    { id: 'stone', tier: BlockType.STONE, name_en: 'Stone', name_pt: 'Pedra' },
    { id: 'copper', tier: 'copper_ingot', name_en: 'Copper', name_pt: 'Cobre' },
    { id: 'iron', tier: 'iron_ingot', name_en: 'Iron', name_pt: 'Ferro' },
    { id: 'gold', tier: 'gold_ingot', name_en: 'Gold', name_pt: 'Ouro' },
    { id: 'diamond', tier: 'diamond', name_en: 'Diamond', name_pt: 'Diamante' },
    { id: 'titanium', tier: 'titanium_ingot', name_en: 'Titanium', name_pt: 'Titânio' },
    { id: 'uranium', tier: 'uranium', name_en: 'Uranium', name_pt: 'Urânio' }
];

const WEAPON_RECIPES: CraftingRecipe[] = [];

MATERIALS.forEach(mat => {
    const mId = mat.tier;
    const pId = mat.id;

    WEAPON_RECIPES.push({ 
        result: { id: `${pId}_battle_axe`, count: 1, type: ItemType.TOOL }, 
        ingredients: [{ id: mId, count: 3 }, { id: 'stick', count: 2 }], 
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT' 
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_hunting_spear`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 1 }, { id: BlockType.DARK_WOOD, count: 1 }, { id: BlockType.DEEP_STONE, count: 1 }, { id: 'rope', count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_dagger`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 1 }, { id: 'leather', count: 1 }, { id: BlockType.WOOD, count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_war_hammer`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 3 }, { id: BlockType.DEEP_STONE, count: 2 }, { id: BlockType.WOOD, count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_club`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 2 }, { id: BlockType.DARK_WOOD, count: 1 }, { id: BlockType.STONE, count: 1 }, { id: 'green_resin', count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_scythe`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 3 }, { id: BlockType.WOOD, count: 2 }, { id: 'leather', count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_short_sword`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 1 }, { id: BlockType.WOOD, count: 1 }, { id: 'leather', count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
    WEAPON_RECIPES.push({
        result: { id: `${pId}_knife`, count: 1, type: ItemType.TOOL },
        ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 1 }],
        station: BlockType.CRAFTING_TABLE, category: 'COMBAT'
    });
});

export const RECIPES: CraftingRecipe[] = [
  // --- COMPONENTS ---
  { result: { id: 'rope', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'stick', count: 3 }, { id: 'leather', count: 2 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'fiber', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: 'potato', count: 3 }, { id: 'wheat', count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'arrow', count: 4, type: ItemType.TOOL }, ingredients: [{ id: 'stick', count: 1 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },

  // --- BOWS ---
  { result: { id: 'bow', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.PLANKS, count: 3 }, { id: 'rope', count: 2 }, { id: 'fiber', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
  { result: { id: 'crossbow', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.DARK_WOOD, count: 3 }, { id: 'iron_ingot', count: 2 }, { id: 'rope', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },

  // --- BASIC ---
  { result: { id: 'basic_axe', count: 1, type: ItemType.TOOL }, ingredients: [{ id: 'stick', count: 3 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOD, count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.DARK_WOOD, count: 1 }], station: 'NONE', category: 'BASIC' },
  { result: { id: 'stick', count: 4, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.PLANKS, count: 2 }], station: 'NONE', category: 'BASIC' },
  { result: { id: BlockType.CRAFTING_TABLE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 4 }], station: 'NONE', category: 'BASIC' },

  // --- DECOR ---
  { result: { id: BlockType.TORCH, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: 'stick', count: 1 }, { id: BlockType.COAL_ORE, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOL, count: 3 }, { id: BlockType.PLANKS, count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED_MEDIUM, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.BED, count: 1 }, { id: 'iron_ingot', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.BED_ADVANCED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.BED_MEDIUM, count: 1 }, { id: 'gold_ingot', count: 2 }, { id: 'diamond', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.FURNACE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.STONE, count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.UPGRADE_BENCH, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 5 }, { id: 'iron_ingot', count: 2 }, { id: 'diamond', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.DOOR_BOTTOM_CLOSED, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 6 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.PLANKS, count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST_MEDIUM, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST, count: 1 }, { id: 'iron_ingot', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.CHEST_LARGE, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST_MEDIUM, count: 1 }, { id: 'diamond', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.STONE_CHEST, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.CHEST_MEDIUM, count: 1 }, { id: BlockType.STONE, count: 10 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.URANIUM_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'uranium', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },
  { result: { id: BlockType.TITANIUM_BLOCK, count: 1, type: ItemType.BLOCK }, ingredients: [{ id: 'titanium_ingot', count: 9 }], station: BlockType.CRAFTING_TABLE, category: 'DECOR' },

  // --- ITEMS ---
  { result: { id: 'stick', count: 4, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.PLANKS, count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: BlockType.PLANKS, count: 4, type: ItemType.BLOCK }, ingredients: [{ id: BlockType.WOOD, count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'bread', count: 2, type: ItemType.FOOD }, ingredients: [{ id: 'wheat', count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },
  { result: { id: 'blue_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_BLUE, count: 1 }], station: 'NONE', category: 'ITEMS' },
  { result: { id: 'green_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_GREEN, count: 1 }], station: 'NONE', category: 'ITEMS' },
  { result: { id: 'red_resin', count: 1, type: ItemType.MATERIAL }, ingredients: [{ id: BlockType.FLOWER_RED, count: 1 }], station: 'NONE', category: 'ITEMS' },
  // TOTEM OF URANIUM RECIPE
  { result: { id: 'uranium_totem', count: 1, type: ItemType.TOOL }, ingredients: [{ id: BlockType.URANIUM_BLOCK, count: 2 }, { id: 'gold_ingot', count: 3 }], station: BlockType.CRAFTING_TABLE, category: 'ITEMS' },

  // --- STANDARD TOOLS (Pickaxes, Axes, Shovels, Hoes, Normal Swords/Spears/Hammers) ---
  ...MATERIALS.flatMap(m => {
      const recipes: CraftingRecipe[] = [];
      const mId = m.tier;
      const pId = m.id;
      // Pickaxe
      recipes.push({ result: { id: `${pId}_pickaxe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 3 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Axe
      recipes.push({ result: { id: `${pId}_axe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 3 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Shovel
      recipes.push({ result: { id: `${pId}_shovel`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Hoe
      recipes.push({ result: { id: `${pId}_hoe`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Sword
      recipes.push({ result: { id: `${pId}_sword`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Katana
      recipes.push({ result: { id: `${pId}_katana`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 2 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Spear
      recipes.push({ result: { id: `${pId}_spear`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 1 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Normal Hammer
      recipes.push({ result: { id: `${pId}_hammer`, count: 1, type: ItemType.TOOL }, ingredients: [{ id: mId, count: 4 }, { id: 'stick', count: 2 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Shield
      recipes.push({ result: { id: `${pId}_shield`, count: 1, type: ItemType.SHIELD }, ingredients: [{ id: mId, count: 5 }, { id: 'stick', count: 1 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      // Armor
      if (pId !== 'wood' && pId !== 'stone') {
          recipes.push({ result: { id: `${pId}_helmet`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
          recipes.push({ result: { id: `${pId}_chestplate`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
          recipes.push({ result: { id: `${pId}_leggings`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 7 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
          recipes.push({ result: { id: `${pId}_boots`, count: 1, type: ItemType.ARMOR }, ingredients: [{ id: mId, count: 4 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' });
      }
      return recipes;
  }),

  ...WEAPON_RECIPES, // Add the 10 new weapon types
  
  // Hazmat
  { result: { id: 'hazmat_helmet', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 5 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
  { result: { id: 'hazmat_chestplate', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 8 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
  { result: { id: 'hazmat_leggings', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 7 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
  { result: { id: 'hazmat_boots', count: 1, type: ItemType.ARMOR }, ingredients: [{ id: 'leather', count: 4 }], station: BlockType.CRAFTING_TABLE, category: 'COMBAT' },
];

export const COOKING_RECIPES: Record<string, string> = {
  'raw_beef': 'steak',
  'raw_porkchop': 'cooked_porkchop',
  'raw_mutton': 'cooked_mutton',
  'potato': 'baked_potato',
  [BlockType.IRON_ORE.toString()]: 'iron_ingot',
  [BlockType.GOLD_ORE.toString()]: 'gold_ingot',
  [BlockType.COPPER_ORE.toString()]: 'copper_ingot',
  [BlockType.TITANIUM_ORE.toString()]: 'titanium_ingot',
  [BlockType.DIAMOND_ORE.toString()]: 'diamond',
  [BlockType.SAND.toString()]: BlockType.GLASS.toString(),
};

export const FUEL_VALUES: Record<string, number> = {
  [BlockType.COAL_ORE]: 1600, 
  [BlockType.WOOD]: 300,
  [BlockType.DARK_WOOD]: 400,
  [BlockType.PLANKS]: 300,
  'stick': 100, 
};

// --- DYNAMIC DAMAGE & COLORS ---
const BASE_DAMAGE = {
    'wood': 3, 'stone': 4, 'copper': 4.5, 'iron': 5, 'gold': 4, 'diamond': 7, 'titanium': 8, 'uranium': 10
};

// Colors for the new weapons/items
const NEW_ITEM_COLORS: Record<string, string> = {
    'rope': '#8d6e63',
    'fiber': '#dcedc8',
    'arrow': '#cfd8dc',
    'bow': '#8d6e63',
    'crossbow': '#3e2723',
    'uranium_totem': '#76ff03'
};

// Generate Colors & Damage for all 10 new weapons across all 8 tiers
export const ITEM_COLORS: Record<string, string> = { ...NEW_ITEM_COLORS };
export const DAMAGE_VALUES: Record<string, number> = { 'hand': 1, 'bow': 3, 'crossbow': 5 };

MATERIALS.forEach(mat => {
    const base = BASE_DAMAGE[mat.id as keyof typeof BASE_DAMAGE];
    const col = mat.id === 'uranium' ? '#76ff03' : (mat.id === 'titanium' ? '#1565c0' : (mat.id === 'diamond' ? '#80deea' : '#bdbdbd'));
    
    // Tools
    ITEM_COLORS[`${mat.id}_pickaxe`] = col; DAMAGE_VALUES[`${mat.id}_pickaxe`] = base * 0.5;
    ITEM_COLORS[`${mat.id}_axe`] = col; DAMAGE_VALUES[`${mat.id}_axe`] = base * 0.8;
    ITEM_COLORS[`${mat.id}_shovel`] = col;
    ITEM_COLORS[`${mat.id}_hoe`] = col;
    ITEM_COLORS[`${mat.id}_hammer`] = col; DAMAGE_VALUES[`${mat.id}_hammer`] = base * 0.6;
    ITEM_COLORS[`${mat.id}_shield`] = col;

    // Standard Weapons
    ITEM_COLORS[`${mat.id}_sword`] = col; DAMAGE_VALUES[`${mat.id}_sword`] = base;
    ITEM_COLORS[`${mat.id}_katana`] = col; DAMAGE_VALUES[`${mat.id}_katana`] = base * 1.1;
    ITEM_COLORS[`${mat.id}_spear`] = col; DAMAGE_VALUES[`${mat.id}_spear`] = base * 0.9;

    // 10 New Weapons
    ITEM_COLORS[`${mat.id}_battle_axe`] = col; DAMAGE_VALUES[`${mat.id}_battle_axe`] = base * 1.5; // High Dmg
    ITEM_COLORS[`${mat.id}_hunting_spear`] = col; DAMAGE_VALUES[`${mat.id}_hunting_spear`] = base * 1.2;
    ITEM_COLORS[`${mat.id}_dagger`] = col; DAMAGE_VALUES[`${mat.id}_dagger`] = base * 0.7; // Low base, bonus on hit
    ITEM_COLORS[`${mat.id}_war_hammer`] = col; DAMAGE_VALUES[`${mat.id}_war_hammer`] = base * 2.5; // Huge dmg
    ITEM_COLORS[`${mat.id}_club`] = col; DAMAGE_VALUES[`${mat.id}_club`] = base * 1.2;
    ITEM_COLORS[`${mat.id}_scythe`] = col; DAMAGE_VALUES[`${mat.id}_scythe`] = base * 0.8; // AoE
    ITEM_COLORS[`${mat.id}_short_sword`] = col; DAMAGE_VALUES[`${mat.id}_short_sword`] = base * 0.8;
    ITEM_COLORS[`${mat.id}_knife`] = col; DAMAGE_VALUES[`${mat.id}_knife`] = base * 0.5;
});

// Add other base item colors
Object.assign(ITEM_COLORS, {
  'basic_axe': '#a1887f', 'stick': '#6d4c41', 'raw_beef': '#ef5350', 'steak': '#8d6e63',
  'raw_porkchop': '#f48fb1', 'cooked_porkchop': '#e1bee7', 'raw_mutton': '#ef9a9a', 'cooked_mutton': '#bcaaa4',
  'iron_ingot': '#cfd8dc', 'gold_ingot': '#ffecb3', 'copper_ingot': '#e67e22', 'titanium_ingot': '#1565c0',
  'diamond': '#4dd0e1', 'uranium': '#76ff03', 'leather': '#8d6e63',
  'wheat_seeds': '#cddc39', 'carrot': '#ff9800', 'potato': '#ffe0b2', 'wheat': '#f0f4c3',
  'cherry': '#e91e63', 'baked_potato': '#ffcc80', 'bread': '#d7ccc8',
  'blue_resin': '#1e88e5', 'green_resin': '#43a047', 'red_resin': '#e53935'
});

// Add Armor colors manually for standard mats
['iron','gold','diamond','copper','titanium','uranium'].forEach(m => {
    ITEM_COLORS[`${m}_helmet`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_chestplate`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_leggings`] = ITEM_COLORS[`${m}_pickaxe`];
    ITEM_COLORS[`${m}_boots`] = ITEM_COLORS[`${m}_pickaxe`];
});
ITEM_COLORS['hazmat_helmet'] = '#ffeb3b'; ITEM_COLORS['hazmat_chestplate'] = '#ffeb3b';
ITEM_COLORS['hazmat_leggings'] = '#ffeb3b'; ITEM_COLORS['hazmat_boots'] = '#ffeb3b';
ITEM_COLORS['reinforced_iron_helmet'] = '#607d8b'; ITEM_COLORS['reinforced_iron_chestplate'] = '#607d8b';
ITEM_COLORS['reinforced_iron_leggings'] = '#607d8b'; ITEM_COLORS['reinforced_iron_boots'] = '#607d8b';


export const ITEM_ICONS: Record<string, string> = {
  'pickaxe': '⛏️', 'sword': '⚔️', 'axe': '🪓', 'shovel': '🥄', 'katana': '🗡️', 'spear': '🔱', 'hammer': '🔨', 'hoe': '👩‍🌾',
  'helmet': '🪖', 'chestplate': '👕', 'leggings': '👖', 'boots': '👢', 'shield': '🛡️',
  'battle_axe': '🪓', 'hunting_spear': '🍢', 'dagger': '🔪', 'war_hammer': '⚒️', 'club': '🏏', 'scythe': '🌾', 'short_sword': '🗡️', 'knife': '🔪',
  'bow': '🏹', 'crossbow': '🏹', 'arrow': '➹', 'rope': '➰', 'fiber': '🧵',
  'steak': '🥩', 'porkchop': '🥓', 'mutton': '🍖', 'ingot': '🧊', 'diamond': '💎', 'stick': '🥢',
  'wheat_seeds': '🌱', 'carrot': '🥕', 'potato': '🥔', 'wheat': '🌾', 'cherry': '🍒', 'baked_potato': '🥔', 'bread': '🍞',
  'uranium': '☢️', 'leather': '🧥', 'hazmat': '☣️', 'resin': '💧',
  [BlockType.FLOWER_RED]: '🌹', [BlockType.FLOWER_GREEN]: '🍀', [BlockType.FLOWER_BLUE]: '💠',
  'uranium_totem': '🧿'
};

export const FOOD_VALUES: Record<string, number> = {
  'raw_beef': 2, 'steak': 8,
  'raw_porkchop': 2, 'cooked_porkchop': 8,
  'raw_mutton': 2, 'cooked_mutton': 8,
  'carrot': 3, 'potato': 1, 'baked_potato': 5,
  'cherry': 1, 'bread': 5
};

// Generate Names dynamically for translations
const EN_MAT_NAMES = { wood: 'Wooden', stone: 'Stone', copper: 'Copper', iron: 'Iron', gold: 'Gold', diamond: 'Diamond', titanium: 'Titanium', uranium: 'Uranium' };
const PT_MAT_NAMES = { wood: 'de Madeira', stone: 'de Pedra', copper: 'de Cobre', iron: 'de Ferro', gold: 'de Ouro', diamond: 'de Diamante', titanium: 'de Titânio', uranium: 'de Urânio' };

const EN_WEAP_NAMES = { battle_axe: 'Battle Axe', hunting_spear: 'Hunting Spear', dagger: 'Dagger', war_hammer: 'War Hammer', club: 'Club', scythe: 'Combat Scythe', short_sword: 'Short Sword', knife: 'Knife' };
const PT_WEAP_NAMES = { battle_axe: 'Machado de Batalha', hunting_spear: 'Lança de Caça', dagger: 'Adaga', war_hammer: 'Martelo de Guerra', club: 'Clava', scythe: 'Foice de Combate', short_sword: 'Espada Curta', knife: 'Faca' };

export const ITEM_NAMES: Record<'EN' | 'PT', Record<string, string>> = {
    EN: {
        [BlockType.DIRT]: 'Dirt', [BlockType.GRASS]: 'Grass', [BlockType.DARK_GRASS]: 'Dark Grass', [BlockType.STONE]: 'Stone', [BlockType.DEEP_STONE]: 'Deep Slate',
        [BlockType.WOOD]: 'Wood Log', [BlockType.DARK_WOOD]: 'Dark Wood', [BlockType.PLANKS]: 'Wood Planks', [BlockType.CRAFTING_TABLE]: 'Crafting Table',
        [BlockType.FURNACE]: 'Furnace', [BlockType.TORCH]: 'Torch', [BlockType.CHEST]: 'Small Chest', [BlockType.CHEST_MEDIUM]: 'Medium Chest', [BlockType.CHEST_LARGE]: 'Large Chest', [BlockType.STONE_CHEST]: 'Stone Chest',
        [BlockType.BED]: 'Basic Bed', [BlockType.BED_MEDIUM]: 'Medium Bed', [BlockType.BED_ADVANCED]: 'Advanced Bed',
        [BlockType.COAL_ORE]: 'Coal Ore', [BlockType.IRON_ORE]: 'Iron Ore', [BlockType.GOLD_ORE]: 'Gold Ore', [BlockType.DIAMOND_ORE]: 'Diamond Ore', [BlockType.COPPER_ORE]: 'Copper Ore', [BlockType.TITANIUM_ORE]: 'Titanium Ore', [BlockType.URANIUM_ORE]: 'Uranium Ore',
        [BlockType.WOOL]: 'Wool', [BlockType.WATER]: 'Water', [BlockType.SAND]: 'Sand', [BlockType.GLASS]: 'Glass',
        [BlockType.ROOF_WOOD]: 'Wood Roof', [BlockType.ROOF_STONE]: 'Stone Roof', [BlockType.ROOF_WOOD_LEFT]: 'Wood Roof (L)', [BlockType.ROOF_STONE_LEFT]: 'Stone Roof (L)',
        [BlockType.WALL_WOOD]: 'Wood Wall', [BlockType.UPGRADE_BENCH]: 'Upgrade Bench', [BlockType.DOOR_BOTTOM_CLOSED]: 'Door',
        [BlockType.BERRY_BUSH]: 'Cherry Bush', [BlockType.SEED_BUSH]: 'Seed Bush',
        [BlockType.FLOWER_RED]: 'Red Flower', [BlockType.FLOWER_GREEN]: 'Green Flower', [BlockType.FLOWER_BLUE]: 'Blue Flower',
        [BlockType.URANIUM_BLOCK]: 'Uranium Block', [BlockType.TITANIUM_BLOCK]: 'Titanium Block',
        'stick': 'Stick', 'basic_axe': 'Basic Axe', 'rope': 'Rope', 'fiber': 'Fiber', 'arrow': 'Arrow', 'bow': 'Simple Bow', 'crossbow': 'Besta',
        'iron_ingot': 'Iron Ingot', 'gold_ingot': 'Gold Ingot', 'copper_ingot': 'Copper Ingot', 'titanium_ingot': 'Titanium Ingot', 'diamond': 'Diamond', 'uranium': 'Uranium', 'leather': 'Leather',
        'raw_beef': 'Raw Beef', 'steak': 'Steak', 'raw_porkchop': 'Raw Porkchop', 'cooked_porkchop': 'Cooked Porkchop', 'raw_mutton': 'Raw Mutton', 'cooked_mutton': 'Cooked Mutton',
        'offhand': 'Off Hand', 'wheat_seeds': 'Wheat Seeds', 'carrot': 'Carrot', 'potato': 'Potato', 'wheat': 'Wheat', 'cherry': 'Cherry', 'baked_potato': 'Baked Potato', 'bread': 'Bread',
        'blue_resin': 'Blue Resin', 'green_resin': 'Green Resin', 'red_resin': 'Red Resin', 'uranium_totem': 'Uranium Totem',
        // Manual entries for base tools
        'wood_pickaxe': 'Wooden Pickaxe', 'wood_axe': 'Wooden Axe', 'wood_shovel': 'Wooden Shovel', 'wood_sword': 'Wooden Sword', 'wood_katana': 'Wooden Katana', 'wood_spear': 'Wooden Spear', 'wood_hammer': 'Wooden Hammer', 'wood_hoe': 'Wooden Hoe',
        'stone_pickaxe': 'Stone Pickaxe', 'stone_axe': 'Stone Axe', 'stone_shovel': 'Stone Shovel', 'stone_sword': 'Stone Sword', 'stone_katana': 'Stone Katana', 'stone_spear': 'Stone Spear', 'stone_hammer': 'Stone Hammer', 'stone_hoe': 'Stone Hoe', 'stone_shield': 'Stone Shield',
        'iron_pickaxe': 'Iron Pickaxe', 'iron_axe': 'Iron Axe', 'iron_shovel': 'Iron Shovel', 'iron_sword': 'Iron Sword', 'iron_katana': 'Iron Katana', 'iron_spear': 'Iron Spear', 'iron_hammer': 'Iron Hammer', 'iron_hoe': 'Iron Hoe', 'iron_shield': 'Iron Shield',
        'gold_pickaxe': 'Gold Pickaxe', 'gold_axe': 'Gold Axe', 'gold_shovel': 'Gold Shovel', 'gold_sword': 'Gold Sword', 'gold_katana': 'Gold Katana', 'gold_spear': 'Gold Spear', 'gold_hammer': 'Gold Hammer', 'gold_hoe': 'Gold Hoe', 'gold_shield': 'Gold Shield',
        'diamond_pickaxe': 'Diamond Pickaxe', 'diamond_axe': 'Diamond Axe', 'diamond_shovel': 'Diamond Shovel', 'diamond_sword': 'Diamond Sword', 'diamond_katana': 'Diamond Katana', 'diamond_spear': 'Diamond Spear', 'diamond_hammer': 'Diamond Hammer', 'diamond_hoe': 'Diamond Hoe', 'diamond_shield': 'Diamond Shield',
        'titanium_pickaxe': 'Titanium Pickaxe', 'titanium_axe': 'Titanium Axe', 'titanium_shovel': 'Titanium Shovel', 'titanium_sword': 'Titanium Sword', 'titanium_katana': 'Titanium Katana', 'titanium_spear': 'Titanium Spear', 'titanium_hammer': 'Titanium Hammer', 'titanium_shield': 'Titanium Shield',
        'uranium_pickaxe': 'Uranium Pickaxe', 'uranium_axe': 'Uranium Axe', 'uranium_shovel': 'Uranium Shovel', 'uranium_sword': 'Uranium Sword', 'uranium_katana': 'Uranium Katana', 'uranium_spear': 'Uranium Spear', 'uranium_hammer': 'Martelo de Urânio', 'uranium_shield': 'Escudo de Urânio',
        'copper_pickaxe': 'Copper Pickaxe', 'copper_axe': 'Copper Axe', 'copper_shovel': 'Copper Shovel', 'copper_sword': 'Copper Sword', 'copper_katana': 'Copper Katana', 'copper_spear': 'Copper Spear', 'copper_shield': 'Copper Shield',
        // Armors
        'iron_helmet': 'Iron Helmet', 'iron_chestplate': 'Iron Chestplate', 'iron_leggings': 'Iron Leggings', 'iron_boots': 'Iron Boots',
        'reinforced_iron_helmet': 'Reinforced Iron Helmet', 'reinforced_iron_chestplate': 'Reinforced Iron Chestplate', 'reinforced_iron_leggings': 'Reinforced Iron Leggings', 'reinforced_iron_boots': 'Reinforced Iron Boots',
        'gold_helmet': 'Gold Helmet', 'gold_chestplate': 'Gold Chestplate', 'gold_leggings': 'Gold Leggings', 'gold_boots': 'Gold Boots',
        'diamond_helmet': 'Diamond Helmet', 'diamond_chestplate': 'Diamond Chestplate', 'diamond_leggings': 'Diamond Leggings', 'diamond_boots': 'Diamond Boots',
        'titanium_helmet': 'Titanium Helmet', 'titanium_chestplate': 'Titanium Chestplate', 'titanium_leggings': 'Titanium Leggings', 'titanium_boots': 'Titanium Boots',
        'uranium_helmet': 'Uranium Helmet', 'uranium_chestplate': 'Uranium Chestplate', 'uranium_leggings': 'Uranium Leggings', 'uranium_boots': 'Uranium Boots',
        'copper_helmet': 'Copper Helmet', 'copper_chestplate': 'Copper Chestplate', 'copper_leggings': 'Copper Leggings', 'copper_boots': 'Copper Boots',
        'hazmat_helmet': 'Radiation Helmet', 'hazmat_chestplate': 'Radiation Chestplate', 'hazmat_leggings': 'Radiation Leggings', 'hazmat_boots': 'Radiation Boots',
        SLEEP_MENU: "Sleep Menu",
        WAKE_TIME: "Wake up at:",
        SLEEP: "Sleep",
        CANT_SLEEP: "You can only sleep at night in this bed.",
        ONLINE_MODE: "Online Mode",
        CREATE_ROOM: "Create Room",
        JOIN_ROOM: "Join Room",
        ROOM_NAME: "Room Name",
        ROOM_CODE: "Room Code",
        ENTER_CODE: "Enter Room Code",
        START_HOST: "Start Host",
        JOIN: "Join",
        SELECT_WORLD: "Select World to Host",
        NEW_WORLD: "New World",
        MULTIPLAYER_NOTE: "Note: Inventories and XP are separate. You can explore independently."
    },
    PT: {
        [BlockType.DIRT]: 'Terra', [BlockType.GRASS]: 'Grama', [BlockType.DARK_GRASS]: 'Grama Escura', [BlockType.STONE]: 'Pedra', [BlockType.DEEP_STONE]: 'Pedra Profunda',
        [BlockType.WOOD]: 'Madeira Bruta', [BlockType.DARK_WOOD]: 'Madeira Escura', [BlockType.PLANKS]: 'Tábuas de Madeira', [BlockType.CRAFTING_TABLE]: 'Bancada de Trabalho',
        [BlockType.FURNACE]: 'Fornalha', [BlockType.TORCH]: 'Tocha', [BlockType.CHEST]: 'Baú Pequeno', [BlockType.CHEST_MEDIUM]: 'Baú Médio', [BlockType.CHEST_LARGE]: 'Baú Grande', [BlockType.STONE_CHEST]: 'Baú de Pedra',
        [BlockType.BED]: 'Cama Básica', [BlockType.BED_MEDIUM]: 'Cama Média', [BlockType.BED_ADVANCED]: 'Cama Avançada',
        [BlockType.COAL_ORE]: 'Minério de Carvão', [BlockType.IRON_ORE]: 'Minério de Ferro', [BlockType.GOLD_ORE]: 'Minério de Ouro', [BlockType.DIAMOND_ORE]: 'Minério de Diamante', [BlockType.COPPER_ORE]: 'Minério de Cobre', [BlockType.TITANIUM_ORE]: 'Minério de Titânio', [BlockType.URANIUM_ORE]: 'Minério de Urânio',
        [BlockType.WOOL]: 'Lã', [BlockType.WATER]: 'Água', [BlockType.SAND]: 'Areia', [BlockType.GLASS]: 'Vidro',
        [BlockType.ROOF_WOOD]: 'Telhado de Madeira (Dir)', [BlockType.ROOF_STONE]: 'Telhado de Pedra (Dir)', [BlockType.ROOF_WOOD_LEFT]: 'Telhado de Madeira (Esq)', [BlockType.ROOF_STONE_LEFT]: 'Telhado de Pedra (Esq)',
        [BlockType.WALL_WOOD]: 'Parede de Madeira', [BlockType.UPGRADE_BENCH]: 'Bancada de Upgrade', [BlockType.DOOR_BOTTOM_CLOSED]: 'Porta',
        [BlockType.BERRY_BUSH]: 'Arbusto de Cereja', [BlockType.SEED_BUSH]: 'Arbusto de Sementes',
        [BlockType.FLOWER_RED]: 'Flor Vermelha', [BlockType.FLOWER_GREEN]: 'Flor Verde', [BlockType.FLOWER_BLUE]: 'Flor Azul',
        [BlockType.URANIUM_BLOCK]: 'Bloco de Urânio', [BlockType.TITANIUM_BLOCK]: 'Bloco de Titânio',
        'stick': 'Graveto', 'basic_axe': 'Machado Básico', 'rope': 'Corda', 'fiber': 'Fibra', 'arrow': 'Flecha', 'bow': 'Arco Simples', 'crossbow': 'Besta',
        'iron_ingot': 'Barra de Ferro', 'gold_ingot': 'Barra de Ouro', 'copper_ingot': 'Barra de Cobre', 'titanium_ingot': 'Barra de Titânio', 'diamond': 'Diamante', 'uranium': 'Urânio', 'leather': 'Couro',
        'raw_beef': 'Bife Cru', 'steak': 'Bife Assado', 'raw_porkchop': 'Carne de Porco Crua', 'cooked_porkchop': 'Carne de Porco Assada', 'raw_mutton': 'Carne de Carneiro Crua', 'cooked_mutton': 'Carne de Carneiro Assada',
        'offhand': 'Mão Esquerda', 'wheat_seeds': 'Sementes de Trigo', 'carrot': 'Cenoura', 'potato': 'Batata', 'wheat': 'Trigo', 'cherry': 'Cereja', 'baked_potato': 'Batata Cozida', 'bread': 'Pão',
        'blue_resin': 'Resina Azul', 'green_resin': 'Resina Verde', 'red_resin': 'Resina Vermelha', 'uranium_totem': 'Totem de Urânio',
        // Manual entries
        'wood_pickaxe': 'Picareta de Madeira', 'wood_axe': 'Machado de Madeira', 'wood_shovel': 'Pá de Madeira', 'wood_sword': 'Espada de Madeira', 'wood_katana': 'Katana de Madeira', 'wood_spear': 'Lança de Madeira', 'wood_hammer': 'Martelo de Madeira', 'wood_hoe': 'Enxada de Madeira',
        'stone_pickaxe': 'Picareta de Pedra', 'stone_axe': 'Machado de Pedra', 'stone_shovel': 'Pá de Pedra', 'stone_sword': 'Espada de Pedra', 'stone_katana': 'Katana de Pedra', 'stone_spear': 'Lança de Pedra', 'stone_hammer': 'Martelo de Pedra', 'stone_hoe': 'Enxada de Pedra', 'stone_shield': 'Escudo de Pedra',
        'iron_pickaxe': 'Picareta de Ferro', 'iron_axe': 'Machado de Ferro', 'iron_shovel': 'Pá de Ferro', 'iron_sword': 'Espada de Ferro', 'iron_katana': 'Katana de Ferro', 'iron_spear': 'Lança de Ferro', 'iron_hammer': 'Martelo de Ferro', 'iron_hoe': 'Enxada de Ferro', 'iron_shield': 'Escudo de Ferro',
        'gold_pickaxe': 'Picareta de Ouro', 'gold_axe': 'Machado de Ouro', 'gold_shovel': 'Pá de Ouro', 'gold_sword': 'Espada de Ouro', 'gold_katana': 'Katana de Ouro', 'gold_spear': 'Lança de Ouro', 'gold_hammer': 'Martelo de Ouro', 'gold_hoe': 'Enxada de Ouro', 'gold_shield': 'Escudo de Ouro',
        'diamond_pickaxe': 'Picareta de Diamante', 'diamond_axe': 'Machado de Diamante', 'diamond_shovel': 'Pá de Diamante', 'diamond_sword': 'Espada de Diamante', 'diamond_katana': 'Katana de Diamante', 'diamond_spear': 'Lança de Diamante', 'diamond_hammer': 'Martelo de Diamante', 'diamond_hoe': 'Enxada de Diamante', 'diamond_shield': 'Escudo de Diamante',
        'titanium_pickaxe': 'Picareta de Titânio', 'titanium_axe': 'Machado de Titânio', 'titanium_shovel': 'Pá de Titânio', 'titanium_sword': 'Espada de Titânio', 'titanium_katana': 'Katana de Titânio', 'titanium_spear': 'Lança de Titânio', 'titanium_hammer': 'Martelo de Titânio', 'titanium_shield': 'Escudo de Titânio',
        'uranium_pickaxe': 'Picareta de Urânio', 'uranium_axe': 'Machado de Urânio', 'uranium_shovel': 'Pá de Urânio', 'uranium_sword': 'Espada de Urânio', 'uranium_katana': 'Katana de Urânio', 'uranium_spear': 'Lança de Urânio', 'uranium_hammer': 'Martelo de Urânio', 'uranium_shield': 'Escudo de Urânio',
        'copper_pickaxe': 'Picareta de Cobre', 'copper_axe': 'Machado de Cobre', 'copper_shovel': 'Pá de Cobre', 'copper_sword': 'Espada de Cobre', 'copper_katana': 'Katana de Cobre', 'copper_spear': 'Lança de Cobre', 'copper_shield': 'Escudo de Cobre',
        // Armors
        'iron_helmet': 'Capacete de Ferro', 'iron_chestplate': 'Peitoral de Ferro', 'iron_leggings': 'Calça de Ferro', 'iron_boots': 'Botas de Ferro',
        'reinforced_iron_helmet': 'Capacete de Ferro Reforçado', 'reinforced_iron_chestplate': 'Peitoral de Ferro Reforçado', 'reinforced_iron_leggings': 'Calça de Ferro Reforçado', 'reinforced_iron_boots': 'Botas de Ferro Reforçado',
        'gold_helmet': 'Capacete de Ouro', 'gold_chestplate': 'Peitoral de Ouro', 'gold_leggings': 'Calça de Ouro', 'gold_boots': 'Botas de Ouro',
        'diamond_helmet': 'Capacete de Diamante', 'diamond_chestplate': 'Peitoral de Diamante', 'diamond_leggings': 'Calça de Diamante', 'diamond_boots': 'Botas de Diamante',
        'titanium_helmet': 'Capacete de Titânio', 'titanium_chestplate': 'Peitoral de Titânio', 'titanium_leggings': 'Calça de Titânio', 'titanium_boots': 'Botas de Titânio',
        'uranium_helmet': 'Capacete de Urânio', 'uranium_chestplate': 'Peitoral de Urânio', 'uranium_leggings': 'Calça de Urânio', 'uranium_boots': 'Botas de Urânio',
        'copper_helmet': 'Capacete de Cobre', 'copper_chestplate': 'Peitoral de Cobre', 'copper_leggings': 'Calça de Cobre', 'copper_boots': 'Botas de Cobre',
        'hazmat_helmet': 'Capacete de Radiação', 'hazmat_chestplate': 'Peitoral de Radiação', 'hazmat_leggings': 'Calça de Radiação', 'hazmat_boots': 'Botas de Radiação',
        SLEEP_MENU: "Menu de Sono",
        WAKE_TIME: "Acordar às:",
        SLEEP: "Dormir",
        CANT_SLEEP: "Você só pode dormir a noite nesta cama.",
        ONLINE_MODE: "Modo Online",
        CREATE_ROOM: "Criar Sala",
        JOIN_ROOM: "Entrar em Sala",
        ROOM_NAME: "Nome da Sala",
        ROOM_CODE: "Código da Sala",
        ENTER_CODE: "Digite o Código",
        START_HOST: "Criar Mundo Online",
        JOIN: "Entrar",
        SELECT_WORLD: "Escolha um mundo",
        NEW_WORLD: "Novo Mundo",
        MULTIPLAYER_NOTE: "Nota: Inventários e XP são separados. Você pode explorar independentemente."
    }
};

export const TRANSLATIONS: Record<'EN' | 'PT', Record<string, string>> = {
  EN: {
    MENU: "Menu",
    INVENTORY: "Inventory",
    CHARACTER: "Character",
    CRAFTING: "Crafting",
    DECOR: "Decor",
    ITEMS: "Items",
    COMBAT: "Combat",
    SEARCH: "Search",
    LEVEL: "Level",
    POINTS: "Skill Points",
    STATS_STRENGTH: "Strength",
    STATS_REACH: "Reach",
    STATS_VITALITY: "Vitality",
    STATS_METABOLISM: "Metabolism",
    STATS_ENDURANCE: "Endurance",
    STATS_AGILITY: "Agility",
    NO_RECIPES: "No recipes found.",
    HINT_INV: "Right Click to split/equip. Drag to move.",
    PLAY: "Play",
    ONLINE_MODE: "Online Mode",
    OPTIONS: "Options",
    CREATE_ROOM: "Create Room",
    JOIN_ROOM: "Join Room",
    MULTIPLAYER_NOTE: "Note: Inventories and XP are separate. You can explore independently.",
    BACK: "Back",
    ROOM_NAME: "Room Name",
    ROOM_CODE: "Room Code",
    SELECT_WORLD: "Select World",
    NEW_WORLD: "New World",
    START_HOST: "Start Host",
    ENTER_CODE: "Enter Room Code",
    JOIN: "Join",
    LANGUAGE: "Language",
    COORDS: "Coordinates",
    ADMIN_TEST: "Admin Mode",
    ADMIN_CONFIRM_TITLE: "Enable Admin Mode?",
    ADMIN_CONFIRM_MSG: "Enabling Admin Mode allows flying and spawning items. Achievements are disabled.",
    YES: "Yes",
    NO: "No",
    BUILD_MENU: "Build Menu",
    REQ: "Req",
    UPGRADE_BENCH: "Upgrade Bench",
    LOYALTY_DESC: "Combine identical items to repair durability.",
    UPGRADE: "Repair",
    ADMIN_PANEL: "Admin Panel",
    NO_CLIP: "No Clip",
    NIGHT_VISION: "Night Vision",
    RESET_DAY: "Reset Day",
    SKIP_DAY: "Skip to Night",
    TOTAL_INV: "Total Inventory",
    SLEEP_MENU: "Sleep Menu",
    WAKE_TIME: "Wake up at:",
    SLEEP: "Sleep",
    ADMIN_HINT: "Press P for Admin Panel",
    CANT_SLEEP: "You can only sleep at night.",
  },
  PT: {
    MENU: "Menu",
    INVENTORY: "Inventário",
    CHARACTER: "Personagem",
    CRAFTING: "Criação",
    DECOR: "Decoração",
    ITEMS: "Itens",
    COMBAT: "Combate",
    SEARCH: "Buscar",
    LEVEL: "Nível",
    POINTS: "Pontos",
    STATS_STRENGTH: "Força",
    STATS_REACH: "Alcance",
    STATS_VITALITY: "Vitalidade",
    STATS_METABOLISM: "Metabolismo",
    STATS_ENDURANCE: "Resistência",
    STATS_AGILITY: "Agilidade",
    NO_RECIPES: "Nenhuma receita encontrada.",
    HINT_INV: "Clique Direito para dividir/equipar. Arraste para mover.",
    PLAY: "Jogar",
    ONLINE_MODE: "Modo Online",
    OPTIONS: "Opções",
    CREATE_ROOM: "Criar Sala",
    JOIN_ROOM: "Entrar na Sala",
    MULTIPLAYER_NOTE: "Nota: Inventários e XP são separados.",
    BACK: "Voltar",
    ROOM_NAME: "Nome da Sala",
    ROOM_CODE: "Código",
    SELECT_WORLD: "Selecionar Mundo",
    NEW_WORLD: "Novo Mundo",
    START_HOST: "Iniciar Host",
    ENTER_CODE: "Código da Sala",
    JOIN: "Entrar",
    LANGUAGE: "Idioma",
    COORDS: "Coordenadas",
    ADMIN_TEST: "Modo Admin",
    ADMIN_CONFIRM_TITLE: "Ativar Modo Admin?",
    ADMIN_CONFIRM_MSG: "Isso permite voar e criar itens. Conquistas desativadas.",
    YES: "Sim",
    NO: "Não",
    BUILD_MENU: "Menu de Construção",
    REQ: "Req",
    UPGRADE_BENCH: "Bancada de Melhoria",
    LOYALTY_DESC: "Combine itens iguais para reparar.",
    UPGRADE: "Reparar",
    ADMIN_PANEL: "Painel Admin",
    NO_CLIP: "Atravessar Paredes",
    NIGHT_VISION: "Visão Noturna",
    RESET_DAY: "Dia",
    SKIP_DAY: "Noite",
    TOTAL_INV: "Todos os Itens",
    SLEEP_MENU: "Menu de Sono",
    WAKE_TIME: "Acordar às:",
    SLEEP: "Dormir",
    ADMIN_HINT: "Pressione P para Painel Admin",
    CANT_SLEEP: "Você só pode dormir a noite.",
  }
};

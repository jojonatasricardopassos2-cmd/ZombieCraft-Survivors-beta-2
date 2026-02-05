
export enum BlockType {
  AIR = 0,
  DIRT = 1,
  GRASS = 2,
  STONE = 3,
  WOOD = 4,
  LEAVES = 5,
  PLANKS = 6,
  COAL_ORE = 7,
  IRON_ORE = 8,
  GOLD_ORE = 9,
  DIAMOND_ORE = 10,
  BEDROCK = 11,
  SAND = 12,
  CRAFTING_TABLE = 13,
  FURNACE = 14,
  TORCH = 15,
  CHEST = 16, // Small (20)
  BUSH = 17,
  WOOL = 18,
  BED = 19, // Basic Bed
  WATER = 20,
  COPPER_ORE = 21,
  GLASS = 22,
  CHEST_MEDIUM = 23, // 50 slots
  CHEST_LARGE = 24,   // 100 slots
  ROOF_WOOD = 25, // Right slope
  ROOF_STONE = 26, // Right slope
  WALL_WOOD = 27, // Background wall
  UPGRADE_BENCH = 28,
  ROOF_WOOD_LEFT = 29, // Left slope
  ROOF_STONE_LEFT = 30, // Left slope
  DEEP_STONE = 31,
  TITANIUM_ORE = 32,
  DOOR_BOTTOM_CLOSED = 33,
  DOOR_TOP_CLOSED = 34,
  FARMLAND = 35,
  CROP_WHEAT = 36,
  CROP_CARROT = 37,
  CROP_POTATO = 38,
  DOOR_BOTTOM_OPEN = 39,
  DOOR_TOP_OPEN = 40,
  BERRY_BUSH = 41,
  SEED_BUSH = 42,
  BED_MEDIUM = 43,
  BED_ADVANCED = 44,
  DARK_GRASS = 45,
  DARK_WOOD = 46,
  DARK_LEAVES = 47,
  URANIUM_ORE = 48,
  STONE_CHEST = 49, // 50 Slots, for ores
  FLOWER_RED = 50,
  FLOWER_GREEN = 51,
  FLOWER_BLUE = 52,
  URANIUM_BLOCK = 53,
  TITANIUM_BLOCK = 54
}

export enum ItemType {
  BLOCK = 'BLOCK',
  TOOL = 'TOOL',
  MATERIAL = 'MATERIAL',
  FOOD = 'FOOD',
  ARMOR = 'ARMOR',
  SHIELD = 'SHIELD'
}

export interface ItemStack {
  id: BlockType | string; 
  count: number;
  type: ItemType;
  meta?: { 
      damage?: number; 
      loyalty?: boolean;
  }; 
}

export interface Equipment {
    helmet: ItemStack | null;
    chestplate: ItemStack | null;
    leggings: ItemStack | null;
    boots: ItemStack | null;
    offHand: ItemStack | null; 
}

export interface Entity {
  id: number;
  type: 'PLAYER' | 'ZOMBIE' | 'PIG' | 'COW' | 'SHEEP' | 'DROP' | 'PROJECTILE' | 'MUTANT_ZOMBIE';
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  health: number;
  maxHealth: number;
  facingRight: boolean;
  // For drops
  itemId?: BlockType | string;
  itemCount?: number;
  itemMeta?: { damage?: number, loyalty?: boolean }; 
  creationTime?: number; 
  // For mobs
  attackCooldown?: number;
  lastDamageTime?: number; 
  // For Projectiles
  rotation?: number;
  projectileState?: 'FLYING' | 'STUCK' | 'RETURNING';
  ownerId?: number;
  loyalty?: boolean;
  // For Crops (stored as pseudo-entity logic or block meta logic)
  growTime?: number;
  // Multiplayer
  playerName?: string;
}

export type RecipeCategory = 'DECOR' | 'ITEMS' | 'COMBAT' | 'BASIC';

export interface CraftingRecipe {
  result: { id: BlockType | string; count: number; type: ItemType };
  ingredients: { id: BlockType | string; count: number }[];
  station: BlockType | 'NONE'; 
  category: RecipeCategory;
}

export interface WorldData {
  width: number;
  height: number;
  blocks: number[]; 
  light: number[]; 
}

export interface FurnaceData {
  input: ItemStack | null;
  fuel: ItemStack | null;
  output: ItemStack | null;
  burnTime: number; 
  maxBurnTime: number; 
  cookTime: number; 
}

export interface CropData {
    type: 'WHEAT' | 'CARROT' | 'POTATO';
    stage: number; // 0 to 3
    plantedTime: number;
}

export interface PlayerStats {
    strength: number;   
    reach: number;      
    vitality: number;   
    metabolism: number; 
    endurance: number;  
    agility: number;    
}

export interface GameOptions {
    showCoordinates: boolean;
    adminMode?: boolean;
    isMobile?: boolean; // Mobile controls toggle
    multiplayer?: {
        mode: 'HOST' | 'CLIENT';
        roomId: string;
        playerName: string;
    };
}

export interface SavedWorld {
    id: string; 
    name: string;
    seed: number;
    worldData: WorldData;
    player: Entity;
    inventory: (ItemStack | null)[];
    equipment: Equipment;
    furnaces: [string, FurnaceData][]; 
    chests: [string, ItemStack[]][]; 
    crops?: [string, CropData][]; // New crop storage
    lastPlayed: number;
    time: number;
    // RPG Data
    xp: number;
    level: number;
    skillPoints: number;
    stats: PlayerStats;
    stamina: number;
    hunger: number;
    options?: GameOptions;
}

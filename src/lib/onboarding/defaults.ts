/**
 * Cake Builder menu structure + quick-start defaults used at onboarding so a
 * new bakery isn't staring at a blank menu. Prices are in MINOR units (paisa /
 * cents). Everything here is fully editable later in the dashboard.
 */

/** Builder step categories. `menu_items.category` uses these keys. */
export const MENU_CATEGORIES = [
  { key: "size", label: "Sizes", hasBase: true },
  { key: "flavor", label: "Flavors", hasBase: false },
  { key: "filling", label: "Fillings", hasBase: false },
  { key: "frosting", label: "Frostings", hasBase: false },
  { key: "topping", label: "Toppings", hasBase: false },
  { key: "decoration", label: "Decorations", hasBase: false },
  { key: "shape", label: "Shapes", hasBase: false },
] as const;

export type MenuCategoryKey = (typeof MENU_CATEGORIES)[number]["key"];

export interface DefaultMenuItem {
  category: MenuCategoryKey;
  name: string;
  price_minor: number;
  is_base_price: boolean;
  sort_order: number;
}

/** ~24 starter items across all builder steps. */
export const DEFAULT_MENU_ITEMS: DefaultMenuItem[] = [
  // Sizes carry the base price of the cake.
  { category: "size", name: "0.5 kg", price_minor: 120000, is_base_price: true, sort_order: 1 },
  { category: "size", name: "1 kg", price_minor: 200000, is_base_price: true, sort_order: 2 },
  { category: "size", name: "2 kg", price_minor: 380000, is_base_price: true, sort_order: 3 },
  // Flavors
  { category: "flavor", name: "Vanilla", price_minor: 0, is_base_price: false, sort_order: 1 },
  { category: "flavor", name: "Chocolate", price_minor: 0, is_base_price: false, sort_order: 2 },
  { category: "flavor", name: "Red Velvet", price_minor: 30000, is_base_price: false, sort_order: 3 },
  { category: "flavor", name: "Coffee", price_minor: 20000, is_base_price: false, sort_order: 4 },
  // Fillings
  { category: "filling", name: "Fresh Cream", price_minor: 0, is_base_price: false, sort_order: 1 },
  { category: "filling", name: "Chocolate Ganache", price_minor: 25000, is_base_price: false, sort_order: 2 },
  { category: "filling", name: "Fruit Compote", price_minor: 30000, is_base_price: false, sort_order: 3 },
  // Frostings
  { category: "frosting", name: "Buttercream", price_minor: 0, is_base_price: false, sort_order: 1 },
  { category: "frosting", name: "Whipped Cream", price_minor: 0, is_base_price: false, sort_order: 2 },
  { category: "frosting", name: "Fondant", price_minor: 50000, is_base_price: false, sort_order: 3 },
  // Toppings
  { category: "topping", name: "Fresh Fruit", price_minor: 20000, is_base_price: false, sort_order: 1 },
  { category: "topping", name: "Chocolate Shards", price_minor: 15000, is_base_price: false, sort_order: 2 },
  { category: "topping", name: "Sprinkles", price_minor: 5000, is_base_price: false, sort_order: 3 },
  // Decorations
  { category: "decoration", name: "Celebration Topper", price_minor: 10000, is_base_price: false, sort_order: 1 },
  { category: "decoration", name: "Edible Flowers", price_minor: 35000, is_base_price: false, sort_order: 2 },
  { category: "decoration", name: "Number Candle", price_minor: 5000, is_base_price: false, sort_order: 3 },
  // Shapes
  { category: "shape", name: "Round", price_minor: 0, is_base_price: false, sort_order: 1 },
  { category: "shape", name: "Square", price_minor: 0, is_base_price: false, sort_order: 2 },
  { category: "shape", name: "Heart", price_minor: 25000, is_base_price: false, sort_order: 3 },
];

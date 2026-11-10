/**
 * AUTHORITATIVE MENU DATA — the only place dish names and prices live.
 * Prices come from the menu supplied with the project and must be confirmed by the owner.
 * `image` is only set where the photo genuinely shows that dish.
 */
import biryani from "../assets/dish-biryani.webp";
import paneerTikka from "../assets/dish-paneer-tikka.webp";
import chickenTikka from "../assets/dish-chicken-tikka.webp";
import { slugify } from "../lib/format.js";

const dish = (name, price, veg, desc, image) => ({ name, price, veg, desc, image });

const raw = [
  ["Starter (Non Veg)", [
    dish("Chicken 65", 260, false, "Crispy chicken tossed with curry leaves, chilli and warm spices."),
    dish("Chilly Chicken", 280, false, "Tender chicken tossed with peppers, onion and a savoury chilli sauce."),
    dish("Chicken Lollipop", 290, false, "Marinated chicken drumettes fried until crisp and served with dip."),
    dish("Prawn Tikka", 380, false, "Juicy prawns marinated with spices and grilled until smoky."),
    dish("Chilly Fish", 340, false, "Crisp fish tossed with peppers, onion and a lightly spicy sauce."),
  ]],
  ["Tandoori (Veg)", [
    dish("Paneer Tikka", 280, true, "Paneer cubes marinated in yoghurt and spices, grilled in the tandoor.", paneerTikka),
    dish("Malai Paneer Tikka", 300, true, "Soft paneer in a creamy marinade, charred in the clay oven."),
    dish("Tandoori Mushroom", 260, true, "Mushrooms marinated with herbs and spices, roasted in the tandoor."),
    dish("Malai Chaap", 260, true, "Creamy soya chaap with a gentle spice blend, grilled until golden."),
    dish("Afghani Chaap", 270, true, "Soya chaap in a rich, mildly spiced marinade from the clay oven."),
  ]],
  ["Tandoori (Non Veg)", [
    dish("Chicken Tikka", 320, false, "Boneless chicken marinated with yoghurt and spices, grilled over charcoal.", chickenTikka),
    dish("Tandoori Chicken (Half)", 360, false, "Half chicken marinated overnight and roasted in the clay oven."),
    dish("Tandoori Chicken (Full)", 680, false, "Whole chicken marinated with house spices and roasted in the clay oven."),
    dish("Chicken Malai Tikka", 340, false, "Tender chicken in a creamy, mildly spiced marinade, grilled until smoky."),
    dish("Seekh Kebab", 320, false, "Spiced minced meat shaped on skewers and cooked in the tandoor."),
  ]],
  ["Indian Veg Curry", [
    dish("Paneer Butter Masala", 290, true, "Paneer simmered in a buttery tomato gravy with a touch of cream."),
    dish("Shahi Paneer", 290, true, "Paneer in a mild, creamy gravy of tomatoes, cashews and fragrant spices."),
    dish("Kadai Paneer", 280, true, "Paneer with peppers in a robust, freshly ground kadai masala."),
    dish("Dal Makhani", 250, true, "Slow-cooked black lentils finished with butter and cream."),
    dish("Mixed Vegetable Curry", 240, true, "Seasonal vegetables simmered in a homestyle spiced gravy."),
  ]],
  ["Chinese Noodles", [
    dish("Veg Hakka Noodles", 200, true, "Wok-tossed noodles with crisp vegetables and savoury sauces."),
    dish("Chicken Hakka Noodles", 240, false, "Wok-tossed noodles with chicken, vegetables and house sauces."),
    dish("Veg Sezwan Noodles", 220, true, "Noodles tossed with vegetables in a bold, spicy Sezwan sauce."),
    dish("Chicken Sezwan Noodles", 260, false, "Chicken and noodles wok-tossed in a fiery Sezwan sauce."),
    dish("Egg Hakka Noodles", 220, false, "Wok-tossed noodles with egg, vegetables and savoury sauces."),
  ]],
  ["Rice", [
    dish("Veg Fried Rice", 200, true, "Fragrant rice wok-tossed with vegetables and a light seasoning."),
    dish("Chicken Fried Rice", 240, false, "Wok-tossed rice with chicken, vegetables and house seasoning."),
    dish("Egg Fried Rice", 220, false, "Wok-tossed rice with egg, vegetables and a light seasoning."),
    dish("Burnt Garlic Fried Rice", 220, true, "Fried rice tossed with vegetables and aromatic toasted garlic."),
    dish("Chicken Burnt Garlic Fried Rice", 260, false, "Chicken fried rice finished with aromatic toasted garlic."),
  ]],
  ["Chinese Curry (Veg)", [
    dish("Veg Manchurian", 220, true, "Vegetable dumplings tossed in a tangy, savoury Indo-Chinese sauce."),
    dish("Paneer Chilly", 280, true, "Paneer tossed with peppers, onion and a spicy chilli sauce."),
    dish("Veg Schezwan", 220, true, "Mixed vegetables in a punchy, chilli-forward Sezwan sauce."),
    dish("Mushroom Chilly", 260, true, "Mushrooms tossed with peppers and onion in a spicy sauce."),
  ]],
  ["Chinese Curry (Non Veg)", [
    dish("Chilly Chicken Gravy", 290, false, "Chicken, peppers and onion in a savoury chilli gravy."),
    dish("Chicken Manchurian", 290, false, "Crisp chicken tossed in a tangy, savoury Indo-Chinese gravy."),
    dish("Chicken Sezwan", 300, false, "Chicken cooked in a bold, spicy Sezwan sauce."),
    dish("Chilly Fish Gravy", 350, false, "Fish tossed with peppers and onion in a spicy chilli gravy."),
  ]],
  ["Biryani & Non Veg Curries", [
    dish("Chicken Hyderabadi Dum Biryani", 300, false, "Layered basmati rice and spiced chicken, sealed and slow-cooked dum-style."),
    dish("Chicken Biryani", 280, false, "Aromatic basmati rice layered with tender chicken and warming spices.", biryani),
    dish("Mutton Biryani", 380, false, "Dum-cooked basmati rice layered with tender, spiced mutton."),
    dish("Paneer Biryani", 260, true, "Fragrant basmati rice layered with paneer and aromatic spices."),
    dish("Butter Chicken", 320, false, "Tandoori chicken simmered in a smooth tomato, butter and cream gravy."),
    dish("Chicken Curry", 300, false, "Homestyle chicken curry simmered with onion, tomato and warming spices."),
  ]],
];

/** Default menu (used on first load, and as fallback / "Reset to defaults" in the admin panel). */
export const defaultMenu = raw.flatMap(([category, items]) =>
  items.map((it) => ({ ...it, id: slugify(it.name), category, categoryId: slugify(category), available: true }))
);

// Home page "featured" picks — only dishes with a matching real photograph.
export const featuredIds = ["chicken-biryani", "paneer-tikka", "chicken-tikka"];
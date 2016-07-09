var BeefStroganoff = require('./BeefStroganoff.js');
var BelgianWaffle = require('./BelgianWaffle.js');
var Bouillabaisse = require('./Bouillabaisse.js');
var Bruschetta = require('./Bruschetta.js');
var Cereal = require('./Cereal.js');
var Cheesecake = require('./Cheesecake.js');
var ChickenMarsala = require('./ChickenMarsala.js');
var ChocolateCupcakes = require('./ChocolateCupcakes.js');
var Cornbread = require('./Cornbread.js');
var CrabCakes = require('./CrabCakes.js');
var CremeBrulee = require('./CremeBrulee.js');
var EggsBenedict = require('./EggsBenedict.js');
var FishCurry = require('./FishCurry.js');
var FriedRice = require('./FriedRice.js');
var FruitCeviche = require('./FruitCeviche.js');
var GreenBeanCasserole = require('./GreenBeanCasserole.js');
var MashedPotatoes = require('./MashedPotatoes.js');
var Oatmeal = require('./Oatmeal.js');
var Pancakes = require('./Pancakes.js');
var ScrambledEggs = require('./ScrambledEggs.js');
var SpringRolls = require('./SpringRolls.js');

module.exports = [
  {
    name: 'Breakfast Tutorial',
    key: 'brkf-tutorial',
    rating: 1,
    recipes: [Oatmeal, Cereal, ScrambledEggs, Pancakes],
    soloRecipes: [Oatmeal, Cereal],
    tutorial: true,
  },
  {
    name: 'American Diner',
    key: 'amer-diner',
    rating: 2,
    recipes: [Cornbread, BeefStroganoff, GreenBeanCasserole, ChocolateCupcakes],
    soloRecipes: [Cornbread, BeefStroganoff, GreenBeanCasserole],
  },
  {
    name: 'Nice American Brunch',
    key: 'amer-brunch',
    rating: 3,
    recipes: [FruitCeviche, CrabCakes, EggsBenedict, BelgianWaffle],
    soloRecipes: [CrabCakes, EggsBenedict, BelgianWaffle],
  },
  {
    name: 'Mashed Potatoes',
    key: 'bonus-potatoes',
    locked: true,
    bonus: true,
    record: 'count',
    rating: 3,
    recipes: [MashedPotatoes],
  },
  {
    name: 'Pan-Asian Lunch',
    key: 'asia-lunch',
    locked: true,
    rating: 4,
    recipes: [SpringRolls, FishCurry, FriedRice, Cheesecake],
  },
  {
    name: 'French-Italian Bistro',
    key: 'frit-bistro',
    locked: true,
    rating: 5,
    recipes: [Bruschetta, ChickenMarsala, Bouillabaisse, CremeBrulee],
  },
];

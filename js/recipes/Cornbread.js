var React = require('react');

var ColorChange = require('../ColorChange.react.js');
var RecipeStep = require('../RecipeStep.react.js');

var recipeData = {
  name: 'bready',
  left: [],
  right: [],
};

var nextStep = function() {
  return this.nextStep();
};

var Cornbread = {
  name: 'Cornbread',
  chefName: 'Boulanger',
  type: 'appetizer',
  difficulty: 'easy',
  ingredients: ['1/4 cup butter', '1 cup milk', '1 large egg', '1 1/4 cups cornmeal', '1 cup all-purpose flour', '1/2 cup sugar', '1 tbsp baking powder', '1/2 tsp salt'],
  description: 'A fluffy pastry baked to perfection.',

  /* A recipe is a list of json steps */
  steps: [
    {
      pretext: <span>Press up and down to preheat the oven to <b className="fireRed">400°F</b>.<br/></span>,
      instruction: 300,
      type: 'counter',
      stepValue: 10,
      goalValue: 400,
      timer: 10,
      onTimeout: function(value) {
        if (value >= 395 && value <= 405) {
          this.nextStep();
        } else {
          this.failure();
        }
      }
    },
    {
      pretext: 'Type',
      instruction: 'pan',
      posttext: 'to grab an 8-inch square pan.',
      timer: 12,
    },
    {
      pretext: 'Spray non-stick cooking',
      instruction: 'spray',
      posttext: 'into the pan.',
      timer: 12,
    },
    {
      pretext: 'Unwrap a stick of butter by tapping',
      instruction: 'u',
      posttext: '.',
      timer: 8,
    },
    {
      pretext: <span>Pour <b className="green">1 cup</b> of milk into a mixing bowl by holding 'm'.<br/><br/></span>,
      instruction: 'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmilk',
      posttext: <span><br/>cups:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;^ 1/2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;^ 2/2&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;^ 3/2</span>,
      timer: 10,
      onHoldSound: 'pouring',
      onComplete: () => {},
      onTimeout: function(progress) {
        if (progress >= 20 && progress <= 25) {
          this.nextStep();
        } else {
          this.failure();
        }
      },
    },
    {
      pretext: 'Crack an egg into the bowl with',
      instruction: 'c',
      posttext: '.',
      timer: 8,
      onComplete: function() {
        this.nextStep(false, 'eggcrack');
      },
    },
    {
      pretext: <span>Beat the butter, milk, and egg mixture by mashing 'b'.<br/></span>,
      instruction: 'b',
      type: 'mash',
      mashCount: 10,
      onPressSound: ['eggbeat1', 'eggbeat2'],
      timer: 10,
    },
    {
      pretext: <span>Add <b>cornmeal</b>, <b>flour</b>, <b>sugar</b>, and <b>baking powder</b> into the bowl.</span>,
      type: 'ingredients',
      leftName: 'Ingredients',
      rightName: 'Bowl',
      ingredients: [
        {name: 'cornmeal', key: 'c', left: true},
        {name: 'flour', key: 'f', left: true},
        {name: 'sugar', key: 's', left: true},
        {name: 'baking powder', key: 'b', left: true},
      ],
      timer: 10,
      onProgress: function(left, right) {
        recipeData.left = left;
        recipeData.right = right;
      },
      onTimeout: function() {
        if (recipeData.right.length === 4) {
          this.nextStep();
        } else {
          this.failure();
        }
      },
    },
    {
      pretext: <span>Stir up the mixture with the arrow keys.<br/></span>,
      instruction: 'urdlurdl',
      type: 'arrows',
      timer: 10,
    },
    {
      pretext: 'Pour the batter into the pan with',
      instruction: 'b',
      posttext: '.',
      timer: 8,
    },
    {
      pretext: <span>Put the <b>pan</b> in the oven.</span>,
      type: 'ingredients',
      leftName: 'Table',
      rightName: 'Oven',
      ingredients: [
        {name: 'pan of batter', key: 'p', left: true},
      ],
      timer: 8,
      onProgress: function(left, right) {
        recipeData.left = left;
        recipeData.right = right;
      },
      onTimeout: function() {
        if (recipeData.right.length === 1) {
          this.nextStep();
        } else {
          this.failure();
        }
      },
    },
    {
      pretext: 'Take a short break and tap your foot to the jazz.',
      timer: 10,
      onTimeout: nextStep,
    },
    {
      pretext: <span>Give your cornbread a nickname while it bakes.<br/></span>,
      instruction: 'Name: ',
      type: 'textinput',
      timer: 6,
      onTimeout: function(name) {
        if (!name) {
          this.failure();
        } else {
          recipeData.name = name;
          this.nextStep();
        }
      },
    },
    {
      pretext: () => <span>Bake <ColorChange>{recipeData.name}</ColorChange> until golden brown; then</span>,
      instruction: 'take',
      posttext: 'the pan out of the oven.',
      timer: 30,
      onComplete: function(progress, time) {
        // Only proceed if color is golden brown
        if (time <= 20) {
          this.nextStep();
        } else {
          this.failure();
        }
      },
    },
    {
      pretext: () => <span>Cut {recipeData.name} into little squares with 'c' and serve!<br/></span>,
      instruction: 'c',
      type: 'mash',
      mashCount: 7,
      timer: 10,
    },
  ],
};

module.exports = Cornbread;

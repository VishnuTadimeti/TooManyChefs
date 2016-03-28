var React = require('react');
var TimerMixin = require('react-timer-mixin');
var TransitionGroup = require('timeout-transition-group');
var _ = require('lodash');

var ChefBox = require('./ChefBox.react.js');
var Inst = require('./Instruction.react.js');

var Recipes = require('./recipes/Recipes.js');

var Game = React.createClass({
  mixins: [TimerMixin],

  getInitialState: function() {
    return {
      gameState: 'title',  // title | menu | started | loading
      numPlayers: 0,
      chefs: [],
      rating: 5, // health
    };
  },

  onShowMenu: function() {
    this.setState({gameState: 'menu'});
  },

  onStartGame: function(numPlayers) {
    // Assign recipes randomly from entrees, appetizers, and desserts
    var chefs = new Array(numPlayers);
    var entrees = _.sampleSize(Recipes.Entrees, numPlayers > 4 ? 3 : 2);
    var chefNames = ['Chef de cuisine', 'Sous-chef', 'Assistant chef'];
    for (var i = 0; i < entrees.length; i++) {
      chefs[i] = entrees[i];
      chefs[i].chefName = chefNames[i];
    }

    var appetizers = _.sampleSize(Recipes.Appetizers, numPlayers > 5 ? 2 : 1);
    chefNames = ['Saucier', 'Tournant'];
    for (var i = 0; i < appetizers.length; i++) {
      chefs[entrees.length + i] = appetizers[i];
      chefs[entrees.length + i].chefName = chefNames[i];
    }

    chefs[numPlayers - 1] = _.sample(Recipes.Desserts);
    chefs[numPlayers - 1].chefName = 'Pâtissier';

    this.setState({gameState: ''});
    this.setTimeout(() => {
      this.setState({gameState: 'loading'});
    }, 500);

    // Wait a bit to fade out
    this.setTimeout(() => {
      this.setState({
        gameState: 'started',
        numPlayers: numPlayers,
        chefs: chefs,
      });
    }, 3000);
  },

  onFailure: function(onLose, onContinue) {
    var rating = this.state.rating - 1;
    this.setState({rating: rating});

    if (rating <= 0) {
      // TODO: make everyone lose simultaneously
      onLose();
    } else {
      onContinue();
    }
  },

  renderRating: function() {
    var starFull = (i) => <span key={i} className="darkBlue glyphicon glyphicon-star" />;
    var starEmpty = (i) => <span key={i} className="lightBlue glyphicon glyphicon-star-empty" />;

    return (
      <h4 id="rating" className="center">
        {_.range(5).map(i => this.state.rating > i ? starFull(i) : starEmpty(i))}
      </h4>
    );
  },

  renderChefBox: function(recipe, i) {
    var widthClass = this.state.numPlayers > 4 ? 4 : 6;
    return <ChefBox key={i} chefName={recipe.chefName}
                    recipe={recipe} onFailure={this.onFailure}
                    widthClass={widthClass}
           />;
  },

  render: function() {
    if (this.state.gameState === 'started') {
      var halfChefs = this.state.numPlayers / 2;

      return (
        <div>
          {_.take(this.state.chefs, halfChefs).map(this.renderChefBox)}
          {this.renderRating()}
          {_.takeRight(this.state.chefs, this.state.numPlayers - halfChefs).map(this.renderChefBox)}
        </div>
      );
    }

    var playerMenu = (
      <div>
        <p>Number of chefs:</p>
        <ul className="list-inline">
          <li><Inst onComplete={this.onStartGame.bind(this, 4)}>four</Inst></li>
          {/*<li><Inst onComplete={this.onStartGame.bind(this, 5)}>five</Inst></li>
          <li><Inst onComplete={this.onStartGame.bind(this, 6)}>six</Inst></li>*/}
        </ul>
      </div>
    );

    var loading = <div>Compiling recipes...</div>;

    return (
      <div className="center">
        <div className="vcenter">
          <h1>Too Many Chefs</h1>
          <h4>A text-based cooperative cooking game</h4>
        </div>

        <br/>
        <p>Type <Inst onComplete={this.onShowMenu}>start</Inst> to begin</p>
        <br/>
        <TransitionGroup enterTimeout={250}
                         leaveTimeout={250}
                         transitionName="fade">
          {this.state.gameState === 'menu' ? playerMenu :
           this.state.gameState === 'loading' ? loading : null}
        </TransitionGroup>
      </div>
    );
  },
});

module.exports = Game;

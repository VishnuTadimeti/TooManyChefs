var React = require('react');
var PureRenderMixin = require('react-addons-pure-render-mixin');
var TimerMixin = require('react-timer-mixin');
var TransitionGroup = require('react-addons-css-transition-group');

var _ = require('lodash');
var cx = require('classnames');

var CapsLock = require('./CapsLock.react.js');
var ChefBox = require('./ChefBox.react.js');
var RecipeSelect = require('./RecipeSelect.react.js');
var Inst = require('./Instruction.react.js');
var Recipes = require('./recipes/Recipes.js');

const LOADING_TEXT = [
  'Compiling recipes',
  'Donning chef hats',
  'Sharpening knives',
  'Wiping counters',
  'Scrubbing dishes',
  'Gathering ingredients',
  'Allocating cutlery',
];

var Game = React.createClass({
  mixins: [PureRenderMixin, TimerMixin],

  getInitialState: function() {
    return {
      gameState: 'title',  // title | help | menu | started | loading
      chefs: [],
      stillAlive: 0,
      meal: 0,
      content: this.renderTitle(),
    };
  },

  setStateDelay: function(state, delay) {
    delay = delay || 500;

    var renderContent = _.noop;
    switch (state) {
      case 'title':
        renderContent = this.renderTitle;
        break;
      case 'help':
        renderContent = this.renderHelp;
        break;
      case 'menu':
        renderContent = this.renderRecipeMenu;
        break;
      case 'credits':
        renderContent = this.renderCredits;
        break;
      case 'loading':
        renderContent = this.renderLoading;
        break;
    }

    this.setState({
      gameState: '',
      content: null,
    });
    this.setTimeout(() => this.setState({
      gameState: state,
      content: renderContent(),
    }), delay);
  },

  onStartGame: function() {
    // Assign recipes based on selected meal
    this.setStateDelay('loading', 500);

    // Wait a random amount of time before loading (3-5s)
    this.setTimeout(() => {
      this.setState({
        gameState: 'started',
        stillAlive: 0,
        chefs: Recipes[this.state.meal].recipes,
      });
    }, 500 + _.random(3000, 5000));
  },

  onReady: function(player) {
    var stillAlive = this.state.stillAlive + 1;
    var chefs = this.state.chefs;
    chefs[player].ready = true;
    this.setState({
      chefs: chefs,
      stillAlive: stillAlive,
    });

    // Are all chefs ready to begin?
    if (stillAlive === 4) {
      for (var i = 0; i < 4; i++) {
        var chef = this.refs['chef' + i];
        chef.startGame();
      }
      return true;
    }
    return false;
  },

  onFailure: function(loser, canSave) {
    var stillAlive = this.state.stillAlive - 1;
    var chefs = this.state.chefs;
    chefs[loser].dead = true;
    this.setState({
      stillAlive: stillAlive,
      chefs: chefs,
    });

    // Propagate failure to everyone
    for (var i = 0; i < 4; i++) {
      if (i === loser) {
        continue;
      }

      var chef = this.refs['chef' + i];
      var chefName = chefs[loser].chefName;

      if (canSave && stillAlive > 0) {
        if (!chefs[i].dead) {
          chef.showRescuePopup(chefName,
            () => this.refs['chef' + loser].rescue(loser));
        }
      } else {
        chef.gameOver(
          <div>
            <p>{chefName} failed to complete their recipe!</p>
            {stillAlive === 0 && 'Press Ctrl-R to start over.'}
          </div>
        );
      }
    }
  },

  // When rescued, unset dead and increment stillAlive
  onRescued: function(loser) {
    var chefs = this.state.chefs;
    chefs[loser].dead = false;
    this.setState({
      chefs: chefs,
      stillAlive: this.state.stillAlive + 1,
    });
  },

  onComplete: function(winner) {
    var chefs = this.state.chefs;
    chefs[winner].dead = true; // mark "dead" so they can't get popups
    var stillAlive = this.state.stillAlive - 1;
    this.setState({
      chefs: chefs,
      stillAlive: stillAlive,
    });

    return stillAlive === 0 && 'Press Ctrl-R to play again.';
  },

  renderTitle: function() {
    return (
      <div className="padTop">
        <p>Type <Inst onComplete={_.partial(this.setStateDelay, 'menu')}>start</Inst> to begin</p>
        <p>Type <Inst onComplete={_.partial(this.setStateDelay, 'help')}>help</Inst> for instructions</p>
        <p>Type <Inst onComplete={_.partial(this.setStateDelay, 'credits')}>credits</Inst> for culinary staff</p>
      </div>
    );
  },

  onRecipeProgress: function(val) {
    this.setState({meal: val});
  },

  renderRecipeMenu: function() {
    return (
      <RecipeSelect onProgress={this.onRecipeProgress}
                    onSelect={this.onStartGame} />
    );
  },

  renderHelp: function() {
    var heartFull = <span className="fireRed glyphicon glyphicon-heart" />;
    var heartEmpty = <span className="lightRed glyphicon glyphicon-heart-empty" />;
    var timer = <span className="glyphicon glyphicon-hourglass" />;

    return (
      <div className="padTop">
        <h4>A Chef's Guide</h4>
        <p>Follow the instructions, step by step, to complete your recipe!</p>
        <br/>

        <p>You may need to <Inst onComplete={_.noop}>type a command</Inst>,<br/> move a dial with the arrow keys, <br/> and more.</p>
        <br/>

        <p>Watch your health {heartFull}{heartFull}{heartEmpty}<br/> and complete each step before the {timer} timer runs out!</p>
        <br/>

        <p>And last but not least... be mindful of the other chefs in the kitchen!<br/> You're all in this together.</p>
        <br/>
        <br/>
        <p>Type <Inst onComplete={_.partial(this.setStateDelay, 'title')}>back</Inst> to return to title</p>
      </div>
    );
  },

  renderLoading: function() {
    // TODO: add loading tips?
    // TODO: animate ellipses

    return (
      <div className="padTop vcenter vtop">
        {_.sample(LOADING_TEXT)}...
      </div>
    );
  },

  renderCredits: function() {
    return (
      <div className="padTop">
        <br/><br/>
        <h4>Credits</h4>
        <p>
          <b>Chef de cuisine</b> (designer): Ivan Wang<br/>
          <b>Sous-chef</b> (programmer): Ivan Wang<br/>
          <b>Culinary consultant</b>: Anshu Bansal<br/>
          <b>Cafe jazz</b>: <i>Fortaleza</i> by Topher Mohr and Alex Elena
        </p>
        <br/><br/>
        <p>Type <Inst onComplete={_.partial(this.setStateDelay, 'title')}>back</Inst> to return to title</p>
      </div>
    );
  },

  renderChefBoxes: function() {
    return (
      <div>
        {this.state.chefs.map((recipe, i) =>
          <ChefBox key={i} ref={'chef' + i} chefId={i}
                   chefName={recipe.chefName}
                   recipe={recipe}
                   onReady={_.partial(this.onReady, i)}
                   onFailure={_.partial(this.onFailure, i)}
                   onComplete={this.onComplete}
                   onRescued={this.onRescued}
                   stillAlive={this.state.stillAlive}
          />)}
      </div>
    );
  },

  render: function() {
    if (this.state.gameState === 'started') {
      return this.renderChefBoxes();
    }

    return (
      <div className="center">
        <div className={cx('vcenter', {vtop: this.state.gameState !== 'title'})}>
          <img className="chefHat" src="images/chefhat.png" />
          <h1>Too Many Chefs</h1>
          <h4>A text-based cooperative cooking game</h4>
        </div>

        <TransitionGroup transitionName="fade"
                         transitionEnterTimeout={250}
                         transitionLeaveTimeout={250}>
          {this.state.content}
          <CapsLock />
        </TransitionGroup>
      </div>
    );
  },
});

module.exports = Game;

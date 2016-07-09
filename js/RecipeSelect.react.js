var React = require('react');
var TransitionGroup = require('react-addons-css-transition-group');

var _ = require('lodash');
var cx = require('classnames');

var Audio = require('./Audio.js');
var Inst = require('./Instruction.react.js');
var Leaderboard = require('./Leaderboard.react.js');
var KeyboardMixin = require('./KeyboardMixin.react.js');
var Recipes = require('./recipes/Recipes.js');

var RecipeSelect = React.createClass({
  mixins: [KeyboardMixin],

  propTypes: {
    onProgress: React.PropTypes.func.isRequired,
    onSelect: React.PropTypes.func.isRequired,
    saveData: React.PropTypes.object,
    singlePlayer: React.PropTypes.bool.isRequired,
    startValue: React.PropTypes.number.isRequired,
  },

  getInitialState: function() {
    return {
      value: this.props.startValue,
      content: this.renderRecipe(this.props.startValue),
    };
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.state.value != prevState.value) {
      this.props.onProgress(this.state.value);

      // Update content for transition
      this.setState({content: null});
      this.setTimeout(() => this.setState({
        content: this.renderRecipe(this.state.value),
      }), 250);
    }
  },

  onKeyUp: function(e) {
    var keyCode = e.which || e.keyCode || 0;
    if (keyCode === 37 && this.state.value > 0) {
      // left arrow pressed
      Audio.playRandomClick();
      this.setState({value: this.state.value - 1});
    } else if (keyCode === 39 && this.state.value < Recipes.length - 1) {
      // right arrow pressed
      Audio.playRandomClick();
      this.setState({value: this.state.value + 1});
    }
  },

  renderRecipe: function(i) {
    var meal = Recipes[i];
    var recipes = this.props.singlePlayer
      ? _.get(meal, 'soloRecipes', meal.recipes)
      : meal.recipes;

    var emptyStar = (i) => <span key={i} className="lightBlue glyphicon glyphicon-star-empty" />;
    var fullStar = (i) => <span key={i} className="darkBlue glyphicon glyphicon-star" />;
    var mode = this.props.singlePlayer ? 'solo' : 'party';

    // Extract saved data. As of v1.4.0 it is saved under 'solo' or 'party',
    // but for backwards compatibility we also look directly in the object.
    var mealData = _.get(this.props.saveData, [mode, meal.key],
                   _.get(this.props.saveData, meal.key, {}));
    var mealLocked = meal.locked && (i === 0 ||
        !_.get(this.props.saveData, [mode, Recipes[i-1].key, 'completed'],
        _.get(this.props.saveData, [Recipes[i-1].key, 'completed'], false)));
    var recordText = mealData.bestTime && (meal.record === 'count'
      ? <p className="green">Best Score: {mealData.bestTime}</p>
      : <p className="green">Best Time: {Leaderboard.renderTime(mealData.bestTime)}</p>);

    return (
      <div className={cx('meal', 'padTop', {locked: mealLocked})}>
        <div className="mealInfo">
          <h4>{meal.name}</h4>
          <p>
            Difficulty: {_.range(5).map((i) => i < meal.rating ? fullStar(i) : emptyStar(i))}
          </p>
          {mealLocked ? <h4 className="fireRed">Locked</h4> :
           meal.bonus ? <h4 className="darkBlue">BONUS ROUND</h4> :
           mealData.completed ? <h4 className="green">Completed!</h4> : <br/>}
          {recordText}

          {recipes.map((r, i) => (
            <div key={i}>{mealLocked ? '??????' : r.name} ({r.type})</div>
          ))}
        </div>

        <Leaderboard meal={meal} numTop={6}
                     singlePlayer={this.props.singlePlayer} />
      </div>
    );
  },

  render: function() {
    var mode = this.props.singlePlayer ? 'solo' : 'party';
    var locked = Recipes[this.state.value].locked && (this.state.value === 0 ||
        !_.get(this.props.saveData, [mode, Recipes[this.state.value-1].key, 'completed'],
        _.get(this.props.saveData, [Recipes[this.state.value-1].key, 'completed'], false)));

    return (
      <div>
        <TransitionGroup transitionName="fade"
                         transitionEnterTimeout={250}
                         transitionLeaveTimeout={250}>
          {this.state.content}
        </TransitionGroup>

        <div className="padTop">
          <span className="padRight10 glyphicon glyphicon-triangle-left" />
          {_.range(Recipes.length).map((i) =>
             <span key={i} className={cx('dot', {active: this.state.value === i})} />)}
          <span className="padLeft10 glyphicon glyphicon-triangle-right" />
        </div>
        <br/>
        <p>Select a meal with the arrow keys.</p>
        <Inst onComplete={this.props.onSelect} disabled={locked}>play</Inst>
      </div>
    );
  },
});

module.exports = RecipeSelect;

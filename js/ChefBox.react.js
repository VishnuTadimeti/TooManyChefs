var React = require('react');
var TimerMixin = require('react-timer-mixin');
var TransitionGroup = require('timeout-transition-group');

var cx = require('classnames');

var RecipeStep = require('./RecipeStep.react.js');

var ChefBox = React.createClass({
  mixins: [TimerMixin],

  propTypes: {
    chefId: React.PropTypes.number.isRequired,
    recipe: React.PropTypes.object.isRequired,
    widthClass: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      widthClass: 6,
    };
  },

  getInitialState: function() {
    return {
      step: -1,
      timer: 10,
      decrement: true,
      onTimeout: this.nextStep,
      progress: 0,
      strikes: 3,
      content: null,
      backgroundClass: '',
    };
  },

  componentDidMount: function() {
    this.timerInterval = this.setInterval(this.updateTimer, 1000);
    this.setState({
      content: this.renderRecipeStart(),
    });
  },

  updateTimer: function() {
    if (this.state.timer > 0) {
      var newTime = this.state.timer + (this.state.decrement ? -1 : 1);
      this.setState({timer: newTime});

      if (newTime === 0) {
        this.onTimeout();
      }
    }
  },

  onTimeout: function() {
    this.clearInterval(this.timerInterval);
    if (this.state.onTimeout) {
      this.state.onTimeout(this.state.progress);
    } else {
      this.failure();
    }
  },

  nextStep: function() {
    var newStep = this.state.step + 1;
    this.clearInterval(this.timerInterval);

    // Completed recipe
    if (newStep === this.props.recipe.steps.length) {
      this.setState({
        content: null,
        timer: 0,
      });

      // Wait 250ms before updating for fade effect
      this.setTimeout(() => this.setState({
        backgroundClass: 'success',
        content: this.renderRecipeDone(),
        step: newStep,
      }), 250);

    } else {
      var {timer, increment, onStart, onTimeout, ...stepProps} = this.props.recipe.steps[newStep];
      if (!stepProps.onComplete) {
        stepProps.onComplete = this.nextStep;
      } else {
        stepProps.onComplete = stepProps.onComplete.bind(
          this, this.state.progress, this.state.timer);
      }

      // Clear content of recipe step first
      this.setState({
        content: null,
        timer: timer,
        decrement: !increment,
        onTimeout: onTimeout ? onTimeout.bind(this) : null,
      });

      // Wait 250ms before updating for fade effect
      this.setTimeout(() => {
        this.timerInterval = this.setInterval(this.updateTimer, 1000);
        this.setState({
          content: <RecipeStep onProgress={this.onProgress} {...stepProps} />,
          step: newStep,
        });

        if (onStart) {
          onStart.apply(this);
        }
      }, 250);
    }
  },

  failure: function(text) {
    var strikesLeft = this.state.strikes - 1;
    this.setState({
      content: null,
      strikes: strikesLeft,
    });

    // Wait 250ms before updating for fade effect
    this.setTimeout(() => {
      if (strikesLeft === 0) {
        // TODO: propagate failure to other chefs
        this.setState({
          content: this.renderFailure(text),
          backgroundClass: 'failure',
        });
      } else {
        this.nextStep();
      }
    }, 250);

  },

  onProgress: function(progress) {
    this.setState({progress: progress});
  },

  renderTime: function() {
    if (this.state.timer === 0) {
      return null;
    }

    function padZero(num) {
      return (num < 10 ? '0' : '') + num.toString();
    }
    var min = Math.floor(this.state.timer / 60);
    var sec = this.state.timer % 60;
    return (
      <span className="padLeft">
        <span className="glyphicon glyphicon-hourglass" />
        [{padZero(min)}:{padZero(sec)}]
      </span>
    );
  },

  renderRecipeStart: function() {
    return (
      <div>
        <b>{this.props.recipe.name}</b> - {this.props.recipe.type} ({this.props.recipe.difficulty})
        <h5>Ingredients</h5>
        <ul className="ingredients">
          {this.props.recipe.ingredients.map((ing, i) =>
            <li key={i}>{ing}</li>)}
        </ul>
        <p>{this.props.recipe.description}</p>
      </div>
    );
  },

  renderFailure: function(text) {
    text = text || <p>Out of time!</p>;
    return (
      <div>
        <h4>GAME OVER - RECIPE FAILED</h4>
        <p>Steps completed: {this.state.step}/{this.props.recipe.steps.length}</p>
        {text}
      </div>
    );
  },

  renderRecipeDone: function() {
    return (
      <div>Great work! You've completed the recipe for {this.props.recipe.name}.</div>
      // TODO: include total time taken
    );
  },

  renderStrikes: function() {
    var heartFull = <span className="glyphicon glyphicon-heart" />;
    var heartEmpty = <span className="glyphicon glyphicon-heart-empty" />;

    return (
      <span className="padLeft fireRed">
        {this.state.strikes >= 1 ? heartFull : heartEmpty}
        {this.state.strikes >= 2 ? heartFull : heartEmpty}
        {this.state.strikes >= 3 ? heartFull : heartEmpty}
      </span>
    );
  },

  render: function() {
    var classes = cx('col-xs-12', 'col-sm-6',
      {[`col-md-${this.props.widthClass}`]: true}
    );

    return (
      <div className={classes}>
        <div className={cx('chefBox', this.state.backgroundClass)}>
          <h4>Chef {this.props.chefId + 1} {this.renderStrikes()} {this.renderTime()}</h4>
          <div className="padTop">
            <TransitionGroup enterTimeout={250}
                             leaveTimeout={250}
                             transitionName="fade">
              {this.state.content}
            </TransitionGroup>
          </div>
        </div>
      </div>
    );
  },
});

module.exports = ChefBox;

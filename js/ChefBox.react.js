var Progress = require('rc-progress').Line;
var React = require('react');
var TimerMixin = require('react-timer-mixin');
var TransitionGroup = require('react-addons-css-transition-group');

var _ = require('lodash');
var chroma = require('chroma-js');
var cx = require('classnames');

var Audio = require('./Audio.js');
var CapsLock = require('./CapsLock.react.js');
var Chef = require('./Chef.js');
var Inst = require('./Instruction.react.js');
var RecipeStep = require('./RecipeStep.react.js');

const RESCUE_TEXT = ['save', 'rescue', 'help', 'assist', 'support', 'inspire', 'bail', 'hug', 'heal', 'comfort', 'tickle', 'calm', 'feed'];

var ChefBox = React.createClass({
  mixins: [TimerMixin],

  propTypes: {
    chefId: React.PropTypes.number.isRequired,
    chefName: React.PropTypes.string.isRequired,
    numChefs: React.PropTypes.number.isRequired,
    recipe: React.PropTypes.object.isRequired,
    onFailure: React.PropTypes.func.isRequired,
    onReady: React.PropTypes.func.isRequired,
    onRescued: React.PropTypes.func.isRequired,
    onComplete: React.PropTypes.func.isRequired,
    onReport: React.PropTypes.func.isRequired,
    stillAlive: React.PropTypes.number.isRequired,
    startTime: React.PropTypes.number.isRequired,
    singlePlayer: React.PropTypes.bool.isRequired,
  },

  getInitialState: function() {
    return {
      step: -1,
      startTime: 10,
      timer: 0,
      onTimeout: _.partial(this.nextStep, true),
      progress: 0,
      backgroundClass: '',
      content: null,
      popups: [],
      lives: this.props.recipe.lives || 3,
      failCount: 0, // how many times failed
      rescue: 0, // how many times been rescued
      gameOver: false, // true if lost or won
      justFailed: false,
    };
  },

  shouldComponentUpdate: function(nextProps, nextState) {
    return (
      nextState.backgroundClass !== this.state.backgroundClass ||
      nextState.content !== this.state.content ||
      nextState.timer !== this.state.timer ||
      nextState.lives !== this.state.lives ||
      nextState.popups !== this.state.popups
    );
  },

  componentDidMount: function() {
    this.setState({content: this.renderChefSelect()});
  },

  updateTimer: function() {
    if (this.state.timer > 0) {
      var newTime = this.state.timer - 1;
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

  gameOver: function(text) {
    if (this.state.gameOver) {
      this.setState({popups: []});
      return;
    }

    this.clearTimeout(this.timeout);
    this.clearInterval(this.timerInterval);

    this.setState({
      content: null,
      popups: [],
      backgroundClass: 'failure',
      timer: 0,
      gameOver: true,
    });

    // Wait 250ms before updating for fade effect
    this.setTimeout(() => {
      this.setState({content: this.renderFailure(text)});
    }, 250);
  },

  nextStep: function(postFail, completeAudio) {
    if (postFail) {
      this.setState({justFailed: false});
    }
    if (this.state.gameOver || (!postFail && this.state.justFailed)) {
      return;
    }

    var newStep = this.state.step + 1;
    this.clearInterval(this.timerInterval);
    if (!postFail) {
      this.setState({backgroundClass: 'success'});
      // Play SE
      if (completeAudio) {
        Audio.playSE(completeAudio);
      } else {
        Audio.playGoodVoice();
      }
    }

    // Completed recipe
    if (newStep >= this.props.recipe.steps.length) {
      this.clearTimeout(this.timeout);
      this.setState({
        content: null,
        backgroundClass: '',
        timer: 0,
        gameOver: true,
      });

      // Wait 250ms before updating for fade effect
      var record = this.getRecord();
      this.setTimeout(() => this.setState({
        backgroundClass: 'success',
        content: (
          <div key="complete">
            {this.renderRecipeDone(record)}
            {this.props.onComplete(this.props.chefId, record)}
          </div>
        ),
        step: newStep,
      }), 250);

    } else {
      var {timer, onStart, onTimeout, ...stepProps} = this.props.recipe.steps[newStep];
      if (!stepProps.onComplete) {
        stepProps.onComplete = this.nextStep;
      } else {
        stepProps.onComplete = stepProps.onComplete.bind(
          this, this.state.progress, this.state.timer);
      }
      if (!stepProps.onProgress) {
        stepProps.onProgress = this.onProgress;
      } else {
        // Compose functions
        stepProps.onProgress = _.flow(stepProps.onProgress, this.onProgress);
      }

      // Clear content of recipe step first
      this.setState({
        content: null,
        startTime: timer,
        timer: timer,
        onTimeout: onTimeout ? onTimeout.bind(this) : null,
      });

      // Wait 250ms before updating for fade effect
      this.timeout = this.setTimeout(() => {
        this.timerInterval = this.setInterval(this.updateTimer, 1000);
        this.setState({
          backgroundClass: '',
          content: <RecipeStep key={'step' + newStep} {...stepProps} />,
          step: newStep,
        });

        if (onStart) {
          onStart.apply(this);
        }
      }, 250);
    }
  },

  failure: function(text) {
    if (this.state.lives === 0) {
      return;
    }
    Audio.playBadVoice();

    var livesLeft = this.state.lives - 1;
    this.setState({
      content: null,
      backgroundClass: 'failure',
      lives: livesLeft,
      justFailed: true,
    });

    // Wait 250ms before updating for fade effect
    if (livesLeft === 0 && this.props.stillAlive <= 1) {
      this.onRescueTimeout();
    } else {
      this.timeout = this.setTimeout(() => {
        if (livesLeft === 0) {
          this.timerInterval = this.setInterval(this.updateTimer, 1000);
          // Compute rescue time based on fail count
          var failCount = this.state.failCount + 1;
          var rescueTime = Math.max(10 - (failCount === 1 ? 0 : failCount), 3);
          this.setState({
            popups: [],
            startTime: rescueTime,
            timer: rescueTime,
            onTimeout: this.onRescueTimeout,
            content: this.renderRescue(),
            rescue: 0,
            failCount: failCount,
          });
          this.props.onFailure(true);
        } else {
          this.nextStep(true);
        }
      }, 250);
    }
  },

  onRescueTimeout: function() {
    this.clearInterval(this.timerInterval);
    this.setState({
      gameOver: true,
      content: null,
      popups: [],
      justFailed: false,
    });
    this.props.onFailure(false);

    this.timeout = this.setTimeout(() => {
      this.setState({content: this.renderFailure()});
    }, 250);
  },

  onProgress: function(progress) {
    this.setState({progress: progress});
  },

  showRescuePopup: function(chefName, onRescue) {
    var popups = this.state.popups;
    popups.push(this.renderRescuePopup(chefName, onRescue));
    this.setState({popups: popups});
    this.forceUpdate();
  },

  hidePopup: function(key) {
    var popups = this.state.popups;
    _.remove(popups, (p) => p.key === key);
    this.setState({popups: popups});
    this.forceUpdate();
  },

  rescue: function(loser) {
    if (this.state.gameOver) {
      return;
    }

    var rescueCount = this.state.rescue + 1;

    // No longer need rescuing
    if (rescueCount >= this.props.stillAlive) {
      this.setState({
        lives: 1,
        step: this.state.step - 1,
      });
      this.nextStep(true);
      this.props.onRescued(loser);
    } else {
      this.setState({rescue: rescueCount});
    }
  },

  startGame: function() {
    this.timerInterval = this.setInterval(this.updateTimer, 1000);
    this.setState({
      content: null,
      timer: 10,
      failCount: 0,
    });
    this.setTimeout(() => this.setState({content: this.renderRecipeStart()}), 250);
  },

  onChefSelect: function() {
    this.setState({content: null});
    if (!this.props.onReady()) {
      this.setTimeout(() => this.setState({content: this.renderChefWaiting()}), 250);
    }
  },

  renderRescuePopup: function(name, onRescue) {
    var callback = () => {
      this.hidePopup(name);
      onRescue();
    };

    return {
      key: name,
      type: 'danger',
      content: (
        <span>
          {name} is failing! Type <Inst onComplete={callback}>{_.sample(RESCUE_TEXT)}</Inst> to aid them.
        </span>
      ),
    };
  },

  renderTime: function() {
    if (this.state.timer === 0) {
      return null;
    }

    var min = (this.state.timer / 60) << 0; // floor
    var sec = this.state.timer % 60;
    return (
      <span className="padLeft">
        <span className="glyphicon glyphicon-hourglass" />
        [{_.padStart(min, 2, '0')}:{_.padStart(sec, 2, '0')}]
      </span>
    );
  },

  renderTimer: function() {
    var progress = this.state.timer === this.state.startTime ? 1 :
                   this.state.timer === 0 ? 1 :
                   (this.state.timer - 1.4) / (this.state.startTime - 1);

    // Scale color from red to blue based on time
    var scale = chroma.scale(['#ff0500', '#ffd320', '#659cf3']);
    var color = scale(progress).hex();

    return (
      <Progress className="timer" percent={progress * 100} strokeWidth="2" strokeColor={color} />
    );
  },

  renderChefSelect: function() {
    const keys = ['q', 'p', 'z', 'm'];
    var text = this.props.singlePlayer ? 'don this hat' : 'join the kitchen';
    return (
      <div key="select">
        <p>{Chef[this.props.recipe.chefName]}</p>
        <p>Press <Inst onComplete={this.onChefSelect}>{keys[this.props.chefId]}</Inst> to {text}.</p>
      </div>
    );
  },

  renderChefWaiting: function() {
    var text = this.props.singlePlayer ? 'stations' : 'chefs';
    return <p key="chef-waiting">Waiting for other {text}...</p>;
  },

  renderRecipeStart: function() {
    return (
      <div key="recipe-start">
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
    text = text || <div>
      <p>Out of time!</p>
      <p>Type <Inst onComplete={this.props.onReport}>report</Inst> to view your results.</p>
    </div>;
    return (
      <div key="failure">
        <h4>GAME OVER - RECIPE FAILED</h4>
        <p>Steps completed: {this.state.step}/{this.props.recipe.steps.length}</p>
        {text}
      </div>
    );
  },

  renderRescue: function() {
    return (
      <div key="rescue">
        <h4>RECIPE FAILED</h4>
        <p>Ask the other chefs to save you.</p>
      </div>
    );
  },

  getRecord: function() {
    if (this.props.recipe.record === 'count') {
      return this.state.progress;
    } else {
      return ((new Date().getTime() - this.props.startTime) / 1000) << 0;
    }
  },

  renderRecipeDone: function(record) {
    var recordName;
    if (this.props.recipe.record === 'count') {
      recordName = 'Count';
    } else {
      var min = (record / 60) << 0;
      var sec = (record % 60) << 0;

      recordName = 'Time Taken';
      record = _.padStart(min, 2, '0') + ':' + _.padStart(sec, 2, '0');
    }

    return (
      <div>
        <p>Great work! You've completed the recipe for {this.props.recipe.name}.</p>
        <b>{recordName}</b>: {record}
        <br/>
      </div>
    );
  },

  renderLives: function() {
    var heartFull = (i) => <span key={i} className="fireRed glyphicon glyphicon-heart" />;
    var heartEmpty = (i) => <span key={i} className="lightRed glyphicon glyphicon-heart-empty" />;
    var numLives = this.props.recipe.lives || 3;

    return (
      <span className="padLeft">
        {_.range(numLives).map(i => this.state.lives > i ? heartFull(i) : heartEmpty(i))}
      </span>
    );
  },

  render: function() {
    var style = {height: window.innerHeight / 2 - 20};
    var sizeClass = cx('col-xs-12', 'col-sm-6', {
      'col-sm-offset-3': this.props.numChefs % 2 !== 0 && this.props.chefId === this.props.numChefs - 1,
      'vmiddle': this.props.numChefs <= 2,
    });

    return (
      <div className={sizeClass}>
        <div className={cx('chefBox', this.state.backgroundClass)} style={style}>
          <h4 className="chefDesc">{this.props.chefName} {this.renderLives()} {this.renderTime()}</h4>
          <b className="recipeName pull-right">{this.props.recipe.name}</b>
          {this.renderTimer()}
          <div className="padTop">
            <TransitionGroup transitionName="fade"
                             transitionEnterTimeout={250}
                             transitionLeaveTimeout={250}>
              {this.state.content}
              <CapsLock key="capslock" />
              {this.state.popups.map((popup) =>
                <div key={popup.key} className={cx('popup', 'alert', 'alert-' + popup.type)}>
                  {popup.content}
                </div>)}
            </TransitionGroup>
          </div>
        </div>
      </div>
    );
  },
});

module.exports = ChefBox;

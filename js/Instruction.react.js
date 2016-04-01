var React = require('react');
var TimerMixin = require('react-timer-mixin');

var Instruction = React.createClass({
  mixins: [TimerMixin],

  propTypes: {
    children: React.PropTypes.string.isRequired,
    onComplete: React.PropTypes.func.isRequired,
    onProgress: React.PropTypes.func,
    clear: React.PropTypes.bool,
  },

  getInitialState: function() {
    return {
      complete: false,
      progress: 0,
    };
  },

  componentDidMount: function() {
    window.addEventListener('keypress', this.onKeyPress);
  },

  componentWillUnmount: function() {
    window.removeEventListener('keypress', this.onKeyPress);
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.props.onProgress && this.state.progress != prevState.progress) {
      this.props.onProgress(this.state.progress);
    }
  },

  onKeyPress: function(e) {
    if (this.state.complete) {
      return;
    }

    var keyCode = e.which || e.keyCode || 0;
    if (keyCode === this.props.children.charCodeAt(this.state.progress)) {
      var newProgress = this.state.progress + 1;
      while (newProgress < this.props.children.length && this.props.children.charAt(newProgress) === ' ') {
        newProgress++; // skip spaces
      }
      var complete = newProgress === this.props.children.length;
      this.setState({
        progress: newProgress,
        complete: complete,
      });

      if (complete && this.props.onComplete) {
        this.props.onComplete();
        if (this.props.clear) {
          this.setTimeout(() => {
            this.setState({progress: 0, complete: false});
          }, 500);
        }
      }
    }
  },

  render: function() {
    var prefix = this.props.children.substring(0, this.state.progress);
    var suffix = this.props.children.substring(this.state.progress);
    return (
      <code>
        <span className="input">{prefix}</span>
        <u>{suffix.substring(0, 1)}</u>
        <span>{suffix.substring(1)}</span>
      </code>
    );
  },
});

module.exports = Instruction;

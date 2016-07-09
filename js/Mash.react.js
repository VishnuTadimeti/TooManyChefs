var React = require('react');

var Audio = require('./Audio.js');
var KeyboardMixin = require('./KeyboardMixin.react.js');

var Mash = React.createClass({
  mixins: [KeyboardMixin],

  propTypes: {
    children: React.PropTypes.string,
    mashCount: React.PropTypes.number,
    onComplete: React.PropTypes.func.isRequired,
    onProgress: React.PropTypes.func.isRequired,
    onPressSound: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.arrayOf(React.PropTypes.string),
    ]),
  },

  getDefaultProps: function() {
    return {
      mashCount: 20,
    };
  },

  getInitialState: function() {
    return {
      value: this.props.mashCount,
    };
  },

  componentDidUpdate: function(prevProps, prevState) {
    if (this.state.value != prevState.value) {
      this.props.onProgress(this.state.value);
    }
  },

  onKeyUp: function(e) {
    if (this.state.value === 0 && this.props.mashCount > 0) {
      return;
    }

    var keyCode = e.which || e.keyCode || 0;
    if (String.fromCharCode(keyCode).toLowerCase() === this.props.children || (this.props.children === 'CAPSLOCK' && keyCode === 20)) {
      if (this.props.onPressSound) {
        Audio.playSE(this.props.onPressSound);
      } else {
        Audio.playRandomClick();
      }

      var newValue = this.state.value + (this.props.mashCount > 0 ? -1 : 1);
      this.setState({value: newValue});

      if (this.props.onComplete && newValue === 0) {
        this.props.onComplete();
      }
    }
  },

  render: function() {
    return (
      <div className="center">
        <br/>
        <code>
          <span className="input">{this.props.children}</span> × {this.state.value}
        </code>
      </div>
    );
  },
});

module.exports = Mash;

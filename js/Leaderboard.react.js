var React = require('react');
var _ = require('lodash');

var Firebase = require('./FirebaseConfig.js');

var Leaderboard = React.createClass({
  propTypes: {
    meal: React.PropTypes.object.isRequired,
    singlePlayer: React.PropTypes.bool.isRequired,
    numTop: React.PropTypes.number.isRequired,
  },

  statics: {
    renderTime: function(time) {
      if (!_.isNumber(time)) {
        return time;
      }
      var min = (time / 60) << 0; // floor
      var sec = time % 60;
      return _.padStart(min, 2, '0') + ':' + _.padStart(sec, 2, '0');
    },
  },

  getInitialState: function() {
    return {
      leaderboard: null,
    };
  },

  componentDidMount: function() {
    this.refreshLeaderboard(this.props);
  },

  componentWillUpdate: function(nextProps, nextState) {
    if (this.props.meal !== nextProps.meal) {
      this.refreshLeaderboard(nextProps);
    }
  },

  componentWillUnmount: function() {
    if (this._query) {
      this._query.off();
    }
  },

  refreshLeaderboard: function(props) {
    if (props.meal.tutorial) {
      this.setState({leaderboard: null});
      return;
    }

    var mode = props.singlePlayer ? 'solo/' : 'party/';
    var ref = Firebase.database().ref('leaderboard/' + mode + props.meal.key);
    var isCount = props.meal.record === 'count';
    this._query = isCount ? ref.limitToLast(this.props.numTop) : ref.limitToFirst(this.props.numTop);
    // Find top scores and sort accordingly
    if (this._query) {
      this._query.once('value', (snapshot) => {
        var val = snapshot.val();
        var leaderboard = _.sortBy(_.isArray(val) ? val : _.toArray(val),
          isCount ? e => -e.bestTime : 'bestTime');
        this.setState({leaderboard: leaderboard});
      });
    }
  },

  render: function() {
    if (!this.state || this.props.meal.tutorial || !this.state.leaderboard) {
      return null; // don't render if no leaderboard
    }

    // Array of {name: "", bestTime: number}
    var leaderboard = this.state.leaderboard;
    var numStats = leaderboard.length;
    if (numStats < this.props.numTop) {
      // Fill extra spaces with placeholders
      leaderboard = _.concat(leaderboard, new Array(this.props.numTop - numStats));
      _.fill(leaderboard, {name: '---', bestTime: '---'}, numStats);
    }
    var isCount = this.props.meal.record === 'count';
    var recordText = isCount ? 'Score' : 'Time';

    return (
      <div className="mealInfo">
        <h4>Leaderboard</h4>
        <table className="table leaderboard table-condensed">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>{recordText}</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((stat, i) =>
              <tr key={'stat' + i}>
                <th>{i + 1}</th>
                <td>{stat.name}</td>
                <td>{isCount ? stat.bestTime : Leaderboard.renderTime(stat.bestTime)}</td>
              </tr>
             )}
          </tbody>
        </table>
        <br/>
      </div>
    );
  },

});

module.exports = Leaderboard;

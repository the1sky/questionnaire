var url = location.href;
var questionnaireId = url.substring(url.lastIndexOf('/') + 1);

var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var data = require('./data');
var Page = require('./components/page');
var ReactRouter = require('react-router');
var Router = ReactRouter.Router;
var Route = ReactRouter.Route;
var createBrowserHistory = require('history/lib/createBrowserHistory');
var history = createBrowserHistory();

var Container = React.createClass({
  render() {
    return (
      <div style={{height: '100%'}}>
        {this.props.children}
      </div>
    )
  }
});

var App = React.createClass({
  getInitialState: function () {
    var self = this;
    $.ajax({
      url: '/user/questionnaire/' + questionnaireId,
      success: function (data) {
        if (data.success) {
          if (data.done) {
            var history = self.props.history;
            history.replaceState(null, '/result/' + questionnaireId);
          } else {
            self.setState({
              title: data.title,
              questions: data.questions
            });
          }
          //self.setState({
          //  title: data.title,
          //  questions: data.questions
          //});
        }
      }
    });
    return {
      title: '',
      questions: []
    };
  },
  handleSubmit: function (answer) {
    var history = this.props.history;
    $.ajax({
      type: 'post',
      url: '/questionnaire/' + questionnaireId,
      data: {
        answer: JSON.stringify(answer)
      },
      success: function (data) {
        if (data.success) {
          history.replaceState(null, '/result/' + questionnaireId);
        }
      }
    });
  },
  render: function () {
    return <Page title={this.state.title}
                 questions={this.state.questions}
                 onSubmit={this.handleSubmit}/>;
  }
});

var Result = React.createClass({
  getInitialState: function () {
    var self = this;
    $.ajax({
      url: '/user/getScore/' + questionnaireId,
      success: function (data) {
        if (data.success) {
          self.setState({
            image: data.image,
            score: data.score,
          });
        } else {
          var history = self.props.history;
          history.replaceState(null, '/questionnaire/' + questionnaireId);
        }
      }
    });
    return {
      title: '',
      questions: [],
      showShareHint: false,
    };
  },
  clickShareHandler: function () {
    this.setState({
      showShareHint: true,
    });
  },
  clickShareHintHandler: function () {
    this.setState({
      showShareHint: false,
    });
  },
  render: function () {
    var imageUrl = this.state.image;
    var score = this.state.score;
    var styles = {
      backgroundPosition: 'center',
      height: '100%',
      position: 'relative',
    };
    var scoreStyles = {
      position: 'absolute',
      color: '#FFF',
      display: 'inline-block',
      top: '12%',
      fontSize: '60px',
      textShadow: '5px 2px 6px rgba(0,0,0,0.6)',
      fontStyle: 'italic',
      fontWeight: 'bold',
      width: '100%',
      textAlign: 'center',
      zIndex: 100,
    };
    var hiddenImageStyles = {
      height: '100%',
      width: 'auto',
      left: '50%',
      position: 'absolute',
      '-webkit-transform': 'translateX(-50%)',
      '-ms-transform': 'translateX(-50%)',
      '-moz-transform': 'translateX(-50%)',
      zIndex: 90,
    };
    var clickShareStyles = {
      height: '35px',
      position: 'absolute',
      bottom: 10,
      left: 0,
      zIndex: 91,
    };
    var shareHintStyles = {
      position: 'absolute',
      zIndex: 1000,
      width: '100%',
      height: '100%',
      top: 0,
      left: 0,
      backgroundColor: 'rgba(0,0,0,.4)',
      zIndex: 101,
    };
    var shareHintImageStyles = {
      width: '70%',
      position: 'absolute',
      top: 15,
      right: 15,

    };
    return (
      <div style={{height: '100%', position: 'relative'}}>
        <div style={scoreStyles}>{score}分</div>
        {
          this.state.image ?
            <div style={styles}>
              <img src={imageUrl} alt="" style={hiddenImageStyles}/>
              <img src='/images/clickShare.png' alt="" style={clickShareStyles} onTouchEnd={this.clickShareHandler}/>
              {
                this.state.showShareHint ?
                  <div style={shareHintStyles} onTouchEnd={this.clickShareHintHandler}>
                    <img src={'/images/share-hint.png'} alt="" style={shareHintImageStyles}/>
                  </div> : null
              }
            </div> : null
        }
      </div>
    )
  }
});


ReactDOM.render((
    <Router history={history}>
      <Route path="/" component={Container}>
        <Route path="questionnaire/:questionnaireId" component={App}/>
        <Route path="result/:questionnaireId" component={Result}/>
      </Route>
    </Router>
  ),
  document.getElementById('example')
);
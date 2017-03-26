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
          });
        } else {
          var history = self.props.history;
          history.replaceState(null, '/questionnaire/' + questionnaireId);
        }
      }
    });
    return {
      title: '',
      questions: []
    };
  },
  render: function () {
    var imageUrl = this.state.image;
    var styles = {
      backgroundImage: 'url(' + imageUrl + ')',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      height: '100%',
    };
    return (
      <div style={{height: '100%'}}>
        {
          this.state.image ?
            <div style={styles}/> : null
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
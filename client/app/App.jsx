import { Component, PropTypes } from 'react';
import './less/App.less';
import './less/Main.less';

export default class App extends Component {

  render(){
    return (
      <div className="app">
        <div className="navbar-header">
          <span className="title"> Trump Loops </span>
        </div>
        <div className="trump-head">
          <img src="/images/trump-head.png"></img>
        </div>
        { this.props.children }
      </div>
    )
  }
}

App.contextTypes = {
  router: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

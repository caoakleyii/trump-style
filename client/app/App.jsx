import { Component, PropTypes } from 'react';
import './less/App.less';

export default class App extends Component {

  render(){
    return (
      <div className="app">
        { this.props.children }
      </div>
    )
  }
}

App.contextTypes = {
  router: PropTypes.object.isRequired,
  store: PropTypes.object.isRequired
}

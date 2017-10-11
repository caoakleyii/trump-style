import { Route, IndexRoute } from 'react-router';
import App from './app/App.jsx';
import Dashboard from './dashboard/Dashboard.jsx';

export default (
  <Route>
    <Route path="/" component={App}>
      <IndexRoute component={Dashboard} />
      <Route path="dashboard" component={Dashboard} />
    </Route>
  </Route>
)

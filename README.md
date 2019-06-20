![npm](https://img.shields.io/npm/v/apollo-link-average-query-time.svg)
![npm bundle size](https://img.shields.io/bundlephobia/min/apollo-link-average-query-time.svg)

# Apollo Link Average Query Time

## Installation

```
yarn add apollo-link-average-query-time
```

## Usage

```
import { ApolloLink } from 'apollo-link';
import { InMemoryCache } from 'apollo-cache-inmemory';
import AverageQueryTimeLink from 'apollo-link-average-query-time';

const averageQueryTimeLink = new AverageQueryTimeLink({
  debug: true, // defaults to false, logs information about operations and query times
  queryCount: 5, // defaults to 10, average time is calculated from the last X queries
});

const link = ApolloLink.from([
  ...yourOtherLinks,
  averageQueryTimeLink,
]);

const cache = new InMemoryCache();

export default new ApolloClient({
  link,
  cache,
});

```

This will add a `averageQueryTime` property to your Apollo cache, a milliseconds value based on the average of the last `queryCount` queries.

A basic query will give you reactive updates to the `averageQueryTime` property:

```
const AverageQueryTimeQuery = gql`
  query AverageQueryTime {
    averageQueryTime
  }
`;
```
## Sample React Component

If the `averageQueryTime` exceeds the `slowThreshold` prop, the component will show the dismiss button.

If the user clicks the button, then the button will be hidden until the `dismissTime` is exceeded again.

```
import React, { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';

class SlowConnectionIndicator extends PureComponent {
  static propTypes = {
    averageQueryTime: PropTypes.number,
    dismissTime: PropTypes.number,
    slowThreshold: PropTypes.number,
  };

  static defaultProps = {
    averageQueryTime: 0, // Passed in via the query, a default of 0 will prevent the initial display
    dismissTime: 500, // How long to dismiss the component on click in milliseconds
    slowThreshold: 3000, // The default threshold in milliseconds
  };

  state = {
    lastClick: undefined,
  };

  get thresholdExceeded() {
    return this.props.averageQueryTime > this.props.slowThreshold;
  }

  get lastClickExceeded() {
    if (!this.state.lastClick) return true;
    return Date.now() - this.state.lastClick > (this.props.dismissTime);
  }

  handleDismissClick = () => {
    this.setState({ lastClick: Date.now() });
  }

  render() {
    if (this.thresholdExceeded && this.lastClickExceeded) {
      return (
        <button onClick={this.handleDismissClick}>
          {'Slow Connection Detected! Click to Dismiss'}
        </button>
      );
    }
    return null;
  }
}

const AverageQueryTimeQuery = gql`
  query AverageQueryTime {
    averageQueryTime
  }
`;

export default graphql(AverageQueryTimeQuery, {
  name: 'averageQueryTimeQueryData',
  options: () => ({
    fetchPolicy: 'cache-only',
    variables: {},
  }),
  props: ({averageQueryTimeQueryData }) => ({
    averageQueryTime: averageQueryTimeQueryData.averageQueryTime || 0,
  }),
})(SlowConnectionIndicator);
```

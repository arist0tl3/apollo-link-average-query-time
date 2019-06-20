import { ApolloLink } from 'apollo-link';

const getNestedObject = (nestedObj, pathArr) => pathArr.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);

class AverageQueryTimeLink extends ApolloLink {
  constructor() {
    super();
    this.times = [];
  }

  request(operation, forward) {
    const { cache } = operation.getContext();
    const inTime = Date.now();
    return forward(operation).map((res) => {
      const operationType = getNestedObject(operation, ['query', 'definitions', 0, 'operation']);
      // Note: Subscription "out times" are the length that the sub has
      // been running, so we don't want to include those
      if (operationType !== 'subscription') {
        const x = Date.now() - inTime;
        this.times.push(x);
        this.times = this.times.slice(-100);
        cache.writeData({
          data: {
            averageQueryTime: this.times.reduce((a, b) => a + b, 0) / this.times.length,
          },
        });
      }
      return res;
    });
  }
}

export default new AverageQueryTimeLink();

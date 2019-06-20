import { ApolloLink } from 'apollo-link';

const getNestedObject = (nestedObj, pathArr) => pathArr.reduce((obj, key) => (obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);

class AverageQueryTimeLink extends ApolloLink {
  constructor({ debug = false, queryCount = 10 }) {
    super();
    this.times = [];
    this.debug = debug;
    this.queryCount = queryCount;
  }

  request(operation, forward) {
    const { cache } = operation.getContext();
    const inTime = Date.now();
    return forward(operation).map((res) => {
      const operationType = getNestedObject(operation, ['query', 'definitions', 0, 'operation']);
      // Note: Subscription "out times" are the length that the sub has
      // been running, so we don't want to include those
      if (operationType !== 'subscription') {
        const duration = Date.now() - inTime;
        this.times.push(duration);
        this.times = this.times.slice(this.queryCount * -1);
        const averageQueryTime = this.times.reduce((a, b) => a + b, 0) / this.times.length;
        if (this.debug) {
          console.log('-----------------');
          console.log('OPERATION:', operation);
          console.log('RES:', res);
          console.log('RESTIME:', duration);
          console.log('AVG', averageQueryTime);
        }
        cache.writeData({
          data: {
            averageQueryTime,
          },
        });
      }
      return res;
    });
  }
}

export default AverageQueryTimeLink;

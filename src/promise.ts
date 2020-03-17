import * as _ from 'lodash';

function processQueue(state: any): void {
  _.forEach(state.pending, (handlers: Array<any>) => {
    const deferred = handlers[0];
    const fn = handlers[state.status];
    try {
      if (_.isFunction(fn)) {
        deferred.resolve(fn(state.value));
      } else if (state.status === 1) {
        deferred.resolve(state.value);
      } else {
        deferred.reject(state.value);
      }
    } catch (e) {
      deferred.reject(e);
    }
  });
  state.pending = [];
}

function scheduleProcessQueue(state: any): void {
  setTimeout(() => {
    processQueue(state);
  }, 0);
}

function makePromise(value: any, resolved: boolean): Promise {
  const d = new Deferred();
  if (resolved) {
    d.resolve(value);
  } else {
    d.reject(value);
  }
  return d.promise;
}

function handleFinallyCallback(
  callback: any,
  value: any,
  resolved: boolean,
): Promise {
  const callbackValue = callback();
  if (callbackValue && callbackValue.then) {
    return callbackValue.then(function() {
      return makePromise(value, resolved);
    });
  } else {
    return makePromise(value, resolved);
  }
}

export class Promise {
  $$state: any;

  constructor() {
    this.$$state = {
      value: undefined,
      status: 0,
      pending: [],
    };
  }

  then(
    onFulfilled: any = null,
    onRejected: any = null,
    onProgress: any = null,
  ): any {
    const result = new Deferred();
    this.$$state.pending.push([result, onFulfilled, onRejected, onProgress]);
    if (this.$$state.status > 0) {
      scheduleProcessQueue(this.$$state);
    }
    return result.promise;
  }

  catch(onRejected: any = null): any {
    return this.then(null, onRejected);
  }

  finally(callback: any = null, progressBack: any = null): any {
    return this.then(
      (value: any) => handleFinallyCallback(callback, value, true),
      (value: any) => handleFinallyCallback(callback, value, false),
      progressBack,
    );
  }
}

export class Deferred {
  promise: Promise;

  constructor() {
    this.promise = new Promise();
  }

  resolve(value: any = null): void {
    if (this.promise.$$state.status) {
      return;
    }

    if (value && _.isFunction(value.then)) {
      value.then(
        _.bind(this.resolve, this),
        _.bind(this.reject, this),
        _.bind(this.notify, this),
      );
    } else {
      this.promise.$$state.value = value;
      this.promise.$$state.status = 1;
      scheduleProcessQueue(this.promise.$$state);
    }
  }

  reject(value: any): void {
    if (this.promise.$$state.status) {
      return;
    }
    this.promise.$$state.value = value;
    this.promise.$$state.status = 2;
    scheduleProcessQueue(this.promise.$$state);
  }

  notify(value: any): void {
    const pending = this.promise.$$state.pending;
    if (pending && pending.length && !this.promise.$$state.status) {
      setTimeout(() => {
        _.forEach(pending, function(handlers) {
          const deferred = handlers[0];
          const progressBack = handlers[3];
          try {
            deferred.notify(
              _.isFunction(progressBack) ? progressBack(value) : value,
            );
          } catch (e) {
            // console.error(e);
          }
        });
      }, 0);
    }
  }
}

const $Q = function Q(resolver: any): Promise {
  if (!_.isFunction(resolver)) {
    throw 'Expected function, got ' + resolver;
  }
  const d = new Deferred();
  resolver(_.bind(d.resolve, d), _.bind(d.reject, d));
  return d.promise;
};

export default _.extend($Q, {
  defer(): Deferred {
    return new Deferred();
  },
  reject(value: any): Promise {
    const d = this.defer();
    d.reject(value);
    return d.promise;
  },
  when(
    value: any,
    callback: any = null,
    errback: any = null,
    progressback: any = null,
  ): Promise {
    const d = this.defer();
    d.resolve(value);
    return d.promise.then(callback, errback, progressback);
  },
  resolve(
    value: any,
    callback: any = null,
    errback: any = null,
    progressback: any = null,
  ): Promise {
    return this.when(value, callback, errback, progressback);
  },
  all(promises: any[] | { [key: string]: Promise }): Promise {
    const results: any = _.isArray(promises) ? [] : {};
    let counter = 0;
    const d = this.defer();
    _.forEach(promises, (promise: any, index: any) => {
      counter++;
      this.when(promise).then(
        (value: any) => {
          results[index] = value;
          counter--;
          if (!counter) {
            d.resolve(results);
          }
        },
        (value: any) => {
          d.reject(value);
        },
      );
    });
    if (!counter) {
      d.resolve(results);
    }
    return d.promise;
  },
});

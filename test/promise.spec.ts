import * as _ from 'lodash';
import expect from 'expect.js';
import sinon from 'sinon';
import $q from '../src/promise';

describe('$q', () => {
  it('can create a deferred', () => {
    const d = $q.defer();
    expect(d).to.be.ok();
  });
  it('has a promise for each Deferred', () => {
    const d = $q.defer();
    expect(d.promise).to.be.ok();
  });
  it('can resolve a promise', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    d.promise.then(fulfillSpy);
    d.resolve('ok');
    setTimeout(() => {
      expect(fulfillSpy.called).to.be(true);
      expect(fulfillSpy.calledWith('ok')).to.be(true);
      done();
    }, 10);
  });
  it('works when resolved before promise listener', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    d.resolve('ok');
    d.promise.then(fulfillSpy);
    setTimeout(() => {
      expect(fulfillSpy.calledWith('ok')).to.be(true);
      done();
    }, 10);
  });
  it('does not resolve promise immediately', () => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    d.promise.then(fulfillSpy);
    d.resolve('ok');
    expect(fulfillSpy.notCalled).to.be(true);
  });
  it('may only be resolved once', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    d.promise.then(fulfillSpy);
    d.resolve(1);
    d.resolve(2);
    setTimeout(() => {
      expect(fulfillSpy.calledOnce).to.be(true);
      expect(fulfillSpy.calledWith(1)).to.be(true);
      done();
    }, 10);
  });
  it('resolves a listener added after resolution', done => {
    const d = $q.defer();
    d.resolve(1);
    setTimeout(() => {
      const fulfillSpy = sinon.spy();
      d.promise.then(fulfillSpy);
      setTimeout(() => {
        expect(fulfillSpy.calledWith(1)).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('may have multiple callbacks', () => {
    const d = $q.defer();
    const firstSpy = sinon.spy();
    const secondSpy = sinon.spy();
    d.promise.then(firstSpy);
    d.promise.then(secondSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(firstSpy.calledWith(1)).to.be(true);
      expect(secondSpy.calledWith(1)).to.be(true);
    }, 10);
  });
  it('invokes callbacks once', done => {
    const d = $q.defer();
    const firstSpy = sinon.spy();
    const secondSpy = sinon.spy();
    d.promise.then(firstSpy);
    d.resolve(42);
    setTimeout(() => {
      expect(firstSpy.calledOnce).to.be(true);
      expect(secondSpy.calledOnce).to.be(false);
      d.promise.then(secondSpy);
      setTimeout(() => {
        expect(firstSpy.calledOnce).to.be(true);
        expect(secondSpy.calledOnce).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('can reject a deferred', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    const rejectSpy = sinon.spy();
    d.promise.then(fulfillSpy, rejectSpy);
    d.reject('fail');
    setTimeout(() => {
      expect(fulfillSpy.called).to.be(false);
      expect(rejectSpy.called).to.be(true);
      done();
    }, 10);
  });
  it('can reject just once', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    d.promise.then(null, fulfillSpy);
    d.reject('fail');
    setTimeout(() => {
      expect(fulfillSpy.calledOnce).to.be(true);
      d.reject('fail again');
      setTimeout(() => {
        expect(fulfillSpy.calledOnce).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('cannot fulfill a promise once rejected', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    const rejectSpy = sinon.spy();
    d.promise.then(fulfillSpy, rejectSpy);
    d.reject('fail');
    setTimeout(() => {
      d.resolve('success');
      setTimeout(() => {
        expect(fulfillSpy.notCalled).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('does not require a failure handler each time', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    const rejectSpy = sinon.spy();
    d.promise.then(fulfillSpy);
    d.promise.then(null, rejectSpy);
    d.reject('fail');
    setTimeout(() => {
      expect(rejectSpy.calledWith('fail')).to.be(true);
      done();
    }, 10);
  });
  it('does not require a success handler each time', done => {
    const d = $q.defer();
    const fulfillSpy = sinon.spy();
    const rejectSpy = sinon.spy();
    d.promise.then(fulfillSpy);
    d.promise.then(null, rejectSpy);
    d.resolve('ok');
    setTimeout(() => {
      expect(fulfillSpy.calledWith('ok')).to.be(true);
      done();
    }, 10);
  });
  it('can register rejection handler with catch', done => {
    const d = $q.defer();
    const rejectSpy = sinon.spy();
    d.promise.catch(rejectSpy);
    d.reject('fail');
    setTimeout(() => {
      expect(rejectSpy.called).to.be(true);
      done();
    }, 10);
  });
  it('invokes a finally handler when fulfilled', done => {
    const d = $q.defer();
    const finallySpy = sinon.spy();
    d.promise.finally(finallySpy);
    d.resolve('ok');
    setTimeout(() => {
      expect(finallySpy.calledWith()).to.be(true);
      done();
    }, 10);
  });
  it('invokes a finally handler when rejected', done => {
    const d = $q.defer();
    const finallySpy = sinon.spy();
    d.promise.finally(finallySpy);
    d.reject('fail');
    setTimeout(() => {
      expect(finallySpy.calledWith()).to.be(true);
      done();
    }, 10);
  });
  it('allows chaining handlers', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise
      .then((result: any) => {
        return result + 1;
      })
      .then((result: any) => {
        return result * 2;
      })
      .then(fulfilledSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(4)).to.be(true);
      done();
    }, 10); // 需要大于0避免重叠导致失败
  });
  it('does not modify original resolution in chains', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise
      .then((result: any) => {
        return result + 1;
      })
      .then((result: any) => {
        return result * 2;
      });
    d.promise.then(fulfilledSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(1)).to.be(true);
      done();
    }, 10);
  });
  it('catches rejection on chained handler', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    d.promise.then(_.noop).catch(rejectedSpy);
    d.reject('fail');
    setTimeout(() => {
      expect(rejectedSpy.called).to.be(true);
      done();
    }, 10);
  });
  it('fulfills on chained handler', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise.catch(_.noop).then(fulfilledSpy);
    d.resolve('ok');
    setTimeout(() => {
      expect(fulfilledSpy.called).to.be(true);
      done();
    }, 10);
  });
  it('rejects chained promise when handler throws', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    d.promise
      .then(() => {
        throw 'fail';
      })
      .catch(rejectedSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(rejectedSpy.calledWith('fail')).to.be(true);
      done();
    }, 10);
  });
  it('does not reject current promise when handler throws', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    d.promise.then(() => {
      throw 'fail';
    });
    d.promise.catch(rejectedSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(rejectedSpy.calledWith('fail')).to.be(false);
      done();
    }, 10);
  });
  it('waits on promise returned from handler', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise
      .then((v: any) => {
        const d2 = $q.defer();
        d2.resolve(v + 1);
        return d2.promise;
      })
      .then((v: any) => {
        return v * 2;
      })
      .then(fulfilledSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(4)).to.be(true);
      done();
    }, 10);
  });
  it('waits on promise given to resolve', done => {
    const d = $q.defer();
    const d2 = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise.then(fulfilledSpy);
    d2.resolve(1);
    d.resolve(d2.promise);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(1)).to.be(true);
      done();
    }, 10);
  });
  it('rejects when promise returned from handler rejects', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    d.promise
      .then(function() {
        const d2 = $q.defer();
        d2.reject('fail');
        return d2.promise;
      })
      .catch(rejectedSpy);
    d.resolve('ok');
    setTimeout(() => {
      expect(rejectedSpy.calledWith('fail')).to.be(true);
      done();
    }, 10);
  });
  it('allows chaining handlers on finally, with original value', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    d.promise
      .then((result: any) => {
        return result + 1;
      })
      .finally((result: any) => {
        return result * 2;
      })
      .then(fulfilledSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(2)).to.be(true);
      done();
    }, 10);
  });
  it('allows chaining handlers on finally, with original rejection', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    d.promise
      .then(() => {
        throw 'fail';
      })
      .finally(() => {})
      .catch(rejectedSpy);
    d.resolve(20);
    setTimeout(() => {
      expect(rejectedSpy.calledWith('fail')).to.be(true);
      done();
    }, 10);
  });
  it('resolves to original value when nested promise resolves', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    let resolveNested: any;
    d.promise
      .then((result: any) => {
        return result + 1;
      })
      .finally(() => {
        const d2 = $q.defer();
        resolveNested = (): void => {
          d2.resolve('ok');
        };
        return d2.promise;
      })
      .then(fulfilledSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith(2)).to.be(false);
      resolveNested();
      setTimeout(() => {
        expect(fulfilledSpy.calledWith(2)).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('rejects to original value when nested promise resolves', done => {
    const d = $q.defer();
    const rejectedSpy = sinon.spy();
    let resolveNested: any;
    d.promise
      .then(() => {
        throw 'fail';
      })
      .finally(() => {
        const d2 = $q.defer();
        resolveNested = (): void => {
          d2.resolve('ok');
        };
        return d2.promise;
      })
      .catch(rejectedSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(rejectedSpy.calledWith('fail')).to.be(false);
      resolveNested();
      setTimeout(() => {
        expect(rejectedSpy.calledWith('fail')).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('rejects when nested promise rejects in finally', done => {
    const d = $q.defer();
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    let resolveNested: any;
    d.promise
      .then((result: any) => {
        return result + 1;
      })
      .finally(() => {
        const d2 = $q.defer();
        resolveNested = (): void => {
          d2.reject('fail');
        };
        return d2.promise;
      })
      .then(fulfilledSpy, rejectedSpy);
    d.resolve(1);
    setTimeout(() => {
      expect(fulfilledSpy.called).to.be(false);
      expect(rejectedSpy.calledWith('fail')).to.be(false);
      resolveNested();
      setTimeout(() => {
        expect(fulfilledSpy.called).to.be(false);
        expect(rejectedSpy.calledWith('fail')).to.be(true);
        done();
      }, 10);
    }, 10);
  });
  it('can report progress', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.then(null, null, progressSpy);
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.calledWith('working...')).to.be(true);
      done();
    }, 10);
  });
  it('can report progress many times', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.then(null, null, progressSpy);
    d.notify('40%');
    setTimeout(() => {
      expect(progressSpy.callCount).to.be(1);
      d.notify('80%');
      d.notify('100%');
      setTimeout(() => {
        expect(progressSpy.callCount).to.be(3);
        done();
      }, 10);
    }, 10);
  });
  it('does not notify progress after being resolved', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.then(null, null, progressSpy);
    d.resolve('ok');
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.called).to.be(false);
      done();
    }, 10);
  });
  it('does not notify progress after being rejected', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.then(null, null, progressSpy);
    d.reject('fail');
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.called).to.be(false);
      done();
    }, 10);
  });
  it('can notify progress through chain', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise
      .then(_.noop)
      .catch(_.noop)
      .then(null, null, progressSpy);
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.calledWith('working...')).to.be(true);
      done();
    }, 10);
  });
  it('transforms progress through handlers', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise
      .then(_.noop)
      .then(null, null, (progress: any) => {
        return '***' + progress + '***';
      })
      .catch(_.noop)
      .then(null, null, progressSpy);
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.calledWith('***working...***')).to.be(true);
      done();
    }, 10);
  });
  it('recovers from progress callback exceptions', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    const fulfilledSpy = sinon.spy();
    d.promise.then(null, null, function() {
      throw 'fail';
    });
    d.promise.then(fulfilledSpy, null, progressSpy);
    d.notify('working...');
    d.resolve('ok');
    setTimeout(() => {
      expect(progressSpy.calledWith('working...')).to.be(true);
      expect(fulfilledSpy.calledWith('ok')).to.be(true);
      done();
    }, 10);
  });
  it('can notify progress through promise returned from handler', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.then(null, null, progressSpy);
    const d2 = $q.defer();
    d.resolve(d2.promise);
    d2.notify('working...');
    setTimeout(() => {
      expect(progressSpy.calledWith('working...')).to.be(true);
      done();
    }, 10);
  });
  it('allows attaching progressback in finally', done => {
    const d = $q.defer();
    const progressSpy = sinon.spy();
    d.promise.finally(null, progressSpy);
    d.notify('working...');
    setTimeout(() => {
      expect(progressSpy.calledWith('working...')).to.be(true);
      done();
    }, 10);
  });
  it('can make an immediately rejected promise', done => {
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    const promise = $q.reject('fail');
    promise.then(fulfilledSpy, rejectedSpy);
    setTimeout(() => {
      expect(fulfilledSpy.called).to.be(false);
      expect(rejectedSpy.calledWith('fail')).to.be(true);
      done();
    }, 10);
  });
  it('can make an immediately resolved promise', done => {
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    const promise = $q.when('ok');
    promise.then(fulfilledSpy, rejectedSpy);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith('ok')).to.be(true);
      expect(rejectedSpy.called).to.be(false);
      done();
    }, 10);
  });
  it('can wrap a foreign promise', done => {
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    const promise = $q.when({
      then: function(resolve: any) {
        setTimeout(() => {
          resolve('ok');
        }, 0);
      },
    });
    promise.then(fulfilledSpy, rejectedSpy);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith('ok')).to.be(true);
      expect(rejectedSpy.called).to.be(false);
      done();
    }, 10);
  });
  it('takes callbacks directly when wrapping', done => {
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    const progressSpy = sinon.spy();
    const wrapped = $q.defer();
    $q.when(wrapped.promise, fulfilledSpy, rejectedSpy, progressSpy);
    wrapped.notify('working...');
    wrapped.resolve('ok');
    setTimeout(() => {
      expect(fulfilledSpy.calledWith('ok')).to.be(true);
      expect(rejectedSpy.called).to.be(false);
      expect(progressSpy.calledWith('working...')).to.be(true);
      done();
    }, 10);
  });
  it('makes an immediately resolved promise with resolve', done => {
    const fulfilledSpy = sinon.spy();
    const rejectedSpy = sinon.spy();
    const promise = $q.resolve('ok');
    promise.then(fulfilledSpy, rejectedSpy);
    setTimeout(() => {
      expect(fulfilledSpy.calledWith('ok')).to.be(true);
      expect(rejectedSpy.called).to.be(false);
      done();
    }, 10);
  });
  describe('all', () => {
    it('can resolve an array of promises to array of results', done => {
      const promise = $q.all([$q.when(1), $q.when(2), $q.when(3)]);
      const fulfilledSpy = sinon.spy();
      promise.then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith([1, 2, 3])).to.be(true);
        done();
      }, 10);
    });
    it('can resolve an object of promises to an object of results', done => {
      const promise = $q.all({ a: $q.when(1), b: $q.when(2) });
      const fulfilledSpy = sinon.spy();
      promise.then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith({ a: 1, b: 2 })).to.be(true);
        done();
      }, 10);
    });
    it('resolves an empty array of promises immediately', done => {
      const promise = $q.all([]);
      const fulfilledSpy = sinon.spy();
      promise.then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith([])).to.be(true);
        done();
      }, 10);
    });
    it('resolves an empty object of promises immediately', done => {
      const promise = $q.all({});
      const fulfilledSpy = sinon.spy();
      promise.then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith({})).to.be(true);
        done();
      }, 10);
    });
    it('rejects when any of the promises rejects', done => {
      const promise = $q.all([$q.when(1), $q.when(2), $q.reject('fail')]);
      const fulfilledSpy = sinon.spy();
      const rejectedSpy = sinon.spy();
      promise.then(fulfilledSpy, rejectedSpy);
      setTimeout(() => {
        expect(fulfilledSpy.called).to.be(false);
        expect(rejectedSpy.calledWith('fail')).to.be(true);
        done();
      }, 10);
    });
    it('wraps non-promises in the input collection', done => {
      const promise = $q.all([$q.when(1), 2, 3]);
      const fulfilledSpy = sinon.spy();
      promise.then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith([1, 2, 3])).to.be(true);
        done();
      }, 10);
    });
  });
  describe('ES6 style', () => {
    it('is a function', () => {
      expect($q instanceof Function).to.be(true);
    });
    it('returns a promise', () => {
      expect($q(_.noop)).to.be.ok();
      expect($q(_.noop).then).to.be.ok();
    });
    it('calls function with a resolve function', done => {
      const fulfilledSpy = sinon.spy();
      $q((resolve: any) => {
        resolve('ok');
      }).then(fulfilledSpy);
      setTimeout(() => {
        expect(fulfilledSpy.calledWith('ok')).to.be(true);
        done();
      }, 10);
    });
    it('calls function with a reject function', done => {
      const fulfilledSpy = sinon.spy();
      const rejectedSpy = sinon.spy();
      $q((resolve: any, reject: any) => {
        reject('fail');
      }).then(fulfilledSpy, rejectedSpy);
      setTimeout(() => {
        expect(fulfilledSpy.called).to.be(false);
        expect(rejectedSpy.calledWith('fail')).to.be(true);
        done();
      }, 10);
    });
  });
});

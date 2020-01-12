//自定义promise函数模块 iife

(function (window) {
  // 定义常量
  const PENDING = 'pending'
  const RESOLVE = 'resolve'
  const REJECTED = 'rejected'
  //excutor 执行器函数（同步执行）
  function Promise (excutor) {
    const _this = this;
    _this.status = PENDING //给promise指定status属性，有初始值
    _this.data = undefined  //用于存储结果数据的属性
    _this.callbacks = [] //每个元素的结构： {onResolved() {} , onRejected() {}}

    function resolve (value) {
      //状态只会改变一次
      if (_this.status !== PENDING) {
        return
      }
      //改状态放数据
      _this.status = RESOLVE
      _this.data = value
      //若果有待执行callback函数，立即异步执行回调函数onResolved
      if (_this.callbacks.length > 0) {
        //放入队列中执行所有回调
        setTimeout(() => {
          _this.callbacks.forEach(cb => {
            cb.onResolved(value)
          })
        });
      }
    }

    function reject (reason) {
      if (_this.status !== PENDING) {
        return
      }

      _this.status = REJECTED
      _this.data = reason
      //若果有待执行callback函数，立即异步执行回调函数onResolved
      if (_this.callbacks.length > 0) {
        //放入队列中执行所有回调
        setTimeout(() => {
          _this.callbacks.forEach(cb => {
            cb.onRejected(reason)
          })
        });
      }
    }

    //立即同步执行excutor
    //如果执行器抛出异常，promise对象变为rejected状态
    try {
      excutor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  /*
  then() 指定成功回调函数 
  返回一个新的promise对象
  */
  Promise.prototype.then = function (onResolved, onRejected) {
    const _this = this
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    //实现错误、异常穿透
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }

    return new Promise((resolve, reject) => {

      /*
      调用指定回调函数处理，根据执行结果，改变return的promsie的状态
      */
      function handle (callback) {
        /*
        1.如果抛出异常，return的promise就会失败，reason就是error
        2.如果回调函数返回的不是promise，上面return的promise就会成功，value就是返回的值
        3.如果回调函数返回的是promise，上面return的promise结果就是这个promise的结果
         */
        try {
          const result = callback(_this.data)
          if (result instanceof Promise) {
            // result.then(
            //   value => resolve(value), //当result成功时，让return的promise也成功
            //   reason => reject(reason)
            // )
            // 简洁版
            result.then(resolve, reject)
          } else {
            resolve(result)
          }
        } catch (error) {
          reject(error)
        }

      }

      if (_this.status === PENDING) {
        _this.callbacks.push({
          //此处不直接调用then中的onResolved，是因为还要改变return的promise的状态
          onResolved () {
            handle(onResolved)
          },
          onRejected () {
            handle(onRejected)

          }
        })
      } else if (_this.status === RESOLVE) {
        setTimeout(() => {
          handle(onResolved)

        });
      } else {
        setTimeout(() => {
          handle(onRejected)

        });
      }

    })
  }

  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
  }
  //向外暴露promise函数
  window.Promise = Promise
})(window)
var aolog = require('aolog')
var async = require('async')

module.exports = function (ipfs, BUCKET_SIZE) {
  var ao = aolog(ipfs, BUCKET_SIZE)

  var IPIterator = function (iter) {
    return {
      iter: iter,
      updates: {},
      next: function (cb) {
        var self = this
        self.iter.next(function (err, res) {
          if (err) return cb(err)
          var el = res.element
          if (!el) return cb(null, res)
          if (el._updates) {
            var idx = parseInt(el._updates.substr(1), 10)
            if (!self.updates[idx]) {
              self.updates[idx] = res
            }
            self.next(cb)
          } else {
            if (self.updates[res.index]) {
              cb(null, self.updates[res.index])
            } else {
              cb(null, res)
            }
          }
        })
      },
      take: function (nr, cb) {
        var self = this
        var accum = []
        async.forever(function (next) {
          self.next(function (err, res) {
            if (err) return cb(err)
            if (res.eof) return cb(null, accum)
            if (!nr--) return cb(null, accum)
            accum.push(res)
            next()
          })
        })
      },
      all: function (cb) {
        this.take(Infinity, cb)
      }
    }
  }

  var IPLog = function (root) {
    return {
      log: root,
      // update just appends a new version to the end of the log
      update: function (idx, element, cb) {
        if (element._updates) {
          throw new Error('Updating updates not supported, update ' +
                          element._updates + ' instead')
        }
        element._updates = '#' + idx
        root.append(element, function (err, res) {
          if (err) return cb(err)
          cb(null, new IPLog(res))
        })
      },
      // gets all versions of element at idx
      versions: function (idx, cb) {
        var self = this
        self.get(idx, function (err, res) {
          if (err) return cb(err)
          // is this the original?
          if (res.element._updates) {
            // recurse on original
            self.versions(parseInt(res.element._updates.substr(1), 10), cb)
          } else {
            // original

            var iter = self.log.iterator({
              filter: { _updates: '#' + idx }
            })

            var result = [res]

            iter.all(function (err, res) {
              if (err) return cb(err)
              cb(null, result.concat(res))
            })
          }
        })
      },

      // wrappers
      get: function (idx, cb) {
        this.log.get(idx, cb)
      },
      append: function (element, cb) {
        this.log.append(element, function (err, res) {
          if (err) return cb(err)
          cb(null, new IPLog(res))
        })
      },
      iterator: function (opts) {
        return new IPIterator(this.log.iterator(opts))
      },
      concat: function (elements, cb) {
        this.log.concat(elements, function (err, res) {
          if (err) return cb(err)
          cb(null, new IPLog(res))
        })
      },
      persist: function (cb) {
        this.log.persist(cb)
      }
    }
  }

  return {
    empty: function () {
      return new IPLog(ao.empty())
    },
    restore: function (hash, cb) {
      ao.restore(hash, function (err, res) {
        if (err) return cb(err)
        cb(null, new IPLog(res))
      })
    }
  }
}


var BUCKET_SIZE = 2

var assert = require('assert')
var ipfs = require('ipfs-api')()
var iplog = require('../index.js')(ipfs, BUCKET_SIZE)

/* global describe, it, before */

describe('editing', function () {

  var log = iplog.empty()

  var entries = [
    { body: 'entry a' },
    { body: 'entry b' },
    { body: 'entry c' }
  ]

  before(function (done) {
    log.concat(entries, function (err, res) {
      if (err) throw err
      res.update(0, { body: 'entry a, updated' }, function (err, res) {
        if (err) throw err
        log = res
        done()
      })
    })
  })

  it('should have c as latest', function (done) {
    // first entry reverse should be c
    log.iterator({ reverse: true }).next(function (err, res) {
      if (err) throw err
      assert.equal(res.element, entries[2])
      done()
    })
  })

  it('should have only ' + entries.length + ' entries, with updated a last',
     function (done) {
       // all three
       log.iterator({ reverse: true }).all(function (err, res) {
         if (err) throw err
         assert.equal(res.length, 3)
         assert.equal(res[2].element.body, 'entry a, updated')
         done()
       })
     })
})

describe('updates', function () {

  var log = iplog.empty()

  var entries = [
    { body: 'entry a' },
    { body: 'entry b' },
    { body: 'entry c' }
  ]

  before(function (done) {
    log.concat(entries, function (err, res) {
      if (err) throw err
      res.update(0, { body: 'entry a, updated' }, function (err, res) {
        if (err) throw err
        res.update(0, { body: 'entry a, updated again' }, function (err, res) {
          if (err) throw err
          log = res
          done()
        })
      })
    })
  })

  describe('versions', function () {

    it('a should have three versions', function (done) {
      log.versions(0, function (err, res) {
        if (err) throw err
        assert.equal(res.length, 3)
        assert.equal(res[0].index, 0)
        assert.equal(res[1].index, 3)
        assert.equal(res[2].index, 4)
        done()
      })
    })

    it('a should have three versions, starting from update', function (done) {
      log.versions(3, function (err, res) {
        if (err) throw err
        assert.equal(res.length, 3)
        assert.equal(res[0].index, 0)
        assert.equal(res[1].index, 3)
        assert.equal(res[2].index, 4)
        done()
      })
    })

    before(function (done) {
      log.update(1, { body: 'entry b, updated' }, function (err, res) {
        if (err) throw err
        res.update(2, { body: 'entry c, updated' }, function (err, res) {
          if (err) throw err
          res.update(1, { body: 'entry b, updated again' }, function (err, res) {
            if (err) throw err
            log = res
            done()
          })
        })
      })
    })
  })

  describe('persistance', function () {

    it('b should have three versions', function (done) {
      // all three
      log.versions(1, function (err, res) {
        if (err) throw err
        assert.equal(res.length, 3)
        assert.equal(res[0].index, 1)
        assert.equal(res[1].index, 5)
        assert.equal(res[2].index, 7)
        done()
      })
    })

    it('should persist and restore', function (done) {
      log.iterator().all(function (err, res) {
        if (err) throw err
        var reference = res

        log.persist(function (err, res) {
          if (err) throw err

          iplog.restore(res.Hash, function (err, res) {
            if (err) throw err

            res.iterator().all(function (err, res) {
              if (err) throw err

              assert.deepEqual(res, reference)
              done()
            })

          })
        })
      })
    })
  })
})

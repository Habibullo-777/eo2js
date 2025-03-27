// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const {pack, runSync, assertFilesExist} = require('../helpers');
const compileStylesheets = require('../../src/compile-stylesheets');

/**
 * This variable is used to run only specified test packs.
 * Just insert the names of the test pack, e.g. 'abstracts-to-objects',
 * and they will be executed. It's helpful when you're introducing new test pack
 * and don't want to wait until all other packs are executed.
 * Don't forget to clear the array before push!
 * @type {string[]}
 */
const only = []
const home = path.resolve('temp/test-transpile')

describe('transpile', function() {
  before('compile stylesheets', function() {
    compileStylesheets()
    fs.rmSync(home, {recursive: true, force: true})
    fs.mkdirSync(home, {recursive: true})
  })
  describe('command', function() {
    const target = path.resolve(home, 'target')
    beforeEach(function() {
      fs.rmSync(target, {recursive: true, force: true})
      fs.mkdirSync(target)
    })
    /* eslint-disable valid-jsdoc */
    /**
     * Run transpile command with verbose output.
     * @param {{[name]: String, [prepare]: Boolean}} opts - Options
     * @return {String} - Output
     */
    const transpile = function(opts= {}) {
      opts.name = opts.name || 'simple'
      opts.prepare = opts.prepare !== undefined ? opts.prepare : true
      if (opts.prepare) {
        const verified = path.resolve(target, `6-verify/com/eo2js/${opts.name}.xmir`)
        const foreign = [{
          id: `com.eo2js.${opts.name}`,
          verified: verified
        }]
        fs.writeFileSync(path.resolve(target, 'eo-foreign.json'), JSON.stringify(foreign))
        fs.mkdirSync(path.resolve(target, '6-verify/com/eo2js'), {recursive: true})
        fs.copyFileSync(path.resolve(`test/resources/transpile/${opts.name}.xmir`), verified)
      }
      return runSync([
        'transpile',
        '--verbose',
        '-t', target,
      ])
    }
    it('should fail if eo-foreign is not found', function() {
      assert.throws(() => runSync(['transpile', '-t', target], false))
    })
    it('should fail if eo-foreign file is not .json', function() {
      const foreign = 'eo-foreign.csv'
      fs.writeFileSync(path.resolve(target, foreign), 'some data')
      assert.throws(() => runSync(['transpile', '-t', target, '-f', foreign], false))
    })
    it('should create transpiled XMIRs', function() {
      const traspiled = '8-transpile/com/eo2js/simple.xmir'
      assertFilesExist(transpile(), target, [traspiled])
      assert.ok(fs.readFileSync(path.resolve(target, traspiled)).toString().includes('<javascript'))
    })
    it('should generate JS files', function() {
      assertFilesExist(transpile(), target, ['project/com/eo2js/simple.js'])
    });
    ['simple-test', 'alone-test'].forEach((name) => {
      it(`should generate test JS file for ${name}`, function() {
        assertFilesExist(transpile({name}), target, [`project/com/eo2js/${name}.test.js`])
      })
    })
    it('should skip transpilation if source was not modified', function() {
      transpile()
      const transpiled = path.resolve(target, '8-transpile/com/eo2js/simple.xmir')
      const first = fs.statSync(transpiled).mtime
      transpile({prepare: false})
      const second = fs.statSync(transpiled).mtime
      assert.equal(first.getTime(), second.getTime())
    })
    it('should retranspile if source was modified', async function() {
      transpile()
      const transpiled = path.resolve(target, '8-transpile/com/eo2js/simple.xmir')
      const source = path.resolve(target, '6-verify/com/eo2js/simple.xmir')
      const first = fs.statSync(transpiled).mtime
      await new Promise((resolve) => setTimeout(resolve, 1000))
      fs.writeFileSync(source, fs.readFileSync(source))
      transpile({prepare: false})
      const second = fs.statSync(transpiled).mtime
      assert.notEqual(first.getTime(), second.getTime())
    })
  })
  describe('transformation packs', function() {
    this.timeout(0)
    const packs = path.resolve(__dirname, '../resources/transpile/packs')
    fs.readdirSync(packs)
      .filter((test) => only.length === 0 || only.includes(test.substring(0, test.lastIndexOf('.json'))))
      .forEach((test) => {
        it(test, function(done) {
          const folder = path.resolve(home, 'packs', test.substring(0, test.lastIndexOf('.json')))
          if (fs.existsSync(folder)) {
            fs.rmSync(folder, {recursive: true})
          }
          const json = JSON.parse(fs.readFileSync(path.resolve(packs, test)).toString())
          pack({home: folder, sources: 'src', target: 'target', json}).then((res) => {
            if (res.skip) {
              this.skip()
            } else {
              assert.equal(
                res.failures.length,
                0,
                `Result XMIR:\n ${res.xmir}\nJSON: ${JSON.stringify(res.json, null, 2)}\nFailed tests: ${res.failures.join(';\n')}`
              )
              done()
            }
          })
        })
      })
  })
})

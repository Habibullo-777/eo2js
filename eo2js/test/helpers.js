// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

const path = require('path')
const assert = require('assert')
const fs = require('fs')
const {execSync} = require('child_process')
const mvnw = require('./mvnw/mvnw.js');
const {XMLParser} = require('fast-xml-parser');
const saxon = require('saxon-js')
const jp = require('jspath')

/**
 * Execute JS file with node.
 *
 * @param {String} js - JS file to execute
 * @param {Array.<String>} args - Arguments
 * @param {boolean} print - Capture logs or not
 * @return {string} Stdout
 */
const execNode = function(js, args, print) {
  try {
    return execSync(
      `node ${js} ${args.join(' ')}`,
      {
        timeout: 1200000,
        windowsHide: true,
        stdio: print ? null : 'ignore'
      }
    ).toString()
  } catch (ex) {
    console.debug(ex.stdout.toString())
    throw ex
  }
}

/**
 * Helper to run eo2js command line tool.
 *
 * @param {Array.<string>} args - Array of args
 * @param {Boolean} print - Capture logs
 * @return {String} Stdout
 */
const runSync = function(args, print = true) {
  return execNode(path.resolve('./src/eo2js.js'), args, print)
};

/**
 * Assert that all files exist.
 *
 * @param {String} stdout - The stdout printed
 * @param {String} home - The location of files to match
 * @param {Array} paths - Array of file paths
 */
const assertFilesExist = function(stdout, home, paths) {
  paths.forEach((p) => {
    const abs = path.resolve(home, p)
    assert(
      fs.existsSync(abs),
      stdout + '\nFile ' + abs + ' is absent'
    )
  })
}

/**
 * Parser.
 * @type {XMLParser}
 */
const parser = new XMLParser({ignoreAttributes: false})

/**
 * Transformations test pack.
 * @param {{home: String, sources: String, target: String, json: Object}} params - Pack params
 * @return {Promise<{skip: boolean, failures: array.<String>, xmir: String, json: Object}>}
 */
const pack = async function(params) {
  const res = {
    skip: false,
    failures: [],
    xmir: '',
    json: ''
  }
  if (params.json['skip'] || !params.json['xsls'] || params.json['xsls'].length === 0) {
    return new Promise((resolve) => {
      res.skip = true
      resolve(res)
    })
  } else {
    const sources = path.resolve(params.home, params.sources)
    const target = path.resolve(params.home, params.target)
    fs.mkdirSync(sources, {recursive: true})
    fs.mkdirSync(target, {recursive: true})
    fs.writeFileSync(path.resolve(sources, `test.eo`), `${params.json['eo'].join('\n')}\n`)
    return mvnw(['register', 'parse', 'optimize', 'shake'], params).then((r) => {
      const shaken = JSON.parse(
        fs.readFileSync(path.resolve(target, 'eo-foreign.json')).toString()
      )[0]['shaken']
      let xml = fs.readFileSync(shaken).toString()
      const transformations = path.resolve(__dirname, '../src/resources/json')
      params.json['xsls']
        .map((name) => path.resolve(transformations, `${name}.sef.json`))
        .forEach((transformation) => {
          xml = saxon.transform({
            stylesheetFileName: transformation,
            sourceText: xml,
            destination: 'serialized'
          }).principalResult
        })
      res.xmir = xml
      const saved = path.resolve(target, '3-transpiled')
      fs.mkdirSync(saved, {recursive: true})
      fs.writeFileSync(path.resolve(saved, 'test.xmir'), res.xmir)
      xml = parser.parse(xml, {})
      res.json = xml
      params.json['tests'].forEach((test) => {
        if (typeof test === 'object') {
          const node = test.node
          const method = test.method
          const args = test.args
          const applied = jp.apply(node, xml)
          if (applied.length === 0) {
            res.failures.push(node)
          } else {
            args.forEach((arg) => {
              if (Array.isArray(arg)) {
                arg = arg.join('\n')
              }
              if (!applied[0][method](arg)) {
                res.failures.push(`NODE: ${node}, METHOD: ${method}, ARG: ${arg}`)
              }
            })
          }
        } else {
          if (jp.apply(test, xml).length === 0) {
            res.failures.push(test)
          }
        }
      })
      return res
    })
  }
}

/**
 * Default comment in front of abstract EO object.
 * @type {string}
 */
const comment = '# This is the default 64+ symbols comment in front of named abstract object.'

module.exports = {
  assertFilesExist,
  runSync,
  pack,
  comment
}

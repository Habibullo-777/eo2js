// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

const object = require('../../../runtime/object')
const {LAMBDA, RHO} = require('../../../runtime/attribute/specials');
const at_void = require('../../../runtime/attribute/at-void');
const data = require('../../../runtime/data');
const bytesOf = require('../../../runtime/bytes-of');
const dataized = require('../../../runtime/dataized');

/**
 * Bytes.or.
 * @return {Object} - Bytes.or object
 */
const bytes$or = function() {
  const obj = object('bytes$or')
  obj.attrs['b'] = at_void('b')
  obj.assets[LAMBDA] = function(self) {
    return data.toObject(
      bytesOf.bytes(dataized(self.take(RHO)))
        .or(dataized(self.take('b')))
        .asBytes()
    )
  }
  return obj
}

module.exports = bytes$or

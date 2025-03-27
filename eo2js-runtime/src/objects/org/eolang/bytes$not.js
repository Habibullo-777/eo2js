// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

const object = require('../../../runtime/object')
const {LAMBDA, RHO} = require('../../../runtime/attribute/specials');
const data = require('../../../runtime/data');
const bytesOf = require('../../../runtime/bytes-of');
const dataized = require('../../../runtime/dataized');

/**
 * Bytes.not.
 * @return {Object} - Bytes.not object
 */
const bytes$not = function() {
  const obj = object('bytes$not')
  obj.assets[LAMBDA] = function(self) {
    return data.toObject(
      bytesOf.bytes(dataized(self.take(RHO))).not().asBytes()
    )
  }
  return obj
}

module.exports = bytes$not

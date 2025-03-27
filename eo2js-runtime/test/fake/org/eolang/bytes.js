// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

/**
 * Fake bytes EO object that is used for the test purposes.
 * Don't change the file until you definitely know what you're doing.
 * For more information please read README.md in test/fake folder
 * @param {Object} sigma - Sigma
 * @return {Object} - Object
 */
const bytes = function() {
  const object = require('../../../runtime/object')

  return object('bytes')
}

module.exports = bytes

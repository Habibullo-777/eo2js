// SPDX-FileCopyrightText: Copyright (c) 2024 Objectionary.com
// SPDX-License-Identifier: MIT

/**
 * Trap for the functions of the object.
 * @param {any} object - Object
 * @param {function(property: String, target: any, thisArg: any, args: any[]): any} apply - Function that overrides the default one
 * @return {Object} - Trapped object
 */
const trapped = function(object, apply) {
  return new Proxy(
    object,
    {
      get: function(target, property, _) {
        let got = target[property]
        if (typeof got === 'function') {
          got = new Proxy(
            got,
            {
              apply: function(target, thisArg, args) {
                return apply(property, target, thisArg, args)
              }
            }
          )
        }
        return got
      }
    }
  )
}

module.exports = trapped

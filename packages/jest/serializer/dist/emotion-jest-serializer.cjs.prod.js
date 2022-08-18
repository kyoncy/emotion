'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

require('@babel/runtime/helpers/extends')
require('@babel/runtime/helpers/objectWithoutPropertiesLoose')
require('@babel/runtime/helpers/createForOfIteratorHelperLoose')
require('@emotion/css-prettifier')
var createSerializer = require('../../dist/create-serializer-c8a168f3.cjs.prod.js')

var _createSerializer = createSerializer.createSerializer(),
  test = _createSerializer.test,
  serialize = _createSerializer.serialize

exports.serialize = serialize
exports.test = test

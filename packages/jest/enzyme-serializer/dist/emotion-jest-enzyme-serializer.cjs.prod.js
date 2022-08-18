'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

require('@babel/runtime/helpers/extends')
require('@babel/runtime/helpers/objectWithoutPropertiesLoose')
require('@babel/runtime/helpers/createForOfIteratorHelperLoose')
require('@emotion/css-prettifier')
require('../../dist/create-serializer-c8a168f3.cjs.prod.js')
require('enzyme-to-json')
var createEnzymeSerializer = require('../../dist/create-enzyme-serializer-15a61c4f.cjs.prod.js')

var _createEnzymeSerializ = createEnzymeSerializer.createEnzymeSerializer(),
  test = _createEnzymeSerializ.test,
  serialize = _createEnzymeSerializ.serialize

exports.serialize = serialize
exports.test = test

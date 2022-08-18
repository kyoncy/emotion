import _extends from '@babel/runtime/helpers/esm/extends'
import {
  i as isEmotionCssPropElementType,
  e as isStyledElementType,
  u as unwrapFromPotentialFragment,
  c as createSerializer$1,
  t as tickle
} from './create-serializer-4d817764.esm.js'
import { createSerializer } from 'enzyme-to-json'

var enzymeToJsonSerializer = createSerializer({
  map: function map(json) {
    if (typeof json.node.type === 'string') {
      return json
    }

    var isRealStyled = json.node.type.__emotion_real === json.node.type

    if (isRealStyled) {
      return _extends({}, json, {
        children: json.children.slice(-1)
      })
    }

    return json
  }
}) // this is a hack, leveraging the internal/implementation knowledge about the enzyme's ShallowWrapper
// there is no sane way to get this information otherwise though

var getUnrenderedElement = function getUnrenderedElement(shallowWrapper) {
  var symbols = Object.getOwnPropertySymbols(shallowWrapper)
  var elementValues = symbols.filter(function (sym) {
    var val = shallowWrapper[sym]
    return !!val && val.$$typeof === Symbol['for']('react.element')
  })

  if (elementValues.length !== 1) {
    throw new Error(
      "Could not get unrendered element reliably from the Enzyme's ShallowWrapper. This is a bug in Emotion - please open an issue with repro steps included:\n" +
        'https://github.com/emotion-js/emotion/issues/new?assignees=&labels=bug%2C+needs+triage&template=--bug-report.md&title='
    )
  }

  return shallowWrapper[elementValues[0]]
}

var wrappedEnzymeSerializer = {
  test: enzymeToJsonSerializer.test,
  print: function print(enzymeWrapper, printer) {
    var isShallow = !!enzymeWrapper.dive

    if (isShallow && enzymeWrapper.root() === enzymeWrapper) {
      var unrendered = getUnrenderedElement(enzymeWrapper)

      if (
        isEmotionCssPropElementType(unrendered) ||
        isStyledElementType(unrendered)
      ) {
        return enzymeToJsonSerializer.print(
          unwrapFromPotentialFragment(enzymeWrapper),
          printer
        )
      }
    }

    return enzymeToJsonSerializer.print(enzymeWrapper, printer)
  }
}
function createEnzymeSerializer(_temp) {
  var _ref = _temp === void 0 ? {} : _temp,
    classNameReplacer = _ref.classNameReplacer,
    _ref$DOMElements = _ref.DOMElements,
    DOMElements = _ref$DOMElements === void 0 ? true : _ref$DOMElements,
    _ref$includeStyles = _ref.includeStyles,
    includeStyles = _ref$includeStyles === void 0 ? true : _ref$includeStyles

  var emotionSerializer = createSerializer$1({
    classNameReplacer: classNameReplacer,
    DOMElements: DOMElements,
    includeStyles: includeStyles
  })
  return {
    test: function test(node) {
      return wrappedEnzymeSerializer.test(node) || emotionSerializer.test(node)
    },
    serialize: function serialize(
      node,
      config,
      indentation,
      depth,
      refs,
      printer
    ) {
      if (wrappedEnzymeSerializer.test(node)) {
        var tickled = tickle(node)
        return wrappedEnzymeSerializer.print(
          tickled, // https://github.com/facebook/jest/blob/470ef2d29c576d6a10de344ec25d5a855f02d519/packages/pretty-format/src/index.ts#L281
          function (valChild) {
            return printer(valChild, config, indentation, depth, refs)
          }
        )
      } // we know here it had to match against emotionSerializer

      return emotionSerializer.serialize(
        node,
        config,
        indentation,
        depth,
        refs,
        printer
      )
    }
  }
}

export { createEnzymeSerializer as c }

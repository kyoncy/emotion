'use strict'

Object.defineProperty(exports, '__esModule', { value: true })

var sheet = require('@emotion/sheet')
var stylis = require('stylis')
var weakMemoize = require('@emotion/weak-memoize')
var memoize = require('@emotion/memoize')

function _interopDefault(e) {
  return e && e.__esModule ? e : { default: e }
}

var weakMemoize__default = /*#__PURE__*/ _interopDefault(weakMemoize)
var memoize__default = /*#__PURE__*/ _interopDefault(memoize)

var identifierWithPointTracking = function identifierWithPointTracking(
  begin,
  points,
  index
) {
  var previous = 0
  var character = 0

  while (true) {
    previous = character
    character = stylis.peek() // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1
    }

    if (stylis.token(character)) {
      break
    }

    stylis.next()
  }

  return stylis.slice(begin, stylis.position)
}

var toRules = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1
  var character = 44

  do {
    switch (stylis.token(character)) {
      case 0:
        // &\f
        if (character === 38 && stylis.peek() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1
        }

        parsed[index] += identifierWithPointTracking(
          stylis.position - 1,
          points,
          index
        )
        break

      case 2:
        parsed[index] += stylis.delimit(character)
        break

      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = stylis.peek() === 58 ? '&\f' : ''
          points[index] = parsed[index].length
          break
        }

      // fallthrough

      default:
        parsed[index] += stylis.from(character)
    }
  } while ((character = stylis.next()))

  return parsed
}

var getRules = function getRules(value, points) {
  return stylis.dealloc(toRules(stylis.alloc(value), points))
} // WeakSet would be more appropriate, but only WeakMap is supported in IE11

var fixedElements = /* #__PURE__ */ new WeakMap()
var compat = function compat(element) {
  if (
    element.type !== 'rule' ||
    !element.parent || // positive .length indicates that this rule contains pseudo
    // negative .length indicates that this rule has been already prefixed
    element.length < 1
  ) {
    return
  }

  var value = element.value,
    parent = element.parent
  var isImplicitRule =
    element.column === parent.column && element.line === parent.line

  while (parent.type !== 'rule') {
    parent = parent.parent
    if (!parent) return
  } // short-circuit for the simplest case

  if (
    element.props.length === 1 &&
    value.charCodeAt(0) !== 58 &&
    /* colon */
    !fixedElements.get(parent)
  ) {
    return
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"

  if (isImplicitRule) {
    return
  }

  fixedElements.set(element, true)
  var points = []
  var rules = getRules(value, points)
  var parentRules = parent.props

  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i]
        ? rules[i].replace(/&\f/g, parentRules[j])
        : parentRules[j] + ' ' + rules[i]
    }
  }
}
var removeLabel = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value

    if (
      // charcode for l
      value.charCodeAt(0) === 108 && // charcode for b
      value.charCodeAt(2) === 98
    ) {
      // this ignores label
      element['return'] = ''
      element.value = ''
    }
  }
}

var isBrowser = typeof document !== 'undefined'
var getServerStylisCache = isBrowser
  ? undefined
  : weakMemoize__default['default'](function () {
      return memoize__default['default'](function () {
        var cache = {}
        return function (name) {
          return cache[name]
        }
      })
    })
var defaultStylisPlugins = [stylis.prefixer]

var createCache = function createCache(options) {
  var key = options.key

  if (isBrowser && key === 'css') {
    var ssrStyles = document.querySelectorAll(
      'style[data-emotion]:not([data-s])'
    ) // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion')

      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return
      }
      document.head.appendChild(node)
      node.setAttribute('data-s', '')
    })
  }

  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins

  var inserted = {}
  var container
  var nodesToHydrate = []

  if (isBrowser) {
    container = options.container || document.head
    Array.prototype.forEach.call(
      // this means we will ignore elements which don't have a space in them which
      // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
      document.querySelectorAll('style[data-emotion^="' + key + ' "]'),
      function (node) {
        var attrib = node.getAttribute('data-emotion').split(' ') // $FlowFixMe

        for (var i = 1; i < attrib.length; i++) {
          inserted[attrib[i]] = true
        }

        nodesToHydrate.push(node)
      }
    )
  }

  var _insert

  var omnipresentPlugins = [compat, removeLabel]

  if (isBrowser) {
    var currentSheet
    var finalizingPlugins = [
      stylis.stringify,
      stylis.rulesheet(function (rule) {
        currentSheet.insert(rule)
      })
    ]
    var serializer = stylis.middleware(
      omnipresentPlugins.concat(stylisPlugins, finalizingPlugins)
    )

    var stylis$1 = function stylis$1(styles) {
      return stylis.serialize(stylis.compile(styles), serializer)
    }

    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet

      stylis$1(
        selector ? selector + '{' + serialized.styles + '}' : serialized.styles
      )

      if (shouldCache) {
        cache.inserted[serialized.name] = true
      }
    }
  } else {
    var _finalizingPlugins = [stylis.stringify]

    var _serializer = stylis.middleware(
      omnipresentPlugins.concat(stylisPlugins, _finalizingPlugins)
    )

    var _stylis = function _stylis(styles) {
      return stylis.serialize(stylis.compile(styles), _serializer)
    } // $FlowFixMe

    var serverStylisCache = getServerStylisCache(stylisPlugins)(key)

    var getRules = function getRules(selector, serialized) {
      var name = serialized.name

      if (serverStylisCache[name] === undefined) {
        serverStylisCache[name] = _stylis(
          selector
            ? selector + '{' + serialized.styles + '}'
            : serialized.styles
        )
      }

      return serverStylisCache[name]
    }

    _insert = function _insert(selector, serialized, sheet, shouldCache) {
      var name = serialized.name
      var rules = getRules(selector, serialized)

      if (cache.compat === undefined) {
        // in regular mode, we don't set the styles on the inserted cache
        // since we don't need to and that would be wasting memory
        // we return them so that they are rendered in a style tag
        if (shouldCache) {
          cache.inserted[name] = true
        }

        return rules
      } else {
        // in compat mode, we put the styles on the inserted cache so
        // that emotion-server can pull out the styles
        // except when we don't want to cache it which was in Global but now
        // is nowhere but we don't want to do a major right now
        // and just in case we're going to leave the case here
        // it's also not affecting client side bundle size
        // so it's really not a big deal
        if (shouldCache) {
          cache.inserted[name] = rules
        } else {
          return rules
        }
      }
    }
  }

  var cache = {
    key: key,
    sheet: new sheet.StyleSheet({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  }
  cache.sheet.hydrate(nodesToHydrate)
  return cache
}

exports.default = createCache

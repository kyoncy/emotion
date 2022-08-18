import '@babel/runtime/helpers/extends'
import '@babel/runtime/helpers/objectWithoutPropertiesLoose'
import '@babel/runtime/helpers/createForOfIteratorHelperLoose'
import '@emotion/css-prettifier'
import '../../dist/create-serializer-4d817764.esm.js'
import 'enzyme-to-json'
import { c as createEnzymeSerializer } from '../../dist/create-enzyme-serializer-3bcb844d.esm.js'

var _createEnzymeSerializ = createEnzymeSerializer(),
  test = _createEnzymeSerializ.test,
  serialize = _createEnzymeSerializ.serialize

export { serialize, test }

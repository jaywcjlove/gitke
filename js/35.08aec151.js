(window.webpackJsonp=window.webpackJsonp||[]).push([[35],{"./node_modules/@babel/runtime/helpers/assertThisInitialized.js":function(e,t){e.exports=function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}},"./node_modules/@babel/runtime/helpers/classCallCheck.js":function(e,t){e.exports=function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}},"./node_modules/@babel/runtime/helpers/createClass.js":function(e,t){function o(e,t){for(var o=0;o<t.length;o++){var n=t[o];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}e.exports=function(e,t,n){return t&&o(e.prototype,t),n&&o(e,n),e}},"./node_modules/@babel/runtime/helpers/getPrototypeOf.js":function(e,t){function o(t){return e.exports=o=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)},o(t)}e.exports=o},"./node_modules/@babel/runtime/helpers/inherits.js":function(e,t,o){var n=o("./node_modules/@babel/runtime/helpers/setPrototypeOf.js");e.exports=function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&n(e,t)}},"./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js":function(e,t,o){var n=o("./node_modules/@babel/runtime/helpers/typeof.js"),r=o("./node_modules/@babel/runtime/helpers/assertThisInitialized.js");e.exports=function(e,t){return!t||"object"!==n(t)&&"function"!=typeof t?r(e):t}},"./node_modules/@babel/runtime/helpers/setPrototypeOf.js":function(e,t){function o(t,n){return e.exports=o=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},o(t,n)}e.exports=o},"./node_modules/@babel/runtime/helpers/typeof.js":function(e,t){function o(e){return(o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function n(t){return"function"==typeof Symbol&&"symbol"===o(Symbol.iterator)?e.exports=n=function(e){return o(e)}:e.exports=n=function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":o(e)},n(t)}e.exports=n},"./src/routes/repo/issues/index.js":function(e,t,o){"use strict";o.r(t),o.d(t,"default",function(){return d});var n=o("./node_modules/@babel/runtime/helpers/classCallCheck.js"),r=o.n(n),s=o("./node_modules/@babel/runtime/helpers/createClass.js"),u=o.n(s),l=o("./node_modules/@babel/runtime/helpers/possibleConstructorReturn.js"),i=o.n(l),p=o("./node_modules/@babel/runtime/helpers/getPrototypeOf.js"),c=o.n(p),a=o("./node_modules/@babel/runtime/helpers/inherits.js"),b=o.n(a),f=o("./node_modules/react/index.js"),m=o.n(f),d=function(e){function t(e){var o;return r()(this,t),(o=i()(this,c()(t).call(this,e))).state={},o}return b()(t,e),u()(t,[{key:"render",value:function(){return m.a.createElement("div",null,"Repo/Issue")}}]),t}(f.PureComponent)}}]);
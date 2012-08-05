/**
 * clickable.js v1.0
 * Seamless buttons for mobile devices
 * Copyright (c) 2012 Kik Interactive, http://kik.com
 * Released under the MIT license
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

var Clickable = function (window, document, clik, Zepto, jQuery) {
	var os = mobileOS();

	function mobileOS () {
		var ua = window.navigator.userAgent,
			name, version,
			m;

		if ((m = /\bCPU.*OS (\d+(_\d+)?)/i.exec(ua))) {
			name = 'ios';
			version = m[1].replace('_', '.');
		}

		else if ((m = /\bAndroid (\d+(\.\d+)?)/.exec(ua))) {
			name = 'android';
			version = m[1];
		}

		var data = {
			name    : name,
			version : version && window.parseFloat(version)
		};

		data[ name ] = true;

		return data;
	}

	function isDOMNode (elem) {
		if ( !elem ) {
			return false;
		}

		try {
			return (elem instanceof Node) || (elem instanceof HTMLElement);
		} catch (err) {}

		if (typeof elem !== 'object') {
			return false;
		}

		if (typeof elem.nodeType !== 'number') {
			return false;
		}

		if (typeof elem.nodeName !== 'string') {
			return false;
		}

		return true;
	}

	function enableClicking (elem, activeClass) {
		if ( !isDOMNode(elem) ) {
			throw elem + ' is not a DOM element';
		}

		if (elem._clickable) {
			return;
		}
		elem._clickable = true;

		if (!os.ios && !os.android) {
			return;
		}

		switch (typeof activeClass) {
			case 'undefined':
				activeClass = 'active';
				// fall through

			case 'string':
				break;

			default:
				throw TypeError('active class ' + activeClass + ' must be a string');
		}

		var activeRegex = new RegExp('\\b' + activeClass + '\\b'),
			touchDown   = false,
			allowEvent  = false,
			lastTouch;

		elem.style['-webkit-tap-highlight-color'] = 'transparent';

		elem.addEventListener('touchstart'  , startTouch  , false);
		elem.addEventListener('touchmove'   , cancelTouch , false);
		elem.addEventListener('touchend'    , endTouch    , false);
		elem.addEventListener('touchcancel' , cancelTouch , false);

		function startTouch () {
			touchDown  = true;
			allowEvent = false;
			lastTouch  = +new Date();
			var touch  = lastTouch;

			setTimeout(function () {
				if (touchDown && (touch === lastTouch)) {
					elem.className += ' ' + activeClass;
				}
			}, 40);
		}

		function cancelTouch () {
			touchDown  = false;
			allowEvent = false;
			elem.className = elem.className.replace(activeRegex, '');
		}

		function endTouch () {
			var fireEvent = touchDown;
			cancelTouch();

			if ( !fireEvent ) {
				return;
			}

			allowEvent = true;

			var evt = document.createEvent('MouseEvents');
			evt.initMouseEvent(
				'click' , true , true , window,
				1       , 0    , 0    , 0     , 0,
				false   , false, false, false ,
				0       , null
			);
			elem.dispatchEvent(evt);
		}

		elem.addEventListener('click', function (e) {
			if (allowEvent) {
				allowEvent = false;
				return;
			}

			e.preventDefault();
			e.stopImmediatePropagation();
			e.stopPropagation();
			e.returnValue = false;
			return false;
		}, false);
	}

	function setupClik () {
		if ( !clik ) {
			return;
		}

		clik.plugin('clickable', function () {
			enableClicking.apply(this, arguments);
		});
	}

	function setupZepto () {
		if ( !Zepto ) {
			return;
		}

		Zepto.extend(Zepto.fn, {
			clickable : function (activeClass) {
				this.forEach(function (elem) {
					enableClicking(elem, activeClass);
				});
				return this;
			}
		});
	}

	function setupJQuery () {
		if ( !jQuery ) {
			return;
		}

		jQuery.fn.clickable = function (activeClass) {
			this.each(function () {
				enableClicking(this, activeClass);
			});
			return this;
		};
	}

	function main () {
		setupClik();
		setupZepto();
		setupJQuery();

		function Clickable () {
			enableClicking.apply(this, arguments);
		}

		return Clickable;
	}

	return main();
}(window, document, window.clik, window.Zepto, window.jQuery);

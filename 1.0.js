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
	var TRIM_REGEX   = /^\s+|\s+$/g,
		ACTIVE_DELAY = 40;

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

	function trimString (str) {
		return String(str).replace(TRIM_REGEX, '');
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

	function isInDOM (elem) {
		while (elem = elem.parentNode) {
			if (elem === document) {
				return true;
			}
		}

		return false;
	}

	function supportsTouchClick () {
		return os.ios || os.android;
	}

	function enableClicking (elem, activeClass) {
		if ( !isDOMNode(elem) ) {
			throw TypeError('element ' + elem + ' must be a DOM element');
		}

		if (elem._clickable) {
			return;
		}
		elem._clickable = true;

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

		if ( !supportsTouchClick() ) {
			if (elem.addEventListener) {
				elem.addEventListener('mousedown' , startMouse  , false);
				elem.addEventListener('mousemove' , cancelMouse , false);
				elem.addEventListener('mouseout'  , cancelMouse , false);
				elem.addEventListener('mouseup'   , endMouse    , false);
				elem.addEventListener('click'     , onClick     , false);
			}
			else if (elem.attachEvent) {
				elem.attachEvent('onmousedown' , startMouse );
				elem.attachEvent('onmousemove' , cancelMouse);
				elem.attachEvent('onmouseout'  , cancelMouse);
				elem.attachEvent('onmouseup'   , endMouse   );
				elem.attachEvent('onclick'     , onClick    );
			}
			return;
		}

		elem.style['-webkit-tap-highlight-color'] = 'rgba(255,255,255,0)';

		elem.addEventListener('click', onClick, false);

		if (os.ios) {
			elem.addEventListener('DOMNodeInsertedIntoDocument', bindTouchEvent   , false);
			elem.addEventListener('DOMNodeRemovedFromDocument' , unbindTouchEvents, false);

			if ( isInDOM(elem) ) {
				bindTouchEvent();
			}
		}
		else {
			bindTouchEvent();
		}

		function bindTouchEvent () {
			elem.addEventListener('touchstart'  , startTouch  , false);
			elem.addEventListener('touchmove'   , cancelTouch , false);
			elem.addEventListener('touchend'    , endTouch    , false);
			elem.addEventListener('touchcancel' , cancelTouch , false);
		}

		function unbindTouchEvents () {
			elem.removeEventListener('touchstart'  , startTouch );
			elem.removeEventListener('touchmove'   , cancelTouch);
			elem.removeEventListener('touchend'    , endTouch   );
			elem.removeEventListener('touchcancel' , cancelTouch);
		}

		function activateButton () {
			elem.className += ' ' + activeClass;
		}

		function deactivateButton () {
			elem.className = trimString( elem.className.replace(activeRegex, '') );
		}

		function startMouse (e) {
			allowEvent = false;

			if (elem.disabled) {
				e.preventDefault();
				touchDown = false;
				return;
			}

			touchDown = true;
			activateButton();
		}

		function cancelMouse (e) {
			e.preventDefault();
			touchDown  = false;
			allowEvent = false;
			deactivateButton();
		}

		function endMouse (e) {
			if (elem.disabled) {
				e.preventDefault();
				touchDown  = false;
				allowEvent = false;
				return;
			}

			if ( !touchDown ) {
				e.preventDefault();
				allowEvent = false;
			}
			else {
				allowEvent = true;
			}

			touchDown = false;
			deactivateButton();
		}

		function startTouch () {
			allowEvent = false;

			if (elem.disabled) {
				touchDown = false;
				return;
			}

			touchDown  = true;
			lastTouch  = +new Date();
			var touch  = lastTouch;

			setTimeout(function () {
				if (touchDown && (touch === lastTouch)) {
					activateButton();
				}
			}, ACTIVE_DELAY);
		}

		function cancelTouch () {
			allowEvent = false;
			touchDown  = false;

			if (elem.disabled) {
				return;
			}

			deactivateButton();
		}

		function endTouch (e) {
			var shouldFireEvent = touchDown;
			cancelTouch();

			if (!shouldFireEvent || elem.disabled) {
				return;
			}

			if ( !e.stopImmediatePropagation ) {
				allowEvent = true;
				return;
			}

			var touchDuration = +new Date() - lastTouch;

			if (touchDuration > ACTIVE_DELAY) {
				fireEvent();
			}
			else {
				activateButton();

				setTimeout(function () {
					deactivateButton();
					fireEvent();
				}, 1);
			}

			function fireEvent () {
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
		}

		function onClick (e) {
			e = e || window.event;

			if (!elem.disabled && allowEvent) {
				allowEvent = false;
				return;
			}

			if (e.stopImmediatePropagation) {
				e.stopImmediatePropagation();
			}
			e.preventDefault();
			e.stopPropagation();
			e.cancelBubble = true;
			e.returnValue = false;
			return false;
		}
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

		Clickable.touchable = function () {
			return supportsTouchClick();
		};

		return Clickable;
	}

	return main();
}(window, document, window.clik, window.Zepto, window.jQuery);

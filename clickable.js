var Clickable = function (window, document, Zepto, jQuery) {
	var TRIM_REGEX   = /^\s+|\s+$/g,
		ACTIVE_DELAY = 40;

	var singleButtonLock = false,
		os               = mobileOS();

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

		elem.setAttribute('data-clickable-class', activeClass);

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

		function activateLock () {
			singleButtonLock = true;
		}

		function deactivateLock () {
			if (singleButtonLock) {
				setTimeout(function () {
					singleButtonLock = true;
				}, 50);
			}
		}

		function isClosestClickable (target, elem) {
			do {
				if (target === elem) {
					return true;
				}
				else if (target._clickable) {
					return false;
				}
			} while (target = target.parentNode);

			return false;
		}

		function startMouse (e) {
			allowEvent = false;

			if (elem.disabled || !isClosestClickable(e.target, elem)) {
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

		function startTouch (e) {
			allowEvent = false;

			if (singleButtonLock || elem.disabled || (e.touches.length !== 1) || !isClosestClickable(e.target, elem)) {
				touchDown = false;
				return;
			}

			singleButtonLock = true;
			touchDown        = true;
			lastTouch        = +new Date();
			var touch        = lastTouch;

			setTimeout(function () {
				if (touchDown && (touch === lastTouch)) {
					activateButton();
				}
			}, ACTIVE_DELAY);
		}

		function cancelTouch (e) {
			allowEvent       = false;
			touchDown        = false;

			if (e) {
				singleButtonLock = false;
			}

			if (elem.disabled) {
				return;
			}

			deactivateButton();
		}

		function endTouch (e) {
			var shouldFireEvent = touchDown;
			cancelTouch();

			if (!shouldFireEvent || elem.disabled) {
				singleButtonLock = false;
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
				allowEvent       = false;
				setTimeout(function () {
					singleButtonLock = false;
				}, 0);
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

	function enableStickyClick (button, activeClass, holdFunction) {
		if ( !isDOMNode(button) ) {
			throw TypeError('button must be a DOM element, got ' + button);
		}

		switch (typeof activeClass) {
			case 'string':
				break;

			case 'function':
				holdFunction = activeClass;
				activeClass  = undefined;
				break;

			default:
				throw TypeError('button active class must be a string if defined, got ' + activeClass);
		}

		if (typeof holdFunction !== 'function') {
			throw TypeError('sticky click handler must be a function, got ' + holdFunction);
		}

		enableClicking(button);

		button.addEventListener('click', handleStickyClick, false);

		function handleStickyClick () {
			var lock        = false,
				activeClass = button.getAttribute('data-clickable-class') || 'active',
				value;

			button.disabled = true;
			button.className += ' ' + activeClass;

			try {
				value = holdFunction(cleanUp);
			}
			catch (err) {
				if (window.console && window.console.error) {
					window.console.error(err + '');
				}

				cleanUp();
			}

			if (value === false) {
				cleanUp();
			}

			function cleanUp () {
				if (lock) {
					return;
				}
				lock = true;

				if (button.disabled) {
					button.disabled = false;
					button.className = button.className.replace(new RegExp('\\b'+activeClass+'\\b', 'g'), '');
				}
			}
		}
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
			},
			stickyClick : function (holdFunction) {
				this.forEach(function (elem) {
					enableStickyClick(elem, holdFunction);
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
		jQuery.fn.stickyClick = function (holdFunction) {
			this.each(function () {
				enableStickyClick(this, holdFunction);
			});
			return this;
		};
	}

	function main () {
		setupZepto();
		setupJQuery();

		function Clickable () {
			enableClicking.apply(this, arguments);
		}

		Clickable.touchable = function () {
			return supportsTouchClick();
		};

		Clickable.sticky = function () {
			enableStickyClick.apply(this, arguments);
		};

		return Clickable;
	}

	return main();
}(window, document, window.Zepto, window.jQuery);

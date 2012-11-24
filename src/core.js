Clickable._enableClicking = function (os, isDOMNode, bindEvents, unbindEvents, addClass, removeClass) {
	var DEFAULT_ACTIVE_CLASS = 'active' ,
		DATA_ACTIVE_CLASS    = 'data-clickable-class',
		ACTIVE_DELAY         = 40;

	var singleButtonLock = false,
		isIOS            = !!os.ios;



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
				activeClass = DEFAULT_ACTIVE_CLASS;
				break;
			case 'string':
				break;
			default:
				throw TypeError('active class ' + activeClass + ' must be a string');
		}

		var touchDown  = false,
			allowEvent = false,
			lastTouch;

		elem.setAttribute(DATA_ACTIVE_CLASS, activeClass);
		elem.style['-webkit-tap-highlight-color'] = 'rgba(255,255,255,0)';

		bindCoreEvents();
		return;



		// Button class management

		function activateButton () {
			addClass(elem, activeClass);
		}

		function deactivateButton () {
			removeClass(elem, activeClass);
		}



		// Event binding management

		function bindCoreEvents () {
			bindEvents(elem, { click : onClick });

			if ( !os.touchable ) {
				bindEvents(elem, {
					mousedown : startMouse  ,
					mousemove : cancelMouse ,
					mouseout  : cancelMouse ,
					mouseup   : endMouse
				});
				return;
			}

			if (os.ios) {
				bindEvents(elem, {
					DOMNodeInsertedIntoDocument : bindTouchEvents   ,
					DOMNodeRemovedFromDocument  : unbindTouchEvents
				});

				if ( isInDOM(elem) ) {
					bindTouchEvents();
				}
			}
			else {
				bindTouchEvents();
			}
		}

		function bindTouchEvents () {
			bindEvents(elem, {
				touchstart  : startTouch  ,
				touchmove   : cancelTouch ,
				touchcancel : cancelTouch ,
				touchend    : endTouch
			});
		}

		function unbindTouchEvents () {
			unbindEvents(elem, {
				touchstart  : startTouch  ,
				touchmove   : cancelTouch ,
				touchcancel : cancelTouch ,
				touchend    : endTouch
			});
		}



		// Click event handler

		function onClick (e) {
			e = e || window.event;

			if (!elem.disabled && allowEvent) {
				allowEvent = false;

				setTimeout(function () {
					singleButtonLock = false;
				}, 0);
			}

			else {
				if (e.stopImmediatePropagation) {
					e.stopImmediatePropagation();
				}
				e.preventDefault();
				e.stopPropagation();
				e.cancelBubble = true;
				e.returnValue  = false;
				return false;
			}
		}



		// Desktop mouse eventing

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



		// Mobile touchscreen eventing

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
				allowEvent = true;
				fireClickEvent(elem);
			}
			else {
				activateButton();

				setTimeout(function () {
					deactivateButton();
					allowEvent = true;
					fireClickEvent(elem);
				}, 1);
			}
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

	function fireClickEvent (elem) {
		var evt = document.createEvent('MouseEvents');
		evt.initMouseEvent(
			'click' , true , true , window,
			1       , 0    , 0    , 0     , 0,
			false   , false, false, false ,
			0       , null
		);
		elem.dispatchEvent(evt);
	}



	return enableClicking;
}(
	Clickable._os           , // from utils.js
	Clickable._isDOMNode    , // from utils.js
	Clickable._bindEvents   , // from utils.js
	Clickable._unbindEvents , // from utils.js
	Clickable._addClass     , // from utils.js
	Clickable._removeClass    // from utils.js
);

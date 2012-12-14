Clickable._enableClicking = function (os, isDOMNode, isInDOM, bindEvents, unbindEvents, addClass, removeClass) {
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
			lastTouch, scroller, scrollTop;

		elem.setAttribute(DATA_ACTIVE_CLASS, activeClass);
		elem.style['-webkit-tap-highlight-color'] = 'rgba(255,255,255,0)';

		bindCoreEvents();
		return;



		// Button state management

		function setTouchDown () {
			touchDown = true;
			lastTouch = +new Date();

			scroller = closestNativeIOSScroller(elem);
			if (scroller) {
				scrollTop = scroller.scrollTop;
				scroller.addEventListener('scroll', onScroll, true);
			}
		}

		function setTouchUp () {
			if (scroller) {
				scroller.removeEventListener('scroll', onScroll);
			}
			scroller  = null;
			scrollTop = null;

			touchDown = false;
		}

		function onScroll () {
			cancelTouch();
		}

		function isTouchDown () {
			return touchDown;
		}

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
				setTouchUp();
				return;
			}

			setTouchDown();
			activateButton();
		}

		function cancelMouse (e) {
			e.preventDefault();
			setTouchUp();
			allowEvent = false;
			deactivateButton();
		}

		function endMouse (e) {
			if (elem.disabled) {
				e.preventDefault();
				setTouchUp();
				allowEvent = false;
				return;
			}

			if ( !isTouchDown() ) {
				e.preventDefault();
				allowEvent = false;
			}
			else {
				allowEvent = true;
			}

			setTouchUp();
			deactivateButton();
		}



		// Mobile touchscreen eventing

		function startTouch (e) {
			allowEvent = false;

			if (singleButtonLock || elem.disabled || (e.touches.length !== 1) || !isClosestClickable(e.target, elem)) {
				setTouchUp();
				return;
			}

			singleButtonLock = true;
			setTouchDown();

			if (scroller) {
				if ((scrollTop < 0) || (scroller.scrollHeight < scrollTop)) {
					setTouchUp();
					return;
				}
				else if (scroller._isScrolling) {
					scroller._isScrolling = false;
					setTouchUp();
					return;
				}
			}

			var touch = lastTouch;

			setTimeout(function () {
				if (isTouchDown() && (touch === lastTouch)) {
					activateButton();
				}
			}, ACTIVE_DELAY);
		}

		function cancelTouch (e) {
			allowEvent = false;
			setTouchUp();

			if (e) {
				singleButtonLock = false;
			}

			if (elem.disabled) {
				return;
			}

			deactivateButton();
		}

		function endTouch (e) {
			var shouldFireEvent = isTouchDown(),
				lastScroller    = scroller,
				lastScrollTop   = scrollTop;

			cancelTouch();

			if (!shouldFireEvent || elem.disabled) {
				singleButtonLock = false;
				return;
			}

			if (lastScroller) {
				if (lastScroller.scrollTop !== lastScrollTop) {
					return;
				}
				else if (lastScroller._isScrolling) {
					lastScroller._isScrolling = false;
					return;
				}
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

	function closestNativeIOSScroller (elem) {
		if (!os.ios || (os.version < 5)) {
			return;
		}

		while (elem = elem.parentNode) {
			if (elem._scrollable) {
				if (elem._iScroll) {
					return;
				}
				return elem;
			}
		}
	}



	return enableClicking;
}(
	Clickable._os           , // from utils.js
	Clickable._isDOMNode    , // from utils.js
	Clickable._isInDOM      , // from utils.js
	Clickable._bindEvents   , // from utils.js
	Clickable._unbindEvents , // from utils.js
	Clickable._addClass     , // from utils.js
	Clickable._removeClass    // from utils.js
);

Clickable._enableStickyClick = function (trimString, isDOMNode, enableClicking) {
	var DATA_ACTIVE_CLASS = 'data-clickable-class';


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

		enableClicking(button, activeClass);

		var handler = createStickyClickHandler(button, holdFunction);
		button.addEventListener('click', handler, false);
		if (button._removeStickyClick) {
			button._removeStickyClick = function () {
				button.removeEventListener('click', handler);
			};
		}
	}

	function createStickyClickHandler (button, holdFunction) {
		var holdLock    = false,
			activeClass = button.getAttribute(DATA_ACTIVE_CLASS);

		return function () {
			if (holdLock) {
				return;
			}
			holdLock = true;

			var cleanUpLock = false,
				value;

			button.disabled = true;
			button.className += ' ' + activeClass;

			try {
				value = holdFunction.call(button, cleanUp);
			}
			catch (err) {
				if (window.console && window.console.error) {
					if ((typeof err === 'object') && err.stack) {
						window.console.error(err.stack);
					}
					else {
						window.console.error(err + '');
					}
				}

				cleanUp();
			}

			if (value === false) {
				cleanUp();
			}

			function cleanUp () {
				if (cleanUpLock) {
					return;
				}
				cleanUpLock = true;

				holdLock = false;

				if (button.disabled) {
					button.disabled = false;
					button.className = trimString(
						button.className.replace(
							new RegExp('\\b'+activeClass+'\\b', 'g'),
							''
						)
					);
				}
			}
		};
	}

	return enableStickyClick;
}(
	Clickable._trimString     , // from utils.js
	Clickable._isDOMNode      , // from utils.js
	Clickable._enableClicking   // from core.js
);

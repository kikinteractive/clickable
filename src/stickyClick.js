Clickable._enableStickyClick = function (trimString, isDOMNode, enableClicking) {


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

		button.addEventListener(
			'click',
			createStickyClickHandler(button, holdFunction),
			false
		);

	}

	function createStickyClickHandler (button, holdFunction) {
		return function () {
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

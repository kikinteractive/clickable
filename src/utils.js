Clickable._os = function (userAgent, parseFloat) {
	var name, version, match;

	if (match = /\bCPU.*OS (\d+(_\d+)?)/i.exec(userAgent)) {
		name    = 'ios';
		version = match[1].replace('_', '.');
	}

	else if (match = /\bAndroid (\d+(\.\d+)?)/.exec(userAgent)) {
		name    = 'android';
		version = match[1];
	}

	var data = {
		name      : name ,
		version   : version && parseFloat(version) ,
		touchable : !!name
	};

	data[ name ] = true;

	return data;
}(navigator.userAgent, parseFloat);



Clickable._trimString = function (String) {
	var TRIM_REGEX = /^\s+|\s+$/g;

	return function (str) {
		return String(str).replace(TRIM_REGEX, '');
	};
}(String);



Clickable._isDOMNode = function (Node, HTMLElement) {
	return function (elem) {
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
	};
}(Node, HTMLElement);



Clickable._isInDOM = function () {
	return function (elem) {
		while (elem = elem.parentNode) {
			if (elem === document) {
				return true;
			}
		}

		return false;
	};
}();

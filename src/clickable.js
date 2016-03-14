var Clickable = function (Zepto, jQuery) {
	// import Clickable._os                from utils.js
	// import Clickable._enableClicking    from core.js
	// import Clickable._enableStickyClick from stickyClick.js



	// window.Clickable exports

	function Clickable () {
		Clickable._enableClicking.apply(this, arguments);
	}
	Clickable.touchable = function () {
		return Clickable._os.touchable;
	};
	Clickable.sticky = function () {
		Clickable._enableStickyClick.apply(this, arguments);
	};
	Clickable.unsticky = function (elem) {
		if (typeof elem === 'object' && elem && typeof elem._removeStickyClick === 'function') {
			elem._removeStickyClick();
		}
	};



	// jQuery exports

	if (jQuery && jQuery.fn) {
		jQuery.fn.clickable = function (activeClass) {
			this.each(function () {
				Clickable._enableClicking(this, activeClass);
			});
			return this;
		};
		jQuery.fn.stickyClick = function (holdFunction) {
			this.each(function () {
				Clickable._enableStickyClick(this, holdFunction);
			});
			return this;
		};
		jQuery.fn.unstickyClick = function (holdFunction) {
			this.each(function () {
				Clickable.unsticky(this);
			});
			return this;
		};
	}



	// Zepto exports

	if (Zepto && Zepto.fn) {
		Zepto.extend(Zepto.fn, {
			clickable : function (activeClass) {
				this.forEach(function (elem) {
					Clickable._enableClicking(elem, activeClass);
				});
				return this;
			},
			stickyClick : function (holdFunction) {
				this.forEach(function (elem) {
					Clickable._enableStickyClick(elem, holdFunction);
				});
				return this;
			},
			unstickyClick : function (holdFunction) {
				this.forEach(function (elem) {
					Clickable.unsticky(this);
				});
				return this;
			}
		});
	}



	return Clickable;
}(window.Zepto, window.jQuery);

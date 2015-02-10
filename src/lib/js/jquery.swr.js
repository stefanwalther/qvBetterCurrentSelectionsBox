// jQuery Extensions
// Extension of this code: http://jsfiddle.net/nijk/sVu7h/
(function ($) {
    $.fn.showHide = function (visibility, callback) {
        var _sh = this;


        //_sh.method = show;

        if (visibility) {
            _sh.method = show;
        }
        else {
            _sh.method = hide;
        }

        function init(elem) {
            return _sh.method(elem);
        };

        function show(elem) {
            elem.show();
            $.isFunction(callback) && callback.call(this);
        };
        function hide(elem) {
            elem.hide();
            $.isFunction(callback) && callback.call(this);
        };

        return this.each(function () {
            init($(this));
        });
    }
})(jQuery);
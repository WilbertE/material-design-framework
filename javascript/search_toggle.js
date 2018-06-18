$.mSearchToggle = function () {



}




; (function ($, window, document, undefined) {

    "use strict";
    var pluginName = "mSearchToggle",
        defaults = {
            onKeyUp: function () { }
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mSearchToggle", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var _this = this;
            if (this.$element.hasClass("initialized") == false) {
                $(this).addClass("initialized");

                this.$element.find(".button-icon").on("click", function (e) {
                    e.preventDefault();
                    _this.$element.addClass("search-toggle--active");
                    _this.$element.find("input").focus();
                });

                this.$element.find(".search-toggle__close").on("click", function (e) {
                    e.preventDefault();
                    _this.$element.removeClass("search-toggle--active");
                });

                this.$element.find("input").on("keyup", function (e) {
                    _this.settings.onKeyUp(_this.$element, $(this).val());
                });
            }

        },
        loading: function () {
            console.log("loading");
            this.$element.addClass("search-toggle--loading");
        },
        complete: function () {
            this.$element.removeClass("search-toggle--loading");
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                    pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
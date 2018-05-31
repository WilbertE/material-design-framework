; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mNavigationalDrawer",
    defaults = {
        onClose: function () { },
        onOpen: function () { },
        hamburger: null
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mNavigationalDrawer", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        open: function () {

            this.$element.closest(".m-overlay").addClass("m-overlay--show");
            this.$element.addClass("navigation-drawer--open");
            this.settings.onOpen();
            if (this.settings.hamburger) $(this.settings.hamburger).addClass("hamburger--open");
        },

        close: function () {
            var _this = this;
            this.$element.closest(".m-overlay").removeClass("m-overlay--show");
            this.$element.removeClass("navigation-drawer--open");
            this.settings.onClose();
            if (this.settings.hamburger) $(this.settings.hamburger).removeClass("hamburger--open");
        },

        init: function () {

            var _this = this;
            var overlay = this.$element.closest(".m-overlay");

            if (overlay.length == 0) {
                overlay = $("<div />", { "class": "m-overlay navigation-drawer-overlay" });
                _this.$element.wrap(overlay);
                overlay = this.$element.closest(".m-overlay");
                overlay.on("click", function (e) {

                    var $target = $(e.target);
                    if ($target.hasClass("navigation-drawer") == false && $target.closest(".navigation-drawer").length == 0) {
                        e.preventDefault();
                        _this.close();
                    }
                })
            }

            if (this.settings.hamburger) {
                $(this.settings.hamburger).on("click", function () {
                    _this.open();
                });
            }
        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                    pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mBottomNavigation",
    defaults = {
        hideLabels: 4,
        onButtonClick: function () { }, //Executes when a button is clicked
        followNavigation: false, //Follow the href on the button
        ripple: true
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mBottomNavigation", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        //Selects an element by its index
        select: function (index) {
            var _this = this;
            var $element = $(this.element);
            var buttons = $element.find(".m-bottom-navigation__tab");
            buttons.removeClass("m-bottom-navigation__tab--active");
            var tab = $element.find(".m-bottom-navigation__tab:nth-child(" + index + ")");
            tab.addClass("m-bottom-navigation__tab--active");
            _this.settings.onButtonClick($(this));

        },

        init: function () {
            var _this = this;
            var $element = $(this.element);
            if (!$element.hasClass("js-initialized")) {
                $element.addClass("js-initialized");
                var buttons = $element.find(".m-bottom-navigation__tab");

                //Hide labels on inactive buttons if it should
                if (buttons.length >= this.settings.hideLabels) {
                    $element.addClass("m-bottom-navigation__menu--hide-labels");
                }

                //Show ripple effect in text color 
                if (this.settings.ripple) {
                    var color = $element.find(".m-bottom-navigation__tab--active .m-bottom-navigation__button").css("color");
                    buttons.attr("data-ripple", color);
                }

                buttons.on("mousedown", function (e) {
                    if (!_this.settings.followNavigation) e.preventDefault();
                    var index = $(this).closest(".m-bottom-navigation__tab").index() + 1;
                    _this.select(index);
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
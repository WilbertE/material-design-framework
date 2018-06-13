; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mList",
    defaults = {};

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mList", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        toggleExpand: function (target, checkForOpenElements) {

            var prevDivider = (target.prev().hasClass("list__divider")) ? target.prev() : null;

            if (target.length > 0 && checkForOpenElements == null) {
                if (target.closest(".list--only-one-expandable").length > 0) {
                    var itemOpen = this.$element.find(".list__item--expanded");
                    if (itemOpen[0] != target[0]) {
                        this.toggleExpand(itemOpen, false);
                    }
                }
            }

            target.toggleClass("list__item--expanded");
            target.next().find(".ripple").remove();
            if (target.hasClass("list__item--expanded")) {
                target.next().slideDown(200);
                if (prevDivider) prevDivider.css("display", "none");
            } else {
                target.next().slideUp(200);
                if (prevDivider) prevDivider.css("display", "");
            }
        },

        init: function () {
            var _this = this;

            var listItem = this.$element.find(".list__item--expanded");
            listItem.next().css("display", "block");
            var prevDivider = (listItem.prev().hasClass("list__divider")) ? listItem.prev() : null;
            if (prevDivider) prevDivider.css("display", "none");

            if (this.$element.find(".list__item--expandable").length > 0) {
                this.$element.on("click", function (e) {
                    var $target = $(e.target).closest(".list__item--expandable");
                    if ($target.length == 0 && $(e.target).hasClass("list__item--expandable")) $target = $(e.target);
                    _this.toggleExpand($target);
                })
            }

            if (this.$element.hasClass("list--indexed") == true && this.$element.hasClass("list--indexed-inside") == false) {
                this.$element.on("scroll", function () {
                    if (_this.$element.scrollTop() > 0 && _this.$element.hasClass("list-scrolled") == false) {
                        _this.$element.addClass("list-scrolled");
                    } else if (_this.$element.scrollTop() == 0) {
                        _this.$element.removeClass("list-scrolled");
                    }
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
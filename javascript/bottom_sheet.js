; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mBottomSheet",
    defaults = {
        titleToggle: true,
        closeOnAnchorClick: false,
        minimizeOnAnchorClick: true,
        followNavigation: false,
        overlay: false,
        overlayOnlyOnMaximize: false,
        onInit: function () { },
        onMinimize: function () { },
        onMaximize: function () { },
        onClose: function () { },
        onRemove: function () { }
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mBottomSheet", this);
    }


    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        //Show the bottom sheet
        maximize: function () {
            var $element = $(this.element);
            $element.removeClass("m-bottom-sheet--hidden").addClass("m-bottom-sheet--closed m-bottom-sheet--show");
            var title = $element.find(".m-bottom-sheet__title");
            var contentHeight = $element.outerHeight() - title.height();
            $element.css("transform", "translateY(0px)");
            $element.one("transitionend", this.settings.onMaximize());
            if (this.settings.overlayOnlyOnMaximize && this.settings.overlay) {
                $element.closest(".m-overlay").addClass("m-overlay--show");
            }
        },

        //Hide the bottom sheet
        minimize: function (firstRun) {
            firstRun = (firstRun == null) ? false : true;
            var _this = this;
            var $element = $(this.element);
            $element.addClass("m-bottom-sheet--hidden").removeClass("m-bottom-sheet--closed m-bottom-sheet--show");
            $element.addClass("m-bottom-sheet--hidden");
            var title = $element.find(".m-bottom-sheet__title");
            var contentHeight = $element.outerHeight() - title.height();
            var toggleHeight = (this.settings.titleToggle == true) ? Math.round(contentHeight) : 0;
            $element.css("transform", "translateY(" + toggleHeight + "px)");
            if (_this.settings.overlayOnlyOnMaximize && this.settings.overlay) {
                $element.closest(".m-overlay").removeClass("m-overlay--show");
            }
            $element.one("transitionend", function () {
                if (firstRun) {
                    _this.settings.onInit();
                } else {
                    _this.settings.onMinimize();
                }
            });
        },

        //Closes the bottom sheet (off screen but exists)
        close: function () {
            var $element = $(this.element);
            $element.addClass("m-bottom-sheet--closed").removeClass("m-bottom-sheet--hidden m-bottom-sheet--show");
            var contentHeight = $element.outerHeight();
            $element.css("transform", "translateY(" + Math.round(contentHeight) + "px)");
            $element.one("transitionend", this.settings.onClose());
            $element.closest(".m-overlay").removeClass("m-overlay--show");
        },

        //Closes the bottom sheet and removes it from the DOM
        remove: function () {
            var $element = $(this.element);
            var _this = this;
            $element.addClass("m-bottom-sheet--closed").removeClass("m-bottom-sheet--hidden m-bottom-sheet--show");
            var contentHeight = $element.outerHeight();
            $element.css("transform", "translateY(" + Math.round(contentHeight + 1) + "px)");
            $element.closest(".m-overlay").removeClass("m-overlay--show");
            $element.one("transitionend", function () {
                $element.closest(".m-overlay").remove();
                $element.remove();
                _this.settings.onRemove();

            })
        },

        //Redraw on resize
        redraw: function (scope, element) {
            var $element = $(this.element);
            if ($element.hasClass("m-bottom-sheet--hidden")) {
                this.minimize();
            } else {
                this.maximize();
            }
        },

        //Bind to anchors
        bind: function () {
            var _this = this;
            var $element = $(this.element);
            $element.find("a").on("click", function (e) {
                if (_this.settings.followNavigation) e.preventDefault();
                if (_this.settings.closeOnAnchorClick) {
                    _this.close();
                } else if (_this.settings.minimizeOnAnchorClick && _this.settings.titleToggle) {
                    _this.minimize();
                } else if (_this.settings.minimizeOnAnchorClick) {
                    _this.close();
                }
            });

        },

        //Initialize bottom sheet
        init: function () {
            var _this = this;
            this.element.bottomSheet = Plugin.prototype;
            var $element = $(this.element);

            if (!$element.hasClass("js-initialized")) {
                _this.minimize(true);

                //Overlay
                if (_this.settings.overlay) {
                    var overlay = $("<div />", { "class": "m-overlay" });
                    $element.wrap(overlay);
                }

                //On resize draw
                $(window).on("resize", function () { _this.redraw(_this, $element) });

                $element.offset();
                $element.addClass("js-initialized");
                if (!_this.settings.overlayOnlyOnMaximize && _this.settings.overlay) $element.closest(".m-overlay").addClass("m-overlay--show");


                //Add ripple effects for elements needed
                var rippleElements = (_this.settings.titleToggle) ? ".m-bottom-sheet__list-item, .m-bottom-sheet__title" : ".m-bottom-sheet__list-item";
                $element.find(rippleElements).attr("data-ripple", $element.css("color"));
                var title = $element.find(".m-bottom-sheet__title");

                //Bind anchors
                this.bind();

                //On title click, toggle bottom sheet
                title.on("click", function () {
                    if ($element.hasClass("m-bottom-sheet--hidden")) {
                        _this.maximize();
                    } else {
                        _this.minimize();
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
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mMenu",
    defaults = {
        onSelect: function (item) { }
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.$button = null;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mMenu", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        open: function () {
            var _this = this;
           
            _this.$element.off("transitionend");
            _this.returnToSleep();
            this.$element.addClass("menu--show");
            _this.$element.offset();

            this.$element.appendTo($("body"));

            var object = new Object();
            object.height = Number(this.$element.css("height").split("px").join(""));
            object.width = Number(this.$element.css("width").split("px").join(""));
            object.buttonTop = this.$button.offset().top;
            object.buttonHeight = this.$button.innerHeight();
            object.buttonLeft = this.$button.offset().left;
            object.buttonWidth = this.$button.innerWidth();
            object.maxPosition = $(window).innerHeight() - 25;
            object.maxXPosition = $(window).innerWidth() - 25;
            object.minPosition = 25;
            var screenSize = (object.maxPosition - object.minPosition);
            object.screenBottomSpace = screenSize - object.buttonTop + object.buttonHeight;
            object.screenTopSpace = object.buttonTop - object.minPosition;
            object.topPosition = object.buttonTop - object.height;
            object.maxHeight = object.height;

            if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition && object.screenTopSpace > object.screenBottomSpace) {
                var top = object.maxPosition - (object.maxPosition + 25 - object.buttonTop) - object.height;
                if (top < 25) object.maxHeight = object.screenTopSpace;
            } else if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition) {
                object.maxHeight = object.maxPosition - object.buttonTop - object.buttonHeight;
            }
            
           
            if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition && object.screenTopSpace > object.screenBottomSpace) {
                //Item is too long, most space on top
                this.$element.css({ "bottom": object.maxPosition + 25 - object.buttonTop + "px", "max-height": object.maxHeight + 30 });

            } else {
                this.$element.css({ "top": object.buttonTop + object.buttonHeight + "px", "max-height": object.maxHeight + 30 });
            }

            if (object.width + object.buttonLeft > object.maxXPosition) {
                this.$element.css({ "right": object.maxXPosition - object.buttonLeft - object.buttonWidth + 25, "width": "0" });
            } else {
                this.$element.css({ "left": object.buttonLeft, "width": "0" });
            }
            this.$element.find(".menu__options").css({ "width": object.width });
            
            this.$element.css({ "max-height": "0px", "width": "0px" }).addClass("menu--animate");
            _this.$element.offset();


            _this.$element.css({ "max-height": object.maxHeight, "width": object.width });
            _this.$element.on("transitionend", function (e) {
                if (e.originalEvent.propertyName !== 'max-height') return;
                _this.$element.removeClass("menu--animate");
                _this.$element.off("transitionend");
            });

        },

        returnToSleep: function () {
            this.$element.removeClass("menu--show menu--animate menu--animate--close");
            this.$button.append(this.$element);
            this.$element.attr("style", "");
            this.$element.find(".ripple").remove();
            $(document).off("mousedown.menuclick resize.menuresize touchstart.menutouch");
        },

        close: function (instant) {
            if (instant) {
                this.returnToSleep();
            } else {
                var _this = this;
                _this.$element.off("transitionend");
                this.$element.addClass("menu--animate menu--animate--close");
                this.$element.css({ "max-height": "0px", "width": "0px" });
                this.$element.on("transitionend", function (e) {
                    if (e.originalEvent.propertyName !== 'max-height') return;
                    _this.returnToSleep();
                    _this.$element.off("transitionend");
                });
            }
        },

        init: function () {
            var _this = this;
            this.$button = this.$element.parent();

            if (this.$element.find(".menu__option svg").length > 0) {
                this.$element.find(".menu__option").each(function () {
                    if ($(this).find("svg").length == 0) {
                        $(this).addClass("menu__option--no-icon");
                    }
                });
            }

            this.$button.on("click", function (e) {
                e.preventDefault();
                if (_this.$element.hasClass("menu--show") == false) {
                    _this.open();

                    //On scroll close
                    var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
                    body.one("scroll.menu", function () { _this.close(true) });
                    $(window).one("resize.menuresize", function () { _this.close(true) });

                    //On click outside close
                    $(document).on("mousedown.menuclick touchstart.menutouch", function (e) {
                        var target = $(e.target);
                        if (target.hasClass("menu__options") || target.hasClass("menu__hr")) {
                            return;
                        } else if (target.hasClass("menu__option")) {
                            //ON CLICK
                            var href = target.attr("data-href");
                            if (href != null) window.location = href;
                            _this.settings.onSelect(target);
                        }

                        _this.close();
                    });

                } else {
                    _this.close();
                }
            });
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
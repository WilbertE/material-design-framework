; (function ($, window, document, undefined) {

    "use strict";

    var pluginName = "mAutocomplete",
        defaults = {
            array: ["Zwolle", "Zeeland", "Zaandam", "Zuidrecht", "Zwijndrecht", "Zwallingerdam", "Eerbeek", "Eersel"],
            searchDelay: 0,
            onSelect: function () { },
            onBlur: function (itemExists) { },
            search: function (element, onSearchComplete) {
                //Search the array for matches
                var _this = element.data("mAutocomplete");
                var results = [];
                _this.settings.array.sort();
                for (var i = 0; i < _this.settings.array.length; i++) {
                    var result = _this.settings.array[i];
                    if (result.toLowerCase().startsWith(_this.$element.val().toLowerCase()) == true) {
                        results.push(result);
                    }
                }

                for (var i = 0; i < _this.settings.array.length; i++) {
                    var result = _this.settings.array[i];
                    if (result.toLowerCase().indexOf(_this.$element.val().toLowerCase()) > -1) {
                        if (results.includes(result) == false) results.push(result);
                    }
                }
                _this.dataCache = results;
                onSearchComplete(element, results);
            },
            minInputLength: 1,
            maxItems: 3
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mAutocomplete", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        dataCache: [],
        init: function () {
            var _this = this;
            if (this.$element.data("autocompleteInitialized") == null) {
                this.$element.data("autocompleteInitialized", true);

                var guid = function () {
                    function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
                    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
                }

                _this.$element.on("focus", function () {

                    $(window).one("blur.autocomplete", function () {
                        _this.$element.blur();
                    });

                    if (_this.latestResults != null) {
                        _this.searchComplete(_this.$element, _this.latestResults);
                    } else {
                        _this.lastInput = "";
                        _this.$element.trigger("keyup");
                    }
                });

                //Create element
                var id = guid();

                this.$element.attr("id", id);

                var timeout = null;
                this.$element.on("input", function () {

                    if (timeout) {
                        if (_this.lastInput != _this.$element.val()) {
                            clearTimeout(timeout);
                        }
                    }

                    if (_this.lastInput != _this.$element.val()) {
                        if (_this.$element.val().length >= _this.settings.minInputLength) {
                            _this.$element.data("loading")();
                            timeout = setTimeout(function () {

                                _this.lastInput = _this.$element.val();
                                _this.suggest();
                            }, _this.settings.searchDelay);

                        } else {
                            _this.$element.data("stopLoading")();
                            _this.close();
                        }
                    }
                });

                this.$element.on("blur", function () {
                    setTimeout(function () {
                        _this.$element.data("stopLoading")();
                        _this.close();
                        if (_this.settings.onBlur) _this.settings.onBlur(_this.$element.attr("data-item-exist"));
                    }, 50);
                });

            }
        },
        lastInput: "",
        measure: function (element) {
            var _this = element.data("mAutocomplete");
            var autocompleteOptions = $("#options-" + _this.$element.attr("id"));
            var object = new Object();
            object.elementTop = this.$element.offset().top,
            object.elementHeight = this.$element.innerHeight();
            object.autocompleteHeight = autocompleteOptions.outerHeight();
            object.elementLeft = this.$element.offset().left;
            object.elementWidth = this.$element.innerWidth();
            object.maxPosition = $(window).innerHeight() - 25;
            object.minPosition = 25;
            object.screenSize = (object.maxPosition - object.minPosition);
            object.screenBottomSpace = object.screenSize - object.elementTop - object.elementHeight;
            object.screenTopSpace = object.elementTop - object.minPosition;
            return object;
        },

        close: function (instant) {
            var autocompleteOptions = $(".autocomplete__options");
            $(window).off("resize.autocomplete");
            $(window).off("blur.autocomplete");
            var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
            body.off("scroll.autocomplete");
            if (instant) {
                var id = autocompleteOptions.attr("id").split("options-").join("");
                autocompleteOptions.remove();
                $("#" + id).blur();
            } else {
                autocompleteOptions.css({ "overflow-y": "hidden", "height": "0px" }).removeClass("autocomplete__options--show");
                autocompleteOptions.on("transitionend", function () {
                    autocompleteOptions.remove();
                });
            }
            this.inputMatchesData();
        },

        highlight: function (value, text) {
            var start = text.toLowerCase().indexOf(value.toLowerCase());
            if (start > -1) {
                return text.substring(0, start) + "<span class='autocomplete-highlight'>" + text.substring(start, start + value.length) + "</span>" + text.substring(start + value.length);
            }
            return text;
        },

        inputMatchesData: function () {

            var value = this.$element.val();
            for (var i = 0; i < this.dataCache.length; i++) {
                if (value.toLowerCase() == this.dataCache[i].toLowerCase()) {
                    this.$element.attr("data-item-exist", "true");
                    return;
                }
            }
            this.$element.attr("data-item-exist", "false");

        },

        searchComplete: function (element, results) {

            var _this = element.data("mAutocomplete");
            _this.$element.data("stopLoading")();
            if (_this.$element.val() == element.val()) {

                _this.latestResults = results;
                var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
                body.one("scroll.autocomplete", function () { _this.close(true) });
                $(window).one("resize.autocomplete", function () { _this.close(true) });

                //Create list
                var options = _this.$element.find("option");
                var autoCompleteIsOpen = true;
                var autocompleteOptions = $("#options-" + _this.$element.attr("id")).html("");
                if (autocompleteOptions.length == 0) {
                    autocompleteOptions = $("<ul />", { "class": "autocomplete__options", "id": "options-" + _this.$element.attr("id") });
                    autoCompleteIsOpen = false;
                    autocompleteOptions.on("mousedown", ".autocomplete__option", function () {
                        _this.$element.val($(this).text());
                        if (_this.settings.onSelect) _this.settings.onSelect();
                        _this.latestResults = null;
                    });
                }
                $("body").append(autocompleteOptions);

                //Append the options
                for (var i = 0; i < results.length; i++) {
                    if (_this.settings.maxItems != 0 && _this.settings.maxItems == i) break;
                    var result = results[i];

                    var text = _this.highlight(element.val(), result);
                    autocompleteOptions.append($("<li />", { "class": "autocomplete__option ", "html": text }));
                }
                if (results.length == 0) {
                    autocompleteOptions.addClass("hidden");
                } else {
                    autocompleteOptions.removeClass("hidden");
                }
                autocompleteOptions.css("height", "");
                autocompleteOptions.offset();
                var autocompleteHeight = autocompleteOptions.height();

                if (autoCompleteIsOpen == false || autocompleteHeight == 0) {
                    var measurements = _this.measure(element);

                    autocompleteOptions.css("height", "0px");
                    autocompleteOptions.offset();

                    autocompleteOptions.removeClass("autocomplete__options--bottom autocomplete__options--top");
                    if (measurements.screenBottomSpace < 150) {
                        autocompleteOptions.addClass("autocomplete__options--top").css({
                            "top": "auto",
                            "bottom": measurements.maxPosition + 25 - measurements.elementTop,
                            "left": measurements.elementLeft,
                            "width": measurements.elementWidth,
                            "max-height": measurements.screenTopSpace,
                            "height": autocompleteHeight
                        });
                    } else {
                        autocompleteOptions.addClass("autocomplete__options--bottom").css({
                            "top": measurements.elementTop + measurements.elementHeight,
                            "bottom": "auto",
                            "left": measurements.elementLeft,
                            "width": measurements.elementWidth,
                            "max-height": measurements.screenBottomSpace,
                            "height": autocompleteHeight
                        });
                    }
                    autocompleteOptions.addClass("autocomplete__options--show");
                    autocompleteOptions.on("transitionend", function (e) {
                        if (e.originalEvent.propertyName == "height") {
                            autocompleteOptions.css({ "overflow-y": "auto", "height": "auto" });
                        }
                    });
                } else {
                    autocompleteOptions.css("height", autocompleteHeight);
                }

            }

        },

        suggest: function () {

            this.settings.search(this.$element, this.searchComplete);
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
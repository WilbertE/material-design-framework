; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mDropdown",
    defaults = {};

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mDropdown", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        collapse: function ($element) {
            var dropdown = $element.closest(".dropdown-wrapper").find(".dropdown-button");
            dropdown.removeClass("dropdown-button--active");
            var dropdownOptions = $("#options-" + dropdown.attr("id"));
            if (this.measuring) {
                dropdownOptions.remove();
            } else {
                dropdownOptions.removeClass("dropdown-button__options--show");
                dropdownOptions.one("transitionend", function () { dropdownOptions.remove(); });
            }
        },

        expand: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            dropdown.addClass("dropdown-button--active");

            //Calculate position and size
            var calculateMeasurements = function (dropdown, dropdownOptions, selectedOption) {
                var object = new Object();
                object.width = "calc(" + dropdown.outerWidth() + "px + 1.6rem)";
                object.offset = new Object()
                object.offset.left = "calc(" + dropdown.offset().left + "px - 0.8rem)";
                object.offset.top = dropdown.offset().top;
                object.origin = 0;
                object.selectedOptionTop = 0;
                if (selectedOption.length > 0) {
                    object.origin = Math.round(selectedOption.width() / 2) + "px " + Math.round(selectedOption.position().top * 2 + (selectedOption.outerHeight())) + "px";
                    object.offset.top -= selectedOption.index() * selectedOption.outerHeight();
                }

                //When positioned offscreen
                if (object.offset.top < 25) object.offset.top = 25;
                var endPosition = object.offset.top + dropdownOptions.outerHeight();
                var maxPosition = $(window).height() - 25
                if (endPosition > maxPosition) object.offset.top = maxPosition - dropdownOptions.outerHeight();

                object.offset.top = object.offset.top + "px";
                return object;
            }

            //Create the drop down
            var options = this.$element.find("option");
            var dropdownOptions = $("<ul />", { "class": "dropdown-button__options", "id": "options-" + dropdown.attr("id") });
            $("body").append(dropdownOptions);

            //Append the options
            for (var i = 0; i < options.length; i++) {
                var selected = ($(options[i]).val() == this.$element.val()) ? "dropdown-button__option--selected" : "";
                dropdownOptions.append($("<li />", { "class": "dropdown-button__option " + selected, "data-value": $(options[i]).val(), "text": $(options[i]).text(), }));
            }

            var selectedOption = dropdownOptions.find(".dropdown-button__option--selected");
            var measurements = calculateMeasurements(dropdown, dropdownOptions, selectedOption);
            dropdownOptions.css({
                "width": measurements.width,
                "left": measurements.offset.left,
                "top": measurements.offset.top
            });

            if (this.measuring) {
                dropdownOptions.css({ "width": "100%", "opacity": "0", "pointer-events": "none" });
                dropdownOptions.find(".dropdown-button__option").css("display", "inline-block");
            } else {

                //scroll item in view if needed
                if (dropdownOptions.get(0).scrollHeight > dropdownOptions.height()) {
                    dropdownOptions.scrollTop(selectedOption.position().top);
                }

                //Make the dropdown list visible
                dropdownOptions.offset();
                dropdownOptions.addClass("dropdown-button__options--show");

            }
        },

        val: function (value) {
            this.$element.val(value);
            var text = this.$element.find("option[value='" + value + "']").text();
            if (text) {
                this.$element.closest(".dropdown-wrapper").find(".dropdown-button__value").attr("data-value", value).text(text);
                var $fieldset = this.$element.closest("fieldset");
                if ($fieldset.length > 0) {
                    $fieldset.addClass("fieldset--filled");
                }
            }
        },

        disable: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            this.$element.prop("disable", true);
            dropdown.addClass("dropdown-button--disabled");

        },

        enable: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            this.$element.prop("disable", true);
            dropdown.removeClass("dropdown-button--disabled");
        },

        init: function () {
            var _this = this;

            //Create guid
            var guid = function () {
                function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            }

            //Create element
            var id = guid();
            var $fieldset = this.$element.closest("fieldset");
            var $helper = $fieldset.find(".input-helper");
            var $icon = $fieldset.find(".input-icon");
            this.$element.wrap($("<div />", { "class": "dropdown-wrapper" }));
            var wrapper = this.$element.closest(".dropdown-wrapper");
            var dropdown = $("<div />", { "class": "dropdown-button", "id": id });
            dropdown.append($("<div />", { "class": "dropdown-button__value" }));
            dropdown.append($("<i />", { "class": "dropdown-button__arrow material-icons", "html": "&#xE5C5;" }));
            wrapper.append(dropdown);

            $fieldset.addClass("fieldset--dropdown");
            if ($helper.length > 0) {
                $fieldset.addClass("fieldset--helper");
            }

            if ($icon.length > 0) {
                $fieldset.addClass("fieldset--icon");
            }

            //Get selected option and update value
            var selectedOption = this.$element.find("option:selected");
            if (selectedOption.attr("selected")) {
                this.val(selectedOption.val(), selectedOption.text());
            }

            var measure = function () {
                _this.measuring = true;
                _this.expand();
                var widestOption = 0;
                $("#options-" + id + " .dropdown-button__option").each(function () {
                    if ($(this).outerWidth() > widestOption) widestOption = $(this).outerWidth();
                });
                dropdown.css("min-width", Math.ceil(widestOption) + "px");
                _this.collapse(_this.$element);
                _this.measuring = false;
            }

            measure();
            $(window).on("resize", function () {
                measure();
            });

            if (this.$element.prop("disabled")) {
                this.disable();
            }

            //Show list on click
            dropdown.on("click", function () {

                if ($(this).hasClass("dropdown-button--disabled") == false) {
                    _this.expand();

                    //Close on scroll
                    var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
                    body.one("scroll.dropdown", function () { _this.collapse(_this.$element) });

                    //On click collapse and if item is selected update value
                    $(document).on("mousedown.dropdownclick", function (e) {
                        var target = $(e.target);
                        if (target.hasClass("dropdown-button__options")) {
                            return;
                        } else if (target.hasClass("dropdown-button__option")) {
                            target.closest(".dropdown-button__options").find(".dropdown-button__option--selected").removeClass("dropdown-button__option--selected");
                            target.addClass("dropdown-button__option--selected");
                            _this.val(target.attr("data-value"));
                        }
                        $(document).off("mousedown.dropdownclick");
                        _this.collapse(_this.$element);
                    });
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
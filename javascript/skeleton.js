
; (function ($, window, document, undefined) {

    var pluginName = "mSkeleton",
        defaults = {};

    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;
        if (options == null) {
            this.init();
        } else if (options == "reveal") {
            this.reveal();
        }
    }

    Plugin.prototype = {

        init: function () {

            //Transform images
            this.$element.find(".skeleton-image, .sub-skeleton-image").each(function () {

                //Still download image
                var preloader = $("<div />", { "class": "preloader", "style": "height:0; width:0; visibility:hidden; overflow-hidden; position:absolute; top: -99999px; left: -9999px;" });
                $("body").append(preloader);
                var image = $("<img />");
                image[0].onload = function () { $(this).parent().remove(); }
                image.attr("src", $(this).attr("src"));
                preloader.append(image);



                $(this).attr("data-src", $(this).attr("src"))
                    .css({ "width": $(this).width(), "height": $(this).height() })
                    .attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
            });
        },

        reveal: function () {
            this.$element.find(".skeleton-image").each(function () {

                //Change image to transparent image
                $(this).attr("src", $(this).attr("data-src"))
                    .css({ "width": "", "height": "" })
                    .removeAttr("data-src");
            });

            this.$element.find(".skeleton-title").removeClass("skeleton-title");
            this.$element.find(".skeleton-lines").removeClass(function (index, className) {
                return (className.match(/(^|\s)skeleton-\S+/g) || []).join(' ');
            });
            this.$element.find(".skeleton-textarea").removeClass("skeleton-textarea");
            this.$element.find(".skeleton-input").removeClass("skeleton-input");
            this.$element.find(".skeleton-button").removeClass("skeleton-button");
            this.$element.find(".skeleton-dropdown").removeClass("skeleton-dropdown");
            this.$element.removeClass("skeleton");
            this.$element.find(".skeleton").removeClass("skeleton");
        },

        revealsub: function () {
            this.$element.find(".sub-skeleton-image").each(function () {

                //Change image to transparent image
                $(this).attr("src", $(this).attr("data-src"))
                    .css({ "width": "", "height": "" })
                    .removeAttr("data-src");
            });

            this.$element.find(".sub-skeleton-title").removeClass("skeleton-title");
            this.$element.find(".sub-skeleton-lines").removeClass(function (index, className) {
                return (className.match(/(^|\s)skeleton-\S+/g) || []).join(' ');
            });
            this.$element.find(".sub-skeleton-textarea").removeClass("skeleton-textarea");
            this.$element.find(".sub-skeleton-input").removeClass("skeleton-input");
            this.$element.find(".sub-skeleton-button").removeClass("skeleton-button");
            this.$element.find(".sub-skeleton-dropdown").removeClass("skeleton-dropdown");
            this.$element.removeClass("sub-skeleton");
            this.$element.find(".sub-skeleton").removeClass("sub-skeleton");
        }


    };

    $.fn[pluginName] = function (options) {

        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);


$.mSkeleton = {

    start: function (section) {

        if (section == null) section = "body";

        //Transform images
        $(section + " .skeleton-image").each(function () {

            //Change image to transparent image
            $(this).attr("data-src", $(this).attr("src"))
                .css({ "width": $(this).width(), "height": $(this).height() })
                .attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
        });

        $(section).addClass("skeleton");

        //Inputs
        $(section + " fieldset input").closest("fieldset").addClass("skeleton-input");

        //Textarea
        $(section + " fieldset textarea").closest("fieldset").addClass("skeleton-textarea");

        //Button
        $(".flat-button, .raised-button").addClass("skeleton-button");

        //Dropdown
        $("fieldset select").closest("fieldset").addClass("skeleton-dropdown");
    }

}
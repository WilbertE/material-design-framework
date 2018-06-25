
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
        } else if (options == "revealsub") {
            this.revealsub();
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
            this.$element.find(".skeleton").removeClass("skeleton");
            this.$element.find(".skeleton-list").removeClass("skeleton-list");
            this.$element.find(".skeleton-loader").removeClass("skeleton-loader");
            this.$element.removeClass("skeleton-loader skeleton-title skeleton-lines skeleton-textarea skeleton-input skeleton-button skeleton-dropdown "+
                " skeleton skeleton-list skeleton-loader skeleton-table-column-short skeleton-table-column");
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
            this.$element.find(".sub-skeleton").removeClass("sub-skeleton");
            this.$element.find(".sub-skeleton-list").removeClass("sub-skeleton");
            this.$element.find(".sub-skeleton-loader").removeClass("skeleton-loader");
            this.$element.removeClass("sub-skeleton-loader sub-skeleton-title sub-skeleton-lines sub-skeleton-textarea sub-skeleton-input sub-skeleton-button sub-skeleton-dropdown " +
                " sub-skeleton sub-skeleton-list sub-skeleton-loader sub-skeleton-table-column-short sub-skeleton-table-column ");
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

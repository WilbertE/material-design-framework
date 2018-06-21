$.mTextfields = function () {


    $("input, textarea").closest("fieldset:not(.initialized)").each(function () {
        var $fieldset = $(this).addClass("initialized");
        var $input = $fieldset.find("input, textarea");
        var $helper = $fieldset.find(".input-helper");
        var $label = $fieldset.find("label");
        var $icon = $fieldset.find(".input-icon");
        var $functionIcon = $fieldset.find(".function-icon");
        var $suffix = $fieldset.find(".suffix");
        var $prefix = $fieldset.find(".prefix");

        if ($helper.length == 0 && $input.hasClass("input--validate")) $fieldset.append($("<div />", { "class": "input-helper" }));
        $fieldset.data("helperText", $helper.text());
        $helper = $fieldset.find(".input-helper");

        if ($label.length == 0) {
            $fieldset.addClass("fieldset--no-label");
        }
        if ($functionIcon.length > 0) {
            $fieldset.addClass("fieldset--function-icon");
        }
        if ($helper.length > 0) {
            $fieldset.addClass("fieldset--helper");
        }
        if ($icon.length > 0) {
            $fieldset.addClass("fieldset--icon");
        }
        if ($prefix.length > 0) {
            $fieldset.addClass("fieldset--prefix");
        }
        if ($input.prop("tagName").toLowerCase() == "textarea") {
            $fieldset.addClass("fieldset--textarea");
        }

        var prefixAndSuffix = function () {
            if ($prefix.length > 0) {
                var prefixWidth = $prefix.outerWidth() + 10;
                var iconWidth = ($icon.length > 0) ? $icon.outerWidth() : 0;
                $input.css({ "padding-left": (prefixWidth) + "px", "width": "calc(100% - " + (prefixWidth + iconWidth) + "px)" });
            }

            if ($suffix.length > 0) {
                var suffixWidth = $suffix.outerWidth() + 10;
                var iconWidth = ($icon.length > 0) ? $icon.outerWidth() : 0;
                $input.css({ "padding-right": suffixWidth + "px", "width": "calc(100% - " + (suffixWidth + iconWidth) + "px)" });
            }
        }
        prefixAndSuffix();
        $(window).on("resize", prefixAndSuffix);



        //Removes a validation icon
        var removeIcon = function (icon) {
            var $icon = $fieldset.find(".input-" + icon + "-icon")
            $icon.removeClass("input-" + icon + "-icon--show");
            $icon.one("transitionend", function () { $icon.remove(); });
        }

        //Adds a validation icon
        var addIcon = function (icon, iconName) {
            $fieldset.append("<div class=\"input-" + icon + "-icon\"><i class=\"" + iconName + "\"></i></div>");
            $fieldset.offset();
            $fieldset.find(".input-" + icon + "-icon").addClass("input-" + icon + "-icon--show");
        }

        $input.data("error", function (errorMessage) {
            removeIcon("loading");
            if (!errorMessage) errorMessage = $input.attr("data-error");
            $fieldset.addClass("fieldset--error fieldset--shake");
            $fieldset.on("animationend", function () { $fieldset.removeClass("fieldset--shake"); })
            $helper.text(errorMessage);
            addIcon("error", "fas fa-exclamation-circle");
            console.log("ADDERR", $fieldset);

        });

        $input.data("valid", function () {
            removeIcon("loading");
            addIcon("valid", "fas fas fa-check");
        });

        $input.data("loading", function () {
            addIcon("loading", "fas fa-spinner fa-pulse");
        });

        $input.data("removeValidation", function () {
            if ($fieldset.hasClass("fieldset--error")) {
                $fieldset.removeClass("fieldset--error");
                $helper.text($fieldset.data("helperText"));
                removeIcon("error");
            }
            removeIcon("loading");
            removeIcon("valid");

        });

        $input.data("validate", function (forced) {
            var pattern = $input.attr("pattern");

            if (pattern != null) {
                var regex = new RegExp(pattern);
                var valid = regex.test($input.val());

                if (valid) {
                    $input.data("valid")();
                    return true;
                } else if ($input.val() != "" || forced == true) {
                    $input.data("error")();
                    return false;
                }
            } else if ($input.is(":invalid") || ($input.val() == "" && forced == true)) {
                $input.data("error")();
                return false;
            } else if ($input.is(":valid") && $input.val() != "") {
                $input.data("valid")();
                return true;
            }
        })

        $input.on("focus", function () {
            $input.attr("data-ts", Date.now());
            $fieldset.addClass("fieldset--active");
            $input.data("removeValidation")();
        }).on("blur", function () {

            $fieldset.removeClass("fieldset--active");
            if ($input.val() != "") {
                $fieldset.addClass("fieldset--filled");
            } else {
                $fieldset.removeClass("fieldset--filled");
            }

            if ($input.hasClass("input--validate")) {
                $input.data("validate")();
            }
        });

        var checkDisabled = function () {
            if ($input.prop("disabled")) {
                $fieldset.addClass("fieldset--disabled");
            } else {
                $fieldset.removeClass("fieldset--disabled");
            }
        }
        checkDisabled();
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.type == "attributes") {
                    checkDisabled();
                }
            });
        });
        observer.observe($input.get(0), {
            attributes: true
        });



        $fieldset.on("click", function (e) {
            e.preventDefault();
            if ($fieldset.hasClass("fieldset--disabled") == false) {
                if ($(e.target).hasClass("js-input-clear") || $(e.target).closest(".js-input-clear").length > 0) {
                    if ($input.prop("disabled") == false) $input.val("");
                    $fieldset.removeClass("fieldset--active fieldset--filled");
                } else if ($(e.target).hasClass("js-input-view-password") || $(e.target).closest(".js-input-view-password").length > 0) {
                    if ($input.attr("type") == "text") {
                        $input.attr("type", "password");
                        $fieldset.find(".js-password-show-icon").removeClass("hidden");
                        $fieldset.find(".js-password-hidden-icon").addClass("hidden");
                    } else {
                        $input.attr("type", "text");
                        $fieldset.find(".js-password-hidden-icon").removeClass("hidden");
                        $fieldset.find(".js-password-show-icon").addClass("hidden");
                    }
                }
            }

        });

    });

}
"use strict";

$.mHamburger = function () {

    $(".hamburger").each(function () {

        if ($(this).data("initialized") == null) {
            $(this).data("initialized", true);
            $(this).off("click").on("click", function (e) {
                $(this).toggleClass("hamburger--open");
            });
        }
    });
}

"use strict";

$.mHamburger = function () {

    $(".hamburger").each(function () {
        var _this = this;
        if (!$(this).hasClass("js-initialized")) {
            setTimeout(function () {
                $(_this).addClass("js-initialized");
            }, 500);

            $(this).off("click").on("click", function (e) {
                $(this).toggleClass("hamburger--open");
            });
        }
    });
}

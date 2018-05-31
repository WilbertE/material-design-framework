$(function () {
    $("pre").on("click", function (e) {
        e.preventDefault();
        if ($(e.target).is("code") == false && $(e.target).closest("code").length == 0) {
            $(this).toggleClass("show").find("code").slideToggle();
        }
    });

    hljs.initHighlightingOnLoad();


});
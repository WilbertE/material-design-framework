
$.mButtons = function () {


    //Flat and raised buttons

    $(".raised-button, .flat-button").each(function () {
        if ($(this).attr("data-ripple") == null) {
            var color = $(this).css("color");
            $(this).attr("data-ripple", color);
        }
    })
}

$(function () {
    if (!Modernizr.touchevents) {
        $(document).on("mousedown", ".raised-button", function () {
            var $self = $(this);
            $self.addClass("raised-button--pressed").one("transitionend", function () { $self.removeClass("raised-button--pressed"); });
        });
    }
});
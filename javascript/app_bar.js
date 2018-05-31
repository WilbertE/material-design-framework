$.mAppBar = function () {

    if ($(".app-bar.app-bar--hide-scroll").length > 0) {
        var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
        var prevScrollpos = body.scrollTop();
        body.on("scroll.appbar", function () {
            var currentScrollPos = body.scrollTop();
            if (prevScrollpos < currentScrollPos && currentScrollPos > 100) {
                $(".app-bar.app-bar--hide-scroll").addClass("app-bar--hide-scroll-hidden")
            } else {
                $(".app-bar.app-bar--hide-scroll").removeClass("app-bar--hide-scroll-hidden");
            }
            prevScrollpos = currentScrollPos;
        });
    }

}
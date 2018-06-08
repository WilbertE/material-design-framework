$.mSkeleton = {

    start: function () {
        //Transform images
        $(".skeleton-image").each(function () {

            //Change image to transparent image

            $(this).attr("data-src", $(this).attr("src"))
                .css({ "width": $(this).width(), "height": $(this).height() })
                .attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
        });
    },
    reveal: function (section) {

        if (section == null) section = "body";

        console.log("OK");
        $(section + " .skeleton-lines").removeClass(function (index, className) {
            return (className.match(/(^|\s)skeleton-\S+/g) || []).join(' ');
        });

        $(section +" .skeleton-image").each(function () {

            //Change image to transparent image

            $(this).attr("src", $(this).attr("data-src"))
                .css({ "width": "", "height": "" })
                .removeAttr("data-src");
        });

    }

}
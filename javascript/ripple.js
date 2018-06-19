$(function () {

    $(document).on("mousedown", "[data-ripple]:not(.raised-button--disabled):not(.flat-button--disabled), .button-icon ", function (e) {
        var $self = $(this);

        if ($self.is(".btn-disabled")) {
            return;
        }
        var $fieldset = $self.closest("fieldset");
        if ($fieldset.length > 0) {
            if ($fieldset.hasClass("fieldset--disabled")) return;
        }
        //if ($self.closest("[data-ripple]")) {
        //    e.stopPropagation();
        //}

        var initPos = $self.css("position"),
            offs = $self.offset(),
            x = e.pageX - offs.left,
            y = e.pageY - offs.top,
            dia = Math.min(this.offsetHeight, this.offsetWidth, 50),
            $ripple = $('<div/>', { class: "ripple", appendTo: $self });

        if (!initPos || initPos === "static") {
            $self.css({ position: "relative" });
        }

        var width = $self.width() * 3;
        var maxTiming = 2000;
        var timing = Math.round(maxTiming - width);
        if (timing < 800) timing = 800;

        $('<div/>', {
            class: "rippleWave",
            css: {
                background: $self.data("ripple"),
                width: dia,
                height: dia,
                left: x - (dia / 2),
                top: y - (dia / 2),
                "animation-duration": timing + "ms"
            },
            appendTo: $ripple,
            one: {
                animationend: function () {
                    $ripple.remove();
                }
            }
        });
    });

});
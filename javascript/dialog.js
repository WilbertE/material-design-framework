$.mDialog = function (options) {


    var _this = this;
    this.close = function () {
        _this.overlay.removeClass("m-overlay--show");
        _this.overlay.on("transitionend", function () { _this.overlay.remove(); });
        _this.settings.onClose();
    }

    defaults = {
        title: "",
        content: "",
        buttons: [{ text: "OK", onClick: function () { }, "class": "" }],
        onOpen: function () { },
        onClose: function () { }
    }
    _this.settings = $.extend({}, defaults, options);

    _this.overlay = $("<div />", { "class": "m-overlay m-overlay-dialog " });

    _this.dialog = $("<div />", { "class": "dialog dialog--alert" });

    if (_this.settings.title != '') _this.dialog.append($("<div />", { "class": "dialog__header" }).html(_this.settings.title));
    if (typeof _this.settings.content.replace === "function") {
        _this.settings.content = _this.settings.content.replace(/\n/g, "<br />");
    }
    _this.dialog.append($("<div />", { "class": "dialog__content" }).html(_this.settings.content));


    _this.buttons = $("<div />", { "class": "dialog__buttons" });
    for (i = 0; i < _this.settings.buttons.length; i++) {
        var button = $("<button />", { "class": "flat-button " + _this.settings.buttons[i].class }).text(_this.settings.buttons[i].text);
        if (_this.settings.buttons[i].onClick) button.on("click", _this.settings.buttons[i].onClick);
        button.on("click", function () {
            _this.close();
        });
        _this.buttons.append(button);
    }
    _this.dialog.append(_this.buttons);
    _this.overlay.append(_this.dialog);
    $("body").append(_this.overlay);
    _this.overlay.offset();
    _this.overlay.addClass("m-overlay--show");
    $.mButtons();
    _this.settings.onOpen();

    return this;


}
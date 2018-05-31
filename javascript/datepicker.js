; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mDatepicker",
    defaults = {
        activeDate: new Date(),
        showMonth: null,
        rippleColor: "#cf5260",
        daynamesShort: ["zo", "ma", "di", "wo", "do", "vr", "za"],
        daynamesLetter: ["z", "m", "d", "w", "d", "v", "z"],
        monthnamesShort: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
        monthnamesLong: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
        minDate: moment("1700-01-01").toDate(),
        maxDate: moment("3000-12-31").toDate(),
        selectOnClick: false,
        closeOnClickoutside: true,
        returnFormat: 'D-M-YYYY'
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.$input = null;
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this.animationBusy = false;
        this.dateChangeAnimationBusy = false;
        this.activeMonth = null;
        this.showYear = null;
        this._defaults = defaults;
        this._name = pluginName;
        this.yearActive = false;
        this.init();
        $(this.element).data("mDatepicker", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        createFrame: function () {

            var frame = $("<div />", { "class": "date-picker" });

            var header = $("<div />", { "class": "date-picker__header" });
            header.append($("<div />", { "class": "date-picker__year-wrapper" })
                .append($("<div />", { "class": "date-picker__year--reel" })));
            header.append($("<div />", { "class": "date-picker__date-wrapper date-picker--active" })
                .append($("<div />", { "class": "date-picker__date--reel" })));
            frame.append(header);

            var controls = $("<div />", { "class": "date-picker__controls" });
            controls.append($("<div />", { "class": "date-picker__month-arrow date-picker__month-arrow--prev" })
                .append($("<div />", { "class": "button-icon" }).attr("data-ripple", this.settings.rippleColor)
                .append($("<i />", { "class": "fas fa-angle-left" }))));

            controls.append($("<div />", { "class": "date-picker__month-reel-wrapper" }).append($("<div />", { "class": "date-picker-month-reel" })));

            controls.append($("<div />", { "class": "date-picker__month-arrow date-picker__month-arrow--next" })
                .append($("<div />", { "class": "button-icon" }).attr("data-ripple", this.settings.rippleColor)
                .append($("<i />", { "class": "fas fa-angle-right" }))));
            frame.append(controls);

            frame.append($("<div />", { "class": "date-picker__reel" }));

            if (this.settings.selectOnClick == false) {
                var buttons = $("<div />", { "class": "date-picker__buttons" })
                    .append($("<div />", { "class": "flat-button flat-button--agree", text: "Ok" }))
                    .append($("<div />", { "class": "flat-button flat-button--cancel", text: "Cancel" }));
                frame.append(buttons);
            }
            if (this.$input == null) this.$input = this.$element;
            this.$element = frame;
            $("body").append(frame);
        },

        capitalizeFirstCharacter: function (str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        },

        showYearsList: function (direction) {
            var _this = this;
            if (this.showYear == null) this.showYear = moment(_this.settings.showMonth).year();
            var minYear = this.showYear - 9;
            var maxYear = this.showYear + 10;
            this.yearActive = true;

            if (minYear <= this.settings.maxDate.getFullYear() && maxYear >= this.settings.minDate.getFullYear()) {
                var currentTable = $(".date-picker-years-table").addClass("date-picker-years-table--prev-table");


                var _this = this;
                var table = $("<table/>", { "class": "date-picker-years-table date-picker-years-table--new-table" });
                var tr;
                var yearCounter = minYear;
                for (var i = 0; i < 20; i++) {
                    if (i % 4 == 0 || i == 0) {
                        if (tr) table.append(tr);
                        tr = $("<tr/>", { "class": "date-picker-years-table__row" });
                    }
                    var td = $("<td/>", { "class": "date-picker-years-table__cell" });
                    var year = $("<div/>", { "class": "date-picker-years-table__year" }).attr("data-ripple", this.settings.rippleColor);
                    if (Number(_this.$element.find(".date-picker__month-year").text()) == yearCounter) year.addClass("date-picker-years-table__year--selected");

                    if (yearCounter < this.settings.minDate.getFullYear()) year.addClass("date-picker-years-table__year--disabled");
                    if (yearCounter > this.settings.maxDate.getFullYear()) year.addClass("date-picker-years-table__year--disabled");

                    td.append(year.attr("data-year", yearCounter).text(yearCounter));
                    tr.append(td);
                    yearCounter += 1;
                }
                if (tr.find("td").length > 0) table.append(tr);
                _this.$element.find(".date-picker__reel__slide").prepend(table);


                if (currentTable.length == 0) {
                    table.offset();
                    table.addClass("date-picker-years-table--show");
                } else {
                    table.addClass("date-picker-years-table--show");
                    _this.$element.find(".date-picker__reel__slide .date-picker-years-table").addClass((direction == "prev") ?
                        "date-picker-years-table--slide-left" : "date-picker-years-table--slide-right");
                    table.offset();
                    _this.$element.find(".date-picker__reel__slide .date-picker-years-table").addClass("date-picker-years-table--slide--active");
                }


                table.on("transitionend", function () {
                    table.removeClass("date-picker-years-table--new-table date-picker-years-table--slide-right date-picker-years-table--slide-left date-picker-years-table--slide--active");
                    currentTable.remove();
                    _this.checkNextPrevBtn();
                });

                var $monthButton = _this.$element.find(".date-picker__month-month");
                $monthButton.addClass("date-picker__month-month--disabled");

                var enableButtons = function () {
                    $monthButton.removeClass("date-picker__month-month--disabled");
                    _this.checkNextPrevBtn();
                }

                $(".date-picker__month-year").one("click", function (e) {
                    table.removeClass("date-picker-years-table--show");
                    table.on("transitionend", function () { table.remove(); });
                    enableButtons();
                    e.stopPropagation();
                    _this.yearActive = false;
                });

                table.on("click", function (e) {
                    var $target = $(e.target);
                    if ($target.hasClass("date-picker-years-table__year--selected")) {
                        table.removeClass("date-picker-years-table--show");
                        $(".date-picker__reel").on("transitionend", function () {
                            table.remove();
                        });
                    } else if ($target.hasClass("date-picker-years-table__year") && $target.hasClass("date-picker-years-table__year--disabled") == false) {
                        var year = $target.attr("data-year");
                        _this.settings.showMonth = moment(_this.settings.activeDate).year(year).toDate();
                        _this.$element.find(".date-picker__month-year").text(year);
                        _this.changeMonth();
                        $(".date-picker__reel").on("transitionend", function () {
                            table.remove();
                        });
                        _this.yearActive = false;
                    }
                    $(".date-picker__month-year").off("click");
                    enableButtons();
                });
            }
        },

        checkNextPrevBtn: function () {

            var calendarTable = this.$element.find(".date-picker-table");
            var firstDate = moment(calendarTable.find(".date-picker__calendar-cell .date-picker__calendar-date").first().attr("data-date"));
            var lastDate = moment(calendarTable.find(".date-picker__calendar-cell .date-picker__calendar-date").last().attr("data-date"));
            var $prevArrow = this.$element.find(".date-picker__month-arrow.date-picker__month-arrow--prev");
            var $nextArrow = this.$element.find(".date-picker__month-arrow.date-picker__month-arrow--next");

            if (this.yearActive == true) {
                calendarTable = this.$element.find(".date-picker-years-table");
                var firstDate = moment(calendarTable.find(".date-picker-years-table__year").first().attr("data-year") + "-01-01");
                var lastDate = moment(calendarTable.find(".date-picker-years-table__year").last().attr("data-year") + "-12-31");
            }


            if (this.settings.minDate != null) {
                if (firstDate.toDate() <= this.settings.minDate) {
                    $prevArrow.addClass("date-picker__month-arrow--disabled");
                } else {
                    $prevArrow.removeClass("date-picker__month-arrow--disabled");
                }
            }

            if (this.settings.maxDate != null) {
                if (lastDate.toDate() >= this.settings.maxDate) {
                    $nextArrow.addClass("date-picker__month-arrow--disabled");
                } else {
                    $nextArrow.removeClass("date-picker__month-arrow--disabled");
                }
            }


        },

        showMonthsList: function () {
            if (this.$element.find(".date-picker-months-table").length == 0) {
                var _this = this;
                var table = $("<table/>", { "class": "date-picker-months-table" });
                var tr;
                for (var i = 0; i < this.settings.monthnamesShort.length; i++) {
                    if (i % 3 == 0 || i == 0) {
                        if (tr) table.append(tr);
                        tr = $("<tr/>", { "class": "date-picker-months-table__row" });
                    }
                    var td = $("<td/>", { "class": "date-picker-months-table__cell" });
                    var month = $("<div/>", { "class": "date-picker-months-table__month" }).attr("data-ripple", this.settings.rippleColor);
                    if (this.activeMonth.getMonth() == i) month.addClass("date-picker-months-table__month--selected")

                    td.append(month.attr("data-month", i).text(this.capitalizeFirstCharacter(this.settings.monthnamesShort[i])));
                    var d = moment(Number($(".date-picker__month-year").text()) + "-" + ('0' + (i + 2)).slice(-2) + "-01");
                    if (d.toDate() < this.settings.minDate) month.addClass("date-picker-months-table__month--disabled");
                    d = moment(Number($(".date-picker__month-year").text()) + "-" + ('0' + (i + 1)).slice(-2) + "-01");

                    if (d.toDate() > this.settings.maxDate) month.addClass("date-picker-months-table__month--disabled");
                    tr.append(td);
                }
                if (tr.find("td").length > 0) table.append(tr);
                _this.$element.find(".date-picker__reel__slide").prepend(table);
                table.offset();
                table.addClass("date-picker-months-table--show");

                var $arrowLeft = _this.$element.find(".date-picker__month-arrow.date-picker__month-arrow--prev");
                var $arrowRight = _this.$element.find(".date-picker__month-arrow.date-picker__month-arrow--next");
                var $yearButton = _this.$element.find(".date-picker__month-year");
                $arrowLeft.addClass("date-picker__month-arrow--disabled");
                $arrowRight.addClass("date-picker__month-arrow--disabled");
                $yearButton.addClass("date-picker__month-year--disabled");

                var enableButtons = function () {
                    $arrowLeft.removeClass("date-picker__month-arrow--disabled");
                    $arrowRight.removeClass("date-picker__month-arrow--disabled");
                    $yearButton.removeClass("date-picker__month-year--disabled");
                    _this.checkNextPrevBtn();
                }

                $(".date-picker__month-month").one("click", function (e) {
                    table.removeClass("date-picker-months-table--show");
                    table.on("transitionend", function () { table.remove(); });
                    enableButtons();
                });

                table.on("click", function (e) {
                    var $target = $(e.target);
                    if ($target.hasClass("date-picker-months-table__month") && $target.hasClass("date-picker-months-table__month--disabled") == false) {
                        var month = $target.attr("data-month");
                        if (month == moment(_this.settings.showMonth).month()) {
                            table.removeClass("date-picker-months-table--show");
                            table.on("transitionend", function () { table.remove(); });
                        } else {
                            var date = moment(_this.settings.showMonth).month(month);
                            _this.changeMonth(date.toDate());
                        }
                        $(".date-picker__month-month").off("click");
                        enableButtons();
                    }
                });
            }
        },

        createMonthCalendar: function (date) {

            var table = $("<table/>", { "class": "date-picker-table" });
            var activeDate = moment(this.settings.activeDate);

            //Get first and lastday of the months
            var startDate = moment(date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-01");
            var endDate = moment(date.getFullYear() + "-" + ('0' + (date.getMonth() + 1)).slice(-2) + "-" + startDate.clone().endOf('month').format('DD'));
            var firstDayNr = startDate.day();

            //Set startdate a bit back to the first monday
            if (firstDayNr == 0) firstDayNr = 7;
            startDate.subtract(firstDayNr - 1, 'days');

            //Create head with day letters
            var daysRow = $("<tr/>", { "class": "date-picker__calendar-head" });
            for (var i = 1; i < this.settings.daynamesLetter.length; i++) {
                daysRow.append($("<td/>", { "class": "date-picker__calendar-dayname", "text": this.settings.daynamesLetter[i] }));
            }
            daysRow.append($("<td/>", { "class": "date-picker__calendar-dayname", "text": this.settings.daynamesLetter[this.settings.daynamesLetter.length - 1] }));
            table.append(daysRow);

            //Create calendar
            var daysBetweenDates = endDate.diff(startDate, 'days');
            var tr;
            for (var i = 0; i <= daysBetweenDates; i++) {

                if (i % 7 == 0 || i == 0) {
                    if (tr) table.append(tr);
                    tr = $("<tr/>", { "class": "date-picker__calendar-row" });
                }
                var td = $("<td/>", { "class": "date-picker__calendar-cell" });
                var date = $("<div/>", { "class": "date-picker__calendar-date" }).attr("data-ripple", this.settings.rippleColor);
                if (startDate.toDate() < this.settings.minDate) date.addClass("date-picker__calendar-date--disabled");
                if (startDate.toDate() > this.settings.maxDate) date.addClass("date-picker__calendar-date--disabled");
                if (activeDate.format("YYYY-MM-DD") == startDate.format("YYYY-MM-DD")) date.addClass("date-picker__calendar-date--selected")
                if (startDate.month() == endDate.month()) td.append(date.attr("data-date", startDate.format("YYYY-MM-DD")).text(startDate.format("D")));

                tr.append(td);
                startDate.add(1, 'd');
            }
            if (tr.find("td").length > 0) table.append(tr);

            //Return data
            return $("<div/>", { "class": "date-picker__reel__slide" }).append(table);
        },

        createMonthHeader: function (date) {
            var date = moment(this.settings.showMonth);
            var monthName = this.capitalizeFirstCharacter(this.settings.monthnamesLong[date.format("M") - 1]);
            return $("<div />", { "class": "date-picker__month" })
               .append($("<span/>", { "class": "date-picker__month-month flat-button", "text": monthName }))
               .append($("<span/>", { "class": "date-picker__month-year flat-button", "text": date.format("YYYY") }));
        },

        createDate: function (date) {
            var date = moment(date);
            var dateFormatted = this.capitalizeFirstCharacter(this.settings.daynamesShort[date.day()]) + ", " +
                date.date() + " " +
                this.capitalizeFirstCharacter(this.settings.monthnamesShort[date.month()]);
            return $("<div />", { "class": "date-picker__date", "text": dateFormatted });
        },

        createYear: function (date) {
            var date = moment(date);
            var dateFormatted = date.year();
            return $("<div />", { "class": "date-picker__date", "text": dateFormatted });
        },

        changeMonth: function (month) {
            if (month != null) this.settings.showMonth = month;
            var _this = this;
            var $reel = this.$element.find(".date-picker__reel");
            var $monthHeader = this.$element.find(".date-picker-month-reel");

            if (this.activeMonth < this.settings.showMonth) {
                $reel.addClass("date-picker__reel--slide-next");
                $reel.append(this.createMonthCalendar(this.settings.showMonth));
                $monthHeader.addClass("date-picker-month-reel--slide-next");
                $monthHeader.append(this.createMonthHeader(this.settings.showMonth));
            } else {
                $reel.addClass("date-picker__reel--slide-prev");
                $reel.prepend(this.createMonthCalendar(this.settings.showMonth));
                $monthHeader.addClass("date-picker-month-reel--slide-prev");
                $monthHeader.prepend(this.createMonthHeader(this.settings.showMonth));
            }


            $reel.offset();
            $reel.addClass("date-picker__reel--slide-active");
            $monthHeader.addClass("date-picker-month-reel--slide-active");
            $.mButtons();

            $reel.one("transitionend", function () {
                var slides = $reel.find(".date-picker__reel__slide");
                var monthHeaderSlides = $monthHeader.find(".date-picker__month");
                if (_this.activeMonth <= _this.settings.showMonth) {
                    slides.first().remove();
                    monthHeaderSlides.first().remove();
                } else {
                    slides.last().remove();
                    monthHeaderSlides.last().remove();
                }
                $reel.removeClass("date-picker__reel--slide-next date-picker__reel--slide-prev date-picker__reel--slide-next date-picker__reel--slide-active");
                $monthHeader.removeClass("date-picker-month-reel--slide-prev date-picker-month-reel--slide-next date-picker-month-reel--slide-active");
                _this.activeMonth = _this.settings.showMonth;
                _this.animationBusy = false;
                _this.checkNextPrevBtn();
            });


        },

        selectDate: function (date) {
            var _this = this;

            if (_this.settings.activeDate != date) {
                var $dateReel = this.$element.find(".date-picker__date--reel");
                var $dateReelWrapper = _this.$element.find(".date-picker__date-wrapper");
                var $yearReelWrapper = _this.$element.find(".date-picker__year-wrapper");
                var $yearReel = this.$element.find(".date-picker__year--reel");

                $dateReel.css("transition-duration", "");
                var formattedDate = _this.createDate(date);
                var formattedYear = _this.createYear(date);
                date = moment(date);
                _this.$element.find(".date-picker__calendar-date--selected").removeClass("date-picker__calendar-date--selected");
                _this.$element.find(".date-picker__calendar-date[data-date='" + date.format("YYYY-MM-DD") + "']").addClass("date-picker__calendar-date--selected");

                $dateReelWrapper.height($dateReelWrapper.height());
                $yearReelWrapper.height($yearReelWrapper.height());

                if (date.year() != $yearReel.text()) {
                    if (_this.settings.activeDate < date.toDate()) {
                        $yearReel.append(formattedYear);
                        $yearReel.addClass("date-picker__reel--slide-next");
                    } else {
                        $yearReel.prepend(formattedYear);
                        $yearReel.addClass("date-picker__reel--slide-prev");
                    }
                    $yearReel.offset();
                    $yearReel.addClass("date-picker__reel--slide-active");
                    $yearReel.one("transitionend", function () {
                        $yearReelWrapper.attr("height", "");
                        var slides = $yearReel.find(".date-picker__date");
                        if (_this.settings.activeDate < date.toDate()) {
                            slides.first().remove();
                        } else {
                            slides.last().remove();
                        }
                        $yearReel.removeClass("date-picker__reel--slide-prev date-picker__reel--slide-next date-picker__reel--slide-active")
                    });
                }

                if (_this.dateChangeAnimationBusy) {
                    _this.dateChangeAnimationBusy = true;

                    //Just update current animation
                    if ($dateReel.hasClass("date-picker__reel--slide-prev")) {
                        $dateReel.find(".date-picker__date").first().text(formattedDate.text());
                    } else {
                        $dateReel.find(".date-picker__date").last().text(formattedDate.text());
                    }
                } else if (formattedDate.text() != $dateReel.find(".date-picker__date").text()) {
                    //Start an animation
                    if (_this.settings.activeDate < date.toDate()) {
                        $dateReel.append(formattedDate);
                        $dateReel.addClass("date-picker__reel--slide-next");
                    } else {
                        $dateReel.prepend(formattedDate);
                        $dateReel.addClass("date-picker__reel--slide-prev");
                    }

                    $dateReel.offset();
                    $dateReel.addClass("date-picker__reel--slide-active");

                    $dateReel.one("transitionend", function () {
                        $dateReelWrapper.attr("height", "");
                        var slides = $dateReel.find(".date-picker__date");
                        if (_this.settings.activeDate < date.toDate()) {
                            slides.first().remove();
                        } else {
                            slides.last().remove();
                        }
                        $dateReel.removeClass("date-picker__reel--slide-prev date-picker__reel--slide-next date-picker__reel--slide-active")
                        _this.settings.activeDate = date.toDate();
                        _this.dateChangeAnimationBusy = false;
                    });
                }

                requestAnimationFrame(function () {
                    if (_this.settings.selectOnClick) {
                        _this.$input.val(date.format(_this.settings.returnFormat));
                        _this.$input.closest("fieldset").addClass("fieldset--filled");
                        _this.close();
                    }
                });

            }
        },

        show: function () {
            var _this = this;
            this.createFrame();


            //Show calendar
            if (!_this.settings.showMonth) _this.settings.showMonth = _this.settings.activeDate;
            _this.activeMonth = _this.settings.showMonth;

            //On clicks
            _this.$element.on("click", function (e) {
                var $target = $(e.target);

                if (_this.animationBusy == false) {

                    //Prev and next month buttons
                    if ($target.hasClass("date-picker__month-arrow") || $target.closest(".date-picker__month-arrow").length > 0) {
                        var btn = ($target.hasClass("date-picker__month-arrow") == true) ? $target : $target.closest(".date-picker__month-arrow");

                        if (!btn.hasClass("date-picker__month-arrow--disabled")) {
                            if (_this.yearActive == false) {


                                _this.animationBusy = true;
                                var addMonth = (btn.hasClass("date-picker__month-arrow--prev") == true) ? -1 : 1;
                                _this.settings.showMonth = moment(_this.settings.showMonth).add(addMonth, 'M').toDate();
                                _this.changeMonth();

                            } else {
                                var addYears = (btn.hasClass("date-picker__month-arrow--prev") == true) ? -20 : 20;
                                _this.showYear = _this.showYear + addYears;
                                _this.showYearsList((addYears < 0) ? "prev" : "next");
                            }
                        }
                    }

                    if ($target.hasClass("date-picker__calendar-date")) {
                        if ($target.hasClass("date-picker__calendar-date--disabled") == false) {
                            _this.selectDate(moment($target.attr("data-date")).toDate());
                        }
                    }

                    if ($target.hasClass("date-picker__month-month") || $target.closest(".date-picker__month-month").length > 0) {
                        if ($target.hasClass("date-picker__month-month--disabled") == false) _this.showMonthsList();
                    }

                    if ($target.hasClass("date-picker__month-year") || $target.closest(".date-picker__month-year").length > 0) {
                        if ($target.hasClass("date-picker__month-year--disabled") == false && _this.$element.find(".date-picker-years-table--show").length == 0) {
                            _this.showYearsList();
                        }
                    }

                    if ($target.hasClass("flat-button--agree")) {
                        _this.$input.val(moment(_this.settings.activeDate).format(_this.settings.returnFormat));
                        _this.$input.closest("fieldset").addClass("fieldset--filled");
                        _this.close();
                    }

                    if ($target.hasClass("flat-button--cancel")) {
                        _this.close();
                    }

                }
            });



            //Show overlay and calendar
            var overlay = $("<div />", { "class": "m-overlay m-overlay-datepicker" });
            _this.$element.wrap(overlay);
            overlay = _this.$element.closest(".m-overlay");

            //Add calendar
            _this.$element.find(".date-picker__reel").append(_this.createMonthCalendar(_this.settings.showMonth));
            _this.$element.find(".date-picker-month-reel").append(_this.createMonthHeader(_this.settings.showMonth));
            _this.$element.find(".date-picker__date--reel").append(_this.createDate(_this.showMonth));
            _this.$element.find(".date-picker__year--reel").append(_this.createYear(_this.showMonth));
            _this.checkNextPrevBtn();

            _this.$element.offset();
            overlay.addClass("m-overlay--show");
            _this.$element.addClass("date-picker--show");

            $.mButtons();
            if (_this.settings.closeOnClickoutside)
                overlay.on("click", function (e) {
                    if ($(e.target).hasClass("m-overlay")) {
                        overlay.off("click");
                        _this.close();
                    }
                })
        },

        close: function () {
            var overlay = this.$element.closest(".m-overlay");
            this.$element.removeClass("date-picker--show");
            overlay.removeClass("m-overlay--show");
            this.$element.on("transitionend", function () {
                overlay.remove();
            });
        },

        init: function () {
            var _this = this;

            this.$element.on("click focus", function () {
                $(this).blur();
                _this.show();
            })

        }
    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                    pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
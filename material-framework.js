//! moment.js

; (function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, (function () {
    'use strict';

    var hookCallback;

    function hooks() {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback(callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return input != null && Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return (Object.getOwnPropertyNames(obj).length === 0);
        } else {
            var k;
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return typeof input === 'number' || Object.prototype.toString.call(input) === '[object Number]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty: false,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: false,
            invalidMonth: null,
            invalidFormat: false,
            userInvalidated: false,
            iso: false,
            parsedDateParts: [],
            meridiem: null,
            rfc2822: false,
            weekdayMismatch: false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this);
            var len = t.length >>> 0;

            for (var i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            var parsedParts = some.call(flags.parsedDateParts, function (i) {
                return i != null;
            });
            var isNowValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.weekdayMismatch &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated &&
                (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid = isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            }
            else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid(flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment(obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor(number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function warn(msg) {
        if (hooks.suppressDeprecationWarnings === false &&
                (typeof console !== 'undefined') && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [];
                var arg;
                for (var i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (var key in arguments[0]) {
                            arg += key + ': ' + arguments[0][key] + ', ';
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(msg + '\nArguments: ' + Array.prototype.slice.call(args).join('') + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function set(config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (isFunction(prop)) {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig), prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (hasOwnProp(parentConfig, prop) &&
                    !hasOwnProp(childConfig, prop) &&
                    isObject(parentConfig[prop])) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i, res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L'
    };

    function calendar(key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY h:mm A',
        LLLL: 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat(key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate() {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal(number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years'
    };

    function relativeTime(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (isFunction(output)) ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias(unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [];
        for (var u in unitsObj) {
            units.push({ unit: u, priority: priorities[u] });
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken(token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '', i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i]) ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1 = /\d/;            //       0 - 9
    var match2 = /\d\d/;          //      00 - 99
    var match3 = /\d{3}/;         //     000 - 999
    var match4 = /\d{4}/;         //    0000 - 9999
    var match6 = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2 = /\d\d?/;         //       0 - 99
    var match3to4 = /\d\d\d\d?/;     //     999 - 9999
    var match5to6 = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3 = /\d{1,3}/;       //       0 - 999
    var match1to4 = /\d{1,4}/;       //       0 - 9999
    var match1to6 = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned = /\d+/;           //       0 - inf
    var matchSigned = /[+-]?\d+/;      //    -inf - inf

    var matchOffset = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i;

    var regexes = {};

    function addRegexToken(token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken(token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }));
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken(token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken(token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY', 4], 0, 'year');
    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y', matchSigned);
    addRegexToken('YY', match1to2, match2);
    addRegexToken('YYYY', match1to4, match4);
    addRegexToken('YYYYY', match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear() {
        return isLeapYear(this.year());
    }

    function makeGetSet(unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get(mom, unit) {
        return mom.isValid() ?
            mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function set$1(mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (unit === 'FullYear' && isLeapYear(mom.year()) && mom.month() === 1 && mom.date() === 29) {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value, mom.month(), daysInMonth(value, mom.month()));
            }
            else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet(units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }


    function stringSet(units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units);
            for (var i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1 ? (isLeapYear(year) ? 29 : 28) : (31 - modMonth % 7 % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M', match1to2);
    addRegexToken('MM', match1to2, match2);
    addRegexToken('MMM', function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths(m, format) {
        if (!m) {
            return isArray(this._months) ? this._months :
                this._months['standalone'];
        }
        return isArray(this._months) ? this._months[m.month()] :
            this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort(m, format) {
        if (!m) {
            return isArray(this._monthsShort) ? this._monthsShort :
                this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
            this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i, ii, mom, llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse(monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth(mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth(value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth() {
        return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict ?
                this._monthsShortStrictRegex : this._monthsShortRegex;
        }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict ?
                this._monthsStrictRegex : this._monthsRegex;
        }
    }

    function computeMonthsParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    function createDate(y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date = new Date(y, m, d, h, M, s, ms);

        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate(y) {
        var date = new Date(Date.UTC.apply(null, arguments));

        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear, resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek, resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w', match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W', match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow: 0, // Sunday is the first day of the week.
        doy: 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek() {
        return this._week.dow;
    }

    function localeFirstDayOfYear() {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d', match1to2);
    addRegexToken('e', match1to2);
    addRegexToken('E', match1to2);
    addRegexToken('dd', function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd', function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd', function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays(m, format) {
        if (!m) {
            return isArray(this._weekdays) ? this._weekdays :
                this._weekdays['standalone'];
        }
        return isArray(this._weekdays) ? this._weekdays[m.day()] :
            this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort(m) {
        return (m) ? this._weekdaysShort[m.day()] : this._weekdaysShort;
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin(m) {
        return (m) ? this._weekdaysMin[m.day()] : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse(weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
                this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
                this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
            }
            if (!this._weekdaysParse[i]) {
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict ?
                this._weekdaysStrictRegex : this._weekdaysRegex;
        }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict ?
                this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
        }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict ?
                this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
        }
    }


    function computeWeekdaysParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
            i, mom, minp, shortp, longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = this.weekdaysMin(mom, '');
            shortp = this.weekdaysShort(mom, '');
            longp = this.weekdays(mom, '');
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 7; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
        this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
        this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2);
    });

    function meridiem(token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem(isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a', matchMeridiem);
    addRegexToken('A', matchMeridiem);
    addRegexToken('H', match1to2);
    addRegexToken('h', match1to2);
    addRegexToken('k', match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4;
        var pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM(input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem(hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour they want. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var localeFamilies = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && (typeof module !== 'undefined') &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                var aliasedRequire = require;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale(key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
            else {
                if ((typeof console !== 'undefined') && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn('Locale ' + key + ' not found. Did you forget to load it?');
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale(name, config) {
        if (config !== null) {
            var locale, parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple('defineLocaleOverride',
                        'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);


            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale, tmpLocale, parentConfig = baseConfig;
            // MERGE
            tmpLocale = loadLocale(name);
            if (tmpLocale != null) {
                parentConfig = tmpLocale._config;
            }
            config = mergeConfigs(parentConfig, config);
            locale = new Locale(config);
            locale.parentLocale = locales[name];
            locales[name] = locale;

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale(key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow(m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH] < 0 || a[MONTH] > 11 ? MONTH :
                a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR] < 0 || a[HOUR] > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE] < 0 || a[MINUTE] > 59 ? MINUTE :
                a[SECOND] < 0 || a[SECOND] > 59 ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray(config) {
        var i, date, input = [], currentDate, expectedWeekday, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse) || config._dayOfYear === 0) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        expectedWeekday = config._useUTC ? config._d.getUTCDay() : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (config._w && typeof config._w.d !== 'undefined' && config._w.d !== expectedWeekday) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            var curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
        ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
        ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
        ['YYYY-DDD', /\d{4}-\d{3}/],
        ['YYYY-MM', /\d{4}-\d\d/, false],
        ['YYYYYYMMDD', /[+-]\d{10}/],
        ['YYYYMMDD', /\d{8}/],
        // YYYYMM is NOT allowed by the standard
        ['GGGG[W]WWE', /\d{4}W\d{3}/],
        ['GGGG[W]WW', /\d{4}W\d{2}/, false],
        ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
        ['HH:mm:ss', /\d\d:\d\d:\d\d/],
        ['HH:mm', /\d\d:\d\d/],
        ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
        ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
        ['HHmmss', /\d\d\d\d\d\d/],
        ['HHmm', /\d\d\d\d/],
        ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime, dateFormat, timeFormat, tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
    var rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/;

    function extractFromRFC2822Strings(yearStr, monthStr, dayStr, hourStr, minuteStr, secondStr) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10)
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s.replace(/\([^)]*\)|[\n\t]/g, ' ').replace(/(\s\s+)/g, ' ').trim();
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an indepentent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(parsedInput[0], parsedInput[1], parsedInput[2]).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    var obsOffsets = {
        UT: 0,
        GMT: 0,
        EDT: -4 * 60,
        EST: -5 * 60,
        CDT: -5 * 60,
        CST: -6 * 60,
        MDT: -6 * 60,
        MST: -7 * 60,
        PDT: -7 * 60,
        PST: -8 * 60
    };

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10);
            var m = hm % 100, h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i));
        if (match) {
            var parsedArray = extractFromRFC2822Strings(match[4], match[3], match[2], match[5], match[6], match[7]);
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        // Final attempt, use Input Fallback
        hooks.createFromInputFallback(config);
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
        'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
        'discouraged and will be removed in an upcoming major release. Please refer to ' +
        'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () { };

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () { };

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            // console.log('token', token, 'parsedInput', parsedInput,
            //         'regex', getParseRegexForToken(token, config));
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
            return obj && parseInt(obj, 10);
        });

        configFromArray(config);
    }

    function createFromConfig(config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({ nullInput: true });
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC(input, format, locale, strict, isUTC) {
        var c = {};

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if ((isObject(input) && isObjectEmpty(input)) ||
                (isArray(input) && input.length === 0)) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
        'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other < this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
        function () {
            var other = createLocal.apply(null, arguments);
            if (this.isValid() && other.isValid()) {
                return other > this ? this : other;
            } else {
                return createInvalid();
            }
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +(new Date());
    };

    var ordering = ['year', 'quarter', 'month', 'week', 'day', 'hour', 'minute', 'second', 'millisecond'];

    function isDurationValid(m) {
        for (var key in m) {
            if (!(indexOf.call(ordering, key) !== -1 && (m[key] == null || !isNaN(m[key])))) {
                return false;
            }
        }

        var unitHasDecimal = false;
        for (var i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration(obj) {
        return obj instanceof Duration;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // FORMATTING

    function offset(token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z', matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher);

        if (matches === null) {
            return null;
        }

        var chunk = matches[matches.length - 1] || [];
        var parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ?
          0 :
          parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? input.valueOf() : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset(m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () { };

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset(input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(this, createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone(input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal(keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset() {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            }
            else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset(input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime() {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted() {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal() {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset() {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc() {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-|\+)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)(\.\d*)?)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration(input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months
            };
        } else if (isNumber(input)) {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign // the millisecond decimal point is included in the match
            };
        } else if (!!(match = isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : (match[1] === '+') ? 1 : 1;
            duration = {
                y: parseIso(match[2], sign),
                M: parseIso(match[3], sign),
                w: parseIso(match[4], sign),
                d: parseIso(match[5], sign),
                h: parseIso(match[6], sign),
                m: parseIso(match[7], sign),
                s: parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(createLocal(duration.from), createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso(inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = { milliseconds: 0, months: 0 };

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return { milliseconds: 0, months: 0 };
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
                'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add = createAdder(1, 'add');
    var subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function calendar$1(time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse';

        var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

        return this.format(output || this.localeData().calendar(format, this, createLocal(now)));
    }

    function clone() {
        return new Moment(this);
    }

    function isAfter(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween(from, to, units, inclusivity) {
        inclusivity = inclusivity || '()';
        return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
            (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
        }
    }

    function isSameOrAfter(input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore(input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff(input, units, asFloat) {
        var that,
            zoneDelta,
            output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year': output = monthDiff(this, that) / 12; break;
            case 'month': output = monthDiff(this, that); break;
            case 'quarter': output = monthDiff(this, that) / 3; break;
            case 'second': output = (this - that) / 1e3; break; // 1000
            case 'minute': output = (this - that) / 6e4; break; // 1000 * 60
            case 'hour': output = (this - that) / 36e5; break; // 1000 * 60 * 60
            case 'day': output = (this - that - zoneDelta) / 864e5; break; // 1000 * 60 * 60 * 24, negate dst
            case 'week': output = (this - that - zoneDelta) / 6048e5; break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default: output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff(a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true;
        var m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(m, utc ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ');
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000).toISOString().replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(m, utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ');
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect() {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment';
        var zone = '';
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        var prefix = '[' + func + '("]';
        var year = (0 <= this.year() && this.year() <= 9999) ? 'YYYY' : 'YYYYYY';
        var datetime = '-MM-DD[T]HH:mm:ss.SSS';
        var suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format(inputString) {
        if (!inputString) {
            inputString = this.isUtc() ? hooks.defaultFormatUtc : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from(time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({ to: this, from: time }).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow(withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to(time, withoutSuffix) {
        if (this.isValid() &&
                ((isMoment(time) && time.isValid()) ||
                 createLocal(time).isValid())) {
            return createDuration({ from: this, to: time }).locale(this.locale()).humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow(withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale(key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData() {
        return this._locale;
    }

    function startOf(units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
            case 'year':
                this.month(0);
                /* falls through */
            case 'quarter':
            case 'month':
                this.date(1);
                /* falls through */
            case 'week':
            case 'isoWeek':
            case 'day':
            case 'date':
                this.hours(0);
                /* falls through */
            case 'hour':
                this.minutes(0);
                /* falls through */
            case 'minute':
                this.seconds(0);
                /* falls through */
            case 'second':
                this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf(units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }

        // 'date' is an alias for 'day', so it should be considered as such.
        if (units === 'date') {
            units = 'day';
        }

        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function valueOf() {
        return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix() {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate() {
        return new Date(this.valueOf());
    }

    function toArray() {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject() {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function toJSON() {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2() {
        return isValid(this);
    }

    function parsingFlags() {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt() {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict
        };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken(token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg', 'weekYear');
    addWeekYearFormatToken('ggggg', 'weekYear');
    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G', matchSigned);
    addRegexToken('g', matchSigned);
    addRegexToken('GG', match1to2, match2);
    addRegexToken('gg', match1to2, match2);
    addRegexToken('GGGG', match1to4, match4);
    addRegexToken('gggg', match1to4, match4);
    addRegexToken('GGGGG', match1to6, match6);
    addRegexToken('ggggg', match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear(input) {
        return getSetWeekYearHelper.call(this,
                input,
                this.week(),
                this.weekday(),
                this.localeData()._week.dow,
                this.localeData()._week.doy);
    }

    function getSetISOWeekYear(input) {
        return getSetWeekYearHelper.call(this,
                input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear() {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter(input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D', match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict ?
          (locale._dayOfMonthOrdinalParse || locale._ordinalParse) :
          locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD', match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear(input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m', match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s', match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S', match1to3, match1);
    addRegexToken('SS', match1to3, match2);
    addRegexToken('SSS', match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z', 0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr() {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add = add;
    proto.calendar = calendar$1;
    proto.clone = clone;
    proto.diff = diff;
    proto.endOf = endOf;
    proto.format = format;
    proto.from = from;
    proto.fromNow = fromNow;
    proto.to = to;
    proto.toNow = toNow;
    proto.get = stringGet;
    proto.invalidAt = invalidAt;
    proto.isAfter = isAfter;
    proto.isBefore = isBefore;
    proto.isBetween = isBetween;
    proto.isSame = isSame;
    proto.isSameOrAfter = isSameOrAfter;
    proto.isSameOrBefore = isSameOrBefore;
    proto.isValid = isValid$2;
    proto.lang = lang;
    proto.locale = locale;
    proto.localeData = localeData;
    proto.max = prototypeMax;
    proto.min = prototypeMin;
    proto.parsingFlags = parsingFlags;
    proto.set = stringSet;
    proto.startOf = startOf;
    proto.subtract = subtract;
    proto.toArray = toArray;
    proto.toObject = toObject;
    proto.toDate = toDate;
    proto.toISOString = toISOString;
    proto.inspect = inspect;
    proto.toJSON = toJSON;
    proto.toString = toString;
    proto.unix = unix;
    proto.valueOf = valueOf;
    proto.creationData = creationData;
    proto.year = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week = proto.weeks = getSetWeek;
    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    proto.weeksInYear = getWeeksInYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.date = getSetDayOfMonth;
    proto.day = proto.days = getSetDayOfWeek;
    proto.weekday = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset = getSetOffset;
    proto.utc = setOffsetToUTC;
    proto.local = setOffsetToLocal;
    proto.parseZone = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST = isDaylightSavingTime;
    proto.isLocal = isLocal;
    proto.isUtcOffset = isUtcOffset;
    proto.isUtc = isUtc;
    proto.isUTC = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    proto.years = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    proto.zone = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    function createUnix(input) {
        return createLocal(input * 1000);
    }

    function createInZone() {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat(string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar = calendar;
    proto$1.longDateFormat = longDateFormat;
    proto$1.invalidDate = invalidDate;
    proto$1.ordinal = ordinal;
    proto$1.preparse = preParsePostFormat;
    proto$1.postformat = preParsePostFormat;
    proto$1.relativeTime = relativeTime;
    proto$1.pastFuture = pastFuture;
    proto$1.set = set;

    proto$1.months = localeMonths;
    proto$1.monthsShort = localeMonthsShort;
    proto$1.monthsParse = localeMonthsParse;
    proto$1.monthsRegex = monthsRegex;
    proto$1.monthsShortRegex = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays = localeWeekdays;
    proto$1.weekdaysMin = localeWeekdaysMin;
    proto$1.weekdaysShort = localeWeekdaysShort;
    proto$1.weekdaysParse = localeWeekdaysParse;

    proto$1.weekdaysRegex = weekdaysRegex;
    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1(format, index, field, setter) {
        var locale = getLocale();
        var utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl(format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i;
        var out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl(localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0;

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        var i;
        var out = [];
        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths(format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort(format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports

    hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', getSetGlobalLocale);
    hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', getLocale);

    var mathAbs = Math.abs;

    function abs() {
        var data = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days = mathAbs(this._days);
        this._months = mathAbs(this._months);

        data.milliseconds = mathAbs(data.milliseconds);
        data.seconds = mathAbs(data.seconds);
        data.minutes = mathAbs(data.minutes);
        data.hours = mathAbs(data.hours);
        data.months = mathAbs(data.months);
        data.years = mathAbs(data.years);

        return this;
    }

    function addSubtract$1(duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days += direction * other._days;
        duration._months += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1(input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1(input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil(number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble() {
        var milliseconds = this._milliseconds;
        var days = this._days;
        var months = this._months;
        var data = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds = absFloor(milliseconds / 1000);
        data.seconds = seconds % 60;

        minutes = absFloor(seconds / 60);
        data.minutes = minutes % 60;

        hours = absFloor(minutes / 60);
        data.hours = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days = days;
        data.months = months;
        data.years = years;

        return this;
    }

    function daysToMonths(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays(months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as(units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week': return days / 7 + milliseconds / 6048e5;
                case 'day': return days + milliseconds / 864e5;
                case 'hour': return days * 24 + milliseconds / 36e5;
                case 'minute': return days * 1440 + milliseconds / 6e4;
                case 'second': return days * 86400 + milliseconds / 1000;
                    // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1() {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs(alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds = makeAs('s');
    var asMinutes = makeAs('m');
    var asHours = makeAs('h');
    var asDays = makeAs('d');
    var asWeeks = makeAs('w');
    var asMonths = makeAs('M');
    var asYears = makeAs('y');

    function clone$1() {
        return createDuration(this);
    }

    function get$2(units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds = makeGetter('seconds');
    var minutes = makeGetter('minutes');
    var hours = makeGetter('hours');
    var days = makeGetter('days');
    var months = makeGetter('months');
    var years = makeGetter('years');

    function weeks() {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        ss: 44,         // a few seconds to seconds
        s: 45,         // seconds to minute
        m: 45,         // minutes to hour
        h: 22,         // hours to day
        d: 26,         // days to month
        M: 11          // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1(posNegDuration, withoutSuffix, locale) {
        var duration = createDuration(posNegDuration).abs();
        var seconds = round(duration.as('s'));
        var minutes = round(duration.as('m'));
        var hours = round(duration.as('h'));
        var days = round(duration.as('d'));
        var months = round(duration.as('M'));
        var years = round(duration.as('y'));

        var a = seconds <= thresholds.ss && ['s', seconds] ||
                seconds < thresholds.s && ['ss', seconds] ||
                minutes <= 1 && ['m'] ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours <= 1 && ['h'] ||
                hours < thresholds.h && ['hh', hours] ||
                days <= 1 && ['d'] ||
                days < thresholds.d && ['dd', days] ||
                months <= 1 && ['M'] ||
                months < thresholds.M && ['MM', months] ||
                years <= 1 && ['y'] || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding(roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof (roundingFunction) === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold(threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize(withSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var locale = this.localeData();
        var output = relativeTime$1(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return ((x > 0) - (x < 0)) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000;
        var days = abs$1(this._days);
        var months = abs$1(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes = absFloor(seconds / 60);
        hours = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        var totalSign = total < 0 ? '-' : '';
        var ymSign = sign(this._months) !== sign(total) ? '-' : '';
        var daysSign = sign(this._days) !== sign(total) ? '-' : '';
        var hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return totalSign + 'P' +
            (Y ? ymSign + Y + 'Y' : '') +
            (M ? ymSign + M + 'M' : '') +
            (D ? daysSign + D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? hmsSign + h + 'H' : '') +
            (m ? hmsSign + m + 'M' : '') +
            (s ? hmsSign + s + 'S' : '');
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid = isValid$1;
    proto$2.abs = abs;
    proto$2.add = add$1;
    proto$2.subtract = subtract$1;
    proto$2.as = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds = asSeconds;
    proto$2.asMinutes = asMinutes;
    proto$2.asHours = asHours;
    proto$2.asDays = asDays;
    proto$2.asWeeks = asWeeks;
    proto$2.asMonths = asMonths;
    proto$2.asYears = asYears;
    proto$2.valueOf = valueOf$1;
    proto$2._bubble = bubble;
    proto$2.clone = clone$1;
    proto$2.get = get$2;
    proto$2.milliseconds = milliseconds;
    proto$2.seconds = seconds;
    proto$2.minutes = minutes;
    proto$2.hours = hours;
    proto$2.days = days;
    proto$2.weeks = weeks;
    proto$2.months = months;
    proto$2.years = years;
    proto$2.humanize = humanize;
    proto$2.toISOString = toISOString$1;
    proto$2.toString = toISOString$1;
    proto$2.toJSON = toISOString$1;
    proto$2.locale = locale;
    proto$2.localeData = localeData;

    proto$2.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', toISOString$1);
    proto$2.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    hooks.version = '2.22.1';

    setHookCallback(createLocal);

    hooks.fn = proto;
    hooks.min = min;
    hooks.max = max;
    hooks.now = now;
    hooks.utc = createUTC;
    hooks.unix = createUnix;
    hooks.months = listMonths;
    hooks.isDate = isDate;
    hooks.locale = getSetGlobalLocale;
    hooks.invalid = createInvalid;
    hooks.duration = createDuration;
    hooks.isMoment = isMoment;
    hooks.weekdays = listWeekdays;
    hooks.parseZone = createInZone;
    hooks.localeData = getLocale;
    hooks.isDuration = isDuration;
    hooks.monthsShort = listMonthsShort;
    hooks.weekdaysMin = listWeekdaysMin;
    hooks.defineLocale = defineLocale;
    hooks.updateLocale = updateLocale;
    hooks.locales = listLocales;
    hooks.weekdaysShort = listWeekdaysShort;
    hooks.normalizeUnits = normalizeUnits;
    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat = getCalendarFormat;
    hooks.prototype = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm',             // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss',  // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS',   // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD',                             // <input type="date" />
        TIME: 'HH:mm',                                  // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss',                       // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS',                        // <input type="time" step="0.001" />
        WEEK: 'YYYY-[W]WW',                             // <input type="week" />
        MONTH: 'YYYY-MM'                                // <input type="month" />
    };

    return hooks;

})));
/*!
 * 
 *         SimpleBar.js - v2.6.1
 *         Scrollbars, simpler.
 *         https://grsmto.github.io/simplebar/
 *         
 *         Made by Adrien Grsmto from a fork by Jonathan Nicol
 *         Under MIT License
 *       
 */
! function (t, e) {
    "object" == typeof exports && "object" == typeof module ? module.exports = e() : "function" == typeof define && define.amd ? define([], e) : "object" == typeof exports ? exports.SimpleBar = e() : t.SimpleBar = e()
}(this, function () {
    return function (t) {
        function e(r) {
            if (n[r]) return n[r].exports;
            var i = n[r] = {
                i: r,
                l: !1,
                exports: {}
            };
            return t[r].call(i.exports, i, i.exports, e), i.l = !0, i.exports
        }
        var n = {};
        return e.m = t, e.c = n, e.d = function (t, n, r) {
            e.o(t, n) || Object.defineProperty(t, n, {
                configurable: !1,
                enumerable: !0,
                get: r
            })
        }, e.n = function (t) {
            var n = t && t.__esModule ? function () {
                return t.default
            } : function () {
                return t
            };
            return e.d(n, "a", n), n
        }, e.o = function (t, e) {
            return Object.prototype.hasOwnProperty.call(t, e)
        }, e.p = "", e(e.s = 27)
    }([function (t, e, n) {
        var r = n(23)("wks"),
            i = n(12),
            o = n(1).Symbol,
            s = "function" == typeof o;
        (t.exports = function (t) {
            return r[t] || (r[t] = s && o[t] || (s ? o : i)("Symbol." + t))
        }).store = r
    }, function (t, e) {
        var n = t.exports = "undefined" != typeof window && window.Math == Math ? window : "undefined" != typeof self && self.Math == Math ? self : Function("return this")();
        "number" == typeof __g && (__g = n)
    }, function (t, e) {
        var n = {}.hasOwnProperty;
        t.exports = function (t, e) {
            return n.call(t, e)
        }
    }, function (t, e) {
        var n = t.exports = {
            version: "2.5.1"
        };
        "number" == typeof __e && (__e = n)
    }, function (t, e, n) {
        var r = n(5),
            i = n(11);
        t.exports = n(7) ? function (t, e, n) {
            return r.f(t, e, i(1, n))
        } : function (t, e, n) {
            return t[e] = n, t
        }
    }, function (t, e, n) {
        var r = n(6),
            i = n(33),
            o = n(34),
            s = Object.defineProperty;
        e.f = n(7) ? Object.defineProperty : function (t, e, n) {
            if (r(t), e = o(e, !0), r(n), i) try {
                return s(t, e, n)
            } catch (t) { }
            if ("get" in n || "set" in n) throw TypeError("Accessors not supported!");
            return "value" in n && (t[e] = n.value), t
        }
    }, function (t, e, n) {
        var r = n(10);
        t.exports = function (t) {
            if (!r(t)) throw TypeError(t + " is not an object!");
            return t
        }
    }, function (t, e, n) {
        t.exports = !n(16)(function () {
            return 7 != Object.defineProperty({}, "a", {
                get: function () {
                    return 7
                }
            }).a
        })
    }, function (t, e) {
        var n = Math.ceil,
            r = Math.floor;
        t.exports = function (t) {
            return isNaN(t = +t) ? 0 : (t > 0 ? r : n)(t)
        }
    }, function (t, e) {
        t.exports = function (t) {
            if (void 0 == t) throw TypeError("Can't call method on  " + t);
            return t
        }
    }, function (t, e) {
        t.exports = function (t) {
            return "object" == typeof t ? null !== t : "function" == typeof t
        }
    }, function (t, e) {
        t.exports = function (t, e) {
            return {
                enumerable: !(1 & t),
                configurable: !(2 & t),
                writable: !(4 & t),
                value: e
            }
        }
    }, function (t, e) {
        var n = 0,
            r = Math.random();
        t.exports = function (t) {
            return "Symbol(".concat(void 0 === t ? "" : t, ")_", (++n + r).toString(36))
        }
    }, function (t, e) {
        t.exports = {}
    }, function (t, e, n) {
        var r = n(23)("keys"),
            i = n(12);
        t.exports = function (t) {
            return r[t] || (r[t] = i(t))
        }
    }, function (t, e, n) {
        var r = n(1),
            i = n(3),
            o = n(4),
            s = n(18),
            c = n(19),
            a = function (t, e, n) {
                var u, l, f, h, d = t & a.F,
                    p = t & a.G,
                    v = t & a.S,
                    b = t & a.P,
                    y = t & a.B,
                    m = p ? r : v ? r[e] || (r[e] = {}) : (r[e] || {}).prototype,
                    g = p ? i : i[e] || (i[e] = {}),
                    E = g.prototype || (g.prototype = {});
                p && (n = e);
                for (u in n) l = !d && m && void 0 !== m[u], f = (l ? m : n)[u], h = y && l ? c(f, r) : b && "function" == typeof f ? c(Function.call, f) : f, m && s(m, u, f, t & a.U), g[u] != f && o(g, u, h), b && E[u] != f && (E[u] = f)
            };
        r.core = i, a.F = 1, a.G = 2, a.S = 4, a.P = 8, a.B = 16, a.W = 32, a.U = 64, a.R = 128, t.exports = a
    }, function (t, e) {
        t.exports = function (t) {
            try {
                return !!t()
            } catch (t) {
                return !0
            }
        }
    }, function (t, e, n) {
        var r = n(10),
            i = n(1).document,
            o = r(i) && r(i.createElement);
        t.exports = function (t) {
            return o ? i.createElement(t) : {}
        }
    }, function (t, e, n) {
        var r = n(1),
            i = n(4),
            o = n(2),
            s = n(12)("src"),
            c = Function.toString,
            a = ("" + c).split("toString");
        n(3).inspectSource = function (t) {
            return c.call(t)
        }, (t.exports = function (t, e, n, c) {
            var u = "function" == typeof n;
            u && (o(n, "name") || i(n, "name", e)), t[e] !== n && (u && (o(n, s) || i(n, s, t[e] ? "" + t[e] : a.join(String(e)))), t === r ? t[e] = n : c ? t[e] ? t[e] = n : i(t, e, n) : (delete t[e], i(t, e, n)))
        })(Function.prototype, "toString", function () {
            return "function" == typeof this && this[s] || c.call(this)
        })
    }, function (t, e, n) {
        var r = n(35);
        t.exports = function (t, e, n) {
            if (r(t), void 0 === e) return t;
            switch (n) {
                case 1:
                    return function (n) {
                        return t.call(e, n)
                    };
                case 2:
                    return function (n, r) {
                        return t.call(e, n, r)
                    };
                case 3:
                    return function (n, r, i) {
                        return t.call(e, n, r, i)
                    }
            }
            return function () {
                return t.apply(e, arguments)
            }
        }
    }, function (t, e, n) {
        var r = n(41),
            i = n(9);
        t.exports = function (t) {
            return r(i(t))
        }
    }, function (t, e) {
        var n = {}.toString;
        t.exports = function (t) {
            return n.call(t).slice(8, -1)
        }
    }, function (t, e, n) {
        var r = n(8),
            i = Math.min;
        t.exports = function (t) {
            return t > 0 ? i(r(t), 9007199254740991) : 0
        }
    }, function (t, e, n) {
        var r = n(1),
            i = r["__core-js_shared__"] || (r["__core-js_shared__"] = {});
        t.exports = function (t) {
            return i[t] || (i[t] = {})
        }
    }, function (t, e) {
        t.exports = "constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf".split(",")
    }, function (t, e, n) {
        var r = n(5).f,
            i = n(2),
            o = n(0)("toStringTag");
        t.exports = function (t, e, n) {
            t && !i(t = n ? t : t.prototype, o) && r(t, o, {
                configurable: !0,
                value: e
            })
        }
    }, function (t, e, n) {
        var r = n(9);
        t.exports = function (t) {
            return Object(r(t))
        }
    }, function (t, e, n) {
        "use strict";

        function r(t) {
            return t && t.__esModule ? t : {
                default: t
            }
        }

        function i(t, e) {
            if (!(t instanceof e)) throw new TypeError("Cannot call a class as a function")
        }

        function o(t, e) {
            for (var n = 0; n < e.length; n++) {
                var r = e[n];
                r.enumerable = r.enumerable || !1, r.configurable = !0, "value" in r && (r.writable = !0), Object.defineProperty(t, r.key, r)
            }
        }

        function s(t, e, n) {
            return e && o(t.prototype, e), n && o(t, n), t
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        }), e.default = void 0, n(28);
        var c = r(n(53)),
            a = r(n(54)),
            u = r(n(56));
        n(57), Object.assign = n(58);
        var l = function () {
            function t(e, n) {
                i(this, t), this.el = e, this.flashTimeout, this.contentEl, this.scrollContentEl, this.dragOffset = {
                    x: 0,
                    y: 0
                }, this.isVisible = {
                    x: !0,
                    y: !0
                }, this.scrollOffsetAttr = {
                    x: "scrollLeft",
                    y: "scrollTop"
                }, this.sizeAttr = {
                    x: "offsetWidth",
                    y: "offsetHeight"
                }, this.scrollSizeAttr = {
                    x: "scrollWidth",
                    y: "scrollHeight"
                }, this.offsetAttr = {
                    x: "left",
                    y: "top"
                }, this.globalObserver, this.mutationObserver, this.resizeObserver, this.currentAxis, this.isRtl, this.options = Object.assign({}, t.defaultOptions, n), this.classNames = this.options.classNames, this.scrollbarWidth = (0, c.default)(), this.offsetSize = 20, this.flashScrollbar = this.flashScrollbar.bind(this), this.onDragY = this.onDragY.bind(this), this.onDragX = this.onDragX.bind(this), this.onScrollY = this.onScrollY.bind(this), this.onScrollX = this.onScrollX.bind(this), this.drag = this.drag.bind(this), this.onEndDrag = this.onEndDrag.bind(this), this.onMouseEnter = this.onMouseEnter.bind(this), this.recalculate = (0, a.default)(this.recalculate, 100, {
                    leading: !0
                }), this.init()
            }
            return s(t, [{
                key: "init",
                value: function () {
                    this.el.SimpleBar = this, this.initDOM(), this.scrollbarX = this.trackX.querySelector(".".concat(this.classNames.scrollbar)), this.scrollbarY = this.trackY.querySelector(".".concat(this.classNames.scrollbar)), this.isRtl = "rtl" === getComputedStyle(this.contentEl).direction, this.scrollContentEl.style[this.isRtl ? "paddingLeft" : "paddingRight"] = "".concat(this.scrollbarWidth || this.offsetSize, "px"), this.scrollContentEl.style.marginBottom = "-".concat(2 * this.scrollbarWidth || this.offsetSize, "px"), this.contentEl.style.paddingBottom = "".concat(this.scrollbarWidth || this.offsetSize, "px"), 0 !== this.scrollbarWidth && (this.contentEl.style[this.isRtl ? "marginLeft" : "marginRight"] = "-".concat(this.scrollbarWidth, "px")), this.recalculate(), this.initListeners()
                }
            }, {
                key: "initDOM",
                value: function () {
                    var t = this;
                    if (Array.from(this.el.children).filter(function (e) {
                            return e.classList.contains(t.classNames.scrollContent)
                    }).length) this.trackX = this.el.querySelector(".".concat(this.classNames.track, ".horizontal")), this.trackY = this.el.querySelector(".".concat(this.classNames.track, ".vertical")), this.scrollContentEl = this.el.querySelector(".".concat(this.classNames.scrollContent)), this.contentEl = this.el.querySelector(".".concat(this.classNames.content));
                    else {
                        for (this.scrollContentEl = document.createElement("div"), this.contentEl = document.createElement("div"), this.scrollContentEl.classList.add(this.classNames.scrollContent), this.contentEl.classList.add(this.classNames.content) ; this.el.firstChild;) this.contentEl.appendChild(this.el.firstChild);
                        this.scrollContentEl.appendChild(this.contentEl), this.el.appendChild(this.scrollContentEl)
                    }
                    if (!this.trackX || !this.trackY) {
                        var e = document.createElement("div"),
                            n = document.createElement("div");
                        e.classList.add(this.classNames.track), n.classList.add(this.classNames.scrollbar), e.appendChild(n), this.trackX = e.cloneNode(!0), this.trackX.classList.add("horizontal"), this.trackY = e.cloneNode(!0), this.trackY.classList.add("vertical"), this.el.insertBefore(this.trackX, this.el.firstChild), this.el.insertBefore(this.trackY, this.el.firstChild)
                    }
                    this.el.setAttribute("data-simplebar", "init")
                }
            }, {
                key: "initListeners",
                value: function () {
                    var t = this;
                    this.options.autoHide && this.el.addEventListener("mouseenter", this.onMouseEnter), this.scrollbarY.addEventListener("mousedown", this.onDragY), this.scrollbarX.addEventListener("mousedown", this.onDragX), this.scrollContentEl.addEventListener("scroll", this.onScrollY), this.contentEl.addEventListener("scroll", this.onScrollX), "undefined" != typeof MutationObserver && (this.mutationObserver = new MutationObserver(function (e) {
                        e.forEach(function (e) {
                            (t.isChildNode(e.target) || e.addedNodes.length) && t.recalculate()
                        })
                    }), this.mutationObserver.observe(this.el, {
                        attributes: !0,
                        childList: !0,
                        characterData: !0,
                        subtree: !0
                    })), this.resizeObserver = new u.default(this.recalculate.bind(this)), this.resizeObserver.observe(this.el)
                }
            }, {
                key: "removeListeners",
                value: function () {
                    this.options.autoHide && this.el.removeEventListener("mouseenter", this.onMouseEnter), this.scrollbarX.removeEventListener("mousedown", this.onDragX), this.scrollbarY.removeEventListener("mousedown", this.onDragY), this.scrollContentEl.removeEventListener("scroll", this.onScrollY), this.contentEl.removeEventListener("scroll", this.onScrollX), this.mutationObserver.disconnect(), this.resizeObserver.disconnect()
                }
            }, {
                key: "onDragX",
                value: function (t) {
                    this.onDrag(t, "x")
                }
            }, {
                key: "onDragY",
                value: function (t) {
                    this.onDrag(t, "y")
                }
            }, {
                key: "onDrag",
                value: function (t) {
                    var e = arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "y";
                    t.preventDefault();
                    var n = "y" === e ? this.scrollbarY : this.scrollbarX,
                        r = "y" === e ? t.pageY : t.pageX;
                    this.dragOffset[e] = r - n.getBoundingClientRect()[this.offsetAttr[e]], this.currentAxis = e, document.addEventListener("mousemove", this.drag), document.addEventListener("mouseup", this.onEndDrag)
                }
            }, {
                key: "drag",
                value: function (t) {
                    var e, n, r;
                    t.preventDefault(), "y" === this.currentAxis ? (e = t.pageY, n = this.trackY, r = this.scrollContentEl) : (e = t.pageX, n = this.trackX, r = this.contentEl);
                    var i = e - n.getBoundingClientRect()[this.offsetAttr[this.currentAxis]] - this.dragOffset[this.currentAxis],
                        o = i / n[this.sizeAttr[this.currentAxis]],
                        s = o * this.contentEl[this.scrollSizeAttr[this.currentAxis]];
                    r[this.scrollOffsetAttr[this.currentAxis]] = s
                }
            }, {
                key: "onEndDrag",
                value: function () {
                    document.removeEventListener("mousemove", this.drag), document.removeEventListener("mouseup", this.onEndDrag)
                }
            }, {
                key: "resizeScrollbar",
                value: function () {
                    var t, e, n, r, i, o = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "y";
                    "x" === o ? (t = this.trackX, e = this.scrollbarX, n = this.contentEl[this.scrollOffsetAttr[o]], r = this.contentSizeX, i = this.scrollbarXSize) : (t = this.trackY, e = this.scrollbarY, n = this.scrollContentEl[this.scrollOffsetAttr[o]], r = this.contentSizeY, i = this.scrollbarYSize);
                    var s = i / r,
                        c = n / (r - i),
                        a = Math.max(~~(s * i), this.options.scrollbarMinSize),
                        u = ~~((i - a) * c);

                    this.isVisible[o] = i < r, this.isVisible[o] || this.options.forceVisible ? (t.style.visibility = "visible", this.options.forceVisible ? e.style.visibility = "hidden" : e.style.visibility = "visible", "x" === o ? (e.style.left = "".concat(u, "px"), e.style.width = "".concat(a, "px")) : (e.style.top = "".concat(u, "px"), e.style.height = "".concat(a, "px"))) : t.style.visibility = "hidden"
                    if (this.isVisible[o] == false) {
                        e.style.visibility = "hidden";
                    }
                }
            }, {
                key: "onScrollX",
                value: function () {
                    this.flashScrollbar("x")
                }
            }, {
                key: "onScrollY",
                value: function () {
                    this.flashScrollbar("y")
                }
            }, {
                key: "onMouseEnter",
                value: function () {
                    this.flashScrollbar("x"), this.flashScrollbar("y")
                }
            }, {
                key: "flashScrollbar",
                value: function () {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "y";
                    this.resizeScrollbar(t), this.showScrollbar(t)
                }
            }, {
                key: "showScrollbar",
                value: function () {
                    var t = arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "y";
                    this.isVisible[t] && ("x" === t ? this.scrollbarX.classList.add("visible") : this.scrollbarY.classList.add("visible"), this.options.autoHide && ("number" == typeof this.flashTimeout && window.clearTimeout(this.flashTimeout), this.flashTimeout = window.setTimeout(this.hideScrollbar.bind(this), 1e3)))
                }
            }, {
                key: "hideScrollbar",
                value: function () {
                    this.scrollbarX.classList.remove("visible"), this.scrollbarY.classList.remove("visible"), "number" == typeof this.flashTimeout && window.clearTimeout(this.flashTimeout)
                }
            }, {
                key: "recalculate",
                value: function () {
                    this.contentSizeX = this.contentEl[this.scrollSizeAttr.x], this.contentSizeY = this.contentEl[this.scrollSizeAttr.y] - (this.scrollbarWidth || this.offsetSize), this.scrollbarXSize = this.trackX[this.sizeAttr.x], this.scrollbarYSize = this.trackY[this.sizeAttr.y], this.resizeScrollbar("x"), this.resizeScrollbar("y"), this.options.autoHide || (this.showScrollbar("x"), this.showScrollbar("y"))
                }
            }, {
                key: "getScrollElement",
                value: function () {
                    return "y" === (arguments.length > 0 && void 0 !== arguments[0] ? arguments[0] : "y") ? this.scrollContentEl : this.contentEl
                }
            }, {
                key: "getContentElement",
                value: function () {
                    return this.contentEl
                }
            }, {
                key: "unMount",
                value: function () {
                    this.removeListeners(), this.el.SimpleBar = null
                }
            }, {
                key: "isChildNode",
                value: function (t) {
                    return null !== t && (t === this.el || this.isChildNode(t.parentNode))
                }
            }], [{
                key: "initHtmlApi",
                value: function () {
                    this.initDOMLoadedElements = this.initDOMLoadedElements.bind(this), "undefined" != typeof MutationObserver && (this.globalObserver = new MutationObserver(function (e) {
                        e.forEach(function (e) {
                            Array.from(e.addedNodes).forEach(function (e) {
                                1 === e.nodeType && (e.hasAttribute("data-simplebar") ? !e.SimpleBar && new t(e, t.getElOptions(e)) : Array.from(e.querySelectorAll("[data-simplebar]")).forEach(function (e) {
                                    !e.SimpleBar && new t(e, t.getElOptions(e))
                                }))
                            }), Array.from(e.removedNodes).forEach(function (t) {
                                1 === t.nodeType && (t.hasAttribute("data-simplebar") ? t.SimpleBar && t.SimpleBar.unMount() : Array.from(t.querySelectorAll("[data-simplebar]")).forEach(function (t) {
                                    t.SimpleBar && t.SimpleBar.unMount()
                                }))
                            })
                        })
                    }), this.globalObserver.observe(document, {
                        childList: !0,
                        subtree: !0
                    })), "complete" === document.readyState || "loading" !== document.readyState && !document.documentElement.doScroll ? window.setTimeout(this.initDOMLoadedElements.bind(this)) : (document.addEventListener("DOMContentLoaded", this.initDOMLoadedElements), window.addEventListener("load", this.initDOMLoadedElements))
                }
            }, {
                key: "getElOptions",
                value: function (e) {
                    return Object.keys(t.htmlAttributes).reduce(function (n, r) {
                        var i = t.htmlAttributes[r];
                        return e.hasAttribute(i) && (n[r] = JSON.parse(e.getAttribute(i) || !0)), n
                    }, {})
                }
            }, {
                key: "removeObserver",
                value: function () {
                    this.globalObserver.disconnect()
                }
            }, {
                key: "initDOMLoadedElements",
                value: function () {
                    document.removeEventListener("DOMContentLoaded", this.initDOMLoadedElements), window.removeEventListener("load", this.initDOMLoadedElements), Array.from(document.querySelectorAll("[data-simplebar]")).forEach(function (e) {
                        e.SimpleBar || new t(e, t.getElOptions(e))
                    })
                }
            }, {
                key: "defaultOptions",
                get: function () {
                    return {
                        autoHide: !0,
                        forceVisible: !1,
                        classNames: {
                            content: "simplebar-content",
                            scrollContent: "simplebar-scroll-content",
                            scrollbar: "simplebar-scrollbar",
                            track: "simplebar-track"
                        },
                        scrollbarMinSize: 25
                    }
                }
            }, {
                key: "htmlAttributes",
                get: function () {
                    return {
                        autoHide: "data-simplebar-auto-hide",
                        forceVisible: "data-simplebar-force-visible",
                        scrollbarMinSize: "data-simplebar-scrollbar-min-size"
                    }
                }
            }]), t
        }();
        e.default = l, l.initHtmlApi()
    }, function (t, e, n) {
        n(29), n(46), t.exports = n(3).Array.from
    }, function (t, e, n) {
        "use strict";
        var r = n(30)(!0);
        n(31)(String, "String", function (t) {
            this._t = String(t), this._i = 0
        }, function () {
            var t, e = this._t,
                n = this._i;
            return n >= e.length ? {
                value: void 0,
                done: !0
            } : (t = r(e, n), this._i += t.length, {
                value: t,
                done: !1
            })
        })
    }, function (t, e, n) {
        var r = n(8),
            i = n(9);
        t.exports = function (t) {
            return function (e, n) {
                var o, s, c = String(i(e)),
                    a = r(n),
                    u = c.length;
                return a < 0 || a >= u ? t ? "" : void 0 : (o = c.charCodeAt(a), o < 55296 || o > 56319 || a + 1 === u || (s = c.charCodeAt(a + 1)) < 56320 || s > 57343 ? t ? c.charAt(a) : o : t ? c.slice(a, a + 2) : s - 56320 + (o - 55296 << 10) + 65536)
            }
        }
    }, function (t, e, n) {
        "use strict";
        var r = n(32),
            i = n(15),
            o = n(18),
            s = n(4),
            c = n(2),
            a = n(13),
            u = n(36),
            l = n(25),
            f = n(45),
            h = n(0)("iterator"),
            d = !([].keys && "next" in [].keys()),
            p = function () {
                return this
            };
        t.exports = function (t, e, n, v, b, y, m) {
            u(n, e, v);
            var g, E, O, _ = function (t) {
                if (!d && t in A) return A[t];
                switch (t) {
                    case "keys":
                    case "values":
                        return function () {
                            return new n(this, t)
                        }
                }
                return function () {
                    return new n(this, t)
                }
            },
                x = e + " Iterator",
                w = "values" == b,
                S = !1,
                A = t.prototype,
                k = A[h] || A["@@iterator"] || b && A[b],
                j = k || _(b),
                M = b ? w ? _("entries") : j : void 0,
                L = "Array" == e ? A.entries || k : k;
            if (L && (O = f(L.call(new t))) !== Object.prototype && O.next && (l(O, x, !0), r || c(O, h) || s(O, h, p)), w && k && "values" !== k.name && (S = !0, j = function () {
                    return k.call(this)
            }), r && !m || !d && !S && A[h] || s(A, h, j), a[e] = j, a[x] = p, b)
                if (g = {
                    values: w ? j : _("values"),
                    keys: y ? j : _("keys"),
                    entries: M
                }, m)
                    for (E in g) E in A || o(A, E, g[E]);
                else i(i.P + i.F * (d || S), e, g);
            return g
        }
    }, function (t, e) {
        t.exports = !1
    }, function (t, e, n) {
        t.exports = !n(7) && !n(16)(function () {
            return 7 != Object.defineProperty(n(17)("div"), "a", {
                get: function () {
                    return 7
                }
            }).a
        })
    }, function (t, e, n) {
        var r = n(10);
        t.exports = function (t, e) {
            if (!r(t)) return t;
            var n, i;
            if (e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i;
            if ("function" == typeof (n = t.valueOf) && !r(i = n.call(t))) return i;
            if (!e && "function" == typeof (n = t.toString) && !r(i = n.call(t))) return i;
            throw TypeError("Can't convert object to primitive value")
        }
    }, function (t, e) {
        t.exports = function (t) {
            if ("function" != typeof t) throw TypeError(t + " is not a function!");
            return t
        }
    }, function (t, e, n) {
        "use strict";
        var r = n(37),
            i = n(11),
            o = n(25),
            s = {};
        n(4)(s, n(0)("iterator"), function () {
            return this
        }), t.exports = function (t, e, n) {
            t.prototype = r(s, {
                next: i(1, n)
            }), o(t, e + " Iterator")
        }
    }, function (t, e, n) {
        var r = n(6),
            i = n(38),
            o = n(24),
            s = n(14)("IE_PROTO"),
            c = function () { },
            a = function () {
                var t, e = n(17)("iframe"),
                    r = o.length;
                for (e.style.display = "none", n(44).appendChild(e), e.src = "javascript:", t = e.contentWindow.document, t.open(), t.write("<script>document.F=Object<\/script>"), t.close(), a = t.F; r--;) delete a.prototype[o[r]];
                return a()
            };
        t.exports = Object.create || function (t, e) {
            var n;
            return null !== t ? (c.prototype = r(t), n = new c, c.prototype = null, n[s] = t) : n = a(), void 0 === e ? n : i(n, e)
        }
    }, function (t, e, n) {
        var r = n(5),
            i = n(6),
            o = n(39);
        t.exports = n(7) ? Object.defineProperties : function (t, e) {
            i(t);
            for (var n, s = o(e), c = s.length, a = 0; c > a;) r.f(t, n = s[a++], e[n]);
            return t
        }
    }, function (t, e, n) {
        var r = n(40),
            i = n(24);
        t.exports = Object.keys || function (t) {
            return r(t, i)
        }
    }, function (t, e, n) {
        var r = n(2),
            i = n(20),
            o = n(42)(!1),
            s = n(14)("IE_PROTO");
        t.exports = function (t, e) {
            var n, c = i(t),
                a = 0,
                u = [];
            for (n in c) n != s && r(c, n) && u.push(n);
            for (; e.length > a;) r(c, n = e[a++]) && (~o(u, n) || u.push(n));
            return u
        }
    }, function (t, e, n) {
        var r = n(21);
        t.exports = Object("z").propertyIsEnumerable(0) ? Object : function (t) {
            return "String" == r(t) ? t.split("") : Object(t)
        }
    }, function (t, e, n) {
        var r = n(20),
            i = n(22),
            o = n(43);
        t.exports = function (t) {
            return function (e, n, s) {
                var c, a = r(e),
                    u = i(a.length),
                    l = o(s, u);
                if (t && n != n) {
                    for (; u > l;)
                        if ((c = a[l++]) != c) return !0
                } else
                    for (; u > l; l++)
                        if ((t || l in a) && a[l] === n) return t || l || 0;
                return !t && -1
            }
        }
    }, function (t, e, n) {
        var r = n(8),
            i = Math.max,
            o = Math.min;
        t.exports = function (t, e) {
            return t = r(t), t < 0 ? i(t + e, 0) : o(t, e)
        }
    }, function (t, e, n) {
        var r = n(1).document;
        t.exports = r && r.documentElement
    }, function (t, e, n) {
        var r = n(2),
            i = n(26),
            o = n(14)("IE_PROTO"),
            s = Object.prototype;
        t.exports = Object.getPrototypeOf || function (t) {
            return t = i(t), r(t, o) ? t[o] : "function" == typeof t.constructor && t instanceof t.constructor ? t.constructor.prototype : t instanceof Object ? s : null
        }
    }, function (t, e, n) {
        "use strict";
        var r = n(19),
            i = n(15),
            o = n(26),
            s = n(47),
            c = n(48),
            a = n(22),
            u = n(49),
            l = n(50);
        i(i.S + i.F * !n(52)(function (t) {
            Array.from(t)
        }), "Array", {
            from: function (t) {
                var e, n, i, f, h = o(t),
                    d = "function" == typeof this ? this : Array,
                    p = arguments.length,
                    v = p > 1 ? arguments[1] : void 0,
                    b = void 0 !== v,
                    y = 0,
                    m = l(h);
                if (b && (v = r(v, p > 2 ? arguments[2] : void 0, 2)), void 0 == m || d == Array && c(m))
                    for (e = a(h.length), n = new d(e) ; e > y; y++) u(n, y, b ? v(h[y], y) : h[y]);
                else
                    for (f = m.call(h), n = new d; !(i = f.next()).done; y++) u(n, y, b ? s(f, v, [i.value, y], !0) : i.value);
                return n.length = y, n
            }
        })
    }, function (t, e, n) {
        var r = n(6);
        t.exports = function (t, e, n, i) {
            try {
                return i ? e(r(n)[0], n[1]) : e(n)
            } catch (e) {
                var o = t.return;
                throw void 0 !== o && r(o.call(t)), e
            }
        }
    }, function (t, e, n) {
        var r = n(13),
            i = n(0)("iterator"),
            o = Array.prototype;
        t.exports = function (t) {
            return void 0 !== t && (r.Array === t || o[i] === t)
        }
    }, function (t, e, n) {
        "use strict";
        var r = n(5),
            i = n(11);
        t.exports = function (t, e, n) {
            e in t ? r.f(t, e, i(0, n)) : t[e] = n
        }
    }, function (t, e, n) {
        var r = n(51),
            i = n(0)("iterator"),
            o = n(13);
        t.exports = n(3).getIteratorMethod = function (t) {
            if (void 0 != t) return t[i] || t["@@iterator"] || o[r(t)]
        }
    }, function (t, e, n) {
        var r = n(21),
            i = n(0)("toStringTag"),
            o = "Arguments" == r(function () {
                return arguments
            }()),
            s = function (t, e) {
                try {
                    return t[e]
                } catch (t) { }
            };
        t.exports = function (t) {
            var e, n, c;
            return void 0 === t ? "Undefined" : null === t ? "Null" : "string" == typeof (n = s(e = Object(t), i)) ? n : o ? r(e) : "Object" == (c = r(e)) && "function" == typeof e.callee ? "Arguments" : c
        }
    }, function (t, e, n) {
        var r = n(0)("iterator"),
            i = !1;
        try {
            var o = [7][r]();
            o.return = function () {
                i = !0
            }, Array.from(o, function () {
                throw 2
            })
        } catch (t) { }
        t.exports = function (t, e) {
            if (!e && !i) return !1;
            var n = !1;
            try {
                var o = [7],
                    s = o[r]();
                s.next = function () {
                    return {
                        done: n = !0
                    }
                }, o[r] = function () {
                    return s
                }, t(o)
            } catch (t) { }
            return n
        }
    }, function (t, e, n) {
        var r, i, o; /*! scrollbarWidth.js v0.1.3 | felixexter | MIT | https://github.com/felixexter/scrollbarWidth */
        ! function (n, s) {
            i = [], r = s, void 0 !== (o = "function" == typeof r ? r.apply(e, i) : r) && (t.exports = o)
        }(0, function () {
            "use strict";

            function t() {
                if ("undefined" == typeof document) return 0;
                var t, e = document.body,
                    n = document.createElement("div"),
                    r = n.style;
                return r.position = "absolute", r.top = r.left = "-9999px", r.width = r.height = "100px", r.overflow = "scroll", e.appendChild(n), t = n.offsetWidth - n.clientWidth, e.removeChild(n), t
            }
            return t
        })
    }, function (t, e, n) {
        (function (e) {
            function n(t, e, n) {
                function i(e) {
                    var n = v,
                        r = b;
                    return v = b = void 0, w = e, m = t.apply(r, n)
                }

                function o(t) {
                    return w = t, g = setTimeout(l, e), S ? i(t) : m
                }

                function a(t) {
                    var n = t - x,
                        r = t - w,
                        i = e - n;
                    return A ? O(i, y - r) : i
                }

                function u(t) {
                    var n = t - x,
                        r = t - w;
                    return void 0 === x || n >= e || n < 0 || A && r >= y
                }

                function l() {
                    var t = _();
                    if (u(t)) return f(t);
                    g = setTimeout(l, a(t))
                }

                function f(t) {
                    return g = void 0, k && v ? i(t) : (v = b = void 0, m)
                }

                function h() {
                    void 0 !== g && clearTimeout(g), w = 0, v = x = b = g = void 0
                }

                function d() {
                    return void 0 === g ? m : f(_())
                }

                function p() {
                    var t = _(),
                        n = u(t);
                    if (v = arguments, b = this, x = t, n) {
                        if (void 0 === g) return o(x);
                        if (A) return g = setTimeout(l, e), i(x)
                    }
                    return void 0 === g && (g = setTimeout(l, e)), m
                }
                var v, b, y, m, g, x, w = 0,
                    S = !1,
                    A = !1,
                    k = !0;
                if ("function" != typeof t) throw new TypeError(c);
                return e = s(e) || 0, r(n) && (S = !!n.leading, A = "maxWait" in n, y = A ? E(s(n.maxWait) || 0, e) : y, k = "trailing" in n ? !!n.trailing : k), p.cancel = h, p.flush = d, p
            }

            function r(t) {
                var e = typeof t;
                return !!t && ("object" == e || "function" == e)
            }

            function i(t) {
                return !!t && "object" == typeof t
            }

            function o(t) {
                return "symbol" == typeof t || i(t) && g.call(t) == u
            }

            function s(t) {
                if ("number" == typeof t) return t;
                if (o(t)) return a;
                if (r(t)) {
                    var e = "function" == typeof t.valueOf ? t.valueOf() : t;
                    t = r(e) ? e + "" : e
                }
                if ("string" != typeof t) return 0 === t ? t : +t;
                t = t.replace(l, "");
                var n = h.test(t);
                return n || d.test(t) ? p(t.slice(2), n ? 2 : 8) : f.test(t) ? a : +t
            }
            var c = "Expected a function",
                a = NaN,
                u = "[object Symbol]",
                l = /^\s+|\s+$/g,
                f = /^[-+]0x[0-9a-f]+$/i,
                h = /^0b[01]+$/i,
                d = /^0o[0-7]+$/i,
                p = parseInt,
                v = "object" == typeof e && e && e.Object === Object && e,
                b = "object" == typeof self && self && self.Object === Object && self,
                y = v || b || Function("return this")(),
                m = Object.prototype,
                g = m.toString,
                E = Math.max,
                O = Math.min,
                _ = function () {
                    return y.Date.now()
                };
            t.exports = n
        }).call(e, n(55))
    }, function (t, e) {
        var n;
        n = function () {
            return this
        }();
        try {
            n = n || Function("return this")() || (0, eval)("this")
        } catch (t) {
            "object" == typeof window && (n = window)
        }
        t.exports = n
    }, function (t, e, n) {
        "use strict";

        function r(t) {
            return parseFloat(t) || 0
        }

        function i(t) {
            return Array.prototype.slice.call(arguments, 1).reduce(function (e, n) {
                return e + r(t["border-" + n + "-width"])
            }, 0)
        }

        function o(t) {
            for (var e = ["top", "right", "bottom", "left"], n = {}, i = 0, o = e; i < o.length; i += 1) {
                var s = o[i],
                    c = t["padding-" + s];
                n[s] = r(c)
            }
            return n
        }

        function s(t) {
            var e = t.getBBox();
            return f(0, 0, e.width, e.height)
        }

        function c(t) {
            var e = t.clientWidth,
                n = t.clientHeight;
            if (!e && !n) return _;
            var s = getComputedStyle(t),
                c = o(s),
                u = c.left + c.right,
                l = c.top + c.bottom,
                h = r(s.width),
                d = r(s.height);
            if ("border-box" === s.boxSizing && (Math.round(h + u) !== e && (h -= i(s, "left", "right") + u), Math.round(d + l) !== n && (d -= i(s, "top", "bottom") + l)), !a(t)) {
                var p = Math.round(h + u) - e,
                    v = Math.round(d + l) - n;
                1 !== Math.abs(p) && (h -= p), 1 !== Math.abs(v) && (d -= v)
            }
            return f(c.left, c.top, h, d)
        }

        function a(t) {
            return t === document.documentElement
        }

        function u(t) {
            return d ? x(t) ? s(t) : c(t) : _
        }

        function l(t) {
            var e = t.x,
                n = t.y,
                r = t.width,
                i = t.height,
                o = "undefined" != typeof DOMRectReadOnly ? DOMRectReadOnly : Object,
                s = Object.create(o.prototype);
            return O(s, {
                x: e,
                y: n,
                width: r,
                height: i,
                top: n,
                right: e + r,
                bottom: i + n,
                left: e
            }), s
        }

        function f(t, e, n, r) {
            return {
                x: t,
                y: e,
                width: n,
                height: r
            }
        }
        Object.defineProperty(e, "__esModule", {
            value: !0
        });
        var h = function () {
            function t(t, e) {
                var n = -1;
                return t.some(function (t, r) {
                    return t[0] === e && (n = r, !0)
                }), n
            }
            return "undefined" != typeof Map ? Map : function () {
                function e() {
                    this.__entries__ = []
                }
                var n = {
                    size: {}
                };
                return n.size.get = function () {
                    return this.__entries__.length
                }, e.prototype.get = function (e) {
                    var n = t(this.__entries__, e),
                        r = this.__entries__[n];
                    return r && r[1]
                }, e.prototype.set = function (e, n) {
                    var r = t(this.__entries__, e);
                    ~r ? this.__entries__[r][1] = n : this.__entries__.push([e, n])
                }, e.prototype.delete = function (e) {
                    var n = this.__entries__,
                        r = t(n, e);
                    ~r && n.splice(r, 1)
                }, e.prototype.has = function (e) {
                    return !!~t(this.__entries__, e)
                }, e.prototype.clear = function () {
                    this.__entries__.splice(0)
                }, e.prototype.forEach = function (t, e) {
                    void 0 === e && (e = null);
                    for (var n = 0, r = this.__entries__; n < r.length; n += 1) {
                        var i = r[n];
                        t.call(e, i[1], i[0])
                    }
                }, Object.defineProperties(e.prototype, n), e
            }()
        }(),
            d = "undefined" != typeof window && "undefined" != typeof document && window.document === document,
            p = function () {
                return "function" == typeof requestAnimationFrame ? requestAnimationFrame : function (t) {
                    return setTimeout(function () {
                        return t(Date.now())
                    }, 1e3 / 60)
                }
            }(),
            v = 2,
            b = function (t, e) {
                function n() {
                    o && (o = !1, t()), s && i()
                }

                function r() {
                    p(n)
                }

                function i() {
                    var t = Date.now();
                    if (o) {
                        if (t - c < v) return;
                        s = !0
                    } else o = !0, s = !1, setTimeout(r, e);
                    c = t
                }
                var o = !1,
                    s = !1,
                    c = 0;
                return i
            },
            y = ["top", "right", "bottom", "left", "width", "height", "size", "weight"],
            m = "undefined" != typeof navigator && /Trident\/.*rv:11/.test(navigator.userAgent),
            g = "undefined" != typeof MutationObserver && !m,
            E = function () {
                this.connected_ = !1, this.mutationEventsAdded_ = !1, this.mutationsObserver_ = null, this.observers_ = [], this.onTransitionEnd_ = this.onTransitionEnd_.bind(this), this.refresh = b(this.refresh.bind(this), 20)
            };
        E.prototype.addObserver = function (t) {
            ~this.observers_.indexOf(t) || this.observers_.push(t), this.connected_ || this.connect_()
        }, E.prototype.removeObserver = function (t) {
            var e = this.observers_,
                n = e.indexOf(t);
            ~n && e.splice(n, 1), !e.length && this.connected_ && this.disconnect_()
        }, E.prototype.refresh = function () {
            this.updateObservers_() && this.refresh()
        }, E.prototype.updateObservers_ = function () {
            var t = this.observers_.filter(function (t) {
                return t.gatherActive(), t.hasActive()
            });
            return t.forEach(function (t) {
                return t.broadcastActive()
            }), t.length > 0
        }, E.prototype.connect_ = function () {
            d && !this.connected_ && (document.addEventListener("transitionend", this.onTransitionEnd_), window.addEventListener("resize", this.refresh), g ? (this.mutationsObserver_ = new MutationObserver(this.refresh), this.mutationsObserver_.observe(document, {
                attributes: !0,
                childList: !0,
                characterData: !0,
                subtree: !0
            })) : (document.addEventListener("DOMSubtreeModified", this.refresh), this.mutationEventsAdded_ = !0), this.connected_ = !0)
        }, E.prototype.disconnect_ = function () {
            d && this.connected_ && (document.removeEventListener("transitionend", this.onTransitionEnd_), window.removeEventListener("resize", this.refresh), this.mutationsObserver_ && this.mutationsObserver_.disconnect(), this.mutationEventsAdded_ && document.removeEventListener("DOMSubtreeModified", this.refresh), this.mutationsObserver_ = null, this.mutationEventsAdded_ = !1, this.connected_ = !1)
        }, E.prototype.onTransitionEnd_ = function (t) {
            var e = t.propertyName;
            y.some(function (t) {
                return !!~e.indexOf(t)
            }) && this.refresh()
        }, E.getInstance = function () {
            return this.instance_ || (this.instance_ = new E), this.instance_
        }, E.instance_ = null;
        var O = function (t, e) {
            for (var n = 0, r = Object.keys(e) ; n < r.length; n += 1) {
                var i = r[n];
                Object.defineProperty(t, i, {
                    value: e[i],
                    enumerable: !1,
                    writable: !1,
                    configurable: !0
                })
            }
            return t
        },
            _ = f(0, 0, 0, 0),
            x = function () {
                return "undefined" != typeof SVGGraphicsElement ? function (t) {
                    return t instanceof SVGGraphicsElement
                } : function (t) {
                    return t instanceof SVGElement && "function" == typeof t.getBBox
                }
            }(),
            w = function (t) {
                this.broadcastWidth = 0, this.broadcastHeight = 0, this.contentRect_ = f(0, 0, 0, 0), this.target = t
            };
        w.prototype.isActive = function () {
            var t = u(this.target);
            return this.contentRect_ = t, t.width !== this.broadcastWidth || t.height !== this.broadcastHeight
        }, w.prototype.broadcastRect = function () {
            var t = this.contentRect_;
            return this.broadcastWidth = t.width, this.broadcastHeight = t.height, t
        };
        var S = function (t, e) {
            var n = l(e);
            O(this, {
                target: t,
                contentRect: n
            })
        },
            A = function (t, e, n) {
                if ("function" != typeof t) throw new TypeError("The callback provided as parameter 1 is not a function.");
                this.activeObservations_ = [], this.observations_ = new h, this.callback_ = t, this.controller_ = e, this.callbackCtx_ = n
            };
        A.prototype.observe = function (t) {
            if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
            if ("undefined" != typeof Element && Element instanceof Object) {
                if (!(t instanceof Element)) throw new TypeError('parameter 1 is not of type "Element".');
                var e = this.observations_;
                e.has(t) || (e.set(t, new w(t)), this.controller_.addObserver(this), this.controller_.refresh())
            }
        }, A.prototype.unobserve = function (t) {
            if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
            if ("undefined" != typeof Element && Element instanceof Object) {
                if (!(t instanceof Element)) throw new TypeError('parameter 1 is not of type "Element".');
                var e = this.observations_;
                e.has(t) && (e.delete(t), e.size || this.controller_.removeObserver(this))
            }
        }, A.prototype.disconnect = function () {
            this.clearActive(), this.observations_.clear(), this.controller_.removeObserver(this)
        }, A.prototype.gatherActive = function () {
            var t = this;
            this.clearActive(), this.observations_.forEach(function (e) {
                e.isActive() && t.activeObservations_.push(e)
            })
        }, A.prototype.broadcastActive = function () {
            if (this.hasActive()) {
                var t = this.callbackCtx_,
                    e = this.activeObservations_.map(function (t) {
                        return new S(t.target, t.broadcastRect())
                    });
                this.callback_.call(t, e, t), this.clearActive()
            }
        }, A.prototype.clearActive = function () {
            this.activeObservations_.splice(0)
        }, A.prototype.hasActive = function () {
            return this.activeObservations_.length > 0
        };
        var k = "undefined" != typeof WeakMap ? new WeakMap : new h,
            j = function (t) {
                if (!(this instanceof j)) throw new TypeError("Cannot call a class as a function");
                if (!arguments.length) throw new TypeError("1 argument required, but only 0 present.");
                var e = E.getInstance(),
                    n = new A(t, e, this);
                k.set(this, n)
            };
        ["observe", "unobserve", "disconnect"].forEach(function (t) {
            j.prototype[t] = function () {
                return (e = k.get(this))[t].apply(e, arguments);
                var e
            }
        });
        var M = function () {
            return "undefined" != typeof ResizeObserver ? ResizeObserver : j
        }();
        e.default = M
    }, function (t, e) { }, function (t, e, n) {
        "use strict";

        function r(t) {
            if (null === t || void 0 === t) throw new TypeError("Object.assign cannot be called with null or undefined");
            return Object(t)
        }
        /*
        object-assign
        (c) Sindre Sorhus
        @license MIT
        */
        var i = Object.getOwnPropertySymbols,
            o = Object.prototype.hasOwnProperty,
            s = Object.prototype.propertyIsEnumerable;
        t.exports = function () {
            try {
                if (!Object.assign) return !1;
                var t = new String("abc");
                if (t[5] = "de", "5" === Object.getOwnPropertyNames(t)[0]) return !1;
                for (var e = {}, n = 0; n < 10; n++) e["_" + String.fromCharCode(n)] = n;
                if ("0123456789" !== Object.getOwnPropertyNames(e).map(function (t) {
                        return e[t]
                }).join("")) return !1;
                var r = {};
                return "abcdefghijklmnopqrst".split("").forEach(function (t) {
                    r[t] = t
                }), "abcdefghijklmnopqrst" === Object.keys(Object.assign({}, r)).join("")
            } catch (t) {
                return !1
            }
        }() ? Object.assign : function (t, e) {
            for (var n, c, a = r(t), u = 1; u < arguments.length; u++) {
                n = Object(arguments[u]);
                for (var l in n) o.call(n, l) && (a[l] = n[l]);
                if (i) {
                    c = i(n);
                    for (var f = 0; f < c.length; f++) s.call(n, c[f]) && (a[c[f]] = n[c[f]])
                }
            }
            return a
        }
    }]).default
});
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
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mBottomNavigation",
    defaults = {
        hideLabels: 4,
        onButtonClick: function () { }, //Executes when a button is clicked
        followNavigation: false, //Follow the href on the button
        ripple: true
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mBottomNavigation", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        //Selects an element by its index
        select: function (index) {
            var _this = this;
            var $element = $(this.element);
            var buttons = $element.find(".m-bottom-navigation__tab");
            buttons.removeClass("m-bottom-navigation__tab--active");
            var tab = $element.find(".m-bottom-navigation__tab:nth-child(" + index + ")");
            tab.addClass("m-bottom-navigation__tab--active");
            _this.settings.onButtonClick($(this));

        },

        init: function () {
            var _this = this;
            var $element = $(this.element);
            if (!$element.hasClass("js-initialized")) {
                $element.addClass("js-initialized");
                var buttons = $element.find(".m-bottom-navigation__tab");

                //Hide labels on inactive buttons if it should
                if (buttons.length >= this.settings.hideLabels) {
                    $element.addClass("m-bottom-navigation__menu--hide-labels");
                }

                //Show ripple effect in text color 
                if (this.settings.ripple) {
                    var color = $element.find(".m-bottom-navigation__tab--active .m-bottom-navigation__button").css("color");
                    buttons.attr("data-ripple", color);
                }

                buttons.on("mousedown", function (e) {
                    if (!_this.settings.followNavigation) e.preventDefault();
                    var index = $(this).closest(".m-bottom-navigation__tab").index() + 1;
                    _this.select(index);
                });

            }
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
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mBottomSheet",
    defaults = {
        titleToggle: true,
        closeOnAnchorClick: false,
        minimizeOnAnchorClick: true,
        followNavigation: false,
        overlay: false,
        overlayOnlyOnMaximize: false,
        onInit: function () { },
        onMinimize: function () { },
        onMaximize: function () { },
        onClose: function () { },
        onRemove: function () { }
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mBottomSheet", this);
    }


    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        //Show the bottom sheet
        maximize: function () {
            var $element = $(this.element);
            $element.removeClass("m-bottom-sheet--hidden").addClass("m-bottom-sheet--closed m-bottom-sheet--show");
            var title = $element.find(".m-bottom-sheet__title");
            var contentHeight = $element.outerHeight() - title.height();
            $element.css("transform", "translateY(0px)");
            $element.one("transitionend", this.settings.onMaximize());
            if (this.settings.overlayOnlyOnMaximize && this.settings.overlay) {
                $element.closest(".m-overlay").addClass("m-overlay--show");
            }
        },

        //Hide the bottom sheet
        minimize: function (firstRun) {
            firstRun = (firstRun == null) ? false : true;
            var _this = this;
            var $element = $(this.element);
            $element.addClass("m-bottom-sheet--hidden").removeClass("m-bottom-sheet--closed m-bottom-sheet--show");
            $element.addClass("m-bottom-sheet--hidden");
            var title = $element.find(".m-bottom-sheet__title");
            var contentHeight = $element.outerHeight() - title.height();
            var toggleHeight = (this.settings.titleToggle == true) ? Math.round(contentHeight) : 0;
            $element.css("transform", "translateY(" + toggleHeight + "px)");
            if (_this.settings.overlayOnlyOnMaximize && this.settings.overlay) {
                $element.closest(".m-overlay").removeClass("m-overlay--show");
            }
            $element.one("transitionend", function () {
                if (firstRun) {
                    _this.settings.onInit();
                } else {
                    _this.settings.onMinimize();
                }
            });
        },

        //Closes the bottom sheet (off screen but exists)
        close: function () {
            var $element = $(this.element);
            $element.addClass("m-bottom-sheet--closed").removeClass("m-bottom-sheet--hidden m-bottom-sheet--show");
            var contentHeight = $element.outerHeight();
            $element.css("transform", "translateY(" + Math.round(contentHeight) + "px)");
            $element.one("transitionend", this.settings.onClose());
            $element.closest(".m-overlay").removeClass("m-overlay--show");
        },

        //Closes the bottom sheet and removes it from the DOM
        remove: function () {
            var $element = $(this.element);
            var _this = this;
            $element.addClass("m-bottom-sheet--closed").removeClass("m-bottom-sheet--hidden m-bottom-sheet--show");
            var contentHeight = $element.outerHeight();
            $element.css("transform", "translateY(" + Math.round(contentHeight + 1) + "px)");
            $element.closest(".m-overlay").removeClass("m-overlay--show");
            $element.one("transitionend", function () {
                $element.closest(".m-overlay").remove();
                $element.remove();
                _this.settings.onRemove();

            })
        },

        //Redraw on resize
        redraw: function (scope, element) {
            var $element = $(this.element);
            if ($element.hasClass("m-bottom-sheet--hidden")) {
                this.minimize();
            } else {
                this.maximize();
            }
        },

        //Bind to anchors
        bind: function () {
            var _this = this;
            var $element = $(this.element);
            $element.find("a").on("click", function (e) {
                if (_this.settings.followNavigation) e.preventDefault();
                if (_this.settings.closeOnAnchorClick) {
                    _this.close();
                } else if (_this.settings.minimizeOnAnchorClick && _this.settings.titleToggle) {
                    _this.minimize();
                } else if (_this.settings.minimizeOnAnchorClick) {
                    _this.close();
                }
            });

        },

        //Initialize bottom sheet
        init: function () {
            var _this = this;
            this.element.bottomSheet = Plugin.prototype;
            var $element = $(this.element);

            if (!$element.hasClass("js-initialized")) {
                _this.minimize(true);

                //Overlay
                if (_this.settings.overlay) {
                    var overlay = $("<div />", { "class": "m-overlay" });
                    $element.wrap(overlay);
                }

                //On resize draw
                $(window).on("resize", function () { _this.redraw(_this, $element) });

                $element.offset();
                $element.addClass("js-initialized");
                if (!_this.settings.overlayOnlyOnMaximize && _this.settings.overlay) $element.closest(".m-overlay").addClass("m-overlay--show");


                //Add ripple effects for elements needed
                var rippleElements = (_this.settings.titleToggle) ? ".m-bottom-sheet__list-item, .m-bottom-sheet__title" : ".m-bottom-sheet__list-item";
                $element.find(rippleElements).attr("data-ripple", $element.css("color"));
                var title = $element.find(".m-bottom-sheet__title");

                //Bind anchors
                this.bind();

                //On title click, toggle bottom sheet
                title.on("click", function () {
                    if ($element.hasClass("m-bottom-sheet--hidden")) {
                        _this.maximize();
                    } else {
                        _this.minimize();
                    }
                });
            }
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
        returnFormat: 'D-M-YYYY',
        onSelect: function () { }
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
                        $dateReelWrapper.css("height", "");
                        $yearReelWrapper.css("height", "");
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
                        if (_this.settings.onSelect) _this.settings.onSelect();
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
                        if (_this.settings.onSelect) _this.settings.onSelect(moment(_this.settings.activeDate).toDate());
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

            if (this.$element.data("datepickerInitialized") == null) {
                this.$element.data("datepickerInitialized", true);
                this.$element.on("click focus", function () {
                    $(this).blur();
                    _this.show();
                });
            }

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
        buttons: [{ text: "OK", onClick: function () { }, "class": "", preventClose: false }],
        onOpen: function () { },
        onClose: function () {
        }
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
        if (_this.settings.buttons[i].preventClose == null || _this.settings.buttons[i].preventClose == false) {
            button.on("click", function () {
                _this.close();
            });
        }
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
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mDropdown",
    defaults = {};

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mDropdown", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        collapse: function ($element) {
            var dropdown = $element.closest(".dropdown-wrapper").find(".dropdown-button");
            dropdown.removeClass("dropdown-button--active");
            var dropdownOptions = $("#options-" + dropdown.attr("id"));
            if (this.measuring) {
                dropdownOptions.remove();
            } else {
                dropdownOptions.removeClass("dropdown-button__options--show");
                dropdownOptions.one("transitionend", function () { dropdownOptions.remove(); });
            }
        },

        expand: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            dropdown.addClass("dropdown-button--active");

            //Calculate position and size
            var calculateMeasurements = function (dropdown, dropdownOptions, selectedOption) {
                var object = new Object();
                object.width = "calc(" + dropdown.outerWidth() + "px + 1.6rem)";
                object.offset = new Object()
                object.offset.left = "calc(" + dropdown.offset().left + "px - 0.8rem)";
                object.offset.top = dropdown.offset().top;
                object.origin = 0;
                object.selectedOptionTop = 0;
                if (selectedOption.length > 0) {
                    object.origin = Math.round(selectedOption.width() / 2) + "px " + Math.round(selectedOption.position().top * 2 + (selectedOption.outerHeight())) + "px";
                    object.offset.top -= selectedOption.index() * selectedOption.outerHeight();
                }

                //When positioned offscreen
                if (object.offset.top < 25) object.offset.top = 25;
                var endPosition = object.offset.top + dropdownOptions.outerHeight();
                var maxPosition = $(window).height() - 25
                if (endPosition > maxPosition) object.offset.top = maxPosition - dropdownOptions.outerHeight();

                object.offset.top = object.offset.top + "px";
                return object;
            }

            //Create the drop down
            var options = this.$element.find("option");
            var dropdownOptions = $("<ul />", { "class": "dropdown-button__options", "id": "options-" + dropdown.attr("id") });
            $("body").append(dropdownOptions);

            //Append the options
            for (var i = 0; i < options.length; i++) {
                var selected = ($(options[i]).val() == this.$element.val()) ? "dropdown-button__option--selected" : "";
                dropdownOptions.append($("<li />", { "class": "dropdown-button__option " + selected, "data-value": $(options[i]).val(), "text": $(options[i]).text(), }));
            }

            var selectedOption = dropdownOptions.find(".dropdown-button__option--selected");
            var measurements = calculateMeasurements(dropdown, dropdownOptions, selectedOption);
            dropdownOptions.css({
                "width": measurements.width,
                "left": measurements.offset.left,
                "top": measurements.offset.top
            });

            if (this.measuring) {
                dropdownOptions.css({ "width": "100%", "opacity": "0", "pointer-events": "none" });
                dropdownOptions.find(".dropdown-button__option").css("display", "inline-block");
            } else {

                //scroll item in view if needed
                if (dropdownOptions.get(0).scrollHeight > dropdownOptions.height()) {
                    dropdownOptions.scrollTop(selectedOption.position().top);
                }

                //Make the dropdown list visible
                dropdownOptions.offset();
                dropdownOptions.addClass("dropdown-button__options--show");

            }
        },

        destroy: function () {
            if (this.$element.parent().hasClass("dropdown-wrapper")) {
                this.$element.next().remove();
                this.$element.unwrap();
            }
        },

        val: function (value) {
            this.$element.val(value);
            var text = this.$element.find("option[value='" + value + "']").text();
            if (text) {
                this.$element.closest(".dropdown-wrapper").find(".dropdown-button__value").attr("data-value", value).text(text);
                var $fieldset = this.$element.closest("fieldset");
                if ($fieldset.length > 0) {
                    $fieldset.addClass("fieldset--filled");
                }
            }
            this.$element.trigger("change");
        },

        disable: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            this.$element.prop("disable", true);
            dropdown.addClass("dropdown-button--disabled");

        },

        enable: function () {
            var dropdown = this.$element.closest(".dropdown-wrapper").find(".dropdown-button");
            this.$element.prop("disable", true);
            dropdown.removeClass("dropdown-button--disabled");
        },

        init: function () {
            var _this = this;
            this.destroy();
            //Create guid
            var guid = function () {
                function s4() { return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1); }
                return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
            }

            //Create element
            var id = guid();
            var $fieldset = this.$element.closest("fieldset");
            var $helper = $fieldset.find(".input-helper");
            var $icon = $fieldset.find(".input-icon");
            this.$element.wrap($("<div />", { "class": "dropdown-wrapper" }));
            var wrapper = this.$element.closest(".dropdown-wrapper");
            var dropdown = $("<div />", { "class": "dropdown-button", "id": id });
            dropdown.append($("<div />", { "class": "dropdown-button__value" }));
            dropdown.append($("<i />", { "class": "dropdown-button__arrow fas fa-caret-down", "html": "" }));
            wrapper.append(dropdown);

            $fieldset.addClass("fieldset--dropdown");
            if ($helper.length > 0) {
                $fieldset.addClass("fieldset--helper");
            }

            if ($icon.length > 0) {
                $fieldset.addClass("fieldset--icon");
            }

            //Get selected option and update value
            var selectedValue = this.$element.val();
            if (selectedValue != "") {
                this.val(selectedValue);
            }

            var measure = function () {
                _this.measuring = true;
                _this.expand();
                var widestOption = 0;
                $("#options-" + id + " .dropdown-button__option").each(function () {
                    if ($(this).outerWidth() > widestOption) widestOption = $(this).outerWidth();
                });
                dropdown.css("min-width", Math.ceil(widestOption) + "px");
                _this.collapse(_this.$element);
                _this.measuring = false;
            }

            measure();
            $(window).on("resize", function () {
                measure();
            });

            if (this.$element.prop("disabled")) {
                this.disable();
            }

            //Show list on click
            dropdown.on("click", function () {

                if ($(this).hasClass("dropdown-button--disabled") == false) {
                    _this.expand();

                    //Close on scroll
                    var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
                    body.one("scroll.dropdown", function () { _this.collapse(_this.$element) });

                    //On click collapse and if item is selected update value
                    $(document).on("mousedown.dropdownclick", function (e) {
                        var target = $(e.target);
                        if (target.hasClass("dropdown-button__options")) {
                            return;
                        } else if (target.hasClass("dropdown-button__option")) {
                            target.closest(".dropdown-button__options").find(".dropdown-button__option--selected").removeClass("dropdown-button__option--selected");
                            target.addClass("dropdown-button__option--selected");
                            _this.val(target.attr("data-value"));
                        }
                        $(document).off("mousedown.dropdownclick");
                        _this.collapse(_this.$element);
                    });
                }
            });


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

; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mList",
    defaults = {};

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mList", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        toggleExpand: function (target, checkForOpenElements) {

            var prevDivider = (target.prev().hasClass("list__divider")) ? target.prev() : null;

            if (target.length > 0 && checkForOpenElements == null) {
                if (target.closest(".list--only-one-expandable").length > 0) {
                    var itemOpen = this.$element.find(".list__item--expanded");
                    if (itemOpen[0] != target[0]) {
                        this.toggleExpand(itemOpen, false);
                    }
                }
            }

            target.toggleClass("list__item--expanded");
            target.next().find(".ripple").remove();
            if (target.hasClass("list__item--expanded")) {
                target.next().slideDown(200);
                if (prevDivider) prevDivider.css("display", "none");
            } else {
                target.next().slideUp(200);
                if (prevDivider) prevDivider.css("display", "");
            }
        },

        init: function () {
            var _this = this;

            var listItem = this.$element.find(".list__item--expanded");
            listItem.next().css("display", "block");
            var prevDivider = (listItem.prev().hasClass("list__divider")) ? listItem.prev() : null;
            if (prevDivider) prevDivider.css("display", "none");

            if (this.$element.find(".list__item--expandable").length > 0) {
                this.$element.on("click", function (e) {
                    var $target = $(e.target).closest(".list__item--expandable");
                    if ($target.length == 0 && $(e.target).hasClass("list__item--expandable")) $target = $(e.target);
                    _this.toggleExpand($target);
                })
            }

            if (this.$element.hasClass("list--indexed") == true && this.$element.hasClass("list--indexed-inside") == false) {
                this.$element.on("scroll", function () {
                    if (_this.$element.scrollTop() > 0 && _this.$element.hasClass("list-scrolled") == false) {
                        _this.$element.addClass("list-scrolled");
                    } else if (_this.$element.scrollTop() == 0) {
                        _this.$element.removeClass("list-scrolled");
                    }
                });
            }

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
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mMenu",
    defaults = {
        onSelect: function (item) { }
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.$button = null;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mMenu", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        open: function () {
            var _this = this;
           
            _this.$element.off("transitionend");
            _this.returnToSleep();
            this.$element.addClass("menu--show");
            _this.$element.offset();

            this.$element.appendTo($("body"));

            var object = new Object();
            object.height = Number(this.$element.css("height").split("px").join(""));
            object.width = Number(this.$element.css("width").split("px").join(""));
            object.buttonTop = this.$button.offset().top;
            object.buttonHeight = this.$button.innerHeight();
            object.buttonLeft = this.$button.offset().left;
            object.buttonWidth = this.$button.innerWidth();
            object.maxPosition = $(window).innerHeight() - 25;
            object.maxXPosition = $(window).innerWidth() - 25;
            object.minPosition = 25;
            var screenSize = (object.maxPosition - object.minPosition);
            object.screenBottomSpace = screenSize - object.buttonTop + object.buttonHeight;
            object.screenTopSpace = object.buttonTop - object.minPosition;
            object.topPosition = object.buttonTop - object.height;
            object.maxHeight = object.height;

            if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition && object.screenTopSpace > object.screenBottomSpace) {
                var top = object.maxPosition - (object.maxPosition + 25 - object.buttonTop) - object.height;
                if (top < 25) object.maxHeight = object.screenTopSpace;
            } else if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition) {
                object.maxHeight = object.maxPosition - object.buttonTop - object.buttonHeight;
            }
            
           
            if (object.buttonTop + object.buttonHeight + object.height > object.maxPosition && object.screenTopSpace > object.screenBottomSpace) {
                //Item is too long, most space on top
                this.$element.css({ "bottom": object.maxPosition + 25 - object.buttonTop + "px", "max-height": object.maxHeight + 30 });

            } else {
                this.$element.css({ "top": object.buttonTop + object.buttonHeight + "px", "max-height": object.maxHeight + 30 });
            }

            if (object.width + object.buttonLeft > object.maxXPosition) {
                this.$element.css({ "right": object.maxXPosition - object.buttonLeft - object.buttonWidth + 25, "width": "0" });
            } else {
                this.$element.css({ "left": object.buttonLeft, "width": "0" });
            }
            this.$element.find(".menu__options").css({ "width": object.width });
            
            this.$element.css({ "max-height": "0px", "width": "0px" }).addClass("menu--animate");
            _this.$element.offset();


            _this.$element.css({ "max-height": object.maxHeight, "width": object.width });
            _this.$element.on("transitionend", function (e) {
                if (e.originalEvent.propertyName !== 'max-height') return;
                _this.$element.removeClass("menu--animate");
                _this.$element.off("transitionend");
            });

        },

        returnToSleep: function () {
            this.$element.removeClass("menu--show menu--animate menu--animate--close");
            this.$button.append(this.$element);
            this.$element.attr("style", "");
            this.$element.find(".ripple").remove();
            $(document).off("mousedown.menuclick resize.menuresize touchstart.menutouch");
        },

        close: function (instant) {
            if (instant) {
                this.returnToSleep();
            } else {
                var _this = this;
                _this.$element.off("transitionend");
                this.$element.addClass("menu--animate menu--animate--close");
                this.$element.css({ "max-height": "0px", "width": "0px" });
                this.$element.on("transitionend", function (e) {
                    if (e.originalEvent.propertyName !== 'max-height') return;
                    _this.returnToSleep();
                    _this.$element.off("transitionend");
                });
            }
        },

        init: function () {
            var _this = this;
            this.$button = this.$element.parent();

            if (this.$element.find(".menu__option svg").length > 0) {
                this.$element.find(".menu__option").each(function () {
                    if ($(this).find("svg").length == 0) {
                        $(this).addClass("menu__option--no-icon");
                    }
                });
            }

            this.$button.on("click", function (e) {
                e.preventDefault();
                if (_this.$element.hasClass("menu--show") == false) {
                    _this.open();

                    //On scroll close
                    var body = ($(".m-body").length > 0) ? $(".m-body") : $("body");
                    body.one("scroll.menu", function () { _this.close(true) });
                    $(window).one("resize.menuresize", function () { _this.close(true) });

                    //On click outside close
                    $(document).on("mousedown.menuclick touchstart.menutouch", function (e) {
                        var target = $(e.target);
                        if (target.hasClass("menu__options") || target.hasClass("menu__hr")) {
                            return;
                        } else if (target.hasClass("menu__option")) {
                            //ON CLICK
                            var href = target.attr("data-href");
                            if (href != null) window.location = href;
                            _this.settings.onSelect(target);
                        }

                        _this.close();
                    });

                } else {
                    _this.close();
                }
            });
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
/*! modernizr 3.6.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-touchevents-setclasses !*/
!function (e, n, t) { function o(e, n) { return typeof e === n } function s() { var e, n, t, s, a, i, r; for (var l in c) if (c.hasOwnProperty(l)) { if (e = [], n = c[l], n.name && (e.push(n.name.toLowerCase()), n.options && n.options.aliases && n.options.aliases.length)) for (t = 0; t < n.options.aliases.length; t++) e.push(n.options.aliases[t].toLowerCase()); for (s = o(n.fn, "function") ? n.fn() : n.fn, a = 0; a < e.length; a++) i = e[a], r = i.split("."), 1 === r.length ? Modernizr[r[0]] = s : (!Modernizr[r[0]] || Modernizr[r[0]] instanceof Boolean || (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])), Modernizr[r[0]][r[1]] = s), f.push((s ? "" : "no-") + r.join("-")) } } function a(e) { var n = u.className, t = Modernizr._config.classPrefix || ""; if (p && (n = n.baseVal), Modernizr._config.enableJSClass) { var o = new RegExp("(^|\\s)" + t + "no-js(\\s|$)"); n = n.replace(o, "$1" + t + "js$2") } Modernizr._config.enableClasses && (n += " " + t + e.join(" " + t), p ? u.className.baseVal = n : u.className = n) } function i() { return "function" != typeof n.createElement ? n.createElement(arguments[0]) : p ? n.createElementNS.call(n, "http://www.w3.org/2000/svg", arguments[0]) : n.createElement.apply(n, arguments) } function r() { var e = n.body; return e || (e = i(p ? "svg" : "body"), e.fake = !0), e } function l(e, t, o, s) { var a, l, f, c, d = "modernizr", p = i("div"), h = r(); if (parseInt(o, 10)) for (; o--;) f = i("div"), f.id = s ? s[o] : d + (o + 1), p.appendChild(f); return a = i("style"), a.type = "text/css", a.id = "s" + d, (h.fake ? h : p).appendChild(a), h.appendChild(p), a.styleSheet ? a.styleSheet.cssText = e : a.appendChild(n.createTextNode(e)), p.id = d, h.fake && (h.style.background = "", h.style.overflow = "hidden", c = u.style.overflow, u.style.overflow = "hidden", u.appendChild(h)), l = t(p, e), h.fake ? (h.parentNode.removeChild(h), u.style.overflow = c, u.offsetHeight) : p.parentNode.removeChild(p), !!l } var f = [], c = [], d = { _version: "3.6.0", _config: { classPrefix: "", enableClasses: !0, enableJSClass: !0, usePrefixes: !0 }, _q: [], on: function (e, n) { var t = this; setTimeout(function () { n(t[e]) }, 0) }, addTest: function (e, n, t) { c.push({ name: e, fn: n, options: t }) }, addAsyncTest: function (e) { c.push({ name: null, fn: e }) } }, Modernizr = function () { }; Modernizr.prototype = d, Modernizr = new Modernizr; var u = n.documentElement, p = "svg" === u.nodeName.toLowerCase(), h = d._config.usePrefixes ? " -webkit- -moz- -o- -ms- ".split(" ") : ["", ""]; d._prefixes = h; var m = d.testStyles = l; Modernizr.addTest("touchevents", function () { var t; if ("ontouchstart" in e || e.DocumentTouch && n instanceof DocumentTouch) t = !0; else { var o = ["@media (", h.join("touch-enabled),("), "heartz", ")", "{#modernizr{top:9px;position:absolute}}"].join(""); m(o, function (e) { t = 9 === e.offsetTop }) } return t }), s(), a(f), delete d.addTest, delete d.addAsyncTest; for (var v = 0; v < Modernizr._q.length; v++) Modernizr._q[v](); e.Modernizr = Modernizr }(window, document);
; (function ($, window, document, undefined) {

    "use strict";

    // Create the defaults once
    var pluginName = "mNavigationalDrawer",
    defaults = {
        onClose: function () { },
        onOpen: function () { },
        hamburger: null
    };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mNavigationalDrawer", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {

        open: function () {

            this.$element.closest(".m-overlay").addClass("m-overlay--show");
            this.$element.addClass("navigation-drawer--open");
            this.settings.onOpen();
            if (this.settings.hamburger) $(this.settings.hamburger).addClass("hamburger--open");
        },

        close: function () {
            var _this = this;
            this.$element.closest(".m-overlay").removeClass("m-overlay--show");
            this.$element.removeClass("navigation-drawer--open");
            this.settings.onClose();
            if (this.settings.hamburger) $(this.settings.hamburger).removeClass("hamburger--open");
        },

        init: function () {

            var _this = this;
            var overlay = this.$element.closest(".m-overlay");

            if (overlay.length == 0) {
                overlay = $("<div />", { "class": "m-overlay navigation-drawer-overlay" });
                _this.$element.wrap(overlay);
                overlay = this.$element.closest(".m-overlay");
                overlay.on("click", function (e) {

                    var $target = $(e.target);
                    if ($target.hasClass("navigation-drawer") == false && $target.closest(".navigation-drawer").length == 0) {
                        e.preventDefault();
                        _this.close();
                    }
                })
            }

            if (this.settings.hamburger) {
                $(this.settings.hamburger).on("click", function () {
                    _this.open();
                });
            }
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

$.mTextfields = function () {


    $("input, textarea").closest("fieldset").each(function () {
        if ($(this).data("initialized") == null) {
            $(this).data("initialized", true);
            var $fieldset = $(this);
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
        }
    });
}

; (function ($, window, document, undefined) {

    var pluginName = "mSkeleton",
        defaults = {};

    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, defaults, options);

        this._defaults = defaults;
        this._name = pluginName;
        if (options == null) {
            this.init();
        } else if (options == "reveal") {
            this.reveal();
        } else if (options == "revealsub") {
            this.revealsub();
        }
    }

    Plugin.prototype = {

        init: function () {

            //Transform images
            this.$element.find(".skeleton-image, .sub-skeleton-image").each(function () {

                //Still download image
                var preloader = $("<div />", { "class": "preloader", "style": "height:0; width:0; visibility:hidden; overflow-hidden; position:absolute; top: -99999px; left: -9999px;" });
                $("body").append(preloader);
                var image = $("<img />");
                image[0].onload = function () { $(this).parent().remove(); }
                image.attr("src", $(this).attr("src"));
                preloader.append(image);



                $(this).attr("data-src", $(this).attr("src"))
                    .css({ "width": $(this).width(), "height": $(this).height() })
                    .attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
            });
        },

        reveal: function () {
            this.$element.find(".skeleton-image").each(function () {

                //Change image to transparent image
                $(this).attr("src", $(this).attr("data-src"))
                    .css({ "width": "", "height": "" })
                    .removeAttr("data-src");
            });

            this.$element.find(".skeleton-title").removeClass("skeleton-title");
            this.$element.find(".skeleton-lines").removeClass(function (index, className) {
                return (className.match(/(^|\s)skeleton-\S+/g) || []).join(' ');
            });
            this.$element.find(".skeleton-textarea").removeClass("skeleton-textarea");
            this.$element.find(".skeleton-input").removeClass("skeleton-input");
            this.$element.find(".skeleton-button").removeClass("skeleton-button");
            this.$element.find(".skeleton-dropdown").removeClass("skeleton-dropdown");
            this.$element.find(".skeleton").removeClass("skeleton");
            this.$element.find(".skeleton-list").removeClass("skeleton-list");
            this.$element.find(".skeleton-loader").removeClass("skeleton-loader");
            this.$element.removeClass("skeleton-loader skeleton-title skeleton-lines skeleton-textarea skeleton-input skeleton-button skeleton-dropdown "+
                " skeleton skeleton-list skeleton-loader skeleton-table-column-short skeleton-table-column");
        },

        revealsub: function () {
            this.$element.find(".sub-skeleton-image").each(function () {

                //Change image to transparent image
                $(this).attr("src", $(this).attr("data-src"))
                    .css({ "width": "", "height": "" })
                    .removeAttr("data-src");
            });

            this.$element.find(".sub-skeleton-title").removeClass("skeleton-title");
            this.$element.find(".sub-skeleton-lines").removeClass(function (index, className) {
                return (className.match(/(^|\s)skeleton-\S+/g) || []).join(' ');
            });
            this.$element.find(".sub-skeleton-textarea").removeClass("skeleton-textarea");
            this.$element.find(".sub-skeleton-input").removeClass("skeleton-input");
            this.$element.find(".sub-skeleton-button").removeClass("skeleton-button");
            this.$element.find(".sub-skeleton-dropdown").removeClass("skeleton-dropdown");
            this.$element.find(".sub-skeleton").removeClass("sub-skeleton");
            this.$element.find(".sub-skeleton-list").removeClass("sub-skeleton");
            this.$element.find(".sub-skeleton-loader").removeClass("skeleton-loader");
            this.$element.removeClass("sub-skeleton-loader sub-skeleton-title sub-skeleton-lines sub-skeleton-textarea sub-skeleton-input sub-skeleton-button sub-skeleton-dropdown " +
                " sub-skeleton sub-skeleton-list sub-skeleton-loader sub-skeleton-table-column-short sub-skeleton-table-column ");
        }


    };

    $.fn[pluginName] = function (options) {

        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);

$.mSearchToggle = function () {



}




; (function ($, window, document, undefined) {

    "use strict";
    var pluginName = "mSearchToggle",
        defaults = {
            onKeyUp: function () { }
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.$element = $(element);
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
        $(this.element).data("mSearchToggle", this);
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var _this = this;
            if (this.$element.hasClass("initialized") == false) {
                $(this).addClass("initialized");

                this.$element.find(".button-icon").on("click", function (e) {
                    e.preventDefault();
                    _this.$element.addClass("search-toggle--active");
                    _this.$element.find("input").focus();
                });

                this.$element.find(".search-toggle__close").on("click", function (e) {
                    e.preventDefault();
                    _this.$element.removeClass("search-toggle--active");
                });

                this.$element.find("input").on("keyup", function (e) {
                    _this.settings.onKeyUp(_this.$element, $(this).val());
                });
            }

        },
        loading: function () {
            console.log("loading");
            this.$element.addClass("search-toggle--loading");
        },
        complete: function () {
            this.$element.removeClass("search-toggle--loading");
        }
    });

    // A really lightweight plugin wrapper around the constructor,
    // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" +
                    pluginName, new Plugin(this, options));
            }
        });
    };

})(jQuery, window, document);
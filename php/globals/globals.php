<?php
$global = ObjectClass::$global;
$undefined = null;
$Infinity = INF;
$NaN = NAN;

$Object = ObjectClass::getGlobalConstructor();
$Function = Func::getGlobalConstructor();
$Array = Arr::getGlobalConstructor();
$Boolean = Bln::getGlobalConstructor();
$Number = Number::getGlobalConstructor();
$String = Str::getGlobalConstructor();
$Date = Date::getGlobalConstructor();
$Error = Err::getGlobalConstructor();
$RangeError = RangeErr::getGlobalConstructor();
$ReferenceError = ReferenceErr::getGlobalConstructor();
$SyntaxError = SyntaxErr::getGlobalConstructor();
$TypeError = TypeErr::getGlobalConstructor();
$RegExp = RegExp::getGlobalConstructor();
$Buffer = Buffer::getGlobalConstructor();

call_user_func(function () use (
    &$escape,
    &$unescape,
    &$encodeURI,
    &$decodeURI,
    &$encodeURIComponent,
    &$decodeURIComponent
) {
    $ord = function ($ch) {
        $i = ord($ch[0]);
        if ($i <= 0x7f) {
            return $i;
        } elseif ($i < 0xc2) {
            return $i; //invalid byte sequence
        } elseif ($i <= 0xdf) {
            return (($i & 0x1f) << 6) | (ord($ch[1]) & 0x3f);
        } elseif ($i <= 0xef) {
            return (($i & 0x0f) << 12) |
                ((ord($ch[1]) & 0x3f) << 6) |
                (ord($ch[2]) & 0x3f);
        } elseif ($i <= 0xf4) {
            return (($i & 0x0f) << 18) |
                ((ord($ch[1]) & 0x3f) << 12) |
                ((ord($ch[2]) & 0x3f) << 6) |
                (ord($ch[3]) & 0x3f);
        } else {
            return $i; //invalid byte sequence
        }
    };

    $chr = function ($i) {
        if ($i <= 0x7f) {
            return chr($i);
        }
        if ($i <= 0x7ff) {
            return chr(0xc0 | ($i >> 6)) . chr(0x80 | ($i & 0x3f));
        }
        if ($i <= 0xffff) {
            return chr(0xe0 | ($i >> 12)) .
                chr(0x80 | (($i >> 6) & 0x3f)) .
                chr(0x80 | ($i & 0x3f));
        }
        return chr(0xf0 | ($i >> 18)) .
            chr(0x80 | (($i >> 12) & 0x3f)) .
            chr(0x80 | (($i >> 6) & 0x3f)) .
            chr(0x80 | ($i & 0x3f));
    };

    $escape = new Func(function ($str) use (&$ord) {
        $result = '';
        $length = mb_strlen($str);
        for ($i = 0; $i < $length; $i++) {
            $ch = mb_substr($str, $i, 1);
            $j = $ord($ch);
            if (
                $j <= 41 ||
                $j === 44 ||
                ($j >= 58 && $j <= 63) ||
                ($j >= 91 && $j <= 94) ||
                $j === 96 ||
                ($j >= 123 && $j <= 255)
            ) {
                $result .=
                    '%' . strtoupper($j < 16 ? '0' . dechex($j) : dechex($j));
            } elseif ($j > 255) {
                $result .=
                    '%u' .
                    strtoupper($j < 4096 ? '0' . dechex($j) : dechex($j));
            } else {
                $result .= $ch;
            }
        }
        return $result;
    });

    $unescape = new Func(function ($str) use (&$chr) {
        $result = '';
        $length = strlen($str);
        for ($i = 0; $i < $length; $i++) {
            $ch = $str[$i];
            if ($ch === '%' && $length > $i + 2) {
                if ($str[$i + 1] === 'u') {
                    if ($length > $i + 4) {
                        $hex = substr($str, $i + 2, 4);
                        if (ctype_xdigit($hex)) {
                            $result .= $chr(hexdec($hex));
                            $i += 5;
                            continue;
                        }
                    }
                } else {
                    $hex = substr($str, $i + 1, 2);
                    if (ctype_xdigit($hex)) {
                        $result .= $chr(hexdec($hex));
                        $i += 2;
                        continue;
                    }
                }
            }
            $result .= $ch;
        }
        return $result;
    });

    $encodeURI = new Func(function ($str) {
        $result = '';
        $length = strlen($str);
        for ($i = 0; $i < $length; $i++) {
            $ch = substr($str, $i, 1);
            $j = ord($ch);
            if (
                $j === 33 ||
                $j === 35 ||
                $j === 36 ||
                ($j >= 38 && $j <= 59) ||
                $j === 61 ||
                ($j >= 63 && $j <= 90) ||
                $j === 95 ||
                ($j >= 97 && $j <= 122) ||
                $j === 126
            ) {
                $result .= $ch;
            } else {
                $result .=
                    '%' . strtoupper($j < 16 ? '0' . dechex($j) : dechex($j));
            }
        }
        return $result;
    });

    //todo: throw on invalid utf8 sequence
    $decodeURI = new Func(function ($str) {
        $result = '';
        $length = strlen($str);
        for ($i = 0; $i < $length; $i++) {
            $ch = $str[$i];
            if ($ch === '%' && $length > $i + 2) {
                $hex = substr($str, $i + 1, 2);
                if (ctype_xdigit($hex)) {
                    $j = hexdec($hex);
                    if (
                        $j !== 35 &&
                        $j !== 36 &&
                        $j !== 38 &&
                        $j !== 43 &&
                        $j !== 44 &&
                        $j !== 47 &&
                        $j !== 58 &&
                        $j !== 59 &&
                        $j !== 61 &&
                        $j !== 63 &&
                        $j !== 64
                    ) {
                        $result .= chr($j);
                        $i += 2;
                        continue;
                    }
                }
            }
            $result .= $ch;
        }
        return $result;
    });

    $encodeURIComponent = new Func(function ($str) {
        $result = '';
        $length = strlen($str);
        for ($i = 0; $i < $length; $i++) {
            $ch = substr($str, $i, 1);
            $j = ord($ch);
            if (
                $j === 33 ||
                ($j >= 39 && $j <= 42) ||
                $j === 45 ||
                $j === 46 ||
                ($j >= 48 && $j <= 57) ||
                ($j >= 65 && $j <= 90) ||
                $j === 95 ||
                ($j >= 97 && $j <= 122) ||
                $j === 126
            ) {
                $result .= $ch;
            } else {
                $result .=
                    '%' . strtoupper($j < 16 ? '0' . dechex($j) : dechex($j));
            }
        }
        return $result;
    });

    //todo: throw on invalid utf8 sequence
    $decodeURIComponent = new Func(function ($str) {
        return rawurldecode($str);
    });
});

$isNaN = $Number->get('isNaN');
$isFinite = $Number->get('isFinite');
$parseInt = $Number->get('parseInt');
$parseFloat = $Number->get('parseFloat');

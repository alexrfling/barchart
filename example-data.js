var data1 = [
    {
        key: 'ARGF_at',
        value: -0.049
    }, {
        key: 'DNAJ_at',
        value: -0.011
    }, {
        key: 'LYSC_at',
        value: -0.368
    }, {
        key: 'RPLL_at',
        value: -0.007
    }, {
        key: 'SPOIISA_at',
        value: 0.134
    }, {
        key: 'XHLA_at',
        value: 0.066
    }, {
        key: 'XHLB_at',
        value: 0.018
    }, {
        key: 'XKDS_at',
        value: 0.064
    }, {
        key: 'XLYA_at',
        value: 0.024
    }, {
        key: 'XTRA_at',
        value: 0.195
    }, {
        key: 'YBFI_at',
        value: -0.099 // 0.000
    }, {
        key: 'YCGO_at',
        value: 0.348 // 0.000
    }, {
        key: 'YCKE_at',
        value: 0.132
    }, {
        key: 'YDDK_at',
        value: -0.166
    }, {
        key: 'YEBC_at',
        value: -0.281
    }, {
        key: 'YEZB_at',
        value: 0.008
    }, {
        key: 'YHCL_at',
        value: -0.044
    }, {
        key: 'YOAB_at',
        value: -0.447
    }, {
        key: 'YRVJ_at',
        value: -0.034
    }, {
        key: 'YURQ_at',
        value: 0.105
    }, {
        key: 'YXLD_at',
        value: -0.254
    }, {
        key: 'YYDA_at',
        value: -0.005
    }
];

var data2 = [
    {
        key: ' S p a c e s  o n  S p a c e s ',
        value: -123
    }, {
        key: '"Quotes" on "Quotes"',
        value: 4.56
    }, {
        key: '\'Single\' \'Quotes\'',
        value: 78.9
    }, {
        key: 123456789,
        value: -20.468
    }, {
        key: 0.987654321,
        value: 13.579
    }
];

var data3 = [];

// NOTE d3.scaleLinear limits the max value to Number.MAX_VALUE / 2, and
// d3.scaleQuantize limits the max value even further (depends on range, see
// https://github.com/d3/d3-scale/blob/master/src/quantize.js#L19)
var data4 = [
    {
        key: 'Number.MAX_VALUE / 256',
        value: Number.MAX_VALUE / 256
    },
    {
        key: '-Number.MAX_VALUE / 256',
        value: -Number.MAX_VALUE / 256
    },
    {
        key: '0.0025 * Number.MAX_VALUE',
        value: 0.0025 * Number.MAX_VALUE
    },
    {
        key: '-0.001 * Number.MAX_VALUE',
        value: -0.001 * Number.MAX_VALUE
    }
];

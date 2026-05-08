import { t as Z } from "./rolldown-runtime-2JzG8er9.js";
var Y = Z((r) => {
    var p = Symbol.for("react.element"),
      f = Symbol.for("react.portal"),
      C = Symbol.for("react.fragment"),
      u = Symbol.for("react.strict_mode"),
      x = Symbol.for("react.profiler"),
      b = Symbol.for("react.provider"),
      q = Symbol.for("react.context"),
      v = Symbol.for("react.forward_ref"),
      z = Symbol.for("react.suspense"),
      S = Symbol.for("react.memo"),
      j = Symbol.for("react.lazy"),
      M = Symbol.iterator;
    function N(e) {
      return e === null || typeof e != "object"
        ? null
        : ((e = (M && e[M]) || e["@@iterator"]),
          typeof e == "function" ? e : null);
    }
    var E = {
        isMounted: function () {
          return !1;
        },
        enqueueForceUpdate: function () {},
        enqueueReplaceState: function () {},
        enqueueSetState: function () {},
      },
      P = Object.assign,
      T = {};
    function s(e, t, y) {
      ((this.props = e),
        (this.context = t),
        (this.refs = T),
        (this.updater = y || E));
    }
    ((s.prototype.isReactComponent = {}),
      (s.prototype.setState = function (e, t) {
        if (typeof e != "object" && typeof e != "function" && e != null)
          throw Error(
            "setState(...): takes an object of state variables to update or a function which returns an object of state variables.",
          );
        this.updater.enqueueSetState(this, e, t, "setState");
      }),
      (s.prototype.forceUpdate = function (e) {
        this.updater.enqueueForceUpdate(this, e, "forceUpdate");
      }));
    function U() {}
    U.prototype = s.prototype;
    function H(e, t, y) {
      ((this.props = e),
        (this.context = t),
        (this.refs = T),
        (this.updater = y || E));
    }
    var L = (H.prototype = new U());
    ((L.constructor = H), P(L, s.prototype), (L.isPureReactComponent = !0));
    var $ = Array.isArray,
      O = Object.prototype.hasOwnProperty,
      _ = { current: null },
      D = { key: !0, ref: !0, __self: !0, __source: !0 };
    function F(e, t, y) {
      var h,
        n = {},
        c = null,
        k = null;
      if (t != null)
        for (h in (t.ref !== void 0 && (k = t.ref),
        t.key !== void 0 && (c = "" + t.key),
        t))
          O.call(t, h) && !D.hasOwnProperty(h) && (n[h] = t[h]);
      var l = arguments.length - 2;
      if (l === 1) n.children = y;
      else if (1 < l) {
        for (var i = Array(l), d = 0; d < l; d++) i[d] = arguments[d + 2];
        n.children = i;
      }
      if (e && e.defaultProps)
        for (h in ((l = e.defaultProps), l)) n[h] === void 0 && (n[h] = l[h]);
      return {
        $$typeof: p,
        type: e,
        key: c,
        ref: k,
        props: n,
        _owner: _.current,
      };
    }
    function G(e, t) {
      return {
        $$typeof: p,
        type: e.type,
        key: t,
        ref: e.ref,
        props: e.props,
        _owner: e._owner,
      };
    }
    function A(e) {
      return typeof e == "object" && e !== null && e.$$typeof === p;
    }
    function W(e) {
      var t = { "=": "=0", ":": "=2" };
      return (
        "$" +
        e.replace(/[=:]/g, function (y) {
          return t[y];
        })
      );
    }
    var I = /\/+/g;
    function V(e, t) {
      return typeof e == "object" && e !== null && e.key != null
        ? W("" + e.key)
        : t.toString(36);
    }
    function m(e, t, y, h, n) {
      var c = typeof e;
      (c === "undefined" || c === "boolean") && (e = null);
      var k = !1;
      if (e === null) k = !0;
      else
        switch (c) {
          case "string":
          case "number":
            k = !0;
            break;
          case "object":
            switch (e.$$typeof) {
              case p:
              case f:
                k = !0;
            }
        }
      if (k)
        return (
          (k = e),
          (n = n(k)),
          (e = h === "" ? "." + V(k, 0) : h),
          $(n)
            ? ((y = ""),
              e != null && (y = e.replace(I, "$&/") + "/"),
              m(n, t, y, "", function (d) {
                return d;
              }))
            : n != null &&
              (A(n) &&
                (n = G(
                  n,
                  y +
                    (!n.key || (k && k.key === n.key)
                      ? ""
                      : ("" + n.key).replace(I, "$&/") + "/") +
                    e,
                )),
              t.push(n)),
          1
        );
      if (((k = 0), (h = h === "" ? "." : h + ":"), $(e)))
        for (var l = 0; l < e.length; l++) {
          c = e[l];
          var i = h + V(c, l);
          k += m(c, t, y, i, n);
        }
      else if (((i = N(e)), typeof i == "function"))
        for (e = i.call(e), l = 0; !(c = e.next()).done; )
          ((c = c.value), (i = h + V(c, l++)), (k += m(c, t, y, i, n)));
      else if (c === "object")
        throw (
          (t = String(e)),
          Error(
            "Objects are not valid as a React child (found: " +
              (t === "[object Object]"
                ? "object with keys {" + Object.keys(e).join(", ") + "}"
                : t) +
              "). If you meant to render a collection of children, use an array instead.",
          )
        );
      return k;
    }
    function g(e, t, y) {
      if (e == null) return e;
      var h = [],
        n = 0;
      return (
        m(e, h, "", "", function (c) {
          return t.call(y, c, n++);
        }),
        h
      );
    }
    function X(e) {
      if (e._status === -1) {
        var t = e._result;
        ((t = t()),
          t.then(
            function (y) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 1), (e._result = y));
            },
            function (y) {
              (e._status === 0 || e._status === -1) &&
                ((e._status = 2), (e._result = y));
            },
          ),
          e._status === -1 && ((e._status = 0), (e._result = t)));
      }
      if (e._status === 1) return e._result.default;
      throw e._result;
    }
    var o = { current: null },
      w = { transition: null },
      Q = {
        ReactCurrentDispatcher: o,
        ReactCurrentBatchConfig: w,
        ReactCurrentOwner: _,
      };
    function B() {
      throw Error("act(...) is not supported in production builds of React.");
    }
    ((r.Children = {
      map: g,
      forEach: function (e, t, y) {
        g(
          e,
          function () {
            t.apply(this, arguments);
          },
          y,
        );
      },
      count: function (e) {
        var t = 0;
        return (
          g(e, function () {
            t++;
          }),
          t
        );
      },
      toArray: function (e) {
        return (
          g(e, function (t) {
            return t;
          }) || []
        );
      },
      only: function (e) {
        if (!A(e))
          throw Error(
            "React.Children.only expected to receive a single React element child.",
          );
        return e;
      },
    }),
      (r.Component = s),
      (r.Fragment = C),
      (r.Profiler = x),
      (r.PureComponent = H),
      (r.StrictMode = u),
      (r.Suspense = z),
      (r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = Q),
      (r.act = B),
      (r.cloneElement = function (e, t, y) {
        if (e == null)
          throw Error(
            "React.cloneElement(...): The argument must be a React element, but you passed " +
              e +
              ".",
          );
        var h = P({}, e.props),
          n = e.key,
          c = e.ref,
          k = e._owner;
        if (t != null) {
          if (
            (t.ref !== void 0 && ((c = t.ref), (k = _.current)),
            t.key !== void 0 && (n = "" + t.key),
            e.type && e.type.defaultProps)
          )
            var l = e.type.defaultProps;
          for (i in t)
            O.call(t, i) &&
              !D.hasOwnProperty(i) &&
              (h[i] = t[i] === void 0 && l !== void 0 ? l[i] : t[i]);
        }
        var i = arguments.length - 2;
        if (i === 1) h.children = y;
        else if (1 < i) {
          l = Array(i);
          for (var d = 0; d < i; d++) l[d] = arguments[d + 2];
          h.children = l;
        }
        return {
          $$typeof: p,
          type: e.type,
          key: n,
          ref: c,
          props: h,
          _owner: k,
        };
      }),
      (r.createContext = function (e) {
        return (
          (e = {
            $$typeof: q,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
            _defaultValue: null,
            _globalName: null,
          }),
          (e.Provider = { $$typeof: b, _context: e }),
          (e.Consumer = e)
        );
      }),
      (r.createElement = F),
      (r.createFactory = function (e) {
        var t = F.bind(null, e);
        return ((t.type = e), t);
      }),
      (r.createRef = function () {
        return { current: null };
      }),
      (r.forwardRef = function (e) {
        return { $$typeof: v, render: e };
      }),
      (r.isValidElement = A),
      (r.lazy = function (e) {
        return { $$typeof: j, _payload: { _status: -1, _result: e }, _init: X };
      }),
      (r.memo = function (e, t) {
        return { $$typeof: S, type: e, compare: t === void 0 ? null : t };
      }),
      (r.startTransition = function (e) {
        var t = w.transition;
        w.transition = {};
        try {
          e();
        } finally {
          w.transition = t;
        }
      }),
      (r.unstable_act = B),
      (r.useCallback = function (e, t) {
        return o.current.useCallback(e, t);
      }),
      (r.useContext = function (e) {
        return o.current.useContext(e);
      }),
      (r.useDebugValue = function () {}),
      (r.useDeferredValue = function (e) {
        return o.current.useDeferredValue(e);
      }),
      (r.useEffect = function (e, t) {
        return o.current.useEffect(e, t);
      }),
      (r.useId = function () {
        return o.current.useId();
      }),
      (r.useImperativeHandle = function (e, t, y) {
        return o.current.useImperativeHandle(e, t, y);
      }),
      (r.useInsertionEffect = function (e, t) {
        return o.current.useInsertionEffect(e, t);
      }),
      (r.useLayoutEffect = function (e, t) {
        return o.current.useLayoutEffect(e, t);
      }),
      (r.useMemo = function (e, t) {
        return o.current.useMemo(e, t);
      }),
      (r.useReducer = function (e, t, y) {
        return o.current.useReducer(e, t, y);
      }),
      (r.useRef = function (e) {
        return o.current.useRef(e);
      }),
      (r.useState = function (e) {
        return o.current.useState(e);
      }),
      (r.useSyncExternalStore = function (e, t, y) {
        return o.current.useSyncExternalStore(e, t, y);
      }),
      (r.useTransition = function () {
        return o.current.useTransition();
      }),
      (r.version = "18.3.1"));
  }),
  J = Z((r, p) => {
    p.exports = Y();
  }),
  K = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  },
  R = J(),
  e1 = (r) =>
    r
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .toLowerCase()
      .trim(),
  a = (r, p) => {
    const f = (0, R.forwardRef)(
      (
        {
          color: C = "currentColor",
          size: u = 24,
          strokeWidth: x = 2,
          absoluteStrokeWidth: b,
          className: q = "",
          children: v,
          ...z
        },
        S,
      ) =>
        (0, R.createElement)(
          "svg",
          {
            ref: S,
            ...K,
            width: u,
            height: u,
            stroke: C,
            strokeWidth: b ? (Number(x) * 24) / Number(u) : x,
            className: ["lucide", `lucide-${e1(r)}`, q].join(" "),
            ...z,
          },
          [
            ...p.map(([j, M]) => (0, R.createElement)(j, M)),
            ...(Array.isArray(v) ? v : [v]),
          ],
        ),
    );
    return ((f.displayName = `${r}`), f);
  },
  t1 = a("AlertCircle", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
  ]),
  r1 = a("AlertOctagon", [
    [
      "polygon",
      {
        points:
          "7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2",
        key: "h1p8hx",
      },
    ],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12", key: "1pkeuh" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16", key: "4dfq90" }],
  ]),
  y1 = a("AlertTriangle", [
    [
      "path",
      {
        d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
        key: "c3ski4",
      },
    ],
    ["path", { d: "M12 9v4", key: "juzpu7" }],
    ["path", { d: "M12 17h.01", key: "p32p05" }],
  ]),
  n1 = a("Archive", [
    [
      "rect",
      { width: "20", height: "5", x: "2", y: "3", rx: "1", key: "1wp1u1" },
    ],
    ["path", { d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8", key: "1s80jp" }],
    ["path", { d: "M10 12h4", key: "a56b0p" }],
  ]),
  h1 = a("ArrowDownRight", [
    ["path", { d: "m7 7 10 10", key: "1fmybs" }],
    ["path", { d: "M17 7v10H7", key: "6fjiku" }],
  ]),
  i1 = a("ArrowLeft", [
    ["path", { d: "m12 19-7-7 7-7", key: "1l729n" }],
    ["path", { d: "M19 12H5", key: "x3x0zl" }],
  ]),
  c1 = a("ArrowRight", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }],
  ]),
  l1 = a("ArrowUpRight", [
    ["path", { d: "M7 7h10v10", key: "1tivn9" }],
    ["path", { d: "M7 17 17 7", key: "1vkiza" }],
  ]),
  k1 = a("Award", [
    ["circle", { cx: "12", cy: "8", r: "6", key: "1vp47v" }],
    ["path", { d: "M15.477 12.89 17 22l-5-3-5 3 1.523-9.11", key: "em7aur" }],
  ]),
  o1 = a("Banknote", [
    [
      "rect",
      { width: "20", height: "12", x: "2", y: "6", rx: "2", key: "9lu3g6" },
    ],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
    ["path", { d: "M6 12h.01M18 12h.01", key: "113zkx" }],
  ]),
  d1 = a("BarChart2", [
    ["line", { x1: "18", x2: "18", y1: "20", y2: "10", key: "1xfpm4" }],
    ["line", { x1: "12", x2: "12", y1: "20", y2: "4", key: "be30l9" }],
    ["line", { x1: "6", x2: "6", y1: "20", y2: "14", key: "1r4le6" }],
  ]),
  p1 = a("BarChart3", [
    ["path", { d: "M3 3v18h18", key: "1s2lah" }],
    ["path", { d: "M18 17V9", key: "2bz60n" }],
    ["path", { d: "M13 17V5", key: "1frdt8" }],
    ["path", { d: "M8 17v-3", key: "17ska0" }],
  ]),
  s1 = a("Bell", [
    ["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9", key: "1qo2s2" }],
    ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0", key: "qgo35s" }],
  ]),
  u1 = a("Briefcase", [
    [
      "rect",
      {
        width: "20",
        height: "14",
        x: "2",
        y: "7",
        rx: "2",
        ry: "2",
        key: "eto64e",
      },
    ],
    [
      "path",
      { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", key: "zwj3tp" },
    ],
  ]),
  v1 = a("Bug", [
    ["path", { d: "m8 2 1.88 1.88", key: "fmnt4t" }],
    ["path", { d: "M14.12 3.88 16 2", key: "qol33r" }],
    ["path", { d: "M9 7.13v-1a3.003 3.003 0 1 1 6 0v1", key: "d7y7pr" }],
    [
      "path",
      {
        d: "M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6",
        key: "xs1cw7",
      },
    ],
    ["path", { d: "M12 20v-9", key: "1qisl0" }],
    ["path", { d: "M6.53 9C4.6 8.8 3 7.1 3 5", key: "32zzws" }],
    ["path", { d: "M6 13H2", key: "82j7cp" }],
    ["path", { d: "M3 21c0-2.1 1.7-3.9 3.8-4", key: "4p0ekp" }],
    ["path", { d: "M20.97 5c0 2.1-1.6 3.8-3.5 4", key: "18gb23" }],
    ["path", { d: "M22 13h-4", key: "1jl80f" }],
    ["path", { d: "M17.2 17c2.1.1 3.8 1.9 3.8 4", key: "k3fwyw" }],
  ]),
  f1 = a("Building2", [
    ["path", { d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", key: "1b4qmf" }],
    ["path", { d: "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2", key: "i71pzd" }],
    ["path", { d: "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2", key: "10jefs" }],
    ["path", { d: "M10 6h4", key: "1itunk" }],
    ["path", { d: "M10 10h4", key: "tcdvrf" }],
    ["path", { d: "M10 14h4", key: "kelpxr" }],
    ["path", { d: "M10 18h4", key: "1ulq68" }],
  ]),
  x1 = a("Building", [
    [
      "rect",
      {
        width: "16",
        height: "20",
        x: "4",
        y: "2",
        rx: "2",
        ry: "2",
        key: "76otgf",
      },
    ],
    ["path", { d: "M9 22v-4h6v4", key: "r93iot" }],
    ["path", { d: "M8 6h.01", key: "1dz90k" }],
    ["path", { d: "M16 6h.01", key: "1x0f13" }],
    ["path", { d: "M12 6h.01", key: "1vi96p" }],
    ["path", { d: "M12 10h.01", key: "1nrarc" }],
    ["path", { d: "M12 14h.01", key: "1etili" }],
    ["path", { d: "M16 10h.01", key: "1m94wz" }],
    ["path", { d: "M16 14h.01", key: "1gbofw" }],
    ["path", { d: "M8 10h.01", key: "19clt8" }],
    ["path", { d: "M8 14h.01", key: "6423bh" }],
  ]),
  M1 = a("CalendarOff", [
    [
      "path",
      {
        d: "M4.2 4.2A2 2 0 0 0 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 1.82-1.18",
        key: "16swn3",
      },
    ],
    ["path", { d: "M21 15.5V6a2 2 0 0 0-2-2H9.5", key: "yhw86o" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    ["path", { d: "M3 10h7", key: "1wap6i" }],
    ["path", { d: "M21 10h-5.5", key: "quycpq" }],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  ]),
  m1 = a("Calendar", [
    ["path", { d: "M8 2v4", key: "1cmpym" }],
    ["path", { d: "M16 2v4", key: "4m81vk" }],
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "4", rx: "2", key: "1hopcy" },
    ],
    ["path", { d: "M3 10h18", key: "8toen8" }],
  ]),
  g1 = a("Camera", [
    [
      "path",
      {
        d: "M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z",
        key: "1tc9qg",
      },
    ],
    ["circle", { cx: "12", cy: "13", r: "3", key: "1vg3eu" }],
  ]),
  w1 = a("CheckCircle2", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
  ]),
  C1 = a("CheckCircle", [
    ["path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14", key: "g774vq" }],
    ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }],
  ]),
  b1 = a("CheckSquare", [
    ["path", { d: "m9 11 3 3L22 4", key: "1pflzl" }],
    [
      "path",
      {
        d: "M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
        key: "1jnkn4",
      },
    ],
  ]),
  q1 = a("Check", [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]]),
  z1 = a("ChevronDown", [["path", { d: "m6 9 6 6 6-6", key: "qrunsl" }]]),
  S1 = a("ChevronLeft", [["path", { d: "m15 18-6-6 6-6", key: "1wnfg3" }]]),
  j1 = a("ChevronRight", [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]]),
  H1 = a("ChevronUp", [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]]),
  L1 = a("Clock", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["polyline", { points: "12 6 12 12 16 14", key: "68esgv" }],
  ]),
  _1 = a("Copy", [
    [
      "rect",
      {
        width: "14",
        height: "14",
        x: "8",
        y: "8",
        rx: "2",
        ry: "2",
        key: "17jyea",
      },
    ],
    [
      "path",
      {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
        key: "zix9uf",
      },
    ],
  ]),
  A1 = a("CreditCard", [
    [
      "rect",
      { width: "20", height: "14", x: "2", y: "5", rx: "2", key: "ynyp8z" },
    ],
    ["line", { x1: "2", x2: "22", y1: "10", y2: "10", key: "1b3vmo" }],
  ]),
  V1 = a("Database", [
    ["ellipse", { cx: "12", cy: "5", rx: "9", ry: "3", key: "msslwz" }],
    ["path", { d: "M3 5V19A9 3 0 0 0 21 19V5", key: "1wlel7" }],
    ["path", { d: "M3 12A9 3 0 0 0 21 12", key: "mv7ke4" }],
  ]),
  R1 = a("DollarSign", [
    ["line", { x1: "12", x2: "12", y1: "2", y2: "22", key: "7eqyqh" }],
    [
      "path",
      { d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", key: "1b0p4s" },
    ],
  ]),
  E1 = a("Download", [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["polyline", { points: "7 10 12 15 17 10", key: "2ggqvy" }],
    ["line", { x1: "12", x2: "12", y1: "15", y2: "3", key: "1vk2je" }],
  ]),
  P1 = a("ExternalLink", [
    ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
    ["path", { d: "M10 14 21 3", key: "gplh6r" }],
    [
      "path",
      {
        d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6",
        key: "a6xqqp",
      },
    ],
  ]),
  T1 = a("EyeOff", [
    ["path", { d: "M9.88 9.88a3 3 0 1 0 4.24 4.24", key: "1jxqfv" }],
    [
      "path",
      {
        d: "M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",
        key: "9wicm4",
      },
    ],
    [
      "path",
      {
        d: "M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",
        key: "1jreej",
      },
    ],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22", key: "a6p6uj" }],
  ]),
  U1 = a("Eye", [
    [
      "path",
      { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", key: "rwhkz3" },
    ],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
  ]),
  $1 = a("Facebook", [
    [
      "path",
      {
        d: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
        key: "1jg4f8",
      },
    ],
  ]),
  O1 = a("FileText", [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        key: "1rqfz7",
      },
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
    ["path", { d: "M10 9H8", key: "b1mrlr" }],
    ["path", { d: "M16 13H8", key: "t4e002" }],
    ["path", { d: "M16 17H8", key: "z1uh3a" }],
  ]),
  D1 = a("File", [
    [
      "path",
      {
        d: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
        key: "1rqfz7",
      },
    ],
    ["path", { d: "M14 2v4a2 2 0 0 0 2 2h4", key: "tnqrlb" }],
  ]),
  F1 = a("Files", [
    ["path", { d: "M20 7h-3a2 2 0 0 1-2-2V2", key: "x099mo" }],
    [
      "path",
      {
        d: "M9 18a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h7l4 4v10a2 2 0 0 1-2 2Z",
        key: "18t6ie",
      },
    ],
    ["path", { d: "M3 7.6v12.8A1.6 1.6 0 0 0 4.6 22h9.8", key: "1nja0z" }],
  ]),
  I1 = a("Filter", [
    [
      "polygon",
      { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3", key: "1yg77f" },
    ],
  ]),
  B1 = a("Flag", [
    [
      "path",
      {
        d: "M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z",
        key: "i9b6wo",
      },
    ],
    ["line", { x1: "4", x2: "4", y1: "22", y2: "15", key: "1cm3nv" }],
  ]),
  Z1 = a("FolderOpen", [
    [
      "path",
      {
        d: "m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2",
        key: "usdka0",
      },
    ],
  ]),
  N1 = a("Folder", [
    [
      "path",
      {
        d: "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
        key: "1kt360",
      },
    ],
  ]),
  G1 = a("Globe", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    [
      "path",
      { d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20", key: "13o1zl" },
    ],
    ["path", { d: "M2 12h20", key: "9i4pu4" }],
  ]),
  W1 = a("Grid3x3", [
    [
      "rect",
      { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" },
    ],
    ["path", { d: "M3 9h18", key: "1pudct" }],
    ["path", { d: "M3 15h18", key: "5xshup" }],
    ["path", { d: "M9 3v18", key: "fh3hqa" }],
    ["path", { d: "M15 3v18", key: "14nvp0" }],
  ]),
  X1 = a("GripVertical", [
    ["circle", { cx: "9", cy: "12", r: "1", key: "1vctgf" }],
    ["circle", { cx: "9", cy: "5", r: "1", key: "hp0tcf" }],
    ["circle", { cx: "9", cy: "19", r: "1", key: "fkjjf6" }],
    ["circle", { cx: "15", cy: "12", r: "1", key: "1tmaij" }],
    ["circle", { cx: "15", cy: "5", r: "1", key: "19l28e" }],
    ["circle", { cx: "15", cy: "19", r: "1", key: "f4zoj3" }],
  ]),
  Q1 = a("HardDrive", [
    ["line", { x1: "22", x2: "2", y1: "12", y2: "12", key: "1y58io" }],
    [
      "path",
      {
        d: "M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z",
        key: "oot6mr",
      },
    ],
    ["line", { x1: "6", x2: "6.01", y1: "16", y2: "16", key: "sgf278" }],
    ["line", { x1: "10", x2: "10.01", y1: "16", y2: "16", key: "1l4acy" }],
  ]),
  Y1 = a("HardHat", [
    [
      "path",
      {
        d: "M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z",
        key: "1dej2m",
      },
    ],
    ["path", { d: "M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5", key: "1p9q5i" }],
    ["path", { d: "M4 15v-3a6 6 0 0 1 6-6h0", key: "1uc279" }],
    ["path", { d: "M14 6h0a6 6 0 0 1 6 6v3", key: "1j9mnm" }],
  ]),
  J1 = a("Heart", [
    [
      "path",
      {
        d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
        key: "c3ymky",
      },
    ],
  ]),
  K1 = a("History", [
    [
      "path",
      { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" },
    ],
    ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
    ["path", { d: "M12 7v5l4 2", key: "1fdv2h" }],
  ]),
  e2 = a("Home", [
    [
      "path",
      { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", key: "y5dka4" },
    ],
    ["polyline", { points: "9 22 9 12 15 12 15 22", key: "e2us08" }],
  ]),
  a2 = a("Image", [
    [
      "rect",
      {
        width: "18",
        height: "18",
        x: "3",
        y: "3",
        rx: "2",
        ry: "2",
        key: "1m3agn",
      },
    ],
    ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
    ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }],
  ]),
  t2 = a("Images", [
    ["path", { d: "M18 22H4a2 2 0 0 1-2-2V6", key: "pblm9e" }],
    [
      "path",
      { d: "m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18", key: "nf6bnh" },
    ],
    ["circle", { cx: "12", cy: "8", r: "2", key: "1822b1" }],
    [
      "rect",
      { width: "16", height: "16", x: "6", y: "2", rx: "2", key: "12espp" },
    ],
  ]),
  r2 = a("Info", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "M12 16v-4", key: "1dtifu" }],
    ["path", { d: "M12 8h.01", key: "e9boi3" }],
  ]),
  y2 = a("Instagram", [
    [
      "rect",
      {
        width: "20",
        height: "20",
        x: "2",
        y: "2",
        rx: "5",
        ry: "5",
        key: "2e1cvw",
      },
    ],
    [
      "path",
      { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z", key: "9exkf1" },
    ],
    ["line", { x1: "17.5", x2: "17.51", y1: "6.5", y2: "6.5", key: "r4j83e" }],
  ]),
  n2 = a("Layers", [
    [
      "path",
      {
        d: "m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z",
        key: "8b97xw",
      },
    ],
    [
      "path",
      { d: "m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65", key: "dd6zsq" },
    ],
    [
      "path",
      { d: "m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65", key: "ep9fru" },
    ],
  ]),
  h2 = a("LayoutDashboard", [
    [
      "rect",
      { width: "7", height: "9", x: "3", y: "3", rx: "1", key: "10lvy0" },
    ],
    [
      "rect",
      { width: "7", height: "5", x: "14", y: "3", rx: "1", key: "16une8" },
    ],
    [
      "rect",
      { width: "7", height: "9", x: "14", y: "12", rx: "1", key: "1hutg5" },
    ],
    [
      "rect",
      { width: "7", height: "5", x: "3", y: "16", rx: "1", key: "ldoo1y" },
    ],
  ]),
  i2 = a("Linkedin", [
    [
      "path",
      {
        d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",
        key: "c2jq9f",
      },
    ],
    ["rect", { width: "4", height: "12", x: "2", y: "9", key: "mk3on5" }],
    ["circle", { cx: "4", cy: "4", r: "2", key: "bt5ra8" }],
  ]),
  c2 = a("ListChecks", [
    ["path", { d: "m3 17 2 2 4-4", key: "1jhpwq" }],
    ["path", { d: "m3 7 2 2 4-4", key: "1obspn" }],
    ["path", { d: "M13 6h8", key: "15sg57" }],
    ["path", { d: "M13 12h8", key: "h98zly" }],
    ["path", { d: "M13 18h8", key: "oe0vm4" }],
  ]),
  l2 = a("List", [
    ["line", { x1: "8", x2: "21", y1: "6", y2: "6", key: "7ey8pc" }],
    ["line", { x1: "8", x2: "21", y1: "12", y2: "12", key: "rjfblc" }],
    ["line", { x1: "8", x2: "21", y1: "18", y2: "18", key: "c3b1m8" }],
    ["line", { x1: "3", x2: "3.01", y1: "6", y2: "6", key: "1g7gq3" }],
    ["line", { x1: "3", x2: "3.01", y1: "12", y2: "12", key: "1pjlvk" }],
    ["line", { x1: "3", x2: "3.01", y1: "18", y2: "18", key: "28t2mc" }],
  ]),
  k2 = a("Loader2", [
    ["path", { d: "M21 12a9 9 0 1 1-6.219-8.56", key: "13zald" }],
  ]),
  o2 = a("Loader", [
    ["line", { x1: "12", x2: "12", y1: "2", y2: "6", key: "gza1u7" }],
    ["line", { x1: "12", x2: "12", y1: "18", y2: "22", key: "1qhbu9" }],
    ["line", { x1: "4.93", x2: "7.76", y1: "4.93", y2: "7.76", key: "xae44r" }],
    [
      "line",
      { x1: "16.24", x2: "19.07", y1: "16.24", y2: "19.07", key: "bxnmvf" },
    ],
    ["line", { x1: "2", x2: "6", y1: "12", y2: "12", key: "89khin" }],
    ["line", { x1: "18", x2: "22", y1: "12", y2: "12", key: "pb8tfm" }],
    [
      "line",
      { x1: "4.93", x2: "7.76", y1: "19.07", y2: "16.24", key: "1uxjnu" },
    ],
    [
      "line",
      { x1: "16.24", x2: "19.07", y1: "7.76", y2: "4.93", key: "6duxfx" },
    ],
  ]),
  d2 = a("Lock", [
    [
      "rect",
      {
        width: "18",
        height: "11",
        x: "3",
        y: "11",
        rx: "2",
        ry: "2",
        key: "1w4ew1",
      },
    ],
    ["path", { d: "M7 11V7a5 5 0 0 1 10 0v4", key: "fwvmzm" }],
  ]),
  p2 = a("LogIn", [
    ["path", { d: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", key: "u53s6r" }],
    ["polyline", { points: "10 17 15 12 10 7", key: "1ail0h" }],
    ["line", { x1: "15", x2: "3", y1: "12", y2: "12", key: "v6grx8" }],
  ]),
  s2 = a("LogOut", [
    ["path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", key: "1uf3rs" }],
    ["polyline", { points: "16 17 21 12 16 7", key: "1gabdz" }],
    ["line", { x1: "21", x2: "9", y1: "12", y2: "12", key: "1uyos4" }],
  ]),
  u2 = a("Mail", [
    [
      "rect",
      { width: "20", height: "16", x: "2", y: "4", rx: "2", key: "18n3k1" },
    ],
    ["path", { d: "m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7", key: "1ocrg3" }],
  ]),
  v2 = a("MapPin", [
    [
      "path",
      { d: "M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z", key: "2oe9fu" },
    ],
    ["circle", { cx: "12", cy: "10", r: "3", key: "ilqhr7" }],
  ]),
  f2 = a("Map", [
    [
      "polygon",
      { points: "3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21", key: "ok2ie8" },
    ],
    ["line", { x1: "9", x2: "9", y1: "3", y2: "18", key: "w34qz5" }],
    ["line", { x1: "15", x2: "15", y1: "6", y2: "21", key: "volv9a" }],
  ]),
  x2 = a("Megaphone", [
    ["path", { d: "m3 11 18-5v12L3 14v-3z", key: "n962bs" }],
    ["path", { d: "M11.6 16.8a3 3 0 1 1-5.8-1.6", key: "1yl0tm" }],
  ]),
  M2 = a("Menu", [
    ["line", { x1: "4", x2: "20", y1: "12", y2: "12", key: "1e0a9i" }],
    ["line", { x1: "4", x2: "20", y1: "6", y2: "6", key: "1owob3" }],
    ["line", { x1: "4", x2: "20", y1: "18", y2: "18", key: "yk5zj1" }],
  ]),
  m2 = a("MessageCircle", [
    ["path", { d: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z", key: "vv11sd" }],
  ]),
  g2 = a("MessageSquare", [
    [
      "path",
      {
        d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
        key: "1lielz",
      },
    ],
  ]),
  w2 = a("Minus", [["path", { d: "M5 12h14", key: "1ays0h" }]]),
  C2 = a("Monitor", [
    [
      "rect",
      { width: "20", height: "14", x: "2", y: "3", rx: "2", key: "48i651" },
    ],
    ["line", { x1: "8", x2: "16", y1: "21", y2: "21", key: "1svkeh" }],
    ["line", { x1: "12", x2: "12", y1: "17", y2: "21", key: "vw1qmm" }],
  ]),
  b2 = a("Package", [
    ["path", { d: "m7.5 4.27 9 5.15", key: "1c824w" }],
    [
      "path",
      {
        d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",
        key: "hh9hay",
      },
    ],
    ["path", { d: "m3.3 7 8.7 5 8.7-5", key: "g66t2b" }],
    ["path", { d: "M12 22V12", key: "d0xqtd" }],
  ]),
  q2 = a("Palette", [
    [
      "circle",
      { cx: "13.5", cy: "6.5", r: ".5", fill: "currentColor", key: "1okk4w" },
    ],
    [
      "circle",
      { cx: "17.5", cy: "10.5", r: ".5", fill: "currentColor", key: "f64h9f" },
    ],
    [
      "circle",
      { cx: "8.5", cy: "7.5", r: ".5", fill: "currentColor", key: "fotxhn" },
    ],
    [
      "circle",
      { cx: "6.5", cy: "12.5", r: ".5", fill: "currentColor", key: "qy21gx" },
    ],
    [
      "path",
      {
        d: "M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z",
        key: "12rzf8",
      },
    ],
  ]),
  z2 = a("Pen", [
    [
      "path",
      { d: "M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z", key: "5qss01" },
    ],
  ]),
  S2 = a("Phone", [
    [
      "path",
      {
        d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
        key: "foiqr5",
      },
    ],
  ]),
  j2 = a("Plane", [
    [
      "path",
      {
        d: "M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z",
        key: "1v9wt8",
      },
    ],
  ]),
  H2 = a("Plus", [
    ["path", { d: "M5 12h14", key: "1ays0h" }],
    ["path", { d: "M12 5v14", key: "s699le" }],
  ]),
  L2 = a("Printer", [
    ["polyline", { points: "6 9 6 2 18 2 18 9", key: "1306q4" }],
    [
      "path",
      {
        d: "M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2",
        key: "143wyd",
      },
    ],
    ["rect", { width: "12", height: "8", x: "6", y: "14", key: "5ipwut" }],
  ]),
  _2 = a("QrCode", [
    [
      "rect",
      { width: "5", height: "5", x: "3", y: "3", rx: "1", key: "1tu5fj" },
    ],
    [
      "rect",
      { width: "5", height: "5", x: "16", y: "3", rx: "1", key: "1v8r4q" },
    ],
    [
      "rect",
      { width: "5", height: "5", x: "3", y: "16", rx: "1", key: "1x03jg" },
    ],
    ["path", { d: "M21 16h-3a2 2 0 0 0-2 2v3", key: "177gqh" }],
    ["path", { d: "M21 21v.01", key: "ents32" }],
    ["path", { d: "M12 7v3a2 2 0 0 1-2 2H7", key: "8crl2c" }],
    ["path", { d: "M3 12h.01", key: "nlz23k" }],
    ["path", { d: "M12 3h.01", key: "n36tog" }],
    ["path", { d: "M12 16v.01", key: "133mhm" }],
    ["path", { d: "M16 12h1", key: "1slzba" }],
    ["path", { d: "M21 12v.01", key: "1lwtk9" }],
    ["path", { d: "M12 21v-1", key: "1880an" }],
  ]),
  A2 = a("Radio", [
    ["path", { d: "M4.9 19.1C1 15.2 1 8.8 4.9 4.9", key: "1vaf9d" }],
    ["path", { d: "M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5", key: "u1ii0m" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
    ["path", { d: "M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5", key: "1j5fej" }],
    ["path", { d: "M19.1 4.9C23 8.8 23 15.1 19.1 19", key: "10b0cb" }],
  ]),
  V2 = a("Redo2", [
    ["path", { d: "m15 14 5-5-5-5", key: "12vg1m" }],
    [
      "path",
      {
        d: "M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13",
        key: "19mnr4",
      },
    ],
  ]),
  R2 = a("RefreshCcw", [
    [
      "path",
      {
        d: "M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",
        key: "14sxne",
      },
    ],
    ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
    [
      "path",
      {
        d: "M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16",
        key: "1hlbsb",
      },
    ],
    ["path", { d: "M16 16h5v5", key: "ccwih5" }],
  ]),
  E2 = a("RefreshCw", [
    [
      "path",
      {
        d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
        key: "v9h5vc",
      },
    ],
    ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
    [
      "path",
      {
        d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
        key: "3uifl3",
      },
    ],
    ["path", { d: "M8 16H3v5", key: "1cv678" }],
  ]),
  P2 = a("RotateCcw", [
    [
      "path",
      { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8", key: "1357e3" },
    ],
    ["path", { d: "M3 3v5h5", key: "1xhq8a" }],
  ]),
  T2 = a("Save", [
    [
      "path",
      {
        d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",
        key: "1owoqh",
      },
    ],
    ["polyline", { points: "17 21 17 13 7 13 7 21", key: "1md35c" }],
    ["polyline", { points: "7 3 7 8 15 8", key: "8nz8an" }],
  ]),
  U2 = a("Search", [
    ["circle", { cx: "11", cy: "11", r: "8", key: "4ej97u" }],
    ["path", { d: "m21 21-4.3-4.3", key: "1qie3q" }],
  ]),
  $2 = a("Send", [
    ["path", { d: "m22 2-7 20-4-9-9-4Z", key: "1q3vgg" }],
    ["path", { d: "M22 2 11 13", key: "nzbqef" }],
  ]),
  O2 = a("Server", [
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "2",
        rx: "2",
        ry: "2",
        key: "ngkwjq",
      },
    ],
    [
      "rect",
      {
        width: "20",
        height: "8",
        x: "2",
        y: "14",
        rx: "2",
        ry: "2",
        key: "iecqi9",
      },
    ],
    ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6", key: "16zg32" }],
    ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18", key: "nzw8ys" }],
  ]),
  D2 = a("Settings2", [
    ["path", { d: "M20 7h-9", key: "3s1dr2" }],
    ["path", { d: "M14 17H5", key: "gfn3mx" }],
    ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
    ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }],
  ]),
  F2 = a("Settings", [
    [
      "path",
      {
        d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
        key: "1qme2f",
      },
    ],
    ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
  ]),
  I2 = a("Share2", [
    ["circle", { cx: "18", cy: "5", r: "3", key: "gq8acd" }],
    ["circle", { cx: "6", cy: "12", r: "3", key: "w7nqdw" }],
    ["circle", { cx: "18", cy: "19", r: "3", key: "1xt0gg" }],
    [
      "line",
      { x1: "8.59", x2: "15.42", y1: "13.51", y2: "17.49", key: "47mynk" },
    ],
    [
      "line",
      { x1: "15.41", x2: "8.59", y1: "6.51", y2: "10.49", key: "1n3mei" },
    ],
  ]),
  B2 = a("ShieldAlert", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
    ["path", { d: "M12 8v4", key: "1got3b" }],
    ["path", { d: "M12 16h.01", key: "1drbdi" }],
  ]),
  Z2 = a("ShieldCheck", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
    ["path", { d: "m9 12 2 2 4-4", key: "dzmm74" }],
  ]),
  N2 = a("ShieldX", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
    ["path", { d: "m14.5 9.5-5 5", key: "17q4r4" }],
    ["path", { d: "m9.5 9.5 5 5", key: "18nt4w" }],
  ]),
  G2 = a("Shield", [
    [
      "path",
      {
        d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
        key: "oel41y",
      },
    ],
  ]),
  W2 = a("Smartphone", [
    [
      "rect",
      {
        width: "14",
        height: "20",
        x: "5",
        y: "2",
        rx: "2",
        ry: "2",
        key: "1yt0o3",
      },
    ],
    ["path", { d: "M12 18h.01", key: "mhygvu" }],
  ]),
  X2 = a("Sparkles", [
    [
      "path",
      {
        d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z",
        key: "17u4zn",
      },
    ],
    ["path", { d: "M5 3v4", key: "bklmnn" }],
    ["path", { d: "M19 17v4", key: "iiml17" }],
    ["path", { d: "M3 5h4", key: "nem4j1" }],
    ["path", { d: "M17 19h4", key: "lbex7p" }],
  ]),
  Q2 = a("SquarePen", [
    [
      "path",
      {
        d: "M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7",
        key: "1m0v6g",
      },
    ],
    [
      "path",
      {
        d: "M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z",
        key: "1lpok0",
      },
    ],
  ]),
  Y2 = a("Star", [
    [
      "polygon",
      {
        points:
          "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",
        key: "8f66p6",
      },
    ],
  ]),
  J2 = a("Tablet", [
    [
      "rect",
      {
        width: "16",
        height: "20",
        x: "4",
        y: "2",
        rx: "2",
        ry: "2",
        key: "76otgf",
      },
    ],
    ["line", { x1: "12", x2: "12.01", y1: "18", y2: "18", key: "1dp563" }],
  ]),
  K2 = a("Tag", [
    [
      "path",
      {
        d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z",
        key: "vktsd0",
      },
    ],
    [
      "circle",
      { cx: "7.5", cy: "7.5", r: ".5", fill: "currentColor", key: "kqv944" },
    ],
  ]),
  ee = a("Target", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["circle", { cx: "12", cy: "12", r: "6", key: "1vlfrh" }],
    ["circle", { cx: "12", cy: "12", r: "2", key: "1c9p78" }],
  ]),
  ae = a("Timer", [
    ["line", { x1: "10", x2: "14", y1: "2", y2: "2", key: "14vaq8" }],
    ["line", { x1: "12", x2: "15", y1: "14", y2: "11", key: "17fdiu" }],
    ["circle", { cx: "12", cy: "14", r: "8", key: "1e1u0o" }],
  ]),
  te = a("Trash2", [
    ["path", { d: "M3 6h18", key: "d0wm0j" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }],
  ]),
  re = a("TrendingDown", [
    ["polyline", { points: "22 17 13.5 8.5 8.5 13.5 2 7", key: "1r2t7k" }],
    ["polyline", { points: "16 17 22 17 22 11", key: "11uiuu" }],
  ]),
  ye = a("TrendingUp", [
    ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17", key: "126l90" }],
    ["polyline", { points: "16 7 22 7 22 13", key: "kwv8wd" }],
  ]),
  ne = a("Truck", [
    [
      "path",
      {
        d: "M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2",
        key: "wrbu53",
      },
    ],
    ["path", { d: "M15 18H9", key: "1lyqi6" }],
    [
      "path",
      {
        d: "M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14",
        key: "lysw3i",
      },
    ],
    ["circle", { cx: "17", cy: "18", r: "2", key: "332jqn" }],
    ["circle", { cx: "7", cy: "18", r: "2", key: "19iecd" }],
  ]),
  he = a("Twitter", [
    [
      "path",
      {
        d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
        key: "pff0z6",
      },
    ],
  ]),
  ie = a("Type", [
    ["polyline", { points: "4 7 4 4 20 4 20 7", key: "1nosan" }],
    ["line", { x1: "9", x2: "15", y1: "20", y2: "20", key: "swin9y" }],
    ["line", { x1: "12", x2: "12", y1: "4", y2: "20", key: "1tx1rr" }],
  ]),
  ce = a("Undo2", [
    ["path", { d: "M9 14 4 9l5-5", key: "102s5s" }],
    [
      "path",
      {
        d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11",
        key: "llx8ln",
      },
    ],
  ]),
  le = a("Upload", [
    ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
    ["polyline", { points: "17 8 12 3 7 8", key: "t8dd8p" }],
    ["line", { x1: "12", x2: "12", y1: "3", y2: "15", key: "widbto" }],
  ]),
  ke = a("UserCheck", [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["polyline", { points: "16 11 18 13 22 9", key: "1pwet4" }],
  ]),
  oe = a("UserCog", [
    ["circle", { cx: "18", cy: "15", r: "3", key: "gjjjvw" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["path", { d: "M10 15H6a4 4 0 0 0-4 4v2", key: "1nfge6" }],
    ["path", { d: "m21.7 16.4-.9-.3", key: "12j9ji" }],
    ["path", { d: "m15.2 13.9-.9-.3", key: "1fdjdi" }],
    ["path", { d: "m16.6 18.7.3-.9", key: "heedtr" }],
    ["path", { d: "m19.1 12.2.3-.9", key: "1af3ki" }],
    ["path", { d: "m19.6 18.7-.4-1", key: "1x9vze" }],
    ["path", { d: "m16.8 12.3-.4-1", key: "vqeiwj" }],
    ["path", { d: "m14.3 16.6 1-.4", key: "1qlj63" }],
    ["path", { d: "m20.7 13.8 1-.4", key: "1v5t8k" }],
  ]),
  de = a("UserPlus", [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["line", { x1: "19", x2: "19", y1: "8", y2: "14", key: "1bvyxn" }],
    ["line", { x1: "22", x2: "16", y1: "11", y2: "11", key: "1shjgl" }],
  ]),
  pe = a("User", [
    ["path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2", key: "975kel" }],
    ["circle", { cx: "12", cy: "7", r: "4", key: "17ys0d" }],
  ]),
  se = a("Users", [
    ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
    ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
    ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
    ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }],
  ]),
  ue = a("Video", [
    ["path", { d: "m22 8-6 4 6 4V8Z", key: "50v9me" }],
    [
      "rect",
      {
        width: "14",
        height: "12",
        x: "2",
        y: "6",
        rx: "2",
        ry: "2",
        key: "1rqjg6",
      },
    ],
  ]),
  ve = a("WifiOff", [
    ["path", { d: "M12 20h.01", key: "zekei9" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69", key: "1dl1wf" }],
    ["path", { d: "M19 12.859a10 10 0 0 0-2.007-1.523", key: "4k23kn" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 4.177-2.643", key: "1grhjp" }],
    ["path", { d: "M22 8.82a15 15 0 0 0-11.288-3.764", key: "z3jwby" }],
    ["path", { d: "m2 2 20 20", key: "1ooewy" }],
  ]),
  fe = a("Wifi", [
    ["path", { d: "M12 20h.01", key: "zekei9" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0", key: "dnpr2z" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0", key: "1x1e6c" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0", key: "1bycff" }],
  ]),
  xe = a("XCircle", [
    ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
    ["path", { d: "m15 9-6 6", key: "1uzhvr" }],
    ["path", { d: "m9 9 6 6", key: "z0biqf" }],
  ]),
  Me = a("X", [
    ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
    ["path", { d: "m6 6 12 12", key: "d8bk6v" }],
  ]),
  me = a("Youtube", [
    [
      "path",
      {
        d: "M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17",
        key: "1q2vi4",
      },
    ],
    ["path", { d: "m10 15 5-3-5-3z", key: "1jp15x" }],
  ]),
  ge = a("Zap", [
    [
      "polygon",
      { points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2", key: "45s27k" },
    ],
  ]);
export {
  C2 as $,
  C1 as $t,
  N2 as A,
  N1 as At,
  P2 as B,
  P1 as Bt,
  K2 as C,
  K1 as Ct,
  X2 as D,
  X1 as Dt,
  Q2 as E,
  Q1 as Et,
  D2 as F,
  D1 as Ft,
  _2 as G,
  _1 as Gt,
  R2 as H,
  R1 as Ht,
  O2 as I,
  O1 as It,
  j2 as J,
  j1 as Jt,
  L2 as K,
  L1 as Kt,
  $2 as L,
  $1 as Lt,
  B2 as M,
  B1 as Mt,
  I2 as N,
  I1 as Nt,
  W2 as O,
  W1 as Ot,
  F2 as P,
  F1 as Pt,
  b2 as Q,
  b1 as Qt,
  U2 as R,
  U1 as Rt,
  ee as S,
  e2 as St,
  Y2 as T,
  Y1 as Tt,
  V2 as U,
  V1 as Ut,
  E2 as V,
  E1 as Vt,
  A2 as W,
  A1 as Wt,
  z2 as X,
  z1 as Xt,
  S2 as Y,
  S1 as Yt,
  q2 as Z,
  q1 as Zt,
  ne as _,
  n1 as _n,
  n2 as _t,
  fe as a,
  f1 as an,
  f2 as at,
  te as b,
  t1 as bn,
  t2 as bt,
  se as c,
  s1 as cn,
  s2 as ct,
  oe as d,
  o1 as dn,
  o2 as dt,
  w1 as en,
  w2 as et,
  ke as f,
  k1 as fn,
  k2 as ft,
  he as g,
  h1 as gn,
  h2 as gt,
  ie as h,
  i1 as hn,
  i2 as ht,
  xe as i,
  x1 as in,
  x2 as it,
  Z2 as j,
  Z1 as jt,
  G2 as k,
  G1 as kt,
  pe as l,
  p1 as ln,
  p2 as lt,
  ce as m,
  c1 as mn,
  c2 as mt,
  me as n,
  m1 as nn,
  m2 as nt,
  ve as o,
  v1 as on,
  v2 as ot,
  le as p,
  l1 as pn,
  l2 as pt,
  H2 as q,
  H1 as qt,
  Me as r,
  M1 as rn,
  M2 as rt,
  ue as s,
  u1 as sn,
  u2 as st,
  ge as t,
  g1 as tn,
  g2 as tt,
  de as u,
  d1 as un,
  d2 as ut,
  ye as v,
  y1 as vn,
  y2 as vt,
  J2 as w,
  J1 as wt,
  ae as x,
  J as xn,
  a2 as xt,
  re as y,
  r1 as yn,
  r2 as yt,
  T2 as z,
  T1 as zt,
};

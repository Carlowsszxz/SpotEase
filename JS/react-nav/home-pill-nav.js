//#region \0rolldown/runtime.js
var e = Object.create, t = Object.defineProperty, n = Object.getOwnPropertyDescriptor, r = Object.getOwnPropertyNames, i = Object.getPrototypeOf, a = Object.prototype.hasOwnProperty, o = (e, t) => () => (e && (t = e(e = 0)), t), s = (e, t) => () => (t || e((t = { exports: {} }).exports, t), t.exports), c = (e, i, o, s) => {
	if (i && typeof i == "object" || typeof i == "function") for (var c = r(i), l = 0, u = c.length, d; l < u; l++) d = c[l], !a.call(e, d) && d !== o && t(e, d, {
		get: ((e) => i[e]).bind(null, d),
		enumerable: !(s = n(i, d)) || s.enumerable
	});
	return e;
}, l = (n, r, a) => (a = n == null ? {} : e(i(n)), c(r || !n || !n.__esModule ? t(a, "default", {
	value: n,
	enumerable: !0
}) : a, n)), u = /* @__PURE__ */ s(((e) => {
	var t = Symbol.for("react.transitional.element"), n = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), o = Symbol.for("react.consumer"), s = Symbol.for("react.context"), c = Symbol.for("react.forward_ref"), l = Symbol.for("react.suspense"), u = Symbol.for("react.memo"), d = Symbol.for("react.lazy"), f = Symbol.for("react.activity"), p = Symbol.iterator;
	function m(e) {
		return typeof e != "object" || !e ? null : (e = p && e[p] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var h = {
		isMounted: function() {
			return !1;
		},
		enqueueForceUpdate: function() {},
		enqueueReplaceState: function() {},
		enqueueSetState: function() {}
	}, g = Object.assign, _ = {};
	function v(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	v.prototype.isReactComponent = {}, v.prototype.setState = function(e, t) {
		if (typeof e != "object" && typeof e != "function" && e != null) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
		this.updater.enqueueSetState(this, e, t, "setState");
	}, v.prototype.forceUpdate = function(e) {
		this.updater.enqueueForceUpdate(this, e, "forceUpdate");
	};
	function y() {}
	y.prototype = v.prototype;
	function b(e, t, n) {
		this.props = e, this.context = t, this.refs = _, this.updater = n || h;
	}
	var x = b.prototype = new y();
	x.constructor = b, g(x, v.prototype), x.isPureReactComponent = !0;
	var S = Array.isArray;
	function C() {}
	var w = {
		H: null,
		A: null,
		T: null,
		S: null
	}, T = Object.prototype.hasOwnProperty;
	function E(e, n, r) {
		var i = r.ref;
		return {
			$$typeof: t,
			type: e,
			key: n,
			ref: i === void 0 ? null : i,
			props: r
		};
	}
	function D(e, t) {
		return E(e.type, t, e.props);
	}
	function O(e) {
		return typeof e == "object" && !!e && e.$$typeof === t;
	}
	function k(e) {
		var t = {
			"=": "=0",
			":": "=2"
		};
		return "$" + e.replace(/[=:]/g, function(e) {
			return t[e];
		});
	}
	var ee = /\/+/g;
	function te(e, t) {
		return typeof e == "object" && e && e.key != null ? k("" + e.key) : t.toString(36);
	}
	function ne(e) {
		switch (e.status) {
			case "fulfilled": return e.value;
			case "rejected": throw e.reason;
			default: switch (typeof e.status == "string" ? e.then(C, C) : (e.status = "pending", e.then(function(t) {
				e.status === "pending" && (e.status = "fulfilled", e.value = t);
			}, function(t) {
				e.status === "pending" && (e.status = "rejected", e.reason = t);
			})), e.status) {
				case "fulfilled": return e.value;
				case "rejected": throw e.reason;
			}
		}
		throw e;
	}
	function re(e, r, i, a, o) {
		var s = typeof e;
		(s === "undefined" || s === "boolean") && (e = null);
		var c = !1;
		if (e === null) c = !0;
		else switch (s) {
			case "bigint":
			case "string":
			case "number":
				c = !0;
				break;
			case "object": switch (e.$$typeof) {
				case t:
				case n:
					c = !0;
					break;
				case d: return c = e._init, re(c(e._payload), r, i, a, o);
			}
		}
		if (c) return o = o(e), c = a === "" ? "." + te(e, 0) : a, S(o) ? (i = "", c != null && (i = c.replace(ee, "$&/") + "/"), re(o, r, i, "", function(e) {
			return e;
		})) : o != null && (O(o) && (o = D(o, i + (o.key == null || e && e.key === o.key ? "" : ("" + o.key).replace(ee, "$&/") + "/") + c)), r.push(o)), 1;
		c = 0;
		var l = a === "" ? "." : a + ":";
		if (S(e)) for (var u = 0; u < e.length; u++) a = e[u], s = l + te(a, u), c += re(a, r, i, s, o);
		else if (u = m(e), typeof u == "function") for (e = u.call(e), u = 0; !(a = e.next()).done;) a = a.value, s = l + te(a, u++), c += re(a, r, i, s, o);
		else if (s === "object") {
			if (typeof e.then == "function") return re(ne(e), r, i, a, o);
			throw r = String(e), Error("Objects are not valid as a React child (found: " + (r === "[object Object]" ? "object with keys {" + Object.keys(e).join(", ") + "}" : r) + "). If you meant to render a collection of children, use an array instead.");
		}
		return c;
	}
	function ie(e, t, n) {
		if (e == null) return e;
		var r = [], i = 0;
		return re(e, r, "", "", function(e) {
			return t.call(n, e, i++);
		}), r;
	}
	function ae(e) {
		if (e._status === -1) {
			var t = e._result;
			t = t(), t.then(function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 1, e._result = t);
			}, function(t) {
				(e._status === 0 || e._status === -1) && (e._status = 2, e._result = t);
			}), e._status === -1 && (e._status = 0, e._result = t);
		}
		if (e._status === 1) return e._result.default;
		throw e._result;
	}
	var A = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof { env: { NODE_ENV: "production" } }.emit == "function") {
			({ env: { NODE_ENV: "production" } }).emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, j = {
		map: ie,
		forEach: function(e, t, n) {
			ie(e, function() {
				t.apply(this, arguments);
			}, n);
		},
		count: function(e) {
			var t = 0;
			return ie(e, function() {
				t++;
			}), t;
		},
		toArray: function(e) {
			return ie(e, function(e) {
				return e;
			}) || [];
		},
		only: function(e) {
			if (!O(e)) throw Error("React.Children.only expected to receive a single React element child.");
			return e;
		}
	};
	e.Activity = f, e.Children = j, e.Component = v, e.Fragment = r, e.Profiler = a, e.PureComponent = b, e.StrictMode = i, e.Suspense = l, e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = w, e.__COMPILER_RUNTIME = {
		__proto__: null,
		c: function(e) {
			return w.H.useMemoCache(e);
		}
	}, e.cache = function(e) {
		return function() {
			return e.apply(null, arguments);
		};
	}, e.cacheSignal = function() {
		return null;
	}, e.cloneElement = function(e, t, n) {
		if (e == null) throw Error("The argument must be a React element, but you passed " + e + ".");
		var r = g({}, e.props), i = e.key;
		if (t != null) for (a in t.key !== void 0 && (i = "" + t.key), t) !T.call(t, a) || a === "key" || a === "__self" || a === "__source" || a === "ref" && t.ref === void 0 || (r[a] = t[a]);
		var a = arguments.length - 2;
		if (a === 1) r.children = n;
		else if (1 < a) {
			for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
			r.children = o;
		}
		return E(e.type, i, r);
	}, e.createContext = function(e) {
		return e = {
			$$typeof: s,
			_currentValue: e,
			_currentValue2: e,
			_threadCount: 0,
			Provider: null,
			Consumer: null
		}, e.Provider = e, e.Consumer = {
			$$typeof: o,
			_context: e
		}, e;
	}, e.createElement = function(e, t, n) {
		var r, i = {}, a = null;
		if (t != null) for (r in t.key !== void 0 && (a = "" + t.key), t) T.call(t, r) && r !== "key" && r !== "__self" && r !== "__source" && (i[r] = t[r]);
		var o = arguments.length - 2;
		if (o === 1) i.children = n;
		else if (1 < o) {
			for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
			i.children = s;
		}
		if (e && e.defaultProps) for (r in o = e.defaultProps, o) i[r] === void 0 && (i[r] = o[r]);
		return E(e, a, i);
	}, e.createRef = function() {
		return { current: null };
	}, e.forwardRef = function(e) {
		return {
			$$typeof: c,
			render: e
		};
	}, e.isValidElement = O, e.lazy = function(e) {
		return {
			$$typeof: d,
			_payload: {
				_status: -1,
				_result: e
			},
			_init: ae
		};
	}, e.memo = function(e, t) {
		return {
			$$typeof: u,
			type: e,
			compare: t === void 0 ? null : t
		};
	}, e.startTransition = function(e) {
		var t = w.T, n = {};
		w.T = n;
		try {
			var r = e(), i = w.S;
			i !== null && i(n, r), typeof r == "object" && r && typeof r.then == "function" && r.then(C, A);
		} catch (e) {
			A(e);
		} finally {
			t !== null && n.types !== null && (t.types = n.types), w.T = t;
		}
	}, e.unstable_useCacheRefresh = function() {
		return w.H.useCacheRefresh();
	}, e.use = function(e) {
		return w.H.use(e);
	}, e.useActionState = function(e, t, n) {
		return w.H.useActionState(e, t, n);
	}, e.useCallback = function(e, t) {
		return w.H.useCallback(e, t);
	}, e.useContext = function(e) {
		return w.H.useContext(e);
	}, e.useDebugValue = function() {}, e.useDeferredValue = function(e, t) {
		return w.H.useDeferredValue(e, t);
	}, e.useEffect = function(e, t) {
		return w.H.useEffect(e, t);
	}, e.useEffectEvent = function(e) {
		return w.H.useEffectEvent(e);
	}, e.useId = function() {
		return w.H.useId();
	}, e.useImperativeHandle = function(e, t, n) {
		return w.H.useImperativeHandle(e, t, n);
	}, e.useInsertionEffect = function(e, t) {
		return w.H.useInsertionEffect(e, t);
	}, e.useLayoutEffect = function(e, t) {
		return w.H.useLayoutEffect(e, t);
	}, e.useMemo = function(e, t) {
		return w.H.useMemo(e, t);
	}, e.useOptimistic = function(e, t) {
		return w.H.useOptimistic(e, t);
	}, e.useReducer = function(e, t, n) {
		return w.H.useReducer(e, t, n);
	}, e.useRef = function(e) {
		return w.H.useRef(e);
	}, e.useState = function(e) {
		return w.H.useState(e);
	}, e.useSyncExternalStore = function(e, t, n) {
		return w.H.useSyncExternalStore(e, t, n);
	}, e.useTransition = function() {
		return w.H.useTransition();
	}, e.version = "19.2.5";
})), d = /* @__PURE__ */ s(((e, t) => {
	t.exports = u();
})), f = /* @__PURE__ */ s(((e) => {
	function t(e, t) {
		var n = e.length;
		e.push(t);
		a: for (; 0 < n;) {
			var r = n - 1 >>> 1, a = e[r];
			if (0 < i(a, t)) e[r] = t, e[n] = a, n = r;
			else break a;
		}
	}
	function n(e) {
		return e.length === 0 ? null : e[0];
	}
	function r(e) {
		if (e.length === 0) return null;
		var t = e[0], n = e.pop();
		if (n !== t) {
			e[0] = n;
			a: for (var r = 0, a = e.length, o = a >>> 1; r < o;) {
				var s = 2 * (r + 1) - 1, c = e[s], l = s + 1, u = e[l];
				if (0 > i(c, n)) l < a && 0 > i(u, c) ? (e[r] = u, e[l] = n, r = l) : (e[r] = c, e[s] = n, r = s);
				else if (l < a && 0 > i(u, n)) e[r] = u, e[l] = n, r = l;
				else break a;
			}
		}
		return t;
	}
	function i(e, t) {
		var n = e.sortIndex - t.sortIndex;
		return n === 0 ? e.id - t.id : n;
	}
	if (e.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
		var a = performance;
		e.unstable_now = function() {
			return a.now();
		};
	} else {
		var o = Date, s = o.now();
		e.unstable_now = function() {
			return o.now() - s;
		};
	}
	var c = [], l = [], u = 1, d = null, f = 3, p = !1, m = !1, h = !1, g = !1, _ = typeof setTimeout == "function" ? setTimeout : null, v = typeof clearTimeout == "function" ? clearTimeout : null, y = typeof setImmediate < "u" ? setImmediate : null;
	function b(e) {
		for (var i = n(l); i !== null;) {
			if (i.callback === null) r(l);
			else if (i.startTime <= e) r(l), i.sortIndex = i.expirationTime, t(c, i);
			else break;
			i = n(l);
		}
	}
	function x(e) {
		if (h = !1, b(e), !m) if (n(c) !== null) m = !0, S || (S = !0, O());
		else {
			var t = n(l);
			t !== null && te(x, t.startTime - e);
		}
	}
	var S = !1, C = -1, w = 5, T = -1;
	function E() {
		return g ? !0 : !(e.unstable_now() - T < w);
	}
	function D() {
		if (g = !1, S) {
			var t = e.unstable_now();
			T = t;
			var i = !0;
			try {
				a: {
					m = !1, h && (h = !1, v(C), C = -1), p = !0;
					var a = f;
					try {
						b: {
							for (b(t), d = n(c); d !== null && !(d.expirationTime > t && E());) {
								var o = d.callback;
								if (typeof o == "function") {
									d.callback = null, f = d.priorityLevel;
									var s = o(d.expirationTime <= t);
									if (t = e.unstable_now(), typeof s == "function") {
										d.callback = s, b(t), i = !0;
										break b;
									}
									d === n(c) && r(c), b(t);
								} else r(c);
								d = n(c);
							}
							if (d !== null) i = !0;
							else {
								var u = n(l);
								u !== null && te(x, u.startTime - t), i = !1;
							}
						}
						break a;
					} finally {
						d = null, f = a, p = !1;
					}
					i = void 0;
				}
			} finally {
				i ? O() : S = !1;
			}
		}
	}
	var O;
	if (typeof y == "function") O = function() {
		y(D);
	};
	else if (typeof MessageChannel < "u") {
		var k = new MessageChannel(), ee = k.port2;
		k.port1.onmessage = D, O = function() {
			ee.postMessage(null);
		};
	} else O = function() {
		_(D, 0);
	};
	function te(t, n) {
		C = _(function() {
			t(e.unstable_now());
		}, n);
	}
	e.unstable_IdlePriority = 5, e.unstable_ImmediatePriority = 1, e.unstable_LowPriority = 4, e.unstable_NormalPriority = 3, e.unstable_Profiling = null, e.unstable_UserBlockingPriority = 2, e.unstable_cancelCallback = function(e) {
		e.callback = null;
	}, e.unstable_forceFrameRate = function(e) {
		0 > e || 125 < e ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : w = 0 < e ? Math.floor(1e3 / e) : 5;
	}, e.unstable_getCurrentPriorityLevel = function() {
		return f;
	}, e.unstable_next = function(e) {
		switch (f) {
			case 1:
			case 2:
			case 3:
				var t = 3;
				break;
			default: t = f;
		}
		var n = f;
		f = t;
		try {
			return e();
		} finally {
			f = n;
		}
	}, e.unstable_requestPaint = function() {
		g = !0;
	}, e.unstable_runWithPriority = function(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 3:
			case 4:
			case 5: break;
			default: e = 3;
		}
		var n = f;
		f = e;
		try {
			return t();
		} finally {
			f = n;
		}
	}, e.unstable_scheduleCallback = function(r, i, a) {
		var o = e.unstable_now();
		switch (typeof a == "object" && a ? (a = a.delay, a = typeof a == "number" && 0 < a ? o + a : o) : a = o, r) {
			case 1:
				var s = -1;
				break;
			case 2:
				s = 250;
				break;
			case 5:
				s = 1073741823;
				break;
			case 4:
				s = 1e4;
				break;
			default: s = 5e3;
		}
		return s = a + s, r = {
			id: u++,
			callback: i,
			priorityLevel: r,
			startTime: a,
			expirationTime: s,
			sortIndex: -1
		}, a > o ? (r.sortIndex = a, t(l, r), n(c) === null && r === n(l) && (h ? (v(C), C = -1) : h = !0, te(x, a - o))) : (r.sortIndex = s, t(c, r), m || p || (m = !0, S || (S = !0, O()))), r;
	}, e.unstable_shouldYield = E, e.unstable_wrapCallback = function(e) {
		var t = f;
		return function() {
			var n = f;
			f = t;
			try {
				return e.apply(this, arguments);
			} finally {
				f = n;
			}
		};
	};
})), p = /* @__PURE__ */ s(((e, t) => {
	t.exports = f();
})), m = /* @__PURE__ */ s(((e) => {
	var t = d();
	function n(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function r() {}
	var i = {
		d: {
			f: r,
			r: function() {
				throw Error(n(522));
			},
			D: r,
			C: r,
			L: r,
			m: r,
			X: r,
			S: r,
			M: r
		},
		p: 0,
		findDOMNode: null
	}, a = Symbol.for("react.portal");
	function o(e, t, n) {
		var r = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
		return {
			$$typeof: a,
			key: r == null ? null : "" + r,
			children: e,
			containerInfo: t,
			implementation: n
		};
	}
	var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
	function c(e, t) {
		if (e === "font") return "";
		if (typeof t == "string") return t === "use-credentials" ? t : "";
	}
	e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i, e.createPortal = function(e, t) {
		var r = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
		if (!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11) throw Error(n(299));
		return o(e, t, null, r);
	}, e.flushSync = function(e) {
		var t = s.T, n = i.p;
		try {
			if (s.T = null, i.p = 2, e) return e();
		} finally {
			s.T = t, i.p = n, i.d.f();
		}
	}, e.preconnect = function(e, t) {
		typeof e == "string" && (t ? (t = t.crossOrigin, t = typeof t == "string" ? t === "use-credentials" ? t : "" : void 0) : t = null, i.d.C(e, t));
	}, e.prefetchDNS = function(e) {
		typeof e == "string" && i.d.D(e);
	}, e.preinit = function(e, t) {
		if (typeof e == "string" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin), a = typeof t.integrity == "string" ? t.integrity : void 0, o = typeof t.fetchPriority == "string" ? t.fetchPriority : void 0;
			n === "style" ? i.d.S(e, typeof t.precedence == "string" ? t.precedence : void 0, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o
			}) : n === "script" && i.d.X(e, {
				crossOrigin: r,
				integrity: a,
				fetchPriority: o,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0
			});
		}
	}, e.preinitModule = function(e, t) {
		if (typeof e == "string") if (typeof t == "object" && t) {
			if (t.as == null || t.as === "script") {
				var n = c(t.as, t.crossOrigin);
				i.d.M(e, {
					crossOrigin: n,
					integrity: typeof t.integrity == "string" ? t.integrity : void 0,
					nonce: typeof t.nonce == "string" ? t.nonce : void 0
				});
			}
		} else t ?? i.d.M(e);
	}, e.preload = function(e, t) {
		if (typeof e == "string" && typeof t == "object" && t && typeof t.as == "string") {
			var n = t.as, r = c(n, t.crossOrigin);
			i.d.L(e, n, {
				crossOrigin: r,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0,
				nonce: typeof t.nonce == "string" ? t.nonce : void 0,
				type: typeof t.type == "string" ? t.type : void 0,
				fetchPriority: typeof t.fetchPriority == "string" ? t.fetchPriority : void 0,
				referrerPolicy: typeof t.referrerPolicy == "string" ? t.referrerPolicy : void 0,
				imageSrcSet: typeof t.imageSrcSet == "string" ? t.imageSrcSet : void 0,
				imageSizes: typeof t.imageSizes == "string" ? t.imageSizes : void 0,
				media: typeof t.media == "string" ? t.media : void 0
			});
		}
	}, e.preloadModule = function(e, t) {
		if (typeof e == "string") if (t) {
			var n = c(t.as, t.crossOrigin);
			i.d.m(e, {
				as: typeof t.as == "string" && t.as !== "script" ? t.as : void 0,
				crossOrigin: n,
				integrity: typeof t.integrity == "string" ? t.integrity : void 0
			});
		} else i.d.m(e);
	}, e.requestFormReset = function(e) {
		i.d.r(e);
	}, e.unstable_batchedUpdates = function(e, t) {
		return e(t);
	}, e.useFormState = function(e, t, n) {
		return s.H.useFormState(e, t, n);
	}, e.useFormStatus = function() {
		return s.H.useHostTransitionStatus();
	}, e.version = "19.2.5";
})), h = /* @__PURE__ */ s(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = m();
})), g = /* @__PURE__ */ s(((e) => {
	var t = p(), n = d(), r = h();
	function i(e) {
		var t = "https://react.dev/errors/" + e;
		if (1 < arguments.length) {
			t += "?args[]=" + encodeURIComponent(arguments[1]);
			for (var n = 2; n < arguments.length; n++) t += "&args[]=" + encodeURIComponent(arguments[n]);
		}
		return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
	}
	function a(e) {
		return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11);
	}
	function o(e) {
		var t = e, n = e;
		if (e.alternate) for (; t.return;) t = t.return;
		else {
			e = t;
			do
				t = e, t.flags & 4098 && (n = t.return), e = t.return;
			while (e);
		}
		return t.tag === 3 ? n : null;
	}
	function s(e) {
		if (e.tag === 13) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function c(e) {
		if (e.tag === 31) {
			var t = e.memoizedState;
			if (t === null && (e = e.alternate, e !== null && (t = e.memoizedState)), t !== null) return t.dehydrated;
		}
		return null;
	}
	function l(e) {
		if (o(e) !== e) throw Error(i(188));
	}
	function u(e) {
		var t = e.alternate;
		if (!t) {
			if (t = o(e), t === null) throw Error(i(188));
			return t === e ? e : null;
		}
		for (var n = e, r = t;;) {
			var a = n.return;
			if (a === null) break;
			var s = a.alternate;
			if (s === null) {
				if (r = a.return, r !== null) {
					n = r;
					continue;
				}
				break;
			}
			if (a.child === s.child) {
				for (s = a.child; s;) {
					if (s === n) return l(a), e;
					if (s === r) return l(a), t;
					s = s.sibling;
				}
				throw Error(i(188));
			}
			if (n.return !== r.return) n = a, r = s;
			else {
				for (var c = !1, u = a.child; u;) {
					if (u === n) {
						c = !0, n = a, r = s;
						break;
					}
					if (u === r) {
						c = !0, r = a, n = s;
						break;
					}
					u = u.sibling;
				}
				if (!c) {
					for (u = s.child; u;) {
						if (u === n) {
							c = !0, n = s, r = a;
							break;
						}
						if (u === r) {
							c = !0, r = s, n = a;
							break;
						}
						u = u.sibling;
					}
					if (!c) throw Error(i(189));
				}
			}
			if (n.alternate !== r) throw Error(i(190));
		}
		if (n.tag !== 3) throw Error(i(188));
		return n.stateNode.current === n ? e : t;
	}
	function f(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e;
		for (e = e.child; e !== null;) {
			if (t = f(e), t !== null) return t;
			e = e.sibling;
		}
		return null;
	}
	var m = Object.assign, g = Symbol.for("react.element"), _ = Symbol.for("react.transitional.element"), v = Symbol.for("react.portal"), y = Symbol.for("react.fragment"), b = Symbol.for("react.strict_mode"), x = Symbol.for("react.profiler"), S = Symbol.for("react.consumer"), C = Symbol.for("react.context"), w = Symbol.for("react.forward_ref"), T = Symbol.for("react.suspense"), E = Symbol.for("react.suspense_list"), D = Symbol.for("react.memo"), O = Symbol.for("react.lazy"), k = Symbol.for("react.activity"), ee = Symbol.for("react.memo_cache_sentinel"), te = Symbol.iterator;
	function ne(e) {
		return typeof e != "object" || !e ? null : (e = te && e[te] || e["@@iterator"], typeof e == "function" ? e : null);
	}
	var re = Symbol.for("react.client.reference");
	function ie(e) {
		if (e == null) return null;
		if (typeof e == "function") return e.$$typeof === re ? null : e.displayName || e.name || null;
		if (typeof e == "string") return e;
		switch (e) {
			case y: return "Fragment";
			case x: return "Profiler";
			case b: return "StrictMode";
			case T: return "Suspense";
			case E: return "SuspenseList";
			case k: return "Activity";
		}
		if (typeof e == "object") switch (e.$$typeof) {
			case v: return "Portal";
			case C: return e.displayName || "Context";
			case S: return (e._context.displayName || "Context") + ".Consumer";
			case w:
				var t = e.render;
				return e = e.displayName, e ||= (e = t.displayName || t.name || "", e === "" ? "ForwardRef" : "ForwardRef(" + e + ")"), e;
			case D: return t = e.displayName || null, t === null ? ie(e.type) || "Memo" : t;
			case O:
				t = e._payload, e = e._init;
				try {
					return ie(e(t));
				} catch {}
		}
		return null;
	}
	var ae = Array.isArray, A = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, j = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, oe = {
		pending: !1,
		data: null,
		method: null,
		action: null
	}, se = [], ce = -1;
	function le(e) {
		return { current: e };
	}
	function ue(e) {
		0 > ce || (e.current = se[ce], se[ce] = null, ce--);
	}
	function M(e, t) {
		ce++, se[ce] = e.current, e.current = t;
	}
	var de = le(null), fe = le(null), pe = le(null), me = le(null);
	function he(e, t) {
		switch (M(pe, t), M(fe, e), M(de, null), t.nodeType) {
			case 9:
			case 11:
				e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
				break;
			default: if (e = t.tagName, t = t.namespaceURI) t = Vd(t), e = Hd(t, e);
			else switch (e) {
				case "svg":
					e = 1;
					break;
				case "math":
					e = 2;
					break;
				default: e = 0;
			}
		}
		ue(de), M(de, e);
	}
	function ge() {
		ue(de), ue(fe), ue(pe);
	}
	function _e(e) {
		e.memoizedState !== null && M(me, e);
		var t = de.current, n = Hd(t, e.type);
		t !== n && (M(fe, e), M(de, n));
	}
	function ve(e) {
		fe.current === e && (ue(de), ue(fe)), me.current === e && (ue(me), Qf._currentValue = oe);
	}
	var N, ye;
	function be(e) {
		if (N === void 0) try {
			throw Error();
		} catch (e) {
			var t = e.stack.trim().match(/\n( *(at )?)/);
			N = t && t[1] || "", ye = -1 < e.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
		}
		return "\n" + N + e + ye;
	}
	var xe = !1;
	function Se(e, t) {
		if (!e || xe) return "";
		xe = !0;
		var n = Error.prepareStackTrace;
		Error.prepareStackTrace = void 0;
		try {
			var r = { DetermineComponentFrameRoot: function() {
				try {
					if (t) {
						var n = function() {
							throw Error();
						};
						if (Object.defineProperty(n.prototype, "props", { set: function() {
							throw Error();
						} }), typeof Reflect == "object" && Reflect.construct) {
							try {
								Reflect.construct(n, []);
							} catch (e) {
								var r = e;
							}
							Reflect.construct(e, [], n);
						} else {
							try {
								n.call();
							} catch (e) {
								r = e;
							}
							e.call(n.prototype);
						}
					} else {
						try {
							throw Error();
						} catch (e) {
							r = e;
						}
						(n = e()) && typeof n.catch == "function" && n.catch(function() {});
					}
				} catch (e) {
					if (e && r && typeof e.stack == "string") return [e.stack, r.stack];
				}
				return [null, null];
			} };
			r.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
			var i = Object.getOwnPropertyDescriptor(r.DetermineComponentFrameRoot, "name");
			i && i.configurable && Object.defineProperty(r.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
			var a = r.DetermineComponentFrameRoot(), o = a[0], s = a[1];
			if (o && s) {
				var c = o.split("\n"), l = s.split("\n");
				for (i = r = 0; r < c.length && !c[r].includes("DetermineComponentFrameRoot");) r++;
				for (; i < l.length && !l[i].includes("DetermineComponentFrameRoot");) i++;
				if (r === c.length || i === l.length) for (r = c.length - 1, i = l.length - 1; 1 <= r && 0 <= i && c[r] !== l[i];) i--;
				for (; 1 <= r && 0 <= i; r--, i--) if (c[r] !== l[i]) {
					if (r !== 1 || i !== 1) do
						if (r--, i--, 0 > i || c[r] !== l[i]) {
							var u = "\n" + c[r].replace(" at new ", " at ");
							return e.displayName && u.includes("<anonymous>") && (u = u.replace("<anonymous>", e.displayName)), u;
						}
					while (1 <= r && 0 <= i);
					break;
				}
			}
		} finally {
			xe = !1, Error.prepareStackTrace = n;
		}
		return (n = e ? e.displayName || e.name : "") ? be(n) : "";
	}
	function Ce(e, t) {
		switch (e.tag) {
			case 26:
			case 27:
			case 5: return be(e.type);
			case 16: return be("Lazy");
			case 13: return e.child !== t && t !== null ? be("Suspense Fallback") : be("Suspense");
			case 19: return be("SuspenseList");
			case 0:
			case 15: return Se(e.type, !1);
			case 11: return Se(e.type.render, !1);
			case 1: return Se(e.type, !0);
			case 31: return be("Activity");
			default: return "";
		}
	}
	function we(e) {
		try {
			var t = "", n = null;
			do
				t += Ce(e, n), n = e, e = e.return;
			while (e);
			return t;
		} catch (e) {
			return "\nError generating stack: " + e.message + "\n" + e.stack;
		}
	}
	var Te = Object.prototype.hasOwnProperty, Ee = t.unstable_scheduleCallback, De = t.unstable_cancelCallback, Oe = t.unstable_shouldYield, ke = t.unstable_requestPaint, Ae = t.unstable_now, je = t.unstable_getCurrentPriorityLevel, Me = t.unstable_ImmediatePriority, Ne = t.unstable_UserBlockingPriority, Pe = t.unstable_NormalPriority, Fe = t.unstable_LowPriority, Ie = t.unstable_IdlePriority, Le = t.log, Re = t.unstable_setDisableYieldValue, ze = null, Be = null;
	function Ve(e) {
		if (typeof Le == "function" && Re(e), Be && typeof Be.setStrictMode == "function") try {
			Be.setStrictMode(ze, e);
		} catch {}
	}
	var He = Math.clz32 ? Math.clz32 : Ge, Ue = Math.log, We = Math.LN2;
	function Ge(e) {
		return e >>>= 0, e === 0 ? 32 : 31 - (Ue(e) / We | 0) | 0;
	}
	var Ke = 256, qe = 262144, P = 4194304;
	function Je(e) {
		var t = e & 42;
		if (t !== 0) return t;
		switch (e & -e) {
			case 1: return 1;
			case 2: return 2;
			case 4: return 4;
			case 8: return 8;
			case 16: return 16;
			case 32: return 32;
			case 64: return 64;
			case 128: return 128;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072: return e & 261888;
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return e & 3932160;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return e & 62914560;
			case 67108864: return 67108864;
			case 134217728: return 134217728;
			case 268435456: return 268435456;
			case 536870912: return 536870912;
			case 1073741824: return 0;
			default: return e;
		}
	}
	function F(e, t, n) {
		var r = e.pendingLanes;
		if (r === 0) return 0;
		var i = 0, a = e.suspendedLanes, o = e.pingedLanes;
		e = e.warmLanes;
		var s = r & 134217727;
		return s === 0 ? (s = r & ~a, s === 0 ? o === 0 ? n || (n = r & ~e, n !== 0 && (i = Je(n))) : i = Je(o) : i = Je(s)) : (r = s & ~a, r === 0 ? (o &= s, o === 0 ? n || (n = s & ~e, n !== 0 && (i = Je(n))) : i = Je(o)) : i = Je(r)), i === 0 ? 0 : t !== 0 && t !== i && (t & a) === 0 && (a = i & -i, n = t & -t, a >= n || a === 32 && n & 4194048) ? t : i;
	}
	function Ye(e, t) {
		return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0;
	}
	function Xe(e, t) {
		switch (e) {
			case 1:
			case 2:
			case 4:
			case 8:
			case 64: return t + 250;
			case 16:
			case 32:
			case 128:
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152: return t + 5e3;
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432: return -1;
			case 67108864:
			case 134217728:
			case 268435456:
			case 536870912:
			case 1073741824: return -1;
			default: return -1;
		}
	}
	function Ze() {
		var e = P;
		return P <<= 1, !(P & 62914560) && (P = 4194304), e;
	}
	function Qe(e) {
		for (var t = [], n = 0; 31 > n; n++) t.push(e);
		return t;
	}
	function $e(e, t) {
		e.pendingLanes |= t, t !== 268435456 && (e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0);
	}
	function et(e, t, n, r, i, a) {
		var o = e.pendingLanes;
		e.pendingLanes = n, e.suspendedLanes = 0, e.pingedLanes = 0, e.warmLanes = 0, e.expiredLanes &= n, e.entangledLanes &= n, e.errorRecoveryDisabledLanes &= n, e.shellSuspendCounter = 0;
		var s = e.entanglements, c = e.expirationTimes, l = e.hiddenUpdates;
		for (n = o & ~n; 0 < n;) {
			var u = 31 - He(n), d = 1 << u;
			s[u] = 0, c[u] = -1;
			var f = l[u];
			if (f !== null) for (l[u] = null, u = 0; u < f.length; u++) {
				var p = f[u];
				p !== null && (p.lane &= -536870913);
			}
			n &= ~d;
		}
		r !== 0 && tt(e, r, 0), a !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= a & ~(o & ~t));
	}
	function tt(e, t, n) {
		e.pendingLanes |= t, e.suspendedLanes &= ~t;
		var r = 31 - He(t);
		e.entangledLanes |= t, e.entanglements[r] = e.entanglements[r] | 1073741824 | n & 261930;
	}
	function nt(e, t) {
		var n = e.entangledLanes |= t;
		for (e = e.entanglements; n;) {
			var r = 31 - He(n), i = 1 << r;
			i & t | e[r] & t && (e[r] |= t), n &= ~i;
		}
	}
	function rt(e, t) {
		var n = t & -t;
		return n = n & 42 ? 1 : it(n), (n & (e.suspendedLanes | t)) === 0 ? n : 0;
	}
	function it(e) {
		switch (e) {
			case 2:
				e = 1;
				break;
			case 8:
				e = 4;
				break;
			case 32:
				e = 16;
				break;
			case 256:
			case 512:
			case 1024:
			case 2048:
			case 4096:
			case 8192:
			case 16384:
			case 32768:
			case 65536:
			case 131072:
			case 262144:
			case 524288:
			case 1048576:
			case 2097152:
			case 4194304:
			case 8388608:
			case 16777216:
			case 33554432:
				e = 128;
				break;
			case 268435456:
				e = 134217728;
				break;
			default: e = 0;
		}
		return e;
	}
	function at(e) {
		return e &= -e, 2 < e ? 8 < e ? e & 134217727 ? 32 : 268435456 : 8 : 2;
	}
	function ot() {
		var e = j.p;
		return e === 0 ? (e = window.event, e === void 0 ? 32 : mp(e.type)) : e;
	}
	function st(e, t) {
		var n = j.p;
		try {
			return j.p = e, t();
		} finally {
			j.p = n;
		}
	}
	var ct = Math.random().toString(36).slice(2), lt = "__reactFiber$" + ct, I = "__reactProps$" + ct, ut = "__reactContainer$" + ct, dt = "__reactEvents$" + ct, ft = "__reactListeners$" + ct, pt = "__reactHandles$" + ct, mt = "__reactResources$" + ct, ht = "__reactMarker$" + ct;
	function gt(e) {
		delete e[lt], delete e[I], delete e[dt], delete e[ft], delete e[pt];
	}
	function _t(e) {
		var t = e[lt];
		if (t) return t;
		for (var n = e.parentNode; n;) {
			if (t = n[ut] || n[lt]) {
				if (n = t.alternate, t.child !== null || n !== null && n.child !== null) for (e = df(e); e !== null;) {
					if (n = e[lt]) return n;
					e = df(e);
				}
				return t;
			}
			e = n, n = e.parentNode;
		}
		return null;
	}
	function vt(e) {
		if (e = e[lt] || e[ut]) {
			var t = e.tag;
			if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3) return e;
		}
		return null;
	}
	function L(e) {
		var t = e.tag;
		if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
		throw Error(i(33));
	}
	function yt(e) {
		var t = e[mt];
		return t ||= e[mt] = {
			hoistableStyles: /* @__PURE__ */ new Map(),
			hoistableScripts: /* @__PURE__ */ new Map()
		}, t;
	}
	function bt(e) {
		e[ht] = !0;
	}
	var xt = /* @__PURE__ */ new Set(), St = {};
	function Ct(e, t) {
		wt(e, t), wt(e + "Capture", t);
	}
	function wt(e, t) {
		for (St[e] = t, e = 0; e < t.length; e++) xt.add(t[e]);
	}
	var Tt = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), Et = {}, Dt = {};
	function Ot(e) {
		return Te.call(Dt, e) ? !0 : Te.call(Et, e) ? !1 : Tt.test(e) ? Dt[e] = !0 : (Et[e] = !0, !1);
	}
	function kt(e, t, n) {
		if (Ot(t)) if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
					e.removeAttribute(t);
					return;
				case "boolean":
					var r = t.toLowerCase().slice(0, 5);
					if (r !== "data-" && r !== "aria-") {
						e.removeAttribute(t);
						return;
					}
			}
			e.setAttribute(t, "" + n);
		}
	}
	function At(e, t, n) {
		if (n === null) e.removeAttribute(t);
		else {
			switch (typeof n) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(t);
					return;
			}
			e.setAttribute(t, "" + n);
		}
	}
	function jt(e, t, n, r) {
		if (r === null) e.removeAttribute(n);
		else {
			switch (typeof r) {
				case "undefined":
				case "function":
				case "symbol":
				case "boolean":
					e.removeAttribute(n);
					return;
			}
			e.setAttributeNS(t, n, "" + r);
		}
	}
	function Mt(e) {
		switch (typeof e) {
			case "bigint":
			case "boolean":
			case "number":
			case "string":
			case "undefined": return e;
			case "object": return e;
			default: return "";
		}
	}
	function Nt(e) {
		var t = e.type;
		return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio");
	}
	function Pt(e, t, n) {
		var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
		if (!e.hasOwnProperty(t) && r !== void 0 && typeof r.get == "function" && typeof r.set == "function") {
			var i = r.get, a = r.set;
			return Object.defineProperty(e, t, {
				configurable: !0,
				get: function() {
					return i.call(this);
				},
				set: function(e) {
					n = "" + e, a.call(this, e);
				}
			}), Object.defineProperty(e, t, { enumerable: r.enumerable }), {
				getValue: function() {
					return n;
				},
				setValue: function(e) {
					n = "" + e;
				},
				stopTracking: function() {
					e._valueTracker = null, delete e[t];
				}
			};
		}
	}
	function Ft(e) {
		if (!e._valueTracker) {
			var t = Nt(e) ? "checked" : "value";
			e._valueTracker = Pt(e, t, "" + e[t]);
		}
	}
	function It(e) {
		if (!e) return !1;
		var t = e._valueTracker;
		if (!t) return !0;
		var n = t.getValue(), r = "";
		return e && (r = Nt(e) ? e.checked ? "true" : "false" : e.value), e = r, e === n ? !1 : (t.setValue(e), !0);
	}
	function Lt(e) {
		if (e ||= typeof document < "u" ? document : void 0, e === void 0) return null;
		try {
			return e.activeElement || e.body;
		} catch {
			return e.body;
		}
	}
	var Rt = /[\n"\\]/g;
	function zt(e) {
		return e.replace(Rt, function(e) {
			return "\\" + e.charCodeAt(0).toString(16) + " ";
		});
	}
	function Bt(e, t, n, r, i, a, o, s) {
		e.name = "", o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" ? e.type = o : e.removeAttribute("type"), t == null ? o !== "submit" && o !== "reset" || e.removeAttribute("value") : o === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + Mt(t)) : e.value !== "" + Mt(t) && (e.value = "" + Mt(t)), t == null ? n == null ? r != null && e.removeAttribute("value") : Ht(e, o, Mt(n)) : Ht(e, o, Mt(t)), i == null && a != null && (e.defaultChecked = !!a), i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"), s != null && typeof s != "function" && typeof s != "symbol" && typeof s != "boolean" ? e.name = "" + Mt(s) : e.removeAttribute("name");
	}
	function Vt(e, t, n, r, i, a, o, s) {
		if (a != null && typeof a != "function" && typeof a != "symbol" && typeof a != "boolean" && (e.type = a), t != null || n != null) {
			if (!(a !== "submit" && a !== "reset" || t != null)) {
				Ft(e);
				return;
			}
			n = n == null ? "" : "" + Mt(n), t = t == null ? n : "" + Mt(t), s || t === e.value || (e.value = t), e.defaultValue = t;
		}
		r ??= i, r = typeof r != "function" && typeof r != "symbol" && !!r, e.checked = s ? e.checked : !!r, e.defaultChecked = !!r, o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.name = o), Ft(e);
	}
	function Ht(e, t, n) {
		t === "number" && Lt(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n);
	}
	function Ut(e, t, n, r) {
		if (e = e.options, t) {
			t = {};
			for (var i = 0; i < n.length; i++) t["$" + n[i]] = !0;
			for (n = 0; n < e.length; n++) i = t.hasOwnProperty("$" + e[n].value), e[n].selected !== i && (e[n].selected = i), i && r && (e[n].defaultSelected = !0);
		} else {
			for (n = "" + Mt(n), t = null, i = 0; i < e.length; i++) {
				if (e[i].value === n) {
					e[i].selected = !0, r && (e[i].defaultSelected = !0);
					return;
				}
				t !== null || e[i].disabled || (t = e[i]);
			}
			t !== null && (t.selected = !0);
		}
	}
	function Wt(e, t, n) {
		if (t != null && (t = "" + Mt(t), t !== e.value && (e.value = t), n == null)) {
			e.defaultValue !== t && (e.defaultValue = t);
			return;
		}
		e.defaultValue = n == null ? "" : "" + Mt(n);
	}
	function Gt(e, t, n, r) {
		if (t == null) {
			if (r != null) {
				if (n != null) throw Error(i(92));
				if (ae(r)) {
					if (1 < r.length) throw Error(i(93));
					r = r[0];
				}
				n = r;
			}
			n ??= "", t = n;
		}
		n = Mt(t), e.defaultValue = n, r = e.textContent, r === n && r !== "" && r !== null && (e.value = r), Ft(e);
	}
	function R(e, t) {
		if (t) {
			var n = e.firstChild;
			if (n && n === e.lastChild && n.nodeType === 3) {
				n.nodeValue = t;
				return;
			}
		}
		e.textContent = t;
	}
	var Kt = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
	function qt(e, t, n) {
		var r = t.indexOf("--") === 0;
		n == null || typeof n == "boolean" || n === "" ? r ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : r ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Kt.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px";
	}
	function Jt(e, t, n) {
		if (t != null && typeof t != "object") throw Error(i(62));
		if (e = e.style, n != null) {
			for (var r in n) !n.hasOwnProperty(r) || t != null && t.hasOwnProperty(r) || (r.indexOf("--") === 0 ? e.setProperty(r, "") : r === "float" ? e.cssFloat = "" : e[r] = "");
			for (var a in t) r = t[a], t.hasOwnProperty(a) && n[a] !== r && qt(e, a, r);
		} else for (var o in t) t.hasOwnProperty(o) && qt(e, o, t[o]);
	}
	function Yt(e) {
		if (e.indexOf("-") === -1) return !1;
		switch (e) {
			case "annotation-xml":
			case "color-profile":
			case "font-face":
			case "font-face-src":
			case "font-face-uri":
			case "font-face-format":
			case "font-face-name":
			case "missing-glyph": return !1;
			default: return !0;
		}
	}
	var Xt = new Map([
		["acceptCharset", "accept-charset"],
		["htmlFor", "for"],
		["httpEquiv", "http-equiv"],
		["crossOrigin", "crossorigin"],
		["accentHeight", "accent-height"],
		["alignmentBaseline", "alignment-baseline"],
		["arabicForm", "arabic-form"],
		["baselineShift", "baseline-shift"],
		["capHeight", "cap-height"],
		["clipPath", "clip-path"],
		["clipRule", "clip-rule"],
		["colorInterpolation", "color-interpolation"],
		["colorInterpolationFilters", "color-interpolation-filters"],
		["colorProfile", "color-profile"],
		["colorRendering", "color-rendering"],
		["dominantBaseline", "dominant-baseline"],
		["enableBackground", "enable-background"],
		["fillOpacity", "fill-opacity"],
		["fillRule", "fill-rule"],
		["floodColor", "flood-color"],
		["floodOpacity", "flood-opacity"],
		["fontFamily", "font-family"],
		["fontSize", "font-size"],
		["fontSizeAdjust", "font-size-adjust"],
		["fontStretch", "font-stretch"],
		["fontStyle", "font-style"],
		["fontVariant", "font-variant"],
		["fontWeight", "font-weight"],
		["glyphName", "glyph-name"],
		["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
		["glyphOrientationVertical", "glyph-orientation-vertical"],
		["horizAdvX", "horiz-adv-x"],
		["horizOriginX", "horiz-origin-x"],
		["imageRendering", "image-rendering"],
		["letterSpacing", "letter-spacing"],
		["lightingColor", "lighting-color"],
		["markerEnd", "marker-end"],
		["markerMid", "marker-mid"],
		["markerStart", "marker-start"],
		["overlinePosition", "overline-position"],
		["overlineThickness", "overline-thickness"],
		["paintOrder", "paint-order"],
		["panose-1", "panose-1"],
		["pointerEvents", "pointer-events"],
		["renderingIntent", "rendering-intent"],
		["shapeRendering", "shape-rendering"],
		["stopColor", "stop-color"],
		["stopOpacity", "stop-opacity"],
		["strikethroughPosition", "strikethrough-position"],
		["strikethroughThickness", "strikethrough-thickness"],
		["strokeDasharray", "stroke-dasharray"],
		["strokeDashoffset", "stroke-dashoffset"],
		["strokeLinecap", "stroke-linecap"],
		["strokeLinejoin", "stroke-linejoin"],
		["strokeMiterlimit", "stroke-miterlimit"],
		["strokeOpacity", "stroke-opacity"],
		["strokeWidth", "stroke-width"],
		["textAnchor", "text-anchor"],
		["textDecoration", "text-decoration"],
		["textRendering", "text-rendering"],
		["transformOrigin", "transform-origin"],
		["underlinePosition", "underline-position"],
		["underlineThickness", "underline-thickness"],
		["unicodeBidi", "unicode-bidi"],
		["unicodeRange", "unicode-range"],
		["unitsPerEm", "units-per-em"],
		["vAlphabetic", "v-alphabetic"],
		["vHanging", "v-hanging"],
		["vIdeographic", "v-ideographic"],
		["vMathematical", "v-mathematical"],
		["vectorEffect", "vector-effect"],
		["vertAdvY", "vert-adv-y"],
		["vertOriginX", "vert-origin-x"],
		["vertOriginY", "vert-origin-y"],
		["wordSpacing", "word-spacing"],
		["writingMode", "writing-mode"],
		["xmlnsXlink", "xmlns:xlink"],
		["xHeight", "x-height"]
	]), Zt = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
	function Qt(e) {
		return Zt.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e;
	}
	function $t() {}
	var en = null;
	function tn(e) {
		return e = e.target || e.srcElement || window, e.correspondingUseElement && (e = e.correspondingUseElement), e.nodeType === 3 ? e.parentNode : e;
	}
	var nn = null, rn = null;
	function an(e) {
		var t = vt(e);
		if (t && (e = t.stateNode)) {
			var n = e[I] || null;
			a: switch (e = t.stateNode, t.type) {
				case "input":
					if (Bt(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name), t = n.name, n.type === "radio" && t != null) {
						for (n = e; n.parentNode;) n = n.parentNode;
						for (n = n.querySelectorAll("input[name=\"" + zt("" + t) + "\"][type=\"radio\"]"), t = 0; t < n.length; t++) {
							var r = n[t];
							if (r !== e && r.form === e.form) {
								var a = r[I] || null;
								if (!a) throw Error(i(90));
								Bt(r, a.value, a.defaultValue, a.defaultValue, a.checked, a.defaultChecked, a.type, a.name);
							}
						}
						for (t = 0; t < n.length; t++) r = n[t], r.form === e.form && It(r);
					}
					break a;
				case "textarea":
					Wt(e, n.value, n.defaultValue);
					break a;
				case "select": t = n.value, t != null && Ut(e, !!n.multiple, t, !1);
			}
		}
	}
	var on = !1;
	function sn(e, t, n) {
		if (on) return e(t, n);
		on = !0;
		try {
			return e(t);
		} finally {
			if (on = !1, (nn !== null || rn !== null) && (yu(), nn && (t = nn, e = rn, rn = nn = null, an(t), e))) for (t = 0; t < e.length; t++) an(e[t]);
		}
	}
	function cn(e, t) {
		var n = e.stateNode;
		if (n === null) return null;
		var r = n[I] || null;
		if (r === null) return null;
		n = r[t];
		a: switch (t) {
			case "onClick":
			case "onClickCapture":
			case "onDoubleClick":
			case "onDoubleClickCapture":
			case "onMouseDown":
			case "onMouseDownCapture":
			case "onMouseMove":
			case "onMouseMoveCapture":
			case "onMouseUp":
			case "onMouseUpCapture":
			case "onMouseEnter":
				(r = !r.disabled) || (e = e.type, r = !(e === "button" || e === "input" || e === "select" || e === "textarea")), e = !r;
				break a;
			default: e = !1;
		}
		if (e) return null;
		if (n && typeof n != "function") throw Error(i(231, t, typeof n));
		return n;
	}
	var ln = !(typeof window > "u" || window.document === void 0 || window.document.createElement === void 0), un = !1;
	if (ln) try {
		var dn = {};
		Object.defineProperty(dn, "passive", { get: function() {
			un = !0;
		} }), window.addEventListener("test", dn, dn), window.removeEventListener("test", dn, dn);
	} catch {
		un = !1;
	}
	var fn = null, pn = null, mn = null;
	function hn() {
		if (mn) return mn;
		var e, t = pn, n = t.length, r, i = "value" in fn ? fn.value : fn.textContent, a = i.length;
		for (e = 0; e < n && t[e] === i[e]; e++);
		var o = n - e;
		for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
		return mn = i.slice(e, 1 < r ? 1 - r : void 0);
	}
	function gn(e) {
		var t = e.keyCode;
		return "charCode" in e ? (e = e.charCode, e === 0 && t === 13 && (e = 13)) : e = t, e === 10 && (e = 13), 32 <= e || e === 13 ? e : 0;
	}
	function _n() {
		return !0;
	}
	function vn() {
		return !1;
	}
	function yn(e) {
		function t(t, n, r, i, a) {
			for (var o in this._reactName = t, this._targetInst = r, this.type = n, this.nativeEvent = i, this.target = a, this.currentTarget = null, e) e.hasOwnProperty(o) && (t = e[o], this[o] = t ? t(i) : i[o]);
			return this.isDefaultPrevented = (i.defaultPrevented == null ? !1 === i.returnValue : i.defaultPrevented) ? _n : vn, this.isPropagationStopped = vn, this;
		}
		return m(t.prototype, {
			preventDefault: function() {
				this.defaultPrevented = !0;
				var e = this.nativeEvent;
				e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = _n);
			},
			stopPropagation: function() {
				var e = this.nativeEvent;
				e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = _n);
			},
			persist: function() {},
			isPersistent: _n
		}), t;
	}
	var bn = {
		eventPhase: 0,
		bubbles: 0,
		cancelable: 0,
		timeStamp: function(e) {
			return e.timeStamp || Date.now();
		},
		defaultPrevented: 0,
		isTrusted: 0
	}, xn = yn(bn), Sn = m({}, bn, {
		view: 0,
		detail: 0
	}), Cn = yn(Sn), wn, Tn, En, Dn = m({}, Sn, {
		screenX: 0,
		screenY: 0,
		clientX: 0,
		clientY: 0,
		pageX: 0,
		pageY: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		getModifierState: Rn,
		button: 0,
		buttons: 0,
		relatedTarget: function(e) {
			return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget;
		},
		movementX: function(e) {
			return "movementX" in e ? e.movementX : (e !== En && (En && e.type === "mousemove" ? (wn = e.screenX - En.screenX, Tn = e.screenY - En.screenY) : Tn = wn = 0, En = e), wn);
		},
		movementY: function(e) {
			return "movementY" in e ? e.movementY : Tn;
		}
	}), On = yn(Dn), kn = yn(m({}, Dn, { dataTransfer: 0 })), An = yn(m({}, Sn, { relatedTarget: 0 })), jn = yn(m({}, bn, {
		animationName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Mn = yn(m({}, bn, { clipboardData: function(e) {
		return "clipboardData" in e ? e.clipboardData : window.clipboardData;
	} })), Nn = yn(m({}, bn, { data: 0 })), Pn = {
		Esc: "Escape",
		Spacebar: " ",
		Left: "ArrowLeft",
		Up: "ArrowUp",
		Right: "ArrowRight",
		Down: "ArrowDown",
		Del: "Delete",
		Win: "OS",
		Menu: "ContextMenu",
		Apps: "ContextMenu",
		Scroll: "ScrollLock",
		MozPrintableKey: "Unidentified"
	}, Fn = {
		8: "Backspace",
		9: "Tab",
		12: "Clear",
		13: "Enter",
		16: "Shift",
		17: "Control",
		18: "Alt",
		19: "Pause",
		20: "CapsLock",
		27: "Escape",
		32: " ",
		33: "PageUp",
		34: "PageDown",
		35: "End",
		36: "Home",
		37: "ArrowLeft",
		38: "ArrowUp",
		39: "ArrowRight",
		40: "ArrowDown",
		45: "Insert",
		46: "Delete",
		112: "F1",
		113: "F2",
		114: "F3",
		115: "F4",
		116: "F5",
		117: "F6",
		118: "F7",
		119: "F8",
		120: "F9",
		121: "F10",
		122: "F11",
		123: "F12",
		144: "NumLock",
		145: "ScrollLock",
		224: "Meta"
	}, In = {
		Alt: "altKey",
		Control: "ctrlKey",
		Meta: "metaKey",
		Shift: "shiftKey"
	};
	function Ln(e) {
		var t = this.nativeEvent;
		return t.getModifierState ? t.getModifierState(e) : (e = In[e]) ? !!t[e] : !1;
	}
	function Rn() {
		return Ln;
	}
	var zn = yn(m({}, Sn, {
		key: function(e) {
			if (e.key) {
				var t = Pn[e.key] || e.key;
				if (t !== "Unidentified") return t;
			}
			return e.type === "keypress" ? (e = gn(e), e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Fn[e.keyCode] || "Unidentified" : "";
		},
		code: 0,
		location: 0,
		ctrlKey: 0,
		shiftKey: 0,
		altKey: 0,
		metaKey: 0,
		repeat: 0,
		locale: 0,
		getModifierState: Rn,
		charCode: function(e) {
			return e.type === "keypress" ? gn(e) : 0;
		},
		keyCode: function(e) {
			return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		},
		which: function(e) {
			return e.type === "keypress" ? gn(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0;
		}
	})), Bn = yn(m({}, Dn, {
		pointerId: 0,
		width: 0,
		height: 0,
		pressure: 0,
		tangentialPressure: 0,
		tiltX: 0,
		tiltY: 0,
		twist: 0,
		pointerType: 0,
		isPrimary: 0
	})), Vn = yn(m({}, Sn, {
		touches: 0,
		targetTouches: 0,
		changedTouches: 0,
		altKey: 0,
		metaKey: 0,
		ctrlKey: 0,
		shiftKey: 0,
		getModifierState: Rn
	})), Hn = yn(m({}, bn, {
		propertyName: 0,
		elapsedTime: 0,
		pseudoElement: 0
	})), Un = yn(m({}, Dn, {
		deltaX: function(e) {
			return "deltaX" in e ? e.deltaX : "wheelDeltaX" in e ? -e.wheelDeltaX : 0;
		},
		deltaY: function(e) {
			return "deltaY" in e ? e.deltaY : "wheelDeltaY" in e ? -e.wheelDeltaY : "wheelDelta" in e ? -e.wheelDelta : 0;
		},
		deltaZ: 0,
		deltaMode: 0
	})), Wn = yn(m({}, bn, {
		newState: 0,
		oldState: 0
	})), Gn = [
		9,
		13,
		27,
		32
	], Kn = ln && "CompositionEvent" in window, qn = null;
	ln && "documentMode" in document && (qn = document.documentMode);
	var Jn = ln && "TextEvent" in window && !qn, Yn = ln && (!Kn || qn && 8 < qn && 11 >= qn), Xn = " ", Zn = !1;
	function Qn(e, t) {
		switch (e) {
			case "keyup": return Gn.indexOf(t.keyCode) !== -1;
			case "keydown": return t.keyCode !== 229;
			case "keypress":
			case "mousedown":
			case "focusout": return !0;
			default: return !1;
		}
	}
	function $n(e) {
		return e = e.detail, typeof e == "object" && "data" in e ? e.data : null;
	}
	var er = !1;
	function tr(e, t) {
		switch (e) {
			case "compositionend": return $n(t);
			case "keypress": return t.which === 32 ? (Zn = !0, Xn) : null;
			case "textInput": return e = t.data, e === Xn && Zn ? null : e;
			default: return null;
		}
	}
	function nr(e, t) {
		if (er) return e === "compositionend" || !Kn && Qn(e, t) ? (e = hn(), mn = pn = fn = null, er = !1, e) : null;
		switch (e) {
			case "paste": return null;
			case "keypress":
				if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
					if (t.char && 1 < t.char.length) return t.char;
					if (t.which) return String.fromCharCode(t.which);
				}
				return null;
			case "compositionend": return Yn && t.locale !== "ko" ? null : t.data;
			default: return null;
		}
	}
	var rr = {
		color: !0,
		date: !0,
		datetime: !0,
		"datetime-local": !0,
		email: !0,
		month: !0,
		number: !0,
		password: !0,
		range: !0,
		search: !0,
		tel: !0,
		text: !0,
		time: !0,
		url: !0,
		week: !0
	};
	function ir(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t === "input" ? !!rr[e.type] : t === "textarea";
	}
	function ar(e, t, n, r) {
		nn ? rn ? rn.push(r) : rn = [r] : nn = r, t = Td(t, "onChange"), 0 < t.length && (n = new xn("onChange", "change", null, n, r), e.push({
			event: n,
			listeners: t
		}));
	}
	var or = null, sr = null;
	function z(e) {
		vd(e, 0);
	}
	function cr(e) {
		if (It(L(e))) return e;
	}
	function lr(e, t) {
		if (e === "change") return t;
	}
	var ur = !1;
	if (ln) {
		var dr;
		if (ln) {
			var fr = "oninput" in document;
			if (!fr) {
				var pr = document.createElement("div");
				pr.setAttribute("oninput", "return;"), fr = typeof pr.oninput == "function";
			}
			dr = fr;
		} else dr = !1;
		ur = dr && (!document.documentMode || 9 < document.documentMode);
	}
	function mr() {
		or && (or.detachEvent("onpropertychange", hr), sr = or = null);
	}
	function hr(e) {
		if (e.propertyName === "value" && cr(sr)) {
			var t = [];
			ar(t, sr, e, tn(e)), sn(z, t);
		}
	}
	function gr(e, t, n) {
		e === "focusin" ? (mr(), or = t, sr = n, or.attachEvent("onpropertychange", hr)) : e === "focusout" && mr();
	}
	function _r(e) {
		if (e === "selectionchange" || e === "keyup" || e === "keydown") return cr(sr);
	}
	function vr(e, t) {
		if (e === "click") return cr(t);
	}
	function B(e, t) {
		if (e === "input" || e === "change") return cr(t);
	}
	function yr(e, t) {
		return e === t && (e !== 0 || 1 / e == 1 / t) || e !== e && t !== t;
	}
	var br = typeof Object.is == "function" ? Object.is : yr;
	function xr(e, t) {
		if (br(e, t)) return !0;
		if (typeof e != "object" || !e || typeof t != "object" || !t) return !1;
		var n = Object.keys(e), r = Object.keys(t);
		if (n.length !== r.length) return !1;
		for (r = 0; r < n.length; r++) {
			var i = n[r];
			if (!Te.call(t, i) || !br(e[i], t[i])) return !1;
		}
		return !0;
	}
	function Sr(e) {
		for (; e && e.firstChild;) e = e.firstChild;
		return e;
	}
	function Cr(e, t) {
		var n = Sr(e);
		e = 0;
		for (var r; n;) {
			if (n.nodeType === 3) {
				if (r = e + n.textContent.length, e <= t && r >= t) return {
					node: n,
					offset: t - e
				};
				e = r;
			}
			a: {
				for (; n;) {
					if (n.nextSibling) {
						n = n.nextSibling;
						break a;
					}
					n = n.parentNode;
				}
				n = void 0;
			}
			n = Sr(n);
		}
	}
	function wr(e, t) {
		return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? wr(e, t.parentNode) : "contains" in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1;
	}
	function Tr(e) {
		e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
		for (var t = Lt(e.document); t instanceof e.HTMLIFrameElement;) {
			try {
				var n = typeof t.contentWindow.location.href == "string";
			} catch {
				n = !1;
			}
			if (n) e = t.contentWindow;
			else break;
			t = Lt(e.document);
		}
		return t;
	}
	function Er(e) {
		var t = e && e.nodeName && e.nodeName.toLowerCase();
		return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true");
	}
	var Dr = ln && "documentMode" in document && 11 >= document.documentMode, Or = null, kr = null, Ar = null, jr = !1;
	function Mr(e, t, n) {
		var r = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
		jr || Or == null || Or !== Lt(r) || (r = Or, "selectionStart" in r && Er(r) ? r = {
			start: r.selectionStart,
			end: r.selectionEnd
		} : (r = (r.ownerDocument && r.ownerDocument.defaultView || window).getSelection(), r = {
			anchorNode: r.anchorNode,
			anchorOffset: r.anchorOffset,
			focusNode: r.focusNode,
			focusOffset: r.focusOffset
		}), Ar && xr(Ar, r) || (Ar = r, r = Td(kr, "onSelect"), 0 < r.length && (t = new xn("onSelect", "select", null, t, n), e.push({
			event: t,
			listeners: r
		}), t.target = Or)));
	}
	function Nr(e, t) {
		var n = {};
		return n[e.toLowerCase()] = t.toLowerCase(), n["Webkit" + e] = "webkit" + t, n["Moz" + e] = "moz" + t, n;
	}
	var Pr = {
		animationend: Nr("Animation", "AnimationEnd"),
		animationiteration: Nr("Animation", "AnimationIteration"),
		animationstart: Nr("Animation", "AnimationStart"),
		transitionrun: Nr("Transition", "TransitionRun"),
		transitionstart: Nr("Transition", "TransitionStart"),
		transitioncancel: Nr("Transition", "TransitionCancel"),
		transitionend: Nr("Transition", "TransitionEnd")
	}, Fr = {}, Ir = {};
	ln && (Ir = document.createElement("div").style, "AnimationEvent" in window || (delete Pr.animationend.animation, delete Pr.animationiteration.animation, delete Pr.animationstart.animation), "TransitionEvent" in window || delete Pr.transitionend.transition);
	function Lr(e) {
		if (Fr[e]) return Fr[e];
		if (!Pr[e]) return e;
		var t = Pr[e], n;
		for (n in t) if (t.hasOwnProperty(n) && n in Ir) return Fr[e] = t[n];
		return e;
	}
	var Rr = Lr("animationend"), zr = Lr("animationiteration"), Br = Lr("animationstart"), Vr = Lr("transitionrun"), Hr = Lr("transitionstart"), Ur = Lr("transitioncancel"), Wr = Lr("transitionend"), Gr = /* @__PURE__ */ new Map(), Kr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
	Kr.push("scrollEnd");
	function qr(e, t) {
		Gr.set(e, t), Ct(t, [e]);
	}
	var Jr = typeof reportError == "function" ? reportError : function(e) {
		if (typeof window == "object" && typeof window.ErrorEvent == "function") {
			var t = new window.ErrorEvent("error", {
				bubbles: !0,
				cancelable: !0,
				message: typeof e == "object" && e && typeof e.message == "string" ? String(e.message) : String(e),
				error: e
			});
			if (!window.dispatchEvent(t)) return;
		} else if (typeof { env: { NODE_ENV: "production" } }.emit == "function") {
			({ env: { NODE_ENV: "production" } }).emit("uncaughtException", e);
			return;
		}
		console.error(e);
	}, Yr = [], Xr = 0, Zr = 0;
	function Qr() {
		for (var e = Xr, t = Zr = Xr = 0; t < e;) {
			var n = Yr[t];
			Yr[t++] = null;
			var r = Yr[t];
			Yr[t++] = null;
			var i = Yr[t];
			Yr[t++] = null;
			var a = Yr[t];
			if (Yr[t++] = null, r !== null && i !== null) {
				var o = r.pending;
				o === null ? i.next = i : (i.next = o.next, o.next = i), r.pending = i;
			}
			a !== 0 && ni(n, i, a);
		}
	}
	function $r(e, t, n, r) {
		Yr[Xr++] = e, Yr[Xr++] = t, Yr[Xr++] = n, Yr[Xr++] = r, Zr |= r, e.lanes |= r, e = e.alternate, e !== null && (e.lanes |= r);
	}
	function ei(e, t, n, r) {
		return $r(e, t, n, r), ri(e);
	}
	function ti(e, t) {
		return $r(e, null, null, t), ri(e);
	}
	function ni(e, t, n) {
		e.lanes |= n;
		var r = e.alternate;
		r !== null && (r.lanes |= n);
		for (var i = !1, a = e.return; a !== null;) a.childLanes |= n, r = a.alternate, r !== null && (r.childLanes |= n), a.tag === 22 && (e = a.stateNode, e === null || e._visibility & 1 || (i = !0)), e = a, a = a.return;
		return e.tag === 3 ? (a = e.stateNode, i && t !== null && (i = 31 - He(n), e = a.hiddenUpdates, r = e[i], r === null ? e[i] = [t] : r.push(t), t.lane = n | 536870912), a) : null;
	}
	function ri(e) {
		if (50 < uu) throw uu = 0, du = null, Error(i(185));
		for (var t = e.return; t !== null;) e = t, t = e.return;
		return e.tag === 3 ? e.stateNode : null;
	}
	var ii = {};
	function ai(e, t, n, r) {
		this.tag = e, this.key = n, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = t, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = r, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
	}
	function oi(e, t, n, r) {
		return new ai(e, t, n, r);
	}
	function si(e) {
		return e = e.prototype, !(!e || !e.isReactComponent);
	}
	function ci(e, t) {
		var n = e.alternate;
		return n === null ? (n = oi(e.tag, t, e.key, e.mode), n.elementType = e.elementType, n.type = e.type, n.stateNode = e.stateNode, n.alternate = e, e.alternate = n) : (n.pendingProps = t, n.type = e.type, n.flags = 0, n.subtreeFlags = 0, n.deletions = null), n.flags = e.flags & 65011712, n.childLanes = e.childLanes, n.lanes = e.lanes, n.child = e.child, n.memoizedProps = e.memoizedProps, n.memoizedState = e.memoizedState, n.updateQueue = e.updateQueue, t = e.dependencies, n.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}, n.sibling = e.sibling, n.index = e.index, n.ref = e.ref, n.refCleanup = e.refCleanup, n;
	}
	function li(e, t) {
		e.flags &= 65011714;
		var n = e.alternate;
		return n === null ? (e.childLanes = 0, e.lanes = t, e.child = null, e.subtreeFlags = 0, e.memoizedProps = null, e.memoizedState = null, e.updateQueue = null, e.dependencies = null, e.stateNode = null) : (e.childLanes = n.childLanes, e.lanes = n.lanes, e.child = n.child, e.subtreeFlags = 0, e.deletions = null, e.memoizedProps = n.memoizedProps, e.memoizedState = n.memoizedState, e.updateQueue = n.updateQueue, e.type = n.type, t = n.dependencies, e.dependencies = t === null ? null : {
			lanes: t.lanes,
			firstContext: t.firstContext
		}), e;
	}
	function ui(e, t, n, r, a, o) {
		var s = 0;
		if (r = e, typeof e == "function") si(e) && (s = 1);
		else if (typeof e == "string") s = Uf(e, n, de.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
		else a: switch (e) {
			case k: return e = oi(31, n, t, a), e.elementType = k, e.lanes = o, e;
			case y: return di(n.children, a, o, t);
			case b:
				s = 8, a |= 24;
				break;
			case x: return e = oi(12, n, t, a | 2), e.elementType = x, e.lanes = o, e;
			case T: return e = oi(13, n, t, a), e.elementType = T, e.lanes = o, e;
			case E: return e = oi(19, n, t, a), e.elementType = E, e.lanes = o, e;
			default:
				if (typeof e == "object" && e) switch (e.$$typeof) {
					case C:
						s = 10;
						break a;
					case S:
						s = 9;
						break a;
					case w:
						s = 11;
						break a;
					case D:
						s = 14;
						break a;
					case O:
						s = 16, r = null;
						break a;
				}
				s = 29, n = Error(i(130, e === null ? "null" : typeof e, "")), r = null;
		}
		return t = oi(s, n, t, a), t.elementType = e, t.type = r, t.lanes = o, t;
	}
	function di(e, t, n, r) {
		return e = oi(7, e, r, t), e.lanes = n, e;
	}
	function fi(e, t, n) {
		return e = oi(6, e, null, t), e.lanes = n, e;
	}
	function pi(e) {
		var t = oi(18, null, null, 0);
		return t.stateNode = e, t;
	}
	function mi(e, t, n) {
		return t = oi(4, e.children === null ? [] : e.children, e.key, t), t.lanes = n, t.stateNode = {
			containerInfo: e.containerInfo,
			pendingChildren: null,
			implementation: e.implementation
		}, t;
	}
	var hi = /* @__PURE__ */ new WeakMap();
	function gi(e, t) {
		if (typeof e == "object" && e) {
			var n = hi.get(e);
			return n === void 0 ? (t = {
				value: e,
				source: t,
				stack: we(t)
			}, hi.set(e, t), t) : n;
		}
		return {
			value: e,
			source: t,
			stack: we(t)
		};
	}
	var _i = [], vi = 0, yi = null, bi = 0, xi = [], Si = 0, Ci = null, wi = 1, Ti = "";
	function Ei(e, t) {
		_i[vi++] = bi, _i[vi++] = yi, yi = e, bi = t;
	}
	function Di(e, t, n) {
		xi[Si++] = wi, xi[Si++] = Ti, xi[Si++] = Ci, Ci = e;
		var r = wi;
		e = Ti;
		var i = 32 - He(r) - 1;
		r &= ~(1 << i), n += 1;
		var a = 32 - He(t) + i;
		if (30 < a) {
			var o = i - i % 5;
			a = (r & (1 << o) - 1).toString(32), r >>= o, i -= o, wi = 1 << 32 - He(t) + i | n << i | r, Ti = a + e;
		} else wi = 1 << a | n << i | r, Ti = e;
	}
	function Oi(e) {
		e.return !== null && (Ei(e, 1), Di(e, 1, 0));
	}
	function ki(e) {
		for (; e === yi;) yi = _i[--vi], _i[vi] = null, bi = _i[--vi], _i[vi] = null;
		for (; e === Ci;) Ci = xi[--Si], xi[Si] = null, Ti = xi[--Si], xi[Si] = null, wi = xi[--Si], xi[Si] = null;
	}
	function Ai(e, t) {
		xi[Si++] = wi, xi[Si++] = Ti, xi[Si++] = Ci, wi = t.id, Ti = t.overflow, Ci = e;
	}
	var ji = null, V = null, H = !1, Mi = null, Ni = !1, Pi = Error(i(519));
	function Fi(e) {
		throw Vi(gi(Error(i(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", "")), e)), Pi;
	}
	function Ii(e) {
		var t = e.stateNode, n = e.type, r = e.memoizedProps;
		switch (t[lt] = e, t[I] = r, n) {
			case "dialog":
				$("cancel", t), $("close", t);
				break;
			case "iframe":
			case "object":
			case "embed":
				$("load", t);
				break;
			case "video":
			case "audio":
				for (n = 0; n < gd.length; n++) $(gd[n], t);
				break;
			case "source":
				$("error", t);
				break;
			case "img":
			case "image":
			case "link":
				$("error", t), $("load", t);
				break;
			case "details":
				$("toggle", t);
				break;
			case "input":
				$("invalid", t), Vt(t, r.value, r.defaultValue, r.checked, r.defaultChecked, r.type, r.name, !0);
				break;
			case "select":
				$("invalid", t);
				break;
			case "textarea": $("invalid", t), Gt(t, r.value, r.defaultValue, r.children);
		}
		n = r.children, typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || !0 === r.suppressHydrationWarning || jd(t.textContent, n) ? (r.popover != null && ($("beforetoggle", t), $("toggle", t)), r.onScroll != null && $("scroll", t), r.onScrollEnd != null && $("scrollend", t), r.onClick != null && (t.onclick = $t), t = !0) : t = !1, t || Fi(e, !0);
	}
	function Li(e) {
		for (ji = e.return; ji;) switch (ji.tag) {
			case 5:
			case 31:
			case 13:
				Ni = !1;
				return;
			case 27:
			case 3:
				Ni = !0;
				return;
			default: ji = ji.return;
		}
	}
	function Ri(e) {
		if (e !== ji) return !1;
		if (!H) return Li(e), H = !0, !1;
		var t = e.tag, n;
		if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type, n = !(n !== "form" && n !== "button") || Ud(e.type, e.memoizedProps)), n = !n), n && V && Fi(e), Li(e), t === 13) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			V = uf(e);
		} else if (t === 31) {
			if (e = e.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(317));
			V = uf(e);
		} else t === 27 ? (t = V, Zd(e.type) ? (e = lf, lf = null, V = e) : V = t) : V = ji ? cf(e.stateNode.nextSibling) : null;
		return !0;
	}
	function zi() {
		V = ji = null, H = !1;
	}
	function Bi() {
		var e = Mi;
		return e !== null && (Xl === null ? Xl = e : Xl.push.apply(Xl, e), Mi = null), e;
	}
	function Vi(e) {
		Mi === null ? Mi = [e] : Mi.push(e);
	}
	var Hi = le(null), Ui = null, Wi = null;
	function Gi(e, t, n) {
		M(Hi, t._currentValue), t._currentValue = n;
	}
	function Ki(e) {
		e._currentValue = Hi.current, ue(Hi);
	}
	function qi(e, t, n) {
		for (; e !== null;) {
			var r = e.alternate;
			if ((e.childLanes & t) === t ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t) : (e.childLanes |= t, r !== null && (r.childLanes |= t)), e === n) break;
			e = e.return;
		}
	}
	function Ji(e, t, n, r) {
		var a = e.child;
		for (a !== null && (a.return = e); a !== null;) {
			var o = a.dependencies;
			if (o !== null) {
				var s = a.child;
				o = o.firstContext;
				a: for (; o !== null;) {
					var c = o;
					o = a;
					for (var l = 0; l < t.length; l++) if (c.context === t[l]) {
						o.lanes |= n, c = o.alternate, c !== null && (c.lanes |= n), qi(o.return, n, e), r || (s = null);
						break a;
					}
					o = c.next;
				}
			} else if (a.tag === 18) {
				if (s = a.return, s === null) throw Error(i(341));
				s.lanes |= n, o = s.alternate, o !== null && (o.lanes |= n), qi(s, n, e), s = null;
			} else s = a.child;
			if (s !== null) s.return = a;
			else for (s = a; s !== null;) {
				if (s === e) {
					s = null;
					break;
				}
				if (a = s.sibling, a !== null) {
					a.return = s.return, s = a;
					break;
				}
				s = s.return;
			}
			a = s;
		}
	}
	function Yi(e, t, n, r) {
		e = null;
		for (var a = t, o = !1; a !== null;) {
			if (!o) {
				if (a.flags & 524288) o = !0;
				else if (a.flags & 262144) break;
			}
			if (a.tag === 10) {
				var s = a.alternate;
				if (s === null) throw Error(i(387));
				if (s = s.memoizedProps, s !== null) {
					var c = a.type;
					br(a.pendingProps.value, s.value) || (e === null ? e = [c] : e.push(c));
				}
			} else if (a === me.current) {
				if (s = a.alternate, s === null) throw Error(i(387));
				s.memoizedState.memoizedState !== a.memoizedState.memoizedState && (e === null ? e = [Qf] : e.push(Qf));
			}
			a = a.return;
		}
		e !== null && Ji(t, e, n, r), t.flags |= 262144;
	}
	function U(e) {
		for (e = e.firstContext; e !== null;) {
			if (!br(e.context._currentValue, e.memoizedValue)) return !0;
			e = e.next;
		}
		return !1;
	}
	function Xi(e) {
		Ui = e, Wi = null, e = e.dependencies, e !== null && (e.firstContext = null);
	}
	function Zi(e) {
		return $i(Ui, e);
	}
	function Qi(e, t) {
		return Ui === null && Xi(e), $i(e, t);
	}
	function $i(e, t) {
		var n = t._currentValue;
		if (t = {
			context: t,
			memoizedValue: n,
			next: null
		}, Wi === null) {
			if (e === null) throw Error(i(308));
			Wi = t, e.dependencies = {
				lanes: 0,
				firstContext: t
			}, e.flags |= 524288;
		} else Wi = Wi.next = t;
		return n;
	}
	var ea = typeof AbortController < "u" ? AbortController : function() {
		var e = [], t = this.signal = {
			aborted: !1,
			addEventListener: function(t, n) {
				e.push(n);
			}
		};
		this.abort = function() {
			t.aborted = !0, e.forEach(function(e) {
				return e();
			});
		};
	}, ta = t.unstable_scheduleCallback, na = t.unstable_NormalPriority, W = {
		$$typeof: C,
		Consumer: null,
		Provider: null,
		_currentValue: null,
		_currentValue2: null,
		_threadCount: 0
	};
	function ra() {
		return {
			controller: new ea(),
			data: /* @__PURE__ */ new Map(),
			refCount: 0
		};
	}
	function ia(e) {
		e.refCount--, e.refCount === 0 && ta(na, function() {
			e.controller.abort();
		});
	}
	var aa = null, oa = 0, sa = 0, ca = null;
	function la(e, t) {
		if (aa === null) {
			var n = aa = [];
			oa = 0, sa = ud(), ca = {
				status: "pending",
				value: void 0,
				then: function(e) {
					n.push(e);
				}
			};
		}
		return oa++, t.then(ua, ua), t;
	}
	function ua() {
		if (--oa === 0 && aa !== null) {
			ca !== null && (ca.status = "fulfilled");
			var e = aa;
			aa = null, sa = 0, ca = null;
			for (var t = 0; t < e.length; t++) (0, e[t])();
		}
	}
	function da(e, t) {
		var n = [], r = {
			status: "pending",
			value: null,
			reason: null,
			then: function(e) {
				n.push(e);
			}
		};
		return e.then(function() {
			r.status = "fulfilled", r.value = t;
			for (var e = 0; e < n.length; e++) (0, n[e])(t);
		}, function(e) {
			for (r.status = "rejected", r.reason = e, e = 0; e < n.length; e++) (0, n[e])(void 0);
		}), r;
	}
	var fa = A.S;
	A.S = function(e, t) {
		$l = Ae(), typeof t == "object" && t && typeof t.then == "function" && la(e, t), fa !== null && fa(e, t);
	};
	var pa = le(null);
	function ma() {
		var e = pa.current;
		return e === null ? Ll.pooledCache : e;
	}
	function ha(e, t) {
		t === null ? M(pa, pa.current) : M(pa, t.pool);
	}
	function ga() {
		var e = ma();
		return e === null ? null : {
			parent: W._currentValue,
			pool: e
		};
	}
	var _a = Error(i(460)), va = Error(i(474)), ya = Error(i(542)), ba = { then: function() {} };
	function xa(e) {
		return e = e.status, e === "fulfilled" || e === "rejected";
	}
	function Sa(e, t, n) {
		switch (n = e[n], n === void 0 ? e.push(t) : n !== t && (t.then($t, $t), t = n), t.status) {
			case "fulfilled": return t.value;
			case "rejected": throw e = t.reason, Ea(e), e;
			default:
				if (typeof t.status == "string") t.then($t, $t);
				else {
					if (e = Ll, e !== null && 100 < e.shellSuspendCounter) throw Error(i(482));
					e = t, e.status = "pending", e.then(function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "fulfilled", n.value = e;
						}
					}, function(e) {
						if (t.status === "pending") {
							var n = t;
							n.status = "rejected", n.reason = e;
						}
					});
				}
				switch (t.status) {
					case "fulfilled": return t.value;
					case "rejected": throw e = t.reason, Ea(e), e;
				}
				throw wa = t, _a;
		}
	}
	function Ca(e) {
		try {
			var t = e._init;
			return t(e._payload);
		} catch (e) {
			throw typeof e == "object" && e && typeof e.then == "function" ? (wa = e, _a) : e;
		}
	}
	var wa = null;
	function Ta() {
		if (wa === null) throw Error(i(459));
		var e = wa;
		return wa = null, e;
	}
	function Ea(e) {
		if (e === _a || e === ya) throw Error(i(483));
	}
	var Da = null, Oa = 0;
	function ka(e) {
		var t = Oa;
		return Oa += 1, Da === null && (Da = []), Sa(Da, e, t);
	}
	function Aa(e, t) {
		t = t.props.ref, e.ref = t === void 0 ? null : t;
	}
	function ja(e, t) {
		throw t.$$typeof === g ? Error(i(525)) : (e = Object.prototype.toString.call(t), Error(i(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)));
	}
	function Ma(e) {
		function t(t, n) {
			if (e) {
				var r = t.deletions;
				r === null ? (t.deletions = [n], t.flags |= 16) : r.push(n);
			}
		}
		function n(n, r) {
			if (!e) return null;
			for (; r !== null;) t(n, r), r = r.sibling;
			return null;
		}
		function r(e) {
			for (var t = /* @__PURE__ */ new Map(); e !== null;) e.key === null ? t.set(e.index, e) : t.set(e.key, e), e = e.sibling;
			return t;
		}
		function a(e, t) {
			return e = ci(e, t), e.index = 0, e.sibling = null, e;
		}
		function o(t, n, r) {
			return t.index = r, e ? (r = t.alternate, r === null ? (t.flags |= 67108866, n) : (r = r.index, r < n ? (t.flags |= 67108866, n) : r)) : (t.flags |= 1048576, n);
		}
		function s(t) {
			return e && t.alternate === null && (t.flags |= 67108866), t;
		}
		function c(e, t, n, r) {
			return t === null || t.tag !== 6 ? (t = fi(n, e.mode, r), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function l(e, t, n, r) {
			var i = n.type;
			return i === y ? d(e, t, n.props.children, r, n.key) : t !== null && (t.elementType === i || typeof i == "object" && i && i.$$typeof === O && Ca(i) === t.type) ? (t = a(t, n.props), Aa(t, n), t.return = e, t) : (t = ui(n.type, n.key, n.props, null, e.mode, r), Aa(t, n), t.return = e, t);
		}
		function u(e, t, n, r) {
			return t === null || t.tag !== 4 || t.stateNode.containerInfo !== n.containerInfo || t.stateNode.implementation !== n.implementation ? (t = mi(n, e.mode, r), t.return = e, t) : (t = a(t, n.children || []), t.return = e, t);
		}
		function d(e, t, n, r, i) {
			return t === null || t.tag !== 7 ? (t = di(n, e.mode, r, i), t.return = e, t) : (t = a(t, n), t.return = e, t);
		}
		function f(e, t, n) {
			if (typeof t == "string" && t !== "" || typeof t == "number" || typeof t == "bigint") return t = fi("" + t, e.mode, n), t.return = e, t;
			if (typeof t == "object" && t) {
				switch (t.$$typeof) {
					case _: return n = ui(t.type, t.key, t.props, null, e.mode, n), Aa(n, t), n.return = e, n;
					case v: return t = mi(t, e.mode, n), t.return = e, t;
					case O: return t = Ca(t), f(e, t, n);
				}
				if (ae(t) || ne(t)) return t = di(t, e.mode, n, null), t.return = e, t;
				if (typeof t.then == "function") return f(e, ka(t), n);
				if (t.$$typeof === C) return f(e, Qi(e, t), n);
				ja(e, t);
			}
			return null;
		}
		function p(e, t, n, r) {
			var i = t === null ? null : t.key;
			if (typeof n == "string" && n !== "" || typeof n == "number" || typeof n == "bigint") return i === null ? c(e, t, "" + n, r) : null;
			if (typeof n == "object" && n) {
				switch (n.$$typeof) {
					case _: return n.key === i ? l(e, t, n, r) : null;
					case v: return n.key === i ? u(e, t, n, r) : null;
					case O: return n = Ca(n), p(e, t, n, r);
				}
				if (ae(n) || ne(n)) return i === null ? d(e, t, n, r, null) : null;
				if (typeof n.then == "function") return p(e, t, ka(n), r);
				if (n.$$typeof === C) return p(e, t, Qi(e, n), r);
				ja(e, n);
			}
			return null;
		}
		function m(e, t, n, r, i) {
			if (typeof r == "string" && r !== "" || typeof r == "number" || typeof r == "bigint") return e = e.get(n) || null, c(t, e, "" + r, i);
			if (typeof r == "object" && r) {
				switch (r.$$typeof) {
					case _: return e = e.get(r.key === null ? n : r.key) || null, l(t, e, r, i);
					case v: return e = e.get(r.key === null ? n : r.key) || null, u(t, e, r, i);
					case O: return r = Ca(r), m(e, t, n, r, i);
				}
				if (ae(r) || ne(r)) return e = e.get(n) || null, d(t, e, r, i, null);
				if (typeof r.then == "function") return m(e, t, n, ka(r), i);
				if (r.$$typeof === C) return m(e, t, n, Qi(t, r), i);
				ja(t, r);
			}
			return null;
		}
		function h(i, a, s, c) {
			for (var l = null, u = null, d = a, h = a = 0, g = null; d !== null && h < s.length; h++) {
				d.index > h ? (g = d, d = null) : g = d.sibling;
				var _ = p(i, d, s[h], c);
				if (_ === null) {
					d === null && (d = g);
					break;
				}
				e && d && _.alternate === null && t(i, d), a = o(_, a, h), u === null ? l = _ : u.sibling = _, u = _, d = g;
			}
			if (h === s.length) return n(i, d), H && Ei(i, h), l;
			if (d === null) {
				for (; h < s.length; h++) d = f(i, s[h], c), d !== null && (a = o(d, a, h), u === null ? l = d : u.sibling = d, u = d);
				return H && Ei(i, h), l;
			}
			for (d = r(d); h < s.length; h++) g = m(d, i, h, s[h], c), g !== null && (e && g.alternate !== null && d.delete(g.key === null ? h : g.key), a = o(g, a, h), u === null ? l = g : u.sibling = g, u = g);
			return e && d.forEach(function(e) {
				return t(i, e);
			}), H && Ei(i, h), l;
		}
		function g(a, s, c, l) {
			if (c == null) throw Error(i(151));
			for (var u = null, d = null, h = s, g = s = 0, _ = null, v = c.next(); h !== null && !v.done; g++, v = c.next()) {
				h.index > g ? (_ = h, h = null) : _ = h.sibling;
				var y = p(a, h, v.value, l);
				if (y === null) {
					h === null && (h = _);
					break;
				}
				e && h && y.alternate === null && t(a, h), s = o(y, s, g), d === null ? u = y : d.sibling = y, d = y, h = _;
			}
			if (v.done) return n(a, h), H && Ei(a, g), u;
			if (h === null) {
				for (; !v.done; g++, v = c.next()) v = f(a, v.value, l), v !== null && (s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
				return H && Ei(a, g), u;
			}
			for (h = r(h); !v.done; g++, v = c.next()) v = m(h, a, g, v.value, l), v !== null && (e && v.alternate !== null && h.delete(v.key === null ? g : v.key), s = o(v, s, g), d === null ? u = v : d.sibling = v, d = v);
			return e && h.forEach(function(e) {
				return t(a, e);
			}), H && Ei(a, g), u;
		}
		function b(e, r, o, c) {
			if (typeof o == "object" && o && o.type === y && o.key === null && (o = o.props.children), typeof o == "object" && o) {
				switch (o.$$typeof) {
					case _:
						a: {
							for (var l = o.key; r !== null;) {
								if (r.key === l) {
									if (l = o.type, l === y) {
										if (r.tag === 7) {
											n(e, r.sibling), c = a(r, o.props.children), c.return = e, e = c;
											break a;
										}
									} else if (r.elementType === l || typeof l == "object" && l && l.$$typeof === O && Ca(l) === r.type) {
										n(e, r.sibling), c = a(r, o.props), Aa(c, o), c.return = e, e = c;
										break a;
									}
									n(e, r);
									break;
								} else t(e, r);
								r = r.sibling;
							}
							o.type === y ? (c = di(o.props.children, e.mode, c, o.key), c.return = e, e = c) : (c = ui(o.type, o.key, o.props, null, e.mode, c), Aa(c, o), c.return = e, e = c);
						}
						return s(e);
					case v:
						a: {
							for (l = o.key; r !== null;) {
								if (r.key === l) if (r.tag === 4 && r.stateNode.containerInfo === o.containerInfo && r.stateNode.implementation === o.implementation) {
									n(e, r.sibling), c = a(r, o.children || []), c.return = e, e = c;
									break a;
								} else {
									n(e, r);
									break;
								}
								else t(e, r);
								r = r.sibling;
							}
							c = mi(o, e.mode, c), c.return = e, e = c;
						}
						return s(e);
					case O: return o = Ca(o), b(e, r, o, c);
				}
				if (ae(o)) return h(e, r, o, c);
				if (ne(o)) {
					if (l = ne(o), typeof l != "function") throw Error(i(150));
					return o = l.call(o), g(e, r, o, c);
				}
				if (typeof o.then == "function") return b(e, r, ka(o), c);
				if (o.$$typeof === C) return b(e, r, Qi(e, o), c);
				ja(e, o);
			}
			return typeof o == "string" && o !== "" || typeof o == "number" || typeof o == "bigint" ? (o = "" + o, r !== null && r.tag === 6 ? (n(e, r.sibling), c = a(r, o), c.return = e, e = c) : (n(e, r), c = fi(o, e.mode, c), c.return = e, e = c), s(e)) : n(e, r);
		}
		return function(e, t, n, r) {
			try {
				Oa = 0;
				var i = b(e, t, n, r);
				return Da = null, i;
			} catch (t) {
				if (t === _a || t === ya) throw t;
				var a = oi(29, t, null, e.mode);
				return a.lanes = r, a.return = e, a;
			}
		};
	}
	var Na = Ma(!0), Pa = Ma(!1), Fa = !1;
	function Ia(e) {
		e.updateQueue = {
			baseState: e.memoizedState,
			firstBaseUpdate: null,
			lastBaseUpdate: null,
			shared: {
				pending: null,
				lanes: 0,
				hiddenCallbacks: null
			},
			callbacks: null
		};
	}
	function La(e, t) {
		e = e.updateQueue, t.updateQueue === e && (t.updateQueue = {
			baseState: e.baseState,
			firstBaseUpdate: e.firstBaseUpdate,
			lastBaseUpdate: e.lastBaseUpdate,
			shared: e.shared,
			callbacks: null
		});
	}
	function Ra(e) {
		return {
			lane: e,
			tag: 0,
			payload: null,
			callback: null,
			next: null
		};
	}
	function za(e, t, n) {
		var r = e.updateQueue;
		if (r === null) return null;
		if (r = r.shared, J & 2) {
			var i = r.pending;
			return i === null ? t.next = t : (t.next = i.next, i.next = t), r.pending = t, t = ri(e), ni(e, null, n), t;
		}
		return $r(e, r, t, n), ri(e);
	}
	function Ba(e, t, n) {
		if (t = t.updateQueue, t !== null && (t = t.shared, n & 4194048)) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, nt(e, n);
		}
	}
	function Va(e, t) {
		var n = e.updateQueue, r = e.alternate;
		if (r !== null && (r = r.updateQueue, n === r)) {
			var i = null, a = null;
			if (n = n.firstBaseUpdate, n !== null) {
				do {
					var o = {
						lane: n.lane,
						tag: n.tag,
						payload: n.payload,
						callback: null,
						next: null
					};
					a === null ? i = a = o : a = a.next = o, n = n.next;
				} while (n !== null);
				a === null ? i = a = t : a = a.next = t;
			} else i = a = t;
			n = {
				baseState: r.baseState,
				firstBaseUpdate: i,
				lastBaseUpdate: a,
				shared: r.shared,
				callbacks: r.callbacks
			}, e.updateQueue = n;
			return;
		}
		e = n.lastBaseUpdate, e === null ? n.firstBaseUpdate = t : e.next = t, n.lastBaseUpdate = t;
	}
	var Ha = !1;
	function Ua() {
		if (Ha) {
			var e = ca;
			if (e !== null) throw e;
		}
	}
	function Wa(e, t, n, r) {
		Ha = !1;
		var i = e.updateQueue;
		Fa = !1;
		var a = i.firstBaseUpdate, o = i.lastBaseUpdate, s = i.shared.pending;
		if (s !== null) {
			i.shared.pending = null;
			var c = s, l = c.next;
			c.next = null, o === null ? a = l : o.next = l, o = c;
			var u = e.alternate;
			u !== null && (u = u.updateQueue, s = u.lastBaseUpdate, s !== o && (s === null ? u.firstBaseUpdate = l : s.next = l, u.lastBaseUpdate = c));
		}
		if (a !== null) {
			var d = i.baseState;
			o = 0, u = l = c = null, s = a;
			do {
				var f = s.lane & -536870913, p = f !== s.lane;
				if (p ? (X & f) === f : (r & f) === f) {
					f !== 0 && f === sa && (Ha = !0), u !== null && (u = u.next = {
						lane: 0,
						tag: s.tag,
						payload: s.payload,
						callback: null,
						next: null
					});
					a: {
						var h = e, g = s;
						f = t;
						var _ = n;
						switch (g.tag) {
							case 1:
								if (h = g.payload, typeof h == "function") {
									d = h.call(_, d, f);
									break a;
								}
								d = h;
								break a;
							case 3: h.flags = h.flags & -65537 | 128;
							case 0:
								if (h = g.payload, f = typeof h == "function" ? h.call(_, d, f) : h, f == null) break a;
								d = m({}, d, f);
								break a;
							case 2: Fa = !0;
						}
					}
					f = s.callback, f !== null && (e.flags |= 64, p && (e.flags |= 8192), p = i.callbacks, p === null ? i.callbacks = [f] : p.push(f));
				} else p = {
					lane: f,
					tag: s.tag,
					payload: s.payload,
					callback: s.callback,
					next: null
				}, u === null ? (l = u = p, c = d) : u = u.next = p, o |= f;
				if (s = s.next, s === null) {
					if (s = i.shared.pending, s === null) break;
					p = s, s = p.next, p.next = null, i.lastBaseUpdate = p, i.shared.pending = null;
				}
			} while (1);
			u === null && (c = d), i.baseState = c, i.firstBaseUpdate = l, i.lastBaseUpdate = u, a === null && (i.shared.lanes = 0), Wl |= o, e.lanes = o, e.memoizedState = d;
		}
	}
	function Ga(e, t) {
		if (typeof e != "function") throw Error(i(191, e));
		e.call(t);
	}
	function Ka(e, t) {
		var n = e.callbacks;
		if (n !== null) for (e.callbacks = null, e = 0; e < n.length; e++) Ga(n[e], t);
	}
	var G = le(null), qa = le(0);
	function Ja(e, t) {
		e = Hl, M(qa, e), M(G, t), Hl = e | t.baseLanes;
	}
	function Ya() {
		M(qa, Hl), M(G, G.current);
	}
	function Xa() {
		Hl = qa.current, ue(G), ue(qa);
	}
	var Za = le(null), Qa = null;
	function $a(e) {
		var t = e.alternate;
		M(io, io.current & 1), M(Za, e), Qa === null && (t === null || G.current !== null || t.memoizedState !== null) && (Qa = e);
	}
	function eo(e) {
		M(io, io.current), M(Za, e), Qa === null && (Qa = e);
	}
	function to(e) {
		e.tag === 22 ? (M(io, io.current), M(Za, e), Qa === null && (Qa = e)) : no(e);
	}
	function no() {
		M(io, io.current), M(Za, Za.current);
	}
	function ro(e) {
		ue(Za), Qa === e && (Qa = null), ue(io);
	}
	var io = le(0);
	function ao(e) {
		for (var t = e; t !== null;) {
			if (t.tag === 13) {
				var n = t.memoizedState;
				if (n !== null && (n = n.dehydrated, n === null || af(n) || of(n))) return t;
			} else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
				if (t.flags & 128) return t;
			} else if (t.child !== null) {
				t.child.return = t, t = t.child;
				continue;
			}
			if (t === e) break;
			for (; t.sibling === null;) {
				if (t.return === null || t.return === e) return null;
				t = t.return;
			}
			t.sibling.return = t.return, t = t.sibling;
		}
		return null;
	}
	var oo = 0, K = null, q = null, so = null, co = !1, lo = !1, uo = !1, fo = 0, po = 0, mo = null, ho = 0;
	function go() {
		throw Error(i(321));
	}
	function _o(e, t) {
		if (t === null) return !1;
		for (var n = 0; n < t.length && n < e.length; n++) if (!br(e[n], t[n])) return !1;
		return !0;
	}
	function vo(e, t, n, r, i, a) {
		return oo = a, K = t, t.memoizedState = null, t.updateQueue = null, t.lanes = 0, A.H = e === null || e.memoizedState === null ? Fs : Is, uo = !1, a = n(r, i), uo = !1, lo && (a = bo(t, n, r, i)), yo(e), a;
	}
	function yo(e) {
		A.H = Ps;
		var t = q !== null && q.next !== null;
		if (oo = 0, so = q = K = null, co = !1, po = 0, mo = null, t) throw Error(i(300));
		e === null || $s || (e = e.dependencies, e !== null && U(e) && ($s = !0));
	}
	function bo(e, t, n, r) {
		K = e;
		var a = 0;
		do {
			if (lo && (mo = null), po = 0, lo = !1, 25 <= a) throw Error(i(301));
			if (a += 1, so = q = null, e.updateQueue != null) {
				var o = e.updateQueue;
				o.lastEffect = null, o.events = null, o.stores = null, o.memoCache != null && (o.memoCache.index = 0);
			}
			A.H = Ls, o = t(n, r);
		} while (lo);
		return o;
	}
	function xo() {
		var e = A.H, t = e.useState()[0];
		return t = typeof t.then == "function" ? Oo(t) : t, e = e.useState()[0], (q === null ? null : q.memoizedState) !== e && (K.flags |= 1024), t;
	}
	function So() {
		var e = fo !== 0;
		return fo = 0, e;
	}
	function Co(e, t, n) {
		t.updateQueue = e.updateQueue, t.flags &= -2053, e.lanes &= ~n;
	}
	function wo(e) {
		if (co) {
			for (e = e.memoizedState; e !== null;) {
				var t = e.queue;
				t !== null && (t.pending = null), e = e.next;
			}
			co = !1;
		}
		oo = 0, so = q = K = null, lo = !1, po = fo = 0, mo = null;
	}
	function To() {
		var e = {
			memoizedState: null,
			baseState: null,
			baseQueue: null,
			queue: null,
			next: null
		};
		return so === null ? K.memoizedState = so = e : so = so.next = e, so;
	}
	function Eo() {
		if (q === null) {
			var e = K.alternate;
			e = e === null ? null : e.memoizedState;
		} else e = q.next;
		var t = so === null ? K.memoizedState : so.next;
		if (t !== null) so = t, q = e;
		else {
			if (e === null) throw K.alternate === null ? Error(i(467)) : Error(i(310));
			q = e, e = {
				memoizedState: q.memoizedState,
				baseState: q.baseState,
				baseQueue: q.baseQueue,
				queue: q.queue,
				next: null
			}, so === null ? K.memoizedState = so = e : so = so.next = e;
		}
		return so;
	}
	function Do() {
		return {
			lastEffect: null,
			events: null,
			stores: null,
			memoCache: null
		};
	}
	function Oo(e) {
		var t = po;
		return po += 1, mo === null && (mo = []), e = Sa(mo, e, t), t = K, (so === null ? t.memoizedState : so.next) === null && (t = t.alternate, A.H = t === null || t.memoizedState === null ? Fs : Is), e;
	}
	function ko(e) {
		if (typeof e == "object" && e) {
			if (typeof e.then == "function") return Oo(e);
			if (e.$$typeof === C) return Zi(e);
		}
		throw Error(i(438, String(e)));
	}
	function Ao(e) {
		var t = null, n = K.updateQueue;
		if (n !== null && (t = n.memoCache), t == null) {
			var r = K.alternate;
			r !== null && (r = r.updateQueue, r !== null && (r = r.memoCache, r != null && (t = {
				data: r.data.map(function(e) {
					return e.slice();
				}),
				index: 0
			})));
		}
		if (t ??= {
			data: [],
			index: 0
		}, n === null && (n = Do(), K.updateQueue = n), n.memoCache = t, n = t.data[t.index], n === void 0) for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = ee;
		return t.index++, n;
	}
	function jo(e, t) {
		return typeof t == "function" ? t(e) : t;
	}
	function Mo(e) {
		return No(Eo(), q, e);
	}
	function No(e, t, n) {
		var r = e.queue;
		if (r === null) throw Error(i(311));
		r.lastRenderedReducer = n;
		var a = e.baseQueue, o = r.pending;
		if (o !== null) {
			if (a !== null) {
				var s = a.next;
				a.next = o.next, o.next = s;
			}
			t.baseQueue = a = o, r.pending = null;
		}
		if (o = e.baseState, a === null) e.memoizedState = o;
		else {
			t = a.next;
			var c = s = null, l = null, u = t, d = !1;
			do {
				var f = u.lane & -536870913;
				if (f === u.lane ? (oo & f) === f : (X & f) === f) {
					var p = u.revertLane;
					if (p === 0) l !== null && (l = l.next = {
						lane: 0,
						revertLane: 0,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}), f === sa && (d = !0);
					else if ((oo & p) === p) {
						u = u.next, p === sa && (d = !0);
						continue;
					} else f = {
						lane: 0,
						revertLane: u.revertLane,
						gesture: null,
						action: u.action,
						hasEagerState: u.hasEagerState,
						eagerState: u.eagerState,
						next: null
					}, l === null ? (c = l = f, s = o) : l = l.next = f, K.lanes |= p, Wl |= p;
					f = u.action, uo && n(o, f), o = u.hasEagerState ? u.eagerState : n(o, f);
				} else p = {
					lane: f,
					revertLane: u.revertLane,
					gesture: u.gesture,
					action: u.action,
					hasEagerState: u.hasEagerState,
					eagerState: u.eagerState,
					next: null
				}, l === null ? (c = l = p, s = o) : l = l.next = p, K.lanes |= f, Wl |= f;
				u = u.next;
			} while (u !== null && u !== t);
			if (l === null ? s = o : l.next = c, !br(o, e.memoizedState) && ($s = !0, d && (n = ca, n !== null))) throw n;
			e.memoizedState = o, e.baseState = s, e.baseQueue = l, r.lastRenderedState = o;
		}
		return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
	}
	function Po(e) {
		var t = Eo(), n = t.queue;
		if (n === null) throw Error(i(311));
		n.lastRenderedReducer = e;
		var r = n.dispatch, a = n.pending, o = t.memoizedState;
		if (a !== null) {
			n.pending = null;
			var s = a = a.next;
			do
				o = e(o, s.action), s = s.next;
			while (s !== a);
			br(o, t.memoizedState) || ($s = !0), t.memoizedState = o, t.baseQueue === null && (t.baseState = o), n.lastRenderedState = o;
		}
		return [o, r];
	}
	function Fo(e, t, n) {
		var r = K, a = Eo(), o = H;
		if (o) {
			if (n === void 0) throw Error(i(407));
			n = n();
		} else n = t();
		var s = !br((q || a).memoizedState, n);
		if (s && (a.memoizedState = n, $s = !0), a = a.queue, os(Ro.bind(null, r, a, e), [e]), a.getSnapshot !== t || s || so !== null && so.memoizedState.tag & 1) {
			if (r.flags |= 2048, ts(9, { destroy: void 0 }, Lo.bind(null, r, a, n, t), null), Ll === null) throw Error(i(349));
			o || oo & 127 || Io(r, t, n);
		}
		return n;
	}
	function Io(e, t, n) {
		e.flags |= 16384, e = {
			getSnapshot: t,
			value: n
		}, t = K.updateQueue, t === null ? (t = Do(), K.updateQueue = t, t.stores = [e]) : (n = t.stores, n === null ? t.stores = [e] : n.push(e));
	}
	function Lo(e, t, n, r) {
		t.value = n, t.getSnapshot = r, zo(t) && Bo(e);
	}
	function Ro(e, t, n) {
		return n(function() {
			zo(t) && Bo(e);
		});
	}
	function zo(e) {
		var t = e.getSnapshot;
		e = e.value;
		try {
			var n = t();
			return !br(e, n);
		} catch {
			return !0;
		}
	}
	function Bo(e) {
		var t = ti(e, 2);
		t !== null && mu(t, e, 2);
	}
	function Vo(e) {
		var t = To();
		if (typeof e == "function") {
			var n = e;
			if (e = n(), uo) {
				Ve(!0);
				try {
					n();
				} finally {
					Ve(!1);
				}
			}
		}
		return t.memoizedState = t.baseState = e, t.queue = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: jo,
			lastRenderedState: e
		}, t;
	}
	function Ho(e, t, n, r) {
		return e.baseState = n, No(e, q, typeof r == "function" ? r : jo);
	}
	function Uo(e, t, n, r, a) {
		if (js(e)) throw Error(i(485));
		if (e = t.action, e !== null) {
			var o = {
				payload: a,
				action: e,
				next: null,
				isTransition: !0,
				status: "pending",
				value: null,
				reason: null,
				listeners: [],
				then: function(e) {
					o.listeners.push(e);
				}
			};
			A.T === null ? o.isTransition = !1 : n(!0), r(o), n = t.pending, n === null ? (o.next = t.pending = o, Wo(t, o)) : (o.next = n.next, t.pending = n.next = o);
		}
	}
	function Wo(e, t) {
		var n = t.action, r = t.payload, i = e.state;
		if (t.isTransition) {
			var a = A.T, o = {};
			A.T = o;
			try {
				var s = n(i, r), c = A.S;
				c !== null && c(o, s), Go(e, t, s);
			} catch (n) {
				qo(e, t, n);
			} finally {
				a !== null && o.types !== null && (a.types = o.types), A.T = a;
			}
		} else try {
			a = n(i, r), Go(e, t, a);
		} catch (n) {
			qo(e, t, n);
		}
	}
	function Go(e, t, n) {
		typeof n == "object" && n && typeof n.then == "function" ? n.then(function(n) {
			Ko(e, t, n);
		}, function(n) {
			return qo(e, t, n);
		}) : Ko(e, t, n);
	}
	function Ko(e, t, n) {
		t.status = "fulfilled", t.value = n, Jo(t), e.state = n, t = e.pending, t !== null && (n = t.next, n === t ? e.pending = null : (n = n.next, t.next = n, Wo(e, n)));
	}
	function qo(e, t, n) {
		var r = e.pending;
		if (e.pending = null, r !== null) {
			r = r.next;
			do
				t.status = "rejected", t.reason = n, Jo(t), t = t.next;
			while (t !== r);
		}
		e.action = null;
	}
	function Jo(e) {
		e = e.listeners;
		for (var t = 0; t < e.length; t++) (0, e[t])();
	}
	function Yo(e, t) {
		return t;
	}
	function Xo(e, t) {
		if (H) {
			var n = Ll.formState;
			if (n !== null) {
				a: {
					var r = K;
					if (H) {
						if (V) {
							b: {
								for (var i = V, a = Ni; i.nodeType !== 8;) {
									if (!a) {
										i = null;
										break b;
									}
									if (i = cf(i.nextSibling), i === null) {
										i = null;
										break b;
									}
								}
								a = i.data, i = a === "F!" || a === "F" ? i : null;
							}
							if (i) {
								V = cf(i.nextSibling), r = i.data === "F!";
								break a;
							}
						}
						Fi(r);
					}
					r = !1;
				}
				r && (t = n[0]);
			}
		}
		return n = To(), n.memoizedState = n.baseState = t, r = {
			pending: null,
			lanes: 0,
			dispatch: null,
			lastRenderedReducer: Yo,
			lastRenderedState: t
		}, n.queue = r, n = Os.bind(null, K, r), r.dispatch = n, r = Vo(!1), a = As.bind(null, K, !1, r.queue), r = To(), i = {
			state: t,
			dispatch: null,
			action: e,
			pending: null
		}, r.queue = i, n = Uo.bind(null, K, i, a, n), i.dispatch = n, r.memoizedState = e, [
			t,
			n,
			!1
		];
	}
	function Zo(e) {
		return Qo(Eo(), q, e);
	}
	function Qo(e, t, n) {
		if (t = No(e, t, Yo)[0], e = Mo(jo)[0], typeof t == "object" && t && typeof t.then == "function") try {
			var r = Oo(t);
		} catch (e) {
			throw e === _a ? ya : e;
		}
		else r = t;
		t = Eo();
		var i = t.queue, a = i.dispatch;
		return n !== t.memoizedState && (K.flags |= 2048, ts(9, { destroy: void 0 }, $o.bind(null, i, n), null)), [
			r,
			a,
			e
		];
	}
	function $o(e, t) {
		e.action = t;
	}
	function es(e) {
		var t = Eo(), n = q;
		if (n !== null) return Qo(t, n, e);
		Eo(), t = t.memoizedState, n = Eo();
		var r = n.queue.dispatch;
		return n.memoizedState = e, [
			t,
			r,
			!1
		];
	}
	function ts(e, t, n, r) {
		return e = {
			tag: e,
			create: n,
			deps: r,
			inst: t,
			next: null
		}, t = K.updateQueue, t === null && (t = Do(), K.updateQueue = t), n = t.lastEffect, n === null ? t.lastEffect = e.next = e : (r = n.next, n.next = e, e.next = r, t.lastEffect = e), e;
	}
	function ns() {
		return Eo().memoizedState;
	}
	function rs(e, t, n, r) {
		var i = To();
		K.flags |= e, i.memoizedState = ts(1 | t, { destroy: void 0 }, n, r === void 0 ? null : r);
	}
	function is(e, t, n, r) {
		var i = Eo();
		r = r === void 0 ? null : r;
		var a = i.memoizedState.inst;
		q !== null && r !== null && _o(r, q.memoizedState.deps) ? i.memoizedState = ts(t, a, n, r) : (K.flags |= e, i.memoizedState = ts(1 | t, a, n, r));
	}
	function as(e, t) {
		rs(8390656, 8, e, t);
	}
	function os(e, t) {
		is(2048, 8, e, t);
	}
	function ss(e) {
		K.flags |= 4;
		var t = K.updateQueue;
		if (t === null) t = Do(), K.updateQueue = t, t.events = [e];
		else {
			var n = t.events;
			n === null ? t.events = [e] : n.push(e);
		}
	}
	function cs(e) {
		var t = Eo().memoizedState;
		return ss({
			ref: t,
			nextImpl: e
		}), function() {
			if (J & 2) throw Error(i(440));
			return t.impl.apply(void 0, arguments);
		};
	}
	function ls(e, t) {
		return is(4, 2, e, t);
	}
	function us(e, t) {
		return is(4, 4, e, t);
	}
	function ds(e, t) {
		if (typeof t == "function") {
			e = e();
			var n = t(e);
			return function() {
				typeof n == "function" ? n() : t(null);
			};
		}
		if (t != null) return e = e(), t.current = e, function() {
			t.current = null;
		};
	}
	function fs(e, t, n) {
		n = n == null ? null : n.concat([e]), is(4, 4, ds.bind(null, t, e), n);
	}
	function ps() {}
	function ms(e, t) {
		var n = Eo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		return t !== null && _o(t, r[1]) ? r[0] : (n.memoizedState = [e, t], e);
	}
	function hs(e, t) {
		var n = Eo();
		t = t === void 0 ? null : t;
		var r = n.memoizedState;
		if (t !== null && _o(t, r[1])) return r[0];
		if (r = e(), uo) {
			Ve(!0);
			try {
				e();
			} finally {
				Ve(!1);
			}
		}
		return n.memoizedState = [r, t], r;
	}
	function gs(e, t, n) {
		return n === void 0 || oo & 1073741824 && !(X & 261930) ? e.memoizedState = t : (e.memoizedState = n, e = pu(), K.lanes |= e, Wl |= e, n);
	}
	function _s(e, t, n, r) {
		return br(n, t) ? n : G.current === null ? !(oo & 42) || oo & 1073741824 && !(X & 261930) ? ($s = !0, e.memoizedState = n) : (e = pu(), K.lanes |= e, Wl |= e, t) : (e = gs(e, n, r), br(e, t) || ($s = !0), e);
	}
	function vs(e, t, n, r, i) {
		var a = j.p;
		j.p = a !== 0 && 8 > a ? a : 8;
		var o = A.T, s = {};
		A.T = s, As(e, !1, t, n);
		try {
			var c = i(), l = A.S;
			l !== null && l(s, c), typeof c == "object" && c && typeof c.then == "function" ? ks(e, t, da(c, r), fu(e)) : ks(e, t, r, fu(e));
		} catch (n) {
			ks(e, t, {
				then: function() {},
				status: "rejected",
				reason: n
			}, fu());
		} finally {
			j.p = a, o !== null && s.types !== null && (o.types = s.types), A.T = o;
		}
	}
	function ys() {}
	function bs(e, t, n, r) {
		if (e.tag !== 5) throw Error(i(476));
		var a = xs(e).queue;
		vs(e, a, t, oe, n === null ? ys : function() {
			return Ss(e), n(r);
		});
	}
	function xs(e) {
		var t = e.memoizedState;
		if (t !== null) return t;
		t = {
			memoizedState: oe,
			baseState: oe,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: jo,
				lastRenderedState: oe
			},
			next: null
		};
		var n = {};
		return t.next = {
			memoizedState: n,
			baseState: n,
			baseQueue: null,
			queue: {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: jo,
				lastRenderedState: n
			},
			next: null
		}, e.memoizedState = t, e = e.alternate, e !== null && (e.memoizedState = t), t;
	}
	function Ss(e) {
		var t = xs(e);
		t.next === null && (t = e.alternate.memoizedState), ks(e, t.next.queue, {}, fu());
	}
	function Cs() {
		return Zi(Qf);
	}
	function ws() {
		return Eo().memoizedState;
	}
	function Ts() {
		return Eo().memoizedState;
	}
	function Es(e) {
		for (var t = e.return; t !== null;) {
			switch (t.tag) {
				case 24:
				case 3:
					var n = fu();
					e = Ra(n);
					var r = za(t, e, n);
					r !== null && (mu(r, t, n), Ba(r, t, n)), t = { cache: ra() }, e.payload = t;
					return;
			}
			t = t.return;
		}
	}
	function Ds(e, t, n) {
		var r = fu();
		n = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, js(e) ? Ms(t, n) : (n = ei(e, t, n, r), n !== null && (mu(n, e, r), Ns(n, t, r)));
	}
	function Os(e, t, n) {
		ks(e, t, n, fu());
	}
	function ks(e, t, n, r) {
		var i = {
			lane: r,
			revertLane: 0,
			gesture: null,
			action: n,
			hasEagerState: !1,
			eagerState: null,
			next: null
		};
		if (js(e)) Ms(t, i);
		else {
			var a = e.alternate;
			if (e.lanes === 0 && (a === null || a.lanes === 0) && (a = t.lastRenderedReducer, a !== null)) try {
				var o = t.lastRenderedState, s = a(o, n);
				if (i.hasEagerState = !0, i.eagerState = s, br(s, o)) return $r(e, t, i, 0), Ll === null && Qr(), !1;
			} catch {}
			if (n = ei(e, t, i, r), n !== null) return mu(n, e, r), Ns(n, t, r), !0;
		}
		return !1;
	}
	function As(e, t, n, r) {
		if (r = {
			lane: 2,
			revertLane: ud(),
			gesture: null,
			action: r,
			hasEagerState: !1,
			eagerState: null,
			next: null
		}, js(e)) {
			if (t) throw Error(i(479));
		} else t = ei(e, n, r, 2), t !== null && mu(t, e, 2);
	}
	function js(e) {
		var t = e.alternate;
		return e === K || t !== null && t === K;
	}
	function Ms(e, t) {
		lo = co = !0;
		var n = e.pending;
		n === null ? t.next = t : (t.next = n.next, n.next = t), e.pending = t;
	}
	function Ns(e, t, n) {
		if (n & 4194048) {
			var r = t.lanes;
			r &= e.pendingLanes, n |= r, t.lanes = n, nt(e, n);
		}
	}
	var Ps = {
		readContext: Zi,
		use: ko,
		useCallback: go,
		useContext: go,
		useEffect: go,
		useImperativeHandle: go,
		useLayoutEffect: go,
		useInsertionEffect: go,
		useMemo: go,
		useReducer: go,
		useRef: go,
		useState: go,
		useDebugValue: go,
		useDeferredValue: go,
		useTransition: go,
		useSyncExternalStore: go,
		useId: go,
		useHostTransitionStatus: go,
		useFormState: go,
		useActionState: go,
		useOptimistic: go,
		useMemoCache: go,
		useCacheRefresh: go
	};
	Ps.useEffectEvent = go;
	var Fs = {
		readContext: Zi,
		use: ko,
		useCallback: function(e, t) {
			return To().memoizedState = [e, t === void 0 ? null : t], e;
		},
		useContext: Zi,
		useEffect: as,
		useImperativeHandle: function(e, t, n) {
			n = n == null ? null : n.concat([e]), rs(4194308, 4, ds.bind(null, t, e), n);
		},
		useLayoutEffect: function(e, t) {
			return rs(4194308, 4, e, t);
		},
		useInsertionEffect: function(e, t) {
			rs(4, 2, e, t);
		},
		useMemo: function(e, t) {
			var n = To();
			t = t === void 0 ? null : t;
			var r = e();
			if (uo) {
				Ve(!0);
				try {
					e();
				} finally {
					Ve(!1);
				}
			}
			return n.memoizedState = [r, t], r;
		},
		useReducer: function(e, t, n) {
			var r = To();
			if (n !== void 0) {
				var i = n(t);
				if (uo) {
					Ve(!0);
					try {
						n(t);
					} finally {
						Ve(!1);
					}
				}
			} else i = t;
			return r.memoizedState = r.baseState = i, e = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: e,
				lastRenderedState: i
			}, r.queue = e, e = e.dispatch = Ds.bind(null, K, e), [r.memoizedState, e];
		},
		useRef: function(e) {
			var t = To();
			return e = { current: e }, t.memoizedState = e;
		},
		useState: function(e) {
			e = Vo(e);
			var t = e.queue, n = Os.bind(null, K, t);
			return t.dispatch = n, [e.memoizedState, n];
		},
		useDebugValue: ps,
		useDeferredValue: function(e, t) {
			return gs(To(), e, t);
		},
		useTransition: function() {
			var e = Vo(!1);
			return e = vs.bind(null, K, e.queue, !0, !1), To().memoizedState = e, [!1, e];
		},
		useSyncExternalStore: function(e, t, n) {
			var r = K, a = To();
			if (H) {
				if (n === void 0) throw Error(i(407));
				n = n();
			} else {
				if (n = t(), Ll === null) throw Error(i(349));
				X & 127 || Io(r, t, n);
			}
			a.memoizedState = n;
			var o = {
				value: n,
				getSnapshot: t
			};
			return a.queue = o, as(Ro.bind(null, r, o, e), [e]), r.flags |= 2048, ts(9, { destroy: void 0 }, Lo.bind(null, r, o, n, t), null), n;
		},
		useId: function() {
			var e = To(), t = Ll.identifierPrefix;
			if (H) {
				var n = Ti, r = wi;
				n = (r & ~(1 << 32 - He(r) - 1)).toString(32) + n, t = "_" + t + "R_" + n, n = fo++, 0 < n && (t += "H" + n.toString(32)), t += "_";
			} else n = ho++, t = "_" + t + "r_" + n.toString(32) + "_";
			return e.memoizedState = t;
		},
		useHostTransitionStatus: Cs,
		useFormState: Xo,
		useActionState: Xo,
		useOptimistic: function(e) {
			var t = To();
			t.memoizedState = t.baseState = e;
			var n = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: null,
				lastRenderedState: null
			};
			return t.queue = n, t = As.bind(null, K, !0, n), n.dispatch = t, [e, t];
		},
		useMemoCache: Ao,
		useCacheRefresh: function() {
			return To().memoizedState = Es.bind(null, K);
		},
		useEffectEvent: function(e) {
			var t = To(), n = { impl: e };
			return t.memoizedState = n, function() {
				if (J & 2) throw Error(i(440));
				return n.impl.apply(void 0, arguments);
			};
		}
	}, Is = {
		readContext: Zi,
		use: ko,
		useCallback: ms,
		useContext: Zi,
		useEffect: os,
		useImperativeHandle: fs,
		useInsertionEffect: ls,
		useLayoutEffect: us,
		useMemo: hs,
		useReducer: Mo,
		useRef: ns,
		useState: function() {
			return Mo(jo);
		},
		useDebugValue: ps,
		useDeferredValue: function(e, t) {
			return _s(Eo(), q.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Mo(jo)[0], t = Eo().memoizedState;
			return [typeof e == "boolean" ? e : Oo(e), t];
		},
		useSyncExternalStore: Fo,
		useId: ws,
		useHostTransitionStatus: Cs,
		useFormState: Zo,
		useActionState: Zo,
		useOptimistic: function(e, t) {
			return Ho(Eo(), q, e, t);
		},
		useMemoCache: Ao,
		useCacheRefresh: Ts
	};
	Is.useEffectEvent = cs;
	var Ls = {
		readContext: Zi,
		use: ko,
		useCallback: ms,
		useContext: Zi,
		useEffect: os,
		useImperativeHandle: fs,
		useInsertionEffect: ls,
		useLayoutEffect: us,
		useMemo: hs,
		useReducer: Po,
		useRef: ns,
		useState: function() {
			return Po(jo);
		},
		useDebugValue: ps,
		useDeferredValue: function(e, t) {
			var n = Eo();
			return q === null ? gs(n, e, t) : _s(n, q.memoizedState, e, t);
		},
		useTransition: function() {
			var e = Po(jo)[0], t = Eo().memoizedState;
			return [typeof e == "boolean" ? e : Oo(e), t];
		},
		useSyncExternalStore: Fo,
		useId: ws,
		useHostTransitionStatus: Cs,
		useFormState: es,
		useActionState: es,
		useOptimistic: function(e, t) {
			var n = Eo();
			return q === null ? (n.baseState = e, [e, n.queue.dispatch]) : Ho(n, q, e, t);
		},
		useMemoCache: Ao,
		useCacheRefresh: Ts
	};
	Ls.useEffectEvent = cs;
	function Rs(e, t, n, r) {
		t = e.memoizedState, n = n(r, t), n = n == null ? t : m({}, t, n), e.memoizedState = n, e.lanes === 0 && (e.updateQueue.baseState = n);
	}
	var zs = {
		enqueueSetState: function(e, t, n) {
			e = e._reactInternals;
			var r = fu(), i = Ra(r);
			i.payload = t, n != null && (i.callback = n), t = za(e, i, r), t !== null && (mu(t, e, r), Ba(t, e, r));
		},
		enqueueReplaceState: function(e, t, n) {
			e = e._reactInternals;
			var r = fu(), i = Ra(r);
			i.tag = 1, i.payload = t, n != null && (i.callback = n), t = za(e, i, r), t !== null && (mu(t, e, r), Ba(t, e, r));
		},
		enqueueForceUpdate: function(e, t) {
			e = e._reactInternals;
			var n = fu(), r = Ra(n);
			r.tag = 2, t != null && (r.callback = t), t = za(e, r, n), t !== null && (mu(t, e, n), Ba(t, e, n));
		}
	};
	function Bs(e, t, n, r, i, a, o) {
		return e = e.stateNode, typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(r, a, o) : t.prototype && t.prototype.isPureReactComponent ? !xr(n, r) || !xr(i, a) : !0;
	}
	function Vs(e, t, n, r) {
		e = t.state, typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, r), typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, r), t.state !== e && zs.enqueueReplaceState(t, t.state, null);
	}
	function Hs(e, t) {
		var n = t;
		if ("ref" in t) for (var r in n = {}, t) r !== "ref" && (n[r] = t[r]);
		if (e = e.defaultProps) for (var i in n === t && (n = m({}, n)), e) n[i] === void 0 && (n[i] = e[i]);
		return n;
	}
	function Us(e) {
		Jr(e);
	}
	function Ws(e) {
		console.error(e);
	}
	function Gs(e) {
		Jr(e);
	}
	function Ks(e, t) {
		try {
			var n = e.onUncaughtError;
			n(t.value, { componentStack: t.stack });
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function qs(e, t, n) {
		try {
			var r = e.onCaughtError;
			r(n.value, {
				componentStack: n.stack,
				errorBoundary: t.tag === 1 ? t.stateNode : null
			});
		} catch (e) {
			setTimeout(function() {
				throw e;
			});
		}
	}
	function Js(e, t, n) {
		return n = Ra(n), n.tag = 3, n.payload = { element: null }, n.callback = function() {
			Ks(e, t);
		}, n;
	}
	function Ys(e) {
		return e = Ra(e), e.tag = 3, e;
	}
	function Xs(e, t, n, r) {
		var i = n.type.getDerivedStateFromError;
		if (typeof i == "function") {
			var a = r.value;
			e.payload = function() {
				return i(a);
			}, e.callback = function() {
				qs(t, n, r);
			};
		}
		var o = n.stateNode;
		o !== null && typeof o.componentDidCatch == "function" && (e.callback = function() {
			qs(t, n, r), typeof i != "function" && (nu === null ? nu = new Set([this]) : nu.add(this));
			var e = r.stack;
			this.componentDidCatch(r.value, { componentStack: e === null ? "" : e });
		});
	}
	function Zs(e, t, n, r, a) {
		if (n.flags |= 32768, typeof r == "object" && r && typeof r.then == "function") {
			if (t = n.alternate, t !== null && Yi(t, n, a, !0), n = Za.current, n !== null) {
				switch (n.tag) {
					case 31:
					case 13: return Qa === null ? Eu() : n.alternate === null && Ul === 0 && (Ul = 3), n.flags &= -257, n.flags |= 65536, n.lanes = a, r === ba ? n.flags |= 16384 : (t = n.updateQueue, t === null ? n.updateQueue = new Set([r]) : t.add(r), Wu(e, r, a)), !1;
					case 22: return n.flags |= 65536, r === ba ? n.flags |= 16384 : (t = n.updateQueue, t === null ? (t = {
						transitions: null,
						markerInstances: null,
						retryQueue: new Set([r])
					}, n.updateQueue = t) : (n = t.retryQueue, n === null ? t.retryQueue = new Set([r]) : n.add(r)), Wu(e, r, a)), !1;
				}
				throw Error(i(435, n.tag));
			}
			return Wu(e, r, a), Eu(), !1;
		}
		if (H) return t = Za.current, t === null ? (r !== Pi && (t = Error(i(423), { cause: r }), Vi(gi(t, n))), e = e.current.alternate, e.flags |= 65536, a &= -a, e.lanes |= a, r = gi(r, n), a = Js(e.stateNode, r, a), Va(e, a), Ul !== 4 && (Ul = 2)) : (!(t.flags & 65536) && (t.flags |= 256), t.flags |= 65536, t.lanes = a, r !== Pi && (e = Error(i(422), { cause: r }), Vi(gi(e, n)))), !1;
		var o = Error(i(520), { cause: r });
		if (o = gi(o, n), Yl === null ? Yl = [o] : Yl.push(o), Ul !== 4 && (Ul = 2), t === null) return !0;
		r = gi(r, n), n = t;
		do {
			switch (n.tag) {
				case 3: return n.flags |= 65536, e = a & -a, n.lanes |= e, e = Js(n.stateNode, r, e), Va(n, e), !1;
				case 1: if (t = n.type, o = n.stateNode, !(n.flags & 128) && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (nu === null || !nu.has(o)))) return n.flags |= 65536, a &= -a, n.lanes |= a, a = Ys(a), Xs(a, e, n, r), Va(n, a), !1;
			}
			n = n.return;
		} while (n !== null);
		return !1;
	}
	var Qs = Error(i(461)), $s = !1;
	function ec(e, t, n, r) {
		t.child = e === null ? Pa(t, null, n, r) : Na(t, e.child, n, r);
	}
	function tc(e, t, n, r, i) {
		n = n.render;
		var a = t.ref;
		if ("ref" in r) {
			var o = {};
			for (var s in r) s !== "ref" && (o[s] = r[s]);
		} else o = r;
		return Xi(t), r = vo(e, t, n, o, a, i), s = So(), e !== null && !$s ? (Co(e, t, i), Tc(e, t, i)) : (H && s && Oi(t), t.flags |= 1, ec(e, t, r, i), t.child);
	}
	function nc(e, t, n, r, i) {
		if (e === null) {
			var a = n.type;
			return typeof a == "function" && !si(a) && a.defaultProps === void 0 && n.compare === null ? (t.tag = 15, t.type = a, rc(e, t, a, r, i)) : (e = ui(n.type, null, r, t, t.mode, i), e.ref = t.ref, e.return = t, t.child = e);
		}
		if (a = e.child, !Ec(e, i)) {
			var o = a.memoizedProps;
			if (n = n.compare, n = n === null ? xr : n, n(o, r) && e.ref === t.ref) return Tc(e, t, i);
		}
		return t.flags |= 1, e = ci(a, r), e.ref = t.ref, e.return = t, t.child = e;
	}
	function rc(e, t, n, r, i) {
		if (e !== null) {
			var a = e.memoizedProps;
			if (xr(a, r) && e.ref === t.ref) if ($s = !1, t.pendingProps = r = a, Ec(e, i)) e.flags & 131072 && ($s = !0);
			else return t.lanes = e.lanes, Tc(e, t, i);
		}
		return dc(e, t, n, r, i);
	}
	function ic(e, t, n, r) {
		var i = r.children, a = e === null ? null : e.memoizedState;
		if (e === null && t.stateNode === null && (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), r.mode === "hidden") {
			if (t.flags & 128) {
				if (a = a === null ? n : a.baseLanes | n, e !== null) {
					for (r = t.child = e.child, i = 0; r !== null;) i = i | r.lanes | r.childLanes, r = r.sibling;
					r = i & ~a;
				} else r = 0, t.child = null;
				return oc(e, t, a, n, r);
			}
			if (n & 536870912) t.memoizedState = {
				baseLanes: 0,
				cachePool: null
			}, e !== null && ha(t, a === null ? null : a.cachePool), a === null ? Ya() : Ja(t, a), to(t);
			else return r = t.lanes = 536870912, oc(e, t, a === null ? n : a.baseLanes | n, n, r);
		} else a === null ? (e !== null && ha(t, null), Ya(), no(t)) : (ha(t, a.cachePool), Ja(t, a), no(t), t.memoizedState = null);
		return ec(e, t, i, n), t.child;
	}
	function ac(e, t) {
		return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
			_visibility: 1,
			_pendingMarkers: null,
			_retryCache: null,
			_transitions: null
		}), t.sibling;
	}
	function oc(e, t, n, r, i) {
		var a = ma();
		return a = a === null ? null : {
			parent: W._currentValue,
			pool: a
		}, t.memoizedState = {
			baseLanes: n,
			cachePool: a
		}, e !== null && ha(t, null), Ya(), to(t), e !== null && Yi(e, t, r, !0), t.childLanes = i, null;
	}
	function sc(e, t) {
		return t = bc({
			mode: t.mode,
			children: t.children
		}, e.mode), t.ref = e.ref, e.child = t, t.return = e, t;
	}
	function cc(e, t, n) {
		return Na(t, e.child, null, n), e = sc(t, t.pendingProps), e.flags |= 2, ro(t), t.memoizedState = null, e;
	}
	function lc(e, t, n) {
		var r = t.pendingProps, a = (t.flags & 128) != 0;
		if (t.flags &= -129, e === null) {
			if (H) {
				if (r.mode === "hidden") return e = sc(t, r), t.lanes = 536870912, ac(null, e);
				if (eo(t), (e = V) ? (e = rf(e, Ni), e = e !== null && e.data === "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ci === null ? null : {
						id: wi,
						overflow: Ti
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = pi(e), n.return = t, t.child = n, ji = t, V = null)) : e = null, e === null) throw Fi(t);
				return t.lanes = 536870912, null;
			}
			return sc(t, r);
		}
		var o = e.memoizedState;
		if (o !== null) {
			var s = o.dehydrated;
			if (eo(t), a) if (t.flags & 256) t.flags &= -257, t = cc(e, t, n);
			else if (t.memoizedState !== null) t.child = e.child, t.flags |= 128, t = null;
			else throw Error(i(558));
			else if ($s || Yi(e, t, n, !1), a = (n & e.childLanes) !== 0, $s || a) {
				if (r = Ll, r !== null && (s = rt(r, n), s !== 0 && s !== o.retryLane)) throw o.retryLane = s, ti(e, s), mu(r, e, s), Qs;
				Eu(), t = cc(e, t, n);
			} else e = o.treeContext, V = cf(s.nextSibling), ji = t, H = !0, Mi = null, Ni = !1, e !== null && Ai(t, e), t = sc(t, r), t.flags |= 4096;
			return t;
		}
		return e = ci(e.child, {
			mode: r.mode,
			children: r.children
		}), e.ref = t.ref, t.child = e, e.return = t, e;
	}
	function uc(e, t) {
		var n = t.ref;
		if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
		else {
			if (typeof n != "function" && typeof n != "object") throw Error(i(284));
			(e === null || e.ref !== n) && (t.flags |= 4194816);
		}
	}
	function dc(e, t, n, r, i) {
		return Xi(t), n = vo(e, t, n, r, void 0, i), r = So(), e !== null && !$s ? (Co(e, t, i), Tc(e, t, i)) : (H && r && Oi(t), t.flags |= 1, ec(e, t, n, i), t.child);
	}
	function fc(e, t, n, r, i, a) {
		return Xi(t), t.updateQueue = null, n = bo(t, r, n, i), yo(e), r = So(), e !== null && !$s ? (Co(e, t, a), Tc(e, t, a)) : (H && r && Oi(t), t.flags |= 1, ec(e, t, n, a), t.child);
	}
	function pc(e, t, n, r, i) {
		if (Xi(t), t.stateNode === null) {
			var a = ii, o = n.contextType;
			typeof o == "object" && o && (a = Zi(o)), a = new n(r, a), t.memoizedState = a.state !== null && a.state !== void 0 ? a.state : null, a.updater = zs, t.stateNode = a, a._reactInternals = t, a = t.stateNode, a.props = r, a.state = t.memoizedState, a.refs = {}, Ia(t), o = n.contextType, a.context = typeof o == "object" && o ? Zi(o) : ii, a.state = t.memoizedState, o = n.getDerivedStateFromProps, typeof o == "function" && (Rs(t, n, o, r), a.state = t.memoizedState), typeof n.getDerivedStateFromProps == "function" || typeof a.getSnapshotBeforeUpdate == "function" || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (o = a.state, typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount(), o !== a.state && zs.enqueueReplaceState(a, a.state, null), Wa(t, r, a, i), Ua(), a.state = t.memoizedState), typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !0;
		} else if (e === null) {
			a = t.stateNode;
			var s = t.memoizedProps, c = Hs(n, s);
			a.props = c;
			var l = a.context, u = n.contextType;
			o = ii, typeof u == "object" && u && (o = Zi(u));
			var d = n.getDerivedStateFromProps;
			u = typeof d == "function" || typeof a.getSnapshotBeforeUpdate == "function", s = t.pendingProps !== s, u || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (s || l !== o) && Vs(t, a, r, o), Fa = !1;
			var f = t.memoizedState;
			a.state = f, Wa(t, r, a, i), Ua(), l = t.memoizedState, s || f !== l || Fa ? (typeof d == "function" && (Rs(t, n, d, r), l = t.memoizedState), (c = Fa || Bs(t, n, c, r, f, l, o)) ? (u || typeof a.UNSAFE_componentWillMount != "function" && typeof a.componentWillMount != "function" || (typeof a.componentWillMount == "function" && a.componentWillMount(), typeof a.UNSAFE_componentWillMount == "function" && a.UNSAFE_componentWillMount()), typeof a.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), t.memoizedProps = r, t.memoizedState = l), a.props = r, a.state = l, a.context = o, r = c) : (typeof a.componentDidMount == "function" && (t.flags |= 4194308), r = !1);
		} else {
			a = t.stateNode, La(e, t), o = t.memoizedProps, u = Hs(n, o), a.props = u, d = t.pendingProps, f = a.context, l = n.contextType, c = ii, typeof l == "object" && l && (c = Zi(l)), s = n.getDerivedStateFromProps, (l = typeof s == "function" || typeof a.getSnapshotBeforeUpdate == "function") || typeof a.UNSAFE_componentWillReceiveProps != "function" && typeof a.componentWillReceiveProps != "function" || (o !== d || f !== c) && Vs(t, a, r, c), Fa = !1, f = t.memoizedState, a.state = f, Wa(t, r, a, i), Ua();
			var p = t.memoizedState;
			o !== d || f !== p || Fa || e !== null && e.dependencies !== null && U(e.dependencies) ? (typeof s == "function" && (Rs(t, n, s, r), p = t.memoizedState), (u = Fa || Bs(t, n, u, r, f, p, c) || e !== null && e.dependencies !== null && U(e.dependencies)) ? (l || typeof a.UNSAFE_componentWillUpdate != "function" && typeof a.componentWillUpdate != "function" || (typeof a.componentWillUpdate == "function" && a.componentWillUpdate(r, p, c), typeof a.UNSAFE_componentWillUpdate == "function" && a.UNSAFE_componentWillUpdate(r, p, c)), typeof a.componentDidUpdate == "function" && (t.flags |= 4), typeof a.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), t.memoizedProps = r, t.memoizedState = p), a.props = r, a.state = p, a.context = c, r = u) : (typeof a.componentDidUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 4), typeof a.getSnapshotBeforeUpdate != "function" || o === e.memoizedProps && f === e.memoizedState || (t.flags |= 1024), r = !1);
		}
		return a = r, uc(e, t), r = (t.flags & 128) != 0, a || r ? (a = t.stateNode, n = r && typeof n.getDerivedStateFromError != "function" ? null : a.render(), t.flags |= 1, e !== null && r ? (t.child = Na(t, e.child, null, i), t.child = Na(t, null, n, i)) : ec(e, t, n, i), t.memoizedState = a.state, e = t.child) : e = Tc(e, t, i), e;
	}
	function mc(e, t, n, r) {
		return zi(), t.flags |= 256, ec(e, t, n, r), t.child;
	}
	var hc = {
		dehydrated: null,
		treeContext: null,
		retryLane: 0,
		hydrationErrors: null
	};
	function gc(e) {
		return {
			baseLanes: e,
			cachePool: ga()
		};
	}
	function _c(e, t, n) {
		return e = e === null ? 0 : e.childLanes & ~n, t && (e |= ql), e;
	}
	function vc(e, t, n) {
		var r = t.pendingProps, a = !1, o = (t.flags & 128) != 0, s;
		if ((s = o) || (s = e !== null && e.memoizedState === null ? !1 : (io.current & 2) != 0), s && (a = !0, t.flags &= -129), s = (t.flags & 32) != 0, t.flags &= -33, e === null) {
			if (H) {
				if (a ? $a(t) : no(t), (e = V) ? (e = rf(e, Ni), e = e !== null && e.data !== "&" ? e : null, e !== null && (t.memoizedState = {
					dehydrated: e,
					treeContext: Ci === null ? null : {
						id: wi,
						overflow: Ti
					},
					retryLane: 536870912,
					hydrationErrors: null
				}, n = pi(e), n.return = t, t.child = n, ji = t, V = null)) : e = null, e === null) throw Fi(t);
				return of(e) ? t.lanes = 32 : t.lanes = 536870912, null;
			}
			var c = r.children;
			return r = r.fallback, a ? (no(t), a = t.mode, c = bc({
				mode: "hidden",
				children: c
			}, a), r = di(r, a, n, null), c.return = t, r.return = t, c.sibling = r, t.child = c, r = t.child, r.memoizedState = gc(n), r.childLanes = _c(e, s, n), t.memoizedState = hc, ac(null, r)) : ($a(t), yc(t, c));
		}
		var l = e.memoizedState;
		if (l !== null && (c = l.dehydrated, c !== null)) {
			if (o) t.flags & 256 ? ($a(t), t.flags &= -257, t = xc(e, t, n)) : t.memoizedState === null ? (no(t), c = r.fallback, a = t.mode, r = bc({
				mode: "visible",
				children: r.children
			}, a), c = di(c, a, n, null), c.flags |= 2, r.return = t, c.return = t, r.sibling = c, t.child = r, Na(t, e.child, null, n), r = t.child, r.memoizedState = gc(n), r.childLanes = _c(e, s, n), t.memoizedState = hc, t = ac(null, r)) : (no(t), t.child = e.child, t.flags |= 128, t = null);
			else if ($a(t), of(c)) {
				if (s = c.nextSibling && c.nextSibling.dataset, s) var u = s.dgst;
				s = u, r = Error(i(419)), r.stack = "", r.digest = s, Vi({
					value: r,
					source: null,
					stack: null
				}), t = xc(e, t, n);
			} else if ($s || Yi(e, t, n, !1), s = (n & e.childLanes) !== 0, $s || s) {
				if (s = Ll, s !== null && (r = rt(s, n), r !== 0 && r !== l.retryLane)) throw l.retryLane = r, ti(e, r), mu(s, e, r), Qs;
				af(c) || Eu(), t = xc(e, t, n);
			} else af(c) ? (t.flags |= 192, t.child = e.child, t = null) : (e = l.treeContext, V = cf(c.nextSibling), ji = t, H = !0, Mi = null, Ni = !1, e !== null && Ai(t, e), t = yc(t, r.children), t.flags |= 4096);
			return t;
		}
		return a ? (no(t), c = r.fallback, a = t.mode, l = e.child, u = l.sibling, r = ci(l, {
			mode: "hidden",
			children: r.children
		}), r.subtreeFlags = l.subtreeFlags & 65011712, u === null ? (c = di(c, a, n, null), c.flags |= 2) : c = ci(u, c), c.return = t, r.return = t, r.sibling = c, t.child = r, ac(null, r), r = t.child, c = e.child.memoizedState, c === null ? c = gc(n) : (a = c.cachePool, a === null ? a = ga() : (l = W._currentValue, a = a.parent === l ? a : {
			parent: l,
			pool: l
		}), c = {
			baseLanes: c.baseLanes | n,
			cachePool: a
		}), r.memoizedState = c, r.childLanes = _c(e, s, n), t.memoizedState = hc, ac(e.child, r)) : ($a(t), n = e.child, e = n.sibling, n = ci(n, {
			mode: "visible",
			children: r.children
		}), n.return = t, n.sibling = null, e !== null && (s = t.deletions, s === null ? (t.deletions = [e], t.flags |= 16) : s.push(e)), t.child = n, t.memoizedState = null, n);
	}
	function yc(e, t) {
		return t = bc({
			mode: "visible",
			children: t
		}, e.mode), t.return = e, e.child = t;
	}
	function bc(e, t) {
		return e = oi(22, e, null, t), e.lanes = 0, e;
	}
	function xc(e, t, n) {
		return Na(t, e.child, null, n), e = yc(t, t.pendingProps.children), e.flags |= 2, t.memoizedState = null, e;
	}
	function Sc(e, t, n) {
		e.lanes |= t;
		var r = e.alternate;
		r !== null && (r.lanes |= t), qi(e.return, t, n);
	}
	function Cc(e, t, n, r, i, a) {
		var o = e.memoizedState;
		o === null ? e.memoizedState = {
			isBackwards: t,
			rendering: null,
			renderingStartTime: 0,
			last: r,
			tail: n,
			tailMode: i,
			treeForkCount: a
		} : (o.isBackwards = t, o.rendering = null, o.renderingStartTime = 0, o.last = r, o.tail = n, o.tailMode = i, o.treeForkCount = a);
	}
	function wc(e, t, n) {
		var r = t.pendingProps, i = r.revealOrder, a = r.tail;
		r = r.children;
		var o = io.current, s = (o & 2) != 0;
		if (s ? (o = o & 1 | 2, t.flags |= 128) : o &= 1, M(io, o), ec(e, t, r, n), r = H ? bi : 0, !s && e !== null && e.flags & 128) a: for (e = t.child; e !== null;) {
			if (e.tag === 13) e.memoizedState !== null && Sc(e, n, t);
			else if (e.tag === 19) Sc(e, n, t);
			else if (e.child !== null) {
				e.child.return = e, e = e.child;
				continue;
			}
			if (e === t) break a;
			for (; e.sibling === null;) {
				if (e.return === null || e.return === t) break a;
				e = e.return;
			}
			e.sibling.return = e.return, e = e.sibling;
		}
		switch (i) {
			case "forwards":
				for (n = t.child, i = null; n !== null;) e = n.alternate, e !== null && ao(e) === null && (i = n), n = n.sibling;
				n = i, n === null ? (i = t.child, t.child = null) : (i = n.sibling, n.sibling = null), Cc(t, !1, i, n, a, r);
				break;
			case "backwards":
			case "unstable_legacy-backwards":
				for (n = null, i = t.child, t.child = null; i !== null;) {
					if (e = i.alternate, e !== null && ao(e) === null) {
						t.child = i;
						break;
					}
					e = i.sibling, i.sibling = n, n = i, i = e;
				}
				Cc(t, !0, n, null, a, r);
				break;
			case "together":
				Cc(t, !1, null, null, void 0, r);
				break;
			default: t.memoizedState = null;
		}
		return t.child;
	}
	function Tc(e, t, n) {
		if (e !== null && (t.dependencies = e.dependencies), Wl |= t.lanes, (n & t.childLanes) === 0) if (e !== null) {
			if (Yi(e, t, n, !1), (n & t.childLanes) === 0) return null;
		} else return null;
		if (e !== null && t.child !== e.child) throw Error(i(153));
		if (t.child !== null) {
			for (e = t.child, n = ci(e, e.pendingProps), t.child = n, n.return = t; e.sibling !== null;) e = e.sibling, n = n.sibling = ci(e, e.pendingProps), n.return = t;
			n.sibling = null;
		}
		return t.child;
	}
	function Ec(e, t) {
		return (e.lanes & t) === 0 ? (e = e.dependencies, !!(e !== null && U(e))) : !0;
	}
	function Dc(e, t, n) {
		switch (t.tag) {
			case 3:
				he(t, t.stateNode.containerInfo), Gi(t, W, e.memoizedState.cache), zi();
				break;
			case 27:
			case 5:
				_e(t);
				break;
			case 4:
				he(t, t.stateNode.containerInfo);
				break;
			case 10:
				Gi(t, t.type, t.memoizedProps.value);
				break;
			case 31:
				if (t.memoizedState !== null) return t.flags |= 128, eo(t), null;
				break;
			case 13:
				var r = t.memoizedState;
				if (r !== null) return r.dehydrated === null ? (n & t.child.childLanes) === 0 ? ($a(t), e = Tc(e, t, n), e === null ? null : e.sibling) : vc(e, t, n) : ($a(t), t.flags |= 128, null);
				$a(t);
				break;
			case 19:
				var i = (e.flags & 128) != 0;
				if (r = (n & t.childLanes) !== 0, r ||= (Yi(e, t, n, !1), (n & t.childLanes) !== 0), i) {
					if (r) return wc(e, t, n);
					t.flags |= 128;
				}
				if (i = t.memoizedState, i !== null && (i.rendering = null, i.tail = null, i.lastEffect = null), M(io, io.current), r) break;
				return null;
			case 22: return t.lanes = 0, ic(e, t, n, t.pendingProps);
			case 24: Gi(t, W, e.memoizedState.cache);
		}
		return Tc(e, t, n);
	}
	function Oc(e, t, n) {
		if (e !== null) if (e.memoizedProps !== t.pendingProps) $s = !0;
		else {
			if (!Ec(e, n) && !(t.flags & 128)) return $s = !1, Dc(e, t, n);
			$s = !!(e.flags & 131072);
		}
		else $s = !1, H && t.flags & 1048576 && Di(t, bi, t.index);
		switch (t.lanes = 0, t.tag) {
			case 16:
				a: {
					var r = t.pendingProps;
					if (e = Ca(t.elementType), t.type = e, typeof e == "function") si(e) ? (r = Hs(e, r), t.tag = 1, t = pc(null, t, e, r, n)) : (t.tag = 0, t = dc(null, t, e, r, n));
					else {
						if (e != null) {
							var a = e.$$typeof;
							if (a === w) {
								t.tag = 11, t = tc(null, t, e, r, n);
								break a;
							} else if (a === D) {
								t.tag = 14, t = nc(null, t, e, r, n);
								break a;
							}
						}
						throw t = ie(e) || e, Error(i(306, t, ""));
					}
				}
				return t;
			case 0: return dc(e, t, t.type, t.pendingProps, n);
			case 1: return r = t.type, a = Hs(r, t.pendingProps), pc(e, t, r, a, n);
			case 3:
				a: {
					if (he(t, t.stateNode.containerInfo), e === null) throw Error(i(387));
					r = t.pendingProps;
					var o = t.memoizedState;
					a = o.element, La(e, t), Wa(t, r, null, n);
					var s = t.memoizedState;
					if (r = s.cache, Gi(t, W, r), r !== o.cache && Ji(t, [W], n, !0), Ua(), r = s.element, o.isDehydrated) if (o = {
						element: r,
						isDehydrated: !1,
						cache: s.cache
					}, t.updateQueue.baseState = o, t.memoizedState = o, t.flags & 256) {
						t = mc(e, t, r, n);
						break a;
					} else if (r !== a) {
						a = gi(Error(i(424)), t), Vi(a), t = mc(e, t, r, n);
						break a;
					} else {
						switch (e = t.stateNode.containerInfo, e.nodeType) {
							case 9:
								e = e.body;
								break;
							default: e = e.nodeName === "HTML" ? e.ownerDocument.body : e;
						}
						for (V = cf(e.firstChild), ji = t, H = !0, Mi = null, Ni = !0, n = Pa(t, null, r, n), t.child = n; n;) n.flags = n.flags & -3 | 4096, n = n.sibling;
					}
					else {
						if (zi(), r === a) {
							t = Tc(e, t, n);
							break a;
						}
						ec(e, t, r, n);
					}
					t = t.child;
				}
				return t;
			case 26: return uc(e, t), e === null ? (n = kf(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : H || (n = t.type, e = t.pendingProps, r = Bd(pe.current).createElement(n), r[lt] = t, r[I] = e, Pd(r, n, e), bt(r), t.stateNode = r) : t.memoizedState = kf(t.type, e.memoizedProps, t.pendingProps, e.memoizedState), null;
			case 27: return _e(t), e === null && H && (r = t.stateNode = ff(t.type, t.pendingProps, pe.current), ji = t, Ni = !0, a = V, Zd(t.type) ? (lf = a, V = cf(r.firstChild)) : V = a), ec(e, t, t.pendingProps.children, n), uc(e, t), e === null && (t.flags |= 4194304), t.child;
			case 5: return e === null && H && ((a = r = V) && (r = tf(r, t.type, t.pendingProps, Ni), r === null ? a = !1 : (t.stateNode = r, ji = t, V = cf(r.firstChild), Ni = !1, a = !0)), a || Fi(t)), _e(t), a = t.type, o = t.pendingProps, s = e === null ? null : e.memoizedProps, r = o.children, Ud(a, o) ? r = null : s !== null && Ud(a, s) && (t.flags |= 32), t.memoizedState !== null && (a = vo(e, t, xo, null, null, n), Qf._currentValue = a), uc(e, t), ec(e, t, r, n), t.child;
			case 6: return e === null && H && ((e = n = V) && (n = nf(n, t.pendingProps, Ni), n === null ? e = !1 : (t.stateNode = n, ji = t, V = null, e = !0)), e || Fi(t)), null;
			case 13: return vc(e, t, n);
			case 4: return he(t, t.stateNode.containerInfo), r = t.pendingProps, e === null ? t.child = Na(t, null, r, n) : ec(e, t, r, n), t.child;
			case 11: return tc(e, t, t.type, t.pendingProps, n);
			case 7: return ec(e, t, t.pendingProps, n), t.child;
			case 8: return ec(e, t, t.pendingProps.children, n), t.child;
			case 12: return ec(e, t, t.pendingProps.children, n), t.child;
			case 10: return r = t.pendingProps, Gi(t, t.type, r.value), ec(e, t, r.children, n), t.child;
			case 9: return a = t.type._context, r = t.pendingProps.children, Xi(t), a = Zi(a), r = r(a), t.flags |= 1, ec(e, t, r, n), t.child;
			case 14: return nc(e, t, t.type, t.pendingProps, n);
			case 15: return rc(e, t, t.type, t.pendingProps, n);
			case 19: return wc(e, t, n);
			case 31: return lc(e, t, n);
			case 22: return ic(e, t, n, t.pendingProps);
			case 24: return Xi(t), r = Zi(W), e === null ? (a = ma(), a === null && (a = Ll, o = ra(), a.pooledCache = o, o.refCount++, o !== null && (a.pooledCacheLanes |= n), a = o), t.memoizedState = {
				parent: r,
				cache: a
			}, Ia(t), Gi(t, W, a)) : ((e.lanes & n) !== 0 && (La(e, t), Wa(t, null, null, n), Ua()), a = e.memoizedState, o = t.memoizedState, a.parent === r ? (r = o.cache, Gi(t, W, r), r !== a.cache && Ji(t, [W], n, !0)) : (a = {
				parent: r,
				cache: r
			}, t.memoizedState = a, t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = a), Gi(t, W, r))), ec(e, t, t.pendingProps.children, n), t.child;
			case 29: throw t.pendingProps;
		}
		throw Error(i(156, t.tag));
	}
	function kc(e) {
		e.flags |= 4;
	}
	function Ac(e, t, n, r, i) {
		if ((t = (e.mode & 32) != 0) && (t = !1), t) {
			if (e.flags |= 16777216, (i & 335544128) === i) if (e.stateNode.complete) e.flags |= 8192;
			else if (Cu()) e.flags |= 8192;
			else throw wa = ba, va;
		} else e.flags &= -16777217;
	}
	function jc(e, t) {
		if (t.type !== "stylesheet" || t.state.loading & 4) e.flags &= -16777217;
		else if (e.flags |= 16777216, !Wf(t)) if (Cu()) e.flags |= 8192;
		else throw wa = ba, va;
	}
	function Mc(e, t) {
		t !== null && (e.flags |= 4), e.flags & 16384 && (t = e.tag === 22 ? 536870912 : Ze(), e.lanes |= t, Jl |= t);
	}
	function Nc(e, t) {
		if (!H) switch (e.tailMode) {
			case "hidden":
				t = e.tail;
				for (var n = null; t !== null;) t.alternate !== null && (n = t), t = t.sibling;
				n === null ? e.tail = null : n.sibling = null;
				break;
			case "collapsed":
				n = e.tail;
				for (var r = null; n !== null;) n.alternate !== null && (r = n), n = n.sibling;
				r === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : r.sibling = null;
		}
	}
	function Pc(e) {
		var t = e.alternate !== null && e.alternate.child === e.child, n = 0, r = 0;
		if (t) for (var i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags & 65011712, r |= i.flags & 65011712, i.return = e, i = i.sibling;
		else for (i = e.child; i !== null;) n |= i.lanes | i.childLanes, r |= i.subtreeFlags, r |= i.flags, i.return = e, i = i.sibling;
		return e.subtreeFlags |= r, e.childLanes = n, t;
	}
	function Fc(e, t, n) {
		var r = t.pendingProps;
		switch (ki(t), t.tag) {
			case 16:
			case 15:
			case 0:
			case 11:
			case 7:
			case 8:
			case 12:
			case 9:
			case 14: return Pc(t), null;
			case 1: return Pc(t), null;
			case 3: return n = t.stateNode, r = null, e !== null && (r = e.memoizedState.cache), t.memoizedState.cache !== r && (t.flags |= 2048), Ki(W), ge(), n.pendingContext && (n.context = n.pendingContext, n.pendingContext = null), (e === null || e.child === null) && (Ri(t) ? kc(t) : e === null || e.memoizedState.isDehydrated && !(t.flags & 256) || (t.flags |= 1024, Bi())), Pc(t), null;
			case 26:
				var a = t.type, o = t.memoizedState;
				return e === null ? (kc(t), o === null ? (Pc(t), Ac(t, a, null, r, n)) : (Pc(t), jc(t, o))) : o ? o === e.memoizedState ? (Pc(t), t.flags &= -16777217) : (kc(t), Pc(t), jc(t, o)) : (e = e.memoizedProps, e !== r && kc(t), Pc(t), Ac(t, a, e, r, n)), null;
			case 27:
				if (ve(t), n = pe.current, a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && kc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Pc(t), null;
					}
					e = de.current, Ri(t) ? Ii(t, e) : (e = ff(a, r, n), t.stateNode = e, kc(t));
				}
				return Pc(t), null;
			case 5:
				if (ve(t), a = t.type, e !== null && t.stateNode != null) e.memoizedProps !== r && kc(t);
				else {
					if (!r) {
						if (t.stateNode === null) throw Error(i(166));
						return Pc(t), null;
					}
					if (o = de.current, Ri(t)) Ii(t, o);
					else {
						var s = Bd(pe.current);
						switch (o) {
							case 1:
								o = s.createElementNS("http://www.w3.org/2000/svg", a);
								break;
							case 2:
								o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
								break;
							default: switch (a) {
								case "svg":
									o = s.createElementNS("http://www.w3.org/2000/svg", a);
									break;
								case "math":
									o = s.createElementNS("http://www.w3.org/1998/Math/MathML", a);
									break;
								case "script":
									o = s.createElement("div"), o.innerHTML = "<script><\/script>", o = o.removeChild(o.firstChild);
									break;
								case "select":
									o = typeof r.is == "string" ? s.createElement("select", { is: r.is }) : s.createElement("select"), r.multiple ? o.multiple = !0 : r.size && (o.size = r.size);
									break;
								default: o = typeof r.is == "string" ? s.createElement(a, { is: r.is }) : s.createElement(a);
							}
						}
						o[lt] = t, o[I] = r;
						a: for (s = t.child; s !== null;) {
							if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
							else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
								s.child.return = s, s = s.child;
								continue;
							}
							if (s === t) break a;
							for (; s.sibling === null;) {
								if (s.return === null || s.return === t) break a;
								s = s.return;
							}
							s.sibling.return = s.return, s = s.sibling;
						}
						t.stateNode = o;
						a: switch (Pd(o, a, r), a) {
							case "button":
							case "input":
							case "select":
							case "textarea":
								r = !!r.autoFocus;
								break a;
							case "img":
								r = !0;
								break a;
							default: r = !1;
						}
						r && kc(t);
					}
				}
				return Pc(t), Ac(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n), null;
			case 6:
				if (e && t.stateNode != null) e.memoizedProps !== r && kc(t);
				else {
					if (typeof r != "string" && t.stateNode === null) throw Error(i(166));
					if (e = pe.current, Ri(t)) {
						if (e = t.stateNode, n = t.memoizedProps, r = null, a = ji, a !== null) switch (a.tag) {
							case 27:
							case 5: r = a.memoizedProps;
						}
						e[lt] = t, e = !!(e.nodeValue === n || r !== null && !0 === r.suppressHydrationWarning || jd(e.nodeValue, n)), e || Fi(t, !0);
					} else e = Bd(e).createTextNode(r), e[lt] = t, t.stateNode = e;
				}
				return Pc(t), null;
			case 31:
				if (n = t.memoizedState, e === null || e.memoizedState !== null) {
					if (r = Ri(t), n !== null) {
						if (e === null) {
							if (!r) throw Error(i(318));
							if (e = t.memoizedState, e = e === null ? null : e.dehydrated, !e) throw Error(i(557));
							e[lt] = t;
						} else zi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Pc(t), e = !1;
					} else n = Bi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n), e = !0;
					if (!e) return t.flags & 256 ? (ro(t), t) : (ro(t), null);
					if (t.flags & 128) throw Error(i(558));
				}
				return Pc(t), null;
			case 13:
				if (r = t.memoizedState, e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
					if (a = Ri(t), r !== null && r.dehydrated !== null) {
						if (e === null) {
							if (!a) throw Error(i(318));
							if (a = t.memoizedState, a = a === null ? null : a.dehydrated, !a) throw Error(i(317));
							a[lt] = t;
						} else zi(), !(t.flags & 128) && (t.memoizedState = null), t.flags |= 4;
						Pc(t), a = !1;
					} else a = Bi(), e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = a), a = !0;
					if (!a) return t.flags & 256 ? (ro(t), t) : (ro(t), null);
				}
				return ro(t), t.flags & 128 ? (t.lanes = n, t) : (n = r !== null, e = e !== null && e.memoizedState !== null, n && (r = t.child, a = null, r.alternate !== null && r.alternate.memoizedState !== null && r.alternate.memoizedState.cachePool !== null && (a = r.alternate.memoizedState.cachePool.pool), o = null, r.memoizedState !== null && r.memoizedState.cachePool !== null && (o = r.memoizedState.cachePool.pool), o !== a && (r.flags |= 2048)), n !== e && n && (t.child.flags |= 8192), Mc(t, t.updateQueue), Pc(t), null);
			case 4: return ge(), e === null && xd(t.stateNode.containerInfo), Pc(t), null;
			case 10: return Ki(t.type), Pc(t), null;
			case 19:
				if (ue(io), r = t.memoizedState, r === null) return Pc(t), null;
				if (a = (t.flags & 128) != 0, o = r.rendering, o === null) if (a) Nc(r, !1);
				else {
					if (Ul !== 0 || e !== null && e.flags & 128) for (e = t.child; e !== null;) {
						if (o = ao(e), o !== null) {
							for (t.flags |= 128, Nc(r, !1), e = o.updateQueue, t.updateQueue = e, Mc(t, e), t.subtreeFlags = 0, e = n, n = t.child; n !== null;) li(n, e), n = n.sibling;
							return M(io, io.current & 1 | 2), H && Ei(t, r.treeForkCount), t.child;
						}
						e = e.sibling;
					}
					r.tail !== null && Ae() > eu && (t.flags |= 128, a = !0, Nc(r, !1), t.lanes = 4194304);
				}
				else {
					if (!a) if (e = ao(o), e !== null) {
						if (t.flags |= 128, a = !0, e = e.updateQueue, t.updateQueue = e, Mc(t, e), Nc(r, !0), r.tail === null && r.tailMode === "hidden" && !o.alternate && !H) return Pc(t), null;
					} else 2 * Ae() - r.renderingStartTime > eu && n !== 536870912 && (t.flags |= 128, a = !0, Nc(r, !1), t.lanes = 4194304);
					r.isBackwards ? (o.sibling = t.child, t.child = o) : (e = r.last, e === null ? t.child = o : e.sibling = o, r.last = o);
				}
				return r.tail === null ? (Pc(t), null) : (e = r.tail, r.rendering = e, r.tail = e.sibling, r.renderingStartTime = Ae(), e.sibling = null, n = io.current, M(io, a ? n & 1 | 2 : n & 1), H && Ei(t, r.treeForkCount), e);
			case 22:
			case 23: return ro(t), Xa(), r = t.memoizedState !== null, e === null ? r && (t.flags |= 8192) : e.memoizedState !== null !== r && (t.flags |= 8192), r ? n & 536870912 && !(t.flags & 128) && (Pc(t), t.subtreeFlags & 6 && (t.flags |= 8192)) : Pc(t), n = t.updateQueue, n !== null && Mc(t, n.retryQueue), n = null, e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), r = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (r = t.memoizedState.cachePool.pool), r !== n && (t.flags |= 2048), e !== null && ue(pa), null;
			case 24: return n = null, e !== null && (n = e.memoizedState.cache), t.memoizedState.cache !== n && (t.flags |= 2048), Ki(W), Pc(t), null;
			case 25: return null;
			case 30: return null;
		}
		throw Error(i(156, t.tag));
	}
	function Ic(e, t) {
		switch (ki(t), t.tag) {
			case 1: return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 3: return Ki(W), ge(), e = t.flags, e & 65536 && !(e & 128) ? (t.flags = e & -65537 | 128, t) : null;
			case 26:
			case 27:
			case 5: return ve(t), null;
			case 31:
				if (t.memoizedState !== null) {
					if (ro(t), t.alternate === null) throw Error(i(340));
					zi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 13:
				if (ro(t), e = t.memoizedState, e !== null && e.dehydrated !== null) {
					if (t.alternate === null) throw Error(i(340));
					zi();
				}
				return e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 19: return ue(io), null;
			case 4: return ge(), null;
			case 10: return Ki(t.type), null;
			case 22:
			case 23: return ro(t), Xa(), e !== null && ue(pa), e = t.flags, e & 65536 ? (t.flags = e & -65537 | 128, t) : null;
			case 24: return Ki(W), null;
			case 25: return null;
			default: return null;
		}
	}
	function Lc(e, t) {
		switch (ki(t), t.tag) {
			case 3:
				Ki(W), ge();
				break;
			case 26:
			case 27:
			case 5:
				ve(t);
				break;
			case 4:
				ge();
				break;
			case 31:
				t.memoizedState !== null && ro(t);
				break;
			case 13:
				ro(t);
				break;
			case 19:
				ue(io);
				break;
			case 10:
				Ki(t.type);
				break;
			case 22:
			case 23:
				ro(t), Xa(), e !== null && ue(pa);
				break;
			case 24: Ki(W);
		}
	}
	function Rc(e, t) {
		try {
			var n = t.updateQueue, r = n === null ? null : n.lastEffect;
			if (r !== null) {
				var i = r.next;
				n = i;
				do {
					if ((n.tag & e) === e) {
						r = void 0;
						var a = n.create, o = n.inst;
						r = a(), o.destroy = r;
					}
					n = n.next;
				} while (n !== i);
			}
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function zc(e, t, n) {
		try {
			var r = t.updateQueue, i = r === null ? null : r.lastEffect;
			if (i !== null) {
				var a = i.next;
				r = a;
				do {
					if ((r.tag & e) === e) {
						var o = r.inst, s = o.destroy;
						if (s !== void 0) {
							o.destroy = void 0, i = t;
							var c = n, l = s;
							try {
								l();
							} catch (e) {
								Q(i, c, e);
							}
						}
					}
					r = r.next;
				} while (r !== a);
			}
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function Bc(e) {
		var t = e.updateQueue;
		if (t !== null) {
			var n = e.stateNode;
			try {
				Ka(t, n);
			} catch (t) {
				Q(e, e.return, t);
			}
		}
	}
	function Vc(e, t, n) {
		n.props = Hs(e.type, e.memoizedProps), n.state = e.memoizedState;
		try {
			n.componentWillUnmount();
		} catch (n) {
			Q(e, t, n);
		}
	}
	function Hc(e, t) {
		try {
			var n = e.ref;
			if (n !== null) {
				switch (e.tag) {
					case 26:
					case 27:
					case 5:
						var r = e.stateNode;
						break;
					case 30:
						r = e.stateNode;
						break;
					default: r = e.stateNode;
				}
				typeof n == "function" ? e.refCleanup = n(r) : n.current = r;
			}
		} catch (n) {
			Q(e, t, n);
		}
	}
	function Uc(e, t) {
		var n = e.ref, r = e.refCleanup;
		if (n !== null) if (typeof r == "function") try {
			r();
		} catch (n) {
			Q(e, t, n);
		} finally {
			e.refCleanup = null, e = e.alternate, e != null && (e.refCleanup = null);
		}
		else if (typeof n == "function") try {
			n(null);
		} catch (n) {
			Q(e, t, n);
		}
		else n.current = null;
	}
	function Wc(e) {
		var t = e.type, n = e.memoizedProps, r = e.stateNode;
		try {
			a: switch (t) {
				case "button":
				case "input":
				case "select":
				case "textarea":
					n.autoFocus && r.focus();
					break a;
				case "img": n.src ? r.src = n.src : n.srcSet && (r.srcset = n.srcSet);
			}
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	function Gc(e, t, n) {
		try {
			var r = e.stateNode;
			Fd(r, e.type, n, t), r[I] = t;
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	function Kc(e) {
		return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Zd(e.type) || e.tag === 4;
	}
	function qc(e) {
		a: for (;;) {
			for (; e.sibling === null;) {
				if (e.return === null || Kc(e.return)) return null;
				e = e.return;
			}
			for (e.sibling.return = e.return, e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18;) {
				if (e.tag === 27 && Zd(e.type) || e.flags & 2 || e.child === null || e.tag === 4) continue a;
				e.child.return = e, e = e.child;
			}
			if (!(e.flags & 2)) return e.stateNode;
		}
	}
	function Jc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n, t.appendChild(e), n = n._reactRootContainer, n != null || t.onclick !== null || (t.onclick = $t));
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode, t = null), e = e.child, e !== null)) for (Jc(e, t, n), e = e.sibling; e !== null;) Jc(e, t, n), e = e.sibling;
	}
	function Yc(e, t, n) {
		var r = e.tag;
		if (r === 5 || r === 6) e = e.stateNode, t ? n.insertBefore(e, t) : n.appendChild(e);
		else if (r !== 4 && (r === 27 && Zd(e.type) && (n = e.stateNode), e = e.child, e !== null)) for (Yc(e, t, n), e = e.sibling; e !== null;) Yc(e, t, n), e = e.sibling;
	}
	function Xc(e) {
		var t = e.stateNode, n = e.memoizedProps;
		try {
			for (var r = e.type, i = t.attributes; i.length;) t.removeAttributeNode(i[0]);
			Pd(t, r, n), t[lt] = e, t[I] = n;
		} catch (t) {
			Q(e, e.return, t);
		}
	}
	var Zc = !1, Qc = !1, $c = !1, el = typeof WeakSet == "function" ? WeakSet : Set, tl = null;
	function nl(e, t) {
		if (e = e.containerInfo, Rd = sp, e = Tr(e), Er(e)) {
			if ("selectionStart" in e) var n = {
				start: e.selectionStart,
				end: e.selectionEnd
			};
			else a: {
				n = (n = e.ownerDocument) && n.defaultView || window;
				var r = n.getSelection && n.getSelection();
				if (r && r.rangeCount !== 0) {
					n = r.anchorNode;
					var a = r.anchorOffset, o = r.focusNode;
					r = r.focusOffset;
					try {
						n.nodeType, o.nodeType;
					} catch {
						n = null;
						break a;
					}
					var s = 0, c = -1, l = -1, u = 0, d = 0, f = e, p = null;
					b: for (;;) {
						for (var m; f !== n || a !== 0 && f.nodeType !== 3 || (c = s + a), f !== o || r !== 0 && f.nodeType !== 3 || (l = s + r), f.nodeType === 3 && (s += f.nodeValue.length), (m = f.firstChild) !== null;) p = f, f = m;
						for (;;) {
							if (f === e) break b;
							if (p === n && ++u === a && (c = s), p === o && ++d === r && (l = s), (m = f.nextSibling) !== null) break;
							f = p, p = f.parentNode;
						}
						f = m;
					}
					n = c === -1 || l === -1 ? null : {
						start: c,
						end: l
					};
				} else n = null;
			}
			n ||= {
				start: 0,
				end: 0
			};
		} else n = null;
		for (zd = {
			focusedElem: e,
			selectionRange: n
		}, sp = !1, tl = t; tl !== null;) if (t = tl, e = t.child, t.subtreeFlags & 1028 && e !== null) e.return = t, tl = e;
		else for (; tl !== null;) {
			switch (t = tl, o = t.alternate, e = t.flags, t.tag) {
				case 0:
					if (e & 4 && (e = t.updateQueue, e = e === null ? null : e.events, e !== null)) for (n = 0; n < e.length; n++) a = e[n], a.ref.impl = a.nextImpl;
					break;
				case 11:
				case 15: break;
				case 1:
					if (e & 1024 && o !== null) {
						e = void 0, n = t, a = o.memoizedProps, o = o.memoizedState, r = n.stateNode;
						try {
							var h = Hs(n.type, a);
							e = r.getSnapshotBeforeUpdate(h, o), r.__reactInternalSnapshotBeforeUpdate = e;
						} catch (e) {
							Q(n, n.return, e);
						}
					}
					break;
				case 3:
					if (e & 1024) {
						if (e = t.stateNode.containerInfo, n = e.nodeType, n === 9) ef(e);
						else if (n === 1) switch (e.nodeName) {
							case "HEAD":
							case "HTML":
							case "BODY":
								ef(e);
								break;
							default: e.textContent = "";
						}
					}
					break;
				case 5:
				case 26:
				case 27:
				case 6:
				case 4:
				case 17: break;
				default: if (e & 1024) throw Error(i(163));
			}
			if (e = t.sibling, e !== null) {
				e.return = t.return, tl = e;
				break;
			}
			tl = t.return;
		}
	}
	function rl(e, t, n) {
		var r = n.flags;
		switch (n.tag) {
			case 0:
			case 11:
			case 15:
				vl(e, n), r & 4 && Rc(5, n);
				break;
			case 1:
				if (vl(e, n), r & 4) if (e = n.stateNode, t === null) try {
					e.componentDidMount();
				} catch (e) {
					Q(n, n.return, e);
				}
				else {
					var i = Hs(n.type, t.memoizedProps);
					t = t.memoizedState;
					try {
						e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate);
					} catch (e) {
						Q(n, n.return, e);
					}
				}
				r & 64 && Bc(n), r & 512 && Hc(n, n.return);
				break;
			case 3:
				if (vl(e, n), r & 64 && (e = n.updateQueue, e !== null)) {
					if (t = null, n.child !== null) switch (n.child.tag) {
						case 27:
						case 5:
							t = n.child.stateNode;
							break;
						case 1: t = n.child.stateNode;
					}
					try {
						Ka(e, t);
					} catch (e) {
						Q(n, n.return, e);
					}
				}
				break;
			case 27: t === null && r & 4 && Xc(n);
			case 26:
			case 5:
				vl(e, n), t === null && r & 4 && Wc(n), r & 512 && Hc(n, n.return);
				break;
			case 12:
				vl(e, n);
				break;
			case 31:
				vl(e, n), r & 4 && ll(e, n);
				break;
			case 13:
				vl(e, n), r & 4 && ul(e, n), r & 64 && (e = n.memoizedState, e !== null && (e = e.dehydrated, e !== null && (n = qu.bind(null, n), sf(e, n))));
				break;
			case 22:
				if (r = n.memoizedState !== null || Zc, !r) {
					t = t !== null && t.memoizedState !== null || Qc, i = Zc;
					var a = Qc;
					Zc = r, (Qc = t) && !a ? bl(e, n, (n.subtreeFlags & 8772) != 0) : vl(e, n), Zc = i, Qc = a;
				}
				break;
			case 30: break;
			default: vl(e, n);
		}
	}
	function il(e) {
		var t = e.alternate;
		t !== null && (e.alternate = null, il(t)), e.child = null, e.deletions = null, e.sibling = null, e.tag === 5 && (t = e.stateNode, t !== null && gt(t)), e.stateNode = null, e.return = null, e.dependencies = null, e.memoizedProps = null, e.memoizedState = null, e.pendingProps = null, e.stateNode = null, e.updateQueue = null;
	}
	var al = null, ol = !1;
	function sl(e, t, n) {
		for (n = n.child; n !== null;) cl(e, t, n), n = n.sibling;
	}
	function cl(e, t, n) {
		if (Be && typeof Be.onCommitFiberUnmount == "function") try {
			Be.onCommitFiberUnmount(ze, n);
		} catch {}
		switch (n.tag) {
			case 26:
				Qc || Uc(n, t), sl(e, t, n), n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode, n.parentNode.removeChild(n));
				break;
			case 27:
				Qc || Uc(n, t);
				var r = al, i = ol;
				Zd(n.type) && (al = n.stateNode, ol = !1), sl(e, t, n), pf(n.stateNode), al = r, ol = i;
				break;
			case 5: Qc || Uc(n, t);
			case 6:
				if (r = al, i = ol, al = null, sl(e, t, n), al = r, ol = i, al !== null) if (ol) try {
					(al.nodeType === 9 ? al.body : al.nodeName === "HTML" ? al.ownerDocument.body : al).removeChild(n.stateNode);
				} catch (e) {
					Q(n, t, e);
				}
				else try {
					al.removeChild(n.stateNode);
				} catch (e) {
					Q(n, t, e);
				}
				break;
			case 18:
				al !== null && (ol ? (e = al, Qd(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode), Np(e)) : Qd(al, n.stateNode));
				break;
			case 4:
				r = al, i = ol, al = n.stateNode.containerInfo, ol = !0, sl(e, t, n), al = r, ol = i;
				break;
			case 0:
			case 11:
			case 14:
			case 15:
				zc(2, n, t), Qc || zc(4, n, t), sl(e, t, n);
				break;
			case 1:
				Qc || (Uc(n, t), r = n.stateNode, typeof r.componentWillUnmount == "function" && Vc(n, t, r)), sl(e, t, n);
				break;
			case 21:
				sl(e, t, n);
				break;
			case 22:
				Qc = (r = Qc) || n.memoizedState !== null, sl(e, t, n), Qc = r;
				break;
			default: sl(e, t, n);
		}
	}
	function ll(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null))) {
			e = e.dehydrated;
			try {
				Np(e);
			} catch (e) {
				Q(t, t.return, e);
			}
		}
	}
	function ul(e, t) {
		if (t.memoizedState === null && (e = t.alternate, e !== null && (e = e.memoizedState, e !== null && (e = e.dehydrated, e !== null)))) try {
			Np(e);
		} catch (e) {
			Q(t, t.return, e);
		}
	}
	function dl(e) {
		switch (e.tag) {
			case 31:
			case 13:
			case 19:
				var t = e.stateNode;
				return t === null && (t = e.stateNode = new el()), t;
			case 22: return e = e.stateNode, t = e._retryCache, t === null && (t = e._retryCache = new el()), t;
			default: throw Error(i(435, e.tag));
		}
	}
	function fl(e, t) {
		var n = dl(e);
		t.forEach(function(t) {
			if (!n.has(t)) {
				n.add(t);
				var r = Ju.bind(null, e, t);
				t.then(r, r);
			}
		});
	}
	function pl(e, t) {
		var n = t.deletions;
		if (n !== null) for (var r = 0; r < n.length; r++) {
			var a = n[r], o = e, s = t, c = s;
			a: for (; c !== null;) {
				switch (c.tag) {
					case 27:
						if (Zd(c.type)) {
							al = c.stateNode, ol = !1;
							break a;
						}
						break;
					case 5:
						al = c.stateNode, ol = !1;
						break a;
					case 3:
					case 4:
						al = c.stateNode.containerInfo, ol = !0;
						break a;
				}
				c = c.return;
			}
			if (al === null) throw Error(i(160));
			cl(o, s, a), al = null, ol = !1, o = a.alternate, o !== null && (o.return = null), a.return = null;
		}
		if (t.subtreeFlags & 13886) for (t = t.child; t !== null;) hl(t, e), t = t.sibling;
	}
	var ml = null;
	function hl(e, t) {
		var n = e.alternate, r = e.flags;
		switch (e.tag) {
			case 0:
			case 11:
			case 14:
			case 15:
				pl(t, e), gl(e), r & 4 && (zc(3, e, e.return), Rc(3, e), zc(5, e, e.return));
				break;
			case 1:
				pl(t, e), gl(e), r & 512 && (Qc || n === null || Uc(n, n.return)), r & 64 && Zc && (e = e.updateQueue, e !== null && (r = e.callbacks, r !== null && (n = e.shared.hiddenCallbacks, e.shared.hiddenCallbacks = n === null ? r : n.concat(r))));
				break;
			case 26:
				var a = ml;
				if (pl(t, e), gl(e), r & 512 && (Qc || n === null || Uc(n, n.return)), r & 4) {
					var o = n === null ? null : n.memoizedState;
					if (r = e.memoizedState, n === null) if (r === null) if (e.stateNode === null) {
						a: {
							r = e.type, n = e.memoizedProps, a = a.ownerDocument || a;
							b: switch (r) {
								case "title":
									o = a.getElementsByTagName("title")[0], (!o || o[ht] || o[lt] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = a.createElement(r), a.head.insertBefore(o, a.querySelector("head > title"))), Pd(o, r, n), o[lt] = e, bt(o), r = o;
									break a;
								case "link":
									var s = Vf("link", "href", a).get(r + (n.href || ""));
									if (s) {
										for (var c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								case "meta":
									if (s = Vf("meta", "content", a).get(r + (n.content || ""))) {
										for (c = 0; c < s.length; c++) if (o = s[c], o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
											s.splice(c, 1);
											break b;
										}
									}
									o = a.createElement(r), Pd(o, r, n), a.head.appendChild(o);
									break;
								default: throw Error(i(468, r));
							}
							o[lt] = e, bt(o), r = o;
						}
						e.stateNode = r;
					} else Hf(a, e.type, e.stateNode);
					else e.stateNode = If(a, r, e.memoizedProps);
					else o === r ? r === null && e.stateNode !== null && Gc(e, e.memoizedProps, n.memoizedProps) : (o === null ? n.stateNode !== null && (n = n.stateNode, n.parentNode.removeChild(n)) : o.count--, r === null ? Hf(a, e.type, e.stateNode) : If(a, r, e.memoizedProps));
				}
				break;
			case 27:
				pl(t, e), gl(e), r & 512 && (Qc || n === null || Uc(n, n.return)), n !== null && r & 4 && Gc(e, e.memoizedProps, n.memoizedProps);
				break;
			case 5:
				if (pl(t, e), gl(e), r & 512 && (Qc || n === null || Uc(n, n.return)), e.flags & 32) {
					a = e.stateNode;
					try {
						R(a, "");
					} catch (t) {
						Q(e, e.return, t);
					}
				}
				r & 4 && e.stateNode != null && (a = e.memoizedProps, Gc(e, a, n === null ? a : n.memoizedProps)), r & 1024 && ($c = !0);
				break;
			case 6:
				if (pl(t, e), gl(e), r & 4) {
					if (e.stateNode === null) throw Error(i(162));
					r = e.memoizedProps, n = e.stateNode;
					try {
						n.nodeValue = r;
					} catch (t) {
						Q(e, e.return, t);
					}
				}
				break;
			case 3:
				if (Bf = null, a = ml, ml = gf(t.containerInfo), pl(t, e), ml = a, gl(e), r & 4 && n !== null && n.memoizedState.isDehydrated) try {
					Np(t.containerInfo);
				} catch (t) {
					Q(e, e.return, t);
				}
				$c && ($c = !1, _l(e));
				break;
			case 4:
				r = ml, ml = gf(e.stateNode.containerInfo), pl(t, e), gl(e), ml = r;
				break;
			case 12:
				pl(t, e), gl(e);
				break;
			case 31:
				pl(t, e), gl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, fl(e, r)));
				break;
			case 13:
				pl(t, e), gl(e), e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && (Ql = Ae()), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, fl(e, r)));
				break;
			case 22:
				a = e.memoizedState !== null;
				var l = n !== null && n.memoizedState !== null, u = Zc, d = Qc;
				if (Zc = u || a, Qc = d || l, pl(t, e), Qc = d, Zc = u, gl(e), r & 8192) a: for (t = e.stateNode, t._visibility = a ? t._visibility & -2 : t._visibility | 1, a && (n === null || l || Zc || Qc || yl(e)), n = null, t = e;;) {
					if (t.tag === 5 || t.tag === 26) {
						if (n === null) {
							l = n = t;
							try {
								if (o = l.stateNode, a) s = o.style, typeof s.setProperty == "function" ? s.setProperty("display", "none", "important") : s.display = "none";
								else {
									c = l.stateNode;
									var f = l.memoizedProps.style, p = f != null && f.hasOwnProperty("display") ? f.display : null;
									c.style.display = p == null || typeof p == "boolean" ? "" : ("" + p).trim();
								}
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if (t.tag === 6) {
						if (n === null) {
							l = t;
							try {
								l.stateNode.nodeValue = a ? "" : l.memoizedProps;
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if (t.tag === 18) {
						if (n === null) {
							l = t;
							try {
								var m = l.stateNode;
								a ? $d(m, !0) : $d(l.stateNode, !1);
							} catch (e) {
								Q(l, l.return, e);
							}
						}
					} else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
						t.child.return = t, t = t.child;
						continue;
					}
					if (t === e) break a;
					for (; t.sibling === null;) {
						if (t.return === null || t.return === e) break a;
						n === t && (n = null), t = t.return;
					}
					n === t && (n = null), t.sibling.return = t.return, t = t.sibling;
				}
				r & 4 && (r = e.updateQueue, r !== null && (n = r.retryQueue, n !== null && (r.retryQueue = null, fl(e, n))));
				break;
			case 19:
				pl(t, e), gl(e), r & 4 && (r = e.updateQueue, r !== null && (e.updateQueue = null, fl(e, r)));
				break;
			case 30: break;
			case 21: break;
			default: pl(t, e), gl(e);
		}
	}
	function gl(e) {
		var t = e.flags;
		if (t & 2) {
			try {
				for (var n, r = e.return; r !== null;) {
					if (Kc(r)) {
						n = r;
						break;
					}
					r = r.return;
				}
				if (n == null) throw Error(i(160));
				switch (n.tag) {
					case 27:
						var a = n.stateNode;
						Yc(e, qc(e), a);
						break;
					case 5:
						var o = n.stateNode;
						n.flags & 32 && (R(o, ""), n.flags &= -33), Yc(e, qc(e), o);
						break;
					case 3:
					case 4:
						var s = n.stateNode.containerInfo;
						Jc(e, qc(e), s);
						break;
					default: throw Error(i(161));
				}
			} catch (t) {
				Q(e, e.return, t);
			}
			e.flags &= -3;
		}
		t & 4096 && (e.flags &= -4097);
	}
	function _l(e) {
		if (e.subtreeFlags & 1024) for (e = e.child; e !== null;) {
			var t = e;
			_l(t), t.tag === 5 && t.flags & 1024 && t.stateNode.reset(), e = e.sibling;
		}
	}
	function vl(e, t) {
		if (t.subtreeFlags & 8772) for (t = t.child; t !== null;) rl(e, t.alternate, t), t = t.sibling;
	}
	function yl(e) {
		for (e = e.child; e !== null;) {
			var t = e;
			switch (t.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					zc(4, t, t.return), yl(t);
					break;
				case 1:
					Uc(t, t.return);
					var n = t.stateNode;
					typeof n.componentWillUnmount == "function" && Vc(t, t.return, n), yl(t);
					break;
				case 27: pf(t.stateNode);
				case 26:
				case 5:
					Uc(t, t.return), yl(t);
					break;
				case 22:
					t.memoizedState === null && yl(t);
					break;
				case 30:
					yl(t);
					break;
				default: yl(t);
			}
			e = e.sibling;
		}
	}
	function bl(e, t, n) {
		for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null;) {
			var r = t.alternate, i = e, a = t, o = a.flags;
			switch (a.tag) {
				case 0:
				case 11:
				case 15:
					bl(i, a, n), Rc(4, a);
					break;
				case 1:
					if (bl(i, a, n), r = a, i = r.stateNode, typeof i.componentDidMount == "function") try {
						i.componentDidMount();
					} catch (e) {
						Q(r, r.return, e);
					}
					if (r = a, i = r.updateQueue, i !== null) {
						var s = r.stateNode;
						try {
							var c = i.shared.hiddenCallbacks;
							if (c !== null) for (i.shared.hiddenCallbacks = null, i = 0; i < c.length; i++) Ga(c[i], s);
						} catch (e) {
							Q(r, r.return, e);
						}
					}
					n && o & 64 && Bc(a), Hc(a, a.return);
					break;
				case 27: Xc(a);
				case 26:
				case 5:
					bl(i, a, n), n && r === null && o & 4 && Wc(a), Hc(a, a.return);
					break;
				case 12:
					bl(i, a, n);
					break;
				case 31:
					bl(i, a, n), n && o & 4 && ll(i, a);
					break;
				case 13:
					bl(i, a, n), n && o & 4 && ul(i, a);
					break;
				case 22:
					a.memoizedState === null && bl(i, a, n), Hc(a, a.return);
					break;
				case 30: break;
				default: bl(i, a, n);
			}
			t = t.sibling;
		}
	}
	function xl(e, t) {
		var n = null;
		e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool), e = null, t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), e !== n && (e != null && e.refCount++, n != null && ia(n));
	}
	function Sl(e, t) {
		e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ia(e));
	}
	function Cl(e, t, n, r) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) wl(e, t, n, r), t = t.sibling;
	}
	function wl(e, t, n, r) {
		var i = t.flags;
		switch (t.tag) {
			case 0:
			case 11:
			case 15:
				Cl(e, t, n, r), i & 2048 && Rc(9, t);
				break;
			case 1:
				Cl(e, t, n, r);
				break;
			case 3:
				Cl(e, t, n, r), i & 2048 && (e = null, t.alternate !== null && (e = t.alternate.memoizedState.cache), t = t.memoizedState.cache, t !== e && (t.refCount++, e != null && ia(e)));
				break;
			case 12:
				if (i & 2048) {
					Cl(e, t, n, r), e = t.stateNode;
					try {
						var a = t.memoizedProps, o = a.id, s = a.onPostCommit;
						typeof s == "function" && s(o, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0);
					} catch (e) {
						Q(t, t.return, e);
					}
				} else Cl(e, t, n, r);
				break;
			case 31:
				Cl(e, t, n, r);
				break;
			case 13:
				Cl(e, t, n, r);
				break;
			case 23: break;
			case 22:
				a = t.stateNode, o = t.alternate, t.memoizedState === null ? a._visibility & 2 ? Cl(e, t, n, r) : (a._visibility |= 2, Tl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1)) : a._visibility & 2 ? Cl(e, t, n, r) : El(e, t), i & 2048 && xl(o, t);
				break;
			case 24:
				Cl(e, t, n, r), i & 2048 && Sl(t.alternate, t);
				break;
			default: Cl(e, t, n, r);
		}
	}
	function Tl(e, t, n, r, i) {
		for (i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child; t !== null;) {
			var a = e, o = t, s = n, c = r, l = o.flags;
			switch (o.tag) {
				case 0:
				case 11:
				case 15:
					Tl(a, o, s, c, i), Rc(8, o);
					break;
				case 23: break;
				case 22:
					var u = o.stateNode;
					o.memoizedState === null ? (u._visibility |= 2, Tl(a, o, s, c, i)) : u._visibility & 2 ? Tl(a, o, s, c, i) : El(a, o), i && l & 2048 && xl(o.alternate, o);
					break;
				case 24:
					Tl(a, o, s, c, i), i && l & 2048 && Sl(o.alternate, o);
					break;
				default: Tl(a, o, s, c, i);
			}
			t = t.sibling;
		}
	}
	function El(e, t) {
		if (t.subtreeFlags & 10256) for (t = t.child; t !== null;) {
			var n = e, r = t, i = r.flags;
			switch (r.tag) {
				case 22:
					El(n, r), i & 2048 && xl(r.alternate, r);
					break;
				case 24:
					El(n, r), i & 2048 && Sl(r.alternate, r);
					break;
				default: El(n, r);
			}
			t = t.sibling;
		}
	}
	var Dl = 8192;
	function Ol(e, t, n) {
		if (e.subtreeFlags & Dl) for (e = e.child; e !== null;) kl(e, t, n), e = e.sibling;
	}
	function kl(e, t, n) {
		switch (e.tag) {
			case 26:
				Ol(e, t, n), e.flags & Dl && e.memoizedState !== null && Gf(n, ml, e.memoizedState, e.memoizedProps);
				break;
			case 5:
				Ol(e, t, n);
				break;
			case 3:
			case 4:
				var r = ml;
				ml = gf(e.stateNode.containerInfo), Ol(e, t, n), ml = r;
				break;
			case 22:
				e.memoizedState === null && (r = e.alternate, r !== null && r.memoizedState !== null ? (r = Dl, Dl = 16777216, Ol(e, t, n), Dl = r) : Ol(e, t, n));
				break;
			default: Ol(e, t, n);
		}
	}
	function Al(e) {
		var t = e.alternate;
		if (t !== null && (e = t.child, e !== null)) {
			t.child = null;
			do
				t = e.sibling, e.sibling = null, e = t;
			while (e !== null);
		}
	}
	function jl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				tl = r, Pl(r, e);
			}
			Al(e);
		}
		if (e.subtreeFlags & 10256) for (e = e.child; e !== null;) Ml(e), e = e.sibling;
	}
	function Ml(e) {
		switch (e.tag) {
			case 0:
			case 11:
			case 15:
				jl(e), e.flags & 2048 && zc(9, e, e.return);
				break;
			case 3:
				jl(e);
				break;
			case 12:
				jl(e);
				break;
			case 22:
				var t = e.stateNode;
				e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3, Nl(e)) : jl(e);
				break;
			default: jl(e);
		}
	}
	function Nl(e) {
		var t = e.deletions;
		if (e.flags & 16) {
			if (t !== null) for (var n = 0; n < t.length; n++) {
				var r = t[n];
				tl = r, Pl(r, e);
			}
			Al(e);
		}
		for (e = e.child; e !== null;) {
			switch (t = e, t.tag) {
				case 0:
				case 11:
				case 15:
					zc(8, t, t.return), Nl(t);
					break;
				case 22:
					n = t.stateNode, n._visibility & 2 && (n._visibility &= -3, Nl(t));
					break;
				default: Nl(t);
			}
			e = e.sibling;
		}
	}
	function Pl(e, t) {
		for (; tl !== null;) {
			var n = tl;
			switch (n.tag) {
				case 0:
				case 11:
				case 15:
					zc(8, n, t);
					break;
				case 23:
				case 22:
					if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
						var r = n.memoizedState.cachePool.pool;
						r != null && r.refCount++;
					}
					break;
				case 24: ia(n.memoizedState.cache);
			}
			if (r = n.child, r !== null) r.return = n, tl = r;
			else a: for (n = e; tl !== null;) {
				r = tl;
				var i = r.sibling, a = r.return;
				if (il(r), r === n) {
					tl = null;
					break a;
				}
				if (i !== null) {
					i.return = a, tl = i;
					break a;
				}
				tl = a;
			}
		}
	}
	var Fl = {
		getCacheForType: function(e) {
			var t = Zi(W), n = t.data.get(e);
			return n === void 0 && (n = e(), t.data.set(e, n)), n;
		},
		cacheSignal: function() {
			return Zi(W).controller.signal;
		}
	}, Il = typeof WeakMap == "function" ? WeakMap : Map, J = 0, Ll = null, Y = null, X = 0, Z = 0, Rl = null, zl = !1, Bl = !1, Vl = !1, Hl = 0, Ul = 0, Wl = 0, Gl = 0, Kl = 0, ql = 0, Jl = 0, Yl = null, Xl = null, Zl = !1, Ql = 0, $l = 0, eu = Infinity, tu = null, nu = null, ru = 0, iu = null, au = null, ou = 0, su = 0, cu = null, lu = null, uu = 0, du = null;
	function fu() {
		return J & 2 && X !== 0 ? X & -X : A.T === null ? ot() : ud();
	}
	function pu() {
		if (ql === 0) if (!(X & 536870912) || H) {
			var e = qe;
			qe <<= 1, !(qe & 3932160) && (qe = 262144), ql = e;
		} else ql = 536870912;
		return e = Za.current, e !== null && (e.flags |= 32), ql;
	}
	function mu(e, t, n) {
		(e === Ll && (Z === 2 || Z === 9) || e.cancelPendingCommit !== null) && (xu(e, 0), vu(e, X, ql, !1)), $e(e, n), (!(J & 2) || e !== Ll) && (e === Ll && (!(J & 2) && (Gl |= n), Ul === 4 && vu(e, X, ql, !1)), nd(e));
	}
	function hu(e, t, n) {
		if (J & 6) throw Error(i(327));
		var r = !n && (t & 127) == 0 && (t & e.expiredLanes) === 0 || Ye(e, t), a = r ? ku(e, t) : Du(e, t, !0), o = r;
		do {
			if (a === 0) {
				Bl && !r && vu(e, t, 0, !1);
				break;
			} else {
				if (n = e.current.alternate, o && !_u(n)) {
					a = Du(e, t, !1), o = !1;
					continue;
				}
				if (a === 2) {
					if (o = t, e.errorRecoveryDisabledLanes & o) var s = 0;
					else s = e.pendingLanes & -536870913, s = s === 0 ? s & 536870912 ? 536870912 : 0 : s;
					if (s !== 0) {
						t = s;
						a: {
							var c = e;
							a = Yl;
							var l = c.current.memoizedState.isDehydrated;
							if (l && (xu(c, s).flags |= 256), s = Du(c, s, !1), s !== 2) {
								if (Vl && !l) {
									c.errorRecoveryDisabledLanes |= o, Gl |= o, a = 4;
									break a;
								}
								o = Xl, Xl = a, o !== null && (Xl === null ? Xl = o : Xl.push.apply(Xl, o));
							}
							a = s;
						}
						if (o = !1, a !== 2) continue;
					}
				}
				if (a === 1) {
					xu(e, 0), vu(e, t, 0, !0);
					break;
				}
				a: {
					switch (r = e, o = a, o) {
						case 0:
						case 1: throw Error(i(345));
						case 4: if ((t & 4194048) !== t) break;
						case 6:
							vu(r, t, ql, !zl);
							break a;
						case 2:
							Xl = null;
							break;
						case 3:
						case 5: break;
						default: throw Error(i(329));
					}
					if ((t & 62914560) === t && (a = Ql + 300 - Ae(), 10 < a)) {
						if (vu(r, t, ql, !zl), F(r, 0, !0) !== 0) break a;
						ou = t, r.timeoutHandle = Kd(gu.bind(null, r, n, Xl, tu, Zl, t, ql, Gl, Jl, zl, o, "Throttled", -0, 0), a);
						break a;
					}
					gu(r, n, Xl, tu, Zl, t, ql, Gl, Jl, zl, o, null, -0, 0);
				}
			}
			break;
		} while (1);
		nd(e);
	}
	function gu(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
		if (e.timeoutHandle = -1, d = t.subtreeFlags, d & 8192 || (d & 16785408) == 16785408) {
			d = {
				stylesheets: null,
				count: 0,
				imgCount: 0,
				imgBytes: 0,
				suspenseyImages: [],
				waitingForImages: !0,
				waitingForViewTransition: !1,
				unsuspend: $t
			}, kl(t, a, d);
			var m = (a & 62914560) === a ? Ql - Ae() : (a & 4194048) === a ? $l - Ae() : 0;
			if (m = qf(d, m), m !== null) {
				ou = a, e.cancelPendingCommit = m(Iu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p)), vu(e, a, o, !l);
				return;
			}
		}
		Iu(e, t, a, n, r, i, o, s, c);
	}
	function _u(e) {
		for (var t = e;;) {
			var n = t.tag;
			if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue, n !== null && (n = n.stores, n !== null))) for (var r = 0; r < n.length; r++) {
				var i = n[r], a = i.getSnapshot;
				i = i.value;
				try {
					if (!br(a(), i)) return !1;
				} catch {
					return !1;
				}
			}
			if (n = t.child, t.subtreeFlags & 16384 && n !== null) n.return = t, t = n;
			else {
				if (t === e) break;
				for (; t.sibling === null;) {
					if (t.return === null || t.return === e) return !0;
					t = t.return;
				}
				t.sibling.return = t.return, t = t.sibling;
			}
		}
		return !0;
	}
	function vu(e, t, n, r) {
		t &= ~Kl, t &= ~Gl, e.suspendedLanes |= t, e.pingedLanes &= ~t, r && (e.warmLanes |= t), r = e.expirationTimes;
		for (var i = t; 0 < i;) {
			var a = 31 - He(i), o = 1 << a;
			r[a] = -1, i &= ~o;
		}
		n !== 0 && tt(e, n, t);
	}
	function yu() {
		return J & 6 ? !0 : (rd(0, !1), !1);
	}
	function bu() {
		if (Y !== null) {
			if (Z === 0) var e = Y.return;
			else e = Y, Wi = Ui = null, wo(e), Da = null, Oa = 0, e = Y;
			for (; e !== null;) Lc(e.alternate, e), e = e.return;
			Y = null;
		}
	}
	function xu(e, t) {
		var n = e.timeoutHandle;
		n !== -1 && (e.timeoutHandle = -1, qd(n)), n = e.cancelPendingCommit, n !== null && (e.cancelPendingCommit = null, n()), ou = 0, bu(), Ll = e, Y = n = ci(e.current, null), X = t, Z = 0, Rl = null, zl = !1, Bl = Ye(e, t), Vl = !1, Jl = ql = Kl = Gl = Wl = Ul = 0, Xl = Yl = null, Zl = !1, t & 8 && (t |= t & 32);
		var r = e.entangledLanes;
		if (r !== 0) for (e = e.entanglements, r &= t; 0 < r;) {
			var i = 31 - He(r), a = 1 << i;
			t |= e[i], r &= ~a;
		}
		return Hl = t, Qr(), n;
	}
	function Su(e, t) {
		K = null, A.H = Ps, t === _a || t === ya ? (t = Ta(), Z = 3) : t === va ? (t = Ta(), Z = 4) : Z = t === Qs ? 8 : typeof t == "object" && t && typeof t.then == "function" ? 6 : 1, Rl = t, Y === null && (Ul = 1, Ks(e, gi(t, e.current)));
	}
	function Cu() {
		var e = Za.current;
		return e === null ? !0 : (X & 4194048) === X ? Qa === null : (X & 62914560) === X || X & 536870912 ? e === Qa : !1;
	}
	function wu() {
		var e = A.H;
		return A.H = Ps, e === null ? Ps : e;
	}
	function Tu() {
		var e = A.A;
		return A.A = Fl, e;
	}
	function Eu() {
		Ul = 4, zl || (X & 4194048) !== X && Za.current !== null || (Bl = !0), !(Wl & 134217727) && !(Gl & 134217727) || Ll === null || vu(Ll, X, ql, !1);
	}
	function Du(e, t, n) {
		var r = J;
		J |= 2;
		var i = wu(), a = Tu();
		(Ll !== e || X !== t) && (tu = null, xu(e, t)), t = !1;
		var o = Ul;
		a: do
			try {
				if (Z !== 0 && Y !== null) {
					var s = Y, c = Rl;
					switch (Z) {
						case 8:
							bu(), o = 6;
							break a;
						case 3:
						case 2:
						case 9:
						case 6:
							Za.current === null && (t = !0);
							var l = Z;
							if (Z = 0, Rl = null, Nu(e, s, c, l), n && Bl) {
								o = 0;
								break a;
							}
							break;
						default: l = Z, Z = 0, Rl = null, Nu(e, s, c, l);
					}
				}
				Ou(), o = Ul;
				break;
			} catch (t) {
				Su(e, t);
			}
		while (1);
		return t && e.shellSuspendCounter++, Wi = Ui = null, J = r, A.H = i, A.A = a, Y === null && (Ll = null, X = 0, Qr()), o;
	}
	function Ou() {
		for (; Y !== null;) ju(Y);
	}
	function ku(e, t) {
		var n = J;
		J |= 2;
		var r = wu(), a = Tu();
		Ll !== e || X !== t ? (tu = null, eu = Ae() + 500, xu(e, t)) : Bl = Ye(e, t);
		a: do
			try {
				if (Z !== 0 && Y !== null) {
					t = Y;
					var o = Rl;
					b: switch (Z) {
						case 1:
							Z = 0, Rl = null, Nu(e, t, o, 1);
							break;
						case 2:
						case 9:
							if (xa(o)) {
								Z = 0, Rl = null, Mu(t);
								break;
							}
							t = function() {
								Z !== 2 && Z !== 9 || Ll !== e || (Z = 7), nd(e);
							}, o.then(t, t);
							break a;
						case 3:
							Z = 7;
							break a;
						case 4:
							Z = 5;
							break a;
						case 7:
							xa(o) ? (Z = 0, Rl = null, Mu(t)) : (Z = 0, Rl = null, Nu(e, t, o, 7));
							break;
						case 5:
							var s = null;
							switch (Y.tag) {
								case 26: s = Y.memoizedState;
								case 5:
								case 27:
									var c = Y;
									if (s ? Wf(s) : c.stateNode.complete) {
										Z = 0, Rl = null;
										var l = c.sibling;
										if (l !== null) Y = l;
										else {
											var u = c.return;
											u === null ? Y = null : (Y = u, Pu(u));
										}
										break b;
									}
							}
							Z = 0, Rl = null, Nu(e, t, o, 5);
							break;
						case 6:
							Z = 0, Rl = null, Nu(e, t, o, 6);
							break;
						case 8:
							bu(), Ul = 6;
							break a;
						default: throw Error(i(462));
					}
				}
				Au();
				break;
			} catch (t) {
				Su(e, t);
			}
		while (1);
		return Wi = Ui = null, A.H = r, A.A = a, J = n, Y === null ? (Ll = null, X = 0, Qr(), Ul) : 0;
	}
	function Au() {
		for (; Y !== null && !Oe();) ju(Y);
	}
	function ju(e) {
		var t = Oc(e.alternate, e, Hl);
		e.memoizedProps = e.pendingProps, t === null ? Pu(e) : Y = t;
	}
	function Mu(e) {
		var t = e, n = t.alternate;
		switch (t.tag) {
			case 15:
			case 0:
				t = fc(n, t, t.pendingProps, t.type, void 0, X);
				break;
			case 11:
				t = fc(n, t, t.pendingProps, t.type.render, t.ref, X);
				break;
			case 5: wo(t);
			default: Lc(n, t), t = Y = li(t, Hl), t = Oc(n, t, Hl);
		}
		e.memoizedProps = e.pendingProps, t === null ? Pu(e) : Y = t;
	}
	function Nu(e, t, n, r) {
		Wi = Ui = null, wo(t), Da = null, Oa = 0;
		var i = t.return;
		try {
			if (Zs(e, i, t, n, X)) {
				Ul = 1, Ks(e, gi(n, e.current)), Y = null;
				return;
			}
		} catch (t) {
			if (i !== null) throw Y = i, t;
			Ul = 1, Ks(e, gi(n, e.current)), Y = null;
			return;
		}
		t.flags & 32768 ? (H || r === 1 ? e = !0 : Bl || X & 536870912 ? e = !1 : (zl = e = !0, (r === 2 || r === 9 || r === 3 || r === 6) && (r = Za.current, r !== null && r.tag === 13 && (r.flags |= 16384))), Fu(t, e)) : Pu(t);
	}
	function Pu(e) {
		var t = e;
		do {
			if (t.flags & 32768) {
				Fu(t, zl);
				return;
			}
			e = t.return;
			var n = Fc(t.alternate, t, Hl);
			if (n !== null) {
				Y = n;
				return;
			}
			if (t = t.sibling, t !== null) {
				Y = t;
				return;
			}
			Y = t = e;
		} while (t !== null);
		Ul === 0 && (Ul = 5);
	}
	function Fu(e, t) {
		do {
			var n = Ic(e.alternate, e);
			if (n !== null) {
				n.flags &= 32767, Y = n;
				return;
			}
			if (n = e.return, n !== null && (n.flags |= 32768, n.subtreeFlags = 0, n.deletions = null), !t && (e = e.sibling, e !== null)) {
				Y = e;
				return;
			}
			Y = e = n;
		} while (e !== null);
		Ul = 6, Y = null;
	}
	function Iu(e, t, n, r, a, o, s, c, l) {
		e.cancelPendingCommit = null;
		do
			Vu();
		while (ru !== 0);
		if (J & 6) throw Error(i(327));
		if (t !== null) {
			if (t === e.current) throw Error(i(177));
			if (o = t.lanes | t.childLanes, o |= Zr, et(e, n, o, s, c, l), e === Ll && (Y = Ll = null, X = 0), au = t, iu = e, ou = n, su = o, cu = a, lu = r, t.subtreeFlags & 10256 || t.flags & 10256 ? (e.callbackNode = null, e.callbackPriority = 0, Yu(Pe, function() {
				return Hu(), null;
			})) : (e.callbackNode = null, e.callbackPriority = 0), r = (t.flags & 13878) != 0, t.subtreeFlags & 13878 || r) {
				r = A.T, A.T = null, a = j.p, j.p = 2, s = J, J |= 4;
				try {
					nl(e, t, n);
				} finally {
					J = s, j.p = a, A.T = r;
				}
			}
			ru = 1, Lu(), Ru(), zu();
		}
	}
	function Lu() {
		if (ru === 1) {
			ru = 0;
			var e = iu, t = au, n = (t.flags & 13878) != 0;
			if (t.subtreeFlags & 13878 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = J;
				J |= 4;
				try {
					hl(t, e);
					var a = zd, o = Tr(e.containerInfo), s = a.focusedElem, c = a.selectionRange;
					if (o !== s && s && s.ownerDocument && wr(s.ownerDocument.documentElement, s)) {
						if (c !== null && Er(s)) {
							var l = c.start, u = c.end;
							if (u === void 0 && (u = l), "selectionStart" in s) s.selectionStart = l, s.selectionEnd = Math.min(u, s.value.length);
							else {
								var d = s.ownerDocument || document, f = d && d.defaultView || window;
								if (f.getSelection) {
									var p = f.getSelection(), m = s.textContent.length, h = Math.min(c.start, m), g = c.end === void 0 ? h : Math.min(c.end, m);
									!p.extend && h > g && (o = g, g = h, h = o);
									var _ = Cr(s, h), v = Cr(s, g);
									if (_ && v && (p.rangeCount !== 1 || p.anchorNode !== _.node || p.anchorOffset !== _.offset || p.focusNode !== v.node || p.focusOffset !== v.offset)) {
										var y = d.createRange();
										y.setStart(_.node, _.offset), p.removeAllRanges(), h > g ? (p.addRange(y), p.extend(v.node, v.offset)) : (y.setEnd(v.node, v.offset), p.addRange(y));
									}
								}
							}
						}
						for (d = [], p = s; p = p.parentNode;) p.nodeType === 1 && d.push({
							element: p,
							left: p.scrollLeft,
							top: p.scrollTop
						});
						for (typeof s.focus == "function" && s.focus(), s = 0; s < d.length; s++) {
							var b = d[s];
							b.element.scrollLeft = b.left, b.element.scrollTop = b.top;
						}
					}
					sp = !!Rd, zd = Rd = null;
				} finally {
					J = i, j.p = r, A.T = n;
				}
			}
			e.current = t, ru = 2;
		}
	}
	function Ru() {
		if (ru === 2) {
			ru = 0;
			var e = iu, t = au, n = (t.flags & 8772) != 0;
			if (t.subtreeFlags & 8772 || n) {
				n = A.T, A.T = null;
				var r = j.p;
				j.p = 2;
				var i = J;
				J |= 4;
				try {
					rl(e, t.alternate, t);
				} finally {
					J = i, j.p = r, A.T = n;
				}
			}
			ru = 3;
		}
	}
	function zu() {
		if (ru === 4 || ru === 3) {
			ru = 0, ke();
			var e = iu, t = au, n = ou, r = lu;
			t.subtreeFlags & 10256 || t.flags & 10256 ? ru = 5 : (ru = 0, au = iu = null, Bu(e, e.pendingLanes));
			var i = e.pendingLanes;
			if (i === 0 && (nu = null), at(n), t = t.stateNode, Be && typeof Be.onCommitFiberRoot == "function") try {
				Be.onCommitFiberRoot(ze, t, void 0, (t.current.flags & 128) == 128);
			} catch {}
			if (r !== null) {
				t = A.T, i = j.p, j.p = 2, A.T = null;
				try {
					for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
						var s = r[o];
						a(s.value, { componentStack: s.stack });
					}
				} finally {
					A.T = t, j.p = i;
				}
			}
			ou & 3 && Vu(), nd(e), i = e.pendingLanes, n & 261930 && i & 42 ? e === du ? uu++ : (uu = 0, du = e) : uu = 0, rd(0, !1);
		}
	}
	function Bu(e, t) {
		(e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache, t != null && (e.pooledCache = null, ia(t)));
	}
	function Vu() {
		return Lu(), Ru(), zu(), Hu();
	}
	function Hu() {
		if (ru !== 5) return !1;
		var e = iu, t = su;
		su = 0;
		var n = at(ou), r = A.T, a = j.p;
		try {
			j.p = 32 > n ? 32 : n, A.T = null, n = cu, cu = null;
			var o = iu, s = ou;
			if (ru = 0, au = iu = null, ou = 0, J & 6) throw Error(i(331));
			var c = J;
			if (J |= 4, Ml(o.current), wl(o, o.current, s, n), J = c, rd(0, !1), Be && typeof Be.onPostCommitFiberRoot == "function") try {
				Be.onPostCommitFiberRoot(ze, o);
			} catch {}
			return !0;
		} finally {
			j.p = a, A.T = r, Bu(e, t);
		}
	}
	function Uu(e, t, n) {
		t = gi(n, t), t = Js(e.stateNode, t, 2), e = za(e, t, 2), e !== null && ($e(e, 2), nd(e));
	}
	function Q(e, t, n) {
		if (e.tag === 3) Uu(e, e, n);
		else for (; t !== null;) {
			if (t.tag === 3) {
				Uu(t, e, n);
				break;
			} else if (t.tag === 1) {
				var r = t.stateNode;
				if (typeof t.type.getDerivedStateFromError == "function" || typeof r.componentDidCatch == "function" && (nu === null || !nu.has(r))) {
					e = gi(n, e), n = Ys(2), r = za(t, n, 2), r !== null && (Xs(n, r, t, e), $e(r, 2), nd(r));
					break;
				}
			}
			t = t.return;
		}
	}
	function Wu(e, t, n) {
		var r = e.pingCache;
		if (r === null) {
			r = e.pingCache = new Il();
			var i = /* @__PURE__ */ new Set();
			r.set(t, i);
		} else i = r.get(t), i === void 0 && (i = /* @__PURE__ */ new Set(), r.set(t, i));
		i.has(n) || (Vl = !0, i.add(n), e = Gu.bind(null, e, t, n), t.then(e, e));
	}
	function Gu(e, t, n) {
		var r = e.pingCache;
		r !== null && r.delete(t), e.pingedLanes |= e.suspendedLanes & n, e.warmLanes &= ~n, Ll === e && (X & n) === n && (Ul === 4 || Ul === 3 && (X & 62914560) === X && 300 > Ae() - Ql ? !(J & 2) && xu(e, 0) : Kl |= n, Jl === X && (Jl = 0)), nd(e);
	}
	function Ku(e, t) {
		t === 0 && (t = Ze()), e = ti(e, t), e !== null && ($e(e, t), nd(e));
	}
	function qu(e) {
		var t = e.memoizedState, n = 0;
		t !== null && (n = t.retryLane), Ku(e, n);
	}
	function Ju(e, t) {
		var n = 0;
		switch (e.tag) {
			case 31:
			case 13:
				var r = e.stateNode, a = e.memoizedState;
				a !== null && (n = a.retryLane);
				break;
			case 19:
				r = e.stateNode;
				break;
			case 22:
				r = e.stateNode._retryCache;
				break;
			default: throw Error(i(314));
		}
		r !== null && r.delete(t), Ku(e, n);
	}
	function Yu(e, t) {
		return Ee(e, t);
	}
	var Xu = null, Zu = null, Qu = !1, $u = !1, ed = !1, td = 0;
	function nd(e) {
		e !== Zu && e.next === null && (Zu === null ? Xu = Zu = e : Zu = Zu.next = e), $u = !0, Qu || (Qu = !0, ld());
	}
	function rd(e, t) {
		if (!ed && $u) {
			ed = !0;
			do
				for (var n = !1, r = Xu; r !== null;) {
					if (!t) if (e !== 0) {
						var i = r.pendingLanes;
						if (i === 0) var a = 0;
						else {
							var o = r.suspendedLanes, s = r.pingedLanes;
							a = (1 << 31 - He(42 | e) + 1) - 1, a &= i & ~(o & ~s), a = a & 201326741 ? a & 201326741 | 1 : a ? a | 2 : 0;
						}
						a !== 0 && (n = !0, cd(r, a));
					} else a = X, a = F(r, r === Ll ? a : 0, r.cancelPendingCommit !== null || r.timeoutHandle !== -1), !(a & 3) || Ye(r, a) || (n = !0, cd(r, a));
					r = r.next;
				}
			while (n);
			ed = !1;
		}
	}
	function id() {
		ad();
	}
	function ad() {
		$u = Qu = !1;
		var e = 0;
		td !== 0 && Gd() && (e = td);
		for (var t = Ae(), n = null, r = Xu; r !== null;) {
			var i = r.next, a = od(r, t);
			a === 0 ? (r.next = null, n === null ? Xu = i : n.next = i, i === null && (Zu = n)) : (n = r, (e !== 0 || a & 3) && ($u = !0)), r = i;
		}
		ru !== 0 && ru !== 5 || rd(e, !1), td !== 0 && (td = 0);
	}
	function od(e, t) {
		for (var n = e.suspendedLanes, r = e.pingedLanes, i = e.expirationTimes, a = e.pendingLanes & -62914561; 0 < a;) {
			var o = 31 - He(a), s = 1 << o, c = i[o];
			c === -1 ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = Xe(s, t)) : c <= t && (e.expiredLanes |= s), a &= ~s;
		}
		if (t = Ll, n = X, n = F(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r = e.callbackNode, n === 0 || e === t && (Z === 2 || Z === 9) || e.cancelPendingCommit !== null) return r !== null && r !== null && De(r), e.callbackNode = null, e.callbackPriority = 0;
		if (!(n & 3) || Ye(e, n)) {
			if (t = n & -n, t === e.callbackPriority) return t;
			switch (r !== null && De(r), at(n)) {
				case 2:
				case 8:
					n = Ne;
					break;
				case 32:
					n = Pe;
					break;
				case 268435456:
					n = Ie;
					break;
				default: n = Pe;
			}
			return r = sd.bind(null, e), n = Ee(n, r), e.callbackPriority = t, e.callbackNode = n, t;
		}
		return r !== null && r !== null && De(r), e.callbackPriority = 2, e.callbackNode = null, 2;
	}
	function sd(e, t) {
		if (ru !== 0 && ru !== 5) return e.callbackNode = null, e.callbackPriority = 0, null;
		var n = e.callbackNode;
		if (Vu() && e.callbackNode !== n) return null;
		var r = X;
		return r = F(e, e === Ll ? r : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1), r === 0 ? null : (hu(e, r, t), od(e, Ae()), e.callbackNode != null && e.callbackNode === n ? sd.bind(null, e) : null);
	}
	function cd(e, t) {
		if (Vu()) return null;
		hu(e, t, !0);
	}
	function ld() {
		Yd(function() {
			J & 6 ? Ee(Me, id) : ad();
		});
	}
	function ud() {
		if (td === 0) {
			var e = sa;
			e === 0 && (e = Ke, Ke <<= 1, !(Ke & 261888) && (Ke = 256)), td = e;
		}
		return td;
	}
	function dd(e) {
		return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : Qt("" + e);
	}
	function fd(e, t) {
		var n = t.ownerDocument.createElement("input");
		return n.name = t.name, n.value = t.value, e.id && n.setAttribute("form", e.id), t.parentNode.insertBefore(n, t), e = new FormData(e), n.parentNode.removeChild(n), e;
	}
	function pd(e, t, n, r, i) {
		if (t === "submit" && n && n.stateNode === i) {
			var a = dd((i[I] || null).action), o = r.submitter;
			o && (t = (t = o[I] || null) ? dd(t.formAction) : o.getAttribute("formAction"), t !== null && (a = t, o = null));
			var s = new xn("action", "action", null, r, i);
			e.push({
				event: s,
				listeners: [{
					instance: null,
					listener: function() {
						if (r.defaultPrevented) {
							if (td !== 0) {
								var e = o ? fd(i, o) : new FormData(i);
								bs(n, {
									pending: !0,
									data: e,
									method: i.method,
									action: a
								}, null, e);
							}
						} else typeof a == "function" && (s.preventDefault(), e = o ? fd(i, o) : new FormData(i), bs(n, {
							pending: !0,
							data: e,
							method: i.method,
							action: a
						}, a, e));
					},
					currentTarget: i
				}]
			});
		}
	}
	for (var md = 0; md < Kr.length; md++) {
		var hd = Kr[md];
		qr(hd.toLowerCase(), "on" + (hd[0].toUpperCase() + hd.slice(1)));
	}
	qr(Rr, "onAnimationEnd"), qr(zr, "onAnimationIteration"), qr(Br, "onAnimationStart"), qr("dblclick", "onDoubleClick"), qr("focusin", "onFocus"), qr("focusout", "onBlur"), qr(Vr, "onTransitionRun"), qr(Hr, "onTransitionStart"), qr(Ur, "onTransitionCancel"), qr(Wr, "onTransitionEnd"), wt("onMouseEnter", ["mouseout", "mouseover"]), wt("onMouseLeave", ["mouseout", "mouseover"]), wt("onPointerEnter", ["pointerout", "pointerover"]), wt("onPointerLeave", ["pointerout", "pointerover"]), Ct("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")), Ct("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")), Ct("onBeforeInput", [
		"compositionend",
		"keypress",
		"textInput",
		"paste"
	]), Ct("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")), Ct("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")), Ct("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
	var gd = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), _d = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(gd));
	function vd(e, t) {
		t = (t & 4) != 0;
		for (var n = 0; n < e.length; n++) {
			var r = e[n], i = r.event;
			r = r.listeners;
			a: {
				var a = void 0;
				if (t) for (var o = r.length - 1; 0 <= o; o--) {
					var s = r[o], c = s.instance, l = s.currentTarget;
					if (s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Jr(e);
					}
					i.currentTarget = null, a = c;
				}
				else for (o = 0; o < r.length; o++) {
					if (s = r[o], c = s.instance, l = s.currentTarget, s = s.listener, c !== a && i.isPropagationStopped()) break a;
					a = s, i.currentTarget = l;
					try {
						a(i);
					} catch (e) {
						Jr(e);
					}
					i.currentTarget = null, a = c;
				}
			}
		}
	}
	function $(e, t) {
		var n = t[dt];
		n === void 0 && (n = t[dt] = /* @__PURE__ */ new Set());
		var r = e + "__bubble";
		n.has(r) || (Sd(t, e, 2, !1), n.add(r));
	}
	function yd(e, t, n) {
		var r = 0;
		t && (r |= 4), Sd(n, e, r, t);
	}
	var bd = "_reactListening" + Math.random().toString(36).slice(2);
	function xd(e) {
		if (!e[bd]) {
			e[bd] = !0, xt.forEach(function(t) {
				t !== "selectionchange" && (_d.has(t) || yd(t, !1, e), yd(t, !0, e));
			});
			var t = e.nodeType === 9 ? e : e.ownerDocument;
			t === null || t[bd] || (t[bd] = !0, yd("selectionchange", !1, t));
		}
	}
	function Sd(e, t, n, r) {
		switch (mp(t)) {
			case 2:
				var i = cp;
				break;
			case 8:
				i = lp;
				break;
			default: i = up;
		}
		n = i.bind(null, t, n, e), i = void 0, !un || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0), r ? i === void 0 ? e.addEventListener(t, n, !0) : e.addEventListener(t, n, {
			capture: !0,
			passive: i
		}) : i === void 0 ? e.addEventListener(t, n, !1) : e.addEventListener(t, n, { passive: i });
	}
	function Cd(e, t, n, r, i) {
		var a = r;
		if (!(t & 1) && !(t & 2) && r !== null) a: for (;;) {
			if (r === null) return;
			var s = r.tag;
			if (s === 3 || s === 4) {
				var c = r.stateNode.containerInfo;
				if (c === i) break;
				if (s === 4) for (s = r.return; s !== null;) {
					var l = s.tag;
					if ((l === 3 || l === 4) && s.stateNode.containerInfo === i) return;
					s = s.return;
				}
				for (; c !== null;) {
					if (s = _t(c), s === null) return;
					if (l = s.tag, l === 5 || l === 6 || l === 26 || l === 27) {
						r = a = s;
						continue a;
					}
					c = c.parentNode;
				}
			}
			r = r.return;
		}
		sn(function() {
			var r = a, i = tn(n), s = [];
			a: {
				var c = Gr.get(e);
				if (c !== void 0) {
					var l = xn, u = e;
					switch (e) {
						case "keypress": if (gn(n) === 0) break a;
						case "keydown":
						case "keyup":
							l = zn;
							break;
						case "focusin":
							u = "focus", l = An;
							break;
						case "focusout":
							u = "blur", l = An;
							break;
						case "beforeblur":
						case "afterblur":
							l = An;
							break;
						case "click": if (n.button === 2) break a;
						case "auxclick":
						case "dblclick":
						case "mousedown":
						case "mousemove":
						case "mouseup":
						case "mouseout":
						case "mouseover":
						case "contextmenu":
							l = On;
							break;
						case "drag":
						case "dragend":
						case "dragenter":
						case "dragexit":
						case "dragleave":
						case "dragover":
						case "dragstart":
						case "drop":
							l = kn;
							break;
						case "touchcancel":
						case "touchend":
						case "touchmove":
						case "touchstart":
							l = Vn;
							break;
						case Rr:
						case zr:
						case Br:
							l = jn;
							break;
						case Wr:
							l = Hn;
							break;
						case "scroll":
						case "scrollend":
							l = Cn;
							break;
						case "wheel":
							l = Un;
							break;
						case "copy":
						case "cut":
						case "paste":
							l = Mn;
							break;
						case "gotpointercapture":
						case "lostpointercapture":
						case "pointercancel":
						case "pointerdown":
						case "pointermove":
						case "pointerout":
						case "pointerover":
						case "pointerup":
							l = Bn;
							break;
						case "toggle":
						case "beforetoggle": l = Wn;
					}
					var d = (t & 4) != 0, f = !d && (e === "scroll" || e === "scrollend"), p = d ? c === null ? null : c + "Capture" : c;
					d = [];
					for (var m = r, h; m !== null;) {
						var g = m;
						if (h = g.stateNode, g = g.tag, g !== 5 && g !== 26 && g !== 27 || h === null || p === null || (g = cn(m, p), g != null && d.push(wd(m, g, h))), f) break;
						m = m.return;
					}
					0 < d.length && (c = new l(c, u, null, n, i), s.push({
						event: c,
						listeners: d
					}));
				}
			}
			if (!(t & 7)) {
				a: {
					if (c = e === "mouseover" || e === "pointerover", l = e === "mouseout" || e === "pointerout", c && n !== en && (u = n.relatedTarget || n.fromElement) && (_t(u) || u[ut])) break a;
					if ((l || c) && (c = i.window === i ? i : (c = i.ownerDocument) ? c.defaultView || c.parentWindow : window, l ? (u = n.relatedTarget || n.toElement, l = r, u = u ? _t(u) : null, u !== null && (f = o(u), d = u.tag, u !== f || d !== 5 && d !== 27 && d !== 6) && (u = null)) : (l = null, u = r), l !== u)) {
						if (d = On, g = "onMouseLeave", p = "onMouseEnter", m = "mouse", (e === "pointerout" || e === "pointerover") && (d = Bn, g = "onPointerLeave", p = "onPointerEnter", m = "pointer"), f = l == null ? c : L(l), h = u == null ? c : L(u), c = new d(g, m + "leave", l, n, i), c.target = f, c.relatedTarget = h, g = null, _t(i) === r && (d = new d(p, m + "enter", u, n, i), d.target = h, d.relatedTarget = f, g = d), f = g, l && u) b: {
							for (d = Ed, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
							g = 0;
							for (var _ = m; _; _ = d(_)) g++;
							for (; 0 < h - g;) p = d(p), h--;
							for (; 0 < g - h;) m = d(m), g--;
							for (; h--;) {
								if (p === m || m !== null && p === m.alternate) {
									d = p;
									break b;
								}
								p = d(p), m = d(m);
							}
							d = null;
						}
						else d = null;
						l !== null && Dd(s, c, l, d, !1), u !== null && f !== null && Dd(s, f, u, d, !0);
					}
				}
				a: {
					if (c = r ? L(r) : window, l = c.nodeName && c.nodeName.toLowerCase(), l === "select" || l === "input" && c.type === "file") var v = lr;
					else if (ir(c)) if (ur) v = B;
					else {
						v = _r;
						var y = gr;
					}
					else l = c.nodeName, !l || l.toLowerCase() !== "input" || c.type !== "checkbox" && c.type !== "radio" ? r && Yt(r.elementType) && (v = lr) : v = vr;
					if (v &&= v(e, r)) {
						ar(s, v, n, i);
						break a;
					}
					y && y(e, c, r), e === "focusout" && r && c.type === "number" && r.memoizedProps.value != null && Ht(c, "number", c.value);
				}
				switch (y = r ? L(r) : window, e) {
					case "focusin":
						(ir(y) || y.contentEditable === "true") && (Or = y, kr = r, Ar = null);
						break;
					case "focusout":
						Ar = kr = Or = null;
						break;
					case "mousedown":
						jr = !0;
						break;
					case "contextmenu":
					case "mouseup":
					case "dragend":
						jr = !1, Mr(s, n, i);
						break;
					case "selectionchange": if (Dr) break;
					case "keydown":
					case "keyup": Mr(s, n, i);
				}
				var b;
				if (Kn) b: {
					switch (e) {
						case "compositionstart":
							var x = "onCompositionStart";
							break b;
						case "compositionend":
							x = "onCompositionEnd";
							break b;
						case "compositionupdate":
							x = "onCompositionUpdate";
							break b;
					}
					x = void 0;
				}
				else er ? Qn(e, n) && (x = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (x = "onCompositionStart");
				x && (Yn && n.locale !== "ko" && (er || x !== "onCompositionStart" ? x === "onCompositionEnd" && er && (b = hn()) : (fn = i, pn = "value" in fn ? fn.value : fn.textContent, er = !0)), y = Td(r, x), 0 < y.length && (x = new Nn(x, e, null, n, i), s.push({
					event: x,
					listeners: y
				}), b ? x.data = b : (b = $n(n), b !== null && (x.data = b)))), (b = Jn ? tr(e, n) : nr(e, n)) && (x = Td(r, "onBeforeInput"), 0 < x.length && (y = new Nn("onBeforeInput", "beforeinput", null, n, i), s.push({
					event: y,
					listeners: x
				}), y.data = b)), pd(s, e, r, n, i);
			}
			vd(s, t);
		});
	}
	function wd(e, t, n) {
		return {
			instance: e,
			listener: t,
			currentTarget: n
		};
	}
	function Td(e, t) {
		for (var n = t + "Capture", r = []; e !== null;) {
			var i = e, a = i.stateNode;
			if (i = i.tag, i !== 5 && i !== 26 && i !== 27 || a === null || (i = cn(e, n), i != null && r.unshift(wd(e, i, a)), i = cn(e, t), i != null && r.push(wd(e, i, a))), e.tag === 3) return r;
			e = e.return;
		}
		return [];
	}
	function Ed(e) {
		if (e === null) return null;
		do
			e = e.return;
		while (e && e.tag !== 5 && e.tag !== 27);
		return e || null;
	}
	function Dd(e, t, n, r, i) {
		for (var a = t._reactName, o = []; n !== null && n !== r;) {
			var s = n, c = s.alternate, l = s.stateNode;
			if (s = s.tag, c !== null && c === r) break;
			s !== 5 && s !== 26 && s !== 27 || l === null || (c = l, i ? (l = cn(n, a), l != null && o.unshift(wd(n, l, c))) : i || (l = cn(n, a), l != null && o.push(wd(n, l, c)))), n = n.return;
		}
		o.length !== 0 && e.push({
			event: t,
			listeners: o
		});
	}
	var Od = /\r\n?/g, kd = /\u0000|\uFFFD/g;
	function Ad(e) {
		return (typeof e == "string" ? e : "" + e).replace(Od, "\n").replace(kd, "");
	}
	function jd(e, t) {
		return t = Ad(t), Ad(e) === t;
	}
	function Md(e, t, n, r, a, o) {
		switch (n) {
			case "children":
				typeof r == "string" ? t === "body" || t === "textarea" && r === "" || R(e, r) : (typeof r == "number" || typeof r == "bigint") && t !== "body" && R(e, "" + r);
				break;
			case "className":
				At(e, "class", r);
				break;
			case "tabIndex":
				At(e, "tabindex", r);
				break;
			case "dir":
			case "role":
			case "viewBox":
			case "width":
			case "height":
				At(e, n, r);
				break;
			case "style":
				Jt(e, r, o);
				break;
			case "data": if (t !== "object") {
				At(e, "data", r);
				break;
			}
			case "src":
			case "href":
				if (r === "" && (t !== "a" || n !== "href")) {
					e.removeAttribute(n);
					break;
				}
				if (r == null || typeof r == "function" || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Qt("" + r), e.setAttribute(n, r);
				break;
			case "action":
			case "formAction":
				if (typeof r == "function") {
					e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
					break;
				} else typeof o == "function" && (n === "formAction" ? (t !== "input" && Md(e, t, "name", a.name, a, null), Md(e, t, "formEncType", a.formEncType, a, null), Md(e, t, "formMethod", a.formMethod, a, null), Md(e, t, "formTarget", a.formTarget, a, null)) : (Md(e, t, "encType", a.encType, a, null), Md(e, t, "method", a.method, a, null), Md(e, t, "target", a.target, a, null)));
				if (r == null || typeof r == "symbol" || typeof r == "boolean") {
					e.removeAttribute(n);
					break;
				}
				r = Qt("" + r), e.setAttribute(n, r);
				break;
			case "onClick":
				r != null && (e.onclick = $t);
				break;
			case "onScroll":
				r != null && $("scroll", e);
				break;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "multiple":
				e.multiple = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "muted":
				e.muted = r && typeof r != "function" && typeof r != "symbol";
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "defaultValue":
			case "defaultChecked":
			case "innerHTML":
			case "ref": break;
			case "autoFocus": break;
			case "xlinkHref":
				if (r == null || typeof r == "function" || typeof r == "boolean" || typeof r == "symbol") {
					e.removeAttribute("xlink:href");
					break;
				}
				n = Qt("" + r), e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
				break;
			case "contentEditable":
			case "spellCheck":
			case "draggable":
			case "value":
			case "autoReverse":
			case "externalResourcesRequired":
			case "focusable":
			case "preserveAlpha":
				r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "" + r) : e.removeAttribute(n);
				break;
			case "inert":
			case "allowFullScreen":
			case "async":
			case "autoPlay":
			case "controls":
			case "default":
			case "defer":
			case "disabled":
			case "disablePictureInPicture":
			case "disableRemotePlayback":
			case "formNoValidate":
			case "hidden":
			case "loop":
			case "noModule":
			case "noValidate":
			case "open":
			case "playsInline":
			case "readOnly":
			case "required":
			case "reversed":
			case "scoped":
			case "seamless":
			case "itemScope":
				r && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
				break;
			case "capture":
			case "download":
				!0 === r ? e.setAttribute(n, "") : !1 !== r && r != null && typeof r != "function" && typeof r != "symbol" ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "cols":
			case "rows":
			case "size":
			case "span":
				r != null && typeof r != "function" && typeof r != "symbol" && !isNaN(r) && 1 <= r ? e.setAttribute(n, r) : e.removeAttribute(n);
				break;
			case "rowSpan":
			case "start":
				r == null || typeof r == "function" || typeof r == "symbol" || isNaN(r) ? e.removeAttribute(n) : e.setAttribute(n, r);
				break;
			case "popover":
				$("beforetoggle", e), $("toggle", e), kt(e, "popover", r);
				break;
			case "xlinkActuate":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", r);
				break;
			case "xlinkArcrole":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", r);
				break;
			case "xlinkRole":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:role", r);
				break;
			case "xlinkShow":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:show", r);
				break;
			case "xlinkTitle":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:title", r);
				break;
			case "xlinkType":
				jt(e, "http://www.w3.org/1999/xlink", "xlink:type", r);
				break;
			case "xmlBase":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", r);
				break;
			case "xmlLang":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", r);
				break;
			case "xmlSpace":
				jt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", r);
				break;
			case "is":
				kt(e, "is", r);
				break;
			case "innerText":
			case "textContent": break;
			default: (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Xt.get(n) || n, kt(e, n, r));
		}
	}
	function Nd(e, t, n, r, a, o) {
		switch (n) {
			case "style":
				Jt(e, r, o);
				break;
			case "dangerouslySetInnerHTML":
				if (r != null) {
					if (typeof r != "object" || !("__html" in r)) throw Error(i(61));
					if (n = r.__html, n != null) {
						if (a.children != null) throw Error(i(60));
						e.innerHTML = n;
					}
				}
				break;
			case "children":
				typeof r == "string" ? R(e, r) : (typeof r == "number" || typeof r == "bigint") && R(e, "" + r);
				break;
			case "onScroll":
				r != null && $("scroll", e);
				break;
			case "onScrollEnd":
				r != null && $("scrollend", e);
				break;
			case "onClick":
				r != null && (e.onclick = $t);
				break;
			case "suppressContentEditableWarning":
			case "suppressHydrationWarning":
			case "innerHTML":
			case "ref": break;
			case "innerText":
			case "textContent": break;
			default: if (!St.hasOwnProperty(n)) a: {
				if (n[0] === "o" && n[1] === "n" && (a = n.endsWith("Capture"), t = n.slice(2, a ? n.length - 7 : void 0), o = e[I] || null, o = o == null ? null : o[n], typeof o == "function" && e.removeEventListener(t, o, a), typeof r == "function")) {
					typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)), e.addEventListener(t, r, a);
					break a;
				}
				n in e ? e[n] = r : !0 === r ? e.setAttribute(n, "") : kt(e, n, r);
			}
		}
	}
	function Pd(e, t, n) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "img":
				$("error", e), $("load", e);
				var r = !1, a = !1, o;
				for (o in n) if (n.hasOwnProperty(o)) {
					var s = n[o];
					if (s != null) switch (o) {
						case "src":
							r = !0;
							break;
						case "srcSet":
							a = !0;
							break;
						case "children":
						case "dangerouslySetInnerHTML": throw Error(i(137, t));
						default: Md(e, t, o, s, n, null);
					}
				}
				a && Md(e, t, "srcSet", n.srcSet, n, null), r && Md(e, t, "src", n.src, n, null);
				return;
			case "input":
				$("invalid", e);
				var c = o = s = a = null, l = null, u = null;
				for (r in n) if (n.hasOwnProperty(r)) {
					var d = n[r];
					if (d != null) switch (r) {
						case "name":
							a = d;
							break;
						case "type":
							s = d;
							break;
						case "checked":
							l = d;
							break;
						case "defaultChecked":
							u = d;
							break;
						case "value":
							o = d;
							break;
						case "defaultValue":
							c = d;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (d != null) throw Error(i(137, t));
							break;
						default: Md(e, t, r, d, n, null);
					}
				}
				Vt(e, o, c, l, u, s, a, !1);
				return;
			case "select":
				for (a in $("invalid", e), r = s = o = null, n) if (n.hasOwnProperty(a) && (c = n[a], c != null)) switch (a) {
					case "value":
						o = c;
						break;
					case "defaultValue":
						s = c;
						break;
					case "multiple": r = c;
					default: Md(e, t, a, c, n, null);
				}
				t = o, n = s, e.multiple = !!r, t == null ? n != null && Ut(e, !!r, n, !0) : Ut(e, !!r, t, !1);
				return;
			case "textarea":
				for (s in $("invalid", e), o = a = r = null, n) if (n.hasOwnProperty(s) && (c = n[s], c != null)) switch (s) {
					case "value":
						r = c;
						break;
					case "defaultValue":
						a = c;
						break;
					case "children":
						o = c;
						break;
					case "dangerouslySetInnerHTML":
						if (c != null) throw Error(i(91));
						break;
					default: Md(e, t, s, c, n, null);
				}
				Gt(e, r, a, o);
				return;
			case "option":
				for (l in n) if (n.hasOwnProperty(l) && (r = n[l], r != null)) switch (l) {
					case "selected":
						e.selected = r && typeof r != "function" && typeof r != "symbol";
						break;
					default: Md(e, t, l, r, n, null);
				}
				return;
			case "dialog":
				$("beforetoggle", e), $("toggle", e), $("cancel", e), $("close", e);
				break;
			case "iframe":
			case "object":
				$("load", e);
				break;
			case "video":
			case "audio":
				for (r = 0; r < gd.length; r++) $(gd[r], e);
				break;
			case "image":
				$("error", e), $("load", e);
				break;
			case "details":
				$("toggle", e);
				break;
			case "embed":
			case "source":
			case "link": $("error", e), $("load", e);
			case "area":
			case "base":
			case "br":
			case "col":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "track":
			case "wbr":
			case "menuitem":
				for (u in n) if (n.hasOwnProperty(u) && (r = n[u], r != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML": throw Error(i(137, t));
					default: Md(e, t, u, r, n, null);
				}
				return;
			default: if (Yt(t)) {
				for (d in n) n.hasOwnProperty(d) && (r = n[d], r !== void 0 && Nd(e, t, d, r, n, void 0));
				return;
			}
		}
		for (c in n) n.hasOwnProperty(c) && (r = n[c], r != null && Md(e, t, c, r, n, null));
	}
	function Fd(e, t, n, r) {
		switch (t) {
			case "div":
			case "span":
			case "svg":
			case "path":
			case "a":
			case "g":
			case "p":
			case "li": break;
			case "input":
				var a = null, o = null, s = null, c = null, l = null, u = null, d = null;
				for (m in n) {
					var f = n[m];
					if (n.hasOwnProperty(m) && f != null) switch (m) {
						case "checked": break;
						case "value": break;
						case "defaultValue": l = f;
						default: r.hasOwnProperty(m) || Md(e, t, m, null, r, f);
					}
				}
				for (var p in r) {
					var m = r[p];
					if (f = n[p], r.hasOwnProperty(p) && (m != null || f != null)) switch (p) {
						case "type":
							o = m;
							break;
						case "name":
							a = m;
							break;
						case "checked":
							u = m;
							break;
						case "defaultChecked":
							d = m;
							break;
						case "value":
							s = m;
							break;
						case "defaultValue":
							c = m;
							break;
						case "children":
						case "dangerouslySetInnerHTML":
							if (m != null) throw Error(i(137, t));
							break;
						default: m !== f && Md(e, t, p, m, r, f);
					}
				}
				Bt(e, s, c, l, u, d, o, a);
				return;
			case "select":
				for (o in m = s = c = p = null, n) if (l = n[o], n.hasOwnProperty(o) && l != null) switch (o) {
					case "value": break;
					case "multiple": m = l;
					default: r.hasOwnProperty(o) || Md(e, t, o, null, r, l);
				}
				for (a in r) if (o = r[a], l = n[a], r.hasOwnProperty(a) && (o != null || l != null)) switch (a) {
					case "value":
						p = o;
						break;
					case "defaultValue":
						c = o;
						break;
					case "multiple": s = o;
					default: o !== l && Md(e, t, a, o, r, l);
				}
				t = c, n = s, r = m, p == null ? !!r != !!n && (t == null ? Ut(e, !!n, n ? [] : "", !1) : Ut(e, !!n, t, !0)) : Ut(e, !!n, p, !1);
				return;
			case "textarea":
				for (c in m = p = null, n) if (a = n[c], n.hasOwnProperty(c) && a != null && !r.hasOwnProperty(c)) switch (c) {
					case "value": break;
					case "children": break;
					default: Md(e, t, c, null, r, a);
				}
				for (s in r) if (a = r[s], o = n[s], r.hasOwnProperty(s) && (a != null || o != null)) switch (s) {
					case "value":
						p = a;
						break;
					case "defaultValue":
						m = a;
						break;
					case "children": break;
					case "dangerouslySetInnerHTML":
						if (a != null) throw Error(i(91));
						break;
					default: a !== o && Md(e, t, s, a, r, o);
				}
				Wt(e, p, m);
				return;
			case "option":
				for (var h in n) if (p = n[h], n.hasOwnProperty(h) && p != null && !r.hasOwnProperty(h)) switch (h) {
					case "selected":
						e.selected = !1;
						break;
					default: Md(e, t, h, null, r, p);
				}
				for (l in r) if (p = r[l], m = n[l], r.hasOwnProperty(l) && p !== m && (p != null || m != null)) switch (l) {
					case "selected":
						e.selected = p && typeof p != "function" && typeof p != "symbol";
						break;
					default: Md(e, t, l, p, r, m);
				}
				return;
			case "img":
			case "link":
			case "area":
			case "base":
			case "br":
			case "col":
			case "embed":
			case "hr":
			case "keygen":
			case "meta":
			case "param":
			case "source":
			case "track":
			case "wbr":
			case "menuitem":
				for (var g in n) p = n[g], n.hasOwnProperty(g) && p != null && !r.hasOwnProperty(g) && Md(e, t, g, null, r, p);
				for (u in r) if (p = r[u], m = n[u], r.hasOwnProperty(u) && p !== m && (p != null || m != null)) switch (u) {
					case "children":
					case "dangerouslySetInnerHTML":
						if (p != null) throw Error(i(137, t));
						break;
					default: Md(e, t, u, p, r, m);
				}
				return;
			default: if (Yt(t)) {
				for (var _ in n) p = n[_], n.hasOwnProperty(_) && p !== void 0 && !r.hasOwnProperty(_) && Nd(e, t, _, void 0, r, p);
				for (d in r) p = r[d], m = n[d], !r.hasOwnProperty(d) || p === m || p === void 0 && m === void 0 || Nd(e, t, d, p, r, m);
				return;
			}
		}
		for (var v in n) p = n[v], n.hasOwnProperty(v) && p != null && !r.hasOwnProperty(v) && Md(e, t, v, null, r, p);
		for (f in r) p = r[f], m = n[f], !r.hasOwnProperty(f) || p === m || p == null && m == null || Md(e, t, f, p, r, m);
	}
	function Id(e) {
		switch (e) {
			case "css":
			case "script":
			case "font":
			case "img":
			case "image":
			case "input":
			case "link": return !0;
			default: return !1;
		}
	}
	function Ld() {
		if (typeof performance.getEntriesByType == "function") {
			for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), r = 0; r < n.length; r++) {
				var i = n[r], a = i.transferSize, o = i.initiatorType, s = i.duration;
				if (a && s && Id(o)) {
					for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
						var c = n[r], l = c.startTime;
						if (l > s) break;
						var u = c.transferSize, d = c.initiatorType;
						u && Id(d) && (c = c.responseEnd, o += u * (c < s ? 1 : (s - l) / (c - l)));
					}
					if (--r, t += 8 * (a + o) / (i.duration / 1e3), e++, 10 < e) break;
				}
			}
			if (0 < e) return t / e / 1e6;
		}
		return navigator.connection && (e = navigator.connection.downlink, typeof e == "number") ? e : 5;
	}
	var Rd = null, zd = null;
	function Bd(e) {
		return e.nodeType === 9 ? e : e.ownerDocument;
	}
	function Vd(e) {
		switch (e) {
			case "http://www.w3.org/2000/svg": return 1;
			case "http://www.w3.org/1998/Math/MathML": return 2;
			default: return 0;
		}
	}
	function Hd(e, t) {
		if (e === 0) switch (t) {
			case "svg": return 1;
			case "math": return 2;
			default: return 0;
		}
		return e === 1 && t === "foreignObject" ? 0 : e;
	}
	function Ud(e, t) {
		return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null;
	}
	var Wd = null;
	function Gd() {
		var e = window.event;
		return e && e.type === "popstate" ? e === Wd ? !1 : (Wd = e, !0) : (Wd = null, !1);
	}
	var Kd = typeof setTimeout == "function" ? setTimeout : void 0, qd = typeof clearTimeout == "function" ? clearTimeout : void 0, Jd = typeof Promise == "function" ? Promise : void 0, Yd = typeof queueMicrotask == "function" ? queueMicrotask : Jd === void 0 ? Kd : function(e) {
		return Jd.resolve(null).then(e).catch(Xd);
	};
	function Xd(e) {
		setTimeout(function() {
			throw e;
		});
	}
	function Zd(e) {
		return e === "head";
	}
	function Qd(e, t) {
		var n = t, r = 0;
		do {
			var i = n.nextSibling;
			if (e.removeChild(n), i && i.nodeType === 8) if (n = i.data, n === "/$" || n === "/&") {
				if (r === 0) {
					e.removeChild(i), Np(t);
					return;
				}
				r--;
			} else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&") r++;
			else if (n === "html") pf(e.ownerDocument.documentElement);
			else if (n === "head") {
				n = e.ownerDocument.head, pf(n);
				for (var a = n.firstChild; a;) {
					var o = a.nextSibling, s = a.nodeName;
					a[ht] || s === "SCRIPT" || s === "STYLE" || s === "LINK" && a.rel.toLowerCase() === "stylesheet" || n.removeChild(a), a = o;
				}
			} else n === "body" && pf(e.ownerDocument.body);
			n = i;
		} while (n);
		Np(t);
	}
	function $d(e, t) {
		var n = e;
		e = 0;
		do {
			var r = n.nextSibling;
			if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display, n.style.display = "none") : (n.style.display = n._stashedDisplay || "", n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue, n.nodeValue = "") : n.nodeValue = n._stashedText || ""), r && r.nodeType === 8) if (n = r.data, n === "/$") {
				if (e === 0) break;
				e--;
			} else n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
			n = r;
		} while (n);
	}
	function ef(e) {
		var t = e.firstChild;
		for (t && t.nodeType === 10 && (t = t.nextSibling); t;) {
			var n = t;
			switch (t = t.nextSibling, n.nodeName) {
				case "HTML":
				case "HEAD":
				case "BODY":
					ef(n), gt(n);
					continue;
				case "SCRIPT":
				case "STYLE": continue;
				case "LINK": if (n.rel.toLowerCase() === "stylesheet") continue;
			}
			e.removeChild(n);
		}
	}
	function tf(e, t, n, r) {
		for (; e.nodeType === 1;) {
			var i = n;
			if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
				if (!r && (e.nodeName !== "INPUT" || e.type !== "hidden")) break;
			} else if (!r) if (t === "input" && e.type === "hidden") {
				var a = i.name == null ? null : "" + i.name;
				if (i.type === "hidden" && e.getAttribute("name") === a) return e;
			} else return e;
			else if (!e[ht]) switch (t) {
				case "meta":
					if (!e.hasAttribute("itemprop")) break;
					return e;
				case "link":
					if (a = e.getAttribute("rel"), a === "stylesheet" && e.hasAttribute("data-precedence") || a !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title)) break;
					return e;
				case "style":
					if (e.hasAttribute("data-precedence")) break;
					return e;
				case "script":
					if (a = e.getAttribute("src"), (a !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && a && e.hasAttribute("async") && !e.hasAttribute("itemprop")) break;
					return e;
				default: return e;
			}
			if (e = cf(e.nextSibling), e === null) break;
		}
		return null;
	}
	function nf(e, t, n) {
		if (t === "") return null;
		for (; e.nodeType !== 3;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function rf(e, t) {
		for (; e.nodeType !== 8;) if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = cf(e.nextSibling), e === null)) return null;
		return e;
	}
	function af(e) {
		return e.data === "$?" || e.data === "$~";
	}
	function of(e) {
		return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading";
	}
	function sf(e, t) {
		var n = e.ownerDocument;
		if (e.data === "$~") e._reactRetry = t;
		else if (e.data !== "$?" || n.readyState !== "loading") t();
		else {
			var r = function() {
				t(), n.removeEventListener("DOMContentLoaded", r);
			};
			n.addEventListener("DOMContentLoaded", r), e._reactRetry = r;
		}
	}
	function cf(e) {
		for (; e != null; e = e.nextSibling) {
			var t = e.nodeType;
			if (t === 1 || t === 3) break;
			if (t === 8) {
				if (t = e.data, t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F") break;
				if (t === "/$" || t === "/&") return null;
			}
		}
		return e;
	}
	var lf = null;
	function uf(e) {
		e = e.nextSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "/$" || n === "/&") {
					if (t === 0) return cf(e.nextSibling);
					t--;
				} else n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++;
			}
			e = e.nextSibling;
		}
		return null;
	}
	function df(e) {
		e = e.previousSibling;
		for (var t = 0; e;) {
			if (e.nodeType === 8) {
				var n = e.data;
				if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
					if (t === 0) return e;
					t--;
				} else n !== "/$" && n !== "/&" || t++;
			}
			e = e.previousSibling;
		}
		return null;
	}
	function ff(e, t, n) {
		switch (t = Bd(n), e) {
			case "html":
				if (e = t.documentElement, !e) throw Error(i(452));
				return e;
			case "head":
				if (e = t.head, !e) throw Error(i(453));
				return e;
			case "body":
				if (e = t.body, !e) throw Error(i(454));
				return e;
			default: throw Error(i(451));
		}
	}
	function pf(e) {
		for (var t = e.attributes; t.length;) e.removeAttributeNode(t[0]);
		gt(e);
	}
	var mf = /* @__PURE__ */ new Map(), hf = /* @__PURE__ */ new Set();
	function gf(e) {
		return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument;
	}
	var _f = j.d;
	j.d = {
		f: vf,
		r: yf,
		D: Sf,
		C: Cf,
		L: wf,
		m: Tf,
		X: Df,
		S: Ef,
		M: Of
	};
	function vf() {
		var e = _f.f(), t = yu();
		return e || t;
	}
	function yf(e) {
		var t = vt(e);
		t !== null && t.tag === 5 && t.type === "form" ? Ss(t) : _f.r(e);
	}
	var bf = typeof document > "u" ? null : document;
	function xf(e, t, n) {
		var r = bf;
		if (r && typeof t == "string" && t) {
			var i = zt(t);
			i = "link[rel=\"" + e + "\"][href=\"" + i + "\"]", typeof n == "string" && (i += "[crossorigin=\"" + n + "\"]"), hf.has(i) || (hf.add(i), e = {
				rel: e,
				crossOrigin: n,
				href: t
			}, r.querySelector(i) === null && (t = r.createElement("link"), Pd(t, "link", e), bt(t), r.head.appendChild(t)));
		}
	}
	function Sf(e) {
		_f.D(e), xf("dns-prefetch", e, null);
	}
	function Cf(e, t) {
		_f.C(e, t), xf("preconnect", e, t);
	}
	function wf(e, t, n) {
		_f.L(e, t, n);
		var r = bf;
		if (r && e && t) {
			var i = "link[rel=\"preload\"][as=\"" + zt(t) + "\"]";
			t === "image" && n && n.imageSrcSet ? (i += "[imagesrcset=\"" + zt(n.imageSrcSet) + "\"]", typeof n.imageSizes == "string" && (i += "[imagesizes=\"" + zt(n.imageSizes) + "\"]")) : i += "[href=\"" + zt(e) + "\"]";
			var a = i;
			switch (t) {
				case "style":
					a = Af(e);
					break;
				case "script": a = Pf(e);
			}
			mf.has(a) || (e = m({
				rel: "preload",
				href: t === "image" && n && n.imageSrcSet ? void 0 : e,
				as: t
			}, n), mf.set(a, e), r.querySelector(i) !== null || t === "style" && r.querySelector(jf(a)) || t === "script" && r.querySelector(Ff(a)) || (t = r.createElement("link"), Pd(t, "link", e), bt(t), r.head.appendChild(t)));
		}
	}
	function Tf(e, t) {
		_f.m(e, t);
		var n = bf;
		if (n && e) {
			var r = t && typeof t.as == "string" ? t.as : "script", i = "link[rel=\"modulepreload\"][as=\"" + zt(r) + "\"][href=\"" + zt(e) + "\"]", a = i;
			switch (r) {
				case "audioworklet":
				case "paintworklet":
				case "serviceworker":
				case "sharedworker":
				case "worker":
				case "script": a = Pf(e);
			}
			if (!mf.has(a) && (e = m({
				rel: "modulepreload",
				href: e
			}, t), mf.set(a, e), n.querySelector(i) === null)) {
				switch (r) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": if (n.querySelector(Ff(a))) return;
				}
				r = n.createElement("link"), Pd(r, "link", e), bt(r), n.head.appendChild(r);
			}
		}
	}
	function Ef(e, t, n) {
		_f.S(e, t, n);
		var r = bf;
		if (r && e) {
			var i = yt(r).hoistableStyles, a = Af(e);
			t ||= "default";
			var o = i.get(a);
			if (!o) {
				var s = {
					loading: 0,
					preload: null
				};
				if (o = r.querySelector(jf(a))) s.loading = 5;
				else {
					e = m({
						rel: "stylesheet",
						href: e,
						"data-precedence": t
					}, n), (n = mf.get(a)) && Rf(e, n);
					var c = o = r.createElement("link");
					bt(c), Pd(c, "link", e), c._p = new Promise(function(e, t) {
						c.onload = e, c.onerror = t;
					}), c.addEventListener("load", function() {
						s.loading |= 1;
					}), c.addEventListener("error", function() {
						s.loading |= 2;
					}), s.loading |= 4, Lf(o, t, r);
				}
				o = {
					type: "stylesheet",
					instance: o,
					count: 1,
					state: s
				}, i.set(a, o);
			}
		}
	}
	function Df(e, t) {
		_f.X(e, t);
		var n = bf;
		if (n && e) {
			var r = yt(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = m({
				src: e,
				async: !0
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), bt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function Of(e, t) {
		_f.M(e, t);
		var n = bf;
		if (n && e) {
			var r = yt(n).hoistableScripts, i = Pf(e), a = r.get(i);
			a || (a = n.querySelector(Ff(i)), a || (e = m({
				src: e,
				async: !0,
				type: "module"
			}, t), (t = mf.get(i)) && zf(e, t), a = n.createElement("script"), bt(a), Pd(a, "link", e), n.head.appendChild(a)), a = {
				type: "script",
				instance: a,
				count: 1,
				state: null
			}, r.set(i, a));
		}
	}
	function kf(e, t, n, r) {
		var a = (a = pe.current) ? gf(a) : null;
		if (!a) throw Error(i(446));
		switch (e) {
			case "meta":
			case "title": return null;
			case "style": return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Af(n.href), n = yt(a).hoistableStyles, r = n.get(t), r || (r = {
				type: "style",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			case "link":
				if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
					e = Af(n.href);
					var o = yt(a).hoistableStyles, s = o.get(e);
					if (s || (a = a.ownerDocument || a, s = {
						type: "stylesheet",
						instance: null,
						count: 0,
						state: {
							loading: 0,
							preload: null
						}
					}, o.set(e, s), (o = a.querySelector(jf(e))) && !o._p && (s.instance = o, s.state.loading = 5), mf.has(e) || (n = {
						rel: "preload",
						as: "style",
						href: n.href,
						crossOrigin: n.crossOrigin,
						integrity: n.integrity,
						media: n.media,
						hrefLang: n.hrefLang,
						referrerPolicy: n.referrerPolicy
					}, mf.set(e, n), o || Nf(a, e, n, s.state))), t && r === null) throw Error(i(528, ""));
					return s;
				}
				if (t && r !== null) throw Error(i(529, ""));
				return null;
			case "script": return t = n.async, n = n.src, typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Pf(n), n = yt(a).hoistableScripts, r = n.get(t), r || (r = {
				type: "script",
				instance: null,
				count: 0,
				state: null
			}, n.set(t, r)), r) : {
				type: "void",
				instance: null,
				count: 0,
				state: null
			};
			default: throw Error(i(444, e));
		}
	}
	function Af(e) {
		return "href=\"" + zt(e) + "\"";
	}
	function jf(e) {
		return "link[rel=\"stylesheet\"][" + e + "]";
	}
	function Mf(e) {
		return m({}, e, {
			"data-precedence": e.precedence,
			precedence: null
		});
	}
	function Nf(e, t, n, r) {
		e.querySelector("link[rel=\"preload\"][as=\"style\"][" + t + "]") ? r.loading = 1 : (t = e.createElement("link"), r.preload = t, t.addEventListener("load", function() {
			return r.loading |= 1;
		}), t.addEventListener("error", function() {
			return r.loading |= 2;
		}), Pd(t, "link", n), bt(t), e.head.appendChild(t));
	}
	function Pf(e) {
		return "[src=\"" + zt(e) + "\"]";
	}
	function Ff(e) {
		return "script[async]" + e;
	}
	function If(e, t, n) {
		if (t.count++, t.instance === null) switch (t.type) {
			case "style":
				var r = e.querySelector("style[data-href~=\"" + zt(n.href) + "\"]");
				if (r) return t.instance = r, bt(r), r;
				var a = m({}, n, {
					"data-href": n.href,
					"data-precedence": n.precedence,
					href: null,
					precedence: null
				});
				return r = (e.ownerDocument || e).createElement("style"), bt(r), Pd(r, "style", a), Lf(r, n.precedence, e), t.instance = r;
			case "stylesheet":
				a = Af(n.href);
				var o = e.querySelector(jf(a));
				if (o) return t.state.loading |= 4, t.instance = o, bt(o), o;
				r = Mf(n), (a = mf.get(a)) && Rf(r, a), o = (e.ownerDocument || e).createElement("link"), bt(o);
				var s = o;
				return s._p = new Promise(function(e, t) {
					s.onload = e, s.onerror = t;
				}), Pd(o, "link", r), t.state.loading |= 4, Lf(o, n.precedence, e), t.instance = o;
			case "script": return o = Pf(n.src), (a = e.querySelector(Ff(o))) ? (t.instance = a, bt(a), a) : (r = n, (a = mf.get(o)) && (r = m({}, n), zf(r, a)), e = e.ownerDocument || e, a = e.createElement("script"), bt(a), Pd(a, "link", r), e.head.appendChild(a), t.instance = a);
			case "void": return null;
			default: throw Error(i(443, t.type));
		}
		else t.type === "stylesheet" && !(t.state.loading & 4) && (r = t.instance, t.state.loading |= 4, Lf(r, n.precedence, e));
		return t.instance;
	}
	function Lf(e, t, n) {
		for (var r = n.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), i = r.length ? r[r.length - 1] : null, a = i, o = 0; o < r.length; o++) {
			var s = r[o];
			if (s.dataset.precedence === t) a = s;
			else if (a !== i) break;
		}
		a ? a.parentNode.insertBefore(e, a.nextSibling) : (t = n.nodeType === 9 ? n.head : n, t.insertBefore(e, t.firstChild));
	}
	function Rf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.title ??= t.title;
	}
	function zf(e, t) {
		e.crossOrigin ??= t.crossOrigin, e.referrerPolicy ??= t.referrerPolicy, e.integrity ??= t.integrity;
	}
	var Bf = null;
	function Vf(e, t, n) {
		if (Bf === null) {
			var r = /* @__PURE__ */ new Map(), i = Bf = /* @__PURE__ */ new Map();
			i.set(n, r);
		} else i = Bf, r = i.get(n), r || (r = /* @__PURE__ */ new Map(), i.set(n, r));
		if (r.has(e)) return r;
		for (r.set(e, null), n = n.getElementsByTagName(e), i = 0; i < n.length; i++) {
			var a = n[i];
			if (!(a[ht] || a[lt] || e === "link" && a.getAttribute("rel") === "stylesheet") && a.namespaceURI !== "http://www.w3.org/2000/svg") {
				var o = a.getAttribute(t) || "";
				o = e + o;
				var s = r.get(o);
				s ? s.push(a) : r.set(o, [a]);
			}
		}
		return r;
	}
	function Hf(e, t, n) {
		e = e.ownerDocument || e, e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null);
	}
	function Uf(e, t, n) {
		if (n === 1 || t.itemProp != null) return !1;
		switch (e) {
			case "meta":
			case "title": return !0;
			case "style":
				if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "") break;
				return !0;
			case "link":
				if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError) break;
				switch (t.rel) {
					case "stylesheet": return e = t.disabled, typeof t.precedence == "string" && e == null;
					default: return !0;
				}
			case "script": if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string") return !0;
		}
		return !1;
	}
	function Wf(e) {
		return !(e.type === "stylesheet" && !(e.state.loading & 3));
	}
	function Gf(e, t, n, r) {
		if (n.type === "stylesheet" && (typeof r.media != "string" || !1 !== matchMedia(r.media).matches) && !(n.state.loading & 4)) {
			if (n.instance === null) {
				var i = Af(r.href), a = t.querySelector(jf(i));
				if (a) {
					t = a._p, typeof t == "object" && t && typeof t.then == "function" && (e.count++, e = Jf.bind(e), t.then(e, e)), n.state.loading |= 4, n.instance = a, bt(a);
					return;
				}
				a = t.ownerDocument || t, r = Mf(r), (i = mf.get(i)) && Rf(r, i), a = a.createElement("link"), bt(a);
				var o = a;
				o._p = new Promise(function(e, t) {
					o.onload = e, o.onerror = t;
				}), Pd(a, "link", r), n.instance = a;
			}
			e.stylesheets === null && (e.stylesheets = /* @__PURE__ */ new Map()), e.stylesheets.set(n, t), (t = n.state.preload) && !(n.state.loading & 3) && (e.count++, n = Jf.bind(e), t.addEventListener("load", n), t.addEventListener("error", n));
		}
	}
	var Kf = 0;
	function qf(e, t) {
		return e.stylesheets && e.count === 0 && Xf(e, e.stylesheets), 0 < e.count || 0 < e.imgCount ? function(n) {
			var r = setTimeout(function() {
				if (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, 6e4 + t);
			0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
			var i = setTimeout(function() {
				if (e.waitingForImages = !1, e.count === 0 && (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
					var t = e.unsuspend;
					e.unsuspend = null, t();
				}
			}, (e.imgBytes > Kf ? 50 : 800) + t);
			return e.unsuspend = n, function() {
				e.unsuspend = null, clearTimeout(r), clearTimeout(i);
			};
		} : null;
	}
	function Jf() {
		if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
			if (this.stylesheets) Xf(this, this.stylesheets);
			else if (this.unsuspend) {
				var e = this.unsuspend;
				this.unsuspend = null, e();
			}
		}
	}
	var Yf = null;
	function Xf(e, t) {
		e.stylesheets = null, e.unsuspend !== null && (e.count++, Yf = /* @__PURE__ */ new Map(), t.forEach(Zf, e), Yf = null, Jf.call(e));
	}
	function Zf(e, t) {
		if (!(t.state.loading & 4)) {
			var n = Yf.get(e);
			if (n) var r = n.get(null);
			else {
				n = /* @__PURE__ */ new Map(), Yf.set(e, n);
				for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), a = 0; a < i.length; a++) {
					var o = i[a];
					(o.nodeName === "LINK" || o.getAttribute("media") !== "not all") && (n.set(o.dataset.precedence, o), r = o);
				}
				r && n.set(null, r);
			}
			i = t.instance, o = i.getAttribute("data-precedence"), a = n.get(o) || r, a === r && n.set(null, i), n.set(o, i), this.count++, r = Jf.bind(this), i.addEventListener("load", r), i.addEventListener("error", r), a ? a.parentNode.insertBefore(i, a.nextSibling) : (e = e.nodeType === 9 ? e.head : e, e.insertBefore(i, e.firstChild)), t.state.loading |= 4;
		}
	}
	var Qf = {
		$$typeof: C,
		Provider: null,
		Consumer: null,
		_currentValue: oe,
		_currentValue2: oe,
		_threadCount: 0
	};
	function $f(e, t, n, r, i, a, o, s, c) {
		this.tag = 1, this.containerInfo = e, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = Qe(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = Qe(0), this.hiddenUpdates = Qe(null), this.identifierPrefix = r, this.onUncaughtError = i, this.onCaughtError = a, this.onRecoverableError = o, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = c, this.incompleteTransitions = /* @__PURE__ */ new Map();
	}
	function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
		return e = new $f(e, t, n, o, c, l, u, d, s), t = 1, !0 === a && (t |= 24), a = oi(3, null, null, t), e.current = a, a.stateNode = e, t = ra(), t.refCount++, e.pooledCache = t, t.refCount++, a.memoizedState = {
			element: r,
			isDehydrated: n,
			cache: t
		}, Ia(a), e;
	}
	function tp(e) {
		return e ? (e = ii, e) : ii;
	}
	function np(e, t, n, r, i, a) {
		i = tp(i), r.context === null ? r.context = i : r.pendingContext = i, r = Ra(t), r.payload = { element: n }, a = a === void 0 ? null : a, a !== null && (r.callback = a), n = za(e, r, t), n !== null && (mu(n, e, t), Ba(n, e, t));
	}
	function rp(e, t) {
		if (e = e.memoizedState, e !== null && e.dehydrated !== null) {
			var n = e.retryLane;
			e.retryLane = n !== 0 && n < t ? n : t;
		}
	}
	function ip(e, t) {
		rp(e, t), (e = e.alternate) && rp(e, t);
	}
	function ap(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = ti(e, 67108864);
			t !== null && mu(t, e, 67108864), ip(e, 67108864);
		}
	}
	function op(e) {
		if (e.tag === 13 || e.tag === 31) {
			var t = fu();
			t = it(t);
			var n = ti(e, t);
			n !== null && mu(n, e, t), ip(e, t);
		}
	}
	var sp = !0;
	function cp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 2, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function lp(e, t, n, r) {
		var i = A.T;
		A.T = null;
		var a = j.p;
		try {
			j.p = 8, up(e, t, n, r);
		} finally {
			j.p = a, A.T = i;
		}
	}
	function up(e, t, n, r) {
		if (sp) {
			var i = dp(r);
			if (i === null) Cd(e, t, r, fp, n), Cp(e, r);
			else if (Tp(i, e, t, n, r)) r.stopPropagation();
			else if (Cp(e, r), t & 4 && -1 < Sp.indexOf(e)) {
				for (; i !== null;) {
					var a = vt(i);
					if (a !== null) switch (a.tag) {
						case 3:
							if (a = a.stateNode, a.current.memoizedState.isDehydrated) {
								var o = Je(a.pendingLanes);
								if (o !== 0) {
									var s = a;
									for (s.pendingLanes |= 2, s.entangledLanes |= 2; o;) {
										var c = 1 << 31 - He(o);
										s.entanglements[1] |= c, o &= ~c;
									}
									nd(a), !(J & 6) && (eu = Ae() + 500, rd(0, !1));
								}
							}
							break;
						case 31:
						case 13: s = ti(a, 2), s !== null && mu(s, a, 2), yu(), ip(a, 2);
					}
					if (a = dp(r), a === null && Cd(e, t, r, fp, n), a === i) break;
					i = a;
				}
				i !== null && r.stopPropagation();
			} else Cd(e, t, r, null, n);
		}
	}
	function dp(e) {
		return e = tn(e), pp(e);
	}
	var fp = null;
	function pp(e) {
		if (fp = null, e = _t(e), e !== null) {
			var t = o(e);
			if (t === null) e = null;
			else {
				var n = t.tag;
				if (n === 13) {
					if (e = s(t), e !== null) return e;
					e = null;
				} else if (n === 31) {
					if (e = c(t), e !== null) return e;
					e = null;
				} else if (n === 3) {
					if (t.stateNode.current.memoizedState.isDehydrated) return t.tag === 3 ? t.stateNode.containerInfo : null;
					e = null;
				} else t !== e && (e = null);
			}
		}
		return fp = e, null;
	}
	function mp(e) {
		switch (e) {
			case "beforetoggle":
			case "cancel":
			case "click":
			case "close":
			case "contextmenu":
			case "copy":
			case "cut":
			case "auxclick":
			case "dblclick":
			case "dragend":
			case "dragstart":
			case "drop":
			case "focusin":
			case "focusout":
			case "input":
			case "invalid":
			case "keydown":
			case "keypress":
			case "keyup":
			case "mousedown":
			case "mouseup":
			case "paste":
			case "pause":
			case "play":
			case "pointercancel":
			case "pointerdown":
			case "pointerup":
			case "ratechange":
			case "reset":
			case "resize":
			case "seeked":
			case "submit":
			case "toggle":
			case "touchcancel":
			case "touchend":
			case "touchstart":
			case "volumechange":
			case "change":
			case "selectionchange":
			case "textInput":
			case "compositionstart":
			case "compositionend":
			case "compositionupdate":
			case "beforeblur":
			case "afterblur":
			case "beforeinput":
			case "blur":
			case "fullscreenchange":
			case "focus":
			case "hashchange":
			case "popstate":
			case "select":
			case "selectstart": return 2;
			case "drag":
			case "dragenter":
			case "dragexit":
			case "dragleave":
			case "dragover":
			case "mousemove":
			case "mouseout":
			case "mouseover":
			case "pointermove":
			case "pointerout":
			case "pointerover":
			case "scroll":
			case "touchmove":
			case "wheel":
			case "mouseenter":
			case "mouseleave":
			case "pointerenter":
			case "pointerleave": return 8;
			case "message": switch (je()) {
				case Me: return 2;
				case Ne: return 8;
				case Pe:
				case Fe: return 32;
				case Ie: return 268435456;
				default: return 32;
			}
			default: return 32;
		}
	}
	var hp = !1, gp = null, _p = null, vp = null, yp = /* @__PURE__ */ new Map(), bp = /* @__PURE__ */ new Map(), xp = [], Sp = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
	function Cp(e, t) {
		switch (e) {
			case "focusin":
			case "focusout":
				gp = null;
				break;
			case "dragenter":
			case "dragleave":
				_p = null;
				break;
			case "mouseover":
			case "mouseout":
				vp = null;
				break;
			case "pointerover":
			case "pointerout":
				yp.delete(t.pointerId);
				break;
			case "gotpointercapture":
			case "lostpointercapture": bp.delete(t.pointerId);
		}
	}
	function wp(e, t, n, r, i, a) {
		return e === null || e.nativeEvent !== a ? (e = {
			blockedOn: t,
			domEventName: n,
			eventSystemFlags: r,
			nativeEvent: a,
			targetContainers: [i]
		}, t !== null && (t = vt(t), t !== null && ap(t)), e) : (e.eventSystemFlags |= r, t = e.targetContainers, i !== null && t.indexOf(i) === -1 && t.push(i), e);
	}
	function Tp(e, t, n, r, i) {
		switch (t) {
			case "focusin": return gp = wp(gp, e, t, n, r, i), !0;
			case "dragenter": return _p = wp(_p, e, t, n, r, i), !0;
			case "mouseover": return vp = wp(vp, e, t, n, r, i), !0;
			case "pointerover":
				var a = i.pointerId;
				return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
			case "gotpointercapture": return a = i.pointerId, bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)), !0;
		}
		return !1;
	}
	function Ep(e) {
		var t = _t(e.target);
		if (t !== null) {
			var n = o(t);
			if (n !== null) {
				if (t = n.tag, t === 13) {
					if (t = s(n), t !== null) {
						e.blockedOn = t, st(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 31) {
					if (t = c(n), t !== null) {
						e.blockedOn = t, st(e.priority, function() {
							op(n);
						});
						return;
					}
				} else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
					e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
					return;
				}
			}
		}
		e.blockedOn = null;
	}
	function Dp(e) {
		if (e.blockedOn !== null) return !1;
		for (var t = e.targetContainers; 0 < t.length;) {
			var n = dp(e.nativeEvent);
			if (n === null) {
				n = e.nativeEvent;
				var r = new n.constructor(n.type, n);
				en = r, n.target.dispatchEvent(r), en = null;
			} else return t = vt(n), t !== null && ap(t), e.blockedOn = n, !1;
			t.shift();
		}
		return !0;
	}
	function Op(e, t, n) {
		Dp(e) && n.delete(t);
	}
	function kp() {
		hp = !1, gp !== null && Dp(gp) && (gp = null), _p !== null && Dp(_p) && (_p = null), vp !== null && Dp(vp) && (vp = null), yp.forEach(Op), bp.forEach(Op);
	}
	function Ap(e, n) {
		e.blockedOn === n && (e.blockedOn = null, hp || (hp = !0, t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
	}
	var jp = null;
	function Mp(e) {
		jp !== e && (jp = e, t.unstable_scheduleCallback(t.unstable_NormalPriority, function() {
			jp === e && (jp = null);
			for (var t = 0; t < e.length; t += 3) {
				var n = e[t], r = e[t + 1], i = e[t + 2];
				if (typeof r != "function") {
					if (pp(r || n) === null) continue;
					break;
				}
				var a = vt(n);
				a !== null && (e.splice(t, 3), t -= 3, bs(a, {
					pending: !0,
					data: i,
					method: n.method,
					action: r
				}, r, i));
			}
		}));
	}
	function Np(e) {
		function t(t) {
			return Ap(t, e);
		}
		gp !== null && Ap(gp, e), _p !== null && Ap(_p, e), vp !== null && Ap(vp, e), yp.forEach(t), bp.forEach(t);
		for (var n = 0; n < xp.length; n++) {
			var r = xp[n];
			r.blockedOn === e && (r.blockedOn = null);
		}
		for (; 0 < xp.length && (n = xp[0], n.blockedOn === null);) Ep(n), n.blockedOn === null && xp.shift();
		if (n = (e.ownerDocument || e).$$reactFormReplay, n != null) for (r = 0; r < n.length; r += 3) {
			var i = n[r], a = n[r + 1], o = i[I] || null;
			if (typeof a == "function") o || Mp(n);
			else if (o) {
				var s = null;
				if (a && a.hasAttribute("formAction")) {
					if (i = a, o = a[I] || null) s = o.formAction;
					else if (pp(i) !== null) continue;
				} else s = o.action;
				typeof s == "function" ? n[r + 1] = s : (n.splice(r, 3), r -= 3), Mp(n);
			}
		}
	}
	function Pp() {
		function e(e) {
			e.canIntercept && e.info === "react-transition" && e.intercept({
				handler: function() {
					return new Promise(function(e) {
						return i = e;
					});
				},
				focusReset: "manual",
				scroll: "manual"
			});
		}
		function t() {
			i !== null && (i(), i = null), r || setTimeout(n, 20);
		}
		function n() {
			if (!r && !navigation.transition) {
				var e = navigation.currentEntry;
				e && e.url != null && navigation.navigate(e.url, {
					state: e.getState(),
					info: "react-transition",
					history: "replace"
				});
			}
		}
		if (typeof navigation == "object") {
			var r = !1, i = null;
			return navigation.addEventListener("navigate", e), navigation.addEventListener("navigatesuccess", t), navigation.addEventListener("navigateerror", t), setTimeout(n, 100), function() {
				r = !0, navigation.removeEventListener("navigate", e), navigation.removeEventListener("navigatesuccess", t), navigation.removeEventListener("navigateerror", t), i !== null && (i(), i = null);
			};
		}
	}
	function Fp(e) {
		this._internalRoot = e;
	}
	Ip.prototype.render = Fp.prototype.render = function(e) {
		var t = this._internalRoot;
		if (t === null) throw Error(i(409));
		var n = t.current;
		np(n, fu(), e, t, null, null);
	}, Ip.prototype.unmount = Fp.prototype.unmount = function() {
		var e = this._internalRoot;
		if (e !== null) {
			this._internalRoot = null;
			var t = e.containerInfo;
			np(e.current, 2, null, e, null, null), yu(), t[ut] = null;
		}
	};
	function Ip(e) {
		this._internalRoot = e;
	}
	Ip.prototype.unstable_scheduleHydration = function(e) {
		if (e) {
			var t = ot();
			e = {
				blockedOn: null,
				target: e,
				priority: t
			};
			for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
			xp.splice(n, 0, e), n === 0 && Ep(e);
		}
	};
	var Lp = n.version;
	if (Lp !== "19.2.5") throw Error(i(527, Lp, "19.2.5"));
	j.findDOMNode = function(e) {
		var t = e._reactInternals;
		if (t === void 0) throw typeof e.render == "function" ? Error(i(188)) : (e = Object.keys(e).join(","), Error(i(268, e)));
		return e = u(t), e = e === null ? null : f(e), e = e === null ? null : e.stateNode, e;
	};
	var Rp = {
		bundleType: 0,
		version: "19.2.5",
		rendererPackageName: "react-dom",
		currentDispatcherRef: A,
		reconcilerVersion: "19.2.5"
	};
	if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
		var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
		if (!zp.isDisabled && zp.supportsFiber) try {
			ze = zp.inject(Rp), Be = zp;
		} catch {}
	}
	e.createRoot = function(e, t) {
		if (!a(e)) throw Error(i(299));
		var n = !1, r = "", o = Us, s = Ws, c = Gs;
		return t != null && (!0 === t.unstable_strictMode && (n = !0), t.identifierPrefix !== void 0 && (r = t.identifierPrefix), t.onUncaughtError !== void 0 && (o = t.onUncaughtError), t.onCaughtError !== void 0 && (s = t.onCaughtError), t.onRecoverableError !== void 0 && (c = t.onRecoverableError)), t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp), e[ut] = t.current, xd(e), new Fp(t);
	};
})), _ = /* @__PURE__ */ s(((e, t) => {
	function n() {
		if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function")) try {
			__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
		} catch (e) {
			console.error(e);
		}
	}
	n(), t.exports = g();
}));
//#endregion
//#region node_modules/@remix-run/router/dist/router.js
function v() {
	return v = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, v.apply(this, arguments);
}
function y(e, t) {
	if (e === !1 || e == null) throw Error(t);
}
function b(e, t) {
	if (!e) {
		typeof console < "u" && console.warn(t);
		try {
			throw Error(t);
		} catch {}
	}
}
function x(e) {
	let { pathname: t = "/", search: n = "", hash: r = "" } = e;
	return n && n !== "?" && (t += n.charAt(0) === "?" ? n : "?" + n), r && r !== "#" && (t += r.charAt(0) === "#" ? r : "#" + r), t;
}
function S(e) {
	let t = {};
	if (e) {
		let n = e.indexOf("#");
		n >= 0 && (t.hash = e.substr(n), e = e.substr(0, n));
		let r = e.indexOf("?");
		r >= 0 && (t.search = e.substr(r), e = e.substr(0, r)), e && (t.pathname = e);
	}
	return t;
}
function C(e, t) {
	if (t === "/") return e;
	if (!e.toLowerCase().startsWith(t.toLowerCase())) return null;
	let n = t.endsWith("/") ? t.length - 1 : t.length, r = e.charAt(n);
	return r && r !== "/" ? null : e.slice(n) || "/";
}
function w(e, t) {
	t === void 0 && (t = "/");
	let { pathname: n, search: r = "", hash: i = "" } = typeof e == "string" ? S(e) : e, a;
	if (n) if (re(n)) a = n;
	else {
		if (n.includes("//")) {
			let e = n;
			n = n.replace(/\/\/+/g, "/"), b(!1, "Pathnames cannot have embedded double slashes - normalizing " + (e + " -> " + n));
		}
		a = n.startsWith("/") ? T(n.substring(1), "/") : T(n, t);
	}
	else a = t;
	return {
		pathname: a,
		search: ae(r),
		hash: A(i)
	};
}
function T(e, t) {
	let n = t.replace(/\/+$/, "").split("/");
	return e.split("/").forEach((e) => {
		e === ".." ? n.length > 1 && n.pop() : e !== "." && n.push(e);
	}), n.length > 1 ? n.join("/") : "/";
}
function E(e, t, n, r) {
	return "Cannot include a '" + e + "' character in a manually specified " + ("`to." + t + "` field [" + JSON.stringify(r) + "].  Please separate it out to the ") + ("`to." + n + "` field. Alternatively you may provide the full path as ") + "a string in <Link to=\"...\"> and the router will parse it for you.";
}
function D(e) {
	return e.filter((e, t) => t === 0 || e.route.path && e.route.path.length > 0);
}
function O(e, t) {
	let n = D(e);
	return t ? n.map((e, t) => t === n.length - 1 ? e.pathname : e.pathnameBase) : n.map((e) => e.pathnameBase);
}
function k(e, t, n, r) {
	r === void 0 && (r = !1);
	let i;
	typeof e == "string" ? i = S(e) : (i = v({}, e), y(!i.pathname || !i.pathname.includes("?"), E("?", "pathname", "search", i)), y(!i.pathname || !i.pathname.includes("#"), E("#", "pathname", "hash", i)), y(!i.search || !i.search.includes("#"), E("#", "search", "hash", i)));
	let a = e === "" || i.pathname === "", o = a ? "/" : i.pathname, s;
	if (o == null) s = n;
	else {
		let e = t.length - 1;
		if (!r && o.startsWith("..")) {
			let t = o.split("/");
			for (; t[0] === "..";) t.shift(), --e;
			i.pathname = t.join("/");
		}
		s = e >= 0 ? t[e] : "/";
	}
	let c = w(i, s), l = o && o !== "/" && o.endsWith("/"), u = (a || o === ".") && n.endsWith("/");
	return !c.pathname.endsWith("/") && (l || u) && (c.pathname += "/"), c;
}
var ee, te, ne, re, ie, ae, A, j, oe, se = o((() => {
	(function(e) {
		e.Pop = "POP", e.Push = "PUSH", e.Replace = "REPLACE";
	})(ee ||= {}), (function(e) {
		e.data = "data", e.deferred = "deferred", e.redirect = "redirect", e.error = "error";
	})(te ||= {}), ne = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, re = (e) => ne.test(e), ie = (e) => e.join("/").replace(/\/\/+/g, "/"), ae = (e) => !e || e === "?" ? "" : e.startsWith("?") ? e : "?" + e, A = (e) => !e || e === "#" ? "" : e.startsWith("#") ? e : "#" + e, j = [
		"post",
		"put",
		"patch",
		"delete"
	], new Set(j), oe = ["get", ...j], new Set(oe);
}));
//#endregion
//#region node_modules/react-router/dist/index.js
function ce() {
	return ce = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, ce.apply(this, arguments);
}
function le(e, t) {
	let { relative: n } = t === void 0 ? {} : t;
	!ue() && y(!1);
	let { basename: r, navigator: i } = N.useContext(be), { hash: a, pathname: o, search: s } = me(e, { relative: n }), c = o;
	return r !== "/" && (c = o === "/" ? r : ie([r, o])), i.createHref({
		pathname: c,
		search: s,
		hash: a
	});
}
function ue() {
	return N.useContext(xe) != null;
}
function M() {
	return !ue() && y(!1), N.useContext(xe).location;
}
function de(e) {
	N.useContext(be).static || N.useLayoutEffect(e);
}
function fe() {
	let { isDataRoute: e } = N.useContext(Se);
	return e ? ve() : pe();
}
function pe() {
	!ue() && y(!1);
	let e = N.useContext(ye), { basename: t, future: n, navigator: r } = N.useContext(be), { matches: i } = N.useContext(Se), { pathname: a } = M(), o = JSON.stringify(O(i, n.v7_relativeSplatPath)), s = N.useRef(!1);
	return de(() => {
		s.current = !0;
	}), N.useCallback(function(n, i) {
		if (i === void 0 && (i = {}), !s.current) return;
		if (typeof n == "number") {
			r.go(n);
			return;
		}
		let c = k(n, JSON.parse(o), a, i.relative === "path");
		e == null && t !== "/" && (c.pathname = c.pathname === "/" ? t : ie([t, c.pathname])), (i.replace ? r.replace : r.push)(c, i.state, i);
	}, [
		t,
		r,
		o,
		a,
		e
	]);
}
function me(e, t) {
	let { relative: n } = t === void 0 ? {} : t, { future: r } = N.useContext(be), { matches: i } = N.useContext(Se), { pathname: a } = M(), o = JSON.stringify(O(i, r.v7_relativeSplatPath));
	return N.useMemo(() => k(e, JSON.parse(o), a, n === "path"), [
		e,
		o,
		a,
		n
	]);
}
function he(e) {
	let t = N.useContext(ye);
	return !t && y(!1), t;
}
function ge(e) {
	let t = N.useContext(Se);
	return !t && y(!1), t;
}
function _e(e) {
	let t = ge(e), n = t.matches[t.matches.length - 1];
	return !n.route.id && y(!1), n.route.id;
}
function ve() {
	let { router: e } = he(Ce.UseNavigateStable), t = _e(we.UseNavigateStable), n = N.useRef(!1);
	return de(() => {
		n.current = !0;
	}), N.useCallback(function(r, i) {
		i === void 0 && (i = {}), n.current && (typeof r == "number" ? e.navigate(r) : e.navigate(r, ce({ fromRouteId: t }, i)));
	}, [e, t]);
}
var N, ye, be, xe, Se, Ce, we, Te, Ee = o((() => {
	N = /* @__PURE__ */ l(d()), se(), ye = /* @__PURE__ */ N.createContext(null), be = /* @__PURE__ */ N.createContext(null), xe = /* @__PURE__ */ N.createContext(null), Se = /* @__PURE__ */ N.createContext({
		outlet: null,
		matches: [],
		isDataRoute: !1
	}), N.Component, Ce = /* @__PURE__ */ function(e) {
		return e.UseBlocker = "useBlocker", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e;
	}(Ce || {}), we = /* @__PURE__ */ function(e) {
		return e.UseBlocker = "useBlocker", e.UseLoaderData = "useLoaderData", e.UseActionData = "useActionData", e.UseRouteError = "useRouteError", e.UseNavigation = "useNavigation", e.UseRouteLoaderData = "useRouteLoaderData", e.UseMatches = "useMatches", e.UseRevalidator = "useRevalidator", e.UseNavigateStable = "useNavigate", e.UseRouteId = "useRouteId", e;
	}(we || {}), N.startTransition, Te = /* @__PURE__ */ function(e) {
		return e[e.pending = 0] = "pending", e[e.success = 1] = "success", e[e.error = 2] = "error", e;
	}(Te || {}), new Promise(() => {}), N.Component;
}));
//#endregion
//#region node_modules/react-router-dom/dist/index.js
function De() {
	return De = Object.assign ? Object.assign.bind() : function(e) {
		for (var t = 1; t < arguments.length; t++) {
			var n = arguments[t];
			for (var r in n) Object.prototype.hasOwnProperty.call(n, r) && (e[r] = n[r]);
		}
		return e;
	}, De.apply(this, arguments);
}
function Oe(e, t) {
	if (e == null) return {};
	var n = {}, r = Object.keys(e), i, a;
	for (a = 0; a < r.length; a++) i = r[a], !(t.indexOf(i) >= 0) && (n[i] = e[i]);
	return n;
}
function ke(e) {
	return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
function Ae(e, t) {
	return e.button === 0 && (!t || t === "_self") && !ke(e);
}
function je(e, t) {
	let { target: n, replace: r, state: i, preventScrollReset: a, relative: o, viewTransition: s } = t === void 0 ? {} : t, c = fe(), l = M(), u = me(e, { relative: o });
	return Me.useCallback((t) => {
		Ae(t, n) && (t.preventDefault(), c(e, {
			replace: r === void 0 ? x(l) === x(u) : r,
			state: i,
			preventScrollReset: a,
			relative: o,
			viewTransition: s
		}));
	}, [
		l,
		c,
		u,
		r,
		i,
		n,
		e,
		a,
		o,
		s
	]);
}
var Me, Ne, Pe, Fe, Ie, Le, Re, ze, Be, Ve = o((() => {
	Me = /* @__PURE__ */ l(d()), Ne = /* @__PURE__ */ l(h()), Ee(), se(), Pe = [
		"onClick",
		"relative",
		"reloadDocument",
		"replace",
		"state",
		"target",
		"to",
		"preventScrollReset",
		"viewTransition"
	], Fe = "6";
	try {
		window.__reactRouterVersion = Fe;
	} catch {}
	Me.startTransition, Ne.flushSync, Me.useId, Ie = typeof window < "u" && window.document !== void 0 && window.document.createElement !== void 0, Le = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i, Re = /* @__PURE__ */ Me.forwardRef(function(e, t) {
		let { onClick: n, relative: r, reloadDocument: i, replace: a, state: o, target: s, to: c, preventScrollReset: l, viewTransition: u } = e, d = Oe(e, Pe), { basename: f } = Me.useContext(be), p, m = !1;
		if (typeof c == "string" && Le.test(c) && (p = c, Ie)) try {
			let e = new URL(window.location.href), t = c.startsWith("//") ? new URL(e.protocol + c) : new URL(c), n = C(t.pathname, f);
			t.origin === e.origin && n != null ? c = n + t.search + t.hash : m = !0;
		} catch {}
		let h = le(c, { relative: r }), g = je(c, {
			replace: a,
			state: o,
			target: s,
			preventScrollReset: l,
			relative: r,
			viewTransition: u
		});
		function _(e) {
			n && n(e), e.defaultPrevented || g(e);
		}
		return /* @__PURE__ */ Me.createElement("a", De({}, d, {
			href: p || h,
			onClick: m || i ? n : _,
			ref: t,
			target: s
		}));
	}), (function(e) {
		e.UseScrollRestoration = "useScrollRestoration", e.UseSubmit = "useSubmit", e.UseSubmitFetcher = "useSubmitFetcher", e.UseFetcher = "useFetcher", e.useViewTransitionState = "useViewTransitionState";
	})(ze ||= {}), (function(e) {
		e.UseFetcher = "useFetcher", e.UseFetchers = "useFetchers", e.UseScrollRestoration = "useScrollRestoration";
	})(Be ||= {});
}));
//#endregion
//#region node_modules/gsap/gsap-core.js
function He(e) {
	if (e === void 0) throw ReferenceError("this hasn't been initialised - super() hasn't been called");
	return e;
}
function Ue(e, t) {
	e.prototype = Object.create(t.prototype), e.prototype.constructor = e, e.__proto__ = t;
}
var We, Ge, Ke, qe, P, Je, F, Ye, Xe, Ze, Qe, $e, et, tt, nt, rt, it, at, ot, st, ct, lt, I, ut, dt, ft, pt, mt, ht, gt, _t, vt, L, yt, bt, xt, St, Ct, wt, Tt, Et, Dt, Ot, kt, At, jt, Mt, Nt, Pt, Ft, It, Lt, Rt, zt, Bt, Vt, Ht, Ut, Wt, Gt, R, Kt, qt, Jt, Yt, Xt, Zt, Qt, $t, en, tn, nn, rn, an, on, sn, cn, ln, un, dn, fn, pn, mn, hn, gn, _n, vn, yn, bn, xn, Sn, Cn, wn, Tn, En, Dn, On, kn, An, jn, Mn, Nn, Pn, Fn, In, Ln, Rn, zn, Bn, Vn, Hn, Un, Wn, Gn, Kn, qn, Jn, Yn, Xn, Zn, Qn, $n, er, tr, nr, rr, ir, ar, or, sr, z, cr, lr, ur, dr, fr, pr, mr, hr, gr, _r, vr, B, yr, br, xr, Sr, Cr, wr, Tr, Er, Dr, Or, kr, Ar, jr, Mr, Nr, Pr, Fr, Ir, Lr, Rr, zr, Br, Vr, Hr, Ur, Wr, Gr, Kr, qr, Jr, Yr, Xr, Zr, Qr, $r, ei, ti, ni, ri, ii, ai, oi, si, ci, li, ui, di, fi, pi, mi, hi, gi, _i, vi, yi, bi, xi = o((() => {
	We = {
		autoSleep: 120,
		force3D: "auto",
		nullTargetWarn: 1,
		units: { lineHeight: "" }
	}, Ge = {
		duration: .5,
		overwrite: !1,
		delay: 0
	}, Je = 1e8, F = 1 / Je, Ye = Math.PI * 2, Xe = Ye / 4, Ze = 0, Qe = Math.sqrt, $e = Math.cos, et = Math.sin, tt = function(e) {
		return typeof e == "string";
	}, nt = function(e) {
		return typeof e == "function";
	}, rt = function(e) {
		return typeof e == "number";
	}, it = function(e) {
		return e === void 0;
	}, at = function(e) {
		return typeof e == "object";
	}, ot = function(e) {
		return e !== !1;
	}, st = function() {
		return typeof window < "u";
	}, ct = function(e) {
		return nt(e) || tt(e);
	}, lt = typeof ArrayBuffer == "function" && ArrayBuffer.isView || function() {}, I = Array.isArray, ut = /random\([^)]+\)/g, dt = /,\s*/g, ft = /(?:-?\.?\d|\.)+/gi, pt = /[-+=.]*\d+[.e\-+]*\d*[e\-+]*\d*/g, mt = /[-+=.]*\d+[.e-]*\d*[a-z%]*/g, ht = /[-+=.]*\d+\.?\d*(?:e-|e\+)?\d*/gi, gt = /[+-]=-?[.\d]+/, _t = /[^,'"\[\]\s]+/gi, vt = /^[+\-=e\s\d]*\d+[.\d]*([a-z]*|%)\s*$/i, St = {}, Ct = {}, Tt = function(e) {
		return (Ct = nn(e, St)) && bi;
	}, Et = function(e, t) {
		return console.warn("Invalid property", e, "set to", t, "Missing plugin? gsap.registerPlugin()");
	}, Dt = function(e, t) {
		return !t && console.warn(e);
	}, Ot = function(e, t) {
		return e && (St[e] = t) && Ct && (Ct[e] = t) || St;
	}, kt = function() {
		return 0;
	}, At = {
		suppressEvents: !0,
		isStart: !0,
		kill: !1
	}, jt = {
		suppressEvents: !0,
		kill: !1
	}, Mt = { suppressEvents: !0 }, Nt = {}, Pt = [], Ft = {}, Lt = {}, Rt = {}, zt = 30, Bt = [], Vt = "", Ht = function(e) {
		var t = e[0], n, r;
		if (at(t) || nt(t) || (e = [e]), !(n = (t._gsap || {}).harness)) {
			for (r = Bt.length; r-- && !Bt[r].targetTest(t););
			n = Bt[r];
		}
		for (r = e.length; r--;) e[r] && (e[r]._gsap || (e[r]._gsap = new Ar(e[r], n))) || e.splice(r, 1);
		return e;
	}, Ut = function(e) {
		return e._gsap || Ht(Bn(e))[0]._gsap;
	}, Wt = function(e, t, n) {
		return (n = e[t]) && nt(n) ? e[t]() : it(n) && e.getAttribute && e.getAttribute(t) || n;
	}, Gt = function(e, t) {
		return (e = e.split(",")).forEach(t) || e;
	}, R = function(e) {
		return Math.round(e * 1e5) / 1e5 || 0;
	}, Kt = function(e) {
		return Math.round(e * 1e7) / 1e7 || 0;
	}, qt = function(e, t) {
		var n = t.charAt(0), r = parseFloat(t.substr(2));
		return e = parseFloat(e), n === "+" ? e + r : n === "-" ? e - r : n === "*" ? e * r : e / r;
	}, Jt = function(e, t) {
		for (var n = t.length, r = 0; e.indexOf(t[r]) < 0 && ++r < n;);
		return r < n;
	}, Yt = function() {
		var e = Pt.length, t = Pt.slice(0), n, r;
		for (Ft = {}, Pt.length = 0, n = 0; n < e; n++) r = t[n], r && r._lazy && (r.render(r._lazy[0], r._lazy[1], !0)._lazy = 0);
	}, Xt = function(e) {
		return !!(e._initted || e._startAt || e.add);
	}, Zt = function(e, t, n, r) {
		Pt.length && !qe && Yt(), e.render(t, n, r || !!(qe && t < 0 && Xt(e))), Pt.length && !qe && Yt();
	}, Qt = function(e) {
		var t = parseFloat(e);
		return (t || t === 0) && (e + "").match(_t).length < 2 ? t : tt(e) ? e.trim() : e;
	}, $t = function(e) {
		return e;
	}, en = function(e, t) {
		for (var n in t) n in e || (e[n] = t[n]);
		return e;
	}, tn = function(e) {
		return function(t, n) {
			for (var r in n) r in t || r === "duration" && e || r === "ease" || (t[r] = n[r]);
		};
	}, nn = function(e, t) {
		for (var n in t) e[n] = t[n];
		return e;
	}, rn = function e(t, n) {
		for (var r in n) r !== "__proto__" && r !== "constructor" && r !== "prototype" && (t[r] = at(n[r]) ? e(t[r] || (t[r] = {}), n[r]) : n[r]);
		return t;
	}, an = function(e, t) {
		var n = {}, r;
		for (r in e) r in t || (n[r] = e[r]);
		return n;
	}, on = function(e) {
		var t = e.parent || L, n = e.keyframes ? tn(I(e.keyframes)) : en;
		if (ot(e.inherit)) for (; t;) n(e, t.vars.defaults), t = t.parent || t._dp;
		return e;
	}, sn = function(e, t) {
		for (var n = e.length, r = n === t.length; r && n-- && e[n] === t[n];);
		return n < 0;
	}, cn = function(e, t, n, r, i) {
		n === void 0 && (n = "_first"), r === void 0 && (r = "_last");
		var a = e[r], o;
		if (i) for (o = t[i]; a && a[i] > o;) a = a._prev;
		return a ? (t._next = a._next, a._next = t) : (t._next = e[n], e[n] = t), t._next ? t._next._prev = t : e[r] = t, t._prev = a, t.parent = t._dp = e, t;
	}, ln = function(e, t, n, r) {
		n === void 0 && (n = "_first"), r === void 0 && (r = "_last");
		var i = t._prev, a = t._next;
		i ? i._next = a : e[n] === t && (e[n] = a), a ? a._prev = i : e[r] === t && (e[r] = i), t._next = t._prev = t.parent = null;
	}, un = function(e, t) {
		e.parent && (!t || e.parent.autoRemoveChildren) && e.parent.remove && e.parent.remove(e), e._act = 0;
	}, dn = function(e, t) {
		if (e && (!t || t._end > e._dur || t._start < 0)) for (var n = e; n;) n._dirty = 1, n = n.parent;
		return e;
	}, fn = function(e) {
		for (var t = e.parent; t && t.parent;) t._dirty = 1, t.totalDuration(), t = t.parent;
		return e;
	}, pn = function(e, t, n, r) {
		return e._startAt && (qe ? e._startAt.revert(jt) : e.vars.immediateRender && !e.vars.autoRevert || e._startAt.render(t, !0, r));
	}, mn = function e(t) {
		return !t || t._ts && e(t.parent);
	}, hn = function(e) {
		return e._repeat ? gn(e._tTime, e = e.duration() + e._rDelay) * e : 0;
	}, gn = function(e, t) {
		var n = Math.floor(e = Kt(e / t));
		return e && n === e ? n - 1 : n;
	}, _n = function(e, t) {
		return (e - t._start) * t._ts + (t._ts >= 0 ? 0 : t._dirty ? t.totalDuration() : t._tDur);
	}, vn = function(e) {
		return e._end = Kt(e._start + (e._tDur / Math.abs(e._ts || e._rts || F) || 0));
	}, yn = function(e, t) {
		var n = e._dp;
		return n && n.smoothChildTiming && e._ts && (e._start = Kt(n._time - (e._ts > 0 ? t / e._ts : ((e._dirty ? e.totalDuration() : e._tDur) - t) / -e._ts)), vn(e), n._dirty || dn(n, e)), e;
	}, bn = function(e, t) {
		var n;
		if ((t._time || !t._dur && t._initted || t._start < e._time && (t._dur || !t.add)) && (n = _n(e.rawTime(), t), (!t._dur || Pn(0, t.totalDuration(), n) - t._tTime > F) && t.render(n, !0)), dn(e, t)._dp && e._initted && e._time >= e._dur && e._ts) {
			if (e._dur < e.duration()) for (n = e; n._dp;) n.rawTime() >= 0 && n.totalTime(n._tTime), n = n._dp;
			e._zTime = -F;
		}
	}, xn = function(e, t, n, r) {
		return t.parent && un(t), t._start = Kt((rt(n) ? n : n || e !== L ? jn(e, n, t) : e._time) + t._delay), t._end = Kt(t._start + (t.totalDuration() / Math.abs(t.timeScale()) || 0)), cn(e, t, "_first", "_last", e._sort ? "_start" : 0), Tn(t) || (e._recent = t), r || bn(e, t), e._ts < 0 && yn(e, e._tTime), e;
	}, Sn = function(e, t) {
		return (St.ScrollTrigger || Et("scrollTrigger", t)) && St.ScrollTrigger.create(t, e);
	}, Cn = function(e, t, n, r, i) {
		if (zr(e, t, i), !e._initted) return 1;
		if (!n && e._pt && !qe && (e._dur && e.vars.lazy !== !1 || !e._dur && e.vars.lazy) && It !== _r.frame) return Pt.push(e), e._lazy = [i, r], 1;
	}, wn = function e(t) {
		var n = t.parent;
		return n && n._ts && n._initted && !n._lock && (n.rawTime() < 0 || e(n));
	}, Tn = function(e) {
		var t = e.data;
		return t === "isFromStart" || t === "isStart";
	}, En = function(e, t, n, r) {
		var i = e.ratio, a = t < 0 || !t && (!e._start && wn(e) && !(!e._initted && Tn(e)) || (e._ts < 0 || e._dp._ts < 0) && !Tn(e)) ? 0 : 1, o = e._rDelay, s = 0, c, l, u;
		if (o && e._repeat && (s = Pn(0, e._tDur, t), l = gn(s, o), e._yoyo && l & 1 && (a = 1 - a), l !== gn(e._tTime, o) && (i = 1 - a, e.vars.repeatRefresh && e._initted && e.invalidate())), a !== i || qe || r || e._zTime === F || !t && e._zTime) {
			if (!e._initted && Cn(e, t, r, n, s)) return;
			for (u = e._zTime, e._zTime = t || (n ? F : 0), n ||= t && !u, e.ratio = a, e._from && (a = 1 - a), e._time = 0, e._tTime = s, c = e._pt; c;) c.r(a, c.d), c = c._next;
			t < 0 && pn(e, t, n, !0), e._onUpdate && !n && rr(e, "onUpdate"), s && e._repeat && !n && e.parent && rr(e, "onRepeat"), (t >= e._tDur || t < 0) && e.ratio === a && (a && un(e, 1), !n && !qe && (rr(e, a ? "onComplete" : "onReverseComplete", !0), e._prom && e._prom()));
		} else e._zTime ||= t;
	}, Dn = function(e, t, n) {
		var r;
		if (n > t) for (r = e._first; r && r._start <= n;) {
			if (r.data === "isPause" && r._start > t) return r;
			r = r._next;
		}
		else for (r = e._last; r && r._start >= n;) {
			if (r.data === "isPause" && r._start < t) return r;
			r = r._prev;
		}
	}, On = function(e, t, n, r) {
		var i = e._repeat, a = Kt(t) || 0, o = e._tTime / e._tDur;
		return o && !r && (e._time *= a / e._dur), e._dur = a, e._tDur = i ? i < 0 ? 1e10 : Kt(a * (i + 1) + e._rDelay * i) : a, o > 0 && !r && yn(e, e._tTime = e._tDur * o), e.parent && vn(e), n || dn(e.parent, e), e;
	}, kn = function(e) {
		return e instanceof Mr ? dn(e) : On(e, e._dur);
	}, An = {
		_start: 0,
		endTime: kt,
		totalDuration: kt
	}, jn = function e(t, n, r) {
		var i = t.labels, a = t._recent || An, o = t.duration() >= Je ? a.endTime(!1) : t._dur, s, c, l;
		return tt(n) && (isNaN(n) || n in i) ? (c = n.charAt(0), l = n.substr(-1) === "%", s = n.indexOf("="), c === "<" || c === ">" ? (s >= 0 && (n = n.replace(/=/, "")), (c === "<" ? a._start : a.endTime(a._repeat >= 0)) + (parseFloat(n.substr(1)) || 0) * (l ? (s < 0 ? a : r).totalDuration() / 100 : 1)) : s < 0 ? (n in i || (i[n] = o), i[n]) : (c = parseFloat(n.charAt(s - 1) + n.substr(s + 1)), l && r && (c = c / 100 * (I(r) ? r[0] : r).totalDuration()), s > 1 ? e(t, n.substr(0, s - 1), r) + c : o + c)) : n == null ? o : +n;
	}, Mn = function(e, t, n) {
		var r = rt(t[1]), i = (r ? 2 : 1) + (e < 2 ? 0 : 1), a = t[i], o, s;
		if (r && (a.duration = t[1]), a.parent = n, e) {
			for (o = a, s = n; s && !("immediateRender" in o);) o = s.vars.defaults || {}, s = ot(s.vars.inherit) && s.parent;
			a.immediateRender = ot(o.immediateRender), e < 2 ? a.runBackwards = 1 : a.startAt = t[i - 1];
		}
		return new Kr(t[0], a, t[i + 1]);
	}, Nn = function(e, t) {
		return e || e === 0 ? t(e) : t;
	}, Pn = function(e, t, n) {
		return n < e ? e : n > t ? t : n;
	}, Fn = function(e, t) {
		return !tt(e) || !(t = vt.exec(e)) ? "" : t[1];
	}, In = function(e, t, n) {
		return Nn(n, function(n) {
			return Pn(e, t, n);
		});
	}, Ln = [].slice, Rn = function(e, t) {
		return e && at(e) && "length" in e && (!t && !e.length || e.length - 1 in e && at(e[0])) && !e.nodeType && e !== yt;
	}, zn = function(e, t, n) {
		return n === void 0 && (n = []), e.forEach(function(e) {
			var r;
			return tt(e) && !t || Rn(e, 1) ? (r = n).push.apply(r, Bn(e)) : n.push(e);
		}) || n;
	}, Bn = function(e, t, n) {
		return P && !t && P.selector ? P.selector(e) : tt(e) && !n && (bt || !vr()) ? Ln.call((t || xt).querySelectorAll(e), 0) : I(e) ? zn(e, n) : Rn(e) ? Ln.call(e, 0) : e ? [e] : [];
	}, Vn = function(e) {
		return e = Bn(e)[0] || Dt("Invalid scope") || {}, function(t) {
			var n = e.current || e.nativeElement || e;
			return Bn(t, n.querySelectorAll ? n : n === e ? Dt("Invalid scope") || xt.createElement("div") : e);
		};
	}, Hn = function(e) {
		return e.sort(function() {
			return .5 - Math.random();
		});
	}, Un = function(e) {
		if (nt(e)) return e;
		var t = at(e) ? e : { each: e }, n = Tr(t.ease), r = t.from || 0, i = parseFloat(t.base) || 0, a = {}, o = r > 0 && r < 1, s = isNaN(r) || o, c = t.axis, l = r, u = r;
		return tt(r) ? l = u = {
			center: .5,
			edges: .5,
			end: 1
		}[r] || 0 : !o && s && (l = r[0], u = r[1]), function(e, o, d) {
			var f = (d || t).length, p = a[f], m, h, g, _, v, y, b, x, S;
			if (!p) {
				if (S = t.grid === "auto" ? 0 : (t.grid || [1, Je])[1], !S) {
					for (b = -Je; b < (b = d[S++].getBoundingClientRect().left) && S < f;);
					S < f && S--;
				}
				for (p = a[f] = [], m = s ? Math.min(S, f) * l - .5 : r % S, h = S === Je ? 0 : s ? f * u / S - .5 : r / S | 0, b = 0, x = Je, y = 0; y < f; y++) g = y % S - m, _ = h - (y / S | 0), p[y] = v = c ? Math.abs(c === "y" ? _ : g) : Qe(g * g + _ * _), v > b && (b = v), v < x && (x = v);
				r === "random" && Hn(p), p.max = b - x, p.min = x, p.v = f = (parseFloat(t.amount) || parseFloat(t.each) * (S > f ? f - 1 : c ? c === "y" ? f / S : S : Math.max(S, f / S)) || 0) * (r === "edges" ? -1 : 1), p.b = f < 0 ? i - f : i, p.u = Fn(t.amount || t.each) || 0, n = n && f < 0 ? wr(n) : n;
			}
			return f = (p[e] - p.min) / p.max || 0, Kt(p.b + (n ? n(f) : f) * p.v) + p.u;
		};
	}, Wn = function(e) {
		var t = 10 ** ((e + "").split(".")[1] || "").length;
		return function(n) {
			var r = Kt(Math.round(parseFloat(n) / e) * e * t);
			return (r - r % 1) / t + (rt(n) ? 0 : Fn(n));
		};
	}, Gn = function(e, t) {
		var n = I(e), r, i;
		return !n && at(e) && (r = n = e.radius || Je, e.values ? (e = Bn(e.values), (i = !rt(e[0])) && (r *= r)) : e = Wn(e.increment)), Nn(t, n ? nt(e) ? function(t) {
			return i = e(t), Math.abs(i - t) <= r ? i : t;
		} : function(t) {
			for (var n = parseFloat(i ? t.x : t), a = parseFloat(i ? t.y : 0), o = Je, s = 0, c = e.length, l, u; c--;) i ? (l = e[c].x - n, u = e[c].y - a, l = l * l + u * u) : l = Math.abs(e[c] - n), l < o && (o = l, s = c);
			return s = !r || o <= r ? e[s] : t, i || s === t || rt(t) ? s : s + Fn(t);
		} : Wn(e));
	}, Kn = function(e, t, n, r) {
		return Nn(I(e) ? !t : n === !0 ? !!(n = 0) : !r, function() {
			return I(e) ? e[~~(Math.random() * e.length)] : (n ||= 1e-5) && (r = n < 1 ? 10 ** ((n + "").length - 2) : 1) && Math.floor(Math.round((e - n / 2 + Math.random() * (t - e + n * .99)) / n) * n * r) / r;
		});
	}, qn = function() {
		var e = [...arguments];
		return function(t) {
			return e.reduce(function(e, t) {
				return t(e);
			}, t);
		};
	}, Jn = function(e, t) {
		return function(n) {
			return e(parseFloat(n)) + (t || Fn(n));
		};
	}, Yn = function(e, t, n) {
		return er(e, t, 0, 1, n);
	}, Xn = function(e, t, n) {
		return Nn(n, function(n) {
			return e[~~t(n)];
		});
	}, Zn = function e(t, n, r) {
		var i = n - t;
		return I(t) ? Xn(t, e(0, t.length), n) : Nn(r, function(e) {
			return (i + (e - t) % i) % i + t;
		});
	}, Qn = function e(t, n, r) {
		var i = n - t, a = i * 2;
		return I(t) ? Xn(t, e(0, t.length - 1), n) : Nn(r, function(e) {
			return e = (a + (e - t) % a) % a || 0, t + (e > i ? a - e : e);
		});
	}, $n = function(e) {
		return e.replace(ut, function(e) {
			var t = e.indexOf("[") + 1, n = e.substring(t || 7, t ? e.indexOf("]") : e.length - 1).split(dt);
			return Kn(t ? n : +n[0], t ? 0 : +n[1], +n[2] || 1e-5);
		});
	}, er = function(e, t, n, r, i) {
		var a = t - e, o = r - n;
		return Nn(i, function(t) {
			return n + ((t - e) / a * o || 0);
		});
	}, tr = function e(t, n, r, i) {
		var a = isNaN(t + n) ? 0 : function(e) {
			return (1 - e) * t + e * n;
		};
		if (!a) {
			var o = tt(t), s = {}, c, l, u, d, f;
			if (r === !0 && (i = 1) && (r = null), o) t = { p: t }, n = { p: n };
			else if (I(t) && !I(n)) {
				for (u = [], d = t.length, f = d - 2, l = 1; l < d; l++) u.push(e(t[l - 1], t[l]));
				d--, a = function(e) {
					e *= d;
					var t = Math.min(f, ~~e);
					return u[t](e - t);
				}, r = n;
			} else i || (t = nn(I(t) ? [] : {}, t));
			if (!u) {
				for (c in n) Pr.call(s, t, c, "get", n[c]);
				a = function(e) {
					return ti(e, s) || (o ? t.p : t);
				};
			}
		}
		return Nn(r, a);
	}, nr = function(e, t, n) {
		var r = e.labels, i = Je, a, o, s;
		for (a in r) o = r[a] - t, o < 0 == !!n && o && i > (o = Math.abs(o)) && (s = a, i = o);
		return s;
	}, rr = function(e, t, n) {
		var r = e.vars, i = r[t], a = P, o = e._ctx, s, c, l;
		if (i) return s = r[t + "Params"], c = r.callbackScope || e, n && Pt.length && Yt(), o && (P = o), l = s ? i.apply(c, s) : i.call(c), P = a, l;
	}, ir = function(e) {
		return un(e), e.scrollTrigger && e.scrollTrigger.kill(!!qe), e.progress() < 1 && rr(e, "onInterrupt"), e;
	}, or = [], sr = function(e) {
		if (e) if (e = !e.name && e.default || e, st() || e.headless) {
			var t = e.name, n = nt(e), r = t && !n && e.init ? function() {
				this._props = [];
			} : e, i = {
				init: kt,
				render: ti,
				add: Pr,
				kill: ri,
				modifier: ni,
				rawVars: 0
			}, a = {
				targetTest: 0,
				get: 0,
				getSetter: Zr,
				aliases: {},
				register: 0
			};
			if (vr(), e !== r) {
				if (Lt[t]) return;
				en(r, en(an(e, i), a)), nn(r.prototype, nn(i, an(e, a))), Lt[r.prop = t] = r, e.targetTest && (Bt.push(r), Nt[t] = 1), t = (t === "css" ? "CSS" : t.charAt(0).toUpperCase() + t.substr(1)) + "Plugin";
			}
			Ot(t, r), e.register && e.register(bi, r, oi);
		} else or.push(e);
	}, z = 255, cr = {
		aqua: [
			0,
			z,
			z
		],
		lime: [
			0,
			z,
			0
		],
		silver: [
			192,
			192,
			192
		],
		black: [
			0,
			0,
			0
		],
		maroon: [
			128,
			0,
			0
		],
		teal: [
			0,
			128,
			128
		],
		blue: [
			0,
			0,
			z
		],
		navy: [
			0,
			0,
			128
		],
		white: [
			z,
			z,
			z
		],
		olive: [
			128,
			128,
			0
		],
		yellow: [
			z,
			z,
			0
		],
		orange: [
			z,
			165,
			0
		],
		gray: [
			128,
			128,
			128
		],
		purple: [
			128,
			0,
			128
		],
		green: [
			0,
			128,
			0
		],
		red: [
			z,
			0,
			0
		],
		pink: [
			z,
			192,
			203
		],
		cyan: [
			0,
			z,
			z
		],
		transparent: [
			z,
			z,
			z,
			0
		]
	}, lr = function(e, t, n) {
		return e += e < 0 ? 1 : e > 1 ? -1 : 0, (e * 6 < 1 ? t + (n - t) * e * 6 : e < .5 ? n : e * 3 < 2 ? t + (n - t) * (2 / 3 - e) * 6 : t) * z + .5 | 0;
	}, ur = function(e, t, n) {
		var r = e ? rt(e) ? [
			e >> 16,
			e >> 8 & z,
			e & z
		] : 0 : cr.black, i, a, o, s, c, l, u, d, f, p;
		if (!r) {
			if (e.substr(-1) === "," && (e = e.substr(0, e.length - 1)), cr[e]) r = cr[e];
			else if (e.charAt(0) === "#") {
				if (e.length < 6 && (i = e.charAt(1), a = e.charAt(2), o = e.charAt(3), e = "#" + i + i + a + a + o + o + (e.length === 5 ? e.charAt(4) + e.charAt(4) : "")), e.length === 9) return r = parseInt(e.substr(1, 6), 16), [
					r >> 16,
					r >> 8 & z,
					r & z,
					parseInt(e.substr(7), 16) / 255
				];
				e = parseInt(e.substr(1), 16), r = [
					e >> 16,
					e >> 8 & z,
					e & z
				];
			} else if (e.substr(0, 3) === "hsl") {
				if (r = p = e.match(ft), !t) s = r[0] % 360 / 360, c = r[1] / 100, l = r[2] / 100, a = l <= .5 ? l * (c + 1) : l + c - l * c, i = l * 2 - a, r.length > 3 && (r[3] *= 1), r[0] = lr(s + 1 / 3, i, a), r[1] = lr(s, i, a), r[2] = lr(s - 1 / 3, i, a);
				else if (~e.indexOf("=")) return r = e.match(pt), n && r.length < 4 && (r[3] = 1), r;
			} else r = e.match(ft) || cr.transparent;
			r = r.map(Number);
		}
		return t && !p && (i = r[0] / z, a = r[1] / z, o = r[2] / z, u = Math.max(i, a, o), d = Math.min(i, a, o), l = (u + d) / 2, u === d ? s = c = 0 : (f = u - d, c = l > .5 ? f / (2 - u - d) : f / (u + d), s = u === i ? (a - o) / f + (a < o ? 6 : 0) : u === a ? (o - i) / f + 2 : (i - a) / f + 4, s *= 60), r[0] = ~~(s + .5), r[1] = ~~(c * 100 + .5), r[2] = ~~(l * 100 + .5)), n && r.length < 4 && (r[3] = 1), r;
	}, dr = function(e) {
		var t = [], n = [], r = -1;
		return e.split(pr).forEach(function(e) {
			var i = e.match(mt) || [];
			t.push.apply(t, i), n.push(r += i.length + 1);
		}), t.c = n, t;
	}, fr = function(e, t, n) {
		var r = "", i = (e + r).match(pr), a = t ? "hsla(" : "rgba(", o = 0, s, c, l, u;
		if (!i) return e;
		if (i = i.map(function(e) {
			return (e = ur(e, t, 1)) && a + (t ? e[0] + "," + e[1] + "%," + e[2] + "%," + e[3] : e.join(",")) + ")";
		}), n && (l = dr(e), s = n.c, s.join(r) !== l.c.join(r))) for (c = e.replace(pr, "1").split(mt), u = c.length - 1; o < u; o++) r += c[o] + (~s.indexOf(o) ? i.shift() || a + "0,0,0,0)" : (l.length ? l : i.length ? i : n).shift());
		if (!c) for (c = e.split(pr), u = c.length - 1; o < u; o++) r += c[o] + i[o];
		return r + c[u];
	}, pr = function() {
		var e = "(?:\\b(?:(?:rgb|rgba|hsl|hsla)\\(.+?\\))|\\B#(?:[0-9a-f]{3,4}){1,2}\\b", t;
		for (t in cr) e += "|" + t + "\\b";
		return RegExp(e + ")", "gi");
	}(), mr = /hsl[a]?\(/, hr = function(e) {
		var t = e.join(" "), n;
		if (pr.lastIndex = 0, pr.test(t)) return n = mr.test(t), e[1] = fr(e[1], n), e[0] = fr(e[0], n, dr(e[1])), !0;
	}, _r = function() {
		var e = Date.now, t = 500, n = 33, r = e(), i = r, a = 1e3 / 240, o = a, s = [], c, l, u, d, f, p, m = function u(m) {
			var h = e() - i, g = m === !0, _, v, y, b;
			if ((h > t || h < 0) && (r += h - n), i += h, y = i - r, _ = y - o, (_ > 0 || g) && (b = ++d.frame, f = y - d.time * 1e3, d.time = y /= 1e3, o += _ + (_ >= a ? 4 : a - _), v = 1), g || (c = l(u)), v) for (p = 0; p < s.length; p++) s[p](y, f, b, m);
		};
		return d = {
			time: 0,
			frame: 0,
			tick: function() {
				m(!0);
			},
			deltaRatio: function(e) {
				return f / (1e3 / (e || 60));
			},
			wake: function() {
				wt && (!bt && st() && (yt = bt = window, xt = yt.document || {}, St.gsap = bi, (yt.gsapVersions ||= []).push(bi.version), Tt(Ct || yt.GreenSockGlobals || !yt.gsap && yt || {}), or.forEach(sr)), u = typeof requestAnimationFrame < "u" && requestAnimationFrame, c && d.sleep(), l = u || function(e) {
					return setTimeout(e, o - d.time * 1e3 + 1 | 0);
				}, gr = 1, m(2));
			},
			sleep: function() {
				(u ? cancelAnimationFrame : clearTimeout)(c), gr = 0, l = kt;
			},
			lagSmoothing: function(e, r) {
				t = e || Infinity, n = Math.min(r || 33, t);
			},
			fps: function(e) {
				a = 1e3 / (e || 240), o = d.time * 1e3 + a;
			},
			add: function(e, t, n) {
				var r = t ? function(t, n, i, a) {
					e(t, n, i, a), d.remove(r);
				} : e;
				return d.remove(e), s[n ? "unshift" : "push"](r), vr(), r;
			},
			remove: function(e, t) {
				~(t = s.indexOf(e)) && s.splice(t, 1) && p >= t && p--;
			},
			_listeners: s
		}, d;
	}(), vr = function() {
		return !gr && _r.wake();
	}, B = {}, yr = /^[\d.\-M][\d.\-,\s]/, br = /["']/g, xr = function(e) {
		for (var t = {}, n = e.substr(1, e.length - 3).split(":"), r = n[0], i = 1, a = n.length, o, s, c; i < a; i++) s = n[i], o = i === a - 1 ? s.length : s.lastIndexOf(","), c = s.substr(0, o), t[r] = isNaN(c) ? c.replace(br, "").trim() : +c, r = s.substr(o + 1).trim();
		return t;
	}, Sr = function(e) {
		var t = e.indexOf("(") + 1, n = e.indexOf(")"), r = e.indexOf("(", t);
		return e.substring(t, ~r && r < n ? e.indexOf(")", n + 1) : n);
	}, Cr = function(e) {
		var t = (e + "").split("("), n = B[t[0]];
		return n && t.length > 1 && n.config ? n.config.apply(null, ~e.indexOf("{") ? [xr(t[1])] : Sr(e).split(",").map(Qt)) : B._CE && yr.test(e) ? B._CE("", e) : n;
	}, wr = function(e) {
		return function(t) {
			return 1 - e(1 - t);
		};
	}, Tr = function(e, t) {
		return e && (nt(e) ? e : B[e] || Cr(e)) || t;
	}, Er = function(e, t, n, r) {
		n === void 0 && (n = function(e) {
			return 1 - t(1 - e);
		}), r === void 0 && (r = function(e) {
			return e < .5 ? t(e * 2) / 2 : 1 - t((1 - e) * 2) / 2;
		});
		var i = {
			easeIn: t,
			easeOut: n,
			easeInOut: r
		}, a;
		return Gt(e, function(e) {
			for (var t in B[e] = St[e] = i, B[a = e.toLowerCase()] = n, i) B[a + (t === "easeIn" ? ".in" : t === "easeOut" ? ".out" : ".inOut")] = B[e + "." + t] = i[t];
		}), i;
	}, Dr = function(e) {
		return function(t) {
			return t < .5 ? (1 - e(1 - t * 2)) / 2 : .5 + e((t - .5) * 2) / 2;
		};
	}, Or = function e(t, n, r) {
		var i = n >= 1 ? n : 1, a = (r || (t ? .3 : .45)) / (n < 1 ? n : 1), o = a / Ye * (Math.asin(1 / i) || 0), s = function(e) {
			return e === 1 ? 1 : i * 2 ** (-10 * e) * et((e - o) * a) + 1;
		}, c = t === "out" ? s : t === "in" ? function(e) {
			return 1 - s(1 - e);
		} : Dr(s);
		return a = Ye / a, c.config = function(n, r) {
			return e(t, n, r);
		}, c;
	}, kr = function e(t, n) {
		n === void 0 && (n = 1.70158);
		var r = function(e) {
			return e ? --e * e * ((n + 1) * e + n) + 1 : 0;
		}, i = t === "out" ? r : t === "in" ? function(e) {
			return 1 - r(1 - e);
		} : Dr(r);
		return i.config = function(n) {
			return e(t, n);
		}, i;
	}, Gt("Linear,Quad,Cubic,Quart,Quint,Strong", function(e, t) {
		var n = t < 5 ? t + 1 : t;
		Er(e + ",Power" + (n - 1), t ? function(e) {
			return e ** +n;
		} : function(e) {
			return e;
		}, function(e) {
			return 1 - (1 - e) ** n;
		}, function(e) {
			return e < .5 ? (e * 2) ** n / 2 : 1 - ((1 - e) * 2) ** n / 2;
		});
	}), B.Linear.easeNone = B.none = B.Linear.easeIn, Er("Elastic", Or("in"), Or("out"), Or()), (function(e, t) {
		var n = 1 / t, r = 2 * n, i = 2.5 * n, a = function(a) {
			return a < n ? e * a * a : a < r ? e * (a - 1.5 / t) ** 2 + .75 : a < i ? e * (a -= 2.25 / t) * a + .9375 : e * (a - 2.625 / t) ** 2 + .984375;
		};
		Er("Bounce", function(e) {
			return 1 - a(1 - e);
		}, a);
	})(7.5625, 2.75), Er("Expo", function(e) {
		return 2 ** (10 * (e - 1)) * e + e * e * e * e * e * e * (1 - e);
	}), Er("Circ", function(e) {
		return -(Qe(1 - e * e) - 1);
	}), Er("Sine", function(e) {
		return e === 1 ? 1 : -$e(e * Xe) + 1;
	}), Er("Back", kr("in"), kr("out"), kr()), B.SteppedEase = B.steps = St.SteppedEase = { config: function(e, t) {
		e === void 0 && (e = 1);
		var n = 1 / e, r = e + +!t, i = +!!t, a = 1 - F;
		return function(e) {
			return ((r * Pn(0, a, e) | 0) + i) * n;
		};
	} }, Ge.ease = B["quad.out"], Gt("onComplete,onUpdate,onStart,onRepeat,onReverseComplete,onInterrupt", function(e) {
		return Vt += e + "," + e + "Params,";
	}), Ar = function(e, t) {
		this.id = Ze++, e._gsap = this, this.target = e, this.harness = t, this.get = t ? t.get : Wt, this.set = t ? t.getSetter : Zr;
	}, jr = /* @__PURE__ */ function() {
		function e(e) {
			this.vars = e, this._delay = +e.delay || 0, (this._repeat = e.repeat === Infinity ? -2 : e.repeat || 0) && (this._rDelay = e.repeatDelay || 0, this._yoyo = !!e.yoyo || !!e.yoyoEase), this._ts = 1, On(this, +e.duration, 1, 1), this.data = e.data, P && (this._ctx = P, P.data.push(this)), gr || _r.wake();
		}
		var t = e.prototype;
		return t.delay = function(e) {
			return e || e === 0 ? (this.parent && this.parent.smoothChildTiming && this.startTime(this._start + e - this._delay), this._delay = e, this) : this._delay;
		}, t.duration = function(e) {
			return arguments.length ? this.totalDuration(this._repeat > 0 ? e + (e + this._rDelay) * this._repeat : e) : this.totalDuration() && this._dur;
		}, t.totalDuration = function(e) {
			return arguments.length ? (this._dirty = 0, On(this, this._repeat < 0 ? e : (e - this._repeat * this._rDelay) / (this._repeat + 1))) : this._tDur;
		}, t.totalTime = function(e, t) {
			if (vr(), !arguments.length) return this._tTime;
			var n = this._dp;
			if (n && n.smoothChildTiming && this._ts) {
				for (yn(this, e), !n._dp || n.parent || bn(n, this); n && n.parent;) n.parent._time !== n._start + (n._ts >= 0 ? n._tTime / n._ts : (n.totalDuration() - n._tTime) / -n._ts) && n.totalTime(n._tTime, !0), n = n.parent;
				!this.parent && this._dp.autoRemoveChildren && (this._ts > 0 && e < this._tDur || this._ts < 0 && e > 0 || !this._tDur && !e) && xn(this._dp, this, this._start - this._delay);
			}
			return (this._tTime !== e || !this._dur && !t || this._initted && Math.abs(this._zTime) === F || !this._initted && this._dur && e || !e && !this._initted && (this.add || this._ptLookup)) && (this._ts || (this._pTime = e), Zt(this, e, t)), this;
		}, t.time = function(e, t) {
			return arguments.length ? this.totalTime(Math.min(this.totalDuration(), e + hn(this)) % (this._dur + this._rDelay) || (e ? this._dur : 0), t) : this._time;
		}, t.totalProgress = function(e, t) {
			return arguments.length ? this.totalTime(this.totalDuration() * e, t) : this.totalDuration() ? Math.min(1, this._tTime / this._tDur) : this.rawTime() >= 0 && this._initted ? 1 : 0;
		}, t.progress = function(e, t) {
			return arguments.length ? this.totalTime(this.duration() * (this._yoyo && !(this.iteration() & 1) ? 1 - e : e) + hn(this), t) : this.duration() ? Math.min(1, this._time / this._dur) : +(this.rawTime() > 0);
		}, t.iteration = function(e, t) {
			var n = this.duration() + this._rDelay;
			return arguments.length ? this.totalTime(this._time + (e - 1) * n, t) : this._repeat ? gn(this._tTime, n) + 1 : 1;
		}, t.timeScale = function(e, t) {
			if (!arguments.length) return this._rts === -F ? 0 : this._rts;
			if (this._rts === e) return this;
			var n = this.parent && this._ts ? _n(this.parent._time, this) : this._tTime;
			return this._rts = +e || 0, this._ts = this._ps || e === -F ? 0 : this._rts, this.totalTime(Pn(-Math.abs(this._delay), this.totalDuration(), n), t !== !1), vn(this), fn(this);
		}, t.paused = function(e) {
			return arguments.length ? (this._ps !== e && (this._ps = e, e ? (this._pTime = this._tTime || Math.max(-this._delay, this.rawTime()), this._ts = this._act = 0) : (vr(), this._ts = this._rts, this.totalTime(this.parent && !this.parent.smoothChildTiming ? this.rawTime() : this._tTime || this._pTime, this.progress() === 1 && Math.abs(this._zTime) !== F && (this._tTime -= F)))), this) : this._ps;
		}, t.startTime = function(e) {
			if (arguments.length) {
				this._start = Kt(e);
				var t = this.parent || this._dp;
				return t && (t._sort || !this.parent) && xn(t, this, this._start - this._delay), this;
			}
			return this._start;
		}, t.endTime = function(e) {
			return this._start + (ot(e) ? this.totalDuration() : this.duration()) / Math.abs(this._ts || 1);
		}, t.rawTime = function(e) {
			var t = this.parent || this._dp;
			return t ? e && (!this._ts || this._repeat && this._time && this.totalProgress() < 1) ? this._tTime % (this._dur + this._rDelay) : this._ts ? _n(t.rawTime(e), this) : this._tTime : this._tTime;
		}, t.revert = function(e) {
			e === void 0 && (e = Mt);
			var t = qe;
			return qe = e, Xt(this) && (this.timeline && this.timeline.revert(e), this.totalTime(-.01, e.suppressEvents)), this.data !== "nested" && e.kill !== !1 && this.kill(), qe = t, this;
		}, t.globalTime = function(e) {
			for (var t = this, n = arguments.length ? e : t.rawTime(); t;) n = t._start + n / (Math.abs(t._ts) || 1), t = t._dp;
			return !this.parent && this._sat ? this._sat.globalTime(e) : n;
		}, t.repeat = function(e) {
			return arguments.length ? (this._repeat = e === Infinity ? -2 : e, kn(this)) : this._repeat === -2 ? Infinity : this._repeat;
		}, t.repeatDelay = function(e) {
			if (arguments.length) {
				var t = this._time;
				return this._rDelay = e, kn(this), t ? this.time(t) : this;
			}
			return this._rDelay;
		}, t.yoyo = function(e) {
			return arguments.length ? (this._yoyo = e, this) : this._yoyo;
		}, t.seek = function(e, t) {
			return this.totalTime(jn(this, e), ot(t));
		}, t.restart = function(e, t) {
			return this.play().totalTime(e ? -this._delay : 0, ot(t)), this._dur || (this._zTime = -F), this;
		}, t.play = function(e, t) {
			return e != null && this.seek(e, t), this.reversed(!1).paused(!1);
		}, t.reverse = function(e, t) {
			return e != null && this.seek(e || this.totalDuration(), t), this.reversed(!0).paused(!1);
		}, t.pause = function(e, t) {
			return e != null && this.seek(e, t), this.paused(!0);
		}, t.resume = function() {
			return this.paused(!1);
		}, t.reversed = function(e) {
			return arguments.length ? (!!e !== this.reversed() && this.timeScale(-this._rts || (e ? -F : 0)), this) : this._rts < 0;
		}, t.invalidate = function() {
			return this._initted = this._act = 0, this._zTime = -F, this;
		}, t.isActive = function() {
			var e = this.parent || this._dp, t = this._start, n;
			return !!(!e || this._ts && this._initted && e.isActive() && (n = e.rawTime(!0)) >= t && n < this.endTime(!0) - F);
		}, t.eventCallback = function(e, t, n) {
			var r = this.vars;
			return arguments.length > 1 ? (t ? (r[e] = t, n && (r[e + "Params"] = n), e === "onUpdate" && (this._onUpdate = t)) : delete r[e], this) : r[e];
		}, t.then = function(e) {
			var t = this, n = t._prom;
			return new Promise(function(r) {
				var i = nt(e) ? e : $t, a = function() {
					var e = t.then;
					t.then = null, n && n(), nt(i) && (i = i(t)) && (i.then || i === t) && (t.then = e), r(i), t.then = e;
				};
				t._initted && t.totalProgress() === 1 && t._ts >= 0 || !t._tTime && t._ts < 0 ? a() : t._prom = a;
			});
		}, t.kill = function() {
			ir(this);
		}, e;
	}(), en(jr.prototype, {
		_time: 0,
		_start: 0,
		_end: 0,
		_tTime: 0,
		_tDur: 0,
		_dirty: 0,
		_repeat: 0,
		_yoyo: !1,
		parent: null,
		_initted: !1,
		_rDelay: 0,
		_ts: 1,
		_dp: 0,
		ratio: 0,
		_zTime: -F,
		_prom: 0,
		_ps: !1,
		_rts: 1
	}), Mr = /* @__PURE__ */ function(e) {
		Ue(t, e);
		function t(t, n) {
			var r;
			return t === void 0 && (t = {}), r = e.call(this, t) || this, r.labels = {}, r.smoothChildTiming = !!t.smoothChildTiming, r.autoRemoveChildren = !!t.autoRemoveChildren, r._sort = ot(t.sortChildren), L && xn(t.parent || L, He(r), n), t.reversed && r.reverse(), t.paused && r.paused(!0), t.scrollTrigger && Sn(He(r), t.scrollTrigger), r;
		}
		var n = t.prototype;
		return n.to = function(e, t, n) {
			return Mn(0, arguments, this), this;
		}, n.from = function(e, t, n) {
			return Mn(1, arguments, this), this;
		}, n.fromTo = function(e, t, n, r) {
			return Mn(2, arguments, this), this;
		}, n.set = function(e, t, n) {
			return t.duration = 0, t.parent = this, on(t).repeatDelay || (t.repeat = 0), t.immediateRender = !!t.immediateRender, new Kr(e, t, jn(this, n), 1), this;
		}, n.call = function(e, t, n) {
			return xn(this, Kr.delayedCall(0, e, t), n);
		}, n.staggerTo = function(e, t, n, r, i, a, o) {
			return n.duration = t, n.stagger = n.stagger || r, n.onComplete = a, n.onCompleteParams = o, n.parent = this, new Kr(e, n, jn(this, i)), this;
		}, n.staggerFrom = function(e, t, n, r, i, a, o) {
			return n.runBackwards = 1, on(n).immediateRender = ot(n.immediateRender), this.staggerTo(e, t, n, r, i, a, o);
		}, n.staggerFromTo = function(e, t, n, r, i, a, o, s) {
			return r.startAt = n, on(r).immediateRender = ot(r.immediateRender), this.staggerTo(e, t, r, i, a, o, s);
		}, n.render = function(e, t, n) {
			var r = this._time, i = this._dirty ? this.totalDuration() : this._tDur, a = this._dur, o = e <= 0 ? 0 : Kt(e), s = this._zTime < 0 != e < 0 && (this._initted || !a), c, l, u, d, f, p, m, h, g, _, v, y;
			if (this !== L && o > i && e >= 0 && (o = i), o !== this._tTime || n || s) {
				if (r !== this._time && a && (o += this._time - r, e += this._time - r), c = o, g = this._start, h = this._ts, p = !h, s && (a || (r = this._zTime), (e || !t) && (this._zTime = e)), this._repeat) {
					if (v = this._yoyo, f = a + this._rDelay, this._repeat < -1 && e < 0) return this.totalTime(f * 100 + e, t, n);
					if (c = Kt(o % f), o === i ? (d = this._repeat, c = a) : (_ = Kt(o / f), d = ~~_, d && d === _ && (c = a, d--), c > a && (c = a)), _ = gn(this._tTime, f), !r && this._tTime && _ !== d && this._tTime - _ * f - this._dur <= 0 && (_ = d), v && d & 1 && (c = a - c, y = 1), d !== _ && !this._lock) {
						var b = v && _ & 1, x = b === (v && d & 1);
						if (d < _ && (b = !b), r = b ? 0 : o % a ? a : o, this._lock = 1, this.render(r || (y ? 0 : Kt(d * f)), t, !a)._lock = 0, this._tTime = o, !t && this.parent && rr(this, "onRepeat"), this.vars.repeatRefresh && !y && (this.invalidate()._lock = 1, _ = d), r && r !== this._time || p !== !this._ts || this.vars.onRepeat && !this.parent && !this._act || (a = this._dur, i = this._tDur, x && (this._lock = 2, r = b ? a : -1e-4, this.render(r, !0), this.vars.repeatRefresh && !y && this.invalidate()), this._lock = 0, !this._ts && !p)) return this;
					}
				}
				if (this._hasPause && !this._forcing && this._lock < 2 && (m = Dn(this, Kt(r), Kt(c)), m && (o -= c - (c = m._start))), this._tTime = o, this._time = c, this._act = !!h, this._initted || (this._onUpdate = this.vars.onUpdate, this._initted = 1, this._zTime = e, r = 0), !r && o && a && !t && !_ && (rr(this, "onStart"), this._tTime !== o)) return this;
				if (c >= r && e >= 0) for (l = this._first; l;) {
					if (u = l._next, (l._act || c >= l._start) && l._ts && m !== l) {
						if (l.parent !== this) return this.render(e, t, n);
						if (l.render(l._ts > 0 ? (c - l._start) * l._ts : (l._dirty ? l.totalDuration() : l._tDur) + (c - l._start) * l._ts, t, n), c !== this._time || !this._ts && !p) {
							m = 0, u && (o += this._zTime = -F);
							break;
						}
					}
					l = u;
				}
				else {
					l = this._last;
					for (var S = e < 0 ? e : c; l;) {
						if (u = l._prev, (l._act || S <= l._end) && l._ts && m !== l) {
							if (l.parent !== this) return this.render(e, t, n);
							if (l.render(l._ts > 0 ? (S - l._start) * l._ts : (l._dirty ? l.totalDuration() : l._tDur) + (S - l._start) * l._ts, t, n || qe && Xt(l)), c !== this._time || !this._ts && !p) {
								m = 0, u && (o += this._zTime = S ? -F : F);
								break;
							}
						}
						l = u;
					}
				}
				if (m && !t && (this.pause(), m.render(c >= r ? 0 : -F)._zTime = c >= r ? 1 : -1, this._ts)) return this._start = g, vn(this), this.render(e, t, n);
				this._onUpdate && !t && rr(this, "onUpdate", !0), (o === i && this._tTime >= this.totalDuration() || !o && r) && (g === this._start || Math.abs(h) !== Math.abs(this._ts)) && (this._lock || ((e || !a) && (o === i && this._ts > 0 || !o && this._ts < 0) && un(this, 1), !t && !(e < 0 && !r) && (o || r || !i) && (rr(this, o === i && e >= 0 ? "onComplete" : "onReverseComplete", !0), this._prom && !(o < i && this.timeScale() > 0) && this._prom())));
			}
			return this;
		}, n.add = function(e, t) {
			var n = this;
			if (rt(t) || (t = jn(this, t, e)), !(e instanceof jr)) {
				if (I(e)) return e.forEach(function(e) {
					return n.add(e, t);
				}), this;
				if (tt(e)) return this.addLabel(e, t);
				if (nt(e)) e = Kr.delayedCall(0, e);
				else return this;
			}
			return this === e ? this : xn(this, e, t);
		}, n.getChildren = function(e, t, n, r) {
			e === void 0 && (e = !0), t === void 0 && (t = !0), n === void 0 && (n = !0), r === void 0 && (r = -Je);
			for (var i = [], a = this._first; a;) a._start >= r && (a instanceof Kr ? t && i.push(a) : (n && i.push(a), e && i.push.apply(i, a.getChildren(!0, t, n)))), a = a._next;
			return i;
		}, n.getById = function(e) {
			for (var t = this.getChildren(1, 1, 1), n = t.length; n--;) if (t[n].vars.id === e) return t[n];
		}, n.remove = function(e) {
			return tt(e) ? this.removeLabel(e) : nt(e) ? this.killTweensOf(e) : (e.parent === this && ln(this, e), e === this._recent && (this._recent = this._last), dn(this));
		}, n.totalTime = function(t, n) {
			return arguments.length ? (this._forcing = 1, !this._dp && this._ts && (this._start = Kt(_r.time - (this._ts > 0 ? t / this._ts : (this.totalDuration() - t) / -this._ts))), e.prototype.totalTime.call(this, t, n), this._forcing = 0, this) : this._tTime;
		}, n.addLabel = function(e, t) {
			return this.labels[e] = jn(this, t), this;
		}, n.removeLabel = function(e) {
			return delete this.labels[e], this;
		}, n.addPause = function(e, t, n) {
			var r = Kr.delayedCall(0, t || kt, n);
			return r.data = "isPause", this._hasPause = 1, xn(this, r, jn(this, e));
		}, n.removePause = function(e) {
			var t = this._first;
			for (e = jn(this, e); t;) t._start === e && t.data === "isPause" && un(t), t = t._next;
		}, n.killTweensOf = function(e, t, n) {
			for (var r = this.getTweensOf(e, n), i = r.length; i--;) Lr !== r[i] && r[i].kill(e, t);
			return this;
		}, n.getTweensOf = function(e, t) {
			for (var n = [], r = Bn(e), i = this._first, a = rt(t), o; i;) i instanceof Kr ? Jt(i._targets, r) && (a ? (!Lr || i._initted && i._ts) && i.globalTime(0) <= t && i.globalTime(i.totalDuration()) > t : !t || i.isActive()) && n.push(i) : (o = i.getTweensOf(r, t)).length && n.push.apply(n, o), i = i._next;
			return n;
		}, n.tweenTo = function(e, t) {
			t ||= {};
			var n = this, r = jn(n, e), i = t, a = i.startAt, o = i.onStart, s = i.onStartParams, c = i.immediateRender, l, u = Kr.to(n, en({
				ease: t.ease || "none",
				lazy: !1,
				immediateRender: !1,
				time: r,
				overwrite: "auto",
				duration: t.duration || Math.abs((r - (a && "time" in a ? a.time : n._time)) / n.timeScale()) || F,
				onStart: function() {
					if (n.pause(), !l) {
						var e = t.duration || Math.abs((r - (a && "time" in a ? a.time : n._time)) / n.timeScale());
						u._dur !== e && On(u, e, 0, 1).render(u._time, !0, !0), l = 1;
					}
					o && o.apply(u, s || []);
				}
			}, t));
			return c ? u.render(0) : u;
		}, n.tweenFromTo = function(e, t, n) {
			return this.tweenTo(t, en({ startAt: { time: jn(this, e) } }, n));
		}, n.recent = function() {
			return this._recent;
		}, n.nextLabel = function(e) {
			return e === void 0 && (e = this._time), nr(this, jn(this, e));
		}, n.previousLabel = function(e) {
			return e === void 0 && (e = this._time), nr(this, jn(this, e), 1);
		}, n.currentLabel = function(e) {
			return arguments.length ? this.seek(e, !0) : this.previousLabel(this._time + F);
		}, n.shiftChildren = function(e, t, n) {
			n === void 0 && (n = 0);
			var r = this._first, i = this.labels, a;
			for (e = Kt(e); r;) r._start >= n && (r._start += e, r._end += e), r = r._next;
			if (t) for (a in i) i[a] >= n && (i[a] += e);
			return dn(this);
		}, n.invalidate = function(t) {
			var n = this._first;
			for (this._lock = 0; n;) n.invalidate(t), n = n._next;
			return e.prototype.invalidate.call(this, t);
		}, n.clear = function(e) {
			e === void 0 && (e = !0);
			for (var t = this._first, n; t;) n = t._next, this.remove(t), t = n;
			return this._dp && (this._time = this._tTime = this._pTime = 0), e && (this.labels = {}), dn(this);
		}, n.totalDuration = function(e) {
			var t = 0, n = this, r = n._last, i = Je, a, o, s;
			if (arguments.length) return n.timeScale((n._repeat < 0 ? n.duration() : n.totalDuration()) / (n.reversed() ? -e : e));
			if (n._dirty) {
				for (s = n.parent; r;) a = r._prev, r._dirty && r.totalDuration(), o = r._start, o > i && n._sort && r._ts && !n._lock ? (n._lock = 1, xn(n, r, o - r._delay, 1)._lock = 0) : i = o, o < 0 && r._ts && (t -= o, (!s && !n._dp || s && s.smoothChildTiming) && (n._start += Kt(o / n._ts), n._time -= o, n._tTime -= o), n.shiftChildren(-o, !1, -Infinity), i = 0), r._end > t && r._ts && (t = r._end), r = a;
				On(n, n === L && n._time > t ? n._time : t, 1, 1), n._dirty = 0;
			}
			return n._tDur;
		}, t.updateRoot = function(e) {
			if (L._ts && (Zt(L, _n(e, L)), It = _r.frame), _r.frame >= zt) {
				zt += We.autoSleep || 120;
				var t = L._first;
				if ((!t || !t._ts) && We.autoSleep && _r._listeners.length < 2) {
					for (; t && !t._ts;) t = t._next;
					t || _r.sleep();
				}
			}
		}, t;
	}(jr), en(Mr.prototype, {
		_lock: 0,
		_hasPause: 0,
		_forcing: 0
	}), Nr = function(e, t, n, r, i, a, o) {
		var s = new oi(this._pt, e, t, 0, 1, ei, null, i), c = 0, l = 0, u, d, f, p, m, h, g, _;
		for (s.b = n, s.e = r, n += "", r += "", (g = ~r.indexOf("random(")) && (r = $n(r)), a && (_ = [n, r], a(_, e, t), n = _[0], r = _[1]), d = n.match(ht) || []; u = ht.exec(r);) p = u[0], m = r.substring(c, u.index), f ? f = (f + 1) % 5 : m.substr(-5) === "rgba(" && (f = 1), p !== d[l++] && (h = parseFloat(d[l - 1]) || 0, s._pt = {
			_next: s._pt,
			p: m || l === 1 ? m : ",",
			s: h,
			c: p.charAt(1) === "=" ? qt(h, p) - h : parseFloat(p) - h,
			m: f && f < 4 ? Math.round : 0
		}, c = ht.lastIndex);
		return s.c = c < r.length ? r.substring(c, r.length) : "", s.fp = o, (gt.test(r) || g) && (s.e = 0), this._pt = s, s;
	}, Pr = function(e, t, n, r, i, a, o, s, c, l) {
		nt(r) && (r = r(i || 0, e, a));
		var u = e[t], d = n === "get" ? nt(u) ? c ? e[t.indexOf("set") || !nt(e["get" + t.substr(3)]) ? t : "get" + t.substr(3)](c) : e[t]() : u : n, f = nt(u) ? c ? Yr : Jr : qr, p;
		if (tt(r) && (~r.indexOf("random(") && (r = $n(r)), r.charAt(1) === "=" && (p = qt(d, r) + (Fn(d) || 0), (p || p === 0) && (r = p))), !l || d !== r || Rr) return !isNaN(d * r) && r !== "" ? (p = new oi(this._pt, e, t, +d || 0, r - (d || 0), typeof u == "boolean" ? $r : Qr, 0, f), c && (p.fp = c), o && p.modifier(o, this, e), this._pt = p) : (!u && !(t in e) && Et(t, r), Nr.call(this, e, t, d, r, f, s || We.stringFilter, c));
	}, Fr = function(e, t, n, r, i) {
		if (nt(e) && (e = Ur(e, i, t, n, r)), !at(e) || e.style && e.nodeType || I(e) || lt(e)) return tt(e) ? Ur(e, i, t, n, r) : e;
		var a = {}, o;
		for (o in e) a[o] = Ur(e[o], i, t, n, r);
		return a;
	}, Ir = function(e, t, n, r, i, a) {
		var o, s, c, l;
		if (Lt[e] && (o = new Lt[e]()).init(i, o.rawVars ? t[e] : Fr(t[e], r, i, a, n), n, r, a) !== !1 && (n._pt = s = new oi(n._pt, i, e, 0, 1, o.render, o, 0, o.priority), n !== ar)) for (c = n._ptLookup[n._targets.indexOf(i)], l = o._props.length; l--;) c[o._props[l]] = s;
		return o;
	}, zr = function e(t, n, r) {
		var i = t.vars, a = i.ease, o = i.startAt, s = i.immediateRender, c = i.lazy, l = i.onUpdate, u = i.runBackwards, d = i.yoyoEase, f = i.keyframes, p = i.autoRevert, m = t._dur, h = t._startAt, g = t._targets, _ = t.parent, v = _ && _.data === "nested" ? _.vars.targets : g, y = t._overwrite === "auto" && !Ke, b = t.timeline, x = i.easeReverse || d, S, C, w, T, E, D, O, k, ee, te, ne, re, ie;
		if (b && (!f || !a) && (a = "none"), t._ease = Tr(a, Ge.ease), t._rEase = x && (Tr(x) || t._ease), t._from = !b && !!i.runBackwards, t._from && (t.ratio = 1), !b || f && !i.stagger) {
			if (k = g[0] ? Ut(g[0]).harness : 0, re = k && i[k.prop], S = an(i, Nt), h && (h._zTime < 0 && h.progress(1), n < 0 && u && s && !p ? h.render(-1, !0) : h.revert(u && m ? jt : At), h._lazy = 0), o) {
				if (un(t._startAt = Kr.set(g, en({
					data: "isStart",
					overwrite: !1,
					parent: _,
					immediateRender: !0,
					lazy: !h && ot(c),
					startAt: null,
					delay: 0,
					onUpdate: l && function() {
						return rr(t, "onUpdate");
					},
					stagger: 0
				}, o))), t._startAt._dp = 0, t._startAt._sat = t, n < 0 && (qe || !s && !p) && t._startAt.revert(jt), s && m && n <= 0 && r <= 0) {
					n && (t._zTime = n);
					return;
				}
			} else if (u && m && !h) {
				if (n && (s = !1), w = en({
					overwrite: !1,
					data: "isFromStart",
					lazy: s && !h && ot(c),
					immediateRender: s,
					stagger: 0,
					parent: _
				}, S), re && (w[k.prop] = re), un(t._startAt = Kr.set(g, w)), t._startAt._dp = 0, t._startAt._sat = t, n < 0 && (qe ? t._startAt.revert(jt) : t._startAt.render(-1, !0)), t._zTime = n, !s) e(t._startAt, F, F);
				else if (!n) return;
			}
			for (t._pt = t._ptCache = 0, c = m && ot(c) || c && !m, C = 0; C < g.length; C++) {
				if (E = g[C], O = E._gsap || Ht(g)[C]._gsap, t._ptLookup[C] = te = {}, Ft[O.id] && Pt.length && Yt(), ne = v === g ? C : v.indexOf(E), k && (ee = new k()).init(E, re || S, t, ne, v) !== !1 && (t._pt = T = new oi(t._pt, E, ee.name, 0, 1, ee.render, ee, 0, ee.priority), ee._props.forEach(function(e) {
					te[e] = T;
				}), ee.priority && (D = 1)), !k || re) for (w in S) Lt[w] && (ee = Ir(w, S, t, ne, E, v)) ? ee.priority && (D = 1) : te[w] = T = Pr.call(t, E, w, "get", S[w], ne, v, 0, i.stringFilter);
				t._op && t._op[C] && t.kill(E, t._op[C]), y && t._pt && (Lr = t, L.killTweensOf(E, te, t.globalTime(n)), ie = !t.parent, Lr = 0), t._pt && c && (Ft[O.id] = 1);
			}
			D && ai(t), t._onInit && t._onInit(t);
		}
		t._onUpdate = l, t._initted = (!t._op || t._pt) && !ie, f && n <= 0 && b.render(Je, !0, !0);
	}, Br = function(e, t, n, r, i, a, o, s) {
		var c = (e._pt && e._ptCache || (e._ptCache = {}))[t], l, u, d, f;
		if (!c) for (c = e._ptCache[t] = [], d = e._ptLookup, f = e._targets.length; f--;) {
			if (l = d[f][t], l && l.d && l.d._pt) for (l = l.d._pt; l && l.p !== t && l.fp !== t;) l = l._next;
			if (!l) return Rr = 1, e.vars[t] = "+=0", zr(e, o), Rr = 0, s ? Dt(t + " not eligible for reset. Try splitting into individual properties") : 1;
			c.push(l);
		}
		for (f = c.length; f--;) u = c[f], l = u._pt || u, l.s = (r || r === 0) && !i ? r : l.s + (r || 0) + a * l.c, l.c = n - l.s, u.e &&= R(n) + Fn(u.e), u.b &&= l.s + Fn(u.b);
	}, Vr = function(e, t) {
		var n = e[0] ? Ut(e[0]).harness : 0, r = n && n.aliases, i, a, o, s;
		if (!r) return t;
		for (a in i = nn({}, t), r) if (a in i) for (s = r[a].split(","), o = s.length; o--;) i[s[o]] = i[a];
		return i;
	}, Hr = function(e, t, n, r) {
		var i = t.ease || r || "power1.inOut", a, o;
		if (I(t)) o = n[e] || (n[e] = []), t.forEach(function(e, n) {
			return o.push({
				t: n / (t.length - 1) * 100,
				v: e,
				e: i
			});
		});
		else for (a in t) o = n[a] || (n[a] = []), a === "ease" || o.push({
			t: parseFloat(e),
			v: t[a],
			e: i
		});
	}, Ur = function(e, t, n, r, i) {
		return nt(e) ? e.call(t, n, r, i) : tt(e) && ~e.indexOf("random(") ? $n(e) : e;
	}, Wr = Vt + "repeat,repeatDelay,yoyo,repeatRefresh,yoyoEase,easeReverse,autoRevert", Gr = {}, Gt(Wr + ",id,stagger,delay,duration,paused,scrollTrigger", function(e) {
		return Gr[e] = 1;
	}), Kr = /* @__PURE__ */ function(e) {
		Ue(t, e);
		function t(t, n, r, i) {
			var a;
			typeof n == "number" && (r.duration = n, n = r, r = null), a = e.call(this, i ? n : on(n)) || this;
			var o = a.vars, s = o.duration, c = o.delay, l = o.immediateRender, u = o.stagger, d = o.overwrite, f = o.keyframes, p = o.defaults, m = o.scrollTrigger, h = n.parent || L, g = (I(t) || lt(t) ? rt(t[0]) : "length" in n) ? [t] : Bn(t), _, v, y, b, x, S, C, w;
			if (a._targets = g.length ? Ht(g) : Dt("GSAP target " + t + " not found. https://gsap.com", !We.nullTargetWarn) || [], a._ptLookup = [], a._overwrite = d, f || u || ct(s) || ct(c)) {
				n = a.vars;
				var T = n.easeReverse || n.yoyoEase;
				if (_ = a.timeline = new Mr({
					data: "nested",
					defaults: p || {},
					targets: h && h.data === "nested" ? h.vars.targets : g
				}), _.kill(), _.parent = _._dp = He(a), _._start = 0, u || ct(s) || ct(c)) {
					if (b = g.length, C = u && Un(u), at(u)) for (x in u) ~Wr.indexOf(x) && (w ||= {}, w[x] = u[x]);
					for (v = 0; v < b; v++) y = an(n, Gr), y.stagger = 0, T && (y.easeReverse = T), w && nn(y, w), S = g[v], y.duration = +Ur(s, He(a), v, S, g), y.delay = (+Ur(c, He(a), v, S, g) || 0) - a._delay, !u && b === 1 && y.delay && (a._delay = c = y.delay, a._start += c, y.delay = 0), _.to(S, y, C ? C(v, S, g) : 0), _._ease = B.none;
					_.duration() ? s = c = 0 : a.timeline = 0;
				} else if (f) {
					on(en(_.vars.defaults, { ease: "none" })), _._ease = Tr(f.ease || n.ease || "none");
					var E = 0, D, O, k;
					if (I(f)) f.forEach(function(e) {
						return _.to(g, e, ">");
					}), _.duration();
					else {
						for (x in y = {}, f) x === "ease" || x === "easeEach" || Hr(x, f[x], y, f.easeEach);
						for (x in y) for (D = y[x].sort(function(e, t) {
							return e.t - t.t;
						}), E = 0, v = 0; v < D.length; v++) O = D[v], k = {
							ease: O.e,
							duration: (O.t - (v ? D[v - 1].t : 0)) / 100 * s
						}, k[x] = O.v, _.to(g, k, E), E += k.duration;
						_.duration() < s && _.to({}, { duration: s - _.duration() });
					}
				}
				s || a.duration(s = _.duration());
			} else a.timeline = 0;
			return d === !0 && !Ke && (Lr = He(a), L.killTweensOf(g), Lr = 0), xn(h, He(a), r), n.reversed && a.reverse(), n.paused && a.paused(!0), (l || !s && !f && a._start === Kt(h._time) && ot(l) && mn(He(a)) && h.data !== "nested") && (a._tTime = -F, a.render(Math.max(0, -c) || 0)), m && Sn(He(a), m), a;
		}
		var n = t.prototype;
		return n.render = function(e, t, n) {
			var r = this._time, i = this._tDur, a = this._dur, o = e < 0, s = e > i - F && !o ? i : e < F ? 0 : e, c, l, u, d, f, p, m, h;
			if (!a) En(this, e, t, n);
			else if (s !== this._tTime || !e || n || !this._initted && this._tTime || this._startAt && this._zTime < 0 !== o || this._lazy) {
				if (c = s, h = this.timeline, this._repeat) {
					if (d = a + this._rDelay, this._repeat < -1 && o) return this.totalTime(d * 100 + e, t, n);
					if (c = Kt(s % d), s === i ? (u = this._repeat, c = a) : (f = Kt(s / d), u = ~~f, u && u === f ? (c = a, u--) : c > a && (c = a)), p = this._yoyo && u & 1, p && (c = a - c), f = gn(this._tTime, d), c === r && !n && this._initted && u === f) return this._tTime = s, this;
					u !== f && this.vars.repeatRefresh && !p && !this._lock && c !== d && this._initted && (this._lock = n = 1, this.render(Kt(d * u), !0).invalidate()._lock = 0);
				}
				if (!this._initted) {
					if (Cn(this, o ? e : c, n, t, s)) return this._tTime = 0, this;
					if (r !== this._time && !(n && this.vars.repeatRefresh && u !== f)) return this;
					if (a !== this._dur) return this.render(e, t, n);
				}
				if (this._rEase) {
					var g = c < r;
					if (g !== this._inv) {
						var _ = g ? r : a - r;
						this._inv = g, this._from && (this.ratio = 1 - this.ratio), this._invRatio = this.ratio, this._invTime = r, this._invRecip = _ ? (g ? -1 : 1) / _ : 0, this._invScale = g ? -this.ratio : 1 - this.ratio, this._invEase = g ? this._rEase : this._ease;
					}
					this.ratio = m = this._invRatio + this._invScale * this._invEase((c - this._invTime) * this._invRecip);
				} else this.ratio = m = this._ease(c / a);
				if (this._from && (this.ratio = m = 1 - m), this._tTime = s, this._time = c, !this._act && this._ts && (this._act = 1, this._lazy = 0), !r && s && !t && !f && (rr(this, "onStart"), this._tTime !== s)) return this;
				for (l = this._pt; l;) l.r(m, l.d), l = l._next;
				h && h.render(e < 0 ? e : h._dur * h._ease(c / this._dur), t, n) || this._startAt && (this._zTime = e), this._onUpdate && !t && (o && pn(this, e, t, n), rr(this, "onUpdate")), this._repeat && u !== f && this.vars.onRepeat && !t && this.parent && rr(this, "onRepeat"), (s === this._tDur || !s) && this._tTime === s && (o && !this._onUpdate && pn(this, e, !0, !0), (e || !a) && (s === this._tDur && this._ts > 0 || !s && this._ts < 0) && un(this, 1), !t && !(o && !r) && (s || r || p) && (rr(this, s === i ? "onComplete" : "onReverseComplete", !0), this._prom && !(s < i && this.timeScale() > 0) && this._prom()));
			}
			return this;
		}, n.targets = function() {
			return this._targets;
		}, n.invalidate = function(t) {
			return (!t || !this.vars.runBackwards) && (this._startAt = 0), this._pt = this._op = this._onUpdate = this._lazy = this.ratio = 0, this._ptLookup = [], this.timeline && this.timeline.invalidate(t), e.prototype.invalidate.call(this, t);
		}, n.resetTo = function(e, t, n, r, i) {
			gr || _r.wake(), this._ts || this.play();
			var a = Math.min(this._dur, (this._dp._time - this._start) * this._ts), o;
			return this._initted || zr(this, a), o = this._ease(a / this._dur), Br(this, e, t, n, r, o, a, i) ? this.resetTo(e, t, n, r, 1) : (yn(this, 0), this.parent || cn(this._dp, this, "_first", "_last", this._dp._sort ? "_start" : 0), this.render(0));
		}, n.kill = function(e, t) {
			if (t === void 0 && (t = "all"), !e && (!t || t === "all")) return this._lazy = this._pt = 0, this.parent ? ir(this) : this.scrollTrigger && this.scrollTrigger.kill(!!qe), this;
			if (this.timeline) {
				var n = this.timeline.totalDuration();
				return this.timeline.killTweensOf(e, t, Lr && Lr.vars.overwrite !== !0)._first || ir(this), this.parent && n !== this.timeline.totalDuration() && On(this, this._dur * this.timeline._tDur / n, 0, 1), this;
			}
			var r = this._targets, i = e ? Bn(e) : r, a = this._ptLookup, o = this._pt, s, c, l, u, d, f, p;
			if ((!t || t === "all") && sn(r, i)) return t === "all" && (this._pt = 0), ir(this);
			for (s = this._op = this._op || [], t !== "all" && (tt(t) && (d = {}, Gt(t, function(e) {
				return d[e] = 1;
			}), t = d), t = Vr(r, t)), p = r.length; p--;) if (~i.indexOf(r[p])) for (d in c = a[p], t === "all" ? (s[p] = t, u = c, l = {}) : (l = s[p] = s[p] || {}, u = t), u) f = c && c[d], f && ((!("kill" in f.d) || f.d.kill(d) === !0) && ln(this, f, "_pt"), delete c[d]), l !== "all" && (l[d] = 1);
			return this._initted && !this._pt && o && ir(this), this;
		}, t.to = function(e, n) {
			return new t(e, n, arguments[2]);
		}, t.from = function(e, t) {
			return Mn(1, arguments);
		}, t.delayedCall = function(e, n, r, i) {
			return new t(n, 0, {
				immediateRender: !1,
				lazy: !1,
				overwrite: !1,
				delay: e,
				onComplete: n,
				onReverseComplete: n,
				onCompleteParams: r,
				onReverseCompleteParams: r,
				callbackScope: i
			});
		}, t.fromTo = function(e, t, n) {
			return Mn(2, arguments);
		}, t.set = function(e, n) {
			return n.duration = 0, n.repeatDelay || (n.repeat = 0), new t(e, n);
		}, t.killTweensOf = function(e, t, n) {
			return L.killTweensOf(e, t, n);
		}, t;
	}(jr), en(Kr.prototype, {
		_targets: [],
		_lazy: 0,
		_startAt: 0,
		_op: 0,
		_onInit: 0
	}), Gt("staggerTo,staggerFrom,staggerFromTo", function(e) {
		Kr[e] = function() {
			var t = new Mr(), n = Ln.call(arguments, 0);
			return n.splice(e === "staggerFromTo" ? 5 : 4, 0, 0), t[e].apply(t, n);
		};
	}), qr = function(e, t, n) {
		return e[t] = n;
	}, Jr = function(e, t, n) {
		return e[t](n);
	}, Yr = function(e, t, n, r) {
		return e[t](r.fp, n);
	}, Xr = function(e, t, n) {
		return e.setAttribute(t, n);
	}, Zr = function(e, t) {
		return nt(e[t]) ? Jr : it(e[t]) && e.setAttribute ? Xr : qr;
	}, Qr = function(e, t) {
		return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e6) / 1e6, t);
	}, $r = function(e, t) {
		return t.set(t.t, t.p, !!(t.s + t.c * e), t);
	}, ei = function(e, t) {
		var n = t._pt, r = "";
		if (!e && t.b) r = t.b;
		else if (e === 1 && t.e) r = t.e;
		else {
			for (; n;) r = n.p + (n.m ? n.m(n.s + n.c * e) : Math.round((n.s + n.c * e) * 1e4) / 1e4) + r, n = n._next;
			r += t.c;
		}
		t.set(t.t, t.p, r, t);
	}, ti = function(e, t) {
		for (var n = t._pt; n;) n.r(e, n.d), n = n._next;
	}, ni = function(e, t, n, r) {
		for (var i = this._pt, a; i;) a = i._next, i.p === r && i.modifier(e, t, n), i = a;
	}, ri = function(e) {
		for (var t = this._pt, n, r; t;) r = t._next, t.p === e && !t.op || t.op === e ? ln(this, t, "_pt") : t.dep || (n = 1), t = r;
		return !n;
	}, ii = function(e, t, n, r) {
		r.mSet(e, t, r.m.call(r.tween, n, r.mt), r);
	}, ai = function(e) {
		for (var t = e._pt, n, r, i, a; t;) {
			for (n = t._next, r = i; r && r.pr > t.pr;) r = r._next;
			(t._prev = r ? r._prev : a) ? t._prev._next = t : i = t, (t._next = r) ? r._prev = t : a = t, t = n;
		}
		e._pt = i;
	}, oi = /* @__PURE__ */ function() {
		function e(e, t, n, r, i, a, o, s, c) {
			this.t = t, this.s = r, this.c = i, this.p = n, this.r = a || Qr, this.d = o || this, this.set = s || qr, this.pr = c || 0, this._next = e, e && (e._prev = this);
		}
		var t = e.prototype;
		return t.modifier = function(e, t, n) {
			this.mSet = this.mSet || this.set, this.set = ii, this.m = e, this.mt = n, this.tween = t;
		}, e;
	}(), Gt(Vt + "parent,duration,ease,delay,overwrite,runBackwards,startAt,yoyo,immediateRender,repeat,repeatDelay,data,paused,reversed,lazy,callbackScope,stringFilter,id,yoyoEase,stagger,inherit,repeatRefresh,keyframes,autoRevert,scrollTrigger,easeReverse", function(e) {
		return Nt[e] = 1;
	}), St.TweenMax = St.TweenLite = Kr, St.TimelineLite = St.TimelineMax = Mr, L = new Mr({
		sortChildren: !1,
		defaults: Ge,
		autoRemoveChildren: !0,
		id: "root",
		smoothChildTiming: !0
	}), We.stringFilter = hr, si = [], ci = {}, li = [], ui = 0, di = 0, fi = function(e) {
		return (ci[e] || li).map(function(e) {
			return e();
		});
	}, pi = function() {
		var e = Date.now(), t = [];
		e - ui > 2 && (fi("matchMediaInit"), si.forEach(function(e) {
			var n = e.queries, r = e.conditions, i, a, o, s;
			for (a in n) i = yt.matchMedia(n[a]).matches, i && (o = 1), i !== r[a] && (r[a] = i, s = 1);
			s && (e.revert(), o && t.push(e));
		}), fi("matchMediaRevert"), t.forEach(function(e) {
			return e.onMatch(e, function(t) {
				return e.add(null, t);
			});
		}), ui = e, fi("matchMedia"));
	}, mi = /* @__PURE__ */ function() {
		function e(e, t) {
			this.selector = t && Vn(t), this.data = [], this._r = [], this.isReverted = !1, this.id = di++, e && this.add(e);
		}
		var t = e.prototype;
		return t.add = function(e, t, n) {
			nt(e) && (n = t, t = e, e = nt);
			var r = this, i = function() {
				var e = P, i = r.selector, a;
				return e && e !== r && e.data.push(r), n && (r.selector = Vn(n)), P = r, a = t.apply(r, arguments), nt(a) && r._r.push(a), P = e, r.selector = i, r.isReverted = !1, a;
			};
			return r.last = i, e === nt ? i(r, function(e) {
				return r.add(null, e);
			}) : e ? r[e] = i : i;
		}, t.ignore = function(e) {
			var t = P;
			P = null, e(this), P = t;
		}, t.getTweens = function() {
			var t = [];
			return this.data.forEach(function(n) {
				return n instanceof e ? t.push.apply(t, n.getTweens()) : n instanceof Kr && !(n.parent && n.parent.data === "nested") && t.push(n);
			}), t;
		}, t.clear = function() {
			this._r.length = this.data.length = 0;
		}, t.kill = function(e, t) {
			var n = this;
			if (e ? (function() {
				for (var t = n.getTweens(), r = n.data.length, i; r--;) i = n.data[r], i.data === "isFlip" && (i.revert(), i.getChildren(!0, !0, !1).forEach(function(e) {
					return t.splice(t.indexOf(e), 1);
				}));
				for (t.map(function(e) {
					return {
						g: e._dur || e._delay || e._sat && !e._sat.vars.immediateRender ? e.globalTime(0) : -Infinity,
						t: e
					};
				}).sort(function(e, t) {
					return t.g - e.g || -Infinity;
				}).forEach(function(t) {
					return t.t.revert(e);
				}), r = n.data.length; r--;) i = n.data[r], i instanceof Mr ? i.data !== "nested" && (i.scrollTrigger && i.scrollTrigger.revert(), i.kill()) : !(i instanceof Kr) && i.revert && i.revert(e);
				n._r.forEach(function(t) {
					return t(e, n);
				}), n.isReverted = !0;
			})() : this.data.forEach(function(e) {
				return e.kill && e.kill();
			}), this.clear(), t) for (var r = si.length; r--;) si[r].id === this.id && si.splice(r, 1);
		}, t.revert = function(e) {
			this.kill(e || {});
		}, e;
	}(), hi = /* @__PURE__ */ function() {
		function e(e) {
			this.contexts = [], this.scope = e, P && P.data.push(this);
		}
		var t = e.prototype;
		return t.add = function(e, t, n) {
			at(e) || (e = { matches: e });
			var r = new mi(0, n || this.scope), i = r.conditions = {}, a, o, s;
			for (o in P && !r.selector && (r.selector = P.selector), this.contexts.push(r), t = r.add("onMatch", t), r.queries = e, e) o === "all" ? s = 1 : (a = yt.matchMedia(e[o]), a && (si.indexOf(r) < 0 && si.push(r), (i[o] = a.matches) && (s = 1), a.addListener ? a.addListener(pi) : a.addEventListener("change", pi)));
			return s && t(r, function(e) {
				return r.add(null, e);
			}), this;
		}, t.revert = function(e) {
			this.kill(e || {});
		}, t.kill = function(e) {
			this.contexts.forEach(function(t) {
				return t.kill(e, !0);
			});
		}, e;
	}(), gi = {
		registerPlugin: function() {
			[...arguments].forEach(function(e) {
				return sr(e);
			});
		},
		timeline: function(e) {
			return new Mr(e);
		},
		getTweensOf: function(e, t) {
			return L.getTweensOf(e, t);
		},
		getProperty: function(e, t, n, r) {
			tt(e) && (e = Bn(e)[0]);
			var i = Ut(e || {}).get, a = n ? $t : Qt;
			return n === "native" && (n = ""), e && (t ? a((Lt[t] && Lt[t].get || i)(e, t, n, r)) : function(t, n, r) {
				return a((Lt[t] && Lt[t].get || i)(e, t, n, r));
			});
		},
		quickSetter: function(e, t, n) {
			if (e = Bn(e), e.length > 1) {
				var r = e.map(function(e) {
					return bi.quickSetter(e, t, n);
				}), i = r.length;
				return function(e) {
					for (var t = i; t--;) r[t](e);
				};
			}
			e = e[0] || {};
			var a = Lt[t], o = Ut(e), s = o.harness && (o.harness.aliases || {})[t] || t, c = a ? function(t) {
				var r = new a();
				ar._pt = 0, r.init(e, n ? t + n : t, ar, 0, [e]), r.render(1, r), ar._pt && ti(1, ar);
			} : o.set(e, s);
			return a ? c : function(t) {
				return c(e, s, n ? t + n : t, o, 1);
			};
		},
		quickTo: function(e, t, n) {
			var r, i = bi.to(e, en((r = {}, r[t] = "+=0.1", r.paused = !0, r.stagger = 0, r), n || {})), a = function(e, n, r) {
				return i.resetTo(t, e, n, r);
			};
			return a.tween = i, a;
		},
		isTweening: function(e) {
			return L.getTweensOf(e, !0).length > 0;
		},
		defaults: function(e) {
			return e && e.ease && (e.ease = Tr(e.ease, Ge.ease)), rn(Ge, e || {});
		},
		config: function(e) {
			return rn(We, e || {});
		},
		registerEffect: function(e) {
			var t = e.name, n = e.effect, r = e.plugins, i = e.defaults, a = e.extendTimeline;
			(r || "").split(",").forEach(function(e) {
				return e && !Lt[e] && !St[e] && Dt(t + " effect requires " + e + " plugin.");
			}), Rt[t] = function(e, t, r) {
				return n(Bn(e), en(t || {}, i), r);
			}, a && (Mr.prototype[t] = function(e, n, r) {
				return this.add(Rt[t](e, at(n) ? n : (r = n) && {}, this), r);
			});
		},
		registerEase: function(e, t) {
			B[e] = Tr(t);
		},
		parseEase: function(e, t) {
			return arguments.length ? Tr(e, t) : B;
		},
		getById: function(e) {
			return L.getById(e);
		},
		exportRoot: function(e, t) {
			e === void 0 && (e = {});
			var n = new Mr(e), r, i;
			for (n.smoothChildTiming = ot(e.smoothChildTiming), L.remove(n), n._dp = 0, n._time = n._tTime = L._time, r = L._first; r;) i = r._next, (t || !(!r._dur && r instanceof Kr && r.vars.onComplete === r._targets[0])) && xn(n, r, r._start - r._delay), r = i;
			return xn(L, n, 0), n;
		},
		context: function(e, t) {
			return e ? new mi(e, t) : P;
		},
		matchMedia: function(e) {
			return new hi(e);
		},
		matchMediaRefresh: function() {
			return si.forEach(function(e) {
				var t = e.conditions, n, r;
				for (r in t) t[r] && (t[r] = !1, n = 1);
				n && e.revert();
			}) || pi();
		},
		addEventListener: function(e, t) {
			var n = ci[e] || (ci[e] = []);
			~n.indexOf(t) || n.push(t);
		},
		removeEventListener: function(e, t) {
			var n = ci[e], r = n && n.indexOf(t);
			r >= 0 && n.splice(r, 1);
		},
		utils: {
			wrap: Zn,
			wrapYoyo: Qn,
			distribute: Un,
			random: Kn,
			snap: Gn,
			normalize: Yn,
			getUnit: Fn,
			clamp: In,
			splitColor: ur,
			toArray: Bn,
			selector: Vn,
			mapRange: er,
			pipe: qn,
			unitize: Jn,
			interpolate: tr,
			shuffle: Hn
		},
		install: Tt,
		effects: Rt,
		ticker: _r,
		updateRoot: Mr.updateRoot,
		plugins: Lt,
		globalTimeline: L,
		core: {
			PropTween: oi,
			globals: Ot,
			Tween: Kr,
			Timeline: Mr,
			Animation: jr,
			getCache: Ut,
			_removeLinkedListItem: ln,
			reverting: function() {
				return qe;
			},
			context: function(e) {
				return e && P && (P.data.push(e), e._ctx = P), P;
			},
			suppressOverwrites: function(e) {
				return Ke = e;
			}
		}
	}, Gt("to,from,fromTo,delayedCall,set,killTweensOf", function(e) {
		return gi[e] = Kr[e];
	}), _r.add(Mr.updateRoot), ar = gi.to({}, { duration: 0 }), _i = function(e, t) {
		for (var n = e._pt; n && n.p !== t && n.op !== t && n.fp !== t;) n = n._next;
		return n;
	}, vi = function(e, t) {
		var n = e._targets, r, i, a;
		for (r in t) for (i = n.length; i--;) a = e._ptLookup[i][r], (a &&= a.d) && (a._pt && (a = _i(a, r)), a && a.modifier && a.modifier(t[r], e, n[i], r));
	}, yi = function(e, t) {
		return {
			name: e,
			headless: 1,
			rawVars: 1,
			init: function(e, n, r) {
				r._onInit = function(e) {
					var r, i;
					if (tt(n) && (r = {}, Gt(n, function(e) {
						return r[e] = 1;
					}), n = r), t) {
						for (i in r = {}, n) r[i] = t(n[i]);
						n = r;
					}
					vi(e, n);
				};
			}
		};
	}, bi = gi.registerPlugin({
		name: "attr",
		init: function(e, t, n, r, i) {
			var a, o, s;
			for (a in this.tween = n, t) s = e.getAttribute(a) || "", o = this.add(e, "setAttribute", (s || 0) + "", t[a], r, i, 0, 0, a), o.op = a, o.b = s, this._props.push(a);
		},
		render: function(e, t) {
			for (var n = t._pt; n;) qe ? n.set(n.t, n.p, n.b, n) : n.r(e, n.d), n = n._next;
		}
	}, {
		name: "endArray",
		headless: 1,
		init: function(e, t) {
			for (var n = t.length; n--;) this.add(e, n, e[n] || 0, t[n], 0, 0, 0, 0, 0, 1);
		}
	}, yi("roundProps", Wn), yi("modifiers"), yi("snap", Gn)) || gi, Kr.version = Mr.version = bi.version = "3.15.0", wt = 1, st() && vr(), B.Power0, B.Power1, B.Power2, B.Power3, B.Power4, B.Linear, B.Quad, B.Cubic, B.Quart, B.Quint, B.Strong, B.Elastic, B.Back, B.SteppedEase, B.Bounce, B.Sine, B.Expo, B.Circ;
})), Si, Ci, wi, Ti, Ei, Di, Oi, ki, Ai, ji, V, H, Mi, Ni, Pi, Fi, Ii, Li, Ri, zi, Bi, Vi, Hi, Ui, Wi, Gi, Ki, qi, Ji, Yi, U, Xi, Zi, Qi, $i, ea, ta, na, W, ra, ia, aa, oa, sa, ca, la, ua, da, fa, pa, ma, ha, ga, _a, va, ya, ba, xa, Sa, Ca, wa, Ta, Ea, Da, Oa, ka, Aa, ja, Ma, Na, Pa, Fa, Ia, La, Ra, za, Ba = o((() => {
	xi(), ki = function() {
		return typeof window < "u";
	}, Ai = {}, ji = 180 / Math.PI, V = Math.PI / 180, H = Math.atan2, Mi = 1e8, Ni = /([A-Z])/g, Pi = /(left|right|width|margin|padding|x)/i, Fi = /[\s,\(]\S/, Ii = {
		autoAlpha: "opacity,visibility",
		scale: "scaleX,scaleY",
		alpha: "opacity"
	}, Li = function(e, t) {
		return t.set(t.t, t.p, Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t);
	}, Ri = function(e, t) {
		return t.set(t.t, t.p, e === 1 ? t.e : Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u, t);
	}, zi = function(e, t) {
		return t.set(t.t, t.p, e ? Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u : t.b, t);
	}, Bi = function(e, t) {
		return t.set(t.t, t.p, e === 1 ? t.e : e ? Math.round((t.s + t.c * e) * 1e4) / 1e4 + t.u : t.b, t);
	}, Vi = function(e, t) {
		var n = t.s + t.c * e;
		t.set(t.t, t.p, ~~(n + (n < 0 ? -.5 : .5)) + t.u, t);
	}, Hi = function(e, t) {
		return t.set(t.t, t.p, e ? t.e : t.b, t);
	}, Ui = function(e, t) {
		return t.set(t.t, t.p, e === 1 ? t.e : t.b, t);
	}, Wi = function(e, t, n) {
		return e.style[t] = n;
	}, Gi = function(e, t, n) {
		return e.style.setProperty(t, n);
	}, Ki = function(e, t, n) {
		return e._gsap[t] = n;
	}, qi = function(e, t, n) {
		return e._gsap.scaleX = e._gsap.scaleY = n;
	}, Ji = function(e, t, n, r, i) {
		var a = e._gsap;
		a.scaleX = a.scaleY = n, a.renderTransform(i, a);
	}, Yi = function(e, t, n, r, i) {
		var a = e._gsap;
		a[t] = n, a.renderTransform(i, a);
	}, U = "transform", Xi = U + "Origin", Zi = function e(t, n) {
		var r = this, i = this.target, a = i.style, o = i._gsap;
		if (t in Ai && a) {
			if (this.tfm = this.tfm || {}, t !== "transform") t = Ii[t] || t, ~t.indexOf(",") ? t.split(",").forEach(function(e) {
				return r.tfm[e] = ha(i, e);
			}) : this.tfm[t] = o.x ? o[t] : ha(i, t), t === Xi && (this.tfm.zOrigin = o.zOrigin);
			else return Ii.transform.split(",").forEach(function(t) {
				return e.call(r, t, n);
			});
			if (this.props.indexOf(U) >= 0) return;
			o.svg && (this.svgo = i.getAttribute("data-svg-origin"), this.props.push(Xi, n, "")), t = U;
		}
		(a || n) && this.props.push(t, n, a[t]);
	}, Qi = function(e) {
		e.translate && (e.removeProperty("translate"), e.removeProperty("scale"), e.removeProperty("rotate"));
	}, $i = function() {
		var e = this.props, t = this.target, n = t.style, r = t._gsap, i, a;
		for (i = 0; i < e.length; i += 3) e[i + 1] ? e[i + 1] === 2 ? t[e[i]](e[i + 2]) : t[e[i]] = e[i + 2] : e[i + 2] ? n[e[i]] = e[i + 2] : n.removeProperty(e[i].substr(0, 2) === "--" ? e[i] : e[i].replace(Ni, "-$1").toLowerCase());
		if (this.tfm) {
			for (a in this.tfm) r[a] = this.tfm[a];
			r.svg && (r.renderTransform(), t.setAttribute("data-svg-origin", this.svgo || "")), i = Oi(), (!i || !i.isStart) && !n[U] && (Qi(n), r.zOrigin && n[Xi] && (n[Xi] += " " + r.zOrigin + "px", r.zOrigin = 0, r.renderTransform()), r.uncache = 1);
		}
	}, ea = function(e, t) {
		var n = {
			target: e,
			props: [],
			revert: $i,
			save: Zi
		};
		return e._gsap || bi.core.getCache(e), t && e.style && e.nodeType && t.split(",").forEach(function(e) {
			return n.save(e);
		}), n;
	}, na = function(e, t) {
		var n = Ci.createElementNS ? Ci.createElementNS((t || "http://www.w3.org/1999/xhtml").replace(/^https/, "http"), e) : Ci.createElement(e);
		return n && n.style ? n : Ci.createElement(e);
	}, W = function e(t, n, r) {
		var i = getComputedStyle(t);
		return i[n] || i.getPropertyValue(n.replace(Ni, "-$1").toLowerCase()) || i.getPropertyValue(n) || !r && e(t, ia(n) || n, 1) || "";
	}, ra = "O,Moz,ms,Ms,Webkit".split(","), ia = function(e, t, n) {
		var r = (t || Ei).style, i = 5;
		if (e in r && !n) return e;
		for (e = e.charAt(0).toUpperCase() + e.substr(1); i-- && !(ra[i] + e in r););
		return i < 0 ? null : (i === 3 ? "ms" : i >= 0 ? ra[i] : "") + e;
	}, aa = function() {
		ki() && window.document && (Si = window, Ci = Si.document, wi = Ci.documentElement, Ei = na("div") || { style: {} }, na("div"), U = ia(U), Xi = U + "Origin", Ei.style.cssText = "border-width:0;line-height:0;position:absolute;padding:0", ta = !!ia("perspective"), Oi = bi.core.reverting, Ti = 1);
	}, oa = function(e) {
		var t = e.ownerSVGElement, n = na("svg", t && t.getAttribute("xmlns") || "http://www.w3.org/2000/svg"), r = e.cloneNode(!0), i;
		r.style.display = "block", n.appendChild(r), wi.appendChild(n);
		try {
			i = r.getBBox();
		} catch {}
		return n.removeChild(r), wi.removeChild(n), i;
	}, sa = function(e, t) {
		for (var n = t.length; n--;) if (e.hasAttribute(t[n])) return e.getAttribute(t[n]);
	}, ca = function(e) {
		var t, n;
		try {
			t = e.getBBox();
		} catch {
			t = oa(e), n = 1;
		}
		return t && (t.width || t.height) || n || (t = oa(e)), t && !t.width && !t.x && !t.y ? {
			x: +sa(e, [
				"x",
				"cx",
				"x1"
			]) || 0,
			y: +sa(e, [
				"y",
				"cy",
				"y1"
			]) || 0,
			width: 0,
			height: 0
		} : t;
	}, la = function(e) {
		return !!(e.getCTM && (!e.parentNode || e.ownerSVGElement) && ca(e));
	}, ua = function(e, t) {
		if (t) {
			var n = e.style, r;
			t in Ai && t !== Xi && (t = U), n.removeProperty ? (r = t.substr(0, 2), (r === "ms" || t.substr(0, 6) === "webkit") && (t = "-" + t), n.removeProperty(r === "--" ? t : t.replace(Ni, "-$1").toLowerCase())) : n.removeAttribute(t);
		}
	}, da = function(e, t, n, r, i, a) {
		var o = new oi(e._pt, t, n, 0, 1, a ? Ui : Hi);
		return e._pt = o, o.b = r, o.e = i, e._props.push(n), o;
	}, fa = {
		deg: 1,
		rad: 1,
		turn: 1
	}, pa = {
		grid: 1,
		flex: 1
	}, ma = function e(t, n, r, i) {
		var a = parseFloat(r) || 0, o = (r + "").trim().substr((a + "").length) || "px", s = Ei.style, c = Pi.test(n), l = t.tagName.toLowerCase() === "svg", u = (l ? "client" : "offset") + (c ? "Width" : "Height"), d = 100, f = i === "px", p = i === "%", m, h, g, _;
		if (i === o || !a || fa[i] || fa[o]) return a;
		if (o !== "px" && !f && (a = e(t, n, r, "px")), _ = t.getCTM && la(t), (p || o === "%") && (Ai[n] || ~n.indexOf("adius"))) return m = _ ? t.getBBox()[c ? "width" : "height"] : t[u], R(p ? a / m * d : a / 100 * m);
		if (s[c ? "width" : "height"] = d + (f ? o : i), h = i !== "rem" && ~n.indexOf("adius") || i === "em" && t.appendChild && !l ? t : t.parentNode, _ && (h = (t.ownerSVGElement || {}).parentNode), (!h || h === Ci || !h.appendChild) && (h = Ci.body), g = h._gsap, g && p && g.width && c && g.time === _r.time && !g.uncache) return R(a / g.width * d);
		if (p && (n === "height" || n === "width")) {
			var v = t.style[n];
			t.style[n] = d + i, m = t[u], v ? t.style[n] = v : ua(t, n);
		} else (p || o === "%") && !pa[W(h, "display")] && (s.position = W(t, "position")), h === t && (s.position = "static"), h.appendChild(Ei), m = Ei[u], h.removeChild(Ei), s.position = "absolute";
		return c && p && (g = Ut(h), g.time = _r.time, g.width = h[u]), R(f ? m * a / d : m && a ? d / m * a : 0);
	}, ha = function(e, t, n, r) {
		var i;
		return Ti || aa(), t in Ii && t !== "transform" && (t = Ii[t], ~t.indexOf(",") && (t = t.split(",")[0])), Ai[t] && t !== "transform" ? (i = Da(e, r), i = t === "transformOrigin" ? i.svg ? i.origin : Oa(W(e, Xi)) + " " + i.zOrigin + "px" : i[t]) : (i = e.style[t], (!i || i === "auto" || r || ~(i + "").indexOf("calc(")) && (i = ba[t] && ba[t](e, t, n) || W(e, t) || Wt(e, t) || +(t === "opacity"))), n && !~(i + "").trim().indexOf(" ") ? ma(e, t, i, n) + n : i;
	}, ga = function(e, t, n, r) {
		if (!n || n === "none") {
			var i = ia(t, e, 1), a = i && W(e, i, 1);
			a && a !== n ? (t = i, n = a) : t === "borderColor" && (n = W(e, "borderTopColor"));
		}
		var o = new oi(this._pt, e.style, t, 0, 1, ei), s = 0, c = 0, l, u, d, f, p, m, h, g, _, v, y, b;
		if (o.b = n, o.e = r, n += "", r += "", r.substring(0, 6) === "var(--" && (r = W(e, r.substring(4, r.indexOf(")")))), r === "auto" && (m = e.style[t], e.style[t] = r, r = W(e, t) || r, m ? e.style[t] = m : ua(e, t)), l = [n, r], hr(l), n = l[0], r = l[1], d = n.match(mt) || [], b = r.match(mt) || [], b.length) {
			for (; u = mt.exec(r);) h = u[0], _ = r.substring(s, u.index), p ? p = (p + 1) % 5 : (_.substr(-5) === "rgba(" || _.substr(-5) === "hsla(") && (p = 1), h !== (m = d[c++] || "") && (f = parseFloat(m) || 0, y = m.substr((f + "").length), h.charAt(1) === "=" && (h = qt(f, h) + y), g = parseFloat(h), v = h.substr((g + "").length), s = mt.lastIndex - v.length, v || (v = v || We.units[t] || y, s === r.length && (r += v, o.e += v)), y !== v && (f = ma(e, t, m, v) || 0), o._pt = {
				_next: o._pt,
				p: _ || c === 1 ? _ : ",",
				s: f,
				c: g - f,
				m: p && p < 4 || t === "zIndex" ? Math.round : 0
			});
			o.c = s < r.length ? r.substring(s, r.length) : "";
		} else o.r = t === "display" && r === "none" ? Ui : Hi;
		return gt.test(r) && (o.e = 0), this._pt = o, o;
	}, _a = {
		top: "0%",
		bottom: "100%",
		left: "0%",
		right: "100%",
		center: "50%"
	}, va = function(e) {
		var t = e.split(" "), n = t[0], r = t[1] || "50%";
		return (n === "top" || n === "bottom" || r === "left" || r === "right") && (e = n, n = r, r = e), t[0] = _a[n] || n, t[1] = _a[r] || r, t.join(" ");
	}, ya = function(e, t) {
		if (t.tween && t.tween._time === t.tween._dur) {
			var n = t.t, r = n.style, i = t.u, a = n._gsap, o, s, c;
			if (i === "all" || i === !0) r.cssText = "", s = 1;
			else for (i = i.split(","), c = i.length; --c > -1;) o = i[c], Ai[o] && (s = 1, o = o === "transformOrigin" ? Xi : U), ua(n, o);
			s && (ua(n, U), a && (a.svg && n.removeAttribute("transform"), r.scale = r.rotate = r.translate = "none", Da(n, 1), a.uncache = 1, Qi(r)));
		}
	}, ba = { clearProps: function(e, t, n, r, i) {
		if (i.data !== "isFromStart") {
			var a = e._pt = new oi(e._pt, t, n, 0, 0, ya);
			return a.u = r, a.pr = -10, a.tween = i, e._props.push(n), 1;
		}
	} }, xa = [
		1,
		0,
		0,
		1,
		0,
		0
	], Sa = {}, Ca = function(e) {
		return e === "matrix(1, 0, 0, 1, 0, 0)" || e === "none" || !e;
	}, wa = function(e) {
		var t = W(e, U);
		return Ca(t) ? xa : t.substr(7).match(pt).map(R);
	}, Ta = function(e, t) {
		var n = e._gsap || Ut(e), r = e.style, i = wa(e), a, o, s, c;
		return n.svg && e.getAttribute("transform") ? (s = e.transform.baseVal.consolidate().matrix, i = [
			s.a,
			s.b,
			s.c,
			s.d,
			s.e,
			s.f
		], i.join(",") === "1,0,0,1,0,0" ? xa : i) : (i === xa && !e.offsetParent && e !== wi && !n.svg && (s = r.display, r.display = "block", a = e.parentNode, (!a || !e.offsetParent && !e.getBoundingClientRect().width) && (c = 1, o = e.nextElementSibling, wi.appendChild(e)), i = wa(e), s ? r.display = s : ua(e, "display"), c && (o ? a.insertBefore(e, o) : a ? a.appendChild(e) : wi.removeChild(e))), t && i.length > 6 ? [
			i[0],
			i[1],
			i[4],
			i[5],
			i[12],
			i[13]
		] : i);
	}, Ea = function(e, t, n, r, i, a) {
		var o = e._gsap, s = i || Ta(e, !0), c = o.xOrigin || 0, l = o.yOrigin || 0, u = o.xOffset || 0, d = o.yOffset || 0, f = s[0], p = s[1], m = s[2], h = s[3], g = s[4], _ = s[5], v = t.split(" "), y = parseFloat(v[0]) || 0, b = parseFloat(v[1]) || 0, x, S, C, w;
		n ? s !== xa && (S = f * h - p * m) && (C = h / S * y + b * (-m / S) + (m * _ - h * g) / S, w = y * (-p / S) + f / S * b - (f * _ - p * g) / S, y = C, b = w) : (x = ca(e), y = x.x + (~v[0].indexOf("%") ? y / 100 * x.width : y), b = x.y + (~(v[1] || v[0]).indexOf("%") ? b / 100 * x.height : b)), r || r !== !1 && o.smooth ? (g = y - c, _ = b - l, o.xOffset = u + (g * f + _ * m) - g, o.yOffset = d + (g * p + _ * h) - _) : o.xOffset = o.yOffset = 0, o.xOrigin = y, o.yOrigin = b, o.smooth = !!r, o.origin = t, o.originIsAbsolute = !!n, e.style[Xi] = "0px 0px", a && (da(a, o, "xOrigin", c, y), da(a, o, "yOrigin", l, b), da(a, o, "xOffset", u, o.xOffset), da(a, o, "yOffset", d, o.yOffset)), e.setAttribute("data-svg-origin", y + " " + b);
	}, Da = function(e, t) {
		var n = e._gsap || new Ar(e);
		if ("x" in n && !t && !n.uncache) return n;
		var r = e.style, i = n.scaleX < 0, a = "px", o = "deg", s = getComputedStyle(e), c = W(e, Xi) || "0", l = u = d = m = h = g = _ = v = y = 0, u, d, f = p = 1, p, m, h, g, _, v, y, b, x, S, C, w, T, E, D, O, k, ee, te, ne, re, ie, ae, A, j, oe, se, ce;
		return n.svg = !!(e.getCTM && la(e)), s.translate && ((s.translate !== "none" || s.scale !== "none" || s.rotate !== "none") && (r[U] = (s.translate === "none" ? "" : "translate3d(" + (s.translate + " 0 0").split(" ").slice(0, 3).join(", ") + ") ") + (s.rotate === "none" ? "" : "rotate(" + s.rotate + ") ") + (s.scale === "none" ? "" : "scale(" + s.scale.split(" ").join(",") + ") ") + (s[U] === "none" ? "" : s[U])), r.scale = r.rotate = r.translate = "none"), S = Ta(e, n.svg), n.svg && (n.uncache ? (re = e.getBBox(), c = n.xOrigin - re.x + "px " + (n.yOrigin - re.y) + "px", ne = "") : ne = !t && e.getAttribute("data-svg-origin"), Ea(e, ne || c, !!ne || n.originIsAbsolute, n.smooth !== !1, S)), b = n.xOrigin || 0, x = n.yOrigin || 0, S !== xa && (E = S[0], D = S[1], O = S[2], k = S[3], l = ee = S[4], u = te = S[5], S.length === 6 ? (f = Math.sqrt(E * E + D * D), p = Math.sqrt(k * k + O * O), m = E || D ? H(D, E) * ji : 0, _ = O || k ? H(O, k) * ji + m : 0, _ && (p *= Math.abs(Math.cos(_ * V))), n.svg && (l -= b - (b * E + x * O), u -= x - (b * D + x * k))) : (ce = S[6], oe = S[7], ae = S[8], A = S[9], j = S[10], se = S[11], l = S[12], u = S[13], d = S[14], C = H(ce, j), h = C * ji, C && (w = Math.cos(-C), T = Math.sin(-C), ne = ee * w + ae * T, re = te * w + A * T, ie = ce * w + j * T, ae = ee * -T + ae * w, A = te * -T + A * w, j = ce * -T + j * w, se = oe * -T + se * w, ee = ne, te = re, ce = ie), C = H(-O, j), g = C * ji, C && (w = Math.cos(-C), T = Math.sin(-C), ne = E * w - ae * T, re = D * w - A * T, ie = O * w - j * T, se = k * T + se * w, E = ne, D = re, O = ie), C = H(D, E), m = C * ji, C && (w = Math.cos(C), T = Math.sin(C), ne = E * w + D * T, re = ee * w + te * T, D = D * w - E * T, te = te * w - ee * T, E = ne, ee = re), h && Math.abs(h) + Math.abs(m) > 359.9 && (h = m = 0, g = 180 - g), f = R(Math.sqrt(E * E + D * D + O * O)), p = R(Math.sqrt(te * te + ce * ce)), C = H(ee, te), _ = Math.abs(C) > 2e-4 ? C * ji : 0, y = se ? 1 / (se < 0 ? -se : se) : 0), n.svg && (ne = e.getAttribute("transform"), n.forceCSS = e.setAttribute("transform", "") || !Ca(W(e, U)), ne && e.setAttribute("transform", ne))), Math.abs(_) > 90 && Math.abs(_) < 270 && (i ? (f *= -1, _ += m <= 0 ? 180 : -180, m += m <= 0 ? 180 : -180) : (p *= -1, _ += _ <= 0 ? 180 : -180)), t ||= n.uncache, n.x = l - ((n.xPercent = l && (!t && n.xPercent || (Math.round(e.offsetWidth / 2) === Math.round(-l) ? -50 : 0))) ? e.offsetWidth * n.xPercent / 100 : 0) + a, n.y = u - ((n.yPercent = u && (!t && n.yPercent || (Math.round(e.offsetHeight / 2) === Math.round(-u) ? -50 : 0))) ? e.offsetHeight * n.yPercent / 100 : 0) + a, n.z = d + a, n.scaleX = R(f), n.scaleY = R(p), n.rotation = R(m) + o, n.rotationX = R(h) + o, n.rotationY = R(g) + o, n.skewX = _ + o, n.skewY = v + o, n.transformPerspective = y + a, (n.zOrigin = parseFloat(c.split(" ")[2]) || !t && n.zOrigin || 0) && (r[Xi] = Oa(c)), n.xOffset = n.yOffset = 0, n.force3D = We.force3D, n.renderTransform = n.svg ? Fa : ta ? Pa : Aa, n.uncache = 0, n;
	}, Oa = function(e) {
		return (e = e.split(" "))[0] + " " + e[1];
	}, ka = function(e, t, n) {
		var r = Fn(t);
		return R(parseFloat(t) + parseFloat(ma(e, "x", n + "px", r))) + r;
	}, Aa = function(e, t) {
		t.z = "0px", t.rotationY = t.rotationX = "0deg", t.force3D = 0, Pa(e, t);
	}, ja = "0deg", Ma = "0px", Na = ") ", Pa = function(e, t) {
		var n = t || this, r = n.xPercent, i = n.yPercent, a = n.x, o = n.y, s = n.z, c = n.rotation, l = n.rotationY, u = n.rotationX, d = n.skewX, f = n.skewY, p = n.scaleX, m = n.scaleY, h = n.transformPerspective, g = n.force3D, _ = n.target, v = n.zOrigin, y = "", b = g === "auto" && e && e !== 1 || g === !0;
		if (v && (u !== ja || l !== ja)) {
			var x = parseFloat(l) * V, S = Math.sin(x), C = Math.cos(x), w;
			x = parseFloat(u) * V, w = Math.cos(x), a = ka(_, a, S * w * -v), o = ka(_, o, -Math.sin(x) * -v), s = ka(_, s, C * w * -v + v);
		}
		h !== Ma && (y += "perspective(" + h + Na), (r || i) && (y += "translate(" + r + "%, " + i + "%) "), (b || a !== Ma || o !== Ma || s !== Ma) && (y += s !== Ma || b ? "translate3d(" + a + ", " + o + ", " + s + ") " : "translate(" + a + ", " + o + Na), c !== ja && (y += "rotate(" + c + Na), l !== ja && (y += "rotateY(" + l + Na), u !== ja && (y += "rotateX(" + u + Na), (d !== ja || f !== ja) && (y += "skew(" + d + ", " + f + Na), (p !== 1 || m !== 1) && (y += "scale(" + p + ", " + m + Na), _.style[U] = y || "translate(0, 0)";
	}, Fa = function(e, t) {
		var n = t || this, r = n.xPercent, i = n.yPercent, a = n.x, o = n.y, s = n.rotation, c = n.skewX, l = n.skewY, u = n.scaleX, d = n.scaleY, f = n.target, p = n.xOrigin, m = n.yOrigin, h = n.xOffset, g = n.yOffset, _ = n.forceCSS, v = parseFloat(a), y = parseFloat(o), b, x, S, C, w;
		s = parseFloat(s), c = parseFloat(c), l = parseFloat(l), l && (l = parseFloat(l), c += l, s += l), s || c ? (s *= V, c *= V, b = Math.cos(s) * u, x = Math.sin(s) * u, S = Math.sin(s - c) * -d, C = Math.cos(s - c) * d, c && (l *= V, w = Math.tan(c - l), w = Math.sqrt(1 + w * w), S *= w, C *= w, l && (w = Math.tan(l), w = Math.sqrt(1 + w * w), b *= w, x *= w)), b = R(b), x = R(x), S = R(S), C = R(C)) : (b = u, C = d, x = S = 0), (v && !~(a + "").indexOf("px") || y && !~(o + "").indexOf("px")) && (v = ma(f, "x", a, "px"), y = ma(f, "y", o, "px")), (p || m || h || g) && (v = R(v + p - (p * b + m * S) + h), y = R(y + m - (p * x + m * C) + g)), (r || i) && (w = f.getBBox(), v = R(v + r / 100 * w.width), y = R(y + i / 100 * w.height)), w = "matrix(" + b + "," + x + "," + S + "," + C + "," + v + "," + y + ")", f.setAttribute("transform", w), _ && (f.style[U] = w);
	}, Ia = function(e, t, n, r, i) {
		var a = 360, o = tt(i), s = parseFloat(i) * (o && ~i.indexOf("rad") ? ji : 1) - r, c = r + s + "deg", l, u;
		return o && (l = i.split("_")[1], l === "short" && (s %= a, s !== s % (a / 2) && (s += s < 0 ? a : -a)), l === "cw" && s < 0 ? s = (s + a * Mi) % a - ~~(s / a) * a : l === "ccw" && s > 0 && (s = (s - a * Mi) % a - ~~(s / a) * a)), e._pt = u = new oi(e._pt, t, n, r, s, Ri), u.e = c, u.u = "deg", e._props.push(n), u;
	}, La = function(e, t) {
		for (var n in t) e[n] = t[n];
		return e;
	}, Ra = function(e, t, n) {
		var r = La({}, n._gsap), i = "perspective,force3D,transformOrigin,svgOrigin", a = n.style, o, s, c, l, u, d, f, p;
		for (s in r.svg ? (c = n.getAttribute("transform"), n.setAttribute("transform", ""), a[U] = t, o = Da(n, 1), ua(n, U), n.setAttribute("transform", c)) : (c = getComputedStyle(n)[U], a[U] = t, o = Da(n, 1), a[U] = c), Ai) c = r[s], l = o[s], c !== l && i.indexOf(s) < 0 && (f = Fn(c), p = Fn(l), u = f === p ? parseFloat(c) : ma(n, s, c, p), d = parseFloat(l), e._pt = new oi(e._pt, o, s, u, d - u, Li), e._pt.u = p || 0, e._props.push(s));
		La(o, r);
	}, Gt("padding,margin,Width,Radius", function(e, t) {
		var n = "Top", r = "Right", i = "Bottom", a = "Left", o = (t < 3 ? [
			n,
			r,
			i,
			a
		] : [
			n + a,
			n + r,
			i + r,
			i + a
		]).map(function(n) {
			return t < 2 ? e + n : "border" + n + e;
		});
		ba[t > 1 ? "border" + e : e] = function(e, t, n, r, i) {
			var a, s;
			if (arguments.length < 4) return a = o.map(function(t) {
				return ha(e, t, n);
			}), s = a.join(" "), s.split(a[0]).length === 5 ? a[0] : s;
			a = (r + "").split(" "), s = {}, o.forEach(function(e, t) {
				return s[e] = a[t] = a[t] || a[(t - 1) / 2 | 0];
			}), e.init(t, s, i);
		};
	}), za = {
		name: "css",
		register: aa,
		targetTest: function(e) {
			return e.style && e.nodeType;
		},
		init: function(e, t, n, r, i) {
			var a = this._props, o = e.style, s = n.vars.startAt, c, l, u, d, f, p, m, h, g, _, v, y, b, x, S, C, w;
			for (m in Ti || aa(), this.styles = this.styles || ea(e), C = this.styles.props, this.tween = n, t) if (m !== "autoRound" && (l = t[m], !(Lt[m] && Ir(m, t, n, r, e, i)))) {
				if (f = typeof l, p = ba[m], f === "function" && (l = l.call(n, r, e, i), f = typeof l), f === "string" && ~l.indexOf("random(") && (l = $n(l)), p) p(this, e, m, l, n) && (S = 1);
				else if (m.substr(0, 2) === "--") c = (getComputedStyle(e).getPropertyValue(m) + "").trim(), l += "", pr.lastIndex = 0, pr.test(c) || (h = Fn(c), g = Fn(l), g ? h !== g && (c = ma(e, m, c, g) + g) : h && (l += h)), this.add(o, "setProperty", c, l, r, i, 0, 0, m), a.push(m), C.push(m, 0, o[m]);
				else if (f !== "undefined") {
					if (s && m in s ? (c = typeof s[m] == "function" ? s[m].call(n, r, e, i) : s[m], tt(c) && ~c.indexOf("random(") && (c = $n(c)), Fn(c + "") || c === "auto" || (c += We.units[m] || Fn(ha(e, m)) || ""), (c + "").charAt(1) === "=" && (c = ha(e, m))) : c = ha(e, m), d = parseFloat(c), _ = f === "string" && l.charAt(1) === "=" && l.substr(0, 2), _ && (l = l.substr(2)), u = parseFloat(l), m in Ii && (m === "autoAlpha" && (d === 1 && ha(e, "visibility") === "hidden" && u && (d = 0), C.push("visibility", 0, o.visibility), da(this, o, "visibility", d ? "inherit" : "hidden", u ? "inherit" : "hidden", !u)), m !== "scale" && m !== "transform" && (m = Ii[m], ~m.indexOf(",") && (m = m.split(",")[0]))), v = m in Ai, v) {
						if (this.styles.save(m), w = l, f === "string" && l.substring(0, 6) === "var(--") {
							if (l = W(e, l.substring(4, l.indexOf(")"))), l.substring(0, 5) === "calc(") {
								var T = e.style.perspective;
								e.style.perspective = l, l = W(e, "perspective"), T ? e.style.perspective = T : ua(e, "perspective");
							}
							u = parseFloat(l);
						}
						if (y || (b = e._gsap, b.renderTransform && !t.parseTransform || Da(e, t.parseTransform), x = t.smoothOrigin !== !1 && b.smooth, y = this._pt = new oi(this._pt, o, U, 0, 1, b.renderTransform, b, 0, -1), y.dep = 1), m === "scale") this._pt = new oi(this._pt, b, "scaleY", b.scaleY, (_ ? qt(b.scaleY, _ + u) : u) - b.scaleY || 0, Li), this._pt.u = 0, a.push("scaleY", m), m += "X";
						else if (m === "transformOrigin") {
							C.push(Xi, 0, o[Xi]), l = va(l), b.svg ? Ea(e, l, 0, x, 0, this) : (g = parseFloat(l.split(" ")[2]) || 0, g !== b.zOrigin && da(this, b, "zOrigin", b.zOrigin, g), da(this, o, m, Oa(c), Oa(l)));
							continue;
						} else if (m === "svgOrigin") {
							Ea(e, l, 1, x, 0, this);
							continue;
						} else if (m in Sa) {
							Ia(this, b, m, d, _ ? qt(d, _ + l) : l);
							continue;
						} else if (m === "smoothOrigin") {
							da(this, b, "smooth", b.smooth, l);
							continue;
						} else if (m === "force3D") {
							b[m] = l;
							continue;
						} else if (m === "transform") {
							Ra(this, l, e);
							continue;
						}
					} else m in o || (m = ia(m) || m);
					if (v || (u || u === 0) && (d || d === 0) && !Fi.test(l) && m in o) h = (c + "").substr((d + "").length), u ||= 0, g = Fn(l) || (m in We.units ? We.units[m] : h), h !== g && (d = ma(e, m, c, g)), this._pt = new oi(this._pt, v ? b : o, m, d, (_ ? qt(d, _ + u) : u) - d, !v && (g === "px" || m === "zIndex") && t.autoRound !== !1 ? Vi : Li), this._pt.u = g || 0, v && w !== l ? (this._pt.b = c, this._pt.e = w, this._pt.r = Bi) : h !== g && g !== "%" && (this._pt.b = c, this._pt.r = zi);
					else if (m in o) ga.call(this, e, m, c, _ ? _ + l : l);
					else if (m in e) this.add(e, m, c || e[m], _ ? _ + l : l, r, i);
					else if (m !== "parseTransform") {
						Et(m, l);
						continue;
					}
					v || (m in o ? C.push(m, 0, o[m]) : typeof e[m] == "function" ? C.push(m, 2, e[m]()) : C.push(m, 1, c || e[m])), a.push(m);
				}
			}
			S && ai(this);
		},
		render: function(e, t) {
			if (t.tween._time || !Oi()) for (var n = t._pt; n;) n.r(e, n.d), n = n._next;
			else t.styles.revert();
		},
		get: ha,
		aliases: Ii,
		getSetter: function(e, t, n) {
			var r = Ii[t];
			return r && r.indexOf(",") < 0 && (t = r), t in Ai && t !== Xi && (e._gsap.x || ha(e, "x")) ? n && Di === n ? t === "scale" ? qi : Ki : (Di = n || {}) && (t === "scale" ? Ji : Yi) : e.style && !it(e.style[t]) ? Wi : ~t.indexOf("-") ? Gi : Zr(e, t);
		},
		core: {
			_removeProperty: ua,
			_getMatrix: Ta
		}
	}, bi.utils.checkPrefix = ia, bi.core.getStyleSaver = ea, (function(e, t, n, r) {
		var i = Gt(e + "," + t + "," + n, function(e) {
			Ai[e] = 1;
		});
		Gt(t, function(e) {
			We.units[e] = "deg", Sa[e] = 1;
		}), Ii[i[13]] = e + "," + t, Gt(r, function(e) {
			var t = e.split(":");
			Ii[t[1]] = i[t[0]];
		});
	})("x,y,z,scale,scaleX,scaleY,xPercent,yPercent", "rotation,rotationX,rotationY,skewX,skewY", "transform,transformOrigin,svgOrigin,force3D,smoothOrigin,transformPerspective", "0:translateX,1:translateY,2:translateZ,8:rotate,8:rotationZ,8:rotateZ,9:rotateX,10:rotateY"), Gt("x,y,z,top,right,bottom,left,width,height,fontSize,padding,margin,perspective", function(e) {
		We.units[e] = "px";
	}), bi.registerPlugin(za);
})), Va, Ha = o((() => {
	xi(), Ba(), Va = bi.registerPlugin(za) || bi, Va.core.Tween;
})), Ua = o((() => {})), Wa = /* @__PURE__ */ s(((e) => {
	var t = Symbol.for("react.transitional.element");
	function n(e, n, r) {
		var i = null;
		if (r !== void 0 && (i = "" + r), n.key !== void 0 && (i = "" + n.key), "key" in n) for (var a in r = {}, n) a !== "key" && (r[a] = n[a]);
		else r = n;
		return n = r.ref, {
			$$typeof: t,
			type: e,
			key: i,
			ref: n === void 0 ? null : n,
			props: r
		};
	}
	e.jsx = n, e.jsxs = n;
})), Ga = /* @__PURE__ */ s(((e, t) => {
	t.exports = Wa();
})), Ka, G, qa, Ja = o((() => {
	Ka = /* @__PURE__ */ l(d()), Ve(), Ha(), Ua(), G = Ga(), qa = ({ logo: e, logoAlt: t = "Logo", items: n, activeHref: r, className: i = "", ease: a = "power3.easeOut", baseColor: o = "#fff", pillColor: s = "#120F17", hoveredPillTextColor: c = "#120F17", pillTextColor: l, onMobileMenuClick: u, initialLoadAnimation: d = !0 }) => {
		let f = l ?? o, [p, m] = (0, Ka.useState)(!1), h = (0, Ka.useRef)([]), g = (0, Ka.useRef)([]), _ = (0, Ka.useRef)([]), v = (0, Ka.useRef)(null), y = (0, Ka.useRef)(null), b = (0, Ka.useRef)(null), x = (0, Ka.useRef)(null), S = (0, Ka.useRef)(null), C = (0, Ka.useRef)(null);
		(0, Ka.useEffect)(() => {
			let e = () => {
				h.current.forEach((e) => {
					if (!e?.parentElement) return;
					let t = e.parentElement, { width: n, height: r } = t.getBoundingClientRect(), i = (n * n / 4 + r * r) / (2 * r), o = Math.ceil(2 * i) + 2, s = Math.ceil(i - Math.sqrt(Math.max(0, i * i - n * n / 4))) + 1, c = o - s;
					e.style.width = `${o}px`, e.style.height = `${o}px`, e.style.bottom = `-${s}px`, Va.set(e, {
						xPercent: -50,
						scale: 0,
						transformOrigin: `50% ${c}px`
					});
					let l = t.querySelector(".pill-label"), u = t.querySelector(".pill-label-hover");
					l && Va.set(l, { y: 0 }), u && Va.set(u, {
						y: r + 12,
						opacity: 0
					});
					let d = h.current.indexOf(e);
					if (d === -1) return;
					g.current[d]?.kill();
					let f = Va.timeline({ paused: !0 });
					f.to(e, {
						scale: 1.2,
						xPercent: -50,
						duration: 2,
						ease: a,
						overwrite: "auto"
					}, 0), l && f.to(l, {
						y: -(r + 8),
						duration: 2,
						ease: a,
						overwrite: "auto"
					}, 0), u && (Va.set(u, {
						y: Math.ceil(r + 100),
						opacity: 0
					}), f.to(u, {
						y: 0,
						opacity: 1,
						duration: 2,
						ease: a,
						overwrite: "auto"
					}, 0)), g.current[d] = f;
				});
			};
			e();
			let t = () => e();
			window.addEventListener("resize", t), document.fonts?.ready && document.fonts.ready.then(e).catch(() => {});
			let n = x.current;
			if (n && Va.set(n, {
				visibility: "hidden",
				opacity: 0,
				scaleY: 1
			}), d) {
				let e = C.current, t = S.current;
				e && (Va.set(e, { scale: 0 }), Va.to(e, {
					scale: 1,
					duration: .6,
					ease: a
				})), t && (Va.set(t, {
					width: 0,
					overflow: "hidden"
				}), Va.to(t, {
					width: "auto",
					duration: .6,
					ease: a
				}));
			}
			return () => window.removeEventListener("resize", t);
		}, [
			n,
			a,
			d
		]);
		let w = (e) => {
			let t = g.current[e];
			t && (_.current[e]?.kill(), _.current[e] = t.tweenTo(t.duration(), {
				duration: .3,
				ease: a,
				overwrite: "auto"
			}));
		}, T = (e) => {
			let t = g.current[e];
			t && (_.current[e]?.kill(), _.current[e] = t.tweenTo(0, {
				duration: .2,
				ease: a,
				overwrite: "auto"
			}));
		}, E = () => {
			let e = v.current;
			e && (y.current?.kill(), Va.set(e, { rotate: 0 }), y.current = Va.to(e, {
				rotate: 360,
				duration: .2,
				ease: a,
				overwrite: "auto"
			}));
		}, D = () => {
			let e = !p;
			m(e);
			let t = b.current, n = x.current;
			if (t) {
				let n = t.querySelectorAll(".hamburger-line");
				e ? (Va.to(n[0], {
					rotation: 45,
					y: 3,
					duration: .3,
					ease: a
				}), Va.to(n[1], {
					rotation: -45,
					y: -3,
					duration: .3,
					ease: a
				})) : (Va.to(n[0], {
					rotation: 0,
					y: 0,
					duration: .3,
					ease: a
				}), Va.to(n[1], {
					rotation: 0,
					y: 0,
					duration: .3,
					ease: a
				}));
			}
			n && (e ? (Va.set(n, { visibility: "visible" }), Va.fromTo(n, {
				opacity: 0,
				y: 10,
				scaleY: 1
			}, {
				opacity: 1,
				y: 0,
				scaleY: 1,
				duration: .3,
				ease: a,
				transformOrigin: "top center"
			})) : Va.to(n, {
				opacity: 0,
				y: 10,
				scaleY: 1,
				duration: .2,
				ease: a,
				transformOrigin: "top center",
				onComplete: () => {
					Va.set(n, { visibility: "hidden" });
				}
			})), u?.();
		}, O = (e) => e.endsWith(".html") || e.startsWith("http://") || e.startsWith("https://") || e.startsWith("//") || e.startsWith("mailto:") || e.startsWith("tel:") || e.startsWith("#"), k = (e) => e && !O(e), ee = {
			"--base": o,
			"--pill-bg": s,
			"--hover-text": c,
			"--pill-text": f
		};
		return /* @__PURE__ */ (0, G.jsxs)("div", {
			className: "pill-nav-container",
			children: [/* @__PURE__ */ (0, G.jsxs)("nav", {
				className: `pill-nav ${i}`,
				"aria-label": "Primary",
				style: ee,
				children: [
					k(n?.[0]?.href) ? /* @__PURE__ */ (0, G.jsx)(Re, {
						className: "pill-logo",
						to: n[0].href,
						"aria-label": "Home",
						onMouseEnter: E,
						role: "menuitem",
						ref: (e) => {
							C.current = e;
						},
						children: /* @__PURE__ */ (0, G.jsx)("img", {
							src: e,
							alt: t,
							ref: v
						})
					}) : /* @__PURE__ */ (0, G.jsx)("a", {
						className: "pill-logo",
						href: n?.[0]?.href || "#",
						"aria-label": "Home",
						onMouseEnter: E,
						ref: (e) => {
							C.current = e;
						},
						children: /* @__PURE__ */ (0, G.jsx)("img", {
							src: e,
							alt: t,
							ref: v
						})
					}),
					/* @__PURE__ */ (0, G.jsx)("div", {
						className: "pill-nav-items desktop-only",
						ref: S,
						children: /* @__PURE__ */ (0, G.jsx)("ul", {
							className: "pill-list",
							role: "menubar",
							children: n.map((e, t) => /* @__PURE__ */ (0, G.jsx)("li", {
								role: "none",
								children: k(e.href) ? /* @__PURE__ */ (0, G.jsxs)(Re, {
									role: "menuitem",
									to: e.href,
									className: `pill${r === e.href ? " is-active" : ""}`,
									"aria-label": e.ariaLabel || e.label,
									onMouseEnter: () => w(t),
									onMouseLeave: () => T(t),
									children: [/* @__PURE__ */ (0, G.jsx)("span", {
										className: "hover-circle",
										"aria-hidden": "true",
										ref: (e) => {
											h.current[t] = e;
										}
									}), /* @__PURE__ */ (0, G.jsxs)("span", {
										className: "label-stack",
										children: [/* @__PURE__ */ (0, G.jsx)("span", {
											className: "pill-label",
											children: e.label
										}), /* @__PURE__ */ (0, G.jsx)("span", {
											className: "pill-label-hover",
											"aria-hidden": "true",
											children: e.label
										})]
									})]
								}) : /* @__PURE__ */ (0, G.jsxs)("a", {
									role: "menuitem",
									href: e.href,
									className: `pill${r === e.href ? " is-active" : ""}`,
									"aria-label": e.ariaLabel || e.label,
									onMouseEnter: () => w(t),
									onMouseLeave: () => T(t),
									children: [/* @__PURE__ */ (0, G.jsx)("span", {
										className: "hover-circle",
										"aria-hidden": "true",
										ref: (e) => {
											h.current[t] = e;
										}
									}), /* @__PURE__ */ (0, G.jsxs)("span", {
										className: "label-stack",
										children: [/* @__PURE__ */ (0, G.jsx)("span", {
											className: "pill-label",
											children: e.label
										}), /* @__PURE__ */ (0, G.jsx)("span", {
											className: "pill-label-hover",
											"aria-hidden": "true",
											children: e.label
										})]
									})]
								})
							}, e.href || `item-${t}`))
						})
					}),
					/* @__PURE__ */ (0, G.jsxs)("button", {
						className: "mobile-menu-button mobile-only",
						onClick: D,
						"aria-label": "Toggle menu",
						ref: b,
						children: [/* @__PURE__ */ (0, G.jsx)("span", { className: "hamburger-line" }), /* @__PURE__ */ (0, G.jsx)("span", { className: "hamburger-line" })]
					})
				]
			}), /* @__PURE__ */ (0, G.jsx)("div", {
				className: "mobile-menu-popover mobile-only",
				ref: x,
				style: ee,
				children: /* @__PURE__ */ (0, G.jsx)("ul", {
					className: "mobile-menu-list",
					children: n.map((e, t) => /* @__PURE__ */ (0, G.jsx)("li", { children: k(e.href) ? /* @__PURE__ */ (0, G.jsx)(Re, {
						to: e.href,
						className: `mobile-menu-link${r === e.href ? " is-active" : ""}`,
						onClick: () => m(!1),
						children: e.label
					}) : /* @__PURE__ */ (0, G.jsx)("a", {
						href: e.href,
						className: `mobile-menu-link${r === e.href ? " is-active" : ""}`,
						onClick: () => m(!1),
						children: e.label
					}) }, e.href || `mobile-item-${t}`))
				})
			})]
		});
	};
})), Ya = /* @__PURE__ */ s((() => {
	var e = /* @__PURE__ */ l(d()), t = _();
	Ja();
	var n = Ga();
	function r() {
		let [t, r] = (0, e.useState)(window.location.hash || "#home"), i = (0, e.useMemo)(() => [
			{
				label: "Home",
				href: "#home"
			},
			{
				label: "About",
				href: "#about"
			},
			{
				label: "Sign in",
				href: "FrameLogin.html"
			}
		], []);
		return (0, e.useEffect)(() => {
			let e = () => {
				r(window.location.hash || "#home");
			};
			return window.addEventListener("hashchange", e), () => window.removeEventListener("hashchange", e);
		}, []), /* @__PURE__ */ (0, n.jsx)(qa, {
			logo: "Images/SpotEase.png",
			logoAlt: "SpotEase",
			items: i,
			activeHref: t,
			className: "home-pill-nav",
			baseColor: "#111111",
			pillColor: "#f5f5f5",
			hoveredPillTextColor: "#f5f5f5",
			pillTextColor: "#111111",
			showTooltip: !1,
			initialLoadAnimation: !0
		});
	}
	function i() {
		let e = document.getElementById("homePillNavRoot");
		e && (0, t.createRoot)(e).render(/* @__PURE__ */ (0, n.jsx)(r, {}));
	}
	document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", i) : i();
}));
//#endregion
export default Ya();

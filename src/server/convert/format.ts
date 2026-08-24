// Ports of toppic-suite src/common/util/str_util.cpp number formatting.
// These reproduce C++ iostream output (including 2-digit exponents) so that
// generated data_js files match TopPIC's own output byte-for-byte.

/** C++: fixed << setprecision(p); value == 0 prints "0". */
export function fixedToString(value: number, precision: number): string {
  if (value === 0) return '0';
  return value.toFixed(precision);
}

/** C++ scientific formatting: mantissa with `precision` decimals, e+NN / e-NN. */
function scientific(value: number, precision: number): string {
  let s = value.toExponential(precision); // e.g. "1.2623e+7"
  // pad exponent to at least two digits like C++ iostreams
  return s.replace(/e([+-])(\d)$/, 'e$10$2');
}

/** C++: str_util::toString(double): scientific(10) when 0<|v|<1, else fixed(10). */
export function doubleToString(value: number): string {
  if (value !== 0 && value < 1 && value > -1) {
    return scientific(value, 10);
  }
  return value.toFixed(10);
}

/** C++: str_util::toScientificStr: value == 0 prints "0". */
export function toScientificStr(value: number, precision: number): string {
  if (value === 0) return '0';
  return scientific(value, precision);
}

/** C++: str_util::evalueToString with precision 2. */
export function evalueToString(value: number): string {
  if (value === 0) return '0';
  if (value < 0.01 && value > -0.01) return scientific(value, 2);
  return value.toFixed(2);
}

export function boolToString(value: boolean): string {
  return value ? 'true' : 'false';
}

/** ion_sort_name: ion type name + display position zero-padded to 5 digits. */
export function ionSortName(ionType: string, displayPos: number): string {
  let pos = String(displayPos);
  while (pos.length < 5) pos = '0' + pos;
  return ionType + pos;
}

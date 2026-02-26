export function normalizeNumber(val, parentSize = null) {
  if (val == null) return null;

  const str = val.toString().trim();

  if (str.endsWith("%")) {
    if (parentSize == null) return null;
    const percent = parseFloat(str);
    return (percent / 100) * parentSize;
  }

  if (str.endsWith("px")) {
    return parseFloat(str);
  }

  if (/^-?\d+(\.\d+)?$/.test(str)) {
    return Number(str);
  }

  return null;
}
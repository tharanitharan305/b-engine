export function extractTranslate(transform = "") {
  const x = transform.match(/translateX\(([-\d.]+)px\)/);
  const y = transform.match(/translateY\(([-\d.]+)px\)/);
  return {
    x: x ? Number(x[1]) : 0,
    y: y ? Number(y[1]) : 0,
  };
}
export function normalizeColor(value) {
  if (!value || typeof value !== "string") return null;

  const v = value.trim().toLowerCase();

  const named = {
    white: "#ffffff",
    black: "#000000",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    grey: "#808080",
    transparent: "#00000000",
  };

  if (named[v]) return named[v];

  if (v.startsWith("rgb")) {
    const nums = v.match(/\d+/g);
    if (!nums || nums.length < 3) return null;
    return (
      "#" +
      nums.slice(0, 3).map(n => Number(n).toString(16).padStart(2, "0")).join("")
    );
  }

  if (v.startsWith("#") && v.length === 4) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }

  if (v.startsWith("#") && v.length === 7) {
    return v;
  }

  return null;
}
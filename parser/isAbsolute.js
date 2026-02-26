export function isAbsolute(style = {}) {
  return (
    !!style.transform ||
    style.position === "absolute" ||
    style.position === "relative" ||
    style.top ||
    style.left ||
    style.right ||
    style.bottom
  );
}
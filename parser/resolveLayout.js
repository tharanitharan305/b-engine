export function resolveLayout(style = {}) {
  if (style.display === "flex") {
    return style["flex-direction"] === "column" ? "column" : "row";
  }
  return "column";
}
export function cx(...classes: (false | null | string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

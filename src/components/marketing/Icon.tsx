export type IconName =
  | "arrow-left"
  | "arrow-linkout"
  | "arrow-right"
  | "chevron-down"
  | "close"
  | "code"
  | "copy"
  | "crop-free"
  | "globe"
  | "grid-view"
  | "list-view"
  | "minus"
  | "plus"
  | "search";

const paths: Record<IconName, string> = {
  "arrow-left":
    '<line x1="13" y1="8" x2="3" y2="8"/><polyline points="8 3 3 8 8 13"/>',
  "arrow-linkout":
    '<line x1="4.5" y1="11.5" x2="11.5" y2="4.5"/><polyline points="5.5 4.5 11.5 4.5 11.5 10.5"/>',
  "arrow-right":
    '<line x1="3" y1="8" x2="13" y2="8"/><polyline points="8 3 13 8 8 13"/>',
  "chevron-down": '<polyline points="3.5 6 8 10.5 12.5 6"/>',
  close:
    '<line x1="3.5" y1="3.5" x2="12.5" y2="12.5"/><line x1="12.5" y1="3.5" x2="3.5" y2="12.5"/>',
  code: '<polyline points="5.5 4 2 8 5.5 12"/><polyline points="10.5 4 14 8 10.5 12"/>',
  copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1"/><path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1"/>',
  "crop-free":
    '<polyline points="2.5 5.5 2.5 2.5 5.5 2.5"/><polyline points="10.5 2.5 13.5 2.5 13.5 5.5"/><polyline points="13.5 10.5 13.5 13.5 10.5 13.5"/><polyline points="5.5 13.5 2.5 13.5 2.5 10.5"/>',
  globe:
    '<circle cx="8" cy="8" r="6"/><line x1="2" y1="8" x2="14" y2="8"/><path d="M8 2c2.2 1.8 2.2 10.2 0 12M8 2c-2.2 1.8-2.2 10.2 0 12"/>',
  "grid-view":
    '<rect x="2.5" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="9" y="2.5" width="4.5" height="4.5" rx="1"/><rect x="2.5" y="9" width="4.5" height="4.5" rx="1"/><rect x="9" y="9" width="4.5" height="4.5" rx="1"/>',
  "list-view":
    '<line x1="3" y1="4" x2="13" y2="4"/><line x1="3" y1="8" x2="13" y2="8"/><line x1="3" y1="12" x2="13" y2="12"/>',
  minus: '<line x1="3" y1="8" x2="13" y2="8"/>',
  plus: '<line x1="8" y1="3" x2="8" y2="13"/><line x1="3" y1="8" x2="13" y2="8"/>',
  search:
    '<circle cx="7" cy="7" r="4.5"/><line x1="10.5" y1="10.5" x2="14" y2="14"/>',
};

export function Icon({
  className,
  name,
  size = 16,
}: {
  className?: string;
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="square"
      strokeLinejoin="miter"
      strokeWidth="1.25"
      viewBox="0 0 16 16"
      width={size}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static, first-party icon paths
      dangerouslySetInnerHTML={{ __html: paths[name] }}
    />
  );
}

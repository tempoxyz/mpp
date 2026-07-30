export function WipeBands({ bars = 2 }: { bars?: number }) {
  return ["first", "second", "third"].slice(0, bars).map((key, index) => (
    <span
      aria-hidden="true"
      className="wipe-band pointer-events-none absolute inset-x-0 origin-left scale-x-0 bg-white"
      key={key}
      style={{
        height: `${100 / bars}%`,
        top: `${(100 / bars) * index}%`,
      }}
    />
  ));
}

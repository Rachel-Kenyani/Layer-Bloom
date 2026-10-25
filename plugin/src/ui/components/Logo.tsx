const PETAL_ANGLES = [0, 72, 144, 216, 288];

export function Logo() {
  return (
    <svg class="logo" viewBox="0 0 128 128" aria-hidden="true">
      <rect width="128" height="128" rx="28" fill="#6B0F35" />
      <g fill="#E3A1C0">
        {PETAL_ANGLES.map((angle) => (
          <ellipse key={angle} cx="64" cy="40" rx="15" ry="22" transform={`rotate(${angle} 64 66)`} />
        ))}
      </g>
      <circle cx="64" cy="66" r="11" fill="#12936A" />
    </svg>
  );
}

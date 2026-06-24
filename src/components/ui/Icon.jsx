export default function Icon({ id, size = 20, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      aria-hidden="true"
      className={`pc-icon ${className}`}
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}
      {...props}
    >
      <use href={`/icons.svg#${id}`} />
    </svg>
  );
}

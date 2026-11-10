export default function VegMark({ veg }) {
  const c = veg ? "#4caf50" : "#d6453a";
  return (
    <span role="img" aria-label={veg ? "Vegetarian" : "Non-vegetarian"} title={veg ? "Vegetarian" : "Non-vegetarian"}
      className="inline-grid h-4 w-4 shrink-0 place-items-center rounded-[3px] border-[1.5px] bg-ivory" style={{ borderColor: c }}>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c }} />
    </span>
  );
}

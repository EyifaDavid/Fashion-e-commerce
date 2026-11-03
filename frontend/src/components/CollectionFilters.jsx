// [NORTH] Underlined filter tabs retain visible labels and wrap on small screens.
import { MdOutlineTune } from "react-icons/md";

export default function CollectionFilters({ options, value, onChange, counts, total, label = "Filter collection" }) {
  return (
    <div className="north-filter-bar">
      <span className="north-filter-label"><MdOutlineTune size={18} aria-hidden="true" />Filter by</span>
      <div className="north-filter-options" role="group" aria-label={label}>
        {options.map((option) => <button key={option} type="button" aria-pressed={value === option}
          onClick={() => onChange(option)}>
          <span>{option}</span>{counts && <span className="north-filter-count">{counts[option] || 0}</span>}
        </button>)}
      </div>
      {typeof total === "number" && <span className="north-filter-total" role="status">{total} {total === 1 ? "piece" : "pieces"}</span>}
    </div>
  );
}

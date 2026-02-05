import { useMemo } from "react";
import PropTypes from "prop-types";
import { BarChart3 } from "lucide-react";
import UsageGraph from "../Graphs/UsageGraph";

export default function GroupUsageWidget({
  data = [],
  title = "Energy usage per group",
  className = "",
  rightSlot = null,
}) {
  const hasData = useMemo(() => Array.isArray(data) && data.length > 0, [data]);
  
  return (
    <div 
      className={`p-4 h-full flex flex-col ${className}`.trim()} 
      aria-label={title}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-100 to-indigo-100 backdrop-blur-sm rounded-xl p-2 shadow-sm border border-blue-200/60">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
        </div>
        {/* Optional area for dropdowns / buttons */}
        {rightSlot && <div className="flex items-center gap-2">{rightSlot}</div>}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-h-0">
        {hasData ? (
          <UsageGraph data={data} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <BarChart3 className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">No usage data available</p>
          </div>
        )}
      </div>
    </div>
  );
}

GroupUsageWidget.propTypes = {
  data: PropTypes.array,
  title: PropTypes.string,
  className: PropTypes.string,
  rightSlot: PropTypes.node,
};
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { VehicleCard } from "../vehicle-card";
export function VehicleGrid({ results, total, selectedIds, onSelect, onOpen, onCompare }) {
    return (_jsxs("section", { className: "section-stack", children: [_jsxs("div", { className: "section-header", children: [_jsxs("h2", { className: "results-label", children: ["Resultados ", _jsxs("span", { className: "results-count", children: ["(", total, ")"] })] }), selectedIds.length >= 2 && (_jsxs("button", { className: "btn btn--primary", onClick: onCompare, children: ["Comparar ", selectedIds.length, " ve\u00EDculos"] }))] }), _jsx("div", { className: "grid", children: results.map(({ vehicle }) => (_jsx(VehicleCard, { vehicle: vehicle, selected: selectedIds.includes(vehicle.id), onSelect: onSelect, onOpen: onOpen }, vehicle.id))) })] }));
}

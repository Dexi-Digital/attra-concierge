import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { VehicleCard } from "../vehicle-card";
export function VehicleGrid({ vehicles }) {
    return (_jsxs("section", { className: "section-stack", children: [_jsx("h2", { children: "Resultados" }), _jsx("div", { className: "grid", children: vehicles.map((vehicle) => (_jsx(VehicleCard, { vehicle: vehicle }, vehicle.id))) })] }));
}

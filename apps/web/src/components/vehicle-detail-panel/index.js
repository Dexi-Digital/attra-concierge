import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function VehicleDetailPanel({ vehicle }) {
    return (_jsxs("section", { className: "panel section-stack", children: [_jsx("h2", { children: "Detalhes" }), _jsx("p", { children: vehicle.title }), _jsxs("p", { children: [vehicle.transmission, " \u2022 ", vehicle.fuelType, " \u2022 ", vehicle.bodyType] })] }));
}

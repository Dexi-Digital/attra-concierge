import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function VehicleCard({ vehicle }) {
    return (_jsxs("article", { className: "panel", children: [_jsx("p", { className: "eyebrow", children: vehicle.brand }), _jsx("h2", { children: vehicle.title }), _jsxs("p", { children: [vehicle.yearModel, " \u2022 ", vehicle.mileageKm.toLocaleString("pt-BR"), " km"] }), _jsxs("strong", { children: ["R$ ", vehicle.price.toLocaleString("pt-BR")] })] }));
}

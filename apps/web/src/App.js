import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ComparisonPanel } from "./components/comparison-panel";
import { EmptyState } from "./components/empty-state";
import { ErrorState } from "./components/error-state";
import { HandoffPanel } from "./components/handoff-panel";
import { LoadingState } from "./components/loading-state";
import { VehicleDetailPanel } from "./components/vehicle-detail-panel";
import { VehicleGrid } from "./components/vehicle-grid";
const mockVehicle = {
    id: "demo-1",
    brand: "Porsche",
    model: "911",
    version: "Carrera",
    title: "Porsche 911 Carrera",
    yearModel: 2024,
    price: 980000,
    mileageKm: 1200,
    fuelType: "Gasolina",
    transmission: "PDK",
    bodyType: "Coupé",
    armored: false,
    storeUnit: "São Paulo",
    available: true,
    vehicleUrl: "https://attra.example/vehicles/demo-1",
    imageUrls: [],
    usageProfile: "uso_diario",
    positioningProfile: "esportivo_premium"
};
export function App() {
    return (_jsxs("main", { className: "page-shell", children: [_jsx("header", { className: "page-header", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Attra Concierge" }), _jsx("h1", { children: "Base inicial da UI do MVP" })] }) }), _jsx(VehicleGrid, { vehicles: [mockVehicle] }), _jsx(VehicleDetailPanel, { vehicle: mockVehicle }), _jsx(ComparisonPanel, { vehicles: [mockVehicle] }), _jsx(HandoffPanel, {}), _jsx(LoadingState, {}), _jsx(EmptyState, { message: "Nenhum ve\u00EDculo encontrado para os filtros informados." }), _jsx(ErrorState, { message: "Falha ao consultar o estoque." })] }));
}

import { jsx as _jsx } from "react/jsx-runtime";
export function ErrorState({ message }) {
    return _jsx("section", { className: "panel error", children: message });
}

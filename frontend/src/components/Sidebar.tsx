import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "לוח שנה", end: true },
  { to: "/customers", label: "לקוחות", end: false },
  { to: "/suppliers", label: "ספקים", end: false },
  { to: "/wigs", label: "פאות", end: false },
  { to: "/products", label: "מוצרים", end: false },
  { to: "/services", label: "שירותים", end: false },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <h2 className="sidebar-title">ניהול</h2>
      <ul>
        {links.map((link) => (
          <li key={link.to}>
            <NavLink to={link.to} end={link.end} className={({ isActive }) => (isActive ? "active" : "")}>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

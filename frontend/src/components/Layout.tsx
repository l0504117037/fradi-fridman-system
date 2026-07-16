import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  const navigate = useNavigate();
  return (
    <>
      <header className="top-navbar">
        <div className="top-navbar-logo">לוגו</div>
        <button className="top-navbar-back" onClick={() => navigate(-1)}>
          &#8594; חזרה לדף הקודם
        </button>
      </header>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}

import { Outlet } from "react-router-dom";
import TopNavbar from "../components/navbar/TopNavbar.jsx";
export default function AppLayout() {
  return (
    <>
      <TopNavbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Outlet />
      </main>
    </>
  );
}

import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import MyTickets from "./pages/MyTickets";
import SearchTrip from "./pages/SearchTrip";
import SelectSeat from "./pages/SelectSeat";

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<SearchTrip />} />
          <Route path="/seat" element={<SelectSeat />} />
          <Route path="/tickets" element={<MyTickets />} />
          <Route path="*" element={<SearchTrip />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>SmartBus</span>
        <span>Di chuyển thông minh, hành trình an tâm.</span>
      </footer>
    </div>
  );
}

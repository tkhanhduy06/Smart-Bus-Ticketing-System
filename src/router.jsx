import { createBrowserRouter } from "react-router-dom";

import SearchTrip from "./pages/SearchTrip";
import SelectSeat from "./pages/SelectSeat";
import MyTickets from "./pages/MyTickets";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SearchTrip />
  },
  {
    path: "/seat",
    element: <SelectSeat />
  },
  {
    path: "/tickets",
    element: <MyTickets />
  }
]);

export default router;
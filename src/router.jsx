import { createBrowserRouter } from "react-router-dom";
import App from "./App";

// Export riêng để thuận tiện tích hợp data router khi kết nối API thật.
export const router = createBrowserRouter([{ path: "*", element: <App /> }]);

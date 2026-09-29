import React, { useState } from "react";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import { CountdownTimer } from "./components/CountdownTimer";
import { ModalExpired } from "./components/ModalExpired";

function App() {
  const [isExpired, setIsExpired] = useState(false);

  return (
    <>
      {/* Thanh đếm ngược 10 phút (600s) hiển thị cố định phía trên */}
      <CountdownTimer 
        initialSeconds={600} 
        onTimeout={() => setIsExpired(true)} 
      />

      {/* Popup thông báo khi hết thời gian */}
      <ModalExpired 
        isOpen={isExpired} 
        onReload={() => window.location.reload()} 
      />

      {/* Luồng định tuyến trang web chính */}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
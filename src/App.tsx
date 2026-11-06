import { BrowserRouter, Routes, Route } from "react-router";

import Homepage from "./router/homepage";
import Request from "./router/request";
import Admin from "./router/admin";
import ScrollToHash from "./components/scrolltohash";

function App() {
  return (
    <BrowserRouter>
      <ScrollToHash />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/request" element={<Request />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
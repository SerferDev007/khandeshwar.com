import { Route, Routes } from "react-router-dom";

import Dashboard from "./frontend/components/Dashboard.tsx";
import Donation from "./frontend/components/Dashboard.tsx";

const PageRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/donation" element={<Donation />} />
      </Route>
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
};

export default PageRoutes;

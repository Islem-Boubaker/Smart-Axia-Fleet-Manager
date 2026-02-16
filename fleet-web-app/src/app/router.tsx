import { BrowserRouter, Routes, Route } from "react-router-dom";
import Signin from "../features/auth/pages/Signin";

// import all pages here

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<Signin />} />
        {/* all your routes here */}
      </Routes>
    </BrowserRouter>
  );
};

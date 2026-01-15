import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./App.scss";
import SplashScreen from "./pages/SplashScreen";
import Beginnings from "./pages/Beginnings";
import TestArea from "./pages/TestArea";

const routes = [
  {
    path: "/",
    element: <SplashScreen />,
  },
  {
    path: "/beginnings",
    element: <Beginnings />,
  },
  {
    path: "/test-area",
    element: <TestArea />,
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

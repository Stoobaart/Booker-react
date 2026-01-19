import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import "./App.scss";
import SplashScreen from "./pages/SplashScreen";
import Beginnings from "./pages/Beginnings";
import TestArea from "./pages/TestArea";
import Inventory from "./components/Inventory";
import InventoryButton from "./components/InventoryButton";
import { PlayerProvider } from "./context/PlayerContext";

function Layout() {
  const location = useLocation();
  const showInventory = location.pathname !== '/';

  return (
    <PlayerProvider>
      <Outlet />
      {showInventory && <InventoryButton />}
      <Inventory />
    </PlayerProvider>
  );
}

const routes = [
  {
    element: <Layout />,
    children: [
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
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import "./App.scss";
import SplashScreen from "./features/scenes/splash/SplashScreen";
import Beginnings from "./features/scenes/beginnings/Beginnings";
import TestArea from "./features/scenes/testArea/TestArea";
import GreatPortlandStreetUnderground from "./features/scenes/greatPortlandStreetUnderground/GreatPortlandStreetUnderground";
import GreatPortlandStreetExterior from "./features/scenes/greatPortlandStreetExterior/GreatPortlandStreetExterior";
import Inventory from "./features/inventory/Inventory";
import InventoryButton from "./features/inventory/InventoryButton";
import { PlayerProvider } from "./features/player/PlayerContext";

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
      {
        path: "/great-portland-street",
        element: <GreatPortlandStreetUnderground />,
      },
      {
        path: "/great-portland-street-exterior",
        element: <GreatPortlandStreetExterior />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

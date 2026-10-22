import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import "./App.scss";
import SplashScreen from "./features/scenes/splash/pages/SplashScreen";
import Beginnings from "./features/scenes/beginnings/pages/Beginnings";
import TestArea from "./features/scenes/testArea/pages/TestArea";
import GreatPortlandStreetUnderground from "./features/scenes/greatPortlandStreetUnderground/pages/GreatPortlandStreetUnderground";
import GreatPortlandStreetTicketHall from "./features/scenes/greatPortlandStreetTicketHall/pages/GreatPortlandStreetTicketHall";
import GreatPortlandStreetExterior from "./features/scenes/greatPortlandStreetExterior/pages/GreatPortlandStreetExterior";
import VictimsFlatHallway from "./features/scenes/victimsFlatHallway/pages/VictimsFlatHallway";
import ResidentialStreet from "./features/scenes/residentialStreet/pages/ResidentialStreet";
import Inventory from "./features/inventory/components/Inventory";
import InventoryButton from "./features/inventory/components/InventoryButton";
import { PlayerProvider } from "./features/player/context/PlayerContext";

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
        path: "/great-portland-street-ticket-hall",
        element: <GreatPortlandStreetTicketHall />,
      },
      {
        path: "/great-portland-street-exterior",
        element: <GreatPortlandStreetExterior />,
      },
      {
        path: "/residential-street",
        element: <ResidentialStreet />,
      },
      {
        path: "/victims-flat-hallway",
        element: <VictimsFlatHallway />,
      },
    ],
  },
];

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

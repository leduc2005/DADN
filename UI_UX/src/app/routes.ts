import { createBrowserRouter } from "react-router";
import { HomeScreen } from "./screens/HomeScreen";
import { InputScreen } from "./screens/InputScreen";
import { MotorSelectionScreen } from "./screens/MotorSelectionScreen";
import { RatioDistributionScreen } from "./screens/RatioDistributionScreen";
import { KinematicResultsScreen } from "./screens/KinematicResultsScreen";

/**
 * MAIN FLOW (theo bản mô tả mới):
 * Home → Input → Motor Selection → Kinematic Results
 *
 * Backend tự động phân phối tỷ số truyền (u_hop, u_ngoai)
 * RatioDistribution screen vẫn tồn tại nhưng KHÔNG nằm trong flow chính
 */
export const router = createBrowserRouter([
  {
    path: "/",
    Component: HomeScreen,
  },
  {
    path: "/input",
    Component: InputScreen,
  },
  {
    path: "/motor-selection",
    Component: MotorSelectionScreen,
  },
  // RatioDistribution - Không nằm trong flow chính (Backend auto phân phối)
  {
    path: "/ratio-distribution",
    Component: RatioDistributionScreen,
  },
  {
    path: "/kinematic-results",
    Component: KinematicResultsScreen,
  },
]);

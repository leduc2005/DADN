import { useState } from "react";
import { HomeScreen } from "./screens/HomeScreen";
import { InputScreen } from "./screens/InputScreen";
import { MotorSelectionScreen } from "./screens/MotorSelectionScreen";
import { KinematicResultsScreen } from "./screens/KinematicResultsScreen";

type Screen = "home" | "input" | "motor-selection" | "kinematic-results";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [navigationState, setNavigationState] = useState<any>({});

  const navigate = (screen: Screen, state?: any) => {
    setCurrentScreen(screen);
    if (state) {
      setNavigationState(state);
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return <HomeScreen navigate={navigate} />;
      case "input":
        return <InputScreen navigate={navigate} />;
      case "motor-selection":
        return <MotorSelectionScreen navigate={navigate} state={navigationState} />;
      case "kinematic-results":
        return <KinematicResultsScreen navigate={navigate} state={navigationState} />;
      default:
        return <HomeScreen navigate={navigate} />;
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-gray-900">
      {/* Mobile Phone Frame */}
      <div className="w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-gray-800 relative">
        {/* Phone Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-3xl z-10" />

        {/* App Content */}
        <div className="h-full w-full">
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}
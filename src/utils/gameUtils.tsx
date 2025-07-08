import { useContext, useMemo } from "react";

import { GameStateContext } from "../GameStateContext";
import { useAuth } from "../auth/AuthContext";


export const useGetFranchiseCount: () => number = () => {
  const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();
  
  return useMemo(() => {
    return gameState.locations.filter(location =>
      user && location.userId === user.id
      && location.locationType === "franchise"
    ).length;
  }, [gameState.locations, user?.id]);
}

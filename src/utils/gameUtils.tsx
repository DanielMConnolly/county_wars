import { useContext, useMemo } from "react";

import { GameStateContext } from "../GameStateContext";
import { useAuth } from "../auth/AuthContext";
import { Franchise } from "../types/GameTypes";


export const useGetFranchiseCount: () => number = () => {
  const franchises = useGetUserFranchises();
  return franchises.length;
}


export const useGetUserFranchises: () =>  Array<Franchise>  = () => {
    const { gameState } = useContext(GameStateContext);
  const { user } = useAuth();

  return useMemo(() => {
    return gameState.locations.filter(location =>
      user && location.userId === user.id
      && location.locationType === "franchise"
    ) as Array<Franchise>;
  }, [gameState.locations, user?.id]);
}

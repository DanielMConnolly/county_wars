import { useGameState } from "../GameStateContext";
import {GameTime } from "../types/GameTypes";


export const useGetMonthAndYear: () => {
    year: number,
    month: number,
} = () => {
    const { gameState } = useGameState();
    const { gameTime } = gameState;
    return getMonthAndYear(gameTime);
}

export const getMonthAndYear = (gameTimeState: GameTime): {
    year: number,
    month: number,
} => {
    const totalGameMs = gameTimeState.gameDurationHours * 60 * 60 * 1000;
    const elapsedTime = gameTimeState.elapsedTime ?? 0;
    const progress = Math.min(elapsedTime / totalGameMs, 1);
    const totalMonths = 80 * 12;
    const currentMonthIndex = Math.floor(progress * totalMonths);
    const year = 1945 + Math.floor(currentMonthIndex / 12);
    const month = (currentMonthIndex % 12) + 1;
    return {
        year: year,
        month: month,
    }
}

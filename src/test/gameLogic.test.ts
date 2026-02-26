import { describe, it, expect } from 'vitest';
import { calculateTeamPower } from '../engine/gameLogic';
import { Team, Player } from '../types';

describe('gameLogic', () => {
    it('calculateTeamPower should return correct sum of player ratings', () => {
        const mockTeam = {
            id: 'team_1',
            name: 'Test Team',
            squad: ['p_1', 'p_2']
        } as Team;

        const mockPlayers: Record<string, Player> = {
            'p_1': { id: 'p_1', totalRating: 85 } as Player,
            'p_2': { id: 'p_2', totalRating: 75 } as Player,
            'p_3': { id: 'p_3', totalRating: 90 } as Player,
        };

        const power = calculateTeamPower(mockTeam, mockPlayers);
        expect(power).toBe(160); // 85 + 75
    });

    it('calculateTeamPower should handle missing players safely', () => {
        const mockTeam = {
            id: 'team_1',
            squad: ['p_1', 'p_invalid']
        } as Team;

        const mockPlayers: Record<string, Player> = {
            'p_1': { id: 'p_1', totalRating: 85 } as Player,
        };

        const power = calculateTeamPower(mockTeam, mockPlayers);
        expect(power).toBe(85);
    });
});

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dashboardPath = path.join(__dirname, '../src/components/Dashboard.tsx');
let content = fs.readFileSync(dashboardPath, 'utf-8');

const tabs = [
    { name: 'HomeTab', startMark: 'const renderHome = () => {' },
    { name: 'SquadTab', startMark: 'const renderSquad = () => {' },
    { name: 'LineupTab', startMark: 'const renderLineup = () => {' },
    { name: 'TacticsTab', startMark: 'const renderTactics = () => {' },
    { name: 'TrainingTab', startMark: 'const renderTraining = () => {' },
    { name: 'LockerRoomTab', startMark: 'const renderLockerRoom = () => {' },
    { name: 'CompetitionTab', startMark: 'const renderCompetition = () => {' },
    { name: 'WorldTab', startMark: 'const renderWorld = () => {' },
    { name: 'DatabaseTab', startMark: 'const renderDatabase = () => {' },
    { name: 'CareerTab', startMark: 'const renderCareer = () => {' },
];

function extractBlock(startMark) {
    const startIndex = content.indexOf(startMark);
    if (startIndex === -1) return null;

    let openBraces = 0;
    let i = startIndex + startMark.length - 1; // points to the '{'

    if (content[i] !== '{') {
        return null;
    }

    for (; i < content.length; i++) {
        if (content[i] === '{') openBraces++;
        if (content[i] === '}') openBraces--;

        if (openBraces === 0) {
            const block = content.substring(startIndex, i + 1);
            return { block, startIndex, endIndex: i + 1 };
        }
    }
    return null;
}

const imports = `import React, { useState } from 'react';
import { useGame } from '../../store/GameContext';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useMatchSimulation } from '../../hooks/useMatchSimulation';
import { useTransfers } from '../../hooks/useTransfers';
import { useTactics } from '../../hooks/useTactics';
import { useGameDay } from '../../hooks/useGameDay';
import { useTraining } from '../../hooks/useTraining';
import { PlayerCard } from '../PlayerCard';
import { PlayerModal } from '../PlayerModal';
import { TeamLogo } from '../TeamLogo';
import { LineupBuilder } from '../LineupBuilder';
import { LiveReport, PostGameReport } from '../MatchReports';
import { getMatchStatus } from '../../utils/matchUtils';
import * as LucideIcons from 'lucide-react';
const { Home, Trophy, ShoppingCart, Database, User, Clock, Newspaper, Wallet, TrendingUp, AlertCircle, Award, Calendar, Users, Activity, Sliders, Flame, Target, Zap, FastForward, Globe, MessageSquare, AlertTriangle, TrendingDown, Briefcase, Star, Search, Crown, ChevronRight, Lock, ChevronDown, Eye, Shield, Brain, X, Save } = LucideIcons;
`;

tabs.forEach(tab => {
    const extracted = extractBlock(tab.startMark);
    if (extracted) {
        let fnBody = extracted.block;
        fnBody = fnBody.replace(tab.startMark, `export const ${tab.name} = (props: any) => {\n  const { state, setState } = useGame();\n  const dashData = useDashboardData();\n  const { userTeam, upcomingMatches } = dashData;\n  const { handleMockVod, setSelectedMatchReport } = useMatchSimulation(userTeam?.id || null);\n  const { handleUpdateTactics } = useTactics(userTeam?.id || null);\n  const { handleSetFocus, handleStartCardLab, handleChemistryBoost } = useTraining(userTeam?.id || null);\n  const { handleAdvanceDay } = useGameDay();\n  const { handleMakeProposal } = useTransfers(userTeam?.id || null, dashData.totalPoints, dashData.powerCap);\n`);

        const fileContent = `${imports}\n\n${fnBody}\n`;
        const outPath = path.join(__dirname, `../src/components/dashboard/${tab.name}.tsx`);
        fs.writeFileSync(outPath, fileContent);
        console.log(`Extracted ${tab.name}`);
    } else {
        console.log(`Could not find ${tab.startMark}`);
    }
});

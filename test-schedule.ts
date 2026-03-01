function getRoundFromDay(dayNumber: number) {
    if (dayNumber < 2) return 0;

    if (dayNumber <= 28) {
        if (dayNumber % 2 === 0) {
            return Math.floor(dayNumber / 2);
        } else {
            return 0; // Rest days between league matches
        }
    }

    // Elite Cup (Oitavas, Quartas, Semis, Final - with 1 rest day in between)
    // Day 29, 31, 33, 35
    if (dayNumber >= 29 && dayNumber <= 35) {
        if ((dayNumber - 29) % 2 === 0) {
            return 14 + Math.floor((dayNumber - 29) / 2) + 1;
        } else {
            return 0; // Rest day during Elite Cup
        }
    }

    // District Cup (Rodada 1, 2, 3, Final - consecutive)
    // Day 36, 37, 38, 39
    if (dayNumber >= 36 && dayNumber <= 39) {
        return 18 + (dayNumber - 35);
    }

    return 0; // No round / Férias
}

function isSeasonMatchDay(dayNumber: number) {
    if (dayNumber < 2) return false;
    if (dayNumber <= 28) return dayNumber % 2 === 0;
    if (dayNumber >= 29 && dayNumber <= 35) return (dayNumber - 29) % 2 === 0;
    if (dayNumber >= 36 && dayNumber <= 39) return true;
    return false;
}

for (let day = 1; day <= 45; day++) {
    const isMatch = isSeasonMatchDay(day);
    const round = getRoundFromDay(day);

    let label = "Rest/Férias";
    if (round >= 1 && round <= 14) label = "LIGA - Rodada " + round;
    if (round >= 15 && round <= 18) label = "COPA ELITE - Rodada " + (round - 14);
    if (round >= 19 && round <= 22) label = "COPA DOS DISTRITOS - Rodada " + (round - 18);

    console.log(`Dia ${day.toString().padStart(2, '0')}: ${isMatch ? '[MATCH DIA]' : '[ REST DIA]'} -> ${isMatch ? label : 'Treino/Mercado'}`);
}

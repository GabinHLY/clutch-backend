// utils/odds.js

/**
 * Calcule les côtes décimales d’un match en fonction des ratings ELO.
 * @param {number} r1 Rating équipe 1
 * @param {number} r2 Rating équipe 2
 * @param {number} margin Overround (marge) – ex : 0.05 pour 5%
 * @returns {{ oddsTeam1: number, oddsTeam2: number }}
 */
export function calculateOdds(r1, r2, margin = 0.05) {
    // Probabilités basées sur ELO
    const p1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const p2 = 1 - p1;
    // Application de la marge
    const factor = 1 + margin;
    const odds1 = (1 / p1) * factor;
    const odds2 = (1 / p2) * factor;
    return {
      oddsTeam1: parseFloat(odds1.toFixed(2)),
      oddsTeam2: parseFloat(odds2.toFixed(2)),
    };
  }
  
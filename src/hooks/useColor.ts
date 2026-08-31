/**
 * Hook pour calculer la couleur de texte optimale sur un fond donné
 * Respecte les normes WCAG AA (contraste minimum 4.5:1)
 */

import { calculateContrastRatio } from "../utils/validation";
import { useMemo } from "react";

interface ColorContrastResult {
  textOnColor: string;
  borderColor: string;
}

/**
 * Détermine la meilleure couleur de texte (blanc ou noir) pour un fond donné
 * et une couleur de bordure adaptée
 */
export function useColor(backgroundColor: string): ColorContrastResult {
  return useMemo(() => {
    const contrastWithWhite = calculateContrastRatio(backgroundColor, "#ffffff");
    const contrastWithBlack = calculateContrastRatio(backgroundColor, "#000000");

    // Choisir la couleur avec le meilleur contraste
    const useWhiteText = contrastWithWhite >= contrastWithBlack;
    
    // Si le contraste est insuffisant des deux côtés, utiliser une bordure
    const minContrast = 4.5;
    const needsBorder = contrastWithWhite < minContrast && contrastWithBlack < minContrast;

    return {
      textOnColor: useWhiteText ? "#ffffff" : "#000000",
      borderColor: needsBorder ? (useWhiteText ? "#cccccc" : "#333333") : "transparent",
    };
  }, [backgroundColor]);
}

/**
 * Obtient la couleur de texte optimale sans hook (pour usage hors composant)
 */
export function getTextColorForBackground(backgroundColor: string): string {
  const contrastWithWhite = calculateContrastRatio(backgroundColor, "#ffffff");
  const contrastWithBlack = calculateContrastRatio(backgroundColor, "#000000");
  
  return contrastWithWhite >= contrastWithBlack ? "#ffffff" : "#000000";
}

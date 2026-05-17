export interface PostProcessingEffects {
  colorGrade?: string;
  vignette?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  grain?: number;
  chromaticAberration?: number;
  temperature?: number;
}

export const COLOR_GRADES = [
  { name: 'Original', filter: '' },
  { name: 'Cinematic Teal & Orange', filter: 'saturate(1.2) hue-rotate(-10deg) contrast(1.1)' },
  { name: 'Moody Noir', filter: 'brightness(0.7) contrast(1.3) saturate(0)' },
  { name: 'Warm Sunset', filter: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg) brightness(1.05)' },
  { name: 'Vintage', filter: 'sepia(0.5) saturate(0.7) contrast(0.8) brightness(1.1)' },
  { name: 'Cyberpunk', filter: 'hue-rotate(200deg) saturate(2.5) brightness(1.1) contrast(1.1)' },
  { name: 'Cold Tech', filter: 'hue-rotate(180deg) saturate(0.8) contrast(1.1) brightness(0.95)' },
  { name: 'Acid', filter: 'hue-rotate(90deg) saturate(3) contrast(1.5)' }
];

export const TRANSITIONS = [
  { id: 'Cut', label: 'Cut', icon: 'Direct' },
  { id: 'Fade', label: 'Fade', icon: 'Crossfade' },
  { id: 'Slide', label: 'Slide', icon: 'Push' },
  { id: 'Cross-Zoom', label: 'Cross-Zoom', icon: 'Zoom' },
  { id: 'Dissolve', label: 'Dissolve', icon: 'Mix' },
  { id: 'Glitch', label: 'Glitch', icon: 'Digital' },
  { id: 'Blur', label: 'Blur', icon: 'Optic' }
];

export function getFilterString(effects?: PostProcessingEffects): string {
  if (!effects) return '';

  let filters = '';
  const brightness = effects.brightness ?? 100;
  const contrast = effects.contrast ?? 100;
  const saturation = effects.saturation ?? 100;

  filters += `brightness(${brightness}%) `;
  filters += `contrast(${contrast}%) `;
  filters += `saturate(${saturation}%) `;

  if (effects.temperature) {
    const temp = effects.temperature; // 0 to 100, 50 is neutral
    if (temp > 50) {
      // Warm
      const factor = (temp - 50) / 50;
      filters += `sepia(${factor * 0.4}) saturate(${1 + factor * 0.2}) hue-rotate(-${factor * 10}deg) `;
    } else if (temp < 50) {
      // Cold
      const factor = (50 - temp) / 50;
      filters += `hue-rotate(${factor * 20}deg) saturate(${1 - factor * 0.3}) brightness(${1 + factor * 0.05}) `;
    }
  }

  if (effects.chromaticAberration && effects.chromaticAberration > 0) {
    const shift = effects.chromaticAberration * 2;
    filters += `drop-shadow(${shift}px 0px 0px rgba(255,0,0,0.3)) drop-shadow(-${shift}px 0px 0px rgba(0,255,255,0.3)) `;
  }

  const grade = COLOR_GRADES.find(g => g.name === effects.colorGrade);
  if (grade && grade.filter) {
    filters += `${grade.filter} `;
  }

  return filters.trim();
}

export function getVignetteStyle(vignette?: number) {
  if (!vignette || vignette <= 0) return {};
  
  return {
    background: `radial-gradient(circle, transparent ${Math.max(0, 120 - vignette * 100)}%, rgba(0,0,0,${vignette * 0.85}) 100%)`
  };
}

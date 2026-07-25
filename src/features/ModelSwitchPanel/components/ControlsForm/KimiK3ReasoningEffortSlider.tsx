import type { CreatedLevelSliderProps } from './createLevelSlider';
import { createLevelSliderComponent } from './createLevelSlider';

const KIMI_K3_REASONING_EFFORT_LEVELS = ['low', 'high', 'max'] as const;
type KimiK3ReasoningEffort = (typeof KIMI_K3_REASONING_EFFORT_LEVELS)[number];

export type KimiK3ReasoningEffortSliderProps = CreatedLevelSliderProps<KimiK3ReasoningEffort>;

const KimiK3ReasoningEffortSlider = createLevelSliderComponent<KimiK3ReasoningEffort>({
  configKey: 'kimiK3ReasoningEffort',
  defaultValue: 'high',
  levels: KIMI_K3_REASONING_EFFORT_LEVELS,
  style: { minWidth: 200 },
});

export default KimiK3ReasoningEffortSlider;

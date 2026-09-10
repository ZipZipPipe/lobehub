import { SliderWithInput } from '@lobehub/ui/base-ui';

import { useGenerationConfigParam } from '@/store/image/slices/generationConfig/hooks';

const OutputCompressionSlider = () => {
  const { value, setValue, max, min, step } = useGenerationConfigParam('outputCompression');

  return <SliderWithInput max={max} min={min} step={step} value={value} onChange={setValue} />;
};

export default OutputCompressionSlider;

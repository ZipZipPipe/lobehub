/**
 * OpenAI Images API output controls shared by the OpenAI-compatible and Azure OpenAI runtimes.
 *
 * Standard image params are camelCase, while the Images API expects snake_case fields.
 * GIF output supports generation and editing; SVG output is generation-only.
 * @see https://developers.openai.com/api/docs/guides/image-generation
 */

const OUTPUT_PARAM_FIELDS = {
  outputCompression: 'output_compression',
  frameCount: 'frame_count',
  frameDurationMs: 'frame_duration_ms',
  outputFormat: 'output_format',
  partialImages: 'partial_images',
  safetyIdentifier: 'safety_identifier',
} as const;

const GIF_ONLY_FIELDS = ['frame_count', 'frame_duration_ms'] as const;

const OUTPUT_FORMAT_MIME_TYPES: Record<string, string> = {
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export const SVG_EDIT_UNSUPPORTED_MESSAGE =
  'SVG output does not support reference images. Remove the reference images or choose another output format.';

/**
 * Rename output controls to Images API fields in place and drop frame fields unless the
 * request asks for a GIF. Remove stale conditional controls when switching formats.
 */
export const applyImageOutputParams = (
  userInput: Record<string, any>,
  { isImageEdit }: { isImageEdit: boolean },
): void => {
  for (const [paramName, field] of Object.entries(OUTPUT_PARAM_FIELDS)) {
    if (!(paramName in userInput)) continue;
    userInput[field] = userInput[paramName];
    delete userInput[paramName];
  }

  const format = userInput.output_format;
  if (format === 'svg' && isImageEdit) throw new Error(SVG_EDIT_UNSUPPORTED_MESSAGE);
  if (userInput.maskUrl && userInput.markupUrl) {
    throw new Error('Use either a mask or a markup overlay, not both.');
  }
  if (!isImageEdit) {
    delete userInput.maskUrl;
    delete userInput.markupUrl;
  }
  if (format === 'gif' && userInput.maskUrl) throw new Error('GIF output does not support masks.');

  if (format !== 'gif') for (const field of GIF_ONLY_FIELDS) delete userInput[field];
  if (format !== 'jpeg' && format !== 'webp') delete userInput.output_compression;
  if (format === 'gif' || format === 'svg') {
    delete userInput.stream;
    delete userInput.partial_images;
  } else if (!userInput.stream) {
    delete userInput.partial_images;
  }
  if (format === 'svg') {
    userInput.n = 1;
    const model = userInput.svgModel?.trim();
    if (model) {
      const effort = userInput.svgReasoningEffort;
      userInput.svg = {
        model,
        ...(effort && effort !== 'auto' ? { reasoning: { effort } } : {}),
      };
    }
  } else {
    delete userInput.svg;
  }
  delete userInput.svgModel;
  delete userInput.svgReasoningEffort;
  if (!userInput.safety_identifier) delete userInput.safety_identifier;
  if (userInput.safety_identifier?.length > 128) {
    throw new Error('Safety identifier must be at most 128 characters.');
  }
};

/** Collect the completed image from the Images API SSE stream, never a partial preview. */
export const collectImageResponse = async (response: any): Promise<any> => {
  if (!response || typeof response[Symbol.asyncIterator] !== 'function') return response;
  let result;
  for await (const event of response) {
    if (event.type === 'error' || event.error) {
      throw new Error(event.error?.message ?? event.message ?? 'Image streaming failed');
    }
    if (event.type === 'image_generation.completed' || event.type === 'image_edit.completed') {
      result = { ...event, data: [{ b64_json: event.b64_json }] };
    }
  }
  if (!result?.data[0]?.b64_json) throw new Error('Image stream ended without a completed image');
  return result;
};

/**
 * MIME type for a base64 image result. The response reports the format it produced; fall back to
 * the requested format, then to PNG, the Images API default.
 */
export const resolveImageOutputMimeType = (
  responseFormat?: string | null,
  requestedFormat?: string | null,
): string =>
  OUTPUT_FORMAT_MIME_TYPES[responseFormat ?? ''] ??
  OUTPUT_FORMAT_MIME_TYPES[requestedFormat ?? ''] ??
  'image/png';

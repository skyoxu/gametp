/**
 * /atlas
 */

export interface AtlasDef {
  key: string;
  image: string; // .png/.webp
  data: string; // .json (hash/array)
}

export interface TextureDef {
  key: string;
  url: string;
}

export interface TexturePipelineConfig {
  atlases?: AtlasDef[];
  textures?: TextureDef[];
}

/**
 * Phaser.Scene preload
 *   setupTexturePipeline(this.load, config)
 */
export function setupTexturePipeline(loader: any, cfg: TexturePipelineConfig) {
  if (!loader || !cfg) return;
  if (cfg.atlases) {
    for (const a of cfg.atlases) {
      // loader.atlas(key, textureURL, atlasDataURL)
      loader.atlas?.(a.key, a.image, a.data);
    }
  }
  if (cfg.textures) {
    for (const t of cfg.textures) {
      loader.image?.(t.key, t.url);
    }
  }
}

/**
 * Note
 */
export const DEFAULT_TEXTURES: TexturePipelineConfig = {
  atlases: [
    // { key: 'ui', image: '/assets/ui/ui.webp', data: '/assets/ui/ui.json' },
  ],
  textures: [
    // { key: 'placeholder', url: '/assets/images/placeholder.webp' },
  ],
};

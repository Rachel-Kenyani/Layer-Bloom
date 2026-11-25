import type { NamingStyle, ScanResult } from '../../shared/messages.ts';
import { NAMING_STYLES } from '../ai/prompt.ts';
import { Banner } from '../components/Banner.tsx';
import { Button } from '../components/Button.tsx';
import { Checkbox } from '../components/Checkbox.tsx';
import { LayerTree } from '../components/LayerTree.tsx';
import { Select } from '../components/Select.tsx';
import { isGenericName } from '../layerNames.ts';
import { plural } from '../text.ts';

const STYLE_OPTIONS = (Object.keys(NAMING_STYLES) as NamingStyle[]).map((value) => ({
  value,
  label: `${NAMING_STYLES[value].label} — ${NAMING_STYLES[value].example}`,
}));

type ScannedProps = {
  scan: ScanResult;
  error: string | null;
  providerName: string;
  selectionChanged: boolean;
  namingStyle: NamingStyle;
  onNamingStyleChange: (style: NamingStyle) => void;
  includeScreenshots: boolean;
  onIncludeScreenshotsChange: (include: boolean) => void;
  onSuggest: () => void;
  onRescan: () => void;
  onFocusLayer: (id: string) => void;
};

export function Scanned(props: Readonly<ScannedProps>) {
  const {
    scan,
    error,
    providerName,
    selectionChanged,
    namingStyle,
    onNamingStyleChange,
    includeScreenshots,
    onIncludeScreenshotsChange,
    onSuggest,
    onRescan,
    onFocusLayer,
  } = props;
  const genericCount = scan.layers.filter((layer) => isGenericName(layer.name)).length;

  return (
    <div class="stack">
      <div class="stats">
        <div class="stat">
          <b>{scan.layers.length}</b>layers scanned
        </div>
        <div class="stat">
          <b>{genericCount}</b>generic names
        </div>
      </div>
      {scan.limitReached && (
        <Banner tone="warning">
          Large selection: only the first {scan.layers.length} layers were scanned. Select a smaller area for the rest.
        </Banner>
      )}
      {scan.skippedCount > 0 && (
        <Banner tone="info">{plural(scan.skippedCount, 'locked or hidden layer')} skipped. They won't be renamed.</Banner>
      )}
      {error && <Banner tone="error">{error}</Banner>}
      <Select label="Naming style" value={namingStyle} options={STYLE_OPTIONS} onChange={onNamingStyleChange} />
      <Checkbox
        checked={includeScreenshots}
        onChange={onIncludeScreenshotsChange}
        label={
          <>
            Also send screenshots <span class="muted">(slower, costs more)</span>
          </>
        }
      />
      <Banner tone="info">
        Clicking Suggest names with AI sends selected layer IDs, names, types, hierarchy, sizes and layout details, plus up to 120
        characters of each text layer, directly to {providerName}. If enabled, up to three selected-node screenshots (longest edge capped at
        512 pixels) are sent too. Large scans may make several provider requests. Provider fees and data-retention terms may apply. Layer
        Bloom has no server and does not receive this data.{' '}
        <a
          class="privacy-link"
          href="https://github.com/Rachel-Kenyani/Layer-Bloom/blob/main/plugin/privacy-policy.md"
          target="_blank"
          rel="noreferrer"
        >
          Privacy policy
        </a>
      </Banner>
      <div>
        <Button onClick={onSuggest} disabled={selectionChanged}>
          Suggest names with AI
        </Button>
        <Button variant="secondary" onClick={onRescan}>
          Scan again
        </Button>
      </div>
      <LayerTree layers={scan.layers} onFocusLayer={onFocusLayer} />
    </div>
  );
}

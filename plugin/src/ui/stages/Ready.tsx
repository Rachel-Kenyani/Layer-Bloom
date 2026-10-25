import { Banner } from '../components/Banner.tsx';
import { Button } from '../components/Button.tsx';
import { plural } from '../text.ts';

type ReadyProps = { selectionCount: number; emptyScanMessage: string | null; onScan: () => void };

export function Ready({ selectionCount, emptyScanMessage, onScan }: Readonly<ReadyProps>) {
  return (
    <div class="stack">
      {selectionCount === 0 ? (
        <Banner tone="info">Select one or more frames or groups in Figma to begin.</Banner>
      ) : (
        <p>{plural(selectionCount, 'layer')} selected. Everything inside will be scanned.</p>
      )}
      {emptyScanMessage && <Banner tone="warning">{emptyScanMessage}</Banner>}
      <Button onClick={onScan} disabled={selectionCount === 0}>
        Scan selected layers
      </Button>
    </div>
  );
}

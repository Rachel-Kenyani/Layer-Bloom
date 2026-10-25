import { Banner } from '../components/Banner.tsx';
import { Button } from '../components/Button.tsx';
import { plural } from '../text.ts';

type DoneProps = { renamedCount: number; missedCount: number; onRenameMore: () => void };

export function Done({ renamedCount, missedCount, onRenameMore }: Readonly<DoneProps>) {
  return (
    <div class="stack">
      <Banner tone="success">Renamed {plural(renamedCount, 'layer')}. Press Cmd+Z (Ctrl+Z on Windows) in Figma to undo them all.</Banner>
      {missedCount > 0 && (
        <Banner tone="warning">
          {plural(missedCount, 'layer')} {missedCount === 1 ? 'was' : 'were'} deleted or locked since the scan and left as{' '}
          {missedCount === 1 ? 'it was' : 'they were'}.
        </Banner>
      )}
      <Button onClick={onRenameMore}>Rename more layers</Button>
    </div>
  );
}

type NothingToRenameProps = { onStartOver: () => void };

export function NothingToRename({ onStartOver }: Readonly<NothingToRenameProps>) {
  return (
    <div class="stack">
      <Banner tone="warning">These layers already look well named. Nothing to change.</Banner>
      <Button variant="secondary" onClick={onStartOver}>
        Start over
      </Button>
    </div>
  );
}

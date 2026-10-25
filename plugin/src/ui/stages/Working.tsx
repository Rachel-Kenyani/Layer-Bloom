import { Button } from '../components/Button.tsx';
import { Spinner } from '../components/Spinner.tsx';

type WorkingProps = { message: string; previews: string[]; onCancel: () => void };

export function Working({ message, previews, onCancel }: Readonly<WorkingProps>) {
  return (
    <div class="stack center">
      <Spinner />
      <p>{message}</p>
      {previews.length > 0 && (
        <div class="previews">
          <p class="muted">Screenshots sent:</p>
          {previews.map((data) => (
            <img key={data.slice(-16)} src={`data:image/png;base64,${data}`} alt="Screenshot sent to the AI" />
          ))}
        </div>
      )}
      <Button variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

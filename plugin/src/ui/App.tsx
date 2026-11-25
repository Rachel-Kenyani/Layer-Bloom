import { useEffect, useReducer } from 'preact/hooks';
import type { NamingStyle, Theme } from '../shared/messages.ts';
import { onMessage, send } from './bridge.ts';
import { Banner } from './components/Banner.tsx';
import { LinkButton } from './components/Button.tsx';
import { KeyStatus } from './components/KeyStatus.tsx';
import { Logo } from './components/Logo.tsx';
import { ResizeHandle } from './components/ResizeHandle.tsx';
import { Spinner } from './components/Spinner.tsx';
import { ThemeToggle } from './components/ThemeToggle.tsx';
import { Done, NothingToRename } from './stages/Finished.tsx';
import { Ready } from './stages/Ready.tsx';
import { approvedItems, Review } from './stages/Review.tsx';
import { Scanned } from './stages/Scanned.tsx';
import { Setup } from './stages/Setup.tsx';
import { Working } from './stages/Working.tsx';
import { hasScanResults, initialState, isIdle, reducer, type State } from './state.ts';
import type { Action } from './state.ts';
import { useSuggestion } from './useSuggestion.ts';
import { PROVIDERS } from './providers.ts';

function figmaTheme(): Theme {
  return document.documentElement.classList.contains('figma-dark') ? 'dark' : 'light';
}

const scanSelection = () => send({ type: 'scan-selection' });
const focusLayer = (id: string) => send({ type: 'focus-layer', id });

function StageView({ state, dispatch }: Readonly<{ state: State; dispatch: (action: Action) => void }>) {
  const suggestion = useSuggestion(state, dispatch);
  const { view } = state;
  const startOver = () => dispatch({ type: 'start-over' });

  switch (view.stage) {
    case 'loading':
      return (
        <div class="stack center">
          <Spinner />
        </div>
      );
    case 'setup':
      return <Setup onSave={(settings) => send({ type: 'save-settings', settings })} />;
    case 'ready':
      return <Ready selectionCount={state.selectionCount} emptyScanMessage={view.message} onScan={scanSelection} />;
    case 'scanned':
      if (!state.settings) {
        return <Setup onSave={(settings) => send({ type: 'save-settings', settings })} />;
      }
      return (
        <Scanned
          scan={view.scan}
          error={view.error}
          providerName={PROVIDERS[state.settings.provider].shortLabel}
          selectionChanged={state.selectionChanged}
          namingStyle={state.namingStyle}
          onNamingStyleChange={(namingStyle: NamingStyle) => {
            dispatch({ type: 'naming-style-changed', namingStyle });
            send({ type: 'save-preferences', preferences: { namingStyle } });
          }}
          includeScreenshots={state.includeScreenshots}
          onIncludeScreenshotsChange={(include) => dispatch({ type: 'screenshots-toggled', include })}
          onSuggest={suggestion.start}
          onRescan={scanSelection}
          onFocusLayer={focusLayer}
        />
      );
    case 'working':
      return <Working message={view.message} previews={view.previews} onCancel={suggestion.cancel} />;
    case 'review':
      return (
        <Review
          items={view.items}
          layers={view.scan.layers}
          onItemsChange={(change) => dispatch({ type: 'items-changed', change })}
          applying={view.applying}
          error={view.error}
          onApply={() => {
            dispatch({ type: 'apply-started' });
            send({ type: 'apply-renames', renames: approvedItems(view.items).map(({ id, newName }) => ({ id, newName: newName.trim() })) });
          }}
          onStartOver={startOver}
          onFocusLayer={focusLayer}
        />
      );
    case 'nothing':
      return <NothingToRename onStartOver={startOver} />;
    case 'done':
      return <Done renamedCount={view.renamedCount} missedCount={view.missedCount} onRenameMore={startOver} />;
  }
}

export function App() {
  const [state, dispatch] = useReducer(reducer, figmaTheme(), initialState);

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme;
  }, [state.theme]);

  useEffect(() => {
    const stop = onMessage((message) => dispatch({ type: 'message', message, figmaTheme: figmaTheme() }));
    // Ask for start-up data only once we're listening, so it can't arrive too early and get lost.
    send({ type: 'ready' });
    return stop;
  }, []);

  function changeTheme(theme: Theme) {
    dispatch({ type: 'theme-changed', theme });
    send({ type: 'save-preferences', preferences: { theme } });
  }

  return (
    <main>
      <header class="header">
        <Logo />
        <h1>Layer Bloom</h1>
        <ThemeToggle theme={state.theme} onChange={changeTheme} />
      </header>

      {state.settings && isIdle(state.view) && <KeyStatus settings={state.settings} onForget={() => send({ type: 'forget-settings' })} />}

      {state.selectionChanged && hasScanResults(state.view) && (
        <Banner tone="warning">
          Your selection in Figma changed. <LinkButton onClick={scanSelection}>Scan the new selection</LinkButton>
        </Banner>
      )}

      <StageView state={state} dispatch={dispatch} />
      <ResizeHandle />
    </main>
  );
}

import type { ComponentChildren } from 'preact';
import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-preact';

export type BannerTone = 'info' | 'success' | 'warning' | 'error';

const ICONS = { info: Info, success: CircleCheck, warning: TriangleAlert, error: CircleAlert };

type BannerProps = { tone: BannerTone; children: ComponentChildren };

export function Banner({ tone, children }: Readonly<BannerProps>) {
  const Icon = ICONS[tone];
  const content = (
    <>
      <span class="banner-icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span>{children}</span>
    </>
  );

  if (tone === 'error') {
    return (
      <div class="banner banner-error" role="alert">
        {content}
      </div>
    );
  }
  return <output class={`banner banner-${tone}`}>{content}</output>;
}

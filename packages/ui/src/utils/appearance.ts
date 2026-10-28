import type { CSSProperties } from 'react';

import type { Appearance } from '../types';

export function getAppearanceStyles(
  appearance?: Appearance
): CSSProperties | undefined {
  if (!appearance?.variables) return undefined;

  const vars: Record<string, string> = {};
  const { variables } = appearance;

  if (variables.colorPrimary) {
    vars['--kc-color-primary'] = variables.colorPrimary;
  }
  if (variables.colorPrimaryHover) {
    vars['--kc-color-primary-hover'] = variables.colorPrimaryHover;
  }
  if (variables.colorDanger) {
    vars['--kc-color-danger'] = variables.colorDanger;
  }
  if (variables.borderRadius) {
    vars['--kc-border-radius'] = variables.borderRadius;
  }
  if (variables.fontFamily) {
    vars['--kc-font-family'] = variables.fontFamily;
  }

  if (Object.keys(vars).length === 0) return undefined;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- CSS custom properties need cast
  return vars as CSSProperties;
}

export function getElementClass(
  appearance: Appearance | undefined,
  elementKey: string
): string | undefined {
  return appearance?.elements?.[elementKey];
}

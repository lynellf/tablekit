import { create } from 'storybook/theming';

export const tablekitTheme = create({
  base: 'light',
  brandTitle: 'tablekit reference',
  brandUrl: 'https://github.com/lynellf/table-kit',
  brandTarget: '_blank',
  colorPrimary: '#18352a',
  colorSecondary: '#db633b',
  appBg: '#f0ede4',
  appContentBg: '#f7f5ee',
  appPreviewBg: '#f0ede4',
  appBorderColor: '#cbc6b9',
  appBorderRadius: 0,
  fontBase:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontCode: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  textColor: '#17231c',
  textInverseColor: '#f9f6ed',
  barTextColor: '#cbd7cf',
  barSelectedColor: '#8de1b5',
  barHoverColor: '#ffffff',
  barBg: '#18352a',
  inputBg: '#ffffff',
  inputBorder: '#a9aa9f',
  inputTextColor: '#17231c',
  inputBorderRadius: 0,
});

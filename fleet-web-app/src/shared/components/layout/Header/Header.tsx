import { memo } from 'react';
import type { HeaderProps } from '../../types/types';
import { AppTopBar } from './AppTopBar';

export const Header = memo((props: HeaderProps) => {
  return <AppTopBar {...props} />;
});

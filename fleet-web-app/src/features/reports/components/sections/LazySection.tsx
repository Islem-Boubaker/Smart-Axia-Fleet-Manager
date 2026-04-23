import { Suspense, type ComponentType } from 'react';
import { useSectionVisible } from '../../hooks/useSectionVisible';
import SectionSkeleton from '../SectionSkeleton';

interface LazySectionProps {
  component: ComponentType<any>;
  props: Record<string, unknown>;
  dark: boolean;
  skeletonCols?: number;
  skeletonRows?: number;
}

const LazySection = ({ component: Component, props, dark, skeletonCols = 4, skeletonRows = 1 }: LazySectionProps) => {
  const { ref, visible } = useSectionVisible();

  return (
    <div ref={ref}>
      {visible ? (
        <Suspense fallback={<SectionSkeleton dark={dark} cols={skeletonCols} rows={skeletonRows} />}>
          <Component {...props} />
        </Suspense>
      ) : (
        <SectionSkeleton dark={dark} cols={skeletonCols} rows={skeletonRows} />
      )}
    </div>
  );
};

export default LazySection;
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '../../../shared/components';
import FleetTable from '../components/FleetTable';
import { useFleet } from '../hooks/useFleet';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';

interface ThemeContext {
  dark: boolean;
}

const FleetPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { t } = useTranslation();
  const { fleets, isLoading } = useFleet();

  return (
      <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{t('fleet.management_title')}</h1>
          <p className={`mt-1 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t('fleet.management_subtitle')}</p>
        </div>

        <Card dark={dark} className={dark ? '!bg-slate-900/40 !border-slate-700/80' : '!bg-white/80 !border-slate-200/90'}>
          {isLoading ? (
            <div className={`text-center py-8 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{t('fleet.loading')}</div>
          ) : (
            <FleetTable data={fleets} dark={dark} />
          )}
        </Card>
      </div>
  );
};

export default FleetPage;

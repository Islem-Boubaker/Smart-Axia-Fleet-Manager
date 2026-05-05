import { useTranslation } from 'react-i18next';
import { Badge, Button } from '../../../shared/components';
import type { DriverLeaderboardEntry } from '../../drivers/services/driverRanking.service';

interface TopDriversCardProps {
  drivers: DriverLeaderboardEntry[];
  onViewFull?: () => void;
}

const podiumOrder = [1, 0, 2];

const podiumHeights = ['h-[252px]', 'h-[300px]', 'h-[252px]'];

const shellClasses = [
  'from-violet-600/30 via-violet-500/10 to-slate-900/85 border-violet-400/25',
  'from-amber-400/35 via-yellow-300/10 to-slate-900/95 border-amber-300/30',
  'from-orange-500/30 via-orange-400/10 to-slate-900/90 border-orange-300/25',
];

const ringClasses = [
  'ring-violet-400/70',
  'ring-yellow-300/80',
  'ring-orange-300/80',
];

const badgeClasses = [
  'bg-violet-500 text-white',
  'bg-yellow-300 text-slate-950',
  'bg-orange-500 text-white',
];

const scoreClasses = [
  'text-violet-300',
  'text-yellow-300',
  'text-orange-300',
];

const fallbackAvatarClasses = [
  'bg-violet-500/25 text-violet-100',
  'bg-yellow-200/25 text-yellow-100',
  'bg-orange-500/25 text-orange-100',
];

const rankLabelKeys = ['dashboard.podium.second', 'dashboard.podium.first', 'dashboard.podium.third'];
const rankFallbackLabels = ['2nd', '1st', '3rd'];

const TopDriversCard = ({ drivers, onViewFull }: TopDriversCardProps) => {
  const { t, i18n } = useTranslation();
  const locale = i18n.language || 'en';
  const leaders = drivers.slice(0, 3);
  const podium = podiumOrder
    .map((index) => leaders[index])
    .filter((entry): entry is DriverLeaderboardEntry => Boolean(entry));

  return (
    <div className="learning-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-black text-gray-800 dark:text-gray-200">{t('dashboard.podium.title')}</h2>
        </div>
        {onViewFull ? (
          <Button variant="secondary" size="sm" onClick={onViewFull} className="rounded-full">
            {t('dashboard.podium.viewFull')}
          </Button>
        ) : null}
      </div>

      {podium.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.podium.none')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-3 items-end">
          {podium.map((entry, index) => {
            const isWinner = entry.rank === 1;
            const shell = shellClasses[index] || shellClasses[0];
            const ring = ringClasses[index] || ringClasses[0];
            const badge = badgeClasses[index] || badgeClasses[0];
            const score = scoreClasses[index] || scoreClasses[0];
            const fallbackAvatar = fallbackAvatarClasses[index] || fallbackAvatarClasses[0];
            const height = podiumHeights[index] || podiumHeights[0];
            const topPadding = isWinner ? 'pt-8' : 'pt-5';
            const translatedRank = t(rankLabelKeys[index] || rankLabelKeys[0]);
            const rankLabel =
              translatedRank === (rankLabelKeys[index] || rankLabelKeys[0])
                ? rankFallbackLabels[index] || rankFallbackLabels[0]
                : translatedRank;

            return (
              <div
                key={entry.driver.id}
                className={`relative overflow-hidden rounded-[28px] border bg-gradient-to-b ${shell} ${height} px-3 ${topPadding} pb-4 text-center shadow-[0_20px_45px_rgba(15,23,42,0.22)] dark:shadow-[0_24px_50px_rgba(2,6,23,0.5)]`}
              >
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/50 to-transparent" />
                {entry.driver.avatar ? (
                  <img
                    src={entry.driver.avatar}
                    alt={entry.driver.name}
                    className={`mx-auto rounded-full object-cover ring-4 ${ring} ${isWinner ? 'h-18 w-18' : 'h-14 w-14'}`}
                  />
                ) : (
                  <div className={`mx-auto rounded-full ring-4 ${ring} ${fallbackAvatar} flex items-center justify-center font-bold ${isWinner ? 'h-18 w-18 text-lg' : 'h-14 w-14 text-base'}`}>
                    {entry.driver.name?.[0] || '?'}
                  </div>
                )}

                {isWinner ? (
                  <div className="absolute left-1/2 top-2 -translate-x-1/2 text-[22px] leading-none z-20">👑</div>
                ) : null}

                <div className="relative z-10 mt-2.5 flex justify-center">
                  <span className={`inline-flex rounded-full px-3.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] shadow-sm ${badge}`}>
                    {rankLabel}
                  </span>
                </div>

                <p
                  className={`relative z-10 mt-4 px-1 font-black text-white leading-tight break-words ${
                    isWinner ? 'text-[0.9rem]' : 'text-[0.8rem]'
                  }`}
                >
                  {entry.driver.name}
                </p>
                <div className="relative z-10 mt-2 flex justify-center">
                  <Badge variant={isWinner ? 'warning' : 'default'} size="sm" className="shadow-none">
                    {entry.badge.label}
                  </Badge>
                </div>
                <p className={`relative z-10 mt-3 text-[22px] leading-none font-black ${score}`}>
                  {entry.score.toLocaleString(locale)}
                </p>
                <p className="relative z-10 mt-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                  pts
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopDriversCard;

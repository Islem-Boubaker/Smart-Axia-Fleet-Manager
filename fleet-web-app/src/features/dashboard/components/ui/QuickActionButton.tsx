import type { IconType } from 'react-icons';
interface QuickActionButtonProps {
  icon: IconType;
  label: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorClasses = {
  blue: 'bg-blue-50 hover:bg-blue-100 text-blue-600',
  green: 'bg-green-50 hover:bg-green-100 text-green-600',
  purple: 'bg-purple-50 hover:bg-purple-100 text-purple-600',
  orange: 'bg-orange-50 hover:bg-orange-100 text-orange-600',
};

export const QuickActionButton = ({ icon: Icon, label, color }: QuickActionButtonProps) => (
  <button className={`p-4 text-center rounded-lg transition-colors ${colorClasses[color]}`}>
    <Icon className="mx-auto text-2xl mb-2" />
    <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{label}</p>
  </button>
);
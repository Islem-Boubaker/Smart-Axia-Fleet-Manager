import { memo } from 'react';

interface SettingsTabProps {
  tabs: Array<{ id: string; label: string; icon: any }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const SettingsTabs = memo(({ tabs, activeTab, onTabChange }: SettingsTabProps) => {
  return (
    <nav className="space-y-1">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Icon className="text-lg" />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
});

SettingsTabs.displayName = 'SettingsTabs';

export default SettingsTabs;

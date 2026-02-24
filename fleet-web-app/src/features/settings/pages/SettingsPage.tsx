import { useState } from 'react';
import { FiUser, FiBell, FiLock, FiGlobe } from 'react-icons/fi';
import { Card } from '../../../shared/components';
import SettingsTabs from '../components/SettingsTabs';
import ProfileSettings from '../components/ProfileSettings';
import NotificationSettings from '../components/NotificationSettings';
import SecuritySettings from '../components/SecuritySettings';
import GeneralSettings from '../components/GeneralSettings';
import type { ProfileData, NotificationPreferences, GeneralPreferences, SettingsTab } from '../settings.types';
import { useAppSelector } from "../../../shared/hooks";
const TABS: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: FiUser },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'security', label: 'Security', icon: FiLock },
  { id: 'general', label: 'General', icon: FiGlobe },
];

const SettingsPage = () => {
  
  
 
    const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    company: 'AXIA Fleet Manager',
    role: user?.role || '',
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailTrips: true,
    emailMaintenance: true,
    emailDrivers: false,
    pushTrips: true,
    pushMaintenance: true,
    pushAlerts: true,
    smsAlerts: false,
  });

  const [generalSettings, setGeneralSettings] = useState<GeneralPreferences>({
    language: 'fr',
    timezone: 'Africa/Tunis',
    dateFormat: 'DD/MM/YYYY',
    distanceUnit: 'km',
    currency: 'TND',
  });

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings profileData={profileData} onChange={setProfileData} />;
      case 'notifications':
        return <NotificationSettings notifications={notifications} onChange={setNotifications} />;
      case 'security':
        return <SecuritySettings />;
      case 'general':
        return <GeneralSettings settings={generalSettings} onChange={setGeneralSettings} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage application settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card padding="sm">
            <SettingsTabs tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

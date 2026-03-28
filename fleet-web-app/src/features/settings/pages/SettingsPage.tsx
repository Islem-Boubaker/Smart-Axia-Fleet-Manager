import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { FiBell, FiEdit2, FiGlobe, FiLock, FiUser } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import ProfileSettings from '../components/ProfileSettings';
import NotificationSettings from '../components/NotificationSettings';
import SecuritySettings from '../components/SecuritySettings';
import GeneralSettings from '../components/GeneralSettings';
import type { GeneralPreferences, NotificationPreferences, ProfileData } from '../settings.types';
import { useAppSelector } from "../../../shared/hooks";

interface ThemeContext {
  dark: boolean;
}

const MENU_ITEMS = [
  { id: 'profile', label: 'My Profile', icon: FiUser },
  { id: 'security', label: 'Password & Security', icon: FiLock },
  { id: 'notifications', label: 'Notifications', icon: FiBell },
  { id: 'general', label: 'General', icon: FiGlobe },
];

const STATIC_ITEMS = ['Teams', 'Team Member', 'Billing', 'Data Export'];

const DetailGrid = ({
  items,
  dark,
}: {
  items: Array<{ label: string; value: string }>;
  dark: boolean;
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {items.map((item) => (
      <div key={item.label}>
        <p className={`text-sm ${dark ? 'text-slate-400' : 'text-gray-500'}`}>{item.label}</p>
        <p className={`text-lg font-medium mt-1 ${dark ? 'text-slate-100' : 'text-gray-900'}`}>{item.value || '-'}</p>
      </div>
    ))}
  </div>
);

const ProfileOverview = ({
  profileData,
  dark,
  onEdit,
}: {
  profileData: ProfileData;
  dark: boolean;
  onEdit: () => void;
}) => (
  <div className="space-y-4">
    <Card className={dark ? 'bg-slate-900 border-slate-700' : ''}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 to-slate-700 flex items-center justify-center text-white font-semibold text-lg">
            {profileData.name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join('') || 'U'}
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{profileData.name || 'Unknown User'}</h3>
            <p className={`${dark ? 'text-slate-300' : 'text-gray-600'}`}>{profileData.role || 'No role set'}</p>
            <p className={`text-sm mt-1 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>AXIA Fleet Manager</p>
          </div>
        </div>
        <Button variant="secondary" onClick={onEdit}>
          <FiEdit2 className="mr-2" />
          Edit
        </Button>
      </div>
    </Card>

    <Card className={dark ? 'bg-slate-900 border-slate-700' : ''}>
      <div className="flex items-center justify-between mb-6">
        <h4 className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Personal Information</h4>
        <Button variant="secondary" onClick={onEdit}>
          <FiEdit2 className="mr-2" />
          Edit
        </Button>
      </div>
      <DetailGrid
        dark={dark}
        items={[
          { label: 'First Name', value: profileData.name.split(' ')[0] || '' },
          { label: 'Last Name', value: profileData.name.split(' ').slice(1).join(' ') || '' },
          { label: 'Email Address', value: profileData.email },
          { label: 'Phone', value: profileData.phone },
          { label: 'Bio', value: profileData.role || 'No bio added' },
        ]}
      />
    </Card>

    <Card className={dark ? 'bg-slate-900 border-slate-700' : ''}>
      <div className="flex items-center justify-between mb-6">
        <h4 className={`text-2xl font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Address</h4>
        <Button variant="secondary" onClick={onEdit}>
          <FiEdit2 className="mr-2" />
          Edit
        </Button>
      </div>
      <DetailGrid
        dark={dark}
        items={[
          { label: 'Country', value: 'Tunisia' },
          { label: 'City/State', value: 'Tunis, Tunis' },
          { label: 'Postal Code', value: '1000' },
          { label: 'TAX ID', value: 'AXIA-FT-2026' },
        ]}
      />
    </Card>
  </div>
);

const SettingsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [profileData, setProfileData] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as { phone?: string } | null)?.phone || '',
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
        if (isEditingProfile) {
          return (
            <div className="space-y-4">
              <Button variant="ghost" onClick={() => setIsEditingProfile(false)}>
                Back to profile overview
              </Button>
              <ProfileSettings profileData={profileData} onChange={setProfileData} />
            </div>
          );
        }
        return <ProfileOverview profileData={profileData} dark={dark} onEdit={() => setIsEditingProfile(true)} />;
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
    <div className={`rounded-3xl border overflow-hidden ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'}`}>
      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] min-h-[70vh]">
        <aside className={`p-6 border-r ${dark ? 'border-slate-700 bg-slate-950/40' : 'border-gray-200 bg-gray-50/60'}`}>
          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'profile') {
                      setIsEditingProfile(false);
                    }
                  }}
                  className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? dark
                        ? 'bg-sky-900/40 text-sky-200'
                        : 'bg-blue-100 text-blue-700'
                      : dark
                        ? 'text-slate-300 hover:bg-slate-800'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="text-base" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}

            <div className="pt-2" />

            {STATIC_ITEMS.map((label) => (
              <p
                key={label}
                className={`px-3 py-2 text-sm ${dark ? 'text-slate-400' : 'text-gray-600'}`}
              >
                {label}
              </p>
            ))}

            <p className="px-3 py-2 text-sm text-red-500 mt-2">Delete Account</p>
          </nav>
        </aside>

        <main className="p-6 lg:p-8">
          <h2 className={`text-4xl font-semibold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>My Profile</h2>
          <div className="space-y-6">
            {renderTabContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;

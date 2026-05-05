import { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiEdit2 } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import ProfileSettings from '../components/ProfileSettings';
import NotificationSettings from '../components/NotificationSettings';
import SecuritySettings from '../components/SecuritySettings';
import type { NotificationPreferences, ProfileData } from '../settings.types';
import { useAppSelector, useAppDispatch } from '../../../shared/hooks';
import { setUser } from '../../../store/authSlice';
import { useSettings } from '../hooks/useSettings';
import { settingsService } from '../services/settings.service';
import { toast } from '../../../shared/components';
import { pageShellClasses } from '../../../shared/utils/pageShell';
import { queryKeys } from '../../../shared/services/queryKeys';

interface ThemeContext {
  dark: boolean;
}

const editBtnClass = (dark: boolean) =>
  dark
    ? '!bg-slate-800/90 !text-slate-100 border border-slate-600/80 hover:!bg-slate-700 shadow-none focus:ring-slate-500'
    : '';

const profileCardClass = (dark: boolean) =>
  [
    'rounded-2xl',
    dark
      ? '!border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
      : '!border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm',
  ].join(' ');

const ProfileFieldTiles = ({
  items,
  dark,
}: {
  items: Array<{ label: string; value: string }>;
  dark: boolean;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
    {items.map((item) => (
      <div
        key={item.label}
        className={`rounded-xl px-3 py-2.5 sm:px-2 sm:py-3.5 border transition-colors ${
          dark
            ? 'border-slate-700/50 bg-slate-800/35 hover:bg-slate-800/55'
            : 'border-slate-200/80 bg-slate-50/80 hover:bg-white'
        }`}
      >
        <p className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
          {item.label}
        </p>
        <p className={`mt-1 sm:mt-2 text-xs sm:text-xs font-medium leading-snug ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
          {item.value || '—'}
        </p>
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
}) => {
  const personalMain = [
    { label: 'First name', value: profileData.name.split(' ')[0] || '' },
    { label: 'Last name', value: profileData.name.split(' ').slice(1).join(' ') || '' },
    { label: 'Email', value: profileData.email },
    { label: 'Phone', value: profileData.phone },
  ];
  const bioText = profileData.role || 'No bio added';

  return (
    <div className="space-y-6 lg:space-y-8">
      <Card dark={dark} padding="lg" className={profileCardClass(dark)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5 min-w-0">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0 bg-gradient-to-br from-amber-300 to-slate-700 overflow-hidden ${
                dark ? 'ring-2 ring-brand/30 shadow-lg shadow-black/20' : 'shadow-md'
              }`}
            >
              {profileData.avatar ? (
                <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profileData.name
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('') || 'U'
              )}
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                {profileData.name || 'Unknown user'}
              </h3>
              <p className={dark ? 'text-slate-400' : 'text-slate-600'}>{profileData.role || 'No role set'}</p>
              <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-500'}`}>AXIA Fleet Manager</p>
            </div>
          </div>
          <Button variant="secondary" onClick={onEdit} className={`rounded-xl shrink-0 ${editBtnClass(dark)}`}>
            <FiEdit2 className="mr-2" />
            Edit
          </Button>
        </div>
      </Card>

      <Card dark={dark} padding="lg" className={profileCardClass(dark)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h4 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Personal information</h4>
          <Button variant="secondary" onClick={onEdit} className={`rounded-xl shrink-0 ${editBtnClass(dark)}`}>
            <FiEdit2 className="mr-2" />
            Edit
          </Button>
        </div>
        <ProfileFieldTiles items={personalMain} dark={dark} />
        <div
          className={`mt-4 rounded-xl px-4 py-3.5 border ${
            dark ? 'border-slate-700/50 bg-slate-800/25' : 'border-slate-200/80 bg-slate-50/60'
          }`}
        >
          <p className={`text-[11px] font-semibold uppercase tracking-[0.1em] ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
            Bio
          </p>
          <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{bioText}</p>
        </div>
      </Card>

      <Card dark={dark} padding="lg" className={profileCardClass(dark)}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h4 className={`text-lg font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Address</h4>
          <Button variant="secondary" onClick={onEdit} className={`rounded-xl shrink-0 ${editBtnClass(dark)}`}>
            <FiEdit2 className="mr-2" />
            Edit
          </Button>
        </div>
        <ProfileFieldTiles
          dark={dark}
          items={[
            { label: 'Country', value: profileData.country || '' },
            { label: 'City / State', value: profileData.city || '' },
            { label: 'Postal code', value: profileData.postalCode || '' },
            { label: 'TAX ID', value: profileData.taxId || '' },
          ]}
        />
      </Card>
    </div>
  );
};

const tabTitle: Record<string, string> = {
  profile: 'My profile',
  security: 'Password & security',
  notifications: 'Notifications',
};

const SettingsPage = () => {
  const { dark } = useOutletContext<ThemeContext>();
  const location = useLocation();
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { changePassword, updateNotifications, isLoading: isSettingsLoading } = useSettings();
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Derive active tab from query parameters
  const getActiveTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    // Return the tab if it's valid, otherwise default to 'profile'
    if (tab === 'notifications' || tab === 'security' || tab === 'profile') {
      return tab;
    }
    return 'profile';
  };

  const activeTab = getActiveTab();

  const profileData: ProfileData = {
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as { phone?: string } | null)?.phone || '',
    company: (user as any)?.company || 'AXIA Fleet Manager',
    role: user?.role || '',
    avatar: user?.avatar,
    country: (user as any)?.country || '',
    city: (user as any)?.city || '',
    postalCode: (user as any)?.postalCode || '',
    taxId: (user as any)?.taxId || '',
  };

  const handleSaveProfile = async (data: ProfileData, file: File | null) => {
    try {
      const resp = await settingsService.updateProfile({
        name: data.name,
        phone: data.phone,
        role: data.role,
        company: data.company,
        country: data.country,
        city: data.city,
        postalCode: data.postalCode,
        taxId: data.taxId,
      });
      let updatedUser = { ...resp };

      if (file) {
        const avUser = await settingsService.uploadAvatar(file);
        if (avUser?.avatar) {
          updatedUser.avatar = avUser.avatar;
        }
      }

      const newUser = { ...user, ...updatedUser };
      dispatch(setUser(newUser as any));
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile');
    }
  };

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailTrips: true,
    emailMaintenance: true,
    emailDrivers: false,
    emailAI: true,
    emailSystem: true,
    pushTrips: true,
    pushMaintenance: true,
    pushDrivers: true,
    pushAI: true,
    pushSystem: true,
    pushAlerts: true,
    smsAlerts: false,
  });

  const notificationsQuery = useQuery({
    queryKey: queryKeys.settings.notifications(),
    queryFn: settingsService.getNotifications,
  });

  useEffect(() => {
    if (!notificationsQuery.data) return;
    setNotifications((prev) => ({ ...prev, ...notificationsQuery.data }));
  }, [notificationsQuery.data]);

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const loadingId = toast.loading('Updating password...');

    try {
      await changePassword(currentPassword, newPassword);
      toast.update(loadingId, {
        type: 'success',
        title: 'Success',
        message: 'Password changed successfully.',
      });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to change password';

      toast.update(loadingId, {
        type: 'error',
        title: 'Error',
        message,
      });

      throw err;
    }
  };

  const handleSaveNotifications = async () => {
    const loadingId = toast.loading('Saving notification settings...');
    try {
      await updateNotifications(notifications);
      toast.update(loadingId, {
        type: 'success',
        title: 'Success',
        message: 'Notification settings saved.',
      });
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ||
        (err as { message?: string })?.message ||
        'Failed to save notification settings';
      toast.update(loadingId, {
        type: 'error',
        title: 'Error',
        message,
      });
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        if (isEditingProfile) {
          return (
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => setIsEditingProfile(false)}
                className={dark ? '!text-slate-300 hover:!bg-slate-800' : ''}
              >
                ← Back to profile overview
              </Button>
              <ProfileSettings profileData={profileData} onSave={handleSaveProfile} dark={dark} />
            </div>
          );
        }
        return <ProfileOverview profileData={profileData} dark={dark} onEdit={() => setIsEditingProfile(true)} />;
      case 'notifications':
        return (
          <NotificationSettings
            notifications={notifications}
            onChange={setNotifications}
            onSave={handleSaveNotifications}
            isSaving={isSettingsLoading}
            dark={dark}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            dark={dark}
            isLoading={isSettingsLoading}
            onChangePassword={handleChangePassword}
          />
        );
      default:
        return null;
    }
  };

  const shell = pageShellClasses(dark);

  return (
    <div className={`${shell} overflow-hidden animate-fade-in`}>
      <div className="max-w-5xl mx-auto p-6 sm:p-8 lg:p-10">
        <div className="fleet-hero mb-6 lg:mb-8">
          <p className="fleet-hero-kicker">Workspace</p>
          <h2 className="fleet-hero-title">
            {tabTitle[activeTab] ?? 'Settings'}
          </h2>
        </div>
        <div className="space-y-6 lg:space-y-8">{renderTabContent()}</div>
      </div>
    </div>
  );
};

export default SettingsPage;

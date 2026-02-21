import { useState } from 'react';
import { FiUser, FiBell, FiLock, FiGlobe, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import SettingsTabs from '../components/SettingsTabs';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Settings
  const [profileData, setProfileData] = useState({
    name: 'Bedis Ghodbane',
    email: 'bedisg9@gmail.com',
    phone: '+216 27 476 188',
    company: 'AXIA Fleet Manager',
    role: 'Admin',
  });

  // Notification Settings
  const [notifications, setNotifications] = useState({
    emailTrips: true,
    emailMaintenance: true,
    emailDrivers: false,
    pushTrips: true,
    pushMaintenance: true,
    pushAlerts: true,
    smsAlerts: false,
  });

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    language: 'fr',
    timezone: 'Africa/Tunis',
    dateFormat: 'DD/MM/YYYY',
    distanceUnit: 'km',
    currency: 'TND',
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: FiUser },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiLock },
    { id: 'general', label: 'General', icon: FiGlobe },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage application settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card padding="sm">
              <SettingsTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <>
                <Card title="Profile Information" subtitle="Update your personal information">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <Input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiMail className="inline mr-2" />
                          Email
                        </label>
                        <Input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FiPhone className="inline mr-2" />
                          Phone
                        </label>
                        <Input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Company
                        </label>
                        <Input
                          type="text"
                          value={profileData.company}
                          onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Role
                        </label>
                        <Input
                          type="text"
                          value={profileData.role}
                          disabled
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button>
                        <FiSave className="mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Notifications Settings */}
            {activeTab === 'notifications' && (
              <Card title="Notification Preferences" subtitle="Manage how you receive notifications">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Email Notifications</h3>
                    <div className="space-y-3">
                      {Object.entries(notifications)
                        .filter(([key]) => key.startsWith('email'))
                        .map(([key, value]) => (
                          <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                            <span className="text-sm text-gray-700">
                              {key.replace('email', '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </label>
                        ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Push Notifications</h3>
                    <div className="space-y-3">
                      {Object.entries(notifications)
                        .filter(([key]) => key.startsWith('push'))
                        .map(([key, value]) => (
                          <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                            <span className="text-sm text-gray-700">
                              {key.replace('push', '').replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </label>
                        ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <FiSave className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <Card title="Security Settings" subtitle="Manage your password and security">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <Input type="password" placeholder="Enter current password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <Input type="password" placeholder="Enter new password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <Input type="password" placeholder="Confirm new password" />
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <FiLock className="mr-2" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* General Settings */}
            {activeTab === 'general' && (
              <Card title="General Settings" subtitle="Application preferences">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Africa/Tunis">Africa/Tunis (GMT+1)</option>
                        <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                        <option value="UTC">UTC (GMT)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Format
                      </label>
                      <select
                        value={generalSettings.dateFormat}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Distance Unit
                      </label>
                      <select
                        value={generalSettings.distanceUnit}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, distanceUnit: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="km">Kilometers</option>
                        <option value="mi">Miles</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={generalSettings.currency}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="TND">TND (Tunisian Dinar)</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>
                      <FiSave className="mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;

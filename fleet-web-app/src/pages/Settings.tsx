import { useState } from 'react';
import { FiUser, FiBell, FiLock, FiGlobe, FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { Card, Button, Input } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';

const Settings = () => {
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
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
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
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <Card title="Profile Picture" subtitle="Upload a profile picture">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      BG
                    </div>
                    <div>
                      <Button variant="outline" size="sm">
                        Upload Photo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">JPG, PNG or GIF. Max size 2MB</p>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button>
                    <FiSave className="mr-2" />
                    Save Changes
                  </Button>
                </div>
              </>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <>
                <Card title="Email Notifications" subtitle="Manage email notification preferences">
                  <div className="space-y-4">
                    {[
                      { key: 'emailTrips', label: 'Trip Updates', description: 'Receive notifications about trip starts and completions' },
                      { key: 'emailMaintenance', label: 'Maintenance Alerts', description: 'Get notified about upcoming maintenance schedules' },
                      { key: 'emailDrivers', label: 'Driver Activities', description: 'Notifications about driver assignments and activities' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Push Notifications" subtitle="Manage push notification preferences">
                  <div className="space-y-4">
                    {[
                      { key: 'pushTrips', label: 'Trip Alerts', description: 'Real-time updates on trip status changes' },
                      { key: 'pushMaintenance', label: 'Maintenance Reminders', description: 'Urgent maintenance notifications' },
                      { key: 'pushAlerts', label: 'System Alerts', description: 'Important system notifications and alerts' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.label}</p>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifications[item.key as keyof typeof notifications]}
                            onChange={(e) => setNotifications({ ...notifications, [item.key]: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button>
                    <FiSave className="mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <>
                <Card title="Change Password" subtitle="Update your password regularly for security">
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
                  </div>
                </Card>

                <Card title="Two-Factor Authentication" subtitle="Add an extra layer of security">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">Enable 2FA</p>
                        <p className="text-sm text-gray-500">Require a verification code in addition to your password</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Enable
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card title="Active Sessions" subtitle="Manage your active login sessions">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">Windows - Chrome</p>
                          <p className="text-sm text-gray-500">Tunis, Tunisia • Active now</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">Current</span>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button>
                    <FiSave className="mr-2" />
                    Update Password
                  </Button>
                </div>
              </>
            )}

            {/* General Settings */}
            {activeTab === 'general' && (
              <>
                <Card title="Localization" subtitle="Configure language and regional settings">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="fr">Français</option>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
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
                        <option value="Africa/Tunis">Tunisia (UTC+1)</option>
                        <option value="Europe/Paris">Paris (UTC+1)</option>
                        <option value="Europe/London">London (UTC+0)</option>
                      </select>
                    </div>
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
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      </select>
                    </div>
                  </div>
                </Card>

                <Card title="Units & Currency" subtitle="Configure measurement units and currency">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Distance Unit
                        </label>
                        <select
                          value={generalSettings.distanceUnit}
                          onChange={(e) => setGeneralSettings({ ...generalSettings, distanceUnit: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="km">Kilometers (km)</option>
                          <option value="mi">Miles (mi)</option>
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
                          <option value="TND">Dinar Tunisien (TND)</option>
                          <option value="EUR">Euro (EUR)</option>
                          <option value="USD">US Dollar (USD)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button>
                    <FiSave className="mr-2" />
                    Save Settings
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;

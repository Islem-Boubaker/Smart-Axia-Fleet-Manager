import { FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';
import type { ProfileData } from '../settings.types';

interface Props {
  profileData: ProfileData;
  onChange: (data: ProfileData) => void;
  dark?: boolean;
}

const cardExtra = (dark: boolean) =>
  dark
    ? 'rounded-2xl !border-slate-700/70 !bg-slate-900/40 shadow-soft ring-1 ring-white/[0.06] backdrop-blur-md'
    : 'rounded-2xl !border-slate-200/90 !bg-white/75 shadow-glass backdrop-blur-sm';

const ProfileSettings = ({ profileData, onChange, dark = false }: Props) => {
  const updateField = (field: keyof ProfileData, value: string) => {
    onChange({ ...profileData, [field]: value });
  };

  const label = dark ? 'text-slate-400' : 'text-gray-700';

  return (
    <Card
      title="Profile information"
      subtitle="Update your personal information"
      dark={dark}
      padding="lg"
      className={cardExtra(dark)}
    >
      <div className="space-y-5">
        <div>
          <label className={`block text-sm font-medium mb-2 ${label}`}>Full name</label>
          <Input
            type="text"
            value={profileData.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={
              dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>
              <FiMail className="inline mr-2" />
              Email
            </label>
            <Input
              type="email"
              value={profileData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={
                dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
              }
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>
              <FiPhone className="inline mr-2" />
              Phone
            </label>
            <Input
              type="tel"
              value={profileData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className={
                dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
              }
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>Company</label>
            <Input
              type="text"
              value={profileData.company}
              onChange={(e) => updateField('company', e.target.value)}
              className={
                dark ? 'border-slate-600 bg-slate-800/80 text-slate-100 placeholder:text-slate-500 rounded-xl' : 'rounded-xl'
              }
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${label}`}>Role</label>
            <Input
              type="text"
              value={profileData.role}
              disabled
              className={dark ? 'border-slate-700 bg-slate-800/50 text-slate-500 rounded-xl' : 'rounded-xl'}
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button className="rounded-xl">
            <FiSave className="mr-2" />
            Save changes
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileSettings;

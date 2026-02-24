import { FiMail, FiPhone, FiSave } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';
import type { ProfileData } from '../settings.types';

interface Props {
  profileData: ProfileData;
  onChange: (data: ProfileData) => void;
}

const ProfileSettings = ({ profileData, onChange }: Props) => {
  const updateField = (field: keyof ProfileData, value: string) => {
    onChange({ ...profileData, [field]: value });
  };
  
  return (
    <Card title="Profile Information" subtitle="Update your personal information">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
          <Input
            type="text"
            value={profileData.name}
            onChange={(e) => updateField('name', e.target.value)}
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
              onChange={(e) => updateField('email', e.target.value)}
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
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <Input
              type="text"
              value={profileData.company}
              onChange={(e) => updateField('company', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <Input type="text" value={profileData.role} disabled />
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
  );
};

export default ProfileSettings;

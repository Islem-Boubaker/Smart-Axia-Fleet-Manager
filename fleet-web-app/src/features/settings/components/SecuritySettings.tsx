import { FiLock } from 'react-icons/fi';
import { Card, Button, Input } from '../../../shared/components';

const SecuritySettings = () => (
  <Card title="Security Settings" subtitle="Manage your password and security">
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
        <Input type="password" placeholder="Enter current password" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
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
);

export default SecuritySettings;

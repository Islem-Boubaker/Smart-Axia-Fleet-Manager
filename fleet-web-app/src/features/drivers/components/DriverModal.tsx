import { GlobalCard } from '../../../shared/components';
import DriverForm from './DriverForm';
import type { Driver } from '../../../types';

interface DriverFormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  status: string;
  assignedVehicle: string;
  rating: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  driver?: Driver | null;
  onSubmit: (data: DriverFormData, photo: File | null) => void;
}

const DriverModal = ({ isOpen, onClose, title, driver, onSubmit }: Props) => (
  <GlobalCard isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
    <DriverForm driver={driver as any} onSubmit={onSubmit} onCancel={onClose} />
  </GlobalCard>
);

export default DriverModal;
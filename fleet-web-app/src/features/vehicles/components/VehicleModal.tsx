import { GlobalCard } from '../../../shared/components';
import VehicleForm from '../components/VehicleForm';
import type { Vehicle } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  dark?: boolean;
  vehicle?: Partial<Vehicle>;
  onSubmit: (data: Partial<Vehicle> | FormData) => void;
  error?: string;
}

const VehicleModal = ({ isOpen, onClose, title, dark = false, vehicle, onSubmit, error }: Props) => (
  <GlobalCard isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
    <VehicleForm vehicle={vehicle} dark={dark} onSubmit={onSubmit} onCancel={onClose} error={error} />
  </GlobalCard>
);

export default VehicleModal;
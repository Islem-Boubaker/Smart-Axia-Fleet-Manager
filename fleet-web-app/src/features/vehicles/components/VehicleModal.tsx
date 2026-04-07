import { GlobalCard } from '../../../shared/components';
import VehicleForm from '../components/VehicleForm';
import type { Vehicle } from '../../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  vehicle?: Partial<Vehicle>;
  onSubmit: (data: Partial<Vehicle> | FormData) => void;
  error?: string;
}

const VehicleModal = ({ isOpen, onClose, title, vehicle, onSubmit, error }: Props) => (
  <GlobalCard isOpen={isOpen} onClose={onClose} title={title} maxWidth="2xl">
    <VehicleForm vehicle={vehicle} onSubmit={onSubmit} onCancel={onClose} error={error} />
  </GlobalCard>
);

export default VehicleModal;
import { FiSearch } from 'react-icons/fi';
import { Input, Card } from '../../../shared/components';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const DriversSearch = ({ value, onChange }: Props) => (
  <Card>
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search drivers..."
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  </Card>
);

export default DriversSearch;
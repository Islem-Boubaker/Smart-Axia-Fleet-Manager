import { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { vehiclesService } from '../../vehicles/services/vehicles.service';
import type { Vehicle } from '../../../types';
import { Button, Badge } from '../../../shared/components';
import { pageShellClasses, pageShellInnerSpacing } from '../../../shared/utils/pageShell';

export default function VehicleDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { dark } = useOutletContext<{ dark: boolean }>();
  const t = dark ? 'text-white' : 'text-slate-900';
  const sub = dark ? 'text-slate-400' : 'text-slate-500';
  
  // Glassmorphism panels
  const panel = dark
    ? 'border border-slate-700/80 bg-slate-900/50 backdrop-blur-sm'
    : 'border border-slate-200/90 bg-white/80 backdrop-blur-sm shadow-soft';
    
  const card = dark
    ? 'border border-slate-700/60 bg-slate-800/50 backdrop-blur-sm'
    : 'border border-slate-200/60 bg-white/60 backdrop-blur-sm shadow-sm';

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        if (!id) return;
        setIsLoading(true);
        const found = await vehiclesService.getVehicleById(id);
        
        if (found) {
          setVehicle(found);
        } else {
          alert('Vehicle not found!');
          navigate(-1);
        }
      } catch (error) {
        alert('Error loading vehicle details.');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVehicle();
  }, [id, navigate]);

  const getCarImage = (type: string = '') => {
    switch (type.toLowerCase()) {
      case 'truck':
      case 'van':
        return 'https://images.unsplash.com/photo-1601584115197-04ecc0dacc34?auto=format&fit=crop&q=80&w=1200';
      case 'motorcycle':
        return 'https://images.unsplash.com/photo-1558981403-c5f9899a228f?auto=format&fit=crop&q=80&w=1200';
      default:
        return 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1200';
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${t}`}>
        Loading vehicle details...
      </div>
    );
  }

  if (!vehicle) return null;

  return (
    <div className={`${pageShellClasses(dark)} ${pageShellInnerSpacing} animate-fade-in`}>
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6">
        <Button variant="secondary" onClick={() => navigate(-1)} className="rounded-xl">
          <FiArrowLeft className="mr-2" />
          Back
        </Button>
        <div>
          <h1 className={`text-2xl font-bold ${t}`}>{vehicle.name || 'Vehicle Details'}</h1>
          <p className={sub}>Plate: {vehicle.plaque_immatriculation}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual / Top Info */}
        <div className={`lg:col-span-1 rounded-[20px] overflow-hidden shadow-soft h-fit ${panel}`}>
          <div className="aspect-video relative">
            <img 
              src={(vehicle.photos && vehicle.photos.length > 0) ? vehicle.photos[0] : getCarImage(vehicle.type)} 
              alt={vehicle.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                 e.currentTarget.src = 'https://placehold.co/600x400?text=Vehicle';
              }}
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <Badge variant={vehicle.Active ? 'success' : 'default'}>{vehicle.Active ? 'Active' : 'Inactive'}</Badge>
              {vehicle.Need_Maintenance && <Badge variant="warning">Maintenance Required</Badge>}
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <p className={`text-sm ${sub}`}>Model</p>
              <p className={`font-semibold ${t} text-lg`}>{vehicle.Vehicle_Model || 'N/A'}</p>
            </div>
            <div>
              <p className={`text-sm ${sub}`}>Type</p>
              <p className={`font-semibold capitalize ${t}`}>{vehicle.type || 'N/A'}</p>
            </div>
            <div>
              <p className={`text-sm ${sub}`}>Name</p>
              <p className={`font-semibold ${t}`}>{vehicle.name || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className={`lg:col-span-2 rounded-[20px] p-6 shadow-soft ${panel}`}>
          <h3 className={`text-lg font-bold mb-6 ${t}`}>Technical Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Mileage</p>
                <p className={`text-2xl font-bold ${t} mt-1`}>{vehicle.Mileage?.toLocaleString() || 0} km</p>
              </div>

              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Vehicle Age</p>
                <p className={`text-2xl font-bold ${t} mt-1`}>{vehicle.Vehicle_Age || 0} Years</p>
              </div>
              
              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Max Load</p>
                <p className={`text-2xl font-bold ${t} mt-1`}>{vehicle.max_load ? `${vehicle.max_load} kg` : 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Engine Size</p>
                <p className={`text-2xl font-bold ${t} mt-1`}>{vehicle.Engine_Size ? `${vehicle.Engine_Size} cc` : 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Battery Status</p>
                <p className={`text-lg font-medium ${t} mt-1`}>{vehicle.Battery_Status || 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Tire Condition</p>
                <p className={`text-lg font-medium ${t} mt-1`}>{vehicle.Tire_Condition || 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Brake Condition</p>
                <p className={`text-lg font-medium ${t} mt-1`}>{vehicle.Brake_Condition || 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl flex flex-col justify-center ${card}`}>
                <p className={`text-sm ${sub}`}>Insurance Expiry Date</p>
                <p className={`text-lg font-medium ${t} mt-1`}>{vehicle.insurance_expiry_date ? new Date(vehicle.insurance_expiry_date).toLocaleDateString() : 'N/A'}</p>
              </div>

              <div className={`p-4 rounded-2xl flex gap-3 ${card} ${vehicle.Need_Maintenance ? '!border-red-500/50' : ''}`}>
                {vehicle.Need_Maintenance && <FiAlertCircle className="text-red-500 mt-1 flex-shrink-0" size={20} />}
                <div>
                  <p className={`text-sm ${sub}`}>Tech Visit Expiry Date</p>
                  <p className={`text-lg font-medium ${t} mt-1`}>{vehicle.tech_visit_expiry_date ? new Date(vehicle.tech_visit_expiry_date).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            
            {(vehicle as any).last_maintenance && (
              <div className={`p-4 rounded-2xl ${card}`}>
                <p className={`text-sm ${sub}`}>Last Maintenance</p>
                <p className={`text-lg font-medium ${t} mt-1`}>{new Date((vehicle as any).last_maintenance).toLocaleDateString()}</p>
              </div>
            )}
            
            <div className={`p-4 rounded-2xl ${card}`}>
               <p className={`text-sm ${sub}`}>Status</p>
               <p className={`text-lg font-medium mt-1 ${vehicle.Active ? 'text-emerald-500' : 'text-slate-500'}`}>
                 {vehicle.Active ? 'In Service' : 'Out of Service'}
               </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}

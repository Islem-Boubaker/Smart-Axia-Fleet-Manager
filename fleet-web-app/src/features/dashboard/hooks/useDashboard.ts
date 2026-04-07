import { useState, useEffect } from 'react';
import { FiTruck, FiUsers, FiMapPin, FiTrendingUp } from 'react-icons/fi';
export const useDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats] = useState([
    {
      title: 'Total Vehicles',
      value: '48',
      change: '+12%',
      changeType: 'increase' as const,
      icon: FiTruck,
      color: 'blue' as const,
    },
    {
      title: 'Active Drivers',
      value: '32',
      change: '+5%',
      changeType: 'increase' as const,
      icon: FiUsers,
      color: 'green' as const,
    },
    {
      title: 'Ongoing Trips',
      value: '15',
      change: '-3%',
      changeType: 'decrease' as const,
      icon: FiMapPin,
      color: 'purple' as const,
    },
    {
      title: 'Total Distance',
      value: '12.5K km',
      change: '+8%',
      changeType: 'increase' as const,
      icon: FiTrendingUp,
      color: 'orange' as const,
    },
  ]);

  const [recentVehicles] = useState([
    { id: '1', name: 'Toyota Camry', plate: '123 TU 4567', status: 'active', driver: 'Mohamed Ben Salah' },
    { id: '2', name: 'Honda Accord', plate: '167 TU 2389', status: 'maintenance', driver: 'N/A' },
    { id: '3', name: 'Ford F-150', plate: '234 TU 8912', status: 'active', driver: 'Fatma Chaabani' },
    { id: '4', name: 'Chevrolet Malibu', plate: '156 TU 3421', status: 'active', driver: 'Ahmed Trabelsi' },
  ]);

  const [recentTrips] = useState([
    { id: '1', driver: 'Mohamed Ben Salah', vehicle: '123 TU 4567', from: 'Tunis', to: 'Sfax', status: 'ongoing' },
    { id: '2', driver: 'Fatma Chaabani', vehicle: '234 TU 8912', from: 'Sousse', to: 'Kairouan', status: 'completed' },
    { id: '3', driver: 'Ahmed Trabelsi', vehicle: '156 TU 3421', from: 'Bizerte', to: 'Nabeul', status: 'ongoing' },
  ]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // TODO: Implement API calls
        // const data = await dashboardService.getDashboardData();
        // setStats(data.stats);
        // setRecentVehicles(data.recentVehicles);
        // setRecentTrips(data.recentTrips);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return {
    stats,
    recentVehicles,
    recentTrips,
    isLoading,
  };
};

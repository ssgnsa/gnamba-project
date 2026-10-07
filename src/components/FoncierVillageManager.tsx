import { useState, useCallback, useEffect } from 'react';
import { foncierRepository } from '@/data/foncier.repository';
import { withBackoff } from '@/lib/retry';
import { getCachedLots } from '@/lib/foncierOffline';

interface FoncierVillageManagerProps {
  initialVillage?: string;
  onVillageChange?: (village: string) => void;
}

export const FoncierVillageManager: React.FC<FoncierVillageManagerProps> = ({
  initialVillage,
  onVillageChange,
}) => {
  const [villages, setVillages] = useState<string[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>(initialVillage || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadVillages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const cachedLots = await getCachedLots();
      const cachedVillages = [...new Set(cachedLots.map((lot) => lot.village).filter(Boolean))];

      if (cachedVillages.length > 0) {
        setVillages(cachedVillages);
        if (!selectedVillage && cachedVillages[0]) {
          const firstVillage = cachedVillages[0];
          setSelectedVillage(firstVillage);
          onVillageChange?.(firstVillage);
        }
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await withBackoff(() =>
        foncierRepository.getVillages(),
      );

      if (fetchError) throw fetchError;

      if (data && Array.isArray(data)) {
        const villageNames = data.map((item) => item.nom ?? String(item));
        setVillages(villageNames);
        if (!selectedVillage && villageNames[0]) {
          setSelectedVillage(villageNames[0]);
          onVillageChange?.(villageNames[0]);
        }
      } else {
        const defaultVillages = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San Pedro'];
        setVillages(defaultVillages);
        if (!selectedVillage) {
          setSelectedVillage(defaultVillages[0]);
          onVillageChange?.(defaultVillages[0]);
        }
      }
    } catch (err) {
      setError('Erreur lors du chargement des villages');
      console.error('Failed to load villages:', err);

      const fallbackVillages = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San Pedro'];
      setVillages(fallbackVillages);
      if (!selectedVillage) {
        setSelectedVillage(fallbackVillages[0]);
        onVillageChange?.(fallbackVillages[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [onVillageChange, selectedVillage]);

  useEffect(() => {
    void loadVillages();
  }, [loadVillages]);

  const handleVillageChange = useCallback((village: string) => {
    setSelectedVillage(village);
    onVillageChange?.(village);
  }, [onVillageChange]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <label className="text-sm font-medium text-white mb-2">Village</label>
        <div className="relative">
          <select
            value={selectedVillage}
            onChange={(e) => handleVillageChange(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
            disabled={loading}
          >
            <option value="">Tous les villages</option>
            {villages.map((village) => (
              <option key={village} value={village}>
                {village}
              </option>
            ))}
          </select>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            </div>
          )}
        </div>
        {error && <div className="mt-2 text-sm text-red-300">{error}</div>}
      </div>
    </div>
  );
};

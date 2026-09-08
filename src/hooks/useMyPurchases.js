import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Récupère les achats validés de l'utilisateur courant (mis en cache par react-query).
 * Retourne un tableau d'objets { item_id, item_type, protected_url, external_url, ... }.
 * Sur une app publique sans login, retourne [] silencieusement.
 */
export function useMyPurchases() {
  const { data: purchases = [] } = useQuery({
    queryKey: ['my-purchases-summary'],
    queryFn: async () => {
      try {
        const res = await base44.functions.invoke('getMyPurchases', {});
        return res.data?.purchases || [];
      } catch {
        return [];
      }
    },
    staleTime: 30000,
    retry: false,
  });
  return purchases;
}

/**
 * Renvoie l'accès d'un utilisateur pour un item donné (release ou video).
 * @returns {{ protected_url?: string, external_url?: string } | null}
 */
export function useMyAccess(itemId) {
  const purchases = useMyPurchases();
  if (!itemId) return null;
  return purchases.find((p) => p.item_id === itemId) || null;
}
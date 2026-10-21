import { QueryClient } from '@tanstack/react-query';

// Cache de données partagé : les pages déjà visitées s'affichent instantanément
// au lieu de recharger toutes les données à chaque navigation.
export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 2 * 60 * 1000,
			gcTime: 30 * 60 * 1000,
		},
	},
});
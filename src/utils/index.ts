export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export { isArtistCertified, checkArtistCertifiedInDb } from '@/services/artistCertification';
export { dspSyncWatcherService } from '@/services/dspSyncWatcherService';

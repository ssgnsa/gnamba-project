import { beforeEach, describe, it, expect, vi } from 'vitest';

// Mock supabase client to avoid real network calls
vi.mock('../supabase', () => ({ supabase: { from: vi.fn() } }));
import { supabase } from '../supabase';
import {
  getMediaUsages,
  getMediaVersions,
  getUsageForSlot,
  getBrandAsset,
} from '../mediaUtils';

describe('mediaUtils (unit)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getMediaUsages returns an array of usages', async () => {
    const mockData = [{ id: 'u1', media_id: 'm1' }];
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => Promise.resolve({ data: mockData }),
    };
    (supabase.from as any).mockReturnValue(chain);

    const res = await getMediaUsages('m1');
    expect(res).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('media_usage');
  });

  it('getMediaVersions returns versions list', async () => {
    const mockData = [{ id: 'v1', media_id: 'm1' }];
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => Promise.resolve({ data: mockData }),
    };
    (supabase.from as any).mockReturnValue(chain);

    const res = await getMediaVersions('m1');
    expect(res).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('media_versions');
  });

  it('getUsageForSlot returns media file when assigned', async () => {
    const mockData = { media_files: { id: 'm1', url: 'u' } };
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      is: () => chain,
      maybeSingle: () => Promise.resolve({ data: mockData }),
    };
    (supabase.from as any).mockReturnValue(chain);

    const res = await getUsageForSlot('site_section', null, 'hero_image');
    expect(res).toEqual(mockData.media_files);
    expect(supabase.from).toHaveBeenCalledWith('media_usage');
  });

  it('getBrandAsset returns the latest brand asset', async () => {
    const mockFile = { id: 'm1', url: 'u' };
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => Promise.resolve({ data: mockFile }),
    };
    (supabase.from as any).mockReturnValue(chain);

    const res = await getBrandAsset('logo_principal' as any);
    expect(res).toEqual(mockFile);
    expect(supabase.from).toHaveBeenCalledWith('media_files');
  });
});
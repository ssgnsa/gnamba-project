import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../data/foncier.repository', () => ({
  foncierRepository: {
    searchLots: vi.fn(),
  },
}));

import { FoncierContainer } from './FoncierContainer';
import { foncierRepository } from '../data/foncier.repository';

const mockedRepository = vi.mocked(foncierRepository);

describe('FoncierContainer', () => {
  beforeEach(() => {
    mockedRepository.searchLots.mockReset();
  });

  it('renders the foncier module with fetched lots', async () => {
    mockedRepository.searchLots.mockResolvedValue({
      data: [
        {
          id: 'lot-1',
          reference: 'LOT-001',
          numero_lot: '1',
          numero_ilot: 'A',
          nom_lotissement: 'Lotissement A',
          quartier: 'Sikensi',
          village: 'Sikensi',
          commune: 'Sikensi',
          departement: 'Gbêkê',
          region: 'Centre',
          superficie: 500,
          code_barre: '',
          proprietaire_nom: 'Kouassi',
          proprietaire_prenom: 'Jean',
          proprietaire_naissance_date: '',
          proprietaire_naissance_lieu: '',
          proprietaire_cni_numero: '',
          proprietaire_cni_date: '',
          proprietaire_cni_lieu: '',
          proprietaire_profession: '',
          proprietaire_telephone: '',
          chef_village: '',
          arrete_prefectoral: '',
          arrete_date: '',
          statut: 'actif',
          date_cession: '',
          prix_cession: 0,
          notes: '',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
        },
      ],
      error: null,
    });

    render(<FoncierContainer />);

    expect(await screen.findByText(/Gestion des lots fonciers/i)).toBeInTheDocument();
    expect(await screen.findByText(/LOT-001/i)).toBeInTheDocument();
  });
});

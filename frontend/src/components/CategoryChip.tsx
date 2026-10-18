import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { CategoryRef } from '../api/types';

const FALLBACK = { name: 'Uncategorized', color: '#9e9e9e' };

export default function CategoryChip({ category, size = 'small' }: { category: CategoryRef | null; size?: 'small' | 'medium' }) {
  const { name, color } = category ?? FALLBACK;
  return (
    <Chip
      size={size}
      variant="outlined"
      label={name}
      icon={<Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, ml: '8px !important' }} />}
      sx={{ maxWidth: '100%' }}
    />
  );
}

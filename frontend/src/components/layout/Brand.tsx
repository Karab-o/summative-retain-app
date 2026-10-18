import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Brand({ size = 32 }: { size?: number }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box component="img" src="/favicon.svg" alt="" sx={{ width: size, height: size, borderRadius: 1.5 }} />
      <Typography variant="h6" component="span" sx={{ fontWeight: 700, letterSpacing: '-0.01em' }}>
        Retain
      </Typography>
    </Stack>
  );
}

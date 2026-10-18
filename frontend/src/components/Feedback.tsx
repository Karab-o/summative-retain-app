import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { getErrorMessage } from '../api/client';

/** Centered spinner for whole-page or whole-card loading states. */
export function LoadingState({ minHeight = 240 }: { minHeight?: number | string }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight }} role="status" aria-label="Loading">
      <CircularProgress />
    </Box>
  );
}

/** Error message for a failed request, with a retry button. */
export function QueryError({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry && (
          <Button color="inherit" size="small" onClick={onRetry}>
            Retry
          </Button>
        )
      }
    >
      {getErrorMessage(error, 'Could not load data')}
    </Alert>
  );
}

/** Friendly placeholder when a list or chart has nothing to show. */
export function EmptyState({
  title,
  description,
  action,
  icon,
  minHeight = 200,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  minHeight?: number | string;
}) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', textAlign: 'center', minHeight, px: 2, py: 3 }}>
      <Box sx={{ maxWidth: 360 }}>
        {icon && <Box sx={{ color: 'text.disabled', mb: 1, '& svg': { fontSize: 40 } }}>{icon}</Box>}
        <Typography variant="subtitle1">{title}</Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {description}
          </Typography>
        )}
        {action && <Box sx={{ mt: 2 }}>{action}</Box>}
      </Box>
    </Box>
  );
}

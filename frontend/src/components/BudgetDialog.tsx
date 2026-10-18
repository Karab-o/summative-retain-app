import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useSnackbar } from 'notistack';
import { useState, type FormEvent } from 'react';
import { getErrorMessage } from '../api/client';
import { useSaveBudgetMutation } from '../store/api';
import { CURRENCY, currentMonthKey, formatMonth } from '../utils/format';

interface BudgetDialogProps {
  open: boolean;
  onClose: () => void;
  /** When set, the month is fixed; otherwise the user picks one. */
  month?: string;
  initialAmount?: number | null;
}

export default function BudgetDialog({ open, onClose, month, initialAmount }: BudgetDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      {open && <BudgetForm onClose={onClose} fixedMonth={month} initialAmount={initialAmount} />}
    </Dialog>
  );
}

function BudgetForm({
  onClose,
  fixedMonth,
  initialAmount,
}: {
  onClose: () => void;
  fixedMonth?: string;
  initialAmount?: number | null;
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [saveBudget, { isLoading, error }] = useSaveBudgetMutation();
  const [month, setMonth] = useState(fixedMonth ?? currentMonthKey());
  const [amount, setAmount] = useState(initialAmount != null ? String(initialAmount) : '');
  const [touched, setTouched] = useState(false);

  const value = Number(amount);
  const amountError =
    amount.trim() === '' ? 'Enter a budget amount' : !Number.isFinite(value) || value < 0 ? 'Enter a positive number' : '';
  const monthError = /^\d{4}-\d{2}$/.test(month) ? '' : 'Choose a month';

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (amountError || monthError) return;
    try {
      await saveBudget({ month, amount: value }).unwrap();
      enqueueSnackbar(`Budget for ${formatMonth(month)} saved`, { variant: 'success' });
      onClose();
    } catch {
      // Shown in the alert below.
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>{fixedMonth ? `Budget for ${formatMonth(fixedMonth)}` : 'Set monthly budget'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{getErrorMessage(error)}</Alert>}
          {!fixedMonth && (
            <TextField
              label="Month"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              error={touched && Boolean(monthError)}
              helperText={touched && monthError}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          )}
          <TextField
            label="Budget amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={touched && Boolean(amountError)}
            helperText={(touched && amountError) || 'The most you plan to spend this month'}
            autoFocus
            required
            slotProps={{
              input: { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> },
              htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={isLoading}>
          Save budget
        </Button>
      </DialogActions>
    </form>
  );
}

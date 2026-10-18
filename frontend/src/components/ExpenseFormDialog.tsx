import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { useState, type FormEvent } from 'react';
import { getErrorMessage, getFieldErrors } from '../api/client';
import type { Expense, ExpenseInput, PaymentMethod } from '../api/types';
import { useCreateExpenseMutation, useGetCategoriesQuery, useUpdateExpenseMutation } from '../store/api';
import { CURRENCY, PAYMENT_METHODS, toDateInput, todayKey } from '../utils/format';

interface ExpenseFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** The expense to edit; omit to create a new one. */
  expense?: Expense | null;
}

export default function ExpenseFormDialog({ open, onClose, expense }: ExpenseFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      {/* Mounting the form only while open gives it fresh state every time. */}
      {open && <ExpenseForm expense={expense ?? null} onClose={onClose} />}
    </Dialog>
  );
}

interface FormState {
  title: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: PaymentMethod | '';
  notes: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  const amount = Number(form.amount);

  if (!form.title.trim()) errors.title = 'Title is required';
  else if (form.title.trim().length > 100) errors.title = 'Title must be at most 100 characters';

  if (form.amount.trim() === '') errors.amount = 'Amount is required';
  else if (!Number.isFinite(amount) || amount <= 0) errors.amount = 'Amount must be greater than 0';
  else if (amount > 1_000_000_000) errors.amount = 'Amount is too large';

  if (!form.date) errors.date = 'Date is required';
  if (!form.paymentMethod) errors.paymentMethod = 'Select a payment method';
  if (form.notes.length > 500) errors.notes = 'Notes must be at most 500 characters';
  return errors;
}

function ExpenseForm({ expense, onClose }: { expense: Expense | null; onClose: () => void }) {
  const isEdit = Boolean(expense);
  const { enqueueSnackbar } = useSnackbar();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const [createExpense, createState] = useCreateExpenseMutation();
  const [updateExpense, updateState] = useUpdateExpenseMutation();
  const saving = createState.isLoading || updateState.isLoading;

  const [form, setForm] = useState<FormState>(() => ({
    title: expense?.title ?? '',
    amount: expense ? String(expense.amount) : '',
    category: expense?.category?.id ?? '',
    date: expense ? toDateInput(expense.date) : todayKey(),
    paymentMethod: expense?.paymentMethod ?? '',
    notes: expense?.notes ?? '',
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Until the user picks a category, show the default "Uncategorized" one as selected.
  const defaultCategoryId = categories.find((c) => c.isDefault)?.id ?? '';
  const categoryValue = categories.some((c) => c.id === form.category) ? form.category : defaultCategoryId;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload: ExpenseInput = {
      title: form.title.trim(),
      amount: Math.round(Number(form.amount) * 100) / 100,
      category: categoryValue || null,
      date: form.date,
      paymentMethod: form.paymentMethod as PaymentMethod,
      notes: form.notes.trim(),
    };

    setSubmitError(null);
    try {
      if (expense) await updateExpense({ id: expense.id, data: payload }).unwrap();
      else await createExpense(payload).unwrap();
      enqueueSnackbar(isEdit ? 'Expense updated' : 'Expense added', { variant: 'success' });
      onClose();
    } catch (error) {
      setErrors(getFieldErrors(error));
      setSubmitError(getErrorMessage(error, 'Could not save the expense'));
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'contents' }}>
      <DialogTitle>{isEdit ? 'Edit expense' : 'Add expense'}</DialogTitle>
      <DialogContent>
        {submitError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {submitError}
          </Alert>
        )}
        <Grid container spacing={2} sx={{ pt: 1 }}>
          <Grid size={12}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              error={Boolean(errors.title)}
              helperText={errors.title}
              placeholder="e.g. Weekly groceries"
              autoFocus
              required
              slotProps={{ htmlInput: { maxLength: 100 } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Amount"
              type="number"
              value={form.amount}
              onChange={(e) => update('amount', e.target.value)}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
              required
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> },
                htmlInput: { min: 0.01, step: '0.01', inputMode: 'decimal' },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Date"
              type="date"
              value={form.date}
              onChange={(e) => update('date', e.target.value)}
              error={Boolean(errors.date)}
              helperText={errors.date}
              required
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Category"
              value={categoryValue}
              onChange={(e) => update('category', e.target.value)}
              error={Boolean(errors.category)}
              helperText={errors.category}
              disabled={categoriesLoading}
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  <Box component="span" sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color, mr: 1.5, flexShrink: 0 }} />
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Payment method"
              value={form.paymentMethod}
              onChange={(e) => update('paymentMethod', e.target.value as PaymentMethod)}
              error={Boolean(errors.paymentMethod)}
              helperText={errors.paymentMethod}
              required
            >
              {PAYMENT_METHODS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={12}>
            <TextField
              label="Notes"
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              error={Boolean(errors.notes)}
              helperText={errors.notes ?? `${form.notes.length}/500`}
              multiline
              minRows={2}
              maxRows={6}
              placeholder="Optional details"
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={saving}>
          {isEdit ? 'Save changes' : 'Add expense'}
        </Button>
      </DialogActions>
    </Box>
  );
}

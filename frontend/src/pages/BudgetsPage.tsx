import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { getErrorMessage } from '../api/client';
import type { BudgetSummary } from '../api/types';
import BudgetDialog from '../components/BudgetDialog';
import BudgetProgress from '../components/BudgetProgress';
import ConfirmDialog from '../components/ConfirmDialog';
import { EmptyState, LoadingState, QueryError } from '../components/Feedback';
import PageHeader from '../components/PageHeader';
import { useDeleteBudgetMutation, useGetBudgetQuery, useGetBudgetsQuery } from '../store/api';
import { currentMonthKey, formatMoney, formatMonth } from '../utils/format';

interface DialogState {
  open: boolean;
  month?: string;
  amount?: number | null;
}

export default function BudgetsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const thisMonth = currentMonthKey();
  const current = useGetBudgetQuery(thisMonth);
  const history = useGetBudgetsQuery();
  const [deleteBudget, { isLoading: deleting }] = useDeleteBudgetMutation();

  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [toDelete, setToDelete] = useState<BudgetSummary | null>(null);

  const openEditor = (month?: string, amount?: number | null) => setDialog({ open: true, month, amount });

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteBudget(toDelete.month).unwrap();
      enqueueSnackbar(`Budget for ${formatMonth(toDelete.month)} removed`, { variant: 'success' });
      setToDelete(null);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Could not remove the budget'), { variant: 'error' });
    }
  }

  const budgetActions = (summary: BudgetSummary) => (
    <Stack direction="row">
      <Tooltip title="Edit budget">
        <IconButton aria-label={`Edit budget for ${formatMonth(summary.month)}`} onClick={() => openEditor(summary.month, summary.amount)}>
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove budget">
        <IconButton aria-label={`Remove budget for ${formatMonth(summary.month)}`} onClick={() => setToDelete(summary)}>
          <DeleteOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Stack>
  );

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Set a spending limit for each month and see how you're tracking against it."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openEditor()}>
            Set a budget
          </Button>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="This month"
          subheader={formatMonth(thisMonth)}
          action={current.data && current.data.amount !== null && budgetActions(current.data)}
        />
        <CardContent sx={{ pt: 0 }}>
          {current.isLoading ? (
            <LoadingState minHeight={100} />
          ) : current.error || !current.data ? (
            <QueryError error={current.error} onRetry={current.refetch} />
          ) : current.data.amount === null ? (
            <EmptyState
              icon={<AccountBalanceWalletOutlinedIcon />}
              minHeight={140}
              title="No budget for this month"
              description={`You've spent ${formatMoney(current.data.spent)} so far. Set a limit to get warned before you overspend.`}
              action={
                <Button variant="contained" onClick={() => openEditor(thisMonth)}>
                  Set budget for {formatMonth(thisMonth)}
                </Button>
              }
            />
          ) : (
            <BudgetProgress summary={current.data} />
          )}
        </CardContent>
      </Card>

      <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
        Budget history
      </Typography>
      {history.isLoading ? (
        <LoadingState />
      ) : history.error || !history.data ? (
        <QueryError error={history.error} onRetry={history.refetch} />
      ) : history.data.length === 0 ? (
        <Card>
          <EmptyState title="No budgets yet" description="Budgets you set for any month will be listed here." />
        </Card>
      ) : (
        <Grid container spacing={2}>
          {history.data.map((summary) => (
            <Grid key={summary.month} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader
                  title={formatMonth(summary.month)}
                  slotProps={{ title: { variant: 'subtitle1' } }}
                  subheader={summary.month === thisMonth ? 'Current month' : summary.month > thisMonth ? 'Upcoming' : 'Past month'}
                  action={budgetActions(summary)}
                />
                <CardContent sx={{ pt: 0 }}>
                  <BudgetProgress summary={summary} dense />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <BudgetDialog open={dialog.open} month={dialog.month} initialAmount={dialog.amount} onClose={() => setDialog({ open: false })} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Remove budget?"
        message={toDelete && `The ${formatMoney(toDelete.amount ?? 0)} budget for ${formatMonth(toDelete.month)} will be removed. Your expenses are not affected.`}
        confirmLabel="Remove"
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

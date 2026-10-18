import AddIcon from '@mui/icons-material/Add';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import FunctionsIcon from '@mui/icons-material/Functions';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PieChartOutlineIcon from '@mui/icons-material/PieChartOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import type { BudgetSummary, Dashboard } from '../api/types';
import BudgetDialog from '../components/BudgetDialog';
import BudgetProgress from '../components/BudgetProgress';
import CategoryChip from '../components/CategoryChip';
import CategoryDonutChart from '../components/charts/CategoryDonutChart';
import DailySpendingChart from '../components/charts/DailySpendingChart';
import MonthlyTrendChart from '../components/charts/MonthlyTrendChart';
import ExpenseFormDialog from '../components/ExpenseFormDialog';
import { EmptyState, LoadingState, QueryError } from '../components/Feedback';
import MonthSwitcher from '../components/MonthSwitcher';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { useGetDashboardQuery } from '../store/api';
import { useCurrentUser } from '../store/hooks';
import { currentMonthKey, formatDate, formatMoney, formatMonth, formatPercent, paymentLabel } from '../utils/format';

export default function DashboardPage() {
  const user = useCurrentUser();
  const thisMonth = currentMonthKey();
  const [month, setMonth] = useState(thisMonth);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const { data, isLoading, isFetching, error, refetch } = useGetDashboardQuery(month);

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <>
      <PageHeader
        title={`Hi, ${firstName}`}
        subtitle={`Here's how your spending looks for ${formatMonth(month)}.`}
        actions={
          <>
            <MonthSwitcher month={month} onChange={setMonth} max={thisMonth} />
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setExpenseOpen(true)}>
              Add expense
            </Button>
          </>
        }
      />

      {/* Keeps the layout steady while switching months. */}
      <Box sx={{ height: 4, mb: 2 }}>{isFetching && !isLoading && <LinearProgress sx={{ borderRadius: 2 }} />}</Box>

      {isLoading ? (
        <LoadingState minHeight="50vh" />
      ) : error || !data ? (
        <QueryError error={error} onRetry={refetch} />
      ) : (
        <DashboardContent data={data} onSetBudget={() => setBudgetOpen(true)} onAddExpense={() => setExpenseOpen(true)} />
      )}

      <ExpenseFormDialog open={expenseOpen} onClose={() => setExpenseOpen(false)} />
      <BudgetDialog
        open={budgetOpen}
        onClose={() => setBudgetOpen(false)}
        month={month}
        initialAmount={data?.month === month ? data.budget.amount : null}
      />
    </>
  );
}

function BudgetAlert({ budget, onSetBudget }: { budget: BudgetSummary; onSetBudget: () => void }) {
  const setBudgetAction = (
    <Button color="inherit" size="small" onClick={onSetBudget}>
      {budget.status === 'no_budget' ? 'Set budget' : 'Adjust'}
    </Button>
  );

  switch (budget.status) {
    case 'over':
      return (
        <Alert severity="error" action={setBudgetAction}>
          You've gone over your {formatMonth(budget.month)} budget by <strong>{formatMoney(-(budget.remaining ?? 0))}</strong>.
        </Alert>
      );
    case 'approaching':
      return (
        <Alert severity="warning" action={setBudgetAction}>
          You've used <strong>{formatPercent(budget.percentUsed ?? 0)}</strong> of your budget, with{' '}
          {formatMoney(budget.remaining ?? 0)} left for the month.
        </Alert>
      );
    case 'no_budget':
      return (
        <Alert severity="info" action={setBudgetAction}>
          You haven't set a budget for {formatMonth(budget.month)} yet. A monthly limit helps you spot overspending early.
        </Alert>
      );
    default:
      return null;
  }
}

function DashboardContent({
  data,
  onSetBudget,
  onAddExpense,
}: {
  data: Dashboard;
  onSetBudget: () => void;
  onAddExpense: () => void;
}) {
  const { budget } = data;
  const hasSpending = data.expenseCount > 0;

  return (
    <Stack spacing={3}>
      <BudgetAlert budget={budget} onSetBudget={onSetBudget} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Total spent" value={formatMoney(data.totalSpent)} icon={<PaymentsOutlinedIcon />} caption={formatMonth(data.month)} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label={budget.remaining !== null && budget.remaining < 0 ? 'Over budget by' : 'Budget remaining'}
            value={budget.remaining === null ? '—' : formatMoney(Math.abs(budget.remaining))}
            icon={<AccountBalanceWalletOutlinedIcon />}
            tone={budget.status === 'over' ? 'error' : budget.status === 'approaching' ? 'warning' : 'success'}
            caption={budget.amount === null ? 'No budget set' : `Budget: ${formatMoney(budget.amount)}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Expenses"
            value={data.expenseCount}
            icon={<ReceiptLongOutlinedIcon />}
            tone="secondary"
            caption="Recorded this month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard label="Average expense" value={formatMoney(data.averageExpense)} icon={<FunctionsIcon />} tone="info" caption="Per transaction" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader
              title="Monthly budget"
              subheader={formatMonth(data.month)}
              action={
                <Button size="small" onClick={onSetBudget}>
                  {budget.amount === null ? 'Set budget' : 'Edit'}
                </Button>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <BudgetProgress summary={budget} />
              {data.highestExpense && (
                <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
                  <Typography variant="overline" color="text.secondary">
                    Highest expense
                  </Typography>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="subtitle1" noWrap sx={{ minWidth: 0 }}>
                      {data.highestExpense.title}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatMoney(data.highestExpense.amount)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
                    <CategoryChip category={data.highestExpense.category} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(data.highestExpense.date)} · {paymentLabel(data.highestExpense.paymentMethod)}
                    </Typography>
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Spending by category" subheader="Where your money went this month" />
            <CardContent sx={{ pt: 0 }}>
              {hasSpending ? (
                <CategoryDonutChart data={data.spendingByCategory} total={data.totalSpent} />
              ) : (
                <EmptyState
                  icon={<PieChartOutlineIcon />}
                  title="No expenses this month"
                  description="Add an expense to see how your spending breaks down."
                  action={
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={onAddExpense}>
                      Add expense
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Daily spending" subheader={formatMonth(data.month)} />
            <CardContent sx={{ pt: 0 }}>
              <DailySpendingChart data={data.dailySpending} month={data.month} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="6-month trend" subheader="Total spent per month" avatar={<TrendingUpIcon color="primary" />} />
            <CardContent sx={{ pt: 0 }}>
              <MonthlyTrendChart data={data.monthlyTrend} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader
          title="Recent expenses"
          subheader="Your latest entries across all months"
          action={
            <Button size="small" component={RouterLink} to="/expenses">
              View all
            </Button>
          }
        />
        {data.recentExpenses.length === 0 ? (
          <EmptyState title="No expenses yet" description="Your latest expenses will appear here." minHeight={140} />
        ) : (
          <List disablePadding>
            {data.recentExpenses.map((expense) => (
              <ListItem
                key={expense.id}
                divider
                secondaryAction={
                  <Typography variant="body2" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatMoney(expense.amount)}
                  </Typography>
                }
                sx={{ pr: 14 }}
              >
                <ListItemText
                  primary={expense.title}
                  secondary={`${formatDate(expense.date)} · ${expense.category?.name ?? 'Uncategorized'} · ${paymentLabel(expense.paymentMethod)}`}
                  slotProps={{ primary: { noWrap: true }, secondary: { noWrap: true } }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </Stack>
  );
}

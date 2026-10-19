import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router';
import type { CategoryUsage } from '../../api/types';
import CategoryChip from '../../components/CategoryChip';
import CategoryBarChart from '../../components/charts/CategoryBarChart';
import { EmptyState, LoadingState, QueryError } from '../../components/Feedback';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import { useGetAdminInsightsQuery } from '../../store/api';
import { formatDate, formatDateTime, formatMoney, formatMonth } from '../../utils/format';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default function AdminInsightsPage() {
  const { data, isLoading, isFetching, error, refetch } = useGetAdminInsightsQuery();

  return (
    <>
      <PageHeader
        title="Platform insights"
        subtitle="How people are using Retain across all accounts."
        actions={
          <Button variant="outlined" onClick={refetch} loading={isFetching && !isLoading}>
            Refresh
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState minHeight="50vh" />
      ) : error || !data ? (
        <QueryError error={error} onRetry={refetch} />
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Registered users"
                value={data.totalUsers}
                icon={<PeopleAltOutlinedIcon />}
                caption={`${plural(data.usersByRole.user ?? 0, 'user')} · ${plural(data.usersByRole.admin ?? 0, 'admin')}`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard label="Total expenses" value={data.totalExpenses.toLocaleString()} icon={<ReceiptLongOutlinedIcon />} tone="secondary" caption="All time, all users" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard label="Total value recorded" value={formatMoney(data.totalValue)} icon={<PaymentsOutlinedIcon />} tone="success" caption="Sum of every expense" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
              <StatCard
                label="Recorded this month"
                value={data.expensesThisMonth.toLocaleString()}
                icon={<EventNoteOutlinedIcon />}
                tone="info"
                caption={`Expenses created in ${formatMonth(data.month)}`}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Spending per category" subheader="Total value recorded in each category" />
                <CardContent sx={{ pt: 0 }}>
                  {data.totalExpenses === 0 ? (
                    <EmptyState title="No expenses recorded yet" />
                  ) : (
                    <CategoryBarChart data={data.spendingPerCategory} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Stack spacing={2} sx={{ height: '100%' }}>
                <RankingCard title="Most used categories" subtitle="By number of expenses" rows={data.topCategories} />
                <RankingCard title="Least used categories" subtitle="Candidates to merge or remove" rows={data.bottomCategories} />
              </Stack>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Recent activity" subheader="Latest expenses recorded on the platform" />
                {data.recentExpenses.length === 0 ? (
                  <EmptyState title="No expenses yet" minHeight={140} />
                ) : (
                  <TableContainer>
                    <Table size="small" aria-label="Recent expenses">
                      <TableHead>
                        <TableRow>
                          <TableCell>User</TableCell>
                          <TableCell>Expense</TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data.recentExpenses.map((expense) => (
                          <TableRow key={expense.id} hover>
                            <TableCell sx={{ maxWidth: 160 }}>
                              <Typography variant="body2" noWrap>
                                {expense.user?.name ?? 'Deleted user'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap component="div">
                                {formatDateTime(expense.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220 }}>
                              <Typography variant="body2" noWrap>
                                {expense.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(expense.date)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              <CategoryChip category={expense.category} />
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                              {formatMoney(expense.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Card sx={{ height: '100%' }}>
                <CardHeader title="Newest members" subheader="Most recent sign-ups" />
                <List dense disablePadding>
                  {data.recentUsers.map((user) => (
                    <ListItem key={user.id} divider>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: user.role === 'admin' ? 'secondary.main' : 'primary.main', width: 34, height: 34, fontSize: 14 }}>
                          {user.name[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                              {user.name}
                            </Typography>
                            {user.role === 'admin' && <Chip label="Admin" size="small" color="secondary" />}
                          </Stack>
                        }
                        secondary={`${user.email} · joined ${formatDateTime(user.createdAt)}`}
                        slotProps={{ secondary: { noWrap: true } }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  );
}

function RankingCard({ title, subtitle, rows }: { title: string; subtitle: string; rows: CategoryUsage[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <Card sx={{ flex: 1 }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        slotProps={{ title: { variant: 'subtitle1' } }}
        action={
          <Button size="small" component={RouterLink} to="/admin/categories" startIcon={<CategoryOutlinedIcon />}>
            Manage
          </Button>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Stack spacing={1.5}>
          {rows.map((row, index) => (
            <Box key={row.categoryId}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ width: 16 }}>
                  {index + 1}
                </Typography>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {row.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                  {row.count} {row.count === 1 ? 'expense' : 'expenses'}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={(row.count / max) * 100}
                sx={{ ml: 3, height: 4, borderRadius: 2, '& .MuiLinearProgress-bar': { bgcolor: row.color } }}
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

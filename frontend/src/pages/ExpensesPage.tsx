import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FilterAltOffOutlinedIcon from '@mui/icons-material/FilterAltOffOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Collapse from '@mui/material/Collapse';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { getErrorMessage } from '../api/client';
import type { Expense, ExpenseQuery, ExpenseSortField, PaymentMethod, SortOrder } from '../api/types';
import CategoryChip from '../components/CategoryChip';
import ConfirmDialog from '../components/ConfirmDialog';
import ExpenseFormDialog from '../components/ExpenseFormDialog';
import { EmptyState, LoadingState, QueryError } from '../components/Feedback';
import PageHeader from '../components/PageHeader';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useDeleteExpenseMutation, useGetCategoriesQuery, useGetExpensesQuery } from '../store/api';
import { CURRENCY, PAYMENT_METHODS, formatDate, formatMoney, paymentLabel } from '../utils/format';

const PAGE_SIZES = [10, 25, 50];
const SORT_FIELDS: ExpenseSortField[] = ['date', 'amount', 'title', 'createdAt'];
const ADVANCED_FILTERS = ['startDate', 'endDate', 'minAmount', 'maxAmount'] as const;
const ALL_FILTERS = ['search', 'category', 'paymentMethod', ...ADVANCED_FILTERS] as const;

/** Reads the expense query from the URL so filters survive refreshes and can be shared. */
function useExpenseQuery() {
  const [params, setParams] = useSearchParams();

  const query = useMemo<ExpenseQuery>(() => {
    const num = (key: string) => {
      const raw = params.get(key);
      const value = raw === null || raw === '' ? NaN : Number(raw);
      return Number.isFinite(value) ? value : undefined;
    };
    const sortBy = params.get('sortBy') as ExpenseSortField | null;
    const limit = num('limit');
    return {
      search: params.get('search') || undefined,
      category: params.get('category') || undefined,
      paymentMethod: (params.get('paymentMethod') as PaymentMethod | null) || undefined,
      startDate: params.get('startDate') || undefined,
      endDate: params.get('endDate') || undefined,
      minAmount: num('minAmount'),
      maxAmount: num('maxAmount'),
      sortBy: sortBy && SORT_FIELDS.includes(sortBy) ? sortBy : 'date',
      order: params.get('order') === 'asc' ? 'asc' : 'desc',
      page: Math.max(1, num('page') ?? 1),
      limit: limit && PAGE_SIZES.includes(limit) ? limit : PAGE_SIZES[0],
    };
  }, [params]);

  /** Updates some parameters. Changing anything but the page resets to page 1. */
  const update = (changes: Record<string, string | number | undefined>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value === undefined || value === '') next.delete(key);
          else next.set(key, String(value));
        }
        if (!('page' in changes)) next.delete('page');
        return next;
      },
      { replace: true },
    );
  };

  const clearFilters = () => update(Object.fromEntries(ALL_FILTERS.map((key) => [key, undefined])));

  return { query, update, clearFilters };
}

export default function ExpensesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { query, update, clearFilters } = useExpenseQuery();
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data, isLoading, isFetching, error, refetch } = useGetExpensesQuery(query);
  const [deleteExpense, { isLoading: deleting }] = useDeleteExpenseMutation();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);

  // Search is typed locally and pushed to the URL once the user pauses.
  const [search, setSearch] = useState(query.search ?? '');
  const debouncedSearch = useDebouncedValue(search.trim(), 400);
  useEffect(() => {
    if (debouncedSearch !== (query.search ?? '')) update({ search: debouncedSearch });
  }, [debouncedSearch]);

  const advancedCount = ADVANCED_FILTERS.filter((key) => query[key] !== undefined).length;
  const [showAdvanced, setShowAdvanced] = useState(advancedCount > 0);
  const hasFilters = ALL_FILTERS.some((key) => query[key] !== undefined);

  // If a deletion empties the last page, step back to the previous one.
  useEffect(() => {
    if (data && data.data.length === 0 && (query.page ?? 1) > 1 && (query.page ?? 1) > data.pagination.totalPages) {
      update({ page: data.pagination.totalPages });
    }
  }, [data, query.page]);

  const handleSort = (field: ExpenseSortField) => {
    const order: SortOrder = query.sortBy === field && query.order === 'desc' ? 'asc' : 'desc';
    update({ sortBy: field, order });
  };

  const handleClear = () => {
    setSearch('');
    clearFilters();
  };

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deleteExpense(toDelete.id).unwrap();
      enqueueSnackbar(`Deleted "${toDelete.title}"`, { variant: 'success' });
      setToDelete(null);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Could not delete the expense'), { variant: 'error' });
    }
  }

  const sortHeader = (field: ExpenseSortField, label: string, align: 'left' | 'right' = 'left') => (
    <TableSortLabel
      active={query.sortBy === field}
      direction={query.sortBy === field ? query.order : 'desc'}
      onClick={() => handleSort(field)}
      sx={align === 'right' ? { flexDirection: 'row-reverse' } : undefined}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <>
      <PageHeader
        title="Expenses"
        subtitle="Search, filter and manage everything you've spent."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            Add expense
          </Button>
        }
      />

      <Card sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              size="small"
              placeholder="Search title or notes"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                },
                htmlInput: { 'aria-label': 'Search expenses', maxLength: 100 },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              size="small"
              label="Category"
              value={query.category ?? ''}
              onChange={(e) => update({ category: e.target.value })}
            >
              <MenuItem value="">All categories</MenuItem>
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              size="small"
              label="Payment method"
              value={query.paymentMethod ?? ''}
              onChange={(e) => update({ paymentMethod: e.target.value })}
            >
              <MenuItem value="">All methods</MenuItem>
              {PAYMENT_METHODS.map((p) => (
                <MenuItem key={p.value} value={p.value}>
                  {p.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
              <Tooltip title={showAdvanced ? 'Hide date & amount filters' : 'Date & amount filters'}>
                <IconButton aria-label="Toggle date and amount filters" aria-expanded={showAdvanced} onClick={() => setShowAdvanced((v) => !v)}>
                  <Badge color="primary" badgeContent={advancedCount}>
                    <TuneIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear all filters">
                <span>
                  <IconButton aria-label="Clear all filters" onClick={handleClear} disabled={!hasFilters && !search}>
                    <FilterAltOffOutlinedIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Grid>
        </Grid>
        <Collapse in={showAdvanced} unmountOnExit>
          <Grid container spacing={2} sx={{ mt: 0.5, pt: 2 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                size="small"
                type="date"
                label="From"
                value={query.startDate ?? ''}
                onChange={(e) => update({ startDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: query.endDate } }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <TextField
                size="small"
                type="date"
                label="To"
                value={query.endDate ?? ''}
                onChange={(e) => update({ endDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: query.startDate } }}
              />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <AmountFilter label="Min amount" value={query.minAmount} onCommit={(v) => update({ minAmount: v })} />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <AmountFilter label="Max amount" value={query.maxAmount} onCommit={(v) => update({ maxAmount: v })} />
            </Grid>
          </Grid>
        </Collapse>
      </Card>

      <Card>
        <Box sx={{ height: 4 }}>{isFetching && !isLoading && <LinearProgress />}</Box>
        {data && (
          <Stack direction="row" sx={{ px: 2, pt: 1.5, pb: 1, justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {data.pagination.total} {data.pagination.total === 1 ? 'expense' : 'expenses'}
              {hasFilters && (data.pagination.total === 1 ? ' matches your filters' : ' match your filters')}
            </Typography>
            <Typography variant="body2">
              Total: <strong>{formatMoney(data.totalAmount)}</strong>
            </Typography>
          </Stack>
        )}

        {isLoading ? (
          <LoadingState />
        ) : error || !data ? (
          <Box sx={{ p: 2 }}>
            <QueryError error={error} onRetry={refetch} />
          </Box>
        ) : data.data.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={<SearchIcon />}
              title="No matching expenses"
              description="Try a different search or clear some filters."
              action={<Button onClick={handleClear}>Clear filters</Button>}
            />
          ) : (
            <EmptyState
              icon={<ReceiptLongOutlinedIcon />}
              title="No expenses yet"
              description="Record your first expense to start tracking where your money goes."
              action={
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
                  Add expense
                </Button>
              }
            />
          )
        ) : (
          <>
            <TableContainer>
              <Table size="medium" aria-label="Expenses">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 130 }}>{sortHeader('date', 'Date')}</TableCell>
                    <TableCell>{sortHeader('title', 'Title')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Category</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Payment</TableCell>
                    <TableCell align="right">{sortHeader('amount', 'Amount', 'right')}</TableCell>
                    <TableCell align="right" sx={{ width: 104 }}>
                      <Box component="span" sx={visuallyHidden}>
                        Actions
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                          {expense.title}
                        </Typography>
                        {expense.notes && (
                          <Typography variant="caption" color="text.secondary" noWrap component="div">
                            {expense.notes}
                          </Typography>
                        )}
                        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                          <CategoryChip category={expense.category} />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <CategoryChip category={expense.category} />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, whiteSpace: 'nowrap' }}>
                        {paymentLabel(expense.paymentMethod)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {formatMoney(expense.amount)}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            aria-label={`Edit ${expense.title}`}
                            onClick={() => {
                              setEditing(expense);
                              setFormOpen(true);
                            }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" aria-label={`Delete ${expense.title}`} onClick={() => setToDelete(expense)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={data.pagination.total}
              page={Math.min((query.page ?? 1) - 1, data.pagination.totalPages - 1)}
              rowsPerPage={query.limit ?? PAGE_SIZES[0]}
              rowsPerPageOptions={PAGE_SIZES}
              onPageChange={(_e, page) => update({ page: page + 1 })}
              onRowsPerPageChange={(e) => update({ limit: Number(e.target.value) })}
            />
          </>
        )}
      </Card>

      <ExpenseFormDialog open={formOpen} expense={editing} onClose={() => setFormOpen(false)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete expense?"
        message={
          toDelete && (
            <>
              <strong>{toDelete.title}</strong> ({formatMoney(toDelete.amount)} on {formatDate(toDelete.date)}) will be permanently
              removed.
            </>
          )
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

const visuallyHidden = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  height: 1,
  margin: -1,
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  width: 1,
  whiteSpace: 'nowrap',
} as const;

/** Number filter that only updates the URL when the user leaves the field or presses Enter. */
function AmountFilter({ label, value, onCommit }: { label: string; value?: number; onCommit: (value?: number) => void }) {
  const [text, setText] = useState(value?.toString() ?? '');
  useEffect(() => setText(value?.toString() ?? ''), [value]);

  const commit = () => {
    const parsed = text.trim() === '' ? undefined : Number(text);
    if (parsed !== undefined && (!Number.isFinite(parsed) || parsed < 0)) {
      setText(value?.toString() ?? '');
      return;
    }
    if (parsed !== value) onCommit(parsed);
  };

  return (
    <TextField
      size="small"
      type="number"
      label={label}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && commit()}
      slotProps={{
        input: { startAdornment: <InputAdornment position="start">{CURRENCY}</InputAdornment> },
        htmlInput: { min: 0, step: '0.01', inputMode: 'decimal' },
      }}
    />
  );
}

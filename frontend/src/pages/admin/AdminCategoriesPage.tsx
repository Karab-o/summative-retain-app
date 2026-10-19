import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import type { CategoryInput, CategoryWithStats } from '../../api/types';
import ConfirmDialog from '../../components/ConfirmDialog';
import { LoadingState, QueryError } from '../../components/Feedback';
import PageHeader from '../../components/PageHeader';
import {
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useGetCategoryStatsQuery,
  useUpdateCategoryMutation,
} from '../../store/api';
import { formatMoney } from '../../utils/format';

const SWATCHES = ['#ef6c00', '#1e88e5', '#6d4c41', '#00897b', '#8e24aa', '#d81b60', '#43a047', '#3949ab', '#00acc1', '#f9a825', '#546e7a'];

export default function AdminCategoriesPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data, isLoading, error, refetch } = useGetCategoryStatsQuery();
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation();

  const [editor, setEditor] = useState<{ open: boolean; category: CategoryWithStats | null }>({ open: false, category: null });
  const [toDelete, setToDelete] = useState<CategoryWithStats | null>(null);

  const defaultCategory = data?.find((c) => c.isDefault);

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      const result = await deleteCategory(toDelete.id).unwrap();
      enqueueSnackbar(result.message, { variant: 'success' });
      setToDelete(null);
    } catch (err) {
      enqueueSnackbar(getErrorMessage(err, 'Could not delete the category'), { variant: 'error' });
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Categories are shared by every user when they record expenses."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setEditor({ open: true, category: null })}>
            New category
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <LoadingState />
        ) : error || !data ? (
          <Box sx={{ p: 2 }}>
            <QueryError error={error} onRetry={refetch} />
          </Box>
        ) : (
          <TableContainer>
            <Table aria-label="Categories">
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                  <TableCell align="right">Expenses</TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    Total value
                  </TableCell>
                  <TableCell align="right" sx={{ width: 104 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: category.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {category.name}
                        </Typography>
                        {category.isDefault && <Chip size="small" label="Default" icon={<LockOutlinedIcon />} />}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: 'text.secondary', maxWidth: 360 }}>
                      <Typography variant="body2" noWrap>
                        {category.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {category.expenseCount}
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {formatMoney(category.totalAmount)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" aria-label={`Edit ${category.name}`} onClick={() => setEditor({ open: true, category })}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={category.isDefault ? 'The default category cannot be deleted' : 'Delete'}>
                        <span>
                          <IconButton
                            size="small"
                            aria-label={`Delete ${category.name}`}
                            disabled={category.isDefault}
                            onClick={() => setToDelete(category)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={editor.open} onClose={() => setEditor((s) => ({ ...s, open: false }))} maxWidth="xs" fullWidth>
        {editor.open && <CategoryForm category={editor.category} onClose={() => setEditor((s) => ({ ...s, open: false }))} />}
      </Dialog>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete "${toDelete?.name ?? ''}"?`}
        message={
          toDelete &&
          (toDelete.expenseCount > 0 ? (
            <>
              <strong>{toDelete.expenseCount}</strong> {toDelete.expenseCount === 1 ? 'expense uses' : 'expenses use'} this category.
              {' '}They will be moved to <strong>{defaultCategory?.name ?? 'Uncategorized'}</strong>, so no one loses any data.
            </>
          ) : (
            'No expenses use this category, so it can be removed safely.'
          ))
        }
        loading={deleting}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}

function CategoryForm({ category, onClose }: { category: CategoryWithStats | null; onClose: () => void }) {
  const { enqueueSnackbar } = useSnackbar();
  const [createCategory, createState] = useCreateCategoryMutation();
  const [updateCategory, updateState] = useUpdateCategoryMutation();
  const saving = createState.isLoading || updateState.isLoading;
  const isDefault = Boolean(category?.isDefault);

  const [form, setForm] = useState<CategoryInput>({
    name: category?.name ?? '',
    color: category?.color ?? SWATCHES[0],
    description: category?.description ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CategoryInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    const name = form.name.trim();
    if (name.length < 2) found.name = 'Name must be at least 2 characters';
    else if (name.length > 40) found.name = 'Name must be at most 40 characters';
    if (!/^#[0-9a-fA-F]{6}$/.test(form.color)) found.color = 'Pick a valid colour';
    if (form.description.length > 200) found.description = 'Description must be at most 200 characters';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const payload = { name, color: form.color, description: form.description.trim() };
    setSubmitError(null);
    try {
      if (category) await updateCategory({ id: category.id, data: payload }).unwrap();
      else await createCategory(payload).unwrap();
      enqueueSnackbar(category ? `Category "${name}" updated` : `Category "${name}" created`, { variant: 'success' });
      onClose();
    } catch (err) {
      setErrors(getFieldErrors(err));
      setSubmitError(getErrorMessage(err, 'Could not save the category'));
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <DialogTitle>{category ? 'Edit category' : 'New category'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {submitError && <Alert severity="error">{submitError}</Alert>}
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            error={Boolean(errors.name)}
            helperText={errors.name ?? (isDefault ? 'The default category cannot be renamed' : undefined)}
            disabled={isDefault}
            autoFocus={!isDefault}
            required
            slotProps={{ htmlInput: { maxLength: 40 } }}
          />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Colour
            </Typography>
            <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {SWATCHES.map((color) => (
                <Box
                  key={color}
                  component="button"
                  type="button"
                  aria-label={`Use colour ${color}`}
                  aria-pressed={form.color.toLowerCase() === color}
                  onClick={() => setForm((f) => ({ ...f, color }))}
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    bgcolor: color,
                    cursor: 'pointer',
                    border: 2,
                    borderColor: form.color.toLowerCase() === color ? 'text.primary' : 'transparent',
                    outlineOffset: 2,
                  }}
                />
              ))}
              <Tooltip title="Custom colour">
                <Box
                  component="input"
                  type="color"
                  value={form.color}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, color: e.target.value }))}
                  aria-label="Custom colour"
                  sx={{ width: 36, height: 30, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer' }}
                />
              </Tooltip>
            </Stack>
            {errors.color && (
              <Typography variant="caption" color="error">
                {errors.color}
              </Typography>
            )}
          </Box>
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            error={Boolean(errors.description)}
            helperText={errors.description ?? `${form.description.length}/200`}
            multiline
            minRows={2}
            slotProps={{ htmlInput: { maxLength: 200 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" loading={saving}>
          {category ? 'Save changes' : 'Create category'}
        </Button>
      </DialogActions>
    </form>
  );
}

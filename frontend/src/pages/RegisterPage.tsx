import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router';
import { getErrorMessage, getFieldErrors } from '../api/client';
import AuthLayout from '../components/layout/AuthLayout';
import { homePathFor } from '../components/layout/RouteGuards';
import PasswordField from '../components/PasswordField';
import { useRegisterMutation } from '../store/api';
import { credentialsReceived } from '../store/authSlice';
import { useAppDispatch } from '../store/hooks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

function validate(form: FormState) {
  const errors: Partial<Record<keyof FormState, string>> = {};
  const name = form.name.trim();
  if (name.length < 2) errors.name = 'Name must be at least 2 characters';
  else if (name.length > 60) errors.name = 'Name must be at most 60 characters';
  if (!EMAIL_REGEX.test(form.email.trim())) errors.email = 'Enter a valid email address';
  if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
  if (form.confirmPassword !== form.password) errors.confirmPassword = 'Passwords do not match';
  return errors;
}

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [register, { isLoading, error }] = useRegisterMutation();

  const [form, setForm] = useState<FormState>({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    error: Boolean(errors[key]),
    helperText: errors[key],
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const result = await register({ name: form.name.trim(), email: form.email.trim(), password: form.password }).unwrap();
      dispatch(credentialsReceived(result));
      enqueueSnackbar(`Welcome to Retain, ${result.user.name.split(' ')[0]}!`, { variant: 'success' });
      navigate(homePathFor(result.user.role), { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start tracking expenses and set your first budget.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {error && <Alert severity="error">{getErrorMessage(error, 'Sign up failed')}</Alert>}
          <TextField label="Full name" autoComplete="name" autoFocus required {...field('name')} />
          <TextField label="Email" type="email" autoComplete="email" required {...field('email')} />
          <PasswordField
            label="Password"
            autoComplete="new-password"
            required
            {...field('password')}
            helperText={errors.password ?? 'At least 6 characters'}
          />
          <PasswordField label="Confirm password" autoComplete="new-password" required {...field('confirmPassword')} />
          <Button type="submit" variant="contained" size="large" loading={isLoading}>
            Create account
          </Button>
        </Stack>
      </Box>
      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Link component={RouterLink} to="/login" underline="hover">
          Sign in
        </Link>
      </Typography>
    </AuthLayout>
  );
}

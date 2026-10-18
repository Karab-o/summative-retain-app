import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useState, type FormEvent } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router';
import { getErrorMessage } from '../api/client';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordField from '../components/PasswordField';
import { homePathFor } from '../components/layout/RouteGuards';
import { useLoginMutation } from '../store/api';
import { credentialsReceived } from '../store/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { label: 'Demo user', email: 'demo@retain.app', password: 'Demo@123' },
  { label: 'Demo admin', email: 'admin@retain.app', password: 'Admin@123' },
];
const showDemoAccounts = import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = useAppSelector((state) => state.auth.sessionExpired);
  const [login, { isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as { from?: string } | null)?.from;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const found: typeof errors = {};
    if (!EMAIL_REGEX.test(email.trim())) found.email = 'Enter a valid email address';
    if (!password) found.password = 'Password is required';
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const result = await login({ email: email.trim(), password }).unwrap();
      dispatch(credentialsReceived(result));
      navigate(from ?? homePathFor(result.user.role), { replace: true });
    } catch {
      // Shown in the alert below.
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to keep track of your spending.">
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Stack spacing={2}>
          {sessionExpired && !error && <Alert severity="info">Your session has expired. Please sign in again.</Alert>}
          {error && <Alert severity="error">{getErrorMessage(error, 'Sign in failed')}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoFocus
            required
          />
          <PasswordField
            label="Password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password}
            required
          />
          <Button type="submit" variant="contained" size="large" loading={isLoading}>
            Sign in
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
        New to Retain?{' '}
        <Link component={RouterLink} to="/register" underline="hover">
          Create an account
        </Link>
      </Typography>

      {showDemoAccounts && (
        <>
          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Try a demo account
            </Typography>
          </Divider>
          <Stack direction="row" spacing={1}>
            {DEMO_ACCOUNTS.map((account) => (
              <Button
                key={account.email}
                variant="outlined"
                fullWidth
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setErrors({});
                }}
              >
                {account.label}
              </Button>
            ))}
          </Stack>
        </>
      )}
    </AuthLayout>
  );
}

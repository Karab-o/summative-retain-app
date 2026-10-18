import SearchOffIcon from '@mui/icons-material/SearchOff';
import Button from '@mui/material/Button';
import { Link as RouterLink } from 'react-router';
import { EmptyState } from '../components/Feedback';

export default function NotFoundPage() {
  return (
    <EmptyState
      minHeight="60vh"
      icon={<SearchOffIcon />}
      title="Page not found"
      description="The page you're looking for doesn't exist or has moved."
      action={
        <Button variant="contained" component={RouterLink} to="/">
          Back to home
        </Button>
      }
    />
  );
}

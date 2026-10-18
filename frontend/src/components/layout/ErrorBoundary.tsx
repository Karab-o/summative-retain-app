import Button from '@mui/material/Button';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { EmptyState } from '../Feedback';

interface State {
  error: Error | null;
}

/** Catches render errors so one broken screen doesn't blank the whole app. */
export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <EmptyState
          minHeight="60vh"
          title="Something went wrong"
          description="This page hit an unexpected error. Reloading usually fixes it."
          action={
            <Button variant="contained" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          }
        />
      );
    }
    return this.props.children;
  }
}

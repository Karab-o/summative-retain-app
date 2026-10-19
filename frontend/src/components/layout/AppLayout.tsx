import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { useMeQuery } from '../../store/api';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { themeModeChanged } from '../../store/uiSlice';
import { LoadingState } from '../Feedback';
import Brand from './Brand';
import ErrorBoundary from './ErrorBoundary';

const DRAWER_WIDTH = 248;

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const USER_NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <DashboardOutlinedIcon /> },
  { to: '/expenses', label: 'Expenses', icon: <ReceiptLongOutlinedIcon /> },
  { to: '/budgets', label: 'Budgets', icon: <AccountBalanceWalletOutlinedIcon /> },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Insights', icon: <InsightsOutlinedIcon /> },
  { to: '/admin/categories', label: 'Categories', icon: <CategoryOutlinedIcon /> },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const { user, logout, refreshUser } = useAuth();
  const themeMode = useAppSelector((state) => state.ui.themeMode);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  // Re-validate the stored session and pick up any profile/role changes.
  const { data: freshUser } = useMeQuery();
  useEffect(() => {
    if (freshUser) refreshUser(freshUser);
  }, [freshUser, refreshUser]);

  // Close the mobile drawer after navigating.
  useEffect(() => setMobileOpen(false), [location.pathname]);

  if (!user) return null;
  const isAdmin = user.role === 'admin';
  const nav = isAdmin ? ADMIN_NAV : USER_NAV;

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Brand />
      </Toolbar>
      <Divider />
      <List
        component="nav"
        aria-label="Main navigation"
        sx={{ px: 1.5, py: 1 }}
        subheader={<ListSubheader sx={{ bgcolor: 'transparent', lineHeight: '36px' }}>{isAdmin ? 'Administration' : 'Personal finance'}</ListSubheader>}
      >
        {nav.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.active': {
                bgcolor: 'action.selected',
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Retain · spend with intention
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Toolbar>
          <IconButton edge="start" aria-label="Open navigation" onClick={() => setMobileOpen(true)} sx={{ mr: 1, display: { md: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Brand size={28} />
          </Box>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            <IconButton
              aria-label="Toggle dark mode"
              onClick={() => dispatch(themeModeChanged(themeMode === 'dark' ? 'light' : 'dark'))}
            >
              {themeMode === 'dark' ? <LightModeOutlinedIcon /> : <DarkModeOutlinedIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Account">
            <IconButton aria-label="Open account menu" onClick={(e) => setMenuAnchor(e.currentTarget)} sx={{ ml: 0.5 }}>
              <Avatar sx={{ width: 34, height: 34, fontSize: 14, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                {initials(user.name)}
              </Avatar>
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1, maxWidth: 260 }}>
              <Typography variant="subtitle2" noWrap>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {user.email}
              </Typography>
              <Chip size="small" label={isAdmin ? 'Administrator' : 'User'} color={isAdmin ? 'secondary' : 'default'} sx={{ mt: 1 }} />
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null);
                logout();
              }}
            >
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, width: { md: `calc(100% - ${DRAWER_WIDTH}px)` } }}>
        <Toolbar />
        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<LoadingState minHeight="50vh" />}>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

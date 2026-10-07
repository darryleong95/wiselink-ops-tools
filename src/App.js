import React, { useState } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import { Box, createTheme, IconButton, useMediaQuery } from '@mui/material';
import { ThemeProvider } from '@emotion/react';
import { Menu } from '@mui/icons-material';

import Nexus from './views/Nexus';
import Compare from './views/Compare.js';
import Compile from './views/Compile.js';
import PlexusForecast from './views/PlexusForecast.js';
import JabilForecast from './views/JabilForecast.js';
import PlexusEmail from './views/PlexusEmail.js';
import Rescheduler from './views/Rescheduler.js';
import QuotationCompare from './views/QuotationCompare.js';
import QuotationCompile from './views/QuotationCompile.js';
import Home from './views/Home.js';
import Sidebar from './components/Sidebar.js';

const EXPANDED = 280;
const COLLAPSED = 112;

const theme = createTheme({
    palette: {
        primary: {
            main: '#dc831b',
            contrastText: '#fff',
        },
        text: {
            primary: '#0e0f3b',
            secondary: '#5c6770',
        },
        background: {
            default: '#f7f8fa',
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'AirbnbCereal-Book, sans-serif',
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    backgroundColor: '#f7f8fa',
                },
            },
        },
        MuiInput: {
            defaultProps: {
                disableUnderline: true,
            },
            styleOverrides: {
                input: {
                    '&[type="file"]': {
                        height: 56,
                        overflow: 'visible',
                        boxSizing: 'border-box',
                        paddingTop: 8,
                        paddingBottom: 8,
                    },
                },
            },
        },
        MuiTextField: {
            defaultProps: {
                variant: 'outlined',
                size: 'small',
            },
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        fontFamily: 'AirbnbCereal-Book, sans-serif',
                    },
                    '& .MuiInputLabel-root': {
                        fontFamily: 'AirbnbCereal-Book, sans-serif',
                    },
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#dc831b',
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                        color: '#dc831b',
                    },
                },
            },
        },
        MuiBackdrop: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(247, 248, 250, 0.72)',
                    backdropFilter: 'blur(8px)',
                },
            },
        },
        MuiCircularProgress: {
            styleOverrides: {
                root: {
                    color: '#dc831b',
                },
            },
        },
        MuiTooltip: {
            styleOverrides: {
                tooltip: {
                    backgroundColor: '#0e0f3b',
                    fontFamily: 'AirbnbCereal-Book, sans-serif',
                    fontSize: '0.8rem',
                    borderRadius: 10,
                    padding: '6px 10px',
                },
            },
        },
    },
});

const drawerPaper = (width) => ({
    width,
    overflowX: 'hidden',
    border: 'none',
    background: 'transparent',
    transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
});

function AppFrame() {
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [expanded, setExpanded] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const width = expanded ? EXPANDED : COLLAPSED;

    return (
        <>
            <div className="atmosphere" aria-hidden="true">
                <span />
                <span />
                <span />
            </div>
            <div className="app-layer">
                {isMobile ? (
                    <>
                        <IconButton
                            aria-label="Open navigation"
                            onClick={() => setMobileOpen(true)}
                            sx={{
                                position: 'fixed',
                                top: 16,
                                left: 16,
                                zIndex: 20,
                                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                                boxShadow: '0 10px 24px rgba(14, 15, 59, 0.1)',
                                '&:hover': { backgroundColor: '#fff' },
                            }}
                        >
                            <Menu />
                        </IconButton>
                        <Drawer
                            variant="temporary"
                            open={mobileOpen}
                            onClose={() => setMobileOpen(false)}
                            ModalProps={{ keepMounted: true }}
                            sx={{
                                '& .MuiDrawer-paper': {
                                    ...drawerPaper(EXPANDED),
                                    background: 'rgba(247, 248, 250, 0.96)',
                                },
                            }}
                        >
                            <Sidebar expanded onNavigate={() => setMobileOpen(false)} />
                        </Drawer>
                    </>
                ) : (
                    <Drawer
                        variant="permanent"
                        sx={{
                            width,
                            flexShrink: 0,
                            transition: 'width 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                            '& .MuiDrawer-paper': drawerPaper(width),
                        }}
                    >
                        <Sidebar expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
                    </Drawer>
                )}
                <Box
                    component="main"
                    sx={{
                        flex: 1,
                        minWidth: 0,
                        px: { xs: 2.5, md: 5 },
                        pt: { xs: 9, md: 4 },
                        pb: { xs: 6, md: 5 },
                    }}
                >
                    <div className="page-stage" key={location.pathname}>
                        <Routes location={location}>
                            <Route path="/" element={<Home />} />
                            <Route path="/plexus/jit" element={<Nexus />} />
                            <Route path="/plexus/forecast" element={<PlexusForecast />} />
                            <Route path="/plexus/email" element={<PlexusEmail />} />
                            <Route path="/jabil/forecast" element={<JabilForecast />} />
                            <Route path="/ecommerce/online-stock-pricing" element={<Compare />} />
                            <Route path="/ecommerce/compile" element={<Compile />} />
                            <Route path="/admin/reschedule" element={<Rescheduler />} />
                            <Route path="/admin/transfer-quotation" element={<QuotationCompare />} />
                            <Route path="/admin/input-supplier-price" element={<QuotationCompile />} />
                        </Routes>
                    </div>
                </Box>
            </div>
        </>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppFrame />
        </ThemeProvider>
    );
}

export default App;

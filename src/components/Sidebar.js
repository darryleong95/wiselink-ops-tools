import React, { useState } from 'react';
import { Collapse, Tooltip } from '@mui/material';
import { NavLink, useLocation } from 'react-router-dom';
import {
    ChevronLeft,
    ChevronRight,
    ExpandMore,
    AccountTreeOutlined,
    TimelineOutlined,
    MailOutline,
    ShowChartOutlined,
    SellOutlined,
    TuneOutlined,
    EventRepeatOutlined,
    SwapHorizOutlined,
    ReceiptLongOutlined,
} from '@mui/icons-material';
import routes from '../routes';

const ICONS = {
    '/plexus/jit': AccountTreeOutlined,
    '/plexus/forecast': TimelineOutlined,
    '/plexus/email': MailOutline,
    '/jabil/forecast': ShowChartOutlined,
    '/ecommerce/online-stock-pricing': SellOutlined,
    '/ecommerce/compile': TuneOutlined,
    '/admin/reschedule': EventRepeatOutlined,
    '/admin/transfer-quotation': SwapHorizOutlined,
    '/admin/input-supplier-price': ReceiptLongOutlined,
};

const SECTIONS = [
    { key: 'plexus', title: 'Plexus', indices: [0, 1, 2] },
    { key: 'jabil', title: 'Jabil', indices: [3] },
    { key: 'ecomm', title: 'Ecommerce', indices: [4, 5] },
    { key: 'quotation', title: 'Quotation', indices: [7, 8] },
    { key: 'admin', title: 'Admin', indices: [6] },
];

const Sidebar = ({ expanded, onToggle, onNavigate }) => {
    const location = useLocation();
    const [expandedSections, setExpandedSections] = useState({
        plexus: true,
        jabil: true,
        ecomm: true,
        admin: true,
        quotation: true,
    });

    const toggleSection = (section) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    return (
        <div className="side-panel">
            <div className={`side-head ${expanded ? 'is-open' : 'is-compact'}`}>
                <NavLink to="/" className="brand" onClick={onNavigate} title="Home">
                    <span className="brand-mark">W</span>
                    {expanded && (
                        <span className="brand-copy">
                            <span className="brand-name">Wiselink</span>
                            <span className="brand-sub">Operations</span>
                        </span>
                    )}
                </NavLink>
                {onToggle && (
                    <button
                        type="button"
                        className="collapse-btn"
                        onClick={onToggle}
                        aria-label={expanded ? 'Collapse navigation' : 'Expand navigation'}
                    >
                        {expanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
                    </button>
                )}
            </div>

            <div className="nav-scroll">
                {SECTIONS.map((section) => {
                    const current = section.indices.some((index) => location.pathname === routes[index].path);
                    const open = expanded ? expandedSections[section.key] : true;

                    return (
                        <div key={section.key}>
                            {expanded ? (
                                <button
                                    type="button"
                                    className={`nav-section ${open ? 'is-open' : ''} ${current ? 'is-current' : ''}`}
                                    onClick={() => toggleSection(section.key)}
                                    aria-expanded={open}
                                >
                                    <span>{section.title}</span>
                                    <ExpandMore fontSize="small" />
                                </button>
                            ) : (
                                <div className="nav-rule" />
                            )}
                            <Collapse in={open} timeout={420} unmountOnExit>
                                {section.indices.map((index) => {
                                    const route = routes[index];
                                    const Icon = ICONS[route.path];
                                    const link = (
                                        <NavLink
                                            to={route.path}
                                            onClick={onNavigate}
                                            className={({ isActive }) =>
                                                `nav-link${isActive ? ' is-active' : ''}${expanded ? '' : ' is-compact'}`
                                            }
                                        >
                                            {Icon && <Icon />}
                                            <span className={`nav-label ${expanded ? 'is-shown' : ''}`}>{route.name}</span>
                                        </NavLink>
                                    );

                                    return (
                                        <Tooltip
                                            key={route.path}
                                            title={route.name}
                                            placement="right"
                                            disableHoverListener={expanded}
                                            disableFocusListener={expanded}
                                            disableTouchListener={expanded}
                                        >
                                            <span className="nav-tip">{link}</span>
                                        </Tooltip>
                                    );
                                })}
                            </Collapse>
                        </div>
                    );
                })}
            </div>
            {expanded && <div className="side-foot">For the operations team</div>}
        </div>
    );
};

export default Sidebar;

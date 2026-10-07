import React from 'react';
import { Link } from 'react-router-dom';

const groups = [
    {
        title: 'Plexus',
        tools: [
            {
                name: 'JIT Program',
                path: '/plexus/jit',
                detail: 'Filter JIT lines, join the MPN list, and download a working file.',
            },
            {
                name: 'Forecast',
                path: '/plexus/forecast',
                detail: 'Compare an older forecast with a new one by facility and part.',
            },
            {
                name: 'Email',
                path: '/plexus/email',
                detail: 'Upload buyer booking details and send the grouped emails.',
            },
        ],
    },
    {
        title: 'Jabil',
        tools: [
            {
                name: 'Forecast',
                path: '/jabil/forecast',
                detail: 'Compare two Jabil forecasts by buyer part and MPN.',
            },
        ],
    },
    {
        title: 'Ecommerce',
        tools: [
            {
                name: 'Online Stock Pricing',
                path: '/ecommerce/online-stock-pricing',
                detail: 'Join the stock list with the latest customer and supplier prices.',
            },
            {
                name: 'Compile',
                path: '/ecommerce/compile',
                detail: 'Merge price sheets and apply a markup for each quantity.',
            },
        ],
    },
    {
        title: 'Quotation',
        tools: [
            {
                name: 'Transfer Quotation',
                path: '/admin/transfer-quotation',
                detail: 'Carry matching CPN and MPN details into a new quotation file.',
            },
            {
                name: 'Input Supplier Price',
                path: '/admin/input-supplier-price',
                detail: 'Fill supplier prices into an input workbook from a price list.',
            },
        ],
    },
    {
        title: 'Admin',
        tools: [
            {
                name: 'Reschedule',
                path: '/admin/reschedule',
                detail: 'Line up the system schedule with the customer reschedule request.',
            },
        ],
    },
];

const Home = () => (
    <div className="home">
        <header className="home-hero">
            <p className="eyebrow">Wiselink operations</p>
            <h1>What would you like to run?</h1>
            <p className="lede">
                Each tool takes the Excel files you already use and hands back a finished workbook.
            </p>
        </header>
        {groups.map((group) => (
            <section className="home-group" key={group.title}>
                <h2>{group.title}</h2>
                <div className="home-grid">
                    {group.tools.map((tool) => (
                        <Link className="tool-card" key={tool.path} to={tool.path}>
                            <span className="tool-name">{tool.name}</span>
                            <span className="tool-detail">{tool.detail}</span>
                            <span className="tool-go">Open →</span>
                        </Link>
                    ))}
                </div>
            </section>
        ))}
    </div>
);

export default Home;

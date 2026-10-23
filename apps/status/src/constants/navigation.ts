export const companyInfo = {
    name: 'Emberly',
    fullName: 'Emberly by NodeByte LTD',
    tagline: 'Open-source email infrastructure for developers',
    logo: '/logo.svg',
    contact: {
        socialMedia: {
            website: 'https://embrly.ca',
            github: 'https://github.com/EmberlyOSS/Emberly',
            discord: 'https://discord.gg/36spBmzZVB',
            twitter: 'https://x.com/TryEmberly'
        },
    },
};

export const mainNavItems = [
    { name: 'Incidents', path: '/incidents' },
    { name: 'Maintenance', path: '/maintenances' },
    { name: 'Stats', path: '/stats' },
];

export const footerNavigation = {
    links: [
        { name: 'Incidents', path: '/incidents' },
        { name: 'Maintenance', path: '/maintenances' },
        { name: 'Stats', path: '/stats' },
    ],
};

export const copyrightInfo = {
    text: `© ${new Date().getFullYear()} NodeByte LTD · All rights reserved.`,
};

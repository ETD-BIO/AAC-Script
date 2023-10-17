module.exports = {
    testMatch: [
        '**/__tests__/**/*.(spec|test).js?(x)',
    ],
    collectCoverageFrom: ['**/__tests__/*'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    verbose: false,
    noStackTrace: true,
};
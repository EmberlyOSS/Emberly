module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [
            2,
            'always',
            [
                'feat',
                'fix',
                'docs',
                'chore',
                'style',
                'refactor',
                'ci',
                'test',
                'perf',
                'patch',
                'revert',
                'vercel',
                'update',
                'add'
            ]
        ]
    }
};
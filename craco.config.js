const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // Find the oneOf rule in webpack config
            const oneOfRule = webpackConfig.module.rules.find((r) => Array.isArray(r.oneOf)).oneOf;

            // Find the babel-loader rule for JS/TS files
            const jsRule = oneOfRule.find(
                (rule) => rule.test && rule.test.toString().includes('js') && rule.use
            );

            if (jsRule) {
                // Add specific ESM packages to be transpiled by babel
                const packagesToTranspile = [
                    'lucide-react',
                    'firebase',
                    '@firebase',
                    'react-firebase-hooks',
                    'chart.js',
                    'react-chartjs-2',
                    'react-markdown',
                    'vfile',
                    'unist-util-stringify-position',
                    'unified',
                    'bail',
                    'is-plain-obj',
                    'trough',
                    'remark-parse',
                    'remark-rehype',
                    'mdast-util-to-hast',
                    'micromark',
                    'decode-named-character-reference',
                    'character-entities',
                    'property-information',
                    'hast-util-whitespace',
                    'space-separated-tokens',
                    'comma-separated-tokens',
                    'ccount',
                    'escape-string-regexp',
                    'markdown-table'
                ];

                const includePaths = packagesToTranspile.map((pkg) =>
                    path.resolve(__dirname, 'node_modules', pkg)
                );

                // Ensure include is an array and add our paths
                if (!jsRule.include) {
                    jsRule.include = includePaths;
                } else if (Array.isArray(jsRule.include)) {
                    jsRule.include.push(...includePaths);
                } else {
                    jsRule.include = [jsRule.include, ...includePaths];
                }
            }

            return webpackConfig;
        },
    },
};

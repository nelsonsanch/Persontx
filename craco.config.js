const path = require('path');

module.exports = {
    webpack: {
        configure: (webpackConfig) => {
            // 1. Find the "oneOf" rule (where Babel loader lives)
            const oneOfRule = webpackConfig.module.rules.find((r) => Array.isArray(r.oneOf)).oneOf;

            // 2. Find the existing Babel loader rule for JS/TS files
            const jsRule = oneOfRule.find(
                (rule) => rule.test && rule.test.toString().includes('js') && rule.use
            );

            if (jsRule) {
                // 3. List of known ESM-only or pesky modules to force-transpile
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
                    'markdown-table',
                    'recharts',
                    'd3-shape',
                    'd3-path',
                    'd3-scale',
                    'd3-array',
                    'd3-interpolate',
                    'd3-color',
                    'd3-format',
                    'd3-time',
                    'd3-time-format',
                    'victory-vendor',
                    'internmap',
                    'react-router',
                    'react-router-dom',
                    '@remix-run/router'
                ];

                // 4. Resolve absolute paths for these packages
                const includePaths = packagesToTranspile.map((pkg) => {
                    try {
                        return path.resolve(__dirname, 'node_modules', pkg);
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean);

                // 5. Add them to Babel loader's "include"
                if (!jsRule.include) {
                    jsRule.include = includePaths;
                } else if (Array.isArray(jsRule.include)) {
                    jsRule.include.push(...includePaths);
                } else {
                    jsRule.include = [jsRule.include, ...includePaths];
                }
            }

            // 6. Polyfill usually ignored node modules (fix for some webpack 5 issues)
            webpackConfig.resolve.fallback = {
                ...webpackConfig.resolve.fallback,
                "crypto": require.resolve("crypto-browserify"),
                "stream": require.resolve("stream-browserify"),
                "buffer": require.resolve("buffer/")
            };

            return webpackConfig;
        },
    },
};

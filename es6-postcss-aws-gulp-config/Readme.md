
# Sample config for ES6 / PostCSS project with deployment to AWS

JS: ES6 modules via Babel && Browserify
CSS: custom preprocessor with PostCSS and autoprefixer

Build automation with Gulp incl deployment to AWS S3 / Cloudfront

## Setup

$ npm install


## Development

$ gulp

Dev server runs on http://localhost:1337/src


## Build / Deployment

For deployment to AWS add your S3 / Cloudfront info to the gulpfile

var aws = {
    "key": "...",
    "secret": "...",
    "bucket": "...",
    "region": "...",
    "distributionId": "..."
};

then build and deploy with

$ gulp build
$ gulp deploy

const convict = require("convict");

const config = convict({
    MONGODB_URI: {
        doc: 'mongo-url',
        format: String,
        default: "",
        env: "MONGODB_URI",
        arg: 'mongodb_uri'
    },
    SENDGRID_API_KEY: {
        doc: '',
        format: String,
        default: "",
        env: "SENDGRID_API_KEY",
        arg: ''
    },
    JWT_SECRET: {
        doc: 'jwt secret',
        format: String,
        default: "",
        env: 'JWT_SECRET',
        arg: ''
    },
    TOKEN_EXPIRES_IN: {
        doc: 'token expires in',
        format: Number,
        default: 3600000,
        env: 'TOKEN_EXPIRES_IN',
        arg: ''
    },
    PORT: {
        doc: 'port',
        format: Number,
        default: 8000,
        env: 'PORT',
        arg: 'port'
    },
});

config.validate({allowed: 'strict'});

const rawConf = config.get()

module.exports = rawConf;
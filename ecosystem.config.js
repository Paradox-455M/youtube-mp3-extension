module.exports = {
    apps: [{
        name: 'youtube-mp3-converter',
        script: './backend/server.js',
        instances: 1,
        exec_mode: 'fork',
        env: {
            NODE_ENV: 'development',
            PORT: 4000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 4000
        },
        error_file: './backend/logs/pm2-error.log',
        out_file: './backend/logs/pm2-out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,
        autorestart: true,
        max_memory_restart: '500M',
        watch: false,
        ignore_watch: ['node_modules', 'logs', 'temp']
    }]
};

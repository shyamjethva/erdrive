const { Client } = require('ssh2');
const conn = new Client();

const newConfig = `server {
    listen 80;
    server_name erdrive.errorinfotech.in;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name erdrive.errorinfotech.in;

    ssl_certificate /etc/letsencrypt/live/erdrive.errorinfotech.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/erdrive.errorinfotech.in/privkey.pem;

    root /var/www/erdrive/client/dist;
    index index.html;

    # Force browser to clear its cache
    add_header Clear-Site-Data "*" always;

    location / {
        try_files $uri $uri/ /index.html;
        
        # Kill caching for HTML
        if ($request_uri ~* \\.html|\\/$) {
            add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        }
    }

    location /api {
        proxy_pass http://localhost:5008;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /storage {
        alias /var/www/erdrive/server/storage;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
}`;

conn.on('ready', () => {
    console.log('✅ SSH Connection Ready');
    conn.exec(`cat > /etc/nginx/sites-available/erdrive.errorinfotech.in <<'EOF'\n${newConfig}\nEOF`, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Nginx config updated');
                conn.exec('systemctl restart nginx', (err, stream) => {
                    stream.on('close', () => {
                        console.log('✅ Nginx restarted');
                        conn.end();
                    });
                });
            } else {
                console.error('❌ Failed to update nginx config');
                conn.end();
            }
        });
    });
}).connect({
    host: '69.62.82.12',
    port: 22,
    username: 'root',
    password: 'Eri404@scale'
});

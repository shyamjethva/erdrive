const { Client } = require('ssh2');
const conn = new Client();

const config = {
    host: '69.62.82.12',
    port: 22,
    username: 'root',
    password: 'Eri404@scale'
};

const commands = [
    'cd /var/www/erdrive && git fetch --all && git reset --hard origin/main',
    'cd /var/www/erdrive/server && npm install',
    'cd /var/www/erdrive/client && npm install && npm run build',
    'pm2 restart erdrive-server',
    'systemctl restart nginx'
];

conn.on('ready', () => {
    console.log('✅ SSH Connection Ready');
    let currentCommandIndex = 0;

    function runNextCommand() {
        if (currentCommandIndex >= commands.length) {
            console.log('\n🚀 Deployment Completed Successfully!');
            conn.end();
            return;
        }

        const cmd = commands[currentCommandIndex];
        console.log(`\n🏃 Running: ${cmd}`);

        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                if (code === 0) {
                    currentCommandIndex++;
                    runNextCommand();
                } else {
                    console.error(`\n❌ Command failed with code ${code}`);
                    conn.end();
                }
            }).on('data', (data) => {
                process.stdout.write(data);
            }).stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        });
    }

    runNextCommand();
}).connect(config);

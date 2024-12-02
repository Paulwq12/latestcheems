const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');



// Ensure necessary directories
function ensurePermissions() {
    const directories = ['tmp', 'XeonMedia', 'lib', 'src'];
    directories.forEach((dir) => {
        const fullPath = path.join(__dirname, dir);
        try {
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true });
                console.log(`Created directory: ${fullPath}`);
            }
            fs.chmodSync(fullPath, 0o755); // Ensure permissions
        } catch (err) {
            console.error(`Error ensuring directory ${fullPath} exists:`, err);
            process.exit(1);
        }
    });
}

function start() {
    ensurePermissions();


    const mainFile = path.join(__dirname, 'main.js');
    let args = [mainFile, ...process.argv.slice(2)];

    console.log(`Starting Bot with: ${['node', ...args].join(' ')}`);

    let p = spawn('node', args, {
        stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    })
        .on('message', (data) => {
            if (data === 'reset') {
                console.log('Restarting Bot...');
                p.kill();
                start();
                delete p;
            }
        })
        .on('exit', (code) => {
            console.error('Exited with code:', code);
            if (code === 1 || code === 0) start();
        });
}

start();

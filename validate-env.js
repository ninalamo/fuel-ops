const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        console.log('❌ Error: .env file not found');
        process.exit(1);
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    let useJson = false;

    lines.forEach(line => {
        if (line.trim().startsWith('USE_JSON_SERVER=')) {
            const val = line.trim().substring(16).replace(/^["']|["']$/g, '').trim();
            if (val === 'true') useJson = true;
        }
    });

    if (useJson) {
        console.log('✅ App configured for JSON Server.');
    } else {
        console.log('⚠️ App configured for Mock Data (Default).');
    }

} catch (err) {
    console.error('An error occurred:', err);
    process.exit(1);
}

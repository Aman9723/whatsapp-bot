const readXlsxFile = require('read-excel-file/node');
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const info = JSON.parse(fs.readFileSync('info.json', 'utf-8'));

readXlsxFile('data.xlsx').then((rows) => {
    // removing phone, club, name
    rows.shift();

    const client = new Client({
        puppeteer: {
            headless: true,
            executablePath: info.path,
        },
    });

    // generates qr code to login
    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    // on recieving logout message
    client.on('message_ack', (message, ack) => {
        if (message.body.includes('messages sent')) {
            client.logout();
            console.log('Logged out! 👍');
        }
    });

    // when client is ready
    client.on('ready', () => {
        console.log('Client is ready! 🚀');
        sendMessage();

        // recursive function to send message
        async function sendMessage(i = 0) {
            const [phone, club, name] = rows[i];

            // for custom input
            const replacements = {
                name: `${name}`,
                clubid: `${club}`,
            };
            const pattern = new RegExp(
                Object.keys(replacements).join('|'),
                'gi'
            );

            try {
                await client.sendMessage(
                    `91${phone}@c.us`,
                    info.message.replace(
                        pattern,
                        (match) => replacements[match.toLowerCase()]
                    )
                );

                console.log(name, phone, club, '✅');
            } catch (error) {
                console.log(name, phone, club, '❌');
            }

            // at last send message to logout
            if (i == rows.length - 1) {
                await client.sendMessage(
                    `91${info.phone}@c.us`,
                    `${i + 1} messages sent`
                );
            } else {
                // recursive call
                await sendMessage(i + 1);
            }
        }
    });

    client.initialize();
});

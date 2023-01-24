# rpi-fi

Promise based Node module for controlling wifi on Raspberry Pi. Uses wpa_cli under the hood. Draws heavily on the work done by "rpi-wifi-connection".

# install:

npm install rpi-fi

# usage:

const { connect, list_networks, scan } = require('rpi-fi');

run();

async function run() {
    console.log(await scan());
    
    await connect('MySSID', 'MyPassord');

    console.log(await list_networks());
}
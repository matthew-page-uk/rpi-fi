const { exec } = require('child_process');
const IFACE = 'wlan0';

run();
async function run() {
    // await removeAllNetworks();
    // await removeNetworkBySsid('Wiffy');
    // await connect('Wiffy', 'P455W0RD!');
    // await selectNetwork(0);
    // await save();
    console.log(await list_networks());
    console.log(await scan());
    console.log(await state());
}

async function connect(ssid, psk, bssid = null, iface = IFACE) {
    const id = await addNetwork();
    await setNetwork(id, 'ssid', ssid);
    await setNetwork(id, 'psk', psk);
    if (bssid) await setNetwork(id, 'bssid', bssid);
    await selectNetwork(id);
    await save();
}

async function scan(iface = IFACE) {
    let ssids = [];

    await wpa_cli(iface, 'scan');
    const result = await wpa_cli(iface, 'scan_results');
    let output = result.split('\n');
    output.shift();

    output.map((line) => {
        const params = line.split('\t');
        ssids.push({
            bssid: params[0],
            frequency: parseInt(params[1]),
            signalLevel: parseInt(params[2]),
            flags: params[3],     
            ssid: params[4]
        });
    });

    return ssids;
}

async function list_networks(iface = IFACE) {
    let networks = [];

    const result = await wpa_cli(iface, 'list_networks');
    let output = result.split('\n');
    output.shift(); // remove header

    output.map((line) => {
        const params = line.split('\t');
        networks.push({
            id: parseInt(params[0]),
            ssid: params[1],
            bssid: params[2],
            state: params[3]
        });
    });

    return networks;
}

async function state(iface = IFACE) {
    const stateObj = {};
    const result = await wpa_cli(iface, 'status');
    let output = result.split('\n');
    output.map((line) => {
        const params = line.split('=');
        stateObj[params[0]] = params[1];
    });
    return stateObj;
}

async function save(iface = IFACE) {
    const result = await wpa_cli(iface, 'save_config');
    return result == 'OK';
}

async function reconfigure(iface = IFACE) {
    const result = await wpa_cli(iface, 'reconfigure');
    return result == 'OK';
}

async function selectNetwork(id, iface = IFACE) {
    const result = await wpa_cli(iface, `select_network ${parseInt(id)}`);
    return result == 'OK';
}

async function removeNetwork(id, iface = IFACE) {
    const result = await wpa_cli(iface, `remove_network ${parseInt(id)}`);
    return result == 'OK';
}

async function removeNetworkBySsid(ssid, iface = IFACE) {
    const result = await list_networks(iface);
    result.map(network => {
        if (network?.ssid == ssid) {
            removeNetwork(network?.id, iface);
        }
    });
}

async function removeAllNetworks(iface = IFACE) {
    const networks = await list_networks(iface);
    networks.map(network => {
        removeNetwork(network?.id, iface);
    });
}

/*
*   private functions
*/

async function addNetwork(iface = IFACE) {
    const result = await wpa_cli(iface, 'add_network');
    return parseInt(result);
}

async function setNetwork(id, name, value, iface = IFACE) {
    let newValue = (typeof value === 'number') ? value :  `\'"${value}"\'`;
    const result = await wpa_cli(iface, `set_network ${parseInt(id)} ${name} ${newValue}`);
    return result == 'OK';
}

function wpa_cli(iface, command) {
    return new Promise((resolve, reject) => {
        const cmd = `wpa_cli -i ${iface} ${command}`;
        exec(cmd, (error, stdout) => {
            if (error) reject(error);

            let output = stdout.trim();
            resolve(output);
        });
    });
}

module.exports = {
    connect,
    scan,
    list_networks,
    save,
    reconfigure,
    selectNetwork,
    removeNetwork,
}
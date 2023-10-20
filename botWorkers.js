const {createBot} = require("mineflayer");
const { parentPort, workerData } = require('worker_threads');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


for (let i = 1; i < workerData["botAmount"] + 1; i++) {
    const botData = workerData["botOptions"]
    sleep(workerData["rateLimit"] * i).then(() => {
        addBot({
            host: botData.hostname,
            port: botData.port,
            brand: botData.brand,
            username: `${workerData["groupName"]}-${i}`,

            auth: botData.auth,
            viewDistance: botData.viewDistance,
        })
    })
}

function addBot(options) {
    const bot = createBot(options)

    function parentMessage(key, value) {
        switch (key){
            case "health":
                value = {health: bot.health, food: bot.food}
                break
            case "breath":
                value = {breath: bot.oxygenLevel}
                break
            default:
                value = value || {}
        }
        parentPort.postMessage({
            key: key,
            bot: bot.username || `${options["username"]} (Not Connected)`,
            value: JSON.stringify(value)
        })
    }

    parentPort.on("message", (message) => {
        if (message.bot === "all" || bot.username){
            parentMessage("response", bot[message.command](...message.args))

        }
    })

    // Subscribe to interested events
    const selfEmit = bot.emit
    bot.emit = function (event, args) {
        try {
            parentMessage(event, args)
            return selfEmit.apply(bot, [event, args])
        } catch (e) {
        }
    }
}
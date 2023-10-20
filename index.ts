import {Swarm} from "./swarm";

const swarm: Swarm = new Swarm({
    rateLimit: 1
    }
)

swarm.addAgents(1, 5)

swarm.on("error", (bot, err) => {
    console.error(`${bot} encountered an error (${err.message})`)
})

swarm.on("chat", (username, message, translate) => {
    console.log(`${username} (${translate}): ${message} `)
})

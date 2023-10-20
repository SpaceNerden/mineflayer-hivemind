import {randomBytes} from "crypto"
import {EventEmitter} from "events";

import TypedEmitter from "typed-emitter";
import {BotGroup} from "./botGroup";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

type SwarmOptions = {
    version?: string
    hostname?: string,
    port?: number,
    brand?: string,

    swarmName?: string,
    rateLimit?: number
}

export type SwarmEvents = {
    error: (botName: string, err: Error) => void
    chat: (username: string, message: string, translate: string | null) => void,
    kicked: (botName: string, reason: string, loggedIn: boolean) => void
}

export class Swarm extends (EventEmitter as new () => TypedEmitter<SwarmEvents>){
    public groups: BotGroup[] = []
    public swarmName?: string
    public rateLimit: number

    public hostname: string
    public port: number
    public brand: string

    constructor(options: SwarmOptions) {
        super()
        this.swarmName = this.swarmName || `S-${randomBytes(2).toString("hex")}`
        this.rateLimit = options.rateLimit || 4050

        this.hostname = options.hostname || "localhost"
        this.port = options.port || 25565
        this.brand = options.brand || "vanilla"
    }

    public run(options: {
        command: string,
        bot?: string,
        args?: string[]
    }){
        if (options.bot) {
            for (const group of this.groups) {
                if (options.bot.includes(group.groupName)) {
                    group.run({
                        command: options.command,
                        bot: options.bot || "all",
                        args: options.args
                    })
                }
            }
        }
    }

    addAgents(amount: number, perGroup: number){
        const wholeGroups: number = Math.trunc(amount/perGroup)
        const remainder: number = amount % perGroup

        for (let i = 1; i < wholeGroups +1; i++) {
            sleep(this.rateLimit * i * perGroup).then( () => {
                this.addBotGroup(perGroup)
            })
        }

        if (remainder) {
            sleep(this.rateLimit * wholeGroups * perGroup).then( () => {
                this.addBotGroup(remainder)
            })
        }
    }

    private addBotGroup(number: number) {
        const botGroup = new BotGroup({
            swarm: this,
            number: number,
            options: {
                hostname: this.hostname,
                    port: this.port,
                brand: this.brand
            }
        })

        botGroup.on("error", (bot, err) => {
            this.emit("error", bot, err)
        })

        botGroup.on("chat", (username, message, translate) => {
            this.emit("chat", username, message, translate)
        })


        this.groups.push(botGroup)

        return botGroup
    }

}

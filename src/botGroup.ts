import {EventEmitter} from "events";
import TypedEmitter from "typed-emitter";
import {Swarm, SwarmEvents} from "./swarm";
import {randomBytes} from "crypto";
import {Worker} from "worker_threads";

type BotGroupEvent = SwarmEvents

export type addBots = {
    hostname: string
    port: number
    brand?: string
}

export class BotGroup extends (EventEmitter as new () => TypedEmitter<BotGroupEvent>){
    public swarm: Swarm
    public groupName: string
    public worker: Worker

    constructor(options: {
        swarm: Swarm,
        number: any,
        options: addBots
    }) {
        super();
        this.swarm = options.swarm
        this.groupName = `${this.swarm.swarmName}-${randomBytes(2).toString("hex")}`
        this.worker = this.addBots(options.number, options.options)
    }

    public run(options: {
        command: string,
        bot?: string,
        args?: string[]
    }){
        this.worker.postMessage({
            command: options.command,
            bot: options.bot || "all",
            args: options.args
        })
    }

    public addBots(number: any, options: addBots) {
        const agent: Worker = new Worker('./botWorkers.js', {
            workerData: {
                botOptions: {
                    host: options.hostname,
                    port: options.port,
                    brand: options.brand,

                    auth: "offline",
                    viewDistance: "tiny",
                },
                botAmount: number,
                groupName: this.groupName
            }
        })

        agent.on("message", (
            message: {
                key: string,
                bot: string,
                value: any
            }
        ) => {
            message.value = JSON.parse(message.value)
            switch (message.key){
                case "error":
                    const error: Error = message.value[0]
                    this.emit("error", message.bot, error)
                    break
                case "chat":
                    this.emit("chat",
                        // message.botName,
                        message.value["username"],
                        message.value["message"],
                        message.value["translate"])
                    break
                case "kicked":
                    this.emit("kicked",
                        message.bot,
                        message.value["reason"],
                        message.value["loggedIn"])
                    break
                case "physicTic":
                case "physicsTic":
                case "physicTick":
                case "physicsTick":
                case "chunkColumnLoad":
                case "time":
                case "entityGone":
                case "move":
                case "entityUpdate":
                case "entitySpawn":
                case "entityAttributes":
                case "entityMoved":
                case "hardcodedSoundEffectHeard":
                case "blockUpdate":
                    break
                default:
                    console.log(message)
                    break
            }

        })

        return agent
    }
}
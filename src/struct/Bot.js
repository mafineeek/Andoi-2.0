require("dotenv/config");
const { Client, Collection, Permissions, Intents } = require("discord.js");
const { connect } = require("mongoose");
const ClientUtil = require("../utils/ClientUtil");
const Logger = require("../utils/Logger");
const settings = require("../../settings");
const emotes = require("../assets/json/emotes.json");
const { performance } = require("perf_hooks");
const GiveawaysManager = require("./Mongogiveaways");
const apiLoader = require("../loaders/ApiLoader");
const langManager = require("./LanguageManager");
const gModel = require("../models/guild");
const pack = require("../../package.json");
class Bot extends Client {
  constructor() {
    super({
      allowedMentions: { parse: ["users", "roles"], repliedUser: true },
      intents: Intents.ALL,
    });
    this.pack = pack;
    this.giveaway = new GiveawaysManager(this, {
      storage: false,
      updateCountdownEvery: 5000,
      hasGuildMembersIntent: true,
      default: {
        botsCanWin: false,
        exemptPermissions: [],
        embedColor: "#FF0000",
        embedColorEnd: "#000000",
        reaction: "🎉",
        lastChance: {
          enabled: true,
          content: "⚠️ **LAST CHANCE TO ENTER !** ⚠️",
          threshold: 5000,
          embedColor: "#FF0000",
        },
      },
    });
    this.lang = new langManager(this);
    this.commands = new Collection();

    this.aliases = new Collection();

    this.cooldowns = new Collection();
    this.interactions = new Collection();
    this.events = new Collection();

    this.utils = new ClientUtil(this);
    this.emotes = emotes;

    this.apis = {};
    this.defaultPerms = new Permissions([
      "SEND_MESSAGES",
      "VIEW_CHANNEL",
    ]).freeze();

    this.log = Logger;

    this.settings = settings;
    this.messages = { sent: 0, received: 0 };
    this.bootTime = null;
    this.on("messageCreate", (message) => {
      if (message.author.id === this.user.id) {
        return this.messages.sent++;
      } else {
        return this.messages.received++;
      }
    });
    this.once("ready", () => {
      this.bootTime = Math.round(performance.now());
      return;
    });
  }
  embed() {}

  async getPrefix(message) {
    try {
      const g = await gModel.findOne({
        guild: message.guild.id,
      });
      if (!g) {
        const gd = new gModel({
          guild: message.guild.id,
        });
        await gd.save();
        return gd.prefix;
      }
      return g.prefix;
    } catch (err) {
      console.log(err);
    }
  }

  isOwner(id) {
    return settings.owners.includes(id);
  }

  connectDB() {
    return connect(process.env.mongo_uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      autoIndex: false,
    });
  }

  build() {
    const api = new apiLoader(this);
    api.load();
    this.connectDB();
    this.utils.handleCommands();
    this.utils.handleEvents();
    if (process.env.dev === "true") {
      super.login(process.env.dev_token);
    } else {
      super.login(process.env.bot_token);
    }
  }
  async resolveUser(search) {
    if (!search || typeof search !== "string") return null;
    let user = null;
    if (search.match(/^<@!?(\d+)>$/))
      user = await this.users
        .fetch(search.match(/^<@!?(\d+)>$/)[1])
        .catch(() => {});
    if (search.match(/^!?(\w+)#(\d+)$/) && !user)
      user = this.users.cache.find(
        (u) =>
          u.username === search.match(/^!?(\w+)#(\d+)$/)[0] &&
          u.discriminator === search.match(/^!?(\w+)#(\d+)$/)[1]
      );
    if (search.match(/.{2,32}/) && !user)
      user = this.users.cache.find((u) => u.username === search);
    if (!user) user = await this.users.fetch(search).catch(() => {});
    return user;
  }
  async resolveMember(search, guild) {
    if (!search || typeof search !== "string") return null;
    const user = await this.resolveUser(search);
    if (!user) return null;
    return await guild.members.fetch(user);
  }
  /**
   * @returns {Role|null}
   * @param {string} search
   * @param {Guild} guild
   */
  resolveRole(search, guild) {
    if (!search || typeof search !== "string") return null;
    let role = null;
    if (search.match(/^<@&!?(\d+)>$/))
      role = guild.roles.cache.get(search.match(/^<@&!?(\d+)>$/)[1]);
    if (!role) role = guild.roles.cache.find((r) => r.name === search);
    if (!role) role = guild.roles.cache.get(search);
    return role;
  }
  resolveChannel(search, guild) {
    if (!search) return null;
    let channel = null;
    channel = guild.channels.cache.get(
      search.replace("<", "").replace("#", "").replace(">", "")
    );
    if (!channel) channel = guild.channels.cache.find((c) => c.name === search);
    if (!channel) channel = guild.channels.cache.get(search);
    return channel;
  }
  getEmoji(name) {
    return this.emojis.cache.get((n) => n === name);
  }
  shuffle(obj) {
    if (!obj) return null;
    if (Array.isArray(obj)) {
      let i = obj.length;
      while (i) {
        let j = Math.floor(Math.random() * i);
        let t = obj[--i];
        obj[i] = obj[j];
        obj[j] = t;
      }
      return obj;
    }
    if (typeof obj === "string") return this.shuffle(obj.split("")).join("");
    return obj;
  }
}
module.exports = Bot;

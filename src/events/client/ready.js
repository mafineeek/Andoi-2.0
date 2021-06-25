const Event = require("../../struct/Event");
module.exports = class ReadyEvent extends Event {
  constructor(...args) {
    super(...args, {
      once: true,
    });
  }

  run() {
    this.client.log.info("client", `Logged in as ${this.client.user.tag}`);
    this.client.log.info(
      "command",
      `Loaded ${this.client.commands.size} commands`
    );
    this.client.log.info("event", `Loaded ${this.client.events.size} events`);
    this.startPresence();
    this.client.log.info("status", "Started presence");
  }
  sendMessage() {}
  startPresence() {
    let i = 0;
    const members = this.client.utils.formatNumber(
      this.client.guilds.cache.reduce((a, b) => a + b.memberCount, 0)
    );
    const servers = this.client.utils.formatNumber(
      this.client.guilds.cache.size
    );
    const commands = this.client.utils.formatNumber(this.client.commands.size);
    const channels = this.client.utils.formatNumber(
      this.client.channels.cache.size
    );
    this.client.user.setActivity(`a!help | v${this.client.pack.version}`, {
      type: "WATCHING",
    });
    setInterval(() => {
      const textArray = [
        `a!help | ${servers} servers`,
        `a!help | ${members} users`,
        `a!help | ${commands} commands`,
        `a!help | ${channels} channels`,
        `a!help | v${this.client.pack.version}`,
        "With people",
      ];
      const activityArray = [
        "WATCHING",
        "WATCHING",
        "WATCHING",
        "WATCHING",
        "WATCHING",
        "PLAYING",
      ];

      this.client.user.setActivity(textArray[i], { type: activityArray[i] });

      i++;

      if (i == 3) i = 0;
    }, 60000);
  }
};

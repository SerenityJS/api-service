import { ActionRow, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Events, GatewayIntentBits, type GuildTextBasedChannel, type Interaction, type Snowflake, type TextBasedChannel } from "discord.js";

import type { RestAPIService } from "../index";
import { Service } from "./service";
import type { StoredPlugin } from "../types";
import type { GHFetch } from "./gh-fetch";
import { Plugin } from "../plugin";

class Discord extends Service {
  private readonly pluginApprovalChannelId: Snowflake = "1411567293552529462";

  /**
   * The Discord bot token for the client to login
  */
  private readonly token: string = process.env.DISCORD_TOKEN ?? "";

  /**
   * The Discord client instance
  */
  private readonly client: Client = new Client({ intents: [GatewayIntentBits.Guilds] });

  /**
   * A promise that resolves when the client is ready
  */
  private readonly ready = new Promise<void>((resolve) => this.client.once(Events.ClientReady, () => resolve()));

  /**
   * Instructions for approving or rejecting a plugin
  */
  private readonly approvalInstructions: string = `
  **Verify that the plugin meets the following criteria:**

  - The plugin is relevant to SerenityJS and its ecosystem.\n
  - The plugin is well-maintained and has at least a release on GitHub.\n
  - The plugin has a proper README file and documentation.\n
  - The plugin does not contain any malicious code or vulnerabilities.\n
  - The plugin follows best practices for coding and design.\n

  Please review the plugin and **approve** or **reject** it by clicking one of the buttons below.
  `;

  public constructor(api: RestAPIService) {
    super(api);

    // Login to Discord with the bot token
    this.client.login(this.token);

    // Bind the interaction handler to the client
    this.client.on(Events.InteractionCreate, this.handleInteraction.bind(this));
  }

  public async sendPluginApprovalRequest(plugin: StoredPlugin): Promise<void> {
    // Wait until the client is ready
    await this.ready;

    // Fetch the channel by its ID
    const channel = await this.client.channels.fetch(this.pluginApprovalChannelId) as GuildTextBasedChannel | null;
  
    // Check if the channel exists and is text-based
    if (!channel || !channel.isTextBased()) {
      console.error(`Channel with ID ${this.pluginApprovalChannelId} not found or is not text-based.`);
      return;
    }

    // Create the embed message
    const embed = new EmbedBuilder()
      .setTitle("New Plugin Approval Request")
      .setDescription(`A new plugin has been submitted for approval:\n\n**Name:** ${plugin.name}\n**Owner:** ${plugin.owner.username}\n**URL:** ${plugin.url}\n\n${this.approvalInstructions}`)
      .setColor(0x8560E9)
      .setThumbnail(await Plugin.getLogoURL(plugin));

    // Create the action row with approve and reject buttons
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`approve:${plugin.id}`)
          .setLabel("Approve")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`reject:${plugin.id}`)
          .setLabel("Reject")
          .setStyle(ButtonStyle.Danger),
      );

    // Send the message to the channel
    await channel.send({ embeds: [embed], components: [row] });
  }

  private async handleInteraction(interaction: Interaction): Promise<void> {
    // Check if the interaction is a button interaction
    if (interaction.isButton()) {
      // Get the action and plugin ID from the button custom ID
      const [action, pluginId] = interaction.customId.split(":");

      // Check if the action is valid
      if (action === "approve" || action === "reject") {
        // Determine if the plugin is approved or rejected
        const approved = action === "approve";

        // Update the plugin approval status in the database
        this.api.setPluginApproval(Number(pluginId), approved);

        // Disable the buttons after the action is taken
        interaction.message.edit({ components: [] });

        // Reply to the interaction to acknowledge it
        await interaction.reply({ content: `Plugin ${approved ? "approved" : "rejected"}.` });

        // Get the stored plugin from the database
        const stored = this.api.getStoredPlugin(Number(pluginId));

        // If the plugin is approved and the stored plugin exists
        if (approved && stored) {
          // Get the repository data from GitHub
          const repository = await Plugin.getRepository(stored);

          // If the repository data exists
          if (!repository) return;

          // Create a Plugin instance from the stored data and repository data
          const plugin = await Plugin.create(stored, repository);

          // Add the plugin to the in-memory cache
          this.api.addCachedPlugin(plugin);
        } 
      }
    }
  }
}

export { Discord };

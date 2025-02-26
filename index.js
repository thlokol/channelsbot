require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'create') {
    try {
      // Dá um "ack" ao Discord, prevenindo timeout
      await interaction.deferReply();

      // Opções básicas
      const categoryName = interaction.options.getString('categoria');
      const channelsString = interaction.options.getString('canais');
      const channelNames = channelsString.split(' ');

      // Lista de cargos selecionados (cargo1..cargo5)
      const cargos = [];
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`cargo${i}`);
        if (role) cargos.push(role);
      }

      // Lista de usuários selecionados (user1..user5)
      const usuarios = [];
      for (let i = 1; i <= 5; i++) {
        const user = interaction.options.getUser(`user${i}`);
        if (user) usuarios.push(user);
      }

      // Monta permissão: nega a todos (@everyone)
      const permissionOverwrites = [
        {
          id: interaction.guild.id, // @everyone
          deny: [PermissionFlagsBits.ViewChannel],
        },
      ];

      // Libera acesso para cada cargo selecionado
      cargos.forEach(role => {
        permissionOverwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      });

      // Libera acesso para cada usuário selecionado
      usuarios.forEach(user => {
        permissionOverwrites.push({
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      });

      // Cria a categoria
      const category = await interaction.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
        permissionOverwrites,
      });

      // Cria os canais de texto dentro da categoria
      for (const chName of channelNames) {
        await interaction.guild.channels.create({
          name: chName,
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }

      // Monta uma string para mostrar quem tem acesso
      const rolesStr = cargos.length
        ? cargos.map(r => r.name).join(', ')
        : 'Nenhum';
      const usersStr = usuarios.length
        ? usuarios.map(u => u.tag).join(', ')
        : 'Nenhum';

      await interaction.editReply(
        `Categoria **${categoryName}** criada com ${channelNames.length} canal(is).\n`
        + `Cargo(s) permitidos: ${rolesStr}\n`
        + `Usuário(s) permitidos: ${usersStr}`
      );
    } catch (error) {
      console.error('Erro ao criar categoria/canais:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao criar a categoria e os canais.');
      } else {
        await interaction.reply('Ocorreu um erro ao criar a categoria e os canais.');
      }
    }
  }
});

client.login(process.env.TOKEN);

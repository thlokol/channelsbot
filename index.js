require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ----------------------------------------------------------------------------
  // COMANDO /create
  // ----------------------------------------------------------------------------
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
      cargos.forEach((role) => {
        permissionOverwrites.push({
          id: role.id,
          allow: [PermissionFlagsBits.ViewChannel],
        });
      });

      // Libera acesso para cada usuário selecionado
      usuarios.forEach((user) => {
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
        ? cargos.map((r) => r.name).join(', ')
        : 'Nenhum';
      const usersStr = usuarios.length
        ? usuarios.map((u) => u.tag).join(', ')
        : 'Nenhum';

      await interaction.editReply(
        `Categoria **${categoryName}** criada com ${channelNames.length} canal(is).\n` +
          `Cargo(s) permitidos: ${rolesStr}\n` +
          `Usuário(s) permitidos: ${usersStr}`
      );
    } catch (error) {
      console.error('Erro ao criar categoria/canais:', error);
      if (interaction.deferred) {
        await interaction.editReply(
          'Ocorreu um erro ao criar a categoria e os canais.'
        );
      } else {
        await interaction.reply(
          'Ocorreu um erro ao criar a categoria e os canais.'
        );
      }
    }
  }

  // ----------------------------------------------------------------------------
  // COMANDO /channelvisible
  // ----------------------------------------------------------------------------
  if (interaction.commandName === 'channelvisible') {
    try {
      await interaction.deferReply();

      // 1) Pega o nome do canal do comando
      const channelName = interaction.options.getString('channelname');

      // 2) Coleta até 5 cargos (cargo1..cargo5)
      const cargos = [];
      for (let i = 1; i <= 5; i++) {
        const role = interaction.options.getRole(`cargo${i}`);
        if (role) cargos.push(role);
      }

      // Se nenhum cargo foi fornecido, avisamos e encerramos
      if (!cargos.length) {
        await interaction.editReply('Nenhum cargo foi selecionado!');
        return;
      }

      // 3) Filtrar todos os canais com esse nome exato
      //    (Se quiser partial match, use .includes(channelName))
      const matchedChannels = interaction.guild.channels.cache.filter(
        (ch) => ch.name === channelName
      );

      if (!matchedChannels.size) {
        await interaction.editReply(
          `Não encontrei canais com o nome "${channelName}".`
        );
        return;
      }

      // 4) Para cada canal encontrado, dar ViewChannel aos cargos
      for (const [, channel] of matchedChannels) {
        // Se quiser garantir que seja texto, verifique type:
        // if (channel.type !== ChannelType.GuildText) continue;

        for (const r of cargos) {
          await channel.permissionOverwrites.edit(r.id, {
            ViewChannel: true,
          });
        }
      }

      // Monta uma string dos canais e cargos afetados
      const channelList = matchedChannels
        .map((ch) => `#${ch.name}`)
        .join(', ');
      const roleList = cargos.map((r) => r.name).join(', ');
      await interaction.editReply(
        `Concedi permissão de visualização para [${roleList}] nos canais: ${channelList}.`
      );
    } catch (error) {
      console.error('Erro no comando /channelvisible:', error);
      if (interaction.deferred) {
        await interaction.editReply('Ocorreu um erro ao conceder permissões.');
      } else {
        await interaction.reply('Ocorreu um erro ao conceder permissões.');
      }
    }
  }
});

client.login(process.env.TOKEN);


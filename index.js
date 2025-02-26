require('dotenv').config();
const { Client, GatewayIntentBits, ChannelType } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  // Garante que é um slash command
  if (!interaction.isChatInputCommand()) return;


  if (interaction.commandName === 'ping') {
    // Teste rápido de resposta
    return interaction.reply('Pong!');
  }

  // Verifica se é o comando /create
  if (interaction.commandName === 'create') {
    console.log('Comando /create recebido!');
    try {
      // 1) Envia um "acknowledge" ao Discord, dizendo que vamos responder depois
      await interaction.deferReply();

      // 2) Pega as opções do comando
      const categoryName = interaction.options.getString('categoria');
      const channelsString = interaction.options.getString('canais');
      // Transforma em array
      const channelNames = channelsString.split(' ');

      // 3) Cria a categoria
      const category = await interaction.guild.channels.create({
        name: categoryName,
        type: ChannelType.GuildCategory,
      });

      // 4) Cria cada canal de texto dentro da categoria
      for (const chName of channelNames) {
        await interaction.guild.channels.create({
          name: chName,
          type: ChannelType.GuildText,
          parent: category.id,
        });
      }

      // 5) Agora damos a resposta final (editando a mensagem “deferred”)
      await interaction.editReply(
        `Categoria **${categoryName}** criada, com ${channelNames.length} canal(is).`
      );

    } catch (error) {
      console.error('Erro ao criar canais/categoria:', error);

      // Se algo falhar depois de deferReply, use editReply para mandar msg de erro
      if (interaction.deferred) {
        await interaction.editReply(
          'Ocorreu um erro ao criar a categoria ou canais.'
        );
      } else {
        // fallback se por algum motivo não tivermos deferido
        await interaction.reply('Ocorreu um erro ao criar a categoria ou canais.');
      }
    }
  }
});

client.login(process.env.TOKEN);

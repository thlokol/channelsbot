require('dotenv').config();
const { REST, Routes, SlashCommandBuilder } = require('discord.js');

// Construímos o comando /create
const createCmd = new SlashCommandBuilder()
  .setName('create')
  .setDescription('Cria uma categoria e canais dentro dela.')
  .addStringOption(option =>
    option
      .setName('categoria')
      .setDescription('Nome da categoria a ser criada')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('canais')
      .setDescription('Nomes dos canais, separados por espaço')
      .setRequired(true)
  );

  const pingCmd = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Responde com Pong!');

// Então adicione no array de `commands`:
const commands = [createCmd, pingCmd];

// Inicializa o REST client
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registrando (ou atualizando) os comandos slash...');

    // Aqui, vamos registrar os comandos apenas em UMA guild (de teste).
    // Assim, as mudanças refletem instantaneamente, sem esperar aprovação global.
    console.log('CLIENT_ID:', process.env.CLIENT_ID);
    console.log('GUILD_ID:', process.env.GUILD_ID);
    console.log('TOKEN (parcial):', process.env.TOKEN?.substring(0, 6), '...');


    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      {
        body: commands.map(cmd => cmd.toJSON()),
      }
    );

    console.log('Comandos registrados com sucesso!');
  } catch (error) {
    console.error('Erro ao registrar comandos:', error);
  }
})();
